# Onboarding Candice — questionnaire incognito V1

Document d'autorité du jeu **incognito** (`mode = reported`). Autonome : il ne dérive pas du questionnaire self et ne cherche aucune symétrie avec ses 19 questions.

Le Dictionnaire canonique fait foi sur le sens des concepts, le Human Signal Graph sur leur usage et leur consolidation, `consolidation-rules.md` sur les seuils. Ce document fait foi sur **ce que le jeu incognito demande et ce qu'il produit**.

`incognito_version 1.0.0` · `ontology_version 1.0.0` · `hsg_version 1.0.0`

---

## 1 · Principe directeur

**On ne demande pas au pilote de reconstituer la psychologie de son proche.** On lui demande ce qu'il a vu, ce qu'il a entendu de la personne elle-même, ce qu'il a vécu avec elle, ce qui a déjà marché ou échoué.

On privilégie donc « qu'est-ce que tu as vu ? », « qu'est-ce qu'elle t'a dit ? », « qu'est-ce qui a déjà marché ? » — et jamais « selon toi, Julie est quel genre de personne ? ».

**Le pivot commun avec le self est le concept, pas la formulation.**

```
questionConcept   ex. stress_response, decision_process, affection_received
mode              self | reported
sourceType        l'acte d'acquisition
```

Les deux jeux peuvent avoir des formulations, des options, des mappings, des strengths, des rôles, des contextes et un nombre de questions différents. Les codes canoniques restent identiques **quand on mesure réellement le même phénomène** : aucun `PROFILE_*_INCOGNITO`, jamais.

**Les codes d'option vivent dans un espace de noms distinct** — `I1.1`, `I1.2`, … — pour que les chiffres de contrôle des deux jeux ne puissent pas se mélanger par accident.

---

## 2 · Vérification du modèle existant

Exigée avant toute création de champ. Deux résultats.

### La base épistémique n'existe pas dans le modèle — gap confirmé

La structure de référence d'une evidence au HSG §5 est : `evidence_id` · `source_id` · `source_type` · `raw_information` · `target_family` · `target_construct` · `value` · `strength` · `confidence` · `context` · `timestamp` · `stability` · `evidence_role`, et selon les cas `direction` · `modality` · `severity` · `scope` · `trigger` · `pattern` · `entity_id`.

**Aucun de ces champs ne porte la distinction demandée.** `source_type` dit l'acte d'acquisition, `assertionStatus` dit explicite contre inféré, `confidence` est un niveau calculé, `raw_information` est le verbatim.

> **Une précision qui compte pour la lecture du HSG.** Le §33 exige que le graphe distingue « déclaré · observé · rapporté par un proche · inféré ». Cette exigence est satisfaite, mais **à travers deux axes** plutôt qu'un seul enum : `sourceType` porte déclaré / observé / rapporté, `assertionStatus` porte explicite / inféré. Rien n'a été abandonné du §33. Et le §34, « une information renseignée par quelqu'un d'autre n'a pas exactement le même statut qu'une déclaration directe », demande de conserver la provenance et le niveau de confiance — il ne dit pas **sur quoi repose** l'affirmation du proche. C'est exactement le trou.

**Contrat proposé — un troisième axe, `assertionBasis` :**

```
assertionBasis = 'self_report'              // le sujet parle de lui-même
               | 'observed'                  // le pilote a vu
               | 'subject_statement'          // le pilote rapporte un propos du sujet
               | 'reporter_interpretation'    // le pilote conclut
```

**Quatre valeurs, aucune optionalité, aucun défaut.** Le mode self porte `self_report` — une seule valeur, parce que le questionnaire self ne distingue pas l'auto-observation de l'auto-interprétation et qu'inventer cette distinction maintenant serait ajouter de la psychologie.

**La base est déterminée par la formulation de la question, jamais saisie par l'utilisateur et jamais défaillie.** Elle est déclarée question par question dans ce document : si la question demande ce que le pilote a vu faire → `observed` ; ce que le sujet a dit → `subject_statement` ; ce que le pilote conclut → `reporter_interpretation`.

**Trois axes, trois questions différentes**, et c'est ce qui rend la règle de strength énonçable sans plafond de provenance :

| Axe | Question à laquelle il répond |
|---|---|
| `sourceType` | qui a fourni l'information, par quel acte |
| `assertionStatus` | explicite dans la source, ou inféré par Candice |
| `assertionBasis` | sur quoi repose l'affirmation de celui qui parle |

Un propos de Julie rapporté par Estelle est donc `sourceType = reported_by_relative` · `assertionStatus = explicit` · `assertionBasis = subject_statement`. Il ne devient **jamais** artificiellement `declared`.

**Où ce champ vit, et où il ne vit pas.** Sur l'evidence, dérivé du mapping à la production, jamais accepté en paramètre d'un appelant — même discipline que `about`. Il n'entre **pas** dans la clé-cible de l'`evidence_id` : la clé-cible reste `family + construct (+ facet, + direction/modality)`, donc **aucune migration d'identifiant**. Il n'entre **pas** dans `signalKey` : deux evidences du même construct avec des bases différentes doivent consolider ensemble, puisque c'est précisément leur convergence qui est informative. Il alimente le raisonnement de confiance, pas la clé.

### `relationship_with_reporter` n'existe pas, et le voisin n'est pas le même

**Ce ne sont pas deux vocabulaires sur un champ, ce sont deux champs.** *Établi le 7 octobre par lecture du code, après deux descriptions fausses de ma part — dont une qui prétendait fusionner les registres.*

Une evidence BEHAVIOR porte **deux** contextes, renseignés tous les deux par `produce.ts` :

| Champ | Registre | Ce qu'il nomme | Qui le détermine |
|---|---|---|---|
| `evidence.context` | `EVIDENCE_CONTEXTS` — 14 valeurs | le **domaine** où le phénomène s'observe | la question, via la table de contexte local (`NONROLE_CONTEXT` au socle) |
| `behaviorContext` | `BEHAVIOR_CONTEXTS` — 4 valeurs | la **situation de réaction** | le mapping de la question |

Les familles PROFILE, PREFERENCE, NEED, DRIVER et ENTITY ne portent que le premier. `BEHAVIOR_CONTEXTS` = `stress_response` · `conflict_response` · `decision_process` · `emotional_expression`, et ces quatre valeurs **ne figurent pas** dans `EVIDENCE_CONTEXTS` — sauf `emotional_expression`, qui existe dans les deux registres parce qu'elle est à la fois un domaine et une situation. C'est la seule collision, et elle est légitime.

Conséquences, qui annulent trois affirmations de la V1 de ce document :

- **`conflict` est employé** : la table de contexte local du socle envoie Q7 → `conflict` sur `evidence.context`. Le retirer du registre casserait le socle. Il y reste.
- **`EVIDENCE_CONTEXTS` reste à 14**, inchangé : il n'y a ni les quatre contextes BEHAVIOR à y ajouter, ni `conflict` à en retirer.
- **Le « 16 » était une fusion de deux registres distincts** et n'a jamais eu de sens.

Seul `self_expression` sur I8.5 était bien une invention sans précédent : I8 est une `PREFERENCE.communication`, pas un BEHAVIOR, elle ne porte donc qu'`evidence.context = communication`. Cette correction-là tient.

> **Le vrai trou, et il préexiste à l'incognito.** `assertValidEvidenceContext` garde `evidence.context` contre `EVIDENCE_CONTEXTS`, et ne garde **pas** `behaviorContext` contre `BEHAVIOR_CONTEXTS`. Or le grain de consolidation BEHAVIOR est `behaviorContext:pattern` : une coquille — `stress_responce` — scinderait la consolidation en silence, sans qu'aucun test ne proteste. Le garde-fou est à étendre, pour les deux jeux. Décidé le 7 octobre.

`relationship` est le plus proche et ce n'est pas le même : il situe un phénomène dans la vie relationnelle de la personne en général, pas dans la dyade avec le pilote. Julie envoie des vocaux à Estelle et appelle sa mère : les deux énoncés sont vrais et ne portent pas sur le même objet.

**`relationship_with_reporter` est donc un contexte propre à l'incognito**, le seul qu'il introduise dans le vocabulaire local. **Son statut dans le code est à constater, pas à déduire de ce document** : s'il figure déjà dans `EVIDENCE_CONTEXTS`, il n'y a rien à ajouter et le registre reste à 14 ; s'il n'y figure pas, il s'ajoute et le registre passe à 15. Aucune autre valeur n'entre, aucune ne sort.

**Il ne s'applique que lorsque le phénomène décrit est lui-même situé dans la relation avec le pilote.** Il n'est jamais hérité du mode. « Quand Julie est stressée, elle s'isole » porte `stress`, pas `relationship_with_reporter`. **La provenance n'est pas le contexte.**

---

## 3 · Les six règles transversales

**R-I1 · La strength mesure la force avec laquelle l'evidence soutient le construct, jamais la provenance.** Aucun plafond automatique `reported_by_relative → moderate`. Une observation comportementale directe et nette peut être `primary · strong` tout en restant rapportée. Une interprétation est `moderate` **parce qu'elle est indirecte**, pas parce qu'elle vient de l'incognito. En pratique, la base épistémique porte cette distinction : `observed` et `subject_statement` autorisent `strong`, `reporter_interpretation` plafonne à `moderate`.

