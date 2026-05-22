# Candice — Spécifications techniques

> Mis à jour le 2026-05-19. Source : lecture directe du code uniquement. Aucune hypothèse.

---

## 1. Stack technique

| Couche | Techno | Version |
|--------|--------|---------|
| Framework | Next.js App Router | 16.2.4 |
| UI | React + React DOM | 19.2.4 |
| Langage | TypeScript | ^5 |
| CSS | Tailwind (minimal) + inline CSS vars | ^4 |
| Base de données | Supabase (Postgres) | — |
| Auth | Supabase Auth (`@supabase/ssr`) | ^0.10.2 |
| Client Supabase | `@supabase/supabase-js` | ^2.104.1 |
| IA | Anthropic Claude | `@anthropic-ai/sdk ^0.91.0` |
| Emails | Resend | ^6.12.3 |
| Push notifs | web-push (VAPID) | ^3.6.7 |
| Déploiement | Vercel Pro | — |

**Notes importantes** :
- Tous les appels Claude utilisent le modèle `claude-sonnet-4-6` (jamais downgrade).
- `APP_URL` est codé en dur `"https://candice.app"` dans les routes email — pas d'env var.
- MultiSelect stocke les valeurs comme CSV dans des colonnes TEXT (ex. `"words,gifts,time"`), sauf `physical_contact_with` qui est un tableau PostgreSQL natif `TEXT[]`.
- Web Speech API (SpeechRecognition + SpeechSynthesisUtterance) : pas de fallback iOS Safari.
- localStorage auto-save toutes les 600 ms (debounce), clé `candice_my_profile_draft_${userId}`.

---

## 2. Variables d'environnement

| Variable | Utilisation |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase — tous les clients (browser + server) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé anon Supabase — client browser et middleware SSR |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — `admin.ts`, bypasse RLS, opérations serveur de confiance |
| `ANTHROPIC_API_KEY` | Clé API Claude |
| `RESEND_API_KEY` | Clé API Resend |
| `RESEND_FROM_EMAIL` | Adresse expéditeur (`candice@candice.app` par défaut) |
| `BETA_PASSWORD` | Mot de passe beta gate (défaut : `Candice2026!`) |
| `VAPID_PUBLIC_KEY` | Clé publique VAPID pour push notifs |
| `VAPID_PRIVATE_KEY` | Clé privée VAPID |
| `NODE_ENV` | Active le flag `secure` sur le cookie `beta_access` en prod |

---

## 3. Arborescence src

```
src/
├── app/
│   ├── api/
│   │   ├── account/cancel-deletion/route.ts
│   │   ├── account/delete/route.ts
│   │   ├── account/export/route.ts
│   │   ├── analyse/route.ts
│   │   ├── auth/callback/route.ts
│   │   ├── beta-access/route.ts
│   │   ├── cadence/auto-adjust/route.ts
│   │   ├── candice-note/route.ts
│   │   ├── confidences/route.ts
│   │   ├── contacts/[id]/cadence/route.ts
│   │   ├── contacts/archive/route.ts
│   │   ├── contacts/create-incognito/route.ts
│   │   ├── contacts/delete/route.ts
│   │   ├── contacts/unarchive/route.ts
│   │   ├── contacts/upload-photo/route.ts
│   │   ├── cron/cadence-feedback/route.ts
│   │   ├── cron/detect-and-generate/route.ts
│   │   ├── cron/detect-and-generate/manual/route.ts
│   │   ├── cron/email-reminders/route.ts
│   │   ├── cron/lifecycle-check/route.ts
│   │   ├── emails/profile-complete/route.ts
│   │   ├── emails/questionnaire-invite/route.ts
│   │   ├── emails/reminder/route.ts
│   │   ├── emails/reminder-suggestion/route.ts
│   │   ├── emails/trial-reminder/route.ts
│   │   ├── emails/welcome/route.ts
│   │   ├── idea-suggestions/route.ts
│   │   ├── parametres/cadence/route.ts
│   │   ├── parametres/notifications/route.ts
│   │   ├── proactive-suggestions/[id]/refuse/route.ts
│   │   ├── proactive-suggestions/[id]/validate/route.ts
│   │   ├── profil/submit/route.ts
│   │   ├── profile-notes/route.ts
│   │   ├── profile-updates/[id]/route.ts
│   │   ├── profile-updates/pending/route.ts
│   │   ├── push/subscribe/route.ts
│   │   ├── push/unsubscribe/route.ts
│   │   ├── questionnaire-insight/route.ts
│   │   ├── questionnaire/proche-register/route.ts
│   │   ├── questionnaire/voice-conversation/route.ts
│   │   ├── shared-profile/complete/route.ts
│   │   ├── sharing/respond/route.ts
│   │   ├── sharing/revoke/route.ts
│   │   ├── subscription/pause/route.ts
│   │   ├── subscription/resume/route.ts
│   │   └── suggestions/route.ts
│   ├── aide/page.tsx
│   ├── beta-access/page.tsx
│   ├── concept/page.tsx
│   ├── conditions-generales/page.tsx
│   ├── confidentialite/page.tsx
│   ├── contact/page.tsx
│   ├── contacts/[id]/page.tsx + AnalysisPanel, ContactActions, ContactHeader, MatchingCard, SuggestionsPanel, WishlistSection
│   ├── contacts/new/page.tsx
│   ├── dashboard/page.tsx
│   ├── dashboard/archives/page.tsx + ArchivesClient
│   ├── dashboard/sharing/page.tsx + SharingClient
│   ├── fonctionnement/page.tsx
│   ├── historique/page.tsx
│   ├── idees/page.tsx
│   ├── login/page.tsx + layout
│   ├── mentions-legales/page.tsx
│   ├── moi/page.tsx + ShareButton
│   ├── moi/questionnaire/page.tsx
│   ├── offre/page.tsx
│   ├── page.tsx (marketing home)
│   ├── parametres/abonnement/page.tsx
│   ├── parametres/notifications/page.tsx
│   ├── partage/[id]/page.tsx
│   ├── profil-partage/[token]/page.tsx + SharedForm, SharedProfileFlow
│   ├── profil/[id]/page.tsx + PublicForm
│   └── register/page.tsx + layout
├── components/
│   ├── ContactActionModal.tsx
│   ├── CookieBanner.tsx
│   ├── SendShareRequest.tsx
│   ├── ShareRequestModal.tsx
│   ├── dashboard/CagnotteWidget, CandiceInput, ContactCard, ContactNotes, DashboardActions, IdeaModal, OnboardingProgressCard, WeeklyCheckin
│   ├── layout/BetaBanner, BottomNav, DashboardShell, MarketingNav, Navbar
│   ├── onboarding/OnboardingFlow, OnboardingOverlay, TourReplay
│   └── questionnaire/InsightCard, QuestionnaireForm, SelfProfileForm, StickyProgressBar, VoiceMode
├── lib/resend.ts
├── proxy.ts (Next.js middleware)
├── types/index.ts
└── utils/
    ├── awardPoints.ts
    └── supabase/admin.ts, client.ts, middleware.ts, server.ts
```

