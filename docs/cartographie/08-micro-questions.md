# 08 — Micro-questions Discovery (banque `discovery_questions`)

> Les « micro-questions » que Candice pose APRÈS le questionnaire initial, pour affiner. Banque en base + mécanisme de sélection.
> Sources : table (base : `discovery_questions`), `src/lib/discovery/engine.ts` (sélecteur `getNextMicroQuestion`), `src/lib/discovery/status.ts` (statuts), `src/lib/profile/v2-metrics.ts` + `src/lib/profile/sheet-data.ts` (jauge de connaissance), `src/app/moi/discovery/*` (écran), `src/components/profile/v2/Header.tsx` + `Viser.tsx` (incitations).

---

## Comptages réels (base)

- `discovery_questions` : **70 lignes** — 68 `statut = active`, 2 `statut = archived` (`fragrance.family`, `fragrance.beauty_gift`). Toutes `target = self`.
- Répartition par dimension : attention **7**, brands **3**, conflicts **3**, dreams **4**, food **6**, fragrance **6**, gifts **6**, hobbies **11**, practical **6**, style **9**, surprises **4**, travel **5**.
- `discovery_sessions` : **57 lignes** (sessions de réponse, créées à la 1re réponse).
- `profile_completion` : **0 ligne** (aucun statut de complétion persisté à ce jour — voir note « pré-calcul inactif »).

Colonnes de `discovery_questions` : `question_key`, `dimension`, `subdimension`, `question_text`, `question_type` (`chips_single` / `chips_multi` / `text`), `options` (jsonb `[{label,value}]`), `statut`, `sort_order`, `priority` (toutes à **50**), `trigger_condition`, `updates_dimensions`, `free_text_enabled` (**false partout**), `locked_text`, `target`, `benefit_label`, `duration_label`.

---

## Le flag `PERSONALIZATION_ACTIVE`

Dans `src/lib/discovery/engine.ts` (l.88) : **`const PERSONALIZATION_ACTIVE = false;`**

Décision Estelle (revue de banque) : la reformulation IA est **COUPÉE**. Toutes les questions sont servies avec leur **texte de banque MOT POUR MOT**. Le pré-calcul D1 (fonctions `precomputePersonalizationsForKeys`, `precomputeUpcomingPersonalizations`) reste en place techniquement mais **inactif** — il ne resservira que si le flag repasse à `true`. C'est pourquoi `profile_completion.personalized_text` n'est jamais rempli et que la table est vide. `locked_text = true` : question jamais reformulée même si le flag était réactivé.

---

## Mécanisme de sélection — `getNextMicroQuestion` (`engine.ts`, l.406-461)

**Lecture seule** (aucune écriture ; le GET `/moi/discovery` est sans effet de bord → page cacheable). La session naît à la 1re réponse via `createDiscoverySession` (route `answer`).

Étapes :
1. **3 lectures parallèles** : toutes les questions actives `target='self'` triées par `sort_order` (`getAllQuestionsWithTrigger`) ; snapshot `my_profile` (`practical_info`, `singularity_answers`, `relational_filters`, `discovery_answers`) ; statuts de complétion (`profile_completion`).
2. **Rétro-alimentation en mémoire** (`applyDataSync`) : une donnée déjà présente en fiche vaut réponse → statut `answered` (pur, sans écriture au rendu).
3. **Filtrage des candidates** — une question est candidate si :
   - son statut n'est PAS bloquant (`blockedKeys` = statuts `answered` ou `archived`), ET
   - la donnée n'est PAS déjà présente en fiche (`questionDataPresent`), ET
   - son `trigger_condition` passe (`evaluateTrigger`).
4. **Filtre par section** (optionnel) : si `sectionKey` fourni (deep-link nudge), on restreint aux dimensions mappées (`SECTION_KEY_TO_DIMENSIONS`).
5. **Score & tri** : `score = computeGapScore(q) * 100 + (priority ?? 50)`, tie-break par `sort_order` croissant.
   - `computeGapScore` (l.384-395) : 2 si la section d'analyse correspondante est vide/absente, 1 si son texte < 60 caractères, 0 sinon. → **on privilégie les sections les moins renseignées**.
6. **Lot** : `quick` → 1 question ; `full` → jusqu'à **`FULL_SESSION_MAX = 3`** questions.
7. Retourne la 1re question (texte de banque, reformulation coupée), `sessionId: null`, `pendingKeys`, `currentIndex: 0`, `mode`, `sectionLabel`, `progress`.

**`evaluateTrigger` (l.357-382) :** si `trigger_condition` vide → passe toujours. Sinon, une heuristique (`inferSectionKeyFromTrigger`) devine la section d'analyse concernée ; un motif d'absence (« non renseigné », « non détaillé », « vide », « incomplet », « non précis ») → passe si la section est **mince** ; sinon → passe si la section a du **contenu**.

**Mapping dimension → section d'analyse** (`DIMENSION_TO_ANALYSIS_SECTION`) : attention→attention, gifts→gifts, style→style, brands→brands, food→restaurants, fragrance→parfums, travel→travel, hobbies→hobbies, dreams→hobbies, surprises→avoid, conflicts→avoid.

**Enregistrement d'une réponse (`recordAnswer`, l.194-269) :** upsert `profile_completion` (status `answered`/`skipped`), écrit la réponse dans `my_profile.discovery_answers[questionKey]` (si non skip), avance la session ; à la fin `status='completed'`.

**Libellés de section affichés (`DIMENSION_LABELS`) :** attention « Langage d'attention », gifts « Cadeaux », style « Style », brands « Marques », food « Restaurants », fragrance « Parfums », travel « Voyages », hobbies « Loisirs », dreams « Rêves », surprises « Surprises », conflicts « Conflits », practical « Pratique ».

---

## Statuts par question — `status.ts`

Type `QuestionStatus` : `not_started` | `answered` | `skipped` | `outdated` | `needs_precision` | `archived`.
- **Statuts BLOQUANTS** (`BLOCKING_STATUSES`) : `answered`, `archived` → la question ne réapparaît sur AUCUN chemin (elle devient « Modifier ma réponse » côté UI).
- Proposables : `skipped`, `outdated`, `needs_precision`, `not_started`.
- **Rétro-alimentation** : une donnée saisie au questionnaire (présente en fiche) vaut réponse → `answered` sans repasser par Discovery (`applyDataSync` pur + `writeSyncedStatuses` idempotent, sorti du rendu).

