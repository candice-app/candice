# 16 — Sécurité (constats factuels)

> Ce chapitre liste UNIQUEMENT des constats vérifiés, chacun avec sa gravité et « ce que ça expose ».
> **Aucune recommandation** n'est formulée ici (consigne explicite). Tri par gravité décroissante.
> Aucun secret n'est écrit en clair : on ne cite que des noms de variables d'environnement.

Échelle de gravité : **critique** / **haute** / **moyenne** / **basse**.

---

## Constat 1 — Mot de passe « bêta » écrit en dur dans le code — gravité HAUTE
- **Source** : `src/app/api/beta-access/route.ts`, lignes 3 et 13.
- **Verbatim** :
  - ligne 3 : `const BETA_PASSWORD = process.env.BETA_PASSWORD ?? "Candice2026!";`
  - ligne 13 : `if (password !== BETA_PASSWORD) {`
- **Ce que ça expose** : si la variable d'environnement `BETA_PASSWORD` n'est pas définie, la porte d'entrée bêta accepte le mot de passe `Candice2026!` inscrit en clair dans le code source. Toute personne ayant accès au code (ou devinant cette valeur) peut franchir le filtre d'accès bêta.

## Constat 2 — 50 fichiers utilisent le client « admin » qui contourne toutes les règles d'accès (RLS) — gravité HAUTE
- **Source** : définition dans `src/utils/supabase/admin.ts` :
  `// Server-side only — uses service role key to bypass RLS for public profile submissions.`
  Le client est construit avec `process.env.SUPABASE_SERVICE_ROLE_KEY`.
- **Décompte** : `grep -rn "createAdminClient" src` → **50 fichiers consommateurs** (hors le fichier de définition).
- **Ce que ça expose** : ce client agit avec les pleins pouvoirs sur la base et **ignore totalement les garde-fous RLS** (les règles qui, normalement, empêchent un utilisateur de voir les données d'un autre). La séparation des données entre utilisateurs ne repose alors plus sur la base, mais sur des filtres écrits à la main dans chaque route (par ex. `.eq('user_id', user.id)`). Si un seul de ces filtres est oublié ou mal écrit, les données d'autres utilisateurs deviennent accessibles.
- **Routes/pages touchant des données sensibles parmi les 50** (liste non exhaustive) :
  - Données du compte / RGPD : `src/app/api/account/delete/route.ts`, `src/app/api/account/export/route.ts`, `src/app/api/account/export-download/route.ts`, `src/app/api/account/cancel-deletion/route.ts`
  - Fiches des proches et analyses : `src/app/contacts/[id]/page.tsx`, `src/app/profil/[id]/page.tsx`, `src/app/fiche/[consentId]/page.tsx`, `src/app/recherche/page.tsx`, `src/app/dashboard/page.tsx`
  - Confidences et souvenirs (contenu intime) : `src/app/api/confidences/route.ts`, `src/app/api/memories/situation/route.ts`
  - Wishlist privée et carnet : `src/app/moi/wishlist/page.tsx`, `src/app/api/wishlist/photo/route.ts`, `src/app/api/carnet/identify/route.ts`
  - Partage et consentements : `src/app/api/contacts/[id]/consent/route.ts`, `src/app/api/profile-view/request/route.ts`, `src/app/api/profile-view/lookup/route.ts`, `src/app/moi/partage/page.tsx`, `src/app/moi/partage/demandes/[consentId]/page.tsx`
  - Abonnement : `src/app/api/subscription/pause/route.ts`, `src/app/api/subscription/resume/route.ts`
  - Invitations / liens : `src/app/api/invite/create/route.ts`, `src/app/api/invite/link/route.ts`, `src/app/api/invite/nudge/route.ts`, `src/app/invite/[token]/page.tsx`, `src/app/profil-partage/[token]/page.tsx`, `src/app/rejoindre/[token]/page.tsx`
  - Emails / cron : `src/app/api/cron/*` (5 routes), `src/app/api/emails/*`, `src/lib/notifications/email-reminder.ts`
  - Autres : `src/app/api/handle/route.ts`, `src/app/api/handle/check/route.ts`, `src/app/api/contacts/upload-photo/route.ts`, `src/app/api/contacts/lookup/route.ts`, `src/app/api/profile/avatar/route.ts`, `src/app/api/push/subscribe/route.ts`, `src/app/api/push/unsubscribe/route.ts`, `src/app/api/proactive-suggestions/[id]/validate/route.ts`, `src/app/api/recommendations/generate/route.ts`, `src/app/api/questionnaire/proche-register/route.ts`, `src/app/api/shared-profile/complete/route.ts`, `src/app/historique/page.tsx`, `src/app/moi/questionnaire/page.tsx`, `src/lib/share-links.ts`, `src/lib/profile/avatar-url.ts`

## Constat 3 — Aucune limitation de débit applicative (rate-limiting) — gravité HAUTE
- **Source** : recherche `grep -rni "rate.?limit|ratelimit|throttle|upstash|429" src` → **aucun mécanisme applicatif trouvé**. Aucun fichier `middleware.ts` n'existe à la racine ni dans `src/` (recherche `find … -name "middleware.ts"` → vide).
- Seule occurrence : `src/app/register/page.tsx:39` qui **lit** un message d'erreur de rate limit renvoyé par Supabase (`if (m.includes("rate limit") …)`), ce qui indique que seule la brique d'authentification Supabase applique sa propre limite ; le reste des 87 routes API n'a aucune protection.
- **Décompte** : `find src/app/api -name "route.ts"` → **87 routes API** sans limitation de débit propre.
- **Ce que ça expose** : les points d'entrée (envoi d'emails, génération de recommandations qui appelle un modèle IA payant, identification photo IA, recherche, lookup de contacts…) peuvent être appelés en boucle sans plafond côté application (abus, coûts, déni de service).

