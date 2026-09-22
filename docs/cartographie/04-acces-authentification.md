# 04 — Accès & authentification

> Cartographie brute de TOUTES les modalités d'accès à Candice. Ce document décrit ce qui EST dans le code, sans jugement ni recommandation. Chaque affirmation porte sa source (`fichier : chemin`). Les textes visibles à l'écran et les emails sont cités VERBATIM.

---

## 0. Vue d'ensemble des « portes »

Avant d'atteindre une page personnelle, une requête traverse un filtre unique : `src/proxy.ts` (le middleware Next.js). Ce fichier applique, dans cet ordre :

1. **Porte desktop** — les pages personnelles sont bloquées sur ordinateur.
2. **Porte bêta** — un mot de passe global est exigé (cookie `beta_access`).
3. **Rafraîchissement de session Supabase** + vérification locale du jeton.
4. **Routes protégées** (`/dashboard`, `/contacts`) → renvoi vers `/login` si non connecté.
5. **Routes d'auth** (`/login`, `/register`) → renvoi vers `/dashboard` si déjà connecté.

Source : `src/proxy.ts` (lignes 29-68).

Technologie d'authentification : **Supabase Auth** (email + mot de passe). Trois clients Supabase existent :
- Client navigateur : `src/utils/supabase/client.ts`
- Client serveur (lit les cookies) : `src/utils/supabase/server.ts`
- Client « admin » (clé service, contourne la sécurité RLS pour les soumissions publiques) : `src/utils/supabase/admin.ts`
- Vérification locale du jeton JWT (sans appel réseau) : `src/utils/supabase/claims.ts`

---

## 1. Visiteur non connecté

### Écrans accessibles sans compte
Un visiteur qui n'est pas connecté peut voir les pages « marketing » et légales, à condition d'avoir déjà passé la porte bêta (voir §2). D'après la liste des routes (`src/app/`) : page d'accueil (`/`), `/concept`, `/fonctionnement`, `/offre`, `/aide`, `/contact`, `/conditions-generales`, `/confidentialite`, `/mentions-legales`, `/login`, `/register`, et les pages d'atterrissage par lien (`/invite/[token]`, `/rejoindre/[token]`, `/profil-partage/[token]`).

### Ce qui est bloqué
Les préfixes suivants sont « personnels » : toute tentative d'y accéder sans session renvoie vers `/login`. Le code ne protège explicitement que `/dashboard` et `/contacts` au niveau du proxy :

```
const protectedRoutes = ["/dashboard", "/contacts"];
if (!user && protectedRoutes.some((r) => pathname.startsWith(r))) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```
Source : `src/proxy.ts` (lignes 56-61).

Les autres pages personnelles (`/moi`, `/parametres`, `/idees`, etc.) se protègent elles-mêmes : chaque page serveur appelle `getUser()` et fait `redirect("/login")` si aucun utilisateur. Exemples : `src/app/moi/questionnaire/page.tsx` (ligne 16-17), `src/app/parametres/compte/page.tsx` (ligne 16-17), `src/app/contacts/new/page.tsx` (ligne 8-9).

### Page d'accueil (verbatim)
Source : `src/app/page.tsx`.
- Titre principal : « Votre copilote **relationnel.** »
- Sous-titre : « L'attention juste, au bon moment. »
- Bouton principal → `/register` : « Commencer avec Candice »
- Bouton secondaire → `/concept` : « Explorer »
- Bloc final, bouton → `/register` : « Commencer » ; bouton → `/login` : « Se connecter ».

---

## 2. Porte bêta (mot de passe global)

### Comportement
Tant que le cookie `beta_access` n'est pas présent, TOUTE page non exemptée renvoie vers `/beta-access?from=<page demandée>`.

```
if (!isBetaExempt && !request.cookies.get("beta_access")) {
  const url = new URL("/beta-access", request.url);
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}
```
Source : `src/proxy.ts` (lignes 42-50).

Routes exemptées de la porte bêta (accessibles sans cookie) :
- Exactes : `/beta-access`
- Préfixes : `/api/beta-access`, `/api/auth/callback`, `/beta-access`

Source : `src/proxy.ts` (lignes 26-27).

### Écran `/beta-access` (verbatim)
Source : `src/app/beta-access/page.tsx`.
- Logo : « candice »
- Titre : « Accès bêta privé »
- Texte : « Candice est en accès bêta fermé. Entre le mot de passe pour continuer. »
- Champ mot de passe, placeholder : « Mot de passe »
- Bouton : « Accéder → » (pendant le chargement : « Vérification… »)
- Pied : « Candice · Accès bêta privé »

### Étapes
1. L'utilisateur saisit le mot de passe et valide.
2. Le navigateur envoie `POST /api/beta-access` avec `{ password }`.
3. Si correct → cookie posé, redirection vers la page d'origine (`from`, défaut `/dashboard`).
4. Si incorrect → message d'erreur affiché.