**R-I2 · L'incertitude du pilote produit zéro.** « Je préfère ne pas deviner », « Je ne l'ai pas assez vue dans cette situation », « Je ne sais pas vraiment » sont **trois habillages d'un seul code fonctionnel**, implémenté une fois : zéro evidence, zéro FACT, zéro `OpenKnowledge`, zéro ENTITY, zéro signal, **zéro evidence négative**, et aucune baisse de confiance d'une connaissance existante. Code `UNKNOWN_BY_REPORTER`. Une non-réponse n'est pas une réponse négative.

**R-I3 · « Ça dépend » est une vraie réponse.** Jamais `UNKNOWN`. Son sens est décidé question par question dans ce document. **Aucune règle générique `ça dépend → PROFILE_ADAPTABILITY`.** Code `CONTEXT_DEPENDENT`, mapping propre à chaque question.

**R-I4 · La sévérité d'un guardrail vient de ce qui est exprimé, pas de sa provenance.** « Préfère éviter » → `SOFT`. « Déteste / jamais / surtout pas » → `HARD` possible. Une formulation fermée prudente ne fabrique jamais un `HARD`. Un propos explicite rapporté — « elle m'a dit : surtout jamais ça » — peut soutenir un `HARD` avec base `subject_statement`.

**R-I5 · Aucune inférence PROFILE ajoutée parce que le pilote connaît bien la personne.** Les exigences du self s'appliquent à l'identique : il faut une evidence réelle du fonctionnement concerné. Une réponse locale peut porter une evidence PROFILE secondaire **lorsque c'est réellement contenu dans la réponse**, et c'est alors écrit explicitement ci-dessous. Sinon il n'y a pas de mapping. **Rien n'est laissé à l'interprétation du codeur.**

**R-I6 · Tout champ présumant une confirmation du sujet est invalide en mode rapporté.** Un FACT produit en incognito ne porte jamais `user_confirmed = true` : Julie n'a rien confirmé. Les 128 mappings du self doivent être passés en revue pour lister chaque champ encodant une confirmation ou une assertion de soi — audit ouvert au §8.

---

## 4 · Les dix-sept questions fermées

Seize questions validées, plus **I11b**, née de la décomposition de I11 : la ponctualité et le retard habituel avaient été absorbés dans la mesure de l'organisation, ce qui était le défaut signalé. Le nom `I11b` évite de renuméroter le reste du jeu.

Conventions de lecture : la colonne **Context** porte `evidence.context`, le domaine. Les quatre questions BEHAVIOR — I5, I6, I9, I10 — portent **deux colonnes**, `evidence.context` et `behaviorContext`, parce que le code renseigne deux champs distincts sur ces evidences (§2) ; les deux valeurs sont écrites, aucune n'est à inférer. `evidence_role` vaut `primary` sauf mention contraire. Une option sans mapping ne produit rien, et ce vide est voulu. Toutes les evidences du jeu portent `sourceType = reported_by_relative` et `assertionStatus = explicit` ; seule la base épistémique varie, et elle est donnée par question.

### I1 — Ce qui la touche

`questionConcept` **affection_received** · remplace Q1 · base **reporter_interpretation** · multi, jusqu'à 3

> « D'après ce que tu connais de {Prénom}, quelles attentions lui font vraiment plaisir ? »

| Code | Option | Mapping | Valeur / strength | Context |
|---|---|---|---|---|
| I1.1 | Lui dire des mots sincères | `AFFECTION_RECEIVE_WORDS` | moderate | `attention_received` |
| I1.2 | L'aider concrètement sans qu'{pronom} ait besoin de demander | `AFFECTION_RECEIVE_SERVICES` + `DRV_ANTICIPATION` | moderate | `attention_received` |
| I1.3 | Lui offrir quelque chose choisi sur mesure | `AFFECTION_RECEIVE_PERSONALIZED_GIFT` + `DRV_PERSONALIZATION` | moderate | `attention_received` |
| I1.4 | Lui offrir quelque chose qui a du sens ou une histoire | `AFFECTION_RECEIVE_SYMBOLIC_GIFT` + `DRV_SYMBOLISM` | moderate | `attention_received` |
| I1.5 | Lui consacrer un vrai moment de qualité | `AFFECTION_RECEIVE_QUALITY_TIME` + `DRV_SHARED_EXPERIENCE` | moderate | `attention_received` |
| I1.6 | Y penser dans les petits détails du quotidien | `AFFECTION_RECEIVE_MICRO_ATTENTIONS` + `DRV_ATTENTIVENESS` | moderate | `attention_received` |
| I1.7 | Lui réserver quelque chose d'inattendu | `AFFECTION_RECEIVE_SURPRISE` + `DRV_SURPRISE` | moderate | `attention_received` |
| I1.U | Je préfère ne pas deviner | `UNKNOWN_BY_REPORTER` | — | — |

**Pas d'inférence :** aucun rang, aucune hiérarchie — contrairement à Q1, l'écran ne demande pas de classement et l'ordre de sélection n'a aucune valeur. Aucun PROFILE. Aucun `APPETENCE_OBJECT` sur I1.3 ou I1.4 : le self le produit en secondaire depuis une déclaration de soi, une perception de tiers ne le porte pas.

**Verbatim du pilote conservé** sur la source, comme pour toute question.

**Différence avec le self :** Q1 demande un classement et produit `strong` sur les rangs 1 et 2 ; ici la base est une perception, donc `moderate` partout et aucun rang.

### I2 — Une attention qui marche vraiment

`questionConcept` **attention_effectiveness** · adapte Q2 · base **reporter_interpretation** · multi

> « Quand une attention fait vraiment plaisir à {Prénom}, qu'est-ce qui semble faire la différence ? »

| Code | Option | Mapping | Valeur / strength | Context |
|---|---|---|---|---|
| I2.1 | Elle montre qu'on a vraiment écouté | `DRV_ATTENTIVENESS` | moderate | `attention_received` |
| I2.2 | Elle arrive au bon moment | `DRV_TIMING` | moderate | `attention_received` |
| I2.3 | Elle crée un souvenir | `DRV_MEMORY` | moderate | `attention_received` |
| I2.4 | Elle lui facilite vraiment la vie | `DRV_RELIEF` + `DRV_UTILITY` | moderate | `attention_received` |
| I2.5 | Elle est simple mais sincère | `DRV_SIMPLICITY` + `DRV_AUTHENTICITY` | moderate | `attention_received` |
| I2.6 | Elle crée la surprise | `DRV_SURPRISE` | moderate | `attention_received` |
| I2.7 | Elle est belle et choisie avec goût | `DRV_AESTHETIC` | moderate | `attention_received` |
| I2.U | Je préfère ne pas deviner | `UNKNOWN_BY_REPORTER` | — | — |

**Pas d'inférence :** **aucun PROFILE secondaire, et c'est une différence assumée avec le self.** Une attention esthétique appréciée ne suffit pas à établir `IMPORTANCE_AESTHETIC` transversal depuis un tiers. Aucun `NEED_RELIEF` sur I2.4.

**Différence avec le self :** le self produit des PROFILE secondaires depuis Q2 ; l'incognito n'en produit aucun.

### I3 — Comment Julie montre son attention

`questionConcept` **affection_given** · adapte QE · base **observed** · multi

> « Et dans l'autre sens : comment {Prénom} montre son attention aux autres ? »

| Code | Option | Mapping | Valeur / strength | Context |
|---|---|---|---|---|
| I3.1 | {Pronom} dit ce qu'{pronom} ressent, complimente ou rassure | `AFFECTION_GIVE_WORDS` | strong | `affection_given` |
| I3.2 | {Pronom} aide et rend service sans qu'on ait besoin de lui demander | `AFFECTION_GIVE_SERVICES` | strong | `affection_given` |
| I3.3 | {Pronom} offre des cadeaux choisis avec soin | `AFFECTION_GIVE_PERSONALIZED_GIFT` | strong | `affection_given` |
| I3.4 | {Pronom} offre des choses qui ont du sens ou une histoire | `AFFECTION_GIVE_SYMBOLIC_GIFT` | strong | `affection_given` |
| I3.5 | {Pronom} passe du vrai temps de qualité avec les gens | `AFFECTION_GIVE_QUALITY_TIME` | strong | `affection_given` |
| I3.6 | {Pronom} a plein de petites attentions au quotidien | `AFFECTION_GIVE_MICRO_ATTENTIONS` | strong | `affection_given` |
| I3.7 | {Pronom} aime faire des surprises | `AFFECTION_GIVE_SURPRISE` | strong | `affection_given` |
| I3.U | Je ne l'ai pas assez vue dans ces situations | `UNKNOWN_BY_REPORTER` | — | — |

**Pourquoi `strong` ici :** la question porte sur un comportement visible, répété, dont le pilote est témoin direct. C'est le cas type de R-I1 — une evidence rapportée peut être forte.

**Pas d'inférence :** aucune symétrie donner / recevoir. Ce que Julie offre ne dit rien de ce qu'elle aime recevoir, et l'inverse non plus.

### I4 — Énergie sociale

`questionConcept` **social_energy** · comportementalise Q5 · base **observed** · choix unique

> « Après une période chargée ou beaucoup de monde, qu'est-ce que {Prénom} semble généralement rechercher ? »

