#!/usr/bin/env bash
# ÉPREUVE DU VERDICT DU LANCEUR, SANS AUCUN APPEL PAYANT (20 nov.).
#   bash scripts/local/tests-lanceur.sh
# Les deux essais sont remplacés par de faux essais qui sortent en 0 ou 1 et écrivent (ou non) leur
# rapport dans un dossier temporaire. On exige le verdict attendu pour chaque scénario.
set -u
cd "$(dirname "$0")/../.."
. scripts/local/_executer-essais.sh
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
echoue=0
rapport() { printf '{"commit":"0123456789abcdef0123456789abcdef01234567"}' > "$1"; }
scenario() {   # nom, code34, code37, attendu (0|1), [ecrit34=oui] [ecrit37=oui] [journal37=chemin]
  local nom=$1 c34=$2 c37=$3 attendu=$4 e34=${5:-oui} e37=${6:-oui}
  J34=$T/$nom-34.txt; RAP34=$T/$nom-34.json; J37=${7:-$T/$nom-37.txt}; RAP37=$T/$nom-37.json
  essai34() { [ "$e34" = oui ] && rapport "$RAP34"; echo "faux essai 34 → $c34"; return "$c34"; }
  essai37() { [ "$e37" = oui ] && rapport "$RAP37"; echo "faux essai 37 → $c37"; return "$c37"; }
  executer_essais > "$T/$nom.sortie" 2>&1; local obtenu=$?
  if [ "$obtenu" -eq "$attendu" ]; then echo "  ✓ $nom : $( [ "$attendu" -eq 0 ] && echo réussite || echo échec ), comme attendu"
  else echo "  ✗ $nom : verdict $obtenu, attendu $attendu"; sed 's/^/      /' "$T/$nom.sortie"; echoue=1; fi
}
scenario "premier-en-echec"   1 0 1
scenario "second-en-echec"    0 1 1
scenario "les-deux-reussis"   0 0 0
scenario "rapport-34-absent"  0 0 1 non oui
scenario "rapport-37-absent"  0 0 1 oui non
scenario "journal-non-ecrit"  0 0 1 oui oui "$T/inexistant/37.txt"
# Un rapport d'un passage ANTÉRIEUR ne compte pas : écrit, puis daté d'hier, puis non réécrit.
J34=$T/ancien-34.txt; RAP34=$T/ancien-34.json; J37=$T/ancien-37.txt; RAP37=$T/ancien-37.json
rapport "$RAP34"; touch -d '1 day ago' "$RAP34" 2>/dev/null || touch -t "$(date -v-1d +%Y%m%d%H%M 2>/dev/null)" "$RAP34"
essai34() { return 0; }; essai37() { rapport "$RAP37"; return 0; }
if executer_essais > "$T/ancien.sortie" 2>&1; then echo "  ✗ rapport-ancien : compté comme neuf"; echoue=1; else echo "  ✓ rapport-ancien : échec, comme attendu"; fi
echo
[ "$echoue" -eq 0 ] && echo "verdict du lanceur : conforme dans tous les scénarios." || echo "verdict du lanceur : NON conforme."
exit "$echoue"