---

## Jauge de connaissance — formule exacte

**Ratio de base (`computeCompletion`, `sheet-data.ts`, l.111-127) :** 5 grandes parties du questionnaire, chacune vaut 1/5 :
`attention_reception` présent · `temperament_axes` présent · `lifestyle_axes` présent · `singularity_answers` non vide · `practical_info` présent.
`ratio = (nombre de parties remplies) / 5`.

**État + anneau (`computeKnowledge`, `v2-metrics.ts`, l.91-104) :** source UNIQUE de l'anneau, de la phrase et du CTA.
```
KNOW_RING_CAP = 0.85
ratio = clamp(questionnaireRatio, 0, 1)
si (aucune question disponible ET ratio >= 1) → { state: 4, ring: 1 }   // anneau fermé
sinon :
  state = ratio < 0.4 ? 1 : ratio < 0.8 ? 2 : 3
  ring  = hasAvailableQuestions ? min(ratio, 0.85) : ratio
  ring  = max(0.04, ring)
```
Tant qu'il reste une micro-question disponible, l'anneau est **plafonné à ~85 %** et l'état ne peut pas dépasser 3. L'état 4 (« anticipe pour toi ») exige questionnaire complet ET zéro question restante. **Jamais de chiffre / % affiché** (anneau conique sans nombre).

**Phrases à 4 états (`KNOW_PHRASES`, `v2-data.ts`, l.62-67), VERBATIM :**
- État 1 : « Candice **commence** à te connaître »
- État 2 : « Candice te connaît **bien** »
- État 3 : « Candice te connaît **très bien** »
- État 4 : « Candice **anticipe** pour toi »

---

## Points d'entrée & incitations (VERBATIM)

### Header de la fiche (`Header.tsx`)
- CTA texte champagne sous la phrase (états 1-3 seulement) : **« Améliorer encore sa connaissance → »** → `/moi/discovery?mode=full`.

### Module « Pour mieux viser » (`Viser.tsx`)
- Phrase d'intro VERBATIM : **« Quelques précisions suffisent pour que Candice évite les attentions à côté. »**
- Chaque nudge → `/moi/discovery?mode=full&section={sectionKey}`. Bouton : **« Affiner → »** (disponible) ou **« Modifier ma réponse »** (déjà répondu). Sous-titre nudge = `benefit_label · N question(s) · duration_label` (construit par `buildNudges`, `engine.ts`).

### Écran Discovery (`DiscoveryFlow.tsx`)
- Écran d'intro (mode `full`, sauf deep-link) — titre VERBATIM : **« Tu veux que Candice vise encore plus juste ? »**
  - Corps VERBATIM : « Réponds à quelques questions très courtes pour que tes proches comprennent mieux ce qui te touche vraiment : le bon cadeau, le bon restaurant, le bon week-end, le bon mot, le bon geste — sans avoir à deviner. »
  - Boutons : **« Affiner mon profil »** / **« Une seule question rapide »**
- Question : bouton **« Passer »** + **« Valider »**. Texte libre : indice « ⌘↵ pour valider », placeholder « Écris librement… ».
- Fin de lot — titre : « C'est tout pour maintenant. » (full) / « Merci. » (quick) ; sous-texte : « Candice met à jour ce qu'elle sait de toi. » / « Candice a bien noté ça. » ; CTA « Voir mon profil → ».
- Deux questions ont un rendu spécial (follow-ups obligatoires) : `practical.dietary` (précision allergie obligatoire) et `practical.mobility` (type + intensité obligatoires).

---

## BANQUE VERBATIM — les 70 questions par dimension

Format : `question_key` · type · sort_order · priority · locked_text · trigger_condition · updates_dimensions. Options : « Label » → `value`.

### Dimension `attention` (7) — libellé « Langage d'attention »

**`attention.reception`** · chips_multi · sort 10 · prio 50 · locked=false · trigger: `null` · updates: `null` · benefit « Des attentions qui te ressemblent vraiment » · durée « 1 min »
« Comment tu te sens vraiment aimé·e ? »
- « Par les mots » → `MOT`
- « Par les actes » → `SER`
- « Par des cadeaux » → `CAD_C`
- « Par le temps partagé » → `EXP`
- « Par les petites attentions » → `GES`
- « Par les surprises » → `SUR`

**`attention.detail_quality`** · chips_multi · sort 150 · locked=false · trigger: `petites_attentions selected or detected` · updates: detail_memory_importance, anticipation_importance, regularity_preference, personalization_requirement, daily_life_attention, charge_mental_relief
« Quand tu dis aimer les petites attentions, qu'est-ce qui te touche le plus concrètement ? »
- « Que l'autre se souvienne d'un détail que j'ai dit » → `remembers_details`
- « Qu'il/elle anticipe un besoin avant que je demande » → `anticipates_needs`
- « Qu'il/elle fasse quelque chose de simple mais régulier » → `regular_simple`
- « Qu'il/elle choisisse quelque chose uniquement pour moi » → `chosen_only_for_me`
- « Qu'il/elle pense à moi dans un moment ordinaire » → `thinks_in_ordinary`
- « Qu'il/elle m'enlève une petite charge du quotidien » → `relieves_daily_charge`

**`attention.words_quality`** · chips_multi · sort 160 · locked=false · trigger: `mots selected or detected` · updates: message_style, written_words_preference, recognition_need, effort_recognition_need, emotional_support_words
« Les mots qui te touchent vraiment sont plutôt… »
- « Très précis sur ce que l'autre aime chez moi » → `precise_about_me`
- « Courts mais sincères » → `short_sincere`
- « Longs et détaillés » → `long_detailed`
- « Écrits pour que je puisse les relire » → `written_to_reread`
- « Dits spontanément » → `spontaneous`
- « Liés à un effort qu'on a remarqué » → `effort_recognition`
- « Liés à une période difficile » → `support_in_hard_times`

