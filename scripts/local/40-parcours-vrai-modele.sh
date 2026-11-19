#!/usr/bin/env bash
# LE VRAI MODÈLE, SUR LA PILE LOCALE — scripts 34 et 37 (19 nov., 19h56).
#
#   bash scripts/local/40-parcours-vrai-modele.sh
#
# Ce que fait ce lanceur, dans l'ordre, et rien d'autre :
#   1. vérifie la pile Supabase LOCALE (hôte, protocole et port exacts) ;
#   2. te DEMANDE la clé (saisie masquée) : elle vit seulement dans ce processus et ses enfants —
#      ni dans ton terminal, ni dans l'historique, ni dans un fichier, jamais affichée ;
#   3. donne une valeur à CHAQUE variable que l'application lit (liste recalculée dans le code) :
#      ainsi rien ne vient de `.env.local` — que ce lanceur ne lit pas, et que Next ne peut alors
#      plus appliquer, puisqu'une variable déjà définie n'est jamais remplacée ;
#   4. lance le relais observateur (127.0.0.1:8789 → api.anthropic.com) puis l'application locale
#      (127.0.0.1:3100), qui parle au modèle À TRAVERS le relais ;
#   5. lance le script 34 (lecture par le vrai modèle, base en mémoire) puis le script 37 (parcours
#      complet par les routes, sur la base locale), puis arrête le relais et l'application.
# Sorties : scripts/local/.resultats/34-reel.txt, 37-reel.txt (ignorés par git), rapports
# docs/discovery/essai-extracteur-reel.json et docs/discovery/parcours-complet-reel.json.
# Rien en production : base locale, comptes de test, données fictives.
set -euo pipefail
cd "$(dirname "$0")/../.."
echec() { printf '\n\033[31mARRÊT — %s\033[0m\n' "$*" >&2; exit 1; }
ok()    { printf '  \033[32m✓\033[0m %s\n' "$*"; }
mkdir -p scripts/local/.resultats

echo "═══ 0. dépendances du dépôt ═══"
[ -x node_modules/.bin/next ] || echec "node_modules/.bin/next absent : dépendances non installées (procédure, étape 2)."
if [ -x node_modules/.bin/tsx ]; then TSX=node_modules/.bin/tsx; elif command -v tsx >/dev/null; then TSX=$(command -v tsx)
else echec "tsx absent (procédure, étape 2 : « npm install --no-save tsx@4 »)."; fi
ok "next et tsx présents (rien n'est téléchargé par ce lanceur)"