---

## 4. Schéma Supabase

### `my_profile`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL, UNIQUE — clé d'upsert |
| `phone` | text | |
| `love_language` | text | CSV de valeurs MultiSelect |
| `communication_style` | text | CSV |
| `stress_response` | text | CSV |
| `social_energy` | text | CSV |
| `appreciation_style` | text | CSV |
| `conflict_resolution` | text | CSV |
| `decision_making` | text | CSV |
| `emotional_expression` | text | CSV |
| `core_values` | text | CSV |
| `recognition_preference` | text | CSV |
| `boundaries` | text | CSV |
| `growth_mindset` | text | CSV |
| `hobbies` | text | Texte libre |
| `disliked_activities` | text | |
| `favorite_foods` | text | |
| `disliked_foods` | text | |
| `gift_preference` | text | CSV |
| `standing` | text | CSV |
| `gastronomy` | text | CSV |
| `accommodation` | text | CSV |
| `gift_style` | text | CSV |
| `tactility` | text | CSV (max 1) |
| `conversation_topics` | text | Texte libre |
| `things_to_avoid` | text | |
| `best_contact_method` | text | CSV |
| `important_dates` | text | JSON string `[{label, date, isCustom}]` |
| `health_comfort` | text | |
| `family_life` | text | |
| `character_emotions` | text | |
| `cannot_stand` | text | |
| `few_know` | text | |
| `food_allergies` | text | CSV |
| `diet` | text | CSV |
| `religion` | text | |
| `disability` | text | |
| `postal_address` | text | |
| `additional_notes` | text | Jamais écrit par SelfProfileForm — voir Bugs §15 |
| `clothing_size` | text | |
| `shoe_size` | text | |
| `ring_size` | text | |
| `pants_size` | text | |
| `pets` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `cadence_preference` | text | CadenceLevel : discreet/normal/sustained/intense |
| `has_children` | boolean | |
| `pilote_difficult_period_until` | text | date ISO |
| `pilote_last_achievement_at` | text | timestamptz ISO |
| `notif_push_enabled` | boolean | |
| `notif_email_enabled` | boolean | |
| `notif_quiet_hours_start` | integer | heure (0–23) |
| `notif_quiet_hours_end` | integer | heure (0–23) |
| `notif_max_per_day` | integer | |
| `trial_started_at` | text | timestamptz ISO |
| `subscription_status` | text | trial/active/paused/silent/cancelled |
| `subscription_paused_at` | text | |
| `silent_since` | text | |
| `last_active_at` | text | |
| `cancelled_at` | text | |
| `deletion_scheduled_at` | text | |
| `physical_contact_with` | text[] | **Tableau PostgreSQL natif** (migration-9) — déprécié : plus lu ni écrit par le nouveau modèle d'analyse, conservé sans suppression |
| `questionnaire_input_mode` | text | text/voice (migration-9) |
| `attention_answers` | jsonb | Réponses brutes Étape 1 — `{"reception":{"q1":["MOT","GES"],...},"expression":{"qE":[]}}` (migration-11) |
| `attention_reception` | jsonb | Vecteur 7 dimensions face réception — `{"MOT":20,"SER":8,"CAD_C":0,"CAD_S":3,"EXP":15,"GES":6,"SUR":0}` (migration-11) |
| `attention_expression` | jsonb | Vecteur 7 dimensions face expression — même structure (migration-11) |
| `attention_computed_at` | timestamptz | Horodatage du dernier calcul des vecteurs (migration-11) |