**`attention.words_avoid`** · chips_multi · sort 170 · locked=false · trigger: `mots selected` · updates: avoid_generic_messages, words_need_actions, avoid_overdramatic_tone, avoid_delayed_words
« Les mots peuvent tomber à plat quand… »
- « Ils sont trop génériques » → `too_generic`
- « Ils arrivent trop tard » → `too_late`
- « Ils ne sont pas suivis d'actes » → `need_actions`
- « Ils sont trop grandiloquents » → `too_dramatic`
- « Ils évitent le vrai sujet » → `avoid_real_topic`
- « Ils ressemblent à une formule toute faite » → `formulaic`

**`attention.service_quality`** · chips_multi · sort 180 · locked=false · trigger: `actes / aide concrète / service selected` · updates: proactive_help, end_to_end_help, time_relief, day_smoothing, discreet_service
« Quand quelqu'un t'aide, ce qui te touche vraiment c'est qu'il/elle… »
- « Voie ce qu'il y a à faire sans que je demande » → `proactive`
- « Prenne en charge quelque chose jusqu'au bout » → `end_to_end`
- « Me libère du temps » → `time_relief`
- « Me facilite une journée compliquée » → `day_smoothing`
- « Fasse quelque chose d'utile mais avec délicatesse » → `discreet_service`
- « N'attende pas de reconnaissance immédiate » → `no_recognition_needed`

**`attention.gift_precision`** · chips_multi · sort 190 · locked=false · trigger: `cadeau choisi / cadeau symbolique selected` · updates: taste_accuracy_requirement, remembered_signal_importance, search_effort_importance, symbolic_object_preference, non_generic_requirement, quality_requirement
« Un cadeau pensé pour toi doit surtout montrer que… »
- « L'autre connaît mes goûts » → `knows_taste`
- « L'autre a retenu quelque chose que j'ai dit » → `remembered_signal`
- « L'autre a cherché quelque chose de précis » → `search_effort`
- « L'objet a une histoire ou un sens » → `symbolic_object`
- « Le cadeau n'aurait pas pu être offert à n'importe qui » → `non_generic`
- « La qualité est au rendez-vous » → `quality`

**`attention.experience_quality`** · chips_multi · sort 200 · locked=false · trigger: `experience selected` · updates: experience_escape, beautiful_place_importance, logistics_smoothness, emotional_intensity_experience, discovery_preference, quality_time_preference, no_logistics_need
« Une expérience réussie pour toi, c'est surtout… »
- « Un moment qui sort du quotidien » → `escape`
- « Un lieu vraiment beau » → `beautiful_place`
- « Une organisation fluide » → `logistics_smooth`
- « Une émotion forte » → `strong_emotion`
- « Une découverte » → `discovery`
- « Un moment de qualité à deux » → `quality_time`
- « Une parenthèse où je n'ai rien à gérer » → `no_logistics`

### Dimension `brands` (3) — libellé « Marques »

**`brands.favorites`** · text · sort 60 · locked=false · trigger: `null` · updates: `null` · benefit « Tes maisons préférées en tête des idées » · durée « 20 sec »
« Des marques, enseignes ou créateurs que tu adores ? »

**`brands.reference_free`** · text · sort 410 · locked=false · trigger: `marques aimées non détaillées` · updates: brands, gamme, style, aesthetic
« Cite 3 marques ou créateurs que tu aimes vraiment — même très différents. »

**`brands.beauty_reference`** · text · sort 450 · locked=false · trigger: `marques beauté non renseignées` · updates: brand, category, gamme
« Une marque beauté, parfum ou soin que tu aimes vraiment ? »

### Dimension `conflicts` (3) — libellé « Conflits »

**`conflicts.style`** · chips_single · sort 130 · locked=false · trigger: `null` · updates: `null` · benefit « Des attentions justes, même les jours sensibles » · durée « 20 sec »
« Face à une tension, comment tu réagis ? »
- « J'en parle directement » → `direct`
- « J'ai besoin de recul » → `space`
- « Je préfère éviter » → `avoids`
- « Je dédramatise » → `humor`

**`conflicts.repair_strategy`** · chips_multi · sort 510 · locked=false · trigger: `conflit / réparation non précisé` · updates: conflict_repair_strategy, apology_style, repair_attention_allowed
« Après une tension, ce qui aide vraiment à réparer pour toi, c'est… »
- « Des excuses précises » → `precise_apology`
- « Un message écrit » → `written_message`
- « Une discussion calme » → `calm_discussion`
- « Une preuve que l'autre a compris » → `proof_understood`
- « Un geste concret » → `concrete_gesture`
- « Un moment ensemble » → `time_together`
- « Un peu de temps » → `time_alone`
- « Pas de cadeau, surtout une vraie parole » → `words_not_gift`

**`conflicts.repair_avoid`** · chips_multi · sort 520 · locked=false · trigger: `conflit / réparation non précisé` · updates: conflict_avoidance_rules, post_conflict_forbidden_actions
« Après une dispute, ce qui serait maladroit… »
- « Faire comme si rien ne s'était passé » → `ignore_conflict`
- « Offrir un cadeau sans parler » → `gift_without_words`
- « Mettre de l'humour trop vite » → `humor_too_soon`
- « Insister alors que j'ai besoin d'espace » → `insist_when_need_space`
- « Dramatiser » → `dramatize`
- « Se justifier » → `justify`
- « Attendre trop longtemps » → `wait_too_long`

### Dimension `dreams` (4) — libellé « Rêves »

**`dreams.current`** · text · sort 110 · locked=false · trigger: `null` · updates: `null` · benefit « Ce dont tu rêves, gardé pour le bon moment » · durée « 20 sec »
« Tu as des envies ou des rêves en ce moment ? »

**`dreams.destination`** · text · sort 340 · locked=false · trigger: `destination rêve non renseignée` · updates: destination, hotel, experience_type, wishlist_high_priority
« Une destination, un hôtel ou une expérience dont tu rêves en ce moment ? »

**`dreams.wish_priority`** · text · sort 630 · locked=false · trigger: `envies / rêves du moment renseignés` · updates: dream_priority, wishlist_priority, high_emotional_impact_candidate
« Parmi tes envies du moment, laquelle te ferait le plus plaisir si quelqu'un t'aidait à la réaliser ? »

