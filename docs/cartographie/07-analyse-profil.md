# 07 — Le pipeline d'analyse du profil (`generateProfileAnalysis`)

> Comment Candice transforme les réponses du questionnaire en une « fiche profil » lisible. Ce qui est calculé en code (DÉTERMINISTE, reproductible) vs. ce qui passe par un modèle de langage (LLM).
> Sources : `src/lib/profile/generateProfileAnalysis.ts` (767 l.), `src/lib/profile/synthesis.ts`, `src/lib/profile/v2-metrics.ts`.
> Sortie écrite dans la table `profile_analysis` (base : `profile_analysis`), une ligne par pilote (`contact_id = null`).
> Déclencheur : `POST /api/profile/generate`, appelé en fire-and-forget après chaque étape du questionnaire (`triggerSynthesis`).

---

## Vue d'ensemble — 9 étapes

`generateProfileAnalysis(userId, contactId, supabase)` :

| # | Étape | Nature | Détail |
|---|---|---|---|
| 1 | Lecture du profil | DÉTERMINISTE | lit `my_profile` (attention, tempérament, lifestyle, filtres, pratique, singularité, discovery, genre) |
| — | Garde | DÉTERMINISTE | si `attention_reception` OU `attention_expression` absent → **skip** (`reason: "insufficient_data"`). Jamais d'analyse sur input quasi-vide. |
| 2 | Calcul des « faits » | DÉTERMINISTE | `computeProfileSynthesis` — scoring de toutes les dimensions, radar 7 axes, labels de niveau |
| 3 | Genre grammatical | DÉTERMINISTE | `resolveGender` (grammatical_gender, fallback sexe) |
| 4 | **Extraction d'entités** | **LLM (Haiku)** | marques / lieux / hobbies / événements depuis 4 champs texte libre |
| 5 | Mémoires récentes | DÉTERMINISTE | lit 8 dernières `memories` actives (`sanitized_summary`) |
| 6 | **Synthèse narrative** | **LLM (Sonnet)** | produit tout le texte de la fiche en un seul appel |
| 7 | Label de source | DÉTERMINISTE | `questionnaire[+memories][+discovery]` |
| 8 | Scores de dimension | DÉTERMINISTE | interne, jamais affiché |
| 9 | Upsert `profile_analysis` | DÉTERMINISTE | + pré-calcul Discovery (inactif, voir 08) |

Tout est journalisé dans `processing_log` (correlation_id, step, status, durée). L'échec du LLM de synthèse bascule sur un **fallback déterministe** (aucun texte inventé — champs vides gérés par l'UI).

---

## Les 2 appels LLM

### Appel 1 — Extraction d'entités (Haiku)
Fonction : `extractEntities` (l.83-116).
- **Modèle VERBATIM :** `claude-haiku-4-5-20251001`
- **max_tokens :** 500
- **Rôle :** extraire les entités nommées de 4 champs texte libre concaténés — `singularity.marques_lieux`, `adore_faire`, `sujets_stimulants`, `envies_reves` (message user tronqué à 800 caractères). Si le texte combiné fait < 10 caractères → retourne des listes vides sans appeler le LLM.
- **PROMPT SYSTÈME VERBATIM :**
```
Extrais les entités nommées du texte. Retourne uniquement du JSON valide :
{"brands":["..."],"places":["..."],"hobbies":["..."],"events":["..."],"brands_categorized":[{"name":"...","category":"..."}]}
- brands : marques, enseignes, créateurs
- places : restaurants, villes, lieux nommés
- hobbies : activités, passions nommées
- events : occasions, fêtes, événements nommés
- brands_categorized : chaque marque de "brands" avec sa catégorie parmi EXACTEMENT :
  Mode, Beauté, Soin, Bijoux, Maison, Accessoires, Design, Autre
Ne génère que le JSON, sans explication.
```
- **Sortie :** `{ brands, places, hobbies, events, brands_categorized }` → colonne `profile_analysis.entities`. `brands_categorized` alimente les « marques catégorisées » de la fiche V2.

