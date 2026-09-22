# Cartographie Candice — 03. Les pages de l'application

Ce document recense **chaque page** de l'application (chaque fichier `page.tsx` dans `src/app`). Pour chacune : l'URL, à quoi elle sert, qui peut y accéder, d'où on y arrive, où elle mène, et les textes visibles copiés mot pour mot.

Statuts employés : ✅ page complète et active · 🟡 placeholder / « bientôt » / partiellement neutralisé · ⚫ neutralisé (volontairement désactivé) · ❌ cassé/absent.

---

## Règles d'accès générales (source : `src/proxy.ts`)

Trois filtres s'appliquent à toutes les pages, dans cet ordre (fichier : `src/proxy.ts`) :

1. **Blocage desktop** — sur un appareil non mobile/tablette, toute URL commençant par l'un de ces préfixes est redirigée vers `/continuer-sur-telephone` (fichier : `src/proxy.ts`, `DESKTOP_GATED_PREFIXES`) :
   `/moi`, `/contacts`, `/parametres`, `/dashboard`, `/historique`, `/idees`, `/parler-a-candice`, `/partage`, `/profil/`.
   (Commentaire du code : `/profil/` vise `/profil/[id]` uniquement — `/profil-partage/` reste public.)
2. **Barrière bêta** — toute page exige un cookie `beta_access`, sinon redirection vers `/beta-access?from=...`. Seules exemptions : `/beta-access` et les routes API `/api/beta-access`, `/api/auth/callback` (fichier : `src/proxy.ts`, `BETA_EXEMPT_*`).
3. **Auth middleware** — les préfixes `/dashboard` et `/contacts` exigent une session, sinon redirection vers `/login` ; inversement `/login` et `/register`, si l'on est déjà connecté, redirigent vers `/dashboard` (fichier : `src/proxy.ts`, `protectedRoutes` / `authRoutes`).

En plus du middleware, **presque toutes les pages de l'espace connecté re-vérifient l'authentification dans leur propre code** (`supabase.auth.getUser()` ou `getAuthClaims()`), et redirigent vers `/login` si absente. C'est signalé page par page ci-dessous.

Note : il n'existe **aucun** fichier `not-found.tsx` ni `error.tsx` dans `src/app` (vérifié). Les pages « lien invalide » sont des pages normales (`/partage/[id]`, `/profil-partage/[token]`) et les 404 réelles passent par `notFound()` de Next (page 404 par défaut).

---

# GROUPE 1 — Marketing / public

Ces pages utilisent l'en-tête `MarketingNav` (fichier : `src/components/layout/MarketingNav.tsx`) et le pied de page `MarketingFooter` (fichier : `src/components/layout/MarketingFooter.tsx`).

**MarketingNav** — liens de navigation (verbatim) : `Le concept` (/concept), `Fonctionnement` (/fonctionnement), `Tarifs` (/offre). Boutons à droite : `Se connecter` (/login), `Commencer` (/register). Menu mobile ajoute le bouton `Commencer gratuitement →`.

