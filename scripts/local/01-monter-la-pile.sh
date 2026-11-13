#!/usr/bin/env bash
# MONTAGE ET CONTRÔLE DE LA PILE SUPABASE LOCALE.
#
# Rien n'est appliqué tant que les composants n'ont pas été prouvés locaux À L'EXÉCUTION —
# jamais d'après un fichier d'environnement. Le ciblage se vérifie sur le NOM D'HÔTE EXACT,
# le protocole et le port : chercher « localhost » dans une chaîne laisserait passer
# https://localhost.exemple.invalid.
#
#   bash scripts/local/01-monter-la-pile.sh
set -euo pipefail

echec() { printf '\n\033[31mARRÊT — %s\033[0m\n' "$*" >&2; exit 1; }
ok()    { printf '  \033[32m✓\033[0m %s\n' "$*"; }

# Analyse stricte : hôte exact, protocole, port attendu.
verifier_url() { # $1 = nom, $2 = url, $3 = port attendu
  python3 - "$1" "$2" "$3" <<'PY' || exit 1
import sys
from urllib.parse import urlparse
nom, url, port = sys.argv[1], sys.argv[2], sys.argv[3]
u = urlparse(url)
if u.scheme != 'http':
    sys.exit(f"{nom} : protocole « {u.scheme} » ; une pile locale sert en http.")
if u.hostname not in ('127.0.0.1', 'localhost', '::1'):
    sys.exit(f"{nom} : hôte « {u.hostname} » n'est pas la boucle locale.")
if str(u.port) != port:
    sys.exit(f"{nom} : port {u.port} au lieu de {port}.")
PY
}

echo "═══ 0. prérequis ═══"
command -v docker   >/dev/null || echec "Docker absent du PATH. Installe Docker Desktop et relance."
command -v supabase >/dev/null || echec "CLI Supabase absent du PATH. 'brew install supabase/tap/supabase'."
command -v psql     >/dev/null || echec "psql absent du PATH. 'brew install libpq' puis ajoute-le au PATH."
docker info >/dev/null 2>&1    || echec "Docker est installé mais ne tourne pas. Démarre Docker Desktop."
ok "docker · supabase $(supabase --version) · psql"

echo "═══ 1. démarrage ═══"
[ -f supabase/config.toml ] || { echo "  supabase/config.toml absent → supabase init"; supabase init; }
supabase start >/dev/null
ETAT=$(supabase status -o json)
API_URL=$(printf '%s' "$ETAT" | python3 -c 'import json,sys;print(json.load(sys.stdin)["API_URL"])')
DB_URL=$(printf '%s' "$ETAT" | python3 -c 'import json,sys;print(json.load(sys.stdin)["DB_URL"])')
SRV=$(printf '%s' "$ETAT" | python3 -c 'import json,sys;print(json.load(sys.stdin)["SERVICE_ROLE_KEY"])')

echo "═══ 2. ciblage local, hôte par hôte ═══"
verifier_url "API"  "$API_URL" 54321 || echec "$(verifier_url 'API' "$API_URL" 54321 2>&1)"
ok "API      $API_URL"
python3 - "$DB_URL" <<'PY' || echec "base non locale"
import sys
from urllib.parse import urlparse
u = urlparse(sys.argv[1])
assert u.hostname in ('127.0.0.1', 'localhost', '::1'), f"hôte base « {u.hostname} »"
assert u.port == 54322, f"port base {u.port} au lieu de 54322"
PY
ok "BASE     127.0.0.1:54322"
AUTH=$(curl -fsS "$API_URL/auth/v1/health") || echec "Auth local ne répond pas"
ok "AUTH     $AUTH"
curl -fsS -H "Authorization: Bearer $SRV" "$API_URL/storage/v1/bucket" >/dev/null \
  || echec "Storage local ne répond pas"
ok "STORAGE  joignable"

echo "═══ 3. ordre des migrations ═══"
# Déterministe et portable : `sort -V` n'existe pas sur le sort BSD du Mac, et `sort -t- -k3`
# prendrait « 2.sql » comme clé. Le script Python refuse tout fichier hors forme attendue,
# et exclut EXPLICITEMENT supabase-migration-101-ROLLBACK-grants.sql.
python3 scripts/local/ordre-migrations.py . > /tmp/ordre-migrations.tsv \
  || echec "ordre des migrations indéterminable (voir ci-dessus)"
awk '{print $1}' /tmp/ordre-migrations.tsv | sort | uniq -c
echo "  ↑ ENVELOPPE_PSQL : passé en psql -1 (atomique)."
echo "    TRANSACTION_PROPRE : le fichier porte son BEGIN;/COMMIT; — PAS de -1, sinon son"
echo "    COMMIT refermerait la transaction externe et l'atomicité annoncée serait fausse."
echo "    HORS_TRANSACTION : CONCURRENTLY/VACUUM — incompatible avec toute transaction."
echo
cut -f2 /tmp/ordre-migrations.tsv | tail -5
echo "  ↑ RELIS cet ordre. Un ordre faux affiché coûte moins qu'appliqué."
read -r -p "  Appliquer ? [o/N] " REP; [ "$REP" = "o" ] || echec "interrompu à ta demande"

echo "═══ 4. application ═══"
psql "$DB_URL" -1 -v ON_ERROR_STOP=1 -f supabase-schema.sql || echec "baseline en échec"
while IFS=$'\t' read -r MODE F; do
  printf '  %-18s %s\n' "$MODE" "$F"
  case "$MODE" in
    ENVELOPPE_PSQL)   psql "$DB_URL" -1 -v ON_ERROR_STOP=1 -f "$F" ;;
    *)                psql "$DB_URL"    -v ON_ERROR_STOP=1 -f "$F" ;;
  esac || echec "migration en échec : $F"
done < /tmp/ordre-migrations.tsv

echo "═══ 5. contrôles d'après application ═══"
psql "$DB_URL" -c "select filename from applied_migrations order by regexp_replace(filename,'\D','','g')::int;"
psql "$DB_URL" -c "select rolname, rolbypassrls, rolsuper from pg_roles where rolname in ('anon','authenticated','service_role','postgres') order by 1;"
echo
echo "  ⚠ ÉQUIVALENCE LOCAL ↔ PROD : relève le même catalogue sur la base vivante EN LECTURE"
echo "    SEULE et compare. Sans ça, aucune preuve obtenue ici ne transfère."
ok "pile locale prête"