**Colonnes orphelines prod** (présentes en base, absentes du code — ne pas supprimer sans validation) :
`energy_type`, `conflict_style`, `food_preferences`, `surprise_preference`, `wishlist`

---

### `contacts`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL |
| `name` | text | NOT NULL |
| `relationship` | text | partner/friend/family/colleague/other |
| `email` | text | |
| `phone` | text | |
| `photo_url` | text | |
| `gift_wishlist` | jsonb | `[{id, title, note?, url?, addedAt}]` |
| `created_at` | timestamptz | |
| `archived_at` | timestamptz | null = actif |
| `last_reminder_sent_at` | timestamptz | |
| `proximity_level` | text | inner_circle/close/extended/distant |
| `cadence_override` | text | CadenceLevel |
| `last_suggestion_at` | timestamptz | |
| `archive_reason` | text | deceased/lost_contact/end_of_relationship/other |
| `is_memory_mode` | boolean | |
| `memory_anniversary_opt_out` | boolean | |

---

### `questionnaire_responses`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid | PK |
| `contact_id` | uuid | NOT NULL |
| `user_id` | uuid | NOT NULL |
| `love_language` | text | CSV |
| `communication_style` | text | CSV |
| `stress_response` | text | CSV |
| `social_energy` | text | CSV |
| `appreciation_style` | text | CSV |
| `conflict_resolution` | text | CSV |
| `decision_making` | text | CSV |
| `emotional_expression` | text | CSV |
| `core_values` | text | CSV |
| `recognition_preference` | text | CSV |
| `boundaries` | text | CSV |
| `growth_mindset` | text | CSV |
| `hobbies` | text | |
| `favorite_foods` | text | |
| `gift_preference` | text | CSV |
| `standing` | text | CSV |
| `gastronomy` | text | CSV |
| `accommodation` | text | CSV |
| `gift_style` | text | CSV |
| `conversation_topics` | text | |
| `things_to_avoid` | text | |
| `best_contact_method` | text | CSV |
| `important_dates` | text | |
| `additional_notes` | text | |
| `physical_contact_with` | text[] | Tableau natif (migration-9) |
| `input_mode` | text | text/voice (migration-9) |
| `clothing_size` | text | |
| `shoe_size` | text | |
| `ring_size` | text | |
| `pants_size` | text | |
| `pets` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `shared_profile_responses`

Table écrite par SharedForm (parcours proche token-gated). **Jamais relue** pour suggestions/analyse — cul-de-sac confirmé (voir §15).

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid | PK |
| `token` | text | NOT NULL |
| `user_id` | uuid | NOT NULL — empêche les inserts anonymes (voir Bugs §15) |
| `response_data` | jsonb | Payload 44 champs identique à questionnaire_responses |
| `updated_at` | timestamptz | |
| UNIQUE(token, user_id) | | |

---

### `share_links`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid | PK |
| `token` | text | UNIQUE |
| `sender_id` | uuid | NOT NULL — attention : proche-register utilise wrongly `sender_user_id` |
| `sender_name` | text | |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz | |

---

### `profile_share_requests`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid | PK |
| `requester_id` | uuid | |
| `profile_owner_id` | uuid | |
| `status` | text | pending/accepted/declined |
| `confirmed_with_reauth` | boolean | |
| `reauth_at` | timestamptz | |
| `created_at` | timestamptz | |
| `responded_at` | timestamptz | |

---

### `suggestions`

| Colonne | Type | Notes |
|---------|------|-------|
| `contact_id` | uuid | UNIQUE — clé d'upsert |
| `user_id` | uuid | |
| `content` | jsonb | Tableau de suggestions `{title, description, category, timing}` |
| `generated_at` | timestamptz | |

---

### `profile_notes`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `contact_id` | uuid | nullable — null = note non liée à un contact |
| `note` | text | |
| `created_at` | timestamptz | |

---

### `user_points`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `action_type` | text | registration / profile_complete / profile_update / contact_created / friend_invited / date_added / feedback / attention_executed / shared_profile_complete |
| `points` | integer | |
| `created_at` | timestamptz | |

---

### `contextual_signals`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `contact_id` | uuid | nullable |
| `signal_type` | text | birthday_d7/d3/d1/today, couple_anniversary, wedding_anniversary, mothers_day, fathers_day, valentines_day, christmas, custom_date, silence, note_mention, pilote_birthday, pilote_mothers_day, pilote_fathers_day, pilote_difficult_period |
| `signal_data` | jsonb | |
| `trigger_date` | text | date ISO |
| `priority` | text | low/normal/high/urgent |
| `status` | text | active/consumed/expired/dismissed |
| `created_at` | timestamptz | |
| `consumed_at` | timestamptz | |
| `expires_at` | timestamptz | |

---

### `proactive_suggestions`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `contact_id` | uuid | nullable |
| `signal_id` | uuid | nullable |
| `title` | text | |
| `description` | text | |
| `category` | text | quality_time/gift/message/gesture/activity |
| `reasoning` | text | |
| `estimated_price` | text | |
| `partner_hint` | text | |
| `status` | text | pending/validated/refused/snoozed/expired |
| `refusal_reason` | text | not_now/already_done/not_fitting/too_generic/too_expensive/other |
| `priority` | text | low/normal/high/urgent |
| `generated_at` | timestamptz | |
| `responded_at` | timestamptz | |
| `expires_at` | timestamptz | |

