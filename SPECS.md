# Candice — Technical Specifications

> Generated 2026-05-11. Only documents what exists in the codebase.

---

## 1. Project Structure

```
src/app/aide/page.tsx
src/app/api/analyse/route.ts
src/app/api/auth/callback/route.ts
src/app/api/beta-access/route.ts
src/app/api/candice-note/route.ts
src/app/api/contacts/archive/route.ts
src/app/api/contacts/delete/route.ts
src/app/api/contacts/unarchive/route.ts
src/app/api/contacts/upload-photo/route.ts
src/app/api/emails/profile-complete/route.ts
src/app/api/emails/questionnaire-invite/route.ts
src/app/api/emails/reminder/route.ts
src/app/api/emails/welcome/route.ts
src/app/api/idea-suggestions/route.ts
src/app/api/profil/submit/route.ts
src/app/api/profile-notes/route.ts
src/app/api/questionnaire-insight/route.ts
src/app/api/shared-profile/complete/route.ts
src/app/api/sharing/respond/route.ts
src/app/api/sharing/revoke/route.ts
src/app/api/suggestions/route.ts
src/app/beta-access/page.tsx
src/app/comment-ca-marche/page.tsx
src/app/concept/page.tsx
src/app/conditions-generales/page.tsx
src/app/confidentialite/page.tsx
src/app/contacts/[id]/AnalysisPanel.tsx
src/app/contacts/[id]/ContactActions.tsx
src/app/contacts/[id]/ContactHeader.tsx
src/app/contacts/[id]/MatchingCard.tsx
src/app/contacts/[id]/page.tsx
src/app/contacts/[id]/SuggestionsPanel.tsx
src/app/contacts/[id]/WishlistSection.tsx
src/app/contacts/new/page.tsx
src/app/dashboard/archives/ArchivesClient.tsx
src/app/dashboard/archives/page.tsx
src/app/dashboard/page.tsx
src/app/dashboard/sharing/page.tsx
src/app/dashboard/sharing/SharingClient.tsx
src/app/favicon.ico
src/app/globals.css
src/app/historique/page.tsx
src/app/idees/page.tsx
src/app/layout.tsx
src/app/login/layout.tsx
src/app/login/page.tsx
src/app/metadata.ts
src/app/moi/page.tsx
src/app/moi/questionnaire/page.tsx
src/app/moi/ShareButton.tsx
src/app/offre/page.tsx
src/app/page.tsx
src/app/partage/[id]/page.tsx
src/app/profil-partage/[token]/page.tsx
src/app/profil-partage/[token]/SharedForm.tsx
src/app/profil-partage/[token]/SharedProfileFlow.tsx
src/app/profil/[id]/page.tsx
src/app/profil/[id]/PublicForm.tsx
src/app/register/layout.tsx
src/app/register/page.tsx
src/app/robots.ts
src/app/sitemap.ts
src/components/ContactActionModal.tsx
src/components/CookieBanner.tsx
src/components/dashboard/CagnotteWidget.tsx
src/components/dashboard/CandiceInput.tsx
src/components/dashboard/ContactCard.tsx
src/components/dashboard/ContactNotes.tsx
src/components/dashboard/DashboardActions.tsx
src/components/dashboard/IdeaModal.tsx
src/components/dashboard/OnboardingProgressCard.tsx
src/components/dashboard/WeeklyCheckin.tsx
src/components/layout/BetaBanner.tsx
src/components/layout/BottomNav.tsx
src/components/layout/DashboardShell.tsx
src/components/layout/MarketingNav.tsx
src/components/layout/Navbar.tsx
src/components/onboarding/OnboardingFlow.tsx
src/components/onboarding/OnboardingOverlay.tsx
src/components/onboarding/TourReplay.tsx
src/components/questionnaire/InsightCard.tsx
src/components/questionnaire/QuestionnaireForm.tsx
src/components/questionnaire/SelfProfileForm.tsx
src/components/SendShareRequest.tsx
src/components/ShareRequestModal.tsx
src/lib/resend.ts
src/proxy.ts
src/types/index.ts
src/utils/awardPoints.ts
src/utils/supabase/admin.ts
src/utils/supabase/client.ts
src/utils/supabase/middleware.ts
src/utils/supabase/server.ts
```

