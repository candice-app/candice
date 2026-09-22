# Cartographie Candice — 02. Stack, comptes & outils externes

> Document factuel. Inventaire des services externes utilisés, des « variables
> d'environnement » (réglages secrets stockés hors du code, désignés ici par leur NOM
> uniquement, jamais leur valeur), et des « dépendances » (briques logicielles installées).
>
> **Statuts.** ✅ réellement câblé et utilisé · 🟡 partiel / présent mais inactif ·
> ⚫ code mort · ❌ absent.
>
> Sources citées entre parenthèses : (fichier : chemin) ou (base : table). « Non vérifié »
> quand l'information n'a pas pu être établie depuis le code.

---

## 1. Services externes

### 1.1 Vercel — hébergement & tâches planifiées · ✅

**À quoi ça sert (en clair) :** la plateforme qui héberge le site en ligne et qui exécute
automatiquement des « tâches planifiées » (« crons ») à heures fixes.

**Ce qui en dépend dans l'app :** 4 tâches planifiées déclarées (fichier : `vercel.json`) :

- `/api/cron/detect-and-generate` — tous les jours à 6h et 14h (détection de signaux +
  génération de suggestions).
- `/api/cron/email-reminders` — tous les jours à 10h (e-mails de rappel).
- `/api/cron/cadence-feedback` — tous les lundis à 4h (ajustement du rythme des relances).
- `/api/cron/lifecycle-check` — tous les jours à 3h (cycle de vie de l'abonnement/essai).

Ces tâches sont protégées par le secret `CRON_SECRET` (voir §2). L'historique mentionne
explicitement Vercel (commits `f85441f` « after Vercel Pro upgrade », `83371ed` « wake Vercel
webhook »). En-têtes de sécurité HTTP configurés côté framework (fichier : `next.config.ts`).
Aucun fichier de configuration Vercel supplémentaire (pas de `.vercelignore` repéré).

### 1.2 Supabase — base de données, authentification & stockage de fichiers · ✅

**À quoi ça sert (en clair) :** le « coffre » central : la base de données (toutes les tables),
la gestion des comptes/connexions (authentification), et le stockage de fichiers (photos).

**Ce qui en dépend dans l'app :** pratiquement tout. Cinq fichiers utilitaires configurent
l'accès (dossier : `src/utils/supabase/`) :

- `client.ts` — accès côté navigateur (utilise `NEXT_PUBLIC_SUPABASE_URL` +
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- `server.ts` — accès côté serveur (mêmes deux variables).
- `middleware.ts` — vérification de session à chaque requête (mêmes deux variables).
- `claims.ts` — lecture locale des « claims » d'authentification, allégée pour la performance
  (mêmes deux variables ; voir commits perf D2/levier 2).
- `admin.ts` — accès privilégié « service role » (utilise `SUPABASE_SERVICE_ROLE_KEY` +
  `NEXT_PUBLIC_SUPABASE_URL`).

Bibliothèques employées (fichier : imports dans `src/utils/supabase/*`) : `@supabase/ssr`
(`createBrowserClient`, `createServerClient`) et `@supabase/supabase-js` (`createClient`).
Le stockage de fichiers sert notamment aux photos de contacts (bucket privé `contact-photos`,
liens signés — commit `1da1abe`) et aux avatars (migration 55). La base compte 78+ migrations
numérotées à la racine du dépôt (fichiers : `supabase-migration-*.sql`, plus
`supabase-schema.sql`).

### 1.3 Anthropic (Claude) — intelligence artificielle rédactionnelle · ✅

**À quoi ça sert (en clair) :** le moteur d'IA qui rédige les analyses, formule des suggestions
et interprète des saisies en langage naturel. C'est le fournisseur du modèle « Claude ».

**Ce qui en dépend dans l'app :** bibliothèque `@anthropic-ai/sdk` (fichier : `package.json`),
importée sous le nom `Anthropic` dans de nombreux fichiers. La clé `ANTHROPIC_API_KEY` est
référencée dans 18 fichiers (voir §2). Deux modèles sont appelés dans le code :

- `claude-sonnet-4-6` — modèle principal de rédaction. Utilisé dans (fichiers) :
  `src/app/api/questionnaire-insight/route.ts`, `src/app/api/attention/breath/route.ts`,
  `src/app/api/lifestyle/breath/route.ts`, `src/app/api/temperament/breath/route.ts`,
  `src/app/api/questionnaire/voice-conversation/route.ts`, `src/app/api/idea-suggestions/route.ts`,
  `src/app/api/candice-note/route.ts`, `src/app/api/analyse/route.ts`,
  `src/app/api/suggestions/route.ts`, `src/app/api/confidences/route.ts`,
  `src/app/api/memories/situation/route.ts`, `src/app/api/memories/w2-analyse/route.ts`,
  `src/lib/signals/generator.ts`, `src/lib/recommendations/engine.ts`,
  `src/lib/profile/generateProfileAnalysis.ts`, `src/lib/profile/synthesisAI.ts`.
- `claude-haiku-4-5-20251001` — modèle rapide/économique. Utilisé dans (fichiers) :
  `src/app/api/lifestyle/extract-filters/route.ts`, `src/app/api/carnet/identify/route.ts`,
  `src/app/api/memories/situation/route.ts`, `src/lib/discovery/engine.ts`,
  `src/lib/profile/generateProfileAnalysis.ts`, `src/lib/brain/signal.ts`,
  `src/lib/brain/memory.ts`.

Note : la reformulation IA des questions Discovery a été **coupée** (commit `0f4cb87` ; les
questions sont servies mot pour mot depuis la banque). Le fichier `src/lib/discovery/engine.ts`
garde une référence au modèle Haiku, mais le pré-calcul de personnalisation est marqué inactif
dans la mémoire projet (flag `PERSONALIZATION_ACTIVE=false`, non vérifié dans le code ici).

### 1.4 Resend — envoi d'e-mails transactionnels · ✅

**À quoi ça sert (en clair) :** le service qui envoie les e-mails automatiques (confirmation,
invitation d'un proche, relance, rappel de suggestion, rappel de fin d'essai).

**Ce qui en dépend dans l'app :** bibliothèque `resend` (fichier : `package.json`), configurée
dans un seul fichier utilitaire (fichier : `src/lib/resend.ts`) qui lit `RESEND_API_KEY` et
`RESEND_FROM_EMAIL`. Les routes d'e-mail qui s'en servent : `src/app/api/emails/trial-reminder/`,
`src/app/api/emails/reminder-suggestion/`, et les tâches planifiées d'e-mails. L'adresse
d'expédition a été fixée à `candice@candice.app` (commit `ab52b13`).

### 1.5 Web Push (VAPID) — notifications navigateur · ✅

**À quoi ça sert (en clair) :** les notifications « push » qui s'affichent dans le navigateur/sur
le téléphone même quand l'app n'est pas ouverte. VAPID = le protocole de clés qui autorise ces
envois (ce n'est pas un compte payant, mais une paire de clés).

**Ce qui en dépend dans l'app :** bibliothèque `web-push` (fichier : `package.json`). Envoi côté
serveur (fichier : `src/lib/notifications/push-sender.ts`, lit `VAPID_PUBLIC_KEY` +
`VAPID_PRIVATE_KEY`). Abonnement côté navigateur (fichier : `src/hooks/useWebPush.ts`, lit
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`). Introduit au Lot 4 phase 4 (commits `bc00405`, `1e433db`).

### 1.6 Stripe — paiement / abonnement · 🟡 (prévu, NON câblé)

**À quoi ça sert (en clair) :** ce serait le service d'encaissement de l'abonnement (9 €/mois).

**État réel :** **non branché**. Stripe n'apparaît PAS dans les dépendances (fichier :
`package.json` — aucune bibliothèque `stripe`). Il n'est cité que dans des commentaires « à
faire plus tard » :
- « Phase de test — réactiver quand Stripe est branché (Phase 7) » et « Trial expired → paused
  (Stripe Phase 7: check for payment method) » (fichier : `src/app/api/cron/lifecycle-check/route.ts`).
- « scaffolding — Phase 7 (Stripe) » (fichier : `src/app/parametres/abonnement/AbonnementActions.tsx`).
- La convention « montants en INTEGER centimes (convention Stripe) » a été adoptée en base
  (commit `c7df348`), mais aucun appel de paiement n'existe.

Aucune variable d'environnement Stripe n'est présente. La mémoire projet mentionne une « rotation
mot de passe Postgres obligatoire avant lancement public » liée au lot Stripe/admin — préparatoire,
non vérifié dans le code.

### 1.7 GitHub — hébergement du code · 🟡

**À quoi ça sert (en clair) :** l'endroit où le code est versionné (le dépôt Git). Aucune
intégration GitHub dans le code applicatif (fichier : recherche `octokit|github` dans `src` →
aucun résultat). Le dépôt est un projet Git local (dossier : `.git`) ; l'usage de GitHub comme
hébergeur distant est probable mais **non vérifié** depuis le code.

### 1.8 Namecheap (ou autre registrar) — nom de domaine · ❌ dans le code

**À quoi ça sert (en clair) :** le fournisseur du nom de domaine `candice.app`. Aucune trace de
Namecheap ni d'aucun registrar dans le code (fichier : recherche → aucun résultat). Le domaine
`candice.app` est utilisé dans l'adresse d'expédition des e-mails, mais la gestion du domaine est
externe au code. **Non vérifié** quel registrar est employé.

### 1.9 Récapitulatif des services

| Service | Rôle | Statut |
|---|---|---|
| Vercel | Hébergement + tâches planifiées | ✅ |
| Supabase | Base de données + auth + stockage | ✅ |
| Anthropic (Claude) | IA rédactionnelle (Sonnet + Haiku) | ✅ |
| Resend | E-mails transactionnels | ✅ |
| Web Push / VAPID | Notifications navigateur | ✅ |
| Stripe | Paiement abonnement | 🟡 prévu, non câblé |
| GitHub | Versionnage du code | 🟡 probable, hors code |
| Namecheap / registrar | Nom de domaine | ❌ absent du code |

---

## 2. Variables d'environnement (NOMS uniquement)

Deux origines croisées : les clés déclarées dans `.env.local` (réglages secrets locaux) et les
`process.env.XXX` réellement lus dans le code (`src`). Aucune valeur n'est reproduite.

### 2.1 Déclarées dans `.env.local`

(Source : `grep '^[A-Z_]+=' .env.local`.)

`ANTHROPIC_API_KEY` · `CRON_SECRET` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ·
`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_VAPID_PUBLIC_KEY` · `RESEND_API_KEY` ·
`RESEND_FROM_EMAIL` · `SUPABASE_DB_URL` · `SUPABASE_SERVICE_ROLE_KEY` · `VAPID_PRIVATE_KEY` ·
`VAPID_PUBLIC_KEY`.

Le fichier modèle `.env.example` liste en plus `BETA_PASSWORD` (mais pas `SUPABASE_DB_URL`,
`CRON_SECRET`, ni les clés VAPID). (Source : `.env.example`.)

### 2.2 Table nom → où c'est utilisé

(Source : `grep 'process.env.XXX' src`. Le nombre de références brutes suit le nom.)

| Variable | Rôle (en clair) | Nb réf. | Fichiers qui l'utilisent |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Clé d'accès à l'IA Claude | 19 | Les 12 routes API listées en §1.3 + `src/lib/discovery/engine.ts`, `src/lib/discovery/guard-paths.test.ts`, `src/lib/signals/generator.ts`, `src/lib/recommendations/engine.ts`, `src/lib/brain/signal.ts`, `src/lib/brain/memory.ts` |
| `CRON_SECRET` | Secret qui protège les tâches planifiées | 7 | `src/app/api/emails/trial-reminder/route.ts`, `src/app/api/emails/reminder-suggestion/route.ts`, `src/app/api/cron/email-reminders/route.ts`, `src/app/api/cron/lifecycle-check/route.ts`, `src/app/api/cron/cadence-feedback/route.ts`, `src/app/api/cron/detect-and-generate/route.ts` |
| `NEXT_PUBLIC_SUPABASE_URL` | Adresse du projet Supabase (publique) | 5 | `src/utils/supabase/client.ts`, `middleware.ts`, `admin.ts`, `claims.ts`, `server.ts` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publique Supabase (côté navigateur) | 4 | `src/utils/supabase/middleware.ts`, `client.ts`, `server.ts`, `claims.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé privilégiée Supabase (côté serveur uniquement) | 1 | `src/utils/supabase/admin.ts` |
| `SUPABASE_DB_URL` | Connexion directe à la base (usage local/scripts) | 0 dans `src` | Déclarée dans `.env.local` ; référencée en doc (fichier : `docs/stop-wishlist-phaseB.md`). Sert aux scripts locaux `psql`, pas au code applicatif. Voir mémoire projet (rotation mot de passe Postgres). |
| `RESEND_API_KEY` | Clé d'accès au service d'e-mails | 1 | `src/lib/resend.ts` |
| `RESEND_FROM_EMAIL` | Adresse d'expédition des e-mails | 1 | `src/lib/resend.ts` |
| `VAPID_PUBLIC_KEY` | Clé publique notifications (serveur) | 1 | `src/lib/notifications/push-sender.ts` |
| `VAPID_PRIVATE_KEY` | Clé privée notifications (serveur) | 1 | `src/lib/notifications/push-sender.ts` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé publique notifications (navigateur) | 1 | `src/hooks/useWebPush.ts` |
| `BETA_PASSWORD` | Mot de passe de la barrière bêta | 1 | `src/app/api/beta-access/route.ts` |
| `NODE_ENV` | Indicateur d'environnement (dev/prod) — fourni par le système, pas un secret | 3 | `src/app/register/page.tsx`, `src/app/api/beta-access/route.ts`, `src/app/design-preview/page.tsx` |

Note : `SUPABASE_DB_URL` est le seul nom présent dans `.env.local` mais jamais lu dans `src`
(usage hors application). Tous les autres noms de `.env.local` sont bien référencés dans le code.

---

## 3. Dépendances (briques logicielles installées)

(Source : `package.json`. Chaque ligne = rôle en une phrase.)

### 3.1 Dépendances de production (`dependencies`)

| Paquet | Version | Rôle (en clair) | Statut |
|---|---|---|---|
| `@anthropic-ai/sdk` | ^0.91.0 | Kit officiel pour parler à l'IA Claude (Anthropic) | ✅ |
| `@supabase/ssr` | ^0.10.2 | Connexion Supabase adaptée au rendu serveur (sessions/cookies) | ✅ |
| `@supabase/supabase-js` | ^2.104.1 | Kit officiel Supabase (base de données, auth, stockage) | ✅ |
| `@types/web-push` | ^3.6.4 | Descriptions de types pour `web-push` (aide au code) | ✅ |
| `next` | 16.3.5 | Le framework de l'application (React côté serveur + routes) | ✅ |
| `react` | 19.2.4 | Bibliothèque d'interface (composants) | ✅ |
| `react-dom` | 19.2.4 | Rendu de React dans le navigateur | ✅ |
| `react-qr-code` | ^2.0.21 | Génère les QR codes (invitation / continuer sur téléphone) | ✅ (fichiers : `src/app/invite/[token]/LandingInvite.tsx`, `src/app/continuer-sur-telephone/page.tsx`) |
| `resend` | ^6.12.3 | Kit d'envoi d'e-mails transactionnels | ✅ |
| `web-push` | ^3.6.7 | Envoi de notifications navigateur (côté serveur) | ✅ |

### 3.2 Dépendances de développement (`devDependencies`)

| Paquet | Version | Rôle (en clair) | Statut |
|---|---|---|---|
| `@tailwindcss/postcss` | ^4 | Branchement de Tailwind (styles) dans l'outil PostCSS | ✅ |
| `@types/node` | ^20 | Descriptions de types pour Node.js (aide au code) | ✅ |
| `@types/react` | ^19 | Descriptions de types pour React | ✅ |
| `@types/react-dom` | ^19 | Descriptions de types pour React DOM | ✅ |
| `opentype.js` | ^2.0.0 | Manipulation de polices — sert à générer les favicons (fichier : `scripts/generate-favicons.mjs`) | 🟡 script ponctuel |
| `tailwindcss` | ^4 | Système de styles utilitaires (mise en forme) | ✅ |
| `typescript` | ^5 | Le langage typé utilisé pour tout le code | ✅ |
| `vitest` | ^4.1.7 | Outil pour lancer les tests automatisés | ✅ (fichier : `src/lib/discovery/guard-paths.test.ts`) |

Scripts définis (fichier : `package.json`) : `dev` (développement), `build` (compilation),
`start` (démarrage), `test` (lance Vitest).

---

## 4. Points restés « non vérifiés »

- **GitHub** comme hébergeur distant du dépôt : probable, mais aucune preuve dans le code.
- **Registrar du domaine** `candice.app` (Namecheap ou autre) : aucune trace dans le code.
- **Flag `PERSONALIZATION_ACTIVE`** (mémoire projet) : cité comme désactivé ; non retrouvé
  comme variable d'environnement ni dans les fichiers lus ici.
- **`SUPABASE_DB_URL`** : présent dans `.env.local`, utilisé hors application (scripts `psql`
  locaux) ; son usage exact n'est pas visible dans `src`.
- **Écart de comptage des commits** (308 listés vs 309 rapportés par Git) : voir document
  `01-historique.md`.