---

### `confidences`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `contact_id` | uuid | nullable |
| `raw_text` | text | |
| `input_mode` | text | text/voice |
| `detected_subject` | text | contact/pilote/general |
| `emotional_tone` | text | positive/negative/neutral/mixed/urgent |
| `candice_response` | text | |
| `created_at` | timestamptz | |

---

### `profile_updates_from_confidences`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `confidence_id` | uuid | |
| `contact_id` | uuid | nullable |
| `field_name` | text | |
| `old_value` | text | |
| `new_value` | text | |
| `status` | text | pending/applied/rejected |
| `created_at` | timestamptz | |
| `reviewed_at` | timestamptz | |

---

## 5. Flow d'authentification

### Inscription

1. Formulaire à `/register` : nom, email, mot de passe, téléphone.
2. `supabase.auth.signUp({ email, password, options: { data: { full_name, phone }, emailRedirectTo: '/api/auth/callback?next=/dashboard' } })`
3. Si Supabase retourne une session immédiatement (confirmation email désactivée) → connexion directe. Sinon : tentative `signInWithPassword` ; si échec → message "confirme ton email".
4. Succès : upsert du téléphone dans `my_profile`, email de bienvenue (non-bloquant), redirect `/dashboard`.

### Connexion

1. `/login` : email + mot de passe → `supabase.auth.signInWithPassword`.
2. Succès → `/dashboard`. Échec → "E-mail ou mot de passe incorrect."

### Callback OAuth / magic-link

- `GET /api/auth/callback?code=...&next=/dashboard` — `supabase.auth.exchangeCodeForSession(code)` → redirect `next`. Échec → `/login?error=auth_callback_failed`.

### Middleware (`src/proxy.ts`)

Exécuté sur toutes les routes non-statiques.

1. **Beta gate (premier)** : toute requête sans cookie `beta_access` → redirect `/beta-access?from=<path>`. Exceptions : `/beta-access`, `/api/beta-access`, `/api/auth/callback`.
2. **Auth gate (second)** : requêtes vers `/dashboard` ou `/contacts` sans session Supabase → `/login`. Utilisateurs connectés sur `/login` ou `/register` → `/dashboard`.

### Sign-out

`supabase.auth.signOut()` depuis `Navbar` → redirect `/`.

### Clients Supabase (3 instances)

| Fichier | Usage | RLS |
|---------|-------|-----|
| `utils/supabase/client.ts` | Composants client (`"use client"`) | Respecte RLS |
| `utils/supabase/server.ts` | Server components + API routes auth | Respecte RLS |
| `utils/supabase/admin.ts` | Routes API nécessitant un accès global | Bypasse RLS |

---

## 6. Pages

| URL | Fichier | Description |
|-----|---------|-------------|
| `/` | `app/page.tsx` | Landing marketing |
| `/concept` | `app/concept/page.tsx` | Page concept (7 sections éditoriales) |
| `/fonctionnement` | `app/fonctionnement/page.tsx` | Comment ça marche (marketing) |
| `/offre` | `app/offre/page.tsx` | Offre / tarifs |
| `/conditions-generales` | `app/conditions-generales/page.tsx` | CGU |
| `/confidentialite` | `app/confidentialite/page.tsx` | Politique de confidentialité |
| `/mentions-legales` | `app/mentions-legales/page.tsx` | Mentions légales |
| `/contact` | `app/contact/page.tsx` | Formulaire de contact |
| `/beta-access` | `app/beta-access/page.tsx` | Porte beta (mot de passe → cookie 30j) |
| `/login` | `app/login/page.tsx` | Connexion email + mot de passe |
| `/register` | `app/register/page.tsx` | Création de compte |
| `/dashboard` | `app/dashboard/page.tsx` | Vue principale — cartes contacts, CandiceInput, onboarding |
| `/dashboard/archives` | `app/dashboard/archives/page.tsx` | Contacts archivés |
| `/dashboard/sharing` | `app/dashboard/sharing/page.tsx` | Partages de profil entrants/actifs |
| `/contacts/new` | `app/contacts/new/page.tsx` | Ajouter un contact (limite 2 en free) |
| `/contacts/[id]` | `app/contacts/[id]/page.tsx` | Fiche contact : complétion, suggestions, notes, analyse, wishlist |
| `/moi` | `app/moi/page.tsx` | Profil personnel — résumé lecture seule + bouton partage |
| `/moi/questionnaire` | `app/moi/questionnaire/page.tsx` | Questionnaire self (SelfProfileForm) |
| `/parametres/abonnement` | `app/parametres/abonnement/page.tsx` | Gestion abonnement |
| `/parametres/notifications` | `app/parametres/notifications/page.tsx` | Préférences notifications |
| `/aide` | `app/aide/page.tsx` | Aide — tableau points, FAQ, guide |
| `/historique` | `app/historique/page.tsx` | Placeholder (à venir) |
| `/idees` | `app/idees/page.tsx` | Placeholder (à venir) |
| `/partage/[id]` | `app/partage/[id]/page.tsx` | Vue publique read-only du profil d'un utilisateur |
| `/profil/[id]` | `app/profil/[id]/page.tsx` | Questionnaire public pour un contact (ancien flow, PublicForm) |
| `/profil-partage/[token]` | `app/profil-partage/[token]/page.tsx` | Flow proche token-gated (Phase 7) |

