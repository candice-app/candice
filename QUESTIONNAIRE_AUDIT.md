# QUESTIONNAIRE_AUDIT.md
> État des lieux exact et exhaustif — basé sur lecture du code source
> Projet : Candice / Next.js 16 / Supabase / Anthropic Claude

---

## 1. Questionnaire Pilote (Ma fiche)

**Fichier principal :** `src/components/questionnaire/SelfProfileForm.tsx`

### Structure globale

- **36+ questions** réparties en 4 sections
- **Sauvegarde automatique :** localStorage uniquement, onChange avec debounce 300 ms (clé `candice_draft` ou équivalent). Jamais de commit en base jusqu'au submit final.
- **Reprise après abandon :** Au montage du composant, si le profil Supabase est absent (`initial === null`), le draft localStorage est restauré (parse JSON, conversion arrays/strings).
- **Statut affiché :** "Brouillon sauvegardé" si `draftSavedAt` est récent.
- **Bouton sticky :** "💾 Sauvegarder et revenir plus tard" — bas-droite du viewport.

---

### Section 1 — "Qui es-tu ?" (12 questions psychologiques)

Toutes en **MultiSelect (3 réponses maximum, ordonnées par importance)**.  
Stockage en base : chaîne de caractères avec virgules (`"words,acts,time"`).

| Ordre | Libellé exact | Clé DB (`my_profile`) | Options | Obligatoire |
|-------|--------------|----------------------|---------|-------------|
| 1 | Je me sens le plus aimé(e) quand… | `love_language` | `words`, `acts`, `gifts`, `time`, `touch` | Oui |
| 2 | Pour communiquer, je préfère… | `communication_style` | `direct`, `emotional`, `analytical`, `casual` | Oui |
| 3 | Quand je suis stressé(e), j'ai tendance à… | `stress_response` | `withdraws`, `seeks_support`, `action_oriented`, `internalizes` | Oui |
| 4 | Mon énergie sociale… | `social_energy` | `very_introverted`, `introverted`, `ambivert`, `extroverted`, `very_extroverted` | Oui |
| 5 | Ce qui me touche vraiment, c'est quand… | `appreciation_style` | `verbal`, `practical`, `gifts`, `time`, `physical` | Oui |
| 6 | Face à un désaccord, je… | `conflict_resolution` | `direct`, `processes_first`, `avoids`, `humor` | Oui |
| 7 | Pour mes grandes décisions, je… | `decision_making` | `logic`, `intuition`, `consensus`, `research` | Oui |
| 8 | J'exprime mes émotions… | `emotional_expression` | `openly`, `selectively`, `through_actions`, `rarely` | Oui |
| 9 | Dans une relation, ce qui compte le plus pour moi… | `core_values` | `loyalty`, `growth`, `fun`, `stability` | Oui |
| 10 | Quand je réussis quelque chose, je préfère… | `recognition_preference` | `public`, `private`, `personal`, `celebrate` | Oui |
| 11 | Ce dont j'ai le plus besoin… | `boundaries` | `space`, `emotional`, `time`, `privacy` | Oui |
| 12 | Pour grandir, j'aime surtout… | `growth_mindset` | `experiences`, `structured`, `reflective`, `community` | Oui |

**Logique conditionnelle :** Aucune dans cette section. Toutes les questions sont toujours affichées.

---

### Section 2 — "Tes préférences" (15 questions)

