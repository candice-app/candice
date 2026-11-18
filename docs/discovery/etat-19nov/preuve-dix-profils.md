# Dix profils en personnage — relevé reproductible (19 novembre)

Pile locale, comptes de test séparés, vraies routes HTTP de l'application. Rien en production.

Rejouer : `scripts/local/28-profils-lus-par-claude.mts` (`--etape creer`, `questions`, `repondre`, `hsg`), puis `scripts/local/profils/resumer.py`.
Entrées exactes : `scripts/local/profils/personnages.json` (inscription), `lectures-claude.json` (réponses libres et leur lecture), `reponses-1.json`, `reponses-2.json` (Discovery).
Sorties : `tour-1.json`, `tour-2.json`, `tour-3.json` (questions admissibles, présentées, refusées et motif), `hsg.json` (journal de chacun, sans identifiant de compte).

**Limite.** Les réponses libres sont lues par Claude dans une session Claude Code, sous la consigne et le schéma d'outil réels. Ce n'est pas la sortie de l'API de production : la qualité de lecture du modèle servi reste à mesurer avec la vraie clé.

## Avant / après

« Avant » : relevé du 18 nov. 22h20 sur le commit `4f357af`, même inscription, mêmes réponses libres. Seul le lot présenté avait été relevé ; le nombre de questions admissibles n'était pas mesuré.

| Profil | Avant : présentées au 1er lot | Après : admissibles | Après : présentées au 1er lot | Admissibles après le 1er lot de réponses | Après le 2e | Preuves au journal | Connaissances ouvertes | Faits |
|---|---|---|---|---|---|---|---|---|
| Sophie | 6 | 56 | 6 | 50 | 56 | 49 | 10 | 6 |
| Camille | 4 | 23 | 6 | 17 | 23 | 59 | 3 | 3 |
| Inès | 6 | 56 | 6 | 50 | 56 | 57 | 4 | 4 |
| Léa | 2 | 49 | 6 | 43 | 59 | 55 | 2 | 2 |
| Manon | 0 | 0 | 0 | 0 | 0 | 29 | 2 | 3 |
| Clara | 4 | 24 | 6 | 20 | 35 | 72 | 2 | 2 |
| Nour | 2 | 44 | 6 | 41 | 41 | 36 | 3 | 4 |
| Alice | 0 | 0 | 0 | 0 | 0 | 34 | 1 | 1 |
| Jeanne | 4 | 12 | 2 | 10 | 17 | 35 | 2 | 2 |
| Yasmina | 2 | 33 | 4 | 30 | 49 | 34 | 3 | 3 |

## Questions refusées et motif, au premier lot

| Profil | Condition fausse | Non résolue | Historique : la nouvelle n'a pas encore été posée | Historique remplacée |
|---|---|---|---|---|
| Sophie | 1819 | 340 | 9 | 1 |
| Camille | 1825 | 377 | 0 | 0 |
| Inès | 1819 | 340 | 9 | 1 |
| Léa | 1808 | 353 | 7 | 8 |
| Manon | 1848 | 377 | 0 | 0 |
| Clara | 1822 | 377 | 2 | 0 |
| Nour | 1833 | 340 | 7 | 1 |
| Alice | 1848 | 377 | 0 | 0 |
| Jeanne | 1834 | 377 | 2 | 0 |
| Yasmina | 1826 | 351 | 7 | 8 |

« Non résolue » : la condition contient un fragment que le moteur ne comprend pas, ou dépend d'une source absente (onglet « Branches »). Elle n'est ni ouverte ni tenue pour fausse.

## Questions présentées, lot par lot

- **Sophie** — lot 1 : food2.0857 food2.0858 reading2.1233 reading2.1235 sensory.0261 sensory.0262 · lot 2 : food2.0859 food2.0860 reading2.1237 reading.0108 sensory.0264 sensory.0267 · lot 3 : food.0023 food.0025 reading.0111 reading.0112 FOO-08 sensory.0265
- **Camille** — lot 1 : nature.0210 nature.0211 sport.0183 sport.0184 sportp.0505 sportp.0506 · lot 2 : nature.0212 nature.0215 sport.0185 sport.0189 sportp.0507 · lot 3 : sport.0191 nature.0213 nature.0216 sport.0186 sportp.0508 sportp.0510
- **Inès** — lot 1 : food2.0857 food2.0858 reading2.1233 reading2.1235 sensory.0261 sensory.0262 · lot 2 : food2.0859 food2.0860 reading2.1237 reading.0108 sensory.0264 sensory.0267 · lot 3 : food.0021 food.0023 reading.0111 reading.0112 sensory.0265 FOO-08
- **Léa** — lot 1 : travel2.0887 travel2.0888 art.0128 art.0129 craft.0615 craft.0616 · lot 2 : travel2.0889 travel2.0891 art.0130 art.0133 craft.0617 craft.0618 · lot 3 : travel2.0917 travel2.0918 art.0131 sensory.0261 sensory.0262 CRE-05
- **Manon** — lot 1 : — · lot 2 : — · lot 3 : —
- **Clara** — lot 1 : reading2.1233 reading2.1235 art.0128 art.0129 museum.0699 museum.0700 · lot 2 : reading2.1237 art.0130 art.0133 museum.0701 museum.0702 reading.0108 · lot 3 : reading.0111 reading.0112 art.0131 art.0134 museum.0703 museum.0709
- **Nour** — lot 1 : food2.0857 food2.0858 sensory.0261 sensory.0262 FOO-02 FOO-04 · lot 2 : food2.0859 food2.0860 sensory.0262 sensory.0264 FOO-04 FOO-08 · lot 3 : food.0021 food.0023 sensory.0262 sensory.0267 FOO-08 FOO-07
- **Alice** — lot 1 : — · lot 2 : — · lot 3 : —
- **Jeanne** — lot 1 : reading2.1233 reading2.1235 · lot 2 : reading2.1237 reading.0108 · lot 3 : reading.0111 reading.0112
- **Yasmina** — lot 1 : travel2.0887 travel2.0888 sensory.0261 sensory.0262 · lot 2 : travel2.0889 travel2.0891 sensory.0262 sensory.0264 · lot 3 : travel2.0917 travel2.0918 sensory.0262 sensory.0267

## Deux profils sans aucune question

- **Manon** a coché « Déco & maison » et écrit qu'elle aime les brocantes. Aucune question : la catégorie « Déco & maison » de l'inscription n'a pas de correspondance validée vers une branche (décision n° 6, correspondances à valider), et « brocantes » ne se rattache à aucun domaine sans ambiguïté.
- **Alice** n'a coché aucun centre d'intérêt et se dit casanière. Aucune question, et c'est le comportement voulu : on ne demande rien à quelqu'un dont on ne sait rien. Elle peut choisir un sujet dans « Explorer un sujet ».