### `/moi` — ce qui est affiché

La page charge `my_profile` depuis Supabase (server component).

- **Pas de profil** : état vide + `ResumePrompt` (lien vers `/moi/questionnaire`).
- **Profil existant** :
  - 7 chips : `love_language`, `social_energy`, `communication_style`, `appreciation_style`, `core_values`, `gastronomy`, `gift_preference`.
  - Lignes texte : `hobbies`, `things_to_avoid`, `important_dates`.
  - `ShareButton` → génère `${origin}/partage/${userId}` (vue publique profil, **pas** le questionnaire proche).
  - `CadenceGlobal` avec liens vers `/parametres/notifications` et `/parametres/abonnement`.
- **Aucune page de résultats, aucune visualisation scoring, aucun radar chart, aucun profil dominant.**

---

## 7. Routes API

| Route | Méthode | Table(s) | Notes |
|-------|---------|----------|-------|
| `/api/auth/callback` | GET | — | OAuth/magic-link → `exchangeCodeForSession` → redirect |
| `/api/beta-access` | POST | — | Valide `BETA_PASSWORD` → cookie httpOnly 30j |
| `/api/analyse` | POST | `my_profile`, `questionnaire_responses` | Claude → score compatibilité 0-100, points communs, zones de différence, tips |
| `/api/candice-note` | POST | `profile_notes` | Claude → identifie le contact par nom dans texte libre |
| `/api/confidences` | POST | `confidences`, `profile_updates_from_confidences` | Mode conversationnel |
| `/api/contacts/[id]/cadence` | PATCH | `contacts` | Modifie `cadence_override` du contact |
| `/api/contacts/archive` | POST | `contacts` | Soft delete → `archived_at` |
| `/api/contacts/create-incognito` | POST | `contacts` | Création contact sans email (incognito) |
| `/api/contacts/delete` | POST | `contacts` | Suppression définitive (vérifie ownership) |
| `/api/contacts/unarchive` | POST | `contacts` | Restaure `archived_at = null` |
| `/api/contacts/upload-photo` | POST | `contacts`, Storage | Upload avatar → `photo_url` |
| `/api/cron/detect-and-generate` | GET | `contextual_signals`, `proactive_suggestions` | Détecte signaux, génère suggestions proactives (2×/j) |
| `/api/cron/detect-and-generate/manual` | GET | idem | Déclenchement manuel |
| `/api/cron/email-reminders` | GET | `contacts`, `my_profile` | Emails de rappel quotidiens |
| `/api/cron/cadence-feedback` | GET | `my_profile`, `contacts` | Ajustement cadence (lundi 4h) |
| `/api/cron/lifecycle-check` | GET | `my_profile` | Gestion cycle de vie abonnements (3h quotidien) |
| `/api/emails/profile-complete` | POST | — | Email "fiche complète" via Resend |
| `/api/emails/questionnaire-invite` | POST | — | Email invite questionnaire → `/profil/{contactId}` |
| `/api/emails/reminder` | POST | — | Email rappel contact (aucun appelant dans le code) |
| `/api/emails/reminder-suggestion` | POST | — | Email rappel suggestion |
| `/api/emails/trial-reminder` | POST | — | Email rappel fin de trial |
| `/api/emails/welcome` | POST | — | Email de bienvenue après inscription |
| `/api/idea-suggestions` | POST | — | Claude → idée personnalisée (occasion, budget, profil) |
| `/api/parametres/cadence` | POST | `my_profile` | Modifie `cadence_preference` |
| `/api/parametres/notifications` | POST | `my_profile` | Modifie préférences notifs |
| `/api/proactive-suggestions/[id]/refuse` | POST | `proactive_suggestions` | Marque suggestion comme refusée + raison |
| `/api/proactive-suggestions/[id]/validate` | POST | `proactive_suggestions` | Marque suggestion comme validée |
| `/api/profil/submit` | POST | `questionnaire_responses` | Public (admin client) — ancien flow proche, upsert réponses |
| `/api/profile-notes` | POST | `profile_notes` | Sauvegarde note libre |
| `/api/profile-updates/[id]` | PATCH | `profile_updates_from_confidences` | Applique ou rejette une mise à jour de profil |
| `/api/profile-updates/pending` | GET | `profile_updates_from_confidences` | Liste les mises à jour en attente |
| `/api/push/subscribe` | POST | `my_profile` | Enregistre subscription push VAPID |
| `/api/push/unsubscribe` | POST | `my_profile` | Supprime subscription push |
| `/api/questionnaire-insight` | POST | — | Claude → carte insight mid-questionnaire |
| `/api/questionnaire/proche-register` | POST | `share_links`, `shared_profile_responses` | Flow proche anonyme (**bugué** — voir §15) |
| `/api/questionnaire/voice-conversation` | POST | — | Claude → mode vocal questionnaire |
| `/api/shared-profile/complete` | POST | `user_points`, `share_links` | 500 pts anti-fraude + email au sender |
| `/api/sharing/respond` | POST | `profile_share_requests` | Accepte/refuse une demande de partage (re-auth) |
| `/api/sharing/revoke` | POST | `profile_share_requests` | Révoque un partage accepté |
| `/api/subscription/pause` | POST | `my_profile` | Pause abonnement |
| `/api/subscription/resume` | POST | `my_profile` | Reprend abonnement |
| `/api/account/cancel-deletion` | POST | `my_profile` | Annule la suppression planifiée |
| `/api/account/delete` | POST | `my_profile`, `contacts` | Suppression de compte |
| `/api/account/export` | GET | `my_profile`, `contacts`, `questionnaire_responses` | Export RGPD |
| `/api/cadence/auto-adjust` | POST | `contacts` | Ajustement automatique cadence |
| `/api/suggestions` | POST | `questionnaire_responses`, `suggestions` | Claude → 6 suggestions d'attention, upsert |