**`dreams.wishlist_first`** · text · sort 640 · locked=false · trigger: `wishlist vide` · updates: object, experience, venue, brand, timing, emotional_priority
« Une chose que tu aimerais recevoir, vivre ou faire dans les prochains mois ? »

### Dimension `food` (6) — libellé « Restaurants »

**`food.restaurants`** · chips_multi · sort 70 · locked=false · trigger: `null` · updates: `null` · benefit « Des tables choisies comme tu les aimes » · durée « 30 sec »
« Tu préfères quel type de table ? »
- « Bistrot convivial » → `bistro` · « Gastronomique » → `gastronomic` · « Bonne adresse décontractée » → `casual_good` · « Cuisine du monde » → `world` · « Végétarien / healthy » → `veggie` · « Tout si c'est bon » → `anything_good`

**`food.deal_breakers`** · chips_multi · sort 250 · locked=false · trigger: `gastronomie / restaurant / belles tables selected` · updates: restaurant_deal_breakers, restaurant_selection_rules, ambience_avoidance, min_quality_threshold
« Pour un restaurant surprise, qu'est-ce qui peut vraiment gâcher l'expérience ? »
- « Trop bruyant » → `too_loud` · « Tables trop serrées » → `too_crowded` · « Service froid » → `cold_service` · « Cuisine moyenne » → `average_food` · « Lieu sans charme » → `no_charm` · « Mauvaise lumière » → `bad_light` · « Trop prétentieux » → `too_pretentious` · « Trop simple / cheap » → `too_cheap` · « Trop loin » → `too_far` · « Menu trop limité » → `limited_menu` · « Mauvais rapport qualité-prix » → `bad_value`

**`food.success_driver`** · chips_single · sort 260 · locked=false · trigger: `restaurant selected` · updates: restaurant_success_driver, restaurant_search_priority
« Un restaurant réussi pour toi, c'est d'abord… »
- « La cuisine » → `cuisine` · « L'ambiance » → `ambiance` · « Le service » → `service` · « Le lieu » → `venue` · « La vue » → `view` · « Le confort » → `comfort` · « La rareté de l'adresse » → `rarity` · « Le fait que ce soit vivant » → `lively` · « Le fait que ce soit intime » → `intimate`

**`food.cuisine_preferences`** · chips_multi · sort 270 · locked=false · trigger: `cuisine du monde / gastronomie / restaurant selected` · updates: cuisine_preferences, restaurant_dynamic_search_filters
« Côté cuisine, ce qui te ferait vraiment plaisir en ce moment serait plutôt… »
- « Français » → `french` · « Italien » → `italian` · « Japonais » → `japanese` · « Libanais » → `lebanese` · « Méditerranéen » → `mediterranean` · « Thaï » → `thai` · « Indien » → `indian` · « Mexicain » → `mexican` · « Tapas » → `tapas` · « Fruits de mer » → `seafood` · « Pâtisserie / tea time » → `pastry` · « Cuisine végétale » → `plant_based` · « Je préfère être surpris·e si c'est très bon » → `surprise_me`

**`food.reference_address`** · text · sort 280 · locked=false · trigger: `restaurants aimés non renseignés` · updates: favorite_restaurants, restaurant_style_reference
« Donne une adresse que tu adores, même simple. Candice s'en servira comme référence de goût. »

**`food.reco_strategy`** · chips_single · sort 290 · locked=false · trigger: `restaurants score fort` · updates: restaurant_reco_strategy
« Pour une recommandation restaurant, Candice doit plutôt viser… »
- « Très bien noté, même simple » → `well_rated` · « Beau lieu avant tout » → `beautiful_venue` · « Cuisine excellente avant tout » → `excellent_cuisine` · « Ambiance vivante » → `lively` · « Adresse chic » → `chic` · « Adresse cachée » → `hidden` · « Valeur sûre » → `safe_bet` · « Surprise originale » → `original_surprise`

### Dimension `fragrance` (6) — libellé « Parfums »

**`fragrance.family`** · chips_multi · sort 80 · **statut ARCHIVED** · locked=false · trigger: `null` · updates: `null`
« Tu portes plutôt quel type de parfum ? »
- « Fleuri » → `floral` · « Frais / citrus » → `fresh` · « Boisé » → `woody` · « Oriental / Ambré » → `oriental` · « Poudré » → `powder` · « Gourmand » → `gourmand` · « Discret » → `light` · « Sans parfum » → `none`

**`fragrance.perfume_risk`** · chips_single · sort 420 · **locked=true** · trigger: `parfum / beauté detected` · updates: perfume_gift_risk, perfume_preference, home_fragrance_preference · benefit « Éviter les cadeaux beauté à côté »
« Recevoir un parfum, pour toi, c'est… »
- « Je préfère choisir moi-même » → `choose_myself` · « Possible si la personne connaît très bien mes goûts » → `if_knows_taste` · « Seulement une marque que j'aime déjà » → `known_brand_only` · « Plutôt une bougie ou un parfum d'intérieur » → `home_fragrance` · « Je n'aime pas recevoir de parfum » → `avoid`

**`fragrance.families`** · chips_multi · sort 425 · **locked=true** · trigger: `null` · updates: fragrance_families · benefit « Des cadeaux parfum qui te ressemblent »
« Les familles olfactives qui te plaisent le plus »
- « Poudré » → `powdery` · « Musqué propre » → `clean_musk` · « Floral blanc » → `white_floral` · « Floral frais » → `fresh_floral` · « Ambré doux » → `soft_amber` · « Vanillé léger » → `light_vanilla` · « Boisé » → `woody` · « Hespéridé » → `citrus` · « Thé-aromatique » → `tea_aromatic` · « Peau propre » → `clean_skin` · « Je ne sais pas » → `unknown`

**`fragrance.gender_orientation`** · chips_single · sort 425 · locked=false · trigger: `null` · updates: fragrance_gender_orientation
« Pour les parfums, tu te guides plutôt vers… »
- « Les parfums rayon femme » → `femme` · « Les parfums rayon homme » → `homme` · « Les parfums mixtes / unisexes » → `mixte` · « Peu importe le rayon si j'aime le parfum » → `indifferent` · « Je préfère ne pas préciser » → `unspecified`