| Ordre | Libellé exact | Clé DB | Type | Obligatoire |
|-------|--------------|--------|------|-------------|
| 13 | Ce que j'adore faire | `hobbies` | Textarea (2 lignes) | Non |
| 14 | Ce que j'évite ou déteste | `disliked_activities` | Textarea (2 lignes) | Non |
| 15 | Ce que j'adore manger | `favorite_foods` | Textarea (2 lignes) | Non |
| 16 | Ce que je déteste manger | `disliked_foods` | Textarea (2 lignes) | Non |
| 17 | Pour les cadeaux, je préfère… | `gift_preference` | MultiSelect (max 3) : `experiences`, `physical`, `both` | Non |
| 18 | Quand quelqu'un m'invite ou m'offre quelque chose… | `standing` | MultiSelect (max 3) : `any_sincere`, `well_chosen`, `quality`, `high_standards`, `no_preference` | Non |
| 19 | Ma relation à la nourriture et aux restaurants | `gastronomy` | MultiSelect (max 3) : `anywhere`, `gourmet`, `fine_dining`, `passion`, `functional` | Non |
| 20 | Si on m'offre un week-end, ce qui compte le plus… | `accommodation` | MultiSelect (max 3) : `destination_only`, `comfortable`, `charming`, `luxury`, `together` | Non |
| 21 | Pour les cadeaux matériels, ce qui me touche le plus | `gift_style` | MultiSelect (max 3) : `useful`, `listened`, `beautiful`, `valuable`, `experiences` | Non |
| 22 | Je suis tactile… | `tactility` | Radio (1 seul choix) : `everyone`, `partner_only`, `children_only`, `close_ones`, `not_at_all` | Non |
| 23 | Les sujets qui me stimulent vraiment | `conversation_topics` | Textarea (2 lignes) | Non |
| 24 | Ce qu'il vaut mieux éviter avec moi | `things_to_avoid` | Textarea (2 lignes) | Non |
| 25 | La meilleure façon de me contacter | `best_contact_method` | MultiSelect (max 3) : `text`, `call`, `email`, `in_person` | Non |
| 26 | Mes dates importantes | `important_dates` | JSON array : `[{"label": "Anniversaire", "date": "1990-05-15", "isCustom": false}]` | Non |
| — | (Préférences de qualité cadeaux — intégrées aux questions 17-21) | — | — | — |

---

### Section 3 — "Pour aller plus loin" (5 questions guidées)

| Ordre | Libellé exact | Clé DB | Type | Obligatoire |
|-------|--------------|--------|------|-------------|
| 27 | Ma santé & confort | `health_comfort` | Textarea (2 lignes) | Non |
| 28 | Ma famille & vie perso | `family_life` | Textarea (2 lignes) | Non |
| 29 | Mon caractère & émotions | `character_emotions` | Textarea (2 lignes) | Non |
| 30 | Ce que je ne supporte pas | `cannot_stand` | Textarea (2 lignes) | Non |
| 31 | Ce que peu de gens savent sur moi | `few_know` | Textarea (3 lignes) | Non |

---

### Section 4 — "Infos pratiques" (9 questions)

| Ordre | Libellé exact | Clé DB | Type | Options / Format | Obligatoire |
|-------|--------------|--------|------|-----------------|-------------|
| 32 | Taille vêtements | `clothing_size` | Radio | `XS`, `S`, `M`, `L`, `XL`, `XXL` | Non |
| 33 | Pointure chaussures | `shoe_size` | Number input | min 28, max 50 | Non |
| 34 | Taille bague | `ring_size` | Texte libre | ex. "54, 56" | Non |
| 35 | Taille pantalon | `pants_size` | Texte libre | ex. "36/32, Slim 34" | Non |
| 36 | Allergies alimentaires | `food_allergies` | MultiSelect (max 6) | `aucune`, `gluten`, `lactose`, `noix`, `fruits_mer`, `autre` | Non |
| — | Régime alimentaire | `diet` | MultiSelect (max 4) | `omnivore`, `vegetarian`, `vegan`, `halal`, `kosher`, `no_preference` | Non |
| — | Animaux de compagnie | `pets` | Texte libre | ex. "un chat roux, deux chiens" | Non |
| — | Religion & convictions | `religion` | Textarea | Texte libre | Non |
| — | Situation de handicap | `disability` | Textarea | Texte libre | Non |
| — | Adresse postale | `postal_address` | Textarea | ex. "12 rue de la Paix, 75001 Paris" | Non |

**Remarque :** Les questions marquées `—` à l'ordre ne sont pas comptabilisées dans le score de complétion affiché à l'utilisateur.

---

### Barre de progression (questionnaire pilote)

- **Calcul :** `(answeredCount / 36) × 100`
- **Affichage :** Sticky en haut du formulaire, toujours visible
- **Messages motivationnels dynamiques :**
  - 0 % → `"C'est parti ! Plus ta fiche est complète, plus les attentions seront personnalisées."`
  - < 25 % → `"Bien ! Continue — chaque réponse affine ton profil."`
  - < 50 % → `"À mi-chemin ! Plus que quelques questions avant de découvrir ton profil."`
  - < 75 % → `"Tu y es presque — les meilleures suggestions arrivent avec une fiche complète."`
  - 100 % → `"Dernière ligne droite. Une fiche complète, c'est les meilleures attentions pour toi."`

---

### Message de confidentialité (texte exact)