---

## 8. Appels Anthropic/Claude

Tous utilisent `claude-sonnet-4-6`. Aucun système de scoring algorithmique n'existe — le seul "score" est `compatibility_score`, un entier 0-100 généré par Claude en texte libre.

| Route | max_tokens | Rôle |
|-------|-----------|------|
| `/api/analyse` | ~1500 | Analyse compatibilité → JSON : score, shared_points, difference_zones, communication_tips, top_things_to_do, things_to_avoid |
| `/api/candice-note` | ~300 | Identification contact dans texte libre |
| `/api/idea-suggestions` | ~600 | Génération d'idée personnalisée |
| `/api/questionnaire-insight` | ~200 | Carte insight mid-questionnaire |
| `/api/suggestions` | ~1200 | 6 suggestions d'attention pour un contact |
| `/api/confidences` | ~500 | Mode conversationnel — analyse confidence + réponse Candice |
| `/api/questionnaire/voice-conversation` | ~400 | Questionnaire vocal |
| `/api/cron/detect-and-generate` | ~800 | Génération suggestions proactives |

---

## 9. Emails Resend

`APP_URL` codé en dur `"https://candice.app"` dans toutes les routes email — pas de variable d'environnement.

| Route | Déclencheur | Destinataire | Sujet |
|-------|------------|-------------|-------|
| `/api/emails/welcome` | `register/page.tsx` (non-bloquant post-signUp) | Nouvel utilisateur | "Candice est prête." |
| `/api/emails/questionnaire-invite` | `QuestionnaireForm.tsx` (contact créé avec email) | Le contact ajouté | "{senderFirstName} vous a ajouté sur Candice." |
| `/api/emails/profile-complete` | Route interne (usage non confirmé) | Propriétaire du profil | — |
| `/api/emails/reminder` | **Aucun appelant dans le code** | Contact | "Votre fiche est incomplète." |
| `/api/emails/reminder-suggestion` | Cron `email-reminders` (probable) | Utilisateur | — |
| `/api/emails/trial-reminder` | Cron `lifecycle-check` (probable) | Utilisateur | — |
| `/api/shared-profile/complete` (inline) | `SharedForm.tsx` (submit authentifié) | Sender du share_link | "La fiche de ton proche est complète ✦" |

---

## 10. Crons Vercel

Définis dans `vercel.json`. Requièrent Vercel Pro.

| Path | Schedule | Rôle |
|------|----------|------|
| `/api/cron/detect-and-generate` | `0 6,14 * * *` | 2×/jour — détecte signaux contextuels (anniversaires, silence, dates custom) + génère proactive_suggestions via Claude |
| `/api/cron/email-reminders` | `0 10 * * *` | 10h quotidien — emails de rappel/suggestion |
| `/api/cron/cadence-feedback` | `0 4 * * 1` | Lundi 4h — ajustement automatique cadence contacts |
| `/api/cron/lifecycle-check` | `0 3 * * *` | 3h quotidien — cycle de vie abonnements (trial expiry, deletion planifiée, etc.) |

---

## 11. Questionnaire SelfProfileForm

**Fichier** : `src/components/questionnaire/SelfProfileForm.tsx`

**Constante** : `TOTAL_QUESTIONS = 36` (barre de progression decorative, le formulaire compte ~41 champs actifs + 1 conditionnel)

**Sauvegarde** : double — localStorage (debounce 600ms) + Supabase upsert onConflict `user_id`

**Mode vocal** : 7 questions exposées dans `VoiceMode` (love_language, social_energy, stress_response, communication_style, appreciation_style, core_values, gift_preference). Utilise Web Speech API + SpeechSynthesisUtterance. Pas de fallback iOS Safari.

**Format MultiSelect** : `values.join(",")` → TEXT en base. Exception : `physical_contact_with` → `TEXT[]` PostgreSQL (jamais join).

**Payload `handleSaveLater` = `handleSubmit`** : 44 champs identiques (pas de différence).

---

### Section 1 — Qui es-tu ?