---

## 2. API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/callback` | GET | OAuth/magic-link callback — exchanges the Supabase `code` param for a session and redirects to `next` (default: `/dashboard`) |
| `/api/beta-access` | POST | Validates the beta password against `BETA_PASSWORD`, sets an `httpOnly` `beta_access` cookie for 30 days |
| `/api/analyse` | POST | Claude-powered compatibility analysis between the user's `my_profile` and a contact's `questionnaire_responses`; returns score, shared points, difference zones, and tips |
| `/api/candice-note` | POST | Parses a free-text note via Claude to identify the target contact by name, then saves a structured entry to `profile_notes` |
| `/api/contacts/archive` | POST | Sets `archived_at` timestamp on a contact (soft delete) |
| `/api/contacts/delete` | POST | Permanently deletes a contact row after verifying ownership |
| `/api/contacts/unarchive` | POST | Clears `archived_at` on a contact, restoring it to the active list |
| `/api/contacts/upload-photo` | POST | Uploads a contact avatar to Supabase Storage and updates `contacts.photo_url` |
| `/api/emails/profile-complete` | POST | Sends a "fiche complète" notification email to the contact owner via Resend |
| `/api/emails/questionnaire-invite` | POST | Sends an invite email to a contact with a link to their public questionnaire at `/profil/{contactId}` |
| `/api/emails/reminder` | POST | Sends a reminder email to a contact who hasn't yet completed their questionnaire |
| `/api/emails/welcome` | POST | Sends a welcome email to a newly registered user |
| `/api/idea-suggestions` | POST | Claude-powered personalized idea generation given an occasion, budget, and contact profile |
| `/api/profil/submit` | POST | Public (admin client, no auth): upserts questionnaire responses for a contact from a public profile form |
| `/api/profile-notes` | POST | Saves a free-text note to the `profile_notes` table, optionally linked to a contact |
| `/api/questionnaire-insight` | POST | Claude-powered mid-questionnaire insight card from partial answers, used during questionnaire fill |
| `/api/shared-profile/complete` | POST | Awards 500 pts to the respondent (once only), then emails the share-link sender that the profile is done |
| `/api/sharing/respond` | POST | Accepts or declines an incoming `profile_share_requests` row; requires re-auth confirmation |
| `/api/sharing/revoke` | POST | Sets a share request status to `declined` (used to revoke an already-accepted share) |
| `/api/suggestions` | POST | Claude-powered generation of 6 personalized attention suggestions for a contact; upserts result into `suggestions` table |

---

## 3. Pages

