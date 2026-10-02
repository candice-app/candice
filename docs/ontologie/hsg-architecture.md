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