## Architecture de connaissance, règles de raisonnement et de consolidation (HSG) Human signal graph

### Version consolidée — référence fonctionnelle

## Rôle de ce document

Ce document définit **comment Candice transforme les informations recueillies en connaissance exploitable sur une personne**.

Il décrit :

- comment une information brute devient une evidence ;
- quand une information doit également être conservée comme FACT ;
- comment une evidence produit zéro, un ou plusieurs signaux ;
- comment les signaux sont contextualisés ;
- comment ils sont consolidés dans le temps ;
- comment gérer les contradictions, évolutions, variations contextuelles et tensions ;
- comment distinguer observation, inférence et UNKNOWN ;
- comment représenter les comportements contextuels ;
- comment réduire progressivement les zones UNKNOWN ;
- comment choisir les prochaines questions utiles ;
- comment produire un portrait riche sans réduire la personne à ses tags ;
- comment cette connaissance alimente les recommandations et les attentions.

Ce document **ne définit pas le vocabulaire canonique détaillé de Candice**.

La liste officielle des familles, constructs, codes, définitions et frontières sémantiques appartient au **Dictionnaire canonique Candice — Human Signal Graph**.

En cas de divergence :

> **Le Dictionnaire canonique fait foi sur le sens des concepts. Le présent document fait foi sur leur utilisation, leur contextualisation et leur consolidation.**
> 

Le HSG existant avait déjà cette séparation fondamentale et définissait le Discovery comme une extension du même modèle de connaissance que l’Onboarding.

---

# 1. CONTEXTE

Candice est un copilote relationnel basé sur un Human Signal Graph.

Son objectif n’est pas de produire une fiche statique ou un questionnaire de personnalité.

Il est de construire progressivement une compréhension suffisamment juste d’une personne pour :

- mieux la comprendre ;
- personnaliser la manière dont Candice interagit avec elle ;
- identifier les informations qui manquent réellement ;
- choisir intelligemment les prochaines micro-questions ;
- recommander des cadeaux, expériences, gestes et attentions adaptés ;
- expliquer pourquoi une recommandation semble pertinente ;
- adapter une attention à un contexte de vie précis ;
- éviter les erreurs relationnelles importantes ;
- continuer à apprendre dans le temps.

L’Onboarding constitue **le premier apport de connaissance**, pas la vérité définitive sur la personne.

Le Discovery enrichit ensuite cette connaissance progressivement.

---

# 2. PÉRIMÈTRE DU HSG

Le Human Signal Graph ne s’applique pas uniquement aux réponses fermées du questionnaire.

Il constitue **le modèle général de connaissance de Candice**.

Toute information autorisée concernant une personne peut entrer dans le HSG, notamment :

- réponse fermée ;
- réponse ouverte ;
- texte libre ;
- conversation ;
- déclaration explicite ;
- récit ou anecdote ;
- correction ou nuance apportée par l’utilisateur ;
- information renseignée sur un proche ;
- wishlist / Carnet d’envies ;
- envie repérée ;
- information contextuelle ;
- comportement ou signal observé lorsque le produit permet légitimement de l’observer ;
- autre source autorisée ultérieurement.

Toutes ces sources doivent pouvoir alimenter **la même architecture de connaissance**.

Candice ne doit pas disposer d’un « profil Onboarding », d’un « profil Discovery » et d’une mémoire conversationnelle séparés qui ne communiquent pas.

> **Une personne = un graphe de connaissance évolutif alimenté par plusieurs sources.**
> 

---

# 3. LES 10 FAMILLES CANONIQUES

Le HSG utilise les 10 familles définies par le Dictionnaire :

1. `INTEREST`
2. `PREFERENCE`
3. `PROFILE`
4. `AFFECTION_LANGUAGE`
5. `NEED`
6. `DRIVER`
7. `BEHAVIOR`
8. `GUARDRAIL`
9. `ENTITY`
10. `CONTEXT`

Le HSG ne redéfinit pas leurs codes ni leurs frontières.

Il applique les définitions du Dictionnaire.

Deux autres objets existent en dehors de ces familles :

### FACT

Information possédant une valeur propre et devant être conservée même lorsqu’elle ne produit aucun signal canonique.

FACT n’est pas une 11e famille.

### ONTOLOGY_GAP

Mécanisme de contrôle indiquant qu’un phénomène récurrent et opérationnellement important ne peut pas être correctement représenté par l’architecture existante.

ONTOLOGY_GAP n’est pas une famille.

---

# 4. PRINCIPE FONDAMENTAL : NE RIEN PERDRE

Une information pertinente exprimée par une personne ne doit jamais disparaître simplement parce qu’elle :

- ne produit aucun PROFILE ;
- ne produit aucun NEED ;
- ne correspond à aucun DRIVER ;
- n’a pas de code fermé prévu à l’avance ;
- est trop spécifique ;
- est narrative ;
- est contextuelle ;
- est inattendue.

Le HSG doit pouvoir conserver simultanément :

- ce que la personne a réellement dit ;
- les faits qui en découlent directement ;
- les evidences extraites ;
- les signaux structurés éventuellement produits ;
- les inférences consolidées ;
- les implications opérationnelles.

> **Structurer une information ne doit jamais conduire à détruire l’information source.**
> 

---

# 5. STRUCTURE GÉNÉRALE D’UNE EVIDENCE

Chaque evidence doit être identifiable individuellement.

Structure de référence :

`evidence_id`

`source_id`

`source_type`

`raw_information`

`target_family`

`target_construct`

`value`

`strength`

`confidence`

`context`

`timestamp`

`stability`

`evidence_role`

Lorsque pertinent :

`direction`

`modality`

`severity`

`scope`

`trigger`

`pattern`

`entity_id`

`fact_id`

`notes`

Les attributs inutiles pour une evidence donnée restent absents.

Le modèle ne doit pas remplir artificiellement tous les champs.

---

# 5.1 Force de l’evidence

Pour les constructs où une direction positive ou contraire est pertinente, utiliser notamment :

`+2` = evidence directe et forte ;

`+1` = evidence directe mais modérée ;

- `1` = evidence contraire modérée explicitement exprimée ;
- `2` = evidence contraire forte explicitement exprimée.

Le document source prévoyait déjà cette logique mais avait perdu visuellement les signes « − » sur les deux valeurs contraires.

Ces valeurs représentent :

> **la force et la direction de l’evidence**
> 

et non :

> **un verdict définitif sur la personne.**
> 

`0` n’est pas une evidence neutre.

L’absence d’evidence produit :

`UNKNOWN`

et non :

`0`, `LOW` ou une evidence négative.

Exception : lorsqu’un construct est lui-même défini comme continuum et que `0` possède une signification sémantique propre, comme `SOCIAL_ENERGY`, la valeur `0` peut évidemment exister sur ce continuum.

---

# 5.2 Stabilité

Lorsque pertinent :

`stability = stable | evolving | contextual | temporary`

### stable

L’information semble durable.

### evolving

Elle semble évoluer dans le temps.

### contextual

Elle dépend clairement d’un contexte.

### temporary

Elle correspond à un état ou une période momentanée.

Ne jamais transformer automatiquement une information récente en caractéristique stable.

---

# 5.3 Confidence

`strength` et `confidence` sont deux notions différentes.

**Strength** répond à :

> À quel point cette evidence soutient-elle directement le signal ?
> 

**Confidence** répond à :

> À quel point Candice peut-elle faire confiance à cette interprétation ?
> 

Une réponse explicite peut être forte et très fiable.

Une inférence indirecte peut être cohérente mais de confiance plus faible.

---

# 6. EVIDENCE ≠ CONCLUSION

Une réponse ne devient pas immédiatement une vérité sur la personne.

Elle produit d’abord une **evidence**.

Cette evidence peut produire :

- aucun signal ;
- un signal ;
- plusieurs signaux conceptuellement distincts.

Les signaux sont ensuite consolidés.

Pour PROFILE notamment :

> **une seule réponse ne doit généralement pas suffire à établir une caractéristique transversale forte.**
> 

Le système doit toujours pouvoir répondre :

> **Qu’est-ce que cette réponse démontre précisément pour ce construct ?**
> 

Si la justification est floue :

> **ne pas produire le signal.**
> 

---

# 7. CHAÎNE DE CONNAISSANCE

La chaîne générale est :

> **SOURCE**
> 
> 
> ↓
> 
> **INFORMATION BRUTE**
> 
> ↓
> 
> **FACT**, lorsque l’information possède une valeur propre
> 
> ↓
> 
> **EVIDENCE(S)**
> 
> ↓
> 
> **SIGNAL/S HSG**, lorsqu’ils sont justifiés
> 
> ↓
> 
> **CONSOLIDATION**
> 
> ↓
> 
> **COMPRÉHENSION / INFÉRENCE**
> 
> ↓
> 
> **IMPLICATION OPÉRATIONNELLE**
> 

Le HSG source posait déjà ce principe : toutes les informations ne parcourent pas nécessairement toute la chaîne et une information peut être opérationnellement utile sans inférence psychologique.

Cette chaîne n’est donc **pas un pipeline obligatoire**.

Plusieurs raccourcis sont légitimes.

---

# 7.1 FACT → implication opérationnelle directe

Exemple :

> « Je me déplace en fauteuil roulant. »
> 

FACT :

`mobility = wheelchair`

Implication opérationnelle :

> filtrer les expériences selon leur accessibilité réelle.
> 

Aucun PROFILE, NEED ou DRIVER n’est nécessaire.

---

# 7.2 FACT → GUARDRAIL → implication

> « Je suis allergique aux noix. »
> 

FACT :

allergie déclarée aux noix.

GUARDRAIL :

allergène noix

`severity = HARD`

Implication :

> éliminer toute recommandation incompatible.
> 

---

# 7.3 FACT sans inférence

> « Je suis TDAH. »
> 

FACT déclaré.

Aucun PROFILE, BEHAVIOR, NEED ou GUARDRAIL ne doit être automatiquement produit.

Si la personne ajoute :

> « Les endroits très bruyants m’épuisent rapidement. »
> 

c’est une nouvelle information.

Elle peut produire :

- un impact fonctionnel déclaré ;
- éventuellement un GUARDRAIL bruit selon la formulation ;
- des implications opérationnelles.

Mais jamais :

> « TDAH → donc elle fonctionne forcément ainsi. »
> 

---

# 7.4 Information imprévue

> « J’ai vécu dix ans au Japon et cette période compte énormément pour moi. »
> 

Candice peut conserver :

FACT → dix années vécues au Japon ;

ENTITY → Japon ;

CONTEXT → histoire de vie / ancienne résidence ;

éventuellement `DRV_MEMORY` si la formulation démontre réellement la dimension mémorielle.

La phrase source reste conservée.

---

# 8. CONTEXTE : PORTÉ PAR L’EVIDENCE

Le contexte ne doit pas être attribué mécaniquement en fonction de la question dans laquelle une réponse apparaît.

Il appartient à **l’evidence**.

Pour chaque evidence, le système doit se demander :

> **La formulation justifie-t-elle une conclusion transversale ou seulement une conclusion située ?**
> 

---

# 8.1 Evidence explicitement transversale

> « J’aime tout organiser très en avance. »
> 

Peut produire :

`PROFILE_STRUCTURE`

`context = GLOBAL`

car la formulation elle-même est générale.

---

# 8.2 Evidence située

> « Quand je voyage, j’aime savoir longtemps à l’avance où je vais dormir. »
> 

Peut produire une evidence sur `PROFILE_STRUCTURE` avec :

`context = travel.accommodation`

Cela ne devient pas automatiquement :

`PROFILE_STRUCTURE GLOBAL`.

---

# 8.3 GLOBAL consolidé

Plusieurs evidences contextualisées indépendantes peuvent éventuellement permettre une consolidation transversale.

Exemple :

structure élevée dans :

- travel ;
- home ;
- work ;
- organization.

Avec suffisamment de convergence, Candice peut consolider progressivement une compréhension plus globale.

Il faut distinguer :

`GLOBAL_DIRECT`

d’une evidence directement transversale,

et :

`GLOBAL_CONSOLIDATED`

d’une conclusion transversale obtenue par convergence.

Cette provenance doit rester traçable.

---

# 9. OBSERVATION, INFÉRENCE ET UNKNOWN

Candice distingue toujours trois niveaux.

## OBSERVATION

Ce que l’information indique directement.

## INFÉRENCE

Ce que plusieurs observations suffisamment fortes et convergentes permettent raisonnablement de comprendre.

## UNKNOWN

Ce que Candice ne sait pas encore avec suffisamment de confiance.

Une inférence peut être légitime sans avoir été formulée explicitement par la personne.

Mais elle doit être :

- traçable ;
- suffisamment soutenue ;
- contextualisée ;
- accompagnée d’un niveau de confiance ;
- révisable ;
- sensible aux contradictions et évolutions.

> **Mieux vaut UNKNOWN qu’une fausse connaissance.**
> 

---

# 9.1 Pas d’inférences cliniques

Candice peut progressivement inférer des éléments non cliniques concernant :

- fonctionnement ;
- besoins ;
- moteurs ;
- sensibilités ;
- arbitrages ;
- comportements ;
- dynamiques relationnelles.

Elle ne doit jamais diagnostiquer ou pseudo-diagnostiquer à partir de ces informations.

Ne jamais inférer notamment :

- TDAH ;
- autisme ;
- trouble de l’attachement ;
- narcissisme ;
- trauma ;
- pathologie ;
- autre catégorie clinique assimilable.

Une condition explicitement déclarée peut être conservée comme FACT.

Elle ne permet pas d’en déduire automatiquement ses conséquences.

---

# 10. FACT

Un FACT est créé lorsqu’une information possède une valeur propre indépendamment des signaux qu’elle pourrait produire.

Structure de référence :

`fact_id`

`fact_type`

`value`

`source`

`timestamp`

`context`

`confidence`

`sensitivity`

`user_confirmed`

`evidence_ids`

Lorsque nécessaire :

`subject`

`relation`

`effect`

---

# 10.1 Le FACT ne disparaît jamais

Si un FACT produit ensuite un signal, le fait source reste conservé.