| Code | Option | Mapping | Valeur | Context |
|---|---|---|---|---|
| I4.1 | Un peu de solitude et de calme | `SOCIAL_ENERGY` | 0 | `GLOBAL` |
| I4.2 | Voir quelques personnes proches | `SOCIAL_ENERGY` | 1 | `GLOBAL` |
| I4.3 | Ça dépend vraiment des moments | **aucun** | — | — |
| I4.4 | Retrouver du monde | `SOCIAL_ENERGY` | 3 | `GLOBAL` |
| I4.5 | De l'animation et de l'énergie autour | `SOCIAL_ENERGY` | 4 | `GLOBAL` |
| I4.U | Je préfère ne pas deviner | `UNKNOWN_BY_REPORTER` | — | — |

**`CONTEXT_DEPENDENT` ici : aucune valeur.** *Corrigé le 7 octobre ; la V1 mappait I4.3 vers la valeur 2.* La variabilité contextuelle n'est pas le milieu d'un continuum : une personne peut chercher fortement la solitude dans certains contextes et fortement le social dans d'autres, et la moyenne de ces deux-là ne la décrit pas.

**Et le Dictionnaire ne permet pas d'en décider autrement.** Le §3.3 définit `SOCIAL_ENERGY` comme le continuum `recharge solitaire ←→ recharge sociale`, seul continuum bipolaire conservé, et précise ce qu'il n'indique pas — mais **il ne définit la sémantique d'aucune valeur**, et en particulier pas celle de 2. Rien n'autorise donc à lire 2 comme « variable selon le contexte », et je ne change pas la définition du continuum pour y faire entrer cette réponse. **La valeur 2 n'est produite par aucune option de ce jeu.**

> **Gap signalé, qui dépasse l'incognito.** Le classeur mappe l'option « Ça dépend des jours » de **q5 (self)** vers `SOCIAL_ENERGY = 2`, `primaire`, `GLOBAL_DIRECT`. Cette ligne repose donc sur la même sémantique indéfinie. Voir le §8-A1 : la décision porte sur le Dictionnaire, et elle règle les deux jeux d'un coup.

**Pas de strength :** `SOCIAL_ENERGY` porte une valeur de continuum, pas une strength — le `value` XOR `strength` du modèle s'applique. L'asymétrie épistémique avec le self ne vit donc pas dans la strength mais dans la porte de consolidation, par l'absence du bonus de déclaration de soi.

**Pas d'inférence :** aucun `NEED_RHYTHM_RESPECT`, aucun `PROFILE_OPENNESS`.

### I5 — Stress

`questionConcept` **stress_response** · adapte Q6 · base **observed** · choix unique

> « Quand {Prénom} traverse une période de stress, qu'est-ce que tu observes le plus souvent ? »

| Code | Option | Mapping | Valeur / strength | `evidence.context` | `behaviorContext` |
|---|---|---|---|---|---|
| I5.1 | {Pronom} garde beaucoup pour soi et fait bonne figure | `BEHAVIOR` pattern `internalize` | strong | `stress` | `stress_response` |
| I5.2 | {Pronom} se retire et cherche du calme | `BEHAVIOR` pattern `withdraw_seek_calm` | strong | `stress` | `stress_response` |
| I5.3 | {Pronom} en parle et se confie | `BEHAVIOR` pattern `confide` | strong | `stress` | `stress_response` |
| I5.4 | {Pronom} agit, se met en mouvement | `BEHAVIOR` pattern `take_action` | strong | `stress` | `stress_response` |
| I5.5 | {Pronom} essaie de reprendre la main sur ce qu'{pronom} peut contrôler | `BEHAVIOR` pattern `regain_control` | strong | `stress` | `stress_response` |
| I5.U | Je ne l'ai pas assez vue dans cette situation | `UNKNOWN_BY_REPORTER` | — | — | — |

**Pas d'inférence — et c'est la différence la plus importante avec le self.** **Aucun NEED secondaire.** Observer qu'elle se retire sous stress n'établit pas ce qu'elle veut que les autres fassent. C'est précisément pourquoi I7 existe séparément.

**Différence avec le self :** Q6 produit des NEED secondaires ; I5 n'en produit aucun.

### I6 — Désaccord

`questionConcept` **conflict_response** · adapte Q7 · base **observed** · choix unique

> « Quand {Prénom} est en désaccord avec quelqu'un, {pronom} a plutôt tendance à… »

| Code | Option | Mapping | Valeur / strength | `evidence.context` | `behaviorContext` |
|---|---|---|---|---|---|
| I6.1 | En parler directement | `BEHAVIOR` pattern `address_directly` | strong | `conflict` | `conflict_response` |
| I6.2 | Prendre du temps avant d'en parler | `BEHAVIOR` pattern `pause_before_responding` | strong | `conflict` | `conflict_response` |
| I6.3 | Éviter le conflit autant que possible | `BEHAVIOR` pattern `avoid_conflict` | strong | `conflict` | `conflict_response` |
| I6.4 | Dédramatiser avec l'humour | `BEHAVIOR` pattern `use_humor_to_defuse` | strong | `conflict` | `conflict_response` |
| I6.5 | Écrire plus facilement qu'en parler | `BEHAVIOR` pattern `prefers_writing` | strong | `conflict` | `conflict_response` |
| I6.6 | Ça dépend beaucoup de la personne ou de la situation | aucun | — | — | — |
| I6.U | Je ne l'ai pas assez vue dans cette situation | `UNKNOWN_BY_REPORTER` | — | — | — |

**`CONTEXT_DEPENDENT` ici :** I6.6 est une réponse, et elle produit **zéro mapping** — ce qui n'est pas la même chose que `UNKNOWN`. Elle dit que le comportement varie selon l'interlocuteur, une information réelle qu'aucun pattern unique ne peut porter. Le verbatim et le code de l'option sont conservés, et la question reste ouverte à une relance ultérieure. **Ce n'est pas `PROFILE_ADAPTABILITY` :** adapter sa manière d'aborder un désaccord selon la personne n'est pas une souplesse de fonctionnement général.

### I7 — Ce qui lui fait du bien quand ça ne va pas

`questionConcept` **support_in_distress** · adapte `soutien` · base **observed** · multi, 2 maximum

> « Quand ça ne va pas pour {Prénom}, qu'est-ce qui semble généralement lui faire du bien ? »

**Zéro mapping canonique.** Chaque option produit un `OpenKnowledge` · `type = support_modality` · `relation = appears_to_help` · `context = distress` · `intensity` non renseignée.

| Code | Option | `subject` de l'OpenKnowledge |
|---|---|---|
| I7.1 | Qu'on prenne le temps de l'écouter | `being_listened_to` |
| I7.2 | Recevoir des mots qui rassurent | `reassurance` |
| I7.3 | Recevoir une aide concrète | `practical_help` |
| I7.4 | Avoir quelqu'un simplement là, à côté | `quiet_presence` |
| I7.5 | Avoir un peu d'espace et être tranquille | `space_and_quiet` |
| I7.6 | Ça dépend vraiment des moments | aucun |
| I7.U | Je préfère ne pas deviner | `UNKNOWN_BY_REPORTER` |

**Aucun `NEED`, et la source le commande.** *Corrigé le 7 octobre ; la V1 produisait cinq `NEED` en `primary · strong`.* Le classeur pose que la famille `BEHAVIOR` ne produit un `NEED` que lorsque le besoin est **énoncé en toutes lettres** — les deux seules lignes du socle qui portent à la fois un BEHAVIOR et un NEED sont « me retirer, avoir **besoin** de calme » et « j'**ai besoin** de temps avant d'en parler », et la note dit explicitement : « le besoin y est déclaré, pas déduit du comportement ». Et la frontière `BEHAVIOR ≠ NEED` ajoute : « quand je vais mal, je m'isole » n'implique ni `NEED_FREEDOM` ni `NEED_RHYTHM_RESPECT` ; ces besoins exigent leur propre evidence.

Or I7 mesure **une modalité de soutien observée comme efficace**, pas un besoin énoncé. Produire les cinq `NEED` serait déduire un besoin d'un effet, exactement ce que la source interdit.

**Pourquoi l'asymétrie avec le self est légitime et documentée.** Le self demande à la personne elle-même « qu'est-ce qui t'aide vraiment ? » : répondre « qu'on m'écoute » est une déclaration sur son propre besoin. L'incognito demande à un tiers ce qui **semble** lui faire du bien : c'est un effet constaté de l'extérieur. Même phénomène, deux objets.

**Et ce n'est pas une perte.** « Quand ça ne va pas, l'écoute semble lui faire du bien » est directement actionnable pour une recommandation — plus que `NEED_SEEN_UNDERSTOOD`. C'est la règle du classeur : *une information peut être extrêmement utile à Candice sans être une information de personnalité*. Un `NEED` pourra plus tard être **consolidé** si d'autres evidences le justifient, notamment une déclaration explicite du sujet.

**Poids égaux** entre les options. **L'ordre de sélection ne modifie rien.**

**Le contexte ne quitte jamais la phrase**, et **`distress` ne se traduit jamais en donnée clinique.**

**`CONTEXT_DEPENDENT` ici :** I7.6 est une réponse à zéro production. Le pilote dit que l'aide efficace varie — vrai, et aucune modalité unique ne le porte.

### I8 — Communication

`questionConcept` **communication_style** · comportementalise Q9 · base **observed** · choix unique

> « Quand {Prénom} veut vraiment faire passer quelque chose d'important, comment {pronom} s'exprime le plus naturellement ? »

