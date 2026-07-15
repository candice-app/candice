# ⛔ STOP DONNÉES — Espace Proche V2 (Phase 1 : lecture + modèle de données)

Lectures faites : spec intelligence (source de vérité), maquette espace-proche (structure/flux), maquette pilote gelée (étalon design, re-lue en détail aux phases 3+). Aucune migration appliquée — ce STOP présente le schéma pour validation.

## 0. Résolution de fichier (à confirmer)

Le prompt cite `docs/intelligence-recommandations.md` — **ce fichier n'existe pas**. Deux candidats en base : `docs/Candice_Spec_Intelligence_Recommandations.md` et `docs/Candice_Spec_Moteur_Reco_v1.md`. Le premier **contient exactement** les sections citées (§1 principe fondateur, §2 certitude, §3 flow « Pas ça », §5 miroir, §8 deux voies, §12.14 workflow croisé, §12.16 textes dynamiques, §13.7 jamais afficher au pilote, §15 harmonisation, §16 proactive) → **c'est lui la source de vérité**. J'ai travaillé dessus. **Confirme.**

## 1. Réutilisation de l'existant (rien de dupliqué)

| Besoin spec | Table existante réutilisée |
|---|---|
| Visibilité « ce que le proche a accepté de partager » (onglet [Prénom]) | `contact_consents` (scope, status) |
| Données profil (podium, territoire, univers, sections) pilote ET proche | `profile_analysis` (territory, universe, dimension_scores, understood_cards, sections…) |
| « Envie repérée » (source spotted) | `carnet_envies_items` (source_trace='spotted' déjà là) |
| « Envie déclarée » du proche (source declared) + réservation | `my_wishlist_items` (source_trace='declared', RPC réservation lot Wishlist V2) |
| Trace d'attention accomplie (« déjà offert ») | `attention_log` (status='done') |

## 2. Tables NEUVES proposées (additives, `ADD ... IF NOT EXISTS`)

### Migration 69 — `contact_reco_items` (une ligne par reco)
Remplace le blob `contact_recommendations.ideas` (jsonb) par des lignes exploitables (refus, réservation, certitude, FK). Colonnes :
`id, pilot_id, contact_id, reco_type (object|experience|place|message), title, brand, price_indicative (texte), photo_url, source_trace (declared|spotted|deduced|exploratory), certainty_pct (int 0-100), why_json (jsonb — critères/tags déclarés ayant mené à la reco, §2/§6), need_tag (langage d'attention visé, §7), origin_ref (uuid vers wishlist/carnet si applicable), status (active|refused|offered|reserved), created_at, updated_at`
+ **réservation invisible** (mêmes colonnes/pattern que Wishlist V2) : `reservation_status (available|intended|purchased), reserved_by, reserved_at, reservation_expires_at` + RPC atomiques `reserve_reco_item` / `confirm_reco_purchase` (calqués sur ceux du lot Wishlist V2, péremption 30 j). Un « offert » retire la reco des autres proches (§8).

### Migration 70 — `reco_refusals` (flow « Pas ça », §3/§4)
`id, pilot_id, contact_id, reco_id (fk contact_reco_items), reason (gout|budget|deja|moment), sub_reason (text — pour moment : deuil|separation|maladie|hospitalisation|perte_emploi|stress|demenagement|examens|conflit|recu_beaucoup|budget_familial|autre), note_free (text — « Autre »), reactivable (bool default true), reappear_at (timestamptz — refus financier → +6 mois, §3.2), created_at`
Le **compteur de refus « goût »** par (pilot_id, reco_id) se dérive de cette table (2e refus goût → déclenche le workflow croisé).

### Migration 71 — `person_states` (miroir d'état, §5/§12.5)
`id, subject_kind (pilot|contact), subject_user_id (la personne concernée), declared_by (user_id — le pilote qui déclare), state (deuil|separation|maladie|perte_emploi|stress|demenagement|conflit|recu_beaucoup|belle_nouvelle|fatigue|evenement|ok), note_free, event_at (timestamptz? pour événement à venir), created_at`
- État du pilote sur SA fiche (`subject_kind='pilot'`, declared_by=pilot) → **vu par ses proches** + **pondère les recos** le concernant.
- Note du pilote sur l'état du proche (`subject_kind='contact'`, declared_by=pilot) → bloc « Comment il va ».
Historisé (plusieurs déclarations, on lit la plus récente).

