# EXÉCUTER LES DEUX ESSAIS ET EN TIRER UN SEUL VERDICT — sourcé par 40-parcours-vrai-modele.sh (20 nov.).
#
# Le lanceur définit deux fonctions, `essai34` et `essai37`, et les quatre chemins :
#   J34, RAP34 (journal et rapport du script 34), J37, RAP37 (du script 37).
# `executer_essais` lance les deux, puis exige, pour CHAQUE essai :
#   · un code de sortie 0 ;
#   · un journal réellement écrit (tee sans erreur) ;
#   · un rapport écrit PENDANT ce passage (pas un rapport d'un passage antérieur), lisible en JSON,
#     qui nomme le commit testé.
# Le moindre manquement rend 1 ; tout conforme rend 0. Le lanceur sort avec ce code : un essai en
# échec ne peut plus être annoncé comme une réussite au programme qui l'a lancé.
# Éprouvé sans appel payant par scripts/local/tests-lanceur.sh.

verifier_rapport() {   # chemin, instant de départ (secondes) → 0 si le rapport est neuf, lisible et identifié
  python3 - "$1" "$2" <<'PY'
import json, os, sys
chemin, debut = sys.argv[1], float(sys.argv[2])
try:
    if os.path.getmtime(chemin) < debut:
        print(f"  ✗ {chemin} : rapport d'un passage ANTÉRIEUR (non réécrit)"); sys.exit(1)
    with open(chemin, encoding='utf-8') as f: d = json.load(f)
except FileNotFoundError:
    print(f"  ✗ {chemin} : rapport absent"); sys.exit(1)
except (OSError, ValueError) as e:
    print(f"  ✗ {chemin} : rapport illisible ({type(e).__name__})"); sys.exit(1)
if not isinstance(d, dict) or not d.get('commit'):
    print(f"  ✗ {chemin} : rapport sans commit testé"); sys.exit(1)
print(f"  ✓ {chemin} : écrit pendant ce passage, commit {d['commit'][:12]}")
PY
}

executer_essais() {
  local debut R34 T34 R37 T37 V34 V37 errexit=0
  case $- in *e*) errexit=1 ;; esac     # rendu tel quel à la fin : ce module ne change pas le mode de l'appelant
  debut=$(python3 -c 'import time; print(time.time() - 1)')
  set +e
  local S
  essai34 2>&1 | tee "$J34"; S=("${PIPESTATUS[@]}"); R34=${S[0]}; T34=${S[1]}   # une seule lecture de PIPESTATUS :
  essai37 2>&1 | tee "$J37"; S=("${PIPESTATUS[@]}"); R37=${S[0]}; T37=${S[1]}   # toute affectation le réinitialise
  echo
  echo "═══ verdict des essais ═══"
  verifier_rapport "$RAP34" "$debut"; V34=$?
  verifier_rapport "$RAP37" "$debut"; V37=$?
  [ "$errexit" -eq 1 ] && set -e
  [ "$T34" -eq 0 ] || echo "  ✗ journal du 34 non écrit ($J34)"
  [ "$T37" -eq 0 ] || echo "  ✗ journal du 37 non écrit ($J37)"
  echo "  script 34 : sortie $R34 · script 37 : sortie $R37"
  if [ "$R34" -eq 0 ] && [ "$R37" -eq 0 ] && [ "$T34" -eq 0 ] && [ "$T37" -eq 0 ] && [ "$V34" -eq 0 ] && [ "$V37" -eq 0 ]; then
    echo "RÉUSSITE — les deux essais sont conformes et leurs rapports écrits."
    return 0
  fi
  echo "ÉCHEC — au moins un essai, un journal ou un rapport n'est pas conforme (détail ci-dessus)."
  return 1
}