| Code | Option | Mapping | Valeur / strength | Context |
|---|---|---|---|---|
| I8.1 | {Pronom} va droit au but | `PREFERENCE.communication.style = direct` | strong | `communication` |
| I8.2 | {Pronom} parle facilement de ce qu'{pronom} ressent | `PREFERENCE.communication.style = expressive` | strong | `communication` |
| I8.3 | {Pronom} analyse et explique beaucoup | `PREFERENCE.communication.style = analytical` · **+ `PROFILE_REFLECTIVENESS` +1 `secondary`** | strong · PROFILE +1 secondaire | `communication` |
| I8.4 | {Pronom} garde volontiers de la légèreté ou de l'humour | `PREFERENCE.communication.style = light_humorous` | strong | `communication` |
| I8.5 | {Pronom} écrit plus facilement qu'{pronom} ne parle | `PREFERENCE.communication.channel = written` | strong | `communication` |
| I8.6 | Ça dépend beaucoup du sujet | aucun | — | — |
| I8.U | Je préfère ne pas deviner | `UNKNOWN_BY_REPORTER` | — | — |

**Le seul PROFILE secondaire du jeu fermé, et il est écrit explicitement.** « Elle analyse et explique beaucoup » contient réellement une evidence de réflexivité, mais **locale et secondaire** : `context = communication`, `evidence_role = secondary`, `strength = moderate`. Jamais une conclusion transversale, jamais `GLOBAL`.

**Pas d'inférence :** I8.5 est un canal, pas un trait. Aucun `PROFILE_EXPRESSIVENESS` ailleurs.

### I9 — Grandes décisions

`questionConcept` **decision_process** · adapte Q10 · base **observed** · choix unique

> « Quand {Prénom} doit prendre une décision importante, qu'est-ce que tu observes le plus souvent ? »

| Code | Option | Mapping | Valeur / strength | `evidence.context` | `behaviorContext` |
|---|---|---|---|---|---|
| I9.1 | {Pronom} pèse les pour et les contre | `BEHAVIOR` pattern `weigh_pros_and_cons` | strong | `decision` | `decision_process` |
| I9.2 | {Pronom} fait beaucoup confiance à son instinct | `BEHAVIOR` pattern `trust_instinct` | strong | `decision` | `decision_process` |
| I9.3 | {Pronom} demande l'avis de ses proches | `BEHAVIOR` pattern `consult_close_ones` | strong | `decision` | `decision_process` |
| I9.4 | {Pronom} fait beaucoup de recherches | `BEHAVIOR` pattern `research_thoroughly` | strong | `decision` | `decision_process` |
| I9.5 | {Pronom} attend d'avoir les idées plus claires avant de trancher | `BEHAVIOR` pattern `wait_for_inner_clarity` | strong | `decision` | `decision_process` |
| I9.6 | Ça dépend vraiment de la décision | aucun | — | — | — |
| I9.U | Je ne l'ai pas assez vue dans cette situation | `UNKNOWN_BY_REPORTER` | — | — | — |

**Pas d'inférence :** aucun PROFILE. Le self en produit certains en secondaire ; l'incognito n'en produit aucun, parce qu'observer un processus de décision ne dit pas ce qui le motive.

### I10 — Expression émotionnelle

`questionConcept` **emotional_expression** · adapte Q11 · base **observed** · choix unique

> « Quand quelque chose touche vraiment {Prénom}, comment est-ce que ça s'exprime ? »

| Code | Option | Mapping | Valeur / strength | `evidence.context` | `behaviorContext` |
|---|---|---|---|---|---|
| I10.1 | {Pronom} le dit assez librement | `BEHAVIOR` pattern `openly` | strong | `emotional_expression` | `emotional_expression` |
| I10.2 | {Pronom} en parle surtout à quelques personnes de confiance | `BEHAVIOR` pattern `with_trusted_few` | strong | `emotional_expression` | `emotional_expression` |
| I10.3 | {Pronom} le montre davantage par ses actes que par ses mots | `BEHAVIOR` pattern `through_actions` | strong | `emotional_expression` | `emotional_expression` |
| I10.4 | {Pronom} garde souvent ça pour soi | `BEHAVIOR` pattern `keeps_to_self` | strong | `emotional_expression` | `emotional_expression` |
| I10.5 | {Pronom} en parle plutôt après coup | `BEHAVIOR` pattern `delayed` | strong | `emotional_expression` | `emotional_expression` |
| I10.6 | Ça dépend beaucoup de ce qu'{pronom} vit | aucun | — | — | — |
| I10.U | Je préfère ne pas deviner | `UNKNOWN_BY_REPORTER` | — | — | — |

**Pas d'inférence :** une expression retenue n'est pas une position basse sur un axe d'expressivité. Le pattern est l'information, et il est positif.

> **`keeps_to_self` est le canonical, depuis ton arbitrage du 7 octobre.** L'ancien nom du socle, `rarely_keeps_private`, était une concaténation de « rarely [exprime] » et « keeps private » qui se lisait spontanément comme son contraire — « garde rarement pour soi », donc partage beaucoup. Un développeur qui aurait inversé la logique aurait passé les tests. Renommage appliqué dans `onboarding-v15-mappings.md` et dans le classeur (`Questions fermées V15!I71`, `BEHAVIOR!C30`) ; **reste à propager au code et aux tests des deux jeux.** Un seul canonical, aucun alias.

### I11 — Rapport au temps et à l'organisation

`questionConcept` **time_and_organisation** · adapte Q4a · base **observed** · **choix unique**

> « Dans son quotidien, {Prénom} est plutôt du genre à… »

| Code | Option | Mapping | Valeur | Context |
|---|---|---|---|---|
| I11.1 | Anticiper et planifier volontiers | `PROFILE_STRUCTURE` | +2 | `GLOBAL` |
| I11.2 | Prévoir les grandes lignes puis s'adapter | `PROFILE_STRUCTURE` | +1 | `GLOBAL` |
| I11.3 | Gérer plutôt au fil de l'eau | `PROFILE_STRUCTURE` | −1 | `GLOBAL` |
| I11.4 | Ça dépend vraiment de ce qu'{pronom} organise | **aucun** | — | — |
| I11.U | Je préfère ne pas deviner | `UNKNOWN_BY_REPORTER` | — | — |

*Recomposée le 7 octobre. La V1 mélangeait quatre phénomènes dans une question multi : organisation générale, ponctualité, retard habituel et fatigue de coordination. Elle posait aussi une exclusion mutuelle entre planifier et gérer au fil de l'eau — à tort : on peut réellement anticiper certaines choses et improviser sur d'autres, et ce n'est pas nécessairement une incohérence. Le passage en choix unique supprime le problème sans le déguiser en contradiction d'interface.*

**`GLOBAL` est validé sur cette mesure**, et le classeur le confirme : les lignes 97 et 98 du socle classent « j'anticipe et je planifie à l'avance » et « je gère au fil de l'eau » en `GLOBAL_DIRECT`, sans contexte, parce que la formulation est explicitement transversale. Le stem incognito porte sur le fonctionnement quotidien général : même raisonnement.

**I11.2 est une option nouvelle, sans précédent dans le socle, et sa valeur est arbitrée ici : +1.** Prévoir les grandes lignes est une structuration à gros grain — moins que planifier, plus que subir. Le vocabulaire des valeurs directionnelles n'a pas de zéro, et +1 est la seule lecture fidèle.

**Pas d'inférence sur I11.2 :** **aucun `PROFILE_ADAPTABILITY`.** « Puis s'adapter » décrit un ajustement à **son propre plan**, pas une souplesse face à ce que d'autres imposent. L'adaptabilité ne se mesure qu'en I13.5, où une option l'énonce réellement.

**`CONTEXT_DEPENDENT` ici :** I11.4 est une réponse, à zéro production. Elle dit que la méthode varie selon l'objet organisé — information réelle qu'aucune valeur unique ne porte, et **surtout pas la valeur médiane**.

### I11b — Horaires et ponctualité

`questionConcept` **punctuality** · issue de Q4a · base **observed** · choix unique

> « Sur les horaires, {Prénom} est plutôt… »

| Code | Option | Mapping | Valeur / strength | Context |
|---|---|---|---|---|
| I11b.1 | Très à cheval sur la ponctualité | `PREFERENCE.relational.punctuality = high` | strong | `relationship` |
| I11b.2 | Plutôt à l'heure, sans en faire une règle | `FACT` · `fact_type = habit` · `value` « plutôt ponctuelle, sans en faire une règle » · **`user_confirmed = false`** | — | — |
| I11b.3 | Souvent un peu en retard | `FACT` · `fact_type = habit` · `value` « souvent un peu en retard » · **`user_confirmed = false`** | — | — |
| I11b.4 | Ça dépend vraiment du contexte | **aucun** | — | — |
| I11b.U | Je préfère ne pas deviner | `UNKNOWN_BY_REPORTER` | — | — |

**Question nouvelle, et c'est la réponse à « ne les supprime pas silencieusement ».** La ponctualité et le retard habituel ont une valeur informationnelle réelle et directement actionnable — réserver, convenir d'une heure, prévoir une marge. Mais ils n'ont rien à voir avec `PROFILE_STRUCTURE` : être ponctuel n'est pas être organisé. Les absorber dans I11 était le défaut signalé. Ils vivent donc dans leur propre question, **placée dans le bloc des informations concrètes** et non dans le bloc « comment elle fonctionne ».

