# 14 — Base de données (schéma `public`)

> **Ce document décrit ce qui EXISTE aujourd'hui dans la base de données Candice, table par table, sans jugement ni recommandation.**
>
> - **Source des données** : lecture directe de la base de production (schéma `public`), le 2026-09-22, via `pg_tables`, `information_schema.columns`, `pg_policies`, `pg_class`, et `select count(*)` sur chaque table. Aucune écriture n'a été faite.
> - **42 tables** au total dans le schéma `public`.
> - **Statuts** : ✅ utilisée (contient des données) · 🟡 vide aujourd'hui (0 ligne) mais branchée au code · ⚫ morte / dépréciée / non branchée.
> - **« RLS »** = Row Level Security, le verrou d'accès de Supabase. **Les 42 tables ont ce verrou ACTIVÉ.** Pour chacune, la règle est traduite en français simple. Le « service technique » (`service_role`, utilisé par les traitements serveur et les crons) contourne toujours ces verrous.
> - **« Volume »** = nombre de lignes réelles au moment du relevé. La base est très peu remplie (environnement de test / pré-lancement), donc beaucoup de tables sont à 0 ligne sans être mortes pour autant.
> - Aucune table ne porte de commentaire SQL (`COMMENT ON`) : les rôles ci-dessous sont déduits du nom, des colonnes et du code applicatif (`src/`), ou marqués « usage non vérifié ».

---

## Domaine 1 — Profil du pilote (« moi »)

### `my_profile` ✅
- **Rôle** : la fiche de l'utilisateur principal (le « pilote ») sur lui-même. Table centrale du profil : préférences relationnelles, style d'attention, tempérament, mode de vie, infos pratiques (tailles, adresse, allergies…), réglages de notifications, ET l'état de l'abonnement (essai, statut, dates de pause/annulation/suppression). Très large (98 colonnes).
- **Volume** : 2 lignes
- **Accès (RLS)** : chaque utilisateur ne voit et ne modifie que sa propre fiche (`user_id` = utilisateur connecté).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | nullable |
| created_at | timestamptz | nullable |
| updated_at | timestamptz | nullable |
| love_language | text | nullable |
| communication_style | text | nullable |
| stress_response | text | nullable |
| energy_type | text | nullable |
| conflict_style | text | nullable |
| appreciation_style | text | nullable |
| surprise_preference | text | nullable |
| food_preferences | text | nullable |
| wishlist | text | nullable |
| standing | text | nullable |
| gastronomy | text | nullable |
| accommodation | text | nullable |
| gift_style | text | nullable |
| additional_notes | text | nullable |
| disliked_activities | text | nullable |
| disliked_foods | text | nullable |
| tactility | text | nullable |
| health_comfort | text | nullable |
| family_life | text | nullable |
| character_emotions | text | nullable |
| cannot_stand | text | nullable |
| few_know | text | nullable |
| food_allergies | text | nullable |
| diet | text | nullable |
| religion | text | nullable |
| disability | text | nullable |
| postal_address | text | nullable |
| phone | text | nullable |
| cadence_preference | text | nullable (déf. `normal`) |
| has_children | boolean | nullable (déf. false) |
| pilote_difficult_period_until | date | nullable |
| pilote_last_achievement_at | date | nullable |
| notif_push_enabled | boolean | nullable (déf. true) |
| notif_email_enabled | boolean | nullable (déf. true) |
| notif_quiet_hours_start | integer | nullable (déf. 21) |
| notif_quiet_hours_end | integer | nullable (déf. 8) |
| notif_max_per_day | integer | nullable (déf. 2) |
| trial_started_at | timestamptz | nullable (déf. now) |
| subscription_status | text | nullable (déf. `trial`) |
| subscription_paused_at | timestamptz | nullable |
| silent_since | timestamptz | nullable |
| last_active_at | timestamptz | nullable (déf. now) |
| cancelled_at | timestamptz | nullable |
| deletion_scheduled_at | timestamptz | nullable |
| physical_contact_with | text[] | nullable |
| questionnaire_input_mode | text | nullable (déf. `written`) |
| social_energy | text | nullable |
| conflict_resolution | text | nullable |
| decision_making | text | nullable |
| emotional_expression | text | nullable |
| core_values | text | nullable |
| recognition_preference | text | nullable |
| boundaries | text | nullable |
| growth_mindset | text | nullable |
| favorite_foods | text | nullable |
| gift_preference | text | nullable |
| conversation_topics | text | nullable |
| things_to_avoid | text | nullable |
| best_contact_method | text | nullable |
| important_dates | text | nullable |
| clothing_size | text | nullable |
| shoe_size | text | nullable |
| ring_size | text | nullable |
| pants_size | text | nullable |
| pets | text | nullable |
| hobbies | text | nullable |
| attention_answers | jsonb | nullable |
| attention_reception | jsonb | nullable |
| attention_expression | jsonb | nullable |
| attention_computed_at | timestamptz | nullable |
| attention_breath_text | text | nullable |
| temperament_answers | jsonb | nullable |
| temperament_axes | jsonb | nullable |
| temperament_modes | jsonb | nullable |
| temperament_computed_at | timestamptz | nullable |
| lifestyle_answers | jsonb | nullable |
| lifestyle_axes | jsonb | nullable |
| relational_filters | jsonb | nullable |
| lifestyle_computed_at | timestamptz | nullable |
| singularity_answers | jsonb | nullable |
| practical_info | jsonb | nullable |
| practical_computed_at | timestamptz | nullable |
| profile_synthesis | jsonb | nullable |
| synthesis_computed_at | timestamptz | nullable |
| discovery_answers | jsonb | nullable |
| discovery_fatigue_score | integer | nullable (déf. 0) |
| grammatical_gender | text | nullable |
| style_gender_orientation | text[] | nullable |
| lifetime_trial | boolean | NOT NULL (déf. false) |
| date_de_naissance | date | nullable |
| is_findable | boolean | NOT NULL (déf. true) |
| handle | text | nullable |
| avatar_path | text | nullable |
| onboarding_completed | boolean | NOT NULL (déf. false) |