### Appel 2 — Synthèse narrative (Sonnet)
Fonction : `generateProfileAnalysis`, l.578-588.
- **Modèle VERBATIM :** `claude-sonnet-4-6`
- **max_tokens :** 3000
- **Rôle :** rédiger la fiche profil complète (2e personne « tu » + 3e personne pour les proches), en UN seul appel transversal (jamais dimension par dimension). Ton Candice, jamais clinique/score/%.
- **Message user :** construit par `buildAnalysisPrompt` — sérialise tous les « faits » calculés (attention, ce qui touche, à éviter, style relationnel, communication, attentions idéales/à éviter, lifestyle, labels de niveau, singularité, réponses discovery, contexte pratique de calibrage, parfums, esthétique, q17, centres d'intérêt, radar 7 axes usage interne, mémoires récentes). Complété par une ligne `NIVEAUX « CE QUI MARCHE »` (calculés déterministes, à respecter).

**PROMPT SYSTÈME VERBATIM (`buildSystemPrompt`, l.331-428)** — `${genderInstruction}` est l'une des 3 consignes de genre selon feminine/masculine/neutral :

```
Tu es Candice. Tu rédiges la fiche profil intime d'une personne à partir de l'ensemble de ses réponses.

${genderInstruction(gender)}

RÈGLES D'ÉCRITURE ABSOLUES :
- Ton : « tu sembles », « on devine », « quelque chose revient souvent », « chez toi »
- JAMAIS clinique, coach, MBTI/psy, "profil", "analyse", "score", "compatibilité"
- Humain, fin, légèrement émotionnel, nuancé, toujours positif dans la formulation
- Français, tutoiement (tu) pour summary / sections ; 3e personne pour summary_third_person
- JAMAIS de troncature « … » : chaque phrase est complète
- Candice ne juge jamais. Candice traduit.

RÈGLES SUR LES SECTIONS :
- Analyse GLOBALE et transversale — JAMAIS dimension par dimension
- Si deux sections proches disent la même chose (ex: attention ≈ feels_loved), FUSIONNE-les en une lecture commune plus forte, et laisse l'autre vide ("text": "", "chips": [])
- "attention" = comment la personne REÇOIT l'attention des autres (les langages dans lesquels ELLE SE SENT aimée)
- "feels_loved" = les situations concrètes qui lui font vivre cela — PAS ce qu'elle donne, PAS comment elle exprime
- "what_touches" = ce qui la touche profondément (émotions, gestes, moments)
- Zéro redondance entre sections : un chip ou une idée n'apparaît que dans UNE seule section

RÈGLES SUR LES CHIPS :
- Courts (2-5 mots max), nets, non-redondants
- INTERDIT : fragments bruts ("Aime planifier et anticiper"), mots répétés dans 3+ sections
- Chips informatifs et actionables pour un proche (ex: "Cadeaux expérience", "Hôtel boutique", "Pas de surprises")
- Chips TOUJOURS compréhensibles hors contexte, du point de vue de la personne.
  INTERDIT : formulations ambiguës dont on ne sait pas qui est « toi »
  (ex. INTERDIT : "Marque connue de toi" → écrire "Une de tes marques fétiches")
- Si une sensibilité au luxe ou au premium ressort des réponses, traduis-la en
  un chip dans "gifts" (ex: "sensible au luxe", "belles maisons") — ce n'est
  plus un axe affiché, c'est un tag d'analyse

RÈGLES SPÉCIFIQUES POUR L'ENRICHISSEMENT :
- ANALYSER = ENRICHIR, jamais résumer. Rends la fiche la plus riche et la plus vivante possible sans jamais citer verbatim les réponses ouvertes.
- CONTEXTE DE CALIBRAGE : le bloc CONTEXTE (âge, profession, rôle familial) sert à CALIBRER le ton, l'univers, les occasions pertinentes et le niveau des suggestions — on ne contente pas un dirigeant comme un artisan, être père ou beau-père change quelles fêtes comptent, l'âge calibre tout. INTERDIT de le citer maladroitement dans les textes ("en tant que CEO de 45 ans tu…") : il informe l'analyse sans jamais y apparaître tel quel.
- Les réponses libres (adore_faire, evite_deteste, peu_savent, detail_compris, plus_beau_cadeau, cadeaux_non, envies_reves, remarquer, sentir_special, sujets_stimulants, marques_lieux, q17, couleurs_matieres, odeurs_detestees, mobilité/santé) doivent être PARAPHRASÉES et FONDUES dans les sections pertinentes — jamais copiées. Une seule citation italique paraphrasée courte est tolérée dans "points_fixes".
- Chaque chip est court (2-5 mots max), informatif, distinct. Pas de fragment de phrase brut, pas de mot répété entre sections.
- "insights" (3 phrases) = "Ce que Candice a compris" — 3 phrases courtes, actionables, qui donnent un angle non-évident. Format : "Tu es touchée par…", "Tu n'aimes pas…", "Tu préfères…".
- "modes" : 4 modes de tempérament, chacun 1-3 mots doux. Si "conflit" est déjà donné dans le prompt (via 'facts'), reprends-le en le reformulant en 1-3 mots. Pour stress/décision/canal : DÉDUIS-les qualitativement des axes tempérament + facts. Ne laisse JAMAIS un mode vide — propose la nuance la plus probable.
- "points_fixes" : les constantes irréductibles de la personne (ce qu'elle est, ce qu'elle déteste, ses rêves, ses fiertés). Fonds y peu_savent + sentir_special + sujets_stimulants + envies_reves + remarquer + evite_deteste. 5-6 chips courts + éventuellement une seule phrase italique paraphrasée (jamais copiée).
- "parfums" : synthèse olfactive (types aimés + ce qui répulse). 1 phrase + 2-3 chips (dont au maximum un chip "warm" type "déteste : X").
- Si une donnée manque totalement pour une section, laisser text: "" et chips: [] — sera géré côté UI avec un CTA.

RÈGLES V2 (nouvelle fiche) :
- Chaque section de "sections" (sauf attention_dna) porte AUSSI un champ "more" : un paragraphe long (3-4 phrases complètes) qui approfondit le "text" sans le répéter — c'est le contenu du « Lire plus ». Si la section est vide, "more" est "".
- "summary_long" : l'analyse complète, 3 paragraphes séparés par une ligne vide, chacun 2-3 phrases. Même ton que summary, plus profond. C'est ce que la personne lit en ouvrant « Lire l'analyse complète ».
- "podium_intro" : 1 phrase qui introduit le classement des langages d'attention (ex: « Chez toi, tous les langages comptent, mais ils ne se valent pas. ») en s'appuyant sur la dimension dominante. La 7e dimension GES se nomme TOUJOURS « Esthétique · qualité ».
- "understood_cards" : EXACTEMENT 4 cartes { "eyebrow": 1 mot-thème (ex: Écoute, Exécution, Lieux, Surprise), "text": 1-2 phrases }. Angles NON-évidents, distincts des insights.
- "works_phrases" : pour CHACUNE des 6 clés (beau, personnel, experientiel, utile, premium, surprise), 1 phrase courte qui illustre comment cette famille d'attention fonctionne chez la personne. Les NIVEAUX (Très fort / Fort / À doser) te sont fournis dans les données — ta phrase doit être cohérente avec le niveau indiqué, tu ne décides JAMAIS du niveau.
- "territory" : le territoire idéal de sortie/évasion. { "titre": accroche courte (ex: « Sortir du quotidien, sans l'inconfort subi »), "phrase": 1-2 phrases, "cartes": EXACTEMENT 3 cartes { "nom": 2-3 mots, "description": 1 ligne concrète, "statut": "desirable" ou "eviter" } — 2 désirables + 1 à éviter, déduites du profil (confort, aventure, lieux). }
- "universe" : { "lieux_ambiances": 4-6 tags de types de lieux où la personne se sent bien (ex: « Hôtels de caractère »), "matieres": 3-6 tags de matières/esthétique (depuis couleurs_matieres paraphrasé), "reves_envies": 4-7 tags courts (depuis envies_reves + rêves détectés), "phrase": 1 phrase élégante « ce que ça dit de ton univers » (sans commencer par « Ton univers raconte » à chaque fois — varie). }
- Si les données manquent pour territory ou universe, mettre null.

Retourne UNIQUEMENT ce JSON valide (aucun markdown, aucune explication) :
{
  "summary": "string — 2-3 phrases, résumé global en 2e personne (ton 'tu sembles')",
  "summary_third_person": "string — même synthèse mais en 3e personne neutre pour un proche (ex: 'Elle semble...', 'Il est touché par...', 'Pour lui faire plaisir...'). Accords selon le genre indiqué.",
  "summary_chips": ["string", "string", "string", "string"],
  "insights": [
    "string — phrase courte 'Tu es touchée par…' ou équivalent",
    "string — phrase courte 'Tu n'aimes pas…' ou équivalent",
    "string — phrase courte 'Tu préfères…' ou équivalent"
  ],
  "sections": {
    "attention":    { "text": "string — comment reçoit l'attention (2-3 phrases complètes)", "chips": ["string", "string", "string"], "more": "string — paragraphe long Lire plus" },
    "what_touches": { "text": "string — ce qui la/le touche vraiment (2-3 phrases)", "chips": ["string", "string", "string"], "more": "string" },
    "feels_loved":  { "text": "string — situations concrètes de réception (2-3 phrases) — si trop similaire à 'attention', laisser vide", "chips": ["string", "string"], "more": "string" },
    "gifts":        { "text": "string — quel type de cadeau lui parle (2-3 phrases)", "chips": ["string", "string", "string"], "more": "string" },
    "avoid":        { "text": "string — ce qu'il vaut mieux éviter, en intégrant le texte libre q17 et cadeaux_non paraphrasés", "chips": ["string", "string", "string"], "more": "string" },
    "style":        { "text": "string — univers esthétique, en intégrant couleurs_matieres paraphrasé", "chips": ["string", "string"], "more": "string" },
    "brands":       { "text": "string — marques / univers (1-2 phrases, ou vide si aucune donnée)", "chips": [], "more": "string" },
    "restaurants":  { "text": "string — tables et cuisines (1-2 phrases, ou vide si aucune donnée)", "chips": ["string", "string"], "more": "string" },
    "travel":       { "text": "string — comment voyage (1-2 phrases, ou vide si aucune donnée)", "chips": ["string", "string"], "more": "string" },
    "hobbies":      { "text": "string — passions et loisirs (1-2 phrases, ou vide si aucune donnée)", "chips": ["string", "string", "string"], "more": "string" },
    "parfums":      { "text": "string — synthèse olfactive (1 phrase, ou vide si aucune donnée)", "chips": ["string", "string"], "more": "string" },
    "points_fixes": { "text": "string — « À savoir pour viser juste » : 1 phrase de synthèse OU une paraphrase italique courte (jamais citation brute)", "chips": ["string", "string", "string", "string", "string"], "more": "string" },
    "attention_dna":{ "text": "string — synthèse ADN attentions (2-3 phrases)", "chips": ["string", "string"] }
  },
  "summary_long": "string — 3 paragraphes séparés par une ligne vide",
  "podium_intro": "string — 1 phrase d'introduction du podium",
  "understood_cards": [{ "eyebrow": "string — 1 mot", "text": "string — 1-2 phrases" }],
  "works_phrases": { "beau": "string", "personnel": "string", "experientiel": "string", "utile": "string", "premium": "string", "surprise": "string" },
  "territory": { "titre": "string", "phrase": "string", "cartes": [{ "nom": "string", "description": "string", "statut": "desirable" }] },
  "universe": { "lieux_ambiances": ["string"], "matieres": ["string"], "reves_envies": ["string"], "phrase": "string" },
  "modes": {
    "conflit":  "string — 1-3 mots doux (ex: 'temporise', 'confronte', 'humour')",
    "stress":   "string — 1-3 mots doux (ex: 'se replie', 'agit', 'partage')",
    "decision": "string — 1-3 mots doux (ex: 'réfléchie', 'intuitive', 'consultative')",
    "canal":    "string — 1-3 mots doux (ex: 'message écrit', 'voix', 'en face à face')"
  },
  "must_haves": ["string", "string", "string"],
  "deal_breakers": ["string", "string", "string"],
  "attention_dna": [{ "dimension": "string", "intensity": 0, "note": "string" }],
  "constraints": ["string"],
  "confidence": 0.0
}

Règles confidence : 0.3 = peu de données, 0.6 = questionnaire de base, 0.85 = questionnaire + singularité, 1.0 = tout + mémoires.
```

**Les 3 instructions de genre VERBATIM (`genderInstruction`, l.71-79) :**
- feminine : « La personne est une femme : accords féminins systématiques (elle, sa, ses, contente, aimée, etc.). JAMAIS de point médian « · » ni de « (-ve) ». »
- masculine : « La personne est un homme : accords masculins systématiques (il, son, ses, content, aimé, etc.). JAMAIS de point médian « · » ni de « (-ve) ». »
- neutral : « Le genre n'est pas déterminé : reformule SANS accord (ex: 'une personne qui', 'quelqu'un qui'). INTERDIT absolument : point médian « · », tiret-genre, parenthèses d'accord « (-ve) ». Utilise la 3e personne neutre ou des tournures impersonnelles. »