**MarketingFooter** — colonnes (verbatim) :
- Baseline : `Relational Operating System — Le premier copilote relationnel.`
- Colonne `Produit` : `Fonctionnement`, `Tarifs`, `Le concept`, `Se connecter`.
- Colonne `Légal` : `Mentions légales`, `Conditions générales`, `Confidentialité`, `Politique cookies` (→ /confidentialite#cookies).
- Colonne `Support` : `Aide`, `Contact`, `candiceapp.hello@gmail.com`.
- Colonne `Marque` : `Suivez Candice — bientôt sur Instagram, LinkedIn et TikTok.`
- Bas de page : `© 2026 Candice · Tous droits réservés`

---

## 1.1 — Accueil `/` ✅
(fichier : `src/app/page.tsx`)

- **Rôle** : page d'accueil marketing. Présente Candice comme « copilote relationnel », avec témoignages, aperçu de l'app, timeline, exemples concrets, blocs « intelligence » et « profils », et appels à l'action.
- **Accès** : public (barrière bêta appliquée).
- **On y arrive depuis** : le logo Wordmark (partout), les liens `/` du footer, les pages légales (« Retour à l'accueil »).
- **Elle mène vers** : `/register` (boutons « Commencer avec Candice », « Commencer »), `/concept` (« Explorer »), `/login` (« Se connecter »), `/confidentialite` (« Notre engagement → »).
- **Textes visibles (verbatim)** :
  - Titre héros : `Votre copilote relationnel.` (« relationnel. » en italique) ; sous-titre : `L'attention juste, au bon moment.`
  - Boutons héros : `Commencer avec Candice`, `Explorer`
  - Intro 2 colonnes : `Vivez pleinement les moments qui comptent.` / `Candice s'occupe du reste.` — `Candice apprend, anticipe et agit — pour que vos relations s'approfondissent et que votre charge mentale disparaisse.`
  - Section témoignages, sur-titre : `Ça arrive à tout le monde.` ; cartes : `J'ai pensé à son anniversaire toute la semaine. Puis j'ai oublié.` (Julie, 38 ans — OUBLI) · `Je savais exactement quoi faire. Je ne l'ai jamais fait.` (Thomas, 41 ans — MANQUE DE TEMPS) · `Je voulais faire plaisir. Je me suis trompé.` (Sophie, 29 ans — MAUVAISE IDÉE) · `Je voulais reprendre des nouvelles. Puis le temps est passé.` (Lucas, 38 ans — PROCRASTINATION)
  - Aperçu app, titre : `Tout ce qui compte pour eux, réuni en un seul endroit.` ; sous-titre : `Pour ne plus jamais rien oublier. Pour ne plus jamais manquer un moment.`
  - Cartes d'aperçu (en-têtes) : `MES PROCHES`, `SUGGESTIONS`, `SOUVENIRS`, `SOPHIE MARTIN` ; boutons factices : `+ Ajouter`, `Commander`, `Envoyer`, `Confirmer` ; libellés de bas de carte : `Liste de proches`, `Recommandations`, `Historique & souvenirs`, `Fiche · KPIs · Matching` ; carte fiche : `Profil de réception`, KPI `GESTES / SATISFACTION / ANNIVERSAIRE / INFOS`.
  - Timeline : `Candice grandit avec vous.` — `Dès la première information, Candice est utile. Plus vous l'enrichissez, plus elle anticipe.` (jalons `1er proche` Léa / `2e proche` Maman / `3e proche` Paul avec descriptions).
  - Exemples concrets, sur-titre `Des exemples concrets`, titre `Un réflexe qui devient une mémoire.` ; 3 cartes (`Votre grand-mère`, `Votre frère`, `Votre femme`) ; conclusion `C'est ça, un copilote relationnel.`
  - Bloc intelligence, sur-titre `Intelligence`, titre `L'intelligence derrière chaque attention.` ; sous-titre `Chaque détail enrichit sa compréhension. Chaque interaction l'affine. Candice apprend vos relations — pas seulement vos contacts.` ; 4 colonnes : `Mémoire contextuelle`, `Suggestions IA`, `Confidentialité totale`, `Apprentissage continu`.
  - Bloc profils, sur-titre `Pourquoi les profils changent tout`, titre `Un geste juste, c'est un geste qui correspond à qui ils sont vraiment.` ; 3 cartes : `Chaque personne reçoit différemment`, `Les profils s'affinent dans le temps`, `Ce que vous partagez reste entre vous` ; note bas + lien `Notre engagement →`.
  - CTA final : `Prêt à faire mieux, sans porter plus ?` — `Commencez simplement. Candice s'occupe du reste.` ; boutons `Commencer`, `Se connecter`.

## 1.2 — Le concept `/concept` ✅
(fichier : `src/app/concept/page.tsx`)

- **Rôle** : page marketing expliquant le concept en profondeur (le problème, ce qu'est Candice, l'exécution, l'authenticité, la confidentialité).
- **Accès** : public (bêta).
- **On y arrive depuis** : MarketingNav (`Le concept`), footer (`Le concept`), bouton « Explorer » de l'accueil.
- **Elle mène vers** : `/register` (« Commencer avec Candice »), `/fonctionnement` (« Fonctionnement → »), `/confidentialite` (« Notre engagement confidentialité → »), `/login` (« Se connecter »).
- **Textes visibles (verbatim)** :
  - Sur-titre `Le concept` ; héros vertical : `Le travail.` / `La famille.` / `Les amis.` / `Le quotidien.`
  - `Candice vous aide à ne plus laisser les attentions importantes se perdre au milieu du reste.`
  - `Profils intelligents, mémoire relationnelle, recommandations personnalisées et exécution assistée : un copilote pour les personnes qui comptent vraiment.`
  - Boutons : `Commencer avec Candice`, `Fonctionnement →`
  - Section : `Les intentions existent déjà.` (+ 3 paragraphes) ; citation : `Candice garde ces intentions vivantes et vous aide à les transformer en actions — au bon moment, pour les bonnes personnes.`
  - Section fond sombre : `Un copilote relationnel intelligent.` + 4 blocs (`Une photo`, `Une conversation`, `Un moment important`, `Une mémoire partagée`).
  - Section : `Candice commence à aider immédiatement.` ; citation `Comme un deuxième cerveau relationnel : Candice retient ce que vous n'avez plus besoin de garder en tête.`
  - Section exécution : `Candice ne se contente pas de suggérer.` ; liste `Message.` / `Idée cadeau.` / `Réservation.` / `Livraison.` / `Rappel au bon moment.` ; `Candice prépare l'action. Vous validez.` ; puis `Moins de charge mentale.` / `Moins d'oublis.` / `Moins d'hésitations.` / `Plus d'attentions qui tombent juste.`
  - Mockup conversation : bulle `Pour l'anniversaire de Sophie samedi, je propose un brunch chez Holybelly. Réservation prête pour deux à 11h30.` ; boutons `Valider` / `Modifier` ; `Candice prépare la suite…`
  - Section : `L'attention reste la vôtre.` (+ paragraphes) ; `C'est vous qui construisez les profils.` / `C'est vous qui donnez les informations.` / `C'est vous qui voulez faire plaisir.`
  - Section : `Certaines fiches se construisent à deux.` (+ texte).
  - Section confidentialité : `Vous pouvez être honnête. Candice garde les détails.` ; `Vos données ne sont jamais vendues ni partagées avec des tiers.` ; lien `Notre engagement confidentialité →`.
  - CTA final : `Les bonnes intentions existent déjà. Candice aide à les transformer en actions.` ; boutons `Commencer avec Candice`, `Se connecter`.

## 1.3 — Fonctionnement `/fonctionnement` ✅
(fichier : `src/app/fonctionnement/page.tsx`)

- **Rôle** : explique le fonctionnement en 3 étapes + situations de la vie réelle.
- **Accès** : public (bêta).
- **On y arrive depuis** : MarketingNav (`Fonctionnement`), footer (`Fonctionnement`), lien `Fonctionnement →` de /concept.
- **Elle mène vers** : `/register` (« Essayer Candice gratuitement → »).
- **Textes visibles (verbatim)** :
  - Sur-titre `Fonctionnement` ; titre `Chaque détail compte. Candice s'en souvient.` ; sous-titre `En trois étapes simples, Candice devient le copilote de vos relations les plus importantes.`
  - Étape `01` : `Tes proches racontent. Toi tu complètes.` (+ corps).
  - Étape `02` : `Candice apprend et anticipe.` (+ corps).
  - Étape `03` : `Tu valides en un clic.` (+ corps).
  - Section : `Certaines fiches se construisent à deux.` (+ texte).
  - Section `Dans la vraie vie` / `Candice agit dans toutes les situations.` ; 6 cartes : `Après un dîner`, `En balade`, `Une grande nouvelle`, `Un départ en voyage`, `Un proche seul`, `Une victoire à célébrer` (chacune avec émoji et texte).
  - CTA : `Prêt à essayer ?` ; bouton `Essayer Candice gratuitement →`.

## 1.4 — Tarifs `/offre` ✅
(fichier : `src/app/offre/page.tsx`)

- **Rôle** : grille tarifaire à deux formules.
- **Accès** : public (bêta).
- **On y arrive depuis** : MarketingNav (`Tarifs`), footer (`Tarifs`).
- **Elle mène vers** : `/register` (deux boutons).
- **Textes visibles (verbatim)** :
  - Sur-titre `Tarifs` ; titre `Simple. Transparent.`
  - Formule 1 : `Candice Essentiel` — `0€` — `Pour toujours` ; features : `2 proches`, `Suggestions personnalisées IA`, `Fiches partagées par lien`, `Accès à l'application complète` ; bouton `Commencer gratuitement →`.
  - Formule 2 : `Candice` — badge `14 jours offerts` — `9€` — `par mois · résiliable à tout moment` ; features : `Proches illimités`, `Suggestions avancées & personnalisées`, `Exécution automatique des attentions`, `Accès prioritaire aux partenaires`, `Tout ce qui est inclus dans Essentiel` ; bouton `Essayer gratuitement — 14 jours →`.
- **Note de cohérence** : cette page annonce « 14 jours offerts / résiliable à tout moment » ; les autres surfaces annoncent « 1 mois offert » (voir /parametres/abonnement qui dit `1 mois d'essai offert`, et les CGU qui parlent de `14 jours d'essai gratuit`). Écart non résolu, signalé (non vérifié quelle version fait foi).

## 1.5 — Contact `/contact` ✅
(fichier : `src/app/contact/page.tsx`)

- **Rôle** : page de contact (e-mail).
- **Accès** : public (bêta).
- **On y arrive depuis** : footer (`Contact`).
- **Elle mène vers** : `mailto:candiceapp.hello@gmail.com`, `/` (« ← Retour à l'accueil »).
- **Textes visibles (verbatim)** : sur-titre `Contact` ; titre `Une question, une remarque ?` ; `Nous lisons chaque message. Réponse sous 48 h ouvrées.` ; lien e-mail `candiceapp.hello@gmail.com` ; `← Retour à l'accueil`.

---

# GROUPE 2 — Pages légales

Toutes utilisent MarketingNav + MarketingFooter, palette « terracotta » (ancienne DA, distincte du vert des pages marketing récentes).

## 2.1 — Mentions légales `/mentions-legales` ✅
(fichier : `src/app/mentions-legales/page.tsx`)

- **Rôle** : mentions légales (éditeur, hébergeur, propriété intellectuelle, marque, contact).
- **Accès** : public (bêta).
- **On y arrive depuis** : footer (`Mentions légales`).
- **Elle mène vers** : `mailto:candiceapp.hello@gmail.com`, `https://vercel.com`, `/` (« ← Retour à l'accueil »).
- **Textes visibles (verbatim, extraits clés)** :
  - Bandeau : `Document en cours de validation juridique. Version finale après revue avocat.`
  - Titre `Informations légales` ; `Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l'économie numérique.`
  - Sections : `Éditeur du site` (`Estelle Papillon` · `Adresse : à compléter après immatriculation de la société` · e-mail), `Directeur de la publication` (`Estelle Papillon`), `Hébergeur` (`Vercel Inc.`, 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis), `Propriété intellectuelle`, `Marque` (dépôt INPI), `Contact`.

## 2.2 — Conditions générales `/conditions-generales` ✅
(fichier : `src/app/conditions-generales/page.tsx`)

- **Rôle** : CGU en 14 sections.
- **Accès** : public (bêta).
- **On y arrive depuis** : footer (`Conditions générales`), formulaire d'inscription (`conditions générales`), landing invite.
- **Elle mène vers** : `/confidentialite` (« Politique de confidentialité »), `mailto:candiceapp.hello@gmail.com`.
- **Textes visibles (verbatim, extraits clés)** :
  - Sur-titre `Conditions générales` ; titre `Conditions générales d'utilisation` ; `Dernière mise à jour : 9 mai 2026 · Société Candice SAS`.
  - Sections numérotées : `1. Objet`, `2. Description du service`, `3. Accès et inscription`, `4. Abonnement Premium et facturation`, `5. Programme de points`, `6. Données personnelles et IA`, `7. Liens de partage`, `8. Propriété intellectuelle`, `9. Comportements interdits`, `10. Suspension et résiliation`, `11. Limitation de responsabilité`, `12. Modifications des CGU`, `13. Droit applicable et litiges`, `14. Contact`.
  - Mentions notables : formule `Premium` à `9 € / mois après 14 jours d'essai gratuit` ; programme « Candice Points » ; médiation `ec.europa.eu/consumers/odr`.

## 2.3 — Politique de confidentialité `/confidentialite` ✅
(fichier : `src/app/confidentialite/page.tsx`)

- **Rôle** : politique de confidentialité RGPD (données collectées, cookies, services tiers, conservation, droits, hébergement).
- **Accès** : public (bêta). Ancre `#cookies` (le footer lie vers `/confidentialite#cookies` mais la section cookies n'a pas d'`id="cookies"` explicite — non vérifié si l'ancre fonctionne).
- **On y arrive depuis** : footer (`Confidentialité` + `Politique cookies`), CGU, formulaire inscription, /concept, / (accueil).
- **Elle mène vers** : liens externes Supabase/Resend/Vercel/CNIL, `mailto:candiceapp.hello@gmail.com`, `/` (« ← Retour à l'accueil »).
- **Textes visibles (verbatim, extraits clés)** :
  - Sur-titre `Légal` ; titre `Politique de confidentialité` ; `Dernière mise à jour : mai 2026 · Responsable du traitement : Candice — candiceapp.hello@gmail.com`.
  - Sections : `Notre engagement`, `Données collectées`, `Cookies et traceurs` (3 catégories : `Cookies nécessaires` (Toujours actifs), `Cookies analytiques` (Si acceptés), `Cookies marketing` (Si acceptés — `Aucun cookie marketing actif à ce jour.`)), `Services tiers utilisés` (Supabase, Resend, Vercel, `Anthropic Claude API`), `Durée de conservation`, `Vos droits (RGPD)`, `Vente de données — zéro`, `Hébergement et localisation` (Irlande eu-west-1), `Contact`.

---

# GROUPE 3 — Authentification & accès

## 3.1 — Connexion `/login` ✅
(fichier : `src/app/login/page.tsx`)

- **Rôle** : formulaire de connexion (e-mail + mot de passe). Redirige vers `next` (chemin interne) ou `/dashboard` après succès.
- **Accès** : public. Si déjà connecté → redirection `/dashboard` (middleware).
- **On y arrive depuis** : MarketingNav / footer (`Se connecter`), lien « Se connecter » de l'accueil et /concept, lien « Déjà un compte ? Se connecter » de /register, et de nombreuses pages protégées via `?next=...` (fiche partagée, rejoindre, partage, etc.).
- **Elle mène vers** : `/register` (« S'inscrire »), la destination `next`, `/` (logo).
- **Textes visibles (verbatim)** : logo Wordmark ; titre `Bon retour.` ; sous-titre `Connectez-vous à votre compte` ; champs `E-mail`, `Mot de passe` ; bouton `Se connecter` / état `Connexion en cours…` ; erreur `E-mail ou mot de passe incorrect.` ; `Pas encore de compte ? S'inscrire`.

## 3.2 — Inscription `/register` ✅
(fichier : `src/app/register/page.tsx`)

- **Rôle** : création de compte durcie (prénom, @identifiant en temps réel, e-mail, téléphone FR optionnel, mot de passe ≥ 8, CGU). Gère les jetons `invite_token` (→ questionnaire) et `share_token` (→ /rejoindre). Écran de confirmation d'e-mail ou écran d'échec d'envoi.
- **Accès** : public. Si déjà connecté → `/dashboard` (middleware).
- **On y arrive depuis** : MarketingNav / footer boutons (`Commencer`, `Commencer gratuitement →`), tous les CTA marketing, landing invite (`/register?invite_token=...`), landing rejoindre (`/register?share_token=...&de=...`).
- **Elle mène vers** : la destination (questionnaire / rejoindre / dashboard), `/login`, `/conditions-generales`, `/confidentialite`.
- **Textes visibles (verbatim)** :
  - Titre `Créer un compte.` ; sous-titre `Quelques secondes suffisent`.
  - Champs : `Prénom`, `Identifiant` (préfixe `@`, indice `Unique, comme sur Instagram — c'est lui que tes proches saisiront pour te trouver.` / `Disponible.`), `E-mail`, `Téléphone (optionnel)`, `Mot de passe` (indice `8 caractères minimum.`).
  - CGU : `J'accepte les conditions générales et la politique de confidentialité`.
  - Bouton `Créer un compte` / `Création en cours…`.
  - Erreurs (verbatim) : `Ton prénom est nécessaire.`, `Adresse email invalide.`, `8 caractères minimum.`, `Numéro français invalide (ex. 06 12 34 56 78).`, `Cet identifiant est déjà pris.`, `Tu dois accepter les conditions générales pour continuer.`, `Un compte existe déjà avec cet e-mail. Se connecter`, `Trop de tentatives. Réessaie dans un instant.`, `Une erreur est survenue. Réessaie dans un instant.`
  - Écran succès : `Ton compte est créé.` — `Va voir ta boîte mail pour confirmer ton adresse` (+ variante `— puis tu découvriras ce que {prénom} a partagé avec toi.`) ; `Rien reçu ? Regarde tes indésirables — l'email vient de candice.app.`
  - Écran échec d'envoi : `L'email n'a pas pu partir.` — `Réessaie dans un instant.` ; bouton `Renvoyer l'email` / `Envoi…`.
  - `Déjà un compte ? Se connecter`.

## 3.3 — Accès bêta `/beta-access` ✅
(fichier : `src/app/beta-access/page.tsx`)

- **Rôle** : porte d'entrée bêta fermée — un mot de passe pose le cookie `beta_access` puis renvoie vers `from`.
- **Accès** : public, **seule page exemptée de la barrière bêta**.
- **On y arrive depuis** : redirection automatique du proxy pour toute page sans cookie bêta (`/beta-access?from=<page demandée>`).
- **Elle mène vers** : la page `from` (défaut `/dashboard`) après validation.
- **Textes visibles (verbatim)** : logo `candice` ; titre `Accès bêta privé` ; `Candice est en accès bêta fermé. Entre le mot de passe pour continuer.` ; placeholder `Mot de passe` ; bouton `Accéder →` / `Vérification…` ; erreurs `Mot de passe incorrect.` / `Une erreur est survenue. Réessaie.` ; pied `Candice · Accès bêta privé`.

---

# GROUPE 4 — Pages utilitaires / techniques

## 4.1 — Continuer sur téléphone `/continuer-sur-telephone` ✅
(fichier : `src/app/continuer-sur-telephone/page.tsx`)

- **Rôle** : écran affiché quand on ouvre une page « mobile only » sur ordinateur ; propose un QR code vers l'URL de l'app.
- **Accès** : public (bêta) ; c'est la cible de la redirection desktop.
- **On y arrive depuis** : redirection automatique du proxy quand un desktop tente une route de `DESKTOP_GATED_PREFIXES`.
- **Elle mène vers** : `/` (logo) ; le QR code pointe vers `window.location.origin`.
- **Textes visibles (verbatim)** : titre `Continue sur ton téléphone` ; `Candice s'ouvre sur mobile. Scanne ce code depuis ton téléphone pour accéder à ton espace.` ; `Ou tape {url} dans ton navigateur mobile.`

## 4.2 — Aperçu design `/design-preview` 🟡 (dev only)
(fichier : `src/app/design-preview/page.tsx`)

- **Rôle** : galerie interne des composants UI V4 (Brand, Orb, BottomNav, boutons, cartes, chips, jauges, radar, donut, icônes…) pour comparaison visuelle avec la maquette.
- **Accès** : renvoie `notFound()` en production (`if (process.env.NODE_ENV === "production") notFound();`). Accessible uniquement en développement.
- **On y arrive depuis** : aucun lien entrant (route de développement, non liée).
- **Elle mène vers** : rien (page vitrine statique).
- **Textes visibles (verbatim, extraits)** : titre `Candice — design preview V4.` ; `Comparer avec design/redisign/Candice_Redesign_Mockups_v4.html. Dev only.` ; libellés de sections comme `Brand · .brand`, `Orb · .orb`, `ThinkingOrb · .think-orb` (`Candice réfléchit…`), boutons de démo `Voir mon idée pour lui`, `← Retour`, `Continuer ma fiche`, panneau `À soutenir` / `Sophie traverse une période compliquée`, etc.

---

# GROUPE 5 — Espace pilote : tableau de bord

## 5.1 — Tableau de bord `/dashboard` ✅
(fichier : `src/app/dashboard/page.tsx`)

- **Rôle** : accueil de l'app connectée. Salutation datée, ligne de stats (proches à soutenir / dates à venir / profils à affiner), carte « À soutenir » (suggestion proactive prioritaire), « À faire aujourd'hui » (dates proches), « On prend des nouvelles ? », « Tu m'as dit » (notes récentes), entrée recherche, lien archives. Utilise `V4Shell` (nav basse), bannière de pause et invite aux notifications push.
- **Accès** : connecté (protégé middleware `/dashboard` + `getUser()` interne → `/login`). Desktop-gated.
- **On y arrive depuis** : redirection post-connexion / post-inscription ; nav basse V4Shell (onglet accueil) ; nombreux « Retour à l'accueil ».
- **Elle mène vers** : `/contacts/[id]` (voir attention / dates / mettre à jour), `/parler-a-candice` (« Me raconter »), `/contacts/new` (« Ajouter un proche → »), `/recherche` (« Quelqu'un est déjà sur Candice ? Demande à voir sa fiche → »), `/dashboard/archives`, `/moi/partage/demandes/[id]`.
- **Textes visibles (verbatim)** :
  - Date en capitales + `Bonjour, {prénom}` ; sous-titre `Ce qu'il ne faut pas laisser passer.`
  - Stats : `proche à soutenir` / `proches à soutenir`, `date à venir` / `dates à venir`, `profil à affiner` / `profils à affiner`.
  - Carte proactive : badge `À soutenir` ; boutons `Voir l'attention`, `Déjà fait`.
  - Divider `À faire aujourd'hui` ; sous-libellés `Aujourd'hui` / `Demain` / `Dans {n} jours` ; format `{label} de {prénom}`.
  - Divider `On prend des nouvelles ?` ; carte `Comment vas-tu, {prénom} ?` — `Quelques mots, et j'ajuste.` — bouton `Me raconter` ; carte `Des nouvelles de {prénom} ?` — bouton `Mettre à jour`.
  - Divider `Tu m'as dit` ; lien `Transformer en attention →`.
  - Vide : bouton `Ajouter un proche →`.
  - Entrée recherche : `Quelqu'un est déjà sur Candice ? Demande à voir sa fiche →`.
  - Archives : `{n} contact archivé →` / `{n} contacts archivés →`.
- **Note** : le « tour d'accueil » est neutralisé (commentaire du code : violation DA + interception des taps).

## 5.2 — Contacts archivés `/dashboard/archives` ✅
(fichier : `src/app/dashboard/archives/page.tsx` ; liste via `ArchivesClient`)

- **Rôle** : liste des contacts archivés. Utilise `DashboardShell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : `/dashboard` (lien « {n} contacts archivés → »).
- **Elle mène vers** : `/dashboard` (« ← Retour »).
- **Textes visibles (verbatim)** : sur-titre `Archivés` ; titre `Contacts archivés` ; lien `← Retour`. (Le contenu de la liste est rendu par `ArchivesClient` — hors de ce fichier.)

---

# GROUPE 6 — Espace pilote : ma fiche (/moi)

## 6.1 — Ma fiche `/moi` ✅
(fichier : `src/app/moi/page.tsx` ; rendu par `ProfileV2`)

- **Rôle** : fiche profil du pilote (vue « Profil V2 », maquette gelée). Affiche analyse + scores agrégés + faits pratiques, jamais les réponses brutes. Génère l'analyse au montage si nécessaire. Propose la modale de genre grammatical si absent. État vide si pas encore de profil.
- **Accès** : connecté (`getAuthClaims()` → `/login`). Desktop-gated. Onglet « profil » de la nav V4.
- **On y arrive depuis** : nav basse V4Shell (onglet profil), redirection `/moi/resultats`, liens « ← Ma fiche » de /moi/partage, « Retour à ma fiche » des demandes, aperçu « Fermer ».
- **Elle mène vers** : `/moi/questionnaire` (état vide via `ResumePrompt`), `/moi/partage`, `/moi/partage/apercu`, `/moi/wishlist`, `/moi/discovery` (via les composants ProfileV2 / nudges), `/` (« Retour au site »), déconnexion (`LogoutButton`).
- **Textes visibles (verbatim)** :
  - État vide : `Réponds à quelques questions — tes proches pourront consulter ta fiche pour mieux prendre soin de toi.`
  - Pied : `Retour au site` (→ `/`) + bouton de déconnexion.
  - (Le gros du contenu — résumé, podium, sections, faits — est rendu par `ProfileV2`, hors de ce fichier.)

## 6.2 — Questionnaire personnel `/moi/questionnaire` ✅
(fichier : `src/app/moi/questionnaire/page.tsx` ; flux via `QuestionnaireFlow`)

- **Rôle** : questionnaire du pilote pour lui-même. Gère `?invite_token=` (récupère le prénom du pilote invitant depuis `invite_links`). `DashboardShell` sans nav (`noNav`).
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : `/moi` (état vide), `/recherche` et `/moi/partage` (« Reprendre mon questionnaire → »), `/fiche/[consentId]` (« Remplir mon questionnaire → »), lien de confirmation e-mail (`/moi/questionnaire?invite_token=...`).
- **Elle mène vers** : selon le flux (contenu par `QuestionnaireFlow`, hors fichier).
- **Textes visibles (verbatim)** : aucun texte propre dans ce fichier ; tout est rendu par `QuestionnaireFlow`.

## 6.3 — Discovery (micro-questions) `/moi/discovery` ✅
(fichier : `src/app/moi/discovery/page.tsx` ; flux via `DiscoveryFlow`)

- **Rôle** : sert la prochaine micro-question d'approfondissement du profil (mode `quick` ou `full`, ou une section ciblée). Lecture seule au rendu (la session est créée à la première réponse — cf. mémoire projet). `DashboardShell`.
- **Accès** : connecté (`getAuthClaims()` → `/login`). Desktop-gated (préfixe `/moi`).
- **On y arrive depuis** : nudges / CTA de la fiche `/moi` (via `ProfileV2`), avec paramètres `?mode=` et `?section=`.
- **Elle mène vers** : contenu par `DiscoveryFlow` (hors fichier).
- **Textes visibles (verbatim)** : aucun texte propre ; rendu par `DiscoveryFlow`.

## 6.4 — Résultats `/moi/resultats` 🟡 (redirection)
(fichier : `src/app/moi/resultats/page.tsx`)

- **Rôle** : ancienne page de résultats, désormais **fusionnée dans `/moi`**. Le fichier ne fait que `redirect("/moi")`.
- **Accès** : redirige immédiatement vers `/moi`.
- **On y arrive depuis** : anciens liens / signets.
- **Textes visibles** : aucun.

## 6.5 — Ma wishlist `/moi/wishlist` ✅
(fichier : `src/app/moi/wishlist/page.tsx` ; rendu par `WishlistV2Client`)

- **Rôle** : liste personnelle privée du pilote (envies pour lui-même), table `my_wishlist_items`. Strictement privée (jamais partagée aux tiers). Signe les photos du bucket. Passe la liste des contacts pour cibler des destinataires.
- **Accès** : connecté (`getAuthClaims()` → `/login?next=/moi/wishlist`). Desktop-gated (préfixe `/moi`).
- **On y arrive depuis** : la fiche `/moi` (via `ProfileV2`).
- **Elle mène vers** : contenu par `WishlistV2Client` (hors fichier).
- **Textes visibles (verbatim)** : aucun texte propre dans ce fichier ; rendu par `WishlistV2Client`.

## 6.6 — Partager ma fiche `/moi/partage` ✅
(fichier : `src/app/moi/partage/page.tsx` ; formulaire via `PartageClient`)

- **Rôle** : partage sortant de MA fiche. Choix du périmètre AVANT envoi (toute ma fiche / sections choisies avec socle verrouillé / aveugle). Gère : partages en cours (révoquer), liens envoyés non utilisés (annuler), demandes reçues (répondre). Exige le questionnaire complet.
- **Accès** : connecté (`getUser()` → `/login?next=/moi/partage`). Desktop-gated.
- **On y arrive depuis** : la fiche `/moi` (via ProfileV2).
- **Elle mène vers** : `/moi` (« ← Ma fiche »), `/moi/questionnaire` (si incomplet), `/moi/partage/demandes/[id]` (« Répondre → »).
- **Textes visibles (verbatim)** :
  - `← Ma fiche` ; titre `Partager ma fiche.` ; `Tu choisis ce qui est visible AVANT d'envoyer le lien — et tu peux tout retirer à tout moment.`
  - Garde questionnaire : `Ta fiche d'abord.` — `Pour partager ta fiche, termine d'abord ton questionnaire — c'est elle que tes proches découvriront.` — bouton `Reprendre mon questionnaire →`.
  - Sections : `Demandes reçues` (`{prénom} veut voir ton profil.` + `Répondre →`), `Partages en cours` (avec libellé de portée `aveugle` / `essentiel seulement` / `sections choisies`), `Liens envoyés, pas encore utilisés`.

## 6.7 — Aperçu « fiche vue par un proche » `/moi/partage/apercu` ✅
(fichier : `src/app/moi/partage/apercu/page.tsx`)

- **Rôle** : prévisualisation condensée de ce que voient les proches (à la 3e personne), construite sur les sections cochées par défaut. Redirige vers `/moi` si pas de profil.
- **Accès** : connecté (`getUser()` → `/login?next=/moi/partage/apercu`). Desktop-gated.
- **On y arrive depuis** : la fiche `/moi` / le flux partage (via ProfileV2).
- **Elle mène vers** : `/moi` (« Fermer »).
- **Textes visibles (verbatim)** :
  - En-tête `Ta fiche, vue par un proche` ; bouton `Fermer`.
  - Bannière : `Tes proches voient une version utile, jamais intime. Candice garde les détails et les utilise pour les aider à viser juste.`
  - Sections : `Résumé` (vide → `Ton résumé apparaîtra ici dès que ta fiche sera analysée.`), `Son langage d'attention`, `Préférences clés`, `À éviter`, `Ses envies` (`{prénom} a choisi de ne pas partager cette section avec toi. Candice la connaît et s'en sert pour te faire les recommandations les plus justes.`).

## 6.8 — Répondre à une demande de partage `/moi/partage/demandes/[consentId]` ✅
(fichier : `src/app/moi/partage/demandes/[consentId]/page.tsx` ; via `DemandeClient`)

- **Rôle** : répondre à « X veut voir ton profil » — tout / sections choisies (socle verrouillé) / aveugle (rien de visible mais Candice peut aider) / refuser.
- **Accès** : connecté (`getUser()` → `/login?next=...`). Desktop-gated (préfixe `/moi`).
- **On y arrive depuis** : `/dashboard` et `/historique` (carte « X veut voir ton profil. Que partages-tu ? → »), `/moi/partage` (« Répondre → »).
- **Elle mène vers** : `/moi` (« Retour à ma fiche → »), et le choix envoyé (via `DemandeClient`).
- **Textes visibles (verbatim)** :
  - Demande introuvable : `Demande introuvable.` — `Ce lien ne correspond à aucune demande te concernant.`
  - Déjà répondu : `Tu as déjà répondu.` — `La demande de {prénom} a été refusée.` / `Ton choix de partage avec {prénom} est déjà enregistré.`
  - Lien `Retour à ma fiche →`. (Le formulaire de réponse est rendu par `DemandeClient`.)

---

# GROUPE 7 — Espace pilote : mes proches (/contacts)

## 7.1 — Mes proches `/contacts` ✅
(fichier : `src/app/contacts/page.tsx`)

- **Rôle** : liste des proches avec anneau de complétion (sans %), état Candice, tags (date proche, envie repérée), signal d'attention proactive, boutons d'action. Chips de filtre décoratifs. Utilise `V4Shell`.
- **Accès** : connecté (protégé middleware `/contacts` + `getUser()` → `/login`). Desktop-gated. Onglet « people » de la nav.
- **On y arrive depuis** : nav basse V4Shell (onglet proches), « ← Mes proches » de la fiche contact.
- **Elle mène vers** : `/contacts/new` (« + Ajouter »), `/contacts/[id]` (flèche, « Ouvrir », « Voir mon idée pour lui/elle »).
- **Textes visibles (verbatim)** :
  - Titre `Mes proches` ; bouton `+ Ajouter`.
  - Chips : `Tous`, `Famille`, `Amis`, `À affiner` (décoratifs).
  - État Candice (selon complétion) : `Candice connaît bien`, `Candice anticipe pour toi`, `Candice a quelques repères`, `Candice commence à apprendre`.
  - Étiquettes relation : `Conjoint·e`, `Ami·e`, `Famille`, `Collègue`, `Autre`.
  - Statut invitation : `Invitation envoyée · en attente`.
  - Tags : `{label} dans {n} j` (ou `aujourd'hui`), `Envie : {titre}`.
  - Signal : `Une attention prête pour {prénom}`.
  - Boutons : `Voir mon idée pour {lui/elle}`, `Ouvrir`.
  - Vide : `Aucun proche encore — Candice attend de les connaître.` — bouton `Ajouter un proche →`.

## 7.2 — Ajouter un proche `/contacts/new` ✅
(fichier : `src/app/contacts/new/page.tsx` ; flux via `NewContactFlow`)

- **Rôle** : création d'un profil de proche (choix du mode). `DashboardShell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated (préfixe `/contacts`).
- **On y arrive depuis** : `/contacts` (« + Ajouter »), `/dashboard` (« Ajouter un proche → »), aide (« Inviter un premier proche »).
- **Elle mène vers** : selon le flux (`NewContactFlow`).
- **Textes visibles (verbatim)** : sur-titre `Nouveau contact` ; titre `Ajouter quelqu'un.` ; `Choisis comment tu veux créer ce profil.` (Le reste est rendu par `NewContactFlow`.)

## 7.3 — Fiche d'un proche `/contacts/[id]` ✅
(fichier : `src/app/contacts/[id]/page.tsx`)

- **Rôle** : fiche détaillée d'un proche côté pilote. En-tête vert sombre (photo, nom, relation, badge « profil confirmé / invitation envoyée / pas encore invité(e) », état Candice). Corps : situation actuelle, notes rapides, analyse du proche s'il a rejoint Candice, partage bidirectionnel, « Ce que Candice sait » (traits), dates importantes, attentions (question proactive + reco), confidences, carnet d'envies (« À retenir »), cadence, mémoires (W1/W2). Nombreux états selon lien/invitation. `DashboardShell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated. `notFound()` si le contact n'appartient pas au user.
- **On y arrive depuis** : `/contacts` (flèche/Ouvrir), `/dashboard` (dates, suggestions, notes), `/historique` (nom du contact), workflows W1/W2, relance.
- **Elle mène vers** : `/contacts` (« ← Mes proches »), `/contacts/[id]/questionnaire` (« Compléter le profil → »), composants d'action (partage d'analyse, relance, cadence…).
- **Textes visibles (verbatim, sélection)** :
  - `← Mes proches`.
  - Badges : `Profil confirmé`, `Invitation envoyée`, `Pas encore invité(e)`.
  - États Candice : `Candice anticipe pour {prénom}`, `Candice connaît bien {prénom}`, `Candice commence à connaître {prénom}` ; note `Candice apprend votre histoire`.
  - Mode souvenir : `En souvenir — ce profil est conservé en lecture seule.`
  - Dividers : `{prénom} selon Candice`, `Partager avec ce proche`, `Connaître {prénom}`, `Ce que Candice sait`, `Dates importantes`, `Attentions pour {prénom}`, `Ce que tu m'as dit de {prénom}`, `À retenir`, `Fréquence d'attention`, `Ce que Candice retient`.
  - Sous-titres analyse proche : `Ce qui la/le touche`, `Comment lui montrer qu'on pense à elle/lui`, `À éviter`.
  - Relance : `Candice ne peut pas encore tout prendre en compte — {prénom} n'a pas terminé son profil.`
  - Partage A→B : `Ton analyse avec {prénom}` — `Partage l'analyse relationnelle avec {prénom} — uniquement ce que Candice a déduit, jamais tes notes ou données brutes.`
  - Partage B→A : `{prénom} partage son analyse avec toi` / `{prénom} t'a proposé de partager son analyse`.
  - États d'invitation : `Candice attend de connaître {prénom}.` — `Remplissez le profil pour que Candice puisse anticiper les bons gestes.` / `Envoyez-lui un lien ou remplissez le profil vous-même — Candice pourra alors anticiper les bons gestes.` ; `{prénom} est sur Candice.` — `Son analyse sera disponible dès qu'il ou elle aura répondu aux premières questions.` ; `L'invitation a été envoyée à {prénom}.` — `Dès qu'il ou elle crée son compte, Candice pourra anticiper les bons gestes pour lui ou elle.`
  - Bouton `Compléter le profil →`.
  - Libellés de traits (verbatim) : `Langage d'amour`, `Communication`, `Se sent apprécié(e) par`, `Énergie sociale`, `Sous stress`, `Valeurs fondamentales`, `Expression émotionnelle`, `Gestion des conflits`, `Prise de décision`, `Reconnaissance`, `Limites importantes`, `Développement`, `Loisirs`, `Cadeaux`.

## 7.4 — Questionnaire d'un proche (incognito) `/contacts/[id]/questionnaire` ✅
(fichier : `src/app/contacts/[id]/questionnaire/page.tsx` ; flux via `IncognitoFlow`)

- **Rôle** : le pilote remplit lui-même le profil d'un proche (« incognito »). Redirige vers la fiche si le proche a lié son propre compte.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated (préfixe `/contacts`). Redirige `/contacts` si contact absent, `/contacts/[id]` si `proche_user_id` existe.
- **On y arrive depuis** : `/contacts/[id]` (« Compléter le profil → »).
- **Elle mène vers** : contenu par `IncognitoFlow`.
- **Textes visibles (verbatim)** : aucun texte propre ; rendu par `IncognitoFlow`.

## 7.5 — Vue restreinte d'analyse partagée `/contacts/partage/[consentId]` ✅
(fichier : `src/app/contacts/partage/[consentId]/page.tsx` ; actions via `ConsentActions`)

- **Rôle** : ce que voit **B** après qu'un pilote lui a partagé une analyse — uniquement `profile_analysis` (jamais les données brutes). Gère les statuts du consentement : révoqué/refusé (message), en attente (prompt de consentement), actif (affichage de l'analyse à la 3e personne). Note : ce chemin est l'ancien mécanisme d'analyse partagée (distinct de `/fiche/[consentId]`, cf. groupe 8).
- **Accès** : connecté (`getUser()` → `/login?next=/contacts/partage/{id}`). **Attention** : préfixe `/partage` (pas `/contacts/partage`) est desktop-gated ; `/contacts/partage/...` commence par `/contacts` → donc **desktop-gated** via `/contacts`. `notFound()` si le consentement ne concerne pas ce user.
- **On y arrive depuis** : liens de partage d'analyse (via `ShareAnalysisButton` sur la fiche contact — non vérifié le chemin exact d'envoi).
- **Elle mène vers** : `/dashboard` (« Retour à l'accueil »).
- **Textes visibles (verbatim)** :
  - En-tête logo `CANDICE`.
  - Révoqué/refusé : `Ce partage n'est plus actif.` — `La personne qui avait partagé cette analyse a révoqué son partage.` / `Tu avais refusé de voir cette analyse.` ; lien `Retour à l'accueil`.
  - En attente : sur-titre `Demande de partage` ; titre `Quelqu'un veut partager une analyse avec toi.` ; `Candice a généré une analyse de toi à partir des informations partagées. Tu peux choisir de la voir — ou de ne pas la voir.` ; `Ce que tu verras : uniquement l'analyse relationnelle (ce que Candice retient de toi).` ; `Ce que tu ne verras jamais : les données brutes que l'autre personne a saisies.`
  - Analyse indisponible : `L'analyse n'est pas encore disponible.` — `Candice n'a pas encore généré d'analyse pour ce profil. Reviens dans quelques instants.`
  - Analyse active : sur-titre `Analyse relationnelle` ; titre `Ce que Candice retient de toi.` ; `Cette analyse est basée sur des informations partagées. Elle peut évoluer.` ; sous-sections `Ce que Candice retient`, libellés `Ce qui lui fait plaisir`, `Ce qui le·la touche`, `Cadeaux`, `À éviter`, `Style`, `Restaurants`, `Voyages`, `Loisirs & passions`, `Indispensables` ; note de bas : `Cette analyse ne contient que ce que Candice a déduit — jamais les informations brutes saisies par l'autre personne. Tu peux à tout moment demander la révocation de ce partage.`

---

# GROUPE 8 — Espace pilote : parler à Candice, recherche

## 8.1 — Parler à Candice `/parler-a-candice` ✅
(fichier : `src/app/parler-a-candice/page.tsx`)

- **Rôle** : menu d'intentions (« que veux-tu confier à Candice »). 7 cartes ; seules 2 sont actives (W1 « nouvelle », W2 « repéré »), les 5 autres sont visibles mais inactives (pas de lien). `V4Shell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : `/dashboard` (« Me raconter »), nav V4Shell (bouton central selon config).
- **Elle mène vers** : `/parler-a-candice/w1`, `/parler-a-candice/w2`.
- **Textes visibles (verbatim)** :
  - Titre `Que veux-tu confier à Candice ?` ; sous-titre `Choisis un point de départ. Ensuite, parle librement.`
  - Cartes (titre + description) :
    - `J'ai une nouvelle sur un proche` — `Partage ce qui se passe — Candice retient ce qui compte.` (active → w1)
    - `J'ai repéré quelque chose pour lui` — `Une photo, un lien, une description — Candice l'ajoute à son profil.` (active → w2)
    - `Quelqu'un ne va pas bien` — `Dis-moi ce qui se passe — je t'aide à être là.` (inactive)
    - `Je suis en conflit avec quelqu'un` — `Prends le temps d'y voir clair avant d'agir.` (inactive)
    - `Je prépare un événement` — `Anniversaire, fête, surprise — je m'occupe du reste.` (inactive)
    - `Je veux faire plaisir à quelqu'un` — `Pas d'occasion particulière, juste l'envie.` (inactive)
    - `Je veux mettre à jour une fiche` — `Quelque chose a changé — je note pour ne pas oublier.` (inactive)
    - `Je veux dire ce qui me ferait plaisir` — `Exprime une envie — Candice garde ça pour toi.` (inactive)
  - (Note : 8 cartes définies dans `ACTIONS`, 2 actives.)

## 8.2 — Workflow W1 (nouvelle sur un proche) `/parler-a-candice/w1` ✅
(fichier : `src/app/parler-a-candice/w1/page.tsx` ; flux via `W1Flow`)

- **Rôle** : flux « j'ai une nouvelle sur un proche ». Charge la liste des contacts, accepte `?contactId=`. `DashboardShell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : `/parler-a-candice` (carte « J'ai une nouvelle sur un proche »).
- **Elle mène vers** : contenu par `W1Flow`.
- **Textes visibles (verbatim)** : aucun texte propre ; rendu par `W1Flow`.

## 8.3 — Workflow W2 (repéré quelque chose) `/parler-a-candice/w2` ✅
(fichier : `src/app/parler-a-candice/w2/page.tsx` ; flux via `W2Flow`)

- **Rôle** : flux « j'ai repéré quelque chose pour lui ». Charge les contacts, accepte `?contactId=`. `DashboardShell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : `/parler-a-candice` (carte « J'ai repéré quelque chose pour lui »).
- **Elle mène vers** : contenu par `W2Flow`.
- **Textes visibles (verbatim)** : aucun texte propre ; rendu par `W2Flow`.

## 8.4 — Trouver quelqu'un `/recherche` ✅
(fichier : `src/app/recherche/page.tsx` ; via `RechercheClient` + `CancelRequestButton`)

- **Rôle** : chercher quelqu'un par @identifiant ou e-mail exact et demander à voir sa fiche (Sens 1 du partage). Exige questionnaire complet (5/5). Affiche les fiches partagées avec moi et mes demandes en attente. `V4Shell`.
- **Accès** : connecté (`getUser()` → `/login`). Non listé dans les préfixes desktop-gated → accessible sur desktop.
- **On y arrive depuis** : `/dashboard` (« Quelqu'un est déjà sur Candice ? Demande à voir sa fiche → »), nav V4Shell (onglet « people »), `/fiche/[consentId]` (« Retour à la recherche → »).
- **Elle mène vers** : `/moi/questionnaire` (si incomplet), `/fiche/[consentId]` (« Voir → »).
- **Textes visibles (verbatim)** :
  - Titre `Trouver quelqu'un` ; `Saisis l'identifiant exact ou l'email exact que la personne t'a donné. Rien n'est visible sans son accord explicite.`
  - Garde : `Ta fiche d'abord.` — `Pour chercher quelqu'un ou partager ta fiche, termine d'abord ton questionnaire — c'est ce qui permet à Candice d'être utile des deux côtés.` — bouton `Reprendre mon questionnaire →`.
  - Sections : `Partagées avec toi` (`Voir →`, mention `fiche protégée` si aveugle), `Demandes envoyées` (`En attente de réponse` + date + bouton annuler).

---

# GROUPE 9 — Espace pilote : paramètres

## 9.1 — Paramètres `/parametres` ✅
(fichier : `src/app/parametres/page.tsx`)

- **Rôle** : menu des réglages + déconnexion. `DashboardShell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : nav / menu (via V4Shell / DashboardShell — non vérifié le point d'entrée exact).
- **Elle mène vers** : `/dashboard` (« ← Accueil ») ; les 5 sous-pages ; déconnexion.
- **Textes visibles (verbatim)** :
  - `← Accueil` ; titre `Paramètres`.
  - Items (icône · libellé · description) : `👤 Mon compte` — `Adresse e-mail, mot de passe` (→ /parametres/compte) ; `🔔 Notifications` — `Fréquence et canal de contact` (→ /parametres/notifications) ; `🔒 Confidentialité` — `Données, suppression, export` (→ /parametres/confidentialite) ; `🔗 Profils partagés` — `Liens envoyés et réponses reçues` (→ /parametres/profils-partages) ; `💳 Abonnement` — `Plan, facturation, résiliation` (→ /parametres/abonnement).

## 9.2 — Mon compte `/parametres/compte` ✅
(fichier : `src/app/parametres/compte/page.tsx` ; via `CompteActions` + `HandleEditor`)

- **Rôle** : infos de compte (prénom lecture seule, @identifiant modifiable, e-mail, téléphone, + champs éditables sexe/profession/date de naissance). `DashboardShell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : `/parametres` (`Mon compte`), aide (« Compléter ton profil »).
- **Elle mène vers** : `/parametres` (« ← Paramètres »).
- **Textes visibles (verbatim)** : `← Paramètres` ; titre `Mon compte` ; libellés `Prénom`, `Adresse e-mail`, `Téléphone` (lecture seule). (Champs @identifiant et éditables via `HandleEditor` / `CompteActions`.)

## 9.3 — Abonnement `/parametres/abonnement` ✅
(fichier : `src/app/parametres/abonnement/page.tsx` ; via `AbonnementActions`)

- **Rôle** : plan, statut d'abonnement (essai/actif/pause/annulé), période d'essai restante, bouton d'abonnement (désactivé), reprise après pause, suppression programmée. `DashboardShell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : `/parametres` (`Abonnement`).
- **Elle mène vers** : `/parametres` (« ← Paramètres ») ; actions internes.
- **Textes visibles (verbatim)** :
  - `← Paramètres` ; titre `Abonnement`.
  - `Offre` — `Candice — 9 €/mois` — `1 mois d'essai offert. Sans engagement.`
  - `Statut` (libellés : `Essai gratuit`, `Actif`, `En pause`, `Silencieux`, `Annulé` ; pastille `Actif`/`En pause`/`Annulé`/`Essai`).
  - `Période d'essai` : `Essai illimité` / `Dernier jour` / `{n} jour(s) restant(s)` / `30 jours offerts`.
  - Bouton (désactivé) `Passer à l'abonnement` — `Disponible prochainement.`
  - Suppression : `Suppression programmée le {date}.`
- **Note de cohérence** : ici l'essai est décrit « 1 mois offert » et le calcul du décompte utilise **30 jours** (`Math.ceil(30 - daysElapsed)`), alors que /offre et les CGU disent « 14 jours ». Écart signalé.

## 9.4 — Confidentialité (réglages) `/parametres/confidentialite` ✅
(fichier : `src/app/parametres/confidentialite/page.tsx` ; via `ConfidentialiteActions`)

- **Rôle** : réglages de confidentialité côté compte (données, suppression, export). `DashboardShell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : `/parametres` (`Confidentialité`).
- **Elle mène vers** : `/parametres` (« ← Paramètres ») ; actions par `ConfidentialiteActions`.
- **Textes visibles (verbatim)** : `← Paramètres` ; titre `Confidentialité` ; `Tes données t'appartiennent.` (Le reste — export/suppression — dans `ConfidentialiteActions`.)

## 9.5 — Notifications `/parametres/notifications` ✅
(fichier : `src/app/parametres/notifications/page.tsx` ; via `NotificationSettings`)

- **Rôle** : préférences de notifications (push, e-mail, heures calmes, max/jour). Défauts : push activé, e-mail activé, heures calmes 21h–8h, max 2/jour. `DashboardShell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : `/parametres` (`Notifications`).
- **Elle mène vers** : `/parametres` (« ← Paramètres »).
- **Textes visibles (verbatim)** : `← Paramètres` ; titre `Notifications` ; `Choisissez comment Candice vous contacte.` (Les commandes sont dans `NotificationSettings`.)

## 9.6 — Profils partagés `/parametres/profils-partages` 🟡 (placeholder)
(fichier : `src/app/parametres/profils-partages/page.tsx`)

- **Rôle** : placeholder « bientôt » pour la gestion des fiches partagées / accès donnés. `DashboardShell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : `/parametres` (`Profils partagés`).
- **Elle mène vers** : `/parametres` (« ← Paramètres »).
- **Textes visibles (verbatim)** : `← Paramètres` ; titre `Profils partagés` ; `Bientôt.` ; `Tu pourras gérer ici les fiches que tu partages et les accès que tu as donnés.`

---

# GROUPE 10 — Placeholders & pages de service

## 10.1 — Agenda / Idées `/idees` 🟡 (placeholder)
(fichier : `src/app/idees/page.tsx`)

- **Rôle** : placeholder « bientôt » d'un agenda d'inspirations. Note : le titre affiché est `Agenda`, la route est `/idees`, l'onglet actif est `cal`. `V4Shell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : nav basse V4Shell (onglet calendrier/agenda — non vérifié).
- **Elle mène vers** : rien.
- **Textes visibles (verbatim)** : titre `Agenda` ; `Des inspirations personnalisées par occasion, saison et profil. Bientôt disponible.`

## 10.2 — Historique / Parler à Candice `/historique` ✅
(fichier : `src/app/historique/page.tsx`)

- **Rôle** : fil des confidences passées (ce que le pilote a confié à Candice), groupées par date, + les demandes de vue de profil reçues (« X veut voir ton profil »). Le titre affiché est `Parler à Candice`. `DashboardShell`.
- **Accès** : connecté (`getUser()` → `/login`). Desktop-gated.
- **On y arrive depuis** : nav / liens internes (non vérifié le point d'entrée exact ; c'est un préfixe desktop-gated dédié).
- **Elle mène vers** : `/moi/partage/demandes/[id]` (« Que partages-tu ? → »), `/contacts/[id]` (nom du contact).
- **Textes visibles (verbatim)** :
  - Titre `Parler à Candice`.
  - Demande reçue : `{prénom} veut voir ton profil.` + `Que partages-tu ? →`.
  - Vide : `Aucun échange pour l'instant.` — `Parlez à Candice depuis l'accueil — tout ce que vous lui confiez apparaîtra ici.`
  - Réponses de Candice préfixées `✦`. (Note : les confidences elles-mêmes sont citées telles qu'entrées par l'utilisateur.)

---

# GROUPE 11 — Proche / partage / invitations (vues tierces)

## 11.1 — Fiche partagée `/fiche/[consentId]` ✅
(fichier : `src/app/fiche/[consentId]/page.tsx` ; rendu par `ProfileV2`)

- **Rôle** : ce que **X** voit d'une fiche qu'**Y** a partagée avec lui (consentement actif). Rendu Profil V2 à la 3e personne, filtré selon le scope (`invite_filtre` ou `aveugle`). Les données non partagées sont vidées côté serveur. La wishlist n'est jamais partagée. Garde : le lecteur doit avoir son propre questionnaire complet (5/5).
- **Accès** : connecté (`getUser()` → `/login?next=/fiche/{id}`). Non desktop-gated (préfixe `/fiche` absent de la liste) → accessible sur desktop. `V4Shell` onglet « people ».
- **On y arrive depuis** : `/recherche` (« Voir → »), `/rejoindre/[token]` (redirection après réclamation).
- **Elle mène vers** : `/recherche` (« Retour à la recherche → »), `/moi/questionnaire` (si le lecteur n'a pas rempli sa fiche).
- **Textes visibles (verbatim)** :
  - Indisponible : `Ce partage a été retiré.` / `Fiche non disponible.` ; `La personne a retiré son partage — sa fiche n'est plus visible.` / `Ce lien ne correspond à aucune fiche partagée avec toi.` ; lien `Retour à la recherche →`.
  - Garde questionnaire : `{prénom} partage sa fiche avec toi.` — `Remplis d'abord ton questionnaire pour la découvrir — c'est ce qui permet à Candice d'être utile dans les deux sens.` — bouton `Remplir mon questionnaire →`.
  - Sinon : rendu `ProfileV2` (contenu hors fichier).

## 11.2 — Espace proche `/proche/[id]` ✅
(fichier : `src/app/proche/[id]/page.tsx` ; via `EspaceProcheShell`)

- **Rôle** : mini-app à 3 onglets sur un proche (le proche vu par Candice, comparatif « Nous », « Faire plaisir » = recos + carnet + envies écartées). Pour un contact non-utilisateur : synthèse minimale des faits connus, pas d'analyse LLM. Réapparition paresseuse des recos refusées pour raison budget/moment.
- **Accès** : connecté (`getAuthClaims()` → `/login?next=/proche/{id}`). Non desktop-gated (préfixe `/proche` absent de la liste). `notFound()` si le contact n'appartient pas au user.
- **On y arrive depuis** : liens internes vers l'espace proche (non vérifié le point d'entrée exact dans la nav/fiche).
- **Elle mène vers** : contenu par `EspaceProcheShell` (onglets).
- **Textes visibles (verbatim, propres au fichier)** : libellés de raison d'écart : `Pas son goût`, `Trop cher`, `Déjà offert`, `Pas le bon moment`, `Gardée pour une occasion`, `Écartée`. (Le reste de l'UI — onglets, titres, actions — est dans `EspaceProcheShell`.)

## 11.3 — Formulaire public d'un profil `/profil/[id]` ✅
(fichier : `src/app/profil/[id]/page.tsx` ; via `PublicForm`)

- **Rôle** : formulaire public par lequel un proche remplit le profil qu'un pilote a créé pour lui (5 min). Charge le contact via client admin (pas d'auth requise pour lire le nom).
- **Accès** : **public** (aucune vérification d'auth dans la page) — mais **desktop-gated** (préfixe `/profil/` dans la liste). Barrière bêta appliquée. `notFound()` si contact absent.
- **On y arrive depuis** : lien envoyé au proche (non vérifié le canal exact).
- **Elle mène vers** : soumission via `PublicForm`.
- **Textes visibles (verbatim)** :
  - En-tête logo `candice`.
  - Sur-titre `5 minutes` ; titre `Aide-nous à mieux prendre soin de toi.` ; `Quelqu'un qui tient à toi utilise Candice pour mieux te faire plaisir. Réponds honnêtement — tes réponses restent privées et ne servent qu'à ça.`
  - (Le formulaire est rendu par `PublicForm`.)

## 11.4 — Lien de profil (legacy) `/profil-partage/[token]` 🟡 (message « lien invalide »)
(fichier : `src/app/profil-partage/[token]/page.tsx`)

- **Rôle** : ancien mécanisme de lien de profil (`share_links`). N'affiche plus qu'un message « lien invalide » (lit le prénom de l'expéditeur pour personnaliser le message).
- **Accès** : public (bêta) ; **pas** desktop-gated (`/profil-partage/` distinct de `/profil/`, cf. commentaire du proxy).
- **On y arrive depuis** : anciens liens de partage (legacy).
- **Elle mène vers** : `/` (logo uniquement).
- **Textes visibles (verbatim)** : `Ce lien n'est plus valide.` ; `Demande à {prénom} de te renvoyer un nouveau lien d'invitation depuis son application Candice.` / `Demande à la personne qui t'a invité(e) de te renvoyer un lien depuis son application Candice.`

## 11.5 — Partage (neutralisé) `/partage/[id]` ⚫ (neutralisé)
(fichier : `src/app/partage/[id]/page.tsx`)

- **Rôle** : **neutralisé** (commentaire du code : l'accès à une fiche par simple connaissance de l'URL viole « jamais de profil sans autorisation explicite »). N'affiche qu'un message « lien invalide ».
- **Accès** : public (bêta) ; **desktop-gated** (préfixe `/partage`).
- **On y arrive depuis** : anciens liens.
- **Elle mène vers** : `/` (logo).
- **Textes visibles (verbatim)** : `Ce lien n'est plus valide.` ; `Demande à la personne qui t'a invité(e) de te renvoyer un lien depuis son application Candice.`

## 11.6 — Invitation d'un proche `/invite/[token]` ✅
(fichier : `src/app/invite/[token]/page.tsx` ; landing via `LandingInvite`)

- **Rôle** : landing d'invitation — un proche découvre que quelqu'un veut apprendre à lui faire plaisir, et démarre son compte + questionnaire. Vérifie la validité/expiration du token (`invite_links`) sinon `notFound()`. Sur desktop : affiche un QR code pour continuer sur mobile.
- **Accès** : public (bêta). Pas desktop-gated (mais l'UI propose le QR sur desktop).
- **On y arrive depuis** : lien d'invitation envoyé par le pilote.
- **Elle mène vers** : `/register?invite_token=...` (« Créer mon compte et commencer »).
- **Textes visibles (verbatim, via `LandingInvite`)** :
  - Titre `{prénom} veut apprendre à te faire vraiment plaisir.`
  - `Pas un cadeau au hasard, une fois par an. Les bonnes attentions, au bon moment — celles qui te ressemblent.`
  - `{prénom} utilise Candice pour mieux prendre soin des gens qui comptent. Là, c'est à toi que {prénom} pense.`
  - `Ce questionnaire, c'est ta façon de lui dire — sans avoir à le dire — ce qui te touche, ce qui te fait plaisir, et ce qu'il vaut mieux éviter. {prénom} n'en verra qu'une version résumée : les détails restent entre Candice et toi.`
  - Encart `Ce que tu y gagnes` : `Et ce n'est pas qu'un cadeau pour {prénom}. En le remplissant, tu repars avec :` ; puces `ta propre fiche Candice, rien que pour toi ;` / `ce que tu découvres sur votre façon de fonctionner, {prénom} et toi ;` / `un mois pour essayer Candice et mieux penser, toi aussi, à ceux que tu aimes.`
  - `Compte une vingtaine de minutes, au calme. Tu ne le rempliras qu'une fois dans ta vie — autant le faire bien. Candice t'accompagne, une question à la fois.`
  - Desktop : `Ouvre ce lien sur ton téléphone pour continuer.` / `Ou copie ce lien et ouvre-le dans ton navigateur mobile.`
  - Mobile : bouton `Créer mon compte et commencer` ; case `J'accepte les conditions et je démarre mon mois d'essai gratuit — sans carte bancaire, sans engagement.`

## 11.7 — Rejoindre (lien de fiche partagée) `/rejoindre/[token]` ✅
(fichier : `src/app/rejoindre/[token]/page.tsx`)

- **Rôle** : réception d'un lien de partage sortant (`profile_share_links`). Si connecté : réclamation immédiate → redirection `/fiche/[consentId]`. Sinon : porte d'entrée (créer un compte / se connecter). Gère lien à soi-même, lien invalide/expiré.
- **Accès** : public (bêta). Pas desktop-gated.
- **On y arrive depuis** : lien de partage de fiche envoyé par un pilote ; lien de confirmation e-mail (`share_token`).
- **Elle mène vers** : `/fiche/[consentId]` (réclamation réussie), `/moi/partage` (si c'est son propre lien), `/dashboard` (lien invalide, connecté), `/register?share_token=...&de=...` (« Créer mon compte gratuit → »), `/login?next=/rejoindre/{token}` (« J'ai déjà un compte »).
- **Textes visibles (verbatim)** :
  - Son propre lien : `C'est ton propre lien.` — `Envoie-le à la personne de ton choix — il s'activera chez elle.` ; lien `Gérer mes partages →`.
  - Lien invalide (connecté) : `Ce lien n'est plus valide.` — `Il a déjà été utilisé ou annulé. Demande à la personne de t'en générer un nouveau depuis son application Candice.` ; lien `Retour à l'accueil →`.
  - Lien invalide (déconnecté) : `Ce lien n'est plus valide.` — `Il a déjà été utilisé ou annulé. Demande à la personne de t'en générer un nouveau depuis son application Candice.`
  - Porte d'entrée : sur-titre `Fiche partagée` ; titre `{prénom} partage sa fiche avec toi.` ; `Sur Candice, chacun décrit ce qui lui fait vraiment plaisir — et choisit ce qu'il partage. Crée ton compte pour découvrir ce que {prénom} a choisi de te confier, et remplis ta fiche à ton tour.` ; boutons `Créer mon compte gratuit →`, `J'ai déjà un compte`.

---

# Récapitulatif — inventaire des pages

| # | Route | Groupe | Accès | Statut |
|---|-------|--------|-------|--------|
| 1 | `/` | Marketing | public | ✅ |
| 2 | `/concept` | Marketing | public | ✅ |
| 3 | `/fonctionnement` | Marketing | public | ✅ |
| 4 | `/offre` | Marketing | public | ✅ |
| 5 | `/contact` | Marketing | public | ✅ |
| 6 | `/mentions-legales` | Légal | public | ✅ |
| 7 | `/conditions-generales` | Légal | public | ✅ |
| 8 | `/confidentialite` | Légal | public | ✅ |
| 9 | `/login` | Auth | public | ✅ |
| 10 | `/register` | Auth | public | ✅ |
| 11 | `/beta-access` | Auth | public (hors bêta) | ✅ |
| 12 | `/continuer-sur-telephone` | Utilitaire | public | ✅ |
| 13 | `/design-preview` | Utilitaire | dev only (404 en prod) | 🟡 |
| 14 | `/dashboard` | Pilote | connecté · desktop-gated | ✅ |
| 15 | `/dashboard/archives` | Pilote | connecté · desktop-gated | ✅ |
| 16 | `/moi` | Pilote | connecté · desktop-gated | ✅ |
| 17 | `/moi/questionnaire` | Pilote | connecté · desktop-gated | ✅ |
| 18 | `/moi/discovery` | Pilote | connecté · desktop-gated | ✅ |
| 19 | `/moi/resultats` | Pilote | redirige → /moi | 🟡 |
| 20 | `/moi/wishlist` | Pilote | connecté · desktop-gated | ✅ |
| 21 | `/moi/partage` | Pilote | connecté · desktop-gated | ✅ |
| 22 | `/moi/partage/apercu` | Pilote | connecté · desktop-gated | ✅ |
| 23 | `/moi/partage/demandes/[consentId]` | Pilote | connecté · desktop-gated | ✅ |
| 24 | `/contacts` | Pilote | connecté · desktop-gated | ✅ |
| 25 | `/contacts/new` | Pilote | connecté · desktop-gated | ✅ |
| 26 | `/contacts/[id]` | Pilote | connecté · desktop-gated | ✅ |
| 27 | `/contacts/[id]/questionnaire` | Pilote | connecté · desktop-gated | ✅ |
| 28 | `/contacts/partage/[consentId]` | Tierce | connecté · desktop-gated (via /contacts) | ✅ |
| 29 | `/parler-a-candice` | Pilote | connecté · desktop-gated | ✅ |
| 30 | `/parler-a-candice/w1` | Pilote | connecté · desktop-gated | ✅ |
| 31 | `/parler-a-candice/w2` | Pilote | connecté · desktop-gated | ✅ |
| 32 | `/recherche` | Pilote | connecté | ✅ |
| 33 | `/parametres` | Pilote | connecté · desktop-gated | ✅ |
| 34 | `/parametres/compte` | Pilote | connecté · desktop-gated | ✅ |
| 35 | `/parametres/abonnement` | Pilote | connecté · desktop-gated | ✅ |
| 36 | `/parametres/confidentialite` | Pilote | connecté · desktop-gated | ✅ |
| 37 | `/parametres/notifications` | Pilote | connecté · desktop-gated | ✅ |
| 38 | `/parametres/profils-partages` | Pilote | connecté · desktop-gated | 🟡 |
| 39 | `/idees` | Placeholder | connecté · desktop-gated | 🟡 |
| 40 | `/historique` | Pilote | connecté · desktop-gated | ✅ |
| 41 | `/fiche/[consentId]` | Tierce | connecté | ✅ |
| 42 | `/proche/[id]` | Tierce/pilote | connecté | ✅ |
| 43 | `/profil/[id]` | Tierce | public · desktop-gated | ✅ |
| 44 | `/profil-partage/[token]` | Tierce | public | 🟡 |
| 45 | `/partage/[id]` | Tierce | public · desktop-gated | ⚫ |
| 46 | `/invite/[token]` | Tierce | public | ✅ |
| 47 | `/rejoindre/[token]` | Tierce | public | ✅ |

**Total : 47 pages** (`page.tsx`). Aucune omise. Le fichier `design-preview` renvoie 404 en production.
