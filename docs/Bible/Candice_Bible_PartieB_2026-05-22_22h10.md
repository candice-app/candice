# Modèle d'Analyse Candice — Partie B : Bible produit

> **🟢 VERSION COURANTE — enregistrée le 22/05/2026 à 22h10 (Paris).** C'est CETTE copie qu'il faut garder dans le projet et déposer dans `docs/` du repo ; supprime toutes les autres copies de la bible.

> **Statut : en construction, module par module.** Chaque module est complet et soigné.
> Cette Partie B applique strictement les règles de la **Partie A** (Fondations & méthode). Elle ne réintroduit aucune décision : elle les incarne.
> Format de chaque réponse, sans exception : **(1) texte visible · (2) sous-texte visible · (3) analyse interne invisible** (dimensions / traits / matching).
> Règle de scoring rappelée : choix #1 = +5 · #2 = +3 · #3 = +1 · 1 à 2 dimensions par option · même score appliqué aux deux dimensions · jamais de pondération asymétrique intra-option.
>
> **🔒 Verrou — interne vs affiché.** Le scoring d'attention 7D est le seul score *produit*. Le tempérament et le lifestyle restent des **traits / indices internes** : jamais une note, une barre, un pourcentage ni une catégorie figée affichés à l'utilisateur. Tout output visible est **humain, nuancé, narratif, relationnel** — la sensation visée est « on me comprend », jamais « on m'a analysé froidement ». Les encodages chiffrés (`+2`, poids, intensités) qui apparaissent dans ce document sont la **mécanique interne**, jamais l'interface.
>
> **🔒 Verrou — couche langages d'attention.** Les 7 dimensions sont présentées à l'utilisateur comme ses **langages d'attention** (une version enrichie et plus fine des « langages de l'amour ») — c'est la couche immédiatement lisible. On distingue toujours **deux faces** : comment la personne aime **recevoir** l'attention (*vecteur de réception*, Q1-Q4) et comment elle l'**exprime** naturellement (*vecteur d'expression*, Question E). L'écart entre l'expression de l'un et la réception de l'autre est le **cœur narratif du matching**.
>
> **🔒 Verrou — couche déclarée vs couche révélée (analyse à deux couches).** L'analyse repose sur deux couches stockées séparément. **Couche 1, le déclaré (déterministe)** : les vecteurs issus des questions fermées classées (réception Q1-Q4, expression Q E), calculés par le moteur de scoring — squelette stable, testable, jamais réécrit. **Couche 2, le révélé (qualitatif, généré par Claude)** : à partir des champs libres (Étape 6, réponses ouvertes) et des langages, on stocke une lecture structurée — signaux révélés, **vetos durs** (ex. tactile, parfum de rose), **marqueurs concrets** (ex. « un pique-nique sur un bateau ») et surtout les **divergences** avec la couche 1. Quand le révélé diverge du déclaré (on coche parfois ce qu'on croit devoir cocher, ou l'on manque de netteté), la couche 2 vient **étoffer et nuancer** l'analyse, jamais la contredire : jamais « tu dis X mais en vrai Y », on tisse les faits concrets (« ce qui revient chez toi, c'est… »). Les réponses ouvertes ne sont **jamais scorées ni chiffrées** : elles servent de vetos, de texture et de matière narrative. Le profil « réel » exploité par les recommandations = langages (couche 1) **nuancés** par le révélé (couche 2).

> **🎨 Verrou — Direction artistique & Ton (sources de vérité externes, ajoutées le 22/05/2026).** La DA et le ton ne vivent PAS dans cette bible : ils ont leurs propres docs vivants dans le repo. Toute interface et tout texte généré s'y conforment.
> - **DA figée « Présence » V11** → `docs/design-system.html` (tokens exacts), `docs/reference-app.html` (accueil + Mes proches), `docs/reference-questionnaire.html` (questionnaire + le moment). En résumé : **blanc marbre lumineux** dominant, **vert sapin presque encre** = ADN (accents + masses pleines), **champagne** = lumière seule, signatures **le point** + **le fil**, typo **Fraunces + DM Sans**. **Deux layouts distincts** : mobile = bottom bar + colonne pleine ; desktop ≥1024px = rail latéral gauche + colonne centrée (jamais étirer le mobile). *Abandonnés : terra, cream, Playfair.* **Nav finale** : Accueil · Proches · [● Candice = parler à Candice] · Idées · Profil (sidebar remplacée par bottom bar mobile / rail desktop).
> - **Ton Candice** → `docs/ton-candice.md`. Règle d'or : chaque texte donne « **on me comprend finement** », jamais « une IA m'analyse froidement ». Interdits : profil/personnalité/type/diagnostic/compatibilité/résultat, fort/faible, score, %, jargon psy. Préférer : « tu sembles… », « on devine… », « ce qui semble compter pour toi ». Candice ne juge pas, elle traduit.

**Sommaire de la bible**
1. **Module 1 — Étape 1 : Ce qui me touche vraiment (Attention)** ← ce document
2. **Module 2 — Étapes 2-3 : Tempérament + communication / décision** ← inclus
3. **Module 3 — Étapes 4-5 : Lifestyle + ce qu'il vaut mieux éviter (+ compléments : temps, standing, contrôle, canal)** ← inclus
4. **Module 4 — Étapes 6-7 : Singularité + infos pratiques + filtres durs + confidentialité** ← inclus
5. **Module 5 — Fiche profil individuelle + logique de matching (algorithme) + exemples** ← inclus

---

## État d'avancement (mis à jour le 22 mai 2026)

Implémentation par lots (détail en section F du Module 5). On valide chaque étape **avec une preuve** (SELECT, test, screenshot) avant la suivante ; rien n'est marqué « fait » sans preuve.

**Lot 1 — Attention + fiche profil simple : BOUCLÉ (22 mai 2026).**
- **1.1 Migration DB — FAIT, vérifié en prod.** `supabase-migration-11-attention-vectors.sql` : 4 colonnes sur `my_profile` — `attention_answers`, `attention_reception`, `attention_expression` (JSONB), `attention_computed_at` (timestamptz) — additive, idempotente. **+ `supabase-migration-12-attention-breath-text.sql`** (colonne `attention_breath_text` TEXT, appliquée en prod le 22 mai). `SELECT` de contrôle OK.
- **1.2 Questionnaire « Étape 1 — Attention » — FAIT.** Un écran = une catégorie ; jusqu'à 3 réponses classées ; produit `attention_answers`, appelle `scoreAttention`, écrit les vecteurs réception/expression. Refondu en DA « Présence » V11.
- **1.3 Moteur de scoring 7D — FAIT, testé (28/28 verts).** `src/lib/attention/scoring.ts` (fonction pure `scoreAttention`) + `scoring.test.ts`. Ne consomme que les questions fermées (jamais le texte libre).
- **Analyse hybride — FAIT.** `src/lib/attention/breathFacts.ts` calcule les **faits déterministes** (langages forts en réception/expression, forme single/dual/multi, relation congruence/écart par recoupement d'ensembles — jamais d'écart forcé). La route `/api/attention/breath` fait **rédiger la micro-analyse par Claude** dans la voix intime (`docs/ton-candice.md`), persistée dans `attention_breath_text`, avec **fallback déterministe**. Deux profils de même forme → deux formulations différentes (plus de gabarit).
- **1.4 Page `/moi/resultats` — FAIT.** Entrée en **« moment »** (overlay sombre, `attention_breath_text` révélé phrase par phrase en serif), puis corps blanc : réception puis expression en phrases humaines ; langages **en clair, zéro chiffre**. Architecture **modulaire** (`ResultSection` = PointDivider + Thread) prête à empiler les modules suivants (Lot 5). État vide → invitation vers le questionnaire.

**Prochaine étape : Lots 2 → 5** — Module 2 (tempérament), Module 3 (lifestyle + à éviter), Module 4 (singularité / filtres durs / confidentialité), Module 5 (fiche profil + matching + synthèse globale). **Prérequis : déposer cette bible dans `docs/` du repo** pour que Claude Code lise les modules.

**Audit du code existant (20 mai, `SPECS.md` commit fd12e8d) :** aucun scoring préexistant (construit à neuf) ; questionnaire actuel à refondre ; parcours Proche en cul-de-sac (bugs B1/B2/B4 + deux flows parallèles) — **parqué** pour le lot Matching/Réciprocité.

---

# MODULE 1 — ÉTAPE 1 : « Ce qui me touche vraiment »

### Objectif du module
Mesurer le **profil d'attention** sur les 7 dimensions (MOT, SER, CAD_C, CAD_S, EXP, GES, SUR). C'est l'étape centrale, la seule scorée chiffré. Elle nourrit directement la fiche profil, les recommandations, et le vecteur d'attention utilisé dans le matching.

### Mécanique de réponse (écran)
- **Un écran = une catégorie entière.** Toutes les questions d'une même catégorie (étape) sont sur le même écran ; un seul « Continuer » mène à la micro-analyse (écran de respiration) de la catégorie, puis on passe à la catégorie suivante. **Jamais une question par écran** (trop de validations, casse le rythme « luxe qui respire »).
- Pour chaque question de l'écran, l'utilisateur choisit **jusqu'à 3 réponses, classées** (la 1ʳᵉ compte le plus). Toutes les questions de la catégorie partagent ce même mécanisme.
- Micro-copy par question : *« Choisis jusqu'à 3 réponses. La première compte le plus. »*
- Badges 1/2/3 sur les cartes sélectionnées ; au-delà de 3, les autres options de cette question se grisent.
- Barre de progression module sans pourcentage, couleur vert sapin (DA Présence V11 — terra abandonné) : *« Étape 1/7 ».*
- **Cas de l'Étape 1 (Attention) :** Q1, Q2, Q3, Q4 **et** la Question E (expression) sont sur **le même écran**, chacune avec son bloc « choisis jusqu'à 3, classées ». Le « Continuer » mène à la micro-analyse de fin d'étape.

---

## Question 1 — « Je me sens le plus aimé(e) quand… »

> Question pivot : chaque option vise une dimension pure. C'est elle qui établit l'ossature du profil.

**1. On me dit des mots sincères**
Sous-texte : *« Un compliment vrai, une reconnaissance dite à voix haute. »*
Analyse interne — Dim : `MOT` · Traits : besoin de verbalisation, sensibilité à la reconnaissance · Matching : fluide avec les profils expressifs ; vigilance avec les tempéraments pudiques/réservés.

**2. On m'aide concrètement sans que je demande**
Sous-texte : *« Quelqu'un qui allège ma charge avant même que je l'exprime. »*
Analyse interne — Dim : `SER` + `GES` · Traits : sensibilité à la charge mentale, besoin de soutien concret, attention au timing · Matching : valorise les profils fiables et observateurs ; friction avec les peu attentifs au quotidien.

**3. On me fait un cadeau pensé spécialement pour moi**
Sous-texte : *« Un objet choisi pour moi, pas acheté au hasard. »*
Analyse interne — Dim : `CAD_C` · Traits : sensibilité aux détails, besoin d'être connu(e) finement · Matching : fluide avec ceux qui observent et retiennent ; friction avec les « cadeau générique ».

**4. On me fait un cadeau chargé de sens**
Sous-texte : *« Quelque chose qui porte une histoire, une intention. »*
Analyse interne — Dim : `CAD_S` · Traits : mémoire émotionnelle, attachement au symbole · Matching : forte fluidité avec les profils sentimentaux et nostalgiques.

**5. On me consacre un vrai moment de qualité**
Sous-texte : *« Du temps pleinement présent, sans distraction ni écran. »*
Analyse interne — Dim : `EXP` · Traits : besoin de présence, connexion profonde · Matching : friction possible avec les profils très occupés ou peu disponibles.

**6. On pense à moi dans les petits détails du quotidien**
Sous-texte : *« Des micro-attentions régulières, pas réservées aux grandes occasions. »*
Analyse interne — Dim : `GES` · Traits : besoin de constance, sensibilité à la régularité · Matching : friction avec les profils « grand geste rare » qui négligent le quotidien.

**7. On me surprend avec quelque chose d'inattendu**
Sous-texte : *« L'imprévu, l'effet de surprise qui crée l'émotion. »*
Analyse interne — Dim : `SUR` · Traits : goût de l'imprévu, tolérance à l'incertitude · Matching : friction nette avec les profils qui ont besoin d'anticiper ou de contrôler.

---

## Question 2 — « Une attention réussie, pour moi, c'est surtout… »

> Même cible, autre angle : on mesure ce qui fait qu'une attention *atteint sa cible* (justesse, timing, soin).

**1. Quelque chose qui montre qu'on m'a écouté(e)**
Sous-texte : *« La preuve qu'on a retenu un détail que j'avais glissé. »*
Analyse interne — Dim : `CAD_C` + `GES` · Traits : besoin d'être compris, sensibilité fine · Matching : valorise les profils observateurs et mémoriels.

**2. Quelque chose qui tombe au bon moment**
Sous-texte : *« Le bon geste, juste quand j'en avais besoin. »*
Analyse interne — Dim : `GES` + `SER` · Traits : intelligence contextuelle, sensibilité au timing · Matching : friction avec les profils peu attentifs au rythme de l'autre.

**3. Quelque chose qui crée un souvenir**
Sous-texte : *« Un moment ou un objet dont on reparlera plus tard. »*
Analyse interne — Dim : `EXP` + `CAD_S` · Traits : mémoire émotionnelle, goût des repères communs · Matching : fluidité avec les profils « souvenirs partagés ».

**4. Quelque chose qui me facilite vraiment la vie**
Sous-texte : *« Une aide qui retire un poids concret de mes épaules. »*
Analyse interne — Dim : `SER` · Traits : pragmatisme, besoin de soutien tangible · Matching : valorise les profils fiables et utiles.

**5. Quelque chose de simple mais sincère**
Sous-texte : *« Peu importe le prix, ce qui compte c'est l'intention. »*
Analyse interne — Dim : `MOT` + `GES` · Traits : faible matérialisme, sensibilité à l'authenticité · Matching : fluidité large ; vigilance si l'autre surinvestit le standing.

**6. Quelque chose que je n'avais pas vu venir**
Sous-texte : *« L'effet de surprise, ce petit choc heureux. »*
Analyse interne — Dim : `SUR` · Traits : recherche d'émotion, ouverture à l'imprévu · Matching : friction avec les profils anti-surprise.

**7. Quelque chose de beau, choisi avec goût**
Sous-texte : *« Le soin, l'esthétique, la qualité du choix. »*
Analyse interne — Dim : `CAD_C` · Traits : exigence esthétique, sensibilité à la qualité · Matching : friction avec les profils peu regardants sur la forme.

---

## Question 3 — « Ce qui me touche le plus durablement… »

> On vise ici la *trace* : ce qui reste, longtemps après. Révèle la mémoire émotionnelle.

**1. Une phrase qui reste en tête**
Sous-texte : *« Des mots que je me répète encore longtemps après. »*
Analyse interne — Dim : `MOT` · Traits : mémoire verbale, besoin de reconnaissance durable.

**2. Un geste fait sans bruit, mais au bon moment**
Sous-texte : *« Une attention discrète qui montre qu'on a vu mon besoin. »*
Analyse interne — Dim : `GES` + `SER` · Traits : sensibilité à l'attention discrète, pudeur · Matching : fluidité avec les profils discrets ; friction avec les démonstratifs spectaculaires.

**3. Un objet qui a une histoire**
Sous-texte : *« Quelque chose chargé de mémoire, pas juste neuf. »*
Analyse interne — Dim : `CAD_S` · Traits : nostalgie, attachement symbolique.

**4. Une expérience partagée dont on reparlera longtemps**
Sous-texte : *« Un moment vécu ensemble qui devient un repère commun. »*
Analyse interne — Dim : `EXP` · Traits : besoin de souvenirs communs, connexion.

**5. Une surprise parfaitement pensée**
Sous-texte : *« L'imprévu, mais préparé avec soin et justesse. »*
Analyse interne — Dim : `SUR` + `CAD_C` · Traits : goût de l'imprévu *maîtrisé*, sensibilité aux détails · Matching : nuance importante — aime la surprise **bien organisée**, pas le chaos. À croiser avec « surprise mal organisée » (Étape 5).

**6. Une aide concrète quand j'en ai vraiment besoin**
Sous-texte : *« Un soutien réel dans les moments où je manque de ressources. »*
Analyse interne — Dim : `SER` · Traits : besoin de sécurité, sensibilité au soutien.

**7. Un détail qui prouve qu'on me connaît vraiment**
Sous-texte : *« Le petit signe qui dit : on me connaît pour de vrai. »*
Analyse interne — Dim : `CAD_C` + `GES` · Traits : besoin d'être connu finement, personnalisation.

---

## Question 4 — « Entre deux attentions, je préfère… »

> Question d'arbitrage : elle force des **oppositions** (régulier vs rare, mots vs objets…). Très utile au matching car elle révèle des axes tranchés.

**1. Une petite attention régulière**
Sous-texte : *« La constance vaut mieux qu'un grand geste isolé. »*
Analyse interne — Dim : `GES` · Traits : besoin de constance, rythme régulier · Matching : friction avec les profils « intense mais rare » (voir option 2).

**2. Un grand moment rare mais marquant**
Sous-texte : *« Peu souvent, mais quelque chose qu'on n'oublie pas. »*
Analyse interne — Dim : `EXP` · Traits : intensité émotionnelle, préférence pour le marquant · Matching : **axe d'opposition direct** avec l'option 1 — à comparer entre deux profils.

**3. Une aide concrète quand j'en ai besoin**
Sous-texte : *« Du soutien réel plutôt que des mots. »*
Analyse interne — Dim : `SER` · Traits : pragmatisme.

**4. Un mot sincère au bon moment**
Sous-texte : *« La bonne phrase, dite au moment juste. »*
Analyse interne — Dim : `MOT` · Traits : verbalisation, sensibilité au timing.

**5. Un cadeau qui a du sens**
Sous-texte : *« Le symbole compte plus que la valeur. »*
Analyse interne — Dim : `CAD_S` · Traits : attachement symbolique, faible matérialisme.

**6. Une surprise qui casse la routine**
Sous-texte : *« L'inattendu qui réveille le quotidien. »*
Analyse interne — Dim : `SUR` · Traits : besoin de nouveauté.

**7. Un objet choisi avec précision**
Sous-texte : *« Le bon objet, choisi avec exigence et justesse. »*
Analyse interne — Dim : `CAD_C` · Traits : exigence, goût du détail.

---

## Question E — Écran complémentaire : « Et toi, comment montres-tu naturellement ton attention aux autres ? »

> **Sur le même écran que Q1-Q4** (un écran = une catégorie), présentée en dernier bloc de l'écran Attention, après la réception. Micro-copy d'écran : *« Choisis jusqu'à 3 réponses. Cela aidera Candice à comprendre les décalages possibles entre ce que tu donnes naturellement et ce que les autres attendent. »*
> Cette question produit un **vecteur d'expression** sur les 7 dimensions, **distinct** du vecteur de réception (Q1-Q4). Même mécanique de classement (#1 +5, #2 +3, #3 +1). Usage principal : la couche « langages d'attention » et le matching (comparer l'expression de l'un à la réception de l'autre). En fiche individuelle, il alimente une phrase douce (« tu exprimes surtout l'attention par… »), jamais un second score affiché.

**1. Je dis ce que je ressens, je complimente, je rassure**
Sous-texte : *« Je mets des mots sur ce que je ressens pour les autres. »*
Analyse interne — Dim (expr) : `MOT` · Traits : aisance verbale affective · Matching : touche facilement un proche « réception MOT » ; risque de sous-investir les actes si le proche reçoit en SER/GES.

**2. J'aide, je rends service sans qu'on me le demande**
Sous-texte : *« Je montre que je tiens à quelqu'un en l'aidant concrètement. »*
Analyse interne — Dim (expr) : `SER` · Traits : soutien concret, fiabilité · Matching : comble un proche « réception SER » ; un proche « réception MOT » peut manquer de mots et se sentir moins aimé à tort.

**3. J'offre des cadeaux choisis avec soin**
Sous-texte : *« Je traduis mon affection par un objet bien choisi. »*
Analyse interne — Dim (expr) : `CAD_C` · Traits : observation, personnalisation · Matching : touche un proche « réception CAD_C » ; peut paraître « matériel » à un proche qui reçoit en EXP/MOT.

**4. J'offre des choses qui ont du sens, une histoire**
Sous-texte : *« J'aime les attentions chargées de symbole. »*
Analyse interne — Dim (expr) : `CAD_S` · Traits : sens du symbole · Matching : fort avec un proche « réception CAD_S ».

**5. Je passe du vrai temps de qualité avec les gens**
Sous-texte : *« Ma façon d'aimer, c'est d'être pleinement présent(e). »*
Analyse interne — Dim (expr) : `EXP` · Traits : présence, disponibilité · Matching : comble un proche « réception EXP » ; un proche « réception GES » peut souhaiter plus de régularité au quotidien.

**6. J'ai mille petites attentions au quotidien**
Sous-texte : *« Je montre que je pense à l'autre dans les détails. »*
Analyse interne — Dim (expr) : `GES` · Traits : attention régulière, discrétion · Matching : comble un proche « réception GES ».

**7. J'aime faire des surprises**
Sous-texte : *« J'exprime mon affection en créant de l'inattendu. »*
Analyse interne — Dim (expr) : `SUR` · Traits : goût de l'effet, générosité spontanée · Matching : **point de vigilance** si le proche déteste les surprises (croiser Q18) — bonne intention, mauvaise cible.

---

## Scoring du module (appliqué)

À l'issue des **questions de réception (Q1-Q4)**, on a, pour chaque dimension, la somme des points (rang 5/3/1, additionnés). On **normalise sur 100 par dimension**, puis on en déduit :
- **Dominant** = dimension la plus haute ;
- **Secondaire** = toute dimension > 45/100 ;
- **Tertiaire** = toute dimension > 30/100.

La **Question E** produit, en parallèle et avec la même mécanique, un **vecteur d'expression** sur les 7 dimensions. Les deux vecteurs sont **séparés** : le vecteur de réception donne les « langages d'attention dominants » affichés en fiche ; le vecteur d'expression sert au matching et à la phrase « tu exprimes surtout par… ». On ne les additionne jamais.

> Exemple de calcul (un utilisateur) :
> Q1 → #1 « mots sincères » (MOT +5), #2 « moment de qualité » (EXP +3), #3 « petits détails » (GES +1).
> Q2 → #1 « simple mais sincère » (MOT +5, GES +5), #2 « bon moment » (GES +3, SER +3).
> Q3 → #1 « phrase qui reste » (MOT +5), #2 « geste sans bruit » (GES +3, SER +3).
> Q4 → #1 « mot sincère » (MOT +5), #2 « petite attention régulière » (GES +3).
> Bruts : MOT 20 · GES 15 · SER 6 · EXP 3 · CAD_C 0 · CAD_S 0 · SUR 0 → après normalisation : **dominant MOT, secondaire GES**, le reste faible.

## Traits générés par le module
Le module 1 alimente surtout l'axe **expressivité/registre** du tempérament (verbal vs comportemental vs matériel), et pose des marqueurs réutilisés ailleurs : sensibilité aux détails, besoin de constance vs intensité, rapport à la surprise (qui se recoupera avec « besoin de contrôle » au module 2).

## Impact matching
Le module produit **deux vecteurs 7D** : un **vecteur de réception** (Q1-Q4) et un **vecteur d'expression** (Q E). Au matching (module 5) :
- **réception A vs réception B** → langages d'attention partagés (zones de fluidité) ;
- **expression A vs réception B** → ce que A fait naturellement vs ce dont B a besoin (le cœur des insights « langages de l'amour ») ;
- **angle mort** = ce que B valorise fort et que A n'exprime pas spontanément → reco actionnable.
La nuance « surprise maîtrisée » (Q3-5) vs « anti-surprise » (Étape 5) reste un signal de friction prioritaire.

## Micro-analyse de fin de module (écran de respiration)

Principe : pas de phrase générique. On renvoie une lecture **courte, fine, gratifiante**, conditionnée au profil qui émerge — avec, quand c'est pertinent, une **contradiction intéressante** (c'est ce qui crée l'effet « elle me comprend »).

Exemples conditionnés :
- *Dominant MOT + secondaire GES :* « Tu sembles avant tout sensible aux mots justes — mais pas aux grandes déclarations : ce sont les petites phrases dites au bon moment, et les attentions discrètes du quotidien, qui te touchent le plus. »
- *Dominant CAD_C + EXP :* « Chez toi, ce n'est pas le cadeau en soi qui compte, c'est la preuve qu'on t'a vraiment écouté(e). Un détail bien observé aura plus d'impact qu'un grand geste impersonnel. »
- *Dominant SER, SUR très bas :* « Tu te sens aimé(e) par les actes plus que par les mots — et l'imprévu te touche moins que la fiabilité. On devine quelqu'un qui préfère qu'on l'aide concrètement plutôt qu'on le surprenne. »
- *Contradiction féconde (SUR haut + besoin de contrôle pressenti) :* « Tu aimes être surpris(e)… mais quelque chose nous dit que tu aimes surtout les surprises *bien pensées*. L'imprévu oui, le chaos non. » *(à confirmer au module 2)*
- *Écart réception ↔ expression :* « Tu reçois surtout l'attention par les mots — mais tu l'exprimes surtout par les actes. Autrement dit, tu donnes ce que tu sais faire, pas forcément ce que tu aimerais recevoir. C'est précieux à savoir : pour toi comme pour les gens qui t'aiment. »

**RÈGLES DE LECTURE (verrouillées — corrigent une analyse trop primaire) :**
1. **Multi-langages, jamais de dominant unique forcé.** Quand plusieurs langages sont proches au sommet (écart serré en réception), on les **nomme ensemble** (« plusieurs langages comptent presque autant pour toi : … ») au lieu de ne retenir que le n°1. On lit la **balance**, pas seulement le premier coché.
2. **Décalage réception ↔ expression : seulement s'il est RÉEL.** On compare les **ensembles** de langages forts (pas les seuls n°1). Si la plupart des langages que la personne *exprime* font aussi partie de ceux qu'elle *aime recevoir* → **congruence**, à dire positivement : « tu sembles offrir ce que tu aimes toi-même recevoir » — **et on ne parle PAS de décalage**. Un vrai décalage ne se nomme que si un langage fort d'un côté est nettement absent de l'autre, et on le nomme **précisément**. **Ne jamais forcer un décalage**, ne jamais écrire « ce décalage est courant ».
3. **Prendre de la hauteur, ne pas répéter les options cochées.** On parle au niveau des langages en clair (« les cadeaux choisis », « le temps partagé »…), on synthétise — on ne recopie pas les libellés de réponses.

CTA : *« Continuer mon profil »* · lien discret : *« Reprendre plus tard »* · statut : *« Enregistré ».*

## Exemples d'outputs (ce que Candice saura produire après ce seul module)
- *Reco amorcée :* « Pour cette personne, privilégie un mot sincère glissé au bon moment plutôt qu'un cadeau coûteux. »
- *Alerte amorcée :* « Éviter les grandes surprises spectaculaires — son profil penche vers la régularité discrète. »

---

*Fin du Module 1.*

---

# MODULE 2 — ÉTAPES 2-3 : « Mon énergie relationnelle » + « Mon style de communication et de décision »

### Objectif du module
Construire le **profil de tempérament** : comment la personne fonctionne, communique, décide, gère le stress et le conflit. Conformément à la Partie A, ce module **ne touche pas au scoring d'attention 7D**. Il alimente un **moteur de traits multi-axes** (pas un type unique façon MBTI, pas une note globale, pas un diagnostic). C'est la couche la plus riche pour le matching.

### Référentiel des axes de tempérament (encodage)
Chaque axe est une **variable continue bipolaire**, normalisée −100 ↔ +100 (0 = neutre). Chaque réponse applique un **delta** (signal fort = ±2, signal modéré = ±1, sur une échelle interne ramenée ensuite à 100). Plusieurs questions peuvent pousser le même axe : les signaux **se cumulent**, et le nombre de signaux convergents donne l'**intensité** (un axe poussé par 3 réponses est plus « sûr » qu'un axe poussé par une seule).

Axes bipolaires :
1. **Énergie sociale** : introversion ↔ extraversion
2. **Espace ↔ proximité** : besoin d'autonomie ↔ besoin de lien rapproché
3. **Spontanéité ↔ contrôle**
4. **Communication** : directe ↔ indirecte
5. **Expressivité ↔ réserve** (émotionnelle)
6. **Stabilité ↔ nouveauté**
7. **Sensibilité aux détails** : faible ↔ élevée
8. **Exigence / standing** : simplicité ↔ premium *(surtout alimenté au Module 3)*
9. **Rapport au temps** : tolérance à l'imprévu ↔ besoin d'anticipation

Modes **catégoriels** (pas un spectre, une étiquette + intensité) :
- **Style de conflit** : direct / temporisateur / évitant / humour
- **Régulation du stress** : par la parole / par l'action / par le retrait / par le contrôle / silence
- **Style de décision** : rationnel / intuitif / social / maturation
- **Canal préféré** : oral direct / écrit

> Règle Partie A maintenue : ces traits sont **exploités activement** (ton, timing, alertes, matching), jamais affichés comme un score chiffré ni comme un verdict. Ton transversal : « on me comprend », jamais « on m'a diagnostiqué ».

---

## ÉTAPE 2 — « Mon énergie relationnelle »

Mécanique : **choix unique** par question (1 question / écran). Barre : *« Étape 2/7 — Question 1/4 ».*

### Question 5 — « Quand je recharge mes batteries… »

**1. J'ai besoin de moments seul(e)**
Sous-texte : *« Le calme et la solitude me régénèrent vraiment. »*
Analyse interne — Axes : Énergie sociale → introversion (+2) · Espace ↔ proximité → espace (+2) · Traits : introversion marquée, récupération solitaire · Matching : éviter les sollicitations excessives ; friction avec un proche très extraverti qui lit le retrait comme un rejet.

**2. Je préfère les petits groupes**
Sous-texte : *« Quelques personnes proches plutôt qu'une foule. »*
Analyse interne — Axes : Énergie sociale → introversion légère (+1) · Espace ↔ proximité → proximité sélective (+1) · Traits : sociabilité sélective, intimité · Matching : fluide avec les profils intimistes ; inconfort dans les grands rassemblements.

**3. Ça dépend des jours**
Sous-texte : *« Mon énergie sociale varie selon les moments. »*
Analyse interne — Axes : Énergie sociale → neutre (0) · Traits : ambiversion, adaptabilité · Matching : s'ajuste à la plupart des profils ; le proche devra lire le moment plutôt qu'une règle fixe.

**4. J'aime être entouré(e)**
Sous-texte : *« La présence des autres me donne de l'énergie. »*
Analyse interne — Axes : Énergie sociale → extraversion (+2) · Espace ↔ proximité → proximité (+1) · Traits : extraversion, lien social énergisant · Matching : friction possible avec un proche introverti qui a besoin de retrait.

**5. Plus c'est animé, mieux c'est**
Sous-texte : *« J'aime le mouvement, la stimulation, l'effervescence. »*
Analyse interne — Axes : Énergie sociale → extraversion forte (+2) · Stabilité ↔ nouveauté → nouveauté (+1) · Traits : besoin de stimulation, énergie sociale élevée · Matching : forte friction avec un profil qui fuit le bruit et la foule.

### Question 6 — « Quand je suis stressé(e), j'ai tendance à… »

**1. Garder pour moi, faire bonne figure**
Sous-texte : *« J'encaisse en silence plutôt que de le montrer. »*
Analyse interne — Axes : Expressivité ↔ réserve → réserve (+2) · Régulation : silence · Traits : retenue émotionnelle, difficulté à demander de l'aide · Matching : **alerte** — ne dira pas qu'il ne va pas bien ; un proche peu observateur passera à côté. Quand une période chargée est renseignée, Candice peut suggérer des attentions discrètes.

**2. Me retirer, avoir besoin de calme**
Sous-texte : *« J'ai besoin de m'isoler pour me reposer. »*
Analyse interne — Axes : Espace ↔ proximité → espace fort (+2) · Régulation : retrait · Traits : gestion solitaire, besoin de sas · Matching : friction avec un proche qui régule par la parole et veut « en parler tout de suite ».

**3. En parler, me confier**
Sous-texte : *« Mettre des mots dessus m'aide à aller mieux. »*
Analyse interne — Axes : Expressivité ↔ réserve → expressive (+2) · Régulation : parole · Traits : besoin d'écoute, régulation verbale · Matching : a besoin d'un proche disponible ; friction avec un profil fuyant ou « solutionneur » trop vite.

**4. Agir, me mettre en mouvement**
Sous-texte : *« Faire quelque chose vaut mieux que ruminer. »*
Analyse interne — Axes : Régulation : action · Spontanéité ↔ contrôle → spontanéité (+1) · Traits : pragmatisme, régulation par l'action · Matching : un proche qui propose une activité concrète tombe juste ; les longues conversations émotionnelles peuvent lasser.

**5. Chercher à contrôler ce que je peux**
Sous-texte : *« Reprendre la main sur les détails me rassure. »*
Analyse interne — Axes : Spontanéité ↔ contrôle → contrôle fort (+2) · Rapport au temps → anticipation (+1) · Traits : besoin de maîtrise, anxiété logistique · Matching : friction nette avec un profil très imprévisible ; signal fort « ne jamais imposer d'imprévu en période de stress ».

### Question 7 — « Face à un désaccord, je… »

**1. En parle directement**
Sous-texte : *« J'aborde le sujet franchement, sans tourner autour. »*
Analyse interne — Axes : Communication → directe (+2) · Conflit : direct · Traits : confrontation saine, clarté · Matching : fluide avec un autre direct ; peut heurter un profil évitant qui vit la franchise comme une agression.

**2. Ai besoin de temps avant d'en parler**
Sous-texte : *« Je dois digérer avant de pouvoir en discuter. »*
Analyse interne — Axes : Conflit : temporisateur · Rapport au temps → délai (+1) · Traits : digestion émotionnelle · Matching : friction avec un profil qui veut régler à chaud. Traduction Candice : « laisse-lui le temps avant d'aborder le sujet ».

**3. Évite le conflit autant que possible**
Sous-texte : *« Je préfère préserver la paix, quitte à me taire. »*
Analyse interne — Axes : Conflit : évitant · Expressivité ↔ réserve → réserve (+1) · Traits : évitement, fatigue relationnelle · Matching : **alerte** — accumule sans le dire ; un proche doit créer des espaces sûrs pour faire émerger les non-dits.

**4. Dédramatise avec l'humour**
Sous-texte : *« Je désamorce les tensions par une touche légère. »*
Analyse interne — Axes : Conflit : humour · Communication → indirecte (+1) · Traits : désamorçage · Matching : fluide avec qui aime la légèreté ; peut frustrer un profil qui a besoin que les choses soient prises au sérieux.

**5. Écris plus facilement que je ne parle**
Sous-texte : *« À l'écrit, je trouve mieux mes mots. »*
Analyse interne — Axes : Canal : écrit · Communication → indirecte (+1) · Traits : besoin de structure, recul · Matching : pour les sujets sensibles, privilégier un message écrit.

### Question 8 — « Dans une relation, ce dont j'ai le plus besoin… »

**1. De stabilité et de constance**
Sous-texte : *« Savoir sur quoi je peux compter, durablement. »*
Analyse interne — Axes : Stabilité ↔ nouveauté → stabilité (+2) · Traits : sécurité relationnelle · Matching : friction avec un profil avide de nouveauté et d'imprévu.

**2. De liberté et d'espace**
Sous-texte : *« Pouvoir respirer sans me sentir enfermé(e). »*
Analyse interne — Axes : Espace ↔ proximité → espace fort (+2) · Traits : indépendance, refus de la fusion · Matching : friction avec un profil très demandeur de proximité. Traduction : « distance ≠ désintérêt ».

**3. De profondeur et d'échanges vrais**
Sous-texte : *« Des conversations qui vont au-delà du superficiel. »*
Analyse interne — Axes : Expressivité ↔ réserve → expressive (+1) · Traits : intensité émotionnelle, connexion · Matching : friction avec un profil qui privilégie la légèreté.

**4. De légèreté et de rire**
Sous-texte : *« Du plaisir, de la fluidité, sans lourdeur. »*
Analyse interne — Axes : Conflit : humour · Stabilité ↔ nouveauté → nouveauté (+1) · Traits : lien par le plaisir · Matching : peut se sentir oppressé par un profil qui veut « tout analyser ».

**5. De loyauté dans les moments difficiles**
Sous-texte : *« Être là quand ça compte vraiment. »*
Analyse interne — Axes : Stabilité ↔ nouveauté → stabilité (+1) · Traits : attachement fort, fiabilité valorisée · Matching : valorise les profils fiables ; très sensible au manque de fiabilité (recoupe Q19).

**6. De respect de mon rythme**
Sous-texte : *« Qu'on n'impose pas une cadence qui n'est pas la mienne. »*
Analyse interne — Axes : Espace ↔ proximité → espace (+1) · Spontanéité ↔ contrôle → contrôle léger (+1) · Traits : autonomie, sensibilité à la pression · Matching : friction avec un profil pressant ou insistant.

### Micro-analyse de fin d'étape 2 (écran de respiration)

Lecture **fine, conditionnée, gratifiante** — avec contradiction quand elle apparaît :
- *Introversion + espace forts, régulation par le retrait :* « On voit apparaître un équilibre assez net : tu aimes le lien, mais tu as besoin de le doser. Quand tu te retires, ce n'est pas de la distance — c'est ta façon de te recharger. »
- *Extraversion + besoin de profondeur (contradiction) :* « Intéressant : tu sembles puiser ton énergie dans les autres, mais ce que tu cherches vraiment, ce n'est pas l'agitation — c'est la profondeur. Beaucoup de monde autour de toi, mais peu de liens qui comptent vraiment. »
- *Évitement du conflit + besoin de stabilité :* « Tu sembles tenir à l'harmonie au point de parfois taire ce qui te dérange. C'est précieux pour la paix d'une relation — mais Candice gardera en tête que tout ne se dit pas chez toi à voix haute. »
- *Contrôle élevé + stress géré par la maîtrise :* « On devine quelqu'un qui se rassure en gardant la main. L'imprévu n'est pas ton terrain de jeu favori, surtout sous pression. »

CTA : *« Continuer »* · *« Reprendre plus tard »* · *« Enregistré ».*

---

## ÉTAPE 3 — « Mon style de communication et de décision »

Barre : *« Étape 3/7 — Question 1/3 ».*

### Question 9 — « Pour communiquer, je préfère… »

**1. Aller droit au but**
Sous-texte : *« L'efficacité et la clarté, sans détour. »*
Analyse interne — Axes : Communication → directe (+2) · Traits : franchise, clarté · Matching : fluide avec un direct ; peut paraître brusque à un profil sensible aux formes.

**2. Parler de ce que je ressens**
Sous-texte : *« Mettre l'émotion au cœur de l'échange. »*
Analyse interne — Axes : Expressivité ↔ réserve → expressive (+2) · Communication → affective · Traits : verbalisation affective · Matching : friction avec un profil pudique ou factuel.

**3. Tout analyser en profondeur**
Sous-texte : *« Comprendre le fond avant d'avancer. »*
Analyse interne — Axes : Sensibilité aux détails (+1) · Décision : analytique · Traits : besoin de compréhension · Matching : peut épuiser un profil qui veut « faire simple et vite ».

**4. Garder ça léger, avec humour**
Sous-texte : *« Désamorcer et alléger par le rire. »*
Analyse interne — Axes : Communication → indirecte (+1) · Conflit : humour · Traits : évitement possible de l'intensité · Matching : friction avec un profil qui a besoin de profondeur.

**5. Écrire plutôt que parler**
Sous-texte : *« À l'écrit, je m'exprime plus juste. »*
Analyse interne — Axes : Canal : écrit · Communication → réflexive · Traits : besoin de recul, précision · Matching : pour les sujets délicats, préférer l'écrit.

### Question 10 — « Pour mes grandes décisions, je… »

**1. Analyse les pour et les contre**
Sous-texte : *« Je pèse rationnellement avant de trancher. »*
Analyse interne — Axes : Décision : rationnel · Sensibilité aux détails (+1) · Traits : rationalité, besoin de données · Matching : peut percevoir un proche intuitif comme « impulsif ».

**2. Fais confiance à mon instinct**
Sous-texte : *« Je me fie à ce que je ressens. »*
Analyse interne — Axes : Décision : intuitif · Spontanéité ↔ contrôle → spontanéité (+1) · Traits : intuition · Matching : friction avec un profil qui veut tout justifier et planifier.

**3. Demande l'avis des proches**
Sous-texte : *« Le regard des gens de confiance compte. »*
Analyse interne — Axes : Décision : social · Espace ↔ proximité → proximité (+1) · Traits : validation sociale · Matching : un proche dont l'avis est sollicité se sent valorisé ; attention à ne pas le mettre sous pression.

**4. Fais des recherches approfondies**
Sous-texte : *« Je veux maîtriser le sujet avant de choisir. »*
Analyse interne — Axes : Décision : analytique · Exigence (+1) · Spontanéité ↔ contrôle → contrôle (+1) · Traits : besoin de maîtrise · Matching : recoupe le besoin de contrôle.

**5. Attends que ce soit clair en moi**
Sous-texte : *« Je laisse maturer jusqu'à la certitude intérieure. »*
Analyse interne — Axes : Décision : maturation · Rapport au temps → temps long · Traits : maturation intérieure · Matching : friction avec un profil qui décide vite. Traduction : « ne le brusque pas dans ses choix ».

### Question 11 — « J'exprime mes émotions… »

**1. Assez librement**
Sous-texte : *« Je montre ce que je ressens sans filtre. »*
Analyse interne — Axes : Expressivité ↔ réserve → expressive forte (+2) · Traits : expressivité émotionnelle · Matching : friction avec un profil très réservé qui peut se sentir débordé.

**2. Avec quelques personnes de confiance**
Sous-texte : *« Je m'ouvre, mais dans un cercle restreint. »*
Analyse interne — Axes : Expressivité ↔ réserve → sélective (+1) · Traits : intimité sélective · Matching : appartenir au cercle de confiance est un marqueur fort ; le proche doit respecter cette sélectivité.

**3. Par mes actes plus que par mes mots**
Sous-texte : *« Je préfère prouver que déclarer. »*
Analyse interne — Axes : Expressivité ↔ réserve → comportementale · Communication → non verbale · Traits : langage comportemental, pudeur verbale · Matching : **important** — l'amour s'exprime par les actes ; un proche en attente de mots peut se sentir mal-aimé à tort. Candice traduit ce décalage.

**4. Rarement, je préfère garder ça pour moi**
Sous-texte : *« Mes émotions restent surtout intérieures. »*
Analyse interne — Axes : Expressivité ↔ réserve → réserve forte (+2) · Traits : intériorisation · Matching : **alerte** — un proche démonstratif risque de mal lire cette pudeur.

**5. Souvent après coup, quand j'ai compris ce que je ressens**
Sous-texte : *« Je comprends mes émotions avec un temps de décalage. »*
Analyse interne — Axes : Expressivité ↔ réserve → différée · Rapport au temps → traitement décalé · Traits : lenteur émotionnelle · Matching : friction avec un profil qui attend une réaction immédiate. Traduction : « laisse-lui le temps de revenir vers toi ».

### Micro-analyse de fin d'étape 3 (écran de respiration)

- *Communication directe + décision rationnelle :* « Ton profil se précise : tu fonctionnes à la clarté. Tu préfères qu'on te parle franchement et tu décides en pesant les choses. Avec toi, mieux vaut être net que flou. »
- *Expression par les actes + réserve (contradiction féconde) :* « Tu n'es pas du genre à beaucoup verbaliser tes émotions — mais ça ne veut pas dire que tu en as peu. Chez toi, l'attention se prouve plus qu'elle ne se dit. C'est un détail que peu de gens lisent correctement, et que Candice gardera en tête. »
- *Décision par maturation + traitement émotionnel décalé :* « On voit revenir un même fil : tu as besoin de temps. Pour décider, pour comprendre ce que tu ressens, pour répondre. Ce n'est pas de la distance — c'est ton rythme intérieur. »

CTA identique. *« Ton profil relationnel commence à prendre forme. »*

---

## Traits générés par le module (consolidés)
Ce module produit le **noyau du tempérament** : une position sur chaque axe (énergie sociale, espace/proximité, spontanéité/contrôle, communication directe/indirecte, expressivité/réserve, stabilité/nouveauté) **avec une intensité** issue du nombre de signaux convergents, plus les **modes** (style de conflit, régulation du stress, style de décision, canal). Ces traits ne sont jamais affichés en chiffres : ils pilotent le **ton** des suggestions, le **timing** des relances, les **alertes** (« ne pas imposer d'imprévu »), et nourrissent le matching.

## Impact sur le matching
C'est le module le plus déterminant pour la comparaison entre deux profils. La logique (détaillée au Module 5) :
- **Axes alignés → fluidité** (deux directs, deux régulateurs par la parole, deux qui aiment l'imprévu).
- **Axes opposés → friction potentielle**, toujours assortie d'une **traduction actionnable** (ex. A régule par le retrait / B par la parole → « quand A se tait, ce n'est pas un mur ; laisse-lui un sas, il reviendra »).
- **Pondération des frictions** : les axes prioritaires (les plus à risque de malentendu) sont *espace ↔ proximité*, *spontanéité ↔ contrôle*, *expressivité ↔ réserve*, et le *style de conflit*. Le *canal de communication* est une friction mineure. Une friction sur un axe à forte intensité des deux côtés pèse plus qu'une friction sur un axe tiède.

## Exemples d'outputs (après modules 1 + 2)
- *Brief relationnel amorcé :* « Avec cette personne : sois clair et fiable, évite de la presser, et ne confonds pas son besoin de calme avec du désintérêt. »
- *Alerte :* « Si le proche indique une période chargée, garde en tête qu'il ne demandera pas d'aide : suggère une attention discrète et concrète, sans en faire un événement. »
- *Réglage de ton :* suggestions formulées de façon directe et factuelle (pas de surcouche émotionnelle) pour un profil réservé + communication directe.

---

*Fin du Module 2.*

---

# MODULE 3 — ÉTAPES 4-5 : « Ce que j'aime vivre » + « Ce qu'il vaut mieux éviter »

### Objectif du module
Capturer le **lifestyle** (goûts, rapport au standing, à la nourriture, aux expériences) et les **interdits relationnels** (ce qui fatigue, blesse, tombe à côté). Cette couche enrichit le contexte et arme les **alertes**. Conformément à la Partie A, on **ne re-score pas l'attention 7D** ici : les questions « cadeaux » alimentent des préférences lifestyle, pas un troisième passage sur CAD_C/CAD_S/EXP.

### Référentiel des axes lifestyle (encodage léger)
Mêmes variables continues que le tempérament, échelle −100 ↔ +100 :
- **Foodie ↔ faible intérêt alimentaire**
- **Premium ↔ simplicité**
- **Expérience ↔ objet**
- **Esthétique ↔ fonctionnel**
- **Aventure ↔ confort**
- **Authenticité ↔ luxe**
Ces axes nuancent les recommandations (type de restaurant, de cadeau, de week-end) sans jamais bloquer ni juger. Ils ne pèsent que **modérément** au matching (poids faibles).

---

## ÉTAPE 4 — « Ce que j'aime vivre »

Barre : *« Étape 4/7 — Question 1/9 ».* Mécanique : choix unique sauf mention contraire.

### Question 12 — « Quand quelqu'un m'invite ou m'offre quelque chose… »

**1. N'importe quelle attention sincère me touche**
Sous-texte : *« L'intention compte bien plus que le standing. »*
Analyse interne — Axes : Premium ↔ simplicité → simplicité (+2) · Authenticité (+1) · Traits : intention > standing, faible matérialisme · Matching : fluidité large ; vigilance si l'autre croit devoir « impressionner ».

**2. Quelque chose de bien choisi, même simple**
Sous-texte : *« Le soin du choix me touche plus que le prix. »*
Analyse interne — Axes : Esthétique ↔ fonctionnel → équilibre · Sensibilité aux détails (+1) · Traits : personnalisation, sensibilité au détail · Matching : valorise les profils attentionnés.

**3. Un certain niveau de qualité compte pour moi**
Sous-texte : *« J'apprécie quand c'est fait avec exigence. »*
Analyse interne — Axes : Premium ↔ simplicité → premium (+1) · Exigence (+1) · Traits : standing assumé sans ostentation · Matching : éviter le « cheap » ; un proche peu regardant sur la qualité peut décevoir.

**4. Les détails influencent beaucoup mon expérience** *(reformulé depuis « je suis difficile »)*
Sous-texte : *« Un détail raté peut gâcher l'ensemble pour moi. »*
Analyse interne — Axes : Sensibilité aux détails → élevée (+2) · Exigence (+1) · Traits : haute sensibilité qualitative · Matching : un proche doit soigner l'exécution ; tolérance faible à l'à-peu-près.

**5. Pas de préférence, je n'y suis pas attaché(e)**
Sous-texte : *« Ces détails ne pèsent pas dans mon plaisir. »*
Analyse interne — Axes : Premium ↔ simplicité → simplicité (+1) · Sensibilité aux détails → faible (+1) · Traits : faible exigence matérielle · Matching : aucune pression sur le standing.

### Question 13 — « Pour les cadeaux, je préfère… »

> Signal lifestyle (objet ↔ expérience). Confirmation **légère** d'attention seulement, pas de re-scoring lourd.

**1. Des expériences** — *« Vivre quelque chose plutôt que posséder. »* — Axes : Expérience ↔ objet → expérience (+2) · *(confirmation légère EXP)* · Matching : oriente les recos vers le vécu partagé.
**2. Des objets à garder** — *« Quelque chose de tangible qui dure. »* — Axes : Expérience ↔ objet → objet (+2) · Matching : oriente vers l'objet bien choisi.
**3. Les deux me touchent** — *« Je suis sensible à l'un comme à l'autre. »* — Axes : neutre (0) · Traits : flexibilité.
**4. Des choses utiles** — *« Ce qui me sert vraiment au quotidien. »* — Axes : Esthétique ↔ fonctionnel → fonctionnel (+2) · *(confirmation légère SER)* · Traits : pragmatisme.
**5. Des choses symboliques** — *« Ce qui porte un sens, une mémoire. »* — Axes : neutre lifestyle · *(confirmation légère CAD_S)* · Traits : attachement symbolique.

### Question 14 — « Pour les cadeaux matériels, ce qui me touche le plus… »

> Préférence lifestyle (esthétique/fonctionnel/premium). **Pas de re-scoring** attention.

**1. Un objet utile et bien pensé** — *« L'usage avant tout, mais pensé. »* — Axes : Fonctionnel (+2) · Traits : pragmatisme soigné.
**2. Quelque chose qui montre qu'on m'a écouté(e)** — *« La preuve qu'on a retenu un détail. »* — Axes : Sensibilité aux détails (+2) · Traits : besoin d'être connu finement.
**3. Un objet beau et de qualité** — *« L'esthétique et la matière comptent. »* — Axes : Esthétique (+2) · Premium (+1) · Traits : exigence esthétique.
**4. Un objet de valeur symbolique** — *« Ce qui a un sens dépasse l'objet. »* — Axes : Authenticité (+1) · Traits : sentimentalité.
**5. Je préfère les expériences aux objets** — *« Au fond, je retiens les moments. »* — Axes : Expérience ↔ objet → expérience (+2) · Traits : EXP dominant en lifestyle.

### Question 15 — « Ma relation à la nourriture et aux restaurants… »

**1. J'aime manger partout** — *« Peu exigeant(e), je m'adapte facilement. »* — Axes : Foodie → modéré · Premium ↔ simplicité → simplicité (+1) · Traits : flexibilité.
**2. Je suis gourmand(e)** — *« Le plaisir de la table, la convivialité. »* — Axes : Foodie (+2) · Traits : plaisir, convivialité · Matching : un repas est une attention qui porte.
**3. J'adore les belles tables** — *« Le cadre et l'expérience comptent. »* — Axes : Foodie (+1) · Premium (+2) · Traits : expérience premium.
**4. La gastronomie est une passion** — *« Un vrai sujet d'expertise pour moi. »* — Axes : Foodie (+2) · Exigence (+2) · Traits : exigence élevée · Matching : signal fort pour des expériences culinaires soignées.
**5. Je mange pour vivre** — *« La nourriture n'est pas centrale chez moi. »* — Axes : Foodie → faible (+2) · Traits : faible centralité alimentaire · Matching : éviter de tout miser sur le restaurant.

### Question 16 — « Si on m'offre un week-end, ce qui compte le plus… »

**1. La destination avant tout** — *« Découvrir un lieu nouveau. »* — Axes : Aventure (+2) · Traits : curiosité, exploration.
**2. Un hôtel confortable et bien situé** — *« Le confort et la praticité priment. »* — Axes : Confort (+2) · Traits : praticité.
**3. Le charme et l'authenticité** — *« Un lieu qui a une âme. »* — Axes : Authenticité (+2) · Esthétique (+1) · Traits : singularité.
**4. Le luxe et le service** — *« Être pleinement choyé(e). »* — Axes : Luxe (+2) · Premium (+1) · Traits : besoin d'être choyé.
**5. L'important, c'est d'être ensemble** — *« Le lieu compte moins que la compagnie. »* — Axes : neutre lifestyle · *(confirmation légère EXP)* · Traits : lien > contexte.

### COMPLÉMENTS TRANSVERSAUX *(questions ajoutées pour combler les manques identifiés)*

> Ces questions complètent les angles demandés : rapport au temps, standing, contrôle/spontanéité pratique, canal de communication. Elles alimentent tempérament + lifestyle, jamais l'attention 7D.

#### Question 4a — « Mon rapport au temps et à l'organisation… »
**1. J'anticipe et je planifie à l'avance** — *« Savoir où je vais me rassure. »* — Axes : Rapport au temps → anticipation (+2) · Spontanéité ↔ contrôle → contrôle (+1) · Matching : friction avec les profils « dernière minute ».
**2. Je gère au fil de l'eau** — *« Je préfère rester souple. »* — Axes : Rapport au temps → imprévu (+2) · Spontanéité (+1) · Matching : friction avec les planificateurs.
**3. La ponctualité compte beaucoup pour moi** — *« Le retard me coûte. »* — Axes : Anticipation (+1) · Exigence (+1) · Matching : **alerte** — un proche souvent en retard sera mal vécu.
**4. Je suis souvent un peu en retard, sans malice** — *« Le temps m'échappe parfois. »* — Axes : Imprévu (+1) · Matching : ne pas dramatiser ; éviter les contextes ultra-rigides.
**5. La charge mentale m'épuise vite** — *« Trop à gérer me déborde. »* — Axes : Sensibilité à la charge mentale (+2) · Matching : **signal SER fort** — les attentions qui allègent (services, anticipation) touchent particulièrement.

#### Question 4b — « Mon rapport à la qualité et au standing… »
**1. La qualité compte, même si je n'en parle pas** — *« Je le remarque sans l'exiger. »* — Axes : Premium discret (+1) · Traits : standing intériorisé.
**2. Je préfère la simplicité authentique au luxe** — *« Le vrai vaut mieux que le clinquant. »* — Axes : Authenticité (+2) · Simplicité (+1) · Matching : éviter l'ostentation.
**3. J'aime le beau et le raffinement** — *« Le soin esthétique me touche. »* — Axes : Esthétique (+2) · Premium (+1).
**4. Le prix m'importe peu, c'est l'intention** — *« La valeur n'est pas dans le coût. »* — Axes : Simplicité (+1) · Traits : faible matérialisme.
**5. Je suis sensible aux belles marques et aux lieux d'exception** — *« L'excellence me parle. »* — Axes : Luxe (+2) · Premium (+1) · Matching : recos premium pertinentes, mais jamais « cheap ».

#### Question 4c — « Quand on organise quelque chose pour moi… »
**1. J'aime tout savoir à l'avance** — *« Pas d'inconnue, ça me détend. »* — Axes : Contrôle (+2) · Anticipation (+1) · Matching : **anti-surprise** — à croiser avec Q18.
**2. J'aime garder une part de surprise** — *« Un peu d'inconnu, mais pas trop. »* — Axes : neutre · Traits : surprise maîtrisée (recoupe Q3-5).
**3. J'aime être totalement surpris(e)** — *« L'imprévu total m'enchante. »* — Axes : Spontanéité (+2) · Matching : compatible avec les organisateurs de surprises.
**4. J'ai besoin de valider les détails** — *« Je préfère avoir un droit de regard. »* — Axes : Contrôle (+2) · Exigence (+1).
**5. Je m'adapte facilement** — *« Je fais confiance et je suis le mouvement. »* — Axes : Flexibilité (+1).

#### Question 4d — « Pour rester en contact, je préfère… »
**1. Un appel téléphonique** — *« Entendre la voix, le vrai échange. »* — Canal : oral · Traits : présence vocale.
**2. Un message écrit** — *« Asynchrone, à mon rythme. »* — Canal : écrit · Traits : maîtrise du tempo.
**3. Un vocal** — *« Spontané mais sans contrainte d'horaire. »* — Canal : hybride.
**4. En personne, rien ne remplace** — *« La présence physique avant tout. »* — Canal : présentiel · Traits : besoin de présence réelle.
**5. Peu importe, selon le moment** — *« Je m'adapte au canal. »* — Canal : flexible.
*Usage : pilote la façon dont Candice suggère de reprendre contact ; friction de matching mineure si canaux opposés.*

### Micro-analyse de fin d'étape 4
- *Premium + détails + foodie :* « Tu sembles sensible à la façon dont les choses sont pensées, pas seulement à ce qu'elles contiennent. Le soin, la qualité, le détail bien exécuté comptent autant que l'attention elle-même. »
- *Simplicité + intention > standing :* « Chez toi, c'est clair : l'intention prime sur le standing. Un proche n'a pas à impressionner — il a à être juste et sincère. »
- *Charge mentale élevée (contradiction utile) :* « Tu donnes l'image de quelqu'un qui gère, mais la charge mentale t'épuise vite. Les attentions les plus justes pour toi ne seront peut-être pas les plus spectaculaires — ce seront celles qui te retirent un poids. »

---

## ÉTAPE 5 — « Ce qu'il vaut mieux éviter avec moi »

Barre : *« Étape 5/7 ».* Étape clé pour les **alertes** et les **interdits relationnels**.

### Question 17 — « Ce qu'il vaut mieux éviter avec moi… » *(réponse ouverte)*
Placeholder : *« ex. les surprises, les annulations de dernière minute, certaines blagues, le bruit, les espaces bondés… »*
Analyse interne — Texte libre → extraction IA d'**interdits relationnels** : crée des **filtres de recommandation** et des **alertes**. Matching : les interdits de B deviennent des garde-fous pour les suggestions A→B (« ne propose jamais X à B »).

### Question 18 — « Le type de surprise que je détesterais… »
**1. Une surprise devant beaucoup de monde** — *« L'attention publique me met mal à l'aise. »* — Axes : Énergie sociale → introversion (+1) · Réserve (+1) · Filtre : **jamais de fête/déclaration publique** · Matching : confirme l'introversion.
**2. Une surprise qui change mon planning** — *« Bousculer mon organisation me stresse. »* — Axes : Contrôle (+1) · Anticipation (+1) · Filtre : **prévenir, ne pas bousculer l'agenda**.
**3. Une surprise trop intime ou trop intense** — *« Trop d'émotion exposée me gêne. »* — Axes : Réserve (+1) · Espace (+1) · Filtre : **doser l'intensité émotionnelle**.
**4. Une surprise mal organisée** — *« L'amateurisme gâche tout pour moi. »* — Axes : Exigence (+1) · Anxiété logistique (+1) · Filtre : **soigner l'exécution** ; n'exclut pas la surprise.
**5. Je suis plutôt partant(e) pour tout** — *« J'accueille la surprise avec plaisir. »* — Axes : Spontanéité (+1) · Ouverture (+1) · Filtre : aucun.

### Question 19 — « Ce qui me blesse le plus dans une relation… »
**1. Ne pas être écouté(e)** — *« Avoir l'impression de parler dans le vide. »* — Traits : besoin de reconnaissance · Matching : alerte si l'autre est peu à l'écoute.
**2. Être oublié(e) ou mis(e) de côté** — *« Sentir que je ne compte pas. »* — Traits : besoin de considération · Matching : **signal GES fort** — la régularité des attentions rassure.
**3. Être envahi(e) ou contrôlé(e)** — *« Manquer d'air dans la relation. »* — Traits : besoin d'autonomie · Axes : Espace (+2) · Matching : **friction majeure** avec un profil très demandeur de proximité.
**4. Les reproches ou critiques répétées** — *« La critique constante m'use. »* — Traits : sensibilité à la critique · Matching : un proche au style direct devra soigner la forme.
**5. Le manque de fiabilité** — *« Ne pas pouvoir compter sur quelqu'un. »* — Traits : besoin de stabilité · Axes : Stabilité (+1) · Matching : friction avec un profil imprévisible.
**6. Le manque de profondeur** — *« Les relations superficielles me lassent. »* — Traits : besoin de lien authentique · Matching : friction avec un profil « légèreté avant tout ».

### Micro-analyse de fin d'étape 5
- « Ces réponses sont parmi les plus précieuses : elles permettent à Candice d'éviter les attentions qui partent d'une bonne intention mais tombent à côté. »
- *Espace + envahissement redouté :* « On comprend mieux quelque chose d'important chez toi : ton besoin d'air n'est pas de la froideur. Ce qui te blesse, ce n'est pas qu'on t'aime — c'est qu'on t'étouffe. »
- *Reconnaissance + peur d'être oublié(e) :* « Derrière tes réponses revient un même besoin : compter vraiment pour quelqu'un. Les attentions régulières, même petites, te rassurent plus que les grands gestes isolés. »

## Traits générés par le module
Lifestyle (foodie, premium/simplicité, expérience/objet, esthétique/fonctionnel, aventure/confort, luxe/authenticité), rapport au temps et à la charge mentale, contrôle/spontanéité pratique, canal préféré, et surtout les **interdits & sensibilités** (anti-surprise publique, besoin d'air, sensibilité à la critique, peur de l'oubli) qui deviennent des **filtres d'alerte**.

## Impact sur le matching
- Les axes lifestyle pèsent **faiblement** (affinent le type de reco, ne créent pas de friction majeure).
- Les **interdits** (Q17-Q18) sont des **garde-fous absolus** : ils filtrent les suggestions A→B même si tout le reste converge.
- Q19 alimente les **frictions prioritaires** (espace, fiabilité, profondeur, critique) — recoupe les axes de tempérament et les renforce.

## Exemples d'outputs (après modules 1 à 3)
- *Reco affinée :* « Pour B : une belle table soignée plutôt qu'un objet — il est foodie et sensible au cadre, peu attaché aux objets. »
- *Garde-fou :* « Ne jamais organiser de surprise publique pour B (détesté + introversion confirmée). »
- *Traduction de friction :* « B a besoin d'air ; ce que A vit comme de la distance est en réalité son équilibre. »

---

*Fin du Module 3.*

---

# MODULE 4 — ÉTAPES 6-7 : « Ce qui me rend unique » + « Informations pratiques »

### Objectif du module
Récupérer la **singularité** (signaux faibles impossibles à scorer mais essentiels pour la finesse de l'IA) et les **données pratiques** qui servent de **filtres durs**. C'est ici que se concentrent les données sensibles : la confidentialité y est maximale.

---

## ÉTAPE 6 — « Ce qui me rend unique » *(questions ouvertes, non scorées)*

> Aucune de ces réponses n'est scorée. Elles sont stockées comme **contexte texte riche** pour l'IA (mémoire relationnelle) et exploitées à la génération des suggestions, des messages et des alertes.

1. **« Ce que j'adore faire »** — *placeholder : « ex. escalade, séries coréennes, cuisiner pour les autres, randonnée, brocantes, musées… »*
   Usage IA : extraction de **centres d'intérêt / passions** → recos d'expériences et de cadeaux ciblés.
2. **« Ce que j'évite ou déteste »** — *« ex. sports collectifs, jeux de société, soirées bruyantes, surprises… »*
   Usage IA : **anti-recommandations** (filtres souples). Recoupe les interdits de l'Étape 5.
3. **« Les sujets qui me stimulent vraiment »** — *« ex. startups, psychologie, voyages, football, mode, musique 90s… »*
   Usage IA : matière à **messages** et à amorces de conversation justes ; matching de centres d'intérêt communs.
4. **« Ce que peu de gens savent sur moi »** — *« ex. j'adore les mangas, j'ai peur de l'avion, je fais de la poterie… »*
   Usage IA : **personnalisation fine**, attentions qui surprennent par leur justesse.
5. **« Le plus beau cadeau ou moment qu'on m'ait offert »**
   Usage IA : **question clé**. Révèle la mémoire émotionnelle, la symbolique, le registre d'attention qui a marqué → calibre le style des suggestions.
6. **« Le genre de détail qui me fait me sentir compris(e) »**
   Usage IA : très fort pour la **personnalisation** ; sert de mètre-étalon de la « justesse » d'une attention.

7. **« Les marques, objets ou lieux que j'aime »** — *placeholder : « ex. Aesop, les librairies indépendantes, Le Bon Marché, la papeterie japonaise, un bar à vin précis… »*
   Sous-texte visible : *« Les enseignes et endroits où tu te sens à ta place. »*
   Analyse interne — non scoré · Traits : univers de goût concret, repères de standing réels · Impact matching : permet des recos **ultra-précises** (le bon objet, la bonne enseigne) plutôt que génériques ; recoupe les axes premium/esthétique sans les chiffrer.

8. **« Les cadeaux que je n'aimerais pas recevoir »** — *placeholder : « ex. bougies, fleurs coupées, gadgets, objets « déco » impersonnels, bons d'achat… »*
   Sous-texte visible : *« Ce qui, même offert avec gentillesse, tombe à plat pour toi. »*
   Analyse interne — non scoré · Traits : seuils de goût, allergies symboliques · Impact matching : **filtre dur de niveau cadeau** — un garde-fou qui évite la maladresse la plus fréquente (le cadeau « gentil mais à côté »).

9. **« Mes envies ou rêves du moment »** — *placeholder : « ex. apprendre la céramique, partir au Japon, un certain sac, me remettre au piano… »*
   Sous-texte visible : *« Ce dont tu as envie en ce moment, petit ou grand. »*
   Analyse interne — non scoré · Traits : aspirations actuelles, fenêtres de timing · Impact matching : matière aux **grands gestes** et aux idées qui « tombent juste maintenant » ; alimente la liste de souhaits et les déclencheurs d'attention.

10. **« Ce que j'aimerais qu'on remarque davantage chez moi »** — *placeholder : « ex. mes efforts, mon humour, mon écoute, mon travail, ma cuisine… »*
    Sous-texte visible : *« Ce que tu donnes et qui passe parfois inaperçu. »*
    Analyse interne — non scoré · Traits : **besoin de reconnaissance ciblé**, zone de sensibilité · Impact matching : indique précisément **où A peut valoriser B** (un mot juste sur ce point a un impact disproportionné) ; recoupe le besoin de reconnaissance de l'Étape 2.

11. **« Ce qui me fait me sentir spécial(e) »** — *placeholder : « ex. qu'on se souvienne d'un détail, qu'on prépare quelque chose rien que pour moi, qu'on prenne du temps… »*
    Sous-texte visible : *« Le sentiment d'être unique aux yeux de quelqu'un. »*
    Analyse interne — non scoré · Traits : **cœur émotionnel du profil** · Impact matching : calibre le niveau de « justesse » recherché ; sert de référence ultime pour juger si une attention proposée touche vraiment.

### Micro-analyse de fin d'étape 6
- « C'est souvent dans ces détails que Candice devient vraiment précise. »
- « Ces réponses donnent à Candice la matière la plus personnelle : ce qui ne rentre dans aucune case. »

---

## ÉTAPE 7 — « Informations pratiques » *(filtres durs — délicatesse maximale)*

**Texte d'introduction (écran) :** *« Ces informations restent strictement privées. Elles ne seront jamais affichées à tes proches. Elles servent uniquement à éviter les recommandations maladroites : mauvais restaurant, mauvaise taille, cadeau incompatible, lieu inaccessible. »*

> **Aucune donnée de cette étape n'est scorée.** Toutes sont des **filtres durs** : elles autorisent ou bloquent des recommandations. Plusieurs relèvent de l'**Art. 9 RGPD** (santé, religion via régime) → règles de confidentialité renforcées (voir plus bas).

| Champ | Type | Rôle de filtre |
|---|---|---|
| **Allergies alimentaires** (aucune / gluten / lactose / fruits à coque / fruits de mer / autre) | sélection | bloque restaurants & cadeaux incompatibles |
| **Régime** (omnivore / végétarien / vegan / halal / casher / sans préférence / autre) | sélection | filtre restaurants ; *halal/casher = Art. 9 (religion)* |
| **Alcool** (je bois / je n'en bois pas / occasionnel / éviter les lieux centrés alcool) | sélection | bloque bars à vin, dégustations |
| **Mobilité / santé / confort** (champ ouvert) | texte | *Art. 9 (santé)* — bloque lieux inaccessibles, efforts incompatibles |
| **Tailles** (vêtements / chaussures / pantalon / bague) | sélection | évite les erreurs de cadeau ; formulation : *« Quelles tailles te vont généralement le mieux ? »* (jamais « quelle taille fais-tu ? ») |
| **Parfums / odeurs aimées** (frais / poudré / boisé / floral / gourmand / ambré / discret / sans parfum) | sélection | oriente les cadeaux olfactifs |
| **Odeurs détestées** (champ ouvert) | texte | filtre dur olfactif |
| **Couleurs / matières / style** (champ ouvert) | texte | affine cadeaux vestimentaires/déco |
| **Adresse de livraison** | privé | exécution des envois — **jamais affiché** |
| **Animaux de compagnie** | optionnel | recos compatibles |
| **Dates importantes** (anniversaire, fête, anniversaire de mariage, dates personnelles, dates symboliques) | dates | déclencheurs d'attention (countdown) |
| **Rôle / lien familial** (père, mère, enfant, beaux-parents, conjoint·e, ami·e…) | sélection | active les rappels pertinents (fête des mères / des pères) et **écarte** ceux qui ne s'appliquent pas |

### Confidentialité & partage *(aucun réglage à remplir)*

> **Pas de question de partage dans le questionnaire.** Par défaut et sans exception : **rien de ce que la personne a saisi n'est partagé** — ni ses réponses, ni ses données pratiques, ni ses champs libres. Seule l'**analyse relationnelle** (langages d'attention, insights, traductions) peut être surfacée, et uniquement dans le cadre d'un matching.
> Le **partage de sa fiche se décide au moment d'une demande** : quand un proche envoie une demande de comparaison, la personne choisit alors d'accepter ou non. Le consentement vit là — au moment de la demande — pas dans un paramètre rempli en amont.

### Micro-analyse finale (fin du questionnaire)
- « Ton profil est maintenant beaucoup plus précis. »
- « Candice peut désormais mieux comprendre ce qui te touche, ce qui te fatigue, ce qu'il faut éviter, et les attentions qui ont le plus de chances d'être justes. »
- « Tu pourras enrichir ton profil à tout moment. »

---

## RÈGLES DE CONFIDENTIALITÉ (transversales, non négociables)

**Jamais affiché dans le matching ni visible par un proche :**
- tailles (vêtements, chaussures, pantalon, bague) ;
- données de santé / mobilité / grossesse (Art. 9) ;
- régime à connotation religieuse (halal, casher) en tant que tel (Art. 9) ;
- allergies détaillées ;
- adresse ;
- champs libres intimes (Étape 6) si non explicitement autorisés au partage.

**Ce qui peut apparaître dans le matching :** uniquement des **insights synthétiques et non sensibles** (ex. « sensible aux attentions discrètes », « a besoin d'anticipation »), jamais la donnée brute.

**Principe de symétrie (Partie A) :** le questionnaire d'un Proche collecte les mêmes champs que « Ma fiche », y compris Art. 9 — défendable car, dans les deux cas, **la personne concernée saisit elle-même ses données**. Le point sensible réel est le **mode incognito** (un Pilote remplit la fiche d'un proche sans questionnaire) : dans ce cas, ne jamais inférer ni stocker de donnée Art. 9 non explicitement fournie, et signaler que ces champs sont à compléter par la personne elle-même.

**Règles d'affichage dans le matching (verrou) :** le matching n'affiche **jamais** une donnée brute, une réponse saisie ni un score chiffré. Il affiche **uniquement l'analyse relationnelle** : langages d'attention, zones de fluidité, points de vigilance, traductions, recos. Le partage d'une fiche pour une comparaison se fait par **acceptation d'une demande** au moment où elle arrive — il n'existe pas de réglage de partage rempli en amont.

**Filtres durs — logique :** une donnée filtre **n'entre jamais dans un score** ; elle agit en amont de la recommandation comme un **veto** :
- `halal` → exclure restaurants non compatibles ;
- `pas d'alcool` → exclure bars à vin / dégustations ;
- `mobilité réduite` → exclure randonnée / lieux non accessibles ;
- `déteste les surprises publiques` → ne jamais proposer de fête surprise.

---

*Fin du Module 4.*

---

# MODULE 5 — FICHE PROFIL INDIVIDUELLE + LOGIQUE DE MATCHING + EXEMPLES

## A. Fiche profil individuelle (sortie de fin de questionnaire)

Générée par **calcul** (scores + axes) puis **habillée** par l'IA (Partie A : le calcul est déterministe, l'IA n'intervient qu'après). Structure :

1. **Synthèse courte** — 2-3 phrases nuancées (ton « tu sembles »).
   *Ex. : « Tu sembles sensible aux attentions précises, sincères et bien situées dans le temps. Les gestes trop génériques risquent de te laisser indifférent(e), tandis qu'un détail bien observé peut avoir beaucoup d'impact. »*
2. **Langages d'attention** *(couche immédiatement lisible)* —
   - **Comment tu aimes recevoir** : principal / secondaire / tertiaire (vecteur de réception, Q1-Q4). Présentés comme « tes langages d'attention dominants », en clair (« les mots », « le temps de qualité », « les petites attentions »…), jamais en chiffres.
   - **Comment tu exprimes naturellement** : 1-2 langages dominants (vecteur d'expression, Q E), en une phrase douce.
   - **Phrase de contraste** si écart : *« Tu reçois surtout par X, mais tu exprimes surtout par Y »* — utile pour comprendre les malentendus que tu peux vivre.
3. **Ce qui te touche le plus** — 4-5 insights dérivés des dimensions fortes + traits.
4. **Ce qu'il vaut mieux éviter** — 4-5 alertes (Étape 5 + interdits + axes sensibles).
5. **Ton style relationnel** — synthèse des axes espace/proximité, stabilité/nouveauté, énergie sociale.
6. **Ton style de communication** — directe/indirecte, expressivité, canal, traitement émotionnel.
7. **Tes attentions idéales** — recos types (ex. « une expérience calme et bien choisie », « une aide concrète quand une période chargée est renseignée »).
8. **Les attentions à éviter** — (ex. surprise publique, cadeau générique, attention envahissante, lieu bruyant, planning imposé).
9. **Niveau de spontanéité** — position sur l'axe (affichée en texte, jamais en chiffre).
10. **Niveau de besoin de contrôle** — idem.
11. **Sensibilité aux détails** — idem.
12. **Besoin d'espace** — idem.

> Affichage : **texte élégant, jamais de score chiffré ni de barre %** (mémoire produit). Les niveaux (9-12) s'expriment en formulations (« plutôt élevé », « modéré », « discret »).

---

## B. Logique de matching (architecture mathématique — v1)

Objectif : comparer deux profils A et B et produire **zones de fluidité, points de vigilance, traductions et recos A→B / B→A** — **sans** score de compatibilité brut affiché, **sans** verdict « faits / pas faits l'un pour l'autre ».

### B.1 — Représentation des profils
- **Vecteurs d'attention** : `recep = [MOT, SER, CAD_C, CAD_S, EXP, GES, SUR]` (réception) et `expr = [...]` (expression), chaque valeur ∈ [0,100].
- **Vecteur de tempérament** : positions sur les axes bipolaires `temp_i ∈ [−100, +100]`, chacune assortie d'une **intensité** `int_i ∈ [0,1]` (= proportion de signaux convergents).
- **Modes catégoriels** : `conflit`, `régulation`, `décision`, `canal`.
- **Filtres durs** : ensembles d'interdits (jamais comparés, seulement appliqués comme veto sur les recos).

### B.2 — Comparaison d'attention (réception)
```
sim_reception = cosineSimilarity(recep_A, recep_B)    // ∈ [0,1], INTERNE (jamais affiché)
langages_partagés = { d | recep_A[d] ≥ 45 ET recep_B[d] ≥ 45 }   // → zones de fluidité
top_recep_B = 3 dimensions de réception les plus hautes de B      // → "ce dont B a besoin"
top_recep_A = 3 dimensions de réception les plus hautes de A      // → "ce dont A a besoin"
```

### B.2bis — Couche langages d'attention (réception × expression) — *le cœur narratif*
> C'est la couche la plus lisible et la plus actionnable pour l'utilisateur. Elle compare **comment chacun exprime** l'attention à **comment l'autre a besoin de la recevoir**. Sortie **toujours narrative**, jamais chiffrée.
```
écart(A→B) = dimensions où expr_A est fort MAIS recep_B est fort sur d'AUTRES dimensions
           = "A donne surtout en [top_expr_A], or B reçoit surtout en [top_recep_B]"
manque(A→B) = { d ∈ top_recep_B | expr_A[d] faible }   // ce dont B a besoin, que A n'exprime pas spontanément
fluide(A→B) = { d | expr_A[d] fort ET recep_B[d] fort } // A exprime déjà dans le langage de B
(symétrique pour B→A)
```
**Traductions générées (exemples de formulation) :**
- « Julie semble surtout sensible aux mots et au temps de qualité, alors qu'Estelle exprime davantage l'attention par les actes et les détails. »
- « Estelle peut penser montrer son affection naturellement, mais Julie risque parfois de manquer de verbalisation émotionnelle. »
- « Pour faire plaisir à Julie, verbaliser davantage les émotions pourrait avoir beaucoup d'impact. »

Cette couche produit systématiquement, pour chaque sens (A→B et B→A) : **comment l'autre aime recevoir**, **comment soi-même on exprime**, **ce que l'autre risque de mal interpréter**, **l'ajustement qui aurait le plus d'impact**. Pédagogique, émotionnelle, très lisible, actionnable.

### B.3 — Comparaison de tempérament (friction pondérée)
```
pour chaque axe i :
    gap_i        = |temp_A[i] − temp_B[i]| / 200       // ∈ [0,1]
    intensité_i  = min(int_A[i], int_B[i])             // les DEUX doivent tenir le trait
    friction_i   = gap_i × poids_i × intensité_i
friction_temp = Σ friction_i
```
**Poids des axes** (frictions prioritaires) :
| Axe | Poids |
|---|---|
| Espace ↔ proximité | 1.0 |
| Spontanéité ↔ contrôle | 1.0 |
| Expressivité ↔ réserve | 0.9 |
| Stabilité ↔ nouveauté | 0.7 |
| Énergie sociale | 0.6 |
| Communication directe ↔ indirecte | 0.6 |
| Rapport au temps | 0.5 |
| Sensibilité aux détails | 0.4 |
| Exigence / standing | 0.4 |

### B.4 — Frictions catégorielles (règles)
```
conflit:    direct × évitant        → friction haute
            temporisateur × direct  → friction moyenne
            humour × besoin de profondeur → friction moyenne
régulation: parole × retrait        → friction moyenne-haute
            action × parole         → friction faible-moyenne
décision:   rationnel × intuitif    → friction faible (souvent complémentaire)
canal:      mismatch                → friction faible
```

### B.5 — Production des sorties (jamais de note brute)
- **Zones de fluidité** = `langages_partagés` ∪ `fluide(A→B)`/`fluide(B→A)` ∪ axes alignés à fort poids ∪ centres d'intérêt communs (Étape 6).
- **Points de vigilance** = frictions de tempérament + écarts de langages, triés, **plafonnés aux 3-4 plus saillants**, chacun avec une **traduction actionnable** (jamais un reproche).
- **Langages d'attention** (couche B.2bis) = pour chaque sens : comment l'autre aime recevoir, comment soi on exprime, ce qui peut être mal interprété, l'ajustement à fort impact.
- **Reco A→B** = agir sur `top_recep_B` + combler `manque(A→B)` + respecter le tempérament de B (ex. discret → attentions discrètes) + appliquer les **filtres durs** de B (veto). **Reco B→A** symétrique.
- **Insights narratifs** = génération IA à partir des convergences/frictions/écarts, ton Partie A (« il est possible que », « dans certains contextes »), jamais de catégorisation figée.

> **🔒 Verrou de sortie.** Aucun score brut de compatibilité, aucun langage froid ou trop analytique. Le matching **traduit** toujours les écarts en : ce que l'un peut mal interpréter chez l'autre · ce qui fluidifie naturellement · ce qui peut créer une friction · comment mieux s'adresser à l'autre · comment éviter les maladresses · comment faire plaisir à l'autre **dans son propre langage relationnel**.

### B.6 — Règles d'affichage (copywriting matching)
Interdits : « diagnostic », « trouble », « score de compatibilité », « faits / pas faits pour vous entendre ».
Préférés : « profil relationnel », « zones de fluidité », « points de vigilance », « manière naturelle de fonctionner », « ce qui peut créer de l'incompréhension », « ce qui peut renforcer la relation ».

---

## C. Exemples de résultats de matching

**Estelle (dominant CAD_C/GES, besoin d'espace élevé, traitement émotionnel décalé) × Julie (dominant MOT/EXP, expressive, besoin de proximité)**

- *Zone de fluidité :* « Vous accordez toutes les deux beaucoup d'importance aux attentions personnalisées et aux moments qui comptent. »
- *Point de vigilance (axe espace ↔ proximité, fort poids) :* « Julie exprime ses émotions facilement et recherche la proximité ; Estelle a besoin de plus d'espace et de temps avant de revenir vers les autres. Ce décalage n'est pas un désintérêt — c'est une différence de rythme. »
- *Point de vigilance (traitement émotionnel) :* « Quand quelque chose la touche, Estelle a besoin de temps avant d'en parler. Julie pourrait l'interpréter comme de la distance ; en réalité, c'est sa façon de digérer. »
- *Reco Julie → Estelle :* « Privilégie des gestes précis et bien pensés, sans envahir. Laisse-lui de l'espace : un mot juste au bon moment vaut mieux qu'une longue conversation imposée. »
- *Reco Estelle → Julie :* « Julie est sensible aux mots et aux moments partagés. Verbalise ce que tu ressens, même brièvement, et propose-lui du temps de qualité — c'est ce qui la touche le plus. »

**Exemples génériques réutilisables :**
- « Vous avez tous les deux besoin de profondeur, mais pas forcément au même rythme. »
- « Votre point fort : vous valorisez tous les deux les attentions personnalisées. »
- « Point de vigilance : l'un cherche la spontanéité quand l'autre a besoin d'anticipation. »

---

## D. Règles d'analyse IA (transversales)
- Le **calcul est déterministe** (scores, axes, frictions) ; l'**IA habille** seulement (synthèses, insights, recos). Elle ne recalcule jamais les scores.
- Ton : « tu sembles », « ton profil indique plutôt », « il est possible que », « dans certains contextes ». Jamais de verdict, jamais de case.
- Toujours **utile et concret** : chaque analyse débouche sur une reco ou une traduction actionnable.
- **Filtres durs** appliqués en amont de toute reco (veto absolu).
- **Données sensibles** jamais affichées ; uniquement des insights synthétiques.
- **Analyse à deux couches** (cf. verrou en tête de bible) : couche 1 = vecteurs déterministes (questions fermées) ; couche 2 = lecture qualitative des champs libres (vetos, marqueurs concrets, divergences). La couche 2 enrichit le narratif, ne réécrit jamais la couche 1.
- **Réponses ouvertes** : jamais scorées. Injectées **structurées** dans les prompts de reco (aimés / vetos / marqueurs concrets / envies), jamais en vrac.
- **Recommandations ancrées** : chaque reco s'appuie sur un **signal nommé** du profil et porte un court « pourquoi » qui le cite. Une reco non ancrée sur un élément concret est **rejetée** (garde-fou anti-reco générique).
- **Vetos** appliqués en **filtre dur après génération** : si un élément figure dans les choses à éviter (ex. « roses »), toute reco qui le contient est écartée, sans exception.
- **Divergence déclaré/révélé** : traitée en enrichissement (« ce qui revient chez toi, c'est… »), jamais en contradiction de la personne.

---

## E. Règles UX/UI (rappel, mobile-first)
- **Un écran par catégorie** (toutes ses questions ensemble, jamais une question par écran) ; un seul « Continuer » par catégorie → micro-analyse. Barre de progression sticky **sans pourcentage** (« Étape n/7 » autorisé) ; couleur vert sapin (DA Présence V11).
- Auto-save discret (« Enregistré »), pas d'icône disquette ni de gros bouton ; « Reprendre plus tard » discret.
- Micro-analyse en **écran de respiration** à la fin de chaque étape. **Règle (transversale) :** chaque micro-analyse est strictement **bornée à la catégorie qu'on vient de traverser** (ex. « ce qui te touche » après l'Attention ; « comment tu fonctionnes en relation » après l'énergie relationnelle ; « comment tu communiques et décides » après le style de communication) — jamais le profil entier (ça, c'est la page résultats). Elle se termine par une **ligne de progression ressentie** (« je commence à bien te cerner », « ton profil se précise »), **jamais chiffrée, jamais de %**.
- Cadeau / cagnotte / points : **jamais visibles** (logique conservée en DB uniquement).
- États de complétion en **texte élégant** (« Candice commence à connaître / connaît / anticipe pour »), jamais de %.
- Ton premium sobre (Apple + Amex + conciergerie), jamais SaaS froid, jamais gamifié, jamais test psy clinique.
- **Design ultra-moderne, épuré, flat — références Apple, Linear, Notion.** Jamais de rétro/skeuomorphe : PAS d'icône disquette pour la sauvegarde, PAS de vieux micro. Si mode vocal : icône micro minimaliste et moderne (style Claude/ChatGPT). Composants nets, beaucoup d'air, transitions douces.

---

## F. Plan d'implémentation (lots) — cible : bible complète, construite proprement

On garde la bible entière comme cible, mais on code par **lots propres**, dans cet ordre :

1. **Attention + fiche profil simple** — vecteurs réception (Q1-Q4) & expression (Q E), scoring 7D, langages d'attention affichés en clair, fiche individuelle de base. *(en cours — 1.1 migration faite et vérifiée le 22 mai ; 1.3 scoring fait et vérifié (28/28) ; 1.2 et 1.4 à venir ; détail en « État d'avancement » en tête de bible).*
2. **Tempérament + micro-analyses** — moteur multi-axes interne, écrans de respiration, lectures fines nuancées.
3. **Singularité + filtres + données pratiques** — Étape 6 enrichie, Étape 7, filtres durs, rôle/lien familial pour les rappels. Pas de réglage de partage : rien de saisi n'est partagé, seule l'analyse relationnelle l'est, sur acceptation d'une demande.
4. **Matching relationnel** — couche langages d'attention (réception × expression), frictions de tempérament pondérées, sorties 100 % narratives.
5. **Recommandations avancées & mémoire relationnelle** — exploitation de la singularité, recos précises, anticipation.

Principe : pas d'usine à gaz d'un seul coup. Chaque lot est livrable, testable, et conforme aux deux verrous (interne vs affiché ; sortie narrative).

---

*Fin du Module 5 — bible complète (Modules 1 à 5).*
