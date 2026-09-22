# 06 — Questionnaire initial (pilote)

> Ce que le pilote remplit quand il crée / complète son profil. Ordre RÉEL de passation, libellés VERBATIM, options VERBATIM, colonne de stockage.
> Sources : `src/app/moi/questionnaire/QuestionnaireFlow.tsx` (ordre `STEP_ORDER`), les 8 composants d'étape, et les 3 banques de questions (`src/lib/attention/questions.ts`, `src/lib/temperament/questions.ts`, `src/lib/lifestyle/questions.ts`).
> Toutes les réponses sont écrites dans la table `my_profile` (base : `my_profile`), une ligne par pilote (`user_id`).

---

## Ordre réel de passation

Défini par `STEP_ORDER` (fichier : `src/app/moi/questionnaire/QuestionnaireFlow.tsx`, l.114-122). Les écrans « Breath » intercalaires (respiration Candice) ne sont pas des questions : ce sont des textes de transition générés après chaque bloc. L'ordre des ÉCRANS DE QUESTIONS est :

| # | Étape (Step) | Composant | Libellé bandeau | Bloc de questions |
|---|---|---|---|---|
| 0 | `gender` | `GenderStep.tsx` | « Avant de commencer » | 2 questions |
| 1 | `attention` | `AttentionStep.tsx` | « 01 — 07 » Langage d'attention | 4 questions réception (q1-q4) + 1 expression (qe) |
| 2 | `temperament2` | `TemperamentStep.tsx` | « 02 — 07 » Mon énergie relationnelle | q5-q8 |
| 3 | `temperament3` | `TemperamentStep.tsx` | « 03 — 07 » Communication & décision | q9-q11 |
| 4 | `lifestyle4` | `LifestyleStep.tsx` | « 04 — 07 » Ce que j'aime vivre | q12-q16, q4a-q4d (9 questions) |
| 5 | `lifestyle5` | `AvoidStep.tsx` | « 05 — 07 » Ce qu'il vaut mieux éviter | q17 (texte libre) + q18 + q19 |
| 6 | `singularity6` | `SingularityStep.tsx` | « 06 — 07 » Ce qui me rend unique | centres d'intérêt + 11 champs texte libre |
| 7 | `practical7` | `PracticalStep.tsx` | « 07 — 07 » Informations pratiques | identité, alimentation, tailles, goûts, agenda… |

Après chaque étape, `triggerSynthesis()` appelle `POST /api/profile/generate` (fire-and-forget) pour recalculer l'analyse. À la fin : écran `ClosingMoment`.

Statut de l'écran : ✅ tout est câblé et actif.

**Écran d'accueil (`OnboardingPopup`)** : montré une seule fois aux nouveaux profils avant `gender` ; `EditMenu` (menu de modification) montré aux profils existants (permet de reprendre, sauter à une partie via `?part=`, ou tout refaire).

---

## Étape 0 — Genre (`GenderStep.tsx`)

Eyebrow : **« Avant de commencer »**