Exemple :

> « La charge mentale m’épuise vite. »
> 

FACT :

`fact_type = functional_impact`

`subject = mental_load`

`relation = causes`

`effect = rapid_exhaustion`

Cela peut directement produire une implication :

> éviter les attentions qui ajoutent beaucoup de coordination, de décisions ou de logistique lorsqu’elles sont censées aider.
> 

Cela ne produit pas automatiquement :

`NEED_RELIEF`.

---

# 10.2 FACT sensible

Pour les informations sensibles, conserver explicitement le statut de déclaration.

Par exemple :

`assertion_status = user_declared`

ne signifie pas :

`medically_verified`.

Le système ne doit jamais présenter une information déclarée comme une vérification indépendante.

---

# 11. CONNAISSANCE OUVERTE STRUCTURÉE

Le HSG doit pouvoir apprendre une quantité sémantiquement illimitée d’informations sans créer une ontologie infinie.

Le principe est :

> **vocabulaire canonique contrôlé pour les mécanismes transversaux + connaissance descriptive ouverte pour le reste.**
> 

Structure possible :

`type`

`subject`

`relation`

`intensity`

`context`

`source`

Exemple :

> « Je suis passionné de photographie argentique. »
> 

Plutôt que créer :

`ANALOG_PHOTO_LOVER`

stocker :

`type = INTEREST`

`subject = photographie argentique`

`relation = passion`

`strength = strong`

Le système doit réutiliser les sujets normalisés lorsqu’ils existent, sans perdre la formulation précise.

---

# 12. BEHAVIOR — RÈGLES DE RAISONNEMENT

BEHAVIOR est utilisé lorsqu’une information décrit **comment la personne tend à agir ou réagir dans une situation identifiable**.

Le contexte est obligatoire.

Structure minimale :

`family = BEHAVIOR`

`context`

`pattern`

`strength`

`confidence`

`stability`

`source`

`evidence_ids`

Lorsque pertinent :

`trigger`

`target`

---

# 12.1 Exemple stress

> « Quand je suis stressée, je cherche à contrôler ce que je peux. »
> 

Produit :

`BEHAVIOR`

`context = stress_response`

`pattern = regain_control`

Cela ne produit pas automatiquement :

`NEED_REASSURANCE`.

---

# 12.2 Exemple conflit

> « En désaccord, j’essaie de dédramatiser avec l’humour. »
> 

Produit :

`BEHAVIOR`

`context = conflict_response`

`pattern = use_humor_to_defuse`

Cela ne produit pas automatiquement :

`NEED_LIGHTNESS`

ou :

`DRV_PLAYFULNESS`.

---

# 12.3 Exemple expression émotionnelle

> « Je préfère garder les choses légères, avec humour. »
> 

Peut produire :

`BEHAVIOR`

`context = emotional_expression`

`pattern = keep_it_light_with_humor`

---

# 12.4 Exemple décision

> « Avant une décision importante, je fais beaucoup de recherches. »
> 

Peut produire :

`BEHAVIOR`

`context = decision_process`

`pattern = extensive_research`

et éventuellement une evidence secondaire vers :

`PROFILE_REFLECTIVENESS`

si le mapping validé le justifie.

Les deux informations ne sont pas redondantes :

- BEHAVIOR conserve ce que la personne fait ;
- PROFILE contribue à comprendre son fonctionnement transversal.

---

# 12.5 BEHAVIOR n’est jamais globalisé mécaniquement

Une personne peut :

- chercher ses proches lorsqu’elle est triste ;
- s’isoler lorsqu’elle est en colère ;
- demander des solutions lorsqu’elle est stressée ;
- éviter la discussion lorsqu’elle est épuisée.

Ce sont des comportements contextualisés.

Ils ne doivent pas être aplatis en un unique :

> « elle cherche du soutien »
> 

ou :

> « elle s’isole ».
> 

---

# 12.6 Utilité opérationnelle de BEHAVIOR

BEHAVIOR peut modifier :

- le canal ;
- le timing ;
- le degré d’intrusion ;
- le type d’attention ;
- le niveau de sollicitation ;
- la quantité de décisions demandées ;
- la présence d’autres personnes ;
- la manière de proposer une aide ;
- la manière de relancer ;
- la façon de célébrer ou de soutenir.

Cette couche devient particulièrement importante dans des situations telles que :

- deuil ;
- maladie ;
- rupture ;
- conflit ;
- stress ;
- épuisement ;
- échec ;
- transition de vie ;
- décision difficile.

Deux personnes ayant le même NEED peuvent nécessiter des comportements relationnels très différents.

---

# 13. AFFECTION_LANGUAGE

Les evidences `AFFECTION_LANGUAGE` doivent conserver explicitement :

`direction = receive | give`

et :

`modality`

Les modalités RECEIVE et GIVE sont consolidées séparément.

Ne jamais déduire :

`GIVE → RECEIVE`

ou :

`RECEIVE → GIVE`.

Plusieurs modalités peuvent être simultanément élevées.

Absence d’evidence :

`UNKNOWN`

et non :

`LOW`.

---

# 13.1 Cadence affective

La cadence éventuelle est conservée séparément :

`affection_cadence = regular_micro | rare_marking | contextual | unknown`

Elle ne constitue ni une modalité affective supplémentaire, ni automatiquement un PROFILE.

---

# 13.2 AFFECTION_LANGUAGE n’implique pas NEED

> « Je me sens aimé quand quelqu’un m’offre quelque chose pensé spécialement pour moi »
> 

peut produire :

`AFFECTION_RECEIVE_PERSONALIZED_GIFT`

et éventuellement :

`DRV_PERSONALIZATION`.

Cela ne produit pas automatiquement :

`NEED_SEEN_UNDERSTOOD`

ou :

`NEED_LOVED_MATTER`.

Le NEED nécessite sa propre evidence.

---

# 14. NEED — PARCIMONIE

Les NEED doivent être utilisés avec davantage de parcimonie que les préférences ou informations descriptives.

Une réponse produit un NEED lorsqu’elle renseigne réellement :

- un état recherché ;
- une vulnérabilité ;
- un manque ;
- une condition relationnelle importante ;
- quelque chose dont l’absence semble réellement affecter la personne.

Éviter les mappings tautologiques.

Exemple :

> « J’aime qu’on me soutienne. »
> 

ne suffit pas nécessairement à établir fortement `NEED_SUPPORT`.

Le système doit chercher à savoir si le soutien constitue réellement une condition émotionnelle importante.

---

# 14.1 BEHAVIOR ≠ NEED

> « Quand ça ne va pas, j’appelle mes proches »
> 

décrit un comportement.

Cela ne démontre pas automatiquement :

`NEED_CONNECTION`

ou :

`NEED_SUPPORT`.

Une micro-question ultérieure peut justement explorer :

> « Quand tu traverses une période difficile, qu’est-ce qui t’aide réellement de la part de tes proches ? »
> 

Le comportement peut donc **déclencher la découverte du besoin**, sans que le besoin soit inféré prématurément.

---

# 15. DRIVER — RÈGLE DE JUSTIFICATION

Un DRIVER ne doit être produit que lorsque l’evidence renseigne réellement **pourquoi quelque chose résonne**.

Le moteur ne doit jamais mapper un DRIVER uniquement parce qu’un mot correspondant apparaît dans la phrase.

Exemple :

> « Des mots sincères me touchent. »
> 

La sincérité qualifie les mots.

Cela ne suffit pas nécessairement à produire `DRV_AUTHENTICITY`.

En revanche :

> « Peu importe que ce soit simple, ce qui compte c’est que ce soit sincère »
> 

peut réellement produire ce DRIVER.

---

# 16. GUARDRAIL

Chaque GUARDRAIL doit conserver :

`guardrail_code`

`severity = SOFT | HARD`

`scope = selection | execution | context`

`context`

`confidence`

`source`

`evidence_ids`

---

# 16.1 Severity appartient à l’evidence

Le code ne détermine jamais automatiquement la sévérité.

Le même guardrail peut être :

SOFT pour une personne ;

HARD pour une autre.

### SOFT

> « Je préfère éviter. »
> 

> « Ce n’est pas tellement mon truc. »
> 

Conséquence :

> pénalité forte ou prudence.
> 

### HARD

> « Je déteste ça. »
> 

> « Surtout pas. »
> 

> « Jamais. »
> 

> « Je refuse. »
> 

ou contrainte réelle :

> allergie, impossibilité d’accès, etc.
> 

Conséquence :

> exclusion de toute recommandation incompatible dans le contexte concerné.
> 

Ainsi, une réponse sélectionnée sous un stem explicitement formulé :

> « Quel type de surprise détesterais-tu ? »
> 

peut légitimement produire un guardrail HARD.

---

# 16.2 Scope

### selection

Contrainte sur **ce que Candice peut proposer**.

### execution

Contrainte sur **la manière de réaliser l’attention**.

### context

Contrainte valable dans une situation particulière.

Exemple :

`GRD_POOR_EXECUTION`

peut être :

`severity = HARD`

`scope = execution`

Cela ne signifie pas :

> éliminer toutes les surprises.
> 

Cela signifie :

> une surprise n’est pertinente que si Candice peut garantir un niveau d’exécution compatible.
> 

---

# 16.3 HARD domine un match positif incompatible

Une recommandation peut correspondre parfaitement à plusieurs intérêts, préférences et drivers.

Si elle viole un guardrail HARD pertinent :

> **elle est éliminée.**
> 

Le moteur ne doit jamais « compenser » une contrainte HARD par un score positif élevé.

---

# 17. EVIDENCE PRIMAIRE ET SECONDAIRE

Une réponse peut mesurer principalement un phénomène tout en fournissant une information secondaire sur un autre.

Le HSG original prévoyait déjà explicitement cette distinction.

Exemple :

une réponse portant sur la réception affective peut produire :

**evidence primaire**

`AFFECTION_LANGUAGE`

et éventuellement :

**evidence secondaire**

`APPETENCE_OBJECT +1`

si la réponse contient réellement cette information.

Une evidence secondaire :

- peut enrichir un construct ;
- peut contribuer à une consolidation ;
- doit généralement être moins forte ;
- ne doit généralement pas suffire seule à établir une conclusion transversale forte.

Le système doit distinguer :

> **ce que la question cherche principalement à mesurer**
> 

de :

> **tout ce que la réponse permet raisonnablement d’apprendre.**
> 

---

# 18. MULTI-MAPPING

Une même information peut légitimement produire plusieurs signaux lorsque ceux-ci représentent des informations conceptuellement différentes.

Exemple :

> « J’adore qu’on me trouve un objet exactement dans mon style. »
> 

peut renseigner :

- une préférence concrète ;
- `AFFECTION_RECEIVE_PERSONALIZED_GIFT` si le contexte est affectif ;
- `DRV_PERSONALIZATION` ;
- éventuellement `APPETENCE_OBJECT`.

Ce n’est pas du double comptage si chaque signal répond à une question différente.

En revanche :

> **ne jamais multiplier les signaux parce que plusieurs concepts semblent vaguement compatibles.**
> 

---

# 19. CONSOLIDATION

La consolidation transforme plusieurs evidences et signaux en compréhension plus stable.

Elle tient notamment compte :

- du nombre d’evidences ;
- de leur force ;
- de leur indépendance ;
- de leur qualité ;
- de la diversité des sources ;
- de la diversité des contextes ;
- de leur répétition ;
- de leur cohérence ;
- de leurs contradictions ;
- de leur temporalité ;
- de leur stabilité ;
- de leur spécificité ;
- du niveau de confiance.

Le HSG ne doit pas réduire la consolidation à :

> **additionner des points.**
> 

Deux personnes ayant le même score brut peuvent avoir des niveaux de confiance et des profils d’evidence très différents. Cette règle figurait déjà explicitement dans le document source.

---

# 19.1 Convergence

Plusieurs evidences indépendantes allant dans le même sens augmentent généralement :

- la confiance ;
- la stabilité ;
- éventuellement la portée transversale.

Mais dix formulations issues d’une même source ne valent pas nécessairement dix observations indépendantes.

Le moteur doit éviter le faux effet de volume.

---

# 19.2 Pas de fausse précision

Les scores internes peuvent être nécessaires au calcul.

Ils ne doivent pas être présentés comme une mesure psychométrique précise de la personne.

La compréhension finale doit refléter :

- force ;
- confiance ;
- contexte ;
- nuances ;
- exceptions ;
- tensions ;
- évolution.

---

# 20. DIVERGENCES ET CONTRADICTIONS

Le système ne doit jamais chercher artificiellement à rendre la personne parfaitement cohérente.

Le document HSG source distinguait déjà quatre phénomènes qui ne doivent pas être confondus.

---

# 20.1 Variation contextuelle

La personne fonctionne différemment selon les situations.

Exemple :

`APPETENCE_PREMIUM.hotel = HIGH`

`APPETENCE_PREMIUM.everyday_object = LOW`

Aucune contradiction.

---

# 20.2 Évolution

La personne a changé dans le temps.

Une evidence ancienne ne doit pas nécessairement être supprimée.

Elle peut être conservée avec :

`stability = evolving`

et sa temporalité.

---

# 20.3 Contradiction d’evidence

Deux evidences semblent réellement incompatibles.

Le moteur :

- ne tranche pas arbitrairement ;
- conserve les deux ;
- ajuste la confiance ;
- peut déclencher une micro-question de clarification si l’information est utile.

---

# 20.4 Tension structurante

Deux caractéristiques fortes coexistent et influencent les arbitrages.

Exemple :

forte `APPETENCE_SPONTANEITY`

- 

forte `IMPORTANCE_MASTERY`

peut conduire à comprendre :

> la personne apprécie l’imprévu lorsqu’elle conserve la maîtrise des paramètres qu’elle juge importants.
> 

Une tension structurante :

> **ne se résout jamais par une moyenne.**
> 

Elle peut être plus informative que chacun des deux signaux pris séparément.

---

# 20.5 Asymétrie relationnelle

Une asymétrie entre RECEIVE et GIVE n’est ni une contradiction ni une tension à résoudre.

Exemple :

`AFFECTION_RECEIVE_WORDS = HIGH`