| # | Champ | Type UI | Clé DB | Valeurs possibles | Max |
|---|-------|---------|--------|-------------------|-----|
| 1 | Je me sens le plus aimé(e) quand… | MultiSelect | `love_language` | words, acts, gifts, time, touch | 3 |
| 1b | Le contact physique c'est surtout avec… | MultiSelect | `physical_contact_with` | partner, family, friends, everyone | 2 |
| | *Conditionnel* : affiché seulement si `love_language` inclut `"touch"`. Stocké en `TEXT[]`. | | | | |
| 2 | Pour communiquer, je préfère… | MultiSelect | `communication_style` | direct, emotional, analytical, casual | 3 |
| 3 | Quand je suis stressé(e)… | MultiSelect | `stress_response` | withdraws, seeks_support, action_oriented, internalizes | 3 |
| 4 | Comment je recharge mes batteries… | MultiSelect | `social_energy` | very_introverted, introverted, ambivert, extroverted, very_extroverted | 3 |
| 5 | Ce qui me touche vraiment… | MultiSelect | `appreciation_style` | verbal, practical, gifts, time, physical | 3 |
| 6 | Face à un désaccord… | MultiSelect | `conflict_resolution` | direct, processes_first, avoids, humor | 3 |
| 7 | Pour mes grandes décisions… | MultiSelect | `decision_making` | logic, intuition, consensus, research | 3 |
| 8 | J'exprime mes émotions… | MultiSelect | `emotional_expression` | openly, selectively, through_actions, rarely | 3 |
| 9 | Dans une relation, ce qui compte le plus… | MultiSelect | `core_values` | loyalty, growth, fun, stability | 3 |
| 10 | Quand je réussis quelque chose… | MultiSelect | `recognition_preference` | public, private, personal, celebrate | 3 |
| 11 | Ce dont j'ai le plus besoin… | MultiSelect | `boundaries` | space, emotional, time, privacy | 3 |
| 12 | Pour grandir, j'aime surtout… | MultiSelect | `growth_mindset` | experiences, structured, reflective, community | 3 |

---

### Section 2 — Tes préférences.

| # | Champ | Type UI | Clé DB | Notes |
|---|-------|---------|--------|-------|
| 13 | Ce que j'adore faire | Textarea + MicButton | `hobbies` | |
| 14 | Ce que j'évite ou déteste | Textarea + MicButton | `disliked_activities` | |
| 15 | Ce que j'adore manger | Textarea + MicButton | `favorite_foods` | |
| 16 | Ce que je déteste manger | Textarea + MicButton | `disliked_foods` | |
| 17 | Pour les cadeaux, je préfère… | MultiSelect | `gift_preference` | experiences, physical, both (max 3) |
| 18 | Quand quelqu'un m'invite ou m'offre quelque chose… | MultiSelect | `standing` | any_sincere, well_chosen, quality, high_standards, no_preference (max 3) |
| 19 | Ma relation à la nourriture et aux restaurants | MultiSelect | `gastronomy` | anywhere, gourmet, fine_dining, passion, functional (max 3) |
| 20 | Si on m'offre un week-end… | MultiSelect | `accommodation` | destination_only, comfortable, charming, luxury, together (max 3) |
| 21 | Pour les cadeaux matériels… | MultiSelect | `gift_style` | useful, listened, beautiful, valuable, experiences (max 3) |
| 22 | Je suis tactile… | MultiSelect | `tactility` | everyone, partner_only, children_only, close_ones, not_at_all (**max 1**) |
| 23 | Les sujets qui me stimulent vraiment | Textarea + MicButton | `conversation_topics` | |
| 24 | Ce qu'il vaut mieux éviter avec moi | Textarea + MicButton | `things_to_avoid` | |
| 25 | La meilleure façon de me contacter | MultiSelect | `best_contact_method` | text, call, email, in_person (max 3) |
| 26 | Mes dates importantes | Date picker custom | `important_dates` | JSON `[{label, date, isCustom}]` — 3 préremplis (anniversaire, mariage, fête) + extensible |

---

### Section 3 — Pour aller plus loin.

| # | Champ | Type UI | Clé DB |
|---|-------|---------|--------|
| 27 | Ma santé & confort | Textarea + MicButton | `health_comfort` |
| 28 | Ma famille & vie perso | Textarea + MicButton | `family_life` |
| 29 | Mon caractère & émotions | Textarea + MicButton | `character_emotions` |
| 30 | Ce que je ne supporte pas | Textarea + MicButton | `cannot_stand` |
| 31 | Ce que peu de gens savent sur moi | Textarea + MicButton | `few_know` |

---

### Section 4 — Infos pratiques.

| # | Champ | Type UI | Clé DB | Notes |
|---|-------|---------|--------|-------|
| 32 | Taille vêtements | Radio | `clothing_size` | XS/S/M/L/XL/XXL |
| 33 | Pointure chaussures | Number input | `shoe_size` | min 28, max 50 |
| 34 | Taille bague | Text input | `ring_size` | optionnel |
| 35 | Taille pantalon | Text input | `pants_size` | optionnel |
| 36 | Allergies alimentaires | MultiSelect | `food_allergies` | aucune, gluten, lactose, noix, fruits_mer, autre (max 6) |
| 37 | Régime alimentaire | MultiSelect | `diet` | omnivore, vegetarian, vegan, halal, kosher, no_preference (max 4) |
| 38 | Animaux de compagnie | Text input | `pets` | |
| 39 | Religion & convictions | Textarea | `religion` | optionnel |
| 40 | Situation de handicap | Textarea | `disability` | optionnel |
| 41 | Adresse postale | Textarea | `postal_address` | |