### `profile_analysis` ✅
- **Rôle** : le résultat de l'analyse produite par Candice — pour le pilote lui-même (`contact_id` vide) ou pour un proche (`contact_id` renseigné). Contient le texte de synthèse, les cartes/chips, les sections, les « must-have », les « deal-breakers », l'ADN d'attention, le radar de style, etc. C'est la fiche affichée à l'écran.
- **Volume** : 2 lignes
- **Accès (RLS)** : le pilote voit/modifie ses propres analyses. **En plus**, un proche ayant un consentement actif peut lire : (a) l'analyse d'un contact le concernant (consentement `contact_analysis` actif), ou (b) l'analyse « profil de soi » du pilote si un partage `profile_view` actif existe et que la portée n'est pas « blind ».
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| summary | text | nullable |
| summary_chips | jsonb | nullable |
| sections | jsonb | nullable |
| dimension_scores | jsonb | nullable |
| must_haves | jsonb | nullable |
| deal_breakers | jsonb | nullable |
| attention_dna | jsonb | nullable |
| constraints | jsonb | nullable |
| entities | jsonb | nullable |
| gender | text | nullable |
| confidence | double precision | nullable |
| source | text | nullable |
| generated_at | timestamptz | nullable |
| engine_version | text | nullable (déf. `2.0`) |
| created_at | timestamptz | nullable |
| updated_at | timestamptz | nullable |
| summary_third_person | text | nullable |
| insights | jsonb | nullable |
| modes | jsonb | nullable |
| style_radar | jsonb | nullable |
| summary_long | text | nullable |
| podium_intro | text | nullable |
| understood_cards | jsonb | nullable |
| works_phrases | jsonb | nullable |
| territory | jsonb | nullable |
| universe | jsonb | nullable |

### `profile_completion` 🟡
- **Rôle** : suivi du remplissage du profil, question par question (est-ce rempli, quand demandé, quand répondu, combien de fois sauté). Sert à savoir quoi proposer ensuite au pilote. Vide aujourd'hui.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres lignes de complétion (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| question_key | text | NOT NULL |
| is_filled | boolean | nullable (déf. false) |
| answer_data | jsonb | nullable |
| last_asked_at | timestamptz | nullable |
| answered_at | timestamptz | nullable |
| skipped_count | integer | nullable (déf. 0) |
| created_at | timestamptz | nullable |
| status | text | NOT NULL (déf. `not_started`) |
| personalized_text | text | nullable |

### `profile_notes` ✅
- **Rôle** : notes libres, soit sur un contact (`contact_id` renseigné), soit personnelles. Champ texte simple.
- **Volume** : 1 ligne
- **Accès (RLS)** : chacun gère ses propres notes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| user_id | uuid | nullable |
| note | text | NOT NULL |
| created_at | timestamptz | nullable |

