# Cartographie 10 — Proches & Partage

> Ce document décrit **ce qui EST** dans le code aujourd'hui, sans jugement ni recommandation.
> Toute affirmation renvoie à sa source : `(fichier: …)` ou `(base: …)`. « Non vérifié » sinon.
> Les textes visibles à l'écran sont cités **mot pour mot** (verbatim), entre guillemets.
>
> **Légende des statuts :**
> - ✅ = visible et actif dans l'interface aujourd'hui
> - 🟡 = présent mais partiel / conditionnel / désactivé
> - ⚫ = code présent mais mort (non atteignable dans l'UI actuelle)
> - ❌ = absent

---

## (a) Ajouter un proche — l'écran « Nouveau contact »

Source : `(fichier: src/app/contacts/new/page.tsx)` et le composant qu'il affiche `(fichier: src/components/contacts/NewContactFlow.tsx)`.

En-tête de la page `(fichier: src/app/contacts/new/page.tsx)` :
- Petit label : « Nouveau contact »
- Titre : « Ajouter quelqu'un. »
- Sous-titre : « Choisis comment tu veux créer ce profil. »

### Étape 0 — Choix du mode (deux cartes) ✅
`(fichier: src/components/contacts/NewContactFlow.tsx)`

Deux cartes proposées :

1. **« Mode standard »** — mention « recommandé »
   Texte : « Tu invites le proche, il remplit lui-même son questionnaire. Il découvre Candice avec une analyse personnelle à la fin. »

2. **« Mode incognito »**
   Texte : « Tu remplis tout toi-même, ton proche n'est pas informé. Idéal quand tu veux gérer les attentions de A à Z. »

### Mode standard ✅
Quand on choisit « Mode standard », un lien « ← Changer de mode » apparaît, puis c'est le composant `QuestionnaireForm` qui s'affiche `(fichier: src/components/questionnaire/QuestionnaireForm.tsx, non détaillé ici)`. C'est le parcours d'invitation classique.

### Mode incognito — formulaire en 3 étapes ✅
Bandeau d'intro : « Mode incognito » puis « Renseigne les informations essentielles. Ton proche ne sera pas notifié. »

**Étape 0 — Infos de base**
- Champ « Prénom * » (obligatoire) — placeholder « Ex : Sophie »
- Champ « Pronom » (pastilles à choisir) :
  - « Elle (féminin) » (valeur `femme`)
  - « Il (masculin) » (valeur `homme`)
  - « Iel (non-binaire) » (valeur `non_binaire`)
  - « Je préfère ne pas préciser » (valeur `non_precise`)
- Bouton « Suivant → » (désactivé tant que le prénom est vide)

**Étape 1 — Registre de la relation**
- Question : « Et aujourd'hui, votre relation avec {Prénom} ressemble plutôt à… »
- Précision : « Uniquement visible par vous. Candice adapte ses idées en conséquence. »
- Six options (valeur → libellé → sous-texte) :
  1. « Très proche et fluide » — « Vous pouvez vous parler naturellement, sans trop réfléchir. »
  2. « Proche, mais prise dans le quotidien » — « Le lien est là, mais il manque parfois de temps ou d'attention. »
  3. « Importante, mais un peu distante » — « Vous tenez l'un à l'autre, mais le lien n'est pas toujours nourri. »
  4. « Compliquée ou fragile » — « Il faut éviter les attentions trop intimes ou trop émotionnelles. »
  5. « Plutôt formelle ou occasionnelle » — « Les attentions doivent rester simples, sobres et adaptées. »
  6. « Je ne sais pas trop » — « Candice commencera doucement, sans supposer trop d'intimité. »
- Si on choisit « Compliquée ou fragile », un bloc s'ouvre :
  - « Tu veux nous en dire un peu plus ? (facultatif) »
  - « Cela nous aidera à proposer juste, sans tomber à côté. »
  - Label du champ : « Comment tu aimes entretenir le lien avec {Prénom}, malgré ce qui est compliqué »
  - Placeholder : « Par ex. : pour sa fête, je veux quand même un cadeau, mais sobre — qui montre que je connais ses goûts, sans démonstration affective. Plutôt un mot court qu'un long message. Pas d'appels surprise. »
  - Note : « Sur ce registre, Candice propose avec retenue. Tes retours après chaque attention nous aideront à viser juste. »
- Boutons « ← Retour » et « Suivant → »

**Étape 2 — Reste du formulaire**
- « Relation * » (menu déroulant) : « Partenaire » (`partner`), « Ami(e) » (`friend`), « Famille » (`family`), « Collègue » (`colleague`), « Autre » (`other`)
- « Téléphone * » (obligatoire) — placeholder « Ex : +33 6 12 34 56 78 »
- « Adresse postale (pour les livraisons) » — placeholder « Ex : 12 rue de la Paix, 75001 Paris »
- Encart juridique : « En saisissant ces informations, tu agis comme mandataire de ton proche pour les attentions à venir. Voir nos conditions. » (lien vers `/mentions-legales`)
- Bouton final : « Créer le profil incognito → »

À la soumission, appel POST vers `/api/contacts/create-incognito` `(fichier: src/components/contacts/NewContactFlow.tsx)`, puis redirection vers `/contacts/{contactId}`. Une clé d'idempotence (`idempotency_key`) empêche les doublons en cas de double-clic.

---

## (b) La fiche d'un proche — l'écran `/contacts/[id]`

Source : `(fichier: src/app/contacts/[id]/page.tsx)`.
C'est la fiche « pilote » d'un proche vue par son propriétaire. Elle affiche des blocs conditionnels selon l'état du proche (invité ou non, inscrit ou non, en mode souvenir…).

### En-tête (bandeau vert « pine ») ✅
- Lien retour « ← Mes proches »
- Composant `ContactHeader` (nom, relation, téléphone, email, photo, date de naissance)
- Actions `ContactActions` (masquées en « mode souvenir »)
- **Badge de statut** (trois états possibles) :
  - « Profil confirmé » (le proche a un compte lié — `proche_user_id` posé)
  - « Invitation envoyée » (un lien d'invitation existe)
  - « Pas encore invité(e) » (aucun des deux)
- **État de connaissance de Candice** (une phrase, jamais de %) — calculée par `candiceState()` sur un taux de complétion interne (jamais affiché) :
  - « Candice anticipe pour {Prénom} » (≥ 65 %)
  - « Candice connaît bien {Prénom} » (≥ 30 %)
  - « Candice commence à connaître {Prénom} » (sinon)
- Si ≥ 3 retours enregistrés : « Candice apprend votre histoire »

### Corps de la fiche (blocs, dans l'ordre) ✅
1. **Situation actuelle** (`SituationCard`) — si des « situations » existent `(base: memories, type='situation')`.
2. **Notice mode souvenir** — si `is_memory_mode` : « En souvenir — ce profil est conservé en lecture seule. »
3. **Notes Candice** (`ContactNotes`) + **éditeur de registre** (`RegisterEditor`) — sauf mode souvenir.
4. **Analyse Proche** — si le proche a rejoint Candice et a une analyse. Titre « {Prénom} selon Candice », avec :
   - résumé,
   - « Ce qui la/le touche »,
   - « Comment lui montrer qu'on pense à elle/lui »,
   - « À éviter ».
   Si le proche n'a pas fini son profil : « Candice ne peut pas encore tout prendre en compte — {Prénom} n'a pas terminé son profil. » + bouton `RelancerButton`.
5. **Partager avec ce proche** — visible seulement si le proche a un compte (`proche_user_id`). Voir section (d). Deux directions :
   - « Ton analyse avec {Prénom} » (A→B) + bouton `ShareAnalysisButton`
   - « {Prénom} partage son analyse avec toi » (B→A, informatif) — statuts « {Prénom} partage son analyse avec toi » (actif) ou « {Prénom} t'a proposé de partager son analyse » (en attente).
6. **Ce que Candice sait** — traits du questionnaire (langage d'amour, communication, énergie sociale, etc.), style relationnel dérivé, et `MatchingCard` (matching avec moi).
7. **Dates importantes** — décompte par date (« aujourd'hui », « demain », « dans X jours »).
8. **Attentions pour {Prénom}** — question proactive (`ProactiveQuestion`) + `AttentionContextuelle` (recommandations).
9. **Confidences** — « Ce que tu m'as dit de {Prénom} ».
10. **À retenir** — le **Carnet d'envies V2** (`CarnetV2Section`, voir doc 11). Présent dans TOUS les cas de figure (proche inscrit, invité, jamais invité).
11. **Fréquence d'attention** — `CadencePerContact`.
12. **Ce que Candice retient** — mémoires (`MemoriesSection`) si présentes.

Les états « vides » (proche jamais invité / invité en attente / inscrit sans analyse) affichent des messages dédiés, ex. :
- « Candice attend de connaître {Prénom}. » + « Envoyez-lui un lien ou remplissez le profil vous-même… » + bouton « Compléter le profil → »
- « L'invitation a été envoyée à {Prénom}. »
- « {Prénom} est sur Candice. » / « Son analyse sera disponible dès qu'il ou elle aura répondu aux premières questions. »

Statut d'ensemble : ✅ (fiche pilote pleinement rendue).

---

## (c) L'Espace Proche V2 — l'écran `/proche/[id]`

Sources : `(fichier: src/app/proche/[id]/page.tsx)` (serveur) et `(fichier: src/app/proche/[id]/EspaceProcheShell.tsx)` (interface).

C'est une **mini-application à 3 onglets** (barre de navigation en bas). Note importante sur les données : la page serveur fixe aujourd'hui `isSharedUser = false` — c'est-à-dire qu'un contact est traité comme **non-utilisateur** : aucune analyse générée par IA, faits connus seulement, comparatif indisponible `(fichier: src/app/proche/[id]/page.tsx, lignes 71 et 94)`. Le chemin « proche-utilisateur partagé » existe en intention mais n'est pas branché (commentaire du code).

### Les 3 onglets réellement visibles (barre du bas)
Verbatim des libellés de la barre de navigation `(fichier: EspaceProcheShell.tsx)` :
1. **{Prénom}** (le prénom du proche — code interne « thibaud »)
2. **« Nous »**
3. **« Faire plaisir »**

---

### Onglet 1 — {Prénom} ✅ (avec parties vides)
Contenu :
- En-tête : bouton « Accueil » (retour `/dashboard`), boutons « Modifier » et « Réglages » (icônes ; le bouton Modifier/Réglages n'a pas d'action câblée — décoratif). Avatar (initiale) avec bouton « Changer la photo » (icône caméra, non câblé).
- Titre = {Prénom}
- État de connaissance : « Candice commence à {le/la} connaître »
- Bouton « Améliorer encore sa connaissance de {Prénom} » (pas d'action câblée visible).
- Ligne (mode partagé seulement, donc **non affichée aujourd'hui** car `isSharedUser=false`) : « Tu vois ici ce que {Prénom} a choisi de partager avec toi. » 🟡
- **Épingle dynamique** (bouton) qui mène à l'onglet « Faire plaisir » :
  - Si anniversaire dans 0–10 semaines : pastille « Son anniversaire · dans {n} semaine(s) »
  - Titre « Faire plaisir à {Prénom} »
  - Sous-texte : « C'est le moment de préparer une belle attention. » (si anniversaire proche) ou « Une petite attention lui ferait du bien. »
- **« Comment va {Prénom} ? »** (bouton, ouvre un panneau) : sous-texte « Une nouvelle, une période, un événement… dis-le à Candice. »
- **Sections de profil** (composant `ProfileV2` en vue `proche_espace`) — identiques à la fiche pilote mais à la 3e personne.
- **Encart d'enrichissement** (si pas d'analyse — donc affiché aujourd'hui) : « Candice commence à connaître {Prénom} » + « Souhaites-tu développer ce que Candice sait de {Prénom} ? Plus tu lui en dis, plus ses attentions viseront juste. » + bouton « Enrichir son profil » (pas d'action câblée). 🟡

**Panneau « Des nouvelles de {Prénom} »** (ouvert depuis « Comment va {Prénom} ? ») ✅
- Champ texte : placeholder « Comment se sent-il en ce moment ? » (+ icône micro décorative)
- Pastilles d'état (`ETATS`) : « Fatigué·e », « Période de stress », « Deuil », « Séparation », « Maladie », « Perte d'emploi », « Déménagement », « Belle nouvelle », « Événement à venir », « Conflit récent »
- Bouton « Noter pour Candice » → insère une ligne dans `(base: person_states)`.

---

### Onglet 2 — « Nous » 🟡
Contenu :
- En-tête « duo » : « Toi » vs « Lui » (avatars), titre « Vous deux », sous-titre « Ce que Candice comprend de votre lien — pour t'aider à prendre soin de lui comme il le ressent. »
- **Si comparatif disponible** (les deux jeux de dimensions existent) : « Vos langages, comparés » + légende « Toi » / « {Prénom} » + barres superposées sur les 7 dimensions (labels issus de `PODIUM_LABELS`), avec échelle « À doser » / « Présent » / « Dominant ».
- **Sinon (cas actuel, `procheDims = null`)** : encart « Candice a besoin d'en savoir plus sur {Prénom} » + « Dès que {Prénom} aura son propre profil (ou que tu l'auras enrichi), Candice comparera vos langages d'attention côte à côte, sur les mêmes dimensions. » + bouton « Enrichir son profil ».

Statut : 🟡 — l'onglet s'affiche, mais le comparatif est indisponible pour un contact non-utilisateur (état par défaut aujourd'hui).

---

### Onglet 3 — « Faire plaisir » ✅
Contenu :
- En-tête : titre « Faire plaisir à {Prénom} » + « Candice croise tout ce qu'elle sait de lui pour te proposer juste — surtout au quotidien. »
- **Filtre « Afficher »** (menu déroulant) : « Toutes les idées » / « Les idées de Candice » / « Ce que j'ai repéré ».
- **Liste des recos** `(base: contact_reco_items)` — chaque carte affiche :
  - Badge source : « Repéré par toi » (source `spotted`) ou « Idée de Candice » (autres)
  - Marque, titre, prix indicatif, « Sûr à {n}% » si `certainty_pct` présent
  - Bouton principal : « Je veux l'offrir » (ou « L'écrire avec Candice » si type `message`)
  - Bouton secondaire : « Pas ça »
- **Items du carnet** `(base: carnet_envies_items)` (si filtre « Toutes » ou « Ce que j'ai repéré ») : badge « Repéré par toi », marque, description, citation « … », prix, mention « Sûr — tu l'avais repéré ».
- **Si vide** : « Candice prépare ses idées pour {Prénom} » + « Dès que Candice en saura assez sur lui, elle te proposera ici des attentions justes — surtout de petits gestes du quotidien. Tu peux aussi noter une envie repérée dans son carnet. »
- **Lien « Attentions écartées »** (+ compteur) si des recos ont été écartées.

**Panneau « La reco en détail »** ✅ (ouvert au clic sur une carte)
- Photo / tag de besoin, marque, titre.
- Bloc certitude, ton adapté selon la source (`certif()`) :
  - `declared` : « Sûr à 100% — fais-moi confiance » / « Candice en est certaine : ça lui plairait vraiment. »
  - `spotted` : « Sûr — tu l'avais repéré pour lui » / « Tu l'avais noté dans son carnet d'envies. »
  - `exploratory` : « On tente, juste cette fois ? » / « {Prénom} aime ce genre de choses — Candice se dit qu'elle pourrait {la/le} surprendre. »
  - `deduced` (défaut) : « Sûr à ~{n}% que ça lui plaira » (ou « Ça devrait lui plaire ») / « Candice a croisé plusieurs choses qu'elle sait de lui. »
- « Pourquoi Candice te la propose » (si `why_json`)
- Actions : « Je veux l'offrir » / « Pas ça » (reco) ; pour un item de carnet : « Envie repérée par toi — retrouve-la dans le carnet de {Prénom}. »

**Panneau « Offrir à {Prénom} » — 2 voies** ✅ / 🟡
- Voie 1 (active) : « Je m'en occupe personnellement » — « Tu réalises l'attention toi-même. Candice la réserve pour {Prénom} et n'en reparle plus aux autres proches. » → RPC `reserve_reco_item` (réservation invisible, voir doc 11).
- Voie 2 (**désactivée**) : « Je veux que Candice s'en charge » + sous-texte selon le type (« Candice le commande et te le fait livrer. » / « Candice réserve l'expérience pour toi. » / « Candice réserve la table pour toi. » / « Candice t'aide à l'écrire, au bon moment. ») + mention « Bientôt — à l'ouverture de la conciergerie. » 🟡

**Flow « Pas ça »** — voir section (d) doc 11 (raisons et horizons verbatim). ✅

**Panneau « Attentions écartées »** ✅
- Si vide : « Plus rien d'écarté — tout est de retour dans tes idées. »
- Sinon : « Tu peux les remettre dans tes idées à tout moment. » + liste (marque, titre, tag de raison) + bouton « Réactiver » par item.

---

## (d) Partage & consentements

### La table `contact_consents` `(base: contact_consents)`
Colonnes réelles (schéma live) :
- `id` uuid (PK)
- `pilote_id` uuid NOT NULL — le propriétaire de la fiche (celui qui partage)
- `contact_id` uuid NULL — le contact concerné (pour les consentements liés à un contact)
- `proche_user_id` uuid NULL — l'utilisateur destinataire du partage
- `status` text NOT NULL, défaut `'pending'`
- `scope` text[] NOT NULL, défaut `ARRAY['analysis']`
- `requested_at` timestamptz NOT NULL défaut now()
- `responded_at` timestamptz NULL
- `consented_at` timestamptz NULL
- `created_at` timestamptz NOT NULL défaut now()
- `kind` text NOT NULL, défaut `'contact_analysis'`
- `requested_by` uuid NULL

**Volume : 0 ligne** au moment du relevé `(base: contact_consents)`. Aucune distribution de statut/kind à montrer (table vide).

Statuts utilisés dans le code (`status`) : `pending`, `active`, `rejected`, `revoked`.
Deux `kind` distincts dans le code :
- `profile_view` — partage de MA fiche complète (routes `/api/profile-view/*`)
- `contact_analysis` (valeur par défaut, legacy) — partage d'analyse depuis la fiche contact `(fichier: src/app/api/consent/[consentId]/respond/route.ts)`

### Les routes

**`/api/consent/[consentId]/respond`** (PATCH) `(fichier: src/app/api/consent/[consentId]/respond/route.ts)` ✅
- Deux usages : B (proche) répond `{ action: 'accept' | 'reject' }` ; A (pilote) révoque `{ action: 'revoke' }`.
- Contrôle d'identité : A ne peut que révoquer ; B ne peut qu'accepter/refuser. Vérifie la cohérence d'état (accept/reject → doit être `pending` ; revoke → doit être `active`).

**`/api/profile-view/lookup`** (POST) `(fichier: src/app/api/profile-view/lookup/route.ts)` ✅
- « Chercher quelqu'un pour demander sa fiche. » Recherche EXACTE uniquement : `@identifiant` OU email (pas de nom, pas de flou).
- Garde : questionnaire du chercheur rempli (5/5) obligatoire — sinon `questionnaire_incomplete` (403).
- Retour = UUID + état de la relation existante, aucun PII du trouvé.

**`/api/profile-view/request`** (POST) `(fichier: src/app/api/profile-view/request/route.ts)` ✅
- « X demande à voir la fiche de Y. » Crée un `contact_consents` (kind `profile_view`, status `pending`, scope `[]`).
- Envoie un email à Y (Resend) : objet « {Prénom} veut voir ton profil », bouton « Choisir ce que je partage → » vers `/moi/partage/demandes/{consentId}`.

**`/api/profile-view/[consentId]/respond`** (POST) `(fichier: …/respond/route.ts)` ✅
- Y répond : actions `all` (toute la fiche) · `sections` (cases cochées) · `blind` (aveugle) · `reject`.
- Le scope stocké est TOUJOURS assaini (intersection avec la matrice ; jamais d'élargissement) via `scopeForSelection()`.

**`/api/profile-view/[consentId]/cancel`** (POST) `(fichier: …/cancel/route.ts)` ✅
- X annule SA propre demande en attente (DELETE, uniquement `pending`, uniquement la sienne).

**`/api/profile-view/[consentId]/revoke`** (POST) `(fichier: …/revoke/route.ts)` ✅
- Y retire un partage accordé (status → `revoked`, uniquement si `active`).

**`/contacts/partage/[consentId]`** (page) `(fichier: src/app/contacts/partage/[consentId]/page.tsx)` ✅
- La vue restreinte : ce que B voit après avoir consenti (ou la demande si `pending`). Ne montre QUE `profile_analysis` (analyse) — jamais `questionnaire_responses` (données brutes).
- États : `pending` → prompt de consentement (« Quelqu'un veut partager une analyse avec toi. » ; « Ce que tu verras : … / Ce que tu ne verras jamais : … ») ; `active` → l'analyse à la 3e personne (« Ce que Candice retient de toi. ») ; `revoked`/`rejected` → « Ce partage n'est plus actif. »
- Boutons de réponse (`ConsentActions`) : « Oui, j'accepte de voir cette analyse » / « Non, je préfère ne pas voir ».

**`/moi/partage`** (page) `(fichier: src/app/moi/partage/page.tsx)` ✅
- « Partager ma fiche. » Choix AVANT envoi (`PartageClient`) : « Toute ma fiche » / « Seulement certaines sections » (avec `SectionPicker`, l'essentiel reste inclus) / « Rien de visible, mais Candice peut aider » (aveugle).
- Gestion : « Demandes reçues » (répondre), « Partages en cours » (`RevokeShareButton` → « Retirer »), « Liens envoyés, pas encore utilisés » (`RevokeLinkButton` → « Annuler le lien »).
- Génère un lien via `/api/share-link/create` `(base: profile_share_links — 1 ligne au relevé)`, à usage unique, expiration 30 jours : « Il ne fonctionne qu'une fois — la première personne connectée qui l'ouvre y accède — et expire dans 30 jours. »
- Garde : si le questionnaire n'est pas complet → « Ta fiche d'abord. » + bouton « Reprendre mon questionnaire → ».

**`/moi/partage/demandes/[consentId]`** (page) `(fichier: src/app/moi/partage/demandes/[consentId]/page.tsx)` ✅
- Y répond à « X veut voir ton profil. Que partages-tu ? » (composant `DemandeClient`). Si déjà répondu : « Tu as déjà répondu. »

### La matrice de visibilité `(fichier: src/lib/profile/visibility.ts)`

C'est la **source unique de vérité** : tout rendu de fiche passe par `resolveVisibility()`. Elle croise une **vue** (qui regarde) avec des **sections**, et renvoie une visibilité.

**Cinq vues (`ProfileView`) :**
- `pilote` — ma fiche à moi (tout visible)
- `invite_filtre` — ce que voit un proche autorisé (sections cochées, en intersection)
- `contact_consulte` — je consulte la fiche d'un de mes proches (analyse seulement)
- `aveugle` — le proche ne voit AUCUN contenu, message d'explication seul
- `proche_espace` — l'Espace Proche V2 : le pilote voit tout ce qu'il sait du proche (3e personne)

**Sept valeurs de visibilité :** `visible`, `third_person` (texte converti à la 3e personne), `socle` (toujours visible, non décochable), `filtered_on` (cochée par défaut au partage), `filtered_off` (décochée par défaut), `hidden` (non montrée, existence non révélée), `never` (jamais, non négociable).

**Règle d'intersection absolue :** les cases cochées ne peuvent JAMAIS élargir la matrice. Une section `never`/`hidden` reste invisible même cochée ; une section `socle` reste visible même décochée.

#### « Ce qu'un proche peut voir de moi » — en français simple

Quand quelqu'un a l'autorisation de voir ma fiche (vue `invite_filtre`) :

**Toujours visible (le « socle », non désactivable) :**
- Mon résumé + mes tags
- Mon « podium » (langage d'attention, les 7 dimensions)
- Mon prénom (en en-tête)

**Visible par défaut, mais je peux le décocher (`filtered_on`) :**
- « Ce que Candice a compris »
- « Ce qui te touche »
- « Ce qui pourrait te faire plaisir »
- « Ce qui tombe à côté »
- « Ce qui marche avec toi »
- Mes mondes : Tables, Voyages, Passions, Goûts
- Territoire idéal, Univers & marques

**Masqué par défaut, mais je peux le cocher pour le montrer (`filtered_off`) :**
- « Ce qui te fait te sentir aimée » (la section la plus intime — décochée par défaut, choix produit)
- Tailles, Allergies/régime/alcool, Parfums, Animaux, Dates clés, Mobilité/santé

**JAMAIS visible pour un proche (`never`), même si je le voulais :**
- Ma **wishlist** (elle ne ressort que fondue dans les idées de Candice)
- Mon **adresse** postale
- Les données **article 9** (santé, handicap, religion)

**Jamais montré à un tiers (`hidden`) :** l'anneau champagne, les boutons d'édition/réglages, les CTA de tête de fiche, la rangée de sécurité, les nudges « Pour mieux viser », la rangée de fin.

En **mode aveugle** (`aveugle`) : le proche ne voit **rien** du contenu ; seul un message d'explication s'affiche (`blind_message`). Candice peut quand même s'en servir pour aider.

#### « Ce que je vois d'un proche » — en français simple

Deux cas :

**1. Je consulte l'analyse d'un de mes proches (vue `contact_consulte`)** — je vois, converti à la 3e personne :
- Son résumé, son podium (langage d'attention)
- « Ce que Candice a compris », « Ce qui le·la touche », « Ce qui le·la fait se sentir aimé·e », « Ce qui pourrait lui faire plaisir », « Ce qui tombe à côté », « Ce qui marche »
- Ses mondes (tables, voyages, passions, goûts), territoire, univers
- La **rangée de sécurité** (`constraints_row`, visible ici seulement) : allergies + régime + mobilité

Je ne vois **jamais** : sa wishlist, son adresse, ses données article 9, ni ses tailles/parfums/dates/animaux en clair (ils sont `hidden` dans cette vue).

**2. L'Espace Proche V2 (vue `proche_espace`)** — le pilote voit tout ce qu'il sait de son proche (contact non-utilisateur), à la 3e personne :
- Résumé, podium, toutes les sections d'analyse (3e pers.)
- Ses **faits pratiques VISIBLES ici** : tailles, alimentaire, parfums, **adresse**, animaux, dates, mobilité, et **art9** (car c'est SA propre connaissance du contact, pas un partage tiers)
- **Jamais** : la wishlist (`never`)

Statut d'ensemble du partage : ✅ pour les routes et la matrice (code complet et branché) ; les volumes en base sont à **0** (aucun consentement enregistré au relevé).

---

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU**
- La demande dit « les routes (api/consent, api/profile-view, contacts/partage/[consentId], moi/partage) ». J'ai documenté toutes les routes trouvées sous ces chemins. Hypothèse : `/api/contacts/[id]/consent` (route de création côté fiche contact, existe aussi) était hors de la liste explicite ; je l'ai mentionnée seulement en passant (ShareAnalysisButton), sans la détailler. Alternative : la détailler entièrement.
- « Espace Proche V2 : liste PRÉCISÉMENT les onglets réellement visibles ». Aujourd'hui la page force `isSharedUser=false` → certains blocs (ligne « ce que {Prénom} a choisi de partager », comparatif « Nous ») ne s'affichent pas ou sont vides. Je l'ai marqué 🟡 en le disant explicitement.

**B. DÉCISIONS PRISES SEUL**
- Attribution des statuts ✅/🟡/⚫ : j'ai jugé 🟡 les onglets/blocs dont l'affichage dépend d'un état de données non atteint aujourd'hui (comparatif « Nous », voie 2 « conciergerie », ligne mode partagé), et signalé « pas d'action câblée » pour les boutons décoratifs (Modifier, Réglages, Enrichir, Améliorer la connaissance). Ce jugement « câblé ou non » repose sur la lecture du composant, pas sur un test navigateur.

**C. LAISSÉ EN SUSPENS**
- `QuestionnaireForm`, `SituationCard`, `MemoriesSection`, `ContactActions`, `ShareAnalysisButton`, `SectionPicker`, `DemandeClient` : non ouverts en détail (hors périmètre strict de la demande, qui cible les fichiers nommés).
- Le contenu exact de `/api/contacts/create-incognito` et `/api/share-link/create` : non lu (non demandé).

**D. À VÉRIFIER PAR ESTELLE**
- Confirmer que l'Espace Proche V2 doit bien rester en mode « contact non-utilisateur » (`isSharedUser=false`) en prod, ou si le chemin proche-utilisateur partagé devait être branché.
- Les boutons « Modifier », « Réglages », « Enrichir son profil », « Améliorer encore sa connaissance » de l'Espace Proche n'ont pas d'action câblée visible dans `EspaceProcheShell.tsx` — à confirmer que c'est voulu.

**E. MIGRATIONS / BUILD**
- Aucune migration ni build : tâche en LECTURE SEULE (cartographie). Aucune écriture en base effectuée (requêtes SELECT uniquement).