Fichier : `src/components/questionnaire/SelfProfileForm.tsx` (lignes ~420–428)

```
🔒 Tes réponses ne seront jamais lues par tes proches.
Candice les analyse en silence pour comprendre qui tu es vraiment — jamais tes mots exacts ne seront partagés.

Plus ta fiche est honnête, plus les attentions que tu recevras seront justes.
```

---

## 2. Questionnaire Proche

**Fichier principal :** `src/app/profil-partage/[token]/` (page + SharedProfileFlow.tsx + SharedForm.tsx)

### Mécanisme d'invitation

- **Génération du lien :** UUID aléatoire stocké dans la table `share_links`. URL résultante : `candice.app/profil-partage/{token}`
- **Table DB :** `share_links` (voir section 6)
- **Partage simple (second flux) :** L'utilisateur peut aussi partager directement son profil public via `candice.app/partage/{user_id}` (vue en lecture seule)
- **Expiration :** Champ `expires_at` présent en DB mais optionnel (peut être `null` → lien permanent)
- **Vérification côté serveur :** `src/app/profil-partage/[token]/page.tsx` (ligne ~35) — vérifie que le token existe et n'est pas expiré avant d'afficher le formulaire

### Flux UX du proche

1. **Landing screen** — Introduction bienveillante + deux CTA :
   - `"Je réponds par écrit"` → passe au formulaire
   - `"💬 Je préfère en discuter"` → toast "Mode conversation bientôt disponible !" (non implémenté)
2. **Account screen** — Incitation à créer un compte gratuit (4 bénéfices listés) + option `"Continuer sans compte"`
3. **Form screen** — Identique à SelfProfileForm (36 mêmes questions, même structure, même ordre)
4. **Done screen** — `"Merci ✓"` + option de créer un compte pour voir son propre profil

### Différences avec le questionnaire Pilote

| Aspect | Pilote (Ma fiche) | Proche |
|--------|-------------------|--------|
| Authentification requise | Oui | Non (optionnelle) |
| Table de stockage | `my_profile` | `shared_profile_responses` |
| Clé de draft localStorage | `candice_draft` | `candice_shared_draft_{token}` |
| Post-submit | Mise à jour profil user | Email notif au sender + 500 pts bonus |
| Mode conversationnel | Non implémenté | Non implémenté |

### Message de confidentialité — questionnaire proche (texte exact)

Fichier : `src/app/profil-partage/[token]/SharedProfileFlow.tsx` (lignes ~70–76)

```
🔒 Tes réponses restent 100% confidentielles

{senderName} ne lira jamais tes réponses. Candice les analyse en silence pour personnaliser les attentions — jamais tes mots exacts ne seront partagés.
```

---

## 3. Flux UX du questionnaire

### Sauvegarde automatique

- **Déclenchement :** onChange sur chaque champ (debounce 300 ms)
- **Destination :** localStorage uniquement (jamais un appel API avant le submit)
- **Format :** JSON stringifié de l'état complet du formulaire
- **Affichage :** Indicateur "Brouillon sauvegardé" quand `draftSavedAt` est récent
- **Persistance en base :** Uniquement au clic sur "Sauvegarder et revenir plus tard" (sticky bottom-right) ou au submit final

### Reprise après abandon

1. Au montage du composant, si `initial === null` (pas de profil Supabase existant)
2. Tentative de lecture du draft localStorage
3. Si succès : parse JSON, conversion types (arrays ↔ strings), restore de tous les champs
4. Si échec (JSON invalide) : démarrage avec formulaire vide

### Mode oral / conversationnel

**Statut : NON IMPLÉMENTÉ**

- Bouton affiché dans SharedProfileFlow.tsx
- Au clic : appel de `showComingSoonToast()` → toast "Mode conversation bientôt disponible !" (3 secondes)
- Aucun backend associé

### Messages de confidentialité — récapitulatif des emplacements

| Emplacement | Fichier | Texte |
|-------------|---------|-------|
| Questionnaire pilote | `SelfProfileForm.tsx` ~l.420 | "🔒 Tes réponses ne seront jamais lues par tes proches…" |
| Questionnaire proche | `SharedProfileFlow.tsx` ~l.70 | "🔒 Tes réponses restent 100% confidentielles…" |

---

## 4. Analyse Candice générée

Cinq endpoints distincts appellent le modèle Anthropic `claude-sonnet-4-6`.

---

### 4.1 Analyse de compatibilité

