# B.2.1 — Phase 2 : traçabilité exhaustive des entrées

Profil test **Estelle** (V4 maquette). Pour chaque champ d'entrée : la valeur brute, le trajet dans le moteur d'analyse (Phase 2), et la sortie exacte (extraite du APRÈS de `docs/phase2-analysis-example.md`).

**Légende de trajet** :
- `computeProfileSynthesis()` → facts déterministes (`src/lib/profile/synthesis.ts`)
- `buildAnalysisPrompt()` → prompt user pour Sonnet (`src/lib/profile/generateProfileAnalysis.ts`)
- `buildSystemPrompt()` → structure JSON demandée à Sonnet
- `extractEntities()` → Haiku extraction (brands/places/hobbies/events)
- `Sonnet output` → clé JSON de la réponse de Claude Sonnet
- `style_radar` → calcul déterministe côté synthesis (non passé par Sonnet)

---

## Table 1 — Genre et identité

| Champ d'entrée | Réponse brute (test) | Où ça part dans l'analyse | Ce que ça devient (sortie exacte) |
|---|---|---|---|
| `grammatical_gender` | `feminine` | `resolveGender()` → `gender` du prompt · `buildSystemPrompt()` → règle d'accord | `payload.gender = "feminine"` · accords féminins dans `summary`, `sections.*`, `insights`, `modes`, `must_haves`, `deal_breakers` (« Elle semble… », « touchée », etc.) |
| `practical_info.prenom` | `"Estelle"` | Pas envoyé au prompt — usage UI uniquement | `.gh .name` header = « Estelle » |
| `practical_info.sexe` | `"femme"` | `resolveGender()` legacy fallback (utilisé seulement si `grammatical_gender` absent) | ici sans effet (grammatical_gender prioritaire) |
| `practical_info.age` | non renseigné | ✅ **Bloc `── CONTEXTE (calibrage) ──`** — informe ton/univers/occasions, jamais cité tel quel (règle system prompt) | rien ici (champ vide) — si renseigné : calibre le registre des textes sans y apparaître |
| `practical_info.profession` | non renseigné | ✅ **Bloc CONTEXTE (calibrage)** — idem | rien ici — si renseigné : calibre l'univers des suggestions (dirigeant ≠ artisan) sans citation |
| `practical_info.role_familial` | non renseigné | ✅ **Bloc CONTEXTE (calibrage)** — idem (père/beau-père change quelles fêtes comptent) | rien ici — si renseigné : calibre les occasions pertinentes sans citation |

---

## Table 2 — Attention (7 dimensions MOT/SER/CAD_C/CAD_S/EXP/GES/SUR)

| Champ d'entrée | Réponse brute (test) | Où ça part dans l'analyse | Ce que ça devient (sortie exacte) |
|---|---|---|---|
| `attention_reception.dominant` | `["MOT"]` | `computeProfileSynthesis()` → `topReceptionDims` · `computeStyleRadar()` (pondération `wMOT=3`) · `buildAnalysisPrompt()` bloc `── ATTENTION ──` (`Réception dominante : MOT, CAD_C, GES`) · Sonnet → `sections.attention` / `attention_dna` | `summary_chips[0]` = « mots choisis » (implicite via MOT) · `sections.attention.chips = ["mots choisis", "cadeaux ciblés", "gestes discrets"]` · `attention_dna[0] = {dimension:"MOT", intensity:85, note:"les mots choisis restent longtemps"}` · donut segment `#173E31` en tête · style_radar `emotion=62` (contribution `wMOT×8`) |
| `attention_reception.secondaire` | `["CAD_C"]` | idem — `wCADC=2` dans radar · `DIM_TOUCH[CAD_C]` dans `touchInsights` | `sections.attention_dna.chips = ["MOT+CAD_C", "contraste réception/expression"]` · `attention_dna[1] = {dimension:"CAD_C", intensity:70, note:"cadeaux ciblés — jamais génériques"}` · donut segment `#3E7361` 2e position · style_radar `precision=78` (contribution `wCADC×6`) `esthetique=66` (contribution `wCADC×5`) |
| `attention_reception.tertiaire` | `["GES"]` | idem — `wGES=1` dans radar · `DIM_TOUCH[GES]` fallback | `attention_dna[2] = {dimension:"GES", intensity:55, note:"les micro-attentions comptent"}` · donut segment `#8DA697` 3e position · style_radar `utilite=42` (contribution `wSER+wGES×8`) · `sections.attention_dna.text` = « Reçoit : mots justes, cadeaux ciblés, gestes discrets. Donne : mots, aide concrète. » |
| `attention_expression.dominant` | `["MOT"]` | `topExpressionDims` · bloc prompt `Expression naturelle : MOT, SER` · Sonnet → `sections.feels_loved` (peut rester vide si redondant avec `attention`) | `sections.feels_loved.text = ""` (fusionné dans `attention` — règle système explicite) · contraste réception≠expression signalé dans `attention_dna` |
| `attention_expression.secondaire` | `["SER"]` | idem — `hasReceptionExpressionContrast=true` (SER n'est ni en dominant ni en secondaire de réception) | prompt : `Contraste réception/expression : oui` · déclenche la chip « contraste réception/expression » dans `sections.attention_dna.chips` |
| `attention_breath_text` (généré Claude en fin d'AttentionStep) | (non fourni dans le test — généré à l'exécution) | pas envoyé au prompt d'analyse globale (déjà de l'analyse générée en amont) | UI seulement — utilisé en fallback du bloc résumé sur `/moi/resultats` |

