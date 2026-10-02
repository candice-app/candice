# Règles de consolidation Candice — seuils arbitrés

`consolidation_version = 1.0.0`

## Rôle de ce document

Le Dictionnaire canonique fait foi sur le sens des concepts. Le Human Signal Graph fait foi sur leur usage, leur contextualisation et leur consolidation — mais il ne fixe aucun seuil chiffré. Ce document les fixe.

Il existe pour une raison précise : un seuil codé en valeur par défaut dans une fonction devient définitif par oubli, et le code devient alors une autorité sémantique, ce que le §40 du HSG interdit. Les seuils vivent donc ici, versionnés, et le code les lit depuis un objet typé unique qui cite ce document.

Toute modification d'un seuil passe par ce document et par un incrément de `consolidation_version`. Jamais par une valeur enfouie dans `consolidate.ts`.

---

## 1. Deux questions distinctes

Le **score** répond à : à quel point ce construct semble-t-il marqué chez cette personne ?

La **confiance** répond à : à quel point Candice peut-elle se fier à cette lecture ?

Elles ne se calculent pas de la même manière et ne doivent jamais être confondues. C'est le §5.3 du HSG. Deux personnes peuvent avoir le même score avec des confiances très différentes.

---

## 2. Le score

### `high`
Au moins une evidence **primaire** de valeur `+2`.
Ou au moins deux evidences **primaires** de valeur `+1` issues de **sources indépendantes**.
Dans les deux cas : aucune evidence contraire de poids comparable.

### `medium`
Une evidence primaire `+1`.
Ou une evidence secondaire `+2`.
Ou plusieurs evidences secondaires convergentes.

### `low`
**Uniquement sur evidence contraire nette** — des valeurs `−1` ou `−2` dominantes.

`low` signifie « ce construct est faible chez cette personne, et c'est démontré ». Il ne signifie jamais « nous avons peu d'informations ».

### `unknown`
Aucune evidence. C'est l'état par défaut de tout construct.

> **R1 : `UNKNOWN` n'est pas `LOW`.** Le manque de données ne produit jamais un score bas. Aucun chemin de code ne doit pouvoir produire `low` sans au moins une evidence contraire.

---

## 3. La confiance

### `high`
Au moins **3 evidences**, issues d'au moins **2 sources indépendantes** et d'au moins **2 contextes distincts**, cohérentes entre elles.

### `medium`
Au moins **2 evidences**.
Ou une evidence primaire `+2` de source déclarée.

### `low`
Une seule evidence.
Ou uniquement des evidences secondaires.
Ou une contradiction non résolue présente sur ce construct.

### `none`
Aucune evidence.

---

## 4. L'indépendance des sources

L'indépendance se compte sur le `sourceId` et le `sourceType`, **jamais sur le nombre d'evidences**.

Dix réponses issues du même questionnaire ne valent pas dix observations indépendantes. C'est le §19.1 du HSG : le moteur doit éviter le faux effet de volume.

**Conséquence voulue et assumée** : à la sortie de l'onboarding seul, presque aucun construct n'atteint `confidence: high`, parce qu'il n'existe qu'une seule source. C'est juste. L'onboarding produit un profil V0 et une carte de ce qu'il reste à apprendre, pas une vérité consolidée. La confiance monte quand le Discovery, les conversations et les observations viennent croiser la même information depuis ailleurs.

---

## 5. `GLOBAL_CONSOLIDATED`

Un construct ne devient `GLOBAL_CONSOLIDATED` que si :

- au moins **3 evidences locales** ;
- dans au moins **3 contextes distincts** ;
- de **direction cohérente** ;
- issues de **sources indépendantes**.

En dessous de ce seuil, le construct reste local même s'il est fort dans son contexte.

`GLOBAL_CONSOLIDATED` n'est jamais produit par le mapping d'une réponse — c'est R15, et seul le moteur de consolidation peut le produire. Sa provenance reste distinguable de `GLOBAL_DIRECT`.

---

## 6. Ce que la consolidation n'est pas

Elle n'additionne pas des points. Le §19 du HSG énumère ce qu'elle doit peser : le nombre d'evidences, leur force, leur **indépendance**, leur qualité, la diversité des sources, la diversité des contextes, leur répétition, leur cohérence, leurs contradictions, leur temporalité, leur stabilité, leur spécificité.

Les seuils ci-dessus sont des conditions nécessaires, pas une formule. Une contradiction non résolue abaisse la confiance même quand le compte d'evidences est atteint. Une tension structurante ne se résout jamais par une moyenne — elle est conservée comme tension.

---

## 7. Ce qui reste à arbitrer plus tard

La pondération exacte d'une evidence `secondary` par rapport à une `primary` dans un calcul cumulé. Pour l'instant la règle est qualitative et suffit : une evidence secondaire seule ne peut jamais porter un construct à `high` avec `confidence: high`.

L'effet du temps sur la confiance. Le `timestamp` et la `stability` sont conservés sur chaque evidence, mais aucune décroissance n'est appliquée à ce stade. Elle sera arbitrée quand des profils auront vécu assez longtemps pour qu'on puisse en juger sur des cas réels.

Ces deux points sont nommés ici pour ne pas être oubliés. Tant qu'ils ne sont pas arbitrés, le code ne doit appliquer aucune pondération numérique ni aucune décroissance inventée.