**Fichier :** `src/app/api/analyse/route.ts`  
**Méthode :** POST  
**Déclenchement :** Clic sur "Analyser" dans `MatchingCard.tsx` (page contact)  
**Input :** `{ contactId: string }`

**Prompt complet :**
```
Tu es un expert en psychologie relationnelle. Analyse la compatibilité entre deux personnes et génère des conseils actionnables.

[Profil utilisateur détaillé avec les 12 champs psychologiques + préférences]

[Profil proche détaillé avec les 12 champs psychologiques + préférences]

Génère une analyse relationnelle complète. Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après :

{
  "compatibility_score": <entier entre 0 et 100>,
  "shared_points": ["<point commun 1>", "<point commun 2>", "<point commun 3>"],
  "difference_zones": [
    { "emoji": "<emoji>", "title": "<titre court>", "description": "<explication actionnable 1-2 phrases>" },
    { "emoji": "<emoji>", "title": "<titre court>", "description": "<explication actionnable 1-2 phrases>" }
  ],
  "communication_tips": ["<conseil 1>", "<conseil 2>", "<conseil 3>"],
  "top_things_to_do": ["<action concrète 1>", "<action concrète 2>", "<action concrète 3>"],
  "things_to_avoid": ["<à éviter 1>", "<à éviter 2>"]
}

Tout en français. Sois concret, bienveillant et actionnable. Le score doit refléter l'alignement réel des valeurs et styles.
```

**Modèle :** `claude-sonnet-4-6` | **Max tokens :** 1 200  
**Format de sortie :** JSON — interface `AnalysisResult` (`src/types/index.ts`)  
**Stockage :** Non persisté en base. Retourné au client uniquement.  
**Affichage :** `MatchingCard.tsx` — score (0–100), 1 point commun (`shared_points[0]`), 1 zone friction (`difference_zones[0]`)

---

### 4.2 Suggestions générales (6 suggestions par contact)

**Fichier :** `src/app/api/suggestions/route.ts`  
**Méthode :** POST  
**Déclenchement :** Automatiquement au chargement du dashboard pour chaque contact avec un profil complet  
**Input :** `{ contactId: string }`

**Prompt complet :**
```
Tu es un conseiller en relations humaines, aidant quelqu'un à montrer une attention sincère et significative à une personne qui lui est chère.

Voici le profil complet de [NOM] ([RELATION]) :

[Profil humanisé avec tous les champs remplis]
[CONTRAINTES DE QUALITÉ si applicable selon standing/gastronomy/accommodation/gift_style]

Génère 6 suggestions d'attention hautement personnalisées pour cette personne. Chaque suggestion doit sembler entièrement sur-mesure — jamais générique. Respecte scrupuleusement les contraintes de qualité ci-dessus si elles sont présentes.

Réponds avec un tableau JSON de exactement 6 objets :
[
  {
    "title": "Titre court de l'action (max 8 mots)",
    "description": "Explication chaleureuse et spécifique expliquant pourquoi cela lui correspond (2-3 phrases)",
    "category": "quality_time" | "gift" | "message" | "gesture" | "activity",
    "timing": "Quand / à quelle fréquence (ex. 'La semaine prochaine', 'Chaque mois', 'Quand il/elle semble stressé(e)')"
  }
]

Toutes les valeurs en français. Suggestions concrètes, actionnables, profondément personnelles. Varie les catégories.
```

**Contraintes de qualité dynamiques injectées dans le prompt :**

| Champ | Valeur | Contrainte injectée |
|-------|--------|---------------------|
| `standing` | `high_standards` | "Uniquement établissements notés 4,5/5+ sur Google. Aucune chaîne, adresses indépendantes." |
| `gastronomy` | `passion` | "Tables gastronomiques ou bistrots de référence uniquement. Chefs reconnus, guides (Michelin, Le Fooding)." |
| `accommodation` | `luxury` | "Uniquement 5 étoiles officiels, palaces. Rien en dessous." |
| `gift_style` | `valuable` | "Objets de valeur durable — bijoux, montres, maroquinerie de qualité." |

**Modèle :** `claude-sonnet-4-6` | **Max tokens :** 1 500  
**Format de sortie :** JSON array de 6 objets  
**Stockage :** Upsert dans la table `suggestions` (contact_id, user_id, content JSONB, generated_at)  
**Affichage :** `SuggestionsPanel.tsx` — 6 cartes avec catégorie, timing, description

---