### Q0.1 — Adresse grammaticale
- **Libellé VERBATIM :** « Comment veux-tu que Candice s'adresse à toi ? »
- **Type :** choix unique (boutons)
- **Obligatoire :** OUI (le bouton « Continuer » reste inactif tant que rien n'est choisi)
- **Options VERBATIM** (`GRAMMATICAL_OPTIONS`) :
  - « Au féminin » → `feminine`
  - « Au masculin » → `masculine`
  - « En neutre » → `neutral`
  - « Je préfère ne pas préciser » → `unspecified`
- **Colonne :** `my_profile.grammatical_gender` (valeur = la string ci-dessus)

### Q0.2 — Orientation de style
- **Libellé VERBATIM :** « Pour les vêtements, accessoires et parfums, tu te retrouves le plus dans… »
- **Sous-texte VERBATIM :** « Plusieurs réponses possibles »
- **Type :** choix multiple
- **Obligatoire :** NON
- **Options VERBATIM** (`STYLE_OPTIONS`) :
  - « Les rayons femme » → `femme`
  - « Les rayons homme » → `homme`
  - « Les deux, selon les pièces » → `mixte`
  - « Plutôt unisexe ou non genré » → `unisexe`
  - « Ça dépend, mieux vaut me demander » → `depends`
- **Colonne :** `my_profile.style_gender_orientation` (tableau, ou `null` si vide)

---

## Étape 1 — Langage d'attention (`AttentionStep.tsx`)

Eyebrow : **« Candice apprend ton langage d'attention »**. Chaque bloc de question porte le sur-titre **« Candice t'écoute »**.

Mécanique commune aux 5 questions : on choisit **jusqu'à 3 réponses, la 1re compte le plus** (classement s1/s2/s3, badge de rang). Micro-texte VERBATIM sous q1-q4 : « Choisis jusqu'à 3 réponses. La première compte le plus. »
**Obligatoire :** OUI pour les 5 questions (le CTA « Continuer » exige que les 5 aient au moins une réponse).
Chaque option porte des dimensions internes (`dims`) parmi : MOT, SER, CAD_C, CAD_S, EXP, GES, SUR (jamais affichées).

Source : `src/lib/attention/questions.ts`.

### Q1 (`q1`) — « Je me sens le plus aimé(e) quand … »
| id | Label VERBATIM | Sous-texte VERBATIM | dims |
|---|---|---|---|
| q1a | On me dit des mots sincères | Un compliment vrai, une reconnaissance dite à voix haute. | MOT |
| q1b | On m'aide concrètement sans que je demande | Quelqu'un qui allège ma charge avant même que je l'exprime. | SER, GES |
| q1c | On me fait un cadeau pensé spécialement pour moi | Un objet choisi pour moi, pas acheté au hasard. | CAD_C |
| q1d | On me fait un cadeau chargé de sens | Quelque chose qui porte une histoire, une intention. | CAD_S |
| q1e | On me consacre un vrai moment de qualité | Du temps pleinement présent, sans distraction ni écran. | EXP |
| q1f | On pense à moi dans les petits détails du quotidien | Des micro-attentions régulières, pas réservées aux grandes occasions. | GES |
| q1g | On me surprend avec quelque chose d'inattendu | L'imprévu, l'effet de surprise qui crée l'émotion. | SUR |

### Q2 (`q2`) — « Une attention réussie, pour moi, c'est surtout … »
| id | Label VERBATIM | Sous-texte VERBATIM | dims |
|---|---|---|---|
| q2a | Quelque chose qui montre qu'on m'a écouté(e) | La preuve qu'on a retenu un détail que j'avais glissé. | CAD_C, GES |
| q2b | Quelque chose qui tombe au bon moment | Le bon geste, juste quand j'en avais besoin. | GES, SER |
| q2c | Quelque chose qui crée un souvenir | Un moment ou un objet dont on reparlera plus tard. | EXP, CAD_S |
| q2d | Quelque chose qui me facilite vraiment la vie | Une aide qui retire un poids concret de mes épaules. | SER |
| q2e | Quelque chose de simple mais sincère | Peu importe le prix, ce qui compte c'est l'intention. | MOT, GES |
| q2f | Quelque chose que je n'avais pas vu venir | L'effet de surprise, ce petit choc heureux. | SUR |
| q2g | Quelque chose de beau, choisi avec goût | Le soin, l'esthétique, la qualité du choix. | CAD_C |

### Q3 (`q3`) — « Ce qui me touche le plus durablement … »
| id | Label VERBATIM | Sous-texte VERBATIM | dims |
|---|---|---|---|
| q3a | Une phrase qui reste en tête | Des mots que je me répète encore longtemps après. | MOT |
| q3b | Un geste fait sans bruit, mais au bon moment | Une attention discrète qui montre qu'on a vu mon besoin. | GES, SER |
| q3c | Un objet qui a une histoire | Quelque chose chargé de mémoire, pas juste neuf. | CAD_S |
| q3d | Une expérience partagée dont on reparlera longtemps | Un moment vécu ensemble qui devient un repère commun. | EXP |
| q3e | Une surprise parfaitement pensée | L'imprévu, mais préparé avec soin et justesse. | SUR, CAD_C |
| q3f | Une aide concrète quand j'en ai vraiment besoin | Un soutien réel dans les moments où je manque de ressources. | SER |
| q3g | Un détail qui prouve qu'on me connaît vraiment | Le petit signe qui dit : on me connaît pour de vrai. | CAD_C, GES |

### Q4 (`q4`) — « Entre deux attentions, je préfère … »
| id | Label VERBATIM | Sous-texte VERBATIM | dims |
|---|---|---|---|
| q4a | Une petite attention régulière | La constance vaut mieux qu'un grand geste isolé. | GES |
| q4b | Un grand moment rare mais marquant | Peu souvent, mais quelque chose qu'on n'oublie pas. | EXP |
| q4c | Une aide concrète quand j'en ai besoin | Du soutien réel plutôt que des mots. | SER |
| q4d | Un mot sincère au bon moment | La bonne phrase, dite au moment juste. | MOT |
| q4e | Un cadeau qui a du sens | Le symbole compte plus que la valeur. | CAD_S |
| q4f | Une surprise qui casse la routine | L'inattendu qui réveille le quotidien. | SUR |
| q4g | Un objet choisi avec précision | Le bon objet, choisi avec exigence et justesse. | CAD_C |

*(Note : cet `q4` « attention » est distinct des `q4a`-`q4d` du lifestyle — même préfixe, banques différentes.)*

### QE (`qe`) — Expression (sous séparateur « Comment tu donnes »)
- **Libellé VERBATIM :** « Et toi, comment montres-tu naturellement ton attention aux autres ? »
- **Micro VERBATIM :** « Choisis jusqu'à 3 réponses. Cela aidera Candice à comprendre les décalages possibles entre ce que tu donnes naturellement et ce que les autres attendent. »

| id | Label VERBATIM | Sous-texte VERBATIM | dims |
|---|---|---|---|
| qea | Je dis ce que je ressens, je complimente, je rassure | Je mets des mots sur ce que je ressens pour les autres. | MOT |
| qeb | J'aide, je rends service sans qu'on me le demande | Je montre que je tiens à quelqu'un en l'aidant concrètement. | SER |
| qec | J'offre des cadeaux choisis avec soin | Je traduis mon affection par un objet bien choisi. | CAD_C |
| qed | J'offre des choses qui ont du sens, une histoire | J'aime les attentions chargées de symbole. | CAD_S |
| qee | Je passe du vrai temps de qualité avec les gens | Ma façon d'aimer, c'est d'être pleinement présent(e). | EXP |
| qef | J'ai mille petites attentions au quotidien | Je montre que je pense à l'autre dans les détails. | GES |
| qeg | J'aime faire des surprises | J'exprime mon affection en créant de l'inattendu. | SUR |

**Colonnes (étape 1) :**
- `my_profile.attention_answers` — réponses brutes (JSON `{reception: [...], expression: [...]}`)
- `my_profile.attention_reception` — scoring réception (dominant/secondaire/tertiaire), calculé en code (`scoreAttention`)
- `my_profile.attention_expression` — scoring expression
- `my_profile.attention_computed_at` — horodatage
- `my_profile.attention_breath_text` — texte de respiration généré (via `POST /api/attention/breath`)

---

## Étape 2 — Mon énergie relationnelle (`TemperamentStep.tsx`, `STEP2_QUESTIONS`)

Eyebrow : **« Mon énergie relationnelle »**. Type : **choix unique** par question. Micro VERBATIM (q5-q11) : « Choisis la réponse qui te ressemble le plus. » **Obligatoire :** OUI (les 4 doivent être répondues). Chaque option porte des `deltas` (axes tempérament) et parfois un `mode` (conflit/stress/décision/canal), non affichés.
Source : `src/lib/temperament/questions.ts`.

### Q5 (`q5`) — « Quand je recharge mes batteries… »
- q5_1 « J'ai besoin de moments seul(e) » — « Le calme et la solitude me régénèrent vraiment. »
- q5_2 « Je préfère les petits groupes » — « Quelques personnes proches plutôt qu'une foule. »
- q5_3 « Ça dépend des jours » — « Mon énergie sociale varie selon les moments. »
- q5_4 « J'aime être entouré(e) » — « La présence des autres me donne de l'énergie. »
- q5_5 « Plus c'est animé, mieux c'est » — « J'aime le mouvement, la stimulation, l'effervescence. »

### Q6 (`q6`) — « Quand je suis stressé(e), j'ai tendance à… »
- q6_1 « Garder pour moi, faire bonne figure » — « J'encaisse en silence plutôt que de le montrer. » *(mode stress : silence)*
- q6_2 « Me retirer, avoir besoin de calme » — « J'ai besoin de m'isoler pour me reposer. » *(stress : retrait)*
- q6_3 « En parler, me confier » — « Mettre des mots dessus m'aide à aller mieux. » *(stress : parole)*
- q6_4 « Agir, me mettre en mouvement » — « Faire quelque chose vaut mieux que ruminer. » *(stress : action)*
- q6_5 « Chercher à contrôler ce que je peux » — « Reprendre la main sur les détails me rassure. » *(stress : contrôle)*

### Q7 (`q7`) — « Face à un désaccord, je… »
- q7_1 « En parle directement » — « J'aborde le sujet franchement, sans tourner autour. » *(conflit : direct)*
- q7_2 « Ai besoin de temps avant d'en parler » — « Je dois digérer avant de pouvoir en discuter. » *(conflit : temporisateur)*
- q7_3 « Évite le conflit autant que possible » — « Je préfère préserver la paix, quitte à me taire. » *(conflit : évitant)*
- q7_4 « Dédramatise avec l'humour » — « Je désamorce les tensions par une touche légère. » *(conflit : humour)*
- q7_5 « Écris plus facilement que je ne parle » — « À l'écrit, je trouve mieux mes mots. » *(canal : écrit)*

### Q8 (`q8`) — « Dans une relation, ce dont j'ai le plus besoin… »
- q8_1 « De stabilité et de constance » — « Savoir sur quoi je peux compter, durablement. »
- q8_2 « De liberté et d'espace » — « Pouvoir respirer sans me sentir enfermé(e). »
- q8_3 « De profondeur et d'échanges vrais » — « Des conversations qui vont au-delà du superficiel. »
- q8_4 « De légèreté et de rire » — « Du plaisir, de la fluidité, sans lourdeur. » *(conflit : humour)*
- q8_5 « De loyauté dans les moments difficiles » — « Être là quand ça compte vraiment. »
- q8_6 « De respect de mon rythme » — « Qu'on n'impose pas une cadence qui n'est pas la mienne. »

---

## Étape 3 — Communication & décision (`TemperamentStep.tsx`, `STEP3_QUESTIONS`)

Eyebrow : **« Communication & décision »**. Choix unique, micro identique, obligatoires.

### Q9 (`q9`) — « Pour communiquer, je préfère… »
- q9_1 « Aller droit au but » — « L'efficacité et la clarté, sans détour. »
- q9_2 « Parler de ce que je ressens » — « Mettre l'émotion au cœur de l'échange. »
- q9_3 « Tout analyser en profondeur » — « Comprendre le fond avant d'avancer. » *(décision : analytique)*
- q9_4 « Garder ça léger, avec humour » — « Désamorcer et alléger par le rire. » *(conflit : humour)*
- q9_5 « Écrire plutôt que parler » — « À l'écrit, je m'exprime plus juste. » *(canal : écrit)*

### Q10 (`q10`) — « Pour mes grandes décisions, je… »
- q10_1 « Analyse les pour et les contre » — « Je pèse rationnellement avant de trancher. » *(décision : rationnel)*
- q10_2 « Fais confiance à mon instinct » — « Je me fie à ce que je ressens. » *(décision : intuitif)*
- q10_3 « Demande l'avis des proches » — « Le regard des gens de confiance compte. » *(décision : social)*
- q10_4 « Fais des recherches approfondies » — « Je veux maîtriser le sujet avant de choisir. » *(décision : analytique)*
- q10_5 « Attends que ce soit clair en moi » — « Je laisse maturer jusqu'à la certitude intérieure. » *(décision : maturation)*

### Q11 (`q11`) — « J'exprime mes émotions… »
- q11_1 « Assez librement » — « Je montre ce que je ressens sans filtre. »
- q11_2 « Avec quelques personnes de confiance » — « Je m'ouvre, mais dans un cercle restreint. »
- q11_3 « Par mes actes plus que par mes mots » — « Je préfère prouver que déclarer. »
- q11_4 « Rarement, je préfère garder ça pour moi » — « Mes émotions restent surtout intérieures. »
- q11_5 « Souvent après coup, quand j'ai compris ce que je ressens » — « Je comprends mes émotions avec un temps de décalage. »

**Colonnes (étapes 2-3) :**
- `my_profile.temperament_answers` — réponses brutes `{q5: "q5_1", …}`
- `my_profile.temperament_axes` — 9 axes scorés en code (`scoreTemperament`)
- `my_profile.temperament_modes` — modes conflit/stress/décision/canal
- `my_profile.temperament_computed_at` — horodatage

---

## Étape 4 — Ce que j'aime vivre (`LifestyleStep.tsx`, `STEP4_QUESTIONS`)

Eyebrow : **« Ce que j'aime vivre »**. Choix unique, micro « Choisis la réponse qui te ressemble le plus. », obligatoires (les 9 questions). 9 questions : q12-q16 + q4a-q4d.
Source : `src/lib/lifestyle/questions.ts`.

### Q12 (`q12`) — « Quand quelqu'un m'invite ou m'offre quelque chose… »
- q12_1 « N'importe quelle attention sincère me touche » — « L'intention compte bien plus que le standing. »
- q12_2 « Quelque chose de bien choisi, même simple » — « Le soin du choix me touche plus que le prix. »
- q12_3 « Un certain niveau de qualité compte pour moi » — « J'apprécie quand c'est fait avec exigence. »
- q12_4 « Les détails influencent beaucoup mon expérience » — « Un détail raté peut gâcher l'ensemble pour moi. »
- q12_5 « Pas de préférence, je n'y suis pas attaché(e) » — « Ces détails ne pèsent pas dans mon plaisir. »

### Q13 (`q13`) — « Pour les cadeaux, je préfère… »
- q13_1 « Des expériences » — « Vivre quelque chose plutôt que posséder. »
- q13_2 « Des objets à garder » — « Quelque chose de tangible qui dure. »
- q13_3 « Les deux me touchent » — « Je suis sensible à l'un comme à l'autre. »
- q13_4 « Des choses utiles » — « Ce qui me sert vraiment au quotidien. »
- q13_5 « Des choses symboliques » — « Ce qui porte un sens, une mémoire. »

### Q14 (`q14`) — « Pour les cadeaux matériels, ce qui me touche le plus… »
- q14_1 « Un objet utile et bien pensé » — « L'usage avant tout, mais pensé. »
- q14_2 « Quelque chose qui montre qu'on m'a écouté(e) » — « La preuve qu'on a retenu un détail. »
- q14_3 « Un objet beau et de qualité » — « L'esthétique et la matière comptent. »
- q14_4 « Un objet de valeur symbolique » — « Ce qui a un sens dépasse l'objet. »
- q14_5 « Je préfère les expériences aux objets » — « Au fond, je retiens les moments. »

### Q15 (`q15`) — « Ma relation à la nourriture et aux restaurants… »
- q15_1 « J'aime manger partout » — « Peu exigeant(e), je m'adapte facilement. »
- q15_2 « Je suis gourmand(e) » — « Le plaisir de la table, la convivialité. »
- q15_3 « J'adore les belles tables » — « Le cadre et l'expérience comptent. »
- q15_4 « La gastronomie est une passion » — « Un vrai sujet d'expertise pour moi. »
- q15_5 « Je mange pour vivre » — « La nourriture n'est pas centrale chez moi. »

### Q16 (`q16`) — « Si on m'offre un week-end, ce qui compte le plus… »
- q16_1 « La destination avant tout » — « Découvrir un lieu nouveau. »
- q16_2 « Un hôtel confortable et bien situé » — « Le confort et la praticité priment. »
- q16_3 « Le charme et l'authenticité » — « Un lieu qui a une âme. »
- q16_4 « Le luxe et le service » — « Être pleinement choyé(e). »
- q16_5 « L'important, c'est d'être ensemble » — « Le lieu compte moins que la compagnie. »

### Q4a (`q4a`) — « Mon rapport au temps et à l'organisation… »
- q4a_1 « J'anticipe et je planifie à l'avance » — « Savoir où je vais me rassure. »
- q4a_2 « Je gère au fil de l'eau » — « Je préfère rester souple. »
- q4a_3 « La ponctualité compte beaucoup pour moi » — « Le retard me coûte. »
- q4a_4 « Je suis souvent un peu en retard, sans malice » — « Le temps m'échappe parfois. »
- q4a_5 « La charge mentale m'épuise vite » — « Trop à gérer me déborde. »

### Q4b (`q4b`) — « Mon rapport à la qualité et au standing… »
- q4b_1 « La qualité compte, même si je n'en parle pas » — « Je le remarque sans l'exiger. »
- q4b_2 « Je préfère la simplicité authentique au luxe » — « Le vrai vaut mieux que le clinquant. »
- q4b_3 « J'aime le beau et le raffinement » — « Le soin esthétique me touche. »
- q4b_4 « Le prix m'importe peu, c'est l'intention » — « La valeur n'est pas dans le coût. »
- q4b_5 « Je suis sensible aux belles marques et aux lieux d'exception » — « L'excellence me parle. »

### Q4c (`q4c`) — « Quand on organise quelque chose pour moi… »
- q4c_1 « J'aime tout savoir à l'avance » — « Pas d'inconnue, ça me détend. »
- q4c_2 « J'aime garder une part de surprise » — « Un peu d'inconnu, mais pas trop. »
- q4c_3 « J'aime être totalement surpris(e) » — « L'imprévu total m'enchante. »
- q4c_4 « J'ai besoin de valider les détails » — « Je préfère avoir un droit de regard. »
- q4c_5 « Je m'adapte facilement » — « Je fais confiance et je suis le mouvement. »

### Q4d (`q4d`) — « Pour rester en contact, je préfère… »
- q4d_1 « Un appel téléphonique » — « Entendre la voix, le vrai échange. » *(canal : oral)*
- q4d_2 « Un message écrit » — « Asynchrone, à mon rythme. » *(canal : écrit)*
- q4d_3 « Un vocal » — « Spontané mais sans contrainte d'horaire. » *(canal : hybride)*
- q4d_4 « En personne, rien ne remplace » — « La présence physique avant tout. » *(canal : présentiel)*
- q4d_5 « Peu importe, selon le moment » — « Je m'adapte au canal. » *(canal : flexible)*

**Colonnes (étape 4) :**
- `my_profile.lifestyle_answers` — réponses brutes
- `my_profile.lifestyle_axes` — 6 axes lifestyle (`scoreLifestyle`)
- `my_profile.temperament_axes` / `temperament_modes` — enrichis par les « suppléments » transversaux (q4a-q4d nourrissent aussi le tempérament / le canal)

---

## Étape 5 — Ce qu'il vaut mieux éviter (`AvoidStep.tsx`, `STEP5_CHOICE_QUESTIONS`)

Eyebrow : **« Ce qu'il vaut mieux éviter »**. 3 items : un texte libre (q17) + 2 choix uniques (q18, q19). **Obligatoire :** seuls q18 ET q19 sont requis pour le CTA ; q17 est facultatif.

### Q17 — Texte libre (optionnel)
- **Eyebrow VERBATIM :** « En toutes lettres »
- **Libellé VERBATIM :** « Ce qu'il vaut mieux éviter avec moi… »
- **Helper VERBATIM :** « Aucune obligation — réponds instinctivement, ou laisse vide. »
- **Placeholder VERBATIM :** « ex. les surprises, les annulations de dernière minute, certaines blagues, le bruit, les espaces bondés… »
- **Type :** texte libre (textarea) + dictée vocale (`VoiceButton`)
- **Traitement :** si texte > 4 caractères, `POST /api/lifestyle/extract-filters` extrait une liste d'interdits.
- **Colonnes :** `my_profile.relational_filters.q17Text` (texte brut) et `relational_filters.q17Interdits` (interdits extraits par IA)

### Q18 (`q18`) — « Le type de surprise que je détesterais… »
- q18_1 « Une surprise devant beaucoup de monde » — « L'attention publique me met mal à l'aise. »
- q18_2 « Une surprise qui change mon planning » — « Bousculer mon organisation me stresse. »
- q18_3 « Une surprise trop intime ou trop intense » — « Trop d'émotion exposée me gêne. »
- q18_4 « Une surprise mal organisée » — « L'amateurisme gâche tout pour moi. »
- q18_5 « Je suis plutôt partant(e) pour tout » — « J'accueille la surprise avec plaisir. »

### Q19 (`q19`) — « Ce qui me blesse le plus dans une relation… »
- q19_1 « Ne pas être écouté(e) » — « Avoir l'impression de parler dans le vide. »
- q19_2 « Être oublié(e) ou mis(e) de côté » — « Sentir que je ne compte pas. »
- q19_3 « Être envahi(e) ou contrôlé(e) » — « Manquer d'air dans la relation. »
- q19_4 « Les reproches ou critiques répétées » — « La critique constante m'use. »
- q19_5 « Le manque de fiabilité » — « Ne pas pouvoir compter sur quelqu'un. »
- q19_6 « Le manque de profondeur » — « Les relations superficielles me lassent. »

**Colonnes (étape 5) :** `my_profile.lifestyle_answers` (q18/q19), `my_profile.relational_filters` (filtres dérivés + q17), `my_profile.lifestyle_computed_at`.

---

## Étape 6 — Ce qui me rend unique (`SingularityStep.tsx` + `InterestsQuestion.tsx`)

Eyebrow : **« Ce qui me rend unique »**. Intro VERBATIM :
> « Aucune obligation — réponds à ce qui t'inspire, laisse le reste vide. Ces détails donnent à Candice la matière la plus personnelle. »

**Tout est facultatif.** Chaque champ texte dispose d'un bouton de dictée vocale.

### 6.A — Centres d'intérêt (`InterestsQuestion.tsx`)
- **Libellé VERBATIM :** « Mes centres d'intérêt »
- **Helper VERBATIM :** « Sélectionne dans l'ordre — le premier compte le plus pour Candice. »
- **Type :** choix multiple classé (rangs) + sous-détails
- **13 catégories VERBATIM** (`INTEREST_CATEGORIES`) : Lecture · Cuisine & gastronomie · Sport · Musique · Ciné & séries · Art & culture · Voyage · Mode & beauté · Tech & jeux · Nature & jardinage · Bien-être · Déco & maison · Vin & spiritueux
- **Sous-détails selon la catégorie :**
  - Lecture → « Genre préféré » (chips) : Romans, BD & mangas, Dév perso, Essais, Polars, Beaux livres, Poésie, Jeunesse, Autre
  - Sport → « Lequel ? » (texte libre, placeholder « Ex : tennis, yoga, escalade… »)
  - Musique → « Quel style ? » (texte libre « Ex : jazz, rock, rap, classique… ») + case « Concerts / live »
  - Voyage → « Type de voyage » (chips) : City-trips, Nature, Dépaysement total, Gastronomie, Culture, Bien-être, Aventure, Autre
  - Mode & beauté → « Des marques aimées ? » (texte libre « Ex : Isabel Marant, Zara, Aesop… »)
- **Champ libre commun VERBATIM :** « Autre chose ? (facultatif) » — placeholder « Passions moins connues, collections, hobbies… »
- **Colonne :** `my_profile.singularity_answers.interests` (objet `{ items: [{id, rank, details}], freeText }`)

### 6.B — 11 champs texte libre
Ordre d'affichage VERBATIM (label / sous-texte s'il existe / placeholder) → clé de stockage dans `my_profile.singularity_answers` :