`AFFECTION_GIVE_SERVICES = HIGH`

C’est une information relationnelle normale et potentiellement très utile.

---

# 20.6 Divergence BEHAVIOR

Deux comportements différents ne sont contradictoires que s’ils concernent réellement :

- le même contexte ;
- une période comparable ;
- des conditions comparables.

> cherche de la présence lorsqu’elle est triste
> 

et :

> s’isole lorsqu’elle est en colère
> 

= variation contextuelle.

Pas contradiction.

---

# 21. CORRECTIONS UTILISATEUR

Une correction explicite de l’utilisateur possède une importance particulière.

Exemple :

Candice infère :

> « Tu sembles aimer les surprises. »
> 

L’utilisateur répond :

> « Non, uniquement les toutes petites surprises. Je déteste qu’on modifie mes plans. »
> 

Le système doit :

- conserver la correction ;
- diminuer ou invalider l’inférence trop large ;
- contextualiser le signal surprise ;
- éventuellement produire un guardrail sur la perturbation du planning ;
- ne pas continuer à présenter l’ancienne conclusion comme vraie.

Les corrections explicites ont priorité sur une inférence antérieure incompatible.

---

# 22. DISCOVERY ENGINE

Le Discovery n’a pas pour objectif de remplir toutes les cases.

Son rôle est de :

1. confirmer ce qui mérite de l’être ;
2. nuancer ;
3. contextualiser ;
4. découvrir des intérêts et préférences ;
5. identifier les mécanismes de résonance ;
6. comprendre les besoins lorsqu’ils sont réellement démontrés ;
7. découvrir les modalités affectives ;
8. identifier les comportements utiles ;
9. découvrir les guardrails ;
10. recueillir des entités concrètes ;
11. comprendre le contexte de vie ;
12. réduire intelligemment certaines zones UNKNOWN ;
13. résoudre certaines contradictions ;
14. acquérir l’information nécessaire à une recommandation ;
15. découvrir ce que nous n’avions pas anticipé.

---

# 23. NIVEAUX A / B / C DU DISCOVERY

Le HSG source définissait déjà les trois niveaux comme orientation, mécanisme et précision/action.

## A — ORIENTATION

Objectif :

> déterminer rapidement si un territoire est pertinent et dans quelle direction l’explorer.
> 

Caractéristiques :

- faible friction ;
- forte valeur informationnelle ;
- peu intrusif ;
- permet souvent de décider si la branche mérite d’être approfondie.

A n’est pas « superficiel ».

---

## B — APPROFONDISSEMENT / MÉCANISME

Objectif :

> comprendre pourquoi, comment, dans quelles conditions et avec quelles nuances.
> 

Peut être particulièrement utile pour :

- PROFILE ;
- NEED ;
- DRIVER ;
- BEHAVIOR ;
- récit personnel ;
- compréhension du portrait.

B ne doit être posé que si A ou une autre information rend l’approfondissement pertinent.

---

## C — PRÉCISION / ACTION

Objectif :

> obtenir l’information nécessaire pour agir correctement.
> 

Souvent particulièrement utile pour :

- PREFERENCE ;
- INTEREST ;
- ENTITY ;
- DRIVER ;
- GUARDRAIL ;
- contexte précis de recommandation.

C n’est pas automatiquement plus psychologique que B.

Certaines questions C peuvent n’être pertinentes **qu’au moment d’une recommandation réelle** et ne doivent pas nécessairement appartenir au Discovery permanent.

---

# 24. OUVERTURE DES BRANCHES

Chaque branche Discovery doit définir explicitement :

`scope = universal | conditional`

Si universelle :

`always_eligible = true`

mais :

> **universelle ne signifie pas poser toutes les questions à tout le monde.**
> 

Si conditionnelle :

> au moins un signal crédible doit justifier son ouverture.
> 

---

# 24.1 Types de déclencheurs possibles

Une branche peut être ouverte ou priorisée à partir de :

- `INTEREST` ;
- `ENTITY` ;
- `CONTEXT` ;
- `PROFILE` lorsqu’il est réellement pertinent ;
- `AFFECTION_LANGUAGE` ;
- `NEED` ;
- `DRIVER` ;
- `BEHAVIOR` ;
- `GUARDRAIL` ;
- FACT ;
- connaissance descriptive ouverte ;
- réponse précédente dans la branche ;
- mot ou sujet détecté dans un texte libre ;
- événement ;
- contexte de recommandation ;
- information donnée par un proche ;
- demande explicite de l’utilisateur.

---

# 24.2 Required trigger ≠ priority boost

Une branche conditionnelle peut avoir :

### REQUIRED TRIGGER

Condition nécessaire pour l’ouvrir.

### PRIORITY BOOST

Information qui augmente son intérêt sans être nécessaire.

Cette distinction doit être explicite.

Exemple :

une branche animaux peut exiger :

> animal présent / intérêt animaux / mention spontanée crédible.
> 

Un `PROFILE_RELATIONALITY` élevé ne constitue pas à lui seul un déclencheur crédible.

---

# 24.3 Ne pas ouvrir par stéréotype

Ne jamais ouvrir une branche à partir d’une association approximative.

Exemples :

pointure connue ≠ intérêt chaussures ;

parent ≠ intérêt décoration enfant ;

TDAH déclaré ≠ besoin de stimulation ;

animal-loving ≠ propriétaire d’un animal ;

premium élevé ≠ intérêt luxe.

---

# 25. INTEREST ET OUVERTURE

INTEREST constitue une couche centrale du Discovery.

Exemple :

`INTEREST`

`subject = Formula 1`

`relationship = passion`

peut rendre une branche Formula 1 éligible.

Mais l’ouverture ne dépend pas uniquement d’INTEREST.

Un ENTITY, un FACT, un projet ou une envie explicite peuvent également suffire.

---

# 26. MICRO-QUESTIONS : PRINCIPE DE SÉLECTION

La prochaine question n’est pas choisie parce qu’elle est « la suivante dans le fichier ».

Elle doit être choisie en fonction de sa **valeur informationnelle et opérationnelle attendue**.

Le moteur peut notamment considérer :

- information encore UNKNOWN ;
- confidence faible ;
- contradiction à résoudre ;
- intérêt récemment détecté ;
- contexte de vie nouveau ;
- opportunité de recommandation ;
- événement à venir ;
- entité à préciser ;
- guardrail important à confirmer ;
- comportement utile dans une situation sensible ;
- information ouverte susceptible d’ouvrir un territoire riche ;
- coût / friction de la question ;
- sensibilité de la question ;
- répétition avec ce que Candice sait déjà.

---

# 26.1 Ne pas poser ce que Candice sait déjà

Si l’information est suffisamment fiable et récente :

> ne pas reposer mécaniquement la même question.
> 

Une question similaire peut néanmoins être légitime si elle apporte :

- une nuance ;
- un contexte différent ;
- un mécanisme ;
- une précision opérationnelle.

**Similarité de formulation ≠ redondance informationnelle.**

---

# 26.2 Stop rule

Chaque branche doit avoir une condition d’arrêt.

Le moteur s’arrête lorsque Candice possède suffisamment d’information pour remplir **l’objectif de connaissance de la branche**.

Il ne s’arrête pas parce qu’un nombre arbitraire de questions a été atteint.

> **Knowledge acquired > question count.**
> 

Une branche peut donc s’arrêter après 2 questions pour une personne et nécessiter 6 questions pour une autre.

---

# 27. QUESTIONS OUVERTES

Les réponses ouvertes ne doivent jamais être traitées comme un simple résidu difficile à structurer.

Elles peuvent être parmi les sources les plus riches du HSG.

Pour chaque réponse ouverte :

### Étape 1 — comprendre la réponse dans son ensemble

Ne pas commencer par chercher des tags.

### Étape 2 — identifier les unités d’information

Par exemple :

- personnes ;
- lieux ;
- objets ;
- préférences ;
- rejets ;
- souvenirs ;
- comportements ;
- motivations ;
- besoins explicitement exprimés ;
- contextes ;
- temporalité ;
- intérêts ;
- contraintes ;
- émotions ;
- envies.

### Étape 3 — conserver la réponse brute

Toujours.

### Étape 4 — créer les FACT utiles

Lorsque l’information possède une valeur autonome.

### Étape 5 — produire les signaux canoniques justifiés

Zéro, un ou plusieurs.

### Étape 6 — conserver les informations descriptives non couvertes

Sans inventer de construct psychologique.

---

# 27.1 Une réponse ouverte peut ne produire aucun PROFILE

Et rester extrêmement utile.

Exemple :

> « Je pourrais parler pendant des heures de photo argentique japonaise des années 1970. »
> 

Cette réponse peut nourrir :

- INTEREST ;
- ENTITY ;
- Discovery ;
- recommandation ;
- portrait.

Elle n’a pas besoin de produire PROFILE pour être précieuse.

---

# 28. PORTRAIT : DOUBLE LECTURE

Le portrait est un output distinct de la structuration machine.

Pour comprendre et raconter une personne :

> **la donnée brute reste primaire.**
> 

Les tags, scores, evidences et consolidations servent à guider :

- la saillance ;
- la confiance ;
- la convergence ;
- la contextualisation ;
- les tensions ;
- ce qui peut raisonnablement être affirmé.

Mais le portrait doit relire :

- toutes les réponses brutes pertinentes ;
- les textes libres ;
- les anecdotes ;
- les récits ;
- les corrections ;
- les nuances ;
- les contradictions ;
- les FACT ;
- les informations qui n’ont produit aucun signal canonique.

---

# 28.1 Le portrait n’est pas une traduction de scores

Interdit :

`PROFILE_RELATIONALITY élevé`

→

> « Tu es très relationnel. »
> 

Le portrait doit synthétiser les evidences et leur sens.

Deux personnes ayant le même score peuvent avoir des portraits différents parce que :

- leurs evidences diffèrent ;
- leurs contextes diffèrent ;
- leurs tensions diffèrent ;
- leur histoire diffère ;
- leur niveau de confiance diffère.

---

# 28.2 Langage prudent

Lorsque la connaissance est inférée :

préférer :

> « Tu sembles accorder beaucoup d’importance à… »
> 

> « Plusieurs de tes réponses suggèrent que… »
> 

> « Dans certaines situations, tu as l’air de… »
> 

plutôt que :

> « Tu es… »
> 

lorsque le niveau de certitude ne justifie pas une affirmation absolue.

---

# 28.3 Tensions dans le portrait

Les tensions ne doivent pas être supprimées.

Exemple :

> « Tu apprécies l’imprévu, mais surtout lorsque tu gardes la main sur ce qui compte vraiment pour toi. »
> 

peut être beaucoup plus juste que :

> « Tu es spontanée »
> 

ou :

> « Tu aimes contrôler ».
> 

---

# 29. RECOMMANDATION : DEUX SOURCES DE CONNAISSANCE

Le moteur de recommandation doit exploiter simultanément :

### A. Les informations spécifiques

Exemples :

- aime la photographie argentique ;
- adore tel restaurant ;
- souhaite visiter Kyoto ;
- déteste la coriandre ;
- possède déjà tel objet ;
- rêve de tel sac ;
- a un enfant de tel âge.

### B. Les mécanismes structurés

Exemples :

- personnalisation ;
- symbolisme ;
- esthétique ;
- utilité ;
- besoin de liberté ;
- modalités affectives ;
- comportement sous stress ;
- guardrails.

Une recommandation excellente combine souvent les deux.

> **La connaissance spécifique indique quoi proposer.Les mécanismes indiquent pourquoi et comment cela peut résonner.**
> 

---

# 30. PIPELINE DE MATCHING

Le moteur doit raisonner en plusieurs couches.

## Étape 1 — Compatibilité dure

Vérifier :

- HARD guardrails ;
- contraintes ;
- allergies ;
- accessibilité ;
- incompatibilités contextuelles ;
- faisabilité.

Une incompatibilité HARD élimine le candidat.

---

## Étape 2 — Compatibilité spécifique

Vérifier :

- INTEREST ;
- PREFERENCE ;
- ENTITY ;
- envies ;
- contexte ;
- connaissances descriptives.

---

## Étape 3 — Compatibilité comportementale

Lorsque le contexte le justifie :

- BEHAVIOR ;
- niveau d’intrusion ;
- canal ;
- timing ;
- degré de sollicitation ;
- mode d’aide.

---

## Étape 4 — Résonance

Vérifier notamment :

- DRIVER ;
- AFFECTION_LANGUAGE ;
- NEED réellement établis ;
- orientations PROFILE pertinentes.

---

## Étape 5 — Guardrails SOFT et exécution

Pénaliser ou adapter selon :

- aversions ;
- style ;
- niveau d’exécution requis ;
- contraintes non éliminatoires.

---

## Étape 6 — Explicabilité

Candice doit pouvoir expliquer :

> **Pourquoi cette attention semble pertinente pour cette personne maintenant ?**
> 

Cette explication doit être traçable aux informations réelles du graphe.

---

# 31. BEHAVIOR DANS LES MOMENTS SENSIBLES

Dans une situation comme :

- décès ;
- maladie ;
- rupture ;
- épuisement ;
- conflit ;
- difficulté professionnelle ;

Candice ne doit pas seulement chercher :

> « quel cadeau aime cette personne ? »
> 

Elle doit considérer :

1. le contexte actuel ;
2. les FACT pertinents ;
3. les comportements connus dans des situations comparables ;
4. les besoins réellement établis ;
5. les guardrails ;
6. le degré d’intrusion acceptable ;
7. le canal approprié ;
8. le timing.

Exemple :

### Personne A

`NEED_SUPPORT`

- 

`BEHAVIOR.distress_response = withdraw`

Une attention adaptée peut être :

> aide concrète + message sans obligation de répondre.
> 

### Personne B

`NEED_SUPPORT`

- 

`BEHAVIOR.distress_response = seek_connection`

Une attention adaptée peut être :

> appel, présence ou proposition concrète de venir.
> 

Même NEED.

Action différente.

C’est précisément la valeur opérationnelle de BEHAVIOR.

---

# 32. TEMPORALITÉ

