#!/usr/bin/env bash
# RELEVÉ DE SCHÉMA — lecture seule, une seule exécution, toutes les questions ouvertes.
#
# Pourquoi un seul script : la VM Linux qui me sert de terminal ne voit pas la pile locale
# (127.0.0.1:54322 chez toi n'est pas 127.0.0.1 chez elle). Toute mesure SQL doit donc
# partir de ton Mac. Plutôt que de te faire relayer une question à la fois, tout est ici :
# tu lances une fois, j'en lis la sortie.
#
# AUCUNE ÉCRITURE. Rien que des SELECT sur les catalogues. Ne touche pas aux données.
set -uo pipefail
DB="${SUPABASE_DB_URL:?SUPABASE_DB_URL requis (posé par 00-lancer.sh)}"
q() { echo; echo "── $1"; shift; psql "$DB" -X -At -F ' | ' -c "$*" 2>&1; }

echo "########## 1 · LES CONTRAINTES DE FORME DU JOURNAL ##########"
q "contraintes CHECK de knowledge_evidences (texte réel en base, pas celui des migrations)" "
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE conrelid='knowledge_evidences'::regclass AND contype='c' ORDER BY conname;"

q "y a-t-il un vocabulaire contraint sur relationship ou relation ? (attendu : AUCUN)" "
SELECT coalesce(string_agg(conname,', '),'AUCUNE CONTRAINTE')
FROM pg_constraint WHERE conrelid='knowledge_evidences'::regclass AND contype='c'
  AND (pg_get_constraintdef(oid) LIKE '%relationship IN%' OR pg_get_constraintdef(oid) LIKE '%relation IN%');"

echo
echo "########## 2 · CE QUI NE SURVIT PAS À UNE RELECTURE ##########"
q "colonnes de knowledge_evidences (source_type et ts doivent être ABSENTS)" "
SELECT column_name, data_type, is_nullable FROM information_schema.columns
WHERE table_schema='public' AND table_name='knowledge_evidences' ORDER BY ordinal_position;"

q "quelles tables du journal portent une colonne d'instant propre (ts) ?" "
SELECT table_name, string_agg(column_name,', ') FROM information_schema.columns
WHERE table_schema='public' AND table_name LIKE 'knowledge_%' AND column_name IN ('ts','timestamp','created_at')
GROUP BY table_name ORDER BY table_name;"

echo
echo "########## 3 · L'APPEND-ONLY EST-IL TENU PAR AUTRE CHOSE QUE L'INTENTION ? ##########"
q "politiques RLS du journal (une seule PERMISSIVE cmd=ALL par table = tout est permis)" "
SELECT tablename, policyname, permissive, cmd, roles::text
FROM pg_policies WHERE schemaname='public' AND tablename LIKE 'knowledge_%' ORDER BY tablename, policyname;"

q "privilèges réellement détenus APRÈS la migration 104 (has_table_privilege résout PUBLIC)" "
SELECT t.table_name, r.rolname,
       string_agg(p.priv,',' ORDER BY p.priv) FILTER (WHERE has_table_privilege(r.rolname, 'public.'||t.table_name, p.priv))
FROM (SELECT unnest(ARRAY['knowledge_evidences','knowledge_sources','knowledge_facts',
                          'knowledge_signals','knowledge_open_knowledge','knowledge_extraction_records']) AS table_name) t
CROSS JOIN (SELECT unnest(ARRAY['anon','authenticated','service_role']) AS rolname) r
CROSS JOIN (SELECT unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE']) AS priv) p
GROUP BY 1,2 ORDER BY 1,2;"

q "rôles qui contournent la RLS" "
SELECT rolname, rolbypassrls, rolsuper FROM pg_roles
WHERE rolname IN ('anon','authenticated','service_role','postgres') ORDER BY 1;"

echo
echo "########## 4 · LA CASCADE QUI EFFACE LE JOURNAL ##########"
q "clés étrangères du journal et leur comportement à la suppression (c = CASCADE)" "
SELECT c.conrelid::regclass::text, a.attname, c.confrelid::regclass::text, c.confdeltype
FROM pg_constraint c JOIN unnest(c.conkey) k(att) ON true
JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.att
WHERE c.contype='f' AND c.conrelid::regclass::text LIKE 'knowledge_%' ORDER BY 1,2;"

echo
echo "########## 5 · LA FONCTION D'ÉCRITURE ##########"
q "persist_journal : invoker ou definer, et qui peut l'exécuter" "
SELECT p.proname, p.prosecdef AS security_definer, pg_get_function_identity_arguments(p.oid),
       coalesce(array_to_string(p.proacl,' '),'(défaut : PUBLIC)')
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('persist_journal','exec_sql_readonly','erasure_inventory','anonymize_erasure_manifests')
ORDER BY 1;"

echo
echo "########## 6 · CE QUI EST RÉELLEMENT ÉCRIT (local = vide, c'est la prod qui compte) ##########"
q "vocabulaire effectivement présent dans relationship / relation" "
SELECT 'relationship' AS colonne, coalesce(relationship,'(NULL)') AS valeur, count(*)
FROM knowledge_evidences WHERE target_family='INTEREST' GROUP BY 2
UNION ALL
SELECT 'relation', coalesce(relation,'(NULL)'), count(*)
FROM knowledge_evidences WHERE target_family='ENTITY' GROUP BY 2
ORDER BY 1,3 DESC;"

q "état des migrations appliquées" "
SELECT count(*)||' migrations · dernière : '||max(filename) FROM applied_migrations;"

echo
echo "########## FIN DU RELEVÉ ##########"