| URL | File | Description |
|-----|------|-------------|
| `/` | `src/app/page.tsx` | Marketing homepage — hero, product mockup, how-it-works, testimonials, CTA |
| `/concept` | `src/app/concept/page.tsx` | In-depth product concept page with 7 editorial sections |
| `/comment-ca-marche` | `src/app/comment-ca-marche/page.tsx` | Step-by-step how-it-works marketing page |
| `/offre` | `src/app/offre/page.tsx` | Pricing and plan comparison page |
| `/conditions-generales` | `src/app/conditions-generales/page.tsx` | Terms and conditions |
| `/confidentialite` | `src/app/confidentialite/page.tsx` | Privacy policy |
| `/beta-access` | `src/app/beta-access/page.tsx` | Beta gate — password form that sets the `beta_access` cookie |
| `/login` | `src/app/login/page.tsx` | Email + password login form |
| `/register` | `src/app/register/page.tsx` | Account registration form (name, email, password, phone) |
| `/dashboard` | `src/app/dashboard/page.tsx` | Main authenticated view — contact cards, Candice AI input, onboarding overlay |
| `/dashboard/archives` | `src/app/dashboard/archives/page.tsx` | Archived contacts list with unarchive actions |
| `/dashboard/sharing` | `src/app/dashboard/sharing/page.tsx` | Incoming and active profile share requests management |
| `/contacts/new` | `src/app/contacts/new/page.tsx` | Add a new contact — enforces 2-contact free-plan limit |
| `/contacts/[id]` | `src/app/contacts/[id]/page.tsx` | Contact detail — profile completion, suggestions, notes, compatibility analysis, wishlist |
| `/moi` | `src/app/moi/page.tsx` | User's own profile summary with share-link button |
| `/moi/questionnaire` | `src/app/moi/questionnaire/page.tsx` | User's self-profile questionnaire (SelfProfileForm) |
| `/aide` | `src/app/aide/page.tsx` | Help page — points table, FAQ, and app guide |
| `/historique` | `src/app/historique/page.tsx` | Placeholder — history of past attentions (coming soon) |
| `/idees` | `src/app/idees/page.tsx` | Placeholder — personalized ideas by occasion (coming soon) |
| `/partage/[id]` | `src/app/partage/[id]/page.tsx` | Public read-only profile view accessible via a user's share link |
| `/profil/[id]` | `src/app/profil/[id]/page.tsx` | Public questionnaire form sent to a contact to fill in (no auth required) |
| `/profil-partage/[token]` | `src/app/profil-partage/[token]/page.tsx` | Token-gated shared questionnaire flow: landing → optional account → form → done |

---

## 4. Components

### Root components (`src/components/`)

| File | Description |
|------|-------------|
| `ContactActionModal.tsx` | Confirmation modal for archive or delete actions on a contact, with re-auth for delete |
| `CookieBanner.tsx` | GDPR cookie consent banner with `accepted`/`refused` state persisted to localStorage |
| `SendShareRequest.tsx` | Button to send a profile share request to another Candice user |
| `ShareRequestModal.tsx` | Modal with password re-authentication to accept or decline an incoming share request |

### Dashboard (`src/components/dashboard/`)

| File | Description |
|------|-------------|
| `CagnotteWidget.tsx` | Points ledger widget displaying the user's earned-points history by action type |
| `CandiceInput.tsx` | Free-text input that sends a note to the Candice AI, routes it to a contact, and can open IdeaModal |
| `ContactCard.tsx` | Card showing a contact's name, relationship, avatar, and questionnaire completion score |
| `ContactNotes.tsx` | Notes panel for a specific contact with add-note input and chronological display |
| `DashboardActions.tsx` | "Generate an idea" action button rendered when at least one contact exists |
| `IdeaModal.tsx` | Multi-step modal for AI-generated suggestions: pick contact → occasion → budget → results |
| `OnboardingProgressCard.tsx` | Progress checklist for the 4 onboarding steps, hidden once all are complete |
| `WeeklyCheckin.tsx` | Weekly prompt suggesting the user check in on a contact, dismissed per ISO week via localStorage |

### Layout (`src/components/layout/`)

| File | Description |
|------|-------------|
| `BetaBanner.tsx` | Placeholder component — currently renders null |
| `BottomNav.tsx` | Mobile slide-out sidebar navigation with sections (Réseau, Mon profil, Paramètres) |
| `DashboardShell.tsx` | Authenticated layout wrapper: top Navbar, overlay, BottomNav, and scrollable `main-content` |
| `MarketingNav.tsx` | Sticky top navigation for marketing pages with logo, nav links, and "Commencer" CTA |
| `Navbar.tsx` | Dashboard top bar with logo, sidebar toggle, and sign-out button |

### Onboarding (`src/components/onboarding/`)

| File | Description |
|------|-------------|
| `OnboardingFlow.tsx` | Multi-step guided tour overlay shown to first-time users after registration |
| `OnboardingOverlay.tsx` | Wrapper that shows `OnboardingFlow` once per device via `candice_onboarding_complete` localStorage key |
| `TourReplay.tsx` | Re-triggers OnboardingFlow when `candice_replay_tour` localStorage flag is set |

### Questionnaire (`src/components/questionnaire/`)