Source : `src/app/beta-access/page.tsx` (lignes 14-34).

### Vérification serveur & cookie
Source : `src/app/api/beta-access/route.ts`.
- Mot de passe attendu : variable d'environnement `BETA_PASSWORD`, **valeur par défaut codée en dur : `Candice2026!`** (ligne 3 : `const BETA_PASSWORD = process.env.BETA_PASSWORD ?? "Candice2026!";`).
- Si mauvais mot de passe → réponse HTTP 401 `{ error: "Mot de passe incorrect." }`.
- Si correct → cookie `beta_access = "1"`, `httpOnly`, `sameSite: lax`, durée **30 jours** (`maxAge: 60 * 60 * 24 * 30`), `path: "/"`.
- Requête mal formée (JSON invalide) → 400 `{ error: "Requête invalide." }`.

### Messages d'erreur (verbatim, côté écran)
Source : `src/app/beta-access/page.tsx` (lignes 24-30).
- Mot de passe refusé : « Mot de passe incorrect. »
- Erreur réseau : « Une erreur est survenue. Réessaie. »

---

## 3. Porte desktop (« Continue sur ton téléphone »)

### Comportement
Sur un appareil qui n'est ni mobile ni tablette (détection via `userAgent`), l'accès aux préfixes personnels renvoie vers `/continuer-sur-telephone`.

```
const isDesktop = device.type !== "mobile" && device.type !== "tablet";
if (isDesktop && DESKTOP_GATED_PREFIXES.some(p => pathname.startsWith(p))) {
  return NextResponse.redirect(new URL("/continuer-sur-telephone", request.url));
}
```
Source : `src/proxy.ts` (lignes 34-39).

Préfixes bloqués sur desktop (`DESKTOP_GATED_PREFIXES`, lignes 13-23) :
`/moi`, `/contacts`, `/parametres`, `/dashboard`, `/historique`, `/idees`, `/parler-a-candice`, `/partage`, `/profil/` (le `/profil/[id]` uniquement — `/profil-partage/` reste public).

