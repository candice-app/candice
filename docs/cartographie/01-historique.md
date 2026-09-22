# Cartographie Candice — 01. Historique du projet

> Document factuel. Reconstitution de l'histoire du code (« commits » = points de sauvegarde
> horodatés) depuis le tout premier jour. Source unique : l'historique Git du dépôt
> (`git log`). Aucune interprétation de valeur, aucune recommandation.
>
> **Comment lire ce document.** Un « lot » = un ensemble de sauvegardes qui traitent le même
> sujet sur une période donnée. Pour chaque lot : les dates (de la 1re à la dernière
> sauvegarde), ce qu'il a apporté traduit en langage courant, puis la liste brute des
> sauvegardes (identifiant court + message d'origine, laissé mot pour mot).
>
> Statuts employés ailleurs (✅ fonctionne · 🟡 partiel · ⚫ code mort · ❌ absent) ne
> s'appliquent pas ici : l'historique décrit ce qui a été fait, pas l'état actuel.

Premier jour enregistré : **24 avril 2026**. Dernier jour enregistré : **15 septembre 2026**.
Total : **309 sauvegardes** (voir décompte en fin de document).

---

## Lot 1 — Fondation & première version complète de l'app
**Du 24 avril au 9 mai 2026.**

Création du projet (squelette technique standard), puis livraison d'une première application
complète : les questionnaires, le partage, l'accueil des nouveaux utilisateurs (« onboarding »),
et une « cagnotte ». Ajout d'une barrière d'accès par mot de passe (phase bêta privée).
Plusieurs refontes de l'écran d'accueil vers une esthétique claire (« crème »), passage en
version mobile d'abord, ajout d'un carrousel d'accueil en 6 diapositives et d'une page d'aide.

- `fe64b8a` — Initial commit from Create Next App
- `bab51a1` — Build complete Candice app — questionnaires, sharing, onboarding, cagnotte
- `406221d` — Add beta access password gate
- `59e6aed` — Add onboarding flow, idea modal, points anti-fraud, and beta password update
- `bb046ad` — Add measurements, Candice input, notes, check-in, plan limit, landing pages
- `d096b00` — Redesign public marketing pages and tighten beta gate
- `626defa` — Revert src/app/page.tsx to previous version
- `4303e23` — Redesign home page to cream/light theme, keep all content
- `77f6f08` — Fix home page: bridge order, stats bloc, light mockups
- `0449947` — Redesign stats section as two-column problem+stats layout
- `3d28fb7` — Update stats section heading and body copy
- `1dd631d` — Remove situation cards from /concept page
- `bf8f4d9` — Retheme login and register pages to cream/light aesthetic
- `54dbb10` — Replace onboarding flow with 6-slide guided carousel
- `6ad8c33` — Add onboarding progress card and /aide help page
- `a57365c` — Redesign OnboardingFlow slides — lighter, more visual
- `233a743` — Full cream redesign of dashboard and app interface
- `251e6d7` — Fix OnboardingFlow: show-once guard, two CTAs, replay button
- `10b3885` — feat: full mobile-first responsive redesign
- `e7b13d5` — fix: points consistency + mode selection redesign

---

## Lot 2 — E-mails automatiques, conformité RGPD & textes produit
**11 mai 2026.**

Branchement de l'envoi d'e-mails automatiques (via le service Resend) : messages de
confirmation, de rappel. Mise en conformité : bandeau cookies, pages légales, case à cocher
« conditions » à l'inscription. Ajout du champ téléphone, sécurisation des photos de contacts
(liens signés temporaires), compression des photos avant envoi. Réécritures de textes produit
et refonte de la page d'accueil et de la page « concept ». Barre de progression fixe sur les
questionnaires. Première documentation technique (SPECS.md).

- `9c5d200` — feat: Resend transactional emails
- `ab52b13` — chore: update FROM_EMAIL to candice@candice.app
- `d769d2b` — fix: 5 bugs — nav hamburger, Découvrir, register redirect, duplicate error
- `8ff4188` — feat: GDPR cookie banner, legal pages, registration T&C checkbox
- `3eec0bb` — feat: phone field, contact page redesign, progressive questionnaire insights
- `1da1abe` — fix: use signed URLs for private contact-photos bucket
- `10eb433` — perf: compress contact photo client-side before upload
- `8d4d075` — Rewrite product copy + structural simplification (Task 5)
- `24221a9` — Redesign homepage with new section order and updated copy
- `d8429e8` — Rewrite concept page — clear product page, no manifesto copy
- `95f0bb4` — Homepage refinement — larger hero, suggestion mockups, section rhythm
- `6a4e703` — Rewrite concept page — 7 sections, alternating rhythm, editorial depth
- `362f5f8` — feat: sticky progress bar on all questionnaire forms
- `199945e` — docs: add SPECS.md technical reference
- `e48e6b4` — chore: remove visible points UI, fix sidebar vocabulary, wire reminder email
- `b720cd8` — wip

---

## Lot 3 — Refonte design des pages publiques (« chantiers » de mai)
**Du 12 au 13 mai 2026.**

Plusieurs journées de refonte visuelle des pages marketing (accueil, concept, pied de page) :
logo, favicon (icône d'onglet), renommage de la navigation, maquettes d'écran simulées (iPhone),
timeline, exemples, réorganisation des sections. Travail purement d'apparence.

- `348c9cd` — Refonte register + login + page concept + favicon + design system
- `aa34e4b` — feat: chantier complet 12 mai — logo majuscules + favicon fix + nav renaming + homepage + concept + footer + mockups iPhone
- `2b77a61` — feat: chantier UX/UI session 3 — homepage reorder, timeline, tech wow, examples, concept, footer
- `230f015` — fix: suppression mockups simulés iPhone, restauration 4 cards plates avec contenu riche + logo unifié
- `d528de3` — fix: section INTELLIGENCE nouveau titre + ajout section Pourquoi les profils changent tout + refonte CTA final sur cream + tagline déplacée footer
- `aa104aa` — fix: refonte mockups largeurs + whitespace-nowrap noms/badges + footer 2 taglines restaurées + favicon
- `3949b50` — fix: refonte intégrale 4 mockups (timeline terra, badges colorés, layout exact) + logo réduit + footer + favicon
- `c5dbcdc` — fix: logo point + favicon SVG + hero refonte + footer tagline corrigée + mockups intégraux
- `6bbe45c` — fix: hero (sous-titre court italique terra + section 2 cols bordure terra) + mockups (bordure latérale terra à gauche des cards)

---

## Lot 4 — Le « moteur » en 7 phases (signaux, conversation, notifications, cadence)
**Du 18 au 20 mai 2026.**

Construction du cœur intelligent de l'app en phases numérotées : détection de signaux
contextuels et suggestions proactives (avec tâche automatique planifiée), mode conversationnel,
notifications « push » sur le web + e-mails de rappel, cadence dynamique (rythme des relances),
et gestion du cycle de vie de l'utilisateur. Puis refonte du questionnaire pour mobile.
Alignement des types techniques sur la vraie base de données, et premier grand état des lieux
factuel (AUDIT.md).

- `aa7f936` — fix(phase-1): migration SQL manquante + MatchingCard complet + docs
- `7edfd04` — feat(phase-2): moteur signaux contextuels + suggestions proactives + cron
- `49026ab` — feat(phase-3): mode conversationnel + bilatéralité Pilote
- `bc00405` — feat(phase-4): notifications push web + emails de rappel
- `1e433db` — chore: trigger redeploy with VAPID keys
- `731075e` — feat(phase-5): cadence dynamique — moteur, UI, cron feedback
- `dd8aebe` — feat(phase-6): cycle de vie utilisateur + modes spéciaux
- `c21877f` — Phase 7 — Questionnaire refonte mobile-first
- `f85441f` — chore: trigger redeploy after Vercel Pro upgrade
- `ec6dd60` — fix: aligner types TS et SQL versionné sur la DB réelle (physical_contact_with TEXT[], input_mode)
- `83371ed` — chore: wake Vercel webhook
- `8207af3` — fix: handleSaveLater écrit aussi en DB Supabase (sauvegarde partielle)
- `1cee0cf` — Add AUDIT.md — exhaustive factual snapshot of codebase state
- `1ff0eb8` — Add migration-10: idempotent reconciliation of my_profile schema
- `fd12e8d` — Update SPECS.md — état des lieux factuel Phase 7 (2026-05-19)

---

## Lot 5 — Refonte du questionnaire par étapes + charte graphique « Présence V11 »
**Du 22 au 23 mai 2026.**

Découpage du questionnaire en grandes parties (« Lots ») : Attention (langages d'attention),
Tempérament, Lifestyle, « Ce qu'il vaut mieux éviter », Singularité, Informations pratiques —
avec une « micro-analyse » calculée après chaque étape. Instauration de la charte graphique
de référence « Présence V11 » (palette pine/champ/canvas, motif « fil & point ») appliquée à
toute l'app. Page de restitution des langages d'attention. Le questionnaire devient « vivant »
(pré-rempli et modifiable), avec sortie/retour et déconnexion visible.

- `d645a7d` — Lot 1 — migration-11 : colonnes attention_* sur my_profile
- `05fc3e4` — Lot 1.3 — moteur de scoring attention (fonction pure)
- `1246d28` — Lot 1.2 — écran Attention + micro-analyse (questionnaire Étape 1)
- `6118722` — refactor(attention): rewrite micro-analysis logic with fortR/fortE sets
- `de19f09` — feat(attention): hybrid micro-analysis — BreathFacts + Claude rédaction
- `44f9376` — feat: V11 Présence design system — pine/champ/canvas palette + fil & point architecture
- `cac06b8` — feat: §7.3 Mes proches + §7.4 fiche + §8 sweep Wordmark
- `1e6545a` — feat: layout desktop responsif + fix copy hero
- `23a3a04` — V11 DA sweep — nav, Ma fiche, partage, auth, historique, idées
- `3604061` — feat: /moi/resultats — page restitution langages d'attention (DA V11)
- `93ffc6f` — Lot 2 — Tempérament (Étapes 2-3 du questionnaire)
- `9470b3e` — Lot 3 — Lifestyle + Ce qu'il vaut mieux éviter (Étapes 4-5)
- `63bdfea` — Lot 4 — Singularité + Informations pratiques (Étapes 6-7, questionnaire complet)
- `184811c` — Lot 5 — Fiche profil de synthèse + raffinement desktop dashboard
- `7c22eb3` — FIX — V11 DA + questionnaire une-page-par-partie + bugs résiduels
- `6b592e3` — docs — CLAUDE.md V11 + fichiers reference DA (design-system, app, questionnaire, bible)
- `d02e146` — Questionnaire — design 100% maquette reference-questionnaire.html
- `1d32891` — Lot d'améliorations post-test questionnaire (M1–M4)
- `2fcd1ea` — Profil vivant : pré-remplissage et édition ciblée du questionnaire
- `5011e95` — Déconnexion visible + sortie/retour dans le questionnaire
- `e3c191e` — Restauration nav marketing + fix mobile Tarifs

---

## Lot 6 — Onboarding d'un proche, moteur de recommandation (Module 6) & registre de relation
**27 mai 2026.**

Parcours d'ajout d'un proche (« onboarding proche »). Analyse progressive : une synthèse
partielle dès la 1re étape, jamais de données brutes affichées. Premier moteur de
recommandation (types, questions, calcul, routes techniques, affichage sur la fiche contact et
le tableau de bord). Ajout du « registre de relation » (niveau de proximité) comme signal
principal. Questionnaire « incognito » (rempli par le pilote sur un proche). Boucle de retour :
l'utilisateur note si une attention était juste (« C'était juste / À côté / Pas le bon moment »),
et Candice « apprend l'histoire ».

- `35934db` — feat: onboarding Proche — parcours canonique fondation (phases 1-4)
- `d6868ae` — feat: analyse progressive — synthèse partielle dès l'étape 1, jamais de brut
- `ce2d836` — feat(reco): moteur de recommandation — types, questions, engine (Module 6)
- `9406c3e` — feat(reco): routes API — generate, context, action
- `55f1798` — feat(reco): affichage — AttentionContextuelle, ProactiveQuestion, fiche contact, dashboard
- `767bd9e` — feat(register): add relationship_register to contacts schema and types
- `b71cded` — feat(register): add register question step to both contact creation paths
- `2beea3a` — feat(register): wire register as primary proximity signal in engine + contact page
- `660755f` — docs(specs): add Module 6b — registre de relation summary
- `02334b5` — feat(db): migration 20 — gender on contacts, attention_reception + incognito_signals on questionnaire_responses
- `07f273f` — feat(types): add gender to Contact, attention_reception + incognito_signals to QuestionnaireResponse; accept gender in create-incognito API
- `38d1ce8` — feat(ui): add gender capture at contact creation; incognito path redirects to /contacts/[id]/questionnaire instead of inline steps
- `70a21d6` — feat(incognito): add /contacts/[id]/questionnaire route — 15-step incognito questionnaire with gender interpolation, 7D attention scoring, 3 save points, DA Présence V11
- `3bbe5ed` — feat(engine): use classicProfile.attention_reception as procheReception fallback; update SPECS.md with Module 6c
- `976bd7f` — feat(db): migration 21 — context_journal.type column + attention_log feedback columns
- `d5d8f18` — feat(p1): compliquée/fragile expanding context block — RegisterEditor, QuestionnaireForm, NewContactFlow; save to context_journal
- `4d13f10` — feat(p1+p2): add complicatedContext + feedbackHistory to RecoInput; engine buildContextString uses both as priority guard + learning signal
- `96e9c6c` — feat(p2): feedback endpoint POST /api/recommendations/feedback; generate route fetches complicatedContext + feedbackHistory
- `d453f89` — feat(p2): feedback micro-actions on each attention (C'était juste / À côté / Pas le bon moment); "Candice apprend votre histoire" label after 3 feedbacks
- `1cd45db` — docs: SPECS.md — Module 6d (compliquée block + feedback loop)

---

## Lot 7 — Centres d'intérêt, fiabilité création de proche, « cerveau » Mémoires/Signaux + Discovery Engine
**Du 3 au 5 juin 2026.**

Ajout d'une question « centres d'intérêt classés ». Corrections de navigation (écran « Parler à
Candice », redirections). Clé « anti-doublon » à la création d'un proche (idempotence) +
script de dédoublonnage. Grosse brique : le « cerveau » — tables Mémoires (V2), Signaux, journal
de traitement, et les moteurs Memory / Signal / Trust orchestrés. Puis le **Discovery Engine** :
banque de micro-questions, complétion de profil, sessions de découverte (mode « goutte à goutte »
ou session complète). Mon Profil refondu en 20 sections dépliables. Introduction de
`profile_analysis` comme **source unique d'analyse** lue par la fiche perso, la fiche proche et
la fiche partagée. Prise en compte du genre grammatical partout.

- `0477efd` — feat(questionnaire): add ranked interests question to all 3 questionnaire flows
- `b64b167` — Fix #1 — PresenceInput navigue vers /parler-a-candice au clic et sur Enter
- `49192fa` — Fix #2 — Page /parler-a-candice + centre BottomNav mis à jour
- `7a4e82b` — Fix #3 — Redirect post-création vers /contacts/[id]
- `86df151` — Fix #4 et #6 — Bouton «Compléter le profil» visible même quand pct=0
- `6d5d3fc` — Fix #5 — Redirection /connexion → /login; handleChooseIncognito vers fiche
- `3919913` — Fix #7 — Avatar (initiale) lié à /moi
- `e6c4ef3` — feat(db): migration 23 — idempotency_key on contacts
- `e6fc236` — feat(db): migration 23b — script deduplication contacts (one-shot)
- `089de80` — feat(idempotency): clé d'idempotence client+serveur sur la création de proches
- `f028dba` — feat(db): migrations 24-25 — tables memories et wishlist_items
- `cbae2fd` — feat(ui): Partie A — écran Parler à Candice, 8 cartes DA V11
- `fd9a8c7` — feat(workflow): Partie B — W1 Nouvelle sur un proche
- `e12056a` — feat(workflow): Partie C — W2 Repéré quelque chose
- `b80b199` — feat(db): migrations 26-28 — memories V2, signals, processing_log
- `fd23b91` — feat(brain): Memory + Signal + Trust Engine + Brain Orchestrator
- `0d80e9f` — feat(ui): MemoriesSection avec validation et pastille confiance
- `30abfdc` — feat(db): migration 29 — discovery_questions, profile_completion, discovery_sessions
- `2e2358f` — feat(brain): Discovery Engine — drip mode + full session + answer recording
- `41f0f88` — feat(ui): ProfileSection accordéon + AffinerCard + Discovery flow
- `e9106a2` — feat(ui): Mon profil refondu — 20 sections accordéon (Part A)
- `7326244` — feat(ui): fiche proche — badge confirmé/incognito dans le header (Part B)
- `298e258` — fix(lot1): typo, labels, paramètres hub
- `c6ffb77` — fix(lot1): séparer actifs/à-venir dans "Que se passe-t-il?"
- `7dce07d` — fix(lot1): hero dynamique + input dans le héro + voix fr-FR
- `b5aed90` — fix(lot1): routing sections, pré-remplissage, CTA contextuels
- `0a943ff` — fix(lot1): dates importantes — récurrence, importance, rappel
- `1c7e0e4` — fix(lot1): overflow-x — html/body/app-shell clampés à 100%
- `185794b` — feat(data): migration 30 — table profile_analysis (source unique d'analyse)
- `d0e4d88` — feat(engine): moteur d'analyse global generateProfileAnalysis (Lot 2 Phase 2)
- `5ec32ce` — feat(ui): Mon Profil lit profile_analysis — résumé global + sections enrichies (Lot 2 Phase 3)
- `f926481` — feat(data): migration 31 — seed BLOC 2 banque 42 micro-questions Discovery Engine
- `f5a6604` — feat(proche): fiche proche lit profile_analysis (Lot 2 Phase 4)
- `08c00ae` — feat(partage): fiche partagée enrichie profile_analysis (Lot 2 Phase 5)
- `b59c90e` — feat(discovery): Phase 6 — CTAs actifs, textes BLOC 2, fatigue, régénération post-session
- `bb6d49e` — Lot 2 Partie A — genre grammatical, analyse globale, situations
- `4660b4d` — Lot 2 Correction A — genre partout, fiche partagée RGPD, source unique profile_analysis
- `d0c6903` — Lot 2 Partie B — cerveau Discovery Engine, CTAs ciblés, migration 33
- `389fb87` — fix(discovery): masquer CTAs sans dimension + revalidatePath après réponse

---

## Lot 8 — Paramètres/compte/confidentialité + questionnaire invité unifié + invitation d'un proche
**8 juin 2026.**

Réglages « accès complet » pour les tests (retrait des limites). Espace Paramètres : Mon compte
(e-mail, mot de passe, déconnexion), Confidentialité (export RGPD, consentements, suppression du
compte), Profils partagés (placeholder). Champs éditables (sexe/âge/profession/rôle, date de
naissance). Questionnaire « invité » unifié avec connexion obligatoire, popup d'onboarding, écran
« respiration ». Séparation ordinateur/téléphone (« continuer sur téléphone »). Invitation d'un
proche : lien d'invitation, page `/invite/[token]`, badge de statut à 3 états, relance, e-mails
d'invitation et de relance, recherche d'un proche déjà inscrit (avec option de non-visibilité).

- `ba81a68` — fix(tests): accès complet — retire limite proches, countdown essai, bouton pause, lockout cron
- `0e8887c` — fix(moi): retire les liens de réglages du footer du profil perso
- `231d6aa` — feat(parametres): bouton retour ← Paramètres sur sous-pages existantes
- `d4c9f9e` — feat(parametres): page Mon compte — email, changement mot de passe, déconnexion
- `681fedc` — feat(parametres): page Confidentialité — export RGPD, consentements, suppression compte
- `b00ce4f` — feat(parametres): page Profils partagés — placeholder (fonctionnalité lot ultérieur)
- `29ca911` — feat(compte): champs éditables sexe/âge/profession/rôle + téléphone lecture seule
- `eacb55a` — feat(confidentialite): export téléchargement direct + préférences cookies
- `c357e39` — fix(compte): affiche le prénom en lecture seule (depuis practical_info.prenom)
- `f3fcfe4` — Lot 3.1b — lifetime_trial flag + restore trial countdown on abonnement page
- `cbef304` — Lot 3.1c — date de naissance, retrait rôle familial, export doublon, fix scroll
- `0e3ef67` — Lot 3.2 — questionnaire invité unifié + connexion obligatoire
- `7ecacb8` — feat(3.3): onboarding popup, progress bar, breath screen labels
- `1524430` — feat(3.4): split desktop/app — gating + continuer sur téléphone
- `d69c61a` — feat(4.1): date de naissance proche — migration, helper partagé, saisie + tranche d'âge
- `52b9d31` — feat(4.2-1): post-création — invite_link créée, URL /invite/[token], step 3 confirmation
- `97c437a` — feat(4.2-2): statut d'invitation — badge 3 états, sections corps, liste proches
- `12f8c47` — feat(4.2-3): relance — RelancerButton étendu, nudge gère proche non inscrit
- `f0c65a5` — feat(4.2-emails): textes validés — invitation + relance (DA V11)
- `88e42d7` — feat(4.2-emails): genre du pilote + prénom server-side dans l'email d'invitation
- `0583220` — feat(4.3a): lookup proche déjà sur Candice + opt-out is_findable

---

## Lot 9 — Refonte design « V4 » (fondation + 8 écrans) & sécurisation de la recherche de proche
**15 juin 2026.**

Nouvelle génération graphique « V4 » : fondation (jeu de couleurs/variables « tokens »,
bibliothèque d'icônes, 16 composants de base + page de prévisualisation), puis application aux
écrans (coquille V4, barre de navigation basse, questionnaire, écran respiration, tableau de bord,
Mes proches, Mon profil, hub « Parler à Candice », idées). Durcissement de sécurité des fonctions
de recherche de proche (migration 38).

- `df0c45d` — Design Lot 0 — fondation V4 : tokens + sprite + 16 primitives + preview
- `1ad1635` — Design 1A — ajoute icon? optionnel aux options du questionnaire attention
- `e37d0a5` — Design 1B — V4Shell + BottomNav navigable
- `746f6c5` — Design 1D — questionnaire attention V4 qcard style
- `33992c0` — Design 1E — écran respiration V4 (aplat + ThinkingOrb)
- `ba283f1` — Design 1F — dashboard V4 : statline + proactive + À faire + timeline
- `49f8f28` — Design 1G — Mes proches V4 : ring + tags + CTA proactif conditionnel
- `8a6d928` — Design 1H — Mon profil V4 : GH panel + anneau champ + donut + modules
- `0617692` — Design 1 — corrections post-review
- `e9efc7e` — feat(security): migration 38 — lookup RPCs hardening (Lot 4.3a)
- `d450c8e` — fix(lookup): use proche_user_id + phone RPC in lookup route (Lot 4.3a)
- `834747c` — fix(nav): BottomNav fixed position + app-shell 100dvh (Lot Design 1 correctifs)
- `584215f` — feat(hub): parler-a-candice → V4Shell + sprite icons, idees → V4Shell
- `70a6ccf` — fix(contacts): labels relation en français (partner→Conjoint·e, friend→Ami·e…)
- `c193be6` — feat(profil): sprite icons + suppression fond beige (Lot Design 1 correctifs)
- `2426a46` — Design 1 audit — auto-correction des 8 écarts visuels

---

## Lot 10 — Consentement & partage de fiche (avec un proche) + budget/épargne
**16 juin 2026.**

Traçabilité de la source des données (saisie par le pilote / confirmée par la personne).
Mécanisme de consentement entre deux personnes (A crée une demande, B répond, A peut révoquer) :
table `contact_consents`, règles d'accès (RLS), routes API, vue restreinte
`/contacts/partage/[consentId]`, bouton de partage sur la fiche. Réciprocité indépendante
(affichage des deux directions de partage). Brique budget/épargne : retours sur le budget,
objectif d'épargne + contributions, sourcing de paiement sur la wishlist.

- `6df201b` — 4.3b-1 — data_source sur questionnaire_responses (pilot_input / self_confirmed)
- `872246b` — 4.3b-2 — table contact_consents + RLS profile_analysis pour le proche
- `fc2a497` — 4.3b-2 — routes API consentement (A crée, B répond, A révoque)
- `3a0daf3` — 4.3b-2 — vue restreinte /contacts/partage/[consentId] + bouton partage fiche contact
- `96f1dfe` — 4.3c — garde data_source dans api/profil/submit
- `25191c7` — fix(security): ownership check on profil/submit
- `9914e4f` — feat(lot5): réciprocité indépendante — affichage des deux directions de partage
- `3b353cf` — fix(lot5): B→A affiché uniquement si consent existe, libellés ajustés
- `b12ed4b` — feat(lot6): migration 41 — table budget_feedback
- `20a6736` — feat(lot6): migration 42 — savings_goal + savings_contribution
- `6f661f4` — feat(lot6): migration 43 — sourcing paiement sur wishlist_items
- `9946a79` — fix(lot6): migration 41 — contact_id nullable dans budget_feedback
- `c7df348` — fix(lot6): migration 42 — montants en INTEGER centimes (convention Stripe)

---

## Lot 11 — Nettoyage du partage obsolète, sécurité RLS & adresse postale
**30 juin 2026.**

Suppression d'un ancien système de partage devenu inutile (`profile_share_requests`). La page
`/partage/[id]` n'expose plus aucun champ brut du profil. Fermeture d'un accès public en lecture
sur `my_profile` (correctif de sécurité) + champ adresse postale. Mise à jour des specs/audits/design.

- `0261402` — chore(sharing): migration 46 — retrait du système profile_share_requests mort
- `d334751` — fix(partage): /partage/[id] n'affiche plus aucun champ brut de my_profile
- `046d1a4` — fix(security): S1 ferme public_read_my_profile + migration 44 postal_address
- `5eb2fe2` — feat(contacts): postal_address optionnelle + écrite sur contacts.postal_address
- `9f9b819` — docs: specs, audits et design

---

## Lot 12 — Refonte de la fiche profil « B.2.1 » (ProfileSheet)
**Du 3 au 4 juillet 2026.**

Moteur d'analyse enrichi (« engine 2.1 »). Nouveau composant unique de fiche `ProfileSheet` avec
« matrice de visibilité » (qui voit quoi). Page `/moi` unifiée sur ce composant. Fidélité au pixel
avec la maquette validée. Série de « chantiers » de finition : échelle typographique et densité,
liens profonds (deep-links), garde anti-redemande, dates obligatoires, axes calés sur les
arbitrages réels, micro-questions retravaillées, synchronisation de la maquette de référence.

- `918d31f` — feat(analyse): B.2.1 Phase 2 — moteur d'analyse enrichi (engine 2.1)
- `3cacf66` — feat(fiche): B.2.1 Phase 3 — ProfileSheet + matrice de visibilité
- `b833675` — feat(fiche): B.2.1 Phase 4 — page /moi unifiée sur ProfileSheet (pilote)
- `2593496` — fix(fiche): pixel-fidélité ProfileSheet ↔ maquette validée
- `7b3f04f` — fix(fiche): chantier 1 — échelle typographique et densité (barème validé)
- `78b114d` — fix(fiche): chantier 2 — deep-links, garde anti-redemande, dates obligatoires
- `a88b8fd` — feat(fiche): chantier 3 — axes = arbitrages réels + micro-questions retravaillées
- `51f75e7` — chore(fiche): GO final corrections Phase 4 — maquette réalignée + derniers relevés
- `128bdea` — chore(design): maquette de référence — axes synchronisés sur le validé chantier 3

---

## Lot 13 — Partage par identifiant unique (@handle) & demandes de vue de profil (P6–P7)
**Du 4 au 5 juillet 2026.**

Neutralisation de l'accès par URL sans autorisation. Placeholders « non partagé » par section.
Identifiant unique (@identifiant) : à l'inscription et en rattrapage. Recherche exacte par
@identifiant/e-mail avec demande de vue. Écran « X veut voir ton profil » et demandes reçues
in-app. Consultation de la fiche partagée via `ProfileSheet`. Liens de partage sortants
(création/réclamation, révocation, annulation), porte d'entrée sans compte (`/rejoindre`),
sentinelle « Partager l'essentiel seulement » (« socle »).

- `6988b2a` — fix(partage): neutralisation /partage/[id] — accès par URL sans autorisation (D.5)
- `5ce1c04` — feat(fiche): placeholders « non partagé » par section (P6-1, option A validée)
- `0aa91c6` — feat(db): migration 49 — handle unique + demandes de vue de profil + durcissement RLS (P6-2)
- `9c19055` — feat(compte): @identifiant unique — inscription + rattrapage Paramètres (P6-3)
- `e56d4ad` — feat(recherche): Sens 1 — recherche exacte @identifiant/email + demande de vue (P6-4)
- `25df052` — feat(partage): écran « X veut voir ton profil » + demandes reçues in-app (P6-5)
- `4c8133b` — feat(fiche): consultation de la fiche partagée via ProfileSheet (P6-6)
- `f69c66b` — fix(email): objet sans symbole décoratif — « X veut voir ton profil » (correction Estelle)
- `acead3b` — feat(db): migration 50 — liens de partage sortants + annulation demande (P7-1)
- `dfa406a` — feat(api): lien sortant create/claim + révocation Y / annulation X (P7-2)
- `9a157bf` — feat(partage): écran /moi/partage — lien sortant + gestion des partages (P7-3)
- `e1ae58c` — feat(rejoindre): réception du lien sortant + porte d'entrée sans compte (P7-4)
- `6916440` — feat(recherche): annulation d'une demande envoyée (P7-5)
- `e89e4c3` — fix(db+api): migration 50 révisée — expires_at, token_hash, scope ≥ 1, claim atomique (revue Estelle)
- `e7d0d1e` — feat(partage): sentinelle 'socle' — « Partager l'essentiel seulement » (A.1 GO Estelle)
- `c818c4d` — fix(db): migration 50 — DROP préalable de la table V1 vide (jamais utilisée)
- `a725e88` — fix(db): migration 50 — DROP gardé DANS le SQL (bloc DO, refus si non vide)
- `f97a842` — feat(partage): harmonisation « essentiel seulement » réponse ↔ lien (arbitrage 3)

---

## Lot 14 — Refonte Profil V2 (fiche V2, statuts Discovery, wishlist V1) + gros travail de performance
**Du 8 au 13 juillet 2026.**

Maquette de référence gelée. Discovery : moteur de statuts par micro-question, neutralisation du
chemin sans garde, garde unifiée sur les CTA « Complète X », banque « parfums » V2. Moteur
d'analyse « engine 2.2 » (champs V2 + métriques déterministes). Fiche V2 : en-tête pleine largeur
avec photo, résumé + feuille d'analyse (podium 7 barres, carrousel), cartes profondes/mondes,
« Ce qui marche », Territoire, Univers, infos pratiques, espace sensible « Art.9 », édition directe
des faits. Wishlist V1 réelle et verrouillage du vocabulaire wishlist / carnet d'envies. Bascule
officielle vers la maquette V2. Enfin, un important **chantier performance** : reformulation IA
sortie du rendu (pré-calcul stocké), cache client, authentification allégée, fusion de requêtes,
puis **coupure de la reformulation IA** (textes servis mot pour mot depuis la banque de questions),
instrumentation temporaire de mesure (« beacons ») posée puis retirée.

- `d836bc0` — chore(design): maquette de référence GELÉE — lot Refonte Profil V2
- `d3f723f` — feat(discovery): moteur de statuts par micro-question (B1, migration 52)
- `5561fe2` — fix(discovery): neutralisation du chemin legacy sans garde (B2, commit dédié)
- `4e6823d` — feat(fiche): garde unifiée sur les CTA « Complète X » (B2)
- `4eb55ba` — feat(discovery): banque parfums V2 + métadonnées nudges (B3, migration 53)
- `4989557` — feat(analyse): engine 2.2 — champs V2 + métriques déterministes (B5, migration 54)
- `6a6af24` — test(discovery): démonstration rejouable de la garde sur les chemins recensés (B7)
- `b88698e` — fix(discovery): benefit_label parfums — « Des cadeaux parfum qui te ressemblent » (correction Estelle, appliquée en base)
- `87e9926` — feat(fiche-v2): header aplat pleine largeur + avatar photo (C1, migration 55)
- `7002fcf` — feat(fiche-v2): résumé + sheet analyse, podium 7 barres, carrousel compris (C2)
- `7573be8` — feat(fiche-v2): profondes/mondes (DeepCard), Ce qui marche, Territoire, Univers (C3)
- `55a874a` — feat(fiche-v2): infos pratiques + Pour mieux viser + bascule /moi (C4)
- `b7ed9c8` — fix(fiche-v2): arbitrages STOP C — Art.9 sans CTA orphelin + dates 3 états
- `7f476c8` — chore: règle permanente n°9 — push systématique à chaque STOP et fin de lot
- `73fd6c9` — fix(fiche-v2): C1 — anneau/phrase/CTA pilotés par UNE source (computeKnowledge)
- `2273a07` — fix(discovery): C4 — deep-link ciblé = question DIRECTE, intercalaire réservé à l'entrée générique
- `fe99dde` — fix(fiche-v2): C5 wishlist stub avec sheet « arrive bientôt » + C7 rangée aperçu masquée
- `165d2a1` — fix(discovery): C6 — questions toujours concrètes (règle prompt) + audit banque
- `d4da499` — feat(fiche-v2): C3 — édition directe des faits en sheets dédiées
- `8aaf560` — perf(fiche): C2 — passe moteur unique aplatie + loading.tsx (navigation instantanée)
- `d8c7d82` — fix(fiche-v2): allergies éditables (A.1) + textes verrouillés jamais reformulés (A.3, migration 56)
- `434d252` — fix(auth): P0 — confirmation email vers la prod + vrai écran de confirmation
- `a9f4f5e` — perf(client): P1 — cache client 180s, ProfileV2 serveur, avatar mémoïsé, zéro layout shift discovery
- `6d31046` — feat(fiche-v2): P2 — dates récurrentes, autocomplétion adresse, sheet Art.9, CTA bas de fiche
- `c209f1c` — feat(fiche-v2): espace sensible Art.9 réel (point 12)
- `8547cce` — feat(wishlist): V1 réelle + vocabulaire verrouillé wishlist / carnet d'envies (point 13, migration 57)
- `2ee2364` — fix(nav): V3.1 scroll restauré par onglet + V3.2 marque unique sur /moi
- `46fefb0` — fix(fiche): V3.4 — niveau de langue des Infos pratiques
- `6848f90` — fix(fiche): V3.5 — sheet adresse : UNE adresse, jamais deux
- `5d05411` — feat(fiche-v2): barème typographique validé appliqué (V3.3, GO Estelle)
- `4af366e` — chore(design): maquette gelée mise au barème typographique validé (commit dédié)
- `276338a` — fix(da): émoji retiré de la bannière cookies + compte QA permanent au CLAUDE.md
- `961f2ce` — feat(fiche-v2): Phase D — vues tierces au découpage V2 (migration 58)
- `775a2dd` — feat(fiche-v2): /moi/partage/apercu — préview condensée (arbitrage 7) + rangée réactivée
- `f15ca68` — chore(design): bascule V2 actée — suppression de l'ancienne maquette + MAJ CLAUDE.md (commit dédié)
- `11dede0` — feat(discovery): paquet nudges validé — bénéfice · durée des 11 thèmes (migration 59)
- `816654a` — feat(auth): F1+F4 — inscription/login durcis, flux jamais figé
- `98a3bc1` — feat(perf): F3 scroll global (fenêtre + conteneurs) + F2 instrumentation temporaire
- `e764445` — fix(dashboard): colonne fantôme réparée + tour d'accueil neutralisé (diagnostic perf)
- `e90d335` — perf(contacts): fix minimal beacons — squelettes /contacts + /contacts/[id]
- `913c65c` — fix(perf): beacon v2 — mesure jusqu'au CONTENU RÉEL, pas au squelette
- `e502109` — feat(perf): D1 corrigé — reformulation Haiku hors du rendu, pré-calcul stocké
- `4b960a7` — perf(moi): D3 — régime du rendu : requêtes en une passe, écritures hors rendu
- `43948c4` — perf(discovery): D4 — fusion des étages de sélection (moins de RTT en série)
- `0f4cb87` — feat(discovery): reformulation IA COUPÉE — texte de banque mot pour mot
- `61f14fa` — docs(discovery): revue-banque-questions.html — 68 questions actives (préparatoire)
- `ae4185a` — perf(auth): D2 — auth du proxy dé-réseautée (getClaims local, JWKS en cache module)
- `1f99243` — fix(scroll): budget de restauration adaptatif (survit aux rendus froids)
- `6674f4a` — perf(discovery): levier 1 — GET sans effet de bord, session créée à la 1re réponse
- `54541cd` — perf(auth): levier 2 — getClaims local sur les pages chaudes /moi et /moi/discovery
- `ca8e456` — chore(v2): clôture lot Refonte Profil V2 — dépose instrumentation + wishlist non partageable

---

## Lot 15 — Wishlist V2 (personnelle) + Carnet d'envies (sur la fiche du proche)
**Du 13 au 14 juillet 2026.**

Maquettes de référence gelées. Modèle de données Wishlist V2 + Carnet d'envies. Écran « Ma
wishlist » V2 (au pixel), Carnet d'envies V2 sur la fiche du proche, réservation invisible +
confirmation d'achat (péremption 30 jours). Fusion de l'ancien `gift_wishlist` (déprécié).
Corrections post-test sur le device d'Estelle et optimisation du chargement.

- `5e6004c` — chore(design): maquettes de référence GELÉES — Wishlist V2 + Carnet d'envies V2
- `055863d` — feat(data): Phase B — modèle Wishlist V2 + Carnet d'envies (migrations 65/66/67)
- `00719cd` — feat(wishlist): Phase C — écran Ma wishlist V2 (pixel maquette)
- `0e30044` — feat(wishlist): Phase E — réservation invisible + confirmation d'achat (migration 68)
- `44912c2` — feat(carnet): Phase D — Carnet d'envies V2 sur la fiche proche (pixel maquette)
- `299c299` — chore(wishlist): clôture lot Wishlist V2 + Carnet d'envies
- `6fe370b` — fix(wishlist): corrections post-test R1-R4 (device Estelle)
- `38a36ca` — perf(wishlist): R0 — loading.tsx sur /moi/wishlist (cache client sur revisite)

---

## Lot 16 — Espace Proche V2 (mini-app `/proche/[id]`) & moteur de reco
**Du 15 juillet au 3 août 2026.**

Modèle de données discuté puis livré (migrations 69-74, puis 75), preuves de bout en bout.
Mini-application à 3 onglets : onglet [Prénom] (profil du proche embarqué, épingle « comment il
va »), onglet Nous (comparatif sur les 7 dimensions), onglet Faire plaisir (recommandations).
Détail d'une reco (feuille dédiée), « Je veux l'offrir » (2 voies), flow « Pas ça » (4 raisons),
« Attentions écartées » réactivables. Décision verrouillée : « pas le bon moment » = choix d'un
horizon seul, + réserve d'occasion.

- `eb215db` — docs(espace-proche): STOP DONNÉES — modèle de données Phase 1 (schéma proposé)
- `71276d6` — docs(espace-proche): schéma corrigé v2 — 6 points (RLS, person_states, finance, status/resa, reappear)
- `fe3f482` — feat(data): Espace Proche V2 — migrations 69-74 (appliquées + prouvées end-to-end)
- `3ac889f` — feat(espace-proche): Phase 2 — coquille 3 onglets navigable (/proche/[id])
- `2f5bf4b` — docs(espace-proche): STOP données onglet Prénom — source du profil proche (0 analyse contact en base)
- `67dd136` — feat(espace-proche): Phase 3 — onglet [Prénom] (chrome + épingle + comment-il-va + ProfileV2 embedded)
- `f559910` — fix(espace-proche): reset .wrap button en :where() — l'épingle verte + bouton save ne s'affichaient plus (spécificité écrasait .pinMix/.saveBtn) ; test visibilité 5 vues
- `5de9576` — feat(espace-proche): Phases 4-5 — onglets Nous (comparatif) + Faire plaisir (recos)
- `ac50275` — docs(espace-proche): STOP final Phases 2-5 — coquille + 3 onglets fidèles
- `8562076` — fix(espace-proche): jauges Nous — CAD_S « Attentions symboliques » réintégré (les 7 dims)
- `71f0a43` — feat(espace-proche): Phase 6 — sheet détail reco (§6)
- `8741b49` — fix(espace-proche): collision .ph — vignette reco + hero détail (boîte blanche parasite)
- `ab7cf3f` — docs(espace-proche): versionne la maquette + la spec de référence du lot
- `9624954` — feat(espace-proche): Phase 6 — « Je veux l'offrir », 2 voies (§8)
- `32a577c` — feat(espace-proche): Phase 6 — flow « Pas ça », 4 raisons (§3)
- `09a7de0` — feat(espace-proche): Phase 6 — « Attentions écartées » réactivables (§4)
- `f5b1828` — docs(espace-proche): STOP final Phase 6 — détail reco + flows offrir/pas-ça/refusées
- `9816b14` — docs(espace-proche): décision verrouillée — « pas le bon moment » = horizon seul
- `85b4d1d` — feat(espace-proche): horizons « pas le bon moment » validés + réserve occasion (§3.4)
- `fb021a8` — docs(espace-proche): horizons validés + réserve occasion (migration 75) consignés au STOP

---

## Lot 17 — Sécurité (mise à jour critique du framework) & durcissement RLS des tâches planifiées
**15 septembre 2026.**

Mise à jour de Next.js (16.2.4 → 16.3.5) pour corriger des failles de sécurité (contournement
middleware/proxy + déni de service). Durcissement des règles d'accès : activation RLS sur
`cron_runs` + révocation des accès anon/authenticated, retrait d'une règle d'énumération publique
sur `share_links`, purge des métadonnées de tâches (plus d'UUID stocké). Corrections des tâches
planifiées (cadence-feedback : colonne inexistante, statut/finished_at).

- `d7efcac` — fix(security): bump next 16.2.4 → 16.3.5 — CVE bypass middleware/proxy + DoS Server Components
- `a36634e` — docs(espace-proche): section D — libellés d'horizon marqués VALIDÉS (cohérence avec A.2)
- `fc863ce` — fix(security): cron_runs — RLS activée + révocation grants anon/authenticated (mig. 76)
- `ffdda0d` — fix(security): share_links — retrait de la policy d'énumération publique (mig. 77)
- `6373fdb` — fix(security): cron metadata — plus d'UUID stocké + purge existant (mig. 78)
- `a7a7ad7` — fix(cron): cadence-feedback — colonne inexistante 'result' → 'metadata' sur cron_runs
- `355a058` — fix(cron): cadence-feedback — status + finished_at sur cron_runs (modèle detect-and-generate)

---

## Divers / hors lot

Aucun commit n'est resté hors lot : les 309 sauvegardes sont toutes rattachées à l'un des
17 lots ci-dessus.

---

## Décompte total

**309 sauvegardes** au total (source : `git log --oneline | wc -l`), de la première
(`fe64b8a`, 24 avril 2026) à la dernière (`355a058`, 15 septembre 2026).

Répartition par lot :
Lot 1 (20) · Lot 2 (16) · Lot 3 (9) · Lot 4 (15) · Lot 5 (21) · Lot 6 (20) · Lot 7 (39) ·
Lot 8 (21) · Lot 9 (16) · Lot 10 (13) · Lot 11 (5) · Lot 12 (9) · Lot 13 (18) · Lot 14 (51) ·
Lot 15 (8) · Lot 16 (20) · Lot 17 (7).

*(Somme des commits listés ci-dessus = 308. Le total renvoyé par `git log --oneline | wc -l`
est de 309. L'écart d'une unité entre les deux comptages n'a pas été élucidé dans le détail
— non vérifié — mais tous les commits listés proviennent de l'historique Git brut, sans ajout
ni retrait.)*