| File | Description |
|------|-------------|
| `InsightCard.tsx` | Animated card that displays a Claude-generated insight mid-questionnaire fill |
| `QuestionnaireForm.tsx` | Multi-step wizard to add a contact (step 1: name/relationship/email/phone; step 2+: questionnaire) |
| `SelfProfileForm.tsx` | Long-form questionnaire (36 questions across 6 sections) for the user's own personality profile |

---

## 5. Supabase Schema

### `my_profile`

| Column | Type | Nullable |
|--------|------|----------|
| `id` | uuid | required |
| `user_id` | uuid | required |
| `phone` | text | nullable |
| `love_language` | text | nullable |
| `communication_style` | text | nullable |
| `stress_response` | text | nullable |
| `social_energy` | text | nullable |
| `appreciation_style` | text | nullable |
| `conflict_resolution` | text | nullable |
| `decision_making` | text | nullable |
| `emotional_expression` | text | nullable |
| `core_values` | text | nullable |
| `recognition_preference` | text | nullable |
| `boundaries` | text | nullable |
| `growth_mindset` | text | nullable |
| `hobbies` | text | nullable |
| `disliked_activities` | text | nullable |
| `favorite_foods` | text | nullable |
| `disliked_foods` | text | nullable |
| `gift_preference` | text | nullable |
| `standing` | text | nullable |
| `gastronomy` | text | nullable |
| `accommodation` | text | nullable |
| `gift_style` | text | nullable |
| `tactility` | text | nullable |
| `conversation_topics` | text | nullable |
| `things_to_avoid` | text | nullable |
| `best_contact_method` | text | nullable |
| `important_dates` | text | nullable |
| `health_comfort` | text | nullable |
| `family_life` | text | nullable |
| `character_emotions` | text | nullable |
| `cannot_stand` | text | nullable |
| `few_know` | text | nullable |
| `food_allergies` | text | nullable |
| `diet` | text | nullable |
| `religion` | text | nullable |
| `disability` | text | nullable |
| `postal_address` | text | nullable |
| `additional_notes` | text | nullable |
| `clothing_size` | text | nullable |
| `shoe_size` | text | nullable |
| `ring_size` | text | nullable |
| `pants_size` | text | nullable |
| `pets` | text | nullable |
| `created_at` | timestamptz | required |
| `updated_at` | timestamptz | required |

### `contacts`

| Column | Type | Nullable |
|--------|------|----------|
| `id` | uuid | required |
| `user_id` | uuid | required |
| `name` | text | required |
| `relationship` | text | required (`partner`, `friend`, `family`, `colleague`, `other`) |
| `email` | text | nullable |
| `phone` | text | nullable |
| `photo_url` | text | nullable |
| `gift_wishlist` | jsonb | nullable (array of `{id, title, note?, url?, addedAt}`) |
| `created_at` | timestamptz | required |
| `archived_at` | timestamptz | nullable |

### `questionnaire_responses`

| Column | Type | Nullable |
|--------|------|----------|
| `id` | uuid | required |
| `contact_id` | uuid | required |
| `user_id` | uuid | required |
| `love_language` | text | nullable |
| `communication_style` | text | nullable |
| `stress_response` | text | nullable |
| `social_energy` | text | nullable |
| `appreciation_style` | text | nullable |
| `conflict_resolution` | text | nullable |
| `decision_making` | text | nullable |
| `emotional_expression` | text | nullable |
| `core_values` | text | nullable |
| `recognition_preference` | text | nullable |
| `boundaries` | text | nullable |
| `growth_mindset` | text | nullable |
| `hobbies` | text | nullable |
| `favorite_foods` | text | nullable |
| `gift_preference` | text | nullable |
| `standing` | text | nullable |
| `gastronomy` | text | nullable |
| `accommodation` | text | nullable |
| `gift_style` | text | nullable |
| `conversation_topics` | text | nullable |
| `things_to_avoid` | text | nullable |
| `best_contact_method` | text | nullable |
| `important_dates` | text | nullable |
| `additional_notes` | text | nullable |
| `clothing_size` | text | nullable |
| `shoe_size` | text | nullable |
| `ring_size` | text | nullable |
| `pants_size` | text | nullable |
| `pets` | text | nullable |
| `created_at` | timestamptz | required |
| `updated_at` | timestamptz | required |

