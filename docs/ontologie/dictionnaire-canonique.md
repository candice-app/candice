## Version consolidée Dictionnaire — référence canonique

### Rôle de ce document

Ce document définit **le vocabulaire officiel utilisé par Candice pour structurer ce qu’elle apprend d’une personne**.

Il répond à la question :

> **Quels concepts Candice utilise-t-elle pour représenter sa connaissance d’une personne ?**
> 

Il constitue la source de vérité concernant :

- les familles canoniques ;
- les constructs et codes ;
- leur définition ;
- leurs frontières sémantiques ;
- les structures associées ;
- les distinctions à préserver.

Il ne définit pas la mécanique détaillée permettant de transformer une information en evidence, de consolider plusieurs evidences ou de produire une inférence : cette responsabilité appartient au **Human Signal Graph — Architecture de connaissance, règles de raisonnement et de consolidation**.

En cas de divergence :

> **Le Dictionnaire canonique fait foi sur le sens des concepts. Le HSG fait foi sur leur utilisation, leur contextualisation et leur consolidation.**
> 

---

# 0. PRINCIPE GÉNÉRAL

Candice utilise **10 familles canoniques de signaux structurés** :

1. `INTEREST` — ce qui intéresse la personne ;
2. `PREFERENCE` — ce qu’elle aime, préfère, recherche ou évite concrètement ;
3. `PROFILE` — comment elle fonctionne et ce qui compte transversalement dans ses arbitrages ;
4. `AFFECTION_LANGUAGE` — par quels signaux elle reçoit et exprime l’affection ;
5. `NEED` — ce dont elle a particulièrement besoin émotionnellement ou relationnellement ;
6. `DRIVER` — pourquoi quelque chose résonne ou lui fait plaisir ;
7. `BEHAVIOR` — comment elle tend à agir ou réagir dans une situation donnée ;
8. `GUARDRAIL` — ce qui risque de faire échouer une attention ou doit être évité ;
9. `ENTITY` — les personnes, objets, marques, lieux, œuvres, aliments et autres éléments concrets de son univers ;
10. `CONTEXT` — ce qui caractérise sa situation de vie et modifie la pertinence ou l’interprétation des autres informations.

Ces 10 familles ne constituent **pas une taxonomie exhaustive de tout ce qu’une personne peut confier à Candice**.

Une information peut avoir une valeur autonome sans devoir être forcée dans l’une de ces familles.

Les faits explicites — biographiques, fonctionnels, contextuels, sensibles ou totalement imprévus — peuvent être conservés dans le HSG comme `FACT`.

> **FACT n’est pas une 11e famille canonique.**
> 

De même :

> **ONTOLOGY_GAP n’est pas une famille canonique.**
> 

Il s’agit d’un mécanisme permettant de signaler qu’une information récurrente et opérationnellement importante n’est pas correctement représentée par l’ontologie actuelle.

---

# 0.1 Structure commune des signaux

Lorsque pertinent, un signal peut porter :

`value`

`strength`

`confidence`

`context`

`source`

`timestamp`

`evidence_count`

`evidence_ids`

`stability = stable | evolving | contextual | temporary`

Le contexte appartient à **l’evidence et au signal qui en dérive**, pas administrativement à la question qui l’a produit.

Un même construct peut donc être :

- fortement établi dans un contexte ;
- faible ou inconnu dans un autre ;
- éventuellement consolidé transversalement lorsque plusieurs evidences indépendantes convergent.

`UNKNOWN` est un état légitime.

> **UNKNOWN ≠ LOW**
> 

> **absence d’evidence ≠ evidence négative**
> 

---

# 1. INTEREST

## Définition

Sujet, univers ou activité pour lequel la personne manifeste un **intérêt réel**.

INTEREST répond à :

> **« À quoi cette personne s’intéresse-t-elle réellement, et quelle relation entretient-elle avec ce sujet ? »**
> 

## Structure canonique

`topic`

`parent_domain`

`interest_level`

`expertise_level`

`curiosity_level`

`practice_level`

`identity_relevance`

Relation au sujet :

`casual | curious | enthusiast | passion | expert`

## Domaines parents initiaux

`food_gastronomy`

`wine_spirits`

`travel`

`fashion`

`beauty_skincare`

`jewelry_watches`

`design_decor`

`architecture`

`art`

`photography`

`music`

`cinema_series`

`books_literature`

`sport_fitness`

`outdoor_nature`

`tech`

`gaming`

`cars_mobility`

`craftsmanship`

`culture_history`

`science`

`business_entrepreneurship`

`personal_development`

`wellbeing`

`cooking`

`gardening`

`family_parenting`

`animals`

`collecting`

**Extensible : OUI.**

Le sujet précis doit être conservé même lorsqu’un domaine parent existe.

Exemple :

`topic = Formula 1`

`parent_domain = sport_fitness`

Il ne faut pas remplacer Formula 1 par le simple tag « sport ».

## Inclut

> « Je suis passionné de photographie argentique. »
> 

Peut produire :

`topic = photographie argentique`

`parent_domain = photography`

`relationship = passion`

## N’inclut pas automatiquement

> « J’aime les photos en noir et blanc. »
> 

Cela peut être une `PREFERENCE` esthétique sans démontrer un intérêt pour la photographie.

## Frontière importante

Préférence, curiosité, passion, pratique et expertise ne sont pas synonymes.

Une personne peut :

