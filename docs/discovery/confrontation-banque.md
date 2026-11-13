# Discovery · confrontation du référentiel à la banque réelle

Mesuré le 13 novembre 2026, sur `docs/Candice_Discovery_Referentiel_V5_OPEN_V3.xlsx`
(sha256 `53b08fbc05ca1d9da300218a193aa4baabebdb0c5b3a142b401a086c6142649c`) et sur le dépôt
à `e0836ca`. Scripts rejouables : `scripts/discovery/`.

## Le résultat, en une ligne

**Les deux ensembles d'identifiants ne se touchent en aucun point.**

| | nombre | format | source |
|---|---|---|---|
| Banque servie par `/moi/discovery` | **71** | `attention.reception`, `gifts.what_works` | table `discovery_questions`, semée par les migrations 29, 31, 33, 48, 53 |
| Questions du référentiel | **2 402** | `travel.0060`, `cinema.0079`, `CRE-06` | onglets 0, 1, 2, 5, 6, 9, 12, 17 du classeur |
| **Intersection** | **0** | — | — |

Et la réciproque est vraie aussi : **aucune** des 71 clés de la banque n'apparaît nulle
part dans les 19 onglets. Ce n'est pas un recouvrement partiel ni un problème de
normalisation d'identifiants : ce sont deux espaces de noms disjoints.

## Ce qui a été cherché avant de conclure

1. Les clés semées par chaque migration touchant `discovery_questions` — 71 distinctes.
2. Les identifiants de question de **tous** les onglets — 2 402 distincts sur 8 onglets.
3. Les 71 clés de la banque recherchées **dans chaque cellule** des 19 onglets : aucune.
4. Un identifiant du référentiel (`travel.0060`, `cinema.0079`, `learning2.1459`,
   `podcast.0467`) recherché dans tout le dépôt, tous types de fichiers : présent
   uniquement dans des documents de travail téléchargés et dans les livrables déposés
   aujourd'hui. **Aucun code, aucune migration, aucun fichier de données.**
5. Une table « banque » : il n'en existe aucune. Les seules tables de questions sont
   `discovery_questions` et `questionnaire_responses`. La chaîne `BANQUE:` n'apparaît
   nulle part dans `src/`.

## Ce que dit le classeur lui-même

`11_TABLE_DE_MIGRATION` (806 lignes) préfixe ses identifiants d'option `BANQUE:` —
par exemple `BANQUE:travel.0060:OPT_007` → `BANQUE:cinema2.0985:OPT_001`. Il migre donc
**à l'intérieur** de l'espace de noms BANQUE, d'une version du référentiel à une autre.
Il ne contient aucune règle reliant la BANQUE à `discovery_questions`.

Autrement dit : le classeur décrit l'évolution d'un système, le produit en exécute un
autre, et rien n'écrit le pont entre les deux.

## Ce que cela change

« Raccorder OPEN V3 au vrai Discovery » n'est pas un travail de câblage. Il n'y a rien à
câbler : les 2 402 questions du référentiel **n'existent dans le produit sous aucune
forme**, et les 71 que le produit sert ne sont décrites par aucun contrat du classeur.

Les 15 destinations conditionnelles portent sur 9 questions — `CRE-06`, `learning2.1459`,
`comics.0422`, `drinks.2102`, `pets.0403`, `podcast.0467`, `sensory2.1482`,
`sensory2.1487`, `time.1566`. **Aucune des neuf n'est servie par l'application
aujourd'hui.** Écrire leurs douze évaluateurs produirait du code qu'aucun parcours
n'atteindrait.

## L'arbitrage qui manque, et qui conditionne la suite

Trois issues, et elles n'ont ni le même coût ni le même sens :

1. **La BANQUE remplace la banque actuelle.** Les 2 402 questions sont importées en base,
   `/moi/discovery` est repointé dessus, et les 71 questions actuelles deviennent de
   l'historique à relire selon `11_TABLE_DE_MIGRATION` et `13_COEXISTENCE_GENERATIONS`.
   C'est ce que la structure du classeur suppose — il a des onglets de migration et de
   coexistence de générations, qui n'ont de sens que si une bascule est prévue.

2. **Les deux coexistent.** La banque actuelle continue, la BANQUE est ajoutée à côté,
   et `12_CONTRAT_DE_QUESTION` décide question par question laquelle est servie.

3. **Le référentiel décrit un Discovery à venir**, et le raccordement attend que la
   BANQUE soit implémentée. Dans ce cas, le travail immédiat n'est pas « raccorder » mais
   « construire la banque ».

Aucune de ces trois n'est une décision technique. Tant qu'elle n'est pas prise, les
contrats versionnés restent justes et inutilisables : le contrat existe, la question qu'il
gouverne n'existe pas.

## Ce qui reste vrai et acquis

- La révision 1 et son diff de 46 cellules.
- Le contrat des 15 destinations, conforme aux arbitrages, avec ses contrôles de non-retour.
- L'inventaire des 19 onglets, 49 665 lignes, 257 colonnes.
- La confrontation des vocabulaires : 11 colonnes portent un vocabulaire du journal,
  sous 6 intitulés différents, et une seule valeur sort du canon — un gabarit.