**Champs `my_profile` non exposés dans SelfProfileForm** : `additional_notes`, `disliked_activities` (présent dans le formulaire mais pas dans `questionnaire_responses`), toutes les colonnes de gestion (`notif_*`, `subscription_*`, `cadence_preference`, `has_children`, `pilote_*`).

---

## 12. Parcours Proche (SharedForm)

**Fichier** : `src/app/profil-partage/[token]/SharedForm.tsx`

Deux flux de soumission parallèles :

**Flux A — Utilisateur authentifié** :
```
SharedForm.buildPayload() → 44 clés
→ supabase.from("shared_profile_responses")
    .upsert({ token, user_id: user.id, response_data: payload }, { onConflict: "token,user_id" })
→ POST /api/shared-profile/complete (500 pts + email sender)
```

**Flux B — Utilisateur anonyme** :
```
SharedForm.buildPayload() → 44 clés
→ POST /api/questionnaire/proche-register
    → BUG 1 : .select("id, sender_user_id, expires_at") — colonne inexistante (vraie : sender_id) → PGRST204
    → BUG 2 : .upsert({ token, user_id: null, ... }) — user_id NOT NULL → échec d'insertion
```

**État de `shared_profile_responses`** : Table **cul-de-sac confirmé**. Aucune route API, aucun composant, aucun cron ne relit jamais cette table pour générer des suggestions ou une analyse.

**Ancien flux parallèle** (`/profil/[id]` via `PublicForm`) :
```
PublicForm.buildPayload() → questionnaire_responses (différente table)
→ POST /api/profil/submit (admin client)
```
Les deux flux coexistent et écrivent dans des tables différentes.

---

## 13. Flows de partage

Trois flows distincts, souvent confondus :

### Flow A — Vue publique du profil

```
/moi → ShareButton → génère URL /partage/${userId}
/partage/[id]/page.tsx → lecture my_profile (read-only, public)
```
→ Personne n'a besoin d'un token. Accessible par l'ID Supabase de l'utilisateur.

### Flow B — Proche remplit son propre questionnaire (Phase 7)

```
share_links (token créé manuellement — aucun code ne crée des lignes)
→ /profil-partage/[token]/page.tsx
→ SharedProfileFlow → SharedForm
→ shared_profile_responses (cul-de-sac)
```
**Problème** : aucun code dans le repo ne crée des entrées `share_links`. Le flow B est unreachable sans intervention manuelle en base.

### Flow C — Partage bilateral de profil (entre utilisateurs Candice)

```
SendShareRequest → POST /api/sharing/respond
→ profile_share_requests (pending → accepted/declined)
→ ShareRequestModal (re-auth requise)
→ /dashboard/sharing (gestion)
```

---

## 14. Système de scoring

**Inexistant.** Confirmé par grep exhaustif sur : `scoring`, `score_`, `MOT`, `SER`, `CAD_C`, `CAD_S`, `EXP`, `GES`, `SUR`, `COM`, `dominant`, `radar`, `normaliz`.

Le seul "score" dans l'application est `compatibility_score` : un entier 0-100 généré par Claude en réponse à un prompt texte dans `/api/analyse`. Aucune formule algorithmique, aucune pondération définie dans le code.

---

## 15. Bugs et cul-de-sac connus

| # | Fichier | Sévérité | Description |
|---|---------|----------|-------------|
| B1 | `api/questionnaire/proche-register/route.ts` | **Critique** | `.select("id, sender_user_id, expires_at")` — colonne inexistante. Vraie colonne : `sender_id`. Retourne PGRST204. |
| B2 | `api/questionnaire/proche-register/route.ts` | **Critique** | `.upsert({ user_id: null, ... })` — `user_id` est NOT NULL dans `shared_profile_responses`. L'insert échoue systématiquement. |
| B3 | `shared_profile_responses` | **Critique** | Table cul-de-sac : jamais relue pour suggestions/analyse. La donnée remplie par les proches est perdue. |
| B4 | `share_links` | **Critique** | Aucune ligne n'est créée par le code. Le flow `/profil-partage/[token]` est unreachable sans intervention manuelle. |
| B5 | `my_profile.additional_notes` | Modéré | Jamais écrit par `SelfProfileForm` (absent du payload 44 champs). Consommé par `/api/suggestions` dans le prompt Claude. Toujours null. |
| B6 | `api/emails/reminder/route.ts` | Mineur | Route existante, aucun appelant dans le code. Dead code. |
| B7 | `ShareButton.tsx` | Mineur | Génère `/partage/${userId}` (vue read-only). N'a aucun rapport avec le flow `/profil-partage/[token]`. Les deux URLs sont souvent confondues. |
| B8 | VoiceMode | Mineur | Web Speech API : pas de fallback iOS Safari (SpeechRecognition non supporté). Échec silencieux. |
| B9 | Emails | Mineur | `APP_URL` codé en dur `"https://candice.app"` dans toutes les routes email. Pas configurable par env var. |
| B10 | `QuestionnaireForm.tsx` | Mineur | Envoie l'email invite questionnaire vers `/profil/{contactId}` (ancien flow PublicForm), pas vers le nouveau flow token `/profil-partage/[token]`. |