- être très curieuse sans pratiquer ;
- pratiquer sans se considérer passionnée ;
- être passionnée sans être experte ;
- être experte sans que le sujet soit identitaire.

---

# 2. PREFERENCE

## Définition

Goût, préférence, aversion ou critère de choix concret.

PREFERENCE répond à :

> **« Qu’est-ce que cette personne aime, préfère, recherche ou évite concrètement dans ce contexte ? »**
> 

## Structure

`PREFERENCE.[context].[attribute] = value`

Exemples :

`PREFERENCE.travel.hotel_style = intimate`

`PREFERENCE.food.spice = high`

`PREFERENCE.fashion.fit = oversized`

`PREFERENCE.music.listening_context = live`

**Extensible : OUI.**

## Inclut

> « Je préfère les petits hôtels de charme. »
> 

## N’inclut pas

Le **pourquoi** de cette préférence.

Si la personne aime les hôtels de charme parce qu’ils ont une histoire :

→ `DRV_STORY`

Si elle les aime parce qu’elle y recherche du calme :

→ potentiellement `DRV_COMFORT`

Une même information peut produire PREFERENCE + DRIVER lorsque les deux sont réellement exprimés.

## Frontière essentielle

Une préférence locale n’est pas automatiquement un fonctionnement transversal.

> `PREFERENCE.travel.hotel_style = intimate`
> 

ne suffit pas à conclure :

`PROFILE_SENSITIVITY`

`PROFILE_RELATIONALITY`

ou tout autre PROFILE.

---

# 3. PROFILE

PROFILE est un dictionnaire **fermé**.

Aucune nouvelle dimension PROFILE ne doit être créée sans validation explicite.

PROFILE contient trois ensembles distincts :

1. dimensions de fonctionnement transversal ;
2. orientations transversales de préférence et d’arbitrage ;
3. un continuum spécifique d’énergie sociale.

---

## 3.1 Dimensions de fonctionnement transversal

### `PROFILE_OPENNESS`

**Nom : Ouverture**

Curiosité, exploration, apprentissage et appétence pour la nouveauté.

N’inclut pas : aimer une chose nouvelle isolée.

Contextualisable : oui.

---

### `PROFILE_INTENSITY`

**Nom : Intensité**

Tendance à s’investir fortement, approfondir et développer des centres d’intérêt avec intensité.

N’inclut pas : simplement beaucoup aimer quelque chose.

Contextualisable : oui.

---

### `PROFILE_SENSITIVITY`

**Nom : Sensibilité**

Réceptivité élevée à certains stimuli ou nuances.

Sous-facettes :

`PROFILE_SENSITIVITY.sensory`

`PROFILE_SENSITIVITY.aesthetic`

`PROFILE_SENSITIVITY.emotional`

N’inclut pas : une préférence sensorielle, esthétique ou émotionnelle isolée.

---

### `PROFILE_STRUCTURE`

**Nom : Structure**

Importance accordée à l’organisation, l’anticipation, la prévisibilité et aux repères.

N’inclut pas : besoin d’avoir personnellement le dernier mot.

---

### `PROFILE_AUTONOMY`

**Nom : Autonomie**

Importance de pouvoir décider, agir à sa manière et préserver son indépendance.

N’inclut pas : introversion, solitude ou faible orientation relationnelle.

---

### `PROFILE_RELATIONALITY`

**Nom : Orientation relationnelle**

Place structurelle accordée aux relations, au collectif et à la proximité humaine.

N’inclut pas : sociabilité ou énergie sociale.

Une personne peut avoir une très forte orientation relationnelle tout en se fatiguant rapidement socialement.

---

### `PROFILE_EXACTINGNESS`

**Nom : Niveau d’exigence**

Attention portée à la précision, la cohérence, la qualité et au niveau d’exécution.

N’inclut pas : luxe ou premium.

---

### `PROFILE_ADAPTABILITY`

**Nom : Adaptabilité**

Facilité à composer avec le changement, les circonstances et l’imprévu.

N’inclut pas : aimer spontanément provoquer l’imprévu.

---

### `PROFILE_REFLECTIVENESS`

**Nom : Réflexivité**

Tendance à analyser, comprendre, approfondir et chercher du sens avant de conclure.

N’inclut pas : intelligence, expertise ou niveau d’études.

---

# 3.2 Orientations transversales de préférence et d’arbitrage

Ces constructs appartiennent à PROFILE parce qu’ils décrivent **ce qui tend à compter dans les choix à travers plusieurs contextes**.

Une préférence locale ne suffit généralement pas à les établir fortement.

### `APPETENCE_EXPERIENCE`

Plaisir/appétence pour les expériences.

N’est pas opposée à `APPETENCE_OBJECT`.

---

### `APPETENCE_OBJECT`

Plaisir/appétence pour les objets.

N’est pas opposée à `APPETENCE_EXPERIENCE`.

---

### `IMPORTANCE_AESTHETIC`

Importance du beau, de l’harmonie, du design et de la présentation dans la valeur perçue.

N’est pas opposée à `IMPORTANCE_FUNCTIONAL`.

---

### `IMPORTANCE_FUNCTIONAL`

Importance de l’usage, de l’efficacité et de la praticité.

---

### `IMPORTANCE_AUTHENTICITY`

Importance du vrai, du caractère, de l’origine, de la sincérité et de l’absence d’artifice.

N’est pas opposée au premium.

---

### `APPETENCE_PREMIUM`