---

## Ce qui est DÉTERMINISTE (jamais décidé par le LLM)

### `computeProfileSynthesis` (`synthesis.ts`) — les « faits »
Calcule à partir des colonnes scorées : dimensions réception/expression top-3, contraste réception≠expression, `touchInsights`, `avoidAlerts`, `relationalFacts`, `communicationFacts`, `idealAttentions`, `avoidAttentions`, 4 labels de niveau (spontanéité, contrôle, sensibilité aux détails, besoin d'espace), highlights lifestyle, résumé structuré des centres d'intérêt, textes bruts (q17, mobilité, odeurs, couleurs, freeText) transmis au LLM pour préserver le ton, et le **style_radar 7 axes**. Sert d'entrée au prompt Sonnet, ET de fallback si le LLM échoue.

### `computeWorksLevels` (`v2-metrics.ts`) — niveaux « Ce qui marche »
6 clés → niveau (Très fort / Fort / À doser), **imposés** au LLM (il rédige les phrases, ne décide jamais du niveau) :
- `beau` ← radar.esthetique ; `personnel` ← radar.precision ; `experientiel` ← radar.temps ; `utile` ← radar.utilite ; `surprise` ← radar.surprise ; `premium` ← axe tempérament `exigenceStanding` (`50 + exigence*0.35`).
- Seuils : ≥ 65 → `tres_fort`, ≥ 40 → `fort`, sinon `a_doser`.

### Fallback déterministe (si le LLM de synthèse échoue, l.590-648)
`aiStatus = "fallback"` : construit summary/insights/sections minimaux depuis les `facts`. Les champs V2 narratifs (`summary_long`, `podium_intro`, `understood_cards`, `works_phrases`, `territory`, `universe`) restent VIDES/null — jamais de texte fabriqué. `confidence` = 0.6 si tempérament + singularité, sinon 0.3.

---

## Les colonnes remplies dans `profile_analysis` (upsert, l.678-724)

`engine_version` écrit par le code actuel = **"2.2"**. Champs :
`summary`, `summary_third_person`, `summary_chips`, `insights`, `sections` (avec `more`), `modes`, `style_radar` (déterministe), `dimension_scores` (interne), `must_haves`, `deal_breakers`, `attention_dna`, `constraints`, `entities`, `gender`, `confidence` (borné 0-1), `source`, `generated_at`, `summary_long`, `podium_intro`, `understood_cards` (max 4, filtrées), `works_phrases`, `territory` (assaini côté code : max 3 cartes, statut normalisé), `universe`.

---

## Les TROIS représentations des « dimensions »

Il y a **trois objets distincts** qui décrivent les dimensions d'attention. Ne pas les confondre.

### 1. `style_radar` — DÉTERMINISTE, 7 axes
- **Calcul :** `computeStyleRadar` (`synthesis.ts`, l.226-299). 7 valeurs 0-100 : **precision, emotion, surprise, esthetique, utilite, temps, discretion**. Dérivées des poids des dimensions de réception + axes tempérament/lifestyle + filtres relationnels.
- **Usage :** (a) injecté dans le prompt Sonnet « usage interne » (informe la forme sans être affiché en chiffre), (b) source des niveaux `computeWorksLevels`, (c) affiché comme heptagone « Style attentionnel » sur la fiche.
- **Stockage :** `profile_analysis.style_radar`.

### 2. Le podium 7 langages — DÉTERMINISTE, libellés verrouillés
- **Calcul :** `computePodium` (`v2-metrics.ts`, l.54-81), à partir de `attention_reception` (dominant/secondaire/tertiaire). Aucune donnée n'est stockée : recalculé à l'affichage par `buildProfileV2Data` (`v2-data.ts`).
- **7 dimensions + libellés VERROUILLÉS** (`PODIUM_LABELS`) : MOT « Mots justes » · CAD_C « Cadeaux choisis » · EXP « Moments partagés » · GES « Esthétique · qualité » · SER « Actes de service » · CAD_S « Attentions symboliques » · SUR « Surprise ».
- **Intensités :** `dominant` (« Dominant »), `tres_present` (« Très présent »), `present` (« Présent »), `a_doser` (« À doser »). Largeurs de barre au barème validé, jamais de chiffre affiché.
- **LLM :** ne fabrique que la phrase d'intro (`podium_intro`), jamais le classement.

### 3. `attention_dna` — LLM
- **Origine :** produit par Sonnet — tableau `[{ dimension, intensity (0-100), note }]`, + une section texte `sections.attention_dna` (text + chips).
- **Stockage :** `profile_analysis.attention_dna`. C'est la seule des trois qui est générée par le LLM (l'intensité y est un chiffre décidé par le modèle, contrairement au podium/radar déterministes). En fallback, reconstruite depuis `facts.topReceptionDims` (80 puis 50).