| Label VERBATIM | Sous-texte VERBATIM | Placeholder VERBATIM | Clé |
|---|---|---|---|
| Ce que j'adore faire | — | ex. escalade, séries coréennes, cuisiner pour les autres, randonnée, brocantes, musées… | `adore_faire` |
| Ce que j'évite ou déteste | — | ex. sports collectifs, jeux de société, soirées bruyantes, surprises… | `evite_deteste` |
| Les sujets qui me stimulent vraiment | — | ex. startups, psychologie, voyages, football, mode, musique 90s… | `sujets_stimulants` |
| Ce que peu de gens savent sur moi | — | ex. j'adore les mangas, j'ai peur de l'avion, je fais de la poterie… | `peu_savent` |
| Le plus beau cadeau ou moment qu'on m'ait offert | — | ex. un week-end surprise bien pensé, une lettre manuscrite, un concert inoubliable… | `plus_beau_cadeau` |
| Le genre de détail qui me fait me sentir compris(e) | — | ex. qu'on se souvienne de ce que j'ai dit il y a trois mois, qu'on adapte sans que je demande… | `detail_compris` |
| Les marques, objets ou lieux que j'aime | Les enseignes et endroits où tu te sens à ta place. | ex. Aesop, les librairies indépendantes, Le Bon Marché, la papeterie japonaise, un bar à vin précis… | `marques_lieux` |
| Les cadeaux que je n'aimerais pas recevoir | Ce qui, même offert avec gentillesse, tombe à plat pour toi. | ex. bougies, fleurs coupées, gadgets, objets « déco » impersonnels, bons d'achat… | `cadeaux_non` |
| Mes envies ou rêves du moment | Ce dont tu as envie en ce moment, petit ou grand. | ex. apprendre la céramique, partir au Japon, un certain sac, me remettre au piano… | `envies_reves` |
| Ce que j'aimerais qu'on remarque davantage chez moi | Ce que tu donnes et qui passe parfois inaperçu. | ex. mes efforts, mon humour, mon écoute, mon travail, ma cuisine… | `remarquer` |
| Ce qui me fait me sentir spécial(e) | Le sentiment d'être unique aux yeux de quelqu'un. | ex. qu'on se souvienne d'un détail, qu'on prépare quelque chose rien que pour moi, qu'on prenne du temps… | `sentir_special` |