Note (non vérifiée quant à l'intention) : `/login` et `/register` NE sont PAS dans cette liste — ils restent donc ouverts sur desktop.

### Écran `/continuer-sur-telephone` (verbatim)
Source : `src/app/continuer-sur-telephone/page.tsx`.
- Titre : « Continue sur ton téléphone »
- Texte : « Candice s'ouvre sur mobile. Scanne ce code depuis ton téléphone pour accéder à ton espace. »
- Un QR code pointant vers l'URL du site (`window.location.origin`).
- Texte sous le QR : « Ou tape **[url]** dans ton navigateur mobile. »

---

## 4. Inscription (`/register`)

Source : `src/app/register/page.tsx`.

### Écran (verbatim)
- Titre : « Créer un compte. »
- Sous-titre : « Quelques secondes suffisent »
- Champs (composant `FloatField`) :
  - « Prénom » (obligatoire)
  - « Identifiant » (obligatoire, préfixe `@`) — indication : « Unique, comme sur Instagram — c'est lui que tes proches saisiront pour te trouver. » ; quand disponible : « Disponible. »
  - « E-mail » (obligatoire)
  - « Téléphone (optionnel) »
  - « Mot de passe » (obligatoire) — indication : « 8 caractères minimum. »
- Case à cocher CGU : « J'accepte les **conditions générales** et la **politique de confidentialité** » (liens vers `/conditions-generales` et `/confidentialite`).
- Bouton : « Créer un compte » (pendant l'envoi : « Création en cours… »)
- Lien bas de page → `/login` : « Déjà un compte ? **Se connecter** »

### Étapes techniques
1. Validations côté client (email, mot de passe ≥ 8, téléphone FR facultatif, identifiant unique vérifié en temps réel via `POST /api/handle/check`).
2. Appel `supabase.auth.signUp({ email, password, options: { data: { full_name, phone, handle }, emailRedirectTo } })`.
3. `emailRedirectTo` pointe TOUJOURS vers la prod en production : `https://candice.app/api/auth/callback?next=<destination>`.
   - Destination selon le contexte d'arrivée :
     - avec `invite_token` → `/moi/questionnaire?invite_token=...`
     - avec `share_token` → `/rejoindre/<token>`
     - sinon → `/dashboard`
   Source : `src/app/register/page.tsx` (lignes 162-180).
4. Enregistrement de l'identifiant (`POST /api/handle`) et du téléphone (table `my_profile`).
5. Envoi de l'email de bienvenue (`POST /api/emails/welcome`, non bloquant).
6. Redirection vers la destination.

### Écrans post-soumission (verbatim)
Source : `src/app/register/page.tsx` (lignes 241-297).
- **Succès (compte créé)** : Titre « Ton compte est créé. » ; texte « Va voir ta boîte mail pour confirmer ton adresse[ — puis tu découvriras ce que {prénom} a partagé avec toi]. » ; note « Rien reçu ? Regarde tes indésirables — l'email vient de candice.app. »
- **Échec d'envoi d'email** : Titre « L'email n'a pas pu partir. » ; texte « Réessaie dans un instant. » ; bouton « Renvoyer l'email » (pendant : « Envoi… »).

### Messages d'erreur (verbatim)
Source : `src/app/register/page.tsx`.
- Prénom manquant : « Ton prénom est nécessaire. »
- Email invalide : « Adresse email invalide. »
- Mot de passe trop court : « 8 caractères minimum. »
- Téléphone invalide : « Numéro français invalide (ex. 06 12 34 56 78). »
- CGU non cochées : « Tu dois accepter les conditions générales pour continuer. »
- Identifiant déjà pris : « Cet identifiant est déjà pris. » (ou message renvoyé par l'API)
- Compte déjà existant : « Un compte existe déjà avec cet e-mail. **Se connecter** »
- Erreurs Supabase traduites (fonction `frenchAuthError`, lignes 37-43) :
  - Rate limit : « Trop de tentatives. Réessaie dans un instant. »
  - Email invalide : « Adresse email invalide. »
  - Mot de passe : « Le mot de passe doit contenir au moins 8 caractères. »
  - Autre : « Une erreur est survenue. Réessaie dans un instant. »

### Email de bienvenue (verbatim)
Source : `src/app/api/emails/welcome/route.ts`.
- Expéditeur : `FROM_EMAIL` (défini dans `src/lib/resend`), envoi via **Resend**.
- **Objet : « Candice est prête. »**
- Corps :
  - Titre « Bonjour[, {prénom}]. »
  - « Candice est prête. »
  - « Candice est prête à t'aider à prendre soin de ceux que tu aimes. »
  - « Commence par compléter ta fiche — c'est la base de tout. Plus ton profil est précis, plus les attentions que Candice suggère seront justes. »
  - CTA « Compléter ma fiche → » vers `/moi/questionnaire`
  - « ✦  Plus ta fiche est complète, plus les suggestions seront justes. »
  - Pied : « Tu reçois cet e-mail car tu viens de créer un compte Candice. »

### Email de confirmation d'adresse
Le lien de confirmation d'email est géré par Supabase (envoi natif Supabase, gabarit configuré côté Supabase — non présent dans le repo). Il pointe vers `/api/auth/callback?code=...&next=...`.
Source : `src/app/api/auth/callback/route.ts` :
- `GET` récupère `code`, appelle `supabase.auth.exchangeCodeForSession(code)`.
- Succès → redirection vers `next` (défaut `/dashboard`).
- Échec → redirection vers `/login?error=auth_callback_failed`.

---

## 5. Connexion (`/login`)

Source : `src/app/login/page.tsx`.

### Écran (verbatim)
- Titre : « Bon retour. »
- Sous-titre : « Connectez-vous à votre compte »
- Champs : « E-mail », « Mot de passe »
- Bouton : « Se connecter » (pendant : « Connexion en cours… »)
- Lien bas de page → `/register` : « Pas encore de compte ? **S'inscrire** »

### Étapes
1. `supabase.auth.signInWithPassword({ email, password })`.
2. Succès → redirection vers `next` (paramètre d'URL, chemins internes uniquement, défaut `/dashboard`).
3. Échec → message d'erreur.

Protection contre les redirections ouvertes : `next` n'est accepté que s'il commence par `/` sans être `//`. Source : `src/app/login/page.tsx` (lignes 30-32).

### Message d'erreur (verbatim)
- « E-mail ou mot de passe incorrect. »
Source : `src/app/login/page.tsx` (ligne 45).

### ⚠ Absence de lien « mot de passe oublié »
La page `/login` NE contient AUCUN lien « mot de passe oublié ». Il n'y a que « S'inscrire ». Voir §6.

---

## 6. Mot de passe oublié / réinitialisation

**❌ ABSENT.** Recherche exhaustive dans `src/` des motifs `reset-password`, `resetPassword`, `forgot`, `resetPasswordForEmail`, `reset-password` : **aucun résultat**.

Il n'existe :
- aucune page `/reset-password` ni `/forgot-password` ;
- aucun appel à `supabase.auth.resetPasswordForEmail`.

Le SEUL moyen de changer de mot de passe est d'être **déjà connecté** et de passer par les paramètres (voir §11 « changer le mot de passe »). Un utilisateur qui a oublié son mot de passe n'a, dans le code applicatif, aucun parcours de récupération. (Non vérifié : une éventuelle récupération manuelle via l'interface Supabase, hors code.)

---

## 7. Lien magique / OTP

**❌ ABSENT.** Recherche exhaustive des motifs `signInWithOtp`, `verifyOtp`, `magic link`, `magiclink`, `otp` dans `src/` : **aucun résultat**.

L'unique lien « à usage unique » présent est celui de **confirmation d'adresse email** à l'inscription (géré par Supabase, §4). Ce n'est pas un mécanisme de connexion sans mot de passe.

---

## 8. Déconnexion

Trois emplacements déclenchent `supabase.auth.signOut()` :

| Emplacement | Libellé | Après déconnexion |
|---|---|---|
| `src/app/moi/LogoutButton.tsx` (lignes 10-14, 36) | « Se déconnecter » | redirection vers `/` |
| `src/app/parametres/compte/CompteActions.tsx` (lignes 100-104, 271) | « Se déconnecter » | redirection vers `/` |
| `src/components/layout/Navbar.tsx` (lignes 16-20, 47) | « Déconnexion » | redirection vers `/` |

Le bouton `LogoutButton` est aussi affiché sur `/parametres` (`src/app/parametres/page.tsx` ligne 88) et sur `/moi` (`src/app/moi/page.tsx` ligne 125, via `FooterLinks`).

Il n'y a pas de route API de déconnexion : tout se fait côté client via le SDK Supabase.

---

## 9. Session expirée / rafraîchissement

Source : `src/proxy.ts` + `src/utils/supabase/claims.ts`.

- À chaque requête, le proxy crée un client Supabase « middleware » (`src/utils/supabase/middleware.ts`) qui rafraîchit les cookies de session, puis vérifie le jeton EN LOCAL (`getAuthClaims`, sans appel réseau tant que le jeton est valide). Source : `src/proxy.ts` lignes 52-54.
- Si aucune session valide et que la page est protégée (`/dashboard`, `/contacts`) → redirection vers `/login`.
- Les pages personnelles auto-protégées (voir §1) font `redirect("/login")` en interne.
- Cas particulier : la page fiche partagée renvoie vers `/login?next=/fiche/<consentId>` pour revenir après reconnexion. Source : `src/app/fiche/[consentId]/page.tsx` (ligne 30).
- Si déjà connecté et l'utilisateur visite `/login` ou `/register` → redirection automatique vers `/dashboard`. Source : `src/proxy.ts` lignes 63-65.

Message interne « Session expirée. » : affiché dans `src/app/parametres/compte/CompteActions.tsx` (ligne 66) si `getUser()` échoue au moment d'enregistrer les informations personnelles.

---

## 10. Suppression de compte

Deux composants d'interface + une route API.

### Interface (verbatim)
Source : `src/app/parametres/abonnement/AbonnementActions.tsx`.
- Lien déclencheur : « Supprimer mon compte »
- Bloc de confirmation :
  - Titre « Confirmer la suppression »
  - Texte « Ton compte sera supprimé définitivement dans 30 jours. Entre ton mot de passe pour confirmer. »
  - Champ mot de passe (placeholder « Mot de passe »)
  - Boutons « Annuler » / « Confirmer la suppression » (pendant : « Confirmation… »)

La suppression est aussi mentionnée dans les paramètres de confidentialité (`src/app/parametres/confidentialite/ConfidentialiteActions.tsx`).

### Route API
Source : `src/app/api/account/delete/route.ts`.
1. Exige une session (`getUser`) — sinon 401.
2. Exige `password` dans le corps — sinon 400 `{ error: "Mot de passe requis" }`.
3. Vérifie le mot de passe en tentant `signInWithPassword` — échec → 403 `{ error: "Mot de passe incorrect" }`.
4. Programme la suppression à **J+30** : met `my_profile.subscription_status = 'cancelled'`, `cancelled_at`, `deletion_scheduled_at`.
5. Journalise l'événement dans `account_lifecycle_events` (`event_type: 'deletion_requested'`).
6. Envoie un email de confirmation.

La suppression EFFECTIVE (hard delete) est réalisée plus tard par le cron `lifecycle-check` (voir §13) quand `deletion_scheduled_at` est atteint (`hardDeleteUser`). Source : `src/app/api/cron/lifecycle-check/route.ts` (lignes 145-150) + `src/lib/lifecycle/hard-delete`.

### Annulation de la suppression
Source : `src/app/api/account/cancel-deletion/route.ts`.
- Exige que le statut soit `cancelled` avec `deletion_scheduled_at` — sinon 400 `{ error: "Aucune suppression programmée" }`.
- Remet `subscription_status = 'active'`, efface `cancelled_at` et `deletion_scheduled_at`.
- Journalise `event_type: 'deletion_cancelled'`.
- Bouton interface : « Annuler la suppression » (pendant : « Annulation… »). Source : `AbonnementActions.tsx` lignes 82-89.

### Email de suppression programmée (verbatim)
Source : `src/app/api/account/delete/route.ts` (lignes 43-62).
- **Objet : « Suppression de compte programmée — Candice »**
- Corps :
  - « Ta demande de suppression a été enregistrée. Ton compte et toutes tes données seront supprimés le **[date]**. »
  - « Tu peux annuler cette demande jusqu'à cette date depuis tes paramètres. »
  - CTA « Annuler la suppression → » vers `/parametres/abonnement`

---

## 11. Changer le mot de passe (utilisateur connecté)

Source : `src/app/parametres/compte/CompteActions.tsx` (lignes 26-48, 196-258).
- Bouton « Changer le mot de passe » ouvre un formulaire :
  - « Nouveau mot de passe » (placeholder « 8 caractères minimum »)
  - « Confirmer le mot de passe »
  - Boutons « Annuler » / « Mettre à jour » (pendant : « Mise à jour… »)
- Validation : ≥ 8 caractères, les deux champs identiques.
- Appel `supabase.auth.updateUser({ password })`.
- Messages :
  - Erreur longueur : « Au moins 8 caractères. »
  - Non concordance : « Les mots de passe ne correspondent pas. »
  - Succès : « Mot de passe mis à jour. »

---

## 12. Export de données (RGPD)

Deux voies : **téléchargement direct** et **envoi par email**.

### Téléchargement direct
Source : `src/app/api/account/export-download/route.ts` (méthode `GET`).
- Exige une session — sinon 401.
- Rassemble via le client admin : `my_profile`, `contacts` (+ `questionnaire_responses`), `suggestions`, `proactive_suggestions`, `confidences`, `profile_notes`, `notification_log`, `account_lifecycle_events`.
- Renvoie un fichier JSON `candice-export-AAAA-MM-JJ.json` (`Content-Disposition: attachment`).
- Déclenché depuis `src/app/parametres/confidentialite/ConfidentialiteActions.tsx` (fonction `handleExport`, lignes 17-38) — crée un blob et force le téléchargement.

### Envoi par email
Source : `src/app/api/account/export/route.ts` (méthode `POST`).
- Mêmes tables collectées, encodées en base64 et jointes à un email.
- **Objet : « Ton export de données Candice (RGPD) »**
- Corps (verbatim) :
  - « Conformément au RGPD, voici l'ensemble des données que Candice détient sur toi. L'export est joint à cet email au format JSON. »
  - « Cet export inclut : ton profil, tes proches et leurs questionnaires, tes confidences, tes notes, les suggestions générées et l'historique de notifications. »
- Pièce jointe : `candice-export-AAAA-MM-JJ.json`.
- Réponse succès : `{ ok: true, message: 'Export envoyé par email.' }`.

---

## 13. Cycle de vie du compte (pause, silence, suppression automatique)

Le cron `lifecycle-check` fait évoluer le statut d'abonnement et envoie des emails de relance.
Source : `src/app/api/cron/lifecycle-check/route.ts`.

- Authentification du cron : en-tête `Authorization: Bearer <CRON_SECRET>` — sinon 401.
- Un verrou d'essai est **désactivé** en phase de test : `const ENABLE_TRIAL_LOCKOUT = false;` (ligne 9). Commentaire : « Phase de test — réactiver quand Stripe est branché (Phase 7) ».

Transitions (parcourt tous les profils) :
- **Rappels d'essai** (statut `trial`, essai 30 j) : J-7 (jour 23), J-3 (jour 27), J-1 (jour 29) → appel `POST /api/emails/trial-reminder` (voir §14). Anti-doublon via `notification_log`.
- **Fin d'essai → pause** : SEULEMENT si `ENABLE_TRIAL_LOCKOUT` est vrai (donc inactif aujourd'hui). Passerait `trial` → `paused` à J+30 + email « Candice est en pause ».
- **Actif → silencieux (90 j d'inactivité)** : `active` → `silent`, event `went_silent`, email « On t'attend — Candice ».
- **Relance pause (60 j)** : email « Reprendre Candice ? ».
- **Suppression programmée atteinte** : `cancelled` + `deletion_scheduled_at ≤ maintenant` → `hardDeleteUser`.

Emails simples du cron (verbatim, fonction `sendSimpleEmail`) :
- « Candice est en pause » — « Ton essai de 30 jours est terminé. Candice est en pause — reprends quand tu veux depuis tes paramètres. »
- « On t'attend — Candice » — « Ça fait un moment qu'on ne t'a pas vu. Tes proches sont toujours là, et Candice aussi. Reviens quand tu veux. »
- « Reprendre Candice ? » — « Ça fait 2 mois que Candice est en pause. Tes proches ont peut-être un anniversaire qui approche, une attention qui serait parfaite. Reprends en un clic. »

### Pause / reprise manuelles
- `POST /api/subscription/pause` : éligible si statut `trial` ou `active` — sinon 400 `{ error: 'Compte non éligible à la pause' }`. Passe à `paused`, event `subscription_paused`. Source : `src/app/api/subscription/pause/route.ts`.
- `POST /api/subscription/resume` : éligible si statut `paused` — sinon 400 `{ error: 'Compte non en pause' }`. Repasse à `trial` (si essai encore valide < 30 j) ou `active`. Source : `src/app/api/subscription/resume/route.ts`.
- Interface : bouton « Reprendre Candice » (pendant : « Reprise… »). Source : `AbonnementActions.tsx` lignes 69-78.

---

## 14. Emails d'essai (rappels)

Source : `src/app/api/emails/trial-reminder/route.ts`. Route interne appelée UNIQUEMENT par le cron (Bearer `CRON_SECRET`).

Objets et intros VERBATIM selon `daysLeft` :
- **7 jours** — Objet : « Plus que 7 jours d'essai — souhaites-tu poursuivre avec Candice ? » ; intro : « Ton essai gratuit se termine dans 7 jours. Candice a déjà appris à connaître tes proches — ne laisse pas ces attentions s'arrêter. »
- **3 jours** — Objet : « Candice tient à toi — encore 3 jours pour décider » ; intro : « Il te reste 3 jours. Candice a préparé des idées pour chacun de tes proches, et continue d'en découvrir chaque jour. »
- **1 jour** — Objet : « Dernier jour de ton essai Candice » ; intro : « C'est le dernier jour de ton essai. Dans 24h, Candice se mettra en pause — mais elle sera toujours là quand tu voudras reprendre. »
- Défaut — Objet : « Ton essai Candice arrive bientôt à terme » ; intro : « Ton essai gratuit se termine bientôt. »
- CTA : « Continuer avec Candice → » vers `/parametres/abonnement`.
- Bas de page : « Ton compte reste accessible. Tu peux reprendre à tout moment depuis tes paramètres. » + lien « Se désabonner » vers `/parametres/notifications`.

---

## 15. Invité arrivant par un lien

Il existe TROIS systèmes de liens distincts (à ne pas confondre) :

### 15.a — Lien d'invitation d'un proche : `/invite/[token]` (table `invite_links`)
C'est le lien qu'un pilote génère pour inviter un proche à remplir SA fiche.
Source : `src/app/invite/[token]/page.tsx` + `src/app/invite/[token]/LandingInvite.tsx`.
- La page serveur charge l'invitation (`invite_links`, champ `pilote_name`, `expires_at`).
- Si le token n'existe pas ou est expiré → **page 404** (`notFound()`).
- Sinon, on affiche l'écran d'atterrissage `LandingInvite` avec le prénom du pilote.

Écran `LandingInvite` (verbatim, `{P}` = prénom du pilote) :
- Titre : « {P} veut apprendre à te faire vraiment plaisir. »
- Sous-titre : « Pas un cadeau au hasard, une fois par an. Les bonnes attentions, au bon moment — celles qui te ressemblent. »
- Corps : « {P} utilise Candice pour mieux prendre soin des gens qui comptent. Là, c'est à toi que {P} pense. » puis « Ce questionnaire, c'est ta façon de lui dire — sans avoir à le dire — ce qui te touche, ce qui te fait plaisir, et ce qu'il vaut mieux éviter. {P} n'en verra qu'une version résumée : les détails restent entre Candice et toi. »
- Encart « Ce que tu y gagnes » : « ta propre fiche Candice, rien que pour toi ; » / « ce que tu découvres sur votre façon de fonctionner, {P} et toi ; » / « un mois pour essayer Candice et mieux penser, toi aussi, à ceux que tu aimes. »
- Note pratique : « Compte une vingtaine de minutes, au calme. Tu ne le rempliras qu'une fois dans ta vie — autant le faire bien. Candice t'accompagne, une question à la fois. »
- **Sur mobile** : bouton « Créer mon compte et commencer » (actif seulement après avoir coché) + case « J'accepte les conditions et je démarre mon mois d'essai gratuit — sans carte bancaire, sans engagement. ». Le bouton mène vers `/register?invite_token=<token>`.
- **Sur desktop** : pas de bouton, mais « Ouvre ce lien sur ton téléphone pour continuer. » + QR code + « Ou copie ce lien et ouvre-le dans ton navigateur mobile. »

Création du lien : `POST /api/invite/create` (crée une ligne `invite_links` avec `pilote_id`, `contact_id`, `pilote_name`, renvoie `token`). Source : `src/app/api/invite/create/route.ts`.
Réclamation à l'inscription : `POST /api/invite/link` — marque `used_at`, relie le proche au contact (`contacts.proche_user_id = user.id`), et notifie le pilote par email. Source : `src/app/api/invite/link/route.ts`.

Email au pilote quand le proche a fini (verbatim) :
- Objet : « {prénom} a complété sa fiche ✦ » (ou « Ton proche a complété sa fiche ✦ »)
- Titre : « Bonne nouvelle, {prénom}. »
- « {prénom du proche} a complété son profil sur Candice. »
- « Candice a maintenant tout ce qu'il faut pour t'aider à prendre soin de {prénom}. Découvre les premières attentions personnalisées. »
- CTA « Voir ses attentions → » vers `/contacts`.

### 15.b — Lien de partage de MA fiche : `/rejoindre/[token]` (table `profile_share_links`)
C'est le lien qu'un utilisateur génère pour partager SA propre fiche.
Source : `src/app/rejoindre/[token]/page.tsx`.
- **Si déjà connecté** : réclamation automatique (`claimShareLink`) → redirection vers `/fiche/<consentId>`.
  - Si c'est son propre lien : titre « C'est ton propre lien. » ; texte « Envoie-le à la personne de ton choix — il s'activera chez elle. » ; lien « Gérer mes partages → » vers `/moi/partage`.
  - Si lien invalide/utilisé : titre « Ce lien n'est plus valide. » ; texte « Il a déjà été utilisé ou annulé. Demande à la personne de t'en générer un nouveau depuis son application Candice. » ; lien « Retour à l'accueil → ».
- **Si sans compte** (lien valide) :
  - Sur-titre : « Fiche partagée »
  - Titre : « {prénom} partage sa fiche avec toi. »
  - Texte : « Sur Candice, chacun décrit ce qui lui fait vraiment plaisir — et choisit ce qu'il partage. Crée ton compte pour découvrir ce que {prénom} a choisi de te confier, et remplis ta fiche à ton tour. »
  - Bouton « Créer mon compte gratuit → » vers `/register?share_token=<token>&de=<prénom>`
  - Lien « J'ai déjà un compte » vers `/login?next=/rejoindre/<token>`
- **Si lien invalide/expiré (sans compte)** : titre « Ce lien n'est plus valide. » + « Il a déjà été utilisé ou annulé. Demande à la personne de t'en générer un nouveau depuis son application Candice. »

Sécurité : le token n'est jamais stocké en clair (empreinte SHA-256, `hashShareToken`). Source : `src/app/rejoindre/[token]/page.tsx` (lignes 49-54).

### 15.c — Lien legacy : `/profil-partage/[token]` (table `share_links`)
Source : `src/app/profil-partage/[token]/page.tsx`.
- Cette page affiche **TOUJOURS** un message d'expiration (elle ne lit que le nom de l'expéditeur pour personnaliser le message ; elle ne rend jamais de questionnaire actif) :
  - Titre : « Ce lien n'est plus valide. »
  - Texte : « Demande à {prénom} de te renvoyer un nouveau lien d'invitation depuis son application Candice. » (ou variante générique sans prénom)
- C'est un vestige de l'ancien système `share_links` (voir §16). Non vérifié : aucun code observé ne génère de nouveaux liens `/profil-partage/`.

---

## 16. Proche sans compte (soumission publique)

### Système legacy `share_links` / `shared_profile_responses`
Source : `src/app/api/shared-profile/complete/route.ts` et `src/app/api/shared-profile/complete` (autre route).
- `POST /api/shared-profile/complete` (dans `route.ts` sans auth requise) prend `{ token, response_data }`, vérifie le token dans `share_links`, et enregistre les réponses dans `shared_profile_responses` **avec `user_id: null`** (donc sans compte). Utilise le client admin (contourne la RLS). Source : `src/app/api/shared-profile/complete/route.ts` (le fichier lu enregistre les réponses).
- Une autre variante `src/app/api/shared-profile/complete/route.ts` (celle lue avec `getUser`) attribue 500 points à un utilisateur connecté qui a complété une fiche partagée et notifie l'expéditeur. **Objet de l'email : « La fiche de ton proche est complète ✦ »**, CTA « Voir les suggestions → », mention « +500 points ».

Note : deux comportements coexistent sous le même chemin `shared-profile/complete` selon la version du fichier ; le lexique du projet indique que ce système est **déprécié** au profit du parcours `/invite` + compte.

### Mode incognito (pilote qui remplit pour le proche, sans le prévenir)
Voir §17. Dans ce mode, le proche n'a jamais de compte ni de notification.

---

## 17. Mode incognito (pilote)

Accès : `/contacts/new` → choix « Mode incognito ».
Source : `src/components/contacts/NewContactFlow.tsx` + `src/app/api/contacts/create-incognito/route.ts`.

### Écran de choix de mode (verbatim)
Source : `NewContactFlow.tsx` (lignes 366-427).
- Carte « **Mode standard** » (sous-titre « recommandé ») : « Tu invites le proche, il remplit lui-même son questionnaire. Il découvre Candice avec une analyse personnelle à la fin. »
- Carte « **Mode incognito** » : « Tu remplis tout toi-même, ton proche n'est pas informé. Idéal quand tu veux gérer les attentions de A à Z. »

### Formulaire incognito (verbatim)
En-tête après sélection : « Mode incognito » / « Renseigne les informations essentielles. Ton proche ne sera pas notifié. »
- **Étape 0** : « Prénom * » (placeholder « Ex : Sophie ») ; « Pronom » (Elle (féminin) / Il (masculin) / Iel (non-binaire) / Je préfère ne pas préciser) ; bouton « Suivant → ».
- **Étape 1** : « Et aujourd'hui, votre relation avec {name} ressemble plutôt à… » / « Uniquement visible par vous. Candice adapte ses idées en conséquence. » avec 6 registres (verbatim, lignes 56-63) :
  - « Très proche et fluide » — « Vous pouvez vous parler naturellement, sans trop réfléchir. »
  - « Proche, mais prise dans le quotidien » — « Le lien est là, mais il manque parfois de temps ou d'attention. »
  - « Importante, mais un peu distante » — « Vous tenez l'un à l'autre, mais le lien n'est pas toujours nourri. »
  - « Compliquée ou fragile » — « Il faut éviter les attentions trop intimes ou trop émotionnelles. » (ouvre un champ de contexte facultatif)
  - « Plutôt formelle ou occasionnelle » — « Les attentions doivent rester simples, sobres et adaptées. »
  - « Je ne sais pas trop » — « Candice commencera doucement, sans supposer trop d'intimité. »
- **Étape 2** : « Relation * » (menu), « Téléphone * » (placeholder « Ex : +33 6 12 34 56 78 »), « Adresse postale (pour les livraisons) » ; encart juridique : « En saisissant ces informations, tu agis comme mandataire de ton proche pour les attentions à venir. **Voir nos conditions.** » ; bouton « Créer le profil incognito → » (pendant : « Création… »).

### Route de création
Source : `src/app/api/contacts/create-incognito/route.ts`.
- Exige une session — sinon 401.
- Champs obligatoires : `name`, `relationship` (valide), `phone` — sinon 400 (« Nom requis » / « Relation invalide » / « Téléphone requis »).
- Anti-doublon : clé d'idempotence + garde « même nom créé dans les 30 dernières secondes ».
- Insère dans `contacts` (sans email). Si registre « compliquée_fragile » + contexte fourni → note dans `context_journal`.
- Renvoie `{ contactId }` → l'utilisateur est redirigé vers `/contacts/<contactId>`.

---

## 18. Récapitulatif des tables & mécanismes d'accès

| Mécanisme | Table(s) | Compte requis ? | Source |
|---|---|---|---|
| Porte bêta | (cookie `beta_access`) | non | `api/beta-access/route.ts` |
| Inscription / connexion | Supabase Auth + `my_profile` | — | `register/`, `login/` |
| Invitation proche | `invite_links`, `contacts.proche_user_id` | oui (à la fin) | `api/invite/*` |
| Partage de sa fiche | `profile_share_links`, `contact_consents` | oui | `rejoindre/`, `api/share-link/*` |
| Demande de voir une fiche | `contact_consents` (kind `profile_view`) | oui (+ questionnaire 5/5) | `api/profile-view/*` |
| Partage legacy | `share_links`, `shared_profile_responses` | non (déprécié) | `api/shared-profile/*` |
| Incognito | `contacts`, `context_journal` | oui (pilote) | `api/contacts/create-incognito` |
| Suppression / pause | `my_profile`, `account_lifecycle_events` | oui | `api/account/*`, `api/subscription/*`, `api/cron/lifecycle-check` |

---

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU**
- Le chemin `src/app/api/shared-profile/complete/route.ts` présente deux logiques (une sans auth qui écrit `shared_profile_responses`, une avec auth qui attribue 500 points). J'ai décrit les deux telles que lues ; je n'ai pas tranché laquelle est active en prod (dépend de la version déployée). Alternative possible : une seule est réellement câblée.
- La page `/profil-partage/[token]` affiche toujours « lien invalide » dans le code lu ; je l'interprète comme un vestige. Non vérifié : un flux qui rendrait un questionnaire actif via ce chemin.

**B. DÉCISIONS PRISES SEUL**
- J'ai classé `/invite`, `/rejoindre`, `/profil-partage` en trois « systèmes de liens » distincts pour clarifier ; cette catégorisation est ma structuration, pas un libellé du code.

**C. LAISSÉ EN SUSPENS**
- Le composant `OnboardingFlow` (`src/components/onboarding/OnboardingFlow.tsx`) n'est importé nulle part (grep sans résultat hors dossier onboarding) — décrit dans le fichier 05 comme composant existant mais non monté ; le tour d'accueil est explicitement « neutralisé » dans le dashboard.
- Gabarit de l'email de confirmation d'adresse : géré par Supabase (hors repo), non citable verbatim.
- Je n'ai pas ouvert `src/app/api/emails/reminder/route.ts` et `reminder-suggestion/route.ts` en entier (seuls les objets sont relevés : « Votre fiche est incomplète. » et objet dynamique de `profile-complete` « Tout est prêt pour {prénom}. »).

**D. À VÉRIFIER PAR ESTELLE**
- Le mot de passe bêta par défaut est codé en dur (`Candice2026!`) si la variable d'environnement `BETA_PASSWORD` n'est pas définie — à confirmer que la variable est bien définie en prod.
- L'absence TOTALE de parcours « mot de passe oublié » est-elle voulue en l'état ?

**E. MIGRATIONS / BUILD**
- Lecture seule : aucune migration, aucun build lancé (tâche de cartographie).
