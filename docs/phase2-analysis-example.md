# B.2.1 — Phase 2 : exemple d'analyse enrichie (avant/après)

Profil test « Estelle » (personnage V4 des maquettes) :
- Genre : féminin
- Attention : réception dominante MOT + CAD_C + GES · expression MOT + SER
- Tempérament : sociable modéré, planifie, nuancée, réservée, attentive détails (élevé), raffinement, ponctuelle
- Conflit : temporisateur
- Lifestyle : foodie +40, esthétique +20, expérience>objet -30 (préfère objets), aventure/confort +50 (confort), authenticité +40 (auth)
- Filtres : antiSurprisePublique=true, antiSurprisePlanning=false, besoinÉcoute=true, besoinProfondeur=true
- Singularité :
  - adore_faire = "poterie le weekend, longues balades en forêt, cuisiner pour les amis"
  - evite_deteste = "les soirées bruyantes en grand groupe et les jeux de société"
  - sujets_stimulants = "art contemporain, voyages, récits de vie"
  - peu_savent = "je fais de la céramique depuis 3 ans"
  - plus_beau_cadeau = "un carnet manuscrit avec des mots que j'avais dits sans y penser"
  - detail_compris = "qu'on retienne un détail que j'ai glissé sans y penser"
  - marques_lieux = "Aesop, Le Bon Marché, la papeterie japonaise Itoya"
  - cadeaux_non = "bougies, fleurs coupées, bons d'achat"
  - envies_reves = "apprendre la reliure, partir au Japon en automne"
  - remarquer = "ma patience"
  - sentir_special = "qu'on prépare quelque chose rien que pour moi"
  - q17Text = "les surprises devant tout le monde me font horreur, je préfère être prévenue"
- Pratique :
  - allergies = ["fruits_a_coque"]
  - regime = "omnivore", alcool = "occasionnel"
  - mobilite_sante = "genou fragile, éviter les longues randonnées"
  - taille_vetements = "38", taille_chaussures = "39"
  - parfums = ["boise", "discret"]
  - odeurs_detestees = "gourmand sucré entêtant, patchouli"
  - couleurs_matieres = "tons terreux, lin et laine, rien de criard, matières nobles"
  - dates_importantes = 3 dates
- Interests : cuisine (rank 1), art (rank 2), lecture (rank 3, genres = ["Romans","Poésie"])

---

## AVANT — sortie moteur v2.0 (état pré-Phase 2)

```json
{
  "summary": "Tu sembles quelqu'un pour qui les mots sincères et les cadeaux pensés comptent particulièrement.",
  "summary_third_person": "Elle semble sensible aux mots sincères et aux cadeaux pensés.",
  "summary_chips": ["mots sincères", "cadeaux pensés", "petites attentions", "authentique"],
  "sections": {
    "attention":    { "text": "Tu reçois l'attention surtout par les mots et les cadeaux ciblés.", "chips": ["mots", "cadeaux ciblés", "gestes discrets"] },
    "what_touches": { "text": "Un mot juste, un cadeau qui prouve qu'on a écouté.", "chips": ["détails retenus", "sincérité", "écoute"] },
    "feels_loved":  { "text": "", "chips": [] },
    "gifts":        { "text": "Les cadeaux qui te parlent sont ceux choisis avec précision, jamais génériques.", "chips": ["personnalisé", "qualité", "papeterie"] },
    "avoid":        { "text": "Les surprises publiques et les cadeaux impersonnels.", "chips": ["surprises publiques", "bougies", "bons d'achat"] },
    "style":        { "text": "", "chips": [] },
    "brands":       { "text": "Aesop, Le Bon Marché, la papeterie japonaise Itoya", "chips": [] },   ← FUITE BRUTE FALLBACK
    "restaurants":  { "text": "", "chips": [] },
    "travel":       { "text": "", "chips": [] },
    "hobbies":      { "text": "poterie le weekend, longues balades en forêt, cuisiner pour les amis", "chips": [] },   ← FUITE BRUTE FALLBACK
    "attention_dna":{ "text": "Reçoit : mots, cadeaux ciblés, gestes.", "chips": [] }
  },
  "must_haves": ["mots sincères", "cadeaux pensés", "détails retenus"],
  "deal_breakers": ["surprises publiques", "bougies", "bons d'achat"],
  "attention_dna": [{"dimension":"MOT","intensity":80,"note":""},{"dimension":"CAD_C","intensity":65,"note":""}],
  "constraints": ["fruits à coque"],
  "entities": { "brands":["Aesop","Le Bon Marché","Itoya"], "places":[], "hobbies":["poterie"], "events":[] },
  "confidence": 0.85
}
```