### `user_points` ✅
- **Rôle** : historique des points gagnés par l'utilisateur (gamification), une ligne par action et son nombre de points.
- **Volume** : 1 ligne
- **Accès (RLS)** : chacun ne voit que ses propres points (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| action_type | text | NOT NULL |
| points | integer | NOT NULL |
| created_at | timestamptz | nullable |

---

## Domaine 2 — Questionnaire, Discovery & confidences

### `discovery_questions` ✅
- **Rôle** : la **banque de questions** du parcours « Discovery » (questions posées au fil de l'eau pour enrichir le profil). Chaque ligne = une question : son texte, sa dimension, son type, ses options, ses conditions de déclenchement, sa priorité, ce qu'elle met à jour dans le profil, et si son texte est verrouillé (`locked_text`). C'est du contenu de référence, pas des données utilisateur.
- **Volume** : 70 lignes
- **Accès (RLS)** : **lecture publique** (tout utilisateur connecté peut lire les questions) ; l'écriture est réservée au service technique.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| question_key | text | NOT NULL |
| dimension | text | NOT NULL |
| subdimension | text | nullable |
| question_text | text | NOT NULL |
| question_type | text | NOT NULL |
| options | jsonb | nullable |
| trigger_key | text | nullable |
| target | text | NOT NULL (déf. `self`) |
| min_days_between | integer | nullable (déf. 30) |
| sort_order | integer | nullable (déf. 0) |
| statut | text | nullable (déf. `active`) |
| created_at | timestamptz | nullable |
| trigger_from_main_question | text | nullable |
| trigger_condition | text | nullable |
| priority | integer | nullable (déf. 50) |
| free_text_enabled | boolean | nullable (déf. false) |
| updates_dimensions | text[] | nullable |
| updates_must_have | boolean | nullable (déf. false) |
| updates_deal_breakers | boolean | nullable (déf. false) |
| updates_supplier_rules | boolean | nullable (déf. false) |
| updates_recommendation_logic | boolean | nullable (déf. false) |
| do_not_show_if | text | nullable |
| profile_output_impact | text | nullable |
| catalogue_matching_impact | text | nullable |
| benefit_label | text | nullable |
| duration_label | text | nullable |
| locked_text | boolean | NOT NULL (déf. false) |

### `discovery_sessions` ✅
- **Rôle** : une session Discovery en cours ou terminée pour un utilisateur (mode, questions en attente `pending_keys`, index courant, statut, dates). Créée à la première réponse.
- **Volume** : 57 lignes
- **Accès (RLS)** : chacun ne voit que ses propres sessions (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| mode | text | NOT NULL |
| pending_keys | text[] | nullable (déf. vide) |
| current_index | integer | nullable (déf. 0) |
| status | text | nullable (déf. `active`) |
| started_at | timestamptz | nullable |
| last_activity_at | timestamptz | nullable |

### `questionnaire_responses` 🟡
- **Rôle** : réponses au questionnaire pour un contact (love language, style de communication, tailles, régime, centres d'intérêt…). Ancien format de questionnaire proche ; `data_source` indique l'origine (saisie pilote, etc.). Vide aujourd'hui mais largement référencée dans le code.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres réponses (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| love_language | text | nullable |
| communication_style | text | nullable |
| stress_response | text | nullable |
| social_energy | text | nullable |
| appreciation_style | text | nullable |
| conflict_resolution | text | nullable |
| decision_making | text | nullable |
| emotional_expression | text | nullable |
| core_values | text | nullable |
| recognition_preference | text | nullable |
| boundaries | text | nullable |
| growth_mindset | text | nullable |
| hobbies | text | nullable |
| favorite_foods | text | nullable |
| gift_preference | text | nullable |
| conversation_topics | text | nullable |
| things_to_avoid | text | nullable |
| best_contact_method | text | nullable |
| important_dates | text | nullable |
| additional_notes | text | nullable |
| created_at | timestamptz | nullable |
| updated_at | timestamptz | nullable |
| standing | text | nullable |
| gastronomy | text | nullable |
| accommodation | text | nullable |
| gift_style | text | nullable |
| clothing_size | text | nullable |
| shoe_size | text | nullable |
| ring_size | text | nullable |
| pants_size | text | nullable |
| food_allergies | text[] | nullable |
| diet | text[] | nullable |
| pets | text | nullable |
| physical_contact_with | text[] | nullable |
| input_mode | text | nullable (déf. `written`) |
| attention_reception | jsonb | nullable |
| incognito_signals | jsonb | nullable |
| interests | jsonb | nullable |
| data_source | text | NOT NULL (déf. `pilot_input`) |

### `confidences` ✅
- **Rôle** : les « confidences » que le pilote confie à Candice (texte brut ou vocal). Candice détecte le sujet, le ton émotionnel, et peut répondre. Alimente ensuite d'éventuelles mises à jour de profil.
- **Volume** : 2 lignes
- **Accès (RLS)** : chacun gère ses propres confidences (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| raw_text | text | NOT NULL |
| input_mode | text | NOT NULL (déf. `text`) |
| detected_subject | text | NOT NULL |
| emotional_tone | text | NOT NULL |
| candice_response | text | nullable |
| created_at | timestamptz | NOT NULL |

### `profile_updates_from_confidences` 🟡
- **Rôle** : propositions de mise à jour du profil déduites d'une confidence (quel champ, ancienne/nouvelle valeur, statut en attente/validé). File de relecture avant d'écrire dans le profil.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres propositions (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| confidence_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| field_name | text | NOT NULL |
| old_value | text | nullable |
| new_value | text | NOT NULL |
| status | text | NOT NULL (déf. `pending`) |
| created_at | timestamptz | NOT NULL |
| reviewed_at | timestamptz | nullable |

### `shared_profile_responses` 🟡
- **Rôle** : réponses saisies via un lien de partage (`token`) — un proche remplit des infos qui remontent au pilote. Stockage brut en JSON (`response_data`).
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres lignes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| token | text | NOT NULL |
| user_id | uuid | NOT NULL |
| response_data | jsonb | NOT NULL |
| created_at | timestamptz | nullable |
| updated_at | timestamptz | nullable |

### `share_links` 🟡
- **Rôle** : liens de partage émis par un utilisateur (`sender_id`, `token`, expiration) pour collecter des réponses. Vide aujourd'hui.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne gère que les liens qu'il a émis (`sender_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| token | text | NOT NULL (déf. uuid) |
| sender_id | uuid | NOT NULL |
| sender_name | text | NOT NULL |
| created_at | timestamptz | nullable |
| expires_at | timestamptz | nullable |

---

## Domaine 3 — Contacts, proches & partage

### `contacts` ✅
- **Rôle** : la fiche de chaque proche géré par le pilote (nom, relation, coordonnées, photo, adresse, date de naissance, niveau de proximité, cadence, mode « mémoire », lien vers un compte proche `proche_user_id`…). Table pivot de toute l'app.
- **Volume** : 3 lignes
- **Accès (RLS)** : chacun ne voit et ne gère que ses propres contacts (`user_id`).
- **Note** : la colonne `gift_wishlist` (jsonb) est **DÉPRÉCIÉE** (fusionnée dans `carnet_envies_items` à la migration 67, conservée mais plus alimentée).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| name | text | NOT NULL |
| relationship | text | NOT NULL |
| email | text | nullable |
| phone | text | nullable |
| created_at | timestamptz | nullable |
| archived_at | timestamptz | nullable |
| photo_url | text | nullable |
| gift_wishlist | jsonb | nullable (déf. `[]`) — **DÉPRÉCIÉE** |
| last_reminder_sent_at | timestamptz | nullable |
| proximity_level | text | nullable (déf. `close`) |
| cadence_override | text | nullable |
| last_suggestion_at | timestamptz | nullable |
| archive_reason | text | nullable |
| is_memory_mode | boolean | nullable (déf. false) |
| memory_anniversary_opt_out | boolean | nullable (déf. false) |
| proche_user_id | uuid | nullable |
| relationship_register | text | nullable |
| gender | text | nullable |
| idempotency_key | text | nullable |
| date_de_naissance | date | nullable |
| postal_address | text | nullable |

### `contact_consents` 🟡
- **Rôle** : les consentements entre un pilote et un proche. Deux natures (`kind`) : `contact_analysis` (le proche accepte d'être analysé) et `profile_view` (un tiers demande à voir le profil « de soi » du pilote). Gère le statut (en attente / actif / rejeté), la portée (`scope`) et les dates.
- **Volume** : 0 ligne
- **Accès (RLS)** — plusieurs règles combinées :
  - le **pilote** gère tous les consentements où il est le pilote (`pilote_id`) ;
  - le **proche** peut lire les consentements qui le concernent (`proche_user_id`) ;
  - le **proche** peut répondre (accepter/rejeter) à une demande d'analyse le concernant ;
  - un **demandeur** peut créer une demande de vue-profil (`profile_view`, en attente, sur lui-même) et annuler sa propre demande en attente.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| pilote_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| proche_user_id | uuid | nullable |
| status | text | NOT NULL (déf. `pending`) |
| scope | text[] | NOT NULL (déf. `{analysis}`) |
| requested_at | timestamptz | NOT NULL |
| responded_at | timestamptz | nullable |
| consented_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL |
| kind | text | NOT NULL (déf. `contact_analysis`) |
| requested_by | uuid | nullable |

### `profile_share_links` ✅
- **Rôle** : liens de partage du profil « de soi » du pilote (jeton haché `token_hash`, portée `scope`, expiration 30 j, qui a réclamé le lien, consentement associé, date de révocation). Mécanisme actuel de partage de fiche.
- **Volume** : 1 ligne
- **Accès (RLS)** : le propriétaire (`owner_id`) gère ses propres liens.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| owner_id | uuid | NOT NULL |
| token_hash | text | NOT NULL |
| scope | text[] | NOT NULL |
| created_at | timestamptz | NOT NULL |
| expires_at | timestamptz | NOT NULL (déf. now + 30 j) |
| claimed_by | uuid | nullable |
| claimed_at | timestamptz | nullable |
| consent_id | uuid | nullable |
| revoked_at | timestamptz | nullable |

### `invite_links` 🟡
- **Rôle** : liens d'invitation émis par un pilote pour inviter un proche (jeton, nom du pilote, contact lié, expiration 30 j, date d'utilisation).
- **Volume** : 0 ligne
- **Accès (RLS)** : le pilote (`pilote_id`) gère ses propres liens d'invitation.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| token | text | NOT NULL (déf. uuid) |
| pilote_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| pilote_name | text | nullable |
| expires_at | timestamptz | nullable (déf. now + 30 j) |
| used_at | timestamptz | nullable |
| created_at | timestamptz | nullable |

### `person_states` 🟡
- **Rôle** : l'état déclaré d'une personne à un instant (« pas le bon moment », etc.) — sujet soit le pilote lui-même (`subject_kind`), soit un contact. Sert au filtrage amont des recommandations (Espace Proche, moteur de reco).
- **Volume** : 0 ligne
- **Accès (RLS)** : le déclarant (`declared_by`) gère ses propres états ; **en plus**, un proche peut lire l'état « de soi » d'un pilote s'il a un partage `profile_view` actif avec ce pilote.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| subject_kind | text | NOT NULL |
| subject_user_id | uuid | nullable |
| contact_id | uuid | nullable |
| declared_by | uuid | NOT NULL |
| state | text | NOT NULL |
| note_free | text | nullable |
| event_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL |

### `cross_validations` ⚫
- **Rôle** : questions de « validation croisée » posées à un proche pour trancher un doute sur une reco (déclenchées ex. par un double refus). Rattachées à l'Espace Proche V2 (phases 7-10, non lancées).
- **Volume** : 0 ligne
- **Statut** : ⚫ — 0 ligne **et** aucune référence dans le code applicatif (`src/`) au moment du relevé ; la table existe en base mais n'est pas branchée à l'app (feature non lancée).
- **Accès (RLS)** : verrou activé **sans aucune policy** → aucun utilisateur connecté ne peut lire/écrire ; seul le service technique (`service_role`) y accède.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| reco_id | uuid | NOT NULL |
| trigger | text | NOT NULL (déf. `double_gout_refus`) |
| question_text | text | NOT NULL |
| proche_user_id | uuid | NOT NULL |
| proche_answer | text | nullable |
| status | text | NOT NULL (déf. `open`) |
| notified_pilot | boolean | NOT NULL (déf. false) |
| created_at | timestamptz | NOT NULL |
| answered_at | timestamptz | nullable |

### `_deprecated_profile_share_requests` ⚫
- **Rôle** : ancienne mécanique de demandes de partage de profil, **remplacée** par `contact_consents` (`kind = 'profile_view'`) + `profile_share_links`.
- **Volume** : 0 ligne
- **Statut** : ⚫ **MORTE** — préfixe `_deprecated_`, 0 ligne, aucune référence dans le code. Conservée en base par prudence (non droppée).
- **Accès (RLS)** : le propriétaire du profil et le demandeur gèrent leurs lignes respectives (règles héritées, sans effet réel puisque la table n'est plus alimentée).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| requester_id | uuid | nullable |
| profile_owner_id | uuid | nullable |
| status | text | nullable (déf. `pending`) |
| created_at | timestamptz | nullable |
| responded_at | timestamptz | nullable |
| confirmed_with_reauth | boolean | nullable (déf. false) |
| reauth_at | timestamptz | nullable |

---

## Domaine 4 — Recommandations, idées & attentions

### `contact_recommendations` 🟡
- **Rôle** : bloc de recommandations généré pour un contact — les idées (`ideas` en JSON), l'angle mort (`blind_spot`), la cadence suggérée (`kadence`), la date de génération. Une ligne = un jeu de recos pour un proche.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres recommandations (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| ideas | jsonb | NOT NULL (déf. `[]`) |
| blind_spot | jsonb | nullable |
| kadence | text | nullable |
| generated_at | timestamptz | NOT NULL |

### `contact_reco_items` 🟡
- **Rôle** : recommandations à la pièce (une idée = une ligne) pour un contact : type, titre, marque, prix indicatif, photo, traçabilité de la source (`source_trace`), certitude, justification (`why_json`), et **réservation invisible** (statut, qui a réservé, expiration). Version détaillée / moteur de reco.
- **Volume** : 0 ligne
- **Accès (RLS)** : le pilote (`pilot_id`) gère ses propres items.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| reco_type | text | NOT NULL |
| title | text | NOT NULL |
| brand | text | nullable |
| price_indicative | text | nullable |
| photo_url | text | nullable |
| source_trace | text | NOT NULL |
| certainty_pct | integer | nullable |
| why_json | jsonb | nullable |
| need_tag | text | nullable |
| origin_ref | uuid | nullable |
| status | text | NOT NULL (déf. `active`) |
| reservation_status | text | NOT NULL (déf. `available`) |
| reserved_by | uuid | nullable |
| reserved_at | timestamptz | nullable |
| reservation_expires_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

### `reco_refusals` 🟡
- **Rôle** : trace des refus de recommandations par le pilote (raison, sous-raison, note libre, si réactivable et quand `reappear_at`, si mis de côté pour une occasion). Sert au moteur à ne pas re-proposer.
- **Volume** : 0 ligne
- **Accès (RLS)** : le pilote (`pilot_id`) gère ses propres refus.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| reco_id | uuid | NOT NULL |
| reason | text | NOT NULL |
| sub_reason | text | nullable |
| note_free | text | nullable |
| reactivable | boolean | NOT NULL (déf. true) |
| reappear_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL |
| reserved_for_occasion | boolean | NOT NULL (déf. false) |

### `attention_log` 🟡
- **Rôle** : journal des « attentions » proposées à un contact (titre, type, statut proposé/agi, feedback, niveau d'amour `love_level`). Historise ce que Candice a suggéré et comment le pilote a réagi.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres lignes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| attention_title | text | NOT NULL |
| attention_type | text | nullable |
| status | text | NOT NULL (déf. `proposed`) |
| proposed_at | timestamptz | NOT NULL |
| actioned_at | timestamptz | nullable |
| feedback | text | nullable |
| feedback_note | text | nullable |
| feedback_at | timestamptz | nullable |
| love_level | text | nullable |

### `proactive_suggestions` 🟡
- **Rôle** : suggestions proactives générées par Candice pour un contact (titre, description, catégorie, raisonnement, prix estimé, indice partenaire, priorité, statut, expiration). Alimentées par les signaux contextuels.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres suggestions (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| signal_id | uuid | nullable |
| title | text | NOT NULL |
| description | text | NOT NULL |
| category | text | NOT NULL |
| reasoning | text | nullable |
| estimated_price | text | nullable |
| partner_hint | text | nullable |
| status | text | NOT NULL (déf. `pending`) |
| refusal_reason | text | nullable |
| priority | text | NOT NULL (déf. `normal`) |
| generated_at | timestamptz | nullable |
| responded_at | timestamptz | nullable |
| expires_at | timestamptz | nullable |

### `suggestions` 🟡
- **Rôle** : suggestions pour un contact, contenu libre en JSON (`content`). Format ancien/générique (le contenu n'est pas structuré en colonnes). Vide aujourd'hui mais référencée dans le code.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres suggestions (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| content | jsonb | NOT NULL |
| generated_at | timestamptz | nullable |

### `budget_feedback` ⚫
- **Rôle** : réaction du pilote au budget d'une suggestion (trop cher / OK…). Feedback d'ajustement du budget.
- **Volume** : 0 ligne
- **Statut** : ⚫ — 0 ligne **et** aucune référence dans le code applicatif (`src/`) ; table présente en base mais non branchée à l'app au moment du relevé.
- **Accès (RLS)** : chacun ne gère que ses propres lignes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| suggestion_id | uuid | nullable |
| reaction | text | NOT NULL |
| created_at | timestamptz | NOT NULL |

### `signals` ✅
- **Rôle** : signaux déduits sur un contact (type, valeur, polarité positif/négatif, confiance, fraîcheur, mémoire source, compteur d'utilisation en reco, signaux en conflit). Brique du moteur de reco (traçabilité `deduced`).
- **Volume** : 2 lignes
- **Accès (RLS)** : le pilote (`pilot_id`) gère ses propres signaux.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| signal_type | text | NOT NULL |
| signal_value | text | nullable |
| polarity | text | nullable |
| confidence | integer | nullable (déf. 60) |
| source_memory_id | uuid | nullable |
| freshness | timestamptz | nullable |
| used_in_recommendations_count | integer | nullable (déf. 0) |
| last_used_at | timestamptz | nullable |
| last_confirmed_at | timestamptz | nullable |
| conflicting_signals | uuid[] | nullable |
| status | text | nullable (déf. `actif`) |
| created_at | timestamptz | nullable |
| updated_at | timestamptz | nullable |

### `memories` ✅
- **Rôle** : les « mémoires » qu'un pilote enregistre sur un proche (entrée brute, résumé assaini, sentiment, catégorie, intensité, fiabilité de la source, score de confiance, dates de revalidation, niveau de visibilité, impact sur les recos, liens vers événements/wishlist/attentions). Base de connaissance riche par contact.
- **Volume** : 1 ligne
- **Accès (RLS)** : le pilote (`pilot_id`) gère ses propres mémoires.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| raw_input | text | NOT NULL |
| sanitized_summary | text | NOT NULL |
| sentiment | text | nullable |
| category | text | nullable |
| emotional_intensity | text | nullable |
| sensitivity_level | integer | nullable (déf. 1) |
| status | text | nullable (déf. `actif`) |
| source | text | nullable (déf. `w1`) |
| created_at | timestamptz | nullable |
| memory_type | text | nullable (déf. `événement_de_vie`) |
| subcategory | text | nullable |
| source_reliability | text | nullable (déf. `moyenne`) |
| confidence_score | integer | nullable (déf. 60) |
| valid_until | timestamptz | nullable |
| revalidation_date | timestamptz | nullable |
| visibility_level | text | nullable (déf. `privé`) |
| recommendation_impact | jsonb | nullable |
| related_events | uuid[] | nullable |
| related_wishlist_items | uuid[] | nullable |
| related_attention_history | uuid[] | nullable |
| admin_notes | text | nullable |
| updated_at | timestamptz | nullable |
| raw_text | text | nullable |
| reformulated_text | text | nullable |
| type | text | nullable |
| tonality | text | nullable |
| probable_needs | jsonb | nullable |
| confidence | numeric | nullable |
| revalidate_at | timestamptz | nullable |

### `context_journal` 🟡
- **Rôle** : journal de questions/réponses de contexte sur un contact (Candice pose une question, le pilote répond). Historise le dialogue de contextualisation.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres lignes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| question | text | NOT NULL |
| answer | text | nullable |
| answered_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL |
| type | text | nullable |

### `contextual_signals` 🟡
- **Rôle** : signaux contextuels datés (type, données JSON, date de déclenchement, priorité, statut, consommation, expiration). Alimente les suggestions proactives (ex. anniversaire, saison…). Détectés par les crons.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres signaux (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| signal_type | text | NOT NULL |
| signal_data | jsonb | NOT NULL (déf. `{}`) |
| trigger_date | date | NOT NULL |
| priority | text | NOT NULL (déf. `normal`) |
| status | text | NOT NULL (déf. `active`) |
| created_at | timestamptz | nullable |
| consumed_at | timestamptz | nullable |
| expires_at | timestamptz | nullable |

---

## Domaine 5 — Cadence (rythme des attentions)

### `cadence_log` ✅
- **Rôle** : journal des cadences calculées par contact (cadence retenue, raison, facteurs pris en compte). Historise les décisions de rythme.
- **Volume** : 31 lignes
- **Accès (RLS)** : chacun ne voit que ses propres lignes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| decision_at | timestamptz | nullable |
| computed_cadence | text | NOT NULL |
| reason | text | nullable |
| factors | jsonb | nullable (déf. `{}`) |

### `cadence_feedback` 🟡
- **Rôle** : bilan de cadence sur une fenêtre de temps (nb de suggestions, validées, refusées, reportées, ignorées, taux de validation, ajustement recommandé). Sert à ajuster automatiquement le rythme.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres lignes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| window_start | date | NOT NULL |
| window_end | date | NOT NULL |
| suggestions_count | integer | nullable (déf. 0) |
| validated_count | integer | nullable (déf. 0) |
| refused_count | integer | nullable (déf. 0) |
| snoozed_count | integer | nullable (déf. 0) |
| ignored_count | integer | nullable (déf. 0) |
| validation_rate | numeric | nullable |
| recommended_adjustment | text | nullable |
| created_at | timestamptz | nullable |

---

## Domaine 6 — Wishlist perso & Carnet d'envies

### `my_wishlist_items` 🟡
- **Rôle** : la **wishlist personnelle** du pilote (ce qu'il aimerait recevoir) — STRICTEMENT PRIVÉE. Photo, marque, lien, taille, prix indicatif (texte), occasion, niveau d'envie (`envy_level`), destinataires ciblés (`target_recipients`), traçabilité `declared`, et **réservation invisible** (statut, qui a réservé, expiration).
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit et ne modifie que sa propre wishlist (`user_id`) — jamais de vue tierce.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| title | text | NOT NULL |
| url | text | nullable |
| note | text | nullable |
| created_at | timestamptz | NOT NULL |
| photo_url | text | nullable |
| brand | text | nullable |
| web_link | text | nullable |
| size_ref | text | nullable |
| price_indicative | text | nullable |
| occasion | text | nullable |
| note_text | text | nullable |
| envy_level | text | nullable |
| target_recipients | uuid[] | NOT NULL (déf. vide) |
| source_trace | text | NOT NULL (déf. `declared`) |
| reservation_status | text | NOT NULL (déf. `available`) |
| reserved_by | uuid | nullable |
| reserved_at | timestamptz | nullable |
| reservation_expires_at | timestamptz | nullable |

### `carnet_envies_items` 🟡
- **Rôle** : le **carnet d'envies** repérées pour un proche (vit sur la fiche du proche) — description, photo, lien, marque, indice de lieu, occasion(s), phrase entendue (`heard_quote`), source (`heard`/`seen`/`link`), traçabilité `spotted`, niveau de confiance, statut, et modalités de paiement si sourcing marchand.
- **Volume** : 0 ligne
- **Accès (RLS)** : le pilote (`pilot_id`) gère son propre carnet.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| description | text | NOT NULL |
| photo_url | text | nullable |
| source_link | text | nullable |
| brand_name | text | nullable |
| brand_option | text | nullable |
| confidence_level | text | nullable (déf. `moyenne`) |
| location_hint | text | nullable |
| occasion_links | text[] | nullable |
| statut | text | nullable (déf. `actif`) |
| created_at | timestamptz | nullable |
| requires_payment_sourcing | boolean | NOT NULL (déf. false) |
| payment_modalities | jsonb | nullable |
| size_ref | text | nullable |
| price_indicative | text | nullable |
| occasion | text | nullable |
| note_text | text | nullable |
| source | text | nullable |
| heard_quote | text | nullable |
| source_trace | text | NOT NULL (déf. `spotted`) |

---

## Domaine 7 — Épargne & financement

> **Note transversale** : les trois tables ci-dessous ont un verrou RLS propriétaire cohérent (feature « épargne cadeau » prévue) mais **ne sont référencées par aucun code applicatif** (`src/`) au moment du relevé — uniquement dans des scripts de travail à la racine. Elles sont donc marquées ⚫ (présentes mais non branchées à l'app aujourd'hui). À confirmer par Estelle : feature en attente ou abandonnée.

### `savings_goal` ⚫
- **Rôle** : objectif d'épargne pour un cadeau (libellé, montant cible, montant mensuel, date cible, statut, source manuel/auto).
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne gère que ses propres objectifs (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| item_label | text | NOT NULL |
| target_amount | numeric | NOT NULL |
| monthly_amount | numeric | NOT NULL |
| target_date | date | nullable |
| started_at | timestamptz | NOT NULL |
| status | text | NOT NULL (déf. `active`) |
| source | text | NOT NULL (déf. `manual`) |
| created_at | timestamptz | NOT NULL |

### `savings_contribution` ⚫
- **Rôle** : versement rattaché à un objectif d'épargne (`goal_id`, montant, date).
- **Volume** : 0 ligne
- **Accès (RLS)** : on ne gère un versement que si l'objectif parent appartient à l'utilisateur connecté (contrôle via `savings_goal`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| goal_id | uuid | NOT NULL |
| amount | numeric | NOT NULL |
| logged_at | timestamptz | NOT NULL |

### `finance_plans` ⚫
- **Rôle** : plans de financement/paiement en plusieurs fois par référence catalogue (`catalog_ref`, nombre d'échéances). Table de configuration.
- **Volume** : 1 ligne
- **Statut** : ⚫ — non référencée dans le code applicatif (`src/`) au moment du relevé (uniquement scripts de travail). Contient 1 ligne de configuration.
- **Accès (RLS)** : **lecture publique** (tout utilisateur connecté peut lire) ; écriture réservée au service technique.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| catalog_ref | text | NOT NULL |
| n_installments | integer | NOT NULL |
| configured_by | uuid | nullable |
| created_at | timestamptz | NOT NULL |

---

## Domaine 8 — Notifications & push

### `notification_log` 🟡
- **Rôle** : journal des notifications envoyées (canal push/email, type, suggestion/signal lié, titre, corps, statut, dates d'envoi/ouverture/clic, erreur éventuelle).
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres notifications (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| channel | text | NOT NULL |
| notification_type | text | NOT NULL |
| related_suggestion_id | uuid | nullable |
| related_signal_id | uuid | nullable |
| title | text | nullable |
| body | text | nullable |
| status | text | NOT NULL (déf. `sent`) |
| sent_at | timestamptz | nullable |
| opened_at | timestamptz | nullable |
| clicked_at | timestamptz | nullable |
| error_message | text | nullable |

### `push_subscriptions` 🟡
- **Rôle** : abonnements aux notifications push du navigateur (endpoint, clés de chiffrement `p256dh_key`/`auth_key`, user-agent, dernière utilisation).
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne gère que ses propres abonnements push (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| endpoint | text | NOT NULL |
| p256dh_key | text | NOT NULL |
| auth_key | text | NOT NULL |
| user_agent | text | nullable |
| created_at | timestamptz | nullable |
| last_used_at | timestamptz | nullable |

---

## Domaine 9 — Crons & technique

### `cron_runs` 🟡
- **Rôle** : journal des exécutions de tâches planifiées (nom du job, début/fin, statut, nb de signaux détectés, nb de suggestions générées, erreur, métadonnées). Suivi technique des crons.
- **Volume** : 0 ligne
- **Accès (RLS)** : verrou activé **sans policy** → aucun utilisateur connecté n'y accède ; seul le service technique (`service_role`, qui fait tourner les crons) écrit/lit.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| job_name | text | NOT NULL |
| started_at | timestamptz | nullable |
| finished_at | timestamptz | nullable |
| status | text | nullable (déf. `running`) |
| signals_detected | integer | nullable (déf. 0) |
| suggestions_generated | integer | nullable (déf. 0) |
| error_message | text | nullable |
| metadata | jsonb | nullable (déf. `{}`) |

### `processing_log` 🟡
- **Rôle** : journal technique du traitement des mémoires (identifiant de corrélation, pilote, mémoire, étape, statut, durée en ms, erreur, métadonnées). Traçabilité de la chaîne de traitement.
- **Volume** : 0 ligne
- **Accès (RLS)** : verrou activé **sans policy** → aucun utilisateur connecté n'y accède ; seul le service technique (`service_role`) écrit/lit.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| correlation_id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| memory_id | uuid | nullable |
| step | text | NOT NULL |
| status | text | NOT NULL |
| duration_ms | integer | nullable |
| error_message | text | nullable |
| metadata | jsonb | nullable |
| created_at | timestamptz | nullable |

---

## Domaine 10 — Abonnement & cycle de vie du compte

### `account_lifecycle_events` ✅
- **Rôle** : journal des événements du cycle de vie du compte (essai démarré, abonnement activé/pausé/annulé, suppression planifiée…). Chaque ligne = un changement d'état (statut précédent → nouveau, déclencheur, métadonnées). L'état courant de l'abonnement vit, lui, dans `my_profile`.
- **Volume** : 4 lignes
- **Accès (RLS)** : chacun ne voit que les événements de son propre compte (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| event_type | text | NOT NULL |
| previous_status | text | nullable |
| new_status | text | nullable |
| triggered_by | text | nullable |
| metadata | jsonb | nullable (déf. `{}`) |
| created_at | timestamptz | nullable |

---

## Tableau récapitulatif

| Table | Domaine | Volume | RLS activée | Statut |
|---|---|---|---|---|
| my_profile | Profil pilote | 2 | oui | ✅ |
| profile_analysis | Profil pilote | 2 | oui | ✅ |
| profile_completion | Profil pilote | 0 | oui | 🟡 |
| profile_notes | Profil pilote | 1 | oui | ✅ |
| user_points | Profil pilote | 1 | oui | ✅ |
| discovery_questions | Questionnaire/Discovery | 70 | oui | ✅ |
| discovery_sessions | Questionnaire/Discovery | 57 | oui | ✅ |
| questionnaire_responses | Questionnaire/Discovery | 0 | oui | 🟡 |
| confidences | Questionnaire/Discovery | 2 | oui | ✅ |
| profile_updates_from_confidences | Questionnaire/Discovery | 0 | oui | 🟡 |
| shared_profile_responses | Questionnaire/Discovery | 0 | oui | 🟡 |
| share_links | Questionnaire/Discovery | 0 | oui | 🟡 |
| contacts | Contacts/Partage | 3 | oui | ✅ |
| contact_consents | Contacts/Partage | 0 | oui | 🟡 |
| profile_share_links | Contacts/Partage | 1 | oui | ✅ |
| invite_links | Contacts/Partage | 0 | oui | 🟡 |
| person_states | Contacts/Partage | 0 | oui | 🟡 |
| cross_validations | Contacts/Partage | 0 | oui (sans policy) | ⚫ |
| _deprecated_profile_share_requests | Contacts/Partage | 0 | oui | ⚫ |
| contact_recommendations | Recommandations | 0 | oui | 🟡 |
| contact_reco_items | Recommandations | 0 | oui | 🟡 |
| reco_refusals | Recommandations | 0 | oui | 🟡 |
| attention_log | Recommandations | 0 | oui | 🟡 |
| proactive_suggestions | Recommandations | 0 | oui | 🟡 |
| suggestions | Recommandations | 0 | oui | 🟡 |
| budget_feedback | Recommandations | 0 | oui | ⚫ |
| signals | Recommandations | 2 | oui | ✅ |
| memories | Recommandations | 1 | oui | ✅ |
| context_journal | Recommandations | 0 | oui | 🟡 |
| contextual_signals | Recommandations | 0 | oui | 🟡 |
| cadence_log | Cadence | 31 | oui | ✅ |
| cadence_feedback | Cadence | 0 | oui | 🟡 |
| my_wishlist_items | Wishlist/Carnet | 0 | oui | 🟡 |
| carnet_envies_items | Wishlist/Carnet | 0 | oui | 🟡 |
| savings_goal | Épargne | 0 | oui | ⚫ |
| savings_contribution | Épargne | 0 | oui | ⚫ |
| finance_plans | Épargne | 1 | oui | ⚫ |
| notification_log | Notifications | 0 | oui | 🟡 |
| push_subscriptions | Notifications | 0 | oui | 🟡 |
| cron_runs | Crons/Technique | 0 | oui (sans policy) | 🟡 |
| processing_log | Crons/Technique | 0 | oui (sans policy) | 🟡 |
| account_lifecycle_events | Abonnement | 4 | oui | ✅ |

**Bilan** :
- **42 tables**, RLS activée sur les 42.
- **3 tables « sans aucune policy »** = accès service technique (`service_role`) uniquement : `cron_runs`, `processing_log`, `cross_validations`. (Les 39 autres ont des policies « propriétaire » et/ou de partage.)
- **13 tables ✅** avec données réelles : `my_profile`, `profile_analysis`, `profile_notes`, `user_points`, `discovery_questions`, `discovery_sessions`, `confidences`, `contacts`, `profile_share_links`, `signals`, `memories`, `cadence_log`, `account_lifecycle_events`.
- **6 tables ⚫** mortes ou non branchées à l'app : `_deprecated_profile_share_requests`, `cross_validations`, `budget_feedback`, `savings_goal`, `savings_contribution`, `finance_plans`.
- **Le reste = 🟡** : vides aujourd'hui (0 ligne) mais branchées au code.

---

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU**
- **Distinction 🟡 vs ⚫ pour les tables à 0 ligne** : l'instruction dit « morte = 0 ligne ET non référencée dans le code ». J'ai mesuré les références dans `src/` avec `ripgrep`. Hypothèse prise : une table à 0 ligne mais référencée dans `src/` = 🟡 (vide mais branchée) ; à 0 ligne ET 0 référence applicative = ⚫. Alternative possible : certaines ⚫ (épargne, budget_feedback) sont peut-être des features en attente volontaire, pas des tables mortes.
- **`finance_plans`** : 1 ligne (pas 0) mais aucune référence dans `src/`. Je l'ai classée ⚫ (non branchée) par cohérence avec les tables épargne, malgré son unique ligne de config. Alternative : la laisser 🟡.
- **Comptage de références** : le nombre de fichiers citant un nom de table inclut de possibles faux positifs pour les mots génériques (`suggestions`, `signals`, `contacts`). Je ne m'en suis servie que pour trancher 🟡/⚫, pas pour décrire l'usage.

**B. DÉCISIONS PRISES SEUL**
- Regroupement des tables par domaine (10 domaines) : inventé pour la lisibilité, non dicté par la base.
- Rôles fonctionnels de chaque table : déduits du nom + colonnes + contexte CLAUDE.md/MEMORY ; aucune table ne porte de commentaire SQL.
- Traduction des règles RLS complexes (`contact_consents`, `profile_analysis`, `person_states`) résumée en langage simple — la formulation exacte des conditions SQL reste dans la base.

**C. LAISSÉ EN SUSPENS**
- Je n'ai pas inspecté les fonctions RPC / SECURITY DEFINER (ex. `reserve_wishlist_item`) ni les triggers : hors périmètre de la demande (tables uniquement).
- Je n'ai pas listé les clés étrangères / index : non demandés.
- Les scripts scratch à la racine (`s5.cjs`, `scratch_pg3.cjs`, `scratch_pg4.cjs`) référençant les tables épargne/finance sont pré-existants, non touchés.

**D. À VÉRIFIER PAR ESTELLE**
- Les 6 tables marquées ⚫ : confirmer lesquelles sont vraiment mortes (`_deprecated_profile_share_requests` l'est sans ambiguïté) vs. features en attente (`savings_*`, `finance_plans`, `budget_feedback`, `cross_validations` = Espace Proche P7-10).
- `cross_validations`, `cron_runs`, `processing_log` ont RLS activée **sans aucune policy** : voulu (accès service technique seul) — à confirmer.
- Colonne `contacts.gift_wishlist` marquée dépréciée : conforme à CLAUDE.md (migration 67).

**E. MIGRATIONS / BUILD**
- Aucune migration créée, aucune modification de base (lecture seule : uniquement `SELECT` / `information_schema` / `pg_catalog`).
- `npm run build` : non lancé (tâche documentaire, aucun code applicatif modifié).
- Fichier écrit : `docs/cartographie/14-base-de-donnees.md`.