**Aucune valeur nouvelle n'est créée, et le modèle avait déjà la bonne représentation.** *Corrigé le 7 octobre ; la version précédente inventait `PREFERENCE.relational.punctuality = moderate`.* Vérification faite dans le classeur : la ligne 100 du socle représente « je suis souvent un peu en retard, sans malice » comme `fact_type = habit` avec une **`value` en texte libre**. L'habitude a donc déjà sa forme, et elle n'est pas bornée par un vocabulaire fermé : « plutôt ponctuelle » s'y écrit sans rien ajouter au contrat.

Et la distinction que tu demandais est ainsi respectée exactement : **I11b.1 est une importance accordée** à la ponctualité — `PREFERENCE.relational.punctuality = high`, comme la ligne 99 du socle — tandis que **I11b.2 et I11b.3 sont des habitudes observées**, deux `FACT habit` de valeurs opposées. Forcer « plutôt ponctuelle » dans la `PREFERENCE` aurait confondu ce qu'elle juge important et ce qu'elle fait.

**Les deux FACT portent `user_confirmed = false`** — R-I6, et c'est la différence avec le socle, dont la ligne 100 porte `true` parce que la personne le déclare d'elle-même.

> **Et le classeur confirme ton diagnostic sur I11, avec une antériorité.** L'onglet des axes dépréciés dit de l'ancien axe `rapportTemps` : « Mélangeait ponctualité, anticipation, planification, fonctionnement au fil de l'eau, prévisibilité… ». C'est exactement le reproche que tu viens de faire à ma question I11. L'axe avait été déprécié pour ce motif, et je l'avais reconstitué sans le voir.

> **La fatigue de coordination sort de l'incognito V1, et ce n'est pas un oubli.** « Trop de choses à organiser ou coordonner semblent vite l'épuiser » est un énoncé d'**impact fonctionnel** sur un tiers, formulé par quelqu'un d'autre — voisin immédiat de la charge mentale et de l'épuisement. La règle 5 écarte la collecte sensible de l'incognito V1, et un tiers qui décrit l'épuisement d'une autre personne est exactement le cas qu'elle vise. **Elle reste dans le questionnaire self**, où la personne le dit d'elle-même. À rouvrir avec la revue privacy, pas avant.

### I12 — Ce qu'elle choisit

`questionConcept` **choice_criteria** · adapte Q4b · base **observed** · multi

> « Dans ce que {Prénom} choisit, achète ou apprécie, qu'est-ce que tu remarques ? »

| Code | Option | Mapping | Valeur / strength | Context · base |
|---|---|---|---|---|
| I12.1 | La qualité compte, même si {pronom} n'en parle pas beaucoup | `PROFILE_EXACTINGNESS` `primary` | +1 | `GLOBAL` · interpretation |
| I12.2 | {Pronom} semble préférer la simplicité authentique au luxe | `IMPORTANCE_AUTHENTICITY` `primary` | +2 | `GLOBAL` · interpretation |
| I12.3 | {Pronom} aime le beau et le raffinement | `IMPORTANCE_AESTHETIC` `primary` +2 · `PROFILE_SENSITIVITY` facette `aesthetic` `primary` +1 | +2 / +1 | `GLOBAL` · observed |
| I12.4 | Le prix semble moins compter que l'intention, surtout pour un cadeau | `PREFERENCE.gift.value_basis = intention_over_price` | strong | `gift` · observed |
| I12.5 | {Pronom} est sensible à certaines marques ou maisons | `PREFERENCE.brands.sensitivity = positive` | strong | `GLOBAL` · observed |
| I12.6 | Les lieux et les expériences d'exception l'attirent | `PREFERENCE.experience.tier = exceptional` | strong | `GLOBAL` · observed |
| I12.U | Je préfère ne pas deviner | `UNKNOWN_BY_REPORTER` | — | — |

**Le contexte `gift` était faux, et la source donne la bonne réponse.** *Corrigé le 7 octobre ; la V1 contextualisait les six options en `gift` alors que le stem ne parle pas de cadeaux.* Le classeur classe les trois lignes de **q4b** — 102, 103 et 104 — en `GLOBAL_DIRECT`, **sans contexte**, avec ce motif : « sous un stem *mon rapport à…* : affirmation générale, aucun domaine ». Ce ne sont donc ni des evidences de cadeau, ni des secondaires : ce sont des affirmations transversales et **primaires**.

Le stem incognito — « dans ce que Julie choisit, achète ou apprécie » — porte sur ses choix en général, exactement comme le stem self. Donc `GLOBAL`, `primary`, et les valeurs du socle reprises à l'identique plutôt que réinventées.

**La seule exception est I12.4**, qui porte `gift` parce que **sa propre formulation le situe** — « surtout pour un cadeau ». Le contexte vient du libellé de l'option, jamais de la commodité.

**La base épistémique est déclarée par option, et non par question.** I12.1 et I12.2 sont des interprétations, et leurs libellés le disent — « même si elle n'en parle pas beaucoup », « elle **semble** préférer » ; les quatre autres sont des régularités directement observables dans ses choix. C'est le raffinement de la règle du §2 : **la question déclare la base par défaut, une option la surcharge quand son propre libellé l'impose.**

**Pas d'inférence :** aucun `APPETENCE_OBJECT`, aucun `APPETENCE_EXPERIENCE` ici — ils viennent de I16. Et aucune evidence sur la fourchette de prix : I12.4 dit ce qui compte dans la valeur, pas combien elle dépense.

### I13 — Quand quelqu'un organise pour elle

`questionConcept` **organised_for_her** · adapte Q4c · base **observed** · choix unique

> « Quand quelqu'un organise quelque chose pour {Prénom}, quelle est la réaction habituelle ? »

| Code | Option | Mapping | Valeur / strength | Context |
|---|---|---|---|---|
| I13.1 | {Pronom} aime savoir à l'avance ce qui est prévu | `PREFERENCE.organised_for_me.surprise_level = none` · **+ `PROFILE_STRUCTURE` +1 `secondary`** | strong · PROFILE +1 secondaire | `organised_for_me` |
| I13.2 | {Pronom} aime connaître l'essentiel mais garder une part de surprise | `PREFERENCE.organised_for_me.surprise_level = partial` | strong | `organised_for_me` |
| I13.3 | {Pronom} adore pouvoir se laisser totalement surprendre | `PREFERENCE.organised_for_me.surprise_level = full` | strong | `organised_for_me` |
| I13.4 | {Pronom} préfère valider certains détails en personne | `IMPORTANCE_MASTERY` +1 | +1 | `organised_for_me` |
| I13.5 | {Pronom} s'adapte facilement à ce qui a été prévu | `PROFILE_ADAPTABILITY` +1 | +1 | `organised_for_me` |
| I13.6 | Ça dépend vraiment de l'occasion | aucun | — | — |
| I13.U | Je préfère ne pas deviner | `UNKNOWN_BY_REPORTER` | — | — |

**`PROFILE_ADAPTABILITY` n'apparaît qu'ici, et parce qu'une option l'énonce réellement** — « elle s'adapte facilement ». C'est la démonstration de R-I3 : l'adaptabilité se mesure quand elle est dite, jamais quand on répond « ça dépend ».

**Le PROFILE secondaire de I13.1 est écrit explicitement**, `secondary` et local à `organised_for_me`.

### I14 — Manière d'interagir avec le pilote

`questionConcept` **contact_preference** · adapte Q4d · base **observed** · choix unique

> « Pour rester en contact avec toi, {Prénom} utilise ou apprécie plutôt… »

| Code | Option | Mapping | Valeur / strength | Context |
|---|---|---|---|---|
| I14.1 | Les appels | `PREFERENCE.communication.channel = call` | strong | `relationship_with_reporter` |
| I14.2 | Les messages écrits | `PREFERENCE.communication.channel = written` | strong | `relationship_with_reporter` |
| I14.3 | Les vocaux | `PREFERENCE.communication.channel = voice` | strong | `relationship_with_reporter` |
| I14.4 | Se voir en personne | `PREFERENCE.communication.channel = in_person` | strong | `relationship_with_reporter` |
| I14.5 | Un peu de tout selon le moment | `PREFERENCE.communication.channel = flexible` | strong | `relationship_with_reporter` |
| I14.U | Je ne sais pas vraiment | `UNKNOWN_BY_REPORTER` | — | — |

**La formulation est volontairement personnalisée — « avec toi » — parce que c'est ce que le pilote connaît réellement.** Et c'est pourquoi le contexte est `relationship_with_reporter` : **jamais une préférence globale**. Julie peut envoyer des vocaux à Estelle et appeler sa mère.

**Noter que I14.5 est une vraie valeur du vocabulaire** (`flexible`), pas un « ça dépend » sans mapping : ici la variabilité **est** la préférence déclarée du canal.

**Pas d'inférence :** aucune généralisation vers `PREFERENCE.communication.channel` global, et aucun lien avec I8.5 — écrire plus facilement qu'on ne parle quand c'est important n'est pas le canal habituel avec un proche.

### I15 — Surprises à éviter

`questionConcept` **surprise_guardrails** · adapte Q18 · base **reporter_interpretation** · multi

> « Parmi ces surprises, lesquelles risqueraient vraiment de mettre {Prénom} mal à l'aise ou de lui déplaire ? »

