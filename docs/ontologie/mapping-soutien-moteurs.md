# Mapping des deux questions ajoutées — `soutien` et `moteurs`

`mapping_version = 1.0.0` · arbitré le 5 octobre 2026

Les deux questions ajoutées au socle V15 étaient créées sans mapping canonique : leurs codes d'options datent d'un vocabulaire antérieur aux dix familles. Ce document arbitre leur mapping. Il complète `onboarding-v15-clos.md` et `onboarding-v15-mappings.md` sans les modifier.

**Autorité.** Le Dictionnaire canonique fait foi sur le sens des concepts, le Human Signal Graph sur leur usage et leur consolidation. Ce document est une application des deux.

---

## La règle qui gouverne les deux mappings

> **Une priorité de vie n'est pas un besoin psychologique.**

C'est la règle dégagée par l'arbitrage, et elle vaut au-delà de ces deux questions. Mapper « X compte dans ma vie » vers un `NEED` revient à utiliser `NEED` comme famille « valeurs et priorités » par défaut, et à fabriquer une information psychologique que la réponse ne contient pas.

Le corollaire est le principe déjà posé par le Dictionnaire §12 : une information exacte mais moins taguée vaut mieux qu'une information surinterprétée. La connaissance ouverte existe précisément pour ne pas avoir à tordre l'ontologie fermée.

---

## `soutien` — « Quand ça ne va pas, qu'est-ce qui t'aide vraiment ? »

5 options · 2 choix maximum

Cette question comble la lacune la plus coûteuse du socle : on mesurait très bien **comment** la personne réagit au stress (Q6), et pas du tout **comment elle veut être soutenue**.

Les cinq options produisent chacune un `NEED` distinct. Aucune collision.

| Option affichée | Code | Libellé du code |
|---|---|---|
| « Qu'on m'écoute » | `NEED_SEEN_UNDERSTOOD` | Être vu, écouté et compris dans sa singularité |
| « Qu'on me rassure » | `NEED_REASSURANCE` | Être rassuré face à l'incertitude |
| « Qu'on m'aide concrètement » | `NEED_RELIEF` | Être concrètement aidé ou soulagé |
| « Qu'on reste simplement près de moi » | `NEED_SUPPORT` | Se sentir soutenu et entouré |
| « Qu'on me laisse un peu tranquille » | `NEED_RHYTHM_RESPECT` | Voir son rythme, son espace et son tempo respectés |

### La distinction écoute / présence

Les deux premières descriptions de travail pointaient toutes deux vers « se sentir soutenu et entouré », ce qui écrasait deux attentions très différentes. L'arbitrage les sépare, et la distinction est opérationnelle :

**« Qu'on m'écoute » → `NEED_SEEN_UNDERSTOOD`.** Besoin que ce qui est vécu soit entendu et compris. Implication pour Candice : écouter, laisser verbaliser, **ne pas nécessairement chercher immédiatement une solution**.

**« Qu'on reste simplement près de moi » → `NEED_SUPPORT`.** Besoin de présence. Implication : être là, même sans verbalisation ni résolution.

Le libellé de `NEED_SEEN_UNDERSTOOD` contient littéralement le mot « écouté ». Être écouté, c'est être reçu ; avoir quelqu'un près de soi en silence, c'est être entouré.

### Propriétés de l'evidence

```
evidence_role  : primary
strength       : strong
context        : distress
context_scope  : LOCAL_CONTEXTUAL
assertionStatus: declared  (dérivé du sourceType, jamais saisi)
```

**Le contexte est obligatoire et il ne disparaît jamais.** Le stem décrit une situation — « quand ça ne va pas ». L'evidence dit donc :

> Quand ça ne va pas, l'écoute est une forme d'aide qui lui convient.

Elle ne dit **pas** :

> Cette personne a transversalement besoin de se sentir comprise.

Cette question seule ne transforme jamais un besoin de détresse en besoin transversal. Le passage à `GLOBAL_CONSOLIDATED` reste soumis aux seuils de `consolidation-rules.md` : trois evidences locales, trois contextes distincts, sources indépendantes, direction cohérente.

### Le contexte `distress`

Nouvelle entrée du registre ouvert `CONTEXT_CODES`. Ce n'est ni une famille nouvelle ni un `ONTOLOGY_GAP` : c'est une extension d'un vocabulaire explicitement extensible avec validation.

> **`distress`** — situation dans laquelle la personne traverse un moment difficile, un mal-être ou une difficulté émotionnelle ou personnelle, **sans présumer de sa cause**.