Appétence pour un niveau élevé de prestation, finition, service ou expérience.

N’inclut pas automatiquement :

- qualité au sens large ;
- prestige ;
- statut social ;
- sensibilité aux marques ;
- esthétique ;
- rareté ;
- exclusivité.

`prestige/status` n’est pas un construct PROFILE canonique à ce stade.

---

### `APPETENCE_SPONTANEITY`

Plaisir à improviser, décider dans l’instant ou saisir une occasion.

N’est pas opposée à `IMPORTANCE_MASTERY`.

---

### `IMPORTANCE_MASTERY`

Importance accordée au fait de pouvoir choisir, décider ou valider personnellement certains paramètres considérés comme importants.

N’est pas `PROFILE_STRUCTURE`.

Une personne peut :

- rechercher la prévisibilité sans vouloir décider elle-même ;
- être spontanée tout en voulant garder la main sur certains choix importants.

---

# 3.3 `SOCIAL_ENERGY`

**Nom : Énergie sociale**

Continuum :

`recharge solitaire ←→ recharge sociale`

C’est le seul continuum bipolaire conservé à ce stade.

Il n’indique ni :

- la qualité des relations ;
- leur importance ;
- l’orientation relationnelle ;
- l’introversion au sens clinique ou typologique.

---

# 3.4 Règles PROFILE

Les constructs PROFILE sont indépendants sauf lorsque le Dictionnaire définit explicitement un continuum.

Un signal positif sur un construct ne produit pas automatiquement un signal négatif sur un autre.

Exemple :

`APPETENCE_EXPERIENCE +2`

ne signifie pas :

`APPETENCE_OBJECT -2`.

Une evidence négative n’existe que lorsque la réponse exprime réellement un rejet, une faible appétence ou une préférence comparative contraire.

Exemple :

> « Je préfère clairement les expériences aux objets. »
> 

peut produire une evidence positive sur `APPETENCE_EXPERIENCE` et une evidence contraire modérée sur `APPETENCE_OBJECT`.

---

# 4. AFFECTION_LANGUAGE — LANGAGES AFFECTIFS

Cette famille décrit **les modalités par lesquelles une personne reconnaît, reçoit et exprime l’affection**.

Elle répond à deux questions indépendantes :

**Réception :**

> « Qu’est-ce qui me fait particulièrement sentir l’affection de l’autre ? »
> 

**Expression :**

> « Comment est-ce que je tends naturellement à montrer mon affection aux autres ? »
> 

AFFECTION_LANGUAGE n’est ni un NEED, ni un DRIVER, ni une simple PREFERENCE.

---

# 4.1 Réception

### `AFFECTION_RECEIVE_WORDS`

Les mots sincères, compliments, paroles explicites ou rassurantes ont une forte portée affective.

### `AFFECTION_RECEIVE_SERVICES`

L’aide concrète, particulièrement lorsqu’elle est spontanée ou anticipée, constitue une preuve affective importante.

### `AFFECTION_RECEIVE_PERSONALIZED_GIFT`

Un cadeau pensé spécifiquement pour la personne constitue une preuve affective importante.

### `AFFECTION_RECEIVE_SYMBOLIC_GIFT`

Un cadeau chargé de sens, d’histoire ou de symbolique possède une forte portée affective.

### `AFFECTION_RECEIVE_QUALITY_TIME`

Le temps réellement consacré ensemble et la présence disponible constituent une preuve affective importante.

### `AFFECTION_RECEIVE_MICRO_ATTENTIONS`

Les petits gestes, détails et attentions du quotidien ont une forte portée affective.

### `AFFECTION_RECEIVE_SURPRISE`

L’initiative et l’inattendu peuvent constituer une preuve affective importante.

---

# 4.2 Expression

### `AFFECTION_GIVE_WORDS`

Tendance à montrer son affection par les mots, compliments, encouragements ou paroles explicites.

### `AFFECTION_GIVE_SERVICES`

Tendance à montrer son affection en aidant ou rendant service.

### `AFFECTION_GIVE_PERSONALIZED_GIFT`

Tendance à montrer son affection par des cadeaux choisis spécifiquement pour l’autre.

### `AFFECTION_GIVE_SYMBOLIC_GIFT`

Tendance à montrer son affection par des objets ou gestes chargés de sens.

### `AFFECTION_GIVE_QUALITY_TIME`

Tendance à montrer son affection en consacrant du temps et de la présence.

### `AFFECTION_GIVE_MICRO_ATTENTIONS`

Tendance à montrer son affection par de nombreuses petites attentions du quotidien.

### `AFFECTION_GIVE_SURPRISE`

Tendance à montrer son affection par des surprises et initiatives inattendues.

---

# 4.3 Réception et expression sont indépendantes

Ne jamais déduire RECEIVE de GIVE, ni GIVE de RECEIVE.

Une personne peut par exemple avoir :

`AFFECTION_GIVE_SERVICES = HIGH`

et :

`AFFECTION_RECEIVE_WORDS = HIGH`

Cette asymétrie constitue une information relationnelle utile.

Elle n’est pas une contradiction.

---

# 4.4 Plusieurs modalités peuvent être élevées

Candice ne cherche pas à attribuer un unique « langage de l’amour principal ».

Plusieurs modalités peuvent être simultanément fortes.

L’absence d’evidence concernant une modalité signifie :

`UNKNOWN`

et non :

`LOW`.

---

# 4.5 Cadence des attentions

