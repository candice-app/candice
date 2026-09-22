# Cartographie — 09. Recommandations

> Ce document décrit **ce qui existe réellement** dans le code autour des recommandations, sans jugement ni conseil.
> Source indiquée partout : `(fichier: …)` ou `(base: …)`. « non vérifié » quand l'information n'a pas pu être établie.
> Statuts : ✅ branché et utilisé · 🟡 partiel · ⚫ code présent mais jamais alimenté/appelé · ❌ absent.
>
> **Volumes réels (base) au moment de la cartographie : TOUTES les tables concernées sont à 0 ligne.** La connexion base (`SUPABASE_DB_URL` de `.env.local`) répond correctement mais renvoie zéro partout — il s'agit d'une base de développement/QA vide, pas de la production. Les volumes de prod ne sont donc **pas** connus ici (non vérifié).

---

## Vue d'ensemble : il y a TROIS systèmes distincts, pas un seul

Le mot « recommandation » recouvre trois briques séparées, qui n'écrivent pas dans les mêmes tables et ne se parlent pas entre elles :

| # | Brique | Fichier moteur | Table écrite | Déclenché par | Statut |
|---|--------|----------------|--------------|---------------|--------|
| (a) | **Moteur reco v1** (idées d'attention sur la fiche proche) | `src/lib/recommendations/engine.ts` | `contact_recommendations` | Bouton « Générer » sur la fiche proche (action manuelle du pilote) | ✅ branché |
| (b) | **Signaux + suggestions proactives** (le cron qui repère les moments) | `src/lib/signals/detector.ts` + `src/lib/signals/generator.ts` | `contextual_signals` puis `proactive_suggestions` | Cron `detect-and-generate` (2×/jour) | ✅ branché |
| (c) | **Espace Proche V2** (mini-app 3 onglets `/proche/[id]`) | *(aucun moteur trouvé)* | `contact_reco_items` | *(rien ne l'alimente)* | ⚫ code mort côté génération |

Les briques (a) et (b) appellent toutes les deux le **même modèle LLM** : `claude-sonnet-4-6`. La brique (c) n'appelle aucun LLM et n'a aucun producteur.

---

## (a) Moteur reco v1 — `src/lib/recommendations/engine.ts` ✅

### Ce qu'il fait, en clair

Sur la fiche d'un proche, le pilote peut cliquer pour « générer » 1 à 3 idées d'attention concrètes (un message, un geste, un cadeau…), chacune rattachée à un « langage d'attention » (les 7 dimensions MOT/SER/CAD_C/CAD_S/EXP/GES/SUR). Le moteur :

1. **Calcule une « kadence »** (`haute` / `moyenne` / `basse`) à partir du registre de relation et du profil (`computeKadenceFromProfile`, fichier: engine.ts lignes 63-94). Le registre prime sur tout : par ex. `très_proche_fluide` → `haute`, `compliquée_fragile` → `basse`.
2. **Détecte un « angle mort »** (`detectBlindSpot`, lignes 98-119) : les dimensions auxquelles le proche est sensible mais que le pilote n'exprime pas spontanément. Verbatim de la note générée : `« {Prénom} est particulièrement sensible à {dims} — c'est là que tu peux avoir le plus d'impact avec de petits efforts. »`
3. **Construit une liste de veto (« filtres durs »)** (`buildVetoList`, lignes 123-152) : alcool, halal, casher, contraintes de mobilité, allergies, anti-surprises, interdits relationnels, etc. Ces mots sont interdits dans les idées.
4. **Assemble un contexte texte** riche (`buildContextString`, lignes 197-310) : registre, langages d'attention, caractéristiques relationnelles, singularité (ce qu'il adore, ses rêves, marques/lieux), profil classique, centres d'intérêt, dates importantes, contexte récent, **historique de feedback** (attentions « à côté » = soft veto, « justes » = à favoriser, « pas le moment » = ajuster la cadence), et « déjà proposé récemment » (anti-répétition).
5. **Appelle le LLM**, filtre les idées qui violeraient un veto (`passesVeto`), marque celles qui touchent un angle mort.
6. **Repli déterministe** (`buildFallbackIdeas`, lignes 161-184) : si le LLM échoue ou ne renvoie rien d'exploitable, une idée générique unique est fabriquée sans IA (basée sur la dimension dominante).

### Modèle LLM

- **Modèle : `claude-sonnet-4-6`** (fichier: engine.ts ligne 355)
- **max_tokens : 900**
- SDK : `@anthropic-ai/sdk`, clé `process.env.ANTHROPIC_API_KEY`

### Prompt système — VERBATIM (fichier: engine.ts lignes 314-335)

```
Tu es Candice, un copilote relationnel premium. Tu génères des recommandations d'attention adaptées à chaque proche — jamais de rappels génériques.

Règles absolues :
- Chaque idée s'ancre sur UN signal précis et nommé du profil (justification vide ou générique = rejet)
- Jamais rien qui figure dans les filtres durs (veto absolu)
- Idées concrètes, actionnables cette semaine
- Ton : chaud, personnel, jamais clinique ni SaaS
- Zéro score, zéro %, zéro jargon psy
- 1 à 3 idées, chaque idée cible une dimension différente si possible
- La justification est une phrase courte, toujours ancrée dans un élément concret

Réponds uniquement avec un tableau JSON :
[
  {
    "title": "Titre court et concret (max 7 mots)",
    "justification": "Phrase courte ancrée dans le profil (ex: '{prénom} est sensible aux petits gestes réguliers')",
    "dim": "MOT" | "SER" | "CAD_C" | "CAD_S" | "EXP" | "GES" | "SUR",
    "canal": "message" | "appel" | "en_personne" | "cadeau" | "service" | "experience",
    "intensite": "légère" | "modérée" | "forte",
    "declencheur": "Cette semaine" | "Ce soir" | "Dans 2-3 jours" | "Quand il/elle semble stressé(e)" | (autre formulation courte et chaleureuse)
  }
]
```

### Prompt utilisateur — VERBATIM (fichier: engine.ts lignes 345-349)

```
Génère 1 à 3 recommandations d'attention concrètes et adaptées pour {contactFirstName}.

{context}

Respecte strictement les filtres durs. Ancre chaque idée sur un signal nommé. Réponds uniquement avec le JSON.
```

(`{context}` = le grand bloc décrit plus haut, dimensions + singularité + vetos + feedback, etc.)

### Où c'est branché

- **Route API : `src/app/api/recommendations/generate/route.ts`** (POST, authentifié pilote).
  - Charge le contact, le profil du pilote, l'historique récent (`attention_log`), le journal de contexte (`context_journal`), le contexte « relation compliquée », l'historique de feedback (10 derniers).
  - Si le proche est un utilisateur lié (`proche_user_id`), va chercher **son** analyse `my_profile` (réception/expression/tempérament/filtres/vetos/singularité). Sinon, repli sur l'analyse « incognito » stockée dans `questionnaire_responses.attention_reception`.
  - Appelle `generateRecommendations(input)`.
  - **Écrit dans `contact_recommendations`** en upsert sur `(user_id, contact_id)` : `ideas` (JSON), `blind_spot`, `kadence`, `generated_at` (fichier: generate/route.ts lignes 171-181).
  - **Log** chaque idée proposée dans `attention_log` (status `proposed`) pour la déduplication future.
  - **Amorce une question proactive** dans `context_journal` (générateur *déterministe*, sans IA — voir ci-dessous) si aucune question posée dans les 7 derniers jours.

- **Qui appelle cette route :** un seul endroit — le composant `src/app/contacts/[id]/AttentionContextuelle.tsx` (ligne 35, `fetch("/api/recommendations/generate")`), déclenché par le bouton « Générer » de la fiche proche. **Aucun cron n'appelle cette route** : la reco v1 est 100 % à la demande du pilote.

### Générateur de questions — déterministe, PAS d'IA (fichier: src/lib/recommendations/questions.ts)

`generateProactiveQuestion` tire au sort parmi 6 modèles fixes (« Comment va {n} en ce moment ? », « Tu as des nouvelles de {n} récemment ? », etc.), en évitant les questions déjà posées. Aucun appel LLM.

### Ce qui est affiché au pilote (brique a)

- **Fiche proche** (`src/app/contacts/[id]/page.tsx` lignes 164-172) : lit `contact_recommendations` (`ideas, blind_spot, kadence, generated_at`) et les passe au composant `AttentionContextuelle` (idées avec canal, intensité, déclencheur, badge angle mort, boutons « fait » + feedback juste/à côté/pas le moment).
- **Liste contacts** (`src/app/contacts/page.tsx` lignes 113-129) : affiche seulement le **titre de la 1re idée** par contact (`recoMap`).
- **Dashboard** (`src/app/dashboard/page.tsx` lignes 116-119) : idem, titre de la 1re idée par contact.

➡️ La brique (a) **atteint bien une interface** (fiche + liste + dashboard). Volume réel : `contact_recommendations` = **0 ligne** (base QA vide).

---

## (b) Détection de signaux + génération de suggestions ✅

### (b.1) Détecteur — `src/lib/signals/detector.ts` : 100 % DÉTERMINISTE, aucune IA

`detectSignalsForUser(userId, admin)` parcourt les contacts non archivés et crée des lignes dans **`contextual_signals`** selon des **règles de dates pures** (fuseau Europe/Paris). Aucun appel LLM. Fenêtre de déclenchement : `WINDOW = 14` jours.

Types de signaux produits (`signal_type`) et leurs règles :

| Bloc | Type(s) | Règle | Qui est concerné |
|------|---------|-------|------------------|
| A | `birthday_d7/d3/d1/today` | anniversaire de naissance, paliers J-7/J-3/J-1/jour J, priorités normal→urgent | tout contact avec date « anniversaire/naissance » |
| B | `couple_anniversary`, `wedding_anniversary` | dates rencontre/couple/mariage/pacs, J-7 + jour J | `relationship = partner` |
| C | `valentines_day` | Saint-Valentin (14/02), J-7 + jour J | `relationship = partner` |
| D | `mothers_day` | Fête des mères (dernier dimanche de mai), J-7 + jour J | pilote a des enfants + `relationship = family` |
| E | `fathers_day` | Fête des pères (3e dimanche de juin), J-7 + jour J | pilote a des enfants + `relationship = family` |
| F | `christmas` | Noël (25/12), J-14/J-7/J-3 | partner, family, ou proximité `inner_circle` |
| G | `custom_date` | toute autre date importante non reconnue, J-7 + jour J | tout contact |
| H | `silence` | pas de « connexion » depuis un seuil (cadence résolue via `resolveCadenceForContact`) | tout contact |
| L | `memory_anniversary` | contacts en « mode souvenir » (archivés, opt-out=false), anniversaire de l'archivage | contacts mémoire |
| I | `pilote_birthday` | anniversaire du pilote lui-même | pilote (contact_id null) |
| J | `pilote_mothers_day`, `pilote_fathers_day` | fêtes des mères/pères **pour le pilote parent** | pilote (contact_id null) |
| K | `pilote_difficult_period` | pilote a déclaré une période difficile (`pilote_difficult_period_until`), cadence hebdo | pilote (contact_id null) |

- **Anti-doublon** : `signalExists` vérifie qu'il n'existe pas déjà un signal même `(user_id, contact_id, signal_type, trigger_date)` en statut `active`/`consumed` avant insertion (lignes 67-114).
- Chaque signal porte `signal_data` (nom du contact, libellé de date…), `trigger_date`, `priority` (normal/high/urgent), `expires_at`.
- Log d'erreur notable : `[detector] Insert error {type}: {message}`.

### (b.2) Générateur — `src/lib/signals/generator.ts` : APPEL LLM

`generateSuggestionForSignal(signal, admin)` transforme UN signal en UNE suggestion écrite dans **`proactive_suggestions`**. Deux chemins :

- **Signal pilote** (`contact_id` null) → `generatePiloteSuggestion` : suggestion pour le pilote lui-même.
- **Signal proche** → chemin principal : charge le contact, son `questionnaire_responses`, le `my_profile` du pilote.

**Garde-fou cadence** (lignes 306-319) : si la priorité n'est pas `urgent`, et que la dernière suggestion pour ce contact est plus récente que la cadence résolue, le signal est marqué `consumed` **sans** générer (donc sans appel LLM). Économise les appels.

Après génération : insertion dans `proactive_suggestions` (title, description, category, reasoning, estimated_price, partner_hint, priority, status `pending`, expires_at). Si priorité `urgent`/`high` → **push notification** via `sendPushToUser`. Puis le signal est passé en `consumed`.

#### Modèle LLM (les deux chemins)

- **Modèle : `claude-sonnet-4-6`**
  - chemin proche : ligne 369, **max_tokens 600**
  - chemin pilote : ligne 222, **max_tokens 400**

#### Prompt — chemin PROCHE — VERBATIM (fichier: generator.ts lignes 334-356)

```
Tu es Candice — un service de conciergerie relationnelle, sobre et adulte. Tu aides quelqu'un à faire attention à ses proches au bon moment.

CONTEXTE : {contextLabel}.

PROFIL DE {contact.name} ({contact.relationship}) :
{contactDesc}{qualityConstraints}

PROFIL DU PILOTE (la personne qui offre) :
{piloteDesc}

Génère UNE suggestion d'attention parfaitement adaptée au contexte ci-dessus. Spécifique, actionnelle, mémorisant des détails précis du profil.

Réponds UNIQUEMENT avec ce JSON, sans texte avant ni après :
{
  "title": "Titre court (max 8 mots)",
  "description": "Suggestion concrète et personnalisée (2-3 phrases)",
  "category": "quality_time" | "gift" | "message" | "gesture" | "activity",
  "reasoning": "Une phrase qui commence par 'Parce que' expliquant pourquoi maintenant",
  "estimated_price": "Gratuit" | "X€" | "X-Y€",
  "partner_hint": "Nom du lieu ou prestataire recommandé si pertinent, sinon null"
}

Ton strict : premium, sobre, adulte. Pas de 'petit', 'doux', 'tendre' en excès. Pas de leçon. Inspiré conciergerie.
```

Le `{contextLabel}` provient de `getSignalContext` (verbatim des phrases par type, ex. `birthday_d7` → `« l'anniversaire de {name} est dans 7 jours »`, `silence` → `« {name} et toi ne vous êtes pas vraiment connectés depuis {n} jours — c'est le bon moment »`). Le `{contactDesc}` est un profil psychologique + préférences détaillé (`describeContact`, lignes 56-90), et `{qualityConstraints}` ajoute des exigences selon le standing/gastronomie/hébergement/style de cadeau (`getQualityConstraints`, lignes 92-135, ex. `high_standards` → « uniquement des établissements notés 4,5/5 minimum… »).

#### Prompt — chemin PILOTE — VERBATIM (fichier: generator.ts lignes 193-213)

```
Tu es Candice — un service de conciergerie relationnelle, sobre et adulte.

CONTEXTE : {context}.

Il s'agit de la personne qui utilise Candice — pas d'un de ses proches. Suggère-lui quelque chose pour elle-même.

{profileLines}

Génère UNE suggestion personnelle et bienveillante. Sobre, sans sentimentalisme excessif.

Réponds UNIQUEMENT avec ce JSON, sans texte avant ni après :
{
  "title": "Titre court (max 8 mots)",
  "description": "Suggestion concrète (1-2 phrases)",
  "category": "quality_time" | "gift" | "message" | "gesture" | "activity",
  "reasoning": "Une phrase qui commence par 'Parce que'",
  "estimated_price": "Gratuit" | "X€" | null,
  "partner_hint": null
}

Ton strict : sobre, adulte, bienveillant sans excès.
```

Le `{context}` pilote provient de `getPiloteSignalContext` (ex. `pilote_birthday` → « C'est l'anniversaire du pilote aujourd'hui », `pilote_difficult_period` → « Le pilote traverse une période difficile en ce moment »).

Logs d'erreur notables : `[generator] Claude error for signal {id}`, `[generator] Insert error for signal {id}`, `[generator] Push error`.

### Ce qui est affiché au pilote (brique b)

- **Dashboard** (`src/app/dashboard/page.tsx`) : lit `proactive_suggestions` en statut `pending` (jointe au contact et au signal), trie par priorité et affiche **la suggestion la plus prioritaire** en carte principale (`topProactiveSuggestion`, lignes 158-269) + un compteur « proches à soutenir ». (NB : une seconde requête sur la table `suggestions` — legacy, différente — est chargée dans `suggestionsData` puis explicitement ignorée via `void suggestionsData`.)
- **Liste contacts** (`src/app/contacts/page.tsx`) : lit aussi `proactive_suggestions`.
- **Actions** : `src/app/api/proactive-suggestions/[id]/validate` et `/refuse` (le pilote valide ou refuse).
- **Relance e-mail** : le cron `email-reminders` renvoie par mail les suggestions `pending` depuis >48 h.

➡️ La brique (b) **atteint bien une interface** (dashboard + contacts + e-mail + push). Volumes réels : `contextual_signals` = **0**, `proactive_suggestions` = **0** (base QA vide).

---

## (c) Espace Proche V2 — `contact_reco_items` : ⚫ RIEN NE L'ALIMENTE

### Ce qu'est la table

`contact_reco_items` (migration 69, `supabase-migration-69-contact-reco-items.sql`) : **une ligne par reco** pour l'espace proche (`/proche/[id]`), pensée pour remplacer le blob `contact_recommendations.ideas`. Colonnes : `reco_type` (object/experience/place/message), `title`, `brand`, `price_indicative`, `photo_url`, `source_trace` (declared/spotted/deduced/exploratory), `certainty_pct`, `why_json`, `need_tag`, `origin_ref`, `status` (active/refused), `reservation_status` (available/intended/purchased), etc. RLS owner-only. Réservation invisible atomique via RPC `reserve_reco_item` / `confirm_reco_purchase` (péremption 30 j), calquée sur Wishlist V2.

### Qui LIT / MODIFIE la table (fichier: src/app/proche/[id]/…)

- `src/app/proche/[id]/page.tsx` (ligne 46-49) : **lit** les items `active`+`refused` (hors `purchased`) pour l'afficher dans l'espace proche.
- `src/app/proche/[id]/EspaceProcheShell.tsx` : **met à jour** le statut (refuser → `status='refused'`, ligne 204/216/243 ; acheter → `reservation_status='purchased'`, ligne 228 ; réactiver → `status='active'`, ligne 254).

### Qui ÉCRIT / INSÈRE la table

- **PERSONNE.** Recherche exhaustive sur tout le repo (hors `node_modules`) : aucune instruction `insert` dans `contact_reco_items`, aucun moteur/générateur, aucun cron, aucune route API. Les seules mentions sont : les 3 migrations SQL (69, 70, 72), les 2 fichiers d'écran ci-dessus (lecture + update de statut), et 3 docs de STOP.

### Cohérence avec la mémoire projet

Cohérent avec la note mémoire « Espace Proche V2 » : Phases 1-6 closes, **moteur de reco = Phases 7-10 restantes, « ne pas lancer P7 sans signal »**. Et avec la décision explicite dans `src/app/contacts/[id]/AttentionContextuelle.tsx` en-tête et `proche/[id]/page.tsx` ligne 69 : *« Décision B — pas de génération LLM »* pour l'espace proche à ce stade.

➡️ **Statut : ⚫ code mort côté génération.** L'interface `/proche/[id]` sait afficher, refuser, réserver et acheter des recos, mais **aucun producteur ne remplit la table** aujourd'hui. Tant qu'aucune reco n'y est insérée (à la main ou par un futur moteur), l'onglet reste vide. Volume réel : `contact_reco_items` = **0 ligne**.

---

## Récapitulatif — ce qui atteint une interface vs ce qui n'atteint rien

| Brique | Modèle LLM | Table | Affiché où | Statut | Volume base |
|--------|-----------|-------|-----------|--------|-------------|
| (a) Reco v1 | `claude-sonnet-4-6` (900 tk) | `contact_recommendations` | Fiche proche, liste contacts, dashboard | ✅ affiché | 0 |
| (b.1) Détecteur signaux | *aucun (déterministe)* | `contextual_signals` | *(interne, non affiché tel quel)* | ✅ branché | 0 |
| (b.2) Générateur suggestions | `claude-sonnet-4-6` (600/400 tk) | `proactive_suggestions` | Dashboard (carte prioritaire), contacts, e-mail, push | ✅ affiché | 0 |
| (c) Espace Proche V2 | *aucun* | `contact_reco_items` | `/proche/[id]` (affichage + actions) | ⚫ rien ne l'alimente | 0 |

- **Tables annexes vues à 0 ligne aussi** : `reco_refusals` (refus espace proche), `cadence_feedback` (agrégats du cron cadence), `attention_log` (log des idées v1 + feedback).
- **Note de fiabilité des volumes** : la base interrogée via `SUPABASE_DB_URL` est la base réelle du projet, en état pré-lancement — les tables reco (`contact_recommendations`, `contextual_signals`, `proactive_suggestions`, `contact_reco_items`) sont vides, tandis que d'autres tables sont peuplées (`discovery_questions` 70, etc.). Les 0 lignes reflètent l'absence de production de recos à ce jour, pas un environnement de test distinct.
</content>
</invoke>