`stress` aurait été une mauvaise réduction sémantique. « Quand ça ne va pas » couvre la tristesse, l'échec, la maladie, une mauvaise journée, une rupture, un deuil, la surcharge, l'inquiétude, une période difficile.

**`distress` ne se traduit jamais en donnée clinique.** Il décrit une situation relationnelle, pas un état de santé. Aucun chemin de code ne doit le convertir en FACT sensible, en condition, ni en quoi que ce soit qui relève du §35 du HSG.

---

## `moteurs` — « Qu'est-ce qui compte particulièrement pour toi dans ta vie ? »

6 options · 3 choix maximum

### Zéro mapping NEED

**Cette question ne produit directement aucun `NEED`, aucun `PROFILE`, aucun `DRIVER`, aucune `AFFECTION`.**

C'est l'arbitrage, et il est allé au bout de la règle. Chaque candidat a été testé et écarté :

| Option | Code envisagé | Pourquoi il est écarté |
|---|---|---|
| « La liberté » | `NEED_FREEDOM` | « La liberté est une priorité » ne démontre pas « j'ai besoin de préserver mon espace de décision pour me sentir bien ». Très proche, pas identique. |
| « Apprendre et découvrir » | `NEED_STIMULATION` | On peut valoriser l'apprentissage sans qu'un manque de stimulation constitue un besoin. |
| « La famille » | `NEED_CONNECTION` | Plausible, mais la réponse ne dit pas **pourquoi** : proximité, appartenance, transmission, responsabilité, amour, continuité, identité. |
| « Construire et accomplir » | `NEED_RECOGNITION` | On peut avoir une forte pulsion de construction dans l'indifférence totale au regard extérieur. Accomplir ≠ être reconnu. |
| « Prendre soin des autres » | `NEED_CONTRIBUTION` | Que ce soit important dans ma vie ne signifie pas que j'ai besoin de pouvoir contribuer. |
| « Contribuer ou transmettre » | `NEED_CONTRIBUTION` | Idem. De plus la réponse relie deux concepts par « ou » : on ne sait pas lequel la personne retient. |

### Ce que la question produit

Six connaissances descriptives ouvertes, une par option, toutes distinctes :

| Option affichée | `subject` |
|---|---|
| « La liberté » | `freedom` |
| « Apprendre et découvrir » | `learning_discovery` |
| « La famille » | `family` |
| « Construire et accomplir » | `building_accomplishment` |
| « Prendre soin des autres » | `caring_for_others` |
| « Contribuer ou transmettre » | `contribution_transmission` |

```
type           : life_priority
relation       : matters_to
intensity      : strong
context        : GLOBAL
assertionStatus: declared
confidence     : high
```

Le `subject` passe par le résolveur de concepts pour obtenir son `SubjectId`, et le libellé verbatim affiché est conservé dans `subjectLabel`.

**`life_priority` n'est pas une famille canonique**, et c'est voulu. Voir la contrainte d'implémentation en fin de document.

### Pourquoi ce n'est pas une perte

Pour le portrait, « apprendre et découvrir compte particulièrement dans sa vie » est une information **plus fidèle et plus riche** que `NEED_STIMULATION`. Elle dit ce que la personne a dit, sans y ajouter un mécanisme psychologique.

Et ces connaissances pourront plus tard **participer à une convergence**. Par exemple : `life_priority = learning_discovery`, plus des comportements récurrents de recherche de nouveauté, plus une réponse directe sur ce qui manque quand la personne s'ennuie, pourront ensemble soutenir `NEED_STIMULATION`. Mais `moteurs` seule ne le prouve pas.

### Les deux options de contribution

« Prendre soin des autres » et « Contribuer ou transmettre » restent **deux options distinctes à l'écran**. Elles ne racontent pas la même chose : la première est tournée vers le soin interpersonnel, la seconde vers le fait d'apporter ou de laisser quelque chose au-delà de soi.

Aucune evidence secondaire n'est fabriquée pour les différencier. En particulier :

- **Pas d'`AFFECTION_GIVE_SERVICES`** sur « prendre soin des autres ». « Prendre soin des autres est important dans ma vie » ne signifie pas « j'exprime mon affection principalement par des services rendus ». Ce serait une inférence abusive.
- **Pas de `DRV_TRANSMISSION`** automatique sur « contribuer ou transmettre ». La réponse relie deux concepts par « ou ».