La modalité affective doit être distinguée de la cadence souhaitée.

Lorsque l’information existe :

`affection_cadence = regular_micro | rare_marking | contextual | unknown`

et éventuellement :

`regularity_importance = 0–4`

Exemple :

> « Une petite attention régulière »
> 

peut renseigner une modalité de micro-attention et une cadence `regular_micro`.

> « Un grand moment rare mais marquant »
> 

peut renseigner `rare_marking`.

Le mot « rare » ne suffit pas à produire `DRV_RARITY`.

La cadence affective ne doit jamais être transformée automatiquement en `PROFILE_STRUCTURE`.

---

# 4.6 Frontières

`AFFECTION_LANGUAGE`

= **par quoi l’affection est reconnue ou exprimée.**

`NEED`

= **quel état émotionnel ou relationnel est particulièrement recherché, vulnérable ou nécessaire.**

`DRIVER`

= **pourquoi une attention précise résonne.**

`BEHAVIOR`

= **comment la personne tend à agir ou réagir dans une situation.**

`PROFILE`

= **ce que plusieurs evidences permettent de comprendre du fonctionnement transversal.**

Exemple :

> « Un cadeau pensé spécialement pour moi »
> 

peut produire :

`AFFECTION_RECEIVE_PERSONALIZED_GIFT`

`DRV_PERSONALIZATION`

éventuellement `APPETENCE_OBJECT +1` comme evidence secondaire.

Mais pas automatiquement :

`NEED_SEEN_UNDERSTOOD`

ou :

`NEED_LOVED_MATTER`.

---

# 5. NEED

Dictionnaire **fermé à ce stade**.

### `NEED_SEEN_UNDERSTOOD`

Être vu, écouté et compris dans sa singularité.

### `NEED_LOVED_MATTER`

Sentir qu’on compte affectivement.

### `NEED_RHYTHM_RESPECT`

Voir son rythme, son espace et son tempo respectés.

### `NEED_REASSURANCE`

Être rassuré face à l’incertitude.

### `NEED_LIGHTNESS`

Pouvoir vivre rire, jeu et légèreté.

### `NEED_CELEBRATION`

Se sentir célébré lors des moments importants.

### `NEED_RELIEF`

Être concrètement aidé ou soulagé.

### `NEED_SUPPORT`

Se sentir soutenu et entouré.

### `NEED_ACCEPTANCE`

Être accepté tel qu’on est.

### `NEED_RECOGNITION`

Se sentir reconnu et valorisé.

### `NEED_FREEDOM`

Préserver liberté et espace de décision.

### `NEED_CONNECTION`

Ressentir proximité et connexion.

### `NEED_TRUST`

Pouvoir compter sur la fiabilité de l’autre.

### `NEED_CHOSEN`

Se sentir choisi, désiré ou priorisé.

### `NEED_STIMULATION`

Être nourri intellectuellement, émotionnellement ou expérientiellement.

### `NEED_CONTRIBUTION`

Pouvoir contribuer, aider ou transmettre.

---

# 5.1 Frontière fondamentale des NEED

Un NEED ne doit pas être attribué parce qu’une réponse peut vaguement être reliée à cet état.

Il doit exister une evidence concernant :

- un état particulièrement recherché ;
- une condition relationnelle importante ;
- une vulnérabilité ;
- une blessure ;
- un manque particulièrement saillant.

Exemple :

> « Quand je vais mal, je cherche mes proches. »
> 

décrit d’abord un `BEHAVIOR`.

Cela ne suffit pas à produire `NEED_CONNECTION` ou `NEED_SUPPORT`.

À l’inverse :

> « Quand je vais mal, ce dont j’ai vraiment besoin est de sentir que quelqu’un est là pour moi. »
> 

peut produire `NEED_SUPPORT`.

---

# 6. DRIVER

Dictionnaire contrôlé.

Un DRIVER explique :

> **Pourquoi quelque chose produit-il de la valeur, du plaisir ou de la résonance pour cette personne ?**
> 

### `DRV_PERSONALIZATION`

C’est spécifiquement adapté à moi.

### `DRV_ATTENTIVENESS`

Cela prouve qu’on m’a écouté ou remarqué.

### `DRV_SYMBOLISM`

Ce que le geste représente compte.

### `DRV_MEMORY`

Cela crée ou réactive un souvenir.

### `DRV_STORY`

Cela possède une histoire intéressante.

### `DRV_TRANSMISSION`

Cela peut être conservé ou transmis.

### `DRV_SHARED_EXPERIENCE`

Le plaisir vient de l’expérience vécue ensemble.

### `DRV_CONNECTION`

Cela renforce directement le lien.

### `DRV_EFFORT`

L’effort investi participe à la valeur.

### `DRV_ANTICIPATION`

Quelqu’un a anticipé un besoin ou une envie.

### `DRV_TIMING`

La justesse du moment compte.

### `DRV_SURPRISE`

L’inattendu augmente le plaisir.

### `DRV_DISCOVERY`

Cela permet une découverte.

### `DRV_EXPERTISE`

Le choix est pointu ou connaisseur.

### `DRV_AESTHETIC`

La beauté crée du plaisir.

### `DRV_QUALITY`

La qualité intrinsèque crée de la valeur.

### `DRV_RARITY`

La rareté elle-même compte.

### `DRV_EXCLUSIVITY`

L’accès privilégié compte.

### `DRV_UTILITY`

L’utilité procure de la valeur.

