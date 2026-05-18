# PROJECT_AUDIT.md
> État des lieux complet et exhaustif — basé sur lecture directe du code source
> Projet : Candice · Généré le 2026-05-18

---

## 1. Architecture générale

### Stack technique exacte

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework | Next.js (App Router) | 16.2.4 |
| UI runtime | React | 19.2.4 |
| Langage | TypeScript | ^5 |
| Styles | CSS global + inline React styles (pas de Tailwind utilisé activement) | Tailwind v4 installé mais non utilisé |
| Base de données | Supabase (PostgreSQL) | @supabase/supabase-js 2.104.1 |
| Auth SSR | @supabase/ssr | 0.10.2 |
| IA | Anthropic SDK | 0.91.0 |
| Emails transactionnels | Resend | 6.12.3 |
| Polices | DM Sans, Plus Jakarta Sans, Playfair Display (Google Fonts) | — |
| Favicon | `src/app/icon.svg` (détection automatique Next.js App Router) | — |
| PWA | `public/manifest.json` | — |

**Pas de Stripe, pas d'OpenAI, pas de Twilio, pas de webhooks externes.**

---

### Structure du repo

```
candice/
├── src/
│   ├── app/                         # Routes Next.js App Router
│   │   ├── layout.tsx               # Root layout (CookieBanner + schema.org JSON-LD)
│   │   ├── page.tsx                 # Homepage marketing
│   │   ├── metadata.ts              # Métadonnées OG + schema.org
│   │   ├── globals.css              # Tokens CSS (variables, composants globaux)
│   │   ├── icon.svg                 # Favicon auto-détecté par Next.js
│   │   ├── robots.ts                # Robots.txt
│   │   ├── sitemap.ts               # Sitemap.xml
│   │   ├── login/                   # Page connexion
│   │   ├── register/                # Page inscription
│   │   ├── beta-access/             # Accès beta (mot de passe)
│   │   ├── dashboard/               # Dashboard principal (authentifié)
│   │   │   ├── page.tsx
│   │   │   ├── archives/            # Contacts archivés
│   │   │   └── sharing/             # Gestion des partages (⚠️ partiellement cassé)
│   │   ├── contacts/
│   │   │   ├── new/                 # Création d'un nouveau proche
│   │   │   └── [id]/                # Fiche d'un proche
│   │   ├── moi/                     # Ma fiche (profil Pilote)
│   │   │   ├── page.tsx             # Vue lecture du profil
│   │   │   └── questionnaire/       # Formulaire de saisie
│   │   ├── idees/                   # Placeholder (non implémenté)
│   │   ├── historique/              # Placeholder (non implémenté)
│   │   ├── partage/[id]/            # Vue publique du profil Pilote (lecture seule)
│   │   ├── profil/[id]/             # Formulaire remplissage profil par un proche (lien direct)
│   │   ├── profil-partage/[token]/  # Formulaire remplissage via lien token
│   │   ├── aide/                    # Page d'aide
│   │   ├── contact/                 # Page contact
│   │   ├── concept/                 # Page marketing concept
│   │   ├── fonctionnement/          # Page marketing fonctionnement
│   │   ├── offre/                   # Page tarifs / offre
│   │   ├── mentions-legales/        # Mentions légales
│   │   ├── conditions-generales/    # CGU
│   │   ├── confidentialite/         # Politique de confidentialité
│   │   └── api/                     # Routes API (voir section 5)
│   ├── components/
│   │   ├── brand/Logo.tsx           # Composant Logo
│   │   ├── layout/                  # DashboardShell, Navbar, BottomNav, MarketingNav, MarketingFooter
│   │   ├── dashboard/               # ContactCard, CandiceInput, IdeaModal, DashboardActions, etc.
│   │   ├── questionnaire/           # QuestionnaireForm, SelfProfileForm, InsightCard
│   │   ├── onboarding/              # OnboardingFlow, OnboardingOverlay, TourReplay
│   │   ├── ContactActionModal.tsx
│   │   ├── CookieBanner.tsx
│   │   ├── SendShareRequest.tsx
│   │   └── ShareRequestModal.tsx
│   ├── lib/
│   │   └── resend.ts                # Instance Resend + constantes FROM_EMAIL, APP_URL
│   ├── types/
│   │   └── index.ts                 # Interfaces TypeScript (Contact, MyProfile, QuestionnaireResponse, etc.)
│   ├── utils/
│   │   ├── supabase/
│   │   │   ├── client.ts            # createBrowserClient (côté client)
│   │   │   ├── server.ts            # createServerClient (Server Components, cookies 30j)
│   │   │   ├── admin.ts             # createAdminClient (service role key, bypass RLS)
│   │   │   └── middleware.ts        # createClient pour middleware Next.js
│   │   └── awardPoints.ts           # Fonction d'attribution de points
│   └── proxy.ts                     # (fichier présent, usage non déterminé)
├── supabase-schema.sql              # Schéma DB initial
├── supabase-migration-2.sql         # Migration DB (phone, photo_url, gift_wishlist)
├── scripts/
│   └── generate-favicons.mjs        # Script Node pour générer les icônes PNG
├── public/
│   ├── manifest.json                # PWA manifest
│   ├── favicon.ico
│   ├── icons/                       # PNG favicon 16/32/180/192/512px
│   └── robots.txt                   # (statique, doublé par robots.ts)
├── next.config.ts                   # Config Next.js (headers sécurité, redirect)
├── package.json
└── tsconfig.json
```

---

### Variables d'environnement utilisées

Fichier : `.env.local`