**Colonne :** `my_profile.singularity_answers` (objet).

---

## Étape 7 — Informations pratiques (`PracticalStep.tsx`)

Eyebrow : **« Informations pratiques »**. **Aucun champ obligatoire** (CTA « Terminer » toujours actif).
Encart RGPD en tête (VERBATIM) :
> « Ces informations restent strictement privées. Elles ne seront jamais affichées à tes proches. Elles servent uniquement à éviter les recommandations maladroites : mauvais restaurant, mauvaise taille, cadeau incompatible, lieu inaccessible. »

Tous les champs sont écrits dans `my_profile.practical_info` (objet), + `my_profile.practical_computed_at`.

### Section « Identité »
- **Prénom** — texte libre, placeholder « Ton prénom » → `prenom`
- **Sexe** — choix unique (pills) → `sexe` : « Femme » (`femme`), « Homme » (`homme`), « Non-binaire » (`non_binaire`), « Préfère ne pas préciser » (`ne_se_prononce_pas`)
- **Âge** — texte libre, placeholder « ex. 32 » → `age`
- **Profession** — texte libre, placeholder « ex. infirmière, développeur, enseignant… » → `profession`

### Section « Alimentation »
- **Allergies alimentaires** — choix multiple → `allergies` : « Aucune » (`aucune`), « Gluten » (`gluten`), « Lactose » (`lactose`), « Fruits à coque » (`fruits_a_coque`), « Fruits de mer » (`fruits_de_mer`), « Autre » (`autre`)
- **Régime alimentaire** — choix unique → `regime` : « Omnivore » (`omnivore`), « Végétarien » (`vegetarien`), « Vegan » (`vegan`), « Halal » (`halal`), « Casher » (`casher`), « Sans préférence » (`sans_preference`), « Autre » (`autre`)
- **Rapport à l'alcool** — choix unique → `alcool` : « Je bois » (`je_bois`), « Je n'en bois pas » (`ne_bois_pas`), « Occasionnel » (`occasionnel`), « Éviter les lieux centrés alcool » (`eviter_lieux`)

