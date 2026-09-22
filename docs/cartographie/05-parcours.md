# 05 — Parcours utilisateurs

> Cartographie brute, écran par écran, de chaque typologie d'utilisateur. Ce document décrit le chemin RÉEL tel qu'il est codé, avec les routes, les écrans, et les boutons cités VERBATIM. Aucune recommandation. Sources : `fichier : chemin`. Le filtre commun à tous les parcours (portes desktop + bêta + session) est décrit dans `04-acces-authentification.md` ; il n'est pas répété à chaque étape.

Rappel du filtre `src/proxy.ts` (traversé à chaque navigation) : desktop → `/continuer-sur-telephone` ; pas de cookie bêta → `/beta-access` ; pas de session sur `/dashboard` ou `/contacts` → `/login` ; session sur `/login` ou `/register` → `/dashboard`.

---

## (a) Nouvel utilisateur spontané

Arrivée « à froid » depuis le site marketing.

1. **`/` — Page d'accueil** (`src/app/page.tsx`)
   - Voit : « Votre copilote **relationnel.** » / « L'attention juste, au bon moment. »
   - Fait : clique **« Commencer avec Candice »** (ou **« Commencer »** en bas de page) → `/register`. (Alternative : « Explorer » → `/concept`.)

2. **`/register` — Inscription** (`src/app/register/page.tsx`)
   - Voit : « Créer un compte. » / « Quelques secondes suffisent ».
   - Fait : renseigne Prénom, Identifiant (`@`), E-mail, Téléphone (optionnel), Mot de passe ; coche les CGU ; clique **« Créer un compte »**.
   - Résultat : `supabase.auth.signUp`, email de confirmation envoyé par Supabase, email de bienvenue « Candice est prête. » envoyé par Resend, puis redirection vers `/dashboard` (destination par défaut).
   - Écran intermédiaire possible : « Ton compte est créé. » / « Va voir ta boîte mail pour confirmer ton adresse. » (si pas de session immédiate).

3. **`/dashboard` — Tableau de bord** (`src/app/dashboard/page.tsx`)
   - Voit : date du jour + « Bonjour[, {prénom}] » / « Ce qu'il ne faut pas laisser passer. » ; trois compteurs (« proches à soutenir », « dates à venir », « profils à affiner »).
   - État vide (aucun proche) : gros bouton **« Ajouter un proche → »** vers `/contacts/new`.
   - En bas : lien « Quelqu'un est déjà sur Candice ? Demande à voir sa fiche → » vers `/recherche`.
   - Note : le tour d'accueil (`OnboardingFlow`) est **neutralisé** — commentaire dans le code (`src/app/dashboard/page.tsx` lignes 188-191) : violation de la DA (vouvoiement + émoji) et interception des taps. Le composant existe (`src/components/onboarding/OnboardingFlow.tsx`) mais n'est monté nulle part.

4. **`/moi/questionnaire` — Compléter sa propre fiche** (`src/app/moi/questionnaire/page.tsx`)
   - Accessible via l'email de bienvenue (CTA « Compléter ma fiche → ») ou la navigation.
   - Voit : le flux de questionnaire personnel (`QuestionnaireFlow`).
   - Résultat : remplit sa `my_profile`. Une fois assez rempli, une analyse est générée (`GenerateAnalysisOnMount`).

5. **`/moi` — Sa fiche / profil** (`src/app/moi/page.tsx`)
   - État vide : « Réponds à quelques questions — tes proches pourront consulter ta fiche pour mieux prendre soin de toi. » + `ResumePrompt`.
   - État rempli : rendu `ProfileV2` (analyse + faits pratiques), jamais de réponses brutes.
   - En bas : « Retour au site » et « Se déconnecter ».

Chemin résumé : `/` → `/register` → `/dashboard` → `/contacts/new` (ajout proche) et/ou `/moi/questionnaire` (sa fiche).

---

## (b) Invité par un proche (lien d'invitation)

L'utilisateur reçoit un lien `/invite/[token]` (généralement par email « Une invitation Candice… » ou par message).

1. **`/invite/[token]` — Atterrissage invitation** (`src/app/invite/[token]/page.tsx` + `LandingInvite.tsx`)
   - Si token inexistant/expiré → **404**.
   - Sinon voit (avec le prénom du pilote `{P}`) : « {P} veut apprendre à te faire vraiment plaisir. » + sous-titre + encart « Ce que tu y gagnes ».
   - **Sur mobile** : coche « J'accepte les conditions et je démarre mon mois d'essai gratuit — sans carte bancaire, sans engagement. » puis clique **« Créer mon compte et commencer »** → `/register?invite_token=<token>`.
   - **Sur desktop** : pas de bouton, un QR code (« Ouvre ce lien sur ton téléphone pour continuer. »).