| Code | Option | Mapping | Sévérité | Scope · Context |
|---|---|---|---|---|
| I15.1 | Une surprise devant beaucoup de monde | `GRD_PUBLIC_EXPOSURE` | **SOFT** | `execution` · `surprise` |
| I15.2 | Une surprise qui bouleverse son planning | `GRD_SCHEDULE_DISRUPTION` | **SOFT** | `execution` · `surprise` |
| I15.3 | Une surprise très intime ou émotionnellement intense | `GRD_SENTIMENTAL_OVERLOAD` | **SOFT** | `execution` · `surprise` |
| I15.4 | Une surprise mal organisée | `GRD_POOR_EXECUTION` | **SOFT** | `execution` · `surprise` |
| I15.5 | À ma connaissance, rien de tout ça ne poserait vraiment problème | aucun | — | — |
| I15.U | Je préfère ne pas deviner | `UNKNOWN_BY_REPORTER` | — | — |

**La différence la plus importante du jeu : aucun `HARD` automatique.** Dans le self, « le type de surprise que je détesterais » est une déclaration du sujet et justifie `HARD`. Ici, le pilote **estime** ce que Julie détesterait : la sévérité vient de ce qui est réellement exprimé, et une case cochée dans une formulation prudente est un `SOFT`. R-I4.

**Le `HARD` reste atteignable, par une autre porte** : un propos explicite rapporté — « elle m'a dit dix fois : surtout jamais de surprise devant des gens » — le soutient, avec base `subject_statement`. Cette porte est le champ libre L7, pas cette question.

**Le contexte reste `surprise`.** Ces guardrails ne contraignent que les surprises, jamais toute attention. Et le grain de consolidation inclut le contexte : `GRD_PUBLIC_EXPOSURE @ surprise` ne devient jamais un guardrail de sélection global.

**I15.5 est une réponse, pas une absence** — le pilote affirme quelque chose de positif. Zéro mapping tout de même : « plutôt partante » ne produit aucune evidence, ni positive ni négative. Verbatim et code conservés.

### I16 — Cadeaux

`questionConcept` **gift_appetence** · fusionne Q13 et Q14 · base **reporter_interpretation** · multi

> « D'après ce que tu connais de {Prénom}, qu'est-ce qui a le plus de chances de lui faire plaisir comme cadeau ? »

| Code | Option | Mapping | Valeur / strength | Context |
|---|---|---|---|---|
| I16.1 | Une expérience à vivre | `APPETENCE_EXPERIENCE` +1 | +1 | `gift` |
| I16.2 | Un objet qu'{pronom} pourra garder | `APPETENCE_OBJECT` +1 | +1 | `gift` |
| I16.3 | Quelque chose d'utile et bien pensé | `IMPORTANCE_FUNCTIONAL` +1 · `DRV_UTILITY` | +1 · DRV moderate | `gift.material` |
| I16.4 | Quelque chose de beau et de qualité | `IMPORTANCE_AESTHETIC` +1 · `DRV_AESTHETIC` · `DRV_QUALITY` | +1 · DRV moderate | `gift.material` |
| I16.5 | Quelque chose de très personnel, qui montre qu'on a vraiment écouté | `DRV_PERSONALIZATION` · `DRV_ATTENTIVENESS` | moderate | `gift` |
| I16.6 | Quelque chose de symbolique ou chargé de sens | `DRV_SYMBOLISM` | moderate | `gift` |
| I16.7 | Les objets comme les expériences peuvent très bien marcher | aucun | — | — |
| I16.U | Je préfère ne pas deviner | `UNKNOWN_BY_REPORTER` | — | — |

**I16.7 est une réponse à zéro mapping.** Elle dit l'absence de préférence entre objet et expérience — ce qui n'est **pas** `APPETENCE_OBJECT` et `APPETENCE_EXPERIENCE` tous deux à +1. Poser les deux fabriquerait deux appétences là où le pilote énonce une indifférence.

**Pas d'inférence :** aucun `PROFILE_SENSITIVITY` sur I16.4 — le self le produit depuis une déclaration de soi, pas la perception d'un tiers.

---

## 5 · Ce que l'incognito ne demande pas

Trois questions du self ne sont **pas** transposées, et l'information est récupérée autrement.

**Q4 — « Entre deux attentions, je préfère… »** Retirée. Elle re-mesure I1 et I2 et oblige le pilote à arbitrer à la place de Julie.

**Q8 — « Dans une relation, ce dont j'ai le plus besoin… »** Retirée. Demander « de quoi Julie a-t-elle le plus besoin dans une relation » est exactement la psychologisation que le jeu refuse. L'information se récupère par ses comportements (I5, I6, I10), par ce qui semble l'aider (I7), par ce qui la touche (I1) et par ses propos rapportés (champs libres).

**Q19 — « Ce qui me blesse le plus dans une relation… »** Retirée du socle. Même avec « d'après toi », elle demande de hiérarchiser les blessures intérieures d'un tiers. Elle est remplacée par le champ libre **L7**, qui demande un propos réel.

---

## 6 · Moteurs, radar, champs libres

### Moteurs — `life_priority`

`questionConcept` **life_priorities** · base **reporter_interpretation** · multi · **facultatif, en fin de parcours**

> « Qu'est-ce que Julie semble vraiment choisir de mettre au centre de sa vie ? »

Options : sa famille et ses proches · sa liberté · apprendre et découvrir · construire des projets ou accomplir des choses · prendre soin des autres · contribuer ou transmettre · autre · je préfère ne pas deviner.

**Zéro mapping canonique, exactement comme le self.** Une priorité de vie n'est pas un besoin psychologique. Production : `OpenKnowledge` · `type = life_priority` · `relation = appears_to_matter_to` · `context = GLOBAL` · `sourceType = reported_by_relative` · `assertionBasis = reporter_interpretation`.

**`assertionStatus` n'est pas `declared`** — Julie n'a rien déclaré. Il vaut `explicit` au sens du nouveau contrat : explicite dans la source, c'est-à-dire que le pilote l'a bien affirmé, et non inféré par Candice.

**Et la confiance reste basse.** C'est la question la plus interprétative du jeu, d'où son caractère facultatif et sa position finale.

### Radar d'intérêts

> « Parmi ces univers, lesquels tu sais intéresser Julie ? »
> *« Coche seulement ceux dont tu es assez sûr(e). Tu pourras toujours en ajouter plus tard. »*

**Radar initial des 15 catégories actuellement définies, plus « Autre ».** Ce n'est pas une taxonomie fermée des intérêts : l'ontologie `INTEREST` reste open-world et aucun enum ne la referme.

Une sélection produit : `INTEREST` · `strength = moderate` · **`relationship` absent** · `context = GLOBAL` · `sourceType = reported_by_relative` · `assertionBasis = observed`.

**Aucune passion, aucune expertise, aucune pratique inférée.** Une non-sélection est `UNKNOWN`, jamais une absence d'intérêt.

### Les sept champs libres

Ils restent au questionnaire même sans extracteur. **À la V1, le verbatim est conservé avec sa provenance et ne produit aucune evidence structurée.** Le verbatim reste la source primaire et n'est **jamais** remplacé par son extraction.

| Code | Formulation | Extraction visée, plus tard |
|---|---|---|
| L1 | Il y a un sujet dont Julie peut parler pendant des heures, ou qui l'enthousiasme vraiment ? | `INTEREST` · `OpenKnowledge` · `ENTITY` |
| L2 | Qu'est-ce que tu sais que Julie adore faire pendant son temps libre ? | `INTEREST` · `OpenKnowledge` |
| L3 | Tu te souviens d'un cadeau, d'une surprise ou d'un moment qui a vraiment fait plaisir à Julie ? Qu'est-ce qui avait particulièrement marché ? | `DRIVER` · `ENTITY` · `OpenKnowledge` — base `observed` |
| L4 | Quels petits détails ou attentions as-tu déjà vu faire particulièrement plaisir à Julie ? | `DRIVER` · `AFFECTION` — base `observed` |
| L5 | Y a-t-il des marques, objets ou produits que tu sais que Julie aime particulièrement ? | `ENTITY` · `PREFERENCE` |
| L6 | Est-ce que Julie a parlé récemment de quelque chose qu'{pronom} aimerait avoir, faire, découvrir ou essayer ? | `OpenKnowledge` · `ENTITY` — base `subject_statement`, pont vers le Carnet d'envies |
| L7 | Y a-t-il quelque chose que Julie t'a déjà dit ne vraiment pas aimer, ou qui lui fait vraiment de la peine ? | `GUARDRAIL` · `PREFERENCE` — base `subject_statement`, **seule porte vers un `HARD`** |

**L3 est le champ le plus riche du jeu** : le pilote raconte un cas réel, observé, avec sa réaction. Il porte simultanément l'attention, l'objet ou l'expérience, la personnalisation, les personnes présentes, le symbolique, le timing, la surprise, le contexte et la réaction constatée.

**Chaque champ libre porte sa base épistémique**, donnée dans le tableau : L6 et L7 demandent un propos de Julie, L3 et L4 une observation. Cette base devra être transmise à l'extraction, qui ne la recalcule pas.

### Informations pratiques

Le pilote peut connaître factuellement : prénom, date de naissance, profession, animaux, dates importantes, rôle familial, tailles, régime alimentaire, rapport à l'alcool, adresse lorsqu'elle est légitimement connue.