### Section « Confort »
- **Mobilité / santé / confort** — texte libre → `mobilite_sante`. Note VERBATIM : « Mobilité, santé, confort physique — utile pour éviter les lieux inadaptés. » Placeholder « ex. genou fragile, dos sensible, je ne peux pas faire de longues marches… »

### Section « Tailles »
Titre VERBATIM : « Quelles tailles te vont généralement le mieux ? » (note « Pour éviter les erreurs de cadeau vestimentaire. »). 4 champs texte :
- Vêtements (« ex. M, L, 40… ») → `taille_vetements`
- Chaussures (« ex. 42, EU 38… ») → `taille_chaussures`
- Pantalon (« ex. 40, 32×32… ») → `taille_pantalon`
- Bague (« ex. 52, taille 7… ») → `taille_bague`

### Section « Goûts »
- **Parfums et odeurs aimées** — choix multiple → `parfums` : « Frais » (`frais`), « Poudré » (`poudre`), « Boisé » (`boise`), « Floral » (`floral`), « Gourmand » (`gourmand`), « Ambré » (`ambre`), « Discret » (`discret`), « Sans parfum » (`sans_parfum`)
- **Odeurs ou parfums que je déteste** — texte libre → `odeurs_detestees` (placeholder « ex. muscs forts, patchouli, parfums sucrés entêtants… »)
- **Couleurs, matières, style** — texte libre → `couleurs_matieres` (placeholder « ex. tons neutres, lin et soie, minimaliste — ou couleurs vives, vintage, bohème… »)