### 4.3 Suggestions contextuelles (3 idées par occasion/budget)

**Fichier :** `src/app/api/idea-suggestions/route.ts`  
**Méthode :** POST  
**Déclenchement :** Clic sur "Voir des idées" depuis la CandiceInput ou ouverture de l'IdeaModal avec occasion + budget  
**Input :** `{ contactId: string, occasion: string, budget: string }`

**Prompt complet :**
```
Tu es un conseiller en attentions personnalisées. Aide quelqu'un à trouver une idée parfaite pour un proche.

[Profil du proche humanisé, OU "Profil non encore renseigné"]

Occasion : [OCCASION_LABEL]
Budget : [BUDGET_LABEL]

Génère 3 suggestions d'attention hautement personnalisées, parfaitement adaptées à l'occasion et au budget indiqués. Chaque suggestion doit être concrète, actionnable et unique — jamais générique.

[Si budget_free : contrainte absolue — toutes les suggestions doivent être gratuites]
[Si budget_under_30 : contrainte absolue — toutes les suggestions doivent être sous 30€]
[Si budget_under_80 : contrainte absolue — toutes les suggestions doivent être sous 80€]

Réponds uniquement avec un tableau JSON de 3 objets :
[
  {
    "title": "Titre court (max 7 mots)",
    "description": "Description chaleureuse et personnalisée expliquant pourquoi cette idée est parfaite pour cette personne et cette occasion (2-3 phrases)",
    "category": "quality_time" | "gift" | "message" | "gesture" | "activity",
    "estimated_price": "Gratuit" | "X€" | "X-Y€",
    "why": "Une phrase expliquant le lien avec son profil"
  }
]

Toutes les valeurs en français. Varie les catégories.
```

**Valeurs d'occasions disponibles :** `birthday`, `no_reason`, `reconciliation`, `congratulations`, `return_trip`, `illness`, `other`  
**Valeurs de budgets disponibles :** `free`, `under_30`, `under_80`, `over_80`  
**Modèle :** `claude-sonnet-4-6` | **Max tokens :** 1 200  
**Format de sortie :** JSON array de 3 objets  
**Stockage :** Non persisté. Retourné au client uniquement.  
**Affichage :** `IdeaModal.tsx` — 3 cartes filtrées par occasion/budget

---

### 4.4 Note intelligente (NER — reconnaissance d'entités nommées)

**Fichier :** `src/app/api/candice-note/route.ts`  
**Méthode :** POST  
**Déclenchement :** Saisie dans "Dis quelque chose à Candice…" (CandiceInput)  
**Input :** `{ note: string }`

**Prompt complet :**
```
Tu es Candice. L'utilisateur te dit : "[NOTE_TEXT]"

Proches disponibles : [CONTACT_LIST avec uuid et prénom]

Identifie si un proche est mentionné (par prénom, surnom, lien). Réponds UNIQUEMENT avec ce JSON (pas de texte avant/après) :
{"contact_id": "uuid ou null", "contact_name": "prénom ou null", "response": "Noté. Je pense à [prénom]." ou "Noté. Je m'en souviens."}
```

**Modèle :** `claude-sonnet-4-6` | **Max tokens :** 300  
**Format de sortie :** JSON `{ contact_id, contact_name, response }`  
**Stockage :** Insertion dans `profile_notes` (user_id, contact_id nullable, note, created_at)  
**Affichage :** Toast doré avec la réponse de Candice. Si un contact est identifié → bouton "Voir des idées pour {name}" apparaît.

---

### 4.5 Insight temps réel (pendant le questionnaire)

**Fichier :** `src/app/api/questionnaire-insight/route.ts`  
**Méthode :** POST  
**Déclenchement :** À la fin de chaque section du questionnaire, lors du remplissage  
**Input :** `{ answers: object, persona: "self" | "contact", contactName?: string }`

**Prompt complet :**
```
Tu es un expert en psychologie relationnelle. Tu analyses les réponses partielles d'un questionnaire de personnalité.

Réponses renseignées jusqu'ici :
[Réponses humanisées avec labels]

[Si persona "self" : "Génère une observation factuelle sur cette personne selon ses réponses."]
[Si persona "contact" : "Génère une observation sur {contactName} selon ses réponses."]

Règles strictes :
- 1 ou 2 phrases maximum, factuel, pas de spéculation émotionnelle
- Commence par "Tu sembles..." ou "{Name} semble..." ou "D'après tes réponses..."
- Parle de comportements observables, pas d'émotions supposées
- Réponds uniquement avec le texte de l'insight, sans guillemets ni ponctuation d'encadrement

Exemples :
"Tu sembles exprimer ton affection par des gestes concrets plutôt que par les mots."
"Tu as tendance à traiter les conflits en prenant d'abord du recul."
"Tu sembles très sensible à la qualité du temps partagé."
```