**`fragrance.beauty_gift`** · chips_multi · sort 430 · **statut ARCHIVED** · locked=false · trigger: `beauté / soin detected` · updates: beauty_gift_strategy, skincare_risk, spa_preference, known_product_preference
« Un cadeau beauté réussi, c'est plutôt… »
- « Une marque experte » → `expert_brand` · « Une marque sensorielle » → `sensory_brand` · « Un soin en institut » → `institute_care` · « Un massage » → `massage` · « Un produit que j'utilise déjà » → `known_product` · « Un produit découverte » → `discovery_product` · « Un coffret premium » → `premium_set` · « Je préfère éviter » → `avoid`

**`fragrance.scent_deal_breakers`** · chips_multi · sort 440 · **locked=true** · trigger: `odeurs / parfums detected` · updates: scent_deal_breakers · benefit « Écarter ce qui gâche un parfum »
« À éviter absolument »
- « Trop sucré » → `too_sweet` · « Patchouli » → `patchouli` · « Très entêtant » → `too_heady` · « Trop fruité » → `too_fruity` · « Trop vanillé » → `too_vanilla` · « Trop masculin » → `too_masculine` · « Trop floral » → `too_floral` · « Parfum trop connu » → `too_common` · « Je ne sais pas » → `unknown`

### Dimension `gifts` (6) — libellé « Cadeaux »

**`gifts.what_works`** · chips_multi · sort 20 · locked=false · trigger: `null` · updates: `null` · benefit « Des idées cadeaux qui visent juste » · durée « 30 sec »
« Quel type de cadeau te touche vraiment ? »
- « Expériences » → `experiences` · « Personnalisé » → `personalized` · « Utile et beau » → `practical` · « Beauté / bien-être » → `beauty` · « Livres / culture » → `culture` · « Fait main » → `handmade` · « Surprise totale » → `surprise`

**`gifts.to_avoid`** · text · sort 30 · locked=false · trigger: `null` · updates: `null`
« Des cadeaux ou attentions à éviter absolument ? »

**`gifts.object_quality`** · chips_multi · sort 210 · locked=false · trigger: `cadeau matériel selected` · updates: object_quality_driver, brand_importance, style_precision_required, rarity_preference, personalization_preference, utility_preference, story_value
« Quand on t'offre un objet, qu'est-ce qui fait la différence entre "sympa" et "vraiment réussi" ? »
- « La qualité de la matière » → `material_quality` · « La marque ou le créateur » → `brand` · « Le fait que ce soit exactement mon style » → `my_style` · « Le fait que ce soit rare ou difficile à trouver » → `rare` · « Le fait que ce soit personnalisé » → `personalized` · « Le fait que ce soit utile au quotidien » → `useful` · « Le fait que ça ait une histoire » → `has_story`

**`gifts.risky_categories`** · chips_multi · sort 220 · locked=false · trigger: `objet / mode / beauté / bijou / déco detected` · updates: risky_categories, admin_validation_required_by_category, prefer_choose_together
« Quel type d'objet est le plus risqué à t'offrir sans te demander ? »
- « Vêtement » → `clothing` · « Bijou » → `jewelry` · « Parfum » → `perfume` · « Décoration » → `decoration` · « Livre » → `book` · « Beauté / skincare » → `beauty` · « Tech » → `tech` · « Accessoire » → `accessory` · « Tout objet trop personnel est risqué » → `all_personal` · « Rien, je suis assez facile » → `none`

**`gifts.quality_non_negotiable`** · chips_multi · sort 230 · locked=false · trigger: `qualité / standing / raffinement detected` · updates: quality_must_have_by_category, premium_threshold_by_category, avoid_low_quality_by_category
« Dans quelles catégories la qualité est non négociable pour toi ? »
- « Hôtel » → `hotel` · « Restaurant » → `restaurant` · « Bijou » → `jewelry` · « Vêtement » → `clothing` · « Sac / maroquinerie » → `bag` · « Parfum » → `perfume` · « Beauté / soin » → `beauty` · « Literie » → `bedding` · « Spa / massage » → `spa` · « Alimentaire » → `food` · « Je suis assez flexible » → `flexible`

**`gifts.impersonal_definition`** · chips_multi · sort 240 · locked=false · trigger: `cadeau impersonnel mentioned in avoidances` · updates: impersonal_gift_definition, requires_contextualization, requires_personal_note, avoid_generic_supplier
« Pour toi, un cadeau devient impersonnel quand… »
- « Il pourrait être offert à n'importe qui » → `could_be_for_anyone` · « Il ne tient pas compte de mon style » → `ignores_style` · « Il est acheté à la dernière minute » → `last_minute` · « Il vient d'une enseigne trop générique » → `generic_store` · « Il n'a aucun mot ou contexte » → `no_note` · « Il ne correspond pas à ce que je vis en ce moment » → `not_current`

### Dimension `hobbies` (11) — libellé « Loisirs »

**`hobbies.main`** · text · sort 100 · locked=false · trigger: `null` · updates: `null` · benefit « Des moments qui te nourrissent vraiment » · durée « 30 sec »
« Qu'est-ce qui te ressource vraiment ? »

**`hobbies.book_conditions`** · chips_multi · sort 350 · locked=false · trigger: `lecture / livre / BD detected` · updates: book_gift_conditions, author_importance, beautiful_edition_preference, personal_note_required, book_risk_score, graphic_novel_relevance
« Un livre en cadeau peut vraiment te plaire si… »
- « C'est un auteur que j'aime déjà » → `known_author` · « C'est une très belle édition » → `beautiful_edition` · « C'est recommandé avec un mot personnel » → `with_personal_note` · « C'est un livre qui correspond à une période de ma vie » → `matches_life_period` · « C'est une BD / un roman graphique choisi avec soin » → `graphic_novel` · « C'est un livre rare ou signé » → `rare_signed` · « C'est plutôt risqué, je préfère choisir moi-même » → `prefer_choose`

**`hobbies.book_avoidance`** · chips_multi · sort 360 · locked=false · trigger: `lecture detected` · updates: book_avoidance, sensitive_topics, avoid_trendy_books, avoid_moralizing_gifts
« Un livre risque de tomber à plat si… »
- « Il est trop "développement personnel" évident » → `too_self_help` · « Il est trop intellectuel » → `too_intellectual` · « Il est trop léger » → `too_light` · « Il ne correspond pas à mon style » → `wrong_style` · « Il est choisi parce qu'il est à la mode » → `too_trendy` · « Il ressemble à une leçon déguisée » → `moralizing` · « Il parle d'un sujet sensible » → `sensitive_topic`