### Section « Pratique »
- **Adresse de livraison** — texte libre → `adresse_livraison` (note « Pour les envois — jamais partagée avec tes proches. » ; jamais affichée aux tiers)
- **Animaux de compagnie** — texte libre → `animaux` (placeholder « ex. un chien, deux chats, aucun… »)

### Section « Agenda »
- **Dates importantes** — gestionnaire multi-entrées → `dates_importantes` (tableau). Note « Anniversaire, fête, mariage, dates symboliques — pour ne jamais les rater. » Chaque entrée : type (Anniversaire / Fête / Mariage / Date personnelle / Date symbolique / Autre), **date (obligatoire pour valider une entrée avant d'en ajouter une autre)**, libellé personnalisé, récurrence (« Chaque année » / « Une seule fois »), importance (« Faible » / « Normale » / « Forte »), rappel (« 30 jours » / « 14 jours » / « 7 jours » / « Pas de rappel »).
- **Ton rôle et lien familial** — choix multiple → `role_familial` : « Conjoint·e » (`conjoint`), « Ami·e » (`ami`), « Père » (`pere`), « Mère » (`mere`), « Enfant » (`enfant`), « Frère / Sœur » (`frere_soeur`), « Beaux-parents » (`beaux_parents`), « Collègue » (`collegue`), « Autre » (`autre`)

### Vetos dérivés (calcul en code, `deriveVetos`)
`practical_info.vetos` = `{ no_alcohol, halal, casher, mobility_constraints, allergies }` déduits automatiquement des champs ci-dessus.

---

## Tableau récapitulatif — champs TEXTE LIBRE et leur destination

| Champ (VERBATIM) | Étape | Colonne / clé dans `my_profile` |
|---|---|---|
| « Ce qu'il vaut mieux éviter avec moi… » (q17) | 5 | `relational_filters.q17Text` (+ `q17Interdits` extraits par IA) |
| Sport → « Lequel ? » | 6 | `singularity_answers.interests.items[].details.quel_sport` |
| Musique → « Quel style ? » | 6 | `singularity_answers.interests.items[].details.style` |
| Mode → « Des marques aimées ? » | 6 | `singularity_answers.interests.items[].details.marques` |
| « Autre chose ? (facultatif) » | 6 | `singularity_answers.interests.freeText` |
| Ce que j'adore faire | 6 | `singularity_answers.adore_faire` |
| Ce que j'évite ou déteste | 6 | `singularity_answers.evite_deteste` |
| Les sujets qui me stimulent vraiment | 6 | `singularity_answers.sujets_stimulants` |
| Ce que peu de gens savent sur moi | 6 | `singularity_answers.peu_savent` |
| Le plus beau cadeau ou moment qu'on m'ait offert | 6 | `singularity_answers.plus_beau_cadeau` |
| Le genre de détail qui me fait me sentir compris(e) | 6 | `singularity_answers.detail_compris` |
| Les marques, objets ou lieux que j'aime | 6 | `singularity_answers.marques_lieux` |
| Les cadeaux que je n'aimerais pas recevoir | 6 | `singularity_answers.cadeaux_non` |
| Mes envies ou rêves du moment | 6 | `singularity_answers.envies_reves` |
| Ce que j'aimerais qu'on remarque davantage chez moi | 6 | `singularity_answers.remarquer` |
| Ce qui me fait me sentir spécial(e) | 6 | `singularity_answers.sentir_special` |
| Prénom | 7 | `practical_info.prenom` |
| Âge | 7 | `practical_info.age` |
| Profession | 7 | `practical_info.profession` |
| Mobilité / santé / confort | 7 | `practical_info.mobilite_sante` |
| Tailles (vêtements, chaussures, pantalon, bague) | 7 | `practical_info.taille_vetements` / `taille_chaussures` / `taille_pantalon` / `taille_bague` |
| Odeurs ou parfums que je déteste | 7 | `practical_info.odeurs_detestees` |
| Couleurs, matières, style | 7 | `practical_info.couleurs_matieres` |
| Adresse de livraison | 7 | `practical_info.adresse_livraison` (privée, jamais affichée) |
| Animaux de compagnie | 7 | `practical_info.animaux` |
| Dates importantes → libellé | 7 | `practical_info.dates_importantes[].label` |

> À noter : les textes libres NE sont jamais affichés bruts aux tiers. Ils sont paraphrasés/fondus par le LLM de synthèse (voir `07-analyse-profil.md`), sauf les faits pratiques factuels affichés sur la fiche.
