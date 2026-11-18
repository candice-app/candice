#!/usr/bin/env bash
# PREUVE — la migration 115 SEULE, sur le schéma de production (baseline + migrations jusqu'à la 112).
#
# La base `prod112` est reconstruite à part : ni 113, ni 114, ni 116. On y vérifie d'abord que
# l'empreinte de la garde est celle attendue en production, puis :
#   AVANT  : effacer un compte lecteur ou proche d'un consentement échoue ;
#   115    : appliquée seule, depuis son fichier exact ;
#   APRÈS  : l'effacement réussit, n'emporte que les consentements du compte effacé, laisse
#            intacts ceux de comptes sans rapport, et la garde de la 112 tient toujours.
# L'effacement est joué sous le rôle `supabase_auth_admin` — celui du service d'authentification.
set -uo pipefail
BASE="${BASE_PROD112:-postgresql://postgres:postgres@127.0.0.1:54322/prod112}"
case "$BASE" in *@127.0.0.1:54322/prod112) ;; *) echo "ARRÊT — base locale prod112 uniquement."; exit 2;; esac
FICHIER="supabase-migration-115-effacement-emporte-les-consentements.sql"
OK=0; KO=0
verifier() { if [ "$1" = "$2" ]; then OK=$((OK+1)); echo "  ✓ $3"; else KO=$((KO+1)); echo "  ✗ $3 — attendu « $2 », obtenu « $1 »"; fi; }
q() { psql "$BASE" -At -v ON_ERROR_STOP=1 -c "$1" 2>&1; }
etat() { q "select string_agg(right(conname, length(conname) - 17) || '=' || confdeltype::text, ' ' order by conname) from pg_constraint where conrelid='public.contact_consents'::regclass and contype='f'"; }
# Efface un compte comme le fait le service d'authentification ; rend « ok » ou le message d'erreur.
jouer() { psql "$BASE" -At -c "BEGIN; SET SESSION AUTHORIZATION supabase_auth_admin; DELETE FROM auth.users WHERE id = '$1'; $2;" 2>&1; }
effacer() { local r; r=$(jouer "$1" COMMIT); case "$r" in *ERROR*) echo "$r" | grep ERROR | head -1 | cut -c1-110;; *) echo ok;; esac; }
essai_efface() { local r; r=$(jouer "$1" ROLLBACK); case "$r" in *ERROR*) echo refuse;; *) echo passerait;; esac; }

P=aaaaaaaa-0000-4000-8000-000000000001; B=aaaaaaaa-0000-4000-8000-000000000002; X=aaaaaaaa-0000-4000-8000-000000000003
U1=bbbbbbbb-0000-4000-8000-000000000001; U2=bbbbbbbb-0000-4000-8000-000000000002

echo "══ Reconstruction de prod112 : baseline + migrations jusqu'à la 112, rien au-delà"
ADM="${BASE%/prod112}"
psql "$ADM/postgres" -q -c "drop database if exists prod112" -c "create database prod112" 2>/dev/null
psql "$BASE" -q -c "CREATE SCHEMA IF NOT EXISTS extensions; CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\" WITH SCHEMA extensions; ALTER DATABASE prod112 SET search_path TO public, extensions; GRANT USAGE ON SCHEMA public, extensions TO anon, authenticated, service_role; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;" >/dev/null 2>&1
# Les tables du service d'authentification ne viennent pas des migrations applicatives : on les
# reprend (structure seule) de la pile locale.
pg_dump "$ADM/postgres" -s -n auth -n storage 2>/dev/null | psql "$BASE" -q >/dev/null 2>&1
psql "$BASE" -1 -q -v ON_ERROR_STOP=1 -f supabase-schema.sql >/dev/null 2>&1 || { echo "ARRÊT — baseline en échec"; exit 2; }
NB=0
while IFS=$'\t' read -r mode f _; do
  case "$mode" in EXCLUE) continue;; esac
  num=$(echo "$f" | sed -E 's/supabase-migration-([0-9]+).*/\1/'); [ "$num" -gt 112 ] && continue
  if [ "$mode" = ENVELOPPE_PSQL ]; then psql "$BASE" -1 -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null 2>&1; else psql "$BASE" -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null 2>&1; fi || { echo "ARRÊT — $f en échec"; exit 2; }
  NB=$((NB+1))