**Manques observés dans le AVANT** :
- Pas de `insights` (rien pour "Ce que Candice a compris")
- Pas de `sections.parfums`
- Pas de `sections.points_fixes` (peu_savent, sentir_special, sujets_stimulants, envies_reves, remarquer, evite_deteste → invisibles)
- Pas de `modes` complets (seul `conflit=temporisateur` via my_profile, stress/decision/canal absents)
- Pas de `style_radar` pour l'heptagone maquette
- `sections.style` VIDE alors que `couleurs_matieres` est riche
- `sections.avoid` ne mentionne pas le ton du q17 ("me font horreur")
- `sections.parfums` inexistant alors que 2 chips + 1 phrase possible
- `sections.restaurants/travel/hobbies/style` chips VIDES ("chips": [])
- `entities.brands` reprend le brut sans contexte
- Fuite fallback : `brands.text = "Aesop, Le Bon Marché, la papeterie japonaise Itoya"` = citation verbatim de `marques_lieux`
- Fuite fallback : `hobbies.text = "poterie le weekend, longues balades en forêt, cuisiner pour les amis"` = citation verbatim de `adore_faire`

---

## APRÈS — sortie moteur v2.1 attendue (post-Phase 2)

```json
{
  "summary": "Tu sembles quelqu'un pour qui les détails ne sont jamais anodins — un mot choisi, une preuve qu'on t'a écoutée.",
  "summary_third_person": "Elle semble quelqu'un pour qui les détails ne sont jamais anodins — un mot choisi, une preuve qu'on l'a écoutée.",
  "summary_chips": ["précise", "sensible aux détails", "authentique", "discrète en public"],
  "insights": [
    "Tu es touchée par les détails retenus, pas par la valeur du geste.",
    "Tu n'aimes pas le générique — l'intention prime sur le prix.",
    "Tu préfères qu'on se donne du mal plutôt qu'un grand geste approximatif."
  ],
  "sections": {
    "attention":    { "text": "Tu reçois l'attention surtout par les mots sincères et les cadeaux pensés — la preuve qu'on t'a écoutée compte plus que la valeur.", "chips": ["mots choisis", "cadeaux ciblés", "gestes discrets"] },
    "what_touches": { "text": "Sentir qu'on s'est souvenu de toi — un détail dit, du soin dans l'exécution.", "chips": ["détails retenus", "sincérité", "soin"] },
    "feels_loved":  { "text": "", "chips": [] },
    "gifts":        { "text": "Le concret bien choisi, avec une trace d'attention personnelle. Le carnet manuscrit reste ton étalon.", "chips": ["objet utile & pensé", "papeterie", "personnalisé"] },
    "avoid":        { "text": "Le générique, l'impersonnel, qu'on en fasse trop en public, et les imprévus de dernière minute qui te bousculent.", "chips": ["surprises publiques", "bons d'achat", "bruit en groupe"] },
    "style":        { "text": "Des couleurs sourdes, des matières naturelles, rien de criard.", "chips": ["tons terreux", "lin & laine", "déteste : néon"] },
    "brands":       { "text": "Un univers doux et exigeant — cosmétique minimaliste et papeterie japonaise.", "chips": [] },
    "restaurants":  { "text": "Curieuse en gastronomie, tu aimes les lieux authentiques plus que le tape-à-l'œil.", "chips": ["gastronomie", "bar à vin", "bistrot de quartier"] },
    "travel":       { "text": "Plutôt confort qu'aventure, tu cherches le sens et la culture d'un lieu.", "chips": ["city break culturel", "hôtel de charme"] },
    "hobbies":      { "text": "Ce qui t'anime et nourrit ton univers au quotidien.", "chips": ["céramique", "lecture", "cuisine pour les proches", "balades forêt"] },
    "parfums":      { "text": "Tu aimes le boisé et le discret — fuis le sucré entêtant.", "chips": ["boisé", "discret", "déteste : gourmand"] },
    "points_fixes": { "text": "« On me connaît vraiment quand on adapte sans que je demande. »", "chips": ["déteste le bruit", "peur du démonstratif", "sujets : art, voyage", "rêve : reliure", "fière de sa patience"] },
    "attention_dna":{ "text": "Reçoit : mots justes, cadeaux ciblés, gestes discrets. Donne : mots, aide concrète.", "chips": ["MOT+CAD_C", "contraste réception/expression"] }
  },
  "modes": {
    "conflit":  "temporise",
    "stress":   "se replie",
    "decision": "réfléchie",
    "canal":    "message écrit"
  },
  "must_haves": ["un détail personnel", "de l'anticipation", "un cadre discret"],
  "deal_breakers": ["surprises publiques", "cadeaux impersonnels", "les lieux bondés"],
  "attention_dna": [
    {"dimension":"MOT","intensity":85,"note":"les mots choisis restent longtemps"},
    {"dimension":"CAD_C","intensity":70,"note":"cadeaux ciblés — jamais génériques"},
    {"dimension":"GES","intensity":55,"note":"les micro-attentions comptent"}
  ],
  "constraints": ["fruits à coque", "genou fragile — pas de longues marches"],
  "entities": {
    "brands": ["Aesop", "Le Bon Marché", "Itoya"],
    "places": [],
    "hobbies": ["céramique", "lecture", "cuisine"],
    "events": ["automne au Japon"]
  },
  "confidence": 0.9
}
```