Le HSG doit pouvoir distinguer :

> ce qui était vrai ;
> 

> ce qui est vrai maintenant ;
> 

> ce qui semble durable ;
> 

> ce qui est temporaire.
> 

Une information ancienne n’est pas automatiquement fausse.

Mais sa pertinence opérationnelle peut diminuer.

Le timestamp doit permettre au Discovery de demander une actualisation lorsqu’une information :

- est ancienne ;
- est susceptible d’avoir changé ;
- devient importante pour une recommandation.

---

# 33. DONNÉES OBSERVÉES

Une observation comportementale autorisée n’a pas le même statut qu’une déclaration explicite.

Le système doit conserver sa source.

Exemple :

> utilisateur déclare « je n’aime pas les surprises »
> 

n’est pas équivalent à :

> système observe qu’il a ignoré deux recommandations surprises.
> 

La seconde donnée ne suffit pas à conclure qu’il déteste les surprises.

Le HSG doit distinguer :

- déclaré ;
- observé ;
- rapporté par un proche ;
- inféré.

---

# 34. INFORMATIONS FOURNIES PAR UN PROCHE

Une information sur une personne peut être renseignée par quelqu’un d’autre.

Sa provenance doit rester explicite.

Exemple :

> « Mon frère adore les montres vintage. »
> 

La connaissance peut être utile.

Mais elle n’a pas exactement le même statut qu’une déclaration directe du frère.

Le niveau de confiance et la source doivent être conservés.

---

# 35. SENSIBILITÉ ET CONFIDENTIALITÉ

Certaines informations peuvent être nécessaires à la personnalisation tout en étant sensibles.

Le HSG doit pouvoir porter :

`sensitivity`

et les règles produit associées.

Le fait qu’une information soit connue de Candice ne signifie pas qu’elle doit être :

- affichée ;
- exposée à un proche ;
- citée dans une recommandation ;
- utilisée comme justification visible.

Exemple :

Candice peut utiliser discrètement une contrainte de santé pour éviter une recommandation incompatible sans jamais expliquer au proche :

> « je recommande cela parce qu’elle a telle condition médicale ».
> 

---

# 36. ONTOLOGY_GAP

L’absence de code fermé n’est pas un ONTOLOGY_GAP.

Le système doit d’abord vérifier si l’information peut être représentée par :

- une famille existante ;
- un FACT ;
- une connaissance descriptive structurée ;
- un ENTITY ;
- un CONTEXT ;
- un pattern BEHAVIOR extensible.

Un véritable gap doit satisfaire simultanément plusieurs critères :

1. phénomène récurrent ;
2. importance opérationnelle réelle ;
3. nécessité d’une logique spécifique de raisonnement ou consolidation ;
4. représentation insuffisante avec les structures existantes.

Dans ce cas :

> signaler le gap pour arbitrage humain.
> 

Ne jamais inventer silencieusement une nouvelle famille ou un nouveau construct psychologique.

---

# 37. RÈGLES ABSOLUES DU HSG

Les règles suivantes doivent être considérées comme des invariants.

### R1

`UNKNOWN ≠ LOW`.

### R2

Absence d’evidence ≠ evidence négative.

### R3

Une evidence négative nécessite une formulation réellement contraire.

### R4

Pas d’axes bipolaires implicites, sauf continuum explicitement défini.

### R5

`RECEIVE ≠ GIVE`.

### R6

Plusieurs modalités affectives peuvent être fortes simultanément.

### R7

AFFECTION_LANGUAGE n’implique pas automatiquement NEED.

### R8

BEHAVIOR n’implique pas automatiquement NEED.

### R9

BEHAVIOR n’implique pas automatiquement PROFILE.

### R10

Une préférence locale n’est pas automatiquement PROFILE.

### R11

Un mot-clé ne suffit pas à produire un DRIVER.

### R12

Une condition médicale ou neurodéveloppementale déclarée ne produit aucun trait supposé automatiquement.

### R13

Le contexte appartient à l’evidence.

### R14

Une evidence située ne devient pas automatiquement GLOBAL.

### R15

Un GLOBAL peut être direct ou consolidé ; les deux doivent rester distinguables.

### R16

Un FACT ne disparaît jamais parce qu’un signal en est dérivé.

### R17

Une information utile n’a pas besoin de produire un signal psychologique.

### R18

Une tension structurante ne se résout pas par une moyenne.

### R19

Un guardrail HARD incompatible élimine la recommandation.

### R20

La sévérité d’un guardrail appartient à l’evidence, pas au code.

### R21

Un guardrail d’exécution ne doit pas être traité automatiquement comme une interdiction de catégorie.

### R22

Une correction explicite doit pouvoir réviser une inférence antérieure.

### R23

Le portrait relit les données brutes ; il n’est pas généré uniquement depuis les scores.

### R24

Une nouvelle information ne crée pas automatiquement un ONTOLOGY_GAP.

### R25

Ne jamais créer un nouveau construct uniquement pour remplir une case ou augmenter la couverture de l’Onboarding.

---

# 38. RÈGLES QUI DOIVENT ÊTRE TESTABLES

Les invariants mécaniques doivent autant que possible devenir des tests logiciels.

Exemples :

- une réponse GIVE ne modifie aucun RECEIVE ;
- un construct sans evidence ressort UNKNOWN ;
- aucune evidence négative n’est créée sans mapping contraire explicite ;
- `value = 0` n’est pas utilisé comme evidence neutre ;
- un HARD incompatible élimine le candidat ;
- un FACT source reste accessible après dérivation ;
- un contexte local n’est pas transformé automatiquement en GLOBAL ;
- aucun code hors Dictionnaire fermé n’est accepté pour PROFILE/NEED/DRIVER/AFFECTION_LANGUAGE ;
- aucune condition sensible n’est automatiquement convertie en traits.

Le diagnostic technique fourni sur les documents avait déjà identifié cette séparation utile entre vocabulaire typé, invariants testables et règles nécessitant du jugement.

---

# 39. RÈGLES NÉCESSITANT DU JUGEMENT

Certaines règles ne peuvent pas être réduites à un test déterministe.

Elles doivent faire partie du cadre de raisonnement du modèle, notamment :

- observation vs inférence ;
- evidence primaire vs secondaire ;
- pertinence d’un NEED ;
- distinction DRIVER / simple formulation ;
- contextualisation ;
- contradiction vs tension ;
- consolidation ;
- interprétation des réponses ouvertes ;
- portrait ;
- choix des prochaines micro-questions ;
- détection d’un véritable ONTOLOGY_GAP.

Ces règles doivent être versionnées avec :

`ontology_version`

`hsg_version`

afin que l’implémentation reste rattachée aux décisions conceptuelles humaines.

---

# 40. SOURCE DE VÉRITÉ ET IMPLÉMENTATION

La hiérarchie est :

### Dictionnaire + HSG

**source de vérité conceptuelle et fonctionnelle**

### Module versionné

**implémentation exécutable de cette vérité**

### Tests

**garantie des invariants mécaniques**

### Instructions/prompt versionnés

**traduction opérationnelle des règles nécessitant du jugement**

Le code ne devient pas une autorité sémantique indépendante.

Toute modification sémantique du modèle doit pouvoir être rattachée à une évolution validée du Dictionnaire ou du HSG.

---

# 41. RÔLE DE L’ONBOARDING

L’Onboarding doit produire :

> **une première compréhension utile + une carte de ce qu’il reste à apprendre.**
> 

Il n’a pas pour mission :

- de remplir tous les PROFILE ;
- d’identifier tous les NEED ;
- d’utiliser tous les DRIVER ;
- de couvrir tous les INTEREST ;
- de supprimer tous les UNKNOWN.

Un construct canonique non alimenté par l’Onboarding n’est pas un problème.

Il pourra être découvert plus tard.

---

# 42. RÔLE DU DISCOVERY DANS LE TEMPS

Le HSG est évolutif.

Une information nouvelle peut :

- confirmer ;
- renforcer ;
- nuancer ;
- contextualiser ;
- diminuer la confiance ;
- révéler une contradiction ;
- montrer une évolution ;
- faire apparaître une tension ;
- révéler un comportement ;
- ouvrir une nouvelle branche ;
- fermer une branche devenue suffisamment connue ;
- rendre une recommandation plus précise.

Le profil initial n’est jamais considéré comme définitif.

---

# 43. CRITÈRE DE SUCCÈS DU DISCOVERY

Le succès n’est pas :

> « nous avons rempli 95 % des tags ».
> 

Le succès est :

> **Candice sait-elle suffisamment de choses pertinentes pour comprendre cette personne, choisir intelligemment ce qu’elle doit encore apprendre et produire des attentions justes ?**
> 

La complétude est secondaire.

La pertinence est prioritaire.

---

# 44. PRINCIPE DE NON-SURINTERPRÉTATION

Candice doit préférer :

> une information spécifique correctement conservée
> 

à :

> une conclusion psychologique plus spectaculaire mais insuffisamment soutenue.
> 

Exemple :

> « Elle adore les hôtels avec une histoire. »
> 

est déjà une excellente connaissance.

Il n’est pas nécessaire de produire automatiquement :

`IMPORTANCE_AUTHENTICITY`

`PROFILE_REFLECTIVENESS`

`DRV_STORY`

si la formulation ne permet pas de distinguer ce qui lui plaît réellement.

Le Discovery peut l’apprendre plus tard.

---

# 45. PRINCIPE DE NON-REDONDANCE

Deux données ne sont pas redondantes simplement parce qu’elles parlent du même sujet.

Exemple :

> aime conserver des photos ;
> 

> prend surtout des photos des gens qu’elle aime ;
> 

> préfère les albums papier ;
> 

> rêve de revivre un voyage précis ;
> 

sont quatre informations différentes.

En revanche, deux questions qui produisent exactement la même information, avec la même qualité et la même portée opérationnelle, peuvent être fusionnées ou supprimées.

Le critère est :

> **information unique obtenue**
> 

et non :

> **similarité lexicale des questions.**
> 

---

# 46. UTILITÉ SANS SIGNAL CANONIQUE

Une information peut être utile uniquement pour :

- recommandation ;
- portrait ;
- déclenchement d’une branche ;
- génération d’une micro-question ;
- personnalisation conversationnelle ;
- contexte ;
- timing ;
- exclusion ;
- mémoire relationnelle.

Elle n’a pas besoin de produire PROFILE/NEED/DRIVER pour justifier son existence.

C’est une règle centrale du système.

---

# 47. TRAÇABILITÉ

Le HSG doit fonctionner dans les deux sens.

### Evidence → compréhension

Le système doit savoir :

> à quels signaux et inférences cette evidence contribue-t-elle ?
> 

### Compréhension → evidence

Le système doit savoir :

> quelles informations soutiennent cette conclusion ?
> 

Cette traçabilité est nécessaire pour :

- expliquer ;
- corriger ;
- réviser ;
- détecter les contradictions ;
- éviter les hallucinations de profil ;
- permettre à l’utilisateur de nuancer ce que Candice croit savoir.

### Les trois rôles de provenance

Toute evidence porte trois rôles, distincts et traçables :

> **subject** — la personne concernée (ce que l’evidence décrit). Portée par `about` (`about_kind` / `about_id`).
> **entered_by** — qui a saisi l’information. Porté par `user_id`.
> **respondent** — qui a *formulé* la réponse dont l’evidence est tirée.

Le **respondent n’est jamais un tiers distinct** : il est toujours soit le `subject`, soit l’`entered_by`. Il ne porte donc **aucune colonne propre** — une colonne dupliquerait une information déjà présente et divergerait le jour où une base épistémique est corrigée. Il se **dérive** de `assertion_basis`, par une **règle unique** (fonction `deriveRespondentRole`, jamais réécrite au point de lecture) :

> `self_report` · `subject_statement` → respondent = **subject** (le sujet a formulé, directement ou par propos rapporté) ;
> `observed` · `reporter_interpretation` → respondent = **reporter** (celui qui saisit a formulé).

C’est cette dérivation qui sépare réellement les modes de saisie pour un même `subject = contact` :

- **côte à côte** : `about = contact`, `sourceType = declared_via_relative`, `assertion_basis = self_report` → respondent = **le proche** (il a répondu oralement ; seule la frappe est médiée) ;
- **incognito** : `about = contact`, `sourceType = reported_by_relative`, `assertion_basis ∈ {observed, reporter_interpretation}` → respondent = **le pilote** (il suppose pour son proche).

---

# 47 bis. ARCHITECTURE DU RENDU DU QUESTIONNAIRE (lot B — banque unique)