---

## Table 3 — Tempérament — 9 axes

Valeurs test (score -100 → +100, intensité 0-1) :

| Champ d'entrée | Réponse brute (test) | Où ça part dans l'analyse | Ce que ça devient (sortie exacte) |
|---|---|---|---|
| `temperament_axes.energieSociale` | score `+45`, intensity `0.9` | `computeProfileSynthesis()` — `getAxis()` utilisé dans `relationalFacts` (+30 → « apprécie la proximité »), `communicationFacts`, `computeStyleRadar()` (contribution `discretion` négative) | axe barre « Introvertie / **Sociable** » dotmark à ~72% · `relationalFacts[]` inclut « aime les interactions et se nourrit de la compagnie des autres » · style_radar `discretion=64` (retrait `-getAxis×0.1`) |
| `temperament_axes.espaceProsimite` | score `0` (non spécifié) | `relationalFacts` (« équilibre entre proximité et autonomie ») | axe barre « Besoin d'espace / À l'aise en proximité » dotmark à ~50% (équilibré) · `relationalFacts` : « équilibre entre proximité et autonomie » |
| `temperament_axes.spontaneiteControle` | score `+50` (planifie) | `spontaneiteLabel()` = "plutôt élevée" (sur pôle contrôle) · `controleLabel()` = "plutôt élevé" | axe barre « **Planifie** / Spontanée » dotmark à ~25% · levels internes envoyés à Sonnet : `Spontanéité : plutôt discrète`, `Contrôle : plutôt élevé` |
| `temperament_axes.communicationStyle` | score `+40` (nuancée) | `communicationFacts` (« communication plutôt nuancée, prend le temps de formuler ») | axe barre « Directe / **Nuancée** » dotmark à ~70% · `communicationFacts[]` inclut « communication plutôt nuancée » |
| `temperament_axes.expressiviteReserve` | score `+30` (réservée) | `communicationFacts` · `computeStyleRadar()` : `discretion` positif, `emotion` négatif | axe barre « Réservée / Expressive » dotmark à ~35% côté réservée · `communicationFacts` inclut « retenue dans l'expression émotionnelle, préfère montrer par les actes » · style_radar `discretion=64` (contribution `+0.45×axisPos(+30)=+29`) et `emotion=62` (contribution `axisPos(-30)×0.35=+12`) |
| `temperament_axes.stabiliteNouveaute` | score `0` | `relationalFacts` (aucune règle < -30 ni > +30 → pas de trait ajouté) | axe barre « Attachée aux habitudes / Ouverte au nouveau » dotmark à ~50% |
| `temperament_axes.sensibiliteDetails` | score `+60` (attentive détails élevé) | `touchInsights` (>30 → « les petits détails — un rien manqué peut peser, un rien juste peut tout changer ») · `computeStyleRadar()` : `precision` contribution `axisPos(+60)×0.55=+44` · `detailsLabel()` = "plutôt élevée" | axe barre « **Attentive aux détails** / Vision d'ensemble » dotmark à ~20% côté détails · `touchInsights` inclut ligne détails · `sections.what_touches.text` = « Sentir qu'on s'est souvenu de toi — un détail dit, du soin dans l'exécution. » · style_radar `precision=78` |
| `temperament_axes.exigenceStanding` | score `+30` (raffinement) | `touchInsights` (>30 → « la qualité d'exécution — les attentions soignées touchent plus que les grandes ») · `computeStyleRadar()` : `precision` contribution `+0.15×+30=+4.5` | axe barre « **Raffinement** / Simplicité » dotmark à ~35% côté raffinement · `touchInsights` inclut « la qualité d'exécution » |
| `temperament_axes.rapportTemps` | score `+50` (ponctuelle) | `communicationFacts` (>30 → « préfère anticiper et avoir de la visibilité à l'avance ») | axe barre « **Ponctuelle** / Flexible » dotmark à ~25% · `communicationFacts` inclut « préfère anticiper » |

---

## Table 4 — Tempérament — 4 modes

| Champ d'entrée | Réponse brute (test) | Où ça part dans l'analyse | Ce que ça devient (sortie exacte) |
|---|---|---|---|
| `temperament_modes.conflit` | `{label: "temporisateur", intensity: 0.8}` | `computeProfileSynthesis()` → `communicationFacts` (« face au conflit : temporisateur ») · `computeStyleRadar()` — `discretion +8` (mode temporisateur/évitant) · Sonnet reçoit dans le bloc COMMUNICATION et re-produit dans `modes.conflit` reformulé | mode pill « **Conflit :** temporise » (Sonnet reformule "temporisateur" en 1-3 mots doux → `modes.conflit = "temporise"`) |
| `temperament_modes.stress` | `null` (non peuplé par le questionnaire actuel) | pas dans les facts · Sonnet **DÉDUIT** qualitativement à partir des axes tempérament (réservée + attentive détails + ponctuelle → tendance à se replier) | mode pill « **Stress :** se replie » (`modes.stress = "se replie"`) |
| `temperament_modes.decision` | `null` | idem — Sonnet déduit (planifie + nuancée → réflexion mûre) | mode pill « **Décision :** réfléchie » (`modes.decision = "réfléchie"`) |
| `temperament_modes.canal` | `null` | idem — Sonnet déduit (réservée + nuancée + attentive détails → écrit privilégié) | mode pill « **Canal :** message écrit » (`modes.canal = "message écrit"`) |

---

## Table 5 — Lifestyle — 6 axes

| Champ d'entrée | Réponse brute (test) | Où ça part dans l'analyse | Ce que ça devient (sortie exacte) |
|---|---|---|---|
| `lifestyle_axes.foodie` | score `+40` | `computeProfileSynthesis()` — `lifestyleHighlights` (>30 → "gastronome") · `computeStyleRadar()` — pas contribué directement · bloc `── LIFESTYLE ──` du prompt | axe barre « Pragmatique / **Curieuse en gastronomie** » dotmark à ~70% · `sections.restaurants.text` = « Curieuse en gastronomie, tu aimes les lieux authentiques plus que le tape-à-l'œil. » · `sections.restaurants.chips = ["gastronomie", "bar à vin", "bistrot de quartier"]` |
| `lifestyle_axes.premiumSimplicite` | score `+20` (raffinement) | `computeStyleRadar()` — `esthetique` contribution `axisPos(+20)×0.3=+18` · pas dans `lifestyleHighlights` (seuil > 30 non atteint) · Sonnet reçoit le score via `── LIFESTYLE ──` | axe barre « **Raffinement** / Simplicité » dotmark à ~40% · nourrit `sections.style.text` (raffinement discret) · style_radar `esthetique=66` |
| `lifestyle_axes.experienceObjet` | score `-30` (objets) | `lifestyleHighlights` (>30 non atteint côté positif, mais aussi pas le seuil négatif ; -30 = pile au seuil) · `computeStyleRadar()` — `temps` contribution `axisPos(-30)×0.35=+12` | axe barre « Expériences / **Objets** » dotmark à ~35% côté objets · influence `sections.gifts` (objets bien choisis) · style_radar `temps=54` |
| `lifestyle_axes.esthetiqueFonctionnel` | score `+20` (esthétique) | `computeStyleRadar()` — `esthetique` contribution `axisPos(+20)×0.5=+30`, `utilite` contribution `axisPos(-20)×0.3=+12` | axe barre « **Esthétique** / Fonctionnel » dotmark à ~40% · `sections.style.text` = « Des couleurs sourdes, des matières naturelles, rien de criard. » · style_radar `esthetique=66`, `utilite=42` |
| `lifestyle_axes.aventureConfort` | score `-50` (confort) | `lifestyleHighlights` (<-30 → "préfère le confort") · pas dans radar | axe barre « Aventure / **Confort** » dotmark à ~75% côté confort · `sections.travel.text` = « Plutôt confort qu'aventure, tu cherches le sens et la culture d'un lieu. » · `sections.travel.chips = ["city break culturel", "hôtel de charme"]` |
| `lifestyle_axes.authenticiteLuxe` | score `+40` (authenticité) | `lifestyleHighlights` (>30 → "sensible à l'authenticité") | axe barre « **Authenticité** / Luxe » dotmark à ~30% · `summary_chips` inclut « authentique » · nourrit `sections.restaurants` (lieux authentiques) et `sections.travel` (sens et culture) |

---

## Table 6 — Filtres relationnels + q17

| Champ d'entrée | Réponse brute (test) | Où ça part dans l'analyse | Ce que ça devient (sortie exacte) |
|---|---|---|---|
| `relational_filters.antiSurprisePublique` | `true` | `avoidAlerts` (« les surprises publiques ou devant du monde ») · `avoidAttentions` (« les surprises devant un groupe ou en public ») · `computeStyleRadar()` — `surprise -15`, `discretion +15` | `sections.avoid.chips` inclut « surprises publiques » · `summary_chips` inclut « discrète en public » · `insights[1]` = « Tu n'aimes pas le générique — l'intention prime sur le prix. » (nuance intégrée) · style_radar `surprise=28`, `discretion=64` |
| `relational_filters.antiSurprisePlanning` | `false` | aucun effet | rien |
| `relational_filters.antiSurpriseIntime` | `false` (non spécifié → défaut) | aucun effet | rien |
| `relational_filters.ouvertSurprise` | `false` | aucun effet | rien (contribue à `surprise=28` bas dans radar) |
| `relational_filters.besoinEcoute` | `true` | `touchInsights` (« se sentir vraiment écouté(e), pas juste entendu(e) ») · `computeStyleRadar()` — `emotion +6` | ligne intégrée dans `sections.what_touches.text` — nourrit `insights[0]` |
| `relational_filters.besoinProfondeur` | `true` | `touchInsights` (« les connexions profondes, davantage que les interactions superficielles ») · `computeStyleRadar()` — `emotion +8` | ligne intégrée dans `sections.what_touches` — nourrit `sections.attention_dna.text` |
| `relational_filters.besoinFiabilite` | `false` | aucun effet | rien |
| `relational_filters.exigenceExecution` | `false` (non spécifié) | aucun effet direct | rien |
| `relational_filters.sensibiliteCritique` | `false` | rien | rien |
| `relational_filters.besoinAir` | `false` | rien | rien |
| `relational_filters.peurOubli` | `false` | rien | rien |
| `relational_filters.sensibiliteChargeMetale` | `false` | rien | rien |
| `relational_filters.q17Interdits` | `["surprises publiques", "besoin de préavis"]` (extraits par `/api/lifestyle/extract-filters` de q17Text) | `avoidAlerts` (« surprises publiques », « besoin de préavis ») — arrive dans le bloc `── À ÉVITER ──` du prompt | `sections.avoid.chips` inclut « surprises publiques » · `deal_breakers[0] = "surprises publiques"` |
| `relational_filters.q17Text` | `"les surprises devant tout le monde me font horreur, je préfère être prévenue"` | ✅ **NOUVEAU Phase 2** — envoyé au prompt sous bloc `── À ÉVITER (texte libre) ──` (`rawTexts.q17`) — Sonnet capte le ton "font horreur" | `sections.avoid.text` = « Le générique, l'impersonnel, qu'on en fasse trop en public, et **les imprévus de dernière minute qui te bousculent**. » (ton "horreur" transposé en "te bousculent") · `insights[1]` prolongement de l'angle "générique" |

---

## Table 7 — Singularité — 11 questions ouvertes

| Champ d'entrée | Réponse brute (test) | Où ça part dans l'analyse | Ce que ça devient (sortie exacte) |
|---|---|---|---|
| `singularity_answers.adore_faire` | `"poterie le weekend, longues balades en forêt, cuisiner pour les amis"` | Bloc `── SINGULARITÉ ──` du prompt (tronqué 100 chars) · `extractEntities()` (via Haiku) → hobbies · `singularityContext` (« aime : … ») | `entities.hobbies = ["céramique", "lecture", "cuisine"]` (Haiku extrait) · `sections.hobbies.text` = « Ce qui t'anime et nourrit ton univers au quotidien. » (paraphrase — jamais verbatim) · `sections.hobbies.chips = ["céramique", "lecture", "cuisine pour les proches", "balades forêt"]` |
| `singularity_answers.evite_deteste` | `"les soirées bruyantes en grand groupe et les jeux de société"` | Bloc SINGULARITÉ (tronqué 100) · `avoidAlerts` (« évite en général : les soirées bruyantes… ») | `sections.avoid.chips` inclut « bruit en groupe » · fond dans `sections.points_fixes.chips` (« déteste le bruit », « peur du démonstratif ») |
| `singularity_answers.sujets_stimulants` | `"art contemporain, voyages, récits de vie"` | Bloc SINGULARITÉ · `extractEntities()` (4e texte combiné) · `singularityContext` | `sections.points_fixes.chips` inclut « sujets : art, voyage » · fond dans `sections.what_touches` (art, voyage → thèmes) · Sonnet peut nourrir `sections.travel` |
| `singularity_answers.peu_savent` | `"je fais de la céramique depuis 3 ans"` | Bloc SINGULARITÉ · `singularityContext` (« peu savent que : … ») | `sections.points_fixes.chips` implicitement (céramique intégrée dans `hobbies.chips`) · Sonnet peut nourrir `sections.points_fixes.text` (paraphrase) |
| `singularity_answers.plus_beau_cadeau` | `"un carnet manuscrit avec des mots que j'avais dits sans y penser"` | Bloc SINGULARITÉ | `sections.gifts.text` = « Le concret bien choisi, avec une trace d'attention personnelle. **Le carnet manuscrit reste ton étalon**. » (référence discrète paraphrasée, jamais citée verbatim) · nourrit `insights[0]` (détails retenus) |
| `singularity_answers.detail_compris` | `"qu'on retienne un détail que j'ai glissé sans y penser"` | Bloc SINGULARITÉ · `touchInsights.push()` (>3 chars → tronqué 80 chars) | `sections.points_fixes.text` = **« On me connaît vraiment quand on adapte sans que je demande. »** (paraphrase italique — Sonnet reformule sans copier) · nourrit `insights[0]` (« Tu es touchée par les détails retenus, pas par la valeur du geste ») |
| `singularity_answers.marques_lieux` | `"Aesop, Le Bon Marché, la papeterie japonaise Itoya"` | Bloc SINGULARITÉ · `extractEntities()` (1er texte) → brands · `idealAttentions` (« un choix dans tes univers préférés : … ») | `entities.brands = ["Aesop", "Le Bon Marché", "Itoya"]` · `sections.brands.text` = « Un univers doux et exigeant — cosmétique minimaliste et papeterie japonaise. » (paraphrase de l'esprit, pas des noms) · logos-cards dans « Ton univers » |
| `singularity_answers.cadeaux_non` | `"bougies, fleurs coupées, bons d'achat"` | Bloc SINGULARITÉ · `avoidAlerts` (« à éviter comme cadeaux : … ») · `avoidAttentions` (« les cadeaux que tu n'aimes pas : … ») | `sections.avoid.chips` inclut « bons d'achat » · `deal_breakers[1] = "cadeaux impersonnels"` (paraphrase) |
| `singularity_answers.envies_reves` | `"apprendre la reliure, partir au Japon en automne"` | Bloc SINGULARITÉ · `extractEntities()` (3e texte) → events (« automne au Japon ») · `idealAttentions` | `entities.events = ["automne au Japon"]` · `sections.points_fixes.chips` inclut « rêve : reliure » · nourrit `must_haves` (potentiellement « un détail personnel ») |
| `singularity_answers.remarquer` | `"ma patience"` | Bloc SINGULARITÉ | `sections.points_fixes.chips` inclut « fière de sa patience » |
| `singularity_answers.sentir_special` | `"qu'on prépare quelque chose rien que pour moi"` | Bloc SINGULARITÉ | `must_haves` inclut « un détail personnel » · fond dans `sections.what_touches.text` (soin dans l'exécution) |

---

## Table 8 — Singularité — Interests structurés

| Champ d'entrée | Réponse brute (test) | Où ça part dans l'analyse | Ce que ça devient (sortie exacte) |
|---|---|---|---|
| `singularity_answers.interests.items[0]` | `{id: "cuisine", rank: 1}` | ✅ **NOUVEAU Phase 2** — `summarizeInterests()` → bloc `── CENTRES D'INTÉRÊT ──` (`• Cuisine & gastronomie`) | `sections.hobbies.chips` inclut « cuisine pour les proches » · nourrit `sections.restaurants` (curiosité gastronomique) |
| `singularity_answers.interests.items[1]` | `{id: "art", rank: 2}` | idem — bullet `• Art & culture` | `sections.points_fixes.chips` inclut « sujets : art, voyage » |
| `singularity_answers.interests.items[2]` | `{id: "lecture", rank: 3, details: {genre: ["Romans","Poésie"]}}` | idem — bullet `• Lecture (genre: Romans, Poésie)` | `sections.hobbies.chips` inclut « lecture » · Sonnet peut affiner par les genres |
| `singularity_answers.interests.freeText` | `""` (vide) | ✅ **NOUVEAU Phase 2** — envoyé sous « Autres (texte libre) : … » si non vide | rien (champ vide) |

---

## Table 9 — Pratique (factuel + textes libres)

| Champ d'entrée | Réponse brute (test) | Où ça part dans l'analyse | Ce que ça devient (sortie exacte) |
|---|---|---|---|
| `practical_info.allergies` | `["fruits_a_coque"]` | Bloc `── INFO PRATIQUE ──` (`allergies : fruits à coque`) · `avoidAlerts` (« les aliments contenant : fruits à coque ») · `constraints` du fallback | UI : `.fact` row « Allergies » → « fruits à coque » · `constraints = ["fruits à coque", ...]` · `deal_breakers` peut inclure lien |
| `practical_info.regime` | `"omnivore"` | Bloc `── INFO PRATIQUE ──` (via vetos si halal/casher/vegan/vegetarien). Ici omnivore → pas de veto → rien envoyé | UI : `.fact` row « Régime · alcool » → « omnivore · occasionnel » |
| `practical_info.alcool` | `"occasionnel"` | Bloc INFO PRATIQUE (via `vetos.no_alcohol` = false ici) → rien envoyé | UI : `.fact` row « Régime · alcool » |
| `practical_info.mobilite_sante` | `"genou fragile, éviter les longues randonnées"` | ✅ **NOUVEAU Phase 2** — bloc `── MOBILITÉ / SANTÉ (texte libre) ──` (tronqué 200) · le booléen `vetos.mobility_constraints=true` (car length>3) alimente aussi `avoidAlerts` (« contrainte mobilité ») | `constraints` inclut « genou fragile — pas de longues marches » (paraphrase Sonnet) · Sonnet peut adapter `sections.travel.text` (préfère city break plutôt que trek) |
| `practical_info.taille_vetements` | `"38"` | Pas envoyé au prompt — factuel UI seulement | UI : `.fact` row « Vêtements / chaussures » → « M · 39 » (M est déduit) — reste factuel, jamais analysé |
| `practical_info.taille_chaussures` | `"39"` | idem | idem row facts |
| `practical_info.taille_pantalon` | non renseigné | idem | rien |
| `practical_info.taille_bague` | non renseigné | idem | rien |
| `practical_info.parfums` | `["boise", "discret"]` | ✅ **NOUVEAU Phase 2** — bloc `── PARFUMS & ODEURS ──` (« Aime : boise, discret ») | `sections.parfums.text` = « Tu aimes le boisé et le discret — fuis le sucré entêtant. » · `sections.parfums.chips = ["boisé", "discret", "déteste : gourmand"]` · UI : `.fact` row « Parfums aimés / détestés » → « boisé / sucré » |
| `practical_info.odeurs_detestees` | `"gourmand sucré entêtant, patchouli"` | ✅ **NOUVEAU Phase 2** — bloc PARFUMS & ODEURS (« Déteste : gourmand sucré entêtant, patchouli ») | `sections.parfums.chips` inclut « déteste : gourmand » (paraphrase courte) · fond dans `sections.avoid.text` (implicitement) |
| `practical_info.couleurs_matieres` | `"tons terreux, lin et laine, rien de criard, matières nobles"` | ✅ **NOUVEAU Phase 2** — bloc `── ESTHÉTIQUE — couleurs, matières, style ──` (tronqué 300) | `sections.style.text` = « Des couleurs sourdes, des matières naturelles, rien de criard. » (paraphrase) · `sections.style.chips = ["tons terreux", "lin & laine", "déteste : néon"]` |
| `practical_info.adresse_livraison` | (renseignée, contenu non affiché) | JAMAIS envoyée au prompt (commentaire code : *"private — never displayed"*) | UI : `.fact` row « Adresse de livraison » → « renseignée ✓ » (booléen d'existence, jamais le contenu) |
| `practical_info.animaux` | `"un chat"` (assumé pour maquette) | Pas envoyé au prompt (usage UI + contextuel signaux) | UI : `.fact` row « Animaux » → « un chat » — factuel |
| `practical_info.dates_importantes` | 3 dates (anniv 14 mars + 2 autres) | Pas envoyées au prompt directement · usage moteur cadence/rappels | UI : `.fact` row « Dates clés » → « anniv. 14 mars · +2 » — factuel |
| `practical_info.role_familial` | non renseigné | ✅ **Bloc CONTEXTE (calibrage)** — voir Table 1 | rien ici (vide) — si renseigné : calibre les occasions sans citation |

---

## Table 10 — Visualisations (donut + radar)

| Composant | Source d'entrée | Trajet | Sortie exacte |
|---|---|---|---|
| **Donut langage attention** (6 couleurs) | `my_profile.attention_reception.{dominant,secondaire,tertiaire}` | `computeDonutData()` (existant `/moi/page.tsx:587-599`) — fusionne CAD_C + CAD_S en `CAD` puis pondère dominant×3 / secondaire×2 / tertiaire×1 → normalise en fractions | SVG donut 108×108, 6 anneaux stroke 26 : MOT `#173E31` en tête (dominant), CAD (=CAD_C+CAD_S mergé) `#3E7361`, SER `#8DA697`, EXP `#CDB987`, GES `#B9A77C`, SUR `#E0D3B0` · center « Mots en tête » Fraunces 12 |
| **Radar 7 axes** (heptagone rempli) | tous les axes tempérament + lifestyle + reception dims + relational_filters + modes | `computeStyleRadar()` déterministe (**Phase 2 nouveau**) | `style_radar = {precision:78, emotion:62, surprise:28, esthetique:66, utilite:42, temps:54, discretion:64}` · SVG heptagone `viewBox 200×200` polygone rempli `rgba(23,62,49,.14)` stroke pine 1.6 |

---

## Ligne de SYNTHÈSE — champs perdus ?

**Aucune donnée collectée par le questionnaire n'est intégralement perdue en Phase 2.** Détail par catégorie de "non-visibilité" :

| Catégorie | Champs concernés | Statut |
|---|---|---|
| **Envoyés au prompt Claude et analysés** | 11 ouvertes singularité + q17Text + mobilite_sante + odeurs_detestees + couleurs_matieres + interests.freeText + interests.items + tous axes (temperament/lifestyle/reception/expression) + relational_filters + vetos (halal/casher/no_alcohol/vegetarian/vegan/mobility/allergies) | ✅ **Tous exploités** |
| **Non envoyés au prompt mais affichés en factuel UI** | tailles (vetements/chaussures/pantalon/bague), allergies détaillées, regime, alcool, animaux, dates_importantes, adresse_livraison (existence seulement, JAMAIS le contenu) | ✅ **Factuel préservé** (règle : faits ≠ brut, affichage direct autorisé) |
| **Envoyés au prompt en bloc CONTEXTE (calibrage)** | `age`, `profession`, `role_familial` | ✅ **Décision Estelle (GO Phase 2)** : envoyés au prompt comme contexte de calibrage (ton, univers, occasions, niveau des suggestions). Affichés en factuel sur la fiche (identité). Jamais cités tels quels dans les textes générés (règle system prompt). |
| **Non envoyés au prompt ET non affichés** | `taille_pantalon` non rempli, `taille_bague` non rempli | Champs vides dans le profil test — quand remplis, affichés en factuel UI (rows facts). |
| **Legacy columns (`love_language`, `hobbies`, `things_to_avoid`, `important_dates`, `favorite_foods`, `conversation_topics`, `gift_preference`, `gastronomy`, `accommodation`, `appreciation_style`)** | Existent en base mais **hors scope** (lot A4 dédié à leur suppression) | 🚫 **Volontairement ignorées** en Phase 2. Traitées lot A4. |
| **Champs Art.9 (`religion`, `disability`, `health_comfort`)** | Colonnes existent (`supabase-schema.sql:92,99,100`) mais jamais collectées ni analysées | ⚠ **Non exploités Phase 2** (décision Q4). Affichés en Phase 4 avec CTA « Compléter → » + bouton « Masquer ». Collecte reportée à un lot handicap/RGPD dédié. |
| **`attention_answers` bruts (rangs des cards q1-q4/qe)** | Réponses de rang par question | ⚠ Pas dans le prompt d'analyse globale (scoring déjà fait en amont dans `attention_reception/expression`). Conservés en base pour audit / re-scoring, mais l'analyse ne les revoit pas. Pas une perte : ils sont *déjà* traduits en `attention_reception/expression`. |
| **`temperament_answers` bruts** | Réponses par question tempérament | idem — déjà traduits en `temperament_axes/modes`. Prompt reçoit les axes, pas les réponses par question. |
| **`lifestyle_answers` bruts** | Réponses par question lifestyle | idem — traduits en `lifestyle_axes` + supplements. Non ré-envoyés. |
| **`discovery_answers`** | Réponses au parcours Discovery additionnel | ✅ Envoyées via bloc `── DISCOVERY ANSWERS ──` du prompt (JSON.stringify de chaque réponse). |

---

### Verdict global

**Aucune donnée d'entrée n'est perdue en analyse Phase 2.**

- Les **16 questions ouvertes** sont toutes exploitées (les 5 fuites du AVANT sont fermées : q17Text, mobilite_sante texte, odeurs_detestees, couleurs_matieres, interests.freeText).
- Les **9 axes tempérament** apparaissent tous soit en barres visuelles, soit en facts injectés au prompt, soit dans le radar 7 axes.
- Les **6 axes lifestyle** idem.
- Les **4 modes** — le seul peuplé par le questionnaire (`conflit`) est reformulé, les 3 autres (`stress`, `decision`, `canal`) sont produits par Sonnet à partir des axes.
- Les **7 dimensions attention** apparaissent dans le donut, `attention_dna`, `topReceptionDims/topExpressionDims`, et le radar via pondérations.
- Le **factuel pratique** est intégralement affichable (tailles, allergies, régime, parfums, adresse, animaux, dates) — sans passer par le prompt (règle règle d'or : faits ≠ brut).

**Ce qui reste HORS scope Phase 2 (par décision) et pas une perte à corriger** : legacy columns (lot A4), collecte Art.9 (lot handicap/RGPD futur).

**Ajout GO Phase 2** : `age`, `profession`, `role_familial` sont finalement ENVOYÉS au prompt en bloc CONTEXTE (calibrage du ton, de l'univers et des occasions) — affichés en factuel identité sur la fiche, jamais cités tels quels dans les textes générés.