**+ champ additionnel calculé côté synthesis (déterministe, indépendant de Claude)** :

```json
"style_radar": {
  "precision":  78,
  "emotion":    62,
  "surprise":   28,
  "esthetique": 66,
  "utilite":    42,
  "temps":      54,
  "discretion": 64
}
```

---

## Ce que la Phase 2 apporte concrètement

| Domaine | AVANT | APRÈS |
|---|---|---|
| **Fuites brutes prompt** | 5 (q17, mobilite_sante texte, odeurs_detestees, couleurs_matieres, interests.freeText) | 0 |
| **Fuites brutes fallback** | 2 (brands.text = marques_lieux verbatim, hobbies.text = adore_faire verbatim) | 0 |
| **Sections `profile_analysis.sections`** | 11 clés | 13 clés (+ parfums, + points_fixes) |
| **Insights "Ce que Candice a compris"** | ❌ absent | ✅ 3 phrases produites |
| **Modes tempérament** | ⚠ conflit seulement | ✅ 4 modes (conflit + stress + decision + canal) via Sonnet |
| **Radar 7 axes** | ❌ absent | ✅ calculé côté synthesis (déterministe) |
| **Chips peuplés partout** | ⚠ 5 sections avec `chips: []` (style, brands, restaurants, travel, hobbies) | ✅ chips demandés à Claude sur toutes les sections pertinentes |
| **Questions ouvertes exploitées** | 11/16 | 16/16 (les 5 fuites corrigées + interests structuré) |
| **Nuance émotionnelle q17** | ❌ perdue (seuls les booléens antiSurprise) | ✅ texte brut envoyé à Claude en complément |
| **Section `parfums`** | ❌ inexistante | ✅ 1 phrase + 2-3 chips (dont warm "déteste : X") |
| **Section `points_fixes`** | ❌ inexistante | ✅ paraphrase italique + 5 chips fusionnant peu_savent/sentir_special/sujets/rêves/remarquer/evite_deteste |

---

## Fidélité maquette

Le APRÈS ci-dessus produit exactement la matière nécessaire à la maquette validée :
- `summary` → lead serif
- `summary_chips` → topchips
- `sections.attention_dna` → carte "Ce qui te touche"
- `insights` → 3 cards `insight` "Ce que Candice a compris"
- `sections.gifts`, `restaurants`, `travel`, `hobbies` → 4 cards "Ce qui te fait vibrer"
- `sections.brands`, `style`, `parfums`, `points_fixes`, `avoid` → 5 cards "Ton univers"
- `modes` → 4 modes pills tempérament
- `style_radar` → heptagone SVG 7 axes
- `must_haves`, `deal_breakers` → tags / à-savoir
