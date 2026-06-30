# CANDICE — PRODUCT SPEC V2.6

> Document de référence consolidé et unique. Source de vérité du produit.
> Contient la V2.5 intégrale (sections 0–41) **+** le Patch V2.6 (sections 42–46), fusionnés.
> Destiné à être déposé dans le repo (ex. `docs/PRODUCT_SPEC.md`) et lu par Claude Code.

---


> Document unique et complet. Prêt à être donné à Claude Code par sections, ou lu en entier comme référence produit.
> Successeur de la V2 (HTML). Ne remplace pas — augmente, corrige, opérationnalise.
> Format Markdown long pour faciliter la navigation, l'extraction et la version-control.

---

## TABLE DES MATIÈRES

0. Comment lire ce document
1. Positionnement non négociable
2. Principe d'architecture : l'IA n'est pas le produit
3. Ce qui est conservé / corrigé / ajouté par rapport à la V2
4. Candice Brain — vue d'ensemble
5. Memory Engine
6. Signal Engine
7. Life State Engine
8. Attention DNA Engine
9. Trust Engine
10. Scoring Engine
11. Recommendation Engine
12. Priority Engine
13. Learning Engine
14. Forgetting / Validity Engine
15. Relationship Graph Engine
16. Brand Knowledge Engine
17. Taxonomie des événements de vie
18. Workflows — pattern commun
19. W1 — Nouvelle sur un proche
20. W2 — Repéré quelque chose (corrigé)
21. W3 — Conflit (Candice coach + questionnaire conflit)
22. W4 — Préparer un événement (timing J-30)
23. W5 — Faire plaisir à quelqu'un (spontané et proactif)
24. W6 — Update fiche / Ne va pas bien / Dire ce qui me ferait plaisir
25. Home — design et UX exacts
26. Profils refondus — mon profil + fiche d'un proche
27. Attention Timeline
28. Cas « personne décédée / espace mémoire »
29. Ajouter un proche — refonte complète
30. Compatibilité relationnelle
31. Notifications & cadence corrigées
32. Quiz mensuel d'affinage
33. Catalogue d'attentions
34. Console Candice — cockpit opérationnel complet
35. UX pilote — proposition d'attention
36. Workflow complet : recommandation → commande → feedback
37. Paramètres
38. Modèle de données enrichi
39. Bugs à corriger immédiatement
40. Roadmap par lots
41. Points de vigilance techniques

---

## 0. Comment lire ce document

Ce document est la spec V2.5. Il remplace la V2 sans annuler ce qui est déjà codé. Il sert à trois publics :

- **Estelle (toi)** : pour valider la vision, suivre la roadmap, donner les bonnes priorités.
- **Claude Code** : pour coder, lot par lot. Chaque lot de la section 40 est autoporteur.
- **Un futur dev / lead tech** : pour comprendre l'architecture et la philosophie produit.

Conventions :

- Quand j'écris « copy exacte », il faut respecter à la lettre.
- Quand j'écris « niveau de confiance », c'est un champ technique (Trust Engine).
- Tous les chapitres « Engine » sont des modules de **Candice Brain**, le cerveau propriétaire.

---

## 1. Positionnement non négociable

Candice n'est pas :

- une app de cadeaux
- un CRM personnel
- une base de données
- un questionnaire
- un carnet d'adresses amélioré
- une simple interface autour d'un LLM

Candice est :

### LE PREMIER COPILOTE RELATIONNEL PERSONNEL

Promesse :

> Candice aide les gens à mieux comprendre, mieux aimer et mieux prendre soin des personnes qui comptent.

Le cadeau est une conséquence. La valeur produit est la **compréhension humaine continue** :

- comprendre les personnes
- mémoriser les signaux importants
- détecter les bons moments
- proposer les bonnes attentions
- réparer les conflits
- anticiper les événements
- aider à ne pas décevoir
- apprendre en continu
- transformer les informations relationnelles en actions concrètes

**Règle produit fondamentale.** Chaque écran répond à : *« Comment aider l'utilisateur à mieux comprendre, aimer ou prendre soin d'une personne ? »* Sinon, il est supprimé.

**Règle de magie.** Chaque action utilisateur déclenche une **réaction visible de Candice**. Jamais de simple stockage. L'utilisateur dit quelque chose → Candice analyse, reformule, agit, et le montre.

---

## 2. Principe d'architecture : l'IA n'est pas le produit

Candice ne dépend jamais d'un LLM pour savoir quoi faire. Le LLM est un outil, pas le produit.

**Ce que fait le LLM :**

- reformuler
- résumer
- rédiger
- analyser du texte libre
- catégoriser
- détecter des signaux
- générer des messages
- proposer une première interprétation

**Ce qui appartient à Candice (propriétaire) :**

- règles
- scores
- priorités
- catégories (taxonomie)
- événements
- déclencheurs
- états de vie
- recommandations
- workflows
- mémoire
- taxonomies
- fiabilité (trust)
- historique
- apprentissage
- console opérationnelle
- catalogue d'attentions
- logique d'opération

**Pourquoi c'est non négociable.** Si Candice dépend d'un LLM pour décider, alors n'importe quel concurrent avec le même LLM peut faire la même chose. Le moat de Candice, c'est sa **structure propriétaire** : la taxonomie des événements de vie, le système de scoring, la mémoire structurée, le catalogue curé, la console, le feedback loop. Le LLM est interchangeable. Candice Brain ne l'est pas.

**Conséquence technique.** Tout passage par un LLM est borné : entrées contrôlées, sortie validée contre la taxonomie, fallback déterministe en cas d'erreur. Aucune décision irréversible ne passe par un LLM seul.

---

## 3. Ce qui est conservé / corrigé / ajouté par rapport à la V2

### Conservé