**Ces informations ne demandent aucune psychologisation**, et chacune porte une sortie « je ne sais pas » au même code `UNKNOWN_BY_REPORTER`.

**Le prénom est saisi à la création de la fiche**, avant l'affichage des questions : les formulations l'insèrent.

**Le prénom et le genre sont saisis à la création de la fiche**, avec le lien du proche au pilote — avant l'affichage de la première question.

**Le genre n'est pas collecté pour résoudre un problème de grammaire.** Il l'est parce que la fiche d'un proche le porte déjà : la colonne `gender` existe sur `contacts` depuis la migration 20, appliquée. L'accord grammatical en découle, il ne le justifie pas.

**Le pronom et le prénom sont deux variables, et le document porte un jeton pour chacune.** `{Prénom}` dans les énoncés de question, `{Pronom}` en tête de phrase et `{pronom}` ailleurs. *Jeton `{Prénom}` posé le 9 octobre : les dix-sept énoncés portaient le prénom en littéral — « Julie » — alors que la règle le déclarait variable. L'écart obligeait le code à deviner, ce qu'il a eu raison de signaler plutôt que de trancher.* Les deux jetons se résolvent à l'affichage, au même endroit du code :

```
gender = 'femme'                          → elle
gender = 'homme'                          → il
gender ∈ {non_binaire, non_precise, NULL} → le prénom
```

« {Pronom} se retire et cherche du calme » s'affiche *Elle se retire…* pour Julie, *Il se retire…* pour Paul, *Camille se retire…* sinon. **Une seule autorité textuelle, une seule règle de rendu, aucune seconde écriture du questionnaire.**

**Les titres de question du §4 — « I3 — Comment Julie montre son attention » — sont des étiquettes internes, pas des verbatims.** Ils ne s'affichent pas, ils ne portent pas de jeton, et ils ne sont pas transcrits.

**Le jeton est résolu avant l'écriture**, jamais stocké tel quel : la couche source conserve le texte **exact affiché**, donc le prénom et le pronom y figurent résolus.

> **Et aucune phrase du jeu ne porte d'accord sur la personne décrite.** C'est l'invariant qui rend la règle sûre, et il a été vérifié chaîne par chaîne plutôt que supposé. Vingt-six formulations ont été réécrites pour l'obtenir : les pronoms inversés — « montre-t-elle » —, les pronoms objets — « tu la vois faire » —, les disjonctifs — « pour elle », « près d'elle », « elle-même » —, et neuf accords — « stressée », « attachée », « ponctuelle », « seule », « partante », « écoutée », « rassurée », « attirée ». Quatre-vingt-douze formulations gardent leur rédaction d'origine, le jeton près. *La vingt-sixième est I1.7, « La surprendre avec quelque chose d'inattendu », devenue « Lui réserver quelque chose d'inattendu » — seul marqueur de genre qui avait survécu à la passe du 7 octobre, donc mon chiffre de vingt-cinq était faux d'une unité.*
>
> **Conséquence : un prénom épicène ne pose aucun problème.** « Camille se retire et cherche du calme » est juste quel que soit le genre, parce que rien dans la phrase ne s'accorde avec Camille.
>
> **Les pronoms objets `lui`, `l'` et `le` restent et sont justes** : ils ne portent pas le genre en français — « Lui dire des mots sincères », « prendre le temps de l'écouter », « {Pronom} le dit assez librement » valent pour une femme comme pour un homme. Ils ne sont **pas** à neutraliser ni à transformer en jeton. De même, les « Elle » des libellés de I2 désignent **l'attention**, nom féminin, et non la personne décrite : « Elle arrive au bon moment » est juste pour Paul.
>
> Les accords qui subsistent portent tous sur des noms communs : « une **période chargée** », « une surprise mal **organisée** », « une **décision importante** », et dans « {Pronom} est **belle** et choisie avec goût » le sujet est **l'attention**, pas la personne. De même, les « Y a-t-il » des champs libres sont impersonnels.

> **Une vérification à faire avant implémentation**, et elle n'est pas de nature éditoriale : le genre est-il **obligatoire** à la création de la fiche, ou peut-il rester vide ? S'il peut rester vide, un écran sur deux devient bancal, et il faut soit le rendre obligatoire, soit décider ce qui s'affiche sans lui. Je n'ai pas lu le formulaire de création : **à constater, pas à supposer.**

### Données sensibles — absentes de la V1

**Aucune collecte dédiée** de santé, diagnostic, handicap ou mobilité médicale, allergies, sexualité, religion, opinions politiques, origine ethnique, biométrie ou donnée sensible équivalente.

Le plafond de sensibilité résout l'**exposition**, pas la **collecte**. Un champ marqué « à revoir » qui part en production est parti.

**Doctrine d'extraction à consigner dès maintenant :** une donnée sensible écrite spontanément par le pilote dans un champ libre **ne doit pas être automatiquement transformée en connaissance structurée exploitable**. Le verbatim est conservé avec sa provenance ; sa structuration demande une politique spécifique, à écrire avant que l'extracteur ne tourne.

---

## 7 · Doctrines fixées maintenant, implémentées plus tard

### Consolidation

**Pas de coefficient numérique caché, pas de règle `self > reported` mécanique, pas d'écrasement silencieux.**

La consolidation doit pouvoir raisonner sur la provenance, la base épistémique, la directivité et le rôle, la strength, le contexte, la fraîcheur lorsqu'elle est pertinente, la stabilité, les contradictions et l'indépendance des evidences.

**Une information rapportée n'écrase jamais silencieusement une déclaration directe du sujet. Et une déclaration directe du sujet ne supprime pas automatiquement une observation contraire d'un proche.** Une contradiction peut être une vraie connaissance, à conserver.

Cette doctrine appartient à la consolidation, **jamais à la reco**. Un consommateur reçoit ce que Candice sait, déjà qualifié.

### Indépendance et filiation des evidences

**Deux acquisitions ne sont pas nécessairement deux observations indépendantes.** Julie dit X à Estelle, Estelle le rapporte à Candice, puis Julie déclare X elle-même : il peut s'agir d'une seule information d'origine.

Le modèle ne doit pas rendre cette filiation impossible à représenter demain. **Vérification faite : il ne la rend pas impossible.** Chaque evidence porte son `source_id`, chaque source porte son `about`, son `sourceType` et désormais sa base épistémique ; le verbatim d'origine est conservé dans `raw_information`. Une evidence de base `subject_statement` est donc déjà identifiable comme le rapport d'un propos, ce qui est la condition minimale pour ne pas la compter comme une observation indépendante.

**Aucun scoring n'est construit maintenant.** Mais la porte de confiance actuelle — deux evidences primaires indépendantes — ne doit pas être atteinte par une evidence `subject_statement` et la déclaration ultérieure du sujet sur le même construct, et c'est à l'implémentation du §7 de `consolidation-rules` de le garantir.

### Si Julie rejoint Candice

**Aucun merge implicite Contact ↔ Account.** La résolution d'identité est explicite, jamais devinée.

Les réponses du pilote restent `reported_by_relative`. Les réponses ultérieures de Julie sont `declared`. Elles peuvent converger, se compléter ou se contredire ; **aucune n'est réécrite comme si elle venait de l'autre**.

**Et connaissance et visibilité restent séparées** : le fait que Julie rejoigne Candice ne signifie pas qu'elle voit ce qu'Estelle avait écrit sur elle.

### Correction et évolution

Si le pilote corrige plus tard une information, **on ne réécrit pas silencieusement l'histoire**. Le système doit conserver la provenance et l'historique, invalider ou superséder l'ancienne connaissance, et utiliser la nouvelle comme connaissance actuelle.

### Principe d'ingénierie transversal

Quand l'arrivée d'un nouveau `sourceType`, contexte, construct, base épistémique ou état exige une décision sémantique, **le système échoue explicitement tant que cette décision n'a pas été prise**. Pas de fallback permissif, pas de `?? GLOBAL`, pas de « tout nouveau `sourceType` est auto-déclaré », pas de mapping implicite. **Unknown reste unknown.**

---

## 8 · Passe de fermeture

Tout point arbitrable a été tranché. Ce qui reste est classé.

### B — doctrine fixée, implémentation ultérieure

| Point | Doctrine | Lot |
|---|---|---|
| Extraction des sept champs libres | verbatim source primaire, jamais remplacé ; base épistémique transmise, pas recalculée | moteur d'extraction |
| Donnée sensible spontanée en champ libre | pas de structuration automatique ; politique spécifique à écrire avant que l'extracteur tourne | moteur d'extraction |
| Filiation des evidences | une `subject_statement` et la déclaration ultérieure du sujet ne font pas deux confirmations indépendantes | §7 `consolidation-rules` |
| Résolution des contradictions | ni coefficient caché, ni `self > reported`, ni écrasement silencieux ; une contradiction est conservable | consolidation |
| Correction et supersession | historique conservé, ancienne connaissance invalidée ou supersédée, jamais réécrite | consolidation |
| Résolution d'identité Contact ↔ Account | explicite, jamais implicite ; provenances conservées | Espace Proche |
| Audit `user_confirmed` sur les 128 mappings du self | tout champ présumant une confirmation du sujet est invalide en mode rapporté | avant le code incognito |

### A — tranché le 7 octobre, parce que c'était arbitrable