done < <(python3 scripts/local/ordre-migrations.py .)
echo "  $NB migrations appliquées dans l'ordre"

echo "══ 0. Le schéma rejoué est-il celui de la production ?"
verifier "$(q "select md5(prosrc) from pg_proc where proname='garde_contact_consents'")" "5a0703b02faf45f9dec4fed8feebf3d8" "la garde est celle de la 112 (empreinte attendue en production)"
verifier "$(etat)" "contact_id_fkey=c granted_by_fkey=n pilote_id_fkey=c proche_user_id_fkey=n requested_by_fkey=n" "clés étrangères : trois en « mise à vide », deux en cascade"
# Relevé de production du 18 nov. 15 h 26 (requête en lecture seule lancée par Estelle) :
#   fonction 5a0703b0… · déclencheur trg_garde_contact_consents actif · 0 consentement
#   contact_id c · granted_by n · pilote_id c · proche_user_id n · requested_by n — mêmes noms.
verifier "$(q "select string_agg(conname, ',' order by conname) from pg_constraint where conrelid='public.contact_consents'::regclass and contype='f'")" "contact_consents_contact_id_fkey,contact_consents_granted_by_fkey,contact_consents_pilote_id_fkey,contact_consents_proche_user_id_fkey,contact_consents_requested_by_fkey" "mêmes cinq clés étrangères, mêmes noms, que le relevé de production"
verifier "$(q "select string_agg(polname, ',' order by polname) from pg_policy where polrelid='public.contact_consents'::regclass")" "pilote_manage_consents,proche_read_own_consents,proche_respond_consents,viewer_cancel_own_pending_request,viewer_create_profile_view_request" "mêmes cinq politiques que le relevé de production"
verifier "$(q "select count(*) from information_schema.columns where table_name='contacts' and column_name='proche_lien_confirme_par'")" "0" "la 113 n'est pas appliquée"
verifier "$(q "select count(*) from pg_constraint where conname='contact_consents_kind_check' and pg_get_constraintdef(oid) like '%profile_usage%'")" "0" "la 116 n'est pas appliquée"

echo "══ 1. Jeu d'essai : un pilote P, son proche B, un lecteur X ; et deux comptes sans rapport, U1 et U2"
q "delete from auth.users where id in ('$P','$B','$X','$U1','$U2')" >/dev/null
q "insert into auth.users (id, email) values ('$P','p@test.candice.invalid'),('$B','b@test.candice.invalid'),('$X','x@test.candice.invalid'),('$U1','u1@test.candice.invalid'),('$U2','u2@test.candice.invalid')" >/dev/null
KP=$(q "insert into contacts (user_id, name, relationship, proche_user_id) values ('$P','Proche de P','friend','$B') returning id" | head -1)
KU=$(q "insert into contacts (user_id, name, relationship, proche_user_id) values ('$U1','Proche de U1','friend','$U2') returning id" | head -1)
q "insert into contact_consents (pilote_id, contact_id, proche_user_id, kind, status, scope, granted_by, requested_by) values
   ('$P','$KP','$B','contact_analysis','active','{analysis}','$B','$P'),
   ('$U1','$KU','$U2','contact_analysis','active','{analysis}','$U2','$U1')" >/dev/null
q "insert into contact_consents (pilote_id, proche_user_id, kind, status, scope, granted_by, requested_by) values
   ('$P','$X','profile_view','active','{socle}','$P','$X'),
   ('$X','$B','profile_view','pending','{socle}',null,'$B'),
   ('$U2','$U1','profile_view','active','{socle}','$U2','$U1')" >/dev/null
empreinte_sans_rapport() { q "select md5(string_agg(c::text, '|' order by id)) from contact_consents c where pilote_id in ('$U1','$U2')"; }
SR0=$(empreinte_sans_rapport)
verifier "$(q "select count(*) from contact_consents")" "5" "cinq consentements posés (3 autour de P/B/X, 2 entre U1 et U2)"

echo "══ 2. AVANT la 115 — effacement joué puis annulé"
verifier "$(essai_efface $B)" "refuse" "effacer B (proche chez P, lecteur chez X) ÉCHOUE"
echo "      message : $(jouer $B ROLLBACK | grep ERROR | head -1 | cut -c1-120)"
verifier "$(essai_efface $X)" "refuse" "effacer X (lecteur de la fiche de P) ÉCHOUE"
verifier "$(essai_efface $U2)" "refuse" "effacer U2 ÉCHOUE aussi"
verifier "$(q "select count(*) from contact_consents")" "5" "rien n'a été modifié par ces essais"

