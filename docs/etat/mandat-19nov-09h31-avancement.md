# Mandat du 19 novembre, 09h31 — avancement

Tenu à jour au fil du travail. Rien n'est déployé ; aucune écriture en production.

## Fait et éprouvé (local)

| Point | Ce qui existe | Preuve |
|---|---|---|
| 1. Stabilité `undetermined` | Migration 120 (fichier à la racine du dépôt), type, validation à l'écriture, consolidation. Appliquée à la base locale `etapes` seulement. | `stabilite-non-etablie.test.ts` ; script 33, cas 3 |
| 2. Les 15 destinations | Toutes ont un chemin d'écriture. Référents (œuvre, épisode, lieu) à identité propre et provenance ; animaux déclarés ; clarification quand le référent est ambigu ; relevé de chaque lecture ; reprise des lectures d'une version antérieure. Routes `/api/discovery/clarification` et `/api/discovery/animal`, écran « Une précision ». | `destinations.test.ts` (97 essais) ; script 33 |
| 3. Preuve sémantique | Copie exacte (accents et casse), qualification par le modèle, contre-examen lexical de la proposition (négation, autre personne, passé, condition). Cas retenus et refusés pour chaque destination. | `destinations.test.ts` |
| 4. Garde-fous | Matrice des 1 009 options : `docs/discovery/matrice-garde-fous.csv` (998 traduites, 11 indécidables avec leur motif). Application par périmètre (canal, domaine) puis critère rendu par un juge. | `garde-fou-discovery.test.ts` |
| 5. Usage positif | Portée `reco:gouts`, lecteur des goûts déclarés par le proche lui-même, contradictions, sujets sensibles, goûts passagers anciens, justification neutralisée. | `gouts-proche.test.ts` |

## Effets mesurés de `undetermined`

- **Consolidation** : une preuve seule de stabilité non établie se consolide en `unknown` ; mêlée à d'autres, elle ne change pas leur résultat et ne sert pas de seconde source pour atteindre `stable`.
- **Péremption** : aucun lecteur du code ne fait expirer une connaissance d'après sa stabilité (ni `temporary`, ni une autre). Il n'y a donc aucun effet, et aucune péremption à adapter. Le seul usage du temps ajouté aujourd'hui est le seuil provisoire de 60 jours pour un goût passager dans l'usage positif.
- **Recommandations** : elles ne lisent pas la stabilité. Aucun effet.

## Limites dites

- Le contre-examen est lexical : il attrape ce qui est écrit en toutes lettres, pas l'ironie ni l'implicite.
- Sans catalogue des œuvres et des lieux, « résolu de façon unique » veut dire : identifié par la réponse, et distinct de ce que la personne a déjà nommé.
- Modèle simulé partout. Le lecteur réel n'a pas été essayé.
- Aucun écran ne permet encore au proche d'accorder `reco:gouts` (ni les autres usages donnée par donnée) : seule la route existe.

## Décisions demandées

1. **Juge des garde-fous.** Dans son périmètre, un refus doit encore être jugé (« cette idée est-elle ce qui a été écarté ? »). Ce jugement ne peut pas être un mot partagé. Le seul juge possible est un second appel au modèle, séparé de la génération, qui reçoit l'idée et le critère et ne rend que oui ou non. Or la règle en vigueur est que les refus du proche n'entrent dans aucun prompt. Tant que tu n'as pas tranché, les garde-fous du Discovery n'écartent rien (c'est compté dans les traces).
2. **comics.0422, « appréciation explicite dans le segment ».** Lu strictement : « Blacksad, Akira » en réponse à « Quels titres aimes-tu vraiment ? » n'écrit rien, car l'appréciation est dans la question, pas dans la réponse. Faut-il que la question suffise ?
3. **podcast.0467 et sensory2.1482.** L'onglet 9 n'admet que la relation NEUTRAL ; l'onglet 17 admet « une appréciation parmi les neuf » sur un second segment. J'ai suivi l'onglet 17.
4. **Goût passager** : 60 jours, seuil provisoire.

## Reste à faire

6 (paramètres), 7 (catégories composites), 8 (« consommation et valeur », extension de « faible place »), 9 (niveau C structuré), 10 (décisions 3, 5, 8, matrice, M1–M9, 68 questions, 403 conditions, dix profils, essais du vrai lecteur).