**Modèle :** `claude-sonnet-4-6` | **Max tokens :** 120  
**Format de sortie :** Texte brut (1–2 phrases)  
**Stockage :** Non persisté. Affiché à l'écran uniquement.  
**Affichage :** `InsightCard.tsx` — texte en italique au-dessus des champs complétés dans le formulaire

---

## 5. Section "Matching relationnel"

**Existe : OUI**

**Composant :** `src/app/contacts/[id]/MatchingCard.tsx`  
**Accès :** Page contact individuel → onglet ou section "Compatibilité"

### Fonctionnement

1. Bouton "Analyser" → `POST /api/analyse` avec `{ contactId }`
2. Réponse : objet `AnalysisResult` (voir 4.1)
3. Affichage :
   - **Score numérique** (0–100) avec barre de progression colorée
   - **Interprétation textuelle :**
     - ≥ 80 → "Excellente affinité"
     - ≥ 60 → "Bonne compatibilité"
     - ≥ 40 → "Complémentaires"
     - < 40 → "Contrastés"
   - **1 point commun** (`shared_points[0]`)
   - **1 zone de friction** (`difference_zones[0]` — avec emoji + description)
   - Bouton "Actualiser" pour regénérer

**Limitation actuelle :** Claude génère 3 points communs et 2 zones de friction, mais seul le premier de chaque liste est affiché (lignes ~89–90 de MatchingCard.tsx).

---

## 6. Base de données complète

**Fichiers sources :** `supabase-schema.sql` (principal) + `supabase-migration-2.sql` (ajouts)

---

### Table `contacts`

```sql
CREATE TABLE contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  relationship TEXT CHECK (relationship IN ('partner','friend','family','colleague','other')),
  email       TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  photo_url   TEXT,                          -- ajout migration-2
  gift_wishlist JSONB DEFAULT '[]'::jsonb    -- ajout migration-2
);
```

**Remarque :** `archived_at TIMESTAMPTZ` est utilisé dans le code (`.is("archived_at", null)`) mais absent du schéma SQL observé — incohérence signalée en section "POINTS À CLARIFIER".

---

### Table `my_profile`

```sql
CREATE TABLE my_profile (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) UNIQUE ON DELETE CASCADE,

  -- 12 champs psychologiques (TEXT, valeurs séparées par virgules)
  love_language        TEXT,
  communication_style  TEXT,
  stress_response      TEXT,
  social_energy        TEXT,
  appreciation_style   TEXT,
  conflict_resolution  TEXT,
  decision_making      TEXT,
  emotional_expression TEXT,
  core_values          TEXT,
  recognition_preference TEXT,
  boundaries           TEXT,
  growth_mindset       TEXT,

  -- Préférences libres
  hobbies              TEXT,
  disliked_activities  TEXT,
  favorite_foods       TEXT,
  disliked_foods       TEXT,
  conversation_topics  TEXT,
  things_to_avoid      TEXT,
  pets                 TEXT,
  religion             TEXT,
  disability           TEXT,
  postal_address       TEXT,
  health_comfort       TEXT,
  family_life          TEXT,
  character_emotions   TEXT,
  cannot_stand         TEXT,
  few_know             TEXT,

  -- Préférences structurées (TEXT ou JSON)
  gift_preference      TEXT,
  standing             TEXT,
  gastronomy           TEXT,
  accommodation        TEXT,
  gift_style           TEXT,
  tactility            TEXT,
  best_contact_method  TEXT,
  important_dates      JSONB,  -- array de {label, date, isCustom}
  additional_notes     TEXT,

  -- Tailles & mesures
  clothing_size        TEXT,
  shoe_size            INTEGER,
  ring_size            TEXT,
  pants_size           TEXT,

  -- Santé & alimentation
  food_allergies       TEXT,
  diet                 TEXT,

  -- Flags
  onboarding_completed BOOLEAN DEFAULT FALSE,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

**Total colonnes :** 44+

---

### Table `questionnaire_responses`

Même structure que `my_profile` (32 champs métier partagés), avec en plus :

```sql
CREATE TABLE questionnaire_responses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- [mêmes 32 champs que my_profile — voir ci-dessus]

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Table `suggestions`