### `share_links`

| Column | Type | Nullable |
|--------|------|----------|
| `id` | uuid | required |
| `token` | text | required, unique |
| `sender_id` | uuid | required |
| `sender_name` | text | required |
| `created_at` | timestamptz | required |
| `expires_at` | timestamptz | nullable |

### `suggestions`

| Column | Type | Nullable |
|--------|------|----------|
| `contact_id` | uuid | required, unique (upsert key) |
| `user_id` | uuid | required |
| `content` | jsonb | required (array of suggestion objects) |
| `generated_at` | timestamptz | required |

### `profile_notes`

| Column | Type | Nullable |
|--------|------|----------|
| `id` | uuid | required |
| `user_id` | uuid | required |
| `contact_id` | uuid | nullable (null = general note not tied to a contact) |
| `note` | text | required |
| `created_at` | timestamptz | required |

### `user_points`

| Column | Type | Nullable |
|--------|------|----------|
| `id` | uuid | required |
| `user_id` | uuid | required |
| `action_type` | text | required |
| `points` | integer | required |
| `created_at` | timestamptz | required |

Known `action_type` values: `registration`, `profile_complete`, `profile_update`, `contact_created`, `friend_invited`, `date_added`, `feedback`, `attention_executed`, `shared_profile_complete`.

---

## 6. Key Dependencies

From `package.json`:

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.4 | App framework — App Router, server components, API routes, middleware |
| `react` | 19.2.4 | UI library |
| `react-dom` | 19.2.4 | DOM renderer for React |
| `@anthropic-ai/sdk` | ^0.91.0 | Official Claude API client for all AI features |
| `@supabase/ssr` | ^0.10.2 | Supabase SSR helpers for Next.js — cookie-based session management in server components and middleware |
| `@supabase/supabase-js` | ^2.104.1 | Supabase database queries, auth, and Storage on both client and server |
| `resend` | ^6.12.3 | Transactional email service for all outbound emails |
| `typescript` | ^5 | Type checking (dev) |
| `tailwindcss` | ^4 | Utility CSS (dev — minimal use; most styles are inline) |

---

## 7. Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL — used in all Supabase client instances (browser and server) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon (publishable) key — used in browser client and SSR middleware |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — used in `admin.ts` to bypass Row Level Security for trusted server operations |
| `ANTHROPIC_API_KEY` | Claude API key — used in all five AI-powered API routes |
| `RESEND_API_KEY` | Resend API key — used in `src/lib/resend.ts` to initialise the email client |
| `RESEND_FROM_EMAIL` | Sender address for all outbound emails (defaults to `candice@candice.app`) |
| `BETA_PASSWORD` | Password required to pass the beta gate (defaults to `Candice2026!`) |
| `NODE_ENV` | Runtime environment — sets the `secure` flag on the `beta_access` cookie in production |

---

## 8. Auth Flow

### Registration

1. User fills name, email, password, and phone at `/register`.
2. Client calls `supabase.auth.signUp({ email, password, options: { data: { full_name, phone }, emailRedirectTo: '/api/auth/callback?next=/dashboard' } })`.
3. If Supabase returns a session immediately (email confirmation disabled in the Supabase project), the user is logged in. Otherwise, a follow-up `signInWithPassword` is attempted; if that also fails, the user is told to confirm their email.
4. On success: phone is upserted into `my_profile`, a welcome email is fired to `/api/emails/welcome` (non-blocking), and the user is redirected to `/dashboard`.

### Login

1. User fills email + password at `/login`.
2. Client calls `supabase.auth.signInWithPassword({ email, password })`.
3. On success, redirects to `/dashboard`. On failure, shows "E-mail ou mot de passe incorrect."

### OAuth / magic-link callback