## Constat 4 — La table `finance_plans` est lisible par n'importe qui (public) — gravité MOYENNE
- **Source** (base) : `pg_policies` → table `finance_plans`, policy `read_finance_plans`, `cmd = SELECT`, `qual = 'true'`, `roles = {public}`. Grant `anon` = `SELECT` présent sur la table.
- **Colonnes** (base) : `id, catalog_ref, n_installments, configured_by, created_at`. **1 ligne** actuellement.
- **Ce que ça expose** : toute personne non connectée (`anon`) peut lire l'intégralité de `finance_plans`, y compris `configured_by` (identifiant UUID de qui a configuré le plan). La règle « `true` » signifie « aucune condition, tout le monde voit tout » sur cette table.

## Constat 5 — La banque de questions `discovery_questions` est en lecture publique — gravité BASSE
- **Source** (base) : `pg_policies` → `discovery_questions`, policy `read_discovery_questions`, `cmd = SELECT`, `qual = 'true'`, `roles = {public}`.
- **Ce que ça expose** : le contenu du questionnaire (libellés des questions) est lisible par tout visiteur non connecté. Il s'agit du référentiel de questions, sans donnée personnelle. Constat factuel de policy permissive (`qual='true'`).

## Constat 6 — Données de santé / vie privée (Art. 9 RGPD) accessibles via le client admin — gravité MOYENNE
- **Source** (base) : la table `my_profile` contient les colonnes `diet`, `food_allergies`, `clothing_size`, `shoe_size` **et** `practical_info` (vérifié via `information_schema.columns`). Les champs santé/régime/allergies vivent aussi dans les réponses de questionnaire (`questionnaire_responses`) et sur les fiches contacts.
- **Source** (code) : ces champs sont manipulés dans `src/lib/profile/generateProfileAnalysis.ts`, `src/lib/profile/synthesis.ts`, `src/components/profile/v2/Facts.tsx`, `src/app/api/profile/practical/route.ts`, `src/app/fiche/[consentId]/page.tsx`, etc.
- **Ce que ça expose** : ces données à caractère sensible (régime alimentaire, allergies, mobilité/santé) sont, comme le reste, protégées par RLS **en théorie** — mais tous les accès passant par le client admin (voir Constat 2) contournent cette protection ; la confidentialité repose alors sur les filtres manuels de chaque route.

## Constat 7 — Journal technique `processing_log` stocke des identifiants personnels (UUID) — gravité BASSE
- **Source** (base) : colonnes de `processing_log` = `id, correlation_id (uuid), pilot_id (uuid), memory_id (uuid), step, status, duration_ms, error_message (text), metadata (jsonb), created_at`. **0 ligne** actuellement.
- **Source** (base) : colonnes de `cron_runs` = `id, job_name, started_at, finished_at, status, signals_detected, suggestions_generated, error_message (text), metadata (jsonb)`. **0 ligne** actuellement. Pas de colonne d'identifiant utilisateur dédiée, mais `metadata (jsonb)` et `error_message` sont des champs libres.
- **Ce que ça expose** : `processing_log` associe un `pilot_id` (UUID de l'utilisateur) à des étapes de traitement ; `error_message` et `metadata` sont des champs texte/JSON libres pouvant contenir des détails. Les deux tables sont vides aujourd'hui (environnement de vérification), donc aucune fuite constatée à ce jour.

## Constat 8 — Dépendances avec vulnérabilités connues — gravité MOYENNE
- **Source** : `npm audit` (lecture seule) → **6 vulnérabilités : 4 modérées, 2 hautes**. (Rappel : `npm audit fix` n'a PAS été lancé.)
- **Détail** :
  - `vite` (8.0.0–8.0.15) — **haute** : divulgation de hash NTLMv2 via `launch-editor` (Windows) ; contournement de `server.fs.deny`.
  - `ws` (8.0.0–8.20.1) — **haute** : divulgation de mémoire non initialisée ; épuisement mémoire (DoS).
  - `@vitest/mocker` (2.1.0–4.1.10) — **modérée** : traversée de chemin / lecture de fichier arbitraire.
  - `baseline-browser-mapping` (< 2.11.0) — **modérée** : arrêt du process sur entrée invalide (DoS).
- **Ce que ça expose** : les paquets concernés (`vite`, `vitest`, `ws`, `baseline-browser-mapping`) sont des dépendances d'outillage/développement et de build. Les failles portent principalement sur l'environnement de développement et le serveur de dev.

---

## Points vérifiés SANS constat négatif (rappel factuel)

- **Toutes les tables du schéma `public` ont RLS activé** : `pg_class` → aucune table avec `relrowsecurity = false`. Le seul point d'attention RLS restant est constitué des deux policies permissives `qual='true'` (Constats 4 et 5).
- **Le token/URL du dépôt Git ne contient pas de secret en clair** : `git remote -v` → `https://github.com/candice-app/candice.git` (aucun jeton d'accès dans l'URL).
- **`.env.local` est bien ignoré par Git** : `git check-ignore .env.local` → renvoie `.env.local` (donc ignoré, non versionné).
- **La clé de service (`SUPABASE_SERVICE_ROLE_KEY`) et la clé IA (`ANTHROPIC_API_KEY`) ne sont pas en dur** : elles proviennent des variables d'environnement (`src/utils/supabase/admin.ts` et usages `process.env.*`). Variables d'env référencées dans le code : `ANTHROPIC_API_KEY`, `BETA_PASSWORD`, `CRON_SECRET`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY` (le seul avec une valeur de repli en clair est `BETA_PASSWORD` — voir Constat 1).