```sql
CREATE TABLE suggestions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content      JSONB NOT NULL,   -- array de {title, description, category, timing}
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Table `share_links`

```sql
CREATE TABLE share_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  sender_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ   -- nullable (null = lien permanent)
);
```

---

### Table `shared_profile_responses`

```sql
CREATE TABLE shared_profile_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- nullable (sans compte)
  response_data JSONB,  -- objet plat {love_language: "...", hobbies: "...", ...}
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token, user_id)
);
```

---

### Table `profile_notes`

```sql
CREATE TABLE profile_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID REFERENCES contacts(id) ON DELETE CASCADE,  -- nullable
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Table `user_points`

```sql
CREATE TABLE user_points (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT,     -- 'registration', 'profile_complete', etc.
  points      INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Row Level Security (RLS) — activé sur toutes les tables

| Policy | Table | Règle |
|--------|-------|-------|
| `users_own_contacts` | `contacts` | `auth.uid() = user_id` |
| `users_own_responses` | `questionnaire_responses` | `auth.uid() = user_id` |
| `users_own_suggestions` | `suggestions` | `auth.uid() = user_id` |
| `users_own_my_profile` | `my_profile` | `auth.uid() = user_id` (SELECT : public) |
| `public_read_share_links` | `share_links` | `true` (lecture publique) |
| `users_manage_share_links` | `share_links` | `auth.uid() = sender_id` |
| `users_own_shared_responses` | `shared_profile_responses` | `auth.uid() = user_id` |
| `users_own_profile_notes` | `profile_notes` | `auth.uid() = user_id` |
| `users_own_points` | `user_points` | `auth.uid() = user_id` |

---

### Système de points (gamification)

**Fichier :** `src/utils/awardPoints.ts`

| Action (`action_type`) | Points |
|------------------------|--------|
| `registration` | 500 |
| `profile_complete` | 500 |
| `profile_update` | 50 |
| `contact_created` | 200 |
| `friend_invited` | 200 |
| `date_added` | 50 |
| `feedback` | 100 |
| `attention_executed` | 100 |
| `shared_profile_complete` | 500 |

---

## 7. Endpoints API existants

**Dossier :** `src/app/api/`

| Endpoint | Méthode | Auth requise | Input (body) | Output | Notes |
|----------|---------|-------------|--------------|--------|-------|
| `/api/profil/submit` | POST | User | `{ contactId, userId, ...responses }` | `{ success: true }` | Upsert `questionnaire_responses` |
| `/api/analyse` | POST | User | `{ contactId }` | `{ analysis: AnalysisResult, contactName }` | Claude, non persisté |
| `/api/suggestions` | POST | User | `{ contactId }` | `{ suggestions: [...] }` | 6 items, upsert `suggestions` |
| `/api/idea-suggestions` | POST | User | `{ contactId, occasion, budget }` | `{ suggestions: [...] }` | 3 items, non persisté |
| `/api/candice-note` | POST | User | `{ note }` | `{ response, contact_id, contact_name }` | NER + insertion `profile_notes` |
| `/api/questionnaire-insight` | POST | Aucune | `{ answers, persona, contactName? }` | `{ insight: string }` | Insight temps réel, non persisté |
| `/api/profile-notes` | POST | User | `{ contact_id, note }` | `{ success: true }` | Insertion directe `profile_notes` |
| `/api/shared-profile/complete` | POST | User | `{ token }` | `{ success, points }` | +500 pts + email notif sender |
| `/api/sharing/respond` | POST | User | `{ requestId, action }` | `{ ok: true }` | ⚠️ Table `profile_share_requests` absente |
| `/api/sharing/revoke` | POST | User | `{ requestId }` | `{ ok: true }` | ⚠️ Même problème |
| `/api/contacts/upload-photo` | POST | User | `FormData` | `{ url }` | Upload photo contact |
| `/api/contacts/archive` | POST | User | `{ contactId }` | `{ success }` | ⚠️ `archived_at` absent du schéma |
| `/api/contacts/unarchive` | POST | User | `{ contactId }` | `{ success }` | ⚠️ Même problème |
| `/api/contacts/delete` | POST | User | `{ contactId }` | `{ success }` | Hard delete |
| `/api/emails/welcome` | POST | Interne | `{ email, variables }` | `{ id }` | Resend |
| `/api/emails/questionnaire-invite` | POST | Interne | `{ email, variables }` | `{ id }` | Resend |
| `/api/emails/reminder` | POST | Interne | `{ email, variables }` | `{ id }` | Resend |
| `/api/emails/profile-complete` | POST | Interne | `{ email, variables }` | `{ id }` | Resend |
| `/api/auth/callback` | GET | OAuth | `?code=...` | redirect | Supabase OAuth |
| `/api/beta-access` | POST | Aucune | `{ email }` | `{ success }` | Liste d'attente beta |

---

## POINTS À CLARIFIER

### 1. ⚠️ Table `profile_share_requests` absente du schéma SQL

**Fichiers concernés :** `src/app/api/sharing/respond/route.ts`, `src/app/api/sharing/revoke/route.ts`  
**Problème :** Ces endpoints requêtent `.from("profile_share_requests")` mais cette table n'existe ni dans `supabase-schema.sql` ni dans `supabase-migration-2.sql`.  
**Impact :** Toute tentative d'appel crasherait (erreur Supabase 404/42P01).  
**Statut probable :** Code mort — ces endpoints ne semblent appelés par aucune page lue.

---

### 2. ⚠️ Colonne `archived_at` absente du schéma `contacts`

**Fichiers concernés :** Code dashboard (`.is("archived_at", null)`), `src/app/api/contacts/archive/route.ts`, `src/app/api/contacts/unarchive/route.ts`  
**Problème :** La colonne `archived_at TIMESTAMPTZ` est référencée partout dans le code mais n'est pas définie dans le schéma SQL observé.  
**Impact :** Le filtre dashboard `.is("archived_at", null)` pourrait retourner des résultats inattendus ou crasher. Les endpoints archive/unarchive sont inopérants.  
**Action requise :** Ajouter `archived_at TIMESTAMPTZ DEFAULT NULL` à la table `contacts` via une migration Supabase.

---

### 3. ⚠️ Affichage partiel de l'analyse de compatibilité

**Fichier :** `src/app/contacts/[id]/MatchingCard.tsx` (lignes ~89–90)  
**Problème :** Claude génère 3 `shared_points` et 2+ `difference_zones`, mais seul `[0]` de chaque est affiché.  
**Impact :** 2/3 des points communs et 1/2 des zones de friction générés sont silencieusement ignorés.  
**Action requise :** Afficher la liste complète ou au moins 2-3 items.

---

### 4. ⚠️ Mode conversationnel — UI présente, backend absent

**Fichier :** `src/app/profil-partage/[token]/SharedProfileFlow.tsx` (ligne ~237)  
**Problème :** Bouton "💬 Je préfère en discuter" affiche un toast mais n'a aucun backend.  
**Impact :** Fonctionnalité promise à l'utilisateur mais non opérationnelle.

---

### 5. 🔍 Partage de profil — deux flux distincts, architecture à clarifier

- **Flux A :** `/partage/{user_id}` → vue publique en lecture seule du profil d'un utilisateur
- **Flux B :** `/profil-partage/{token}` → le proche remplit son propre questionnaire

Ces deux flux sont différents mais leur naming pourrait prêter à confusion. Aucun système de demande de partage réciproque n'existe (pas de flux "A demande à B de voir son profil" avec workflow d'acceptation).

---

### 6. 🔍 Stockage des réponses proches — lisibilité par l'émetteur

**Table :** `shared_profile_responses` → `response_data JSONB`  
**Question :** Les réponses texte libre du proche (notamment les champs textarea) sont stockées en clair dans ce JSONB. L'émetteur qui a accès à sa propre `user_id` peut-il voir ces données via Supabase ? La RLS `users_own_shared_responses` (`auth.uid() = user_id`) protège les données du proche — mais l'accès via le `token` (lien public) est-il contrôlé côté serveur seulement, ou aussi en RLS ?

---

### 7. 🔍 `questionnaire_responses` vs `my_profile` — duplication de schéma

Ces deux tables partagent ~32 champs identiques. La table `my_profile` est pour le pilote (sa propre fiche), `questionnaire_responses` est pour les profils des proches. Il n'existe pas de table unifiée `profiles`. Si un proche s'inscrit après avoir rempli son questionnaire, ses réponses dans `shared_profile_responses` ne sont pas automatiquement migrées vers `my_profile`.

---

*Fin de l'audit — généré par lecture directe du code source.*