### `DRV_RELIEF`

Cela enlève une contrainte.

### `DRV_COMFORT`

Cela apporte confort ou douceur.

### `DRV_SIMPLICITY`

La simplicité elle-même plaît.

### `DRV_AUTHENTICITY`

Le caractère vrai, sincère ou sans artifice crée de la valeur.

### `DRV_CELEBRATION`

Mettre en valeur un moment compte.

### `DRV_PLAYFULNESS`

Le jeu, l’amusement, l’humour ou la légèreté créent du plaisir.

---

# 6.1 Frontière essentielle DRIVER / PROFILE

`IMPORTANCE_AESTHETIC`

= **le beau compte généralement dans mes choix.**

`DRV_AESTHETIC`

= **la beauté est une raison pour laquelle cette attention précise me procure du plaisir.**

Même distinction pour :

- authenticité ;
- qualité ;
- simplicité ;
- etc.

---

# 6.2 DRIVER ≠ mot-clé

Un DRIVER est attribué au **sens de l’evidence**, jamais à la présence lexicale d’un mot.

Exemple :

> « Les mots sincères me touchent. »
> 

ne produit pas automatiquement `DRV_AUTHENTICITY`.

La sincérité peut simplement qualifier les mots.

En revanche :

> « Peu importe que ce soit simple : ce qui compte pour moi, c’est que ce soit sincère. »
> 

peut réellement démontrer `DRV_AUTHENTICITY`.

---

# 7. BEHAVIOR

## Définition

Manière déclarée ou suffisamment observée dont une personne tend à **agir, réagir, décider ou communiquer dans une situation identifiable**.

BEHAVIOR répond à :

> **« Comment cette personne tend-elle à agir ou réagir lorsque X se produit ? »**
> 

Cette famille existe parce que ces patterns comportementaux possèdent une valeur opérationnelle propre pour Candice.

Deux personnes peuvent avoir des besoins ou préférences proches tout en nécessitant des attentions très différentes selon leur manière de réagir à une situation.

---

# 7.1 Structure canonique

Structure minimale :

`context`

`pattern`

`strength`

`confidence`

`stability`

`source`

`timestamp`

`evidence_ids`

Lorsque pertinent :

`trigger`

`target`

Le vocabulaire des `pattern` est **extensible mais normalisé**.

Candice ne doit pas générer librement une infinité de synonymes pour le même comportement.

Lorsqu’un pattern existant correspond au sens de l’evidence, il doit être réutilisé.

De nouveaux patterns peuvent être créés lorsque l’information ne peut réellement pas être représentée par les patterns existants, sans pour autant créer une nouvelle famille.

---

# 7.2 Contextes initiaux

Le contexte fait partie intégrante du signal BEHAVIOR.

Premiers contextes issus de l’architecture actuelle :

`stress_response`

`conflict_response`

`decision_process`

`emotional_expression`

Cette liste n’est pas fermée.

Le Discovery peut notamment révéler :

`distress_response`

`grief_response`

`change_response`

`help_seeking`

`celebration_behavior`

ou d’autres contextes réellement utiles.

---

# 7.3 Exemples

> « Quand je suis stressé, je m’isole. »
> 

peut produire :

`context = stress_response`

`pattern = withdraw`

---

> « Quand je suis stressé, j’essaie de reprendre le contrôle sur ce que je peux. »
> 

peut produire :

`context = stress_response`

`pattern = regain_control`

---

> « En désaccord, j’utilise souvent l’humour pour dédramatiser. »
> 

peut produire :

`context = conflict_response`

`pattern = use_humor_to_defuse`

---

> « Avant une décision importante, je fais énormément de recherches. »
> 

peut produire :

`context = decision_process`

`pattern = extensive_research`

et éventuellement une evidence distincte vers `PROFILE_REFLECTIVENESS` si le mapping le justifie.

---

# 7.4 BEHAVIOR ≠ PROFILE

BEHAVIOR décrit :

> **ce que la personne tend à faire dans une situation.**
> 

PROFILE décrit :

> **un fonctionnement ou une orientation suffisamment transversal et consolidé.**
> 

Exemple :

> « En conflit, je prends du temps avant de répondre. »
> 

peut être BEHAVIOR sans démontrer `PROFILE_REFLECTIVENESS`.

---

# 7.5 BEHAVIOR ≠ NEED

BEHAVIOR :

> **ce que je tends à faire.**
> 

NEED :

> **ce dont j’ai particulièrement besoin.**
> 

> « Quand je vais mal, je m’isole. »
> 

ne signifie pas automatiquement :

`NEED_RHYTHM_RESPECT`

`NEED_FREEDOM`

ou tout autre NEED.

---

# 7.6 BEHAVIOR ≠ PREFERENCE

Un comportement peut se produire sans être consciemment préféré.

> « Sous stress, je cherche à tout contrôler »
> 

n’équivaut pas à :

> « Je préfère tout contrôler. »
> 

---

# 7.7 BEHAVIOR ≠ DRIVER

Un mode de réaction n’indique pas automatiquement ce qui donne de la valeur à une attention.

> « J’utilise l’humour pendant un conflit »
> 

ne produit pas automatiquement `DRV_PLAYFULNESS`.

---

# 7.8 BEHAVIOR ≠ GUARDRAIL

Un comportement n’est pas automatiquement une interdiction.

> « Quand je vais mal, je m’isole »
> 

ne suffit pas à conclure :