| Variable | Valeur (masquée) | Utilisation |
|----------|-----------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ymsutilwlwxrvoxhbsjl.supabase.co` | Client Supabase (public) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Clé publishable Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Admin client (bypass RLS) |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Appels Claude |
| `RESEND_API_KEY` | `re_...` | Envoi emails |
| `RESEND_FROM_EMAIL` | `candice@candice.app` | Expéditeur emails |
| `BETA_PASSWORD` | Non défini dans `.env.local` → fallback `"Candice2026!"` | Accès beta |

**Remarque :** `BETA_PASSWORD` n'est pas défini dans `.env.local`. Le code (`src/app/api/beta-access/route.ts`) utilise `process.env.BETA_PASSWORD ?? "Candice2026!"` — le mot de passe est donc actuellement `"Candice2026!"` en dur.

---

### Services externes

| Service | SDK | Usage |
|---------|-----|-------|
| Supabase | `@supabase/supabase-js`, `@supabase/ssr` | Auth, DB PostgreSQL, Storage |
| Anthropic (Claude) | `@anthropic-ai/sdk` | 5 endpoints IA (voir section 8) |
| Resend | `resend` | 4 types d'emails transactionnels |
| Google Fonts | Import CSS | DM Sans, Plus Jakarta Sans, Playfair Display |

Stripe : **non intégré**. OpenAI : **non intégré**.

---

### Configuration Next.js

Fichier : `next.config.ts`

```
Headers de sécurité sur toutes les routes (/*) :
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

Redirects permanents :
- /comment-ca-marche → /fonctionnement
```

---

### Déploiement

- **Domaine :** `candice.app` (hardcodé dans `src/lib/resend.ts` → `APP_URL = "https://candice.app"`)
- **Plateforme :** Vercel (inférée depuis `public/vercel.svg` et les conventions Next.js)
- **Environnements :** Aucune séparation staging/production visible dans le code source (une seule instance Supabase)

---

## 2. Base de données complète

**Instance Supabase :** `ymsutilwlwxrvoxhbsjl.supabase.co`  
**Fichiers sources :** `supabase-schema.sql` + `supabase-migration-2.sql`

---

### Table `contacts`

Fichier : `supabase-schema.sql` + `supabase-migration-2.sql`

| Colonne | Type | Nullable | Default | Notes |
|---------|------|----------|---------|-------|
| `id` | UUID | NON | `gen_random_uuid()` | PK |
| `user_id` | UUID | NON | — | FK → `auth.users(id)` ON DELETE CASCADE |
| `name` | TEXT | NON | — | |
| `relationship` | TEXT | NON | — | CHECK : `partner`, `friend`, `family`, `colleague`, `other` |
| `email` | TEXT | OUI | — | |
| `phone` | TEXT | OUI | — | Ajout migration (ALTER IF NOT EXISTS) |
| `created_at` | TIMESTAMPTZ | — | `NOW()` | |
| `photo_url` | TEXT | OUI | — | Chemin dans le bucket `contact-photos` (pas une URL signée) |
| `gift_wishlist` | JSONB | OUI | `'[]'::jsonb` | Array de `{id, title, note?, url?, addedAt}` |
| `archived_at` | TIMESTAMPTZ | OUI | — | ⚠️ ABSENT du schéma SQL mais utilisé dans le code TypeScript et les queries Supabase |
| `last_reminder_sent_at` | TIMESTAMPTZ | OUI | — | ⚠️ ABSENT du schéma SQL mais référencé dans `src/types/index.ts` et `ContactActions.tsx` |

**RLS :** `users_own_contacts` → `auth.uid() = user_id` (SELECT, INSERT, UPDATE, DELETE)

---

### Table `my_profile`

Fichier : `supabase-schema.sql` (colonnes de base) + multiples `ALTER TABLE ADD COLUMN IF NOT EXISTS`

| Colonne | Type | Nullable | Notes |
|---------|------|----------|-------|
| `id` | UUID | NON | PK |
| `user_id` | UUID | NON | FK → `auth.users(id)`, UNIQUE, ON DELETE CASCADE |
| `phone` | TEXT | OUI | Ajout `supabase-migration-2.sql` |
| `love_language` | TEXT | OUI | Valeurs séparées par virgules |
| `communication_style` | TEXT | OUI | |
| `stress_response` | TEXT | OUI | |
| `social_energy` | TEXT | OUI | |
| `appreciation_style` | TEXT | OUI | |
| `conflict_resolution` | TEXT | OUI | |
| `decision_making` | TEXT | OUI | |
| `emotional_expression` | TEXT | OUI | |
| `core_values` | TEXT | OUI | |
| `recognition_preference` | TEXT | OUI | |
| `boundaries` | TEXT | OUI | |
| `growth_mindset` | TEXT | OUI | |
| `hobbies` | TEXT | OUI | |
| `disliked_activities` | TEXT | OUI | |
| `favorite_foods` | TEXT | OUI | |
| `disliked_foods` | TEXT | OUI | |
| `gift_preference` | TEXT | OUI | |
| `standing` | TEXT | OUI | |
| `gastronomy` | TEXT | OUI | |
| `accommodation` | TEXT | OUI | |
| `gift_style` | TEXT | OUI | |
| `tactility` | TEXT | OUI | |
| `conversation_topics` | TEXT | OUI | |
| `things_to_avoid` | TEXT | OUI | |
| `best_contact_method` | TEXT | OUI | |
| `important_dates` | TEXT | OUI | JSON stringifié `[{label, date, isCustom}]` |
| `additional_notes` | TEXT | OUI | |
| `health_comfort` | TEXT | OUI | |
| `family_life` | TEXT | OUI | |
| `character_emotions` | TEXT | OUI | |
| `cannot_stand` | TEXT | OUI | |
| `few_know` | TEXT | OUI | |
| `food_allergies` | TEXT | OUI | |
| `diet` | TEXT | OUI | |
| `religion` | TEXT | OUI | |
| `disability` | TEXT | OUI | |
| `postal_address` | TEXT | OUI | |
| `clothing_size` | TEXT | OUI | |
| `shoe_size` | TEXT | OUI | |
| `ring_size` | TEXT | OUI | |
| `pants_size` | TEXT | OUI | |
| `pets` | TEXT | OUI | |
| `onboarding_completed` | BOOLEAN | OUI | Default `false` |
| `created_at` | TIMESTAMPTZ | — | `NOW()` |
| `updated_at` | TIMESTAMPTZ | — | `NOW()` |

**Total : 47 colonnes.**

**RLS :**
- `users_own_my_profile` → toutes opérations : `auth.uid() = user_id`
- `public_read_my_profile` → SELECT : `true` (lecture publique pour les vues partagées)

---

### Table `questionnaire_responses`

Fichier : `supabase-schema.sql` + `ALTER TABLE ADD COLUMN IF NOT EXISTS`

Même structure de champs psychologiques + préférences que `my_profile`, avec en plus :

| Colonne | Type | Nullable | Notes |
|---------|------|----------|-------|
| `id` | UUID | NON | PK |
| `contact_id` | UUID | NON | FK → `contacts(id)` ON DELETE CASCADE |
| `user_id` | UUID | NON | FK → `auth.users(id)` ON DELETE CASCADE |
| `love_language` à `additional_notes` | TEXT | OUI | Mêmes 24 champs que `my_profile` (sauf champs étendus) |
| `clothing_size` | TEXT | OUI | |
| `shoe_size` | TEXT | OUI | |
| `ring_size` | TEXT | OUI | |
| `pants_size` | TEXT | OUI | |
| `pets` | TEXT | OUI | |
| `created_at` | TIMESTAMPTZ | — | `NOW()` |
| `updated_at` | TIMESTAMPTZ | — | `NOW()` |

**Différence avec `my_profile` :** N'inclut pas les champs étendus suivants : `phone`, `disliked_activities`, `disliked_foods`, `tactility`, `health_comfort`, `family_life`, `character_emotions`, `cannot_stand`, `few_know`, `food_allergies`, `diet`, `religion`, `disability`, `postal_address`, `onboarding_completed`.

**RLS :** `users_own_responses` → `auth.uid() = user_id`

---

### Table `suggestions`

| Colonne | Type | Nullable | Notes |
|---------|------|----------|-------|
| `id` | UUID | NON | PK |
| `contact_id` | UUID | NON | FK → `contacts(id)` ON DELETE CASCADE |
| `user_id` | UUID | NON | FK → `auth.users(id)` ON DELETE CASCADE |
| `content` | JSONB | NON | Array de `{title, description, category, timing}` |
| `generated_at` | TIMESTAMPTZ | — | `NOW()` |

**Upsert on conflict :** `contact_id` (une seule ligne de suggestions par contact).

**RLS :** `users_own_suggestions` → `auth.uid() = user_id`

---

### Table `share_links`

| Colonne | Type | Nullable | Notes |
|---------|------|----------|-------|
| `id` | UUID | NON | PK |
| `token` | TEXT | NON | UNIQUE, default `gen_random_uuid()::text` |
| `sender_id` | UUID | NON | FK → `auth.users(id)` ON DELETE CASCADE |
| `sender_name` | TEXT | NON | |
| `created_at` | TIMESTAMPTZ | — | `NOW()` |
| `expires_at` | TIMESTAMPTZ | OUI | `null` = lien permanent |

**RLS :**
- `public_read_share_links` → SELECT : `true`
- `users_manage_share_links` → toutes opérations : `auth.uid() = sender_id`

---

### Table `shared_profile_responses`

| Colonne | Type | Nullable | Notes |
|---------|------|----------|-------|
| `id` | UUID | NON | PK |
| `token` | TEXT | NON | |
| `user_id` | UUID | NON | FK → `auth.users(id)` ON DELETE CASCADE |
| `response_data` | JSONB | NON | Objet plat `{love_language: "...", hobbies: "...", ...}` |
| `created_at` | TIMESTAMPTZ | — | `NOW()` |
| `updated_at` | TIMESTAMPTZ | — | `NOW()` |

**Contrainte unique :** `(token, user_id)` — un seul formulaire par utilisateur par lien.

**RLS :** `users_own_shared_responses` → `auth.uid() = user_id`

---

### Table `profile_notes`

| Colonne | Type | Nullable | Notes |
|---------|------|----------|-------|
| `id` | UUID | NON | PK |
| `contact_id` | UUID | OUI | FK → `contacts(id)` ON DELETE CASCADE |
| `user_id` | UUID | NON | FK → `auth.users(id)` ON DELETE CASCADE |
| `note` | TEXT | NON | |
| `created_at` | TIMESTAMPTZ | — | `NOW()` |

**RLS :** `users_own_profile_notes` → `auth.uid() = user_id`

---

### Table `user_points`

| Colonne | Type | Nullable | Notes |
|---------|------|----------|-------|
| `id` | UUID | NON | PK |
| `user_id` | UUID | NON | FK → `auth.users(id)` ON DELETE CASCADE |
| `action_type` | TEXT | NON | Voir table de valeurs ci-dessous |
| `points` | INTEGER | NON | |
| `created_at` | TIMESTAMPTZ | — | `NOW()` |

**Valeurs de points** (fichier : `src/utils/awardPoints.ts`) :

| `action_type` | Points |
|---------------|--------|
| `registration` | 500 |
| `profile_complete` | 500 |
| `profile_update` | 50 |
| `contact_created` | 200 |
| `friend_invited` | 200 |
| `date_added` | 50 |
| `feedback` | 100 |
| `attention_executed` | 100 |
| `shared_profile_complete` | 500 |

**RLS :** `users_own_points` → `auth.uid() = user_id`

---

### Table `profile_share_requests` ⚠️

**ABSENTE des fichiers SQL** mais :
- Référencée dans `src/types/index.ts` (interface `ProfileShareRequest`)
- Requêtée dans `src/app/dashboard/sharing/page.tsx` (colonnes : `id`, `requester_id`, `profile_owner_id`, `status`, `confirmed_with_reauth`, `reauth_at`, `created_at`, `responded_at`)
- Requêtée dans `src/app/api/sharing/respond/route.ts` et `src/app/api/sharing/revoke/route.ts`

**Impact :** La page `/dashboard/sharing` crasherait au chargement avec une erreur Supabase `42P01` (table inconnue).

---

### Supabase Storage

**Bucket :** `contact-photos`
- **Mode :** Privé (lecture authentifiée uniquement)
- **Écriture :** Via `createAdminClient()` (service role key, bypass RLS)
- **Lecture :** URLs signées de 1h générées via `admin.storage.createSignedUrl(path, 3600)`
- **Path pattern :** `{user_id}/{contact_id}/avatar.{ext}`
- **Configuration :** Créée manuellement depuis le dashboard Supabase (non scriptée)

---

### Vues SQL et fonctions personnalisées

Aucune vue SQL ni fonction SQL personnalisée identifiée dans les fichiers de schéma.

---

## 3. Authentification et gestion utilisateur

### Méthode d'auth

**Email + mot de passe uniquement.**

Fichiers :
- Connexion : `src/app/login/page.tsx` → `supabase.auth.signInWithPassword({ email, password })`
- Inscription : `src/app/register/page.tsx` → `supabase.auth.signUp({ email, password, options: { data: { full_name, phone } } })`
- OAuth callback : `src/app/api/auth/callback/route.ts` → `supabase.auth.exchangeCodeForSession(code)`

Pas de magic link, pas de SSO Google/GitHub, pas de 2FA visible.

---

### Flow d'inscription (étapes exactes)

Fichier : `src/app/register/page.tsx`

1. L'utilisateur saisit : prénom (`name`), email (`email`), téléphone optionnel (`phone`), mot de passe (min. 8 caractères), acceptation CGU (case à cocher obligatoire)
2. Validation JS côté client : email format, mot de passe ≥ 8 chars, téléphone regex si renseigné, CGU cochée
3. `supabase.auth.signUp()` avec `{ email, password, options: { data: { full_name: name, phone }, emailRedirectTo: origin + "/api/auth/callback?next=/dashboard" } }`
4. Si Supabase retourne une session directement (`data.session`) → connexion immédiate
5. Sinon → `supabase.auth.signInWithPassword()` (tente connexion directe)
6. Si la connexion directe échoue → message "Vérifiez votre boîte e-mail" (confirmation email requise)
7. Si un numéro de téléphone est fourni → `supabase.from("my_profile").upsert({ user_id, phone })` (non bloquant)
8. Email de bienvenue envoyé via `POST /api/emails/welcome` (non bloquant)
9. Redirection vers `/dashboard`

**Détection doublons :** Si le message d'erreur de Supabase contient `"already registered"` → affichage d'un message dédié avec lien vers `/login`.

---

### Flow de connexion

Fichier : `src/app/login/page.tsx`

1. Saisie email + mot de passe
2. `supabase.auth.signInWithPassword({ email, password })`
3. Succès → `router.push("/dashboard")` + `router.refresh()`
4. Échec → "E-mail ou mot de passe incorrect."

Pas de lien "Mot de passe oublié" implémenté dans l'UI visible.

---

### Gestion de session

Fichier : `src/utils/supabase/server.ts`

- Sessions stockées en cookies HttpOnly
- Durée : **30 jours** (`maxAge: 60 * 60 * 24 * 30`)
- Middleware (`src/utils/supabase/middleware.ts`) intercepte les requêtes pour rafraîchir les tokens
- Déconnexion : `supabase.auth.signOut()` dans `Navbar.tsx` → redirection vers `/`

---

### Champs utilisateur stockés

Dans `auth.users.user_metadata` (Supabase Auth) :
- `full_name` (prénom saisi à l'inscription)
- `phone` (optionnel, saisi à l'inscription)

Dans `my_profile` (table custom) :
- `phone` (dupliqué depuis user_metadata lors de l'inscription)
- Tous les champs du profil psychologique et préférences

---

### Accès beta

Fichier : `src/app/beta-access/page.tsx` + `src/app/api/beta-access/route.ts`

- Page `/beta-access` avec formulaire mot de passe
- Paramètre `?from=` pour redirection post-accès
- `POST /api/beta-access` vérifie `BETA_PASSWORD` (actuellement `"Candice2026!"`)
- Cookie `beta_access=1` (httpOnly, 30 jours) → permet l'accès aux pages protégées
- Le mécanisme de vérification du cookie beta n'est pas visible dans les fichiers lus (probablement dans middleware ou layout)

---

## 4. Fonctionnalités utilisateur existantes (en prod)

### 4.1 Onboarding

**Fichiers :** `src/components/onboarding/OnboardingOverlay.tsx`, `src/components/onboarding/OnboardingFlow.tsx`

**Ce que ça fait :** Modal plein écran en 4 slides qui s'affiche à la première connexion.

**Slides :**
1. "Bienvenue" (✦) — présentation générale
2. "Votre profil" (👤) — incitation à remplir sa fiche
3. "Vos proches" (💌) — explication du lien de partage
4. "Candice agit" (🔍) — slide finale

**Déclenchement :** `OnboardingOverlay` monte si `localStorage.getItem("candice_onboarding_complete") !== "true"`. Au premier affichage du dashboard, `dashboard/page.tsx` vérifie `myProfile.onboarding_completed` en DB — si `false`, le composant est rendu.

**Fin de l'onboarding :**
- Bouton "Commencer ma fiche" → `supabase.from("my_profile").upsert({ onboarding_completed: true })` + `localStorage.setItem("candice_onboarding_complete", "true")` + redirection `/moi/questionnaire`
- Bouton "Voir le tableau de bord" → même upsert + fermeture de la modal sans redirection

**Tables impactées :** `my_profile` (colonne `onboarding_completed`)

---

### 4.2 Dashboard

**Fichier :** `src/app/dashboard/page.tsx`

**Ce que ça fait :**
- Affiche la liste des contacts actifs (non archivés) triés par date de création
- Affiche une "carte contextuelle" adaptée à la situation de l'utilisateur
- Affiche le composant `CandiceInput` (si des contacts existent)
- Affiche le composant `DashboardActions` (bouton "Idée pour un proche")
- Affiche un lien vers les contacts archivés si applicable

**Données chargées au montage (Promise.all) :**
1. Contacts actifs + leurs questionnaire_responses (JOIN)
2. Mon profil (`my_profile` — seulement `id, onboarding_completed`)
3. Nombre de contacts archivés
4. Note la plus récente (`profile_notes`, limit 1)
5. Suggestions existantes pour les 5 derniers contacts

**Logique carte contextuelle :**
- `no_contacts` : aucun contact → CTA "Ajouter un proche"
- `suggestions_ready` : au moins un contact avec des suggestions en cache → CTA "Voir les suggestions"
- `incomplete_contact` : contact le moins complet < 60% → CTA "Compléter la fiche"
- `watching` : état par défaut ("Candice surveille.")

**Score de complétion** calculé sur 17 champs (`SCORED_FIELDS` dans `dashboard/page.tsx` et `contacts/[id]/page.tsx`).

**Tables impactées :** `contacts`, `questionnaire_responses`, `my_profile`, `profile_notes`, `suggestions`

---

### 4.3 Ma fiche (profil Pilote)

**Fichiers :** `src/app/moi/page.tsx`, `src/app/moi/questionnaire/page.tsx`, `src/components/questionnaire/SelfProfileForm.tsx`

**Vue lecture** (`/moi`) :
- Affiche les chips des valeurs psychologiques principales
- Affiche loisirs, choses à éviter, dates importantes
- Bouton "Modifier" → vers `/moi/questionnaire`
- Bouton "Partager ma fiche" (composant `ShareButton`) → copie le lien `candice.app/partage/{user_id}`
- Lien "Gérer les accès" → vers `/dashboard/sharing` (⚠️ cassé)

**Questionnaire** (`/moi/questionnaire`) :
- Composant `SelfProfileForm` — voir section 11 pour le détail complet
- Sauvegarde automatique en localStorage (`candice_my_profile_draft_{userId}`, debounce 300ms)
- Reprise du brouillon au montage si `initial === null`
- Bouton sticky "💾 Sauvegarder et revenir plus tard"
- Submit → `supabase.from("my_profile").upsert()`

**Tables impactées :** `my_profile`, `user_points`

---

### 4.4 Création d'un proche

**Fichier :** `src/app/contacts/new/page.tsx`, `src/components/questionnaire/QuestionnaireForm.tsx`

**Limite du plan gratuit :** `FREE_PLAN_LIMIT = 2` contacts actifs. Au-delà → écran de blocage avec lien `/offre`.

**Deux modes de création :**

**Mode "Lien" (recommandé) :**
1. Saisie prénom, relation, email optionnel, téléphone optionnel
2. Clic "Il/elle remplit son profil" → création immédiate du contact en DB + génération d'un lien `candice.app/profil/{contact_id}`
3. Si email renseigné → envoi automatique d'un email d'invitation via `POST /api/emails/questionnaire-invite`
4. Affichage du lien + bouton "Copier" + bouton "Envoyer par WhatsApp" (`wa.me/?text=...`)
5. Le proche remplit son profil sur `/profil/{contact_id}` → `POST /api/profil/submit`

**Mode "Incognito" (je remplis moi-même) :**
1. Saisie prénom, relation, email, téléphone
2. Étape 2 : 12 questions psychologiques (MultiSelect, max 3 réponses chacune)
3. Étape 3 : préférences (loisirs, gastronomie, cadeaux, dates, notes — texte libre + MultiSelect)
4. Submit → INSERT `contacts` + INSERT `questionnaire_responses` → redirection `/contacts/{id}`

**Tables impactées :** `contacts`, `questionnaire_responses`, `share_links` (non utilisé dans ce flux — le lien est direct `/profil/{contact_id}`)

---

### 4.5 Fiche d'un proche

**Fichier :** `src/app/contacts/[id]/page.tsx`

**Données chargées au montage (Promise.all) :**
1. Contact + questionnaire_responses
2. Suggestions en cache
3. Mon profil (pour débloquer le matching)
4. Notes récentes (5 dernières)

**Sections affichées si profil existant :**
- `ContactHeader` : nom, relation, téléphone, email, photo, score de complétion
- `ContactActions` : actions (envoyer lien, rappel, archiver, supprimer)
- Card "Ce que Candice sait" : langage d'amour + style relationnel dérivé algorithmiquement
- `MatchingCard` : score de compatibilité (nécessite mon propre profil)
- Dates importantes avec countdown J−X
- `SuggestionsPanel` : 6 suggestions IA
- Profil psychologique complet (collapsible `<details>`)
- Historique (placeholder vide)
- `WishlistSection` : liste de souhaits

**Si pas de profil :** État vide avec CTA "Compléter le profil" → `/contacts/{id}/questionnaire`

**Style relationnel dérivé algorithmiquement** (fonction `deriveRelationalStyle`) : combinaison de `emotional_expression` + `communication_style` + `core_values` → retourne une phrase descriptive.

**Tables impactées :** `contacts`, `questionnaire_responses`, `suggestions`, `my_profile`, `profile_notes`

---

### 4.6 Suggestions IA (6 suggestions par contact)

**Fichier :** `src/app/contacts/[id]/SuggestionsPanel.tsx` + `src/app/api/suggestions/route.ts`

**Ce que ça fait :** Génère 6 suggestions d'attention personnalisées pour un contact donné, basées sur son profil psychologique et ses préférences.

**Parcours utilisateur :**
1. Page contact → section "Suggestions IA" → bouton "Générer pour {nom}"
2. `POST /api/suggestions { contactId }` → Claude claude-sonnet-4-6 (voir prompt section 8)
3. Résultat upsert en DB (`suggestions` table, on conflict `contact_id`)
4. Affichage des 6 cartes avec : catégorie colorée + titre + description + timing

**Catégories et couleurs :**
- `quality_time` → terra (#C47A4A)
- `gift` → rouge bordeaux (#9A3556)
- `message` → terra
- `gesture` → vert (#4A7C59)
- `activity` → ocre (#BA7517)

**Tables impactées :** `contacts`, `questionnaire_responses`, `suggestions`

---

### 4.7 Matching relationnel (analyse de compatibilité)

**Fichier :** `src/app/contacts/[id]/MatchingCard.tsx` + `src/app/api/analyse/route.ts`

**Ce que ça fait :** Compare le profil psychologique du Pilote avec celui du proche et génère un score de compatibilité 0-100 + points forts + zones de friction.

**Parcours utilisateur :**
1. Page contact → card "Matching avec toi" (visible uniquement si le Pilote a son propre profil)
2. Bouton "Analyser" → `POST /api/analyse { contactId }`
3. Claude compare les deux profils (voir prompt section 8)
4. Affichage : score numérique + barre de progression + label + 1 point fort + 1 zone de friction
5. Bouton "Actualiser" pour regénérer

**Non persisté** : l'analyse n'est pas sauvegardée en DB (recalcul à chaque fois).

**Tables impactées :** `contacts`, `questionnaire_responses`, `my_profile` (lecture)

---

### 4.8 Candice Input (notes intelligentes + NER)

**Fichier :** `src/components/dashboard/CandiceInput.tsx` + `src/app/api/candice-note/route.ts`

**Ce que ça fait :** Champ de saisie libre en haut du dashboard pour noter une observation sur un proche. Candice identifie automatiquement le proche mentionné.

**Parcours utilisateur :**
1. Dashboard → champ "Dis quelque chose à Candice…"
2. Submit → `POST /api/candice-note { note }`
3. NER Claude : identifie si un proche est mentionné dans la note (par prénom/surnom/lien)
4. Insertion de la note dans `profile_notes`
5. Toast doré avec la réponse de Candice ("Noté. Je pense à [prénom]." ou "Noté. Je m'en souviens.")
6. Si un proche est identifié → bouton "Voir des idées pour {name}" s'affiche dans le toast

**Tables impactées :** `profile_notes`, `contacts` (lecture pour la liste)

---

### 4.9 Idées contextuelles (occasion + budget)

**Fichier :** `src/components/dashboard/IdeaModal.tsx` + `src/components/dashboard/DashboardActions.tsx` + `src/app/api/idea-suggestions/route.ts`

**Ce que ça fait :** Génère 3 idées d'attention personnalisées pour une occasion et un budget donnés.

**Parcours utilisateur :**
1. Dashboard ou page contact → bouton "💡 Idée pour un proche" → modal
2. Sélection du contact, de l'occasion (7 options) et du budget (4 options)
3. `POST /api/idea-suggestions { contactId, occasion, budget }` → 3 suggestions Claude
4. Affichage des 3 cartes avec : titre, description, prix estimé, lien avec le profil

**Non persisté** : résultats retournés au client uniquement.

**Occasions :** `birthday`, `no_reason`, `reconciliation`, `congratulations`, `return_trip`, `illness`, `other`  
**Budgets :** `free`, `under_30`, `under_80`, `over_80`

---

### 4.10 Notes sur un contact

**Fichier :** `src/components/dashboard/ContactNotes.tsx`

**Ce que ça fait :** Zone de prise de notes rapide sur la fiche d'un contact (5 dernières notes affichées).

**Parcours :** Formulaire sur la page contact → `POST /api/profile-notes { contact_id, note }` → INSERT `profile_notes`.

---

### 4.11 Partage de la fiche Pilote (lecture seule)

**Fichier :** `src/app/partage/[id]/page.tsx`

**Ce que ça fait :** Vue publique du profil `my_profile` d'un utilisateur. Accessible à toute personne ayant l'UUID utilisateur.

**URL :** `candice.app/partage/{user_id}` (UUID non devinable mais permanent)

**Contenu affiché :** Les 12 champs psychologiques + préférences (loisirs, gastronomie, hébergement, cadeaux, dates importantes, etc.)

**CTA viral :** "Toi aussi, partage ta fiche." → `/register`

**Auth requise :** Non (lecture publique via admin client + RLS `public_read_my_profile`)

---

### 4.12 Formulaire de profil pour un proche (lien direct)

**Fichier :** `src/app/profil/[id]/page.tsx`, `src/app/profil/[id]/PublicForm.tsx`

**Ce que ça fait :** Le Pilote envoie `candice.app/profil/{contact_id}` à son proche. Celui-ci remplit un questionnaire psychologique + préférences.

**Submit :** `POST /api/profil/submit { contactId, userId, ...responses }` → upsert `questionnaire_responses` via admin client.

**Auth requise :** Non (le proche n'a pas besoin de compte)

---

### 4.13 Formulaire via lien token (flux profil-partage)

**Fichier :** `src/app/profil-partage/[token]/page.tsx`, `SharedProfileFlow.tsx`, `SharedForm.tsx`

**Ce que ça fait :** Flux alternatif où un utilisateur Candice génère un token de partage et l'envoie à un proche pour que ce dernier remplisse **son propre profil** (stocké dans `shared_profile_responses`).

**Étapes :**
1. Validation du token (vérification `share_links` table, expiration)
2. Affichage `SharedProfileFlow` avec nom de l'expéditeur
3. Landing screen : "Je réponds par écrit" | "💬 Je préfère en discuter" (toast "bientôt disponible")
4. Account screen : incitation à créer un compte
5. Form screen : questionnaire (36 questions identiques à SelfProfileForm)
6. Done screen : "Merci ✓" + CTA création de compte

**Différence avec `/profil/[id]` :** Stockage dans `shared_profile_responses` (non lié à un contact Candice), +500 pts au Pilote si le proche a un compte.

---

### 4.14 Archives des contacts

**Fichier :** `src/app/dashboard/archives/page.tsx`, `ArchivesClient.tsx`

- Affiche les contacts où `archived_at IS NOT NULL`
- Actions : désarchiver → `POST /api/contacts/unarchive`
- Lien depuis le dashboard si `archivedCount > 0`

---

### 4.15 Gestion des partages

**Fichier :** `src/app/dashboard/sharing/page.tsx`, `SharingClient.tsx`

**Statut : ⚠️ CASSÉ** — requête sur table `profile_share_requests` absente de la DB.

---

### 4.16 Insight temps réel pendant questionnaire

**Fichier :** `src/app/api/questionnaire-insight/route.ts`, `src/components/questionnaire/InsightCard.tsx`

- Déclenché à la fin de chaque section du questionnaire
- Génère 1-2 phrases d'observation psychologique sur les réponses partielles
- Non persisté — affiché à l'écran uniquement

---

### 4.17 Liste de souhaits (wishlist)

**Fichier :** `src/app/contacts/[id]/WishlistSection.tsx`

- Permet d'ajouter des items `{title, note?, url?}` à la wishlist d'un contact
- Stocké dans `contacts.gift_wishlist` (JSONB)
- Pas d'endpoint API dédié (update direct via Supabase client)

---

### 4.18 Fonctionnalités placeholder (non implémentées)

| Page | Fichier | État |
|------|---------|------|
| `/idees` | `src/app/idees/page.tsx` | "Bientôt disponible." — page vide |
| `/historique` | `src/app/historique/page.tsx` | "Bientôt disponible." — page vide |
| Mode conversationnel | `SharedProfileFlow.tsx` | Bouton affiche toast "bientôt disponible" |
| Historique sur fiche contact | `contacts/[id]/page.tsx` | Card vide avec `opacity: 0.5` |

---

## 5. Endpoints API existants

**Dossier :** `src/app/api/`

| Méthode | Endpoint | Auth | Input (body) | Output | Notes |
|---------|----------|------|--------------|--------|-------|
| POST | `/api/suggestions` | User | `{ contactId }` | `{ suggestions: Suggestion[] }` | 6 items, upsert `suggestions`, Claude |
| POST | `/api/analyse` | User | `{ contactId }` | `{ analysis: AnalysisResult, contactName }` | Non persisté, Claude |
| POST | `/api/idea-suggestions` | User | `{ contactId, occasion, budget }` | `{ suggestions: [...] }` | 3 items, non persisté, Claude |
| POST | `/api/candice-note` | User | `{ note }` | `{ response, contact_id, contact_name }` | NER + INSERT `profile_notes`, Claude |
| POST | `/api/questionnaire-insight` | Aucune | `{ answers, persona, contactName? }` | `{ insight: string }` | Texte brut, non persisté, Claude |
| POST | `/api/profil/submit` | Aucune* | `{ contactId, userId, ...responses }` | `{ success: true }` | Upsert `questionnaire_responses` via admin client |
| POST | `/api/profile-notes` | User | `{ contact_id, note }` | `{ success: true }` | INSERT `profile_notes` |
| POST | `/api/shared-profile/complete` | User | `{ token }` | `{ success, points }` | +500 pts + email notif sender, idempotent |
| POST | `/api/sharing/respond` | User | `{ requestId, action }` | `{ ok: true }` | ⚠️ Table `profile_share_requests` absente |
| POST | `/api/sharing/revoke` | User | `{ requestId }` | `{ ok: true }` | ⚠️ Même problème |
| POST | `/api/contacts/upload-photo` | User | `FormData { file, contactId }` | `{ signedUrl, path }` | Upload bucket `contact-photos`, admin client |
| POST | `/api/contacts/archive` | User | `{ contactId }` | `{ ok: true }` | UPDATE `contacts.archived_at = NOW()` |
| POST | `/api/contacts/unarchive` | User | `{ contactId }` | `{ ok: true }` | UPDATE `contacts.archived_at = null` |
| POST | `/api/contacts/delete` | User | `{ contactId }` | `{ ok: true }` | DELETE `contacts` (hard delete) |
| POST | `/api/emails/welcome` | Interne | `{ firstName, email }` | `{ success: true }` | Resend |
| POST | `/api/emails/questionnaire-invite` | Interne | `{ contactEmail, contactFirstName, senderFirstName, profileUrl }` | `{ success: true }` | Resend |
| POST | `/api/emails/reminder` | Interne | `{ contactEmail, contactFirstName, senderFirstName, profileUrl }` | `{ success: true }` | Resend |
| POST | `/api/emails/profile-complete` | Interne | `{ ownerEmail, ownerFirstName, contactFirstName }` | `{ success: true }` | Resend |
| GET | `/api/auth/callback` | OAuth | `?code=...&next=...` | Redirect | Échange code Supabase → session |
| POST | `/api/beta-access` | Aucune | `{ password }` | `{ success: true }` | Set cookie `beta_access=1` (30j) |

*`/api/profil/submit` utilise l'admin client (bypass RLS) — pas de vérification auth du user côté serveur. Seul `contactId` et `userId` en body sont utilisés pour identifier la cible.

---

## 6. Composants React majeurs

### Composants de layout

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `DashboardShell` | `src/components/layout/DashboardShell.tsx` | Layout dashboard : Navbar + Sidebar + main content |
| `Navbar` | `src/components/layout/Navbar.tsx` | Topbar : Logo + bouton "Ajouter" + déconnexion |
| `BottomNav` | `src/components/layout/BottomNav.tsx` | Sidebar dark : Mes proches / Idées / Ma fiche / Aide |
| `MarketingNav` | `src/components/layout/MarketingNav.tsx` | Header marketing (pages publiques) |
| `MarketingFooter` | `src/components/layout/MarketingFooter.tsx` | Footer marketing (4 colonnes) |
| `BetaBanner` | `src/components/layout/BetaBanner.tsx` | Bannière beta |
| `Logo` | `src/components/brand/Logo.tsx` | Logo CANDICE• (wordmark + dot terra, 3 tailles : sm/md/lg) |
| `CookieBanner` | `src/components/CookieBanner.tsx` | Bandeau RGPD |

### Composants dashboard

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `ContactCard` | `src/components/dashboard/ContactCard.tsx` | Ligne contact dans la liste (avatar, nom, completion %) |
| `CandiceInput` | `src/components/dashboard/CandiceInput.tsx` | Champ de note libre + NER |
| `DashboardActions` | `src/components/dashboard/DashboardActions.tsx` | Bouton "💡 Idée pour un proche" |
| `IdeaModal` | `src/components/dashboard/IdeaModal.tsx` | Modal sélection occasion/budget + 3 suggestions Claude |
| `ContactNotes` | `src/components/dashboard/ContactNotes.tsx` | Notes rapides sur un contact |
| `OnboardingProgressCard` | `src/components/dashboard/OnboardingProgressCard.tsx` | Card progression onboarding |
| `WeeklyCheckin` | `src/components/dashboard/WeeklyCheckin.tsx` | Check-in hebdomadaire |

### Composants onboarding

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `OnboardingOverlay` | `src/components/onboarding/OnboardingOverlay.tsx` | Wrapper conditionnel (localStorage check) |
| `OnboardingFlow` | `src/components/onboarding/OnboardingFlow.tsx` | Modal 4 slides + actions finales |
| `TourReplay` | `src/components/onboarding/TourReplay.tsx` | Replay du tour d'onboarding |

### Composants questionnaire

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `QuestionnaireForm` | `src/components/questionnaire/QuestionnaireForm.tsx` | Formulaire création proche (2 modes + 4 étapes) |
| `SelfProfileForm` | `src/components/questionnaire/SelfProfileForm.tsx` | Formulaire "Ma fiche" (36 questions, sections 1-4) |
| `InsightCard` | `src/components/questionnaire/InsightCard.tsx` | Affichage insight Claude pendant le remplissage |

### Composants fiche contact

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `ContactHeader` | `src/app/contacts/[id]/ContactHeader.tsx` | Nom, relation, photo, progression |
| `ContactActions` | `src/app/contacts/[id]/ContactActions.tsx` | Menu d'actions (lien, rappel, archive, delete) |
| `SuggestionsPanel` | `src/app/contacts/[id]/SuggestionsPanel.tsx` | 6 suggestions IA avec bouton generate/refresh |
| `MatchingCard` | `src/app/contacts/[id]/MatchingCard.tsx` | Score de compatibilité + force + friction |
| `WishlistSection` | `src/app/contacts/[id]/WishlistSection.tsx` | Liste de souhaits CRUD |
| `AnalysisPanel` | `src/app/contacts/[id]/AnalysisPanel.tsx` | Panneau d'analyse (usage exact non détaillé) |

### Système de design

**Palettes de couleurs (variables CSS dans `globals.css`) :**

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--br` | `#FAF7F2` | Fond principal (crème) |
| `--br1` | `#FFFFFF` | Cards / composants |
| `--terra` | `#C47A4A` | Couleur accent principale |
| `--con` | `#2C1A0E` | Texte primaire (dark brown) |
| `--cond` | `#9E7B5A` | Texte secondaire |
| `--green` | `#4A7C59` | Succès, validé |

**Typographies :**
- `DM Sans` / `Plus Jakarta Sans` — texte UI (poids 300, 400, 500)
- `Playfair Display` — titres éditoriaux, italique

**Composants UI globaux :** `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.card`, `.contact-row`, `.badge`, `.modal`, `.tabs`, `.progress-track`, `.sidebar-item`

**Espacement dashboard :** `main-content` padding `24px 28px`. Sidebar width `264px`. Topbar height `56px`.

---

## 7. Pages du site

### Pages publiques (sans auth)

| Route | Fichier | Rôle | Accès |
|-------|---------|------|-------|
| `/` | `src/app/page.tsx` | Homepage marketing (hero, mockups, présentation) | Public |
| `/register` | `src/app/register/page.tsx` | Inscription | Public |
| `/login` | `src/app/login/page.tsx` | Connexion | Public |
| `/beta-access` | `src/app/beta-access/page.tsx` | Accès beta par mot de passe | Public |
| `/concept` | `src/app/concept/page.tsx` | Page marketing "Le concept" | Public |
| `/fonctionnement` | `src/app/fonctionnement/page.tsx` | Page marketing "Comment ça marche" | Public |
| `/offre` | `src/app/offre/page.tsx` | Tarifs / offre | Public |
| `/aide` | `src/app/aide/page.tsx` | Page d'aide | Public |
| `/contact` | `src/app/contact/page.tsx` | Formulaire de contact | Public |
| `/mentions-legales` | `src/app/mentions-legales/page.tsx` | Mentions légales | Public |
| `/conditions-generales` | `src/app/conditions-generales/page.tsx` | CGU | Public |
| `/confidentialite` | `src/app/confidentialite/page.tsx` | Politique de confidentialité | Public |
| `/partage/[id]` | `src/app/partage/[id]/page.tsx` | Vue lecture du profil Pilote (UUID = user_id) | Public (admin client) |
| `/profil/[id]` | `src/app/profil/[id]/page.tsx` | Formulaire profil pour le proche (UUID = contact_id) | Public |
| `/profil-partage/[token]` | `src/app/profil-partage/[token]/page.tsx` | Flux questionnaire par lien token | Public |

**Redirect permanent :** `/comment-ca-marche` → `/fonctionnement`

### Pages authentifiées

| Route | Fichier | Rôle |
|-------|---------|------|
| `/dashboard` | `src/app/dashboard/page.tsx` | Tableau de bord principal |
| `/dashboard/archives` | `src/app/dashboard/archives/page.tsx` | Contacts archivés |
| `/dashboard/sharing` | `src/app/dashboard/sharing/page.tsx` | Gestion partages (⚠️ cassé) |
| `/contacts/new` | `src/app/contacts/new/page.tsx` | Créer un proche (limite 2 en free) |
| `/contacts/[id]` | `src/app/contacts/[id]/page.tsx` | Fiche détaillée d'un proche |
| `/moi` | `src/app/moi/page.tsx` | Vue de ma fiche |
| `/moi/questionnaire` | `src/app/moi/questionnaire/page.tsx` | Remplir / modifier ma fiche |
| `/idees` | `src/app/idees/page.tsx` | Placeholder (non implémenté) |
| `/historique` | `src/app/historique/page.tsx` | Placeholder (non implémenté) |

**Protection :** Toutes les pages authentifiées utilisent `createClient()` + `supabase.auth.getUser()` → `redirect("/login")` si non connecté.

**robots.ts :** Les routes `/dashboard`, `/api/`, `/contacts/`, `/moi/`, `/historique/`, `/idees/` sont disallowed pour les crawlers.

---

## 8. Intégrations actives

### Anthropic API (Claude)

**Modèle utilisé exclusivement :** `claude-sonnet-4-6`

#### Endpoint 1 : Suggestions générales

**Fichier :** `src/app/api/suggestions/route.ts`  
**Max tokens :** 1 500

**Prompt complet :**
```
Tu es un conseiller en relations humaines, aidant quelqu'un à montrer une attention sincère et significative à une personne qui lui est chère.

Voici le profil complet de [NOM] ([RELATION]) :
[Profil humanisé avec tous les champs remplis]
[CONTRAINTES DE QUALITÉ si applicable]

Génère 6 suggestions d'attention hautement personnalisées pour cette personne. Chaque suggestion doit sembler entièrement sur-mesure — jamais générique. Respecte scrupuleusement les contraintes de qualité ci-dessus si elles sont présentes.

Réponds avec un tableau JSON de exactement 6 objets :
[
  {
    "title": "Titre court de l'action (max 8 mots)",
    "description": "Explication chaleureuse et spécifique expliquant pourquoi cela lui correspond (2-3 phrases)",
    "category": "quality_time" | "gift" | "message" | "gesture" | "activity",
    "timing": "Quand / à quelle fréquence"
  }
]

Toutes les valeurs en français. Suggestions concrètes, actionnables, profondément personnelles. Varie les catégories.
```

**Contraintes de qualité dynamiques injectées :**

| Condition | Contrainte |
|-----------|-----------|
| `standing = high_standards` | "Uniquement des établissements notés 4,5/5 minimum sur Google. Aucune chaîne, aucune franchise." |
| `standing = quality` | "Privilégie des établissements notés 4,5/5 minimum, avec un cadre soigné." |
| `standing = well_chosen` | "L'endroit doit avoir été choisi avec soin — un caractère, une histoire." |
| `gastronomy = passion` | "Tables gastronomiques ou bistrots de référence uniquement. Chefs reconnus, guides (Michelin, Le Fooding)." |
| `gastronomy = fine_dining` | "Cadre gastronomique où le service et le décor comptent autant que l'assiette." |
| `gastronomy = anywhere/gourmet` | "Adresses décontractées acceptées si 4,4/5 minimum avec 100+ avis Google." |
| `gastronomy = functional` | "Garde les suggestions culinaires pratiques — la nourriture n'est pas un plaisir central." |
| `accommodation = luxury` | "Uniquement hôtels 5 étoiles officiels, palaces. Rien en dessous." |
| `accommodation = charming` | "Boutique hôtels, maisons d'hôtes haut de gamme, lieux avec une histoire." |
| `accommodation = comfortable` | "Un bon 3-4 étoiles bien situé convient parfaitement." |
| `gift_style = valuable` | "Objets de valeur durable — bijoux, montre, maroquinerie de qualité." |
| `gift_style = beautiful` | "Objets beaux et bien fabriqués — matières, design soigné, marques reconnues." |
| `gift_style = listened` | "L'objet doit prouver qu'on a retenu quelque chose de très précis." |
| `gift_style = useful` | "Fonctionnel et bien pensé — améliore le quotidien de façon concrète." |
| `gift_style = experiences` | "Préfère nettement les expériences aux objets. Justifie fortement tout cadeau matériel." |

---

#### Endpoint 2 : Analyse de compatibilité

**Fichier :** `src/app/api/analyse/route.ts`  
**Max tokens :** 1 200

**Prompt complet :**
```
Tu es un expert en psychologie relationnelle. Analyse la compatibilité entre deux personnes et génère des conseils actionnables.

PROFIL DE L'UTILISATEUR :
[12 champs psychologiques + loisirs + choses à éviter]

PROFIL DE [NOM] :
[12 champs psychologiques + loisirs + choses à éviter]

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

---

#### Endpoint 3 : Idées contextuelles (occasion + budget)

**Fichier :** `src/app/api/idea-suggestions/route.ts`  
**Max tokens :** 1 200

**Prompt complet :**
```
Tu es un conseiller en attentions personnalisées. Aide quelqu'un à trouver une idée parfaite pour un proche.

[Profil du proche humanisé OU "Profil non encore renseigné"]

Occasion : [OCCASION_LABEL]
Budget : [BUDGET_LABEL]

Génère 3 suggestions d'attention hautement personnalisées, parfaitement adaptées à l'occasion et au budget indiqués.

[Si budget_free : CONTRAINTE ABSOLUE : toutes les suggestions doivent être entièrement gratuites. Aucun achat.]
[Si budget_under_30 : CONTRAINTE ABSOLUE : chaque suggestion doit coûter moins de 30€.]
[Si budget_under_80 : CONTRAINTE ABSOLUE : chaque suggestion doit coûter moins de 80€.]

Réponds uniquement avec un tableau JSON de 3 objets :
[
  {
    "title": "Titre court (max 7 mots)",
    "description": "Description chaleureuse et personnalisée (2-3 phrases)",
    "category": "quality_time" | "gift" | "message" | "gesture" | "activity",
    "estimated_price": "Gratuit" | "X€" | "X-Y€",
    "why": "Une phrase expliquant le lien avec son profil"
  }
]

Toutes les valeurs en français. Varie les catégories.
```

---

#### Endpoint 4 : Note intelligente (NER)

**Fichier :** `src/app/api/candice-note/route.ts`  
**Max tokens :** 300

**Prompt complet :**
```
Tu es Candice. L'utilisateur te dit : "[NOTE_TEXT]"

Proches disponibles : [LISTE avec nom et UUID]

Identifie si un proche est mentionné (par prénom, surnom, lien). Réponds UNIQUEMENT avec ce JSON (pas de texte avant/après) :
{"contact_id": "uuid ou null", "contact_name": "prénom ou null", "response": "Noté. Je pense à [prénom]." ou "Noté. Je m'en souviens."}
```

---

#### Endpoint 5 : Insight temps réel

**Fichier :** `src/app/api/questionnaire-insight/route.ts`  
**Max tokens :** 120

**Prompt complet :**
```
Tu es un expert en psychologie relationnelle. Tu analyses les réponses partielles d'un questionnaire de personnalité.

Réponses renseignées jusqu'ici :
[Réponses humanisées avec labels]

[Si persona "self" : "Génère une observation factuelle sur cette personne selon ses réponses."]
[Si persona "contact" : "Génère une observation factuelle sur {contactName} selon ses réponses."]

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

---

### Resend (emails transactionnels)

**Fichier :** `src/lib/resend.ts`  
**From :** `candice@candice.app`  
**App URL hardcodée :** `https://candice.app`

| Email | Endpoint | Déclencheur | Destinataire |
|-------|----------|-------------|-------------|
| Bienvenue | `POST /api/emails/welcome` | Inscription réussie | Nouvel utilisateur |
| Invitation questionnaire | `POST /api/emails/questionnaire-invite` | Pilote choisit le mode "lien" + contact a un email | Proche invité |
| Rappel | `POST /api/emails/reminder` | Déclenchement manuel depuis `ContactActions` | Proche invité |
| Fiche complète | `POST /api/emails/profile-complete` | Proche complète via `/api/shared-profile/complete` | Pilote (sender) |

**Tous les emails** sont du HTML inline (table-based, compatible email clients). Design : fond crème `#FAF7F2`, card blanche, terra `#C47A4A`, Georgia/Helvetica pour compatibilité.

---

### Stripe

**Non intégré.** Aucune dépendance Stripe dans `package.json`. La page `/offre` existe mais sans système de paiement fonctionnel.

---

### OpenAI

**Non intégré.** Aucune dépendance OpenAI dans `package.json`.

---

## 9. Tâches de fond / Cron jobs / Edge Functions

**Aucune tâche automatisée détectée** dans le code source.

- Pas de Vercel Cron Jobs configurés
- Pas de Supabase Edge Functions
- Pas de workers background
- Pas de webhooks entrants (Stripe, etc.)

Les seules opérations "asynchrones" sont des appels `fetch()` non-bloquants lancés pendant les handlers d'inscription/submit (emails, attribution de points) avec `.catch(() => {})`.

---

## 10. Flux complet "Création d'un proche"

### Mode "Lien" (recommandé)

**Fichier :** `src/components/questionnaire/QuestionnaireForm.tsx`

**Étape 1 — Informations de base** (Step 0)
- Champs : Prénom (obligatoire), Relation (radio : `partner/friend/family/colleague/other`), Email (optionnel), Téléphone (optionnel)
- Validation : prénom non vide

**Étape 2 — Choix du mode** (Step 1, fond dark)
- Bouton "Il/elle remplit son profil" (recommandé, badge "Recommandé ✦")
- Bouton "Je remplis moi-même (incognito)"

**Au clic "Il/elle remplit son profil" :**
1. `supabase.from("contacts").insert({ user_id, name, relationship, email, phone })` → création immédiate du contact
2. Si email renseigné → `POST /api/emails/questionnaire-invite { contactEmail, contactFirstName, senderFirstName, profileUrl }` (non bloquant)
3. Lien généré : `{origin}/profil/{contact_id}`
4. Message WhatsApp pré-rempli : `"Hey ! J'essaie un truc pour faire plaisir aux gens que j'aime. 5 minutes ? {profileUrl}"`

**Étape 3 — Partage du lien** (Step 2)
- URL affichée dans un bloc monospace
- Bouton "Copier le lien" (clipboard API)
- Bouton "Envoyer par WhatsApp"
- Lien "Voir la fiche de {name}" → `/contacts/{id}`

**Côté proche** (via `/profil/{contact_id}`) :
1. Affichage d'une page d'introduction ("Aide-nous à mieux prendre soin de toi.")
2. `PublicForm` → 12 questions psychologiques (même structure que mode incognito)
3. Submit → `POST /api/profil/submit { contactId, userId, ...responses }` → upsert `questionnaire_responses` via admin client (bypass RLS)

**Enrichissement Candice :**
- Aucun enrichissement automatique déclenché à la soumission du profil dans ce flux
- Les suggestions ne sont générées que manuellement depuis la page contact

---

### Mode "Incognito" (je remplis moi-même)

**Étapes 1–2 identiques au mode lien.**

**Étape 3 — Profil psychologique** (Step 2, mode incognito) : 12 MultiSelect (max 3 réponses chacune, ordonnées par importance)

| Question | Champ | Options |
|----------|-------|---------|
| Comment se sent-il/elle le plus aimé(e) ? | `love_language` | words, acts, gifts, time, touch |
| Style de communication | `communication_style` | direct, emotional, analytical, casual |
| En cas de stress, tendance à… | `stress_response` | withdraws, seeks_support, action_oriented, internalizes |
| Énergie sociale | `social_energy` | very_introverted, introverted, ambivert, extroverted, very_extroverted |
| Ce qui le/la touche vraiment | `appreciation_style` | verbal, practical, gifts, time, physical |
| Gestion des désaccords | `conflict_resolution` | direct, processes_first, avoids, humor |
| Prise de décisions | `decision_making` | logic, intuition, consensus, research |
| Expression des émotions | `emotional_expression` | openly, selectively, through_actions, rarely |
| Ce qui compte le plus dans les relations | `core_values` | loyalty, growth, fun, stability |
| Quand il/elle réussit quelque chose | `recognition_preference` | public, private, personal, celebrate |
| Limites les plus importantes | `boundaries` | space, emotional, time, privacy |
| Croissance personnelle | `growth_mindset` | experiences, structured, reflective, community |

**Étape 4 — Préférences** (Step 3, mode incognito) :

| Question | Champ | Type |
|----------|-------|------|
| Loisirs et intérêts | `hobbies` | Textarea |
| Plats et cuisines préférés | `favorite_foods` | Textarea |
| Préférence cadeaux | `gift_preference` | MultiSelect : experiences, physical, both |
| Standards / attentes | `standing` | MultiSelect : any_sincere, well_chosen, quality, high_standards, no_preference |
| Relation à la nourriture | `gastronomy` | MultiSelect : anywhere, gourmet, fine_dining, passion, functional |
| Hébergement (week-end) | `accommodation` | MultiSelect : destination_only, comfortable, charming, luxury, together |
| Style de cadeau matériel | `gift_style` | MultiSelect : useful, listened, beautiful, valuable, experiences |
| Sujets de conversation | `conversation_topics` | Textarea |
| Choses à éviter | `things_to_avoid` | Textarea |
| Meilleur contact | `best_contact_method` | MultiSelect : text, call, email, in_person |
| Dates importantes | `important_dates` | Textarea libre |
| Notes libres | `additional_notes` | Textarea |

**Submit :** INSERT `contacts` + INSERT `questionnaire_responses` → redirect `/contacts/{id}`

---

## 11. Flux complet "Ma fiche"

**Fichier :** `src/components/questionnaire/SelfProfileForm.tsx`

### Section 1 — "Qui es-tu ?" (12 questions psychologiques)

Toutes en MultiSelect (max 3, ordonnées). Libellés en première personne.

| Libellé | Clé DB | Options |
|---------|--------|---------|
| Je me sens le plus aimé(e) quand… | `love_language` | words, acts, gifts, time, touch |
| Pour communiquer, je préfère… | `communication_style` | direct, emotional, analytical, casual |
| Quand je suis stressé(e), j'ai tendance à… | `stress_response` | withdraws, seeks_support, action_oriented, internalizes |
| Mon énergie sociale… | `social_energy` | very_introverted, introverted, ambivert, extroverted, very_extroverted |
| Ce qui me touche vraiment, c'est quand… | `appreciation_style` | verbal, practical, gifts, time, physical |
| Face à un désaccord, je… | `conflict_resolution` | direct, processes_first, avoids, humor |
| Pour mes grandes décisions, je… | `decision_making` | logic, intuition, consensus, research |
| J'exprime mes émotions… | `emotional_expression` | openly, selectively, through_actions, rarely |
| Dans une relation, ce qui compte le plus pour moi… | `core_values` | loyalty, growth, fun, stability |
| Quand je réussis quelque chose, je préfère… | `recognition_preference` | public, private, personal, celebrate |
| Ce dont j'ai le plus besoin… | `boundaries` | space, emotional, time, privacy |
| Pour grandir, j'aime surtout… | `growth_mindset` | experiences, structured, reflective, community |

---

### Section 2 — "Tes préférences" (15 questions)

| Libellé | Clé DB | Type |
|---------|--------|------|
| Ce que j'adore faire | `hobbies` | Textarea (2 lignes) |
| Ce que j'évite ou déteste | `disliked_activities` | Textarea (2 lignes) |
| Ce que j'adore manger | `favorite_foods` | Textarea (2 lignes) |
| Ce que je déteste manger | `disliked_foods` | Textarea (2 lignes) |
| Pour les cadeaux, je préfère… | `gift_preference` | MultiSelect max 3 |
| Quand quelqu'un m'invite ou m'offre quelque chose… | `standing` | MultiSelect max 3 |
| Ma relation à la nourriture et aux restaurants | `gastronomy` | MultiSelect max 3 |
| Si on m'offre un week-end, ce qui compte le plus… | `accommodation` | MultiSelect max 3 |
| Pour les cadeaux matériels, ce qui me touche le plus | `gift_style` | MultiSelect max 3 |
| Je suis tactile… | `tactility` | Radio (1 choix) : everyone, partner_only, children_only, close_ones, not_at_all |
| Les sujets qui me stimulent vraiment | `conversation_topics` | Textarea (2 lignes) |
| Ce qu'il vaut mieux éviter avec moi | `things_to_avoid` | Textarea (2 lignes) |
| La meilleure façon de me contacter | `best_contact_method` | MultiSelect max 3 |
| Mes dates importantes | `important_dates` | 3 dates pré-remplies (Anniversaire, Anniversaire de mariage, Fête) + dates custom |

---

### Section 3 — "Pour aller plus loin" (5 questions guidées)

| Libellé | Clé DB | Type |
|---------|--------|------|
| Ma santé & confort | `health_comfort` | Textarea (2 lignes) |
| Ma famille & vie perso | `family_life` | Textarea (2 lignes) |
| Mon caractère & émotions | `character_emotions` | Textarea (2 lignes) |
| Ce que je ne supporte pas | `cannot_stand` | Textarea (2 lignes) |
| Ce que peu de gens savent sur moi | `few_know` | Textarea (3 lignes) |

---

### Section 4 — "Infos pratiques" (10 questions)

| Libellé | Clé DB | Type |
|---------|--------|------|
| Taille vêtements | `clothing_size` | Radio : XS, S, M, L, XL, XXL |
| Pointure chaussures | `shoe_size` | Input number |
| Taille bague | `ring_size` | Texte libre |
| Taille pantalon | `pants_size` | Texte libre |
| Allergies alimentaires | `food_allergies` | MultiSelect max 6 : aucune, gluten, lactose, noix, fruits_mer, autre |
| Régime alimentaire | `diet` | MultiSelect max 4 : omnivore, vegetarian, vegan, halal, kosher, no_preference |
| Animaux de compagnie | `pets` | Texte libre |
| Religion & convictions | `religion` | Textarea |
| Situation de handicap | `disability` | Textarea |
| Adresse postale | `postal_address` | Textarea |

---

### Barre de progression

Calculée sur **36 questions** (total affiché à l'utilisateur, `TOTAL_QUESTIONS = 36`).

Messages motivationnels par seuil :
- 0% → "C'est parti ! Plus ta fiche est complète, plus les attentions seront personnalisées."
- < 25% → "Bien ! Continue — chaque réponse affine ton profil."
- < 50% → "À mi-chemin ! Plus que quelques questions avant de découvrir ton profil."
- < 75% → "Tu y es presque — les meilleures suggestions arrivent avec une fiche complète."
- 100% → "Dernière ligne droite. Une fiche complète, c'est les meilleures attentions pour toi."

---

### Sauvegarde et persistance

- **Brouillon localStorage :** clé `candice_my_profile_draft_{userId}`, debounce 300ms, déclenché sur chaque onChange
- **Reprise du brouillon :** au montage, si `initial === null` (aucun profil Supabase existant)
- **Bouton sticky** "💾 Sauvegarder et revenir plus tard" (bas-droite) → upsert immédiat en base sans quitter la page
- **Submit final :** `supabase.from("my_profile").upsert({ user_id, ...allFields, updated_at })` → `awardPoints("profile_complete" ou "profile_update")` → redirect `/moi`

---

### Analyse générée

**Aucune analyse automatique générée à la fin du formulaire "Ma fiche".** Le profil est simplement sauvegardé. Il est ensuite utilisé comme input pour l'analyse de compatibilité (`/api/analyse`) déclenchée manuellement depuis la fiche d'un proche.

---

### Consultation du profil

- **Vue Pilote :** `/moi` — lecture de `my_profile` avec chips + ProfileRows
- **Vue publique :** `/partage/{user_id}` — lecture de `my_profile` via admin client (RLS public read)
- **Usage dans les prompts IA :** Lecture de `my_profile` dans `/api/analyse` et `/api/suggestions` pour personnaliser les analyses et les contraintes de qualité

---

## 12. Points de vigilance

### Bugs critiques

#### ⚠️ BUG 1 — Table `profile_share_requests` inexistante

**Fichiers concernés :**
- `src/app/dashboard/sharing/page.tsx` — requête `.from("profile_share_requests")`
- `src/app/api/sharing/respond/route.ts` — idem
- `src/app/api/sharing/revoke/route.ts` — idem
- `src/types/index.ts` — interface `ProfileShareRequest` définie

**Impact :** La page `/dashboard/sharing` crasherait immédiatement au chargement (Supabase erreur `42P01 relation does not exist`). Les endpoints `/api/sharing/respond` et `/api/sharing/revoke` retourneraient une erreur 500.

**Statut :** Code mort — aucune page lue ne semble appeler les endpoints `respond`/`revoke`. La page `sharing` est accessible via un lien dans `/moi`, donc potentiellement visible par les utilisateurs.

---

#### ⚠️ BUG 2 — Colonne `archived_at` absente du schéma SQL

**Fichiers concernés :**
- `supabase-schema.sql` — absent
- `src/app/dashboard/page.tsx` — `.is("archived_at", null)`
- `src/app/dashboard/archives/page.tsx` — `.not("archived_at", "is", null)`
- `src/app/api/contacts/archive/route.ts` — UPDATE `archived_at = NOW()`
- `src/app/api/contacts/unarchive/route.ts` — UPDATE `archived_at = null`
- `src/app/contacts/new/page.tsx` — `.is("archived_at", null)`
- `src/app/api/candice-note/route.ts` — `.is("archived_at", null)`
- `src/types/index.ts` — `archived_at: string | null` dans l'interface `Contact`

**Impact :** Si la colonne n'existe pas réellement en base (non-créée manuellement), toutes les requêtes filtrant sur `archived_at` retourneraient une erreur ou des résultats incorrects. Le fait que les pages fonctionnent suggère que la colonne existe en prod via une migration manuelle non documentée.

---

#### ⚠️ BUG 3 — Colonne `last_reminder_sent_at` absente du schéma SQL

**Fichiers concernés :**
- `src/types/index.ts` — `last_reminder_sent_at?: string | null` dans `Contact`
- `src/app/contacts/[id]/page.tsx` — `lastReminderSentAt={typedContact.last_reminder_sent_at ?? null}`
- `src/app/contacts/[id]/ContactActions.tsx` — utilise cette valeur pour afficher l'état du bouton "Rappel"

**Impact :** Si absente, `ContactActions` afficherait toujours un état "jamais envoyé" pour le bouton rappel.

---

### Incohérences architecturales

#### 🔍 INCOHÉRENCE 1 — `/profil/[id]` vs `/profil-partage/[token]` : deux flux similaires, architectures différentes

- `/profil/{contact_id}` : lien sans expiration, sans compte, submit → `questionnaire_responses` (lié à un contact Candice)
- `/profil-partage/{token}` : lien avec token unique, expirable, submit → `shared_profile_responses` (non lié à un contact)

Les deux flux servent le même objectif (faire remplir un formulaire à un proche) mais stockent dans des tables différentes et ne se synchronisent jamais.

---

#### 🔍 INCOHÉRENCE 2 — `questionnaire_responses` vs `my_profile` : duplication de schéma

~32 champs sont identiques entre les deux tables. Aucune table unifiée `profiles`. Si un proche s'inscrit après avoir rempli son questionnaire via token, ses réponses dans `shared_profile_responses` ne sont pas migrées vers `my_profile`.

---

#### 🔍 INCOHÉRENCE 3 — Sécurité `/api/profil/submit`

L'endpoint utilise l'admin client (bypass RLS) et ne vérifie pas l'identité de l'appelant. Il accepte `{ contactId, userId }` en body sans vérification auth. Toute personne connaissant un `contactId` et un `userId` pourrait théoriquement soumettre des données pour n'importe quel contact.

---

### Fonctionnalités partiellement implémentées

| Fonctionnalité | État | Fichier |
|----------------|------|---------|
| Mode conversationnel questionnaire | Bouton affiché, toast "bientôt disponible", aucun backend | `SharedProfileFlow.tsx` |
| Page Idées | Page vide avec message "Bientôt disponible." | `src/app/idees/page.tsx` |
| Page Historique | Page vide avec message "Bientôt disponible." | `src/app/historique/page.tsx` |
| Historique sur fiche contact | Card vide avec `opacity: 0.5` | `src/app/contacts/[id]/page.tsx` |
| Gestion des partages (Sharing) | Page présente, backend cassé (table manquante) | `dashboard/sharing/page.tsx` |
| Stripe / paiement | Page `/offre` présente, aucun système de paiement | `src/app/offre/page.tsx` |
| Mot de passe oublié | Aucun lien ni flow dans l'UI | — |
| Suppression de compte | Non implémentée dans l'UI (aucune page paramètres) | — |

---

### Dette technique notable

1. **Limite plan gratuit hardcodée :** `FREE_PLAN_LIMIT = 2` dans `src/app/contacts/new/page.tsx` — non configurable sans déploiement.

2. **BETA_PASSWORD en fallback hardcodé :** `"Candice2026!"` dans `src/app/api/beta-access/route.ts` — si `BETA_PASSWORD` n'est pas défini en env, le mot de passe est visible dans le code source.

3. **APP_URL hardcodé :** `"https://candice.app"` dans `src/lib/resend.ts` — les emails de dev/staging pointeront toujours vers la prod.

4. **Affichage partiel de l'analyse de compatibilité :** Claude génère 3 `shared_points` et 2 `difference_zones`, mais `MatchingCard.tsx` n'affiche que `[0]` de chaque. Les 2/3 des points communs et 1/2 des zones de friction sont ignorés silencieusement.

5. **Duplication de la logique `LABEL` / `describe` :** La table de correspondance valeur→label est recopiée dans chaque endpoint API (`suggestions/route.ts`, `analyse/route.ts`, `idea-suggestions/route.ts`, `questionnaire-insight/route.ts`) et dans chaque composant. Aucun fichier centralisé.

6. **Pas de gestion d'erreur email :** Tous les appels Resend dans les handlers de submit sont non-bloquants avec `.catch(() => {})` ou `try/catch` vide. Un échec d'envoi email n'est pas loggé de manière structurée.

7. **Sitemap limité :** `sitemap.ts` ne liste que 3 URLs (`/`, `/register`, `/login`). Les pages marketing (`/concept`, `/fonctionnement`, `/offre`, etc.) ne sont pas indexées.

8. **Pas de pages d'erreur custom :** Aucun `error.tsx` ni `not-found.tsx` global visible, sauf `notFound()` appelé dans les pages contact.

9. **Sessions 30 jours sans rotation :** `maxAge: 60 * 60 * 24 * 30` avec `setAll` dans le server client — pas de rafraîchissement du token observable dans le middleware.

10. **Upsert suggestions sur conflict `contact_id`** (`src/app/api/suggestions/route.ts`) : la contrainte unique sur `contact_id` seule (sans `user_id`) signifie qu'un seul jeu de suggestions existe par contact, même si plusieurs utilisateurs Candice partageaient un contact (ce qui n'est actuellement pas possible via le modèle de données, mais architecturalement fragile).

---

*Fin de l'audit — généré par lecture directe du code source le 2026-05-18.*