| Point | Décision |
|---|---|
| I7 | zéro `NEED` ; `OpenKnowledge` `support_modality` · `appears_to_help` · `distress`. La source commande : un `NEED` exige que le besoin soit énoncé, pas déduit d'un effet |
| I4.3 | `CONTEXT_DEPENDENT`, **aucune** valeur `SOCIAL_ENERGY` |
| I11 | recomposée en choix unique, quatre options, `GLOBAL` conservé ; l'exclusion mutuelle est supprimée |
| I11.2 | valeur `PROFILE_STRUCTURE` **+1**, arbitrée ici faute de précédent au socle |
| I11b | question nouvelle pour la ponctualité et le retard, placée dans le bloc des informations concrètes |
| I11b.2 | `FACT` `fact_type = habit` à valeur libre — **aucune valeur nouvelle créée**, la représentation existait |
| I12 | contexte `GLOBAL` et evidences `primary`, valeurs du socle reprises ; `gift` conservé sur la seule option qui se situe elle-même |
| Base épistémique | déclarée par question **et surchargeable par option** quand le libellé de l'option l'impose |
| Fatigue de coordination | sortie de l'incognito V1, conservée dans le self |
| Genre | non obligatoire pour des raisons de copywriting |

### A1 — arbitrages du 7 octobre qui dépassent l'incognito, appliqués

**`SOCIAL_ENERGY = 2` signifie recharge mixte, équilibre entre solitude et interaction sociale.** Ce n'est pas l'indétermination. Donc « Ça dépend des jours » ne produit plus cette valeur — **ni en self, ni en incognito** —, et le Dictionnaire doit porter cette définition, qui lui manquait.

Conséquence assumée sur le self, appliquée dans `onboarding-v15-mappings.md` et `onboarding-v15-clos.md` : **58 evidences PROFILE au lieu de 59, 10 `GLOBAL_DIRECT` au lieu de 11.** *Les chiffres de contrôle suivent la sémantique, jamais l'inverse.*

Le wording de l'option 38 n'est **pas** modifié dans ce sous-lot. Si un jour le self doit mesurer explicitement la position médiane, il faudra une option qui l'exprime réellement — « autant de l'un que de l'autre », et non « ça dépend des jours », qui dit la variabilité.

**`rarely_keeps_private` est renommé `keeps_to_self`.** Un seul canonical, aucun alias permanent, aucune cohabitation. Appliqué dans `onboarding-v15-mappings.md`, dans le classeur (`Questions fermées V15!I71`, `BEHAVIOR!C30`) et dans le §4 de ce document ; **reste à propager au code et aux tests des deux jeux.**

**La collecte du genre** n'est légitime que si le catalogue d'attentions la réclame. **Non vérifié**, à confirmer avant implémentation.

### C — réellement indéterminable aujourd'hui

**Un seul point, et l'information qui manque est nommée.**

**Le seuil de reconnaissance d'une évolution sans déclaration explicite.** Combien de mentions, sur quelle fenêtre, pour qu'une variation devienne une évolution — la règle sémantique est déjà fixée (une mention faible à côté d'une déclaration forte est une variation, pas une évolution ; un déclin énoncé est une évolution), mais le seuil numérique ne peut pas être calibré avant d'avoir **un volume réel de réponses multi-sources sur un même construct**. Aucune donnée de ce type n'existe : les sept tables sont vides et l'extraction n'existe pas. Calibrer maintenant produirait un chiffre inventé.

### Points soumis à ton arbitrage avant implémentation

Trois choix que j'ai tranchés et qui méritent ton accord explicite, parce qu'ils s'écartent d'un précédent du self.

1. **`assertionBasis` comme troisième axe** et son vocabulaire à quatre valeurs, `self_report` inclus pour que le champ n'ait ni optionalité ni défaut.
2. **I11 conserve `GLOBAL` sur `PROFILE_STRUCTURE`** alors que les PROFILE de I12 sont locaux et secondaires. Le motif : la question porte sur le quotidien entier, pas sur une situation.
3. **L'exclusion mutuelle de I11.1 et I11.2** côté interface, plutôt qu'une tension consolidée.

---

## 9 · Chiffres de contrôle

Dérivés par script depuis ce document, jamais comptés à la main.

*Re-dérivés le 7 octobre après les corrections. Aucun chiffre de la version précédente n'est conservé.*

**Deux grandeurs distinctes, et c'est la confusion des deux qui a produit un chiffre faux.** *Rectifié le 9 octobre, sur un signalement de Claude Code.* Un `grep` sur tout le fichier compte des **lignes** ; trois options — I4.3, I11.2, I11b.2 — sont re-mentionnées dans des tables récapitulatives hors §4 et comptent donc deux fois. Les **options distinctes** se dérivent du §4 seul, et ce sont elles qui gouvernent la transcription.

| Grandeur | Lignes (tout le fichier) | Options distinctes (§4 seul) |
|---|---|---|
| Questions fermées | **17** | **17** |
| Options | **118** | **115** |
| dont actives | **101** | **98** |
| dont sorties d'incertitude | **17** | **17** |
| actives à zéro production | 11 | **11** |
| produisant un `OpenKnowledge` seul | 5 | **5** |
| produisant un `FACT` seul | 2 | **2** |
| **productrices d'evidence** | ~~83~~ | **80** |
| Champs libres | **7** | **7** |
| Règles transversales | **6** | **6** |

**Le 83 était faux** : il soustrayait des zéros comptés une fois d'un total de lignes qui en comptait trois de trop. Le chiffre juste est **80**, et il se dérive du §4 seul :

```python
sec = doc[doc.index('## 4 · Les dix-sept') : doc.index('## 5 · Ce que')]
rows   = [l for l in sec.split('\n') if re.match(r'^\| I\d+b?\.[0-9U]', l)]      # 115
act    = [r for r in rows if not code(r).endswith('.U')]                          # 98
zero   = [r for r in act if cell(r,2) in ('aucun','**aucun**')]                   # 11
ok     = I7.1…I7.5                                                                # 5
fact   = I11b.2, I11b.3                                                           # 2
# 98 − 11 − 5 − 2 = 80
```

**Les deux colonnes sont à vérifier.** La colonne « lignes » est la garde du document — elle détecte une option ajoutée n'importe où. La colonne « options distinctes » est la garde du code — c'est elle que la conformité compare à la transcription. Un écart entre les deux colonnes supérieur à trois signale une nouvelle duplication dans un récapitulatif.

| Commandes de la colonne « lignes » | |
|---|---|
| Questions fermées | `grep -cE "^### I[0-9]+b? — "` |
| Options | `grep -cE "^\| I[0-9]+b?\.[0-9U]"` |
| dont actives | `grep -cE "^\| I[0-9]+b?\.[0-9]"` |
| dont sorties d'incertitude | `grep -cE "^\| I[0-9]+b?\.U"` |
| zéro production | `grep -cE "^\| I[0-9]+b?\.[0-9].*\| (aucun\|\*\*aucun\*\*) \|"` |
| Champs libres | `grep -cE "^\| L[0-9] \|"` |
| Règles transversales | `grep -cE "^\*\*R-I[0-9]"` |

**Une sortie d'incertitude par question fermée : 17 pour 17.** Invariant vérifiable d'un coup d'œil, et son échec signalerait une question sans porte de sortie.

**Les 11 options actives à zéro production** sont les `CONTEXT_DEPENDENT` de I4, I6, I7, I8, I9, I10, I11, I11b et I13, plus I15.5 « plutôt partante » et I16.7 « les deux peuvent marcher ». Ce sont des **réponses**, pas des absences : code et verbatim conservés, aucune production. I4.3 en fait désormais partie.

**Évolution depuis la V1 du document** — 16 → 17 questions, 111 → 118 lignes, 87 → **80** options productrices d'evidence. La baisse vient de I7, qui produit désormais de la connaissance ouverte et non cinq `NEED` · de I4.3 qui ne produit plus de valeur · et de I11b.2 qui produit un `FACT` et non une `PREFERENCE`. La hausse du total vient de I11b.

### Chiffres du self corrigés par l'arbitrage sur `SOCIAL_ENERGY`

L'option 38 du socle ne produit plus d'evidence. Re-dérivé depuis `onboarding-v15-mappings.md`, pas recompté à la main :

| Grandeur | Avant | Après |
|---|---|---|
| Evidences PROFILE actives | 59 | **58** |
| dont `GLOBAL_DIRECT` | 11 | **10** |
| dont `LOCAL/CONTEXTUAL` | 48 | 48 |
| Blocs d'option | 128 | 128 |
| Options `ACTIF` | 106 | 106 |

```python
# blocs = re.split(r'(?=^### Option )', mappings, flags=M)[1:]
# pour chaque bloc au status ACTIF, compter les lignes '    - `PROFILE_|SOCIAL_ENERGY|APPETENCE_|IMPORTANCE_'
# → 128 blocs · 106 ACTIF · 58 evidences = 10 GLOBAL_DIRECT + 48 LOCAL/CONTEXTUAL
```

Claude Code doit **re-dériver ces huit chiffres** depuis ce fichier et s'arrêter sur tout écart.

Les chiffres du jeu incognito sont **séparés du 19 / 106 du self** et ne doivent jamais être agrégés avec eux. L'espace de noms des codes d'option — `I*.*` contre numérique — rend le mélange détectable.