`GRD_TOO_INTRUSIVE = HARD`.

Une evidence distincte peut néanmoins établir ce guardrail.

---

# 7.9 Utilité opérationnelle

BEHAVIOR peut notamment modifier :

- le type d’attention ;
- le canal ;
- le timing ;
- le degré d’intrusion ;
- la quantité de sollicitation ;
- le nombre de décisions demandées ;
- la présence d’autres personnes ;
- la manière de proposer de l’aide.

Il devient particulièrement important lors de situations telles que :

- stress ;
- conflit ;
- deuil ;
- maladie ;
- rupture ;
- épuisement ;
- échec ;
- transition de vie ;
- décision difficile.

---

# 8. GUARDRAIL

## Définition

Contrainte, aversion ou condition susceptible de **faire échouer une attention**, de rendre une recommandation inadaptée ou d’imposer une manière particulière de l’exécuter.

Le dictionnaire est **contrôlé mais extensible**.

---

# 8.1 Sévérité

Chaque evidence GUARDRAIL porte :

`severity = SOFT | HARD`

La sévérité appartient **à l’evidence**, et non intrinsèquement au code.

Un même guardrail peut donc être SOFT pour une personne et HARD pour une autre.

### SOFT

Préférence négative, inconfort ou prudence.

Exemples :

> « Ce n’est pas trop mon truc. »
> 

> « Je préfère éviter. »
> 

Une incompatibilité SOFT entraîne généralement une pénalité forte dans le matching, mais pas nécessairement une exclusion absolue.

### HARD

Refus explicite, aversion forte, impossibilité ou contrainte à ne pas violer.

Exemples :

> « Je déteste ça. »
> 

> « Surtout pas. »
> 

> « Jamais. »
> 

> « Je refuse. »
> 

> « Je suis allergique à… »
> 

Un HARD incompatible doit éliminer la recommandation dans le contexte concerné.

> **HARD n’est donc pas réservé aux contraintes médicales, physiques ou légales.**
> 

---

# 8.2 Portée opérationnelle

Lorsque pertinent, un GUARDRAIL porte également :

`scope = selection | execution | context`

### `selection`

Le guardrail concerne **ce qui peut être proposé**.

### `execution`

Le guardrail concerne **la manière dont l’attention doit être réalisée**.

### `context`

Le guardrail n’est valable que dans une situation déterminée.

Exemple :

`GRD_POOR_EXECUTION`

peut être :

`severity = HARD`

`scope = execution`

Cela ne signifie pas nécessairement :

> ne jamais proposer de surprise.
> 

Cela signifie :

> ne pas proposer une attention dont Candice n’est pas suffisamment certaine qu’elle pourra être correctement exécutée.
> 

---

# 8.3 Codes canoniques

### Social

`GRD_PUBLIC_EXPOSURE`

`GRD_TOO_MANY_PEOPLE`

`GRD_FORCED_SOCIALIZATION`

### Organisation

`GRD_SCHEDULE_DISRUPTION`

`GRD_LAST_MINUTE`

`GRD_LOSS_OF_CONTROL`

### Émotion

`GRD_TOO_INTIMATE`

`GRD_TOO_EMOTIONAL`

`GRD_SENTIMENTAL_OVERLOAD`

### Sensoriel

`GRD_NOISE`

`GRD_CROWD`

`GRD_STRONG_SMELL`

### Qualité

`GRD_LOW_QUALITY`

`GRD_POOR_EXECUTION`

### Relationnel

`GRD_IMPERSONAL`

`GRD_GENERIC`

`GRD_TOO_INTRUSIVE`

### Style

`GRD_STYLE_MISMATCH`

### Guardrails verticaux extensibles

Exemples :

`food.allergy.*`

`food.dislike.*`

`fashion.never_wear.*`

`travel.*`

etc.

---

# 9. ENTITY

## Définition

Une ENTITY représente **une chose réelle et identifiable**, et non un mécanisme psychologique.

Candice doit pouvoir conserver précisément ce qui existe dans l’univers de la personne.

## Types canoniques initiaux

`ENTITY_PERSON`

`ENTITY_BRAND`

`ENTITY_PRODUCT`

`ENTITY_PLACE`

`ENTITY_RESTAURANT`

`ENTITY_HOTEL`

`ENTITY_DESTINATION`

`ENTITY_ARTIST`

`ENTITY_AUTHOR`

`ENTITY_BOOK`

`ENTITY_FILM_SERIES`

`ENTITY_MUSIC`

`ENTITY_SPORT_TEAM`

`ENTITY_EVENT`

`ENTITY_HOBBY`

`ENTITY_OBJECT`

`ENTITY_FOOD`

`ENTITY_DRINK`

`ENTITY_STYLE`

`ENTITY_COLOR`

`ENTITY_MATERIAL`

## Relations

`LOVE`

`LIKE`

`CURIOUS`

`WANT_TO_TRY`

`WANT_TO_OWN`

`WANT_TO_VISIT`

`NEUTRAL`

`DISLIKE`

`AVOID`

Exemple :

`ENTITY_DESTINATION = Japan`

`relation = WANT_TO_VISIT`

---

# 9.1 ENTITY peut coexister avec d’autres informations

> « J’adore Jacquemus. »
> 

produit au minimum :

`ENTITY_BRAND = Jacquemus`

`relation = LOVE`

Cela peut également contribuer à une préférence stylistique ou à un intérêt pour la mode **uniquement si l’information le justifie réellement**.

