# Audit complet des questions — Candice
> Généré le 2026-06-03 — LECTURE SEULE, ne pas modifier le code source

Ce document recense **toutes les questions, options et branchements** présents dans l'application Candice, organisés par flux.

---

## Table des matières

1. [QuestionnaireFlow — Mon profil (7 étapes)](#1-questionnaireflow--mon-profil-7-étapes)
2. [IncognitoFlow — Profil d'un proche (5 parties)](#2-incognitoflow--profil-dun-proche-5-parties)
3. [PublicForm — Auto-remplissage par le proche](#3-publicform--auto-remplissage-par-le-proche)
4. [SharedForm — Formulaire à lien partagé (4 sections)](#4-sharedform--formulaire-à-lien-partagé-4-sections)
5. [QuestionnaireForm — Ancien formulaire pilote](#5-questionnaireform--ancien-formulaire-pilote)
6. [Discovery Engine — Questions complémentaires](#6-discovery-engine--questions-complémentaires)

---

## 1. QuestionnaireFlow — Mon profil (7 étapes)

**Fichier :** `src/app/moi/questionnaire/QuestionnaireFlow.tsx`  
**Composants :** AttentionStep · TemperamentStep · LifestyleStep · AvoidStep · SingularityStep · PracticalStep · ClosingMoment  
**Données stockées dans :** `my_profile` (Supabase)

---

### Étape 01/07 — Mon langage d'attention
**Fichier :** `src/components/questionnaire/AttentionStep.tsx`  
**Lib :** `src/lib/attention/questions.ts`  
**Stocké dans :** `my_profile.attention_reception`, `my_profile.attention_expression`  
**Règle :** Multi-select, max 3 par question. Le premier choix pèse le plus.

#### Q1 — Je me sens le plus aimé(e) quand…
| id | Label | Subtext | Dimensions |
|----|-------|---------|-----------|
| q1a | On me dit des mots sincères | Un compliment vrai, une reconnaissance dite à voix haute. | MOT |
| q1b | On m'aide concrètement sans que je demande | Quelqu'un qui allège ma charge avant même que je l'exprime. | SER, GES |
| q1c | On me fait un cadeau pensé spécialement pour moi | Un objet choisi pour moi, pas acheté au hasard. | CAD_C |
| q1d | On me fait un cadeau chargé de sens | Quelque chose qui porte une histoire, une intention. | CAD_S |
| q1e | On me consacre un vrai moment de qualité | Du temps pleinement présent, sans distraction ni écran. | EXP |
| q1f | On pense à moi dans les petits détails du quotidien | Des micro-attentions régulières, pas réservées aux grandes occasions. | GES |
| q1g | On me surprend avec quelque chose d'inattendu | L'imprévu, l'effet de surprise qui crée l'émotion. | SUR |

#### Q2 — Une attention réussie, pour moi, c'est surtout…
| id | Label | Subtext | Dimensions |
|----|-------|---------|-----------|
| q2a | Quelque chose qui montre qu'on m'a écouté(e) | La preuve qu'on a retenu un détail que j'avais glissé. | CAD_C, GES |
| q2b | Quelque chose qui tombe au bon moment | Le bon geste, juste quand j'en avais besoin. | GES, SER |
| q2c | Quelque chose qui crée un souvenir | Un moment ou un objet dont on reparlera plus tard. | EXP, CAD_S |
| q2d | Quelque chose qui me facilite vraiment la vie | Une aide qui retire un poids concret de mes épaules. | SER |
| q2e | Quelque chose de simple mais sincère | Peu importe le prix, ce qui compte c'est l'intention. | MOT, GES |
| q2f | Quelque chose que je n'avais pas vu venir | L'effet de surprise, ce petit choc heureux. | SUR |
| q2g | Quelque chose de beau, choisi avec goût | Le soin, l'esthétique, la qualité du choix. | CAD_C |

#### Q3 — Ce qui me touche le plus durablement…
| id | Label | Subtext | Dimensions |
|----|-------|---------|-----------|
| q3a | Une phrase qui reste en tête | Des mots que je me répète encore longtemps après. | MOT |
| q3b | Un geste fait sans bruit, mais au bon moment | Une attention discrète qui montre qu'on a vu mon besoin. | GES, SER |
| q3c | Un objet qui a une histoire | Quelque chose chargé de mémoire, pas juste neuf. | CAD_S |
| q3d | Une expérience partagée dont on reparlera longtemps | Un moment vécu ensemble qui devient un repère commun. | EXP |
| q3e | Une surprise parfaitement pensée | L'imprévu, mais préparé avec soin et justesse. | SUR, CAD_C |
| q3f | Une aide concrète quand j'en ai vraiment besoin | Un soutien réel dans les moments où je manque de ressources. | SER |
| q3g | Un détail qui prouve qu'on me connaît vraiment | Le petit signe qui dit : on me connaît pour de vrai. | CAD_C, GES |

#### Q4 — Entre deux attentions, je préfère…
| id | Label | Subtext | Dimensions |
|----|-------|---------|-----------|
| q4a | Une petite attention régulière | La constance vaut mieux qu'un grand geste isolé. | GES |
| q4b | Un grand moment rare mais marquant | Peu souvent, mais quelque chose qu'on n'oublie pas. | EXP |
| q4c | Une aide concrète quand j'en ai besoin | Du soutien réel plutôt que des mots. | SER |
| q4d | Un mot sincère au bon moment | La bonne phrase, dite au moment juste. | MOT |
| q4e | Un cadeau qui a du sens | Le symbole compte plus que la valeur. | CAD_S |
| q4f | Une surprise qui casse la routine | L'inattendu qui réveille le quotidien. | SUR |
| q4g | Un objet choisi avec précision | Le bon objet, choisi avec exigence et justesse. | CAD_C |

#### QE — Et toi, comment montres-tu naturellement ton attention aux autres ?
_Stocké dans `my_profile.attention_expression`. Sert à comprendre les décalages._
| id | Label | Subtext | Dimensions |
|----|-------|---------|-----------|
| qea | Je dis ce que je ressens, je complimente, je rassure | Je mets des mots sur ce que je ressens pour les autres. | MOT |
| qeb | J'aide, je rends service sans qu'on me le demande | Je montre que je tiens à quelqu'un en l'aidant concrètement. | SER |
| qec | J'offre des cadeaux choisis avec soin | Je traduis mon affection par un objet bien choisi. | CAD_C |
| qed | J'offre des choses qui ont du sens, une histoire | J'aime les attentions chargées de symbole. | CAD_S |
| qee | Je passe du vrai temps de qualité avec les gens | Ma façon d'aimer, c'est d'être pleinement présent(e). | EXP |
| qef | J'ai mille petites attentions au quotidien | Je montre que je pense à l'autre dans les détails. | GES |
| qeg | J'aime faire des surprises | J'exprime mon affection en créant de l'inattendu. | SUR |

**Dimensions** : MOT=Mots · SER=Service · CAD_C=Cadeau choisi · CAD_S=Cadeau symbolique · EXP=Expérience · GES=Gestes · SUR=Surprise

---

### Étape 02/07 — Mon énergie relationnelle
**Fichier :** `src/components/questionnaire/TemperamentStep.tsx`  
**Lib :** `src/lib/temperament/questions.ts` → `STEP2_QUESTIONS`  
**Stocké dans :** `my_profile.temperament_answers`, `my_profile.temperament_axes`, `my_profile.temperament_modes`  
**Règle :** Choix unique par question. Toutes doivent être répondues.

#### Q5 — Quand je recharge mes batteries…
| id | Label | Subtext |
|----|-------|---------|
| q5_1 | J'ai besoin de moments seul(e) | Le calme et la solitude me régénèrent vraiment. |
| q5_2 | Je préfère les petits groupes | Quelques personnes proches plutôt qu'une foule. |
| q5_3 | Ça dépend des jours | Mon énergie sociale varie selon les moments. |
| q5_4 | J'aime être entouré(e) | La présence des autres me donne de l'énergie. |
| q5_5 | Plus c'est animé, mieux c'est | J'aime le mouvement, la stimulation, l'effervescence. |

#### Q6 — Quand je suis stressé(e), j'ai tendance à…
| id | Label | Subtext | Mode signal |
|----|-------|---------|------------|
| q6_1 | Garder pour moi, faire bonne figure | J'encaisse en silence plutôt que de le montrer. | stress:silence |
| q6_2 | Me retirer, avoir besoin de calme | J'ai besoin de m'isoler pour me reposer. | stress:retrait |
| q6_3 | En parler, me confier | Mettre des mots dessus m'aide à aller mieux. | stress:parole |
| q6_4 | Agir, me mettre en mouvement | Faire quelque chose vaut mieux que ruminer. | stress:action |
| q6_5 | Chercher à contrôler ce que je peux | Reprendre la main sur les détails me rassure. | stress:contrôle |

#### Q7 — Face à un désaccord, je…
| id | Label | Subtext | Mode signal |
|----|-------|---------|------------|
| q7_1 | En parle directement | J'aborde le sujet franchement, sans tourner autour. | conflit:direct |
| q7_2 | Ai besoin de temps avant d'en parler | Je dois digérer avant de pouvoir en discuter. | conflit:temporisateur |
| q7_3 | Évite le conflit autant que possible | Je préfère préserver la paix, quitte à me taire. | conflit:évitant |
| q7_4 | Dédramatise avec l'humour | Je désamorce les tensions par une touche légère. | conflit:humour |
| q7_5 | Écris plus facilement que je ne parle | À l'écrit, je trouve mieux mes mots. | canal:écrit |

#### Q8 — Dans une relation, ce dont j'ai le plus besoin…
| id | Label | Subtext |
|----|-------|---------|
| q8_1 | De stabilité et de constance | Savoir sur quoi je peux compter, durablement. |
| q8_2 | De liberté et d'espace | Pouvoir respirer sans me sentir enfermé(e). |
| q8_3 | De profondeur et d'échanges vrais | Des conversations qui vont au-delà du superficiel. |
| q8_4 | De légèreté et de rire | Du plaisir, de la fluidité, sans lourdeur. |
| q8_5 | De loyauté dans les moments difficiles | Être là quand ça compte vraiment. |
| q8_6 | De respect de mon rythme | Qu'on n'impose pas une cadence qui n'est pas la mienne. |

---

### Étape 03/07 — Mon style de communication et de décision
**Lib :** `src/lib/temperament/questions.ts` → `STEP3_QUESTIONS`

#### Q9 — Pour communiquer, je préfère…
| id | Label | Subtext | Mode signal |
|----|-------|---------|------------|
| q9_1 | Aller droit au but | L'efficacité et la clarté, sans détour. | — |
| q9_2 | Parler de ce que je ressens | Mettre l'émotion au cœur de l'échange. | — |
| q9_3 | Tout analyser en profondeur | Comprendre le fond avant d'avancer. | decision:analytique |
| q9_4 | Garder ça léger, avec humour | Désamorcer et alléger par le rire. | conflit:humour |
| q9_5 | Écrire plutôt que parler | À l'écrit, je m'exprime plus juste. | canal:écrit |

#### Q10 — Pour mes grandes décisions, je…
| id | Label | Subtext | Mode signal |
|----|-------|---------|------------|
| q10_1 | Analyse les pour et les contre | Je pèse rationnellement avant de trancher. | decision:rationnel |
| q10_2 | Fais confiance à mon instinct | Je me fie à ce que je ressens. | decision:intuitif |
| q10_3 | Demande l'avis des proches | Le regard des gens de confiance compte. | decision:social |
| q10_4 | Fais des recherches approfondies | Je veux maîtriser le sujet avant de choisir. | decision:analytique |
| q10_5 | Attends que ce soit clair en moi | Je laisse maturer jusqu'à la certitude intérieure. | decision:maturation |

#### Q11 — J'exprime mes émotions…
| id | Label | Subtext |
|----|-------|---------|
| q11_1 | Assez librement | Je montre ce que je ressens sans filtre. |
| q11_2 | Avec quelques personnes de confiance | Je m'ouvre, mais dans un cercle restreint. |
| q11_3 | Par mes actes plus que par mes mots | Je préfère prouver que déclarer. |
| q11_4 | Rarement, je préfère garder ça pour moi | Mes émotions restent surtout intérieures. |
| q11_5 | Souvent après coup, quand j'ai compris ce que je ressens | Je comprends mes émotions avec un temps de décalage. |

---

### Étape 04/07 — Ce que j'aime vivre
**Fichier :** `src/components/questionnaire/LifestyleStep.tsx`  
**Lib :** `src/lib/lifestyle/questions.ts` → `STEP4_QUESTIONS`  
**Stocké dans :** `my_profile.lifestyle_answers`, `my_profile.lifestyle_axes`

#### Q12 — Quand quelqu'un m'invite ou m'offre quelque chose…
| id | Label | Subtext |
|----|-------|---------|
| q12_1 | N'importe quelle attention sincère me touche | L'intention compte bien plus que le standing. |
| q12_2 | Quelque chose de bien choisi, même simple | Le soin du choix me touche plus que le prix. |
| q12_3 | Un certain niveau de qualité compte pour moi | J'apprécie quand c'est fait avec exigence. |
| q12_4 | Les détails influencent beaucoup mon expérience | Un détail raté peut gâcher l'ensemble pour moi. |
| q12_5 | Pas de préférence, je n'y suis pas attaché(e) | Ces détails ne pèsent pas dans mon plaisir. |

#### Q13 — Pour les cadeaux, je préfère…
| id | Label | Subtext |
|----|-------|---------|
| q13_1 | Des expériences | Vivre quelque chose plutôt que posséder. |
| q13_2 | Des objets à garder | Quelque chose de tangible qui dure. |
| q13_3 | Les deux me touchent | Je suis sensible à l'un comme à l'autre. |
| q13_4 | Des choses utiles | Ce qui me sert vraiment au quotidien. |
| q13_5 | Des choses symboliques | Ce qui porte un sens, une mémoire. |

#### Q14 — Pour les cadeaux matériels, ce qui me touche le plus…
| id | Label | Subtext |
|----|-------|---------|
| q14_1 | Un objet utile et bien pensé | L'usage avant tout, mais pensé. |
| q14_2 | Quelque chose qui montre qu'on m'a écouté(e) | La preuve qu'on a retenu un détail. |
| q14_3 | Un objet beau et de qualité | L'esthétique et la matière comptent. |
| q14_4 | Un objet de valeur symbolique | Ce qui a un sens dépasse l'objet. |
| q14_5 | Je préfère les expériences aux objets | Au fond, je retiens les moments. |

#### Q15 — Ma relation à la nourriture et aux restaurants…
| id | Label | Subtext |
|----|-------|---------|
| q15_1 | J'aime manger partout | Peu exigeant(e), je m'adapte facilement. |
| q15_2 | Je suis gourmand(e) | Le plaisir de la table, la convivialité. |
| q15_3 | J'adore les belles tables | Le cadre et l'expérience comptent. |
| q15_4 | La gastronomie est une passion | Un vrai sujet d'expertise pour moi. |
| q15_5 | Je mange pour vivre | La nourriture n'est pas centrale chez moi. |

#### Q16 — Si on m'offre un week-end, ce qui compte le plus…
| id | Label | Subtext |
|----|-------|---------|
| q16_1 | La destination avant tout | Découvrir un lieu nouveau. |
| q16_2 | Un hôtel confortable et bien situé | Le confort et la praticité priment. |
| q16_3 | Le charme et l'authenticité | Un lieu qui a une âme. |
| q16_4 | Le luxe et le service | Être pleinement choyé(e). |
| q16_5 | L'important, c'est d'être ensemble | Le lieu compte moins que la compagnie. |

#### Q4a — Mon rapport au temps et à l'organisation…
| id | Label | Subtext |
|----|-------|---------|
| q4a_1 | J'anticipe et je planifie à l'avance | Savoir où je vais me rassure. |
| q4a_2 | Je gère au fil de l'eau | Je préfère rester souple. |
| q4a_3 | La ponctualité compte beaucoup pour moi | Le retard me coûte. |
| q4a_4 | Je suis souvent un peu en retard, sans malice | Le temps m'échappe parfois. |
| q4a_5 | La charge mentale m'épuise vite | Trop à gérer me déborde. |

#### Q4b — Mon rapport à la qualité et au standing…
| id | Label | Subtext |
|----|-------|---------|
| q4b_1 | La qualité compte, même si je n'en parle pas | Je le remarque sans l'exiger. |
| q4b_2 | Je préfère la simplicité authentique au luxe | Le vrai vaut mieux que le clinquant. |
| q4b_3 | J'aime le beau et le raffinement | Le soin esthétique me touche. |
| q4b_4 | Le prix m'importe peu, c'est l'intention | La valeur n'est pas dans le coût. |
| q4b_5 | Je suis sensible aux belles marques et aux lieux d'exception | L'excellence me parle. |

#### Q4c — Quand on organise quelque chose pour moi…
| id | Label | Subtext | Filtre |
|----|-------|---------|--------|
| q4c_1 | J'aime tout savoir à l'avance | Pas d'inconnue, ça me détend. | antiSurprisePlanning |
| q4c_2 | J'aime garder une part de surprise | Un peu d'inconnu, mais pas trop. | — |
| q4c_3 | J'aime être totalement surpris(e) | L'imprévu total m'enchante. | ouvertSurprise |
| q4c_4 | J'ai besoin de valider les détails | Je préfère avoir un droit de regard. | exigenceExecution |
| q4c_5 | Je m'adapte facilement | Je fais confiance et je suis le mouvement. | — |

#### Q4d — Pour rester en contact, je préfère…
| id | Label | Subtext | Canal |
|----|-------|---------|-------|
| q4d_1 | Un appel téléphonique | Entendre la voix, le vrai échange. | oral |
| q4d_2 | Un message écrit | Asynchrone, à mon rythme. | écrit |
| q4d_3 | Un vocal | Spontané mais sans contrainte d'horaire. | hybride |
| q4d_4 | En personne, rien ne remplace | La présence physique avant tout. | présentiel |
| q4d_5 | Peu importe, selon le moment | Je m'adapte au canal. | flexible |

---

### Étape 05/07 — Ce qu'il vaut mieux éviter
**Fichier :** `src/components/questionnaire/AvoidStep.tsx`  
**Lib :** `src/lib/lifestyle/questions.ts` → `STEP5_CHOICE_QUESTIONS`

#### Q17 — Ce qu'il vaut mieux éviter avec moi… _(texte libre, optionnel)_
> Aucune obligation — réponds instinctivement, ou laisse vide.  
> Placeholder : "ex. les surprises, les annulations de dernière minute, certaines blagues, le bruit, les espaces bondés…"  
> Ce texte est analysé par LLM pour extraire des filtres relationnels (`/api/lifestyle/extract-filters`).

#### Q18 — Le type de surprise que je détesterais…
| id | Label | Subtext | Filtre |
|----|-------|---------|--------|
| q18_1 | Une surprise devant beaucoup de monde | L'attention publique me met mal à l'aise. | antiSurprisePublique |
| q18_2 | Une surprise qui change mon planning | Bousculer mon organisation me stresse. | antiSurprisePlanning |
| q18_3 | Une surprise trop intime ou trop intense | Trop d'émotion exposée me gêne. | antiSurpriseIntime |
| q18_4 | Une surprise mal organisée | L'amateurisme gâche tout pour moi. | exigenceExecution |
| q18_5 | Je suis plutôt partant(e) pour tout | J'accueille la surprise avec plaisir. | ouvertSurprise |

#### Q19 — Ce qui me blesse le plus dans une relation…
| id | Label | Subtext | Filtre |
|----|-------|---------|--------|
| q19_1 | Ne pas être écouté(e) | Avoir l'impression de parler dans le vide. | besoinEcoute |
| q19_2 | Être oublié(e) ou mis(e) de côté | Sentir que je ne compte pas. | peurOubli |
| q19_3 | Être envahi(e) ou contrôlé(e) | Manquer d'air dans la relation. | besoinAir |
| q19_4 | Les reproches ou critiques répétées | La critique constante m'use. | sensibiliteCritique |
| q19_5 | Le manque de fiabilité | Ne pas pouvoir compter sur quelqu'un. | besoinFiabilite |
| q19_6 | Le manque de profondeur | Les relations superficielles me lassent. | besoinProfondeur |

---

### Étape 06/07 — Ce qui me rend unique
**Fichier :** `src/components/questionnaire/SingularityStep.tsx`  
**Stocké dans :** `my_profile.singularity_answers`  
Toutes les questions sont en **texte libre**, optionnelles.

#### InterestsQuestion — Mes centres d'intérêt
_Composant réutilisable : `src/components/questionnaire/InterestsQuestion.tsx`_  
Multi-sélection ordonnée par rang de priorité. 13 catégories :

| id | Label | Sous-questions si sélectionné |
|----|-------|-------------------------------|
| lecture | Lecture | Genre préféré (chips multi) : Romans · BD & mangas · Dév perso · Essais · Polars · Beaux livres · Poésie · Jeunesse · Autre |
| cuisine | Cuisine & gastronomie | — |
| sport | Sport | Lequel ? (texte libre) |
| musique | Musique | Quel style ? (texte) · Concerts / live (checkbox) |
| cinema | Ciné & séries | — |
| art | Art & culture | — |
| voyage | Voyage | Type de voyage (chips multi) : City-trips · Nature · Dépaysement total · Gastronomie · Culture · Bien-être · Aventure · Autre |
| mode | Mode & beauté | Des marques aimées ? (texte) |
| tech | Tech & jeux | — |
| nature | Nature & jardinage | — |
| bienetre | Bien-être | — |
| deco | Déco & maison | — |
| vin | Vin & spiritueux | — |

+ Champ "Autre chose ?" (texte libre) : passions moins connues, collections, hobbies

#### Questions texte libre (Singularité)
| Clé | Label | Subtext | Placeholder |
|-----|-------|---------|-------------|
| adore_faire | Ce que j'adore faire | — | ex. escalade, séries coréennes, cuisiner pour les autres, randonnée, brocantes, musées… |
| evite_deteste | Ce que j'évite ou déteste | — | ex. sports collectifs, jeux de société, soirées bruyantes, surprises… |
| sujets_stimulants | Les sujets qui me stimulent vraiment | — | ex. startups, psychologie, voyages, football, mode, musique 90s… |
| peu_savent | Ce que peu de gens savent sur moi | — | ex. j'adore les mangas, j'ai peur de l'avion, je fais de la poterie… |
| plus_beau_cadeau | Le plus beau cadeau ou moment qu'on m'ait offert | — | ex. un week-end surprise bien pensé, une lettre manuscrite, un concert inoubliable… |
| detail_compris | Le genre de détail qui me fait me sentir compris(e) | — | ex. qu'on se souvienne de ce que j'ai dit il y a trois mois, qu'on adapte sans que je demande… |
| marques_lieux | Les marques, objets ou lieux que j'aime | Les enseignes et endroits où tu te sens à ta place. | ex. Aesop, les librairies indépendantes, Le Bon Marché, la papeterie japonaise, un bar à vin précis… |
| cadeaux_non | Les cadeaux que je n'aimerais pas recevoir | Ce qui, même offert avec gentillesse, tombe à plat pour toi. | ex. bougies, fleurs coupées, gadgets, objets « déco » impersonnels, bons d'achat… |
| envies_reves | Mes envies ou rêves du moment | Ce dont tu as envie en ce moment, petit ou grand. | ex. apprendre la céramique, partir au Japon, un certain sac, me remettre au piano… |
| remarquer | Ce que j'aimerais qu'on remarque davantage chez moi | Ce que tu donnes et qui passe parfois inaperçu. | ex. mes efforts, mon humour, mon écoute, mon travail, ma cuisine… |
| sentir_special | Ce qui me fait me sentir spécial(e) | Le sentiment d'être unique aux yeux de quelqu'un. | ex. qu'on se souvienne d'un détail, qu'on prépare quelque chose rien que pour moi, qu'on prenne du temps… |

---

### Étape 07/07 — Informations pratiques
**Fichier :** `src/components/questionnaire/PracticalStep.tsx`  
**Stocké dans :** `my_profile.practical_info` (JSONB)  
Note RGPD affichée : "Ces informations restent strictement privées. Elles ne seront jamais affichées à tes proches."

#### Section Identité
| Champ | Type | Options / Placeholder |
|-------|------|----------------------|
| Prénom | Texte | "Ton prénom" |
| Sexe | Chips (single) | Femme · Homme · Non-binaire · Préfère ne pas préciser |
| Âge | Texte | "ex. 32" |
| Profession | Texte | "ex. infirmière, développeur, enseignant…" |

#### Section Alimentation
| Champ | Type | Options |
|-------|------|---------|
| Allergies alimentaires | Chips (multi) | Aucune · Gluten · Lactose · Fruits à coque · Fruits de mer · Autre |
| Régime alimentaire | Chips (single) | Omnivore · Végétarien · Vegan · Halal · Casher · Sans préférence · Autre |
| Rapport à l'alcool | Chips (single) | Je bois · Je n'en bois pas · Occasionnel · Éviter les lieux centrés alcool |

#### Section Confort
| Champ | Type | Note |
|-------|------|------|
| Mobilité / santé / confort | Textarea | "ex. genou fragile, dos sensible, je ne peux pas faire de longues marches…" |

#### Section Tailles
| Champ | Type | Placeholder |
|-------|------|-------------|
| Vêtements | Texte | "ex. M, L, 40…" |
| Chaussures | Texte | "ex. 42, EU 38…" |
| Pantalon | Texte | "ex. 40, 32×32…" |
| Bague | Texte | "ex. 52, taille 7…" |

#### Section Goûts
| Champ | Type | Options / Placeholder |
|-------|------|----------------------|
| Parfums et odeurs aimées | Chips (multi) | Frais · Poudré · Boisé · Floral · Gourmand · Ambré · Discret · Sans parfum |
| Odeurs ou parfums que je déteste | Textarea | "ex. muscs forts, patchouli, parfums sucrés entêtants…" |
| Couleurs, matières, style | Textarea | "ex. tons neutres, lin et soie, minimaliste — ou couleurs vives, vintage, bohème…" |

#### Section Pratique
| Champ | Type | Note |
|-------|------|------|
| Adresse de livraison | Textarea (2 lignes) | Jamais partagée avec les proches |
| Animaux de compagnie | Texte | "ex. un chien, deux chats, aucun…" |

#### Section Agenda
| Champ | Type | Options |
|-------|------|---------|
| Dates importantes | Gestionnaire dynamique | Types : Anniversaire · Fête · Mariage · Date personnelle · Date symbolique · Autre |
| Ton rôle et lien familial | Chips (multi) | Conjoint·e · Ami·e · Père · Mère · Enfant · Frère/Sœur · Beaux-parents · Collègue · Autre |

---

## 2. IncognitoFlow — Profil d'un proche (5 parties)

**Fichier :** `src/app/contacts/[id]/questionnaire/IncognitoFlow.tsx`  
**Stocké dans :** `questionnaire_responses` (table contacts)  
**Règle :** Le pilote répond "à la place" du proche selon ce qu'il sait de lui/elle.

### Q1 — Qu'est-ce qui fait vraiment plaisir à [prénom] ? _(ranked ≤3)_
_Section : Ce qui touche [prénom]_
| Valeur | Label | Subtext |
|--------|-------|---------|
| mots | Un message sincère, des mots qui viennent du cœur | Compliments, belles lettres, messages touchants |
| presence | Qu'on soit vraiment là pour lui/elle | Présence, écoute, se sentir compris(e) |
| petits_gestes | Les petites attentions du quotidien | Penser à quelque chose qu'il/elle a mentionné, agir sans qu'on lui demande |
| cadeau_precis | Un cadeau bien choisi, précis, réfléchi | Un objet ou une idée qui montre qu'on le/la connaît |
| experience | Vivre quelque chose d'inoubliable ensemble | Sorties, voyages, dîners, activités partagées |
| symbole | Un geste symbolique ou significatif | Quelque chose de porteur de sens, plus que de valeur |
| surprise | Une surprise qu'il/elle n'avait pas vue venir | L'effet de l'imprévu, la preuve qu'on y pensait |

### Q2 — Comment [prénom] exprime ce qu'il/elle ressent ? _(ranked ≤3)_
| Valeur | Label | Subtext |
|--------|-------|---------|
| openly | Très ouvertement | Partage facilement ses émotions, ne se cache pas |
| selectively | Sélectivement | S'ouvre uniquement aux personnes de confiance |
| through_actions | Par les actes plutôt que les mots | Montre ce qu'il/elle ressent, sans forcément le dire |
| humor | Avec humour ou légèreté | Dédramatise, passe par le second degré |
| rarely | Rarement | Intériorise beaucoup, gère ses émotions seul(e) |

### Q3 — Qu'est-ce que [prénom] aime faire quand il/elle a du temps libre ? _(texte libre)_
_Placeholder : "Ex : randonnée, cuisine, séries coréennes, jardinage…"_

### Q4 — Si vous deviez offrir quelque chose à [prénom]… _(ranked ≤3)_
_Section : L'univers de [prénom]_
| Valeur | Label | Subtext |
|--------|-------|---------|
| experiences | Une expérience | Concert, voyage, atelier, dîner… |
| useful | Un objet utile et bien pensé | Quelque chose qu'il/elle utilise vraiment |
| beauty | Un bel objet de qualité | Esthétique, bien fait, dans de belles matières |
| symbolic | Quelque chose de symbolique | Un cadeau porteur de sens, personnel |
| consumable | Un plaisir consommable | Bouteille, épicerie fine, fleurs, chocolats… |
| surprise | Faites confiance à Candice | Je ne sais pas — laissez-la suggérer |

### Q5 — Quand on fait attention à [prénom], comment il/elle le reçoit ? _(single)_
| Valeur | Label | Subtext |
|--------|-------|---------|
| any_sincere | Touché(e) par n'importe quelle attention sincère | Le geste compte plus que la valeur ou le standing |
| well_chosen | Sensible à ce qui est bien choisi, même simple | Un cadeau réfléchi vaut plus qu'un cadeau cher sans effort |
| quality | Apprécie un certain niveau de qualité | Le cadre, le service ou la qualité font partie du plaisir |
| high_standards | A des goûts précis, remarque quand c'est raté | Exigeant(e) — mieux vaut bien viser |
| dont_know | Je ne sais pas vraiment | Candice s'adaptera avec le temps |

### Q6 — En période de stress ou de difficulté, [prénom]… _(single)_
_Section : Comment [prénom] fonctionne_
| Valeur | Label | Subtext |
|--------|-------|---------|
| withdraws | Se retire et a besoin de silence | Plus discret(e), recharge loin des autres |
| seeks_support | Cherche à en parler et à être écouté(e) | A besoin de dire ce qu'il/elle ressent |
| action | Se met dans l'action | Canalise le stress en faisant des choses |
| internalizes | Intériorise et gère seul(e) | Garde ses émotions pour lui/elle, n'en parle pas |
| humor | Relativise avec humour | Désamorce avec légèreté, dédramatise |

### Q7 — Ce qui guide les décisions de [prénom] _(ranked ≤2)_
| Valeur | Label | Subtext |
|--------|-------|---------|
| logic | La logique et les faits | Pèse les avantages, les risques, les données |
| intuition | L'instinct et le ressenti | Son sixième sens guide plus que la raison |
| others | L'avis des proches | Les retours de confiance l'aident à se positionner |
| research | Une recherche approfondie | A besoin d'informations complètes avant de décider |
| values | Ses valeurs personnelles | Ce qui est juste compte plus que ce qui est optimal |

### Q8 — Ce qu'il faut absolument éviter avec [prénom] _(texte libre)_
_Placeholder : "Ex : déteste les surprises, allergique au gluten, ne pas aborder le travail…"_

### Section Open — Questions ouvertes
**InterestsQuestion** — Les centres d'intérêt de [prénom] _(même composant, mêmes 13 catégories)_

| Champ | Placeholder |
|-------|-------------|
| Ce que vous voudriez que Candice sache sur [prénom] | "Ex : vient de changer de poste, traverse une période difficile, adore son chat…" |
| Les sujets dont [prénom] pourrait parler pendant des heures | "Ex : philosophie, ses enfants, le cinéma japonais, l'entrepreneuriat…" |

### Section Practical — Infos pratiques
| Champ | Placeholder |
|-------|-------------|
| Les dates importantes pour [prénom] | "Ex : Anniversaire : 12 mars — Fête des mères : toujours un dimanche de mai…" |

---

## 3. PublicForm — Auto-remplissage par le proche

**Fichier :** `src/app/profil/[id]/PublicForm.tsx`  
**Route :** `/profil/[contactId]`  
**Stocké dans :** `questionnaire_responses`  
Le proche remplit son propre profil via un lien envoyé par le pilote.

### Section 1 — Qui es-tu ?
_(12 questions multi-select max 3, réponses psychologiques)_

| Question | Options |
|----------|---------|
| Je me sens le plus aimé(e) quand… | On me dit des mots doux · On m'aide concrètement · On me fait un cadeau réfléchi · On est vraiment présent · On me serre dans ses bras |
| Pour communiquer, je préfère… | Aller droit au but · Parler de ce que je ressens · Tout analyser en profondeur · Garder ça léger, avec humour |
| Quand je suis stressé(e), j'ai tendance à… | Me retirer, avoir besoin de calme · En parler, me confier · Agir, me mettre en mouvement · Garder pour moi, faire bonne figure |
| Mon énergie sociale… | Je recharge vraiment seul(e) · Je préfère les petits groupes · Ça dépend des jours · J'aime être entouré(e) · Plus c'est animé, mieux c'est |
| Ce qui me touche vraiment, c'est quand… | On me dit sincèrement merci · On m'aide sans que je demande · On me fait un cadeau qui me ressemble · On me consacre du temps de qualité · On me serre dans ses bras |
| Face à un désaccord, je… | En parle directement · Ai besoin de temps avant d'en parler · Évite le conflit autant que possible · Dédramatise avec l'humour |
| Pour mes grandes décisions, je… | Analyse les pour et les contre · Fais confiance à mon instinct · Demande l'avis des proches · Fais des recherches approfondies |
| J'exprime mes émotions… | Assez librement · Avec quelques personnes de confiance · Par mes actes plus que par mes mots · Rarement, je préfère garder ça pour moi |
| Dans une relation, ce qui compte le plus pour moi… | La loyauté · La profondeur, grandir ensemble · Le fun, rire ensemble · La stabilité, la constance |
| Quand je réussis quelque chose, je préfère… | Être célébré(e) ouvertement · Qu'on me le dise en privé · La satisfaction personnelle me suffit · Fêter ça avec mes proches |
| Ce dont j'ai le plus besoin… | Du temps seul(e) · Ne pas me sentir envahi(e) · Qu'on respecte mon planning · Que ma vie privée reste la mienne |
| Pour grandir, j'aime surtout… | Vivre des expériences nouvelles · Lire, me former de façon structurée · Réfléchir, écrire, m'observer · Échanger avec les autres |

### Section 2 — Tes préférences
| Champ | Type | Placeholder / Options |
|-------|------|----------------------|
| Mes centres d'intérêt | InterestsQuestion | _même composant 13 catégories_ |
| Mes loisirs et passions | Textarea | "ex. escalade, séries coréennes, cuisiner pour les autres…" |
| Ce que j'adore manger | Textarea | "ex. cuisine japonaise, pizzas napolitaines, allergique aux fruits de mer…" |
| Pour les cadeaux, je préfère… | Multi-select ≤3 | Des expériences · Des objets à garder · Les deux me touchent |
| Les sujets qui m'allument vraiment | Textarea | "ex. startups, psychologie, voyages, foot…" |
| Ce qu'il vaut mieux éviter avec moi | Textarea | "ex. les surprises, annuler à la dernière minute…" |
| La meilleure façon de me contacter | Multi-select ≤3 | SMS · Appel · E-mail · En vrai, de préférence |
| Mes dates importantes | Textarea | "ex. anniversaire : 14 juin…" |
| Autre chose à savoir sur moi | Textarea (3 lignes) | "Ce que tu voudrais que les gens qui t'aiment sachent…" |

---

## 4. SharedForm — Formulaire à lien partagé (4 sections)

**Fichier :** `src/app/profil-partage/[token]/SharedForm.tsx`  
**Stocké dans :** `shared_profile_responses`  
**36 questions tracées** · Sauvegarde automatique locale (localStorage)  
Confidentialité : "Senderame ne lira jamais tes réponses. Candice les analyse en silence."

### Section 1 — Qui es-tu ?
_(12 multi-select, identiques à PublicForm — voir ci-dessus)_

### Section 2 — Tes préférences

| Champ | Type | Options / Placeholder |
|-------|------|----------------------|
| Ce que j'adore faire | Textarea | "ex. escalade, séries coréennes, cuisiner pour les autres…" |
| Ce que j'évite ou déteste | Textarea | "ex. les sports collectifs, les jeux de société…" |
| Ce que j'adore manger | Textarea | "ex. cuisine japonaise, pizzas napolitaines…" |
| Ce que je déteste manger | Textarea | "ex. foie gras, anchois, plats trop épicés…" |
| Pour les cadeaux, je préfère… | Multi-select ≤3 | Des expériences · Des objets à garder · Les deux me touchent |
| Quand quelqu'un m'invite ou m'offre quelque chose… | Multi-select ≤3 | N'importe quelle attention sincère me touche · Quelque chose de bien choisi, même simple · Un certain niveau de qualité · Je suis difficile(e), je remarque tout · Pas de préférence |
| Ma relation à la nourriture et aux restaurants | Multi-select ≤3 | J'aime manger partout · Je suis gourmand(e) · J'adore les belles tables · La gastronomie est une passion · Je mange pour vivre |
| Si on m'offre un week-end, ce qui compte le plus… | Multi-select ≤3 | La destination avant tout · Un hôtel confortable et bien situé · Le charme, l'authenticité · Le luxe et le service · L'important c'est d'être ensemble |
| Pour les cadeaux matériels, ce qui me touche le plus | Multi-select ≤3 | Un objet utile et bien pensé · Quelque chose qui montre qu'on m'a écouté(e) · Un objet beau et de qualité · Un objet de valeur symbolique · Je préfère les expériences aux objets |
| Je suis tactile… | Chips (max 1) | Avec tout le monde · Avec mon/ma partenaire uniquement · Avec mes enfants uniquement · Avec mes proches (famille/amis) · Pas du tout |
| Les sujets qui me stimulent vraiment | Textarea | "ex. startups, psychologie, voyages, foot…" |
| Ce qu'il vaut mieux éviter avec moi | Textarea | "ex. les surprises, annuler à la dernière minute…" |
| La meilleure façon de me contacter | Multi-select ≤3 | Message (WhatsApp, SMS…) · Appel · E-mail · En vrai, de préférence |
| Mes dates importantes | Gestionnaire structuré | Anniversaire · Anniversaire de mariage · Fête (prénom) + dates personnalisées |

### Section 3 — Pour aller plus loin
_(5 textes libres, "strictement privés")_
| Champ | Placeholder |
|-------|-------------|
| Ma santé & confort | "ex. problèmes de dos, mobilité réduite, migraines fréquentes…" |
| Ma famille & vie perso | "ex. parent de deux enfants, en couple depuis 3 ans…" |
| Mon caractère & émotions | "ex. je gère mal la critique, j'ai besoin de temps seul après une longue journée…" |
| Ce que je ne supporte pas | "ex. les moqueries, les surprises, le bruit, qu'on soit en retard…" |
| Ce que peu de gens savent sur moi | "ex. j'adore les mangas, j'ai peur de l'avion, j'ai vécu 3 ans en Asie…" |

### Section 4 — Infos pratiques
| Champ | Type | Options / Note |
|-------|------|----------------|
| Taille vêtements | Radio chips | XS · S · M · L · XL · XXL |
| Pointure chaussures | Nombre | 28–50 |
| Taille bague (optionnel) | Texte | "ex. 54, 56…" |
| Taille pantalon (optionnel) | Texte | "ex. 36/32, Slim 34…" |
| Allergies alimentaires | Multi-select ≤6 | Aucune allergie · Gluten · Lactose · Noix & fruits à coque · Fruits de mer · Autre |
| Régime alimentaire | Multi-select ≤4 | Omnivore · Végétarien(ne) · Vegan · Halal · Casher · Sans préférence |
| Animaux de compagnie (optionnel) | Texte | "ex. un chat roux, deux chiens…" |
| Religion & convictions (optionnel) | Textarea | "ex. catholique pratiquant, bouddhiste, agnostique…" |
| Situation de handicap (optionnel) | Textarea | "ex. malvoyant(e), fauteuil roulant, douleurs chroniques…" |
| Adresse postale (pour les livraisons) | Textarea | "ex. 12 rue de la Paix, 75001 Paris" |

---

## 5. QuestionnaireForm — Ancien formulaire pilote

**Fichier :** `src/components/questionnaire/QuestionnaireForm.tsx`  
**Stocké dans :** `questionnaire_responses` + `contacts`  
**Statut :** Ancien flux (design pre-V11, couleur `var(--terra)` terra cotta). Toujours actif pour le mode "Je remplis moi-même" depuis la fiche contact.

### Étape 0 — Qui ajoutez-vous ?
| Champ | Type | Options |
|-------|------|---------|
| Prénom | Texte | — |
| Relation | Radio | Partenaire · Ami(e) · Famille · Collègue · Autre |
| E-mail | Email | facultatif |
| Téléphone | Tel | facultatif |
| Pronom | Radio | Elle · Il · Iel · Ne se prononce pas |

### Étape 1 — Et aujourd'hui, votre relation ressemble plutôt à…
| Valeur | Label | Subtext |
|--------|-------|---------|
| très_proche_fluide | Très proche et fluide | Vous pouvez vous parler naturellement, sans trop réfléchir. |
| proche_quotidien | Proche, mais prise dans le quotidien | Le lien est là, mais il manque parfois de temps ou d'attention. |
| importante_distante | Importante, mais un peu distante | Vous tenez l'un à l'autre, mais le lien n'est pas toujours nourri. |
| compliquée_fragile | Compliquée ou fragile | Il faut éviter les attentions trop intimes ou trop émotionnelles. |
| formelle_occasionnelle | Plutôt formelle ou occasionnelle | Les attentions doivent rester simples, sobres et adaptées. |
| je_ne_sais_pas | Je ne sais pas trop | Candice commencera doucement, sans supposer trop d'intimité. |

_Si "Compliquée ou fragile" : champ texte optionnel "Comment tu aimes entretenir le lien avec [prénom], malgré ce qui est compliqué"_

### Étape 2 — Mode de création du profil
- **Recommandé :** "Il/elle remplit son profil" → génère un lien public `/profil/[contactId]`
- **Alternatif :** "Je remplis moi-même" → mode incognito, redirige vers `/contacts/[id]`

### (Mode incognito — questions legacy, non affichées dans le flux actuel)
_Ces questions sont définies dans le code mais le flux incognito actuel utilise IncognitoFlow (voir §2). Elles restent dans QuestionnaireForm pour compatibilité._

12 sections multi-select psychologiques (identiques à PublicForm/SharedForm) + préférences + notes. Voir les valeurs dans `QuestionnaireForm.tsx` lignes 729–962.

---

## 6. Discovery Engine — Questions complémentaires

**Table SQL :** `discovery_questions`  
**Migration :** `supabase-migration-29-discovery.sql`  
**Lib :** `src/lib/discovery/engine.ts`  
**Stocké dans :** `my_profile.discovery_answers` (JSONB keyed by `question_key`)  
**Règle :** Ne re-pose jamais une question déjà répondue. Reformulation douce par Claude Haiku (avec fallback).

### Mode drip (1 question)
Déclenché depuis un signal récent (`signals.signal_type` → `SIGNAL_DIMENSION_MAP`) ou première question non répondue.

### Mode full (session guidée)
Toutes les questions non répondues, en ordre `sort_order`, avec barre de progression (sections, sans %).

### 14 questions actives (cibles : self)

| question_key | dimension | Type | Question | Options |
|-------------|-----------|------|----------|---------|
| attention.reception | attention | chips_multi | Comment tu te sens vraiment aimé·e ? | Par les mots · Par les actes · Par des cadeaux · Par le temps partagé · Par les petites attentions · Par les surprises |
| gifts.what_works | gifts | chips_multi | Quel type de cadeau te touche vraiment ? | Expériences · Personnalisé · Utile et beau · Beauté / bien-être · Livres / culture · Fait main · Surprise totale |
| gifts.to_avoid | gifts | text | Des cadeaux ou attentions à éviter absolument ? | _(texte libre)_ |
| style.clothing | style | chips_multi | Tu te décrirais avec quel style ? | Classique · Bohème · Minimaliste · Chic parisien · Décontracté · Sportswear · Mode / tendance |
| style.colors | style | text | Tes couleurs et matières préférées pour te faire plaisir ? | _(texte libre)_ |
| brands.favorites | brands | text | Des marques, enseignes ou créateurs que tu adores ? | _(texte libre)_ |
| food.restaurants | food | chips_multi | Tu préfères quel type de table ? | Bistrot convivial · Gastronomique · Bonne adresse décontractée · Cuisine du monde · Végétarien / healthy · Tout si c'est bon |
| fragrance.family | fragrance | chips_multi | Tu portes plutôt quel type de parfum ? | Fleuri · Frais / citrus · Boisé · Oriental / Ambré · Poudré · Gourmand · Discret · Sans parfum |
| travel.style | travel | chips_multi | Quand tu voyages, tu cherches… | L'aventure · La culture · Le repos total · La nature · Les villes animées · La gastronomie locale · Le luxe discret |
| hobbies.main | hobbies | text | Qu'est-ce qui te ressource vraiment ? | _(texte libre)_ |
| dreams.current | dreams | text | Tu as des envies ou des rêves en ce moment ? | _(texte libre)_ |
| surprises.preference | surprises | chips_single | Tu es plutôt… | J'adore les surprises · Ça dépend du contexte · Je préfère être prévenu·e · Les surprises me stressent |
| conflicts.style | conflicts | chips_single | Face à une tension, comment tu réagis ? | J'en parle directement · J'ai besoin de recul · Je préfère éviter · Je dédramatise |
| practical.constraints | practical | chips_multi | Des contraintes importantes à connaître ? | Végétarien·ne · Vegan · Halal · Casher · Allergie alimentaire · Sans alcool · Contrainte de mobilité · Aucune |

### Mapping signaux → dimensions (drip trigger)

| Signal | Dimension ciblée |
|--------|-----------------|
| celebration_appropriate | gifts |
| gift_precision_needed | gifts |
| premium_gift_preference | style |
| gastronomy_interest | food |
| travel_desire | travel |
| wellness_importance | fragrance |
| surprise_tolerance | surprises |
| direct_communication_preference | conflicts |
| fashion_affinity | style |
| reading_affinity | hobbies |
| music_affinity | hobbies |
| nature_affinity | travel |
| handmade_gift_preference | gifts |
| public_recognition_avoidance | surprises |

---

## Synthèse — Dimensions couvertes

| Dimension | Sources principales |
|-----------|---------------------|
| Langage d'attention (7D) | Q1–Q4, QE (attention) · Q1 Incognito · discovery attention.reception |
| Tempérament relationnel | Q5–Q11 (temperament) · Q6–Q7 Incognito |
| Préférences cadeaux | Q13–Q14 · discovery gifts.what_works / gifts.to_avoid |
| Style et standing | Q12, Q4b · discovery style.clothing / style.colors |
| Gastronomie | Q15 · discovery food.restaurants |
| Hébergement / voyages | Q16 · discovery travel.style |
| Surprises et organisation | Q18, Q4c · discovery surprises.preference |
| Évitements relationnels | Q17 (texte), Q19, Q8 Incognito |
| Singularité | Singularity step (11 champs texte + InterestsQuestion 13 catégories) |
| Infos pratiques | PracticalStep (tailles, allergies, dates, rôle familial) · SharedForm section 4 |
| Marques / parfums | Singularité marques_lieux · PracticalStep parfums · discovery brands.favorites / fragrance.family |
| Loisirs et rêves | Singularité adore_faire / envies_reves · discovery hobbies.main / dreams.current |
| Contact préféré | Q4d · SharedForm bestContactMethod · PublicForm bestContactMethod |

---

## Notes techniques

- **Axe tempérament** (9 axes, scoring) : `energieSociale · espaceProsimite · spontaneiteControle · communicationStyle · expressiviteReserve · stabiliteNouveaute · sensibiliteDetails · exigenceStanding · rapportTemps`
- **Filtres relationnels** (12) : `antiSurprisePublique · antiSurprisePlanning · antiSurpriseIntime · exigenceExecution · ouvertSurprise · besoinEcoute · peurOubli · besoinAir · sensibiliteCritique · besoinFiabilite · besoinProfondeur · sensibiliteChargeMetale`
- **Axes lifestyle** (6) : `foodie · premiumSimplicite · experienceObjet · esthetiqueFonctionnel · aventureConfort · authenticiteLuxe`
- **Questions proactives (contact journal)** : 6 templates générés dynamiquement par `src/lib/recommendations/questions.ts` · `generateProactiveQuestion(firstName, recentlyAsked)` · Anti-répétition sur N dernières questions.