**`hobbies.book_reference`** · text · sort 370 · locked=false · trigger: `auteur / livre préféré non renseigné` · updates: author, title, genre, format, universe
« Cite un auteur, une autrice, une BD ou un livre que tu aimes vraiment. »

**`hobbies.home_gift_safe`** · chips_single · sort 560 · locked=false · trigger: `déco / maison detected` · updates: home_gift_safe_categories, home_gift_risk
« Pour la maison, ce qui est le moins risqué à t'offrir… »
- « Bougie / parfum d'intérieur » → `candle` · « Art de la table » → `tableware` · « Linge de maison » → `linen` · « Beau livre » → `coffee_table_book` · « Petit objet design » → `design_object` · « Plante » → `plant` · « Céramique » → `ceramic` · « Rien, je préfère choisir moi-même » → `prefer_choose`

**`hobbies.home_deal_breakers`** · chips_multi · sort 570 · locked=false · trigger: `déco / maison detected` · updates: home_decor_deal_breakers
« En déco, ce qui peut vite tomber à côté pour toi… »
- « Objet trop kitsch » → `too_kitsch` · « Mauvaise couleur » → `bad_color` · « Mauvaise matière » → `bad_material` · « Objet trop imposant » → `too_imposing` · « Style trop froid » → `too_cold` · « Style trop rustique » → `too_rustic` · « Objet sans utilité » → `useless` · « Cadeau qui encombre » → `clutters`

**`hobbies.wellness_gift`** · chips_multi · sort 580 · locked=false · trigger: `sport / bien-être detected` · updates: wellness_gift_strategy, spa_preference, massage_preference, retreat_interest
« Une attention bien-être réussie pour toi, c'est plutôt… »
- « Massage » → `massage` · « Spa » → `spa` · « Cours privé » → `private_class` · « Retraite » → `retreat` · « Moment de calme » → `quiet_time` · « Accessoire de qualité » → `quality_accessory` · « Abonnement » → `subscription` · « Expérience douce » → `gentle_experience` · « Je préfère éviter les cadeaux bien-être » → `avoid`

**`hobbies.sport_risk`** · chips_multi · sort 590 · locked=false · trigger: `sport detected` · updates: sport_gift_risks, avoid_body_related_gifts
« Un cadeau sport est risqué si… »
- « Il n'est pas adapté à ma pratique » → `wrong_practice` · « Il est trop technique » → `too_technical` · « Il est trop bas de gamme » → `low_quality` · « Il suppose que je veux performer » → `performance_assumption` · « Il touche au corps / au poids » → `body_related` · « Il est choisi sans connaître mes habitudes » → `unknown_habits` · « Je préfère choisir moi-même » → `prefer_choose`

**`hobbies.culture_success`** · chips_multi · sort 600 · locked=false · trigger: `culture / art detected` · updates: culture_success_driver, cultural_event_recommendation_rules
« Une sortie culturelle réussie pour toi, c'est surtout… »
- « Une très belle œuvre » → `great_artwork` · « Un lieu magnifique » → `beautiful_venue` · « Une émotion forte » → `strong_emotion` · « Une découverte » → `discovery` · « Un moment élégant » → `elegant` · « Une sortie facile à organiser » → `easy_logistics` · « Une discussion après » → `discussion_after` · « Un événement rare » → `rare_event`

**`hobbies.concert_criteria`** · chips_multi · sort 610 · locked=false · trigger: `musique / concert detected` · updates: concert_selection_rules, seat_quality_importance
« Pour un concert ou spectacle, ce qui compte le plus… »
- « L'artiste » → `artist` · « La qualité des places » → `seat_quality` · « L'ambiance » → `ambiance` · « Le lieu » → `venue` · « Le confort » → `comfort` · « Y aller avec la bonne personne » → `right_company` · « Ne pas être trop loin / mal placé » → `good_position` · « Le côté événement rare » → `rare_event`

**`hobbies.artist_reference`** · text · sort 620 · locked=false · trigger: `artiste non renseigné` · updates: artist, venue, event, style
« Un artiste, spectacle ou lieu culturel que tu aimerais voir ? »

### Dimension `practical` (6) — libellé « Pratique »

**`practical.dietary`** · chips_multi · sort 140 · locked=false · trigger: `null` · updates: `null` · benefit « Zéro faux pas sur l'essentiel » *(rendu spécial : précision allergie obligatoire)*
« Côté repas, y a-t-il des règles que tes proches doivent absolument connaître ? »
- « Végétarien·ne » → `vegetarian` · « Vegan » → `vegan` · « Halal » → `halal` · « Casher » → `casher` · « Sans alcool » → `no_alcohol` · « Allergie alimentaire » → `food_allergy` · « Aucune » → `none`

**`practical.mobility`** · chips_single · sort 141 · locked=false · trigger: `null` · updates: `null` *(rendu spécial : type + intensité obligatoires)*
« Y a-t-il quelque chose que ton corps te demande de respecter ? (marche, escaliers, station debout…) »
- « Oui » → `yes` · « Non » → `no`

**`practical.logistics_relief`** · chips_multi · sort 490 · locked=false · trigger: `charge mentale / fatigue / besoin d'organisation detected` · updates: logistics_relief_targets, no_logistics_need, support_attention_candidates
« Quand quelqu'un veut te faire du bien, qu'est-ce qui t'enlève un vrai poids des épaules ? »
- « Qu'on réserve à ma place » → `reservation` · « Qu'on gère le trajet » → `transport` · « Qu'on s'occupe des enfants » → `children` · « Qu'on pense au repas » → `meal` · « Qu'on fasse les courses » → `groceries` · « Qu'on gère le ménage » → `cleaning` · « Qu'on cale le bon moment » → `timing` · « Qu'on prenne la décision pour moi » → `decision` · « Qu'on règle les détails » → `practical_details` · « Qu'on assure le suivi après » → `follow_up`