echo "══ 3. Application de la 115 SEULE — fichier exact"
sha256sum "$FICHIER" | cut -c1-64
AVANT_FN=$(q "select md5(prosrc) from pg_proc where proname='garde_contact_consents'"); AVANT_N=$(q "select count(*) from contact_consents"); AVANT_L=$(q "select md5(string_agg(c::text, '|' order by id)) from contact_consents c")
psql "$BASE" -v ON_ERROR_STOP=1 -q -f "$FICHIER" 2>&1 | sed 's/^psql:[^ ]* //' | sed 's/^/      /'
verifier "$?" "0" "la migration s'applique sans erreur"
verifier "$(etat)" "contact_id_fkey=c granted_by_fkey=c pilote_id_fkey=c proche_user_id_fkey=c requested_by_fkey=c" "les cinq clés étrangères sont en cascade"
verifier "$(q "select md5(prosrc) from pg_proc where proname='garde_contact_consents'")" "$AVANT_FN" "la garde n'a pas été touchée"
verifier "$(q "select md5(string_agg(c::text, '|' order by id)) from contact_consents c")" "$AVANT_L" "aucune ligne n'a été modifiée (contenu identique, $AVANT_N lignes)"
psql "$BASE" -v ON_ERROR_STOP=1 -q -f "$FICHIER" >/dev/null 2>&1
verifier "$? $(etat | grep -o '=n' | wc -l | tr -d ' ')" "0 0" "rejouable : une seconde application ne change rien et n'échoue pas"

echo "══ 4. APRÈS la 115"
verifier "$(effacer $B)" "ok" "effacer B RÉUSSIT"
verifier "$(q "select count(*) from contact_consents where '$B' in (pilote_id, proche_user_id, granted_by, requested_by)")" "0" "plus aucun consentement ne mentionne B"
verifier "$(q "select count(*) from contact_consents where pilote_id='$P' and proche_user_id='$X' and status='active'")" "1" "le partage de P à X, sans rapport avec B, est intact"
verifier "$(empreinte_sans_rapport)" "$SR0" "les consentements de U1 et U2 sont intacts, à l'octet près"
verifier "$(q "select coalesce(proche_user_id::text,'vide') from contacts where id='$KP'")" "vide" "la fiche de P n'est plus rattachée à un compte (elle existe toujours)"
verifier "$(effacer $X)" "ok" "effacer X RÉUSSIT"
verifier "$(q "select count(*) from contact_consents where pilote_id='$P'")" "0" "le partage de P à X est parti avec X"
verifier "$(empreinte_sans_rapport)" "$SR0" "U1 et U2 toujours intacts"
verifier "$(q "select count(*) from auth.users where id in ('$P','$U1','$U2')")" "3" "aucun autre compte n'a été emporté"

echo "══ 5. La garde de la 112 tient toujours"
SESSION="SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims', json_build_object('sub','$U1','role','authenticated')::text, true);"
R=$(psql "$BASE" -At -c "BEGIN; $SESSION UPDATE contact_consents SET proche_user_id = '$U1' WHERE pilote_id = '$U1' AND contact_id = '$KU'; ROLLBACK;" 2>&1 | grep -c "ne se modifient pas")
verifier "$R" "1" "le pilote ne peut toujours pas changer la partie d'un consentement"
KU2=$(q "insert into contacts (user_id, name, relationship, proche_user_id) values ('$U1','Autre','friend','$P') returning id" | head -1)
R=$(psql "$BASE" -At -c "BEGIN; $SESSION INSERT INTO contact_consents (pilote_id, contact_id, proche_user_id, kind, status) VALUES ('$U1','$KU2','$P','contact_analysis','active'); ROLLBACK;" 2>&1 | grep -c "seule la personne concernée")
verifier "$R" "1" "ni s'accorder lui-même un consentement actif"
verifier "$(effacer $U2)" "ok" "et U2, partie de deux consentements, s'efface désormais"
verifier "$(q "select count(*) from contact_consents")" "0" "ses deux consentements sont partis avec lui"

echo; echo "$OK vérifications passées, $KO en échec."; [ "$KO" -eq 0 ]