### Migration 72 — `cross_validations` (workflow croisé INVISIBLE au pilote, §12.14/§13.7)
`id, pilot_id, contact_id, reco_id, trigger (double_gout_refus), question_text, proche_user_id, proche_answer (confirm|deny|pending), status (open|answered|closed), notified_pilot (bool), created_at, answered_at`
- Déclenché au 2e refus « goût ». Côté pilote : **accusé doux uniquement** (« C'est noté, je continue d'affiner »). En coulisses : question neutre au proche (jamais d'attribution au pilote). Réponse confirm → notif douce pilote + reco ré-ancrée ; deny → down-weight tag + reco retirée. Tout journalisé ici.

### Migration 73 — `finance_plans` (config console admin, §3.2)
`id, catalog_ref (text — l'attention configurée), n_installments (int), configured_by (admin user_id), created_at`
Config « payable en X fois » posée par Estelle en console. **Épargne perso = calcul client** (prix ÷ rythme), aucun flux d'argent, aucune table.

### Migration 74 — `attention_log.love_level` (satisfaction §3.3)
Colonne ajoutée : `love_level (un_peu|beaucoup|enormement)`. Le « déjà offert → il a aimé ? » écrit une ligne attention_log (status='done') + `love_level`. (L'échelle existante `feedback` juste/a_cote/pas_le_moment sert au timing, pas au « love » — d'où une colonne dédiée.)

## 3. Ce que ce lot NE fait PAS (gravé, décidé)
- **Reco proactive / notifications / pages événementielles** (§16/§18) → **lot ultérieur** (dépend de Capacitor + app aboutie). Ce lot = **affichage RÉACTIF seul**. La logique reste gravée dans la spec.
- **Micro-questions « Pour mieux viser »** (§19.5) → générées par le lot Discovery (prompt dédié d'Estelle), non figées ici.
- **Conciergerie/sourcing** (§8 voie 2) → interface construite, exécution « Bientôt ».

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU (à trancher au STOP) :**
1. **Résolution de fichier** (§0) : `Candice_Spec_Intelligence_Recommandations.md` = la source ? (très haute confiance, mais load-bearing).
2. **`contact_recommendations` (jsonb) → `contact_reco_items` (par ligne)** : je pars sur une table par-ligne (indispensable pour FK refus/réservation/certitude). L'ancien blob `ideas` reste (déprécié) ou est régénéré par le moteur ? Je propose : conservé, moteur régénère en lignes.
3. **Réservation des recos entre proches** : la dedup « un offert retire la reco des autres proches » suppose une reco partagée entre plusieurs pilotes visant la même personne. Pour ce lot (réactif), je modélise la réservation **sur `contact_reco_items`** (pattern Wishlist V2) ; la dedup cross-pilotes réelle s'active avec la surface proche + le moteur. Confirme le périmètre.
4. **Échelle de love** : colonne `love_level` sur `attention_log` (un_peu/beaucoup/enormement) plutôt qu'une table. OK ?

**B. DÉCISIONS PRISES SEUL** : % de certitude = **chiffre précis** (« Sûr à 85 % ») — tranché par la maquette (« Sûr à 100/92/85 ») + §2. Noms d'états/raisons repris de la spec §3.4/§11/§16. Réutilisation maximale (5 tables existantes, 6 nouvelles).

**C. LAISSÉ EN SUSPENS** : **emojis échelle de love** (§11, EN ATTENTE) — emojis vs texte premium seul ? Non tranché dans la spec → **ta décision**. Design fidélité (fold, aplat, logos marques) traité aux phases 3+.

**D. À VÉRIFIER PAR ESTELLE** : valides-tu (a) la source de vérité §0, (b) le schéma des 6 migrations 69-74, (c) les 4 flous A, (d) l'échelle de love (emojis ?) — avant que j'applique quoi que ce soit.

**E. MIGRATIONS / BUILD** : **aucune migration appliquée** (Phase 1 = conception) ; aucun code touché ; lectures faites.

**STOP DONNÉES.** J'attends ta validation du schéma (migrations 69-74) et des arbitrages A/C/D avant d'appliquer et de passer à la Phase 2 (coquille 3 onglets).