**`practical.control_delegation`** · chips_single · sort 500 · locked=false · trigger: `aime qu'on organise / surprise / charge mentale detected` · updates: control_vs_delegation, decision_relief, validation_need
« Quand quelqu'un organise pour toi, tu préfères… »
- « Qu'il décide vraiment » → `decide_all` · « Qu'il me propose 2 options » → `two_options` · « Qu'il me laisse valider les détails » → `validate_details` · « Qu'il gère tout sauf la date » → `all_except_date` · « Qu'il me surprenne mais me rassure » → `surprise_but_reassure` · « Qu'il ne décide pas à ma place » → `no_decide_for_me`

**`practical.important_dates`** · text · sort 650 · locked=false · trigger: `dates importantes incomplètes` · updates: important_dates, event_trigger_engine
« Y a-t-il une date que tes proches ne devraient pas oublier ? »

**`practical.date_attention`** · chips_multi · sort 660 · locked=false · trigger: `date ajoutée sans préférence d'attention` · updates: event_attention_preferences
« Pour cette date, tu aimerais plutôt… »
- « Un message » → `message` · « Un moment ensemble » → `time_together` · « Un cadeau » → `gift` · « Une surprise » → `surprise` · « Une expérience » → `experience` · « Rien de grand, juste qu'on y pense » → `just_remember` · « Quelque chose organisé à l'avance » → `planned_ahead`

### Dimension `style` (9) — libellé « Style »

**`style.clothing`** · chips_multi · sort 40 · locked=false · trigger: `null` · updates: `null` · benefit « Des choix à ton goût, jamais à côté » · durée « 30 sec »
« Tu te décrirais avec quel style ? »
- « Classique » → `classic` · « Bohème » → `boho` · « Minimaliste » → `minimal` · « Chic parisien » → `chic` · « Décontracté » → `casual` · « Sportswear » → `sport` · « Mode / tendance » → `trendy`

**`style.colors`** · text · sort 50 · locked=false · trigger: `null` · updates: `null`
« Tes couleurs et matières préférées pour te faire plaisir ? »

**`style.fashion_gift_risk`** · chips_single · sort 380 · locked=false · trigger: `mode / vêtements / marques detected` · updates: fashion_gift_risk, prefer_choose_together, safe_fashion_categories
« Si quelqu'un veut t'offrir quelque chose lié à la mode, le moins risqué serait… »
- « M'emmener choisir » → `choose_together` · « Carte cadeau d'une marque que j'aime » → `gift_card` · « Accessoire » → `accessory` · « Bijou » → `jewelry` · « Foulard / belle matière » → `scarf` · « Sac / petite maroquinerie » → `bag` · « Vêtement uniquement si taille et style sûrs » → `clothing_if_sure` · « Ne pas m'offrir de mode » → `avoid_fashion`

**`style.jewelry_style`** · chips_multi · sort 390 · locked=false · trigger: `bijoux detected` · updates: jewelry_style, jewelry_material, symbolic_jewelry_preference, jewelry_brand_importance
« Un bijou réussi pour toi, c'est plutôt… »
- « Fin et discret » → `delicate` · « Visible / affirmé » → `bold` · « Doré » → `gold` · « Argenté » → `silver` · « Avec pierre » → `with_stone` · « Personnalisé / gravé » → `personalized` · « Symbolique » → `symbolic` · « Très mode » → `trendy` · « Intemporel » → `timeless` · « D'une marque précise » → `specific_brand`

**`style.fashion_deal_breakers`** · chips_multi · sort 400 · locked=false · trigger: `mode / style detected` · updates: fashion_deal_breakers, avoid_bad_fit, avoid_bad_material, avoid_wrong_brand
« Côté style, ce qu'il faut éviter absolument… »
- « Trop classique » → `too_classic` · « Trop cheap » → `too_cheap` · « Trop voyant » → `too_flashy` · « Trop discret » → `too_discreet` · « Mauvaise matière » → `bad_material` · « Mauvaise coupe » → `bad_fit` · « Mauvaise taille » → `wrong_size` · « Trop "cadeau par défaut" » → `default_gift` · « Marque que je n'aime pas » → `wrong_brand`

**`style.material_preferences`** · chips_multi · sort 530 · locked=false · trigger: `mode / déco / beauté / matières detected` · updates: material_preferences, premium_material_signals
« Les matières qui te donnent vraiment une impression de qualité… »
- « Cachemire » → `cashmere` · « Soie » → `silk` · « Cuir » → `leather` · « Daim » → `suede` · « Lin » → `linen` · « Coton épais » → `thick_cotton` · « Laine mérinos » → `merino` · « Céramique » → `ceramic` · « Bois » → `wood` · « Verre soufflé » → `blown_glass` · « Métal doré » → `gold_metal` · « Pierre naturelle » → `natural_stone`

**`style.material_avoidance`** · chips_multi · sort 540 · locked=false · trigger: `mode / déco / matières detected` · updates: material_avoidance
« Les matières qui peuvent te déplaire… »
- « Synthétique » → `synthetic` · « Laine qui gratte » → `scratchy_wool` · « Polyester » → `polyester` · « Matière trop rigide » → `too_rigid` · « Matière trop fragile » → `too_fragile` · « Faux cuir » → `faux_leather` · « Fourrure » → `fur` · « Plastique » → `plastic` · « Je ne sais pas » → `unknown`

**`style.cross_gender`** · chips_multi · sort 545 · locked=false · trigger: `null` · updates: style_cross_gender, style_gender_orientation, fit_preference
« Pour les vêtements et accessoires, tu te repères plutôt dans… »
- « Le rayon femme » → `femme` · « Le rayon homme » → `homme` · « Les deux — je mélange » → `mixte` · « Les pièces unisexes avant tout » → `unisexe` · « Ça dépend de la pièce » → `depends` · « Je préfère ne pas préciser » → `unspecified`

**`style.color_safe`** · chips_multi · sort 550 · locked=false · trigger: `mode / déco / objet detected` · updates: color_safe_choices, color_avoidance_if_free_text
« Si on t'offre un objet, un vêtement ou un accessoire, les couleurs les plus sûres sont… »
- « Noir » → `black` · « Blanc » → `white` · « Beige » → `beige` · « Bleu ciel » → `light_blue` · « Marine » → `navy` · « Vert » → `green` · « Rouge » → `red` · « Rose pâle » → `pale_pink` · « Doré » → `gold` · « Argenté » → `silver` · « Tons neutres » → `neutral_tones` · « Couleurs fortes » → `bold_colors` · « Je préfère choisir » → `prefer_choose`