> « Mon film préféré est Interstellar. »
> 

→ `ENTITY_FILM_SERIES = Interstellar`

→ `LOVE`

> « Je déteste la coriandre. »
> 

→ `ENTITY_FOOD = coriandre`

→ `DISLIKE`

> « J’aimerais beaucoup avoir un sac Loewe Puzzle. »
> 

→ `ENTITY_PRODUCT = Loewe Puzzle`

→ `WANT_TO_OWN`

Candice doit retenir **l’objet précis**, et pas uniquement transformer l’information en catégorie générale.

---

# 10. CONTEXT

## Définition

Information structurée sur **la situation de vie de la personne** susceptible de modifier la pertinence ou l’interprétation des autres signaux.

Codes initiaux :

`CONTEXT_LIFE_STAGE`

`CONTEXT_RELATIONSHIP`

`CONTEXT_PARENTING`

`CONTEXT_PROFESSION`

`CONTEXT_LOCATION`

`CONTEXT_HOME`

`CONTEXT_PET`

`CONTEXT_CURRENT_PROJECT`

`CONTEXT_TRANSITION`

`CONTEXT_CONSTRAINT`

**Extensible avec validation.**

Exemple :

> « Je viens d’avoir un bébé. »
> 

peut produire :

`CONTEXT_LIFE_STAGE`

et/ou :

`CONTEXT_PARENTING`

selon le niveau de représentation retenu.

Cela ne produit automatiquement aucun :

`PROFILE`

`NEED`

`DRIVER`

ou `BEHAVIOR`.

---

# 11. FACT — COUCHE DE CONNAISSANCE HORS FAMILLES CANONIQUES

`FACT` n’est pas une famille canonique.

Il permet à Candice de conserver une information qui possède une **valeur sémantique propre**, même lorsqu’elle ne correspond pas naturellement aux 10 familles.

Exemples :

> « J’ai vécu dix ans au Japon. »
> 

> « Je suis TDAH. »
> 

> « Je me déplace en fauteuil roulant. »
> 

> « La charge mentale m’épuise vite. »
> 

> « Mon père est décédé cette année. »
> 

> « Je ne bois pas d’alcool. »
> 

Le fait doit être conservé sans obligation de lui trouver un signal psychologique.

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

Lorsque cela apporte une meilleure structuration, un FACT peut également conserver des éléments tels que :

`subject`

`relation`

`effect`

Exemple :

`fact_type = functional_impact`

`subject = mental_load`

`relation = causes`

`effect = rapid_exhaustion`

---

# 11.1 FACT peut produire des signaux

Un FACT peut produire :

- aucun signal ;
- un signal ;
- plusieurs signaux.

Mais :

> **le FACT ne disparaît jamais lorsqu’un signal en est dérivé.**
> 

Exemple :

> « Je suis allergique aux noix. »
> 

peut conserver le FACT d’allergie déclarée et produire un GUARDRAIL alimentaire HARD.

---

# 11.2 Informations sensibles

Candice distingue strictement :

> **condition explicitement déclarée**
> 

de :

> **condition inférée.**
> 

Une condition de santé, un handicap, une neurodivergence, une religion ou une autre information sensible ne doit jamais être diagnostiquée ou inférée à partir de signaux indirects.

Lorsqu’une personne choisit explicitement de communiquer cette information, elle peut être conservée comme fait déclaré selon les règles de consentement, confidentialité et traitement applicables au produit.

Une condition déclarée ne produit pas automatiquement les comportements, besoins, traits ou contraintes statistiquement associés à cette condition.

> **condition ≠ conséquences supposées**
> 

Candice privilégie les conséquences fonctionnelles réellement déclarées ou légitimement observées.

---

# 12. CONNAISSANCE OUVERTE STRUCTURÉE

Le Dictionnaire canonique contrôle les concepts transversaux importants.

Il ne doit cependant jamais limiter **ce que Candice est capable d’apprendre**.

La connaissance descriptive est donc **sémantiquement ouverte**.

Cela ne signifie pas que l’IA doit inventer librement des noms de tags.

Lorsqu’une information ne nécessite pas un construct canonique, elle doit être représentée de manière structurée, par exemple avec :

`type`

`subject`

`relation`

`intensity`

`context`

`source`

Exemple :

plutôt que de créer :

`ADORE_PHOTO_ARGENTIQUE`

ou :

`ANALOG_PHOTO_LOVER`

Candice peut conserver :

`type = INTEREST`

`subject = photographie argentique`

`relation = passion`

`strength = strong`

`source = open_answer`

Pour une information totalement imprévue qui ne rentre pas proprement dans une famille canonique :

→ conserver le FACT ou l’assertion structurée.

> **Une information pertinente ne doit jamais disparaître simplement parce que le Dictionnaire n’avait pas anticipé son contenu exact.**
> 

---

# 13. ONTOLOGY_GAP

`ONTOLOGY_GAP` n’est pas une famille et ne doit pas devenir un réflexe dès qu’une information ne possède pas de code fermé.

L’absence de code canonique n’est **pas en elle-même un gap**.

Un véritable ONTOLOGY_GAP existe lorsque l’information :

1. apparaît de manière récurrente ;
2. possède une importance opérationnelle réelle ;
3. nécessite une logique spécifique de raisonnement, de contextualisation ou de consolidation ;
4. ne peut pas être correctement représentée par les familles existantes ou par la connaissance ouverte structurée.