2. **`/register?invite_token=…` — Inscription** (`src/app/register/page.tsx`)
   - Même formulaire qu'en (a), mais la destination post-inscription devient `/moi/questionnaire?invite_token=<token>` (lignes 167-171).

3. **`/moi/questionnaire?invite_token=…` — Sa fiche** (`src/app/moi/questionnaire/page.tsx`)
   - La page lit le `invite_token`, charge le prénom du pilote (`invite_links.pilote_name`) pour personnaliser (`piloteFirstName`).
   - L'invité remplit **sa propre fiche** (il ne remplit pas la fiche du pilote).
   - À la réclamation du lien (`POST /api/invite/link`), le proche est relié au contact du pilote (`contacts.proche_user_id = user.id`) et le pilote reçoit l'email « {prénom} a complété sa fiche ✦ ».

4. Ensuite, l'invité devient un utilisateur normal : `/dashboard`, `/moi`, etc. Il bénéficie de son propre mois d'essai.

---

## (c) Proche qui remplit sa propre fiche

Deux points d'entrée aboutissent au même acte (« remplir MA fiche ») :

- **Via invitation** : parcours (b), étapes 3-4 — l'invité remplit `/moi/questionnaire`.
- **Via lien de partage `/rejoindre/[token]`** : le pilote a partagé SA fiche, et invite le proche à créer la sienne « à son tour ».
  1. **`/rejoindre/[token]`** (`src/app/rejoindre/[token]/page.tsx`)
     - Sans compte, lien valide : « {prénom} partage sa fiche avec toi. » + « …remplis ta fiche à ton tour. »
     - Fait : **« Créer mon compte gratuit → »** → `/register?share_token=<token>&de=<prénom>` (ou « J'ai déjà un compte » → `/login?next=/rejoindre/<token>`).
  2. **`/register?share_token=…`** : inscription, destination post-inscription = `/rejoindre/<token>`.
  3. **Retour `/rejoindre/[token]` (connecté)** : réclamation automatique → redirection `/fiche/<consentId>` (il voit la fiche que le pilote a partagée). Puis il peut remplir sa propre fiche via `/moi/questionnaire`.

Le contenu du questionnaire personnel est servi par `QuestionnaireFlow` (`src/app/moi/questionnaire/QuestionnaireFlow.tsx`). La fiche reste privée : seul un résumé/analyse est partagé (voir la mécanique de scope dans `/fiche/[consentId]`).

---

## (d) Pilote qui ajoute un proche

1. **`/dashboard`** ou **`/contacts`** → bouton **« + Ajouter »** (barre `Navbar`, `src/components/layout/Navbar.tsx`) ou **« Ajouter un proche → »** (état vide dashboard) → `/contacts/new`.

2. **`/contacts/new` — Nouveau contact** (`src/app/contacts/new/page.tsx` + `NewContactFlow.tsx`)
   - Voit : « Nouveau contact » / « Ajouter quelqu'un. » / « Choisis comment tu veux créer ce profil. »
   - Deux cartes de choix :
     - **« Mode standard »** (recommandé) : « Tu invites le proche, il remplit lui-même son questionnaire. Il découvre Candice avec une analyse personnelle à la fin. »
     - **« Mode incognito »** : « Tu remplis tout toi-même, ton proche n'est pas informé. Idéal quand tu veux gérer les attentions de A à Z. »

3a. **Mode standard** → composant `QuestionnaireForm` (`src/components/questionnaire/QuestionnaireForm.tsx`)
   - Le pilote saisit les infos du contact puis génère un lien d'invitation.
   - `handleGenerateLink` (lignes 345-391) : crée le contact (`upsertContact`), appelle `POST /api/invite/create` pour obtenir un `token`, affiche l'écran « lien » avec l'URL `<origin>/invite/<token>`.
   - Si le contact a un email : envoi automatique de l'email **« Une invitation Candice de la part de {prénom} ✦ »** (`POST /api/emails/questionnaire-invite`), CTA « Découvrir mon invitation → ».
   - Le lien peut aussi être copié via le bouton **« Inviter {prénom} sur Candice »** (`src/app/contacts/[id]/InviteButton.tsx`) qui copie l'URL `/invite/<token>` dans le presse-papier (état « Lien copié ! »).
   - Le proche suit alors le parcours (b).

3b. **Mode incognito** → composant `IncognitoForm` (dans `NewContactFlow.tsx`) — voir parcours (e).

4. **`/contacts/[id]` — Fiche du proche** : après création, le pilote arrive sur la fiche du contact.

---

## (e) Pilote en mode incognito

Sous-parcours de (d), branche « Mode incognito ».

1. **`/contacts/new`** → carte « Mode incognito ».
   - Rappel en-tête : « Renseigne les informations essentielles. Ton proche ne sera pas notifié. »

2. **Formulaire incognito** (`NewContactFlow.tsx`, `IncognitoForm`)
   - **Étape 0** : « Prénom * » (« Ex : Sophie ») + « Pronom » (Elle / Il / Iel / Je préfère ne pas préciser) → **« Suivant → »**.
   - **Étape 1** : « Et aujourd'hui, votre relation avec {name} ressemble plutôt à… » (6 registres, verbatim dans le fichier 04 §17). Si « Compliquée ou fragile » choisi → champ de contexte facultatif « Comment tu aimes entretenir le lien avec {name}, malgré ce qui est compliqué ». Boutons « ← Retour » / « Suivant → ».
   - **Étape 2** : « Relation * », « Téléphone * » (« Ex : +33 6 12 34 56 78 »), « Adresse postale (pour les livraisons) », encart mandataire « En saisissant ces informations, tu agis comme mandataire de ton proche pour les attentions à venir. Voir nos conditions. » → **« Créer le profil incognito → »**.

3. **`POST /api/contacts/create-incognito`** (`src/app/api/contacts/create-incognito/route.ts`)
   - Crée le contact sans email, sans notification au proche. Idempotence + garde anti-doublon 30 s.
   - Renvoie `{ contactId }`.

4. **`/contacts/[id]` — Fiche** : redirection immédiate (`router.push(/contacts/<contactId>)`). Le pilote gère ensuite tout depuis cette fiche : le proche n'est JAMAIS informé.

Le questionnaire incognito « à la place du proche » se poursuit sur `/contacts/[id]/questionnaire` (`src/app/contacts/[id]/questionnaire/page.tsx` + `IncognitoFlow.tsx`) : la page charge le contact, refuse l'accès si le contact s'est lié à son propre compte (`proche_user_id` défini → redirection vers `/contacts/[id]`), sinon rend le flux incognito pré-rempli par le pilote.

---

## (f) Retour après inactivité

1. **Arrivée sur une page personnelle sans session valide** → le proxy renvoie vers `/login` (routes `/dashboard`, `/contacts`) ou la page fait `redirect("/login")`.
   - Pour une fiche partagée : `/login?next=/fiche/<consentId>` (retour au bon endroit après reconnexion). Source : `src/app/fiche/[consentId]/page.tsx` ligne 30.

2. **`/login`** — se reconnecte (« Bon retour. »). Après succès → `next` (défaut `/dashboard`).
   - Rappel : **aucun** parcours « mot de passe oublié » n'existe (voir fichier 04 §6).

3. **`/dashboard`** — `trackActivity(user.id)` est appelé à chaque visite du dashboard (`src/app/dashboard/page.tsx` ligne 125), ce qui met à jour `last_active_at` (utilisé par le cycle de vie, parcours g).

4. **Emails de relance** (parcours passif, sans action de l'utilisateur) : le cron `lifecycle-check` peut avoir envoyé, pendant l'absence :
   - « On t'attend — Candice » (après 90 j d'inactivité, passage `active` → `silent`) ;
   - « Reprendre Candice ? » (après 60 j de pause).
   Source : `src/app/api/cron/lifecycle-check/route.ts`.

---

## (g) Compte en pause / cycle de vie

Le statut du compte vit dans `my_profile.subscription_status` : valeurs `trial`, `active`, `paused`, `silent`, `cancelled`. Le moteur est le cron `lifecycle-check`.

### Écran d'abonnement (`/parametres/abonnement`)
Source : `src/app/parametres/abonnement/page.tsx` + `AbonnementActions.tsx`.
- Bloc « Offre » : « Candice — 9 €/mois » / « 1 mois d'essai offert. Sans engagement. »
- Bloc « Statut » : libellé (Essai gratuit / Actif / En pause / Silencieux / Annulé) + pastille colorée.
- Bloc « Période d'essai » (si `trial`) : « X jour(s) restant(s) » / « Dernier jour » / « 30 jours offerts » / « Essai illimité » (si `lifetime_trial`).
- Bouton **« Passer à l'abonnement »** : **désactivé**, note « Disponible prochainement. » (Stripe pas encore branché).
- Si `paused` : bouton **« Reprendre Candice »**.
- Si suppression programmée : encart « Suppression programmée le [date]. » + bouton « Annuler la suppression ».
- Lien « Supprimer mon compte » (voir fichier 04 §10).

### Transitions automatiques (cron `lifecycle-check`)
Source : `src/app/api/cron/lifecycle-check/route.ts`.
- **Essai (30 j)** : rappels J-7 / J-3 / J-1 (emails `trial-reminder`, objets verbatim au fichier 04 §14). Le passage automatique `trial` → `paused` en fin d'essai est **désactivé** (`ENABLE_TRIAL_LOCKOUT = false`, ligne 9 — « réactiver quand Stripe est branché »).
- **`active` → `silent`** : après 90 j sans activité (`last_active_at`). Email « On t'attend — Candice ». Event `went_silent`.
- **`paused` (relance 60 j)** : email « Reprendre Candice ? ».
- **`cancelled` + échéance atteinte** : `hardDeleteUser` (suppression définitive).

### Pause / reprise manuelles
- **Pause** : `POST /api/subscription/pause` — éligible si `trial`/`active`, sinon « Compte non éligible à la pause » ; passe à `paused`, event `subscription_paused`. Source : `src/app/api/subscription/pause/route.ts`.
- **Reprise** : `POST /api/subscription/resume` — éligible si `paused`, sinon « Compte non en pause » ; repasse à `trial` (essai < 30 j encore valide) ou `active`, event `subscription_resumed`. Source : `src/app/api/subscription/resume/route.ts`.
- Interface : bouton « Reprendre Candice » (pendant : « Reprise… »).

### Bannière de pause sur le dashboard
Source : `src/app/dashboard/page.tsx` (ligne 192) — si `subscription_status === "paused"`, le composant `PauseBanner` (`src/components/dashboard/PauseBanner`) est affiché en tête du dashboard.

### Journal du cycle de vie
Tous les changements de statut sont journalisés dans `account_lifecycle_events` (`event_type` : `deletion_requested`, `deletion_cancelled`, `subscription_paused`, `subscription_resumed`, `trial_expired`, `went_silent`). Sources : routes `api/account/*`, `api/subscription/*`, `api/cron/lifecycle-check`.

---

## Annexe — Parcours secondaire : demander à voir la fiche de quelqu'un (Sens 1)

Non demandé explicitement mais central pour comprendre l'accès entre utilisateurs.

1. **`/recherche`** (`src/app/recherche/page.tsx`)
   - Voit : « Trouver quelqu'un » / « Saisis l'identifiant exact ou l'email exact que la personne t'a donné. Rien n'est visible sans son accord explicite. »
   - **Garde** : si le questionnaire personnel n'est pas complet (5/5), l'écran affiche « Ta fiche d'abord. » et bloque avec « Reprendre mon questionnaire → » vers `/moi/questionnaire`.
   - Sinon, `RechercheClient` permet de chercher par `@identifiant` ou email.

2. **Demande** : `POST /api/profile-view/request` (`src/app/api/profile-view/request/route.ts`)
   - Crée un `contact_consents` (kind `profile_view`, status `pending`), envoie un email à la cible.
   - **Objet email : « {prénom} veut voir ton profil »**, corps « C'est toi qui décides ce que tu partages… », CTA « Choisir ce que je partage → » vers `/moi/partage/demandes/<consentId>`.

3. **Réponse de la cible** : `/moi/partage/demandes/[consentId]` — la cible choisit le scope (tout / sections / rien de visible / refuser).

4. **Consultation** : une fois accepté, le demandeur voit la fiche via `/fiche/[consentId]` (`src/app/fiche/[consentId]/page.tsx`), rendu `ProfileV2` filtré selon le scope, textes convertis à la 3ᵉ personne. Si retiré : « Ce partage a été retiré. »

---

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU**
- Parcours (c) « proche qui remplit sa propre fiche » : le code offre deux chemins (invitation `/invite` et partage `/rejoindre`). J'ai décrit les deux ; l'énoncé ne précisait pas lequel privilégier.
- Le mode standard (d.3a) affiche un écran « lien » avec QR/copie ; je n'ai pas détaillé chaque sous-étape de `QuestionnaireForm` (composant volumineux) au-delà de la génération du lien et de l'envoi d'email.

**B. DÉCISIONS PRISES SEUL**
- J'ai ajouté une annexe « demander à voir une fiche » car elle éclaire l'accès inter-utilisateurs, bien qu'elle ne figure pas dans les 7 typologies demandées. À retirer si hors périmètre.

**C. LAISSÉ EN SUSPENS**
- Le contenu détaillé question par question des questionnaires (`QuestionnaireFlow`, `DiscoveryFlow`, `IncognitoFlow`) n'est pas déroulé : ce sont des flux longs relevant d'une cartographie dédiée « questionnaire ».
- Le composant `OnboardingFlow` existe mais n'est monté nulle part (tour d'accueil neutralisé) ; je l'ai signalé sans l'inclure comme étape active du parcours (a).

**D. À VÉRIFIER PAR ESTELLE**
- Confirmer que le parcours (a) « spontané » n'affiche effectivement plus AUCUN onboarding (le composant est neutralisé mais toujours présent dans le code).
- Confirmer que le bouton « Passer à l'abonnement » désactivé (Stripe non branché) correspond bien à l'état voulu en bêta.

**E. MIGRATIONS / BUILD**
- Lecture seule : aucune migration, aucun build lancé (tâche de cartographie).