### Dimension `surprises` (4) — libellé « Surprises »

**`surprises.preference`** · chips_single · sort 120 · locked=false · trigger: `null` · updates: `null` · benefit « Des surprises bien dosées, jamais subies » · durée « 20 sec »
« Tu es plutôt… »
- « J'adore les surprises » → `loves` · « Ça dépend du contexte » → `depends` · « Je préfère être prévenu·e » → `notice` · « Les surprises me stressent » → `dislikes`

**`surprises.conditions`** · chips_multi · sort 460 · locked=false · trigger: `surprise ouverte / partielle detected` · updates: surprise_conditions, surprise_logistics_requirements, surprise_social_boundary
« Tu peux aimer une surprise si… »
- « Je connais au moins l'horaire » → `know_schedule` · « Je sais comment m'habiller » → `know_dress_code` · « Je sais combien de temps ça dure » → `know_duration` · « Je peux refuser sans gêne » → `can_decline` · « Ce n'est pas devant trop de monde » → `not_too_public` · « C'est organisé par quelqu'un de très proche » → `very_close_person` · « C'est très bien préparé » → `well_prepared`

**`surprises.briefing_needed`** · chips_multi · sort 470 · locked=false · trigger: `surprise detected` · updates: surprise_briefing_needed
« Avant une surprise, tu as besoin de savoir au minimum… »
- « L'heure » → `time` · « La tenue » → `dress_code` · « La durée » → `duration` · « Le lieu approximatif » → `approx_location` · « Si je dois prévoir une garde d'enfant » → `childcare` · « Si c'est intime ou social » → `intimate_or_social` · « Rien, j'aime la surprise totale » → `total_surprise`

**`surprises.deal_breakers`** · chips_multi · sort 480 · locked=false · trigger: `surprise négative ou prudente detected` · updates: surprise_deal_breakers
« La surprise à éviter absolument pour toi, ce serait… »
- « Une surprise en public » → `public` · « Une surprise avec trop de monde » → `too_many_people` · « Une surprise qui change mon planning » → `changes_plans` · « Une surprise où je ne sais pas comment m'habiller » → `no_dress_code` · « Une surprise trop chère » → `too_expensive` · « Une surprise trop intime » → `too_intimate` · « Une surprise qui ne me ressemble pas » → `not_me`

### Dimension `travel` (5) — libellé « Voyages »

**`travel.style`** · chips_multi · sort 90 · locked=false · trigger: `null` · updates: `null` · benefit « Des escapades taillées pour toi » · durée « 30 sec »
« Quand tu voyages, tu cherches… »
- « L'aventure » → `adventure` · « La culture » → `culture` · « Le repos total » → `relax` · « La nature » → `nature` · « Les villes animées » → `city` · « La gastronomie locale » → `gastro` · « Le luxe discret » → `luxury`

**`travel.hotel_criteria`** · chips_multi · sort 300 · locked=false · trigger: `voyage / week-end / hôtel / luxe detected` · updates: hotel_success_drivers, hotel_must_have, hotel_style_preference, premium_threshold_hotel
« Quand tu parles d'un "bel endroit", qu'est-ce qui compte vraiment ? »
- « Literie parfaite » → `perfect_bedding` · « Décoration / architecture » → `decor` · « Service impeccable » → `service` · « Spa / piscine » → `spa` · « Vue » → `view` · « Calme » → `quiet` · « Chambre spacieuse » → `spacious` · « Très bon restaurant » → `great_restaurant` · « Emplacement idéal » → `location` · « Atmosphère intime » → `intimate` · « Palace / grand luxe » → `palace` · « Boutique-hôtel de charme » → `boutique`

**`travel.deal_breakers`** · chips_multi · sort 310 · locked=false · trigger: `voyage / week-end detected` · updates: travel_deal_breakers, avoid_rustic, avoid_average_hotel, no_logistics_need, max_program_density
« Ce qui peut vraiment gâcher un week-end pour toi… »
- « Mauvaise literie » → `bad_bedding` · « Hôtel moyen » → `average_hotel` · « Trop de route » → `too_much_driving` · « Trop de logistique » → `too_much_logistics` · « Lieu sans charme » → `no_charm` · « Programme trop chargé » → `overloaded_schedule` · « Mauvaise nourriture » → `bad_food` · « Trop rustique » → `too_rustic` · « Pas assez confortable » → `not_comfortable` · « Trop isolé » → `too_isolated` · « Trop touristique » → `too_touristy` · « Pas assez premium » → `not_premium`

**`travel.hotel_standard`** · chips_single · sort 320 · locked=false · trigger: `hôtel / confort / luxe detected` · updates: hotel_minimum_standard, budget_expectation, premium_threshold_hotel
« Pour un week-end surprise, ton niveau de confort minimum serait plutôt… »
- « Peu importe si l'expérience est forte » → `experience_first` · « Hôtel confortable et propre » → `comfortable` · « Très bon 4 étoiles » → `four_stars` · « 5 étoiles si possible » → `five_stars` · « Boutique-hôtel très soigné » → `boutique` · « Palace / très luxe pour les grandes occasions » → `palace`

**`travel.distance_tolerance`** · chips_single · sort 330 · locked=false · trigger: `week-end / voyage surprise detected` · updates: travel_distance_tolerance, logistics_constraints
« Pour une surprise week-end, tu es prêt·e à faire combien de trajet ? »
- « Moins d'1h » → `under_1h` · « 1 à 2h » → `1_2h` · « 2 à 3h » → `2_3h` · « 3 à 5h » → `3_5h` · « Train OK » → `train_ok` · « Avion OK » → `plane_ok` · « Ça dépend si le lieu vaut vraiment le coup » → `depends`

---

*Note : `free_text_enabled = false` sur les 70 lignes ; les questions `type = text` recueillent quand même du texte libre (le champ `free_text_enabled` concerne un complément texte optionnel sur une question à chips, ici jamais activé). `priority = 50` sur les 70 lignes (le tri se joue donc surtout sur `computeGapScore` puis `sort_order`).*
