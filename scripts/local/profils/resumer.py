#!/usr/bin/env python3
"""Écrit docs/discovery/etat-19nov/preuve-dix-profils.md depuis les relevés du script 28."""
import json, os
P = os.path.dirname(os.path.abspath(__file__)) + '/'
t = [json.load(open(P + f'tour-{i}.json')) for i in (1, 2, 3)]
h = json.load(open(P + 'hsg.json'))
# Relevé du 18 nov. 22h20 sur 4f357af : questions présentées au premier lot (plafond de deux par branche).
avant = {'Sophie': 6, 'Camille': 4, 'Inès': 6, 'Léa': 2, 'Manon': 0, 'Clara': 4, 'Nour': 2, 'Alice': 0, 'Jeanne': 4, 'Yasmina': 2}
L = ["# Dix profils en personnage — relevé reproductible (19 novembre)", "",
 "Pile locale, comptes de test séparés, vraies routes HTTP de l'application. Rien en production.", "",
 "Rejouer : `scripts/local/28-profils-lus-par-claude.mts` (`--etape creer`, `questions`, `repondre`, `hsg`), puis `scripts/local/profils/resumer.py`.",
 "Entrées exactes : `scripts/local/profils/personnages.json` (inscription), `lectures-claude.json` (réponses libres et leur lecture), `reponses-1.json`, `reponses-2.json` (Discovery).",
 "Sorties : `tour-1.json`, `tour-2.json`, `tour-3.json` (questions admissibles, présentées, refusées et motif), `hsg.json` (journal de chacun, sans identifiant de compte).", "",
 "**Limite.** Les réponses libres sont lues par Claude dans une session Claude Code, sous la consigne et le schéma d'outil réels. Ce n'est pas la sortie de l'API de production : la qualité de lecture du modèle servi reste à mesurer avec la vraie clé.", "",
 "## Avant / après", "",
 "« Avant » : relevé du 18 nov. 22h20 sur le commit `4f357af`, même inscription, mêmes réponses libres. Seul le lot présenté avait été relevé ; le nombre de questions admissibles n'était pas mesuré.", "",
 "| Profil | Avant : présentées au 1er lot | Après : admissibles | Après : présentées au 1er lot | Admissibles après le 1er lot de réponses | Après le 2e | Preuves au journal | Connaissances ouvertes | Faits |", "|---|---|---|---|---|---|---|---|---|"]
for p in t[0]:
    v = h[p]
    L.append(f"| {p} | {avant[p]} | {t[0][p]['admissibles']} | {len(t[0][p]['questions'])} | {t[1][p]['admissibles']} | {t[2][p]['admissibles']} | {len(v['preuves'])} | {len(v['connaissances_ouvertes'])} | {len(v['faits'])} |")
L += ["", "## Questions refusées et motif, au premier lot", "", "| Profil | Condition fausse | Non résolue | Historique : la nouvelle n'a pas encore été posée | Historique remplacée |", "|---|---|---|---|---|"]
for p in t[0]:
    b = t[0][p]['bilan']; L.append(f"| {p} | {b.get('fermer', 0)} | {b.get('indecidable', 0)} | {b.get('coexistence_nouvelle_pas_encore_posee', 0)} | {b.get('coexistence_remplacee', 0)} |")
L += ["", "« Non résolue » : la condition contient un fragment que le moteur ne comprend pas, ou dépend d'une source absente (onglet « Branches »). Elle n'est ni ouverte ni tenue pour fausse.", "",
 "## Questions présentées, lot par lot", ""]
for p in t[0]:
    L.append(f"- **{p}** — lot 1 : {' '.join(q['cle'] for q in t[0][p]['questions']) or '—'} · lot 2 : {' '.join(q['cle'] for q in t[1][p]['questions']) or '—'} · lot 3 : {' '.join(q['cle'] for q in t[2][p]['questions']) or '—'}")
L += ["", "## Deux profils sans aucune question", "",
 "- **Manon** a coché « Déco & maison » et écrit qu'elle aime les brocantes. Aucune question : la catégorie « Déco & maison » de l'inscription n'a pas de correspondance validée vers une branche (décision n° 6, correspondances à valider), et « brocantes » ne se rattache à aucun domaine sans ambiguïté.",
 "- **Alice** n'a coché aucun centre d'intérêt et se dit casanière. Aucune question, et c'est le comportement voulu : on ne demande rien à quelqu'un dont on ne sait rien. Elle peut choisir un sujet dans « Explorer un sujet »."]
dest = os.path.join(P, '..', '..', '..', 'docs', 'discovery', 'etat-19nov', 'preuve-dix-profils.md')
open(dest, 'w').write('\n'.join(L) + '\n'); print('écrit', os.path.normpath(dest))