echo "═══ 1. pile locale ═══"
command -v supabase >/dev/null || echec "CLI Supabase absent : la pile locale n'est pas installée (voir docs/discovery/procedure-vrai-modele.md)."
command -v lsof >/dev/null     || echec "lsof absent : impossible de prouver que l'application ne parle qu'à la boucle locale."
ETAT=$(supabase status -o json 2>/dev/null) || echec "pile locale éteinte : 'bash scripts/local/01-monter-la-pile.sh' d'abord."
lire() { printf '%s' "$ETAT" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
API_URL=$(lire API_URL)
[ "$API_URL" = "http://127.0.0.1:54321" ] || echec "l'API Supabase n'est pas exactement http://127.0.0.1:54321."
# Clés de la pile LOCALE (clés de démonstration propres à ta machine) : exportées, jamais affichées.
export NEXT_PUBLIC_SUPABASE_URL="$API_URL" SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$(lire ANON_KEY)" SUPABASE_ANON_KEY="$(lire ANON_KEY)"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$(lire SERVICE_ROLE_KEY)"
ok "Supabase local $API_URL"
for p in 3100 8789; do lsof -nP -iTCP:$p -sTCP:LISTEN -t >/dev/null 2>&1 && echec "le port $p est déjà pris : arrête ce qui l'occupe."; done

echo "═══ 2. la clé ═══"
printf '  Colle la clé Anthropic puis Entrée (rien ne s’affiche) : '
IFS= read -rs CLE; echo
[ -n "$CLE" ] || echec "aucune clé saisie."
export ANTHROPIC_API_KEY="$CLE"; unset CLE
unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN
ok "clé présente dans ce processus seulement (jamais affichée)"

echo "═══ 3. chaque variable lue par l'application reçoit une valeur ═══"
export ANTHROPIC_BASE_URL_APP="http://127.0.0.1:8789"
export APP_URL="http://127.0.0.1:3100" APP_LOCALE="http://127.0.0.1:3100"
export DISCOVERY_LOT_SECRET="$(openssl rand -hex 32)" CRON_SECRET="$(openssl rand -hex 24)" BETA_PASSWORD="$(openssl rand -hex 16)"
export RESEND_API_KEY="re_factice" RESEND_FROM="" RESEND_FROM_EMAIL="" MAIL_TRANSPORT="local" MAIL_LOCAL_FILE="$PWD/scripts/local/.resultats/courriels.jsonl"
export ESSAI_PILE_LOCALE="" ESSAI_STORAGE_FORME="" ESSAI_COUPER_STORAGE_APRES=""
VAPID=$(node -e "process.stdout.write(JSON.stringify(require('web-push').generateVAPIDKeys()))") || echec "web-push introuvable : dépendances non installées."
export VAPID_PUBLIC_KEY="$(printf '%s' "$VAPID" | python3 -c 'import json,sys;print(json.load(sys.stdin)["publicKey"])')"
export VAPID_PRIVATE_KEY="$(printf '%s' "$VAPID" | python3 -c 'import json,sys;print(json.load(sys.stdin)["privateKey"])')"
export NEXT_PUBLIC_VAPID_PUBLIC_KEY="$VAPID_PUBLIC_KEY"; unset VAPID
MANQUE=""
for v in $(grep -rhoE 'process\.env\.[A-Z_][A-Z0-9_]*' src next.config.* | sed 's/process\.env\.//' | sort -u); do
  case "$v" in NODE_ENV|ANTHROPIC_BASE_URL) continue ;; esac
  eval "[ -n \"\${$v+x}\" ]" || MANQUE="$MANQUE $v"
done
[ -z "$MANQUE" ] || echec "variables lues par l'application sans valeur ici :$MANQUE — elles viendraient de .env.local."
ok "toutes les variables lues par l'application ont une valeur locale"

echo "═══ 4. relais observateur puis application ═══"
RELAIS_AMONT=https://api.anthropic.com node scripts/local/relais-observateur.mjs > scripts/local/.resultats/relais.log 2>&1 &
PID_RELAIS=$!
ANTHROPIC_BASE_URL="$ANTHROPIC_BASE_URL_APP" node_modules/.bin/next dev -p 3100 -H 127.0.0.1 > scripts/local/.resultats/application.log 2>&1 &
PID_APP=$!
arreter() { kill "$PID_APP" "$PID_RELAIS" 2>/dev/null || true; pkill -P "$PID_APP" 2>/dev/null || true; }
trap arreter EXIT
for i in $(seq 1 90); do curl -s -o /dev/null http://127.0.0.1:3100/ && break; sleep 2; done
curl -s -o /dev/null http://127.0.0.1:3100/ || echec "l'application ne répond pas (scripts/local/.resultats/application.log)."
curl -s http://127.0.0.1:8789/__etat | grep -q '"amont":"https://api.anthropic.com"' || echec "le relais ne transmet pas au vrai modèle."
ok "application locale :3100 → relais :8789 → api.anthropic.com"

echo "═══ 5a. script 34 — lecture par le vrai modèle (base en mémoire) ═══"
set +e
"$TSX" scripts/local/34-essai-extracteur-reel.mts 2>&1 | tee scripts/local/.resultats/34-reel.txt
R34=${PIPESTATUS[0]}
echo "═══ 5b. script 37 — parcours complet par les routes ═══"
env -u ANTHROPIC_API_KEY PARCOURS_MODELE=reel "$TSX" scripts/local/37-parcours-complet-lecture-reelle.mts 2>&1 | tee scripts/local/.resultats/37-reel.txt
R37=${PIPESTATUS[0]}
set -e
echo
echo "34 : sortie $R34 · 37 : sortie $R37 (0 = tout conforme). Les rapports sont dans docs/discovery/."