La nuance survit dans le verbatim et dans les deux `subject` distincts.

### Si la personne choisit les deux

Une seule question, une seule source. Deux options choisies dans la même question constituent **une evidence renforcée, pas deux preuves indépendantes**.

C'est déjà garanti par le modèle : l'indépendance se compte sur le `sourceType`, jamais sur le `sourceId` ni sur le nombre d'evidences. Mais la règle est rappelée ici parce que c'est exactement le cas où une implémentation naïve créerait une fausse convergence.

---

## L'ordre de sélection n'a aucune valeur sémantique

Invariant produit dégagé par cet arbitrage, et qui dépasse ces deux questions :

> **`selection_order` peut être conservé comme donnée d'interaction et d'analytique, mais il ne participe JAMAIS au poids sémantique d'une evidence — sauf lorsque la question demande explicitement à l'utilisateur de classer ou de hiérarchiser ses réponses.**

L'ordre d'interaction n'est pas l'ordre psychologique. Qu'une personne clique « famille », puis « liberté », puis « apprendre » ne signifie pas famille > liberté > apprentissage. L'ordre peut dépendre de la disposition visuelle, de la position du doigt, du sens de lecture, ou d'un premier choix évident suivi d'un choix plus réfléchi.

Un geste d'interface ne devient pas une information sur la personne simplement parce qu'on sait le mesurer.

**Conséquences, par ordre de portée :**

- `soutien` : 2 choix, **poids identiques**.
- `moteurs` : jusqu'à 3 choix, **poids identiques**.
- Radar d'intérêts : **aucune pondération par ordre de clic**. Chaque sélection produit une evidence de même poids, avec un niveau d'intérêt non précisé.
- **Q1 affection : la pondération par rang `{0: 5, 1: 3, 2: 1}` est retirée** si l'interface ne demande pas explicitement de classer. Chaque option sélectionnée devient une evidence de même poids initial.

Cela n'empêche pas Candice de découvrir plus tard qu'un langage affectif ou un intérêt compte davantage — par d'autres questions, par répétition, par convergence, par les réponses ouvertes, ou par une question explicite de priorité. Mais on ne l'invente pas à partir d'une séquence de taps.

### Ce qu'on n'ajoute pas

Corriger une mauvaise inférence ne conduit pas à ajouter une question de hiérarchie partout. Transformer chaque choix multiple en « choisis, puis classe, puis précise » alourdirait le Discovery pour résoudre un problème déjà résolu architecturalement : Candice peut vivre avec de l'`UNKNOWN` et apprendre progressivement.

La règle est donc :

- choix multiple ordinaire → poids égaux ;
- choix multiple où la saillance est réellement utile → éventuelle question secondaire explicite ;
- véritable classement nécessaire → interface de classement explicite ;
- **jamais d'exploitation sémantique silencieuse de l'ordre des clics.**

---

## Contraintes d'implémentation

Trois points où ce mapping ne rentre pas dans le module tel qu'il est livré au lot A bis. Ils sont traités par le lot A ter et doivent être réglés **avant** que le lot B code ces questions.

**1 · `OpenKnowledge.type` est trop étroit.** Il est typé `CanonicalFamily`, donc limité aux dix familles. `life_priority` n'en est pas une. Le Dictionnaire §12 pose que la connaissance descriptive est « sémantiquement ouverte » ; le type doit devenir un vocabulaire ouvert validé, dont la graine contient les dix familles canoniques plus `life_priority`.

**2 · `InterestEvidence.relationship` est obligatoire et fermé** à cinq valeurs — `casual`, `curious`, `enthusiast`, `passion`, `expert`. Aucune ne signifie « non précisé ». Le radar d'intérêts ne peut donc pas produire d'evidence sans inventer un niveau, et le défaut naturel — `casual` — fabriquerait exactement ce que ce document interdit. Le champ doit devenir facultatif : absent signifie non précisé, jamais « faible ».

**3 · La pondération par rang doit être retirée** de `AFFECTION_SCORING` après vérification que Q1 ne demande pas explicitement de classement, et le lot A ter doit chercher tout autre usage de l'ordre de sélection comme proxy de préférence.

---

## Ce que ce document ne tranche pas

Rien n'est laissé en suspens sur ces deux questions. Les six options de `moteurs` et les cinq de `soutien` ont toutes un sort défini.

Reste ouvert, hors de ce document : le §7 de `consolidation-rules.md` — pondération numérique secondaire/primaire et décroissance temporelle de la confiance.
