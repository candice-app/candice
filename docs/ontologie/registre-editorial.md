# Registre éditorial — ce qui est dans le produit SANS être passé par la relecture d'Estelle

> Garantie contre l'oubli. **Rien ne sort de ce registre sans qu'Estelle l'ait relu. Rien n'y entre en silence.** Chaque entrée : ce que c'est, où ça vit, combien, et sa nature (provisoire / legacy / pont).

| # | Contenu | Où | Compte | Nature |
|---|---|---|---|---|
| E-1 | **Subtexts** d'options (consignes sous chaque option) | `presentation.ts` + doc mappings | 128 | Provisoire — écrits avant verrouillage ton Candice + DA V11. Présentation INERTE. |
| E-2 | **Icônes** d'options (attention) | `presentation.ts` | 35 | Provisoire. Présentation INERTE. |
| E-3 | **MICRO** (consignes sous les titres de question) | `canonical-attention.ts` | 4 (q1,q2,q4,qe) | Provisoire — repris du legacy, non relus. |
| E-4 | **Dims** affectives (option → MOT/SER/…) | `attention-dims.ts` + doc mappings | 28 | Sémantique de fait, reprise du scoring déployé V15, NON RELUE. Gravée au journal (`dims`). |
| E-5 | **Deltas d'axes** tempérament (option → axe·valeur) | `temperament-deltas.ts` + doc mappings | 36 | PONT legacy (ancien dictionnaire), NON RELU. `projection_bridge`, interdit au HSG. Condition de mort §47quater. |
| E-6 | **Deltas d'axes** lifestyle (option → axe·valeur·target·q) | `lifestyle-deltas.ts` | 42 entrées (19 deltas `lifestyle` + 26 suppléances `temperament`) | PONT legacy, extrait par import, NON RELU. `projection_bridge`, interdit au HSG. **Seuls les axes** : `filter`/`canal` exclus (canoniques, cas 1 — §47quater). Condition de mort §47quater. |

## À ne pas traiter dans ce lot (inscrit pour mémoire)

- **Trou de couverture Food (q15) & Voyage (q16)** : jamais rendues depuis la clôture V15 (déplacées vers le Discovery, exclues des listes `_ACTIVE`). Le trou est **antérieur au lot B**. Reprise = chantier Discovery (hors périmètre de ce lot).

## Dette d'alignement (datée par événement, pas à traiter hors de son déclencheur)

- **Dims/rank de l'attention** (E-4) sont de la sémantique LEGACY logée dans les colonnes `dims`/`rank` au lieu de `projection_bridge` — pour éviter un refactor pur sur le domaine qui marche. Elles portent **la même interdiction** (jamais lues comme connaissance par HSG/respiration/analyse, cf. §47bis) et **la même condition de mort que `projection_bridge`** : `dims`, `rank`, `projection_bridge` et les colonnes du scoring legacy meurent **au même événement** — le jour où la reco réécrite lit les PROFILE constructs V15.

## Questions ouvertes (à arbitrer au LOT RECO, pas avant — ces axes meurent avec la réécriture)

- **Double-application des suppléances tempérament du lifestyle (BUG LATENT du scoring déployé).**
  `QuestionnaireFlow` appelle `mergeTemperamentSupplements` DEUX fois : au step4 (sur les suppléances des
  questions step4) puis au step5 (sur le RE-calcul de TOUTES les réponses = step4 + q18/q19). Les
  suppléances **step4** sont donc ajoutées **deux fois** à `temperament_axes`. **Axes surpondérés** :
  `sensibiliteDetails` (q14,q4a), `rapportTemps` (q4a,q4c), `spontaneiteControle` (q4a,q4c),
  `exigenceStanding` (q4a,q4c). Surpoids ≈ `round(raw_step4/8×100)` compté une fois de trop par axe
  (ex. mesuré : `rapportTemps` raw=3 → +38 appliqué deux fois → 76 au lieu de 38). Les suppléances
  **step5** (q18/q19) ne sont PAS doublées. **Décision Estelle : NE PAS corriger maintenant** — ces axes
  legacy meurent avec la réécriture de la reco (le corriger serait du travail jeté). La reconstruction du
  journal reproduit FIDÈLEMENT ce double-comptage (sinon l'égalité de vecteur échouerait, .6/.7). À
  rouvrir quand la reco lira les PROFILE constructs V15.

## À venir (sera inscrit quand gravé)

- *(rien en attente sur le socle — attention, tempérament et lifestyle gravés : E-1…E-6.)*