C’est précisément ce critère qui justifie `BEHAVIOR` :

les modes de réaction apparaissent dans plusieurs questions et contextes, doivent être consolidés avec leur contexte, et peuvent modifier directement la manière dont Candice agit.

À l’inverse :

> « J’ai vécu à Tokyo entre 2014 et 2018 »
> 

ne nécessite pas une nouvelle famille.

FACT + ENTITY + éventuellement CONTEXT suffisent.

---

# 14. FRONTIÈRES CANONIQUES ESSENTIELLES

Ces distinctions doivent être préservées dans tout le produit.

### INTEREST ≠ PREFERENCE

« La photographie me passionne » ≠ « j’aime les photos en noir et blanc ».

### PREFERENCE ≠ PROFILE

Une préférence locale ne devient pas automatiquement un trait transversal.

### PROFILE ≠ BEHAVIOR

Fonctionnement transversal ≠ réaction dans une situation précise.

### BEHAVIOR ≠ NEED

Ce que je fais ≠ ce dont j’ai besoin.

### BEHAVIOR ≠ PREFERENCE

Ce que je tends à faire ≠ ce que je choisis ou préfère.

### AFFECTION_LANGUAGE ≠ NEED

Par quoi je reconnais l’affection ≠ état relationnel dont j’ai particulièrement besoin.

### AFFECTION_LANGUAGE ≠ DRIVER

Modalité affective ≠ raison pour laquelle une attention résonne.

### DRIVER ≠ FORMAT

Objet, expérience, mot, service ou surprise ≠ mécanisme qui lui donne de la valeur.

### GUARDRAIL ≠ PREFERENCE NÉGATIVE ORDINAIRE

Une préférence négative peut devenir un guardrail lorsqu’elle est suffisamment pertinente pour modifier ou exclure une recommandation.

### FACT ≠ SIGNAL PSYCHOLOGIQUE

Une réalité personnelle peut être opérationnellement essentielle sans révéler quoi que ce soit du fonctionnement psychologique.

### CONTEXT ≠ PROFILE

Une situation de vie ne permet pas automatiquement de déduire un fonctionnement.

---

# 15. VOCABULAIRE CANONIQUE UNIQUE

Le rôle du Dictionnaire est d’empêcher que le Human Signal Graph devienne une accumulation de synonymes.

Si le concept existe déjà :

> **utiliser le code canonique existant.**
> 

Ne pas créer simultanément :

`aime_beau`

`sensible_esthétique`

`importance_design`

`raffinement`

si l’information correspond réellement à un construct déjà défini.

En revanche, le Dictionnaire ne doit pas faire disparaître la granularité concrète.

Candice doit pouvoir conserver simultanément :

> aime le design brutaliste ;
> 

> adore l’hôtel X ;
> 

> photographie argentique = passion ;
> 

> esthétique importante transversalement ;
> 

> beauté = driver de certaines attentions.
> 

Ces informations ne sont pas redondantes : elles existent à des niveaux différents.

---

# 16. FONCTION DU DICTIONNAIRE DANS CANDICE

Le Dictionnaire permet à :

**Onboarding**

**Discovery**

**conversations**

**récits**

**Carnet d’envies**

**informations données par les proches**

**observations autorisées**

**catalogue d’attentions**

de parler **le même langage structuré**.

Le questionnaire n’est donc pas la base de données.

> **Le Human Signal Graph est la base de connaissance.**
> 

Toutes les sources viennent progressivement l’enrichir.

---

# 17. PORTRAIT ET DICTIONNAIRE

Le Dictionnaire aide Candice à raisonner.

Il ne constitue **pas le texte source du portrait**.

Pour produire le portrait d’une personne, Candice doit pouvoir relire et synthétiser :

- les réponses brutes ;
- les réponses ouvertes ;
- les récits ;
- les faits ;
- les nuances ;
- les contradictions ;
- les informations contextualisées ;
- les signaux structurés ;
- leurs forces ;
- leur convergence ;
- leur niveau de confiance.

Le portrait ne doit donc jamais être une traduction mécanique du type :

`PROFILE_RELATIONALITY = HIGH`

→

> « Tu es très relationnel. »
> 

Les signaux structurés servent à déterminer **ce qui semble suffisamment soutenu, transversal, contextualisé ou incertain**.

La formulation finale doit revenir à la richesse des evidences originales.

---

# 18. PRINCIPE FINAL

Le vocabulaire canonique doit permettre à Candice de représenter :

> **ce qui intéresse la personne ;**
> 

> **ce qu’elle aime et préfère concrètement ;**
> 

> **comment elle fonctionne ;**
> 

> **comment elle reçoit et exprime l’affection ;**
> 

> **ce dont elle a particulièrement besoin ;**
> 

> **pourquoi certaines choses résonnent ;**
> 

> **comment elle tend à agir et réagir selon les situations ;**
> 

> **ce qui risque de faire échouer une attention ;**
> 

> **les choses, personnes, lieux, marques, œuvres et objets concrets de son univers ;**
> 

> **le contexte dans lequel tout cela est vrai.**
> 

Et lorsqu’une information importante dépasse ce vocabulaire :

> **Candice la conserve au lieu de la forcer ou de la perdre.**
> 

Le Dictionnaire doit être **suffisamment stable pour que tout le produit parle la même langue, mais jamais suffisamment rigide pour empêcher Candice d’apprendre quelque chose que nous n’avions pas prévu.**