- `GET /api/auth/callback?code=...&next=/dashboard` — server exchanges the code for a session via `supabase.auth.exchangeCodeForSession(code)` and redirects to `next`. On failure, redirects to `/login?error=auth_callback_failed`.

### Session management

- Sessions are stored in cookies, managed by `@supabase/ssr`.
- `src/proxy.ts` runs as the Next.js middleware (matches all non-static routes).
- **Beta gate (first)**: any request without a `beta_access` cookie is redirected to `/beta-access?from=<path>`, except the paths `/beta-access`, `/api/beta-access`, and `/api/auth/callback`.
- **Auth gate (second)**: requests to `/dashboard` or `/contacts` without a valid Supabase session redirect to `/login`. Authenticated users hitting `/login` or `/register` are redirected to `/dashboard`.

### Sign out

- `supabase.auth.signOut()` called from the `Navbar` component; redirects to `/`.

---

## 9. Email Flows

Four outbound email triggers, all sent via Resend from `RESEND_FROM_EMAIL`:

### 1. Welcome email
- **Route**: `POST /api/emails/welcome`
- **Trigger**: `src/app/register/page.tsx` — fired non-blocking after a successful `signUp` / `signInWithPassword`.
- **Recipient**: the newly registered user.
- **Subject**: "Candice est prête."

### 2. Questionnaire invite
- **Route**: `POST /api/emails/questionnaire-invite`
- **Trigger**: `src/components/questionnaire/QuestionnaireForm.tsx` — fired non-blocking when a contact is created with a non-empty email address.
- **Recipient**: the contact (the person being added).
- **Subject**: "{senderFirstName} vous a ajouté sur Candice."
- **Content**: link to `/profil/{contactId}` where the contact fills in their own questionnaire.

### 3. Shared-profile completion notification
- **Route**: `POST /api/shared-profile/complete` (email sent inline, not via the `emails/profile-complete` sub-route)
- **Trigger**: `src/app/profil-partage/[token]/SharedForm.tsx` — fired when the respondent submits the token-gated shared questionnaire form.
- **Recipient**: the share-link sender (looked up via `share_links.sender_id`).
- **Subject**: "La fiche de ton proche est complète ✦"
- **Side effect**: also awards 500 points to the respondent (once, anti-fraud guarded).

### 4. Reminder email
- **Route**: `POST /api/emails/reminder`
- **Trigger**: no code caller found in the current codebase — the endpoint exists and is ready but is not invoked from any page or component. Intended to remind a contact who has not yet completed their questionnaire.
- **Recipient**: the contact.
- **Subject**: "Votre fiche est incomplète."

---

## 10. AI Integration

All AI calls use the `@anthropic-ai/sdk` with model `claude-sonnet-4-6`.

| Route | File | Prompt purpose |
|-------|------|---------------|
| `POST /api/analyse` | `src/app/api/analyse/route.ts` | Receives two serialized profiles (user's `my_profile` + contact's `questionnaire_responses`), returns a structured JSON with `compatibility_score` (0–100), `shared_points`, `difference_zones`, `communication_tips`, `top_things_to_do`, and `things_to_avoid` |
| `POST /api/candice-note` | `src/app/api/candice-note/route.ts` | Receives a free-text note and the user's contact list; Claude identifies which contact the note refers to by name (or returns null), enabling the note to be tagged to the correct contact in `profile_notes` |
| `POST /api/idea-suggestions` | `src/app/api/idea-suggestions/route.ts` | Receives occasion, budget, and optional contact profile data; returns a single personalized gift or activity idea with title, description, price range, and rationale |
| `POST /api/questionnaire-insight` | `src/app/api/questionnaire-insight/route.ts` | Receives partial questionnaire answers mid-fill; returns a short first-person insight card (1–2 sentences) surfaced to the respondent to reinforce engagement |
| `POST /api/suggestions` | `src/app/api/suggestions/route.ts` | Receives a contact's full `questionnaire_responses`; returns an array of exactly 6 personalized attention suggestions (`title`, `description`, `category`, `timing`), then upserts them into the `suggestions` table |