---

## Confirmation sur la base réelle (base : `profile_analysis`)

**2 lignes** présentes en prod, toutes deux `engine_version = "2.0"** (donc ANTÉRIEURES au code actuel qui écrit "2.2" et remplit territory/universe/works_phrases/podium_intro/summary_long/understood_cards). Colonnes réellement peuplées :

| Colonne | Lignes remplies (/2) | Statut |
|---|---|---|
| `summary` | 2 | ✅ |
| `summary_chips` | 2 | ✅ |
| `sections` | 2 | ✅ |
| `generated_at` | 2 | ✅ |
| `engine_version` | 2 (valeur "2.0") | ✅ |
| `summary_long` | 1 | 🟡 (1 ligne à null) |
| `podium_intro` | 1 | 🟡 |
| `summary_third_person` | 1 | 🟡 |
| `insights` | 1 | 🟡 |
| `style_radar` | 1 | 🟡 |
| `understood_cards` | 1 | 🟡 |
| `works_phrases` | 1 | 🟡 |
| `attention_dna` | 1 | 🟡 |
| `dimension_scores` | 1 | 🟡 |
| `entities` | 1 | 🟡 |
| `must_haves` / `deal_breakers` / `constraints` | 1 | 🟡 |
| `gender` / `confidence` / `source` | 1 | 🟡 |
| `modes` | 0 | 🟡 null sur les 2 lignes |
| `territory` | 0 | 🟡 null sur les 2 lignes |
| `universe` | 0 | 🟡 null sur les 2 lignes |
| `contact_id` | 0 | ✅ (attendu : `null` = fiche pilote) |

> Lecture : sur les 2 profils réels (dont le compte QA), une ligne est riche (V2, la plupart des champs remplis) et l'autre est minimale (ancienne, seulement summary/summary_chips/sections). `modes`, `territory`, `universe` ne sont peuplés sur AUCUNE des 2 lignes en base à ce jour — le podium et le radar de la fiche sont, eux, recalculés à la volée depuis `my_profile.attention_reception` (donc indépendants de ces colonnes).