Le questionnaire (socle et incognito) est **rendu depuis la banque canonique** (`onboarding.ts`, conforme au document V15 ; `onboarding-incognito.ts` pour l'incognito). Les banques `temperament/questions.ts`, `lifestyle/questions.ts`, `attention/questions.ts` sont **legacy** et retirées comme banques de questions. Cinq règles encadrent ce rendu.

## 1. La couche de présentation est INERTE

Les libellés d'option et leurs **mappings** (tags, pondérations, familles) viennent **exclusivement** du canonique. Les **subtexts** et **icônes** sont des **assets de présentation** keyés par `optionRef`, extraits mécaniquement des banques legacy puis figés. Ils sont **INERTES** :

> Aucun subtext, aucune icône n'est JAMAIS lu par le HSG, par `produceFromOption`, par le discovery engine, ni par une respiration.

Un subtext qui porterait du sens deviendrait une seconde source de vérité. Zéro mapping, zéro tag, zéro pondération ne sort de la couche de présentation. *(Ces 131→128 subtexts, écrits avant le verrouillage du ton Candice et de la DA V11, relèvent d'un **lot éditorial futur** : ils ne sont pas canoniques, ils sont provisoires.)*

**⚠ Les `dims` ne sont PAS dans cette couche (corrigé le 19 oct).** Une dim (MOT/SER/CAD_C/CAD_S/EXP/GES/SUR) porte le passage d'une option vers les dimensions affectives. Elle entre dans l'**evidence** (migration 88, `dims` + `rank`) et dans le **journal** — pas dans un asset inerte — car sans elle `attention_reception` n'est pas dérivable du journal.

**⚠ MAIS les `dims` sont de la sémantique LEGACY, au même titre que les deltas d'axes (§47quater).** Pour éviter un refactor pur sur le seul domaine qui marche, elles **RESTENT** dans les colonnes `dims`/`rank` (pas déplacées vers `projection_bridge`). En contrepartie, elles ont **la MÊME INTERDICTION que `projection_bridge`** : **ni le HSG, ni une respiration, ni l'analyse ne peuvent lire `dims`/`rank` comme une connaissance sur la personne** — elles n'existent QUE pour reconstruire `attention_reception` (projection). *(La respiration de l'attention lit les constructs AFFECTION/DRIVER, jamais `dims`.)* **Condition de mort commune** : `dims`, `rank` et `projection_bridge` meurent au MÊME événement — le jour où la reco réécrite lit les PROFILE constructs V15. Inscrit au registre comme dette d'alignement.

## 2. Le découpage en ÉTAPES est de la STRUCTURE, pas un asset

Les étapes (attention · tempérament · lifestyle · singularité/pratique) **ne sont pas** rangées avec les subtexts/icônes. Elles sont **structurelles** : elles déterminent **où tombent les respirations**, donc la progressivité de l'analyse cumulative (règle 7 ci-dessous). Le découpage est **explicite, nommé et documenté** comme structure, jamais enfoui dans une couche d'assets.

## 3. Le scoring legacy est CONSERVÉ — uniquement pour la projection

`my_profile` porte des **colonnes calculées** (`temperament_axes`, `temperament_modes`, `attention_reception`, `attention_expression`) lues par de nombreuses surfaces (reco, génération de portrait, fiches, nudge…). Le scoring legacy (`scoreAttention`, scoring tempérament) qui les produit est donc **conservé**, mais **sa seule raison d'être est d'alimenter la projection plate** le temps que les lecteurs migrent vers le journal.

> **Autorité : le journal `knowledge_*` fait foi.** Les colonnes calculées de `my_profile` sont une **projection de service**. En cas de divergence, le journal a raison. Rien d'autre que la projection ne doit lire `result.axes` / `result.modes` comme une vérité.

**Condition de retrait du scoring legacy.** Deux sources coexistent par décision assumée ; un **test de cohérence** doit les surveiller : il **reconstruit la projection DEPUIS LE JOURNAL SEUL** (via les `dims` + `rank` gravés sur les evidences) et exige l'**ÉGALITÉ DU VECTEUR** avec la sortie du scoring legacy, **domaine par domaine** — pas une simple « couverture d'options ». Il **ÉCHOUE** en cas de divergence. Le jour où il passe au vert sur **tous** les domaines, le scoring parallèle peut mourir. **Sans lui, il ne mourra jamais.** (Attention : fait — `reconstruct-attention.ts` + le test d'égalité du vecteur. À étendre à chaque domaine basculé.)

## 4. Respirations — règles de génération (7a, 7b)

La respiration **reformule ce que le HSG a produit** (tags et pondérations issus des mappings appliqués à chaque réponse), lus depuis le journal. Elle est générée par IA (texte réactif, non pré-écrit). Deux règles non négociables :

> **7a — Aucun attribut sans provenance.** La respiration ne dit que ce que les tags produits soutiennent. Jamais ce que le modèle déduit des réponses brutes. Même règle que l'analyse de profil générale.
> **7a bis — LE MODÈLE N'ÉLIT JAMAIS CE QU'ON MONTRE.** Choisir *quoi* mettre en avant d'une personne (le carrousel « Ce que Candice a compris », les quatre blocs d'« En profondeur », les chips du résumé) et *dans quel ordre* est une **décision SUR elle**, pas une question de style — donc **calculé, jamais choisi par le modèle** : par la **force et le rang** des tags + le **mapping du dictionnaire** (quel tag appartient à quel bloc). Le modèle **reçoit la sélection déjà faite et l'ÉCRIT** — il n'ajoute rien, ne retire rien, ne réordonne rien. *(Sinon deux ouvertures de la même fiche mettraient en avant deux choses différentes.)*

> **7b — La profondeur suit la connaissance.** À l'étape 2 le HSG n'a que quelques tags : la respiration est courte, et elle a le **droit** d'être courte. Elle ne comble jamais un vide par une formulation générique ou flatteuse. Mince à l'étape 2, dense à l'étape 7. C'est la jauge de connaissance appliquée à l'onboarding.

Ces deux règles figurent dans le **prompt** de la route de respiration, en plus du ton Candice.

> **7c — La respiration n'énonce que les RELATIONS que le HSG définit, jamais celles que le modèle observe.** Un lien entre deux tags (ex. « elle donne ce qu'elle aime recevoir ») est une **affirmation** : s'il n'est pas défini et calculé par le HSG, il contourne 7a. **Relation autorisée pour l'attention** : `give ≈ receive` sur la MODALITÉ — `congruence` (la modalité préférée en réception est aussi donnée), `ecart` (1ʳᵉ modalité reçue absente du donné), `neutre` (données insuffisantes). Elle est **dérivée déterministiquement** du journal (`deriveAttentionRelation`) et **fournie** à la respiration ; le modèle n'a pas le droit d'en inventer une autre. Toute nouvelle relation autorisée doit être ajoutée ici AVANT d'être énonçable.

> **7e — Aucun domaine n'est OMIS s'il a des tags.** La conclusion analytique finale (et tout texte cumulatif) a le droit d'être **brève SUR** un domaine, jamais de le faire **disparaître** : un domaine qui porte des tags doit laisser une trace dans la prose. Un domaine **sans tag**, elle n'en parle pas — c'est normal, pas une omission. *(Garantie déterministe : la matière des cinq domaines — attention, tempérament, lifestyle [constructs], singularité, pratique [FACTs] — atteint l'entrée du modèle, cf. test `conclusion-domains`. Que la prose les tisse tous relève du prompt, le modèle ne tronque pas un domaine présent.)*

> **7e ter — AUCUNE SÉLECTION PAR VALENCE. On affiche TOUT, neutrement.** Par défaut un profil montre **tout** — forces ET faiblesses, positif ET négatif — du **même ton neutre**. Le modèle ne choisit pas ce qu'il met en avant (7a bis) **et ne choisit pas non plus ce qu'il TAIT** : rien n'est adouci, rien n'est omis parce que ce serait moins flatteur. « Sous stress elle se referme », « elle n'aime pas qu'on décide pour elle », « elle est exigeante » s'affichent **comme le reste**. **Toute matière fournie est traitée.** Deux raisons, la seconde est structurante : Candice doit pouvoir **expliquer à quelqu'un qui il est** ; et **confronter** un profil à un autre — si chaque profil est raboté différemment, la **comparaison** ne veut plus rien dire.

> **7e bis — 7e est VÉRIFIÉE, pas espérée (DOUBLE SENS).** Le modèle renvoie, à côté de son texte, la **liste de ce qu'il a traité** — en **sortie structurée validée par schéma**. On la compare à l'entrée **dans LES DEUX SENS** : traité ⊇ entrée (pas d'**OMISSION** — sinon relance de la section seule) ET traité ⊆ entrée (pas d'**INVENTION** — citer ce qu'on n'a pas donné = échec). C'est 7a devenue **mécanique** (cf. §48octies). **Sur écart : une seconde tentative ; si elle manque encore un domaine présent en entrée → le texte est écarté (traité comme un échec modèle : vide, étape sautée, les éléments calculés tiennent la fiche) ET un signal est journalisé pour relecture.** *(Estelle tranche ce comportement.)* Même mécanisme partout où un texte doit couvrir une matière donnée : conclusion finale, résumé de fiche, blocs d'« En profondeur ».

> **Repli en cas de panne** : si le modèle échoue ou ne produit rien, la respiration est **VIDE** — jamais un texte de repli issu du scoring legacy (ce serait revenir en silence à la mauvaise source). Mieux vaut un écran sans respiration qu'une respiration sans provenance. **Texte vide → l'étape est SAUTÉE** (jamais un cadre de respiration sans prose) — les cinq respirations, les trois modes et la conclusion finale.

