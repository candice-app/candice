#!/usr/bin/env bash
# LANCEUR UNIQUE — tu tapes une commande, la sortie est écrite dans le dépôt, et Claude la
# lit directement. Tu n'as plus rien à recopier.
#
#   bash scripts/local/00-lancer.sh journal     # l'aller-retour des 1 200 preuves
#   bash scripts/local/00-lancer.sh cron        # les quatre scénarios
#   bash scripts/local/00-lancer.sh cron2 <id>  # la reprise du scénario 4
#   bash scripts/local/00-lancer.sh sonde       # la sonde ev_interest_shape (§27.6)
#   bash scripts/local/00-lancer.sh releve      # le relevé de schéma, lecture seule
#   bash scripts/local/00-lancer.sh etat        # juste l'état de la pile
#   bash scripts/local/00-lancer.sh verif       # typechecks (les DEUX) + suite de tests
#   bash scripts/local/00-lancer.sh tout        # tout ce qui précède, d'un seul coup
set -uo pipefail
cd "$(dirname "$0")/../.."
mkdir -p scripts/local/.resultats
QUOI="${1:-etat}"
SORTIE="scripts/local/.resultats/$QUOI.txt"

# Variables tirées de la pile locale À L'EXÉCUTION — rien n'est lu dans un fichier
# d'environnement, rien n'est écrit en clair ailleurs que dans la mémoire du processus.
ETAT=$(supabase status -o json 2>/dev/null) || { echo "pile locale éteinte : lance 'supabase start'" | tee "$SORTIE"; exit 1; }
lire() { printf '%s' "$ETAT" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
export SUPABASE_URL="$(lire API_URL)"
export SUPABASE_SERVICE_ROLE_KEY="$(lire SERVICE_ROLE_KEY)"
export SUPABASE_ANON_KEY="$(lire ANON_KEY)"
export SUPABASE_DB_URL="$(lire DB_URL)"

{
  echo "=== $QUOI · $(date '+%Y-%m-%d %H:%M:%S') ==="
  case "$QUOI" in
    journal) npx tsx scripts/local/02-journal-aller-retour.mts ;;
    sonde)   npx tsx scripts/local/04-sonde-interest-relationship.mts ;;
    verif)
      # Les deux typechecks : tsconfig.json EXCLUT "scripts", donc le premier ne voit
      # jamais scripts/local. Le second est là pour ça — ne jamais lancer que le premier.
      echo "— typecheck application —"; npx tsc --noEmit --incremental false; echo "(app : $?)"
      echo "— typecheck scripts/local —"; npx tsc -p tsconfig.scripts.json;    echo "(scripts : $?)"
      echo "— suite de tests —";         npm test --silent;                    echo "(tests : $?)"
      ;;
    releve)  bash scripts/local/05-releve-schema.sh ;;
    tout)
      echo "########## JOURNAL ##########"; npx tsx scripts/local/02-journal-aller-retour.mts; echo "(journal : $?)"
      echo; echo "########## SONDE ##########";  npx tsx scripts/local/04-sonde-interest-relationship.mts; echo "(sonde : $?)"
      echo; bash scripts/local/05-releve-schema.sh
      echo; echo "########## VÉRIFICATIONS ##########"
      echo "— typecheck application —"; npx tsc --noEmit --incremental false; echo "(app : $?)"
      echo "— typecheck scripts/local —"; npx tsc -p tsconfig.scripts.json;    echo "(scripts : $?)"
      echo "— suite de tests —";         npm test --silent;                    echo "(tests : $?)"
      ;;
    cron)    npx tsx scripts/local/03-cron-quatre-scenarios.mts ;;
    cron2)   npx tsx scripts/local/03-cron-quatre-scenarios.mts --phase2 "${2:?identifiant du compte requis}" ;;
    etat)
      psql "$SUPABASE_DB_URL" -c "select filename from applied_migrations order by regexp_replace(filename,'\D','','g')::int;"
      psql "$SUPABASE_DB_URL" -c "select rolname, rolbypassrls from pg_roles where rolname in ('anon','authenticated','service_role') order by 1;"
      psql "$SUPABASE_DB_URL" -c "select count(*) as tables_journal from information_schema.tables where table_schema='public' and table_name like 'knowledge_%';"
      psql "$SUPABASE_DB_URL" -c "select to_regclass('public.erasure_manifests') as table_de_trace;"
      ;;
    *) echo "usage : tout | journal | sonde | releve | verif | cron | cron2 <id> | etat" ;;
  esac
  echo "=== code de sortie : $? ==="
} > "$SORTIE" 2>&1

echo "Terminé. Résultat écrit dans $SORTIE — Claude peut le lire."
tail -5 "$SORTIE"