- Direction produit : copilote relationnel.
- Home dynamique avec carte hero + 2-3 cartes secondaires.
- Bouton central = « Parler à Candice ».
- Refonte profils en cartes visuelles.
- Workflows IA avec « moment de magie ».
- Migration vers Capacitor pour le vocal natif (lot final).
- Tout ce qui est déjà codé (parcours invité, questionnaire pour soi, Module 6 v1, registre, incognito, feedback loop, centres d'intérêt).

### Corrigé

- La V2 reste trop centrée sur les écrans. La V2.5 ajoute le **cerveau** sous les écrans.
- W2 (Repéré quelque chose) : la version V1 manuel / V2 IA vision est trop binaire — voir section 20.
- W3 (Conflit) : il manque les questions de gestion du conflit dans le questionnaire — voir section 21.
- Cadence affichée sur la home : à déplacer dans les paramètres.
- « Validation manuelle d'avance par toi » n'est pas une limite — c'est exactement le cœur du modèle premium.

### Ajouté

- **Candice Brain** complet avec ses 12 moteurs.
- **Taxonomie des événements de vie** (40+ catégories, chacune avec règles).
- **Console Candice** : cockpit opérationnel complet.
- **Cas personne décédée / espace mémoire**.
- **Compatibilité relationnelle** entre deux profils confirmés.
- **Workflow événement avec timing J-30 → J-1**.
- **Attention Timeline** (différente de la timeline de vie).
- **Modèle de données enrichi** (22 tables).
- **Roadmap en 18 lots** avec dépendances explicites.

---

## 4. Candice Brain — vue d'ensemble

Candice Brain est la colonne vertébrale du produit. Il reçoit toutes les informations entrantes, les transforme en signaux, les pondère, les rattache aux profils, priorise les actions, déclenche des recommandations, en pousse certaines en console, apprend du feedback, et met à jour la mémoire.

**12 moteurs :**

1. **Memory Engine** — transforme l'info brute en mémoire structurée.
2. **Signal Engine** — transforme la mémoire en signaux exploitables.
3. **Life State Engine** — comprend l'état de vie actuel d'une personne.
4. **Attention DNA Engine** — modélise *comment* une personne aime recevoir une attention.
5. **Trust Engine** — sait quand être confiant et quand être prudent.
6. **Scoring Engine** — score chaque recommandation sur 12 dimensions.
7. **Recommendation Engine** — choisit les bonnes attentions.
8. **Priority Engine** — décide quoi mettre en avant aujourd'hui.
9. **Learning Engine** — apprend de chaque action.
10. **Forgetting / Validity Engine** — sait quand une info expire.
11. **Relationship Graph Engine** — comprend les cercles relationnels.
12. **Brand Knowledge Engine** — connaît marques, lieux, restaurants, hôtels.

**Flux général :**

```
INPUT (texte libre, photo, lien, action utilisateur)
    ↓
Memory Engine (structure l'info → mémoire)
    ↓
Signal Engine (extrait des signaux)
    ↓
[Life State Engine] [Attention DNA Engine] (mettent à jour les états)
    ↓
Trust Engine (pondère selon source)
    ↓
Priority Engine (décide si urgent)
    ↓
Recommendation Engine (génère 1-3 recos)
    ↓
Scoring Engine (score chaque reco)
    ↓
CONSOLE (humain valide ou ajuste)
    ↓
PROPOSITION PILOTE
    ↓
Feedback Engine (apprend)
    ↓
Forgetting Engine (gère la validité dans le temps)
```

---

## 5. Memory Engine

### Objectif

Transformer toute information brute en mémoire structurée.

### Exemples d'informations brutes

- « Sophie a perdu son travail. »
- « Julie adore les hôtels de charme. »
- « Thibaud déteste les surprises. »
- « Estelle se sent seule. »
- « Marius a réussi son spectacle. »
- « Julie a perdu son père. »
- « Sophie a divorcé. »
- « Thibaud a eu une promotion. »

### Champs obligatoires

| Champ | Type | Description |
|---|---|---|
| `id` | uuid | identifiant |
| `user_id` | uuid | le Pilote qui a saisi |
| `contact_id` | uuid | la personne concernée |
| `raw_input` | text | la saisie verbatim de l'utilisateur |
| `sanitized_summary` | text | reformulation Candice (jamais affichée brute) |
| `memory_type` | enum | voir liste plus bas |
| `category` | text | ex. travail, santé, famille |
| `subcategory` | text | ex. perte d'emploi, deuil parent |
| `sentiment` | enum | très_négatif, négatif, neutre, positif, très_positif |
| `emotional_intensity` | enum | faible, moyen, élevé, très_élevé |
| `source` | enum | pilote, proche_lui_même, observation, déduit_ia |
| `source_reliability` | enum | très_faible, faible, moyenne, élevée, très_élevée |
| `confidence_score` | int 0-100 | score numérique calculé par Trust Engine |
| `status` | enum | actif, à_revalider, archivé, invalidé, sensible, masqué, confirmé, incertain |
| `valid_until` | timestamp nullable | date d'expiration automatique |
| `revalidation_date` | timestamp nullable | quand on redemande à l'utilisateur |
| `visibility_level` | enum | privé, partageable_synthèse, partageable_brut |
| `recommendation_impact` | jsonb | impact sur les recos |
| `related_events` | uuid[] | événements liés |
| `related_wishlist_items` | uuid[] | items wishlist liés |
| `related_attention_history` | uuid[] | attentions passées liées |
| `admin_notes` | text | notes côté console |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### Types de mémoire (enum `memory_type`)

- goût_durable
- envie_ponctuelle
- événement_de_vie
- situation_émotionnelle
- conflit
- préférence_cadeau
- préférence_expérience
- préférence_relationnelle
- préférence_communication
- contrainte_logistique
- chose_à_éviter
- marque_aimée
- lieu_aimé
- projet
- rêve
- fragilité
- deuil
- réussite
- changement_de_vie

### Statuts

- `actif` — utilisable pour les recos
- `à_revalider` — la date de revalidation est passée
- `archivé` — n'est plus actif, gardé en mémoire historique
- `invalidé` — l'utilisateur a dit que c'était faux/plus valable
- `sensible` — masqué par défaut, n'apparaît qu'en consultation explicite
- `masqué` — caché de l'UI mais conservé en DB
- `confirmé` — confirmé par la personne elle-même
- `incertain` — Trust faible, à confirmer

### Exemple complet

**Input utilisateur :** « Sophie a perdu son travail. »

**Candice transforme en :**

```json
{
  "memory_type": "événement_de_vie",
  "category": "travail",
  "subcategory": "perte_d_emploi",
  "sentiment": "négatif",
  "emotional_intensity": "élevé",
  "source": "pilote",
  "source_reliability": "moyenne",
  "confidence_score": 78,
  "status": "actif",
  "valid_until": "+60 jours",
  "revalidation_date": "+30 jours",
  "visibility_level": "privé",
  "recommendation_impact": {
    "tone_required": "doux",
    "support_needed": true,
    "celebration_inappropriate": true,
    "attention_types_recommended": ["soutien", "présence", "message_doux"],
    "attention_types_forbidden": ["surprise_festive", "humour_lourd"]
  }
}
```

**Affichage utilisateur :**

> Sophie traverse une période fragile liée à sa situation professionnelle.

**Jamais afficher brut.**

### Reformulation : règles

- Toujours en troisième personne narrative (« Sophie traverse… », pas « Elle a perdu son job »).
- Toujours adoucie (« période fragile » plutôt que « chômage »).
- Toujours en gardant la dignité de la personne.
- Jamais de jargon clinique.
- Le brut (`raw_input`) reste accessible en console admin uniquement.

---

## 6. Signal Engine

### Objectif

Transformer chaque mémoire en **signaux exploitables** par le Recommendation Engine.

### Exemples de signaux

- `aime_bijoux_doré` (high)
- `préfère_expériences_aux_objets` (medium)
- `aime_restaurants_intimistes` (high)
- `sensible_aux_mots` (high)
- `évite_surprises_publiques` (very_high)
- `traverse_deuil` (active)
- `besoin_soutien` (high)
- `risque_surcharge_émotionnelle` (medium)
- `préfère_attentions_discrètes` (high)
- `apprécie_scénarisation` (high)
- `aime_cadeaux_faits_maison` (medium)
- `déteste_cadeaux_impersonnels` (very_high)
- `aime_premium_non_ostentatoire` (high)
- `loin_géographiquement` (true)
- `peu_de_temps` (true)
- `besoin_organisation_externe` (high)

### Structure d'un signal

| Champ | Type | Description |
|---|---|---|
| `signal_id` | uuid | |
| `contact_id` | uuid | |
| `signal_type` | text | ex. `bijoux_doré_affinity` |
| `signal_value` | enum | very_low, low, medium, high, very_high |
| `polarity` | enum | positive, negative, neutral |
| `confidence` | int 0-100 | |
| `source_memory_id` | uuid | la mémoire qui a produit ce signal |
| `freshness` | timestamp | dernière confirmation |
| `used_in_recommendations_count` | int | combien de fois utilisé |
| `last_used_at` | timestamp | |
| `last_confirmed_at` | timestamp | dernière fois où le signal a été confirmé |
| `conflicting_signals` | uuid[] | autres signaux qui contredisent celui-ci |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### Exemple

**Mémoire :** « Estelle aime les bijoux dorés assez affirmés. »

**Signaux créés :**

```json
[
  { "signal_type": "jewelry_affinity", "value": "high", "polarity": "positive" },
  { "signal_type": "gold_preference", "value": "high", "polarity": "positive" },
  { "signal_type": "discreet_jewelry_preference", "value": "low", "polarity": "negative" },
  { "signal_type": "statement_piece_preference", "value": "medium_high", "polarity": "positive" },
  { "signal_type": "luxury_but_personal", "value": "medium_high", "polarity": "positive" }
]
```

### Gestion des conflits entre signaux

Si deux mémoires produisent des signaux opposés (« elle adore les surprises » + « elle déteste les surprises »), le Signal Engine :

1. garde les deux signaux,
2. lie l'un à l'autre via `conflicting_signals`,
3. réduit la confiance des deux,
4. marque comme `à_clarifier`,
5. propose en console une question : « Sophie aime-t-elle vraiment les surprises ? »

---

## 7. Life State Engine

### Objectif

Comprendre ce que la personne **vit actuellement**. Une personne n'est pas seulement ses goûts — elle est son état de vie.

**Règle fondamentale.** Les recommandations passent par le Life State **avant** les goûts. Une personne en deuil ne reçoit pas un cadeau festif, même si elle adore les cadeaux festifs en temps normal.

### Exemples

- **Estelle** : post-partum, fatigue élevée, charge mentale élevée, besoin de soutien, besoin de reconnaissance, peu de temps disponible.
- **Sophie** : recherche d'emploi, moral fragile, besoin de réconfort.
- **Julie** : deuil récent, vulnérabilité élevée, besoin de présence douce, éviter attentions festives.
- **Thibaud** : surcharge professionnelle, peu de disponibilité mentale, besoin de simplicité.

### Champs

| Champ | Type | Description |
|---|---|---|
| `life_state_id` | uuid | |
| `contact_id` | uuid | |
| `type` | enum | voir taxonomie section 17 |
| `intensity` | enum | faible, moyen, élevé, très_élevé |
| `start_date` | date | |
| `estimated_end_date` | date nullable | |
| `status` | enum | actif, en_cours_de_résolution, résolu, archivé |
| `revalidation_date` | date | |
| `emotional_tone` | enum | doux, sobre, neutre, joyeux, célébration |
| `recommended_attention_types` | text[] | |
| `forbidden_attention_types` | text[] | |
| `communication_tone` | enum | doux, normal, enjoué |
| `notification_priority` | enum | faible, normale, élevée, urgente |
| `sensitivity_level` | enum | normal, sensible, très_sensible |
| `source_memory_id` | uuid | la mémoire qui a créé ce Life State |
| `admin_notes` | text | |

### Exemple de règle (Life State = deuil récent)

**Recommandations adaptées :**

- message doux
- fleurs sobres
- repas livré
- présence silencieuse
- livre de mémoire
- proposition d'aide concrète

**Recommandations interdites :**

- surprise festive
- humour
- cadeau trop léger
- notification trop fréquente
- injonction à sortir ou « se changer les idées » trop vite

### Plusieurs Life States simultanés

Une personne peut avoir plusieurs Life States actifs. Dans ce cas, le Recommendation Engine prend le **plus sensible** comme contrainte dominante.

Exemple : Sophie peut être à la fois en recherche d'emploi (Life State) et en préparation d'un mariage (événement). Le ton dominant reste celui du Life State le plus sensible.

---

## 8. Attention DNA Engine

### Objectif

Modéliser **comment** une personne aime recevoir une attention. Pas « qu'est-ce qu'elle aime », mais « comment aime-t-elle qu'on prenne soin d'elle ».

Deux personnes peuvent aimer les bijoux. Recevoir le même bijou les touche différemment selon leur ADN d'attention.

### Dimensions de l'ADN d'attention

Chaque dimension est notée sur une échelle (-2 = déteste, +2 = adore) :

- aime_surprises
- aime_scénarisation
- aime_simplicité
- aime_attentions_discrètes
- aime_déclarations
- aime_preuves_concrètes
- aime_expériences
- aime_objets
- aime_attentions_faites_maison
- aime_luxe
- aime_pratique
- aime_sentimental
- aime_humour
- préfère_choisir
- préfère_être_surprise
- aime_qu_on_anticipe
- aime_qu_on_organise_tout
- aime_être_consultée
- déteste_charge_mentale
- déteste_cadeaux_génériques
- déteste_surprises_publiques

### Exemple

**Estelle :**

- aime_scénarisation : +2
- aime_qu_on_anticipe : +2
- aime_mots : +2
- aime_expériences_organisées : +2
- déteste_charge_mentale : -2
- aime_sentimental_et_beau : +2

**Sophie :**

- aime_simplicité : +2
- aime_attentions_discrètes : +2
- déteste_en_faire_trop : -2

### Impact sur les recommandations

**Même cadeau potentiel :** un bijou.

**Pour Estelle :**

> Bijou + message manuscrit + moment organisé + scénarisation (« demain sois prête à 10h… »)

**Pour Sophie :**

> Bijou sobre + mot simple + pas de mise en scène

### Comment l'ADN est rempli

- Questionnaire principal → la majorité des dimensions.
- Questionnaire incognito → version observée, confiance plus faible.
- Feedback sur attentions passées → ajuste l'ADN au fil du temps.
- Quiz mensuel → affine.

---

## 9. Trust Engine

### Objectif

Candice sait **quand elle n'est pas sûre**. Ne jamais sur-affirmer.

### Sources et confiance par défaut

| Source | Confiance par défaut |
|---|---|
| Déclaré directement par la personne | très_élevée (90-100) |
| Questionnaire standard rempli par la personne | très_élevée (85-95) |
| Comportement observé répété | élevée (70-85) |
| Dit par un proche au pilote | moyenne (50-70) |
| Supposé par le pilote | moyenne_faible (40-60) |
| Déduit par IA depuis du texte libre | faible_moyenne (40-60) |
| Profil incognito | plafonnée à 65 sauf confirmations multiples |

### Wording selon confiance

**Confiance forte (>75) :**

> Sophie aime les attentions discrètes.

**Confiance moyenne (50-75) :**

> D'après ce que tu m'as raconté, Sophie semble apprécier les attentions discrètes.

**Confiance faible (<50) :**

> Il est possible que Sophie apprécie ce type d'attention, mais je manque encore d'informations.

### Affichage UI

**Sur les recommandations côté pilote :** pastille discrète (sans chiffre) — pleine (forte) / contour (moyenne) / pointillée (faible).

**Sur les fiches proches :** badge global de confiance du profil — sans chiffre pour l'utilisateur.

**En console admin :** affichage du score exact (0-100).

### Mise à jour de la confiance

- Confirmé par la personne elle-même → +20
- Confirmé indirectement par le feedback (attention validée) → +10
- Contredit par un feedback (« pas son style ») → -15
- Ancien sans confirmation depuis X jours → -5 par mois
- Conflit avec un autre signal → -10

---

## 10. Scoring Engine

### Objectif

Chaque recommandation est scorée sur 12 dimensions. Le score est propriétaire à Candice et explique **pourquoi** une reco est ou n'est pas proposée.

### Les 12 scores

1. **Profile Match Score** — correspondance avec les goûts durables.
2. **Emotional Match Score** — correspondance avec l'état émotionnel actuel.
3. **Life State Score** — correspondance avec l'état de vie.
4. **Timing Score** — pertinence temporelle.
5. **Relationship Score** — adaptation à la relation pilote-proche.
6. **Surprise Score** — pertinence de la surprise (selon Attention DNA).
7. **Effort Score** — l'attention montre-t-elle un effort visible ?
8. **Novelty Score** — évite de recommander toujours la même chose.
9. **Logistics Score** — faisabilité (délai, livraison, dispo, budget).
10. **Risk Score** — risque de mauvais goût ou d'inadéquation.
11. **Budget Fit Score** — correspondance budget.
12. **Confidence Score** — niveau de preuve derrière la reco.

### Formule initiale (modifiable)

```
Final Score =
  Profile Match     × 0.20
+ Life State        × 0.20
+ Emotional Match   × 0.15
+ Timing            × 0.15
+ Relationship      × 0.10
+ Logistics         × 0.10
+ Confidence        × 0.05
+ Novelty           × 0.05
- Risk × 0.10        (pénalité)
+ Effort            × 0.05  (bonus)
```

Échelle : 0-10 sur chaque dimension. Final Score sur 10.

### Seuils d'action

- Final Score ≥ 8 : reco premium, à proposer en priorité.
- Final Score 6-7,9 : reco valide, à proposer en alternative.
- Final Score 4-5,9 : reco fragile, à proposer uniquement si pas mieux.
- Final Score < 4 : ne pas proposer.
- Risk Score ≥ 7 : validation admin obligatoire avant proposition pilote, quel que soit le Final Score.

### Exemple complet

**Recommandation :** « Spa livré sous forme de carte cadeau pour Sophie après perte d'emploi. »

| Score | Valeur | Justification |
|---|---|---|
| Profile Match | 7/10 | Aime le bien-être, sans signal fort |
| Life State | 9/10 | Réconfort en période fragile |
| Emotional Match | 9/10 | Adouci, prend soin |
| Timing | 8/10 | Immédiat, pas d'événement à attendre |
| Relationship | 8/10 | Adapté entre amies proches |
| Surprise | 6/10 | Sophie aime simplicité, donc surprise modérée |
| Effort | 7/10 | Geste visible, prévu |
| Novelty | 8/10 | Pas déjà fait |
| Logistics | 7/10 | Carte cadeau facile à livrer |
| Risk | 3/10 | Faible risque |
| Budget Fit | 8/10 | À calibrer |
| Confidence | 7/10 | Plusieurs signaux convergents |

**Final Score :** 8,1/10 → reco premium, à proposer en priorité.

---

## 11. Recommendation Engine

### Objectif

Choisir les bonnes attentions, pas seulement les bons cadeaux.

### Types d'attention que Candice doit recommander

**Marchandes :**

- cadeaux physiques
- expériences
- restaurants
- bijoux
- fleurs
- réservations (hôtel, spa, atelier)
- livraisons (repas, courses)
- abonnements (magazine, box)
- services (ménage, conciergerie ponctuelle)

**Non marchandes :**

- messages écrits
- appels
- rituels symboliques
- attentions gratuites
- attentions faites maison (pâte à sel, album photo, lettre)
- activités à organiser
- attentions de soutien
- attentions de réparation
- attentions d'anticipation
- attentions de célébration

**Tout n'est pas marchand.** Une grande partie de la valeur de Candice est de proposer des attentions gratuites, des messages, des gestes — pas systématiquement un achat.

### Inputs du Recommendation Engine

- profil (langage d'attention, ADN, goûts durables)
- Life State actuel
- ADN d'attention
- wishlist (envies repérées)
- marques aimées
- choses à éviter (vetos)
- historique d'attentions (pour la nouveauté)
- relation pilote-proche (registre, proximité)
- événement à venir (timing)
- distance géographique
- budget (explicite ou implicite)
- contraintes logistiques
- feedback passé
- niveau de confiance
- catalogue interne
- disponibilité console humaine
- marge potentielle (info admin)

### Sortie d'une recommandation

```json
{
  "title": "Une robe fluide dans le style qu'elle avait repéré",
  "category": "cadeau_physique",
  "subcategory": "mode",
  "description": "Robe longue claire, style fluide, dans l'esprit de la pièce qu'elle avait montrée",
  "why_it_fits": "Estelle avait montré de l'intérêt pour une robe claire et fluide. Son profil indique un goût pour les pièces féminines, élégantes et faciles à porter.",
  "signals_used": ["mode_affinity", "feminine_style", "ease_of_wear"],
  "scores": { "profile_match": 8, "life_state": 7 },
  "final_score": 7.8,
  "confidence": "moyenne_élevée",
  "timing": "fête_des_mères_J-21",
  "budget_estimated": "120-180€",
  "logistics": { "delivery_days": 5, "stock_check_required": true },
  "admin_validation_required": true,
  "risk_notes": "Taille à confirmer",
  "next_action": "passage_console",
  "status": "à_vérifier_console"
}
```

### Règle absolue

**Aucune recommandation impliquant achat, réservation, prix, stock, livraison ou disponibilité ne part au pilote sans passer par la console.** Ce n'est pas une limite de scaling — c'est le cœur du modèle premium.

Une recommandation **sans implication marchande** (« écris-lui un message ce soir », « propose-lui un appel ») peut sortir directement.

---

## 12. Priority Engine

### Objectif

Chaque jour, Candice décide quoi mettre en avant. Pas 50 choses. **Top 3** maximum.

### Inputs

- événements à venir (J-30, J-21, J-14, J-7, J-3, J-1)
- Life States actifs (priorité haute si sensible)
- relations négligées (pas d'attention depuis X jours, selon cadence)
- wishlist exploitable (item ajouté récemment, occasion proche)
- conflits récents non résolus
- dates importantes
- historique d'attention
- feedback négatif récent (signal d'urgence à corriger)
- manque d'information critique sur un proche
- opportunité saisonnière (fête des mères, Noël…)

### Sortie

Top 3 actions du jour, avec priorité explicite.

### Exemple

```
PRIORITÉ 1 (urgente)
Sophie traverse une période difficile (perte d'emploi, J+12).
→ Proposer un soutien.

PRIORITÉ 2 (importante)
Anniversaire de Julie dans 21 jours.
→ Préparer un cadeau.

PRIORITÉ 3 (douce)
Thibaud n'a pas reçu d'attention depuis 3 semaines.
→ Proposer un geste simple.
```

### UI

**Sur la home :**

- Carte hero = priorité n°1.
- Cartes secondaires = priorités 2 et 3 + 1 carte permanente.

### Règles de priorisation

- Life State sensible (deuil, burn-out, fragilité) → toujours priorité 1.
- Événement < J-3 sans préparation → priorité 1.
- Conflit non résolu depuis > 48h → priorité 1.
- Sinon → tri par Final Score combiné de la meilleure reco disponible.

---

## 13. Learning Engine

### Objectif

Candice apprend après chaque action.

### Sources d'apprentissage

- feedback explicite du pilote (« c'était juste », « à côté », « pas le bon moment »)
- réaction du bénéficiaire
- validation admin en console
- refus pilote (« trop cher », « pas son style », « plus discret », « plus marquant »)
- succès ou échec opérationnel
- attention finalement envoyée vs proposée

### Exemple

Pilote clique « pas son style » sur une reco.

Candice :

1. baisse le score du style concerné dans l'ADN du proche (-15 sur le signal correspondant)
2. augmente le Risk Score pour les futurs items de ce style
3. demande optionnellement :
   > Tu peux me dire ce qui ne collait pas ?

   Options : `trop classique` / `trop fantaisie` / `trop cher` / `mauvais moment` / `autre`
4. enregistre l'apprentissage dans `learning_events`.

### Update du modèle

Après chaque feedback :

- mise à jour des signaux concernés
- mise à jour de l'ADN d'attention
- mise à jour du score qualité du catalogue item
- mise à jour de la performance du fournisseur si applicable
- mise à jour de la confiance globale du profil

**Apprentissage par contact, pas global.** Ce qu'on apprend sur Sophie ne déteint pas sur Julie.

---

## 14. Forgetting / Validity Engine

### Objectif

Ne pas garder des infos temporaires comme si elles étaient permanentes.

### Durées de validité par type de mémoire

| Type | Validité par défaut | Revalidation |
|---|---|---|
| goût_durable | indéfinie | tous les 12 mois |
| envie_ponctuelle | 6 mois | tous les 3 mois |
| événement_de_vie (négatif) | 60 jours | tous les 30 jours |
| événement_de_vie (positif) | 90 jours | tous les 45 jours |
| situation_émotionnelle | 30 jours | tous les 14 jours |
| conflit | 30 jours | tous les 14 jours |
| deuil | indéfinie | tous les 6 mois (changement d'intensité) |
| fragilité | 90 jours | tous les 30 jours |
| réussite | 60 jours | tous les 30 jours |
| changement_de_vie | 180 jours | tous les 60 jours |

### Actions utilisateur sur chaque mémoire importante

Sur la fiche d'un proche, à côté de chaque mémoire affichée :

- ✓ Toujours valable
- ✏️ Mettre à jour
- ✗ Ce n'est plus valable
- 📦 Archiver
- 👁️ Masquer

### Notifications de revalidation

> Sophie avait perdu son travail il y a un mois. Est-ce toujours d'actualité ?

Options :
- Oui, toujours
- Non, elle a retrouvé
- Je ne sais pas
- Mettre à jour

### Changement d'intensité dans le temps (deuil)

Un deuil ne « disparaît » pas. Mais son intensité change. Tous les 6 mois, Candice demande discrètement :

> Comment va [Nom] sur ce sujet aujourd'hui ?

Options :
- Encore très présent
- Plus apaisé
- En reconstruction
- Préférerais ne pas répondre

---

## 15. Relationship Graph Engine

### Objectif

Comprendre les cercles relationnels. Une personne peut avoir plusieurs rôles dans un événement.

### Rôles possibles

- pilote (l'utilisateur)
- proche / bénéficiaire (la personne au cœur de l'attention)
- co-organisateur (un autre pilote qui contribue)
- contributeur (quelqu'un qu'on peut impliquer, ex. un enfant)
- personne à prévenir (logistique)
- contrainte logistique (ex. nounou)

### Exemple : fête des mères

- **Thibaud** = pilote
- **Estelle** = bénéficiaire
- **Marius** (fils) = contributeur possible (« veux-tu impliquer Marius dans le cadeau ? »)
- **Nounou** = contrainte logistique (« pense à la prévenir avant de confirmer le restaurant »)

### Suggestions de Candice

- « Veux-tu impliquer Marius dans le cadeau ? »
- « Veux-tu demander à sa sœur si elle veut participer ? »
- « N'oublie pas d'appeler votre nounou avant de confirmer. »

### Structure

| Champ | Type |
|---|---|
| `relationship_id` | uuid |
| `from_contact_id` | uuid |
| `to_contact_id` | uuid |
| `relationship_type` | enum (parent, enfant, conjoint, frère_sœur, ami, collègue…) |
| `role_in_event` | enum (bénéficiaire, contributeur, contrainte, à_prévenir) |
| `event_id` | uuid nullable |

Le Graph n'est pas obligatoire dans la V1 du produit, mais la donnée doit être prévue pour l'avenir.

---

## 16. Brand Knowledge Engine

### Correction importante

**Pas d'alimentation manuelle de milliers de marques.** Le système permet une curation automatique avec validation humaine.

### Fonctionnement

Quand une marque / lieu / restaurant / hôtel / boutique est détecté dans une saisie utilisateur :

1. Candice vérifie si l'entrée existe déjà (recherche par nom normalisé).
2. Si oui → utilise l'entrée existante.
3. Si non → Candice lance une **recherche automatique** (web search).
4. Candice récupère : nom officiel, logo (Clearbit ou équivalent), site officiel, catégorie, pays, ville si pertinent, tags, description courte, source.
5. Création d'une entrée en statut `pending_review`.
6. L'admin valide en console.

### Actions admin possibles

- Valider
- Corriger (nom, catégorie, logo)
- Fusionner avec une entrée existante (dédup)
- Supprimer
- Rejeter
- Ajouter logo manuellement
- Changer catégorie

### Table `brands_and_places`

| Champ | Type |
|---|---|
| `id` | uuid |
| `name` | text |
| `normalized_name` | text (lowercase, sans accents, sans espaces) |
| `type` | enum (brand, restaurant, hotel, boutique, perfume, experience, service) |
| `category` | text |
| `subcategory` | text |
| `logo_url` | text |
| `website` | text |
| `city` | text nullable |
| `country` | text |
| `tags` | text[] |
| `description` | text |
| `source_url` | text |
| `status` | enum (verified, pending_review, rejected, duplicate) |
| `duplicate_of` | uuid nullable |
| `created_at` | timestamp |
| `updated_at` | timestamp |
| `reviewed_by` | uuid nullable |
| `admin_notes` | text |

### UX saisie côté pilote

Quand l'utilisateur tape « Séza » dans un champ marque :

**Menu déroulant :**

```
🟢 Sézane                    [mode • marque française]
   Le logo + nom officiel
🟢 Sézane Maison              [déco • marque française]
🟡 Ajouter "Sézane Brazil"    [marque non encore référencée]
```

Au clic sur une entrée existante → utilisée immédiatement.
Au clic sur « Ajouter… » → Candice tente l'enrichissement automatique en arrière-plan, l'entrée passe en `pending_review`, et l'utilisateur ne s'aperçoit de rien.

### Console admin

Vue dédiée : **« Marques & lieux à valider »**

Colonnes :

- En attente de revue
- Vérifiées
- Doublons (à fusionner)
- Rejetées

Tableau avec : nom, type, catégorie, source d'origine (qui l'a ajoutée), date, prévisualisation logo, actions.

---

## 17. Taxonomie des événements de vie

Pour chaque catégorie : niveau d'urgence, sensibilité, durée de validité, ton recommandé, attentions adaptées, attentions à éviter, besoin de validation admin.

### Deuil
- Urgence : haute
- Sensibilité : très_haute
- Validité : indéfinie, revalidation tous les 6 mois
- Ton : doux, sobre, jamais léger
- Adaptées : message de soutien, fleurs sobres, repas livré, aide concrète, appel, carte manuscrite, rituel de mémoire
- À éviter : humour, surprise festive, injonction à sortir, cadeau trop commercial, notification trop fréquente
- Admin : validation systématique des attentions
- Notifications : très espacées, jamais le matin tôt ou le soir tard

### Rupture / divorce
- Urgence : haute
- Sensibilité : haute
- Validité : 6 mois, revalidation 2 mois
- Ton : doux mais peut être enjoué selon le contexte
- Adaptées : sortie distraction, repas entre amis, attention de réconfort, message
- À éviter : référence à l'ex, cadeau de couple

### Maladie
- Urgence : haute selon gravité
- Sensibilité : haute
- Ton : doux
- Adaptées : repas livré, aide concrète, fleurs, livre, message
- À éviter : attention qui demande effort physique, sortie sportive

### Burn-out / surcharge mentale
- Urgence : moyenne
- Sensibilité : haute
- Ton : doux, anti-charge
- Adaptées : services (ménage, courses, garde), spa, repos, attention sans engagement
- À éviter : événement à organiser, sortie tardive, charge logistique

### Fatigue / post-partum
- Urgence : moyenne
- Sensibilité : haute
- Ton : doux, pratique
- Adaptées : repas livré, garde d'enfants, attention pour la mère (pas que le bébé), spa à domicile
- À éviter : sortie compliquée, cadeau pour le bébé seul

### Grossesse
- Urgence : faible-moyenne
- Sensibilité : moyenne
- Ton : enjoué mais doux
- Adaptées : attentions pour la mère (pas que la future maman), bien-être
- À éviter : alcool, expériences à risque

### Naissance
- Urgence : moyenne
- Sensibilité : moyenne
- Ton : célébration douce
- Adaptées : cadeau de naissance, repas livré, garde, attention pour les parents
- À éviter : surcharger la famille, visite imposée

### Perte d'emploi
- Urgence : moyenne
- Sensibilité : moyenne-haute
- Validité : 60 jours, revalidation 30 jours
- Ton : doux, soutien
- Adaptées : attention de réconfort, soutien moral, repas, sortie distraction
- À éviter : célébration, cadeau coûteux qui peut gêner

### Nouveau travail / promotion / diplôme / concours
- Urgence : faible
- Sensibilité : faible
- Validité : 60 jours
- Ton : célébration
- Adaptées : champagne, dîner, cadeau symbolique, message
- À éviter : minimiser, faire référence aux échecs passés

### Déménagement / crémaillère / nouveau lieu de vie
- Urgence : moyenne (timing)
- Sensibilité : faible
- Ton : enjoué, pratique
- Adaptées : cadeau pour le foyer, plante, bougie, art, repas livré le jour J
- À éviter : objets trop encombrants

### Départ à l'étranger
- Urgence : moyenne (timing départ)
- Sensibilité : moyenne
- Ton : doux célébration
- Adaptées : cadeau souvenir, carnet, livre, photo, message
- À éviter : objet lourd à transporter

### Solitude
- Urgence : moyenne (signal continu)
- Sensibilité : haute (peut être tabou)
- Ton : doux, présence
- Adaptées : appel régulier, visite, repas partagé, attentions du quotidien
- À éviter : cadeau matériel impersonnel, signal qu'on a remarqué la solitude

### Conflit
- Urgence : variable
- Sensibilité : haute
- Ton : doux, réparateur
- Adaptées : voir Workflow W3 (section 21)
- À éviter : ignorer, dramatiser, mettre la pression

### Réconciliation
- Urgence : faible
- Sensibilité : moyenne
- Ton : doux célébration
- Adaptées : dîner, message, attention symbolique

### Réussite / projet important / examen / spectacle / livre publié
- Urgence : moyenne (timing)
- Sensibilité : faible
- Ton : célébration
- Adaptées : champagne, dîner, message, cadeau qui marque la réussite

### Échec / humiliation
- Urgence : haute
- Sensibilité : très_haute
- Validité : 30 jours
- Ton : doux, jamais consolateur frontal
- Adaptées : distraction, attention discrète, message court
- À éviter : « ce n'est pas grave », célébration, sortie en grand groupe

### Stress / anxiété / examen
- Urgence : moyenne
- Sensibilité : moyenne
- Ton : doux pratique
- Adaptées : repas livré, attention anti-charge, message court d'encouragement
- À éviter : sortie tardive, événement qui ajoute du stress

### Anniversaire
- Urgence : selon J-X
- Sensibilité : faible
- Ton : célébration adaptée à l'ADN
- Adaptées : voir W4 (section 22)

### Fête des mères / pères / saisonnière
- Urgence : J-X
- Sensibilité : variable (peut toucher des deuils)
- Ton : célébration douce
- Vigilance : si le proche a perdu un parent récemment, ces fêtes peuvent être douloureuses → ton adouci

### Mariage / anniversaire de mariage / fiançailles
- Urgence : J-X
- Sensibilité : faible
- Ton : célébration
- Adaptées : cadeau de couple, expérience, attention symbolique

### Retraite
- Urgence : J-X
- Sensibilité : faible-moyenne
- Ton : célébration douce
- Adaptées : cadeau symbolique, voyage, livre, attention qui marque la transition

### Besoin de soutien (général)
- Urgence : moyenne
- Sensibilité : moyenne
- Ton : doux
- Adaptées : présence, attention douce

### Envie exprimée
- Urgence : faible
- Sensibilité : faible
- Conversion en wishlist_item

### Goût détecté
- Urgence : faible
- Sensibilité : faible
- Conversion en signal


---

## 18. Workflows — pattern commun

### Le « moment de magie »

Chaque workflow suit ce pattern obligatoire :

1. **L'utilisateur écrit / dicte / joint une photo / une URL.**
2. **Candice analyse en arrière-plan** (animation discrète « ... »).
3. **Candice reformule** ce qu'elle a compris (jamais brut).
4. **Candice annonce** ce qu'elle va faire.
5. **La fiche du proche se met à jour visiblement.**
6. **Si pertinent : génération d'une attention** à venir (passage Recommendation Engine).

### Saisie : V1 et phase Capacitor

**V1 (web) :**
- Champ texte multiline
- Bouton photo (upload)
- Bouton pièce jointe (lien URL ou fichier)
- **Micro natif du clavier** (iOS / Android transcrivent en temps réel, c'est ce qui donne 80 % de l'expérience vocale sans dev custom)

**Phase Capacitor :**
- Vocal natif continu
- Candice répond à la voix (TTS)
- Conversation continue
- À implémenter dans le **Lot 18** (vocal natif), pas avant.

### États UI communs

- état initial (formulaire vide)
- état saisie (textarea active)
- état envoi (bouton désactivé, animation)
- état analyse (« Candice réfléchit… » avec animation)
- état révélation (reformulation affichée doucement)
- état action (carte d'effet sur la fiche)
- état erreur (réseau, IA indispo)
- état confirmation (« c'est fait »)

### Cas limites communs

- Saisie vide → bouton désactivé, message doux.
- Saisie ambiguë (Candice ne comprend pas) → Candice demande une précision.
- Saisie qui mentionne plusieurs personnes → Candice demande à qui ça se rapporte.
- IA indispo → fallback : on stocke en brut + signale « Candice analysera bientôt ».
- Saisie sensible (deuil, maladie) → Candice adapte le ton avant tout.

---

## 19. W1 — Nouvelle sur un proche

### Trigger

- Bouton central → Parler à Candice → « J'ai une nouvelle sur un proche »
- Carte secondaire home → « J'ai une nouvelle »
- Carte hero contextuelle → « Comment va Thibaud en ce moment ? »
- Bouton sur la fiche d'un proche → « Donner des nouvelles »

### Étape 1 — Choix du proche

Liste des proches avec recherche. Photos / initiales. Tri : proches récemment mis à jour en bas, proches sans nouvelle depuis longtemps en haut.

Copy : *« Pour qui as-tu une nouvelle ? »*

Si déclenché depuis la fiche d'un proche, l'étape 1 est sautée.

### Étape 2 — Saisie

**Copy adaptée au proche :**

> Comment va [Nom] ?
> Dis-moi ce qui se passe.

**Champ :**
- textarea (4 lignes visibles, expandable)
- bouton photo
- bouton pièce jointe / lien
- micro natif du clavier
- bouton « Envoyer » (désactivé tant que vide)

### Étape 3 — Analyse Candice

**État UI :** *« Candice réfléchit… »* avec animation discrète (le point vivant qui respire).

**Ce qui se passe en arrière-plan :**

1. LLM extrait : nature de la nouvelle (positive/négative/neutre), thème (travail, santé, famille, amour…), urgence émotionnelle, entités mentionnées.
2. Memory Engine crée une entrée `memories`.
3. Signal Engine extrait les signaux pertinents.
4. Life State Engine met à jour ou crée un Life State si nécessaire.
5. Trust Engine pondère selon la source.
6. Priority Engine évalue l'urgence.

### Étape 4 — Le moment de magie

**Affichage progressif (apparition douce, ~1-2 secondes par bloc) :**

**Bloc 1 — Ce que Candice a compris :**

> Tu m'as appris que Sophie a perdu son travail.

**Bloc 2 — Ce que Candice fait :**

> J'ai ajouté cette information à son profil. Elle traverse une période de fragilité liée à sa situation professionnelle. Je vais adapter les futures recommandations.

**Bloc 3 — Notification de l'analyse en cours :**

> 🔴 Situation détectée — en cours d'analyse.
> Propositions d'attentions à venir.

**Bloc 4 — Visuel d'effet sur la fiche :**

Petite carte cliquable : « Voir la fiche de Sophie » → ouvre la fiche, met en évidence le nouvel élément ajouté.

### Étape 5 — Effet modèle

- Création `memories`
- Création éventuelle `life_states`
- Mise à jour `signals`
- Pictogramme sur la fiche (rouge fragilité, vert bonne nouvelle, neutre)
- Déclenchement Recommendation Engine en mode différé (analyse complète en arrière-plan, propositions sous 1-6h dans la console admin)
- Notification au pilote quand une reco est prête

### Étape 6 — Validation et invalidation

Sur la fiche du proche, à côté de chaque mémoire affichée : boutons (Toujours valable / Mettre à jour / Plus valable / Archiver / Masquer).

Possibilité d'**invalider** plus tard (« Sophie a retrouvé un travail ») → archive l'événement, ajuste le ton, supprime le Life State actif.

### Copy exacte des nuances selon le sentiment

**Sentiment très positif :**
> Belle nouvelle ! [Reformulation positive]
> Je note ça dans le profil de [Nom]. Ça me donne des idées pour célébrer avec elle.

**Sentiment neutre :**
> J'ai ajouté ça au profil de [Nom].
> Ça m'aidera à mieux comprendre ce qu'elle vit.

**Sentiment négatif modéré :**
> Je comprends. J'ajoute ça à son profil et je serai attentive.
> [Description du Life State activé]

**Sentiment négatif fort (deuil, maladie grave) :**
> Je suis désolée. C'est une nouvelle difficile.
> J'ajoute ça à son profil avec beaucoup de précaution. Je serai très discrète dans mes propositions pour les semaines à venir.

### Cas limites W1

- Plusieurs personnes mentionnées dans la même saisie → Candice demande à laquelle ça se rapporte le plus, propose de scinder.
- Saisie qui mentionne un événement futur (« Sophie va déménager dans 2 mois ») → Memory Engine crée à la fois une mémoire `événement_de_vie` et un `event` daté.
- Saisie qui mentionne le pilote lui-même (« je me sens seule ») → bascule vers W6 / « Dire ce qui me ferait plaisir ».

---

## 20. W2 — Repéré quelque chose (corrigé)

### Pourquoi la V2 était incomplète

L'utilisateur ne sait pas forcément d'où vient une robe ou un objet. Le V2 supposait une marque connue ou une photo identifiable. Le nouveau workflow gère tous les cas.

### Trigger

- Bouton central → « J'ai repéré quelque chose qui pourrait lui plaire »
- Carte secondaire home
- Carte hero contextuelle
- Bouton sur la fiche d'un proche

### Étape 1 — Choix du proche

Comme W1.

Copy : *« Pour qui as-tu repéré quelque chose ? »*

### Étape 2 — Saisie

**Copy :**

> Qu'as-tu vu ?

**L'utilisateur peut :**
- ajouter une photo (caméra ou galerie)
- ajouter un lien URL
- écrire une description libre
- dicter

### Étape 3 — Analyse Candice

**Sortie côté Candice (selon ce qui a été fourni) :**

Si photo :
> Je vois une robe longue claire, plutôt fluide.

ou

> Je vois un jean droit bleu clair.

ou

> Je vois un sac structuré noir.

Si lien :
> J'ai ouvert le lien : une robe de la marque Sézane, modèle « Astrid ».

Si description seule :
> J'ai compris : une robe longue claire, style fluide.

### Étape 4 — Précision marque / source

**Candice demande :**

> Tu connais la marque, la boutique ou l'endroit où tu l'as vu ?

**Options :**
- Oui, je connais la marque (→ input avec autocomplete Brand Knowledge Engine)
- Non, je ne sais pas
- C'était en vitrine (→ input ville/quartier optionnel)
- J'ai un lien (→ input URL)
- C'est elle qui m'en a parlé
- Elle l'a essayé / regardé / commenté

### Étape 5 — Source de l'envie (obligatoire)

**Candice demande :**

> Cette envie vient de qui ?

**Options :**
- Elle me l'a dit elle-même → confiance haute
- Elle l'a regardé / essayé / commenté → confiance moyenne_haute
- Je pense que ça pourrait lui plaire → confiance moyenne
- Je ne suis pas sûr → confiance moyenne_basse

### Étape 6 — Le moment de magie

**Affichage :**

> J'ai ajouté cette piste au profil de Sophie : robe longue claire, style fluide, source moyennement fiable car repérée par toi.
>
> Je la garde précieusement. Elle peut nous servir pour son anniversaire (dans 47 jours) ou pour une attention spontanée.

**Si marque inconnue :**

> Je garde la description et la photo. Si tu retrouves la marque plus tard, tu pourras l'ajouter.

**Si la marque vient d'être créée (pending_review) :**

> J'ai noté la marque. Je vais vérifier les détails et te tenir au courant.

### Étape 7 — Effet modèle

- Création `wishlist_items`
- Mise à jour `signals` (style_preference, brand_affinity si marque connue, etc.)
- Création éventuelle de `brands_and_places` en `pending_review`
- Lien avec `events` à venir pertinents (anniversaire, Noël, fête)
- Disponible immédiatement pour le Recommendation Engine

### Étape 8 — Utilisation future

Le wishlist_item sera utilisé pour :
- anniversaire
- fête saisonnière
- Noël
- envie spontanée
- soutien moral
- attention romantique
- réparation après conflit

### Cas limites W2

- Photo qui ne contient pas d'objet identifiable → Candice demande une description écrite en complément.
- Lien cassé ou inaccessible → Candice signale et demande description.
- Plusieurs objets sur une photo → Candice demande lequel intéresse.

---

## 21. W3 — Conflit (Candice coach + questionnaire conflit)

### Questionnaire conflit — à ajouter au questionnaire standard

Une nouvelle section dans le questionnaire principal (et version observation en incognito) :

#### Question 1
> Quand tu es blessé·e ou en conflit avec quelqu'un, qu'est-ce qui t'aide le plus ?

Réponses (multiples, classées) :
- Recevoir un message rapidement
- Avoir un peu d'espace puis en reparler
- Que l'autre reconnaisse précisément ce qu'il a fait
- Qu'on vienne vers moi avec douceur
- Qu'on me propose un moment ensemble
- Qu'on me laisse tranquille
- Autre (champ libre)

#### Question 2
> Après une dispute, qu'est-ce qui te touche le plus ?

- Des excuses claires
- Un geste concret
- Une discussion calme
- Un message écrit
- Une attention symbolique
- Du temps
- Une preuve que l'autre a compris

#### Question 3
> Qu'est-ce qui t'agace le plus après un conflit ?

- Faire comme si rien ne s'était passé
- Les excuses vagues
- Les grands discours
- L'humour pour dédramatiser trop vite
- L'insistance quand j'ai besoin d'espace
- Le silence prolongé
- Autre

#### Question 4
> Tu préfères qu'on revienne vers toi comment ?

- Message écrit
- Appel
- Face-à-face
- Petite attention
- Ça dépend

#### Stockage

Nouvelle section dans le profil : `conflict_preferences`.

### Mode incognito

En mode incognito, ces questions sont posées au pilote en observation :

> Quand Sophie est contrariée, elle a plutôt tendance à vouloir parler rapidement ou à avoir besoin d'espace ?

Source : perception du pilote (confiance moyenne).

Wording sur les recos :

> D'après ce que tu m'as raconté d'Estelle, il est possible que…
>
> *Niveau de confiance : moyen, car ce profil est construit en incognito.*

### Workflow W3 — étapes

#### Trigger
- Bouton central → « Je suis en conflit avec quelqu'un »
- Carte hero contextuelle

#### Étape 1 — Choix de la personne
Comme W1.

#### Étape 2 — Raconter
**Copy :**
> Raconte-moi ce qui s'est passé.

Champ texte large + photo (optionnel) + dictée.

#### Étape 3 — Analyse Candice

**État UI :** « Candice prend le temps de comprendre… »

**Analyse multi-axes :**
- gravité du conflit (léger / moyen / fort)
- émotion dominante côté pilote (colère / tristesse / culpabilité / incompréhension)
- responsabilité perçue (pilote / proche / partagée / floue)
- besoin probable du proche (selon `conflict_preferences` + ADN)
- risque de mauvaise réaction si on agit mal
- style relationnel
- niveau de confiance dans l'analyse

#### Étape 4 — Le diagnostic Candice

**Affichage :**

> Voici ce que je comprends.

Exemple :

> Tu pourrais penser qu'Estelle a besoin de silence pour redescendre.
> Mais son profil indique qu'elle est sensible aux mots et aux excuses claires. Le silence risque plutôt d'être vécu comme de l'indifférence.

#### Étape 5 — Stratégie en deux blocs

**Ce qu'il faut faire**
- envoyer un message rapidement
- reconnaître précisément le tort
- ne pas minimiser
- proposer une réparation concrète

**Ce qu'il faut éviter**
- humour
- silence prolongé
- justification
- « on oublie ? »

#### Étape 6 — Message proposé

Candice rédige un message :

> Je suis désolé. Je me rends compte que je ne me suis pas assez mis à ta place. Je comprends que ça ait pu te blesser. Je ne veux pas laisser ça entre nous. J'aimerais qu'on en parle calmement et que je répare les choses.

**Boutons :**
- Personnaliser
- Copier
- Envoyer maintenant (intent natif SMS / WhatsApp)
- Voir une alternative

#### Étape 7 — Réparation concrète

Candice propose une action :

- dîner (si profil EXP)
- fleurs (si profil GES)
- message manuscrit (si profil MOT)
- moment calme (si profil EXP / temps)
- réservation
- attention symbolique

Si l'attention implique achat ou réservation → passage en **console** (cf section 34).

#### Étape 8 — Suivi

**24-48h après :**

> Comment ça s'est passé avec Estelle ?

Options :
- Elle a accepté, on est apaisés
- On en parle bientôt
- C'est encore tendu
- Pas encore essayé

Selon la réponse, ajustement du Life State « conflit » + apprentissage.

### Cas limites W3

- Conflit avec quelqu'un qui n'est pas encore dans le cercle de proches → Candice propose de créer une fiche minimale d'abord.
- Conflit récurrent (plusieurs entrées W3 pour la même personne) → Candice signale doucement et propose une analyse plus profonde.
- Conflit qui révèle de la violence (psychologique, physique) → Candice **ne joue pas la thérapeute** ; copy spécifique : « Ce que tu décris peut nécessiter un accompagnement humain. Voici quelques ressources… » avec liens vers ressources (à valider avec Chloé pour le cadre légal).

---

## 22. W4 — Préparer un événement (timing J-30)

### Règle absolue

Ne jamais organiser un événement important la veille pour le lendemain. Candice anticipe.

### Événements concernés

anniversaire, fête des mères, fête des pères, Noël, anniversaire de mariage, naissance, promotion, diplôme, mariage, départ, crémaillère, retraite, fête saisonnière (Saint-Valentin si désiré, Hanouka, Aïd, Nouvel An chinois…).

### Timing — Candice intervient à J-X

| J-X | Action Candice |
|---|---|
| J-30 | Première détection / première suggestion |
| J-21 | Proposition structurée |
| J-14 | Relance si rien n'est validé |
| J-7 | Solution simple et sécurisée |
| J-3 | Rappel d'urgence |
| J-1 | Rappel ou exécution uniquement, pas de stratégie lourde |

### Déclenchements

**Déclenchement automatique** par Candice via les `events` du proche.

**Déclenchement manuel** :
- bouton central → « Je prépare un événement »
- saisie libre : « Je veux préparer l'anniversaire de Sophie. »

### Étape 1 — Choix de l'événement
Si déclenchement auto : déjà connu. Si manuel : Candice propose de choisir parmi les events à venir des proches.

### Étape 2 — Choix de la personne
Si déjà connu (auto) : sauté.

### Étape 3 — Stratégie en 4 blocs

Candice affiche une stratégie complète :

#### Bloc 1 — Le bon message
Le mot à dire, la phrase à écrire, le ton.

#### Bloc 2 — Le bon geste
Une action gratuite, à faire soi-même, qui montre l'effort.

#### Bloc 3 — Le bon cadeau ou expérience
Un cadeau matériel, une expérience à offrir, une réservation. Avec budget estimé et niveau de confiance.

#### Bloc 4 — La logistique
Timing, choses à prévenir, à organiser, à acheter.

### Exemple : fête des mères pour Estelle

**À J-30**, Candice envoie sur la home :

> La fête des mères approche. Qu'est-ce qui te ferait vraiment plaisir cette année ? De quoi aurais-tu besoin pour te sentir importante ce jour-là ?

(Si Estelle est aussi Pilote sur Candice.)

Estelle répond :
> Je voudrais ne pas avoir à gérer la journée. J'aimerais qu'on m'emmène quelque part de beau, et que les enfants aient fait quelque chose de leurs mains.

Candice reformule :
> J'ai compris : tu veux te sentir attendue, célébrée, et ne pas avoir à organiser toi-même cette journée. Les enfants comptent pour toi dans le souvenir.

**Notification à Thibaud (le conjoint Pilote) :**

> La fête des mères approche. Estelle a besoin de se sentir spéciale, sans avoir à porter la charge de l'organisation. Les attentions des enfants comptent particulièrement.

**Écran Thibaud — « Plan fête des mères pour Estelle » :**

```
🍽 Bloc Message
Dis-lui la veille : "Demain sois prête à 10h, on t'emmène
quelque part. Tu peux t'habiller chic mais confortable."

🎨 Bloc Geste (avec les enfants)
- Pâte à sel
- Album photo de l'année (Cheerz)
- Lettre dictée à Marius

🎁 Bloc Cadeau
3 idées proposées par Candice :
- Bijou Gemmyo (style affirmé) — 280-450€
- Une bague Carel — 180€
- Un parfum L'Officine Universelle Buly — 145€
[En cours de vérification en console]

📍 Bloc Logistique
- Restaurant : 3 idées (en cours de réservation)
- Penser à la nounou
- Prévoir 4h libres dimanche
- Cadeau à commander avant J-7
```

### Le triple workflow

W4 a deux faces, symétriques :

**Face A — « Préparer pour quelqu'un »**
Le pilote prépare une attention pour quelqu'un.

**Face B — « Dire ce qui me ferait plaisir »**
Le pilote dit à Candice ce qu'il/elle veut → Candice répercute (avec consentement) aux autres pilotes concernés.

C'est la mécanique double qui crée la magie « personne ne devine, Candice traduit ».

### Effet modèle

- Création / mise à jour `events`
- Création `recommendations` en console pour les éléments marchands
- Mise à jour `signals` du bénéficiaire selon ce qu'il a dit
- Mise à jour de l'historique d'attentions une fois validé

### Cas limites W4

- Événement à J-1 sans préparation → Candice propose seulement des choses simples.
- Événement déjà célébré l'an dernier de la même façon → Novelty Score baisse, Candice propose autre chose.
- Plusieurs pilotes pour la même bénéficiaire → Relationship Graph active la coordination (option à activer).

---

## 23. W5 — Faire plaisir à quelqu'un (spontané et proactif)

### Mode spontané (déclenché par Candice)

Candice pousse une carte hero ou une notification :

> Cela fait longtemps que tu n'as pas fait une attention à Sophie.

> Thibaud a une semaine chargée. Tu veux lui préparer quelque chose de simple ?

> Julie traverse une période fragile. Je peux te proposer une attention.

### Mode proactif (déclenché par l'utilisateur)

Bouton central → « Je veux faire plaisir à quelqu'un ».

### Étape 1 — Choix du proche

### Étape 2 — Cadrage

Candice demande :

> Pour quelle raison ?

Options :
- Juste comme ça
- Elle traverse une période difficile
- Je l'ai trop négligée
- Pour me faire pardonner
- Pour un événement précis (→ bascule W4)

> Simple, symbolique ou marquant ?

Options : Simple · Symbolique · Marquant

> Quel budget environ ?

Options : Gratuit · Petit (~30€) · Moyen (~80€) · Marqué (~150€) · Sans limite

> Pour quand ?

Options : Aujourd'hui · Cette semaine · Pas pressé

> Quel type d'attention ?

Options : Cadeau · Message · Expérience · Surprise · Candice décide

### Étape 3 — Recommandations

Candice propose **3 idées maximum**. Pour chaque idée :

```
[Visuel] Une carte avec image / illustration

Titre court
Pourquoi c'est adapté (2 lignes)
[ pastille confiance ]

Niveau d'effort : ●●○
Budget estimé : ~80€
Délai : 3 jours

[ Je valide ]  [ Voir une alternative ]
```

### Étape 4 — CTA possibles sur chaque idée

- Je valide → bascule en console (si achat/réservation) ou directement vers l'action (si gratuit)
- Voir une alternative → Candice propose une autre idée
- Trop cher → baisse budget, propose moins cher
- Pas son style → apprentissage négatif, autre style
- Plus discret → ajuste l'effort
- Plus marquant → ajuste l'effort dans l'autre sens

### Cas limites W5

- Aucune idée ne convient → Candice propose de remplir des manques d'info au lieu de proposer mal.
- Le proche est en Life State sensible → Candice oriente d'office vers du soutien plutôt que du cadeau.

---

## 24. W6 — Update fiche / Ne va pas bien / Dire ce qui me ferait plaisir

Variations légères des workflows précédents.

### W6a — Mettre à jour une fiche

- choisir le proche
- choisir la section (langage, goûts, marques, infos pratiques, conflits…)
- saisir le changement
- Candice reformule + met à jour
- effet modèle visible sur la fiche

### W6b — Quelqu'un ne va pas bien

Équivalent W1 (nouvelle négative) + déclenchement immédiat d'une attention de soutien proposée dans la foulée. Le ton est plus engagé : Candice est en mode « on agit maintenant ».

### W6c — Dire ce qui me ferait plaisir

L'utilisateur dit à Candice ce qu'il/elle voudrait (en général ou pour un événement précis). Candice :

1. enregistre dans son propre profil (`memories` type `envie_ponctuelle` ou `goût_durable`),
2. avec consentement, propose de **répercuter** aux pilotes du cercle qui le concernent (conjoint, famille).

Mécanisme du « personne ne devine, Candice traduit ».

---

## 25. Home — design et UX exacts

### Suppression absolue

> « Candice garde les relations vivantes »

Et tout texte vide, passif, marketing.

### Direction design

- Fond blanc chaud / ivoire (`#FDFDFB`)
- Cartes arrondies (border-radius 14-18px)
- Vert sapin (`#173E31`) — couleur principale, masses sombres
- Champagne (`#CDB987`) — accents, dorures discrètes
- Typo : **Fraunces** pour titres, **DM Sans** pour texte
- Micro-animations douces (éviter sec, éviter rebond)
- Beaucoup d'espace
- Sensation premium, calme, intelligente
- Jamais trop de texte
- Jamais formulaire brut en home

### Structure de la home

#### 1. Header

```
Bonjour Estelle.
```

Sous-texte variable (tourne) :
- « Qui a besoin de toi aujourd'hui ? »
- « Candice a quelques idées pour toi. »
- « Une relation à nourrir, une attention à préparer. »
- « Prends une minute pour quelqu'un qui compte. »

Avatar utilisateur (E rond) en haut à droite → cliquable, mène à **Mon profil** (bug actuel : clic mort).

#### 2. Carte hero dynamique

**Une seule carte large**, animée à l'apparition, qui change à chaque visite.

Le contenu est généré par le Priority Engine (cf section 12).

**Exemples de cartes hero :**

##### Update proche (manque d'info récente)
```
Comment va Sophie en ce moment ?
[ Lui donner des nouvelles ]
```

##### Manque d'infos sur un proche
```
Je connais encore peu les goûts de Julie.
[ Compléter son profil ]
```

##### Repérage
```
Tu as vu quelque chose qui pourrait plaire à Thibaud ?
[ Le montrer à Candice ]
```

##### Événement à venir
```
L'anniversaire de Sophie approche dans 32 jours.
[ Préparer quelque chose ]
```

##### Fête saisonnière
```
La fête des mères approche.
Qu'est-ce qui te ferait vraiment plaisir cette année ?
[ Le dire à Candice ]
```

##### Soutien
```
Quelqu'un autour de toi traverse une période difficile ?
[ Me le dire ]
```

##### Conflit
```
Tu t'es disputé·e avec quelqu'un récemment ?
[ Demander conseil ]
```

**Logique de génération :**

1. Priority Engine identifie les 3 priorités du jour.
2. La hero est la priorité 1.
3. Les cartes secondaires sont les priorités 2 et 3.
4. `home_cards_log` empêche de répéter la même carte trop souvent.

#### 3. Cartes secondaires (3 cartes)

Sous la hero, 3 cartes empilées, plus calmes, toujours visibles. Ce sont les CTA structurels :

- **J'ai une nouvelle sur un proche**
- **J'ai repéré quelque chose qui pourrait lui plaire**
- **Je veux faire plaisir à quelqu'un**

Format : card arrondie, icône discrète, copy chaleureuse, ouverture du workflow correspondant.

Une **4ème carte contextuelle** peut remplacer l'une des 3 selon le contexte :
- Quelqu'un ne va pas bien
- Je suis en conflit
- Je prépare un événement
- Je veux mettre à jour mon profil

#### 4. Bouton central / footer

Footer : Accueil · Proches · [bouton central vivant] · Idées · Profil.

Le bouton central est cliquable → **Parler à Candice**.

### Écran « Parler à Candice »

Remplace l'écran vide actuel.

```
# Que se passe-t-il ?

Dis-moi ce que tu as en tête, je m'occupe du reste.
```

8 actions, en grandes cartes verticales sobres (icône + titre + phrase explicative) :

- 🩷 J'ai une nouvelle sur un proche
- 🎁 J'ai repéré quelque chose qui pourrait lui plaire
- 😔 Quelqu'un ne va pas bien
- 💬 Je suis en conflit avec quelqu'un
- 🎂 Je prépare un événement
- ✨ Je veux faire plaisir à quelqu'un
- 📝 Je veux mettre à jour une fiche
- 💭 Je veux dire ce qui me ferait plaisir

Chaque carte :
- icône
- titre court
- phrase explicative
- card arrondie
- CTA implicite (toute la carte est cliquable)

---

## 26. Profils refondus — mon profil + fiche d'un proche

### Principe

**Suppression totale des murs de texte.** Suppression des réponses brutes. Candice synthétise.

### Mon profil

#### Header

- avatar (E rond)
- prénom (Fraunces)
- badge « Profil personnel »
- score de complétion (sans pourcentage, sous forme de pastille « En cours » / « Bien rempli » / « Très précis »)
- date dernière mise à jour
- bouton **Modifier mon profil**
- bouton **Paramètres** (icône engrenage) en haut à droite

#### Sections en cartes accordéon

Chaque section : icône + résumé IA en 2-3 lignes + chips / logos / pictos + bouton Modifier + bouton Historique.

1. ❤️ Langage d'attention
2. ✨ Ce qui me touche
3. 🌟 Ce qui me fait me sentir aimé·e
4. 🎁 Cadeaux qui fonctionnent
5. 🚫 À éviter
6. 👗 Style vestimentaire
7. 🛍 Marques aimées
8. 🍽 Restaurants
9. 🏨 Hôtels
10. 🌸 Parfums
11. ✈️ Voyages
12. 🎭 Loisirs & centres d'intérêt
13. 💭 Rêves
14. 📅 Événements importants
15. 💬 Gestion des conflits
16. 🎉 Préférences de surprise
17. 🧭 Contraintes pratiques
18. 🧬 Attention DNA
19. 🌱 Life States passés ou actuels (privé)
20. 📜 Attentions reçues qui ont fonctionné

#### Reformulation — règles

**Brut interdit :**
> J'aime bien les bijoux dorés assez gros.

**Affichage :**
> Préfère les bijoux dorés affirmés aux pièces très discrètes.

**Brut interdit :**
> J'aime les hôtels de luxe mais pas coincés.

**Affichage :**
> Apprécie les lieux premium, chaleureux et vivants, sans atmosphère trop guindée.

### Fiche d'un proche

#### Header

- avatar
- prénom (Fraunces)
- relation (famille / ami·e / conjoint / collègue)
- mode : profil confirmé (vert sapin) / incognito (champagne)
- niveau de confiance (pastille discrète)
- état émotionnel actuel si Life State actif (pictogramme discret + tooltip au survol)
- date dernière mise à jour
- bouton **Parler de [Nom] à Candice** (action principale)
- bouton **Paramètres de la fiche** (menu)

#### Sections

1. **Résumé Candice** — 2-3 phrases sur la personne
2. **Ce qui compte pour cette personne** — top des signaux clés
3. **Goûts** — sous-sections avec chips/logos
4. **Wishlist** — items repérés
5. **Life State actuel** — si applicable
6. **Événements à venir** — anniversaire, fêtes, dates perso
7. **Situation actuelle** — synthèse narrative douce
8. **Attentions passées** — ce qui a été fait, succès/échec
9. **Timeline de vie** — chronologique des events importants
10. **Timeline des attentions** — chronologique des attentions
11. **Paramètres de cette relation** — cadence, notifications, statut

### Code couleur incognito vs confirmé

Dans la liste des proches : pastille discrète.
- vert sapin → profil rempli par la personne elle-même
- champagne → profil rempli par toi en incognito

### Modification section par section

En face de chaque section : bouton **Modifier** → ouvre uniquement cette section, pas le questionnaire complet.

### Suppression : cadence globale du profil

La cadence n'est plus sur le profil personnel. Elle est dans les Préférences notifications.

---

## 27. Attention Timeline

Différente de la timeline de vie. Dédiée aux attentions faites par le pilote.

### Affichage

Chaque attention :

```
14 février
Bouquet — succès élevé
[Photo / Image]
"Elle a adoré, m'en a reparlé pendant une semaine."

Mars
Restaurant — succès moyen
"Sympa mais sans plus, elle aurait préféré quelque chose de plus intime."

Avril
Massage — succès très élevé
"Pile ce qu'il lui fallait."
```

### Champs

| Champ | Type |
|---|---|
| `attention_id` | uuid |
| `user_id` | uuid |
| `contact_id` | uuid |
| `type` | enum (cadeau, expérience, message, geste, soutien…) |
| `category` | text |
| `date` | timestamp |
| `occasion` | text nullable |
| `cost` | numeric nullable |
| `supplier` | text nullable |
| `channel` | enum (livraison, présentiel, message, appel…) |
| `recipient_reaction` | text nullable |
| `feedback` | enum (succès_très_élevé, succès_élevé, succès_moyen, mitigé, échec) |
| `success_score` | int 0-10 |
| `learning_generated` | text nullable |
| `recommendation_source` | uuid nullable |
| `notes` | text nullable |

### Impact

- éviter répétitions (Novelty Score)
- apprendre ce qui marche
- améliorer les recommandations
- ajuster l'Attention DNA

---

## 28. Cas « personne décédée / espace mémoire »

### Pourquoi c'est important

Une app de relations doit gérer la fin d'une relation, et notamment le décès.

### Dans les paramètres de fiche

Nouvelle section : **Situation particulière**

Options :
- Relation active (par défaut)
- Relation en pause
- Relation terminée
- **Personne décédée**

### Si « personne décédée »

Candice demande, doucement :

> Je suis désolée. Veux-tu conserver cette fiche comme un espace de mémoire, ou préfères-tu masquer cette personne des recommandations ?

**Options :**
- Conserver comme espace de mémoire
- Masquer des recommandations
- Archiver complètement

### Si conservée comme espace de mémoire

- Badge discret : **Mémoire**
- Couleur de la fiche : nuance de gris doux
- Candice ne propose **plus de cadeaux**
- Candice peut proposer :
  - dates de souvenir (anniversaire de naissance, anniversaire de décès, fêtes saisonnières)
  - message intime à écrire
  - rituel de mémoire
  - soutien à d'autres proches en deuil (la mère du défunt, par exemple)
  - archive de souvenirs (photos, messages, attentions passées)

### Affichage dans la liste des proches

**Ne jamais afficher « décédé » froidement.** Le badge « Mémoire » est discret, en bas de la carte du proche, à côté d'un petit symbole (✦).

### Notifications

À la date d'anniversaire de naissance / décès :

> Aujourd'hui, [Nom] aurait eu 67 ans. Tu veux écrire quelque chose ?

ou simplement :

> Une pensée pour [Nom] aujourd'hui.

L'utilisateur peut désactiver ces notifications.

---

## 29. Ajouter un proche — refonte complète

### Écran 1 — Choix du mode

Deux **grandes cartes** illustrées. La carte standard est nettement mise en avant (couleur vert sapin, taille un peu plus grande, badge « recommandé »).

#### Carte Standard

```
[Illustration]

Inviter la personne                            [recommandé]

Candice apprend directement à la connaître.

✓ Recommandations beaucoup plus précises
✓ Analyse de compatibilité entre vous
✓ Profil plus fiable
✓ Meilleure expérience pour vous deux

Nous pensons souvent connaître les personnes qu'on aime —
en réalité, on projette souvent nos propres goûts.
Candice aide à dépasser ça pour faire plaisir aux gens
en fonction de qui ils sont vraiment.

Ton proche découvrira aussi sa propre analyse.
Ça peut être agréable et amusant à recevoir.

[ Choisir ce mode → ]
```

#### Carte Incognito

```
[Illustration]

Construire son profil toi-même

Candice se basera uniquement sur ce que tu lui racontes.
Cette méthode est moins précise, mais elle reste utile.

Idéal pour :
- Une mamie
- Un enfant
- Une personne peu à l'aise avec la technologie
- Une surprise
- Une relation où l'on ne veut pas inviter directement

Vous pouvez aussi le remplir ensemble, sous forme de discussion.

[ Choisir ce mode → ]
```

**Suppression** du bandeau juridique anxiogène actuel.

### Écran 2 — Formulaire d'ajout

#### Champs

- **Prénom** — champ simple, validation : non vide
- **Genre** — 4 options modernes (femme, homme, non-binaire, je préfère ne pas préciser)
- **Relation** — menu principal :
  - Famille → **menu secondaire qui s'ouvre** : père, mère, frère, sœur, grand-parent, beau-parent, enfant, beau-fils/fille, oncle/tante, cousin·e, autre
  - Ami·e
  - Conjoint·e / Partenaire
  - Collègue
  - Autre
- **Registre de relation** — déjà en place (6 niveaux)
- **Téléphone** — validation regex internationale (`^\+?[1-9]\d{1,14}$`) + masque de saisie + message d'erreur élégant si invalide
- **Adresse postale** — **autocomplétion obligatoire** via API (Google Places ou équivalent). Menu déroulant avec adresses suggérées. L'utilisateur **doit cliquer une suggestion** ; pas d'adresse libre acceptée. Validation au backend.
- **Notifications de recommandations** — switch :
  - Activer (par défaut)
  - Activer sans afficher le prénom (cas couples adultères, vie privée)
  - Désactiver (je viendrai voir dans l'app)

#### Validation en temps réel

Chaque champ obligatoire affiche une erreur élégante en rouge sous le champ si manquant.

**Au clic sur « Créer le profil » :**
- Validation côté frontend
- Si erreurs → affichage des erreurs en rouge + scroll vers la première erreur, copy : *« Vous avez oublié l'adresse postale »* / *« Ce numéro semble invalide »*
- Si OK → création en base + redirection propre vers la fiche créée (plus de 404)

### Écran 3 — Fiche créée

Affichage de la fiche fraîchement créée, avec :
- pastille « profil incognito en cours de remplissage » ou « invitation envoyée »
- CTA suivant adapté : « Compléter le questionnaire » (incognito) ou « Envoyer l'invitation » (standard)

---

## 30. Compatibilité relationnelle

### Objectif

Quand deux profils sont confirmés (les deux personnes ont rempli leur questionnaire en standard), Candice peut produire une **analyse de compatibilité**.

### Quand l'afficher

- À la fin du parcours invité, quand le proche devient Pilote et a fini son questionnaire.
- Sur la fiche du proche, en section dédiée : **Vous deux**.
- Comme « moment magique » : pendant 24h après la complétion du proche, une notification spéciale au pilote invitant.

### Contenu

L'analyse :
- comprend pourquoi deux personnes se ratent
- comprend ce qui touche l'autre
- aide à mieux communiquer
- améliore les recommandations
- améliore le workflow conflit

### Exemple

> Estelle est sensible aux mots et à l'anticipation.
> Thibaud exprime plutôt son affection par les actes pratiques.
>
> Risque : il pense aider, mais elle peut ne pas se sentir émotionnellement rejointe.
>
> Force : il met en œuvre concrètement, là où elle a besoin d'action.
>
> Comment mieux se rejoindre :
> — Thibaud : ajouter un mot écrit, même court, à chaque geste pratique.
> — Estelle : reconnaître les actes comme une preuve d'amour, pas seulement les mots.

### Intégration produit

- Affichée comme une carte spéciale, jamais agressive.
- Disponible aussi pour les proches qui ont fini en lien.
- Pas montrée dans la fiche partage.
- Utilisée par l'IA dans :
  - le workflow conflit (« étant donné votre dynamique… »)
  - les recommandations (« ce geste compense ton angle mort »)
  - les notifications proactives

---

## 31. Notifications & cadence corrigées

### Correction de la V2

La cadence ne s'affiche **pas** sur la home. La home est pour l'action, pas pour les réglages.

### Où gérer la cadence

- **Paramètres généraux** (Mon profil → engrenage → Notifications)
- **Paramètres d'une fiche proche** (Fiche → 3 points → Notifications)
- **Action « trop de notifs ? »** depuis une notification reçue

### Principe

**Par défaut, Candice décide.** L'utilisateur peut ajuster.

### Options globales

- Laisser Candice décider (par défaut)
- Plus discret
- Plus présent
- Mettre tout en pause

### Options par proche

- Laisser Candice décider
- Plus discret pour cette personne
- Plus présent pour cette personne
- Mettre cette relation en pause
- Me notifier sans afficher le prénom (vie privée)
- Désactiver les notifications pour cette personne

### Notifications types

#### Opportunité relationnelle
> Sophie traverse une période compliquée. J'ai une idée simple pour lui faire du bien.

#### Événement à venir
> L'anniversaire de Julie est dans 30 jours. On prépare quelque chose de vraiment juste ?

#### Wishlist
> Tu avais noté que Thibaud avait aimé cette veste. Son anniversaire approche.

#### Feedback
> Est-ce que ton attention pour Sophie lui a plu ?

#### Revalidation
> Sophie avait perdu son travail il y a un mois. Est-ce toujours d'actualité ?

#### Console validée
> J'ai trouvé une option disponible pour Estelle. Tu veux que je te la montre ?

#### Conflit suivi
> Comment ça s'est passé avec Estelle après votre discussion ?

#### Date de mémoire
> Aujourd'hui, [Nom] aurait eu 67 ans. Tu veux écrire quelque chose ?

### Règles techniques

- Jamais le matin avant 8h, jamais le soir après 21h (configurable).
- Pas plus de 2 notifs par jour, sauf urgence.
- Si une notif est ignorée 3 fois pour le même type → réduire automatiquement la fréquence et demander confirmation.

### Push-first + email fallback

Notification « ton proche a complété » : push immédiat, email seulement si non ouvert sous 6h.

---

## 32. Quiz mensuel d'affinage

### Objectif

Affiner le profil sans questionnaire lourd. Une fois par mois.

### Format

Cartes visuelles à swiper. Question :

> Lequel te plairait le plus ?

Types de cartes :
- robes
- restaurants
- vins
- cadeaux
- parfums
- hôtels
- expériences
- bijoux
- activités
- déco
- voyages

### Génération

- 15-20 cartes par session (3-4 minutes)
- Tirage : catalogue + base de marques + suggestions IA
- Différent à chaque mois (anti-répétition)
- Cible des dimensions encore floues du profil

### Stockage

Table `profile_refinements` :
- id
- user_id
- quiz_id
- type (mode, gastro, voyage, etc.)
- choices_json (les paires montrées + les choix)
- created_at

### Impact

Met à jour :
- goûts (signals)
- ADN d'attention
- marques aimées
- préférences catalogue
- recommandations

### UI

Modal plein écran, swipe gauche/droite, animation douce.

---

## 33. Catalogue d'attentions

### Objectif

Vrai catalogue interne, structuré, qui alimente le Recommendation Engine.

### Types

- cadeaux physiques
- bijoux
- fleurs
- beauté
- mode
- livres
- expériences
- restaurants
- hôtels
- ateliers
- abonnements
- cadeaux enfant
- cadeaux faits maison
- messages (templates de copy)
- attentions gratuites
- attentions symboliques
- attentions de soutien
- attentions de réparation
- services
- livraisons

### Champs

| Champ | Type |
|---|---|
| `id` | uuid |
| `name` | text |
| `category` | text |
| `subcategory` | text |
| `description` | text |
| `image_url` | text nullable |
| `budget_min` | numeric |
| `budget_max` | numeric |
| `emotional_intensity` | enum (douce, moyenne, marquée, très_marquée) |
| `occasion_ideal` | text[] |
| `relationship_ideal` | text[] (partenaire, ami, famille, collègue) |
| `life_states_compatible` | text[] |
| `attention_dna_compatible` | jsonb |
| `tags_personality` | text[] |
| `tags_style` | text[] |
| `delivery_constraints` | jsonb (zone, délai min) |
| `city_zone` | text nullable |
| `supplier_id` | uuid nullable |
| `has_api` | boolean |
| `margin_estimated` | numeric nullable |
| `risk_level` | enum (faible, moyen, élevé) |
| `quality_score_admin` | int 0-10 |
| `status` | enum (active, inactive, draft, pending_review) |
| `last_price_check` | timestamp |
| `last_availability_check` | timestamp |
| `created_at` | timestamp |
| `updated_at` | timestamp |
| `created_by` | uuid (admin ou IA) |

### Co-construction

- **Toi** ajoutes des pièces depuis la console (coller un lien → scrape titre/image/prix).
- **IA** propose en recherche live (Amazon affiliate, web) → tu valides → entrent au catalogue.
- **Feedback** met à jour le `quality_score_admin`.


---

## 34. Console Candice — cockpit opérationnel complet

### Principe

La console n'est pas juste une validation. C'est le **cockpit opérationnel** qui pilote tout l'arrière du produit.

### Objectifs

- vérifier les recommandations IA avant qu'elles partent au pilote
- vérifier prix et disponibilité
- trouver mieux si besoin (alternative)
- valider ou remplacer
- gérer les commandes
- gérer les réservations
- suivre les livraisons
- déclencher les notifications
- enrichir la base de marques
- enrichir le catalogue
- collecter les feedbacks
- analyser la performance

### Vue principale — pipeline en colonnes (Kanban-style)

```
# Console Candice

[Nouvelles recos]  [En recherche]  [Prêtes pilote]  [Envoyées]
[Validées pilote]  [À commander]   [Commandées]    [Livrées]
[Feedback]         [Clôturées]
```

### Card console — structure

Chaque card contient :

```
[Photo / illustration]

Fête des mères — Estelle
Pilote : Thibaud · Deadline : J-24 · Budget : 250€

RECO IA :
Bijou doré affirmé + brunch surprise + cadeau enfant fait maison

JUSTIFICATION :
- Estelle aime les bijoux dorés
- aime les expériences organisées
- veut ne pas gérer la logistique
- aime se sentir anticipée

SCORES :
Profile Match : 9/10
Life State : 8/10
Emotional Match : 9/10
Timing : 9/10
Logistics : 7/10
Risk : 3/10
Final Score : 8,7/10

NIVEAU URGENCE : moyen
STATUT STOCK : à vérifier
HISTORIQUE : aucune attention similaire dans les 6 derniers mois

ACTIONS :
[ Valider ] [ Modifier ] [ Remplacer ] [ Chercher alternative ]
[ Ajouter lien ] [ Ajouter prix ] [ Ajouter disponibilité ]
[ Envoyer au pilote ] [ Marquer à commander ] [ Marquer à réserver ]
```

### Toutes les vues à créer

#### Vue Pilote (un par utilisateur)

Pour chaque pilote, voir :
- proches actifs
- événements à venir
- recommandations en attente
- commandes en cours
- historique complet d'attentions
- abonnement et paiements
- niveau d'activité (dernière connexion, dernière action)
- taux d'ouverture mails / clic notifs
- ce qui fonctionne, ce qui ne fonctionne pas
- panier moyen
- marge cumulée

#### Vue Proche (un par contact dans n'importe quel cercle)

Pour chaque proche, voir :
- Life State actuel
- ADN d'attention
- wishlist
- historique d'attentions reçues
- recommandations passées (acceptées / rejetées / raison)
- feedback
- préférences
- risques détectés (signaux contradictoires, manque d'info)
- timeline de vie

#### Vue Catalogue

Items actifs / à vérifier / draft / désactivés. Pour chaque item :
- prix dernier check
- disponibilité dernier check
- fournisseur
- score qualité admin
- performance (taux d'acceptation pilote, taux de satisfaction final)

#### Vue Marques & lieux

Onglets :
- pending_review (à valider)
- verified
- duplicates (à fusionner)
- rejected

#### Vue Événements

Tableau des events à venir avec colonnes par timing :
- J-30 / J-21 / J-14 / J-7 / J-3 / J-1
- chaque event affiche le pilote, le proche, le type, la deadline, l'avancement

#### Vue Commandes

Pipeline :
- à commander
- commandé
- tracking
- livré
- problème

Chaque commande affiche : pilote, proche, item, fournisseur, prix, lien tracking, date prévue de livraison.

#### Vue Réservations

Pipeline :
- à appeler
- contacté
- réservé
- confirmation envoyée
- impossible
- alternative nécessaire

#### Vue Feedback

- en attente (attention envoyée mais pas encore de feedback)
- succès (très_élevé, élevé, moyen)
- échec
- apprentissages générés

#### Vue Performance

KPI globaux :
- taux de validation pilote (combien de recos validées / proposées)
- taux de satisfaction (succès final / attentions envoyées)
- catégories d'attentions qui marchent le mieux
- fournisseurs performants
- prix moyen par catégorie
- temps moyen de traitement (depuis détection signal → livraison)
- taux de refus par raison
- top causes d'échec

### CRM client intégré

Sur la fiche d'un pilote (« Vue Pilote »), un onglet CRM :
- abonnement (actif / essai / churn) + historique des paiements
- toutes les commandes / paniers
- panier moyen
- taux d'ouverture mails / push
- ce qui marche / ne marche pas
- notes admin libres
- adaptation de la stratégie (boutons : « plus discret », « plus présent », « tester nouvelle approche »)

### Catalogue admin

Depuis la Console :
- ajouter une pièce (coller un lien → scrape titre / image / prix)
- valider une suggestion IA (recherche live)
- éditer
- désactiver
- voir performance

### Marques & lieux admin

Depuis la Console :
- valider une entrée en `pending_review`
- fusionner doublons
- ajouter logo manuellement
- corriger la catégorie

### Pilotage emails et push depuis la Console

- voir les envois (qui, quand, type)
- voir les ouvertures / clics
- relancer / pauser un workflow
- voir la performance par template

### Permissions

- **Admin** (toi) : tout
- **Curatrice** (futur recrutement) : recos + catalogue + marques, pas l'accès financier
- **Concierge premium** (futur) : son périmètre Premium uniquement
- **Ops** (futur) : commandes et réservations uniquement

---

## 35. UX pilote — proposition d'attention

### Écran dédié : « Proposition Candice »

#### Design

- Carte premium
- Image produit ou expérience (haute qualité)
- Titre clair (Fraunces)
- Justification courte
- Budget
- Timing
- Pastille de niveau de confiance
- CTAs très visibles

#### Structure

```
[Image en haut, pleine largeur]

J'ai une idée pour Sophie

Pourquoi je te propose ça :
Sophie traverse une période difficile. Son profil indique
qu'elle est sensible aux attentions simples mais
personnalisées. Cette idée coche ces deux critères.

[Détails de l'attention proposée]
Nom : Carte cadeau spa, à domicile ou en institut
Budget : 80€
Délai : 24h
Confiance : ●●○ (moyenne_élevée)

Ce que tu peux faire :
[ Je valide ]
[ Je veux une alternative ]
[ Trop cher ]
[ Pas adapté ]
[ Plus discret ]
[ Plus marquant ]
```

### Trois CTA principaux (toujours visibles)

- **Je valide** → bascule en console pour commande/réservation
- **Je veux une alternative** → Candice propose une autre idée
- **Trop cher / Pas adapté / Plus discret / Plus marquant** → apprentissage Candice + nouvelle proposition

### Variantes selon le type d'attention

#### Si attention gratuite (message, geste, faire soi-même)

Pas de passage en console. Bouton direct :
- « Je copie le message »
- « Je note ça pour ce soir »
- « Je l'envoie maintenant »

#### Si attention marchande

Passage console obligatoire. Le pilote voit le « je valide » mais le statut affiché est : « Candice vérifie la disponibilité, je reviens vers toi sous 24h. »

#### Si stratégie multi-éléments (W4 événement)

Affichage en 4 blocs (message + geste + cadeau + logistique), chaque bloc avec ses propres CTAs.

---

## 36. Workflow complet : recommandation → commande → feedback

### Étape 1 — Détection

Déclencheurs :

- événement à venir (auto, via `events`)
- Life State actif (auto, via `life_states`)
- conflit récent (auto)
- wishlist exploitable (item + occasion qui s'approche)
- relation négligée (cadence dépassée)
- demande proactive (utilisateur clique « Faire plaisir »)
- opportunité saisonnière (fête, Noël, Saint-Valentin…)

### Étape 2 — Génération

Le Recommendation Engine produit **1 à 3 pistes** par déclencheur.

### Étape 3 — Scoring

Le Scoring Engine calcule les 12 scores + le Final Score.

### Étape 4 — Console

Si l'attention implique achat / réservation / prix / disponibilité → **entrée console** automatique.

Statut initial : `nouvelle_recommandation_à_vérifier`.

### Étape 5 — Validation admin

L'admin (toi) vérifie en console :
- pertinence
- prix
- disponibilité
- meilleur tarif
- fournisseur
- délai
- risque
- wording de la justification

Actions possibles :
- valider
- modifier (changer l'item ou le wording)
- remplacer (autre item)
- proposer alternatives
- refuser

**Saisie manuelle du prix / dispo / délai validés** (sites sans API) → 10 secondes.
**Auto-coché** sur les sites avec API (Booking, Amazon, OpenTable).

### Étape 6 — Proposition au pilote

Une fois validée en console, la reco est poussée au pilote sous forme de carte (cf section 35).

```
[Carte premium avec image, titre, pourquoi, scores, CTAs]
```

Statut : `envoyée_au_pilote`.

### Étape 7 — Validation pilote

Si le pilote clique **Je valide** :
- retour automatique en console
- statut : `validée_par_le_pilote — à_commander` ou `à_réserver`
- la carte de paiement choisie par le pilote (modèle Amazon) est associée à la commande

### Étape 8 — Commande ou réservation

#### Si API disponible

Commande passée semi-automatiquement ou automatiquement. Statut auto-mis à jour.

#### Si pas d'API

L'admin commande manuellement. Saisit dans la Console :
- numéro de commande
- tracking
- prix final exact
- fournisseur
- date prévue de livraison
- message cadeau si applicable

#### Pour réservation

Statuts :
- à appeler
- contacté
- réservé
- confirmation envoyée
- impossible (→ alternative nécessaire, retour étape 5)

### Étape 9 — Notifications pilote

#### Commande passée
> C'est commandé. Le cadeau pour Sophie est en route.

#### Livraison prévue
> Livraison prévue vendredi.

#### Cadeau livré
> Le cadeau a été livré aujourd'hui.

#### Réservation confirmée
> C'est réservé pour samedi à 19h30 chez [nom], [adresse].
>
> Pense à lui dire : « Sois prête à 19h, je t'emmène dîner. »

### Étape 10 — Feedback

Après la date prévue / livraison :

> Alors, est-ce que ça lui a plu ?

Options :
- Oui, beaucoup
- Oui, plutôt
- Moyen
- Non
- Je ne sais pas encore

Puis :
> Dis-moi ce qui s'est passé.

Champ libre (optionnel).

### Étape 11 — Apprentissage

Si positif :
> Je le garde en mémoire : ce type d'attention fonctionne bien avec Sophie.

Si négatif :
> Je note que ce n'était pas le bon registre. Je l'éviterai à l'avenir.

Le Learning Engine met à jour :
- profil
- ADN d'attention
- historique
- scores des signaux utilisés
- score qualité du catalogue item
- performance du fournisseur

---

## 37. Paramètres

### Accès

- icône engrenage sur **Mon profil** en haut à droite
- menu 3 points sur la **fiche d'un proche**

### Paramètres généraux

- **Compte** (email, mot de passe, déconnexion)
- **Abonnement** (plan, paiement, méthodes de paiement type Amazon)
- **Notifications** (cadence globale, horaires permis, push/email)
- **Confidentialité** (visibilité du profil, suppression compte RGPD)
- **Proches** (liste avec actions rapides : pause, archiver…)
- **Personnes archivées** (vue dédiée des proches archivés / Mémoire)
- **Fréquence Candice** (style global)
- **Aide / contact**
- **Se déconnecter**

### Paramètres d'une fiche proche

- mode de profil (standard / incognito)
- relation (modifier)
- registre
- notifications spécifiques à cette personne
- statut de la relation (active / en pause / terminée / mémoire)
- supprimer / archiver

### Footer

Pas de réglages lourds dans le footer. Footer = navigation pure (Accueil · Proches · [bouton central] · Idées · Profil).

---

## 38. Modèle de données enrichi

### Vue d'ensemble — 22 tables

1. `users`
2. `contacts`
3. `relationship_graph`
4. `memories`
5. `signals`
6. `life_states`
7. `attention_dna`
8. `trust_scores`
9. `recommendations`
10. `recommendation_scores`
11. `wishlist_items`
12. `brands_and_places`
13. `catalog_items`
14. `console_tasks`
15. `orders`
16. `reservations`
17. `attention_history`
18. `feedback`
19. `profile_refinements`
20. `conflict_sessions`
21. `events`
22. `notifications`
23. `admin_reviews`
24. `home_cards_log`
25. `learning_events`

### Détails par table

#### users
Existant. Ajouter :
- `cadence_global_style` (discret / normal / soutenu / pause)
- `notification_hours` (jsonb : `{morning_after: 8, evening_before: 21}`)
- `subscription_status`
- `subscription_started_at`
- `default_payment_method_id`

#### contacts
Existant + ajouter :
- `relation_subtype` (père, mère, etc. quand famille)
- `notify_pref` (full / no_name / silent)
- `cadence_style` (laisser_candice / discret / soutenu / pause / contextuel)
- `situation` (active / en_pause / terminée / mémoire)
- `mode` (standard / incognito)
- `confidence_global` (int 0-100 calculé par Trust Engine)

#### relationship_graph
Voir section 15.

#### memories
Voir section 5 (champs complets).

#### signals
Voir section 6.

#### life_states
Voir section 7.

#### attention_dna
- `id`
- `contact_id`
- `dimension` (text : `aime_surprises`, `aime_scénarisation`…)
- `value` (int -2 à +2)
- `confidence` (int 0-100)
- `last_updated_at`
- `source` (questionnaire / feedback / quiz / observation)

#### trust_scores
- `id`
- `contact_id` (ou `user_id`)
- `global_score` (int 0-100)
- `by_dimension` (jsonb)
- `last_calculated_at`

#### recommendations
- `id`
- `user_id`
- `contact_id`
- `title`
- `category` / `subcategory`
- `description`
- `why_it_fits`
- `signals_used` (uuid[])
- `final_score` (numeric)
- `confidence` (enum)
- `timing_target` (date nullable)
- `event_id` (uuid nullable)
- `budget_estimated_min` (numeric)
- `budget_estimated_max` (numeric)
- `logistics` (jsonb)
- `admin_validation_required` (boolean)
- `risk_notes` (text)
- `status` (enum : nouvelle / en_console / prête_pilote / envoyée / validée_pilote / refusée_pilote / à_commander / commandée / livrée / clôturée / annulée)
- `created_at` / `updated_at`

#### recommendation_scores
- `id`
- `recommendation_id`
- `score_name` (profile_match / life_state / emotional_match / timing / relationship / surprise / effort / novelty / logistics / risk / budget_fit / confidence)
- `score_value` (numeric 0-10)
- `notes` (text)

#### wishlist_items
- `id`
- `user_id`
- `contact_id`
- `content` (description)
- `photo_url` (text nullable)
- `source_url` (text nullable)
- `brand_id` (uuid nullable → `brands_and_places`)
- `occasion_target` (text nullable)
- `origin` (enum : elle_l_a_dit / elle_l_a_regardé / je_pense / je_ne_sais_pas)
- `confidence` (int 0-100)
- `status` (enum : actif / utilisé / expiré / archivé)
- `created_at`

#### brands_and_places
Voir section 16.

#### catalog_items
Voir section 33.

#### console_tasks
- `id`
- `type` (validation_reco / commande / réservation / marque_à_valider / feedback_à_collecter)
- `related_id` (uuid — id de la reco / commande / etc.)
- `assigned_to` (uuid admin nullable)
- `status` (enum)
- `priority` (enum : basse / normale / haute / urgente)
- `created_at`
- `due_at` (timestamp nullable)
- `completed_at` (timestamp nullable)
- `admin_notes` (text)

#### orders
- `id`
- `user_id`
- `contact_id`
- `recommendation_id`
- `catalog_item_id` (uuid nullable)
- `supplier_id` (uuid nullable)
- `supplier_name` (text)
- `external_order_id` (text)
- `price_paid` (numeric)
- `currency` (text)
- `payment_intent_id` (text — Stripe)
- `payment_method_id` (text — Stripe)
- `delivery_address` (jsonb)
- `tracking_url` (text)
- `expected_delivery_at` (timestamp)
- `delivered_at` (timestamp nullable)
- `status` (enum : à_commander / commandée / expédiée / livrée / échec / remboursée)
- `notes` (text)

#### reservations
- `id`
- `user_id`
- `contact_id`
- `recommendation_id`
- `venue_id` (uuid nullable → `brands_and_places`)
- `venue_name` (text)
- `reservation_datetime` (timestamp)
- `party_size` (int)
- `confirmation_code` (text nullable)
- `payment_intent_id` (text nullable, si paiement à l'avance)
- `status` (enum : à_appeler / contacté / réservé / confirmation_envoyée / impossible / alternative_nécessaire / honorée / annulée)
- `notes` (text)

#### attention_history
Voir section 27.

#### feedback
- `id`
- `attention_history_id`
- `user_id`
- `contact_id`
- `reaction` (enum : c_était_juste / à_côté / pas_le_bon_moment / autre)
- `success_score` (int 0-10 nullable)
- `pilote_comment` (text nullable)
- `recipient_reaction` (text nullable)
- `learning_generated` (text nullable)
- `created_at`

#### profile_refinements
Voir section 32.

#### conflict_sessions
- `id`
- `user_id`
- `contact_id`
- `story` (text)
- `analysis_json` (jsonb)
- `strategy_do` (text[])
- `strategy_avoid` (text[])
- `message_drafted` (text)
- `action_proposed_id` (uuid nullable → `recommendations`)
- `status` (enum : en_cours / en_attente_de_suivi / résolu / non_résolu)
- `follow_up_date` (timestamp nullable)
- `outcome` (text nullable)
- `created_at`

#### events
- `id`
- `user_id`
- `contact_id` nullable
- `type` (anniversaire / fête_des_mères / mariage / etc.)
- `event_date` (date)
- `recurring` (boolean)
- `recurrence_pattern` (text nullable : yearly / monthly)
- `notes` (text)
- `status` (active / archivé)

#### notifications
- `id`
- `user_id`
- `contact_id` nullable
- `type` (opportunité / événement / wishlist / feedback / revalidation / console / conflit / mémoire)
- `channel` (push / email / in_app)
- `title` (text)
- `body` (text)
- `cta_url` (text nullable)
- `sent_at` (timestamp)
- `opened_at` (timestamp nullable)
- `clicked_at` (timestamp nullable)
- `dismissed_at` (timestamp nullable)
- `priority` (enum)

#### admin_reviews
- `id`
- `entity_type` (recommendation / brand / catalog_item / order / reservation)
- `entity_id` (uuid)
- `reviewer_id` (uuid)
- `action` (validate / modify / replace / reject / defer)
- `notes` (text)
- `reviewed_at` (timestamp)

#### home_cards_log
- `id`
- `user_id`
- `card_type` (update_proche / repérage / événement / soutien / conflit / fête / etc.)
- `card_content_json` (jsonb)
- `shown_at` (timestamp)
- `clicked_at` (timestamp nullable)
- `dismissed_at` (timestamp nullable)

#### learning_events
- `id`
- `user_id`
- `contact_id`
- `event_type` (feedback_positif / feedback_négatif / refus / modification_admin)
- `source_recommendation_id` (uuid nullable)
- `signals_updated` (jsonb)
- `adn_updated` (jsonb)
- `created_at`

---

## 39. Bugs à corriger immédiatement

Tous remontés lors du test du 1er juin 2026.

1. Bouton « Dis quelque chose à Candice » ne réagit pas — clic mort.
2. Bouton central mène à une page vide « Parler à Candice » sans contenu.
3. 404 après création de proche (proche créé en base malgré le 404).
4. 404 sur modification de profil proche.
5. 404 sur questionnaire standard.
6. 404 sur questionnaire incognito.
7. Avatar utilisateur (E rond) cliquable mais sans action — doit ouvrir Mon profil.
8. Note affichée brute sur fiche Sophie (« Sophie ne va pas bien… ») — doit déclencher W1 (reformulation + magie).
9. Profil personnel = copier-coller des réponses brutes — refonte selon section 26.
10. Adresse invalide acceptée (pas d'autocomplete).
11. Faux numéro de téléphone accepté.
12. Sous-menu famille absent quand on choisit « Famille » dans la relation.
13. Bandeau juridique anxiogène sur l'écran incognito — à supprimer.
14. Cadence globale affichée sur le profil — à déplacer dans les paramètres.
15. Footer / paramètres / déconnexion insuffisants — refonte selon section 37.
16. Création profil sans message d'erreur clair quand champ obligatoire manquant.
17. Absence d'autocomplétion adresse.
18. Absence de validation téléphone.
19. Sur la fiche d'un proche, pas de code couleur entre incognito et standard.
20. Pas de bouton « modifier » par section sur le profil.

---

## 40. Roadmap par lots

Chaque lot est autoporteur. Dépendances explicites. Pour chaque lot : objectif, livrables, dépendances, tag (dev / humain / IA).

### Lot 0 — Fix critiques (priorité absolue)

**Objectif :** débloquer tous les tests.

**Livrables :**
- Fix 404 création proche (bug 3)
- Fix 404 modification proche (bug 4)
- Fix 404 questionnaire standard (bug 5)
- Fix 404 questionnaire incognito (bug 6)
- Fix clic avatar utilisateur (bug 7)
- Fix bouton central → écran de base « Parler à Candice » (bug 2)
- Fix bouton « Dis quelque chose à Candice » → ouvre Parler à Candice (bug 1)

**Dépendances :** aucune.

**Tags :** dev.

**Estimation :** 1 jour.

### Lot 1 — Parler à Candice + W1 + W2

**Objectif :** la magie centrale.

**Livrables :**
- Écran « Parler à Candice » complet avec les 8 actions (section 25)
- Workflow W1 — Nouvelle sur un proche (section 19)
- Workflow W2 — Repéré quelque chose corrigé (section 20)
- Animation « Candice réfléchit »
- Reformulation IA + affichage progressif
- Pictogramme sur la fiche du proche
- Migration 23 (`memories`)
- Migration 24 (`wishlist_items` enrichi)

**Dépendances :** Lot 0.

**Tags :** dev + IA.

### Lot 2 — Candice Brain V1

**Objectif :** poser le cerveau propriétaire.

**Livrables :**
- Memory Engine — extraction structurée depuis texte libre (section 5)
- Signal Engine — extraction de signaux depuis mémoires (section 6)
- Trust Engine — calcul des scores de confiance (section 9)
- Statuts mémoire (actif / à_revalider / archivé / invalidé / sensible)
- Reformulation systématique (jamais de brut affiché)
- Migration `signals` + `trust_scores`

**Dépendances :** Lot 1.

**Tags :** dev + IA.

### Lot 3 — Profils refondus

**Objectif :** fin des murs de texte.

**Livrables :**
- Mon profil — synthèse en 20 sections accordéon (section 26)
- Fiche proche — refonte avec 11 sections
- Bouton « Modifier » par section
- Suppression du copier-coller brut
- Reformulation IA par section
- Suppression cadence du profil

**Dépendances :** Lot 2 (pour la reformulation propre).

**Tags :** dev + IA.

### Lot 4 — Ajouter un proche V2

**Objectif :** refonte propre du parcours.

**Livrables :**
- Écran « Choisis le mode » premium (section 29)
- Suppression bandeau juridique
- Formulaire avec sous-menu famille
- Validation téléphone (regex)
- Autocomplétion adresse (Google Places ou équivalent)
- Switch notifications par proche
- Validation en temps réel + messages d'erreur élégants
- Code couleur incognito vs standard dans la liste des proches

**Dépendances :** Lot 0.

**Tags :** dev.

### Lot 5 — Life State + Attention DNA

**Objectif :** Candice comprend ce que vit la personne.

**Livrables :**
- Life State Engine (section 7)
- Attention DNA Engine (section 8)
- Questions conflit dans le questionnaire (section 21)
- Taxonomie des événements de vie codée en règles (section 17)
- Migrations `life_states`, `attention_dna`, `conflict_preferences`

**Dépendances :** Lot 2.

**Tags :** dev + IA.

### Lot 6 — Recommendation Engine + Scoring

**Objectif :** Candice recommande pour de vrai.

**Livrables :**
- Recommendation Engine (section 11) — refonte du Module 6
- Scoring Engine (section 10) — 12 scores + Final Score
- Priority Engine (section 12) — top 3 par jour
- Règle absolue : aucune reco marchande sans passage console
- Migrations `recommendations`, `recommendation_scores`

**Dépendances :** Lot 5.

**Tags :** dev + IA.

### Lot 7 — Catalogue d'attentions

**Objectif :** structure interne du catalogue.

**Livrables :**
- Table `catalog_items` (section 33)
- Admin du catalogue dans la Console (ajout par lien + scrape)
- Premiers items chargés (toi + ton mari + recherche IA)
- Tags personnalité / style / Life States

**Dépendances :** Lot 6 (pour que le moteur en ait l'usage).

**Tags :** dev + humain.

### Lot 8 — Brand Knowledge Engine

**Objectif :** marques et lieux automatiquement enrichis.

**Livrables :**
- Table `brands_and_places` (section 16)
- Recherche live + enrichissement auto (logo, site, catégorie)
- Statut `pending_review`
- Vue Console dédiée
- Autocomplétion côté pilote (saisie marque dans Mon profil ou wishlist)

**Dépendances :** Lot 3.

**Tags :** dev + IA + humain (validation).

### Lot 9 — Console Candice

**Objectif :** cockpit opérationnel complet.

**Livrables :**
- Vue Pipeline (10 colonnes — section 34)
- Vue Pilote (CRM)
- Vue Proche
- Vue Catalogue
- Vue Marques & lieux
- Vue Événements
- Vue Commandes
- Vue Réservations
- Vue Feedback
- Vue Performance (KPIs)
- Permissions

**Dépendances :** Lot 6, 7, 8.

**Tags :** dev.

### Lot 10 — UX pilote propositions

**Objectif :** carte de proposition premium.

**Livrables :**
- Écran « Proposition Candice » (section 35)
- CTAs : valide / alternative / trop cher / pas adapté / discret / marquant
- Variantes selon type (gratuit vs marchand vs stratégie multi-éléments)

**Dépendances :** Lot 6.

**Tags :** dev.

### Lot 11 — Commande / réservation / livraison

**Objectif :** workflow opérationnel complet.

**Livrables :**
- Tables `orders`, `reservations`
- Statuts pipeline (à_commander → livré)
- Sélection carte de paiement (Stripe, modèle Amazon)
- PaymentIntent en autorisation manuelle (pas de débit avant confirmation)
- Notifications pilote (commandé / livré / réservé)
- Connecteurs API premiers (Booking, Amazon, OpenTable)
- Mode manuel (admin coche dans la Console)

**Dépendances :** Lot 9.

**Tags :** dev + humain.

### Lot 12 — Feedback loop

**Objectif :** Candice apprend.

**Livrables :**
- Table `feedback`, `learning_events`
- Question post-attention (« est-ce que ça lui a plu ? »)
- Learning Engine (section 13)
- Update auto signals / ADN / scores / catalogue / fournisseurs
- Apprentissage par contact (pas global)

**Dépendances :** Lot 11.

**Tags :** dev + IA.

### Lot 13 — Événements J-30

**Objectif :** Candice anticipe.

**Livrables :**
- Table `events` enrichie (récurrence)
- Détection auto J-30 / J-21 / J-14 / J-7 / J-3 / J-1
- Workflow W4 — Préparer un événement (section 22)
- Stratégie en 4 blocs (message / geste / cadeau / logistique)
- Notification au conjoint pour la mécanique « dire ce qui me ferait plaisir »
- Workflow W5 — Faire plaisir (section 23)

**Dépendances :** Lots 6, 10.

**Tags :** dev + IA.

### Lot 14 — Quiz mensuel

**Objectif :** affiner sans questionnaire lourd.

**Livrables :**
- Table `profile_refinements`
- Moteur de quiz (génération mensuelle, 15-20 cartes)
- Swipe gauche/droite
- Update auto des signaux et de l'ADN
- Notification mensuelle au pilote

**Dépendances :** Lot 6, 7.

**Tags :** dev + IA.

### Lot 15 — Compatibilité relationnelle

**Objectif :** analyse croisée entre 2 profils confirmés.

**Livrables :**
- Génération de l'analyse à la fin du parcours invité
- Affichage dans une section « Vous deux » sur la fiche
- Intégration dans le workflow conflit
- Intégration dans les recommandations

**Dépendances :** Lots 2, 5.

**Tags :** dev + IA.

### Lot 16 — Cercle relationnel / multijoueur

**Objectif :** coordination entre pilotes pour une même bénéficiaire.

**Livrables :**
- Relationship Graph Engine (section 15) — table opérationnelle
- Suggestions de Candice (« veux-tu impliquer Marius ? »)
- Notification croisée si plusieurs pilotes préparent la même fête

**Dépendances :** Lot 13.

**Tags :** dev.

### Lot 17 — Performance console + Forgetting Engine

**Objectif :** mesure et entretien.

**Livrables :**
- Vue Performance dans la Console (KPIs section 34)
- Forgetting Engine (section 14) — revalidation auto + notifs
- Actions utilisateur sur chaque mémoire (toujours valable / plus valable / archiver / masquer)
- Cas mémoire / personne décédée (section 28)

**Dépendances :** Lots 2, 9.

**Tags :** dev.

### Lot 18 — Vocal natif (Capacitor)

**Objectif :** vocal premium.

**Livrables :**
- Migration Capacitor (wrapper natif)
- Push natif
- Voix in-app (TTS)
- Conversation vocale continue (Candice répond)
- Extension OS-level (widget, raccourci Siri, action button)

**Dépendances :** tous les workflows codés.

**Tags :** dev.

---

## 41. Points de vigilance techniques

### Architecture

- **L'IA n'est pas le produit.** Toute décision irréversible doit pouvoir être prise sans LLM. Le LLM est un module d'analyse, encadré par les moteurs propriétaires.
- **Idempotence.** Toutes les routes de création (memories, signals, recommendations) doivent être idempotentes — un même event utilisateur ne doit pas créer 2 entrées.
- **Fallback déterministe.** Si le LLM tombe, on stocke le brut + on indique à l'utilisateur que Candice analysera plus tard.

### Performance

- Les analyses lourdes (Memory + Signal + Life State + Recommendation) tournent en arrière-plan (queue / job), pas en synchrone — sinon l'UX est cassée.
- Cron 2×/jour pour la génération de recos.
- Cache des `signals` et `attention_dna` (lectures fréquentes).

### Sécurité et confidentialité

- Reformulation systématique avant affichage.
- `visibility_level` sur les mémoires (privé / partageable_synthèse / partageable_brut).
- Les `raw_input` ne sont JAMAIS exposés côté front, seulement en console admin.
- Photos uploadées (W2) : bucket Supabase privé, URLs signées 1h (cohérent avec ce qui existe).
- Conformité RGPD : pause, export, suppression — workflow simple.

### IA — encadrement

- Tous les prompts LLM ont une **structure de sortie validée** (JSON schema). Si le LLM répond hors schéma → fallback.
- Catégorisation contrainte par la **taxonomie Candice** (pas de catégorie inventée par l'IA).
- Logs des prompts + réponses (anonymisés) pour debug.

### Notifications

- Jamais avant 8h, jamais après 21h (configurable).
- Anti-flood : pas plus de 2 notifs / jour sauf urgence.
- Reconfigurable selon le feedback (cf section 31).

### Paiements

- Stripe seul (jamais de carte stockée par toi).
- PaymentIntent en autorisation manuelle (`manual_capture`) — débit seulement après confirmation commande.
- Modèle Amazon : multiples cartes possibles, sélection à chaque achat.
- Pas de case « j'autorise » anxiogène.

### Console — performance

- La Console doit rester fluide à plusieurs centaines de tâches simultanées.
- Recherche full-text sur les fiches proches et marques.
- Filtres par pilote, par proche, par statut, par urgence.
- Export CSV pour reporting.

### Migrations à prévoir (récap)

- Migration 23 : `memories`
- Migration 24 : `wishlist_items` enrichi
- Migration 25 : `signals`, `trust_scores`
- Migration 26 : `life_states`, `attention_dna`, `conflict_preferences`
- Migration 27 : `recommendations`, `recommendation_scores`
- Migration 28 : `catalog_items`
- Migration 29 : `brands_and_places`
- Migration 30 : `orders`, `reservations`, `console_tasks`
- Migration 31 : `attention_history`, `feedback`, `learning_events`
- Migration 32 : `events` enrichi, `notifications`
- Migration 33 : `profile_refinements`
- Migration 34 : `conflict_sessions`
- Migration 35 : `relationship_graph`
- Migration 36 : `admin_reviews`, `home_cards_log`
- Migration 37 : ajouts sur `users` et `contacts`

### Tests à prévoir

- Test end-to-end W1 (saisie → mémoire → signal → fiche mise à jour)
- Test end-to-end W4 événement (J-30 → reco → console → commande → livraison → feedback)
- Test de charge sur la génération de recos (cron 2×/jour, 100+ pilotes)
- Test de robustesse LLM (fallback si timeout / erreur / hors schéma)

---

# FIN DE LA SPEC V2.5

**Document complet, prêt à découper en tickets Claude Code par lot (section 40).**

Pour chaque lot, j'ai pour toi le prompt Claude Code prêt à coller, dans l'ordre 0 → 18, dès que tu valides.


---

<!-- ====== PATCH V2.6 — sections additives 42 a 46, completent sans rien modifier ci-dessus ====== -->


> **Statut.** Complément additif à la V2.5. Ne remplace rien.
> À coller **à la suite** du markdown V2.5 (qui s'arrête à la section 41).
> La numérotation reprend à **42** et continue la table des matières existante.
> Aucune section V2.5 n'est réécrite, résumée ou modifiée.

---

## TABLE DES MATIÈRES — AJOUTS V2.6

42. [Commerce & Fulfillment Engine](#42)
43. [Emotional Safety Framework](#43)
44. [Brand Governance Framework](#44)
45. [Operations Scaling Framework](#45)
46. [Derniers risques et recommandations avant développement](#46)

---

## 42. Commerce & Fulfillment Engine

> Le 13ᵉ moteur de Candice Brain. Il prend le relais **après** le passage en console : une fois qu'une recommandation est validée, c'est lui qui gère l'argent, la commande, la réservation, le statut et le budget. Le Recommendation Engine décide *quoi*, le Commerce Engine gère *comment ça se concrétise et qui paie*.

### 42.1 Les 4 modes — qui paie, qui agit

Toute attention validée tombe dans l'un de ces 4 modes. Le mode est déterminé par le type d'attention et par les réglages du pilote.

**Mode 1 — Le pilote achète lui-même (`self_purchase`)**
Candice donne l'idée, le lien et le message ; le pilote achète sur le site du marchand.
- Candice ne touche pas d'argent.
- Candice peut tracer un statut déclaratif (« acheté ? oui/non ») sans preuve.
- Usage : phase 1, attentions gratuites, marques sans intégration.

**Mode 2 — Candice achète pour lui (`candice_purchase`)**
Candice (ou l'opérateur en console) commande le produit au nom du pilote, livraison chez le bénéficiaire ou chez le pilote.
- Candice avance ou facture l'achat.
- Statuts de commande complets (42.3).
- Usage : cœur du modèle premium / conciergerie.

**Mode 3 — Candice réserve pour lui (`candice_booking`)**
Candice réserve une table, un soin, une expérience, un hébergement.
- Pas de produit physique ; statut de réservation (42.4).
- Peut impliquer un acompte ou une empreinte CB côté établissement.
- Usage : restaurants, spas, expériences.

**Mode 4 — Candice propose seulement une idée (`idea_only`)**
Candice formule une attention non transactionnelle : un appel, un message, un geste, un moment.
- Aucune transaction.
- Le suivi est purement relationnel (la timeline d'attention enregistre l'intention et le feedback).
- Usage : la majorité des attentions du quotidien — c'est le cœur relationnel, pas marchand.

> **Règle.** Un proche peut recevoir les 4 modes selon le contexte. Candice ne pousse jamais un mode marchand quand un `idea_only` est aussi pertinent et plus juste relationnellement (anti-dérive « app de cadeaux »).

### 42.2 Validation pilote — que se passe-t-il au clic « Je valide »

Séquence exacte déclenchée par `Je valide` sur une proposition :

1. La proposition passe de `proposed` → `pilot_validated`.
2. Candice vérifie le **mode** (42.1) et le **budget** (42.5).
3. Si le budget est dépassé → Candice le signale en douceur avant d'aller plus loin (jamais de blocage sec, voir copy 42.5).
4. Selon le mode :
   - `self_purchase` → Candice affiche le lien + le message prêt à copier ; statut `handed_to_pilot`.
   - `candice_purchase` → entre dans le pipeline commande (42.3), statut `awaiting_payment` ou `in_order` selon la phase CB (42.6).
   - `candice_booking` → entre dans le pipeline réservation (42.4).
   - `idea_only` → statut `done` direct, enregistré dans l'Attention Timeline.
5. La proposition validée est journalisée (`who`, `when`, `mode`, `amount`, `contact_id`, `event_id?`).
6. Candice confirme au pilote dans son ton : sobre, jamais « commande passée avec succès » façon e-commerce.

### 42.3 Statuts — commande (produit physique)

Cycle de vie d'une commande `candice_purchase` :

```
proposed            → proposition créée par le moteur
pilot_validated     → le pilote a cliqué « Je valide »
awaiting_payment    → en attente de paiement (selon phase CB)
payment_received    → paiement reçu
in_order            → en commande chez le marchand
ordered             → commandé (confirmation marchand)
in_preparation      → en préparation / emballage
shipped             → expédié (n° de suivi si dispo)
delivered           → livré
done                → terminé (clôturé + feedback proposé)
```

Statuts d'exception possibles depuis n'importe quel point : `cancelled`, `refunded`, `failed`, `on_hold`.

### 42.4 Statuts — réservation

Cycle de vie d'une `candice_booking` :

```
proposed
pilot_validated
awaiting_confirmation   → demande envoyée à l'établissement
confirmed               → réservation confirmée (date/heure/couverts)
reminder_sent           → rappel J-1 envoyé au pilote
honored                 → honorée (le pilote/bénéficiaire y est allé)
done                    → terminée + feedback proposé
```

Exceptions : `cancelled_by_pilot`, `cancelled_by_venue`, `no_show`, `rescheduled`.

### 42.5 Moteur budget (`Budget Engine`)

Sous-moteur du Commerce Engine. Candice respecte un budget défini par le pilote, à 4 granularités cumulables :

- **Par proche** (plafond global ou annuel)
- **Par événement** (anniversaire, Noël, spontané…)
- **Par mois** (enveloppe mensuelle tous proches confondus)
- **Par année** (enveloppe annuelle globale)

**Exemple — paramétrage d'Estelle pour un proche :**

| Poste | Budget |
|---|---|
| Anniversaire | 300 € |
| Noël | 400 € |
| Spontané | 100 € |

**Comment Candice s'en sert :**
- Le Recommendation Engine filtre/pondère les recos pour rester dans l'enveloppe (un score « adéquation budget » entre dans le Scoring Engine, section 10).
- Si une reco dépasse, Candice le dit sans culpabiliser et propose une alternative dans l'enveloppe.
- Le budget consommé alimente le Business Dashboard et l'historique par proche.

**Copy exacte — dépassement budget (ton Candice) :**
> « Cette idée sort un peu de ce que tu avais prévu pour [prénom] cette année. Je te la garde si tu veux la suivre — sinon j'ai une option qui reste dans ton cadre. »

*(Interdits respectés : pas de « limite atteinte », pas de barre, pas de %, pas d'injonction.)*

### 42.6 Stratégie carte bancaire — 3 phases

**Phase 1 — Aucun paiement intégré.**
Le pilote paie ailleurs (sur le site du marchand, ou Candice facture hors plateforme). Plateforme = idée + lien + suivi déclaratif. Zéro PCI, zéro stockage CB. C'est l'état du MVP.

**Phase 2 — Carte enregistrée.**
CB tokenisée chez un PSP (Stripe). Candice ne stocke jamais le PAN — uniquement un `payment_method_id`. Chaque transaction reste **déclenchée par une validation pilote explicite**. La CB n'est demandée qu'au moment d'une première commande réelle, jamais à l'inscription (cohérent avec le reverse-trial J-7).

**Phase 3 — Paiement automatique selon règles.**
Pour les pilotes qui l'activent : Candice peut exécuter une commande sans clic, **dans des limites strictes** définies par l'Operational Confidence Score (section 45) et le budget (42.5) :
- montant sous un plafond défini par le pilote,
- marque/fournisseur connus et fiables,
- catégorie non sensible,
- jamais sur une situation émotionnelle sensible (section 43).
Chaque exécution automatique est notifiée *après coup* avec possibilité d'annulation dans une fenêtre définie.

> **Garde-fou produit.** L'automatisation du paiement est un *confort offert au pilote*, jamais un défaut. Par défaut : OFF. C'est l'inverse d'un piège dark-pattern.

### 42.7 Gestion des annulations

| Cas | Workflow |
|---|---|
| **Cadeau plus disponible** | Avant paiement → Candice remplace par l'alternative la mieux scorée et re-propose. Après paiement → `refunded` + re-proposition, le pilote ne porte pas la charge. |
| **Restaurant / lieu fermé** | `cancelled_by_venue` → Candice propose 2 créneaux/lieux alternatifs équivalents, garde le contexte (occasion, couverts). |
| **Le pilote change d'avis** | `cancelled_by_pilot` → si avant `in_order`, annulation propre sans frais ; sinon Candice explique l'état réel (déjà commandé/expédié) et les options. Aucune culpabilisation. |
| **Bénéficiaire indisponible** (voyage, hôpital…) | Réservation `rescheduled` ou attention décalée ; le Life State Engine (section 7) enregistre le contexte pour ne pas re-proposer à contretemps. |

Toute annulation alimente le Learning Engine (un proche/pilote qui annule un type d'attention → signal).

### 42.8 Commission Candice — 4 modèles à arbitrer

> Je ne tranche pas à ta place : voici les 4 modèles avec leurs arbitrages réels.

**Option A — Commission fixe (€ par transaction)**
- ✅ Lisible, prévisible, simple à expliquer.
- ✅ Marge protégée sur les petits paniers.
- ❌ Pénalise les petits paniers en % ; semble « péage » sur une grosse commande.
- ❌ Mauvais signal premium (ça fait frais de dossier).

**Option B — Commission en %**
- ✅ S'aligne sur la valeur ; indolore sur petits montants.
- ✅ Scale naturellement avec le panier.
- ❌ Marge faible sur petits paniers (qui dominent au début).
- ❌ Sur grosses commandes, le % peut paraître cher → tentation de contourner.

**Option C — Abonnement + commission**
- ✅ Revenu récurrent (prévisibilité) **+** upside transactionnel.
- ✅ Cohérent avec le plan 9 €/mois déjà acté.
- ❌ Double facturation perçue comme « payer deux fois » si mal raconté.
- ❌ Exige une justification de valeur très claire à chaque couche.

**Option D — Abonnement premium sans commission**
- ✅ Le plus *premium* et le plus aligné : « tu paies l'accès, pas tes gestes ». Aucun soupçon de Candice qui pousse à dépenser pour sa marge → protège la confiance, qui est l'actif #1.
- ✅ Modèle mental ultra-propre (Amex/conciergerie : on paie l'adhésion).
- ❌ Plafonne le revenu à l'ARPU d'abonnement ; pas d'upside sur la valeur transactionnelle.
- ❌ Reporte tout le poids du business sur l'acquisition + rétention d'abonnés.

**Recommandation CPO (à challenger) :** démarrer en **D** (abonnement seul, zéro commission visible) pendant que la confiance se construit — c'est le modèle qui protège le mieux le positionnement « Candice ne te vend rien, elle prend soin ». Négocier en parallèle des **remises fournisseurs** invisibles pour le pilote (marge arrière), qui n'altèrent pas la confiance. Glisser vers **C** seulement quand le volume justifie une couche transactionnelle assumée et racontable.

### 42.9 Console — Business Dashboard

Nouvelle vue console dédiée. KPIs :

- **GMV** — volume d'affaires total transité (toutes commandes/réservations).
- **CA Candice** — revenu réel (abonnements + commissions + marges arrière).
- **Panier moyen** — par commande, par proche, par événement.
- **Taux de validation** — propositions validées / propositions poussées.
- **Taux de commande** — commandes effectives / validations.
- **Taux de satisfaction** — feedback positif / feedbacks reçus.
- **Marge par catégorie** — cadeau, expérience, fleurs, réservation…
- **Marge par fournisseur** — pour piloter les négos.

Filtres : période, mode (42.1), catégorie, fournisseur, cohorte de pilotes. Granularité jour / semaine / mois.

### 42.10 Équilibre attentions gratuites / payantes — RÈGLE DURE

> Précision produit ajoutée en V2.6. Cette règle prime sur toute logique de marge.

Le modèle économique est **100 % abonnement** (9 €/mois, 1 mois offert) — Candice ne vit **pas** d'une obligation d'achat de cadeaux. Conséquence directe :

- Les **attentions non payantes** (`idea_only` : un appel, un message, un geste, un moment, une présence) sont le **cœur de la valeur**, pas un pis-aller. Elles incarnent la promesse « on me comprend, on prend soin ».
- Candice doit en proposer **souvent** — c'est le quotidien du produit.
- **Le mix ne penche jamais plus vers le payant que vers le gratuit.** Sur une période donnée, la part de recommandations marchandes poussées à un pilote ne dépasse pas celle des attentions non marchandes. (Plancher de gratuit ≥ part de payant.)
- Demander à un abonné de payer son abonnement **et** d'acheter des cadeaux en permanence est un anti-pattern interdit : Candice ne transforme jamais l'abonnement en machine à dépenser.

**Implémentation :**
- Le Recommendation Engine porte un paramètre de **balance** (`free_to_paid_ratio`) appliqué au flux poussé à chaque pilote ; un geste marchand n'est poussé que s'il est vraiment plus juste qu'une attention gratuite équivalente (le test de la section 42.1 reste actif).
- Le Priority Engine privilégie l'`idea_only` à pertinence égale.
- Le Business Dashboard (42.9) suit ce ratio comme **indicateur de santé produit**, pas seulement de revenu : un ratio qui dérive vers le payant est une alerte, pas une réussite.

### 42.11 Exécution après validation pilote — API auto vs commande manuelle

> Le flux opérationnel réel d'Estelle, rendu explicite. Complète l'étape 6 de la section 36 (V2.5), qui s'arrêtait à la proposition pilote.

Une fois la proposition validée par le pilote (`pilot_validated`), elle **revient en console** pour exécution. Deux chemins selon la source :

**Chemin A — Fournisseur avec API (ex. Booking, Amazon, OpenTable, fleuriste intégré)**
- L'exécution est **automatique** : commande/réservation déclenchée par le système.
- Statuts mis à jour automatiquement via webhooks (`ordered`, `shipped`, `confirmed`…).
- L'humain supervise, n'intervient qu'en exception.

**Chemin B — Fournisseur sans API**
- L'exécution est **manuelle** : Estelle (ou un opérateur console) passe la commande / fait la réservation elle-même.
- Elle met à jour le statut à la main (`in_order` → `ordered` → `shipped`…).
- C'est le mode par défaut au démarrage, et il reste parfaitement premium (conciergerie humaine).

**Règle commune aux deux chemins :**
- Avant la proposition, c'est **toujours** un humain qui a saisi en console le **prix réel, la disponibilité et le délai** (section 36, étape 5). Candice ne propose jamais un prix/dispo inventé.
- Le choix du chemin (A ou B) dépend uniquement de l'existence d'une API fiable pour ce fournisseur, et de l'Operational Confidence Score (section 45).
- Les attentions `idea_only` (non marchandes) ne passent **pas** par cette étape : pas de commande, pas de console d'exécution — juste l'enregistrement dans l'Attention Timeline.

```
pilot_validated
   ↓
retour console (exécution)
   ↓
 ┌───────────────┴───────────────┐
 │ API fiable ?                   │
 │  OUI → exécution automatique   │
 │  NON → commande manuelle       │
 └───────────────┬───────────────┘
   ↓
statuts commande/réservation (42.3 / 42.4) → done → feedback
```

---

## 43. Emotional Safety Framework

> Ceci n'est pas une fonctionnalité : c'est une **limite dure** du produit. Elle prime sur toute reco, tout workflow, tout moteur. Si elle entre en conflit avec une autre règle, elle gagne.

### 43.1 Principe

**Candice est :** un copilote relationnel, un facilitateur, un aide-mémoire qui aide à prendre soin des gens.

**Candice n'est PAS :** un psychologue, un thérapeute, un médecin, un coach de vie.

Conséquence opérationnelle : face à une détresse, Candice **n'analyse pas, ne diagnostique pas, ne conseille pas sur le fond émotionnel**. Elle reconnaît, elle adoucit, et elle **oriente vers un humain** (le pilote lui-même, un proche de confiance, ou un professionnel). Sa valeur ici n'est pas de « gérer » l'émotion, mais d'éviter que le pilote agisse à contretemps et de lui rappeler qu'un geste humain vaut mieux qu'un cadeau.

### 43.2 Matrice des situations sensibles

Pour chaque catégorie : ce que Candice **peut** faire / ne doit **jamais** faire / ton **autorisé** / ton **interdit** / **ressources** à proposer.

> Note : « ressources à proposer » = ressources destinées au **pilote** pour aider son proche, ou pour lui-même. Candice ne contacte jamais le proche en détresse directement.

**Deuil**
- Peut : suggérer une présence simple (appel, message sobre, « je pense à toi »), rappeler une date sensible à venir, proposer un geste discret et non festif.
- Jamais : proposer un cadeau festif, une surprise humoristique, une injonction à « se changer les idées ».
- Ton autorisé : sobre, présent, retenu.
- Ton interdit : enjoué, optimisateur, « la vie continue ».
- Ressources : associations d'accompagnement du deuil ; suggérer au pilote d'être simplement présent.

**Burn-out**
- Peut : proposer d'alléger (un message qui ne demande rien en retour, un geste qui ne crée pas de charge), espacer les sollicitations.
- Jamais : proposer une activité énergivore, ajouter une charge mentale, planifier un événement « pour lui remonter le moral ».
- Ton autorisé : doux, sans attente, déculpabilisant.
- Ton interdit : motivationnel, « secoue-toi », performant.
- Ressources : médecine du travail, médecin traitant ; suggérer de respecter le rythme du proche.

**Dépression possible**
- Peut : encourager une présence régulière et légère du pilote ; signaler avec délicatesse que ça dépasse ce que Candice sait accompagner.
- Jamais : nommer un diagnostic, suggérer que « ça va passer », proposer un geste qui fait porter la responsabilité au pilote.
- Ton autorisé : prudent, humble, non interprétatif.
- Ton interdit : diagnostique, minimisant, expert.
- Ressources : médecin traitant ; en France, ligne d'écoute (voir 43.4).

**Anxiété sévère**
- Peut : suggérer des gestes apaisants et prévisibles, éviter les surprises.
- Jamais : proposer une surprise, un imprévu, une mise en avant publique.
- Ton autorisé : calme, prévisible, rassurant sans promesse.
- Ton interdit : excitant, « lâche prise », pressant.
- Ressources : médecin traitant, professionnels de santé mentale.

**Violence conjugale / violence familiale**
- Peut : reconnaître la gravité, orienter immédiatement vers des ressources, conseiller au pilote la prudence (ne rien envoyer qui puisse être vu par l'agresseur).
- Jamais : proposer un geste/cadeau, suggérer une médiation, minimiser, ou quoi que ce soit pouvant exposer la personne.
- Ton autorisé : grave, sérieux, orienté sécurité.
- Ton interdit : relationnel-léger, « réconciliateur », optimiste.
- Ressources : **3919** (Violences Femmes Info, France) ; 17 / 112 en cas de danger immédiat.

**Harcèlement**
- Peut : reconnaître, orienter vers les structures dédiées, soutenir une présence du pilote.
- Jamais : proposer une stratégie de confrontation, un geste public.
- Ton autorisé : soutenant, factuel, orienté ressource.
- Ton interdit : minimisant, « ignore-les ».
- Ressources : 3018 (harcèlement, France), associations spécialisées.

**Maladie grave**
- Peut : suggérer une présence adaptée, un geste pratique et utile (repas, logistique), rappeler des dates de traitement si le pilote les a notées.
- Jamais : minimiser, promettre une issue, proposer un geste déplacé/festif.
- Ton autorisé : présent, concret, doux.
- Ton interdit : faux optimisme, déni, « tout ira bien ».
- Ressources : équipe soignante ; associations liées à la pathologie.

**Idées suicidaires**
- Peut : **uniquement** reconnaître la gravité et orienter immédiatement et clairement vers une aide humaine professionnelle. Inviter le pilote à ne pas rester seul face à ça.
- Jamais : tenter d'accompagner, dialoguer sur le fond, proposer un geste/cadeau, stocker ça comme une « mémoire » exploitable, générer une reco. **Aucun** traitement produit.
- Ton autorisé : grave, direct, orienté secours.
- Ton interdit : tout le reste.
- Ressources : **3114** (numéro national de prévention du suicide, France, 24h/24) ; 15 / 112 en cas d'urgence vitale.
- → Déclenche systématiquement **Niveau 4** (43.3).

**Addiction**
- Peut : suggérer une présence sans jugement, orienter vers des structures.
- Jamais : moraliser, proposer un geste lié à la substance, jouer le coach de sevrage.
- Ton autorisé : sans jugement, soutenant, orienté ressource.
- Ton interdit : moralisateur, culpabilisant, expert.
- Ressources : médecin traitant, structures d'addictologie ; en France, lignes dédiées par substance.

### 43.3 Escalade humaine — 4 niveaux

Le Signal Engine classe chaque situation. Plus le niveau monte, plus Candice se retire et oriente.

**Niveau 1 — normal.** Fonctionnement complet : Candice propose, recommande, agit.

**Niveau 2 — sensible.** Candice continue d'aider mais **filtre** ses recos via la blacklist (43.5), adoucit le ton, privilégie les `idea_only`, désactive les surprises. Aucune reco marchande poussée sans raison forte.

**Niveau 3 — critique.** Candice **suspend** toute reco marchande. Elle reconnaît, oriente vers une ressource, et propose au pilote une présence simple. Tout passe par un humain (toi en console est alerté).

**Niveau 4 — urgence.** (ex. idées suicidaires, violence avec danger immédiat) Candice **ne produit aucune reco**, affiche immédiatement les ressources d'urgence pertinentes, et invite à contacter les secours / lignes dédiées. Journalisation + alerte console prioritaire. Candice ne « gère » rien : elle oriente, point.

### 43.4 Détection & déclenchement

- Le Signal Engine tag chaque mémoire entrante avec un `sensitivity_level` (1–4) en plus de son statut.
- Une mémoire de niveau 3–4 est marquée `sensible` (statut déjà prévu en V2.5) et **exclue** du flux de recommandation marchande.
- Toute détection 4 déclenche : affichage ressources + alerte console + gel des recos sur ce proche jusqu'à revue humaine.
- Faux positifs : on préfère sur-déclencher (orienter à tort) que sous-déclencher. Le coût d'un faux négatif est inacceptable.

### 43.5 Matrice des recommandations interdites (blacklist)

Filtre dur appliqué par le Recommendation Engine **avant** scoring.

| Situation | Interdits absolus |
|---|---|
| **Deuil récent** | surprise humoristique · injonction à sortir · cadeau festif · « change-toi les idées » · événement joyeux |
| **Burn-out** | activité énergivore · charge mentale supplémentaire · planification d'événement · « pour te motiver » |
| **Dépression possible** | geste responsabilisant le pilote · minimisation · diagnostic · surprise |
| **Anxiété sévère** | surprise · imprévu · mise en avant publique · délai serré |
| **Violence (conjugale/familiale)** | tout geste/cadeau · médiation · tout ce qui peut être vu par l'agresseur |
| **Maladie grave** | geste festif · faux optimisme · minimisation |
| **Idées suicidaires** | **toute** reco — aucune exception |
| **Addiction** | geste lié à la substance · moralisation · coaching de sevrage |

> Cette matrice est **codée en règles dures**, pas confiée au LLM. Le LLM peut *détecter* la situation ; il ne peut jamais *autoriser* une exception à la blacklist.

---

## 44. Brand Governance Framework

> Robustification du Brand Knowledge Engine (section 16). Objectif : enrichir automatiquement la base **sans jamais perdre la traçabilité ni la qualité**.

### 44.1 Objectif

Candice enrichit seule (logo, description, site, catégorie). Mais chaque donnée doit rester **traçable** (d'où elle vient, quand) et **réversible** (corrigible, rejetable). Une marque mal enrichie qui remonte au pilote = une fissure dans la confiance.

### 44.2 Sources à conserver — par marque

Pour chaque marque / lieu, on stocke la **provenance** de chaque champ :

- `logo_source` (URL + méthode : officiel / scrape / saisie manuelle)
- `description_source`
- `official_site_source`
- `retrieved_at` (date de récupération)
- `retrieved_by` (moteur / humain / pilote)

Principe : aucun champ affiché sans provenance enregistrée.

### 44.3 Statuts d'une marque

```
auto_detected          → repérée automatiquement (mention pilote, scrape)
auto_enriched          → enrichie automatiquement (logo/desc/site)
pending_review         → en attente de revue humaine
validated              → validée par un humain
manually_corrected     → corrigée à la main
rejected               → rejetée (doublon, faux, hors sujet)
```

Règle : une marque `auto_enriched` non encore `validated` peut être utilisée en interne (scoring) mais est signalée comme non vérifiée dans la console ; on évite de l'exposer telle quelle au pilote tant que `pending_review`.

### 44.4 Gestion des conflits

| Conflit | Logique de résolution |
|---|---|
| **Deux logos différents** | Préférer la source de plus haute confiance (officiel > scrape) ; sinon `pending_review` avec les deux candidats affichés côte à côte en console. |
| **Deux sites différents** | Vérifier domaine officiel (mentions légales, cohérence marque) ; en cas de doute → `pending_review`. |
| **Deux marques semblables** (doublon possible) | Calcul de similarité (nom + domaine + catégorie). Si forte → fusion proposée en console (jamais auto-fusion silencieuse) ; si faible → on garde distinct. |

Aucune résolution de conflit n'écrase silencieusement une donnée validée par un humain.

### 44.5 Brand Quality Score

Score interne (jamais affiché au pilote) calculé sur 4 facteurs :

- **Confiance source** (officiel > base partenaire > scrape > inférence LLM)
- **Complétude** (logo + description + site + catégorie présents)
- **Validation humaine** (validé > auto)
- **Fréquence d'utilisation** (une marque souvent recommandée mérite d'être fiabilisée en priorité)

Usage : priorise la file de revue humaine et pondère l'usage de la marque dans le Recommendation/Scoring Engine.

### 44.6 Console — vue « Qualité des marques »

Nouvelle vue. Colonnes / filtres :

- **Incomplet** — champs manquants
- **À revoir** — `pending_review` ou score sous seuil
- **Doublon** — fusions candidates en attente
- **Validé** — propre

Actions : valider, corriger, rejeter, fusionner, re-enrichir. Tri par Brand Quality Score et par fréquence d'utilisation (fiabiliser d'abord ce qui sert le plus).

---

## 45. Operations Scaling Framework

> La V2.5 suppose une validation humaine quasi totale en console. C'est juste au début — c'est même le luxe premium. Mais il faut un chemin de croissance qui **n'abandonne jamais la qualité** en montant en volume.

### 45.1 Les 4 phases

**Phase 1 — ~100 utilisateurs. Validation humaine quasi totale.**
Tout passe en console. C'est volontaire : c'est là qu'on apprend ce que Candice doit automatiser plus tard. La validation manuelle EST le produit à ce stade.

**Phase 2 — ~1 000 utilisateurs. Automatisation partielle.**
Candice auto-traite les cas à forte confiance (marque connue, catégorie maîtrisée, petit montant, feedback historique positif). L'humain se concentre sur les cas nouveaux, gros, ou sensibles. Premiers opérateurs en plus d'Estelle.

**Phase 3 — ~10 000 utilisateurs. Automatisation importante.**
La majorité des propositions standard passent sans humain. La console devient un poste de **supervision et d'exception** plus que de validation unitaire.

**Phase 4 — ~100 000 utilisateurs. Validation humaine réservée.**
L'humain n'intervient que sur :
- les **gros montants** (au-dessus d'un seuil),
- les **situations sensibles** (section 43, niveaux ≥ 2),
- les **recommandations à risque** (marque non vérifiée, première fois, fournisseur incertain).

> À toutes les phases : les niveaux émotionnels 3–4 (section 43) restent **toujours** hors automatisation. Le scaling ne s'applique jamais à la détresse.

### 45.2 Operational Confidence Score

Score qui décide **combien** Candice peut automatiser, par proposition. Il monte quand :

- la **marque est connue** (Brand Quality Score élevé, validée),
- le **fournisseur est fiable** (historique de commandes réussies),
- le **stock est fiable** (dispo confirmée / faible taux de rupture),
- la **catégorie est maîtrisée** (Candice a un historique solide dessus),
- le **feedback historique est positif** (sur ce type d'attention).

**Mapping score → comportement :**

| Confiance | Comportement |
|---|---|
| Basse | Validation humaine obligatoire (console). |
| Moyenne | Auto-traitement si sous seuil de montant **et** non sensible. |
| Haute | Auto-traitement, supervision a posteriori. |

> Le score est **plafonné** par le niveau émotionnel et par le budget : aucune confiance opérationnelle, si haute soit-elle, ne débloque l'automatisation sur une situation sensible ou hors budget.

---

## 46. Derniers risques et recommandations avant développement

> Regard CTO + CPO sur la V2.5 (+ ce patch). Je ne protège aucun choix existant. Objectif : découvrir les problèmes maintenant. Classé par gravité.

### 46.1 Trous d'architecture

1. **Les 404 ne sont pas qu'un bug — ils sentent une fragilité de routing/auth.** « Proche créé en base malgré le 404 » (bug 3) = l'écriture réussit mais la navigation/réponse échoue. Risque : **doublons** à chaque retry. → Exiger des écritures **idempotentes** (clé d'idempotence sur création de proche/profil) et une séparation nette action / navigation. À traiter dans le Lot 0, pas juste « faire disparaître le 404 ».

2. **Orchestration des 13 moteurs non spécifiée.** Le flux (section 4) est linéaire sur le papier, mais qui *appelle* qui, dans quel ordre, de façon synchrone ou en file ? Sans **orchestrateur** explicite (file de jobs + idempotence + reprise sur échec), Candice Brain devient un plat de spaghetti d'appels LLM dès le Lot 2. → Définir un orchestrateur (ex. file de tâches avec statut par étape) **avant** le Lot 2.

3. **Résolution de conflits entre moteurs absente.** Que se passe-t-il quand Trust dit « fiable » mais Forgetting dit « périmé » ? Quand deux Life States se contredisent (déjà évoqué section 7 mais sans règle d'arbitrage opérationnelle) ? → Spécifier une **hiérarchie d'autorité** entre moteurs (proposition : Emotional Safety > Forgetting/Validity > Trust > Scoring).

4. **Coût et latence LLM non budgétés.** Chaque input déclenche potentiellement Memory + Signal + reformulation + (Life State / Attention DNA) + Recommendation + Scoring → plusieurs appels Claude par interaction. À 10k users actifs, c'est un poste de coût **et** une latence cumulée que « Candice réfléchit » ne masquera pas indéfiniment. → Mesurer le coût par interaction dès le Lot 2 ; prévoir caching, regroupement d'appels, et modèles plus légers (Haiku) sur les étapes de classification.

### 46.2 Angles morts produit

5. **Le « moment de magie » exige une latence faible — tension directe avec 46.1#4.** Si Candice met 8 secondes à « réfléchir », la magie devient attente. → Définir un budget de latence cible (ex. < 3 s perçues) et une stratégie de réponse progressive (afficher la reformulation d'abord, les recos ensuite).

6. **Modération du texte libre non traitée.** W3 (conflit), « ne va pas bien », champ libre du registre « compliquée/fragile » : du contenu sensible, parfois sur des **tiers** qui n'ont pas consenti. Risque RGPD **et** sécurité. → Définir une politique : qu'est-ce qu'on stocke, qu'est-ce qu'on refuse de traiter, comment on gère un contenu signalant un danger pour un tiers.

7. **Le bénéficiaire (le proche) a des droits RGPD que le produit ne lui donne pas.** En mode incognito, le pilote saisit des données — y compris Art. 9 (santé, religion…) — sur une personne qui ne le sait pas. La mémoire projet le note déjà comme **le vrai point sensible**. La spec n'a aucun mécanisme de **minimisation**, de **durée de conservation**, ni de **droit d'opposition** côté proche. → Section dédiée nécessaire : minimisation des champs sensibles en incognito, TTL, et chemin de suppression.

8. **Suppression / portabilité des données non spécifiées.** 22 tables liées (memories, signals, trust_scores, life_states…). Quand un pilote supprime un proche ou son compte, quel est le **cascade delete** ? Que devient l'analyse partagée avec un Proche devenu Pilote ? → Spécifier le graphe de suppression avant de multiplier les tables (Lot 2+).

### 46.3 Risques de scaling

9. **Estelle = point de défaillance unique (bus factor 1).** Toute la phase 1 repose sur une seule validatrice. Maladie, indispo → la machine s'arrête. → Documenter les procédures console pour qu'un opérateur de confiance puisse prendre le relais (lié à la phase 2 de la section 45).

10. **Le goulot console n'est pas mesuré.** Combien de propositions/jour une personne peut-elle valider sereinement ? Si c'est ~80 et que 1 000 users en génèrent 300/jour, le mur arrive avant la phase 2. → Instrumenter dès la phase 1 le **temps de validation par proposition** pour dimensionner le passage à l'automatisation.

11. **Dépendances tierces fragiles.** Autocomplete adresse (Google Places), push (VAPID), email (Resend), PSP (Stripe en phase 2), scraping de marques. Chacune a des quotas, des coûts et des modes de panne. → Lister les fallbacks (ex. saisie manuelle si Places tombe) ; ne jamais laisser une dépendance tierce bloquer un parcours critique.

### 46.4 Incohérences UX

12. **« Zéro score / zéro % » côté pilote vs. la profusion de scores internes.** Trust Score, 12 scores de reco, Brand Quality Score, Operational Confidence Score, points DB. Le risque n'est pas la DB — c'est qu'un de ces nombres **fuite** à l'écran par mégarde (un tri, un libellé, un debug oublié). → Règle de rendu : tout score est `internal_only`, jamais sérialisé vers le client. À vérifier en revue de chaque écran.

13. **Le mot « console » suppose un opérateur — mais le pilote, lui, attend de l'instantané.** Il y a une asymétrie temporelle : le pilote valide à 22 h, l'humain traite à 9 h. Si l'UX ne raconte pas cette attente, le pilote croira à un bug. → Copy explicite et sobre côté pilote sur le délai (« je m'en occupe, je te tiens au courant »), cohérente avec le ton.

14. **Budget (42.5) et reverse-trial (9 €, CB à J-7) doivent être réconciliés.** Quid d'un pilote en essai gratuit qui valide une commande marchande avant J-7 ? Paie-t-il ? Avec quoi ? → Clarifier : en phase 1, les attentions marchandes restent **hors plateforme** (le pilote paie ailleurs), donc pas de collision ; à acter noir sur blanc.

### 46.5 Dépendances cachées

15. **Lot 6 (Recommendation/Scoring) dépend silencieusement de la qualité du catalogue (Lot 7) et des marques (Lot 8).** Un moteur de reco sans catalogue rempli recommande dans le vide. La roadmap met Lot 7/8 *après* Lot 6. → Soit charger un catalogue minimal *avant* Lot 6, soit accepter que le Lot 6 tourne d'abord en `idea_only` (non marchand) — ce qui est d'ailleurs très bien pour démarrer.

16. **Tout le Commerce Engine (section 42) dépend d'un PSP non choisi.** Stripe supposé mais non acté. Le choix impacte la phase 2 entière (tokenisation, statuts, webhooks). → Trancher le PSP avant d'attaquer la phase 2 CB.

### 46.6 Manques pour un niveau réellement premium

17. **Aucune stratégie de contenu vide / cold start.** Un nouveau pilote avec 1 proche et 3 infos : Candice n'a presque rien à dire. La règle « jamais d'analyse sur input quasi-vide » (déjà actée) est bonne, mais il manque le **parcours premium d'amorçage** qui rend l'attente désirable plutôt que décevante.

18. **Pas de gestion du « Candice s'est trompée » à grande échelle.** Le feedback par contact existe (3 micro-actions), mais il n'y a pas de boucle pour une **erreur sensible** (Candice propose un truc festif à quelqu'un en deuil parce que le signal a été raté). → Un chemin de récupération explicite + un journal des erreurs sensibles pour le Learning Engine.

19. **Observabilité produit absente.** Aucune mention de logs structurés, de traçage d'une proposition de bout en bout, de métriques d'erreur. Pour un produit premium où la confiance est tout, **savoir ce qui s'est passé** quand ça casse est non négociable. → Tracer chaque proposition (input → mémoire → signaux → reco → score → console → action → feedback) avec un identifiant unique.

### 46.7 Recommandation de séquencement (challenge de la roadmap)

- **Garder Lot 0** tel quel mais y inclure l'**idempotence** (46.1#1), pas juste « plus de 404 ».
- **Insérer un Lot 2-bis « Fondations Brain »** avant de multiplier les moteurs : orchestrateur + hiérarchie d'autorité (46.1#2,#3) + observabilité (46.6#19) + cascade de suppression (46.2#8). Sans ça, chaque lot suivant accumule de la dette.
- **Traiter l'Emotional Safety (section 43) très tôt** — idéalement dès que le Signal Engine existe (Lot 2), pas en fin de parcours. C'est une limite dure, pas une feature de confort.
- **Laisser le marchand pour plus tard** : démarrer le Recommendation Engine en `idea_only` (46.5#15) découple la magie relationnelle du chantier commerce/PSP et te fait gagner des semaines.

> **Synthèse en une phrase :** la V2.5 est une excellente vision produit ; ses risques ne sont pas dans *quoi* faire mais dans *l'infrastructure invisible* (orchestration, idempotence, suppression, observabilité, coût LLM) et dans *la sécurité émotionnelle*, qui doivent être traitées comme des fondations, pas comme des lots tardifs.

---

*Fin du patch V2.6. À coller à la suite de la V2.5. Source de vérité : le markdown consolidé V2.5 + V2.6.*