> **7d bis — MARQUE DE PERCEPTION, posée UNE FOIS à l'affichage (mode 3).** À l'écran : **une seule** marque en tête du bloc — « D'après ce que tu sais d'elle » — puis des phrases **nettes**, sans hedging ligne à ligne (cinq « il te semble » empilés = illisibles, et ce n'est pas ce que demande 7d). **Dans les données : rien ne change** — chaque evidence garde sa provenance et son niveau de confiance intacts ; la marque unique est une décision d'AFFICHAGE, jamais un aplatissement. **Le texte ne promeut rien** : une inférence fragile ne devient jamais une caractéristique certaine. Pour que ce soit tenable, **le niveau de confiance VOYAGE JUSQU'AU MODÈLE avec chaque tag** (comme 7b fait suivre la profondeur au nombre de tags) : s'il reçoit des tags nus, il écrit tout du même ton. **La fermeté de la phrase suit la confiance de la donnée.**

## 5. Mode « côte à côte » — hypothèse non démontrée

« Un seul chantier couvre les modes 1 et 2 » est une **HYPOTHÈSE** : le mode 2 réutilisera la banque du socle, mais **aucun parcours côte à côte n'existe à l'écran** aujourd'hui (route vers un placeholder). L'hypothèse ne sera **vérifiée qu'à l'ouverture de la route mode 2**. Pas de banque propre au mode 2, aucun travail anticipé dessus dans le lot B.

---

# 47 ter. LE JOURNAL EST EN APPEND — RÈGLE DE RÉCENCE

Décision (19 oct) : **on n'écrase JAMAIS une evidence.** Répondre deux fois à la même question crée **deux** evidences qui coexistent. La connaissance ÉVOLUE (micro-questions, affinage continu) : un journal qui écrase détruit la dimension temporelle du HSG, qui est sa valeur. Et une même personne est décrite par plusieurs **respondents** (soi en mode 1, un proche via le pilote en mode 2, le pilote en mode 3) : ces evidences ont des `assertion_basis` différents et **doivent** coexister.

## Composition de la clé

> **`source_id`** = uuid **frais, généré à l'ACQUISITION** (jamais dérivé du contenu). C'est l'identité d'un acte de réponse. La source porte `about` (sujet), `source_type` (acte d'acquisition), `assertion_basis` (base du respondent), `ts` (horodatage de la réponse d'origine).
> **`evidence_id`** = `uuidv5(source_id + clé-cible)`. Déterministe **dans** une acquisition (re-rejouer la même acquisition remplace ses evidences — pas de doublon de rejeu), unique **entre** acquisitions.

Cette clé sépare, au minimum :
- **deux réponses de la même personne à la même question à deux dates** → deux acquisitions → deux `source_id` → deux `evidence_id` ;
- **deux réponses de respondents différents sur le même sujet** → deux sources (`about`/`source_type`/`assertion_basis` distincts) + `source_id` frais.

## Règle de récence (état courant)

> L'**état courant** d'une dimension se lit à la **PROJECTION** : pour un `(sujet = about, questionCode [via la source], dimension = target_family + target_construct [+ facet/direction/modality])`, l'evidence **retenue est celle dont la source a le `ts` le plus récent**.

C'est une règle **sémantique de LECTURE**, pas une mutation. Rien n'est marqué `superseded` en base, **rien n'est supprimé** : le « superseded » est **dérivé** de l'horodatage. L'append reste intact ; l'historique complet est interrogeable.

## Édition d'une réponse

Corriger une réponse = un **nouvel acte d'acquisition** (nouvelle source, `ts` postérieur, nouvelles evidences). L'ancienne evidence **reste**. La projection cesse de la retenir (récence), mais elle n'est ni marquée ni effacée.

**Aucune migration** : le schéma est déjà un journal (PK = `id` seul, aucune contrainte d'unicité sur `(user, construct)`) ; la récence est une règle de lecture (consolidation/projection), pas une colonne.

---

# 47 quater. SÉMANTIQUE CANONIQUE vs PONT DE PROJECTION LEGACY

Quand une projection (ex. `attention_reception`, `temperament_axes`) n'est pas dérivable du journal, ce qui manque doit y être gravé — sinon le journal n'est pas l'autorité. **Mais deux cas, à distinguer** (leçon du tempérament) :

> **Sémantique CANONIQUE** (définie dans les documents V15) → entre comme **evidence**, dans sa famille. Ex. les PROFILE constructs du tempérament (`SOCIAL_ENERGY`…), les AFFECTION de l'attention.
> **Sémantique LEGACY** (n'existe que dans le code déployé, parce qu'un lecteur la consomme) → entre comme **PONT**, dans un champ **nommé comme tel** (`projection_bridge`), **INTERDIT à la lecture par le HSG, les respirations et l'analyse**. Ex. les `deltas` d'axes de `temperament_axes` / `lifestyle_axes` : c'est l'ANCIEN DICTIONNAIRE, pas une connaissance sur la personne.

**La vérité canonique du tempérament reste les PROFILE constructs V15.** Les deltas sont inscrits au document de mappings comme « sémantique legacy, conservée pour la seule projection, NON RELUE par Estelle ».

**CONDITION DE MORT (datée par un ÉVÉNEMENT, pas une date calendaire)** : **le jour où le moteur de recommandation réécrit lit les PROFILE constructs V15**, le champ `projection_bridge` et les colonnes du scoring legacy sont **supprimés**. Une redondance sans condition de retrait devient permanente. Le migrer maintenant (option B) serait du travail jeté, puisque la reco est en réécriture.

**Procédure (les deux cas)** : extraction MÉCANIQUE par import (jamais de parseur de texte, jamais retapé), compte avant/après, inscription au document d'autorité avec « NON RELUE par Estelle », renvoi au lot éditorial.

## Application au LIFESTYLE (règle D2, triage flag par flag)

Les deltas lifestyle portent un champ `target` à quatre valeurs. Triés par la règle D2 (un flag qui a un équivalent canonique entre comme evidence dans sa famille ; le pont est réservé à la sémantique legacy qu'un lecteur consomme) :

- `target: 'lifestyle'` (axes `lifestyle_axes`, 6 clés) → **PONT** (legacy, ancien dictionnaire).
- `target: 'temperament'` (suppléances cross-domaine de `temperament_axes`) → **PONT** (legacy). ⚠ **Les domaines ne sont pas étanches** : le lifestyle écrit dans la projection du tempérament. La reconstruction de `temperament_axes` doit donc lire les ponts tempérament **ET** lifestyle, en rejouant la **double-application** legacy (merge au step4 *puis* au step5 sur le re-calcul de toutes les réponses — les suppléances step4 sont comptées deux fois). L'égalité de vecteur du tempérament est **rejouée après** le câblage lifestyle.
- `target: 'filter'` (16 options → `relational_filters`) → **CANONIQUE (cas 1)**, PAS de pont : chaque option produit déjà, pour la même réponse, un construct canonique auto-produit — anti-surprise (q18) → **GUARDRAIL** `GRD_*` ; besoins/peur (q19) → **NEED** (`NEED_SEEN_UNDERSTOOD`, `NEED_LOVED_MATTER`/`NEED_CHOSEN`, `NEED_FREEDOM`/`NEED_RHYTHM_RESPECT`, `NEED_ACCEPTANCE`, `NEED_TRUST`/`NEED_REASSURANCE`, `NEED_CONNECTION`) ; exigence (q4c « valider les détails ») → **IMPORTANCE** `IMPORTANCE_MASTERY` ; charge mentale (q4a) → **FACT** `functional_impact`. `relational_filters` se reconstruit donc du journal. **Aucun trou d'ontologie (cas 3) sur le lifestyle.**
- `target: 'canal'` (q4d → `temperament_modes.canal`) → **CANONIQUE (cas 1)** : `PREFERENCE.communication.channel`, auto-produite. PAS de pont.

## A3 — SINGULARITÉ & PRATIQUE : FACT verbatim, NI projection NI pont

Les champs texte libre (singularité, 11 champs) et pratiques (identité, tailles, alimentation, confort…) + q17 n'ont **aucun mapping canonique** : ils entrent au journal comme **FACT** (`knowledge_facts`), source `onboarding_open`, **VERBATIM** (`rawText` + `value` = la saisie telle quelle, jamais normalisée). Un FACT **ne produit aucun signal** (R16/§11.1), n'alimente **aucun axe**, **ne disparaît jamais** (append, `source_id` frais). Les champs santé/vie privée (allergies, mobilité/santé, adresse) sont **sensibles** → `visibility_derived = internal_only` (§35/R12).

- **Pas de vecteur à reconstruire** pour ce domaine : il n'y a pas de projection scorée. Le test du domaine est le **ROUND-TRIP VERBATIM** (`knowledge_facts.value == saisie`), pas une égalité de vecteur.
- **Respiration** : les FACTs ne créant pas de construct, `readSocleTags` ne gagne pas de domaine. Le texte libre q17 est journalé verbatim ; son EXTRACTION (`q17Interdits`) reste **hors journal** (inférence = lot futur).

> **Le journal est l'autorité au sens d'une propriété démontrée, pas d'un fait de fonctionnement ; il le devient au runtime quand la reco réécrite le lit.** (Aujourd'hui : les reconstructions ne tournent qu'en preuve, les FACTs ne sont lus par aucune surface. C'est voulu et transitoire.)

## RESTITUTION DES FACTs DANS LA PROSE (respiration ET conclusion analytique finale — UNE SEULE RÈGLE)

« FACT = aucun signal » veut dire : un FACT **n'alimente pas la couche d'inférence** (axes, scores, convergence). Ça ne dit **rien** sur la restitution. Un FACT est la chose la MOINS inférentielle du journal — la personne l'a écrit elle-même, sa provenance est la meilleure possible. **Donc les FACTs ENTRENT dans la prose** (respiration cumulative ET conclusion analytique B), sous **trois conditions non négociables** :

1. **NOMMER, JAMAIS INTERPRÉTER.** « Tu fais de la poterie » : oui. « Tu sembles avoir besoin de créer avec tes mains » : NON — c'est un trait inféré d'un FACT sans mapping derrière, donc une violation de 7a. L'interdiction est écrite **en toutes lettres dans le prompt**.
2. **FILTRE MÉCANIQUE DE VISIBILITÉ.** Seuls les FACTs dont `visibility_derived != 'internal_only'` peuvent entrer dans la prose. **Condition dans le code, pas de jugement éditorial, aucune exception.** Santé, mobilité, adresse ne sortent jamais — et le jour où le même moteur sert une fiche de proche, cette règle évite qu'on raconte la santé d'autrui.
3. **LA PREUVE SÉPARE LES DEUX SOURCES.** Toute preuve de respiration/conclusion liste les **constructs** (issus d'un mapping) d'un côté, les **FACTs** (déclaration brute) de l'autre, puis le texte. Si on ne distingue pas à l'écran ce qui vient d'un mapping de ce qui vient d'une déclaration, « aucun attribut sans provenance » devient invérifiable.

*(Cette règle vaut à l'identique pour B. Ne pas re-décider : même réponse, mêmes conditions.)*

## RÈGLE 7d — RESTITUTION QUAND ON PARLE DE QUELQU'UN D'AUTRE (mode 3 / incognito)

La respiration incognito lit le journal `about=contact` (sujet ≠ pilote). C'est la **première fois que la restitution parle d'un tiers**. En plus de 7a/7b/7c, **deux règles** :

1. **PERCEPTION, PAS VÉRITÉ.** Le mode 3 est ce qu'un tiers SUPPOSE. La donnée le porte déjà (`reported_by_relative`) ; **le texte aussi** : « d'après ce que tu sais d'elle », « il te semble que… » — **jamais** « elle est », « il a besoin de ». Affirmer sur quelqu'un à partir de ce qu'un tiers en suppose est interdit.
2. **NE JAMAIS COMBLER LES TROUS.** Les options `status: UNKNOWN_BY_REPORTER` et `CONTEXT_DEPENDENT` ne produisent rien. La respiration **ne comble jamais** ces trous : « tu ne sais pas encore » est une réponse acceptable à l'écran.

**Le filtre de restitution est le MÊME qu'au pilote** : seuls les FACTs déjà marqués sensibles (santé, allergies, adresse → `visibility_derived='internal_only'`) restent hors prose. Pas de filtre élargi pour le mode 3.

> **RETRAIT (21 oct) — motif conservé pour ne pas être re-déduit.** Une première version de 7d imposait (a) un filtre `internal_only` ÉLARGI au mode 3 et (b) l'interdiction de restituer un état. Les deux reposaient sur une **erreur** : le questionnaire incognito ne pose pas de questions d'**ÉTAT**, il pose des questions de **TRAIT** — la structure de la banque le prouve (les options « je ne sais pas » / « ça dépend » n'existent que dans un questionnaire de caractère). `stress_response (I5)`, `support_in_distress (I7)` et `emotional_expression (I10)` sont des **traits, restituables**. Les interdire amputerait le **2ᵉ usage du produit** : l'aide dans les moments difficiles est le 2ᵉ besoin le plus cité de l'enquête (60 % des répondants). La péremption des ÉTATS relève d'un lot distinct (voir registre « ÉTATS ET RELANCES »), pas de la restitution de traits.

*(7d resservira pour le côte à côte B quand il parlera d'un proche.)*

**Le pont est de niveau ACQUISITION, keyé par `source_id`.** Une option qui produit N evidences (fréquent côté lifestyle : plusieurs constructs canoniques par option) porterait sinon ses deltas N fois → la reconstruction les additionnerait N fois (bug masqué sur le tempérament, 1 evidence/option). Choix : `produceSocleAnswer` attache le pont à **TOUTES** les evidences de l'acquisition (elles partagent le `source_id` ; si l'une est filtrée un jour, une autre le porte — aucun couplage à l'ordre de production), et la **reconstruction dédoublonne par `source_id`** (`bridgesFromEvidenceRows`) : une acquisition = un pont compté une fois. *(Une variante « attacher à la 1ʳᵉ evidence » marche aussi mais couplerait le pont à l'ordre des evidences — rejetée pour cette raison.)*

---

# 48. EXPLICABILITÉ D’UNE RECOMMANDATION

Candice doit pouvoir produire une justification compréhensible sans révéler inutilement les données sensibles ou la mécanique interne.

Exemple interne :

`INTEREST.photography = passion`

- `ENTITY_PLACE = Japan`
- `DRV_MEMORY`
- `AFFECTION_RECEIVE_PERSONALIZED_GIFT`

peut conduire à une recommandation liée à la photographie japonaise.

La justification visible peut simplement être :

> « Ça combine deux choses qui comptent vraiment pour elle et ça a une dimension très personnelle. »
> 

Le système n’a pas besoin d’exposer les tags.

---

# 48 bis. IDENTITÉ, MERGE ET DÉPART — PRÉSÉANCE PAR PROVENANCE

Règle **tranchée et validée (avocate)**. Écrite ici ; implémentation = lot « IDENTITÉ, MERGE ET DÉPART » (registre). Trois façons dont une fiche sur Julie existe : **incognito** (le pilote seul), **côte à côte** (rempli avec Julie présente, sans compte), **compte de Julie** (elle s'est inscrite elle-même).

> **PRÉSÉANCE (une phrase) : la fiche remplie par le proche lui-même l'emporte toujours sur l'incognito et sur le côte à côte.**

**CAS 1 — Julie s'inscrit alors que le pilote a une fiche incognito (ou côte à côte) sur elle.**
- Le **merge est déclaré par le PILOTE** (« c'est la même Julie »). **Jamais automatique, jamais déduit** : en incognito on n'a qu'un prénom — c'est précisément pourquoi l'incognito est validé juridiquement.
- Les réponses d'onboarding de Julie **écrasent VISUELLEMENT** la fiche : l'ancienne disparaît de l'app du pilote, il est connecté à la fiche de Julie.
- Les réponses incognito **restent EN BASE, jamais supprimées**.
- Julie décide de ce qu'elle partage, comme n'importe qui.
- Tout ce que le pilote avait ajouté lui-même est **CONSERVÉ** : les **faits**, les **états** — **pas les traits** — et son **historique** (événements, attentions, confidences). Rapatriés sur la fiche de Julie, côté pilote.
- Julie ne voit **que ses propres déclarations**. Jamais le déclaratif du pilote sur elle.

**CAS 2 — Julie part et supprime sa fiche.** Ses déclarations à elle disparaissent (son droit). Celles du pilote ne bougent pas : l'incognito revient, avec l'historique.

**CAS 3 — Fiche classique, Julie part, le pilote garde son profil.** Il choisit de conserver son historique (faits, états, attentions). Candice lui propose de remplir le profil en incognito, ou en côte à côte si elle est là. Si Julie revient : merge du cas 1.

**CAS 4 — Côte à côte puis Julie s'inscrit.** Même processus que l'incognito : elle remplit de zéro, le pilote garde en base, la fiche de Julie prend le dessus, l'historique est conservé.

**INVARIANTS.**
- Rien n'est jamais supprimé côté pilote. Incognito et côte à côte sont **masqués, pas effacés**.
- Les **traits** du pilote sont **masqués** par ceux du sujet, **jamais écrasés**.
- Les **faits et états** déclarés par le pilote ne sont **jamais masqués** (ils coexistent).
- L'**historique** appartient au pilote, toujours.
- Le **sujet ne voit jamais** le déclaratif d'un tiers sur lui.

**RÈGLE DE RÉSOLUTION (préséance par provenance, remplace « récence seule »).**
- **TRAITS (evidences)** : `self_report` (respondentRole=`subject`, cf. `deriveRespondentRole`) l'emporte sur `reported_by_relative` (role=`reporter`), **quelles que soient les dates**. Entre deux evidences de MÊME provenance, la **récence** décide (comme aujourd'hui).
- **FACTS et CONTEXT déclarés par le pilote** : jamais masqués par les déclarations du sujet — ils **coexistent**.
- **Restitution au SUJET** : filtre mécanique — il ne lit que les evidences `self_report` **le concernant**. Rien d'autre ne peut l'atteindre.
- **Suppression de compte** : la suppression s'opère **par propriétaire** (`user_id`) — chaque déclarant possède ses evidences. Quand le sujet exerce son droit à l'effacement, **ses** lignes partent ; celles d'un tiers à son sujet (`user_id` du pilote) **ne sont pas touchées** — pas de suppression sélective à écrire, la propriété suffit (et c'est la raison **juridique** qui fait tenir l'incognito). Conséquence : le **retour de l'incognito n'est pas une restauration** — c'est la préséance qui **retombe d'elle-même** (les evidences `reported_by_relative`, jamais supprimées, redeviennent le plus haut rang disponible).

**ÉCHELLE DE PROVENANCE À SIX NIVEAUX (UNE SEULE échelle, étend `reviseWithCorrection` de consolidate.ts — jamais une seconde à côté).** Du plus fort au plus faible ; deux niveaux ne se confondent JAMAIS ; une déclaration du pilote sur son proche n'a jamais la force d'une préférence exprimée par le proche lui-même :

| Niveau | Définition | Provenance en base (aujourd'hui) | Mode fiche |
|---|---|---|---|
| **1** | déclaration directe du proche sur lui-même | `self_report` + about=account (onboarding_*, discovery_*, conversation, user_declaration, wishlist) | **compte du proche** |
| **2** | déclaration du pilote rapportant les propos EXPLICITES du proche | `declared_via_relative` (côte à côte) · `subject_statement` | **côte à côte** |
| **3** | observation directe du pilote | assertionBasis `observed` (incognito) | incognito (selon la question) |
| **4** | impression / interprétation du pilote | assertionBasis `reporter_interpretation` (incognito) | incognito (selon la question) |
| **5** | inférence IA | *(aucune valeur aujourd'hui — viendra avec le lot d'extraction)* | — |
| **6** | information non confirmée | *(aucune valeur aujourd'hui)* | — |

- **`assertionBasis` porte DÉJÀ la distinction 3 vs 4** (`observed` vs `reporter_interpretation`) : l'échelle s'y raccroche, **pas de nouvelle colonne**. Le 1 vs 2 se lit sur `source_type` (+ about). 
- **`user_correction` N'EST PAS un niveau, c'est un ACTE** : une correction du pilote sur une inférence (R22/§21, `reviseWithCorrection`). Elle révise un signal existant, elle ne se classe pas dans l'échelle.
- **Niveaux 5 et 6 : aucune valeur aujourd'hui** (aucune extraction ne tourne, cf. §48quinquies). Ils s'activeront avec le lot d'extraction (nouvelle valeur de base « inférence IA », niveau 5, toujours < déclaré/coché — règle 2 de §48quinquies).
- **Les trois modes de fiche** tombent dans l'échelle : compte du proche = 1, côte à côte = 2, incognito = 3 ou 4 selon la question. Le **côte à côte est EXACTEMENT le même questionnaire que l'onboarding classique** (même banque, même parcours) ; seules changent la **provenance** (niveau 2, `declared_via_relative`) et le **sujet** (un contact au lieu du pilote). **Deux questionnaires pour trois modes — pas de 3ᵉ parcours.**
- ⚠ `declared_via_relative` **manquait au CHECK DB** → **migration 90** (écrite, à appliquer) l'ajoute. Le flux mode 2 reste un lot (sous-bloc 2).

**RÉSOLUTION AU READ (à construct égal) :** le **niveau le plus fort gagne, quelles que soient les dates** ; à **niveau égal, la récence**. *(Implémentation = lot IDENTITÉ/MERGE/DÉPART, non codée ici — la résolution actuelle est encore la récence seule, breath-tags.)*

## 48 ter. IDENTITÉ, MERGE ET DÉPART — SPÉCIFICATION (écrite, non implémentée)

**3.1 — Candice ne sait JAMAIS que c'est la bonne Julie ; elle ne doit jamais le deviner.** Aucun rapprochement automatique sur un prénom, un mail ou un téléphone. Un rapprochement automatique ferait cesser l'incognito d'être anonyme — précisément ce que l'avocate a validé. Trois chemins où Julie arrive **sans** l'invitation (moteur de recherche ; elle invite le pilote ; elle s'inscrit seule puis on se croise) : dans les trois, **le même acte explicite du pilote** — « cette Julie est celle que j'ai en incognito ». Le **token d'invitation** reste le seul cas automatique, et il **porte déjà la déclaration du pilote** (en envoyant l'invitation, le pilote déclare que la fiche est Julie).

**3.2 — GARDE-FOU : LE MERGE EST UN LIEN, PAS UNE ÉCRITURE.**
- **INTERDIT** : recopier les réponses de Julie dans les lignes du pilote au moment du merge. La suppression de compte efface par propriétaire ; des réponses recopiées chez le pilote **survivraient à l'effacement de Julie** — illégal.
- **EXIGÉ** : les réponses du sujet **restent chez le sujet** ; la fiche les lit **à travers le lien, à l'affichage, avec son consentement**. **La préséance vit dans la LECTURE.**
- Conséquence : **aucun merge écrit en base, sous aucune forme** — pas de copie, pas de cache, pas de projection recopiée. L'incognito qui réapparaît n'est **pas une restauration** : la préséance retombe, rien n'a bougé.

**3.3 — PRÉSÉANCE CONSTRUCT PAR CONSTRUCT, pas fiche par fiche.**
- Là où le sujet a répondu ET accepté de partager → **sa réponse s'affiche**.
- Là où il n'a rien dit ou n'a pas partagé ce construct → **la connaissance incognito du pilote reste visible**, présentée comme **SA perception** (« d'après ce que tu sais d'elle »), jamais comme une vérité sur elle.
- Les **FACTS, ÉTATS et historique du pilote** ne sont **jamais concernés** : à lui dans tous les cas, toujours affichés.
- Le **sujet ne voit que ses propres déclarations**.

**3.4 — EFFACEMENT.** Le sujet efface son compte → ses lignes partent, celles du pilote **remontent seules**. Le pilote a le droit de conserver ce qu'il a déclaré : **ses mots sur sa relation**, sans donnée personnelle le concernant **au-delà d'un prénom**.

**3.5 — TOUT EXPLIQUER AU PILOTE (sinon il ne mergera jamais).** L'écran de merge dit, **AVANT l'acte** : ce que tu as écrit n'est pas perdu ; il reste chez nous ; si Julie repart il revient ; ton historique (événements, attentions, confidences) est conservé dans tous les cas ; à partir de maintenant c'est Julie qui décide de ce qu'elle partage. *(Textes = Estelle → registre éditorial, non rédigés par l'assistant.)*

**3.6 — CONSÉQUENCE DE CALENDRIER.** La fiche proche lit aujourd'hui l'ancien rangement à plat. Un affichage mergé exige que le **bloc des traits de la fiche lise le JOURNAL**. Donc la **fiche proche devient le PREMIER des 14 écrans à débrancher**, et le merge en est la raison d'être. **Ordre définitif du lot** : préséance au read → bloc traits de la fiche branché au journal → acte de merge déclaré + écran d'explication → départ et retour.

---

# 48 quater. SUPPRESSION DE L'ANCIEN — UN SEUL RANGEMENT (le journal)

**Décision (22 oct) :** Estelle est la seule utilisatrice ; la cohabitation ancien/canonique ne protège personne. **Le point A (pont d'alignement des clés) est ANNULÉ** — on ne maintient pas l'ancien affichage. Destination : **le journal est le rangement unique**. Plus de flags, plus d'ancien questionnaire, plus d'écriture en double, plus de routes de respiration legacy, plus de maps d'affichage legacy.

**ORDRE NON NÉGOCIABLE** (on ne supprime pas en premier, sinon les 14 écrans se vident) :

- **ÉTAPE 0** — Canonique = chemin UNIQUE côté questionnaire (flags forcés `true`, en dur). Estelle refait son onboarding complet + remplit une fiche de proche → le journal contient du vrai. L'écriture de projection (my_profile / questionnaire_responses) **continue** à ce stade (double-write toléré, supprimé à l'étape 2).
- **ÉTAPE 1** — Les écrans lisent le JOURNAL, dans l'ordre : (1) **fiche proche `/contacts/[id]`** (la plus visible, bloc traits par construct, préalable du merge) ; (2) les autres des 14 (page profil, generateProfileAnalysis, sheet-data, v2-data, suggestions, signals/generator, idea-suggestions, discovery, invite/nudge…) ; (3) **moteur de reco : strict minimum** — il va chercher la même chose dans le journal au lieu des anciennes cases, **pas de réécriture** (chantier à part).
- **ÉTAPE 2** — Suppression **en un commit**, quand le dernier écran est passé : ancien questionnaire + `saveStage*`, écriture en double, **tous les flags**, routes de respiration legacy, maps d'affichage inutiles, **toutes les lectures des anciennes colonnes**. ⚠ **AUCUNE colonne supprimée en base dans ce commit** — les colonnes restent **inertes** (plus lues ni écrites). Une **migration de suppression séparée** sera écrite, qu'Estelle appliquera après avoir tout vu tourner. Une colonne supprimée ne revient pas.

---

# 48 quinquies. EXTRACTION DES RÉPONSES LIBRES — LES 9 RÈGLES

**Constat (inventaire 22 oct) :** aujourd'hui le texte libre (singularité, pratique, q17) entre au journal comme **FACT verbatim** seul. **Aucune extraction** ne transforme un texte libre en connaissance structurée : `extraction.ts` est une structure dormante (« AUCUN appel à un modèle dans ce lot »), `/api/lifestyle/extract-filters` écrit la projection legacy (`relational_filters`, pas le journal). Les cinq familles ouvertes — **INTEREST, PREFERENCE, ENTITY, GUARDRAIL, CONTEXT** — existent comme types d'evidence mais ne sont produites que par des cases/widgets fermés (GUARDRAIL, PREFERENCE, INTEREST générique sur 15 catégories) ; **ENTITY et CONTEXT n'ont aucun producteur**. Elles ne s'affichent **nulle part** (la fiche ne rend que AFFECTION/PROFILE/NEED). Seul le texte libre peut produire « photographie argentique », « le café de ce torréfacteur », « allergique aux fruits à coque », « ne supporte pas les fleurs coupées ».

**AUDIT (autorité = HSG + dictionnaire canonique + onboarding seuls).** La plupart des « 9 règles » que j'avais listées sont **DÉJÀ dites** ailleurs — on ne les redouble pas, on cite. Ne restent que les points réellement **ABSENTS**.

| Règle | Statut | Où c'est déjà dit (origine) |
|---|---|---|
| Verbatim = autorité, l'extraction s'ajoute jamais ne remplace | **DÉJÀ** | §47quater + §48ter.2 (FACT verbatim) ; dictionnaire `open-knowledge.ts` (`subjectLabel` « formulation verbatim, jamais écrasée ») |
| Extraction = inférence, plus faible, jamais promue | **DÉJÀ** | §9 INFÉRENCE (« traçable, confiance… Mieux vaut UNKNOWN qu'une fausse connaissance ») + §48bis (échelle, inférence IA = niveau 5 < déclaré/coché) |
| Ne jamais perdre une info faute de tag → connaissance ouverte | **DÉJÀ** | dictionnaire `OpenKnowledge` (type+subject+subjectLabel+relation+intensity+context+source) |
| Ne jamais remplacer un sujet précis par un tag générique | **DÉJÀ** | dictionnaire `open-knowledge.ts` (`subjectLabel` verbatim jamais écrasée) |
| Ne jamais inventer un trait à partir d'un fait | **DÉJÀ** | **§7.3** (« Aucun PROFILE, BEHAVIOR, NEED ou GUARDRAIL ne doit être automatiquement produit ») + « ne produit pas automatiquement NEED_RELIEF » |
| Préférence négative ≠ interdiction (severity SOFT/HARD) | **DÉJÀ** | §7.2/§7.3 severity `SOFT`/`HARD` ; dictionnaire guardrail (severity ⟂ strength) |
| Si elle ne sait pas, elle n'extrait pas (zéro evidence) | **DÉJÀ** | §9 UNKNOWN (« Mieux vaut UNKNOWN ») + incognito **R-I2** (UNKNOWN_BY_REPORTER → zéro de tout) |

**RESTENT RÉELLEMENT ABSENTS (on les garde, c'est l'apport de ce lot) :**
1. **Résolution explicite de la tension 7a × extraction** (pour ne pas la re-trancher) : 7a interdit à **la prose** de déduire d'une réponse brute. L'extraction, elle, **déduit — c'est son métier — mais PRODUIT un tag tracé** (niveau 5, §48bis). La prose reformule ensuite **le tag**, pas la réponse brute → 7a respectée. Frontière : l'extraction produit des evidences ; la prose ne déduit jamais.
2. **Sortie validée par schéma** : l'extraction émet des evidences **structurées et validées**, jamais du texte libre réinjecté comme connaissance. *(Discipline d'implémentation, pas dans le HSG philosophique.)*

**Contradiction : aucune relevée** entre ces points et les fichiers d'autorité. *(Lot non construit — inventaire + renvois seulement. Structure canonique des familles : dictionnaire.)*

**DEUX POINTS DE SÉCURITÉ, ÉCRITS NOIR SUR BLANC (ne se déduisent jamais d'un mécanisme général) :**
- **ALLERGIE = `severity HARD`, toujours.** Même si le mécanisme `severity SOFT|HARD` est documenté ailleurs, une règle de sécurité se lit explicitement : une allergie (`food.allergy.*`) est **HARD**, jamais SOFT. Une préférence négative ordinaire reste SOFT par défaut.
- **LE TEXTE AFFICHÉ ET LA RÈGLE D'EXCLUSION SONT SÉPARÉS.** Un GUARDRAIL raconté en douceur sur la fiche (« l'exposition en public, qu'elle préfère éviter ») **n'affaiblit JAMAIS la sévérité stockée**. La fiche **raconte** (prose, type A), le moteur **exclut** (sur la `severity` de la donnée). **Un HARD reste un HARD** quelle que soit la douceur de la formulation. La restitution ne touche pas à la donnée.

---

# 48 septies. ANALYSE DE LA PAGE PROFIL — FIGÉE, RÉÉCRITE AU CHANGEMENT

**État constaté (inventaire 22 oct) :** l'analyse est **déjà figée**, pas recalculée à chaque vue. `generateProfileAnalysis` **upsert** dans la table `profile_analysis` (migration 30, « source unique d'analyse ») ; les écrans la **lisent** depuis cette table. Elle est **réécrite** quand `generateProfileAnalysis` est rappelé — aujourd'hui via `triggerSynthesis()` → `POST /api/profile/generate`, appelé à **chaque étape** de l'onboarding (chaque modification de la fiche du pilote). Donc le comportement demandé — *écrite une fois, stockée, réécrite à chaque modification de ma fiche, jamais regénérée à l'affichage* — **est déjà celui en place**.

**Ce qu'il faut maintenir (règle) :** (a) l'analyse vit dans `profile_analysis`, **lue** par les écrans, **jamais** regénérée au rendu ; (b) **toute** modification de la fiche du pilote **déclenche** une réécriture ; (c) quand l'analyse lira le JOURNAL, elle reste figée + réécrite au changement, elle lit le journal au lieu de my_profile. **Mécanisme unique pour l'analyse profil ET les textes de fiche proche** (même table `profile_analysis` : `contact_id` null = profil, `contact_id` set = fiche).

### Les TROIS SORTS d'une connaissance (décision 23 oct) — ne jamais les confondre

Le texte ne « périme » pas en bloc : selon ce qui change à sa source, trois sorts DISTINCTS.

- **a) DATÉ ET RÉVOLU** — un état, un événement : « en mars elle n'allait pas bien », « il s'est cassé la jambe en juin ». Ça ne devient pas **faux**, ça devient du **passé**. Ça **ne disparaît JAMAIS** : ça part dans une section **HISTORIQUE**, repliée par défaut, datée, classée par date. Cette section **EST le journal rendu visible** — pas un second rangement.
- **b) CORRIGÉ** — « elle déteste les fleurs » → corrigé en « elle les adore ». L'ancien texte n'est **pas de l'histoire, c'est une erreur** : il est **REMPLACÉ, pas archivé**, et ne s'affiche **nulle part**. L'evidence d'origine **reste dans le journal** (le journal n'efface rien) mais **n'est plus restituée** (récence/préséance).
- **c) SUPPRIMÉ / NON AUTORISÉ** — effacement demandé, consentement retiré : ça **DISPARAÎT PARTOUT, y compris de l'historique**. Aucune exception, **non négociable** : sinon l'historique devient l'endroit où survivent les données qu'on a demandé d'effacer.

### Péremption — PAR REQUÊTE, jamais par drapeau

Le texte stocké porte **`source_evidence_ids`** + **`generated_at`** (déjà présent). Pas de colonne `stale` (dérivé stocké = ment). On en déduit À L'AFFICHAGE **deux choses séparées** (`staleness.ts`) :
- **`needsRegeneration`** → le texte doit être **réécrit** : une source est postérieure (fates a/b), supprimée ou non autorisée (fate c). Réécriture **paresseuse à l'ouverture** (cf. déclencheur) ; la réécriture envoie le daté-révolu en HISTORIQUE (a) et laisse tomber le corrigé (b).
- **`mustNotDisplay`** → **SÉCURITÉ (fate c uniquement)** : une source **supprimée ou non autorisée** → le texte **ne s'affiche plus**, même avant réécriture. Pendant l'intervalle, les **éléments CALCULÉS** (podium, barres, niveaux, tags — lus en direct) tiennent la fiche. Une donnée effacée/non-autorisée ne survit **jamais** dans un texte en attente.

*(Si la requête s'avérait trop coûteuse à l'affichage, on rediscute avec le chiffre — pas avant.)*

### Déclencheur de régénération — ÉVÉNEMENTS de connaissance (pas « étapes »)

Déclencheurs, à propos du sujet concerné : **nouvelle evidence**, **`user_correction`**, **suppression**, **invalidation / non-autorisé**, **changement de CONSOLIDATION** (résultat consolidé modifié même sans écriture). Couvre onboarding, corrections futures depuis la page profil, et plus tard le conversationnel.

Deux règles de cadence (décision 24 oct — la fenêtre (b) 15 s est ABANDONNÉE : en serverless, pas de minuteur transverse ni de file d'attente ; (c) paresseux groupe déjà naturellement les changements rapprochés, donc (b) n'apportait qu'une régé proactive coûteuse sans gain de correction) :
- **a) Pendant un parcours déclaré** (onboarding, ou une section reprise) : **AUCUNE** régénération — **une seule, à la fin** du parcours. *(Corrige le « triggerSynthesis à chaque étape » actuel.)*
- **c) À l'ouverture d'une page dont le texte doit être réécrit** : régénération **immédiate, PARESSEUSE** (à l'ouverture, pas de minuteur).

**CONTREPARTIE DU PARESSEUX (obligatoire, tombe du découpage calculé/écrit) :** à l'ouverture d'une page dont le texte doit être réécrit, le **CALCULÉ s'affiche IMMÉDIATEMENT** — podium, barres, niveaux, tags, chips — et **seule la prose arrive après**. **Jamais une page vide** : une page qui **se complète**. *(Le calculé se lit en direct du journal, toujours exact ; la prose, plus lente, se régénère puis apparaît.)*

---

# 48 octies. GÉNÉRATION PAR SECTION — DEUX ÉTAGES (décision 24 oct)

Les textes sont **générés et stockés PAR SECTION** (table `profile_analysis_sections` : `section_key`, `text`, `source_evidence_ids`, `generated_at`, `tier`), jamais en un bloc — sinon on ne peut pas partager une section sans exposer les autres (le partage par section existe déjà : `scope`/`SectionPicker`/`visibility`). Chaque section régénérable **seule**.

**Piège évité — la cohérence d'ensemble.** Si chaque section était écrite isolément depuis ses seuls tags, personne ne tiendrait la cohérence et le résumé répéterait « En profondeur ». Donc **deux étages** (liste exacte, décision 24 oct) :
- **SECTIONS DE DÉTAIL** (`tier=detail`, écrites depuis **leurs tags**, régénérables seules) : les **4 blocs d'« En profondeur »** ; les **insights** du langage d'attention ; **la phrase par ligne de « Ce qui marche avec lui »** (les barres/niveaux sont calculés, **la phrase sous chaque niveau est écrite** — ce n'est PAS du calculé pur) ; **Son territoire** (se nourrit des **tags LIFESTYLE** — axe `aventureConfort` et parents, questions **fermées déjà câblées** → se remplit **dès maintenant**, n'attend pas l'extraction) ; **Son monde** et **Son univers** (ceux-là **dépendent du TEXTE LIBRE** — tables/voyages/passions/marques précises → **vides et signalées** tant que l'extraction n'existe pas).
- **SECTIONS DE SYNTHÈSE** (`tier=synthesis`, `depends_on_sections text[]`, écrites **APRÈS** en **recevant les détails**, pas seulement des tags) : le **RÉSUMÉ** en tête, l'**ANALYSE COMPLÈTE** (derrière « Lire l'analyse complète »), le **CARROUSEL « Ce que Candice a compris »**, et les **sections RELATIONNELLES** (mode d'emploi du duo, ce qui vous lie, là où vous vous ratez — elles comparent deux profils, donc synthèses par nature ; dans « vos langages comparés », **seules les barres sont du calculé**).
- **CALCULÉ PUR, sans prose** (aucun appel modèle) : le **podium/barres** du langage d'attention, les **barres duales** de « Vos langages comparés », les **infos pratiques** (FACTs), et la section de saisie **« Pour mieux viser »** (champs/CTA).

**Précision cascade (pour qu'elle reste à un seul niveau)** : le **RÉSUMÉ et l'ANALYSE COMPLÈTE sont écrits dans la MÊME passe**, tous deux depuis les sections de détail — **jamais l'un depuis l'autre** (sinon on recrée un 2ᵉ niveau). Les synthèses dépendent **uniquement** de détails, jamais d'autres synthèses.

### Nombre d'appels : DEUX, regroupés par étage — avec garantie (décision 24 oct)

**Deux appels** pour une génération complète : 1 passe **détail** (sortie structurée → toutes les sections de détail, chacune stockée à part), 1 passe **synthèse**. *(Le coût n'est pas l'argument — la génération complète n'arrive qu'en fin d'onboarding, une fois par abonné ; le cas fréquent est une correction = 1–2 appels dans toutes les options. Ce qui décide est la QUALITÉ : regrouper évite que deux sections proches se répètent ; mais un seul appel ne doit pas s'essouffler sur les dernières sections ni tomber toutes d'un coup.)*

**AUCUNE LIMITE DE LONGUEUR — ni plancher, ni plafond (décision 24 oct).** La longueur n'est pas un réglage, c'est une **conséquence de la matière** : une section se dimensionne sur ce qu'elle a reçu, et sur rien d'autre. Un plancher commanderait du délayage ; un plafond couperait quelqu'un qui s'est raconté (les textes libres peuvent être longs ou vides). Les deux sont faux. *(Mesure sur la maquette gelée : les textes longs vont de 128 à 305 caractères — un seuil à 300 en rejetterait quinze sur seize.)*

**LES DEUX SEULES FAUTES DE FOND — contrôlées MÉCANIQUEMENT (rend 7a vérifiable, pas seulement écrite), pour TOUTE section générée, détail comme synthèse :**
- **OMISSION** — toute la matière fournie doit être traitée. Le modèle renvoie la **liste de ce qu'il a traité** (sortie structurée) ; on la compare à l'entrée ; **il manque quelque chose → relance de cette section seule**.
- **INVENTION** — rien de ce qui est dit ne vient d'ailleurs que de la matière fournie. On compare **dans l'AUTRE SENS** : ce que le modèle dit avoir traité **doit exister dans l'entrée**. **Il cite ce qu'on ne lui a pas donné → invention → ÉCHEC.**

*(Les deux directions = égalité des ensembles : traité ⊇ entrée (pas d'omission) ET traité ⊆ entrée (pas d'invention). C'est 7a devenue mécanique.)*

**FAUTE DE FORME restante** : une section **VIDE alors qu'elle avait de la matière**, ou une phrase **TRONQUÉE en plein milieu**. → **relance de cette section seule** ; si la relance échoue, elle **reste vide et signalée** pendant que les autres s'affichent. **Jamais un échec global.**

**CONTRÔLE STRUCTUREL — COUVERTURE DES FAMILLES (décision 24 oct).** Le double contrôle omission/invention a un **angle mort** : il vérifie que tout ce qui a été DONNÉ à une section est traité, mais **pas** qu'une **famille entière** n'a jamais été donnée à aucune section. C'est le même angle mort qu'un étage plus haut (le texte libre). Donc, règle testée : **TOUTE FAMILLE DU DICTIONNAIRE QUI PRODUIT DES TAGS DOIT ÊTRE CONSOMMÉE PAR AU MOINS UNE SECTION.** Un test parcourt les familles produites et échoue si l'une n'apparaît dans aucune entrée de `SECTION_SPECS` (test `profile-sections` : couverture). *(Aujourd'hui : AFFECTION_LANGUAGE, NEED, PREFERENCE, PROFILE, GUARDRAIL, **DRIVER**, INTEREST → consommées. **BEHAVIOR : produite mais VOLONTAIREMENT non consommée** — sa maison sur la fiche est une décision de design d'Estelle non prise (registre « où vit BEHAVIOR ») ; on la laisse non placée et **signalée** plutôt qu'enfouie sous un autre sens. **ENTITY/CONTEXT** : exemptées faute de producteur — **l'exemption tombe dès que l'extraction les produit**.)* **DRIVER** (pourquoi une attention résonne) → deep_touch (DRV_ANTICIPATION « geste anticipé »), deep_loved (DRV_RELIEF « charge allégée / prise en charge »), works (DRV_PERSONALIZATION) — placé là où la maquette l'AFFICHE, pas « là où il tenait » (retiré de deep_pleasure, aucune chip DRIVER n'y figure).

**PRINCIPE (ce qui rend la décision peu risquée) : LE NOMBRE D'APPELS EST UN CHOIX D'IMPLÉMENTATION, RÉVERSIBLE. Le MODÈLE DE STOCKAGE ne l'est pas.** Le rangement, la péremption et le partage restent **par section quoi qu'il arrive** — donc si la qualité se dégrade, on **découpe plus finement plus tard** (plus d'appels) **sans rien casser** côté données.

**Péremption de la synthèse (dépendance) :** une section de synthèse est **périmée si l'une des sections de détail dont elle dépend a été RÉÉCRITE après** son propre `generated_at` (`synth.generated_at < max(detail.generated_at)` parmi ses dépendances). S'ajoute aux trois sorts : une détail qui change (fate a/b/c) → la détail se réécrit → les synthèses qui en dépendent deviennent périmées à leur tour. Cascade à un seul niveau (détail → synthèse ; les synthèses ne dépendent pas d'autres synthèses).

---

# 48 sexies. DEUX NATURES DE TEXTE — ON NE LES CONFOND PLUS

**A. TEXTE SUR UNE PERSONNE, construit à partir de ses tags** — respirations, analyse de la page profil, fiche d'un proche. C'est **le MODÈLE qui l'écrit, toujours** : il reformule, tisse, raconte, avec la pondération des tags. Il ne peut pas être écrit d'avance (il dépend de la personne). Règles : **7a** aucun attribut sans provenance ; **7b** la profondeur suit les tags, droit d'être bref ; **7c** seules les relations que le HSG définit ; **7d** les FACTs sensibles hors prose ; **7e** aucun domaine n'est omis s'il a des tags. Échec du modèle → **on n'affiche rien, l'étape est sautée**. **Un code brut à l'écran (« I1.1 », « ✓ ») est une FAUTE, pas une prudence** : reformuler un tag produit est le métier du modèle (7a l'autorise explicitement : « on reformule des tags produits »), pas une transgression.

**B. TEXTE DE L'APPLICATION** — questions, options, subtexts, boutons, titres d'écran, textes de l'écran de merge. C'est **ESTELLE**, écrit d'avance, au **registre éditorial**. Le modèle n'y touche jamais et n'en invente aucun.

*(Frontière : A dépend de la personne → modèle ; B est fixe → Estelle. On ne demande jamais à Estelle un libellé de type A, ni au modèle un texte de type B.)*

---

# 49. CANDICE N’EST PAS UN TEST PSYCHOLOGIQUE

Le HSG constitue une architecture de personnalisation relationnelle.

Il ne cherche pas à :

- diagnostiquer ;
- enfermer ;
- typologiser définitivement ;
- attribuer une identité fixe ;
- produire une vérité psychométrique exhaustive.

La personne peut être :

- contradictoire ;
- contextuelle ;
- évolutive ;
- difficile à réduire à un axe.

Le modèle doit préserver cette complexité lorsqu’elle est utile.

---

# 50. PRINCIPE FINAL

Le Human Signal Graph n’est pas une collection de tags.

Il doit permettre à Candice de comprendre progressivement :

> **ce que cette personne aime ;**
> 

> **ce qui l’intéresse ;**
> 

> **comment elle fonctionne ;**
> 

> **par quels signaux elle reçoit et exprime l’affection ;**
> 

> **ce dont elle a particulièrement besoin ;**
> 

> **pourquoi certaines choses résonnent ;**
> 

> **comment elle tend à agir ou réagir selon les situations ;**
> 

> **ce qui risque de faire échouer une attention ;**
> 

> **ce qui existe concrètement dans son univers ;**
> 

> **ce qui se passe actuellement dans sa vie ;**
> 

> **et dans quel contexte chacune de ces informations est vraie.**
> 

Pour comprendre et raconter la personne :

> **les informations brutes restent primaires ; les signaux structurés guident la saillance, la convergence et la confiance.**
> 

Pour agir pour elle :

> **Candice structure autant que possible la connaissance sans perdre ce qui dépasse la taxonomie.**
> 

Le but n’est pas de produire le profil le plus rempli.

Le but est de produire :

> **la compréhension la plus juste, la plus traçable, la plus contextualisée et la plus utile possible de cette personne — puis de savoir quoi en faire au bon moment.**
>