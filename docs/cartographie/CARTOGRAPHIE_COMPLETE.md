# CARTOGRAPHIE COMPLÈTE DE CANDICE

_Assemblage des 19 chapitres — généré le 2026-09-22, lecture seule._



---

<!-- ============ 00-index ============ -->

# Cartographie complète de Candice — Index

> Document de référence, purement descriptif. Il traduit en langage humain ce qui existe réellement dans le code et dans la base, tel quel, sans recommandation (sauf les chapitres 16 et 17 qui listent des constats factuels, toujours sans recommandation).
> Généré le 2026-09-22. Lecture seule : aucun code ni aucune donnée modifiés.

## Note sur la base de données interrogée

Tous les volumes cités dans ces chapitres proviennent de la **base réelle du projet**, atteinte via la variable d'environnement `SUPABASE_DB_URL` (le même accès a renvoyé, par exemple, `discovery_questions` = 70 lignes, `discovery_sessions` = 57, `cadence_log` = 31, `profile_analysis` = 2, `contacts` = 3). Ce n'est **pas** un environnement de test distinct. La base est en **état pré-lancement** : certaines tables sont peuplées, beaucoup d'autres sont encore vides (0 ligne). Quand un chapitre indique « 0 ligne », cela signifie que la fonctionnalité n'a pas encore produit de données, pas que la base serait fausse ou vide dans son ensemble.

## Chiffres bruts

| Élément | Nombre | Source |
|---|---|---|
| Sauvegardes Git (commits) | **309** | `git log` |
| Pages de l'application | **48** | `find src/app -name page.tsx` |
| Routes API | **87** | `find src/app/api -name route.ts` |
| Composants React | **100** | `find src/components -name *.tsx` |
| Tables en base (schéma public) | **42** | (base : pg_tables) |
| Fichiers de migration | **78** | `supabase-migration-*.sql` |
| Questions du questionnaire initial | **26 items à réponse contrainte obligatoires** + ~31 champs optionnels (singularité + pratique) | (fichier : src/lib + composants questionnaire) |
| Micro-questions Discovery en banque | **70** (68 actives, 2 archivées) | (base : discovery_questions) |
| Emails transactionnels | **14** envois distincts | `grep resend.emails.send` |
| Tâches automatiques (crons) | **4** | (fichier : vercel.json) |
| Tests automatisés | **165** tests dans **10** fichiers | `vitest run` |

## Sommaire des chapitres

- **00-index.md** — ce fichier : sommaire + chiffres bruts.
- **01-historique.md** — chronologie depuis le premier commit : les 17 lots successifs, dates, apports, commits.
- **02-stack-comptes-outils.md** — chaque service externe (Vercel, Supabase, Anthropic, Resend, Web Push…), les variables d'environnement (noms seulement), les dépendances et leur rôle.
- **03-pages.md** — les 48 pages, une par une : rôle, accès, liens, textes verbatim.
- **04-acces-authentification.md** — toutes les modalités d'accès et d'authentification, écrans, emails, erreurs.
- **05-parcours.md** — chaque typologie d'utilisateur, étape par étape.
- **06-questionnaire-initial.md** — toutes les questions verbatim, dans l'ordre, options, stockage.
- **07-analyse-profil.md** — le pipeline d'analyse, déterministe vs LLM, prompts verbatim, sorties.
- **08-micro-questions.md** — la banque des 70 micro-questions verbatim, sélection, statuts, jauge, incitations.
- **09-recommandations.md** — moteur reco, signaux, suggestions proactives, prompts verbatim, ce qui est branché ou non.
- **10-proches-partage.md** — ajout d'un proche, fiches, espace proche et ses onglets, partage, consentements, visibilité.
- **11-wishlist-carnet.md** — wishlist, carnet d'envies, réservation invisible, refus, attentions écartées.
- **12-emails-notifications.md** — chaque email : déclencheur, destinataire, objet et corps verbatim, traçabilité.
- **13-automatismes.md** — chaque cron : fréquence, rôle, coût, garde-fous.
- **14-base-de-donnees.md** — chaque table : rôle, colonnes, volume, règles d'accès en clair, tables mortes.
- **15-api.md** — les 87 routes par domaine : accès, rôle, client utilisateur ou admin, validation.
- **16-securite.md** — constats de sécurité factuels, avec gravité. Sans recommandation.
- **17-dette-et-incoherences.md** — code mort, TODO, doublons, incohérences, colonnes vides. Sans recommandation.
- **18-tests.md** — ce qui est testé, ce qui ne l'est pas.
- **CARTOGRAPHIE_COMPLETE.md** — les 19 chapitres assemblés en un seul fichier, pour impression.


---

<!-- ============ 01-historique ============ -->

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


---

<!-- ============ 02-stack-comptes-outils ============ -->

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


---

<!-- ============ 03-pages ============ -->

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


---

<!-- ============ 04-acces-authentification ============ -->

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


---

<!-- ============ 05-parcours ============ -->

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


---

<!-- ============ 06-questionnaire-initial ============ -->

# 06 — Questionnaire initial (pilote)

> Ce que le pilote remplit quand il crée / complète son profil. Ordre RÉEL de passation, libellés VERBATIM, options VERBATIM, colonne de stockage.
> Sources : `src/app/moi/questionnaire/QuestionnaireFlow.tsx` (ordre `STEP_ORDER`), les 8 composants d'étape, et les 3 banques de questions (`src/lib/attention/questions.ts`, `src/lib/temperament/questions.ts`, `src/lib/lifestyle/questions.ts`).
> Toutes les réponses sont écrites dans la table `my_profile` (base : `my_profile`), une ligne par pilote (`user_id`).

---

## Ordre réel de passation

Défini par `STEP_ORDER` (fichier : `src/app/moi/questionnaire/QuestionnaireFlow.tsx`, l.114-122). Les écrans « Breath » intercalaires (respiration Candice) ne sont pas des questions : ce sont des textes de transition générés après chaque bloc. L'ordre des ÉCRANS DE QUESTIONS est :

| # | Étape (Step) | Composant | Libellé bandeau | Bloc de questions |
|---|---|---|---|---|
| 0 | `gender` | `GenderStep.tsx` | « Avant de commencer » | 2 questions |
| 1 | `attention` | `AttentionStep.tsx` | « 01 — 07 » Langage d'attention | 4 questions réception (q1-q4) + 1 expression (qe) |
| 2 | `temperament2` | `TemperamentStep.tsx` | « 02 — 07 » Mon énergie relationnelle | q5-q8 |
| 3 | `temperament3` | `TemperamentStep.tsx` | « 03 — 07 » Communication & décision | q9-q11 |
| 4 | `lifestyle4` | `LifestyleStep.tsx` | « 04 — 07 » Ce que j'aime vivre | q12-q16, q4a-q4d (9 questions) |
| 5 | `lifestyle5` | `AvoidStep.tsx` | « 05 — 07 » Ce qu'il vaut mieux éviter | q17 (texte libre) + q18 + q19 |
| 6 | `singularity6` | `SingularityStep.tsx` | « 06 — 07 » Ce qui me rend unique | centres d'intérêt + 11 champs texte libre |
| 7 | `practical7` | `PracticalStep.tsx` | « 07 — 07 » Informations pratiques | identité, alimentation, tailles, goûts, agenda… |

Après chaque étape, `triggerSynthesis()` appelle `POST /api/profile/generate` (fire-and-forget) pour recalculer l'analyse. À la fin : écran `ClosingMoment`.

Statut de l'écran : ✅ tout est câblé et actif.

**Écran d'accueil (`OnboardingPopup`)** : montré une seule fois aux nouveaux profils avant `gender` ; `EditMenu` (menu de modification) montré aux profils existants (permet de reprendre, sauter à une partie via `?part=`, ou tout refaire).

---

## Étape 0 — Genre (`GenderStep.tsx`)

Eyebrow : **« Avant de commencer »**

### Q0.1 — Adresse grammaticale
- **Libellé VERBATIM :** « Comment veux-tu que Candice s'adresse à toi ? »
- **Type :** choix unique (boutons)
- **Obligatoire :** OUI (le bouton « Continuer » reste inactif tant que rien n'est choisi)
- **Options VERBATIM** (`GRAMMATICAL_OPTIONS`) :
  - « Au féminin » → `feminine`
  - « Au masculin » → `masculine`
  - « En neutre » → `neutral`
  - « Je préfère ne pas préciser » → `unspecified`
- **Colonne :** `my_profile.grammatical_gender` (valeur = la string ci-dessus)

### Q0.2 — Orientation de style
- **Libellé VERBATIM :** « Pour les vêtements, accessoires et parfums, tu te retrouves le plus dans… »
- **Sous-texte VERBATIM :** « Plusieurs réponses possibles »
- **Type :** choix multiple
- **Obligatoire :** NON
- **Options VERBATIM** (`STYLE_OPTIONS`) :
  - « Les rayons femme » → `femme`
  - « Les rayons homme » → `homme`
  - « Les deux, selon les pièces » → `mixte`
  - « Plutôt unisexe ou non genré » → `unisexe`
  - « Ça dépend, mieux vaut me demander » → `depends`
- **Colonne :** `my_profile.style_gender_orientation` (tableau, ou `null` si vide)

---

## Étape 1 — Langage d'attention (`AttentionStep.tsx`)

Eyebrow : **« Candice apprend ton langage d'attention »**. Chaque bloc de question porte le sur-titre **« Candice t'écoute »**.

Mécanique commune aux 5 questions : on choisit **jusqu'à 3 réponses, la 1re compte le plus** (classement s1/s2/s3, badge de rang). Micro-texte VERBATIM sous q1-q4 : « Choisis jusqu'à 3 réponses. La première compte le plus. »
**Obligatoire :** OUI pour les 5 questions (le CTA « Continuer » exige que les 5 aient au moins une réponse).
Chaque option porte des dimensions internes (`dims`) parmi : MOT, SER, CAD_C, CAD_S, EXP, GES, SUR (jamais affichées).

Source : `src/lib/attention/questions.ts`.

### Q1 (`q1`) — « Je me sens le plus aimé(e) quand … »
| id | Label VERBATIM | Sous-texte VERBATIM | dims |
|---|---|---|---|
| q1a | On me dit des mots sincères | Un compliment vrai, une reconnaissance dite à voix haute. | MOT |
| q1b | On m'aide concrètement sans que je demande | Quelqu'un qui allège ma charge avant même que je l'exprime. | SER, GES |
| q1c | On me fait un cadeau pensé spécialement pour moi | Un objet choisi pour moi, pas acheté au hasard. | CAD_C |
| q1d | On me fait un cadeau chargé de sens | Quelque chose qui porte une histoire, une intention. | CAD_S |
| q1e | On me consacre un vrai moment de qualité | Du temps pleinement présent, sans distraction ni écran. | EXP |
| q1f | On pense à moi dans les petits détails du quotidien | Des micro-attentions régulières, pas réservées aux grandes occasions. | GES |
| q1g | On me surprend avec quelque chose d'inattendu | L'imprévu, l'effet de surprise qui crée l'émotion. | SUR |

### Q2 (`q2`) — « Une attention réussie, pour moi, c'est surtout … »
| id | Label VERBATIM | Sous-texte VERBATIM | dims |
|---|---|---|---|
| q2a | Quelque chose qui montre qu'on m'a écouté(e) | La preuve qu'on a retenu un détail que j'avais glissé. | CAD_C, GES |
| q2b | Quelque chose qui tombe au bon moment | Le bon geste, juste quand j'en avais besoin. | GES, SER |
| q2c | Quelque chose qui crée un souvenir | Un moment ou un objet dont on reparlera plus tard. | EXP, CAD_S |
| q2d | Quelque chose qui me facilite vraiment la vie | Une aide qui retire un poids concret de mes épaules. | SER |
| q2e | Quelque chose de simple mais sincère | Peu importe le prix, ce qui compte c'est l'intention. | MOT, GES |
| q2f | Quelque chose que je n'avais pas vu venir | L'effet de surprise, ce petit choc heureux. | SUR |
| q2g | Quelque chose de beau, choisi avec goût | Le soin, l'esthétique, la qualité du choix. | CAD_C |

### Q3 (`q3`) — « Ce qui me touche le plus durablement … »
| id | Label VERBATIM | Sous-texte VERBATIM | dims |
|---|---|---|---|
| q3a | Une phrase qui reste en tête | Des mots que je me répète encore longtemps après. | MOT |
| q3b | Un geste fait sans bruit, mais au bon moment | Une attention discrète qui montre qu'on a vu mon besoin. | GES, SER |
| q3c | Un objet qui a une histoire | Quelque chose chargé de mémoire, pas juste neuf. | CAD_S |
| q3d | Une expérience partagée dont on reparlera longtemps | Un moment vécu ensemble qui devient un repère commun. | EXP |
| q3e | Une surprise parfaitement pensée | L'imprévu, mais préparé avec soin et justesse. | SUR, CAD_C |
| q3f | Une aide concrète quand j'en ai vraiment besoin | Un soutien réel dans les moments où je manque de ressources. | SER |
| q3g | Un détail qui prouve qu'on me connaît vraiment | Le petit signe qui dit : on me connaît pour de vrai. | CAD_C, GES |

### Q4 (`q4`) — « Entre deux attentions, je préfère … »
| id | Label VERBATIM | Sous-texte VERBATIM | dims |
|---|---|---|---|
| q4a | Une petite attention régulière | La constance vaut mieux qu'un grand geste isolé. | GES |
| q4b | Un grand moment rare mais marquant | Peu souvent, mais quelque chose qu'on n'oublie pas. | EXP |
| q4c | Une aide concrète quand j'en ai besoin | Du soutien réel plutôt que des mots. | SER |
| q4d | Un mot sincère au bon moment | La bonne phrase, dite au moment juste. | MOT |
| q4e | Un cadeau qui a du sens | Le symbole compte plus que la valeur. | CAD_S |
| q4f | Une surprise qui casse la routine | L'inattendu qui réveille le quotidien. | SUR |
| q4g | Un objet choisi avec précision | Le bon objet, choisi avec exigence et justesse. | CAD_C |

*(Note : cet `q4` « attention » est distinct des `q4a`-`q4d` du lifestyle — même préfixe, banques différentes.)*

### QE (`qe`) — Expression (sous séparateur « Comment tu donnes »)
- **Libellé VERBATIM :** « Et toi, comment montres-tu naturellement ton attention aux autres ? »
- **Micro VERBATIM :** « Choisis jusqu'à 3 réponses. Cela aidera Candice à comprendre les décalages possibles entre ce que tu donnes naturellement et ce que les autres attendent. »

| id | Label VERBATIM | Sous-texte VERBATIM | dims |
|---|---|---|---|
| qea | Je dis ce que je ressens, je complimente, je rassure | Je mets des mots sur ce que je ressens pour les autres. | MOT |
| qeb | J'aide, je rends service sans qu'on me le demande | Je montre que je tiens à quelqu'un en l'aidant concrètement. | SER |
| qec | J'offre des cadeaux choisis avec soin | Je traduis mon affection par un objet bien choisi. | CAD_C |
| qed | J'offre des choses qui ont du sens, une histoire | J'aime les attentions chargées de symbole. | CAD_S |
| qee | Je passe du vrai temps de qualité avec les gens | Ma façon d'aimer, c'est d'être pleinement présent(e). | EXP |
| qef | J'ai mille petites attentions au quotidien | Je montre que je pense à l'autre dans les détails. | GES |
| qeg | J'aime faire des surprises | J'exprime mon affection en créant de l'inattendu. | SUR |

**Colonnes (étape 1) :**
- `my_profile.attention_answers` — réponses brutes (JSON `{reception: [...], expression: [...]}`)
- `my_profile.attention_reception` — scoring réception (dominant/secondaire/tertiaire), calculé en code (`scoreAttention`)
- `my_profile.attention_expression` — scoring expression
- `my_profile.attention_computed_at` — horodatage
- `my_profile.attention_breath_text` — texte de respiration généré (via `POST /api/attention/breath`)

---

## Étape 2 — Mon énergie relationnelle (`TemperamentStep.tsx`, `STEP2_QUESTIONS`)

Eyebrow : **« Mon énergie relationnelle »**. Type : **choix unique** par question. Micro VERBATIM (q5-q11) : « Choisis la réponse qui te ressemble le plus. » **Obligatoire :** OUI (les 4 doivent être répondues). Chaque option porte des `deltas` (axes tempérament) et parfois un `mode` (conflit/stress/décision/canal), non affichés.
Source : `src/lib/temperament/questions.ts`.

### Q5 (`q5`) — « Quand je recharge mes batteries… »
- q5_1 « J'ai besoin de moments seul(e) » — « Le calme et la solitude me régénèrent vraiment. »
- q5_2 « Je préfère les petits groupes » — « Quelques personnes proches plutôt qu'une foule. »
- q5_3 « Ça dépend des jours » — « Mon énergie sociale varie selon les moments. »
- q5_4 « J'aime être entouré(e) » — « La présence des autres me donne de l'énergie. »
- q5_5 « Plus c'est animé, mieux c'est » — « J'aime le mouvement, la stimulation, l'effervescence. »

### Q6 (`q6`) — « Quand je suis stressé(e), j'ai tendance à… »
- q6_1 « Garder pour moi, faire bonne figure » — « J'encaisse en silence plutôt que de le montrer. » *(mode stress : silence)*
- q6_2 « Me retirer, avoir besoin de calme » — « J'ai besoin de m'isoler pour me reposer. » *(stress : retrait)*
- q6_3 « En parler, me confier » — « Mettre des mots dessus m'aide à aller mieux. » *(stress : parole)*
- q6_4 « Agir, me mettre en mouvement » — « Faire quelque chose vaut mieux que ruminer. » *(stress : action)*
- q6_5 « Chercher à contrôler ce que je peux » — « Reprendre la main sur les détails me rassure. » *(stress : contrôle)*

### Q7 (`q7`) — « Face à un désaccord, je… »
- q7_1 « En parle directement » — « J'aborde le sujet franchement, sans tourner autour. » *(conflit : direct)*
- q7_2 « Ai besoin de temps avant d'en parler » — « Je dois digérer avant de pouvoir en discuter. » *(conflit : temporisateur)*
- q7_3 « Évite le conflit autant que possible » — « Je préfère préserver la paix, quitte à me taire. » *(conflit : évitant)*
- q7_4 « Dédramatise avec l'humour » — « Je désamorce les tensions par une touche légère. » *(conflit : humour)*
- q7_5 « Écris plus facilement que je ne parle » — « À l'écrit, je trouve mieux mes mots. » *(canal : écrit)*

### Q8 (`q8`) — « Dans une relation, ce dont j'ai le plus besoin… »
- q8_1 « De stabilité et de constance » — « Savoir sur quoi je peux compter, durablement. »
- q8_2 « De liberté et d'espace » — « Pouvoir respirer sans me sentir enfermé(e). »
- q8_3 « De profondeur et d'échanges vrais » — « Des conversations qui vont au-delà du superficiel. »
- q8_4 « De légèreté et de rire » — « Du plaisir, de la fluidité, sans lourdeur. » *(conflit : humour)*
- q8_5 « De loyauté dans les moments difficiles » — « Être là quand ça compte vraiment. »
- q8_6 « De respect de mon rythme » — « Qu'on n'impose pas une cadence qui n'est pas la mienne. »

---

## Étape 3 — Communication & décision (`TemperamentStep.tsx`, `STEP3_QUESTIONS`)

Eyebrow : **« Communication & décision »**. Choix unique, micro identique, obligatoires.

### Q9 (`q9`) — « Pour communiquer, je préfère… »
- q9_1 « Aller droit au but » — « L'efficacité et la clarté, sans détour. »
- q9_2 « Parler de ce que je ressens » — « Mettre l'émotion au cœur de l'échange. »
- q9_3 « Tout analyser en profondeur » — « Comprendre le fond avant d'avancer. » *(décision : analytique)*
- q9_4 « Garder ça léger, avec humour » — « Désamorcer et alléger par le rire. » *(conflit : humour)*
- q9_5 « Écrire plutôt que parler » — « À l'écrit, je m'exprime plus juste. » *(canal : écrit)*

### Q10 (`q10`) — « Pour mes grandes décisions, je… »
- q10_1 « Analyse les pour et les contre » — « Je pèse rationnellement avant de trancher. » *(décision : rationnel)*
- q10_2 « Fais confiance à mon instinct » — « Je me fie à ce que je ressens. » *(décision : intuitif)*
- q10_3 « Demande l'avis des proches » — « Le regard des gens de confiance compte. » *(décision : social)*
- q10_4 « Fais des recherches approfondies » — « Je veux maîtriser le sujet avant de choisir. » *(décision : analytique)*
- q10_5 « Attends que ce soit clair en moi » — « Je laisse maturer jusqu'à la certitude intérieure. » *(décision : maturation)*

### Q11 (`q11`) — « J'exprime mes émotions… »
- q11_1 « Assez librement » — « Je montre ce que je ressens sans filtre. »
- q11_2 « Avec quelques personnes de confiance » — « Je m'ouvre, mais dans un cercle restreint. »
- q11_3 « Par mes actes plus que par mes mots » — « Je préfère prouver que déclarer. »
- q11_4 « Rarement, je préfère garder ça pour moi » — « Mes émotions restent surtout intérieures. »
- q11_5 « Souvent après coup, quand j'ai compris ce que je ressens » — « Je comprends mes émotions avec un temps de décalage. »

**Colonnes (étapes 2-3) :**
- `my_profile.temperament_answers` — réponses brutes `{q5: "q5_1", …}`
- `my_profile.temperament_axes` — 9 axes scorés en code (`scoreTemperament`)
- `my_profile.temperament_modes` — modes conflit/stress/décision/canal
- `my_profile.temperament_computed_at` — horodatage

---

## Étape 4 — Ce que j'aime vivre (`LifestyleStep.tsx`, `STEP4_QUESTIONS`)

Eyebrow : **« Ce que j'aime vivre »**. Choix unique, micro « Choisis la réponse qui te ressemble le plus. », obligatoires (les 9 questions). 9 questions : q12-q16 + q4a-q4d.
Source : `src/lib/lifestyle/questions.ts`.

### Q12 (`q12`) — « Quand quelqu'un m'invite ou m'offre quelque chose… »
- q12_1 « N'importe quelle attention sincère me touche » — « L'intention compte bien plus que le standing. »
- q12_2 « Quelque chose de bien choisi, même simple » — « Le soin du choix me touche plus que le prix. »
- q12_3 « Un certain niveau de qualité compte pour moi » — « J'apprécie quand c'est fait avec exigence. »
- q12_4 « Les détails influencent beaucoup mon expérience » — « Un détail raté peut gâcher l'ensemble pour moi. »
- q12_5 « Pas de préférence, je n'y suis pas attaché(e) » — « Ces détails ne pèsent pas dans mon plaisir. »

### Q13 (`q13`) — « Pour les cadeaux, je préfère… »
- q13_1 « Des expériences » — « Vivre quelque chose plutôt que posséder. »
- q13_2 « Des objets à garder » — « Quelque chose de tangible qui dure. »
- q13_3 « Les deux me touchent » — « Je suis sensible à l'un comme à l'autre. »
- q13_4 « Des choses utiles » — « Ce qui me sert vraiment au quotidien. »
- q13_5 « Des choses symboliques » — « Ce qui porte un sens, une mémoire. »

### Q14 (`q14`) — « Pour les cadeaux matériels, ce qui me touche le plus… »
- q14_1 « Un objet utile et bien pensé » — « L'usage avant tout, mais pensé. »
- q14_2 « Quelque chose qui montre qu'on m'a écouté(e) » — « La preuve qu'on a retenu un détail. »
- q14_3 « Un objet beau et de qualité » — « L'esthétique et la matière comptent. »
- q14_4 « Un objet de valeur symbolique » — « Ce qui a un sens dépasse l'objet. »
- q14_5 « Je préfère les expériences aux objets » — « Au fond, je retiens les moments. »

### Q15 (`q15`) — « Ma relation à la nourriture et aux restaurants… »
- q15_1 « J'aime manger partout » — « Peu exigeant(e), je m'adapte facilement. »
- q15_2 « Je suis gourmand(e) » — « Le plaisir de la table, la convivialité. »
- q15_3 « J'adore les belles tables » — « Le cadre et l'expérience comptent. »
- q15_4 « La gastronomie est une passion » — « Un vrai sujet d'expertise pour moi. »
- q15_5 « Je mange pour vivre » — « La nourriture n'est pas centrale chez moi. »

### Q16 (`q16`) — « Si on m'offre un week-end, ce qui compte le plus… »
- q16_1 « La destination avant tout » — « Découvrir un lieu nouveau. »
- q16_2 « Un hôtel confortable et bien situé » — « Le confort et la praticité priment. »
- q16_3 « Le charme et l'authenticité » — « Un lieu qui a une âme. »
- q16_4 « Le luxe et le service » — « Être pleinement choyé(e). »
- q16_5 « L'important, c'est d'être ensemble » — « Le lieu compte moins que la compagnie. »

### Q4a (`q4a`) — « Mon rapport au temps et à l'organisation… »
- q4a_1 « J'anticipe et je planifie à l'avance » — « Savoir où je vais me rassure. »
- q4a_2 « Je gère au fil de l'eau » — « Je préfère rester souple. »
- q4a_3 « La ponctualité compte beaucoup pour moi » — « Le retard me coûte. »
- q4a_4 « Je suis souvent un peu en retard, sans malice » — « Le temps m'échappe parfois. »
- q4a_5 « La charge mentale m'épuise vite » — « Trop à gérer me déborde. »

### Q4b (`q4b`) — « Mon rapport à la qualité et au standing… »
- q4b_1 « La qualité compte, même si je n'en parle pas » — « Je le remarque sans l'exiger. »
- q4b_2 « Je préfère la simplicité authentique au luxe » — « Le vrai vaut mieux que le clinquant. »
- q4b_3 « J'aime le beau et le raffinement » — « Le soin esthétique me touche. »
- q4b_4 « Le prix m'importe peu, c'est l'intention » — « La valeur n'est pas dans le coût. »
- q4b_5 « Je suis sensible aux belles marques et aux lieux d'exception » — « L'excellence me parle. »

### Q4c (`q4c`) — « Quand on organise quelque chose pour moi… »
- q4c_1 « J'aime tout savoir à l'avance » — « Pas d'inconnue, ça me détend. »
- q4c_2 « J'aime garder une part de surprise » — « Un peu d'inconnu, mais pas trop. »
- q4c_3 « J'aime être totalement surpris(e) » — « L'imprévu total m'enchante. »
- q4c_4 « J'ai besoin de valider les détails » — « Je préfère avoir un droit de regard. »
- q4c_5 « Je m'adapte facilement » — « Je fais confiance et je suis le mouvement. »

### Q4d (`q4d`) — « Pour rester en contact, je préfère… »
- q4d_1 « Un appel téléphonique » — « Entendre la voix, le vrai échange. » *(canal : oral)*
- q4d_2 « Un message écrit » — « Asynchrone, à mon rythme. » *(canal : écrit)*
- q4d_3 « Un vocal » — « Spontané mais sans contrainte d'horaire. » *(canal : hybride)*
- q4d_4 « En personne, rien ne remplace » — « La présence physique avant tout. » *(canal : présentiel)*
- q4d_5 « Peu importe, selon le moment » — « Je m'adapte au canal. » *(canal : flexible)*

**Colonnes (étape 4) :**
- `my_profile.lifestyle_answers` — réponses brutes
- `my_profile.lifestyle_axes` — 6 axes lifestyle (`scoreLifestyle`)
- `my_profile.temperament_axes` / `temperament_modes` — enrichis par les « suppléments » transversaux (q4a-q4d nourrissent aussi le tempérament / le canal)

---

## Étape 5 — Ce qu'il vaut mieux éviter (`AvoidStep.tsx`, `STEP5_CHOICE_QUESTIONS`)

Eyebrow : **« Ce qu'il vaut mieux éviter »**. 3 items : un texte libre (q17) + 2 choix uniques (q18, q19). **Obligatoire :** seuls q18 ET q19 sont requis pour le CTA ; q17 est facultatif.

### Q17 — Texte libre (optionnel)
- **Eyebrow VERBATIM :** « En toutes lettres »
- **Libellé VERBATIM :** « Ce qu'il vaut mieux éviter avec moi… »
- **Helper VERBATIM :** « Aucune obligation — réponds instinctivement, ou laisse vide. »
- **Placeholder VERBATIM :** « ex. les surprises, les annulations de dernière minute, certaines blagues, le bruit, les espaces bondés… »
- **Type :** texte libre (textarea) + dictée vocale (`VoiceButton`)
- **Traitement :** si texte > 4 caractères, `POST /api/lifestyle/extract-filters` extrait une liste d'interdits.
- **Colonnes :** `my_profile.relational_filters.q17Text` (texte brut) et `relational_filters.q17Interdits` (interdits extraits par IA)

### Q18 (`q18`) — « Le type de surprise que je détesterais… »
- q18_1 « Une surprise devant beaucoup de monde » — « L'attention publique me met mal à l'aise. »
- q18_2 « Une surprise qui change mon planning » — « Bousculer mon organisation me stresse. »
- q18_3 « Une surprise trop intime ou trop intense » — « Trop d'émotion exposée me gêne. »
- q18_4 « Une surprise mal organisée » — « L'amateurisme gâche tout pour moi. »
- q18_5 « Je suis plutôt partant(e) pour tout » — « J'accueille la surprise avec plaisir. »

### Q19 (`q19`) — « Ce qui me blesse le plus dans une relation… »
- q19_1 « Ne pas être écouté(e) » — « Avoir l'impression de parler dans le vide. »
- q19_2 « Être oublié(e) ou mis(e) de côté » — « Sentir que je ne compte pas. »
- q19_3 « Être envahi(e) ou contrôlé(e) » — « Manquer d'air dans la relation. »
- q19_4 « Les reproches ou critiques répétées » — « La critique constante m'use. »
- q19_5 « Le manque de fiabilité » — « Ne pas pouvoir compter sur quelqu'un. »
- q19_6 « Le manque de profondeur » — « Les relations superficielles me lassent. »

**Colonnes (étape 5) :** `my_profile.lifestyle_answers` (q18/q19), `my_profile.relational_filters` (filtres dérivés + q17), `my_profile.lifestyle_computed_at`.

---

## Étape 6 — Ce qui me rend unique (`SingularityStep.tsx` + `InterestsQuestion.tsx`)

Eyebrow : **« Ce qui me rend unique »**. Intro VERBATIM :
> « Aucune obligation — réponds à ce qui t'inspire, laisse le reste vide. Ces détails donnent à Candice la matière la plus personnelle. »

**Tout est facultatif.** Chaque champ texte dispose d'un bouton de dictée vocale.

### 6.A — Centres d'intérêt (`InterestsQuestion.tsx`)
- **Libellé VERBATIM :** « Mes centres d'intérêt »
- **Helper VERBATIM :** « Sélectionne dans l'ordre — le premier compte le plus pour Candice. »
- **Type :** choix multiple classé (rangs) + sous-détails
- **13 catégories VERBATIM** (`INTEREST_CATEGORIES`) : Lecture · Cuisine & gastronomie · Sport · Musique · Ciné & séries · Art & culture · Voyage · Mode & beauté · Tech & jeux · Nature & jardinage · Bien-être · Déco & maison · Vin & spiritueux
- **Sous-détails selon la catégorie :**
  - Lecture → « Genre préféré » (chips) : Romans, BD & mangas, Dév perso, Essais, Polars, Beaux livres, Poésie, Jeunesse, Autre
  - Sport → « Lequel ? » (texte libre, placeholder « Ex : tennis, yoga, escalade… »)
  - Musique → « Quel style ? » (texte libre « Ex : jazz, rock, rap, classique… ») + case « Concerts / live »
  - Voyage → « Type de voyage » (chips) : City-trips, Nature, Dépaysement total, Gastronomie, Culture, Bien-être, Aventure, Autre
  - Mode & beauté → « Des marques aimées ? » (texte libre « Ex : Isabel Marant, Zara, Aesop… »)
- **Champ libre commun VERBATIM :** « Autre chose ? (facultatif) » — placeholder « Passions moins connues, collections, hobbies… »
- **Colonne :** `my_profile.singularity_answers.interests` (objet `{ items: [{id, rank, details}], freeText }`)

### 6.B — 11 champs texte libre
Ordre d'affichage VERBATIM (label / sous-texte s'il existe / placeholder) → clé de stockage dans `my_profile.singularity_answers` :

| Label VERBATIM | Sous-texte VERBATIM | Placeholder VERBATIM | Clé |
|---|---|---|---|
| Ce que j'adore faire | — | ex. escalade, séries coréennes, cuisiner pour les autres, randonnée, brocantes, musées… | `adore_faire` |
| Ce que j'évite ou déteste | — | ex. sports collectifs, jeux de société, soirées bruyantes, surprises… | `evite_deteste` |
| Les sujets qui me stimulent vraiment | — | ex. startups, psychologie, voyages, football, mode, musique 90s… | `sujets_stimulants` |
| Ce que peu de gens savent sur moi | — | ex. j'adore les mangas, j'ai peur de l'avion, je fais de la poterie… | `peu_savent` |
| Le plus beau cadeau ou moment qu'on m'ait offert | — | ex. un week-end surprise bien pensé, une lettre manuscrite, un concert inoubliable… | `plus_beau_cadeau` |
| Le genre de détail qui me fait me sentir compris(e) | — | ex. qu'on se souvienne de ce que j'ai dit il y a trois mois, qu'on adapte sans que je demande… | `detail_compris` |
| Les marques, objets ou lieux que j'aime | Les enseignes et endroits où tu te sens à ta place. | ex. Aesop, les librairies indépendantes, Le Bon Marché, la papeterie japonaise, un bar à vin précis… | `marques_lieux` |
| Les cadeaux que je n'aimerais pas recevoir | Ce qui, même offert avec gentillesse, tombe à plat pour toi. | ex. bougies, fleurs coupées, gadgets, objets « déco » impersonnels, bons d'achat… | `cadeaux_non` |
| Mes envies ou rêves du moment | Ce dont tu as envie en ce moment, petit ou grand. | ex. apprendre la céramique, partir au Japon, un certain sac, me remettre au piano… | `envies_reves` |
| Ce que j'aimerais qu'on remarque davantage chez moi | Ce que tu donnes et qui passe parfois inaperçu. | ex. mes efforts, mon humour, mon écoute, mon travail, ma cuisine… | `remarquer` |
| Ce qui me fait me sentir spécial(e) | Le sentiment d'être unique aux yeux de quelqu'un. | ex. qu'on se souvienne d'un détail, qu'on prépare quelque chose rien que pour moi, qu'on prenne du temps… | `sentir_special` |

**Colonne :** `my_profile.singularity_answers` (objet).

---

## Étape 7 — Informations pratiques (`PracticalStep.tsx`)

Eyebrow : **« Informations pratiques »**. **Aucun champ obligatoire** (CTA « Terminer » toujours actif).
Encart RGPD en tête (VERBATIM) :
> « Ces informations restent strictement privées. Elles ne seront jamais affichées à tes proches. Elles servent uniquement à éviter les recommandations maladroites : mauvais restaurant, mauvaise taille, cadeau incompatible, lieu inaccessible. »

Tous les champs sont écrits dans `my_profile.practical_info` (objet), + `my_profile.practical_computed_at`.

### Section « Identité »
- **Prénom** — texte libre, placeholder « Ton prénom » → `prenom`
- **Sexe** — choix unique (pills) → `sexe` : « Femme » (`femme`), « Homme » (`homme`), « Non-binaire » (`non_binaire`), « Préfère ne pas préciser » (`ne_se_prononce_pas`)
- **Âge** — texte libre, placeholder « ex. 32 » → `age`
- **Profession** — texte libre, placeholder « ex. infirmière, développeur, enseignant… » → `profession`

### Section « Alimentation »
- **Allergies alimentaires** — choix multiple → `allergies` : « Aucune » (`aucune`), « Gluten » (`gluten`), « Lactose » (`lactose`), « Fruits à coque » (`fruits_a_coque`), « Fruits de mer » (`fruits_de_mer`), « Autre » (`autre`)
- **Régime alimentaire** — choix unique → `regime` : « Omnivore » (`omnivore`), « Végétarien » (`vegetarien`), « Vegan » (`vegan`), « Halal » (`halal`), « Casher » (`casher`), « Sans préférence » (`sans_preference`), « Autre » (`autre`)
- **Rapport à l'alcool** — choix unique → `alcool` : « Je bois » (`je_bois`), « Je n'en bois pas » (`ne_bois_pas`), « Occasionnel » (`occasionnel`), « Éviter les lieux centrés alcool » (`eviter_lieux`)

### Section « Confort »
- **Mobilité / santé / confort** — texte libre → `mobilite_sante`. Note VERBATIM : « Mobilité, santé, confort physique — utile pour éviter les lieux inadaptés. » Placeholder « ex. genou fragile, dos sensible, je ne peux pas faire de longues marches… »

### Section « Tailles »
Titre VERBATIM : « Quelles tailles te vont généralement le mieux ? » (note « Pour éviter les erreurs de cadeau vestimentaire. »). 4 champs texte :
- Vêtements (« ex. M, L, 40… ») → `taille_vetements`
- Chaussures (« ex. 42, EU 38… ») → `taille_chaussures`
- Pantalon (« ex. 40, 32×32… ») → `taille_pantalon`
- Bague (« ex. 52, taille 7… ») → `taille_bague`

### Section « Goûts »
- **Parfums et odeurs aimées** — choix multiple → `parfums` : « Frais » (`frais`), « Poudré » (`poudre`), « Boisé » (`boise`), « Floral » (`floral`), « Gourmand » (`gourmand`), « Ambré » (`ambre`), « Discret » (`discret`), « Sans parfum » (`sans_parfum`)
- **Odeurs ou parfums que je déteste** — texte libre → `odeurs_detestees` (placeholder « ex. muscs forts, patchouli, parfums sucrés entêtants… »)
- **Couleurs, matières, style** — texte libre → `couleurs_matieres` (placeholder « ex. tons neutres, lin et soie, minimaliste — ou couleurs vives, vintage, bohème… »)

### Section « Pratique »
- **Adresse de livraison** — texte libre → `adresse_livraison` (note « Pour les envois — jamais partagée avec tes proches. » ; jamais affichée aux tiers)
- **Animaux de compagnie** — texte libre → `animaux` (placeholder « ex. un chien, deux chats, aucun… »)

### Section « Agenda »
- **Dates importantes** — gestionnaire multi-entrées → `dates_importantes` (tableau). Note « Anniversaire, fête, mariage, dates symboliques — pour ne jamais les rater. » Chaque entrée : type (Anniversaire / Fête / Mariage / Date personnelle / Date symbolique / Autre), **date (obligatoire pour valider une entrée avant d'en ajouter une autre)**, libellé personnalisé, récurrence (« Chaque année » / « Une seule fois »), importance (« Faible » / « Normale » / « Forte »), rappel (« 30 jours » / « 14 jours » / « 7 jours » / « Pas de rappel »).
- **Ton rôle et lien familial** — choix multiple → `role_familial` : « Conjoint·e » (`conjoint`), « Ami·e » (`ami`), « Père » (`pere`), « Mère » (`mere`), « Enfant » (`enfant`), « Frère / Sœur » (`frere_soeur`), « Beaux-parents » (`beaux_parents`), « Collègue » (`collegue`), « Autre » (`autre`)

### Vetos dérivés (calcul en code, `deriveVetos`)
`practical_info.vetos` = `{ no_alcohol, halal, casher, mobility_constraints, allergies }` déduits automatiquement des champs ci-dessus.

---

## Tableau récapitulatif — champs TEXTE LIBRE et leur destination

| Champ (VERBATIM) | Étape | Colonne / clé dans `my_profile` |
|---|---|---|
| « Ce qu'il vaut mieux éviter avec moi… » (q17) | 5 | `relational_filters.q17Text` (+ `q17Interdits` extraits par IA) |
| Sport → « Lequel ? » | 6 | `singularity_answers.interests.items[].details.quel_sport` |
| Musique → « Quel style ? » | 6 | `singularity_answers.interests.items[].details.style` |
| Mode → « Des marques aimées ? » | 6 | `singularity_answers.interests.items[].details.marques` |
| « Autre chose ? (facultatif) » | 6 | `singularity_answers.interests.freeText` |
| Ce que j'adore faire | 6 | `singularity_answers.adore_faire` |
| Ce que j'évite ou déteste | 6 | `singularity_answers.evite_deteste` |
| Les sujets qui me stimulent vraiment | 6 | `singularity_answers.sujets_stimulants` |
| Ce que peu de gens savent sur moi | 6 | `singularity_answers.peu_savent` |
| Le plus beau cadeau ou moment qu'on m'ait offert | 6 | `singularity_answers.plus_beau_cadeau` |
| Le genre de détail qui me fait me sentir compris(e) | 6 | `singularity_answers.detail_compris` |
| Les marques, objets ou lieux que j'aime | 6 | `singularity_answers.marques_lieux` |
| Les cadeaux que je n'aimerais pas recevoir | 6 | `singularity_answers.cadeaux_non` |
| Mes envies ou rêves du moment | 6 | `singularity_answers.envies_reves` |
| Ce que j'aimerais qu'on remarque davantage chez moi | 6 | `singularity_answers.remarquer` |
| Ce qui me fait me sentir spécial(e) | 6 | `singularity_answers.sentir_special` |
| Prénom | 7 | `practical_info.prenom` |
| Âge | 7 | `practical_info.age` |
| Profession | 7 | `practical_info.profession` |
| Mobilité / santé / confort | 7 | `practical_info.mobilite_sante` |
| Tailles (vêtements, chaussures, pantalon, bague) | 7 | `practical_info.taille_vetements` / `taille_chaussures` / `taille_pantalon` / `taille_bague` |
| Odeurs ou parfums que je déteste | 7 | `practical_info.odeurs_detestees` |
| Couleurs, matières, style | 7 | `practical_info.couleurs_matieres` |
| Adresse de livraison | 7 | `practical_info.adresse_livraison` (privée, jamais affichée) |
| Animaux de compagnie | 7 | `practical_info.animaux` |
| Dates importantes → libellé | 7 | `practical_info.dates_importantes[].label` |

> À noter : les textes libres NE sont jamais affichés bruts aux tiers. Ils sont paraphrasés/fondus par le LLM de synthèse (voir `07-analyse-profil.md`), sauf les faits pratiques factuels affichés sur la fiche.


---

<!-- ============ 07-analyse-profil ============ -->

# 07 — Le pipeline d'analyse du profil (`generateProfileAnalysis`)

> Comment Candice transforme les réponses du questionnaire en une « fiche profil » lisible. Ce qui est calculé en code (DÉTERMINISTE, reproductible) vs. ce qui passe par un modèle de langage (LLM).
> Sources : `src/lib/profile/generateProfileAnalysis.ts` (767 l.), `src/lib/profile/synthesis.ts`, `src/lib/profile/v2-metrics.ts`.
> Sortie écrite dans la table `profile_analysis` (base : `profile_analysis`), une ligne par pilote (`contact_id = null`).
> Déclencheur : `POST /api/profile/generate`, appelé en fire-and-forget après chaque étape du questionnaire (`triggerSynthesis`).

---

## Vue d'ensemble — 9 étapes

`generateProfileAnalysis(userId, contactId, supabase)` :

| # | Étape | Nature | Détail |
|---|---|---|---|
| 1 | Lecture du profil | DÉTERMINISTE | lit `my_profile` (attention, tempérament, lifestyle, filtres, pratique, singularité, discovery, genre) |
| — | Garde | DÉTERMINISTE | si `attention_reception` OU `attention_expression` absent → **skip** (`reason: "insufficient_data"`). Jamais d'analyse sur input quasi-vide. |
| 2 | Calcul des « faits » | DÉTERMINISTE | `computeProfileSynthesis` — scoring de toutes les dimensions, radar 7 axes, labels de niveau |
| 3 | Genre grammatical | DÉTERMINISTE | `resolveGender` (grammatical_gender, fallback sexe) |
| 4 | **Extraction d'entités** | **LLM (Haiku)** | marques / lieux / hobbies / événements depuis 4 champs texte libre |
| 5 | Mémoires récentes | DÉTERMINISTE | lit 8 dernières `memories` actives (`sanitized_summary`) |
| 6 | **Synthèse narrative** | **LLM (Sonnet)** | produit tout le texte de la fiche en un seul appel |
| 7 | Label de source | DÉTERMINISTE | `questionnaire[+memories][+discovery]` |
| 8 | Scores de dimension | DÉTERMINISTE | interne, jamais affiché |
| 9 | Upsert `profile_analysis` | DÉTERMINISTE | + pré-calcul Discovery (inactif, voir 08) |

Tout est journalisé dans `processing_log` (correlation_id, step, status, durée). L'échec du LLM de synthèse bascule sur un **fallback déterministe** (aucun texte inventé — champs vides gérés par l'UI).

---

## Les 2 appels LLM

### Appel 1 — Extraction d'entités (Haiku)
Fonction : `extractEntities` (l.83-116).
- **Modèle VERBATIM :** `claude-haiku-4-5-20251001`
- **max_tokens :** 500
- **Rôle :** extraire les entités nommées de 4 champs texte libre concaténés — `singularity.marques_lieux`, `adore_faire`, `sujets_stimulants`, `envies_reves` (message user tronqué à 800 caractères). Si le texte combiné fait < 10 caractères → retourne des listes vides sans appeler le LLM.
- **PROMPT SYSTÈME VERBATIM :**
```
Extrais les entités nommées du texte. Retourne uniquement du JSON valide :
{"brands":["..."],"places":["..."],"hobbies":["..."],"events":["..."],"brands_categorized":[{"name":"...","category":"..."}]}
- brands : marques, enseignes, créateurs
- places : restaurants, villes, lieux nommés
- hobbies : activités, passions nommées
- events : occasions, fêtes, événements nommés
- brands_categorized : chaque marque de "brands" avec sa catégorie parmi EXACTEMENT :
  Mode, Beauté, Soin, Bijoux, Maison, Accessoires, Design, Autre
Ne génère que le JSON, sans explication.
```
- **Sortie :** `{ brands, places, hobbies, events, brands_categorized }` → colonne `profile_analysis.entities`. `brands_categorized` alimente les « marques catégorisées » de la fiche V2.

### Appel 2 — Synthèse narrative (Sonnet)
Fonction : `generateProfileAnalysis`, l.578-588.
- **Modèle VERBATIM :** `claude-sonnet-4-6`
- **max_tokens :** 3000
- **Rôle :** rédiger la fiche profil complète (2e personne « tu » + 3e personne pour les proches), en UN seul appel transversal (jamais dimension par dimension). Ton Candice, jamais clinique/score/%.
- **Message user :** construit par `buildAnalysisPrompt` — sérialise tous les « faits » calculés (attention, ce qui touche, à éviter, style relationnel, communication, attentions idéales/à éviter, lifestyle, labels de niveau, singularité, réponses discovery, contexte pratique de calibrage, parfums, esthétique, q17, centres d'intérêt, radar 7 axes usage interne, mémoires récentes). Complété par une ligne `NIVEAUX « CE QUI MARCHE »` (calculés déterministes, à respecter).

**PROMPT SYSTÈME VERBATIM (`buildSystemPrompt`, l.331-428)** — `${genderInstruction}` est l'une des 3 consignes de genre selon feminine/masculine/neutral :

```
Tu es Candice. Tu rédiges la fiche profil intime d'une personne à partir de l'ensemble de ses réponses.

${genderInstruction(gender)}

RÈGLES D'ÉCRITURE ABSOLUES :
- Ton : « tu sembles », « on devine », « quelque chose revient souvent », « chez toi »
- JAMAIS clinique, coach, MBTI/psy, "profil", "analyse", "score", "compatibilité"
- Humain, fin, légèrement émotionnel, nuancé, toujours positif dans la formulation
- Français, tutoiement (tu) pour summary / sections ; 3e personne pour summary_third_person
- JAMAIS de troncature « … » : chaque phrase est complète
- Candice ne juge jamais. Candice traduit.

RÈGLES SUR LES SECTIONS :
- Analyse GLOBALE et transversale — JAMAIS dimension par dimension
- Si deux sections proches disent la même chose (ex: attention ≈ feels_loved), FUSIONNE-les en une lecture commune plus forte, et laisse l'autre vide ("text": "", "chips": [])
- "attention" = comment la personne REÇOIT l'attention des autres (les langages dans lesquels ELLE SE SENT aimée)
- "feels_loved" = les situations concrètes qui lui font vivre cela — PAS ce qu'elle donne, PAS comment elle exprime
- "what_touches" = ce qui la touche profondément (émotions, gestes, moments)
- Zéro redondance entre sections : un chip ou une idée n'apparaît que dans UNE seule section

RÈGLES SUR LES CHIPS :
- Courts (2-5 mots max), nets, non-redondants
- INTERDIT : fragments bruts ("Aime planifier et anticiper"), mots répétés dans 3+ sections
- Chips informatifs et actionables pour un proche (ex: "Cadeaux expérience", "Hôtel boutique", "Pas de surprises")
- Chips TOUJOURS compréhensibles hors contexte, du point de vue de la personne.
  INTERDIT : formulations ambiguës dont on ne sait pas qui est « toi »
  (ex. INTERDIT : "Marque connue de toi" → écrire "Une de tes marques fétiches")
- Si une sensibilité au luxe ou au premium ressort des réponses, traduis-la en
  un chip dans "gifts" (ex: "sensible au luxe", "belles maisons") — ce n'est
  plus un axe affiché, c'est un tag d'analyse

RÈGLES SPÉCIFIQUES POUR L'ENRICHISSEMENT :
- ANALYSER = ENRICHIR, jamais résumer. Rends la fiche la plus riche et la plus vivante possible sans jamais citer verbatim les réponses ouvertes.
- CONTEXTE DE CALIBRAGE : le bloc CONTEXTE (âge, profession, rôle familial) sert à CALIBRER le ton, l'univers, les occasions pertinentes et le niveau des suggestions — on ne contente pas un dirigeant comme un artisan, être père ou beau-père change quelles fêtes comptent, l'âge calibre tout. INTERDIT de le citer maladroitement dans les textes ("en tant que CEO de 45 ans tu…") : il informe l'analyse sans jamais y apparaître tel quel.
- Les réponses libres (adore_faire, evite_deteste, peu_savent, detail_compris, plus_beau_cadeau, cadeaux_non, envies_reves, remarquer, sentir_special, sujets_stimulants, marques_lieux, q17, couleurs_matieres, odeurs_detestees, mobilité/santé) doivent être PARAPHRASÉES et FONDUES dans les sections pertinentes — jamais copiées. Une seule citation italique paraphrasée courte est tolérée dans "points_fixes".
- Chaque chip est court (2-5 mots max), informatif, distinct. Pas de fragment de phrase brut, pas de mot répété entre sections.
- "insights" (3 phrases) = "Ce que Candice a compris" — 3 phrases courtes, actionables, qui donnent un angle non-évident. Format : "Tu es touchée par…", "Tu n'aimes pas…", "Tu préfères…".
- "modes" : 4 modes de tempérament, chacun 1-3 mots doux. Si "conflit" est déjà donné dans le prompt (via 'facts'), reprends-le en le reformulant en 1-3 mots. Pour stress/décision/canal : DÉDUIS-les qualitativement des axes tempérament + facts. Ne laisse JAMAIS un mode vide — propose la nuance la plus probable.
- "points_fixes" : les constantes irréductibles de la personne (ce qu'elle est, ce qu'elle déteste, ses rêves, ses fiertés). Fonds y peu_savent + sentir_special + sujets_stimulants + envies_reves + remarquer + evite_deteste. 5-6 chips courts + éventuellement une seule phrase italique paraphrasée (jamais copiée).
- "parfums" : synthèse olfactive (types aimés + ce qui répulse). 1 phrase + 2-3 chips (dont au maximum un chip "warm" type "déteste : X").
- Si une donnée manque totalement pour une section, laisser text: "" et chips: [] — sera géré côté UI avec un CTA.

RÈGLES V2 (nouvelle fiche) :
- Chaque section de "sections" (sauf attention_dna) porte AUSSI un champ "more" : un paragraphe long (3-4 phrases complètes) qui approfondit le "text" sans le répéter — c'est le contenu du « Lire plus ». Si la section est vide, "more" est "".
- "summary_long" : l'analyse complète, 3 paragraphes séparés par une ligne vide, chacun 2-3 phrases. Même ton que summary, plus profond. C'est ce que la personne lit en ouvrant « Lire l'analyse complète ».
- "podium_intro" : 1 phrase qui introduit le classement des langages d'attention (ex: « Chez toi, tous les langages comptent, mais ils ne se valent pas. ») en s'appuyant sur la dimension dominante. La 7e dimension GES se nomme TOUJOURS « Esthétique · qualité ».
- "understood_cards" : EXACTEMENT 4 cartes { "eyebrow": 1 mot-thème (ex: Écoute, Exécution, Lieux, Surprise), "text": 1-2 phrases }. Angles NON-évidents, distincts des insights.
- "works_phrases" : pour CHACUNE des 6 clés (beau, personnel, experientiel, utile, premium, surprise), 1 phrase courte qui illustre comment cette famille d'attention fonctionne chez la personne. Les NIVEAUX (Très fort / Fort / À doser) te sont fournis dans les données — ta phrase doit être cohérente avec le niveau indiqué, tu ne décides JAMAIS du niveau.
- "territory" : le territoire idéal de sortie/évasion. { "titre": accroche courte (ex: « Sortir du quotidien, sans l'inconfort subi »), "phrase": 1-2 phrases, "cartes": EXACTEMENT 3 cartes { "nom": 2-3 mots, "description": 1 ligne concrète, "statut": "desirable" ou "eviter" } — 2 désirables + 1 à éviter, déduites du profil (confort, aventure, lieux). }
- "universe" : { "lieux_ambiances": 4-6 tags de types de lieux où la personne se sent bien (ex: « Hôtels de caractère »), "matieres": 3-6 tags de matières/esthétique (depuis couleurs_matieres paraphrasé), "reves_envies": 4-7 tags courts (depuis envies_reves + rêves détectés), "phrase": 1 phrase élégante « ce que ça dit de ton univers » (sans commencer par « Ton univers raconte » à chaque fois — varie). }
- Si les données manquent pour territory ou universe, mettre null.

Retourne UNIQUEMENT ce JSON valide (aucun markdown, aucune explication) :
{
  "summary": "string — 2-3 phrases, résumé global en 2e personne (ton 'tu sembles')",
  "summary_third_person": "string — même synthèse mais en 3e personne neutre pour un proche (ex: 'Elle semble...', 'Il est touché par...', 'Pour lui faire plaisir...'). Accords selon le genre indiqué.",
  "summary_chips": ["string", "string", "string", "string"],
  "insights": [
    "string — phrase courte 'Tu es touchée par…' ou équivalent",
    "string — phrase courte 'Tu n'aimes pas…' ou équivalent",
    "string — phrase courte 'Tu préfères…' ou équivalent"
  ],
  "sections": {
    "attention":    { "text": "string — comment reçoit l'attention (2-3 phrases complètes)", "chips": ["string", "string", "string"], "more": "string — paragraphe long Lire plus" },
    "what_touches": { "text": "string — ce qui la/le touche vraiment (2-3 phrases)", "chips": ["string", "string", "string"], "more": "string" },
    "feels_loved":  { "text": "string — situations concrètes de réception (2-3 phrases) — si trop similaire à 'attention', laisser vide", "chips": ["string", "string"], "more": "string" },
    "gifts":        { "text": "string — quel type de cadeau lui parle (2-3 phrases)", "chips": ["string", "string", "string"], "more": "string" },
    "avoid":        { "text": "string — ce qu'il vaut mieux éviter, en intégrant le texte libre q17 et cadeaux_non paraphrasés", "chips": ["string", "string", "string"], "more": "string" },
    "style":        { "text": "string — univers esthétique, en intégrant couleurs_matieres paraphrasé", "chips": ["string", "string"], "more": "string" },
    "brands":       { "text": "string — marques / univers (1-2 phrases, ou vide si aucune donnée)", "chips": [], "more": "string" },
    "restaurants":  { "text": "string — tables et cuisines (1-2 phrases, ou vide si aucune donnée)", "chips": ["string", "string"], "more": "string" },
    "travel":       { "text": "string — comment voyage (1-2 phrases, ou vide si aucune donnée)", "chips": ["string", "string"], "more": "string" },
    "hobbies":      { "text": "string — passions et loisirs (1-2 phrases, ou vide si aucune donnée)", "chips": ["string", "string", "string"], "more": "string" },
    "parfums":      { "text": "string — synthèse olfactive (1 phrase, ou vide si aucune donnée)", "chips": ["string", "string"], "more": "string" },
    "points_fixes": { "text": "string — « À savoir pour viser juste » : 1 phrase de synthèse OU une paraphrase italique courte (jamais citation brute)", "chips": ["string", "string", "string", "string", "string"], "more": "string" },
    "attention_dna":{ "text": "string — synthèse ADN attentions (2-3 phrases)", "chips": ["string", "string"] }
  },
  "summary_long": "string — 3 paragraphes séparés par une ligne vide",
  "podium_intro": "string — 1 phrase d'introduction du podium",
  "understood_cards": [{ "eyebrow": "string — 1 mot", "text": "string — 1-2 phrases" }],
  "works_phrases": { "beau": "string", "personnel": "string", "experientiel": "string", "utile": "string", "premium": "string", "surprise": "string" },
  "territory": { "titre": "string", "phrase": "string", "cartes": [{ "nom": "string", "description": "string", "statut": "desirable" }] },
  "universe": { "lieux_ambiances": ["string"], "matieres": ["string"], "reves_envies": ["string"], "phrase": "string" },
  "modes": {
    "conflit":  "string — 1-3 mots doux (ex: 'temporise', 'confronte', 'humour')",
    "stress":   "string — 1-3 mots doux (ex: 'se replie', 'agit', 'partage')",
    "decision": "string — 1-3 mots doux (ex: 'réfléchie', 'intuitive', 'consultative')",
    "canal":    "string — 1-3 mots doux (ex: 'message écrit', 'voix', 'en face à face')"
  },
  "must_haves": ["string", "string", "string"],
  "deal_breakers": ["string", "string", "string"],
  "attention_dna": [{ "dimension": "string", "intensity": 0, "note": "string" }],
  "constraints": ["string"],
  "confidence": 0.0
}

Règles confidence : 0.3 = peu de données, 0.6 = questionnaire de base, 0.85 = questionnaire + singularité, 1.0 = tout + mémoires.
```

**Les 3 instructions de genre VERBATIM (`genderInstruction`, l.71-79) :**
- feminine : « La personne est une femme : accords féminins systématiques (elle, sa, ses, contente, aimée, etc.). JAMAIS de point médian « · » ni de « (-ve) ». »
- masculine : « La personne est un homme : accords masculins systématiques (il, son, ses, content, aimé, etc.). JAMAIS de point médian « · » ni de « (-ve) ». »
- neutral : « Le genre n'est pas déterminé : reformule SANS accord (ex: 'une personne qui', 'quelqu'un qui'). INTERDIT absolument : point médian « · », tiret-genre, parenthèses d'accord « (-ve) ». Utilise la 3e personne neutre ou des tournures impersonnelles. »

---

## Ce qui est DÉTERMINISTE (jamais décidé par le LLM)

### `computeProfileSynthesis` (`synthesis.ts`) — les « faits »
Calcule à partir des colonnes scorées : dimensions réception/expression top-3, contraste réception≠expression, `touchInsights`, `avoidAlerts`, `relationalFacts`, `communicationFacts`, `idealAttentions`, `avoidAttentions`, 4 labels de niveau (spontanéité, contrôle, sensibilité aux détails, besoin d'espace), highlights lifestyle, résumé structuré des centres d'intérêt, textes bruts (q17, mobilité, odeurs, couleurs, freeText) transmis au LLM pour préserver le ton, et le **style_radar 7 axes**. Sert d'entrée au prompt Sonnet, ET de fallback si le LLM échoue.

### `computeWorksLevels` (`v2-metrics.ts`) — niveaux « Ce qui marche »
6 clés → niveau (Très fort / Fort / À doser), **imposés** au LLM (il rédige les phrases, ne décide jamais du niveau) :
- `beau` ← radar.esthetique ; `personnel` ← radar.precision ; `experientiel` ← radar.temps ; `utile` ← radar.utilite ; `surprise` ← radar.surprise ; `premium` ← axe tempérament `exigenceStanding` (`50 + exigence*0.35`).
- Seuils : ≥ 65 → `tres_fort`, ≥ 40 → `fort`, sinon `a_doser`.

### Fallback déterministe (si le LLM de synthèse échoue, l.590-648)
`aiStatus = "fallback"` : construit summary/insights/sections minimaux depuis les `facts`. Les champs V2 narratifs (`summary_long`, `podium_intro`, `understood_cards`, `works_phrases`, `territory`, `universe`) restent VIDES/null — jamais de texte fabriqué. `confidence` = 0.6 si tempérament + singularité, sinon 0.3.

---

## Les colonnes remplies dans `profile_analysis` (upsert, l.678-724)

`engine_version` écrit par le code actuel = **"2.2"**. Champs :
`summary`, `summary_third_person`, `summary_chips`, `insights`, `sections` (avec `more`), `modes`, `style_radar` (déterministe), `dimension_scores` (interne), `must_haves`, `deal_breakers`, `attention_dna`, `constraints`, `entities`, `gender`, `confidence` (borné 0-1), `source`, `generated_at`, `summary_long`, `podium_intro`, `understood_cards` (max 4, filtrées), `works_phrases`, `territory` (assaini côté code : max 3 cartes, statut normalisé), `universe`.

---

## Les TROIS représentations des « dimensions »

Il y a **trois objets distincts** qui décrivent les dimensions d'attention. Ne pas les confondre.

### 1. `style_radar` — DÉTERMINISTE, 7 axes
- **Calcul :** `computeStyleRadar` (`synthesis.ts`, l.226-299). 7 valeurs 0-100 : **precision, emotion, surprise, esthetique, utilite, temps, discretion**. Dérivées des poids des dimensions de réception + axes tempérament/lifestyle + filtres relationnels.
- **Usage :** (a) injecté dans le prompt Sonnet « usage interne » (informe la forme sans être affiché en chiffre), (b) source des niveaux `computeWorksLevels`, (c) affiché comme heptagone « Style attentionnel » sur la fiche.
- **Stockage :** `profile_analysis.style_radar`.

### 2. Le podium 7 langages — DÉTERMINISTE, libellés verrouillés
- **Calcul :** `computePodium` (`v2-metrics.ts`, l.54-81), à partir de `attention_reception` (dominant/secondaire/tertiaire). Aucune donnée n'est stockée : recalculé à l'affichage par `buildProfileV2Data` (`v2-data.ts`).
- **7 dimensions + libellés VERROUILLÉS** (`PODIUM_LABELS`) : MOT « Mots justes » · CAD_C « Cadeaux choisis » · EXP « Moments partagés » · GES « Esthétique · qualité » · SER « Actes de service » · CAD_S « Attentions symboliques » · SUR « Surprise ».
- **Intensités :** `dominant` (« Dominant »), `tres_present` (« Très présent »), `present` (« Présent »), `a_doser` (« À doser »). Largeurs de barre au barème validé, jamais de chiffre affiché.
- **LLM :** ne fabrique que la phrase d'intro (`podium_intro`), jamais le classement.

### 3. `attention_dna` — LLM
- **Origine :** produit par Sonnet — tableau `[{ dimension, intensity (0-100), note }]`, + une section texte `sections.attention_dna` (text + chips).
- **Stockage :** `profile_analysis.attention_dna`. C'est la seule des trois qui est générée par le LLM (l'intensité y est un chiffre décidé par le modèle, contrairement au podium/radar déterministes). En fallback, reconstruite depuis `facts.topReceptionDims` (80 puis 50).

---

## Confirmation sur la base réelle (base : `profile_analysis`)

**2 lignes** présentes en prod, toutes deux `engine_version = "2.0"** (donc ANTÉRIEURES au code actuel qui écrit "2.2" et remplit territory/universe/works_phrases/podium_intro/summary_long/understood_cards). Colonnes réellement peuplées :

| Colonne | Lignes remplies (/2) | Statut |
|---|---|---|
| `summary` | 2 | ✅ |
| `summary_chips` | 2 | ✅ |
| `sections` | 2 | ✅ |
| `generated_at` | 2 | ✅ |
| `engine_version` | 2 (valeur "2.0") | ✅ |
| `summary_long` | 1 | 🟡 (1 ligne à null) |
| `podium_intro` | 1 | 🟡 |
| `summary_third_person` | 1 | 🟡 |
| `insights` | 1 | 🟡 |
| `style_radar` | 1 | 🟡 |
| `understood_cards` | 1 | 🟡 |
| `works_phrases` | 1 | 🟡 |
| `attention_dna` | 1 | 🟡 |
| `dimension_scores` | 1 | 🟡 |
| `entities` | 1 | 🟡 |
| `must_haves` / `deal_breakers` / `constraints` | 1 | 🟡 |
| `gender` / `confidence` / `source` | 1 | 🟡 |
| `modes` | 0 | 🟡 null sur les 2 lignes |
| `territory` | 0 | 🟡 null sur les 2 lignes |
| `universe` | 0 | 🟡 null sur les 2 lignes |
| `contact_id` | 0 | ✅ (attendu : `null` = fiche pilote) |

> Lecture : sur les 2 profils réels (dont le compte QA), une ligne est riche (V2, la plupart des champs remplis) et l'autre est minimale (ancienne, seulement summary/summary_chips/sections). `modes`, `territory`, `universe` ne sont peuplés sur AUCUNE des 2 lignes en base à ce jour — le podium et le radar de la fiche sont, eux, recalculés à la volée depuis `my_profile.attention_reception` (donc indépendants de ces colonnes).


---

<!-- ============ 08-micro-questions ============ -->

# 08 — Micro-questions Discovery (banque `discovery_questions`)

> Les « micro-questions » que Candice pose APRÈS le questionnaire initial, pour affiner. Banque en base + mécanisme de sélection.
> Sources : table (base : `discovery_questions`), `src/lib/discovery/engine.ts` (sélecteur `getNextMicroQuestion`), `src/lib/discovery/status.ts` (statuts), `src/lib/profile/v2-metrics.ts` + `src/lib/profile/sheet-data.ts` (jauge de connaissance), `src/app/moi/discovery/*` (écran), `src/components/profile/v2/Header.tsx` + `Viser.tsx` (incitations).

---

## Comptages réels (base)

- `discovery_questions` : **70 lignes** — 68 `statut = active`, 2 `statut = archived` (`fragrance.family`, `fragrance.beauty_gift`). Toutes `target = self`.
- Répartition par dimension : attention **7**, brands **3**, conflicts **3**, dreams **4**, food **6**, fragrance **6**, gifts **6**, hobbies **11**, practical **6**, style **9**, surprises **4**, travel **5**.
- `discovery_sessions` : **57 lignes** (sessions de réponse, créées à la 1re réponse).
- `profile_completion` : **0 ligne** (aucun statut de complétion persisté à ce jour — voir note « pré-calcul inactif »).

Colonnes de `discovery_questions` : `question_key`, `dimension`, `subdimension`, `question_text`, `question_type` (`chips_single` / `chips_multi` / `text`), `options` (jsonb `[{label,value}]`), `statut`, `sort_order`, `priority` (toutes à **50**), `trigger_condition`, `updates_dimensions`, `free_text_enabled` (**false partout**), `locked_text`, `target`, `benefit_label`, `duration_label`.

---

## Le flag `PERSONALIZATION_ACTIVE`

Dans `src/lib/discovery/engine.ts` (l.88) : **`const PERSONALIZATION_ACTIVE = false;`**

Décision Estelle (revue de banque) : la reformulation IA est **COUPÉE**. Toutes les questions sont servies avec leur **texte de banque MOT POUR MOT**. Le pré-calcul D1 (fonctions `precomputePersonalizationsForKeys`, `precomputeUpcomingPersonalizations`) reste en place techniquement mais **inactif** — il ne resservira que si le flag repasse à `true`. C'est pourquoi `profile_completion.personalized_text` n'est jamais rempli et que la table est vide. `locked_text = true` : question jamais reformulée même si le flag était réactivé.

---

## Mécanisme de sélection — `getNextMicroQuestion` (`engine.ts`, l.406-461)

**Lecture seule** (aucune écriture ; le GET `/moi/discovery` est sans effet de bord → page cacheable). La session naît à la 1re réponse via `createDiscoverySession` (route `answer`).

Étapes :
1. **3 lectures parallèles** : toutes les questions actives `target='self'` triées par `sort_order` (`getAllQuestionsWithTrigger`) ; snapshot `my_profile` (`practical_info`, `singularity_answers`, `relational_filters`, `discovery_answers`) ; statuts de complétion (`profile_completion`).
2. **Rétro-alimentation en mémoire** (`applyDataSync`) : une donnée déjà présente en fiche vaut réponse → statut `answered` (pur, sans écriture au rendu).
3. **Filtrage des candidates** — une question est candidate si :
   - son statut n'est PAS bloquant (`blockedKeys` = statuts `answered` ou `archived`), ET
   - la donnée n'est PAS déjà présente en fiche (`questionDataPresent`), ET
   - son `trigger_condition` passe (`evaluateTrigger`).
4. **Filtre par section** (optionnel) : si `sectionKey` fourni (deep-link nudge), on restreint aux dimensions mappées (`SECTION_KEY_TO_DIMENSIONS`).
5. **Score & tri** : `score = computeGapScore(q) * 100 + (priority ?? 50)`, tie-break par `sort_order` croissant.
   - `computeGapScore` (l.384-395) : 2 si la section d'analyse correspondante est vide/absente, 1 si son texte < 60 caractères, 0 sinon. → **on privilégie les sections les moins renseignées**.
6. **Lot** : `quick` → 1 question ; `full` → jusqu'à **`FULL_SESSION_MAX = 3`** questions.
7. Retourne la 1re question (texte de banque, reformulation coupée), `sessionId: null`, `pendingKeys`, `currentIndex: 0`, `mode`, `sectionLabel`, `progress`.

**`evaluateTrigger` (l.357-382) :** si `trigger_condition` vide → passe toujours. Sinon, une heuristique (`inferSectionKeyFromTrigger`) devine la section d'analyse concernée ; un motif d'absence (« non renseigné », « non détaillé », « vide », « incomplet », « non précis ») → passe si la section est **mince** ; sinon → passe si la section a du **contenu**.

**Mapping dimension → section d'analyse** (`DIMENSION_TO_ANALYSIS_SECTION`) : attention→attention, gifts→gifts, style→style, brands→brands, food→restaurants, fragrance→parfums, travel→travel, hobbies→hobbies, dreams→hobbies, surprises→avoid, conflicts→avoid.

**Enregistrement d'une réponse (`recordAnswer`, l.194-269) :** upsert `profile_completion` (status `answered`/`skipped`), écrit la réponse dans `my_profile.discovery_answers[questionKey]` (si non skip), avance la session ; à la fin `status='completed'`.

**Libellés de section affichés (`DIMENSION_LABELS`) :** attention « Langage d'attention », gifts « Cadeaux », style « Style », brands « Marques », food « Restaurants », fragrance « Parfums », travel « Voyages », hobbies « Loisirs », dreams « Rêves », surprises « Surprises », conflicts « Conflits », practical « Pratique ».

---

## Statuts par question — `status.ts`

Type `QuestionStatus` : `not_started` | `answered` | `skipped` | `outdated` | `needs_precision` | `archived`.
- **Statuts BLOQUANTS** (`BLOCKING_STATUSES`) : `answered`, `archived` → la question ne réapparaît sur AUCUN chemin (elle devient « Modifier ma réponse » côté UI).
- Proposables : `skipped`, `outdated`, `needs_precision`, `not_started`.
- **Rétro-alimentation** : une donnée saisie au questionnaire (présente en fiche) vaut réponse → `answered` sans repasser par Discovery (`applyDataSync` pur + `writeSyncedStatuses` idempotent, sorti du rendu).

---

## Jauge de connaissance — formule exacte

**Ratio de base (`computeCompletion`, `sheet-data.ts`, l.111-127) :** 5 grandes parties du questionnaire, chacune vaut 1/5 :
`attention_reception` présent · `temperament_axes` présent · `lifestyle_axes` présent · `singularity_answers` non vide · `practical_info` présent.
`ratio = (nombre de parties remplies) / 5`.

**État + anneau (`computeKnowledge`, `v2-metrics.ts`, l.91-104) :** source UNIQUE de l'anneau, de la phrase et du CTA.
```
KNOW_RING_CAP = 0.85
ratio = clamp(questionnaireRatio, 0, 1)
si (aucune question disponible ET ratio >= 1) → { state: 4, ring: 1 }   // anneau fermé
sinon :
  state = ratio < 0.4 ? 1 : ratio < 0.8 ? 2 : 3
  ring  = hasAvailableQuestions ? min(ratio, 0.85) : ratio
  ring  = max(0.04, ring)
```
Tant qu'il reste une micro-question disponible, l'anneau est **plafonné à ~85 %** et l'état ne peut pas dépasser 3. L'état 4 (« anticipe pour toi ») exige questionnaire complet ET zéro question restante. **Jamais de chiffre / % affiché** (anneau conique sans nombre).

**Phrases à 4 états (`KNOW_PHRASES`, `v2-data.ts`, l.62-67), VERBATIM :**
- État 1 : « Candice **commence** à te connaître »
- État 2 : « Candice te connaît **bien** »
- État 3 : « Candice te connaît **très bien** »
- État 4 : « Candice **anticipe** pour toi »

---

## Points d'entrée & incitations (VERBATIM)

### Header de la fiche (`Header.tsx`)
- CTA texte champagne sous la phrase (états 1-3 seulement) : **« Améliorer encore sa connaissance → »** → `/moi/discovery?mode=full`.

### Module « Pour mieux viser » (`Viser.tsx`)
- Phrase d'intro VERBATIM : **« Quelques précisions suffisent pour que Candice évite les attentions à côté. »**
- Chaque nudge → `/moi/discovery?mode=full&section={sectionKey}`. Bouton : **« Affiner → »** (disponible) ou **« Modifier ma réponse »** (déjà répondu). Sous-titre nudge = `benefit_label · N question(s) · duration_label` (construit par `buildNudges`, `engine.ts`).

### Écran Discovery (`DiscoveryFlow.tsx`)
- Écran d'intro (mode `full`, sauf deep-link) — titre VERBATIM : **« Tu veux que Candice vise encore plus juste ? »**
  - Corps VERBATIM : « Réponds à quelques questions très courtes pour que tes proches comprennent mieux ce qui te touche vraiment : le bon cadeau, le bon restaurant, le bon week-end, le bon mot, le bon geste — sans avoir à deviner. »
  - Boutons : **« Affiner mon profil »** / **« Une seule question rapide »**
- Question : bouton **« Passer »** + **« Valider »**. Texte libre : indice « ⌘↵ pour valider », placeholder « Écris librement… ».
- Fin de lot — titre : « C'est tout pour maintenant. » (full) / « Merci. » (quick) ; sous-texte : « Candice met à jour ce qu'elle sait de toi. » / « Candice a bien noté ça. » ; CTA « Voir mon profil → ».
- Deux questions ont un rendu spécial (follow-ups obligatoires) : `practical.dietary` (précision allergie obligatoire) et `practical.mobility` (type + intensité obligatoires).

---

## BANQUE VERBATIM — les 70 questions par dimension

Format : `question_key` · type · sort_order · priority · locked_text · trigger_condition · updates_dimensions. Options : « Label » → `value`.

### Dimension `attention` (7) — libellé « Langage d'attention »

**`attention.reception`** · chips_multi · sort 10 · prio 50 · locked=false · trigger: `null` · updates: `null` · benefit « Des attentions qui te ressemblent vraiment » · durée « 1 min »
« Comment tu te sens vraiment aimé·e ? »
- « Par les mots » → `MOT`
- « Par les actes » → `SER`
- « Par des cadeaux » → `CAD_C`
- « Par le temps partagé » → `EXP`
- « Par les petites attentions » → `GES`
- « Par les surprises » → `SUR`

**`attention.detail_quality`** · chips_multi · sort 150 · locked=false · trigger: `petites_attentions selected or detected` · updates: detail_memory_importance, anticipation_importance, regularity_preference, personalization_requirement, daily_life_attention, charge_mental_relief
« Quand tu dis aimer les petites attentions, qu'est-ce qui te touche le plus concrètement ? »
- « Que l'autre se souvienne d'un détail que j'ai dit » → `remembers_details`
- « Qu'il/elle anticipe un besoin avant que je demande » → `anticipates_needs`
- « Qu'il/elle fasse quelque chose de simple mais régulier » → `regular_simple`
- « Qu'il/elle choisisse quelque chose uniquement pour moi » → `chosen_only_for_me`
- « Qu'il/elle pense à moi dans un moment ordinaire » → `thinks_in_ordinary`
- « Qu'il/elle m'enlève une petite charge du quotidien » → `relieves_daily_charge`

**`attention.words_quality`** · chips_multi · sort 160 · locked=false · trigger: `mots selected or detected` · updates: message_style, written_words_preference, recognition_need, effort_recognition_need, emotional_support_words
« Les mots qui te touchent vraiment sont plutôt… »
- « Très précis sur ce que l'autre aime chez moi » → `precise_about_me`
- « Courts mais sincères » → `short_sincere`
- « Longs et détaillés » → `long_detailed`
- « Écrits pour que je puisse les relire » → `written_to_reread`
- « Dits spontanément » → `spontaneous`
- « Liés à un effort qu'on a remarqué » → `effort_recognition`
- « Liés à une période difficile » → `support_in_hard_times`

**`attention.words_avoid`** · chips_multi · sort 170 · locked=false · trigger: `mots selected` · updates: avoid_generic_messages, words_need_actions, avoid_overdramatic_tone, avoid_delayed_words
« Les mots peuvent tomber à plat quand… »
- « Ils sont trop génériques » → `too_generic`
- « Ils arrivent trop tard » → `too_late`
- « Ils ne sont pas suivis d'actes » → `need_actions`
- « Ils sont trop grandiloquents » → `too_dramatic`
- « Ils évitent le vrai sujet » → `avoid_real_topic`
- « Ils ressemblent à une formule toute faite » → `formulaic`

**`attention.service_quality`** · chips_multi · sort 180 · locked=false · trigger: `actes / aide concrète / service selected` · updates: proactive_help, end_to_end_help, time_relief, day_smoothing, discreet_service
« Quand quelqu'un t'aide, ce qui te touche vraiment c'est qu'il/elle… »
- « Voie ce qu'il y a à faire sans que je demande » → `proactive`
- « Prenne en charge quelque chose jusqu'au bout » → `end_to_end`
- « Me libère du temps » → `time_relief`
- « Me facilite une journée compliquée » → `day_smoothing`
- « Fasse quelque chose d'utile mais avec délicatesse » → `discreet_service`
- « N'attende pas de reconnaissance immédiate » → `no_recognition_needed`

**`attention.gift_precision`** · chips_multi · sort 190 · locked=false · trigger: `cadeau choisi / cadeau symbolique selected` · updates: taste_accuracy_requirement, remembered_signal_importance, search_effort_importance, symbolic_object_preference, non_generic_requirement, quality_requirement
« Un cadeau pensé pour toi doit surtout montrer que… »
- « L'autre connaît mes goûts » → `knows_taste`
- « L'autre a retenu quelque chose que j'ai dit » → `remembered_signal`
- « L'autre a cherché quelque chose de précis » → `search_effort`
- « L'objet a une histoire ou un sens » → `symbolic_object`
- « Le cadeau n'aurait pas pu être offert à n'importe qui » → `non_generic`
- « La qualité est au rendez-vous » → `quality`

**`attention.experience_quality`** · chips_multi · sort 200 · locked=false · trigger: `experience selected` · updates: experience_escape, beautiful_place_importance, logistics_smoothness, emotional_intensity_experience, discovery_preference, quality_time_preference, no_logistics_need
« Une expérience réussie pour toi, c'est surtout… »
- « Un moment qui sort du quotidien » → `escape`
- « Un lieu vraiment beau » → `beautiful_place`
- « Une organisation fluide » → `logistics_smooth`
- « Une émotion forte » → `strong_emotion`
- « Une découverte » → `discovery`
- « Un moment de qualité à deux » → `quality_time`
- « Une parenthèse où je n'ai rien à gérer » → `no_logistics`

### Dimension `brands` (3) — libellé « Marques »

**`brands.favorites`** · text · sort 60 · locked=false · trigger: `null` · updates: `null` · benefit « Tes maisons préférées en tête des idées » · durée « 20 sec »
« Des marques, enseignes ou créateurs que tu adores ? »

**`brands.reference_free`** · text · sort 410 · locked=false · trigger: `marques aimées non détaillées` · updates: brands, gamme, style, aesthetic
« Cite 3 marques ou créateurs que tu aimes vraiment — même très différents. »

**`brands.beauty_reference`** · text · sort 450 · locked=false · trigger: `marques beauté non renseignées` · updates: brand, category, gamme
« Une marque beauté, parfum ou soin que tu aimes vraiment ? »

### Dimension `conflicts` (3) — libellé « Conflits »

**`conflicts.style`** · chips_single · sort 130 · locked=false · trigger: `null` · updates: `null` · benefit « Des attentions justes, même les jours sensibles » · durée « 20 sec »
« Face à une tension, comment tu réagis ? »
- « J'en parle directement » → `direct`
- « J'ai besoin de recul » → `space`
- « Je préfère éviter » → `avoids`
- « Je dédramatise » → `humor`

**`conflicts.repair_strategy`** · chips_multi · sort 510 · locked=false · trigger: `conflit / réparation non précisé` · updates: conflict_repair_strategy, apology_style, repair_attention_allowed
« Après une tension, ce qui aide vraiment à réparer pour toi, c'est… »
- « Des excuses précises » → `precise_apology`
- « Un message écrit » → `written_message`
- « Une discussion calme » → `calm_discussion`
- « Une preuve que l'autre a compris » → `proof_understood`
- « Un geste concret » → `concrete_gesture`
- « Un moment ensemble » → `time_together`
- « Un peu de temps » → `time_alone`
- « Pas de cadeau, surtout une vraie parole » → `words_not_gift`

**`conflicts.repair_avoid`** · chips_multi · sort 520 · locked=false · trigger: `conflit / réparation non précisé` · updates: conflict_avoidance_rules, post_conflict_forbidden_actions
« Après une dispute, ce qui serait maladroit… »
- « Faire comme si rien ne s'était passé » → `ignore_conflict`
- « Offrir un cadeau sans parler » → `gift_without_words`
- « Mettre de l'humour trop vite » → `humor_too_soon`
- « Insister alors que j'ai besoin d'espace » → `insist_when_need_space`
- « Dramatiser » → `dramatize`
- « Se justifier » → `justify`
- « Attendre trop longtemps » → `wait_too_long`

### Dimension `dreams` (4) — libellé « Rêves »

**`dreams.current`** · text · sort 110 · locked=false · trigger: `null` · updates: `null` · benefit « Ce dont tu rêves, gardé pour le bon moment » · durée « 20 sec »
« Tu as des envies ou des rêves en ce moment ? »

**`dreams.destination`** · text · sort 340 · locked=false · trigger: `destination rêve non renseignée` · updates: destination, hotel, experience_type, wishlist_high_priority
« Une destination, un hôtel ou une expérience dont tu rêves en ce moment ? »

**`dreams.wish_priority`** · text · sort 630 · locked=false · trigger: `envies / rêves du moment renseignés` · updates: dream_priority, wishlist_priority, high_emotional_impact_candidate
« Parmi tes envies du moment, laquelle te ferait le plus plaisir si quelqu'un t'aidait à la réaliser ? »

**`dreams.wishlist_first`** · text · sort 640 · locked=false · trigger: `wishlist vide` · updates: object, experience, venue, brand, timing, emotional_priority
« Une chose que tu aimerais recevoir, vivre ou faire dans les prochains mois ? »

### Dimension `food` (6) — libellé « Restaurants »

**`food.restaurants`** · chips_multi · sort 70 · locked=false · trigger: `null` · updates: `null` · benefit « Des tables choisies comme tu les aimes » · durée « 30 sec »
« Tu préfères quel type de table ? »
- « Bistrot convivial » → `bistro` · « Gastronomique » → `gastronomic` · « Bonne adresse décontractée » → `casual_good` · « Cuisine du monde » → `world` · « Végétarien / healthy » → `veggie` · « Tout si c'est bon » → `anything_good`

**`food.deal_breakers`** · chips_multi · sort 250 · locked=false · trigger: `gastronomie / restaurant / belles tables selected` · updates: restaurant_deal_breakers, restaurant_selection_rules, ambience_avoidance, min_quality_threshold
« Pour un restaurant surprise, qu'est-ce qui peut vraiment gâcher l'expérience ? »
- « Trop bruyant » → `too_loud` · « Tables trop serrées » → `too_crowded` · « Service froid » → `cold_service` · « Cuisine moyenne » → `average_food` · « Lieu sans charme » → `no_charm` · « Mauvaise lumière » → `bad_light` · « Trop prétentieux » → `too_pretentious` · « Trop simple / cheap » → `too_cheap` · « Trop loin » → `too_far` · « Menu trop limité » → `limited_menu` · « Mauvais rapport qualité-prix » → `bad_value`

**`food.success_driver`** · chips_single · sort 260 · locked=false · trigger: `restaurant selected` · updates: restaurant_success_driver, restaurant_search_priority
« Un restaurant réussi pour toi, c'est d'abord… »
- « La cuisine » → `cuisine` · « L'ambiance » → `ambiance` · « Le service » → `service` · « Le lieu » → `venue` · « La vue » → `view` · « Le confort » → `comfort` · « La rareté de l'adresse » → `rarity` · « Le fait que ce soit vivant » → `lively` · « Le fait que ce soit intime » → `intimate`

**`food.cuisine_preferences`** · chips_multi · sort 270 · locked=false · trigger: `cuisine du monde / gastronomie / restaurant selected` · updates: cuisine_preferences, restaurant_dynamic_search_filters
« Côté cuisine, ce qui te ferait vraiment plaisir en ce moment serait plutôt… »
- « Français » → `french` · « Italien » → `italian` · « Japonais » → `japanese` · « Libanais » → `lebanese` · « Méditerranéen » → `mediterranean` · « Thaï » → `thai` · « Indien » → `indian` · « Mexicain » → `mexican` · « Tapas » → `tapas` · « Fruits de mer » → `seafood` · « Pâtisserie / tea time » → `pastry` · « Cuisine végétale » → `plant_based` · « Je préfère être surpris·e si c'est très bon » → `surprise_me`

**`food.reference_address`** · text · sort 280 · locked=false · trigger: `restaurants aimés non renseignés` · updates: favorite_restaurants, restaurant_style_reference
« Donne une adresse que tu adores, même simple. Candice s'en servira comme référence de goût. »

**`food.reco_strategy`** · chips_single · sort 290 · locked=false · trigger: `restaurants score fort` · updates: restaurant_reco_strategy
« Pour une recommandation restaurant, Candice doit plutôt viser… »
- « Très bien noté, même simple » → `well_rated` · « Beau lieu avant tout » → `beautiful_venue` · « Cuisine excellente avant tout » → `excellent_cuisine` · « Ambiance vivante » → `lively` · « Adresse chic » → `chic` · « Adresse cachée » → `hidden` · « Valeur sûre » → `safe_bet` · « Surprise originale » → `original_surprise`

### Dimension `fragrance` (6) — libellé « Parfums »

**`fragrance.family`** · chips_multi · sort 80 · **statut ARCHIVED** · locked=false · trigger: `null` · updates: `null`
« Tu portes plutôt quel type de parfum ? »
- « Fleuri » → `floral` · « Frais / citrus » → `fresh` · « Boisé » → `woody` · « Oriental / Ambré » → `oriental` · « Poudré » → `powder` · « Gourmand » → `gourmand` · « Discret » → `light` · « Sans parfum » → `none`

**`fragrance.perfume_risk`** · chips_single · sort 420 · **locked=true** · trigger: `parfum / beauté detected` · updates: perfume_gift_risk, perfume_preference, home_fragrance_preference · benefit « Éviter les cadeaux beauté à côté »
« Recevoir un parfum, pour toi, c'est… »
- « Je préfère choisir moi-même » → `choose_myself` · « Possible si la personne connaît très bien mes goûts » → `if_knows_taste` · « Seulement une marque que j'aime déjà » → `known_brand_only` · « Plutôt une bougie ou un parfum d'intérieur » → `home_fragrance` · « Je n'aime pas recevoir de parfum » → `avoid`

**`fragrance.families`** · chips_multi · sort 425 · **locked=true** · trigger: `null` · updates: fragrance_families · benefit « Des cadeaux parfum qui te ressemblent »
« Les familles olfactives qui te plaisent le plus »
- « Poudré » → `powdery` · « Musqué propre » → `clean_musk` · « Floral blanc » → `white_floral` · « Floral frais » → `fresh_floral` · « Ambré doux » → `soft_amber` · « Vanillé léger » → `light_vanilla` · « Boisé » → `woody` · « Hespéridé » → `citrus` · « Thé-aromatique » → `tea_aromatic` · « Peau propre » → `clean_skin` · « Je ne sais pas » → `unknown`

**`fragrance.gender_orientation`** · chips_single · sort 425 · locked=false · trigger: `null` · updates: fragrance_gender_orientation
« Pour les parfums, tu te guides plutôt vers… »
- « Les parfums rayon femme » → `femme` · « Les parfums rayon homme » → `homme` · « Les parfums mixtes / unisexes » → `mixte` · « Peu importe le rayon si j'aime le parfum » → `indifferent` · « Je préfère ne pas préciser » → `unspecified`

**`fragrance.beauty_gift`** · chips_multi · sort 430 · **statut ARCHIVED** · locked=false · trigger: `beauté / soin detected` · updates: beauty_gift_strategy, skincare_risk, spa_preference, known_product_preference
« Un cadeau beauté réussi, c'est plutôt… »
- « Une marque experte » → `expert_brand` · « Une marque sensorielle » → `sensory_brand` · « Un soin en institut » → `institute_care` · « Un massage » → `massage` · « Un produit que j'utilise déjà » → `known_product` · « Un produit découverte » → `discovery_product` · « Un coffret premium » → `premium_set` · « Je préfère éviter » → `avoid`

**`fragrance.scent_deal_breakers`** · chips_multi · sort 440 · **locked=true** · trigger: `odeurs / parfums detected` · updates: scent_deal_breakers · benefit « Écarter ce qui gâche un parfum »
« À éviter absolument »
- « Trop sucré » → `too_sweet` · « Patchouli » → `patchouli` · « Très entêtant » → `too_heady` · « Trop fruité » → `too_fruity` · « Trop vanillé » → `too_vanilla` · « Trop masculin » → `too_masculine` · « Trop floral » → `too_floral` · « Parfum trop connu » → `too_common` · « Je ne sais pas » → `unknown`

### Dimension `gifts` (6) — libellé « Cadeaux »

**`gifts.what_works`** · chips_multi · sort 20 · locked=false · trigger: `null` · updates: `null` · benefit « Des idées cadeaux qui visent juste » · durée « 30 sec »
« Quel type de cadeau te touche vraiment ? »
- « Expériences » → `experiences` · « Personnalisé » → `personalized` · « Utile et beau » → `practical` · « Beauté / bien-être » → `beauty` · « Livres / culture » → `culture` · « Fait main » → `handmade` · « Surprise totale » → `surprise`

**`gifts.to_avoid`** · text · sort 30 · locked=false · trigger: `null` · updates: `null`
« Des cadeaux ou attentions à éviter absolument ? »

**`gifts.object_quality`** · chips_multi · sort 210 · locked=false · trigger: `cadeau matériel selected` · updates: object_quality_driver, brand_importance, style_precision_required, rarity_preference, personalization_preference, utility_preference, story_value
« Quand on t'offre un objet, qu'est-ce qui fait la différence entre "sympa" et "vraiment réussi" ? »
- « La qualité de la matière » → `material_quality` · « La marque ou le créateur » → `brand` · « Le fait que ce soit exactement mon style » → `my_style` · « Le fait que ce soit rare ou difficile à trouver » → `rare` · « Le fait que ce soit personnalisé » → `personalized` · « Le fait que ce soit utile au quotidien » → `useful` · « Le fait que ça ait une histoire » → `has_story`

**`gifts.risky_categories`** · chips_multi · sort 220 · locked=false · trigger: `objet / mode / beauté / bijou / déco detected` · updates: risky_categories, admin_validation_required_by_category, prefer_choose_together
« Quel type d'objet est le plus risqué à t'offrir sans te demander ? »
- « Vêtement » → `clothing` · « Bijou » → `jewelry` · « Parfum » → `perfume` · « Décoration » → `decoration` · « Livre » → `book` · « Beauté / skincare » → `beauty` · « Tech » → `tech` · « Accessoire » → `accessory` · « Tout objet trop personnel est risqué » → `all_personal` · « Rien, je suis assez facile » → `none`

**`gifts.quality_non_negotiable`** · chips_multi · sort 230 · locked=false · trigger: `qualité / standing / raffinement detected` · updates: quality_must_have_by_category, premium_threshold_by_category, avoid_low_quality_by_category
« Dans quelles catégories la qualité est non négociable pour toi ? »
- « Hôtel » → `hotel` · « Restaurant » → `restaurant` · « Bijou » → `jewelry` · « Vêtement » → `clothing` · « Sac / maroquinerie » → `bag` · « Parfum » → `perfume` · « Beauté / soin » → `beauty` · « Literie » → `bedding` · « Spa / massage » → `spa` · « Alimentaire » → `food` · « Je suis assez flexible » → `flexible`

**`gifts.impersonal_definition`** · chips_multi · sort 240 · locked=false · trigger: `cadeau impersonnel mentioned in avoidances` · updates: impersonal_gift_definition, requires_contextualization, requires_personal_note, avoid_generic_supplier
« Pour toi, un cadeau devient impersonnel quand… »
- « Il pourrait être offert à n'importe qui » → `could_be_for_anyone` · « Il ne tient pas compte de mon style » → `ignores_style` · « Il est acheté à la dernière minute » → `last_minute` · « Il vient d'une enseigne trop générique » → `generic_store` · « Il n'a aucun mot ou contexte » → `no_note` · « Il ne correspond pas à ce que je vis en ce moment » → `not_current`

### Dimension `hobbies` (11) — libellé « Loisirs »

**`hobbies.main`** · text · sort 100 · locked=false · trigger: `null` · updates: `null` · benefit « Des moments qui te nourrissent vraiment » · durée « 30 sec »
« Qu'est-ce qui te ressource vraiment ? »

**`hobbies.book_conditions`** · chips_multi · sort 350 · locked=false · trigger: `lecture / livre / BD detected` · updates: book_gift_conditions, author_importance, beautiful_edition_preference, personal_note_required, book_risk_score, graphic_novel_relevance
« Un livre en cadeau peut vraiment te plaire si… »
- « C'est un auteur que j'aime déjà » → `known_author` · « C'est une très belle édition » → `beautiful_edition` · « C'est recommandé avec un mot personnel » → `with_personal_note` · « C'est un livre qui correspond à une période de ma vie » → `matches_life_period` · « C'est une BD / un roman graphique choisi avec soin » → `graphic_novel` · « C'est un livre rare ou signé » → `rare_signed` · « C'est plutôt risqué, je préfère choisir moi-même » → `prefer_choose`

**`hobbies.book_avoidance`** · chips_multi · sort 360 · locked=false · trigger: `lecture detected` · updates: book_avoidance, sensitive_topics, avoid_trendy_books, avoid_moralizing_gifts
« Un livre risque de tomber à plat si… »
- « Il est trop "développement personnel" évident » → `too_self_help` · « Il est trop intellectuel » → `too_intellectual` · « Il est trop léger » → `too_light` · « Il ne correspond pas à mon style » → `wrong_style` · « Il est choisi parce qu'il est à la mode » → `too_trendy` · « Il ressemble à une leçon déguisée » → `moralizing` · « Il parle d'un sujet sensible » → `sensitive_topic`

**`hobbies.book_reference`** · text · sort 370 · locked=false · trigger: `auteur / livre préféré non renseigné` · updates: author, title, genre, format, universe
« Cite un auteur, une autrice, une BD ou un livre que tu aimes vraiment. »

**`hobbies.home_gift_safe`** · chips_single · sort 560 · locked=false · trigger: `déco / maison detected` · updates: home_gift_safe_categories, home_gift_risk
« Pour la maison, ce qui est le moins risqué à t'offrir… »
- « Bougie / parfum d'intérieur » → `candle` · « Art de la table » → `tableware` · « Linge de maison » → `linen` · « Beau livre » → `coffee_table_book` · « Petit objet design » → `design_object` · « Plante » → `plant` · « Céramique » → `ceramic` · « Rien, je préfère choisir moi-même » → `prefer_choose`

**`hobbies.home_deal_breakers`** · chips_multi · sort 570 · locked=false · trigger: `déco / maison detected` · updates: home_decor_deal_breakers
« En déco, ce qui peut vite tomber à côté pour toi… »
- « Objet trop kitsch » → `too_kitsch` · « Mauvaise couleur » → `bad_color` · « Mauvaise matière » → `bad_material` · « Objet trop imposant » → `too_imposing` · « Style trop froid » → `too_cold` · « Style trop rustique » → `too_rustic` · « Objet sans utilité » → `useless` · « Cadeau qui encombre » → `clutters`

**`hobbies.wellness_gift`** · chips_multi · sort 580 · locked=false · trigger: `sport / bien-être detected` · updates: wellness_gift_strategy, spa_preference, massage_preference, retreat_interest
« Une attention bien-être réussie pour toi, c'est plutôt… »
- « Massage » → `massage` · « Spa » → `spa` · « Cours privé » → `private_class` · « Retraite » → `retreat` · « Moment de calme » → `quiet_time` · « Accessoire de qualité » → `quality_accessory` · « Abonnement » → `subscription` · « Expérience douce » → `gentle_experience` · « Je préfère éviter les cadeaux bien-être » → `avoid`

**`hobbies.sport_risk`** · chips_multi · sort 590 · locked=false · trigger: `sport detected` · updates: sport_gift_risks, avoid_body_related_gifts
« Un cadeau sport est risqué si… »
- « Il n'est pas adapté à ma pratique » → `wrong_practice` · « Il est trop technique » → `too_technical` · « Il est trop bas de gamme » → `low_quality` · « Il suppose que je veux performer » → `performance_assumption` · « Il touche au corps / au poids » → `body_related` · « Il est choisi sans connaître mes habitudes » → `unknown_habits` · « Je préfère choisir moi-même » → `prefer_choose`

**`hobbies.culture_success`** · chips_multi · sort 600 · locked=false · trigger: `culture / art detected` · updates: culture_success_driver, cultural_event_recommendation_rules
« Une sortie culturelle réussie pour toi, c'est surtout… »
- « Une très belle œuvre » → `great_artwork` · « Un lieu magnifique » → `beautiful_venue` · « Une émotion forte » → `strong_emotion` · « Une découverte » → `discovery` · « Un moment élégant » → `elegant` · « Une sortie facile à organiser » → `easy_logistics` · « Une discussion après » → `discussion_after` · « Un événement rare » → `rare_event`

**`hobbies.concert_criteria`** · chips_multi · sort 610 · locked=false · trigger: `musique / concert detected` · updates: concert_selection_rules, seat_quality_importance
« Pour un concert ou spectacle, ce qui compte le plus… »
- « L'artiste » → `artist` · « La qualité des places » → `seat_quality` · « L'ambiance » → `ambiance` · « Le lieu » → `venue` · « Le confort » → `comfort` · « Y aller avec la bonne personne » → `right_company` · « Ne pas être trop loin / mal placé » → `good_position` · « Le côté événement rare » → `rare_event`

**`hobbies.artist_reference`** · text · sort 620 · locked=false · trigger: `artiste non renseigné` · updates: artist, venue, event, style
« Un artiste, spectacle ou lieu culturel que tu aimerais voir ? »

### Dimension `practical` (6) — libellé « Pratique »

**`practical.dietary`** · chips_multi · sort 140 · locked=false · trigger: `null` · updates: `null` · benefit « Zéro faux pas sur l'essentiel » *(rendu spécial : précision allergie obligatoire)*
« Côté repas, y a-t-il des règles que tes proches doivent absolument connaître ? »
- « Végétarien·ne » → `vegetarian` · « Vegan » → `vegan` · « Halal » → `halal` · « Casher » → `casher` · « Sans alcool » → `no_alcohol` · « Allergie alimentaire » → `food_allergy` · « Aucune » → `none`

**`practical.mobility`** · chips_single · sort 141 · locked=false · trigger: `null` · updates: `null` *(rendu spécial : type + intensité obligatoires)*
« Y a-t-il quelque chose que ton corps te demande de respecter ? (marche, escaliers, station debout…) »
- « Oui » → `yes` · « Non » → `no`

**`practical.logistics_relief`** · chips_multi · sort 490 · locked=false · trigger: `charge mentale / fatigue / besoin d'organisation detected` · updates: logistics_relief_targets, no_logistics_need, support_attention_candidates
« Quand quelqu'un veut te faire du bien, qu'est-ce qui t'enlève un vrai poids des épaules ? »
- « Qu'on réserve à ma place » → `reservation` · « Qu'on gère le trajet » → `transport` · « Qu'on s'occupe des enfants » → `children` · « Qu'on pense au repas » → `meal` · « Qu'on fasse les courses » → `groceries` · « Qu'on gère le ménage » → `cleaning` · « Qu'on cale le bon moment » → `timing` · « Qu'on prenne la décision pour moi » → `decision` · « Qu'on règle les détails » → `practical_details` · « Qu'on assure le suivi après » → `follow_up`

**`practical.control_delegation`** · chips_single · sort 500 · locked=false · trigger: `aime qu'on organise / surprise / charge mentale detected` · updates: control_vs_delegation, decision_relief, validation_need
« Quand quelqu'un organise pour toi, tu préfères… »
- « Qu'il décide vraiment » → `decide_all` · « Qu'il me propose 2 options » → `two_options` · « Qu'il me laisse valider les détails » → `validate_details` · « Qu'il gère tout sauf la date » → `all_except_date` · « Qu'il me surprenne mais me rassure » → `surprise_but_reassure` · « Qu'il ne décide pas à ma place » → `no_decide_for_me`

**`practical.important_dates`** · text · sort 650 · locked=false · trigger: `dates importantes incomplètes` · updates: important_dates, event_trigger_engine
« Y a-t-il une date que tes proches ne devraient pas oublier ? »

**`practical.date_attention`** · chips_multi · sort 660 · locked=false · trigger: `date ajoutée sans préférence d'attention` · updates: event_attention_preferences
« Pour cette date, tu aimerais plutôt… »
- « Un message » → `message` · « Un moment ensemble » → `time_together` · « Un cadeau » → `gift` · « Une surprise » → `surprise` · « Une expérience » → `experience` · « Rien de grand, juste qu'on y pense » → `just_remember` · « Quelque chose organisé à l'avance » → `planned_ahead`

### Dimension `style` (9) — libellé « Style »

**`style.clothing`** · chips_multi · sort 40 · locked=false · trigger: `null` · updates: `null` · benefit « Des choix à ton goût, jamais à côté » · durée « 30 sec »
« Tu te décrirais avec quel style ? »
- « Classique » → `classic` · « Bohème » → `boho` · « Minimaliste » → `minimal` · « Chic parisien » → `chic` · « Décontracté » → `casual` · « Sportswear » → `sport` · « Mode / tendance » → `trendy`

**`style.colors`** · text · sort 50 · locked=false · trigger: `null` · updates: `null`
« Tes couleurs et matières préférées pour te faire plaisir ? »

**`style.fashion_gift_risk`** · chips_single · sort 380 · locked=false · trigger: `mode / vêtements / marques detected` · updates: fashion_gift_risk, prefer_choose_together, safe_fashion_categories
« Si quelqu'un veut t'offrir quelque chose lié à la mode, le moins risqué serait… »
- « M'emmener choisir » → `choose_together` · « Carte cadeau d'une marque que j'aime » → `gift_card` · « Accessoire » → `accessory` · « Bijou » → `jewelry` · « Foulard / belle matière » → `scarf` · « Sac / petite maroquinerie » → `bag` · « Vêtement uniquement si taille et style sûrs » → `clothing_if_sure` · « Ne pas m'offrir de mode » → `avoid_fashion`

**`style.jewelry_style`** · chips_multi · sort 390 · locked=false · trigger: `bijoux detected` · updates: jewelry_style, jewelry_material, symbolic_jewelry_preference, jewelry_brand_importance
« Un bijou réussi pour toi, c'est plutôt… »
- « Fin et discret » → `delicate` · « Visible / affirmé » → `bold` · « Doré » → `gold` · « Argenté » → `silver` · « Avec pierre » → `with_stone` · « Personnalisé / gravé » → `personalized` · « Symbolique » → `symbolic` · « Très mode » → `trendy` · « Intemporel » → `timeless` · « D'une marque précise » → `specific_brand`

**`style.fashion_deal_breakers`** · chips_multi · sort 400 · locked=false · trigger: `mode / style detected` · updates: fashion_deal_breakers, avoid_bad_fit, avoid_bad_material, avoid_wrong_brand
« Côté style, ce qu'il faut éviter absolument… »
- « Trop classique » → `too_classic` · « Trop cheap » → `too_cheap` · « Trop voyant » → `too_flashy` · « Trop discret » → `too_discreet` · « Mauvaise matière » → `bad_material` · « Mauvaise coupe » → `bad_fit` · « Mauvaise taille » → `wrong_size` · « Trop "cadeau par défaut" » → `default_gift` · « Marque que je n'aime pas » → `wrong_brand`

**`style.material_preferences`** · chips_multi · sort 530 · locked=false · trigger: `mode / déco / beauté / matières detected` · updates: material_preferences, premium_material_signals
« Les matières qui te donnent vraiment une impression de qualité… »
- « Cachemire » → `cashmere` · « Soie » → `silk` · « Cuir » → `leather` · « Daim » → `suede` · « Lin » → `linen` · « Coton épais » → `thick_cotton` · « Laine mérinos » → `merino` · « Céramique » → `ceramic` · « Bois » → `wood` · « Verre soufflé » → `blown_glass` · « Métal doré » → `gold_metal` · « Pierre naturelle » → `natural_stone`

**`style.material_avoidance`** · chips_multi · sort 540 · locked=false · trigger: `mode / déco / matières detected` · updates: material_avoidance
« Les matières qui peuvent te déplaire… »
- « Synthétique » → `synthetic` · « Laine qui gratte » → `scratchy_wool` · « Polyester » → `polyester` · « Matière trop rigide » → `too_rigid` · « Matière trop fragile » → `too_fragile` · « Faux cuir » → `faux_leather` · « Fourrure » → `fur` · « Plastique » → `plastic` · « Je ne sais pas » → `unknown`

**`style.cross_gender`** · chips_multi · sort 545 · locked=false · trigger: `null` · updates: style_cross_gender, style_gender_orientation, fit_preference
« Pour les vêtements et accessoires, tu te repères plutôt dans… »
- « Le rayon femme » → `femme` · « Le rayon homme » → `homme` · « Les deux — je mélange » → `mixte` · « Les pièces unisexes avant tout » → `unisexe` · « Ça dépend de la pièce » → `depends` · « Je préfère ne pas préciser » → `unspecified`

**`style.color_safe`** · chips_multi · sort 550 · locked=false · trigger: `mode / déco / objet detected` · updates: color_safe_choices, color_avoidance_if_free_text
« Si on t'offre un objet, un vêtement ou un accessoire, les couleurs les plus sûres sont… »
- « Noir » → `black` · « Blanc » → `white` · « Beige » → `beige` · « Bleu ciel » → `light_blue` · « Marine » → `navy` · « Vert » → `green` · « Rouge » → `red` · « Rose pâle » → `pale_pink` · « Doré » → `gold` · « Argenté » → `silver` · « Tons neutres » → `neutral_tones` · « Couleurs fortes » → `bold_colors` · « Je préfère choisir » → `prefer_choose`

### Dimension `surprises` (4) — libellé « Surprises »

**`surprises.preference`** · chips_single · sort 120 · locked=false · trigger: `null` · updates: `null` · benefit « Des surprises bien dosées, jamais subies » · durée « 20 sec »
« Tu es plutôt… »
- « J'adore les surprises » → `loves` · « Ça dépend du contexte » → `depends` · « Je préfère être prévenu·e » → `notice` · « Les surprises me stressent » → `dislikes`

**`surprises.conditions`** · chips_multi · sort 460 · locked=false · trigger: `surprise ouverte / partielle detected` · updates: surprise_conditions, surprise_logistics_requirements, surprise_social_boundary
« Tu peux aimer une surprise si… »
- « Je connais au moins l'horaire » → `know_schedule` · « Je sais comment m'habiller » → `know_dress_code` · « Je sais combien de temps ça dure » → `know_duration` · « Je peux refuser sans gêne » → `can_decline` · « Ce n'est pas devant trop de monde » → `not_too_public` · « C'est organisé par quelqu'un de très proche » → `very_close_person` · « C'est très bien préparé » → `well_prepared`

**`surprises.briefing_needed`** · chips_multi · sort 470 · locked=false · trigger: `surprise detected` · updates: surprise_briefing_needed
« Avant une surprise, tu as besoin de savoir au minimum… »
- « L'heure » → `time` · « La tenue » → `dress_code` · « La durée » → `duration` · « Le lieu approximatif » → `approx_location` · « Si je dois prévoir une garde d'enfant » → `childcare` · « Si c'est intime ou social » → `intimate_or_social` · « Rien, j'aime la surprise totale » → `total_surprise`

**`surprises.deal_breakers`** · chips_multi · sort 480 · locked=false · trigger: `surprise négative ou prudente detected` · updates: surprise_deal_breakers
« La surprise à éviter absolument pour toi, ce serait… »
- « Une surprise en public » → `public` · « Une surprise avec trop de monde » → `too_many_people` · « Une surprise qui change mon planning » → `changes_plans` · « Une surprise où je ne sais pas comment m'habiller » → `no_dress_code` · « Une surprise trop chère » → `too_expensive` · « Une surprise trop intime » → `too_intimate` · « Une surprise qui ne me ressemble pas » → `not_me`

### Dimension `travel` (5) — libellé « Voyages »

**`travel.style`** · chips_multi · sort 90 · locked=false · trigger: `null` · updates: `null` · benefit « Des escapades taillées pour toi » · durée « 30 sec »
« Quand tu voyages, tu cherches… »
- « L'aventure » → `adventure` · « La culture » → `culture` · « Le repos total » → `relax` · « La nature » → `nature` · « Les villes animées » → `city` · « La gastronomie locale » → `gastro` · « Le luxe discret » → `luxury`

**`travel.hotel_criteria`** · chips_multi · sort 300 · locked=false · trigger: `voyage / week-end / hôtel / luxe detected` · updates: hotel_success_drivers, hotel_must_have, hotel_style_preference, premium_threshold_hotel
« Quand tu parles d'un "bel endroit", qu'est-ce qui compte vraiment ? »
- « Literie parfaite » → `perfect_bedding` · « Décoration / architecture » → `decor` · « Service impeccable » → `service` · « Spa / piscine » → `spa` · « Vue » → `view` · « Calme » → `quiet` · « Chambre spacieuse » → `spacious` · « Très bon restaurant » → `great_restaurant` · « Emplacement idéal » → `location` · « Atmosphère intime » → `intimate` · « Palace / grand luxe » → `palace` · « Boutique-hôtel de charme » → `boutique`

**`travel.deal_breakers`** · chips_multi · sort 310 · locked=false · trigger: `voyage / week-end detected` · updates: travel_deal_breakers, avoid_rustic, avoid_average_hotel, no_logistics_need, max_program_density
« Ce qui peut vraiment gâcher un week-end pour toi… »
- « Mauvaise literie » → `bad_bedding` · « Hôtel moyen » → `average_hotel` · « Trop de route » → `too_much_driving` · « Trop de logistique » → `too_much_logistics` · « Lieu sans charme » → `no_charm` · « Programme trop chargé » → `overloaded_schedule` · « Mauvaise nourriture » → `bad_food` · « Trop rustique » → `too_rustic` · « Pas assez confortable » → `not_comfortable` · « Trop isolé » → `too_isolated` · « Trop touristique » → `too_touristy` · « Pas assez premium » → `not_premium`

**`travel.hotel_standard`** · chips_single · sort 320 · locked=false · trigger: `hôtel / confort / luxe detected` · updates: hotel_minimum_standard, budget_expectation, premium_threshold_hotel
« Pour un week-end surprise, ton niveau de confort minimum serait plutôt… »
- « Peu importe si l'expérience est forte » → `experience_first` · « Hôtel confortable et propre » → `comfortable` · « Très bon 4 étoiles » → `four_stars` · « 5 étoiles si possible » → `five_stars` · « Boutique-hôtel très soigné » → `boutique` · « Palace / très luxe pour les grandes occasions » → `palace`

**`travel.distance_tolerance`** · chips_single · sort 330 · locked=false · trigger: `week-end / voyage surprise detected` · updates: travel_distance_tolerance, logistics_constraints
« Pour une surprise week-end, tu es prêt·e à faire combien de trajet ? »
- « Moins d'1h » → `under_1h` · « 1 à 2h » → `1_2h` · « 2 à 3h » → `2_3h` · « 3 à 5h » → `3_5h` · « Train OK » → `train_ok` · « Avion OK » → `plane_ok` · « Ça dépend si le lieu vaut vraiment le coup » → `depends`

---

*Note : `free_text_enabled = false` sur les 70 lignes ; les questions `type = text` recueillent quand même du texte libre (le champ `free_text_enabled` concerne un complément texte optionnel sur une question à chips, ici jamais activé). `priority = 50` sur les 70 lignes (le tri se joue donc surtout sur `computeGapScore` puis `sort_order`).*


---

<!-- ============ 09-recommandations ============ -->

# Cartographie — 09. Recommandations

> Ce document décrit **ce qui existe réellement** dans le code autour des recommandations, sans jugement ni conseil.
> Source indiquée partout : `(fichier: …)` ou `(base: …)`. « non vérifié » quand l'information n'a pas pu être établie.
> Statuts : ✅ branché et utilisé · 🟡 partiel · ⚫ code présent mais jamais alimenté/appelé · ❌ absent.
>
> **Volumes réels (base) au moment de la cartographie : TOUTES les tables concernées sont à 0 ligne.** La connexion base (`SUPABASE_DB_URL` de `.env.local`) répond correctement mais renvoie zéro partout — il s'agit d'une base de développement/QA vide, pas de la production. Les volumes de prod ne sont donc **pas** connus ici (non vérifié).

---

## Vue d'ensemble : il y a TROIS systèmes distincts, pas un seul

Le mot « recommandation » recouvre trois briques séparées, qui n'écrivent pas dans les mêmes tables et ne se parlent pas entre elles :

| # | Brique | Fichier moteur | Table écrite | Déclenché par | Statut |
|---|--------|----------------|--------------|---------------|--------|
| (a) | **Moteur reco v1** (idées d'attention sur la fiche proche) | `src/lib/recommendations/engine.ts` | `contact_recommendations` | Bouton « Générer » sur la fiche proche (action manuelle du pilote) | ✅ branché |
| (b) | **Signaux + suggestions proactives** (le cron qui repère les moments) | `src/lib/signals/detector.ts` + `src/lib/signals/generator.ts` | `contextual_signals` puis `proactive_suggestions` | Cron `detect-and-generate` (2×/jour) | ✅ branché |
| (c) | **Espace Proche V2** (mini-app 3 onglets `/proche/[id]`) | *(aucun moteur trouvé)* | `contact_reco_items` | *(rien ne l'alimente)* | ⚫ code mort côté génération |

Les briques (a) et (b) appellent toutes les deux le **même modèle LLM** : `claude-sonnet-4-6`. La brique (c) n'appelle aucun LLM et n'a aucun producteur.

---

## (a) Moteur reco v1 — `src/lib/recommendations/engine.ts` ✅

### Ce qu'il fait, en clair

Sur la fiche d'un proche, le pilote peut cliquer pour « générer » 1 à 3 idées d'attention concrètes (un message, un geste, un cadeau…), chacune rattachée à un « langage d'attention » (les 7 dimensions MOT/SER/CAD_C/CAD_S/EXP/GES/SUR). Le moteur :

1. **Calcule une « kadence »** (`haute` / `moyenne` / `basse`) à partir du registre de relation et du profil (`computeKadenceFromProfile`, fichier: engine.ts lignes 63-94). Le registre prime sur tout : par ex. `très_proche_fluide` → `haute`, `compliquée_fragile` → `basse`.
2. **Détecte un « angle mort »** (`detectBlindSpot`, lignes 98-119) : les dimensions auxquelles le proche est sensible mais que le pilote n'exprime pas spontanément. Verbatim de la note générée : `« {Prénom} est particulièrement sensible à {dims} — c'est là que tu peux avoir le plus d'impact avec de petits efforts. »`
3. **Construit une liste de veto (« filtres durs »)** (`buildVetoList`, lignes 123-152) : alcool, halal, casher, contraintes de mobilité, allergies, anti-surprises, interdits relationnels, etc. Ces mots sont interdits dans les idées.
4. **Assemble un contexte texte** riche (`buildContextString`, lignes 197-310) : registre, langages d'attention, caractéristiques relationnelles, singularité (ce qu'il adore, ses rêves, marques/lieux), profil classique, centres d'intérêt, dates importantes, contexte récent, **historique de feedback** (attentions « à côté » = soft veto, « justes » = à favoriser, « pas le moment » = ajuster la cadence), et « déjà proposé récemment » (anti-répétition).
5. **Appelle le LLM**, filtre les idées qui violeraient un veto (`passesVeto`), marque celles qui touchent un angle mort.
6. **Repli déterministe** (`buildFallbackIdeas`, lignes 161-184) : si le LLM échoue ou ne renvoie rien d'exploitable, une idée générique unique est fabriquée sans IA (basée sur la dimension dominante).

### Modèle LLM

- **Modèle : `claude-sonnet-4-6`** (fichier: engine.ts ligne 355)
- **max_tokens : 900**
- SDK : `@anthropic-ai/sdk`, clé `process.env.ANTHROPIC_API_KEY`

### Prompt système — VERBATIM (fichier: engine.ts lignes 314-335)

```
Tu es Candice, un copilote relationnel premium. Tu génères des recommandations d'attention adaptées à chaque proche — jamais de rappels génériques.

Règles absolues :
- Chaque idée s'ancre sur UN signal précis et nommé du profil (justification vide ou générique = rejet)
- Jamais rien qui figure dans les filtres durs (veto absolu)
- Idées concrètes, actionnables cette semaine
- Ton : chaud, personnel, jamais clinique ni SaaS
- Zéro score, zéro %, zéro jargon psy
- 1 à 3 idées, chaque idée cible une dimension différente si possible
- La justification est une phrase courte, toujours ancrée dans un élément concret

Réponds uniquement avec un tableau JSON :
[
  {
    "title": "Titre court et concret (max 7 mots)",
    "justification": "Phrase courte ancrée dans le profil (ex: '{prénom} est sensible aux petits gestes réguliers')",
    "dim": "MOT" | "SER" | "CAD_C" | "CAD_S" | "EXP" | "GES" | "SUR",
    "canal": "message" | "appel" | "en_personne" | "cadeau" | "service" | "experience",
    "intensite": "légère" | "modérée" | "forte",
    "declencheur": "Cette semaine" | "Ce soir" | "Dans 2-3 jours" | "Quand il/elle semble stressé(e)" | (autre formulation courte et chaleureuse)
  }
]
```

### Prompt utilisateur — VERBATIM (fichier: engine.ts lignes 345-349)

```
Génère 1 à 3 recommandations d'attention concrètes et adaptées pour {contactFirstName}.

{context}

Respecte strictement les filtres durs. Ancre chaque idée sur un signal nommé. Réponds uniquement avec le JSON.
```

(`{context}` = le grand bloc décrit plus haut, dimensions + singularité + vetos + feedback, etc.)

### Où c'est branché

- **Route API : `src/app/api/recommendations/generate/route.ts`** (POST, authentifié pilote).
  - Charge le contact, le profil du pilote, l'historique récent (`attention_log`), le journal de contexte (`context_journal`), le contexte « relation compliquée », l'historique de feedback (10 derniers).
  - Si le proche est un utilisateur lié (`proche_user_id`), va chercher **son** analyse `my_profile` (réception/expression/tempérament/filtres/vetos/singularité). Sinon, repli sur l'analyse « incognito » stockée dans `questionnaire_responses.attention_reception`.
  - Appelle `generateRecommendations(input)`.
  - **Écrit dans `contact_recommendations`** en upsert sur `(user_id, contact_id)` : `ideas` (JSON), `blind_spot`, `kadence`, `generated_at` (fichier: generate/route.ts lignes 171-181).
  - **Log** chaque idée proposée dans `attention_log` (status `proposed`) pour la déduplication future.
  - **Amorce une question proactive** dans `context_journal` (générateur *déterministe*, sans IA — voir ci-dessous) si aucune question posée dans les 7 derniers jours.

- **Qui appelle cette route :** un seul endroit — le composant `src/app/contacts/[id]/AttentionContextuelle.tsx` (ligne 35, `fetch("/api/recommendations/generate")`), déclenché par le bouton « Générer » de la fiche proche. **Aucun cron n'appelle cette route** : la reco v1 est 100 % à la demande du pilote.

### Générateur de questions — déterministe, PAS d'IA (fichier: src/lib/recommendations/questions.ts)

`generateProactiveQuestion` tire au sort parmi 6 modèles fixes (« Comment va {n} en ce moment ? », « Tu as des nouvelles de {n} récemment ? », etc.), en évitant les questions déjà posées. Aucun appel LLM.

### Ce qui est affiché au pilote (brique a)

- **Fiche proche** (`src/app/contacts/[id]/page.tsx` lignes 164-172) : lit `contact_recommendations` (`ideas, blind_spot, kadence, generated_at`) et les passe au composant `AttentionContextuelle` (idées avec canal, intensité, déclencheur, badge angle mort, boutons « fait » + feedback juste/à côté/pas le moment).
- **Liste contacts** (`src/app/contacts/page.tsx` lignes 113-129) : affiche seulement le **titre de la 1re idée** par contact (`recoMap`).
- **Dashboard** (`src/app/dashboard/page.tsx` lignes 116-119) : idem, titre de la 1re idée par contact.

➡️ La brique (a) **atteint bien une interface** (fiche + liste + dashboard). Volume réel : `contact_recommendations` = **0 ligne** (base QA vide).

---

## (b) Détection de signaux + génération de suggestions ✅

### (b.1) Détecteur — `src/lib/signals/detector.ts` : 100 % DÉTERMINISTE, aucune IA

`detectSignalsForUser(userId, admin)` parcourt les contacts non archivés et crée des lignes dans **`contextual_signals`** selon des **règles de dates pures** (fuseau Europe/Paris). Aucun appel LLM. Fenêtre de déclenchement : `WINDOW = 14` jours.

Types de signaux produits (`signal_type`) et leurs règles :

| Bloc | Type(s) | Règle | Qui est concerné |
|------|---------|-------|------------------|
| A | `birthday_d7/d3/d1/today` | anniversaire de naissance, paliers J-7/J-3/J-1/jour J, priorités normal→urgent | tout contact avec date « anniversaire/naissance » |
| B | `couple_anniversary`, `wedding_anniversary` | dates rencontre/couple/mariage/pacs, J-7 + jour J | `relationship = partner` |
| C | `valentines_day` | Saint-Valentin (14/02), J-7 + jour J | `relationship = partner` |
| D | `mothers_day` | Fête des mères (dernier dimanche de mai), J-7 + jour J | pilote a des enfants + `relationship = family` |
| E | `fathers_day` | Fête des pères (3e dimanche de juin), J-7 + jour J | pilote a des enfants + `relationship = family` |
| F | `christmas` | Noël (25/12), J-14/J-7/J-3 | partner, family, ou proximité `inner_circle` |
| G | `custom_date` | toute autre date importante non reconnue, J-7 + jour J | tout contact |
| H | `silence` | pas de « connexion » depuis un seuil (cadence résolue via `resolveCadenceForContact`) | tout contact |
| L | `memory_anniversary` | contacts en « mode souvenir » (archivés, opt-out=false), anniversaire de l'archivage | contacts mémoire |
| I | `pilote_birthday` | anniversaire du pilote lui-même | pilote (contact_id null) |
| J | `pilote_mothers_day`, `pilote_fathers_day` | fêtes des mères/pères **pour le pilote parent** | pilote (contact_id null) |
| K | `pilote_difficult_period` | pilote a déclaré une période difficile (`pilote_difficult_period_until`), cadence hebdo | pilote (contact_id null) |

- **Anti-doublon** : `signalExists` vérifie qu'il n'existe pas déjà un signal même `(user_id, contact_id, signal_type, trigger_date)` en statut `active`/`consumed` avant insertion (lignes 67-114).
- Chaque signal porte `signal_data` (nom du contact, libellé de date…), `trigger_date`, `priority` (normal/high/urgent), `expires_at`.
- Log d'erreur notable : `[detector] Insert error {type}: {message}`.

### (b.2) Générateur — `src/lib/signals/generator.ts` : APPEL LLM

`generateSuggestionForSignal(signal, admin)` transforme UN signal en UNE suggestion écrite dans **`proactive_suggestions`**. Deux chemins :

- **Signal pilote** (`contact_id` null) → `generatePiloteSuggestion` : suggestion pour le pilote lui-même.
- **Signal proche** → chemin principal : charge le contact, son `questionnaire_responses`, le `my_profile` du pilote.

**Garde-fou cadence** (lignes 306-319) : si la priorité n'est pas `urgent`, et que la dernière suggestion pour ce contact est plus récente que la cadence résolue, le signal est marqué `consumed` **sans** générer (donc sans appel LLM). Économise les appels.

Après génération : insertion dans `proactive_suggestions` (title, description, category, reasoning, estimated_price, partner_hint, priority, status `pending`, expires_at). Si priorité `urgent`/`high` → **push notification** via `sendPushToUser`. Puis le signal est passé en `consumed`.

#### Modèle LLM (les deux chemins)

- **Modèle : `claude-sonnet-4-6`**
  - chemin proche : ligne 369, **max_tokens 600**
  - chemin pilote : ligne 222, **max_tokens 400**

#### Prompt — chemin PROCHE — VERBATIM (fichier: generator.ts lignes 334-356)

```
Tu es Candice — un service de conciergerie relationnelle, sobre et adulte. Tu aides quelqu'un à faire attention à ses proches au bon moment.

CONTEXTE : {contextLabel}.

PROFIL DE {contact.name} ({contact.relationship}) :
{contactDesc}{qualityConstraints}

PROFIL DU PILOTE (la personne qui offre) :
{piloteDesc}

Génère UNE suggestion d'attention parfaitement adaptée au contexte ci-dessus. Spécifique, actionnelle, mémorisant des détails précis du profil.

Réponds UNIQUEMENT avec ce JSON, sans texte avant ni après :
{
  "title": "Titre court (max 8 mots)",
  "description": "Suggestion concrète et personnalisée (2-3 phrases)",
  "category": "quality_time" | "gift" | "message" | "gesture" | "activity",
  "reasoning": "Une phrase qui commence par 'Parce que' expliquant pourquoi maintenant",
  "estimated_price": "Gratuit" | "X€" | "X-Y€",
  "partner_hint": "Nom du lieu ou prestataire recommandé si pertinent, sinon null"
}

Ton strict : premium, sobre, adulte. Pas de 'petit', 'doux', 'tendre' en excès. Pas de leçon. Inspiré conciergerie.
```

Le `{contextLabel}` provient de `getSignalContext` (verbatim des phrases par type, ex. `birthday_d7` → `« l'anniversaire de {name} est dans 7 jours »`, `silence` → `« {name} et toi ne vous êtes pas vraiment connectés depuis {n} jours — c'est le bon moment »`). Le `{contactDesc}` est un profil psychologique + préférences détaillé (`describeContact`, lignes 56-90), et `{qualityConstraints}` ajoute des exigences selon le standing/gastronomie/hébergement/style de cadeau (`getQualityConstraints`, lignes 92-135, ex. `high_standards` → « uniquement des établissements notés 4,5/5 minimum… »).

#### Prompt — chemin PILOTE — VERBATIM (fichier: generator.ts lignes 193-213)

```
Tu es Candice — un service de conciergerie relationnelle, sobre et adulte.

CONTEXTE : {context}.

Il s'agit de la personne qui utilise Candice — pas d'un de ses proches. Suggère-lui quelque chose pour elle-même.

{profileLines}

Génère UNE suggestion personnelle et bienveillante. Sobre, sans sentimentalisme excessif.

Réponds UNIQUEMENT avec ce JSON, sans texte avant ni après :
{
  "title": "Titre court (max 8 mots)",
  "description": "Suggestion concrète (1-2 phrases)",
  "category": "quality_time" | "gift" | "message" | "gesture" | "activity",
  "reasoning": "Une phrase qui commence par 'Parce que'",
  "estimated_price": "Gratuit" | "X€" | null,
  "partner_hint": null
}

Ton strict : sobre, adulte, bienveillant sans excès.
```

Le `{context}` pilote provient de `getPiloteSignalContext` (ex. `pilote_birthday` → « C'est l'anniversaire du pilote aujourd'hui », `pilote_difficult_period` → « Le pilote traverse une période difficile en ce moment »).

Logs d'erreur notables : `[generator] Claude error for signal {id}`, `[generator] Insert error for signal {id}`, `[generator] Push error`.

### Ce qui est affiché au pilote (brique b)

- **Dashboard** (`src/app/dashboard/page.tsx`) : lit `proactive_suggestions` en statut `pending` (jointe au contact et au signal), trie par priorité et affiche **la suggestion la plus prioritaire** en carte principale (`topProactiveSuggestion`, lignes 158-269) + un compteur « proches à soutenir ». (NB : une seconde requête sur la table `suggestions` — legacy, différente — est chargée dans `suggestionsData` puis explicitement ignorée via `void suggestionsData`.)
- **Liste contacts** (`src/app/contacts/page.tsx`) : lit aussi `proactive_suggestions`.
- **Actions** : `src/app/api/proactive-suggestions/[id]/validate` et `/refuse` (le pilote valide ou refuse).
- **Relance e-mail** : le cron `email-reminders` renvoie par mail les suggestions `pending` depuis >48 h.

➡️ La brique (b) **atteint bien une interface** (dashboard + contacts + e-mail + push). Volumes réels : `contextual_signals` = **0**, `proactive_suggestions` = **0** (base QA vide).

---

## (c) Espace Proche V2 — `contact_reco_items` : ⚫ RIEN NE L'ALIMENTE

### Ce qu'est la table

`contact_reco_items` (migration 69, `supabase-migration-69-contact-reco-items.sql`) : **une ligne par reco** pour l'espace proche (`/proche/[id]`), pensée pour remplacer le blob `contact_recommendations.ideas`. Colonnes : `reco_type` (object/experience/place/message), `title`, `brand`, `price_indicative`, `photo_url`, `source_trace` (declared/spotted/deduced/exploratory), `certainty_pct`, `why_json`, `need_tag`, `origin_ref`, `status` (active/refused), `reservation_status` (available/intended/purchased), etc. RLS owner-only. Réservation invisible atomique via RPC `reserve_reco_item` / `confirm_reco_purchase` (péremption 30 j), calquée sur Wishlist V2.

### Qui LIT / MODIFIE la table (fichier: src/app/proche/[id]/…)

- `src/app/proche/[id]/page.tsx` (ligne 46-49) : **lit** les items `active`+`refused` (hors `purchased`) pour l'afficher dans l'espace proche.
- `src/app/proche/[id]/EspaceProcheShell.tsx` : **met à jour** le statut (refuser → `status='refused'`, ligne 204/216/243 ; acheter → `reservation_status='purchased'`, ligne 228 ; réactiver → `status='active'`, ligne 254).

### Qui ÉCRIT / INSÈRE la table

- **PERSONNE.** Recherche exhaustive sur tout le repo (hors `node_modules`) : aucune instruction `insert` dans `contact_reco_items`, aucun moteur/générateur, aucun cron, aucune route API. Les seules mentions sont : les 3 migrations SQL (69, 70, 72), les 2 fichiers d'écran ci-dessus (lecture + update de statut), et 3 docs de STOP.

### Cohérence avec la mémoire projet

Cohérent avec la note mémoire « Espace Proche V2 » : Phases 1-6 closes, **moteur de reco = Phases 7-10 restantes, « ne pas lancer P7 sans signal »**. Et avec la décision explicite dans `src/app/contacts/[id]/AttentionContextuelle.tsx` en-tête et `proche/[id]/page.tsx` ligne 69 : *« Décision B — pas de génération LLM »* pour l'espace proche à ce stade.

➡️ **Statut : ⚫ code mort côté génération.** L'interface `/proche/[id]` sait afficher, refuser, réserver et acheter des recos, mais **aucun producteur ne remplit la table** aujourd'hui. Tant qu'aucune reco n'y est insérée (à la main ou par un futur moteur), l'onglet reste vide. Volume réel : `contact_reco_items` = **0 ligne**.

---

## Récapitulatif — ce qui atteint une interface vs ce qui n'atteint rien

| Brique | Modèle LLM | Table | Affiché où | Statut | Volume base |
|--------|-----------|-------|-----------|--------|-------------|
| (a) Reco v1 | `claude-sonnet-4-6` (900 tk) | `contact_recommendations` | Fiche proche, liste contacts, dashboard | ✅ affiché | 0 |
| (b.1) Détecteur signaux | *aucun (déterministe)* | `contextual_signals` | *(interne, non affiché tel quel)* | ✅ branché | 0 |
| (b.2) Générateur suggestions | `claude-sonnet-4-6` (600/400 tk) | `proactive_suggestions` | Dashboard (carte prioritaire), contacts, e-mail, push | ✅ affiché | 0 |
| (c) Espace Proche V2 | *aucun* | `contact_reco_items` | `/proche/[id]` (affichage + actions) | ⚫ rien ne l'alimente | 0 |

- **Tables annexes vues à 0 ligne aussi** : `reco_refusals` (refus espace proche), `cadence_feedback` (agrégats du cron cadence), `attention_log` (log des idées v1 + feedback).
- **Note de fiabilité des volumes** : la base interrogée via `SUPABASE_DB_URL` est la base réelle du projet, en état pré-lancement — les tables reco (`contact_recommendations`, `contextual_signals`, `proactive_suggestions`, `contact_reco_items`) sont vides, tandis que d'autres tables sont peuplées (`discovery_questions` 70, etc.). Les 0 lignes reflètent l'absence de production de recos à ce jour, pas un environnement de test distinct.
</content>
</invoke>


---

<!-- ============ 10-proches-partage ============ -->

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


---

<!-- ============ 11-wishlist-carnet ============ -->

# Cartographie 11 — Wishlist & Carnet d'envies

> Ce document décrit **ce qui EST** dans le code aujourd'hui, sans jugement ni recommandation.
> Sources : `(fichier: …)` ou `(base: …)`. Textes visibles cités **mot pour mot**.
>
> **Rappel du lexique verrouillé (CLAUDE.md) :**
> - **WISHLIST** = la liste personnelle de l'utilisateur, sur SON profil (ce qu'IL aimerait recevoir). Strictement privée.
> - **CARNET D'ENVIES** = les envies REPÉRÉES pour un proche, sur la fiche du proche. On ne dit JAMAIS « wishlist » côté proche.
>
> **Légende des statuts :** ✅ visible/actif · 🟡 partiel/conditionnel · ⚫ code mort · ❌ absent.

---

## (a) Wishlist perso — l'écran `/moi/wishlist`

Sources : `(fichier: src/app/moi/wishlist/page.tsx)` (serveur) et `(fichier: src/app/moi/wishlist/WishlistV2Client.tsx)` (interface). Reproduction de la maquette gelée `Candice_Maquette_Wishlist_V2.html`.

### La table `my_wishlist_items` `(base: my_wishlist_items)`
Colonnes réelles (schéma live) :
- `id` uuid (PK)
- `user_id` uuid NOT NULL — le propriétaire (RLS `auth.uid() = user_id`)
- `title` text NOT NULL — « Ce que c'est »
- `url` text NULL *(legacy)*
- `note` text NULL *(legacy)*
- `created_at` timestamptz NOT NULL
- `photo_url` text NULL — chemin bucket (`contact-photos`, URL signée 1 h) ou URL OpenGraph
- `brand` text NULL
- `web_link` text NULL
- `size_ref` text NULL
- `price_indicative` text NULL — texte libre (ex. « 1 900 € »)
- `occasion` text NULL
- `note_text` text NULL
- `envy_level` text NULL — `dream` / `pleasure`
- `target_recipients` uuid[] NOT NULL défaut `{}` — destinataires ciblés (vide = n'importe qui)
- `source_trace` text NOT NULL défaut `'declared'`
- `reservation_status` text NOT NULL défaut `'available'` (voir (c))
- `reserved_by` uuid NULL
- `reserved_at` timestamptz NULL
- `reservation_expires_at` timestamptz NULL

**Volume : 0 ligne** au relevé `(base: my_wishlist_items)`.

### Règles d'accès — en français simple
- **Strictement privée** : la RLS n'autorise que le propriétaire (`auth.uid() = user_id`). Personne d'autre ne peut lire cette table. À l'insertion, `user_id` est OBLIGATOIRE, sinon l'écriture est rejetée `(fichier: WishlistV2Client.tsx, commentaire R1)`.
- **Jamais montrée telle quelle** : Candice s'en inspire pour recommander sans jamais dévoiler que la personne l'a demandée (matrice de visibilité : wishlist = `never` pour tous les tiers — voir doc 10).
- Les colonnes de **réservation** (`reservation_status`, etc.) sont **invisibles du pilote** : l'écran `/moi/wishlist` ne les lit pas (le `WL_SELECT` de la page ne les inclut pas) `(fichier: src/app/moi/wishlist/page.tsx)`.

### L'interface ✅
En-tête :
- Marque « Candice », lien « Profil » (retour `/moi`)
- Titre « Ma wishlist »
- Texte : « Ce que **toi** tu aimerais recevoir. Candice s'en inspire pour guider tes proches — sans jamais leur dire que tu l'as demandé. »
- Badge : « Privé — traduit en suggestions, jamais montré tel quel »

Bouton « Ajouter une envie ».

**Filtres** (chips) : « Toutes » puis les occasions `WISHLIST_FILTER_OCCASIONS` : « Sans occasion », « Anniversaire », « Noël », « Anniv. de mariage », « Saint-Valentin », « Fête des mères ».

**État vide** : « Ta wishlist est vide » + « Dépose ici tes envies — tes proches pourront viser juste, sans jamais te demander. »

**Carte d'un item** : photo (avec tag niveau d'envie « J'en rêve » / « Petit plaisir »), marque, titre, taille, prix, « Pour : {destinataires ou "n'importe qui"} », boutons « Modifier » et « On me l'a offert ».

**Panneau formulaire** (« Nouvelle envie » / « Modifier l'envie ») :
- Rappel de pudeur : « **Rassure-toi :** personne ne verra cette liste. Candice s'en sert seulement pour souffler la bonne idée au bon proche, au bon moment. »
- « Photo — optionnel » (avec « Sinon, Candice utilisera l'image du lien web ci-dessous. ») — upload via `/api/wishlist/photo`
- « Ce que c'est » (placeholder « ex. Bague Love or rose »)
- « Marque — optionnel » (« ex. Cartier »)
- « Lien web — optionnel, pour retrouver l'objet exact » — si pas de photo, tentative d'image OpenGraph via `/api/wishlist/og`
- « Taille ou référence — optionnel » (« ex. taille 52, ou l'ISBN d'un livre »)
- « Prix indicatif — optionnel » (« ex. 1 900 € »)
- « Niveau d'envie » : pastilles « J'en rêve » (`dream`) / « Petit plaisir » (`pleasure`)
- « Pour quelle occasion ? » : pastilles `WISHLIST_FORM_OCCASIONS` (« Sans occasion », « Anniversaire », « Noël », « Anniv. de mariage », « Saint-Valentin », « Fête des mères », « Fête des pères », « Naissance », « Crémaillère », « Diplôme »)
- « De qui aimerais-tu la recevoir ? » : une pastille par contact + « N'importe qui » — note : « Cette envie n'apparaîtra que chez les proches choisis. Une bague ne sera jamais suggérée à ta grand-mère si tu la réserves à ton mari. »
- Bouton « Ajouter à ma wishlist » / « Enregistrer »

**Panneau « On te l'a offert ? »** :
- « Génial. **Qui te l'a offert ?** Candice pourra retenir cette belle attention. »
- Liste des contacts + « Autre »
- Si un contact est choisi : « En le notant, Candice retiendra que **{nom}** a visé juste — et pourra te demander si ça t'a plu, pour l'aider à mieux te connaître encore. »
- Bouton « C'est {nom} → » ou « Noter comme offert → »
- Effet : POST `/api/wishlist/offered` (trace d'attention dans `attention_log` si un contact est identifié) PUIS suppression de la ligne de la wishlist (`.delete()`).

Statut : ✅ (écran complet, aligné maquette).

---

## (b) Carnet d'envies — le code carnet

Le Carnet vit **sur la fiche du proche** (intégré à `/contacts/[id]`, section « À retenir »), pas sur un écran dédié.

Sources :
- Composant : `(fichier: src/app/contacts/[id]/CarnetV2Section.tsx)`
- Chargement des données : `(fichier: src/app/contacts/[id]/page.tsx, lignes ~462-490)`
- API d'identification photo : `(fichier: src/app/api/carnet/identify/route.ts)`

### La table `carnet_envies_items` `(base: carnet_envies_items)`
Colonnes réelles (schéma live) :
- `id` uuid (PK)
- `contact_id` uuid NOT NULL — le proche concerné
- `pilot_id` uuid NOT NULL — le propriétaire (RLS `pilot_id = auth.uid()`)
- `description` text NOT NULL — « Ce que c'est »
- `photo_url` text NULL
- `source_link` text NULL — « Où / le lien »
- `brand_name` text NULL
- `brand_option` text NULL *(non utilisé par l'UI V2)*
- `confidence_level` text NULL défaut `'moyenne'` *(legacy)*
- `location_hint` text NULL *(legacy)*
- `occasion_links` text[] NULL *(legacy)*
- `statut` text NULL défaut `'actif'` — `actif` / `offert`
- `created_at` timestamptz NULL
- `requires_payment_sourcing` boolean NOT NULL défaut false *(sourcing paiement — non câblé UI V2)*
- `payment_modalities` jsonb NULL *(idem)*
- `size_ref` text NULL
- `price_indicative` text NULL
- `occasion` text NULL
- `note_text` text NULL
- `source` text NULL — `heard` / `seen` / `link` (badge « Entendu » / « Vu »)
- `heard_quote` text NULL — phrase entendue
- `source_trace` text NOT NULL défaut `'spotted'`

**Volume : 0 ligne** au relevé `(base: carnet_envies_items)`.
Note : c'est la table renommée en migration 57, fusionnée avec le legacy `contacts.gift_wishlist` en migration 67 (le legacy est **déprécié**, jamais droppé).

### L'interface `CarnetV2Section` ✅
- Intro : titre « Carnet d'envies de {Prénom} » + « Photo, lien, phrase entendue, boutique : note ici tout ce que tu repères pour {Prénom}. Candice le garde pour le bon moment. »
- Bouton « Ajouter une envie ».
- État vide : « Rien noté pour l'instant » + « Tu n'as encore rien noté pour {Prénom}. Ajoute une envie repérée, même floue : Candice pourra la retrouver, la sourcer ou s'en inspirer plus tard. »
- Carte d'un item : badge source (« Vu » avec icône caméra / « Entendu » avec icône micro / rien si `source` null), marque, description, citation « … », prix, occasion, boutons « Modifier » et « Offert ».
- « Offert » → passe `statut` à `offert` et retire l'item de la liste.

**Deux modes d'ajout** (panneau « Repérer une envie ») :
1. **« Prendre en photo »** — « Tu es devant l'objet, en vitrine ou en boutique. Candice tente de retrouver la marque et le produit. » + astuce « Idéal sur le vif — un cadeau vu au passage. »
   - Upload via `/api/wishlist/photo` (scope `carnet`), puis identification IA via `/api/carnet/identify`.
   - Résultat affiché avec prudence (jamais affirmatif) : « Candice regarde… », puis « Peut-être : {marque} {produit} ? » ou « Pas sûre de reconnaître » + « Simple supposition, souvent imprécise — vérifie et corrige à l'étape suivante, ou ressaisis tout à la main. »
   - Boutons « Continuer et corriger → » / « Ressaisir moi-même ».
2. **« Renseigner moi-même »** — « Une phrase entendue, un lien, une boutique, une idée — tu notes ce que tu sais. »

**Panneau formulaire** (« Envie pour {Prénom} » / « Modifier l'envie ») :
- « Photo — optionnel »
- « Ce que c'est » (« ex. Montre BR 03 »)
- « Marque — optionnel » (« ex. Bell & Ross »)
- « Où / le lien — optionnel » (« Boutique, ou https://... »)
- « Ce que tu as repéré — une phrase, un contexte » (« Il s'est arrêté devant la vitrine… »)
- « Prix indicatif — optionnel » (« ex. 3 900 € »)
- « Pour quelle occasion ? » : pastilles `CARNET_FORM_OCCASIONS` (« Sans occasion », « Anniversaire », « Noël », « Anniv. de mariage », « Fête des pères », « Juste pour lui faire plaisir »)
- Bouton « Ajouter au carnet de {Prénom} » / « Enregistrer »

La `source` est **déduite automatiquement** : photo → `seen` ; sinon phrase entendue → `heard` ; sinon lien → `link` `(fichier: CarnetV2Section.tsx, computedSource)`.

### L'API `/api/carnet/identify` `(fichier: src/app/api/carnet/identify/route.ts)` ✅
- POST avec le `path` d'une photo (doit commencer par `{user.id}/`, sinon 400).
- Télécharge l'image (bucket `contact-photos`), l'envoie au modèle `claude-haiku-4-5-20251001` (Anthropic) qui répond UNIQUEMENT en JSON `{brand, product}`. En cas de doute → `null`. Aucune phrase, juste le JSON.
- Toujours faillible → l'UI affiche « vérifie avant d'enregistrer ».
- Note : le seul fichier sous `src/app/api/carnet/` est `identify/route.ts` ; les écritures du carnet (insert/update/delete) se font **directement** en base depuis le composant client via le client Supabase (RLS `pilot_id = auth.uid()`), pas via une route API dédiée.

Statut : ✅ (carnet complet, aligné maquette).

---

## (c) Réservation invisible — les RPC

Mécanisme identique sur deux surfaces : la wishlist du proche (migration 68) et les recos de l'Espace Proche (migration 69). Principe : **intention molle → confirmation d'achat**, avec **péremption**.

### En français simple
- Un proche qui décide d'offrir « pose une intention » sur l'item (état `intended`). L'item **disparaît** alors pour les autres proches — mais on ne leur dit JAMAIS qu'il est « déjà pris », il disparaît simplement, sans mention.
- Cette intention a une **date de péremption** (30 jours par défaut). Si personne ne confirme l'achat avant, l'item **redevient disponible** automatiquement.
- Quand le proche confirme avoir acheté, l'item passe à `purchased` (définitif).
- Tout est **invisible du pilote** (le propriétaire de la wishlist ne voit jamais ces états).
- Les transitions sont **atomiques** (`SELECT … FOR UPDATE` dans des fonctions `SECURITY DEFINER`), pour éviter que deux proches réservent en même temps.

### Wishlist — migration 68 `(fichier: supabase-migration-68-wishlist-reservation.sql)`
Trois états : `available`, `intended`, `purchased` (colonne `my_wishlist_items.reservation_status`).

- **`reserve_wishlist_item(p_item, p_days=30)`** → renvoie `reserved` / `already_taken` / `not_found`.
  - `already_taken` si déjà `purchased`, ou si `intended` non expiré par un AUTRE proche.
  - Sinon pose `intended`, `reserved_by = auth.uid()`, expiration `now() + p_days`.
- **`confirm_wishlist_purchase(p_item, p_outcome, p_days=30)`** — `p_outcome` : `purchased` / `not_yet` / `declined`.
  - `not_yours` si le caller n'est pas le réservataire.
  - `purchased` → état final ; `not_yet` → prolonge la péremption (`extended`) ; `declined` → relâche l'item (`released`, redevient disponible).
- Droits : `EXECUTE` accordé aux `authenticated` seulement.

### Recos Espace Proche — migration 69 `(fichier: supabase-migration-69-contact-reco-items.sql)`
Même pattern sur `contact_reco_items.reservation_status` (`available`/`intended`/`purchased`).
Deux dimensions **orthogonales** : `status` (`active`/`refused` — le refus) vs `reservation_status` (le cadeau). « Offered » = dérivé de `purchased`, jamais stocké.

- **`reserve_reco_item(p_item, p_days=30)`** → `reserved` / `already_taken` / `not_found` (même logique).
- **`confirm_reco_purchase(p_item, p_outcome, p_days=30)`** → `purchased` / `extended` / `released` / `not_yours` / `not_found`.
- Droits : `EXECUTE` accordé aux `authenticated`.

**Utilisation réelle dans l'UI :** dans l'Espace Proche, la voie 1 « Je m'en occupe personnellement » appelle `reserve_reco_item` `(fichier: EspaceProcheShell.tsx, reserveSelf)`. La confirmation d'achat (`confirm_*`) et la surface proche-facing (réclamation) relèvent du **moteur de reco / conciergerie à venir** — pas encore atteignables. 🟡 pour `confirm_*` (RPC présentes, pas d'appel UI trouvé).

Volume `contact_reco_items` : **0 ligne** au relevé `(base: contact_reco_items)`.

---

## (d) Refus & attentions écartées

### La table `reco_refusals` `(base: reco_refusals)`
Migrations 70 `(fichier: supabase-migration-70-reco-refusals.sql)` et 75 `(fichier: supabase-migration-75-reco-refusal-occasion.sql)`.
Colonnes réelles (schéma live) :
- `id` uuid (PK)
- `pilot_id` uuid NOT NULL (RLS owner-only)
- `contact_id` uuid NOT NULL
- `reco_id` uuid NOT NULL — référence `contact_reco_items(id)`
- `reason` text NOT NULL — `gout` / `budget` / `deja` / `moment`
- `sub_reason` text NULL — pour `moment` : l'horizon choisi
- `note_free` text NULL — champ « Autre » libre
- `reactivable` boolean NOT NULL défaut true
- `reappear_at` timestamptz NULL — date de réapparition (financier : +6 mois ; moment : +1/+4/+12 mois)
- `created_at` timestamptz NOT NULL
- `reserved_for_occasion` boolean NOT NULL défaut false — « gardée pour une occasion » : mise en réserve SANS date (réveil événementiel)

**Volume : 0 ligne** au relevé `(base: reco_refusals)`.

**Réapparition PARESSEUSE** : il n'y a AUCUN job/cron. Un refus « budget » ou « moment » dont la `reappear_at` est passée rend le reco de nouveau proposable **à la lecture**, sans réécrire le statut `(fichier: src/app/proche/[id]/page.tsx, fonction reappeared)`.

### Le flow « Pas ça » — `EspaceProcheShell.tsx` ✅
Déclenché par le bouton « Pas ça » sur une reco. Panneau à étapes.

**Menu — 4 raisons** (titre « Qu'est-ce qui te fait hésiter ? ») :
- Sous-texte : « Dis-m'en un peu plus — ça m'aide à mieux viser pour {Prénom}. »
- Les 4 options (verbatim) :
  1. « Ce n'est pas son goût » (`gout`)
  2. « C'est trop cher pour moi » (`cher` → raison `budget`)
  3. « Je lui ai déjà offert » (`deja`)
  4. « Ce n'est pas le bon moment » (`moment`)

**Raison « Ce n'est pas son goût »** (titre « Es-tu sûr ? ») :
- Candice ré-argumente selon la source : si `declared` → « Je te la propose parce que **{Prénom} l'a lui-même laissé entendre** — c'est exactement ce qui lui plairait. » ; sinon si `why` → « Je te la propose parce que : **{why}** » ; sinon « Je te la propose parce qu'elle colle à ce que Candice sait de {Prénom}. »
- Si `certainty_pct` : anneau + « Sûre à {n}% que ça lui plairait, d'après ce qu'il a laissé deviner. »
- Boutons : « Allez, je tente pour cette fois » (referme sans écarter) / « Non, je ne veux vraiment pas » → écrit `reco_refusals` (reason `gout`, reactivable) + passe la reco à `status='refused'`.
- Écran de confirmation (titre « C'est noté ») : « Très bien, je l'écarte. Merci de me l'avoir dit — **je continue d'affiner** pour ne te proposer que le plus juste pour {Prénom}. » + bouton « Parfait ».

**Raison « C'est trop cher pour moi »** (titre « Le budget ») :
- « Je comprends. On peut garder l'idée de côté sans pression. »
- Si un prix est lisible : plan d'épargne — « Mettre un peu de côté » + « Si tu mets **{X} € de côté chaque semaine**, tu pourras lui offrir **dans {n} semaines**. »
- Boutons « On garde l'idée » / « Retirer » (→ `reco_refusals` reason `budget`, `reappear_at = now()+6 mois`, reco `refused`).
- Note : « Si tu retires : Candice met l'idée de côté et te la représente dans quelques mois, pour une grande occasion. »

**Raison « Je lui ai déjà offert »** (titre « Déjà offert ») :
- « Super ! Et dis-moi : **est-ce qu'il a aimé ?** Ça m'aide à mieux le connaître. »
- Échelle de « love » (`LOVE`) : « Un peu » / « Beaucoup » / « Énormément »
- Bouton « Enregistrer » → insère dans `(base: attention_log)` (`status='done'`, `love_level`) + passe la reco à `reservation_status='purchased'`.

**Raison « Ce n'est pas le bon moment »** (titre « Le moment ») :
- « Ce n'est pas le bon moment. Tu la reverrais quand ? »
- Les horizons (`HORIZONS`, verbatim) :
  - « Dans quelques semaines » (`semaines`, +1 mois)
  - « Dans quelques mois » (`mois`, +4 mois)
  - « Beaucoup plus tard » (`plus_tard`, +12 mois)
  - « Je la garde pour une occasion » (`occasion`, **sans date** → `reserved_for_occasion=true`, réveil événementiel)
- Effet : `reco_refusals` (reason `moment`, `sub_reason=horizon`, `reappear_at` = date sauf option « occasion », `reserved_for_occasion`) + reco `refused`.

### Panneau « Attentions écartées » ✅
Ouvert depuis le lien « Attentions écartées » (+ compteur) de l'onglet « Faire plaisir ».
- Vide : « Plus rien d'écarté — tout est de retour dans tes idées. »
- Sinon : « Tu peux les remettre dans tes idées à tout moment. » + liste avec tag de raison :
  - Tags (`REASON_LABEL` / cas occasion) : « Pas son goût », « Trop cher », « Déjà offert », « Pas le bon moment », ou « Gardée pour une occasion »
  - Bouton « Réactiver » par item → passe la reco à `status='active'`. Les lignes `reco_refusals` ne sont **pas** supprimées (le compteur de refus « goût » reste intact pour un « workflow croisé » prévu en Phase 7, non câblé).

Note produit `(fichier: page.tsx + EspaceProcheShell.tsx)` : le comptage du 2e refus « goût » et le workflow croisé invisible sont **stockés mais pas déclenchés** aujourd'hui (Phase 7 à venir). 🟡

Statut d'ensemble (d) : ✅ pour le flow « Pas ça » et les attentions écartées (interface complète) ; 🟡 pour le workflow croisé (stocké, non déclenché).

---

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU**
- « le code carnet (src/app/api/carnet, composants) » : sous `src/app/api/carnet/` il n'existe QUE `identify/route.ts`. Hypothèse : les écritures du carnet passent par le client Supabase directement (visible dans `CarnetV2Section.tsx`), il n'y a pas d'autre route API carnet. Je l'ai indiqué explicitement.
- Les migrations demandées « 68 et 69 » : la demande dit « reserve_wishlist_item/confirm_wishlist_purchase et reserve_reco_item/confirm_reco_purchase (migrations 68 et 69) ». C'est cohérent avec les fichiers réels (`68` = wishlist, `69` = reco). Aucune ambiguïté.

**B. DÉCISIONS PRISES SEUL**
- J'ai marqué `confirm_wishlist_purchase` / `confirm_reco_purchase` en 🟡 (RPC présentes en base, mais aucun appel trouvé dans l'UI — seul `reserve_reco_item` est appelé). Ce constat repose sur une recherche de code, pas sur un test exhaustif de toutes les surfaces.
- J'ai listé les colonnes legacy (`url`, `note`, `brand_option`, `confidence_level`, `location_hint`, `occasion_links`, `requires_payment_sourcing`, `payment_modalities`) en les signalant *(legacy)* / *(non utilisé UI V2)* d'après leur absence dans les composants V2. Jugement de lecture, pas certitude absolue.

**C. LAISSÉ EN SUSPENS**
- Les routes `/api/wishlist/photo`, `/api/wishlist/og`, `/api/wishlist/offered` : mentionnées (utilisées par l'UI) mais non ouvertes en détail (hors périmètre — la demande cible wishlist + carnet + RPC + refus).
- Le contenu de `attention_log` (colonnes) : non relevé (non demandé ; seul son usage dans le flow « Déjà offert » / « On me l'a offert » est décrit).

**D. À VÉRIFIER PAR ESTELLE**
- Confirmer que la confirmation d'achat (`confirm_*`) est bien volontairement non branchée à l'UI aujourd'hui (attendue avec la conciergerie / moteur de reco).
- Confirmer que les colonnes legacy de `carnet_envies_items` et `my_wishlist_items` doivent rester (jamais droppées, conformément à la règle « migrations additives »).

**E. MIGRATIONS / BUILD**
- Aucune migration ni build : tâche en LECTURE SEULE. Toutes les requêtes en base étaient des SELECT (schéma + `count(*)`), aucune écriture.
- Toutes les tables relevées sont vides (0 ligne), sauf `profile_share_links` (1 ligne, cf. doc 10) — cohérent avec un environnement sans données réelles.


---

<!-- ============ 12-emails-notifications ============ -->

# 12 — Emails & notifications

> Cartographie de CHAQUE email envoyé par Candice, plus les notifications push.
> Source de vérité : recherche `grep -rn "resend.emails.send" src`.
> Statut : ✅ = réellement câblé (a un déclencheur qui l'appelle) ET tracé dans `notification_log` · 🟡 = câblé mais NON tracé (ou partiellement) · ⚫ = code présent mais aucun déclencheur (orphelin) · ❌ = cassé/absent.
> « Tracé » veut dire : la ligne d'envoi écrit une ligne dans la table `notification_log` (journal des notifications). La majorité des emails N'écrivent PAS dans ce journal.

## Configuration commune de l'envoi

Fichier : `src/lib/resend.ts`

- Prestataire d'envoi : **Resend** (clé dans la variable d'environnement `RESEND_API_KEY`).
- Expéditeur (`FROM_EMAIL`) : valeur de la variable d'environnement `RESEND_FROM_EMAIL`, et à défaut `candice@candice.app` (verbatim du code).
- URL de l'application (`APP_URL`) : `https://candice.app` (codé en dur dans ce fichier).

Tous les liens `${APP_URL}` dans les corps ci-dessous valent donc `https://candice.app`.

---

## Récapitulatif rapide (14 envois d'email trouvés)

| # | Email | Fichier | Destinataire | Tracé `notification_log` ? | Statut |
|---|-------|---------|--------------|----------------------------|--------|
| 1 | Bienvenue (welcome) | `src/app/api/emails/welcome/route.ts` | Pilote qui vient de s'inscrire | Non | 🟡 |
| 2 | Rappel « fiche incomplète » (reminder) | `src/app/api/emails/reminder/route.ts` | Proche (contact) | Non | 🟡 |
| 3 | Rappels d'essai J-7 / J-3 / J-1 (trial-reminder) | `src/app/api/emails/trial-reminder/route.ts` | Pilote en essai | **Oui** (`trial_reminder_{jours}`) | ✅ |
| 4 | Fiche du proche complète (profile-complete) | `src/app/api/emails/profile-complete/route.ts` | Pilote propriétaire | Non | ⚫ (aucun appelant) |
| 5 | Invitation questionnaire (questionnaire-invite) | `src/app/api/emails/questionnaire-invite/route.ts` | Proche invité | Non | 🟡 |
| 6 | Rappel d'une suggestion en attente (reminder-suggestion / lib email-reminder) | `src/app/api/emails/reminder-suggestion/route.ts` + `src/lib/notifications/email-reminder.ts` | Pilote | **Oui** (`proactive_reminder`) | ✅ |
| 7 | Fiche du proche complète (via lien de partage) | `src/app/api/shared-profile/complete/route.ts` | Pilote expéditeur du lien | Non | 🟡 |
| 8 | Demande de partage d'analyse (A → B) | `src/app/api/contacts/[id]/consent/route.ts` | Proche B (a un compte) | Non | 🟡 |
| 9 | Proche a complété sa fiche (via invite/link) | `src/app/api/invite/link/route.ts` | Pilote | Non | 🟡 |
| 10 | Relance d'invitation (nudge — email fallback) | `src/app/api/invite/nudge/route.ts` | Proche non inscrit OU proche inscrit sans push | Non (email) / Oui (push, voir plus bas) | 🟡 |
| 11 | Demande de voir un profil (X → Y) | `src/app/api/profile-view/request/route.ts` | Cible Y | Non | 🟡 |
| 12 | Suppression de compte programmée | `src/app/api/account/delete/route.ts` | Pilote | Non | 🟡 |
| 13 | Export RGPD des données | `src/app/api/account/export/route.ts` | Pilote (pièce jointe JSON) | Non | 🟡 |
| 14 | Emails de cycle de vie (pause / silence / essai expiré) | `src/app/api/cron/lifecycle-check/route.ts` | Pilote | Non | 🟡 (dont une branche désactivée) |

Note importante : seuls **2 emails sur 14** écrivent dans le journal `notification_log` (le rappel d'essai n°3 et le rappel de suggestion n°6). Tous les autres partent sans laisser de trace en base.

---

## 1 — Email de bienvenue (welcome) 🟡

- **Fichier** : `src/app/api/emails/welcome/route.ts` (méthode POST)
- **Déclencheur** : appelé par la page d'inscription `src/app/register/page.tsx` (ligne 222, `fetch("/api/emails/welcome", …)`) juste après la création du compte. Route publique, aucune vérification d'authentification (elle exige seulement un `email` dans le corps).
- **Destinataire** : le pilote qui vient de créer son compte (champ `email` du corps).
- **Tracé** : Non (aucune écriture dans `notification_log`).
- **OBJET (verbatim)** : `Candice est prête.`
- **CORPS (texte lisible verbatim)** :
  - En-tête : `CANDICE`
  - Titre : `Bonjour, {prénom}.` (le prénom n'apparaît que s'il est fourni ; sinon `Bonjour.`)
  - Sous-titre : `Candice est prête.`
  - `Candice est prête à t'aider à prendre soin de ceux que tu aimes.`
  - `Commence par compléter ta fiche — c'est la base de tout. Plus ton profil est précis, plus les attentions que Candice suggère seront justes.`
  - Bouton : `Compléter ma fiche →` (lien vers `https://candice.app/moi/questionnaire`)
  - Note : `✦  Plus ta fiche est complète, plus les suggestions seront justes.`
  - Pied de page : `Tu reçois cet e-mail car tu viens de créer un compte Candice.` puis lien `candice.app`

---

## 2 — Rappel « Votre fiche est incomplète » (reminder) 🟡

- **Fichier** : `src/app/api/emails/reminder/route.ts` (méthode POST)
- **Déclencheur** : appelé par `src/app/contacts/[id]/ContactActions.tsx` (ligne 60, `fetch("/api/emails/reminder", …)`) — action manuelle du pilote depuis la fiche d'un contact. Route publique (exige seulement `contactEmail` dans le corps).
- **Destinataire** : le proche (contact) dont la fiche est incomplète (`contactEmail`).
- **Tracé** : Non.
- **OBJET (verbatim)** : `Votre fiche est incomplète.`
- **CORPS (texte lisible verbatim)** :
  - En-tête : `CANDICE`
  - Titre : `Bonjour {contactFirstName}.` (sinon `Bonjour.`)
  - Sous-titre : `Un petit rappel de {senderFirstName}.` (à défaut : `Un petit rappel de quelqu'un qui tient à toi.`)
  - `{senderFirstName} attend que tu complètes ta fiche.` (à défaut : `Cette personne attend que tu complètes ta fiche.`)
  - `Ça prend 5 minutes et ça lui permettra de te faire vraiment plaisir — les attentions les plus justes, au bon moment.`
  - Bouton : `Compléter ma fiche →` (lien vers `profileUrl`, à défaut `https://candice.app`)
  - Note : `🔒  Tes réponses restent 100% confidentielles — {senderFirstName} ne les lira jamais.` (à défaut : `… la personne ne les lira jamais.`)
  - Pied de page : `Tu reçois cet e-mail car tu as été invité(e) via Candice et n'as pas encore complété ta fiche.` + lien `candice.app`

---

## 3 — Rappels d'essai J-7 / J-3 / J-1 (trial-reminder) ✅

- **Fichier** : `src/app/api/emails/trial-reminder/route.ts` (méthode POST)
- **Déclencheur** : appelé UNIQUEMENT par le cron `src/app/api/cron/lifecycle-check/route.ts` (ligne 80) quand l'essai atteint le jour 23 (J-7), 27 (J-3) ou 29 (J-1). Route interne protégée par `Authorization: Bearer ${CRON_SECRET}` — refuse tout appel sans ce secret. Exige `userId`, `email`, `daysLeft`.
- **Destinataire** : le pilote en période d'essai (`email`).
- **Tracé** : **Oui**. Après envoi, insère dans `notification_log` : `channel: 'email'`, `notification_type: 'trial_reminder_{daysLeft}'`, `status: 'sent'`.
- **OBJET (verbatim, selon `daysLeft`)** :
  - 7 jours : `Plus que 7 jours d'essai — souhaites-tu poursuivre avec Candice ?`
  - 3 jours : `Candice tient à toi — encore 3 jours pour décider`
  - 1 jour : `Dernier jour de ton essai Candice`
  - défaut (autre valeur) : `Ton essai Candice arrive bientôt à terme`
- **CORPS — texte d'intro (verbatim, selon `daysLeft`)** :
  - 7 : `Ton essai gratuit se termine dans 7 jours. Candice a déjà appris à connaître tes proches — ne laisse pas ces attentions s'arrêter.`
  - 3 : `Il te reste 3 jours. Candice a préparé des idées pour chacun de tes proches, et continue d'en découvrir chaque jour.`
  - 1 : `C'est le dernier jour de ton essai. Dans 24h, Candice se mettra en pause — mais elle sera toujours là quand tu voudras reprendre.`
  - défaut : `Ton essai gratuit se termine bientôt.`
- **CORPS — reste (verbatim)** :
  - En-tête : `Candice` / `Conciergerie relationnelle`
  - Bouton : `Continuer avec Candice →` (lien vers `https://candice.app/parametres/abonnement`)
  - `Ton compte reste accessible. Tu peux reprendre à tout moment depuis tes paramètres.`
  - Pied de page : `Candice ·` lien `Se désabonner` (vers `https://candice.app/parametres/notifications`)

---

## 4 — Fiche du proche complète (route emails/profile-complete) ⚫ ORPHELIN

- **Fichier** : `src/app/api/emails/profile-complete/route.ts` (méthode POST)
- **Déclencheur** : **AUCUN**. La recherche `grep -rln "emails/profile-complete"` (hors le fichier lui-même) ne renvoie aucun appelant. La route existe mais n'est jamais appelée dans le code. (La notification « fiche complète » réellement utilisée passe par les routes n°7 et n°9, qui ont leur propre HTML inline.)
- **Destinataire prévu** : le pilote propriétaire (`ownerEmail`).
- **Tracé** : Non.
- **OBJET (verbatim)** : `Tout est prêt pour {contactFirstName}.` (à défaut : `Tout est prêt pour ton proche.`)
- **CORPS (texte lisible verbatim)** :
  - En-tête : `CANDICE`
  - Icône : 🎉
  - Titre : `Bonne nouvelle, {ownerFirstName}.` (sinon `Bonne nouvelle.`)
  - Sous-titre : `La fiche de {contactFirstName} est complète.` (à défaut `… de ton proche …`)
  - `{contactFirstName} a complété sa fiche. Candice a maintenant tout ce qu'il faut pour vous aider.`
  - `Découvrez les premières suggestions personnalisées — des attentions pensées spécialement pour {contactFirstName}.` (à défaut `… pour lui/elle.`)
  - Bouton : `Voir les suggestions →` (lien vers `https://candice.app/dashboard`)
  - Note : `✦  Candice connaît maintenant {contactFirstName} — les suggestions seront exactement justes.`
  - Pied de page : lien `candice.app`

---

## 5 — Invitation au questionnaire (questionnaire-invite) 🟡

- **Fichier** : `src/app/api/emails/questionnaire-invite/route.ts` (méthode POST)
- **Déclencheur** : appelé par `src/components/questionnaire/QuestionnaireForm.tsx` (ligne 381) — le pilote invite un proche par email. Route CONNECTÉE : exige une session (`auth.getUser()` ; 401 sinon). Client UTILISATEUR pour lire le prénom (`user_metadata.full_name`) et le sexe du pilote (`my_profile.practical_info.sexe`). Exige `contactEmail`.
- **Destinataire** : le proche invité (`contactEmail`).
- **Tracé** : Non.
- **OBJET (verbatim)** : `Une invitation Candice de la part de {piloteFirstName} ✦` (à défaut, sans prénom : `Une invitation Candice ✦`)
- **CORPS (texte lisible verbatim)** :
  - Aperçu masqué (preheader) : `Pour aider tes proches à mieux penser à toi, sans avoir à tout expliquer.`
  - En-tête : `CANDICE`
  - Titre : `Bonjour {procheFirstName}.` (sinon `Bonjour.`)
  - Sous-titre : `{piloteFirstName} t'a invité(e) à créer ta fiche Candice.` (à défaut : `Tu as été invité(e) à créer ta fiche Candice.`)
  - `Candice apprend ce qui te ressemble : les attentions qui te touchent, les détails qui comptent, les choses à éviter, les petits gestes qui font vraiment la différence.`
  - `L'objectif n'est pas de tout partager. Au contraire : ta fiche reste à toi. Candice garde les informations fines et aide simplement {piloteFirstName} à mieux choisir quand {il/elle/il ou elle} veut te faire plaisir.` (le pronom dépend du sexe du pilote : `elle` si femme, `il` si homme, `il ou elle` sinon ; à défaut de prénom : `… aide tes proches à mieux choisir quand ils veulent te faire plaisir.`)
  - Bouton : `Découvrir mon invitation →` (lien vers `profileUrl`, à défaut `https://candice.app`)
  - `Tu peux répondre à ton rythme et garder la main sur ce qui est visible.`
  - Pied de page : lien `candice.app`

---

## 6 — Rappel d'une suggestion en attente (reminder-suggestion) ✅

- **Fichiers** : route `src/app/api/emails/reminder-suggestion/route.ts` (POST) qui délègue à la fonction `sendReminderEmail` de `src/lib/notifications/email-reminder.ts`.
- **Déclencheur** : deux chemins.
  1. La route POST `reminder-suggestion` — protégée par `Authorization: Bearer ${CRON_SECRET}` ; exige `user_id`, `suggestion_id`, `title`, `description`, `priority`.
  2. Le cron `src/app/api/cron/email-reminders/route.ts` (ligne 48) appelle directement `sendReminderEmail`.
- **Destinataire** : le pilote (email récupéré via l'admin auth par `userId`). L'envoi respecte la préférence : si `my_profile.notif_email_enabled === false`, l'email n'est PAS envoyé (retour `false`).
- **Tracé** : **Oui**. Écrit dans `notification_log` : `channel: 'email'`, `notification_type: 'proactive_reminder'`, `related_suggestion_id`, `title`, `status: 'sent'` ou `'failed'`, `error_message` si erreur.
- **OBJET (verbatim, selon `priority`)** :
  - `urgent` : `Une attention urgente vous attend — Candice`
  - `high` : `Une attention importante vous attend — Candice`
  - `normal` : `Une idée de Candice vous attend`
  - `low` : `Quand vous aurez un moment — Candice`
  - défaut : celui de `normal`
- **CORPS (texte lisible verbatim)** :
  - En-tête : `CANDICE`
  - Titre : `{suggestion.title}` (titre dynamique de la suggestion)
  - Corps : `{suggestion.description}` (description dynamique)
  - Bouton : `Voir dans Candice →` (lien vers `https://candice.app/dashboard`)
  - Note : `Candice garde cette attention en attente jusqu'à votre décision.`
  - Pied de page : liens `Gérer mes notifications` (vers `https://candice.app/parametres/notifications`) et `candice.app`

---

## 7 — Fiche du proche complète, via lien de partage (shared-profile/complete) 🟡

- **Fichier** : `src/app/api/shared-profile/complete/route.ts` (méthode POST)
- **Déclencheur** : appelé quand un proche termine sa fiche depuis un lien de partage. Route CONNECTÉE (exige `auth.getUser()`). Attribue 500 points au proche (une seule fois), puis, si un `token` est fourni, notifie l'expéditeur du lien. L'envoi de l'email est non bloquant (dans un `try/catch`).
- **Destinataire** : l'expéditeur du lien de partage (email de `share_links.sender_id`, récupéré via client ADMIN `createAdminClient`).
- **Tracé** : Non.
- **OBJET (verbatim)** : `La fiche de ton proche est complète ✦`
- **CORPS (texte lisible verbatim)** :
  - En-tête : `CANDICE`
  - Icône : 🎉
  - Titre : `Bonne nouvelle, {ownerFirstName}.` (sinon `Bonne nouvelle.`)
  - Sous-titre : `La fiche de ton proche est complète.` (le prénom du contact est passé à `null` ici, donc c'est toujours « ton proche »)
  - `Ton proche a complété sa fiche. Candice a maintenant tout ce qu'il faut pour vous aider.`
  - `Découvrez les premières suggestions personnalisées — des attentions pensées spécialement pour lui/elle.`
  - Bouton : `Voir les suggestions →` (lien vers `https://candice.app/dashboard`)
  - Note : `✦  Cette fiche complète te rapporte 500 points supplémentaires dans ta cagnotte Candice.`
  - Pied de page : lien `candice.app`

---

## 8 — Demande de partage d'analyse (A → B) (contacts/[id]/consent) 🟡

- **Fichier** : `src/app/api/contacts/[id]/consent/route.ts` (méthode POST)
- **Déclencheur** : le pilote A appuie volontairement sur « Partager » pour partager avec le proche B l'analyse d'un contact. Route CONNECTÉE. Conditions : le contact appartient à A, B a un compte (`proche_user_id` non nul), une analyse existe, et aucun consentement actif/pending. Crée une ligne `contact_consents` (`status: pending`, `scope: ['analysis']`), puis notifie B (non bloquant). L'email récupère l'adresse de B via client ADMIN.
- **Destinataire** : le proche B (email via admin auth par `proche_user_id`).
- **Tracé** : Non.
- **OBJET (verbatim)** : `{piloteFirstName} veut partager une analyse avec toi ✦` (prénom à défaut : `Quelqu'un`)
- **CORPS (texte lisible verbatim)** :
  - En-tête : `CANDICE`
  - Titre : `Bonjour {procheFirstName}.` (sinon `Bonjour.`)
  - Sous-titre : `{piloteFirstName} souhaite partager avec toi l'analyse que Candice a faite de {contactFirstName}.`
  - `Tu peux voir ce que Candice retient de toi — ou refuser. Aucune obligation. Les données brutes saisies par {piloteFirstName} ne sont jamais partagées.`
  - Bouton : `Voir et accepter (ou refuser) →` (lien vers `https://candice.app/contacts/partage/{consentId}`)
  - Pied de page : lien `candice.app`

---

## 9 — Le proche a complété sa fiche, via invite/link (invite/link) 🟡

- **Fichier** : `src/app/api/invite/link/route.ts` (méthode POST)
- **Déclencheur** : quand un proche ouvre/valide un lien d'invitation (`token`). Route CONNECTÉE. Marque le lien comme utilisé (idempotent), rattache `proche_user_id` au contact (via client ADMIN), puis notifie le pilote (non bloquant).
- **Destinataire** : le pilote (email via admin auth par `invite.pilote_id`).
- **Tracé** : Non.
- **OBJET (verbatim)** : `{procheFirstName} a complété sa fiche ✦` (à défaut : `Ton proche a complété sa fiche ✦`)
- **CORPS (texte lisible verbatim)** :
  - En-tête : `CANDICE`
  - Titre : `Bonne nouvelle, {piloteFirstName}.` (sinon `Bonne nouvelle.`)
  - Sous-titre : `{procheFirstName} a complété son profil sur Candice.` (à défaut : `Ton proche a complété son profil sur Candice.`)
  - `Candice a maintenant tout ce qu'il faut pour t'aider à prendre soin de {procheFirstName}. Découvre les premières attentions personnalisées.` (à défaut : `… de cette personne.`)
  - Bouton : `Voir ses attentions →` (lien vers `https://candice.app/contacts`)
  - Pied de page : lien `candice.app`

---

## 10 — Relance d'invitation / nudge (invite/nudge) 🟡

- **Fichier** : `src/app/api/invite/nudge/route.ts` (méthode POST)
- **Déclencheur** : le pilote relance un proche. Route CONNECTÉE. Trois cas :
  1. **Proche pas encore inscrit** (`proche_user_id` nul) : si le contact a un email, crée un nouveau lien d'invitation (via ADMIN) et envoie l'email de RÉINVITATION.
  2. **Proche inscrit mais fiche incomplète** : tente d'abord une notification PUSH (voir section push). Si au moins un push part, pas d'email.
  3. **Push non envoyé** : envoie l'email de NUDGE en repli.
- **Destinataire** : le proche (email du contact pour la réinvitation, ou email du compte du proche via admin auth pour le nudge).
- **Tracé** : l'email n'est PAS tracé. Le push, lui, est tracé (voir section notifications push).

### 10a — Email de RÉINVITATION (proche non inscrit)
- **OBJET (verbatim)** : `{piloteFirstName} t'invite sur Candice ✦` (à défaut : `Ton invitation Candice t'attend ✦`)
- **CORPS (texte lisible verbatim)** :
  - Aperçu masqué : `Pour recevoir des attentions plus justes, moins génériques.`
  - En-tête : `CANDICE`
  - Titre : `Bonjour {procheFirstName}.` (sinon `Bonjour.`)
  - Sous-titre : `{piloteFirstName} t'a invité(e) à créer ta fiche Candice.` (à défaut : `Tu as été invité(e) à créer ta fiche Candice.`)
  - `En quelques questions, Candice comprend ce qui te fait plaisir, ce qui te touche et ce qu'il vaut mieux éviter. Ensuite, elle aide {piloteFirstName} à trouver des attentions vraiment adaptées — sans lui dévoiler tous les détails de ta fiche.` (à défaut : `… elle aide tes proches à trouver des attentions vraiment adaptées — sans leur dévoiler tous les détails de ta fiche.`)
  - Bouton : `Créer ma fiche →` (lien vers `https://candice.app/invite/{token}`)
  - `Tu choisis ce que tu partages.`
  - Pied de page : lien `candice.app`

### 10b — Email de NUDGE (proche inscrit, sans push)
- **OBJET (verbatim)** : `{piloteFirstName} voudrait mieux prendre soin de toi ✦` (à défaut : `Ton profil Candice t'attend ✦`)
- **CORPS (texte lisible verbatim)** :
  - En-tête : `CANDICE`
  - Titre : `Bonjour {procheFirstName}.` (sinon `Bonjour.`)
  - Sous-titre : `{piloteFirstName} veut prendre encore mieux soin de toi — et Candice est là pour l'aider.` (à défaut : `Quelques minutes pour que Candice te connaisse vraiment.`)
  - `Ton profil n'est pas encore terminé. En quelques minutes de plus, Candice pourra vraiment personnaliser chaque attention pour toi — au bon moment, de la bonne façon, sans que personne n'ait à y penser.`
  - Bouton : `Reprendre mon profil →` (lien vers `https://candice.app/moi/questionnaire`)
  - Pied de page : lien `candice.app`

---

## 11 — Demande de voir un profil (X → Y) (profile-view/request) 🟡

- **Fichier** : `src/app/api/profile-view/request/route.ts` (méthode POST)
- **Déclencheur** : X demande à voir la fiche de Y. Route CONNECTÉE + exige que le questionnaire de X soit complet (5/5) sinon `403 questionnaire_incomplete`. Vérifie que la cible existe et est trouvable (`is_findable`), qu'il n'y a pas déjà une demande. Crée une ligne `contact_consents` (`kind: profile_view`, `status: pending`) via le client UTILISATEUR (la policy RLS `viewer_create_profile_view_request` est la garde réelle). Notifie Y (non bloquant, email via ADMIN).
- **Destinataire** : la cible Y (email via admin auth).
- **Tracé** : Non.
- **OBJET (verbatim)** : `{requesterFirstName} veut voir ton profil` (prénom à défaut : `Quelqu'un`)
- **CORPS (texte lisible verbatim)** :
  - En-tête : `CANDICE`
  - Titre : `Bonjour {targetFirstName}.` (sinon `Bonjour.`)
  - Sous-titre : `{requesterFirstName} veut voir ton profil.`
  - `C'est toi qui décides ce que tu partages : tout, seulement certaines sections, ou rien de visible — Candice pourra quand même l'aider à te faire plaisir. Tu peux aussi refuser. Rien n'est partagé sans ton accord.`
  - Bouton : `Choisir ce que je partage →` (lien vers `https://candice.app/moi/partage/demandes/{consentId}`)
  - Pied de page : lien `candice.app`

---

## 12 — Suppression de compte programmée (account/delete) 🟡

- **Fichier** : `src/app/api/account/delete/route.ts` (méthode POST)
- **Déclencheur** : le pilote demande la suppression de son compte. Route CONNECTÉE + re-vérifie le mot de passe (`signInWithPassword`). Programme la suppression à J+30, passe le statut à `cancelled`, journalise l'événement dans `account_lifecycle_events` (via ADMIN), puis envoie l'email de confirmation (non bloquant, `.catch(() => {})`).
- **Destinataire** : le pilote (`user.email`).
- **Tracé** : Non (dans `notification_log` ; l'événement lifecycle, lui, est bien journalisé dans `account_lifecycle_events`).
- **OBJET (verbatim)** : `Suppression de compte programmée — Candice`
- **CORPS (texte lisible verbatim)** :
  - En-tête : `Candice`
  - `Ta demande de suppression a été enregistrée. Ton compte et toutes tes données seront supprimés le {date au format « 4 juillet 2026 »}.`
  - `Tu peux annuler cette demande jusqu'à cette date depuis tes paramètres.`
  - Bouton : `Annuler la suppression →` (lien vers `https://candice.app/parametres/abonnement`)

---

## 13 — Export RGPD des données (account/export) 🟡

- **Fichier** : `src/app/api/account/export/route.ts` (méthode POST)
- **Déclencheur** : le pilote demande l'export de ses données. Route CONNECTÉE. Rassemble via client ADMIN : `my_profile`, `contacts` (+ `questionnaire_responses`), `suggestions`, `proactive_suggestions`, `confidences`, `profile_notes`, `notification_log`, `account_lifecycle_events`. Sérialise en JSON, encode en base64, et l'envoie en pièce jointe.
- **Destinataire** : le pilote (`user.email`).
- **Tracé** : Non.
- **OBJET (verbatim)** : `Ton export de données Candice (RGPD)`
- **CORPS (texte lisible verbatim)** :
  - En-tête : `Candice`
  - `Conformément au RGPD, voici l'ensemble des données que Candice détient sur toi. L'export est joint à cet email au format JSON.`
  - `Cet export inclut : ton profil, tes proches et leurs questionnaires, tes confidences, tes notes, les suggestions générées et l'historique de notifications.`
  - **Pièce jointe** : fichier `candice-export-{AAAA-MM-JJ}.json`

---

## 14 — Emails de cycle de vie (cron/lifecycle-check) 🟡

- **Fichier** : `src/app/api/cron/lifecycle-check/route.ts` (méthode GET)
- **Déclencheur** : cron protégé par `Authorization: Bearer ${CRON_SECRET}`. Parcourt tous les profils et, selon le statut, envoie des emails via la fonction interne `sendSimpleEmail` (modèle générique). Ces emails-là ne sont PAS tracés dans `notification_log`. (Les rappels d'essai J-7/J-3/J-1 déclenchés par ce même cron passent par la route n°3, qui elle est tracée.)
- **Destinataire** : le pilote concerné (email via admin auth).
- **Tracé** : Non pour `sendSimpleEmail`.
- **Trois messages envoyés par `sendSimpleEmail`** :

### 14a — Essai expiré → pause (BRANCHE DÉSACTIVÉE)
- **Note** : cette branche est gardée par `const ENABLE_TRIAL_LOCKOUT = false;` (commentaire : « Phase de test — réactiver quand Stripe est branché (Phase 7) »). Elle N'ENVOIE donc RIEN aujourd'hui.
- **OBJET (verbatim)** : `Candice est en pause`
- **CORPS (verbatim)** : `Ton essai de 30 jours est terminé. Candice est en pause — reprends quand tu veux depuis tes paramètres.`

### 14b — Passage en silence (90 jours d'inactivité)
- **Condition** : statut `active` et `last_active_at` > 90 jours. Passe le statut à `silent`, journalise `went_silent`.
- **OBJET (verbatim)** : `On t'attend — Candice`
- **CORPS (verbatim)** : `Ça fait un moment qu'on ne t'a pas vu. Tes proches sont toujours là, et Candice aussi. Reviens quand tu veux.`

### 14c — Relance après pause (60 jours)
- **Condition** : statut `paused`, `subscription_paused_at` entre 60 et 61 jours.
- **OBJET (verbatim)** : `Reprendre Candice ?`
- **CORPS (verbatim)** : `Ça fait 2 mois que Candice est en pause. Tes proches ont peut-être un anniversaire qui approche, une attention qui serait parfaite. Reprends en un clic.`

- **Modèle commun `sendSimpleEmail` (verbatim)** :
  - En-tête : `Candice`
  - Corps : le texte ci-dessus
  - Bouton : `Ouvrir Candice →` (lien vers `https://candice.app/dashboard`)
  - Pied de page : lien `Se désabonner` (vers `https://candice.app/parametres/notifications`)

- **Autre action du cron (pas un email)** : quand `deletion_scheduled_at` est atteint pour un compte `cancelled`, il appelle `hardDeleteUser` (suppression définitive).

---

## Notifications push

- **Fichier** : `src/lib/notifications/push-sender.ts` — fonction `sendPushToUser(userId, payload, supabaseAdmin)`.
- **Technologie** : Web Push via la librairie `web-push`, avec clés VAPID (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, contact `mailto:hello@candice.app`).
- **Statut** : ✅ câblé ET tracé. Chaque envoi (réussi ou échoué) écrit une ligne dans `notification_log` : `channel: 'push'`, `notification_type` = le `tag` du payload (ou `'proactive'`), `title`, `body`, `status` (`sent`/`failed`), `error_message`.
- **Garde-fous appliqués avant envoi** (lus depuis `my_profile`) :
  - `notif_push_enabled === false` → aucun envoi.
  - Heures calmes (`notif_quiet_hours_start` défaut 21h, `notif_quiet_hours_end` défaut 8h, en fuseau Europe/Paris) → aucun envoi pendant ce créneau.
  - Plafond quotidien (`notif_max_per_day`, défaut **2**) : si déjà atteint aujourd'hui (compté sur `notification_log`, canal push), aucun envoi.
  - Abonnements lus dans `push_subscriptions` ; un abonnement expiré (statut HTTP 410) est supprimé automatiquement.

- **Qui déclenche des push ?**
  1. `src/app/api/invite/nudge/route.ts` (ligne 75) — relance d'un proche inscrit dont la fiche est incomplète. Payload :
     - `title` : `Ton profil Candice t'attend ✦`
     - `body` : `{piloteFirstName} veut prendre encore mieux soin de toi — quelques minutes suffisent.` (à défaut : `Quelques minutes de plus, et Candice pourra vraiment personnaliser chaque attention pour toi.`)
     - `url` : `https://candice.app/moi/questionnaire` · `tag` : `nudge-profile`
  2. `src/lib/signals/generator.ts` (lignes 260 et 412) — deux envois de push liés au moteur de signaux (contenu du payload défini dans ce fichier ; non détaillé ici car hors du périmètre « emails », signalé pour exhaustivité).

- **Routes d'abonnement/désabonnement push** : `src/app/api/push/subscribe/route.ts` et `src/app/api/push/unsubscribe/route.ts` (voir doc 15 — API).
</content>
</invoke>


---

<!-- ============ 13-automatismes ============ -->

# Cartographie — 13. Automatismes (crons)

> Ce document décrit **ce qui existe réellement** dans le code des tâches planifiées (crons), sans jugement ni conseil.
> Source : `(fichier: …)` / `(base: …)`. « non vérifié » sinon.
> Statuts : ✅ branché · 🟡 partiel · ⚫ code présent jamais appelé · ❌ absent.
>
> **Volume réel `cron_runs` au moment de la cartographie : 0 ligne.** La base interrogée (`SUPABASE_DB_URL` de `.env.local`) est la base réelle du projet en état pré-lancement : certaines tables sont peuplées (discovery_questions 70, discovery_sessions 57, cadence_log 31, profile_analysis 2…), d'autres — dont cron_runs — sont encore vides. L'absence de lignes ici signifie qu'aucun cron n'a encore tourné avec effet en base, pas qu'il s'agirait d'un environnement de test distinct.

---

## Planification globale (fichier: vercel.json)

Les 4 crons sont déclarés dans `vercel.json`. Traduction des expressions cron (heure serveur, UTC — l'appli calcule ensuite en Europe/Paris dans le code) :

| Cron | Expression | Fréquence en clair | Appelle un LLM ? |
|------|-----------|--------------------|------------------|
| `detect-and-generate` | `0 6,14 * * *` | **2 fois par jour, à 6h et 14h** | ✅ Oui (`claude-sonnet-4-6`) |
| `email-reminders` | `0 10 * * *` | **1 fois par jour, à 10h** | ❌ Non |
| `cadence-feedback` | `0 4 * * 1` | **1 fois par semaine, le lundi à 4h** | ❌ Non |
| `lifecycle-check` | `0 3 * * *` | **1 fois par jour, à 3h** | ❌ Non |

**Garde-fou commun d'authentification** : les 4 exigent l'en-tête `Authorization: Bearer {CRON_SECRET}`. Sans le bon secret → réponse `401 Unauthorized`, rien ne s'exécute.

---

## 1. `detect-and-generate` — le cœur des suggestions proactives ✅

Fichier: `src/app/api/cron/detect-and-generate/route.ts` · **2×/jour (6h et 14h)**

### Étape par étape

1. **Auth** : vérifie `Bearer CRON_SECRET`, sinon 401 (lignes 17-21).
2. **Ouvre une ligne `cron_runs`** avec `status='running'` (lignes 28-33).
3. **Liste les utilisateurs** ayant au moins un contact non archivé (dédoublonnage des `user_id`).
4. **Pour chaque utilisateur** (dans l'ordre) :
   - **Skip abonnement** : charge `my_profile.subscription_status` ; si `paused` ou `cancelled` → passe au suivant (lignes 59-65).
   - **Détecte les signaux** : appelle `detectSignalsForUser` (règles de dates déterministes, voir cartographie 09-b). Cumule dans `totalSignals`.
   - **Récupère jusqu'à 10 signaux** `active` dont la `trigger_date` est arrivée (`<= aujourd'hui`), triés (lignes 73-79).
   - **Génère une suggestion par signal** : appelle `generateSuggestionForSignal` (appel LLM `claude-sonnet-4-6`, voir cartographie 09-b). Cumule dans `totalSuggestions`.
5. **Clôture `cron_runs`** en `success` avec `signals_detected`, `suggestions_generated`, `metadata.errors` (lignes 94-105).
6. En cas d'exception globale : `cron_runs` passé en `error` avec `error_message`, réponse 500.

### Appel LLM + coût approximatif par exécution

- **Modèle : `claude-sonnet-4-6`**. Deux appels possibles par signal : chemin proche (**max_tokens 600**) ou chemin pilote (**max_tokens 400**). Voir prompts verbatim en cartographie 09-b.
- **Nombre d'appels par run** : au plus 10 signaux « ready » traités **par utilisateur**, chacun = 1 appel LLM — **mais** le garde-fou cadence (voir plus bas) coupe une partie des appels sans consommer de tokens.
- **Estimation de coût — À CONSIDÉRER COMME UNE ESTIMATION, tarif non officiel pour cet ID de modèle (non vérifié).** En prenant une hypothèse de tarif « classe Sonnet » (~3 $/M tokens en entrée, ~15 $/M en sortie) et un prompt d'entrée de l'ordre de 1 000-2 000 tokens + ~400-600 tokens de sortie : **≈ 0,01 à 0,02 $ par suggestion générée** (ordre de grandeur, ~1 à 2 centimes). Un run qui génère 20 suggestions coûterait donc de l'ordre de **0,2 à 0,4 $**. Ces chiffres sont indicatifs et dépendent du tarif réel du modèle, non confirmé ici.

### Garde-fous

- **Auth `CRON_SECRET`** (obligatoire).
- **Plafond `MAX_SIGNALS_PER_RUN = 50`** (fichier ligne 9) : dès que `totalSignals >= 50`, la boucle utilisateurs s'arrête → borne la charge et le coût par run.
- **Limite 10 signaux/utilisateur** générés par passage.
- **Skip abonnés `paused`/`cancelled`**.
- **Garde-fou cadence** (dans `generator.ts`) : un signal non-urgent trop rapproché de la dernière suggestion est marqué `consumed` **sans appel LLM**.
- **Anti-doublon signaux** (dans `detector.ts`).
- **Télémétrie sans PII** : les erreurs stockées dans `cron_runs.metadata` n'utilisent JAMAIS l'UUID utilisateur, mais un hash court sha256 (`shortId`, lignes 11-13). Commentaire verbatim : *« Télémétrie sans PII : on ne stocke JAMAIS l'UUID utilisateur dans cron_runs.metadata … Hash court sha256 non réversible → corrélation debug OK. »*

### Écrit en base

- **`cron_runs`** : 1 ligne par exécution (`job_name='detect-and-generate'`, status running→success/error, `signals_detected`, `suggestions_generated`, `metadata.errors`).
- **`contextual_signals`** : nouvelles lignes de signaux (via detector).
- **`proactive_suggestions`** : nouvelles suggestions (via generator) + passage des signaux consommés en `consumed`.
- Éventuellement **push notifications** (priorité urgent/high) via `sendPushToUser`.

### Logs notables

`[CRON detect-and-generate] Starting` · `Processing {n} users` · `user={id} signals_created={n}` · `Max signals reached (50), stopping` · `Done — signals={n} suggestions={n} errors={n}` · `Fatal: {msg}`.

---

## 2. `email-reminders` — relance e-mail des suggestions en attente ✅

Fichier: `src/app/api/cron/email-reminders/route.ts` · **1×/jour (10h)** · pas de LLM

### Étape par étape

1. **Auth** `Bearer CRON_SECRET`, sinon 401.
2. Ouvre une ligne `cron_runs` (`job_name='email-reminders'`, `status='running'`).
3. **Sélectionne les suggestions `pending` générées il y a plus de 48 h** (`generated_at < maintenant - 48h`), max 50 (lignes 26-32).
4. **Exclut celles déjà e-mailées** : croise avec `notification_log` (canal `email`, `related_suggestion_id`) pour ne pas relancer deux fois (lignes 38-45).
5. **Envoie l'e-mail de rappel** pour chacune via `sendReminderEmail` ; compte `emails_sent` / `emails_failed`.
6. Clôture `cron_runs` en `success` (ou `error` si exception) avec `metadata: { emails_sent, emails_failed }`.

### Garde-fous

- Auth `CRON_SECRET`.
- **Seuil 48 h** avant relance.
- **Plafond 50 suggestions** par run.
- **Anti-double-envoi** via `notification_log`.
- Les erreurs sont capturées (try/catch) et n'interrompent pas la clôture.

### Écrit en base

- **`cron_runs`** (1 ligne/run, `metadata.emails_sent/emails_failed`).
- Envoi d'e-mails (via `sendReminderEmail`, qui journalise dans `notification_log` — non détaillé ici).

### Logs notables

`[cron/email-reminders] {errorMessage}` en cas d'erreur.

---

## 3. `cadence-feedback` — agrégat hebdo de la performance des suggestions ✅

Fichier: `src/app/api/cron/cadence-feedback/route.ts` · **1×/semaine (lundi 4h)** · pas de LLM

### Étape par étape

1. **Auth** `Bearer CRON_SECRET`, sinon 401.
2. Définit une **fenêtre de 28 jours** glissante (windowStart → windowEnd).
3. Charge les `proactive_suggestions` créées dans la fenêtre, avec un `contact_id` non nul.
4. Si aucune → écrit un `cron_runs` `success` avec `metadata.inserted=0` et sort.
5. **Agrège par couple (user_id, contact_id)** : compte `validated`, `refused`, `snoozed`, `ignored`, `total` (lignes 27-44).
6. **Calcule un taux de validation** (`validated/total × 100`) et un **ajustement recommandé** : `> 80 %` → `increase_cadence` ; `< 30 %` → `reduce_cadence` ; sinon `null` (lignes 46-66).
7. **Insère les lignes agrégées dans `cadence_feedback`**.
8. Clôture `cron_runs` (`success` avec `metadata.inserted={n}`, ou `error` si l'insertion échoue → 500).

### Garde-fous

- Auth `CRON_SECRET`.
- Ne traite que les suggestions **avec contact** (les suggestions pilote sont exclues).
- Sortie propre si aucune donnée (inserted=0).
- Erreur d'insertion → `cron_runs` en `error` + réponse 500.

### Ce qui est calculé mais PAS (encore) appliqué

Le champ `recommended_adjustment` (`increase_cadence` / `reduce_cadence`) est **calculé et stocké**, mais ce document ne relève **aucun consommateur automatique** de ce champ dans la chaîne cron (la cadence effective est résolue ailleurs par `resolveCadenceForContact`). 🟡 — table de mesure produite ; utilisation en aval non vérifiée ici.

### Écrit en base

- **`cadence_feedback`** : 1 ligne par (user, contact) actif sur la fenêtre (compteurs + `validation_rate` + `recommended_adjustment`).
- **`cron_runs`** : 1 ligne/run avec `metadata.inserted`.

### Logs notables

`[cadence-feedback] Insert error: {message}`.

---

## 4. `lifecycle-check` — cycle de vie des comptes / abonnements ✅ (partiellement gelé)

Fichier: `src/app/api/cron/lifecycle-check/route.ts` · **1×/jour (3h)** · pas de LLM

### Étape par étape

1. **Auth** `Bearer CRON_SECRET`, sinon 401.
2. Ouvre une ligne `cron_runs` (`job_name='lifecycle-check'`, `status='running'`).
3. Charge tous les `my_profile` (statut d'abonnement + dates).
4. **Pour chaque profil**, selon le statut :
   - **Essai (`trial`)** : calcule l'âge de l'essai. Envoie des **rappels J-7 / J-3 / J-1** (jours 23/27/29) par appel HTTP interne à `/api/emails/trial-reminder`, en évitant les doublons du jour via `notification_log` (lignes 62-89).
   - **Fin d'essai → pause (jour ≥ 30)** : **GELÉ**. Encadré par le flag `ENABLE_TRIAL_LOCKOUT = false` (ligne 9, commentaire verbatim : *« Phase de test — réactiver quand Stripe est branché (Phase 7) »*). Tant que le flag est faux, le passage `trial → paused` **ne s'exécute pas** (lignes 91-107).
   - **Actif → silencieux (90 j d'inactivité)** : passe `active → silent`, journalise `account_lifecycle_events` (`went_silent`), envoie un e-mail « On t'attend » (lignes 111-130).
   - **Pause → relance (60 j)** : entre 60 et 61 j de pause, envoie un e-mail « Reprendre Candice ? » (lignes 133-142).
   - **Suppression programmée** : si `cancelled` et `deletion_scheduled_at <= maintenant` → **`hardDeleteUser`** (suppression définitive) (lignes 145-150).
5. Clôture `cron_runs` en `success` avec `metadata.transitions` (liste des transitions effectuées), ou `error` + 500 si exception.

### Appel LLM

Aucun. Utilise Resend pour les e-mails (`sendSimpleEmail`, gabarit HTML inline verbatim dans le fichier lignes 18-32) et un appel HTTP interne pour les rappels d'essai.

### Garde-fous

- Auth `CRON_SECRET`.
- **Flag `ENABLE_TRIAL_LOCKOUT = false`** : verrou de fin d'essai désactivé jusqu'au branchement Stripe (aucune mise en pause automatique aujourd'hui).
- **Anti-doublon** rappels d'essai via `notification_log` (`trial_reminder_{n}` déjà envoyé le jour même).
- Fenêtre stricte pour la relance pause (`>= 60 && < 61` jours).
- E-mails en `.catch(() => {})` : un échec d'envoi n'interrompt pas la boucle.
- La suppression dure (`hardDeleteUser`) n'est déclenchée que si `deletion_scheduled_at` est **atteinte**.

### Écrit en base

- **`cron_runs`** : 1 ligne/run avec `metadata.transitions`.
- **`my_profile`** : changements de `subscription_status` (`active→silent` ; `trial→paused` seulement si le flag était activé).
- **`account_lifecycle_events`** : événements `went_silent`, `trial_expired`.
- **`notification_log`** : indirectement via les envois d'e-mails.
- Suppression définitive de l'utilisateur via `hardDeleteUser` (cascade — hors périmètre de ce doc).

### Logs notables

Pas de `console.log` de résumé ; les transitions sont uniquement stockées dans `cron_runs.metadata.transitions` (ex. `trial_reminder_7:{userId}`, `went_silent:{userId}`, `paused_relance:{userId}`, `hard_deleted:{userId}`).

---

## Récapitulatif

| Cron | Fréquence | LLM | Écrit dans | Garde-fous clés | Statut |
|------|-----------|-----|-----------|-----------------|--------|
| `detect-and-generate` | 2×/j (6h,14h) | ✅ `claude-sonnet-4-6` (600/400 tk) | cron_runs, contextual_signals, proactive_suggestions | CRON_SECRET, plafond 50, skip paused/cancelled, cadence gate, hash PII | ✅ |
| `email-reminders` | 1×/j (10h) | ❌ | cron_runs, e-mails | CRON_SECRET, seuil 48h, plafond 50, anti-double-envoi | ✅ |
| `cadence-feedback` | 1×/sem (lun 4h) | ❌ | cron_runs, cadence_feedback | CRON_SECRET, fenêtre 28j, contacts only | ✅ (aval du champ ajustement non vérifié) |
| `lifecycle-check` | 1×/j (3h) | ❌ | cron_runs, my_profile, account_lifecycle_events, e-mails | CRON_SECRET, flag lockout OFF, anti-doublon rappels | ✅ (fin d'essai gelée) |

- **Volume réel `cron_runs` = 0 ligne** (base réelle du projet, en pré-lancement) — aucun historique d'exécution en base à ce jour. La fréquence et le comportement décrits sont ceux **du code**.
- **Estimations de coût LLM** : uniquement pour `detect-and-generate` ; chiffres indicatifs sur hypothèse de tarif « classe Sonnet » non confirmée pour l'ID `claude-sonnet-4-6`.
</content>


---

<!-- ============ 14-base-de-donnees ============ -->

# 14 — Base de données (schéma `public`)

> **Ce document décrit ce qui EXISTE aujourd'hui dans la base de données Candice, table par table, sans jugement ni recommandation.**
>
> - **Source des données** : lecture directe de la base de production (schéma `public`), le 2026-09-22, via `pg_tables`, `information_schema.columns`, `pg_policies`, `pg_class`, et `select count(*)` sur chaque table. Aucune écriture n'a été faite.
> - **42 tables** au total dans le schéma `public`.
> - **Statuts** : ✅ utilisée (contient des données) · 🟡 vide aujourd'hui (0 ligne) mais branchée au code · ⚫ morte / dépréciée / non branchée.
> - **« RLS »** = Row Level Security, le verrou d'accès de Supabase. **Les 42 tables ont ce verrou ACTIVÉ.** Pour chacune, la règle est traduite en français simple. Le « service technique » (`service_role`, utilisé par les traitements serveur et les crons) contourne toujours ces verrous.
> - **« Volume »** = nombre de lignes réelles au moment du relevé. La base est très peu remplie (environnement de test / pré-lancement), donc beaucoup de tables sont à 0 ligne sans être mortes pour autant.
> - Aucune table ne porte de commentaire SQL (`COMMENT ON`) : les rôles ci-dessous sont déduits du nom, des colonnes et du code applicatif (`src/`), ou marqués « usage non vérifié ».

---

## Domaine 1 — Profil du pilote (« moi »)

### `my_profile` ✅
- **Rôle** : la fiche de l'utilisateur principal (le « pilote ») sur lui-même. Table centrale du profil : préférences relationnelles, style d'attention, tempérament, mode de vie, infos pratiques (tailles, adresse, allergies…), réglages de notifications, ET l'état de l'abonnement (essai, statut, dates de pause/annulation/suppression). Très large (98 colonnes).
- **Volume** : 2 lignes
- **Accès (RLS)** : chaque utilisateur ne voit et ne modifie que sa propre fiche (`user_id` = utilisateur connecté).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | nullable |
| created_at | timestamptz | nullable |
| updated_at | timestamptz | nullable |
| love_language | text | nullable |
| communication_style | text | nullable |
| stress_response | text | nullable |
| energy_type | text | nullable |
| conflict_style | text | nullable |
| appreciation_style | text | nullable |
| surprise_preference | text | nullable |
| food_preferences | text | nullable |
| wishlist | text | nullable |
| standing | text | nullable |
| gastronomy | text | nullable |
| accommodation | text | nullable |
| gift_style | text | nullable |
| additional_notes | text | nullable |
| disliked_activities | text | nullable |
| disliked_foods | text | nullable |
| tactility | text | nullable |
| health_comfort | text | nullable |
| family_life | text | nullable |
| character_emotions | text | nullable |
| cannot_stand | text | nullable |
| few_know | text | nullable |
| food_allergies | text | nullable |
| diet | text | nullable |
| religion | text | nullable |
| disability | text | nullable |
| postal_address | text | nullable |
| phone | text | nullable |
| cadence_preference | text | nullable (déf. `normal`) |
| has_children | boolean | nullable (déf. false) |
| pilote_difficult_period_until | date | nullable |
| pilote_last_achievement_at | date | nullable |
| notif_push_enabled | boolean | nullable (déf. true) |
| notif_email_enabled | boolean | nullable (déf. true) |
| notif_quiet_hours_start | integer | nullable (déf. 21) |
| notif_quiet_hours_end | integer | nullable (déf. 8) |
| notif_max_per_day | integer | nullable (déf. 2) |
| trial_started_at | timestamptz | nullable (déf. now) |
| subscription_status | text | nullable (déf. `trial`) |
| subscription_paused_at | timestamptz | nullable |
| silent_since | timestamptz | nullable |
| last_active_at | timestamptz | nullable (déf. now) |
| cancelled_at | timestamptz | nullable |
| deletion_scheduled_at | timestamptz | nullable |
| physical_contact_with | text[] | nullable |
| questionnaire_input_mode | text | nullable (déf. `written`) |
| social_energy | text | nullable |
| conflict_resolution | text | nullable |
| decision_making | text | nullable |
| emotional_expression | text | nullable |
| core_values | text | nullable |
| recognition_preference | text | nullable |
| boundaries | text | nullable |
| growth_mindset | text | nullable |
| favorite_foods | text | nullable |
| gift_preference | text | nullable |
| conversation_topics | text | nullable |
| things_to_avoid | text | nullable |
| best_contact_method | text | nullable |
| important_dates | text | nullable |
| clothing_size | text | nullable |
| shoe_size | text | nullable |
| ring_size | text | nullable |
| pants_size | text | nullable |
| pets | text | nullable |
| hobbies | text | nullable |
| attention_answers | jsonb | nullable |
| attention_reception | jsonb | nullable |
| attention_expression | jsonb | nullable |
| attention_computed_at | timestamptz | nullable |
| attention_breath_text | text | nullable |
| temperament_answers | jsonb | nullable |
| temperament_axes | jsonb | nullable |
| temperament_modes | jsonb | nullable |
| temperament_computed_at | timestamptz | nullable |
| lifestyle_answers | jsonb | nullable |
| lifestyle_axes | jsonb | nullable |
| relational_filters | jsonb | nullable |
| lifestyle_computed_at | timestamptz | nullable |
| singularity_answers | jsonb | nullable |
| practical_info | jsonb | nullable |
| practical_computed_at | timestamptz | nullable |
| profile_synthesis | jsonb | nullable |
| synthesis_computed_at | timestamptz | nullable |
| discovery_answers | jsonb | nullable |
| discovery_fatigue_score | integer | nullable (déf. 0) |
| grammatical_gender | text | nullable |
| style_gender_orientation | text[] | nullable |
| lifetime_trial | boolean | NOT NULL (déf. false) |
| date_de_naissance | date | nullable |
| is_findable | boolean | NOT NULL (déf. true) |
| handle | text | nullable |
| avatar_path | text | nullable |
| onboarding_completed | boolean | NOT NULL (déf. false) |

### `profile_analysis` ✅
- **Rôle** : le résultat de l'analyse produite par Candice — pour le pilote lui-même (`contact_id` vide) ou pour un proche (`contact_id` renseigné). Contient le texte de synthèse, les cartes/chips, les sections, les « must-have », les « deal-breakers », l'ADN d'attention, le radar de style, etc. C'est la fiche affichée à l'écran.
- **Volume** : 2 lignes
- **Accès (RLS)** : le pilote voit/modifie ses propres analyses. **En plus**, un proche ayant un consentement actif peut lire : (a) l'analyse d'un contact le concernant (consentement `contact_analysis` actif), ou (b) l'analyse « profil de soi » du pilote si un partage `profile_view` actif existe et que la portée n'est pas « blind ».
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| summary | text | nullable |
| summary_chips | jsonb | nullable |
| sections | jsonb | nullable |
| dimension_scores | jsonb | nullable |
| must_haves | jsonb | nullable |
| deal_breakers | jsonb | nullable |
| attention_dna | jsonb | nullable |
| constraints | jsonb | nullable |
| entities | jsonb | nullable |
| gender | text | nullable |
| confidence | double precision | nullable |
| source | text | nullable |
| generated_at | timestamptz | nullable |
| engine_version | text | nullable (déf. `2.0`) |
| created_at | timestamptz | nullable |
| updated_at | timestamptz | nullable |
| summary_third_person | text | nullable |
| insights | jsonb | nullable |
| modes | jsonb | nullable |
| style_radar | jsonb | nullable |
| summary_long | text | nullable |
| podium_intro | text | nullable |
| understood_cards | jsonb | nullable |
| works_phrases | jsonb | nullable |
| territory | jsonb | nullable |
| universe | jsonb | nullable |

### `profile_completion` 🟡
- **Rôle** : suivi du remplissage du profil, question par question (est-ce rempli, quand demandé, quand répondu, combien de fois sauté). Sert à savoir quoi proposer ensuite au pilote. Vide aujourd'hui.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres lignes de complétion (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| question_key | text | NOT NULL |
| is_filled | boolean | nullable (déf. false) |
| answer_data | jsonb | nullable |
| last_asked_at | timestamptz | nullable |
| answered_at | timestamptz | nullable |
| skipped_count | integer | nullable (déf. 0) |
| created_at | timestamptz | nullable |
| status | text | NOT NULL (déf. `not_started`) |
| personalized_text | text | nullable |

### `profile_notes` ✅
- **Rôle** : notes libres, soit sur un contact (`contact_id` renseigné), soit personnelles. Champ texte simple.
- **Volume** : 1 ligne
- **Accès (RLS)** : chacun gère ses propres notes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| user_id | uuid | nullable |
| note | text | NOT NULL |
| created_at | timestamptz | nullable |

### `user_points` ✅
- **Rôle** : historique des points gagnés par l'utilisateur (gamification), une ligne par action et son nombre de points.
- **Volume** : 1 ligne
- **Accès (RLS)** : chacun ne voit que ses propres points (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| action_type | text | NOT NULL |
| points | integer | NOT NULL |
| created_at | timestamptz | nullable |

---

## Domaine 2 — Questionnaire, Discovery & confidences

### `discovery_questions` ✅
- **Rôle** : la **banque de questions** du parcours « Discovery » (questions posées au fil de l'eau pour enrichir le profil). Chaque ligne = une question : son texte, sa dimension, son type, ses options, ses conditions de déclenchement, sa priorité, ce qu'elle met à jour dans le profil, et si son texte est verrouillé (`locked_text`). C'est du contenu de référence, pas des données utilisateur.
- **Volume** : 70 lignes
- **Accès (RLS)** : **lecture publique** (tout utilisateur connecté peut lire les questions) ; l'écriture est réservée au service technique.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| question_key | text | NOT NULL |
| dimension | text | NOT NULL |
| subdimension | text | nullable |
| question_text | text | NOT NULL |
| question_type | text | NOT NULL |
| options | jsonb | nullable |
| trigger_key | text | nullable |
| target | text | NOT NULL (déf. `self`) |
| min_days_between | integer | nullable (déf. 30) |
| sort_order | integer | nullable (déf. 0) |
| statut | text | nullable (déf. `active`) |
| created_at | timestamptz | nullable |
| trigger_from_main_question | text | nullable |
| trigger_condition | text | nullable |
| priority | integer | nullable (déf. 50) |
| free_text_enabled | boolean | nullable (déf. false) |
| updates_dimensions | text[] | nullable |
| updates_must_have | boolean | nullable (déf. false) |
| updates_deal_breakers | boolean | nullable (déf. false) |
| updates_supplier_rules | boolean | nullable (déf. false) |
| updates_recommendation_logic | boolean | nullable (déf. false) |
| do_not_show_if | text | nullable |
| profile_output_impact | text | nullable |
| catalogue_matching_impact | text | nullable |
| benefit_label | text | nullable |
| duration_label | text | nullable |
| locked_text | boolean | NOT NULL (déf. false) |

### `discovery_sessions` ✅
- **Rôle** : une session Discovery en cours ou terminée pour un utilisateur (mode, questions en attente `pending_keys`, index courant, statut, dates). Créée à la première réponse.
- **Volume** : 57 lignes
- **Accès (RLS)** : chacun ne voit que ses propres sessions (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| mode | text | NOT NULL |
| pending_keys | text[] | nullable (déf. vide) |
| current_index | integer | nullable (déf. 0) |
| status | text | nullable (déf. `active`) |
| started_at | timestamptz | nullable |
| last_activity_at | timestamptz | nullable |

### `questionnaire_responses` 🟡
- **Rôle** : réponses au questionnaire pour un contact (love language, style de communication, tailles, régime, centres d'intérêt…). Ancien format de questionnaire proche ; `data_source` indique l'origine (saisie pilote, etc.). Vide aujourd'hui mais largement référencée dans le code.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres réponses (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| love_language | text | nullable |
| communication_style | text | nullable |
| stress_response | text | nullable |
| social_energy | text | nullable |
| appreciation_style | text | nullable |
| conflict_resolution | text | nullable |
| decision_making | text | nullable |
| emotional_expression | text | nullable |
| core_values | text | nullable |
| recognition_preference | text | nullable |
| boundaries | text | nullable |
| growth_mindset | text | nullable |
| hobbies | text | nullable |
| favorite_foods | text | nullable |
| gift_preference | text | nullable |
| conversation_topics | text | nullable |
| things_to_avoid | text | nullable |
| best_contact_method | text | nullable |
| important_dates | text | nullable |
| additional_notes | text | nullable |
| created_at | timestamptz | nullable |
| updated_at | timestamptz | nullable |
| standing | text | nullable |
| gastronomy | text | nullable |
| accommodation | text | nullable |
| gift_style | text | nullable |
| clothing_size | text | nullable |
| shoe_size | text | nullable |
| ring_size | text | nullable |
| pants_size | text | nullable |
| food_allergies | text[] | nullable |
| diet | text[] | nullable |
| pets | text | nullable |
| physical_contact_with | text[] | nullable |
| input_mode | text | nullable (déf. `written`) |
| attention_reception | jsonb | nullable |
| incognito_signals | jsonb | nullable |
| interests | jsonb | nullable |
| data_source | text | NOT NULL (déf. `pilot_input`) |

### `confidences` ✅
- **Rôle** : les « confidences » que le pilote confie à Candice (texte brut ou vocal). Candice détecte le sujet, le ton émotionnel, et peut répondre. Alimente ensuite d'éventuelles mises à jour de profil.
- **Volume** : 2 lignes
- **Accès (RLS)** : chacun gère ses propres confidences (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| raw_text | text | NOT NULL |
| input_mode | text | NOT NULL (déf. `text`) |
| detected_subject | text | NOT NULL |
| emotional_tone | text | NOT NULL |
| candice_response | text | nullable |
| created_at | timestamptz | NOT NULL |

### `profile_updates_from_confidences` 🟡
- **Rôle** : propositions de mise à jour du profil déduites d'une confidence (quel champ, ancienne/nouvelle valeur, statut en attente/validé). File de relecture avant d'écrire dans le profil.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres propositions (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| confidence_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| field_name | text | NOT NULL |
| old_value | text | nullable |
| new_value | text | NOT NULL |
| status | text | NOT NULL (déf. `pending`) |
| created_at | timestamptz | NOT NULL |
| reviewed_at | timestamptz | nullable |

### `shared_profile_responses` 🟡
- **Rôle** : réponses saisies via un lien de partage (`token`) — un proche remplit des infos qui remontent au pilote. Stockage brut en JSON (`response_data`).
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres lignes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| token | text | NOT NULL |
| user_id | uuid | NOT NULL |
| response_data | jsonb | NOT NULL |
| created_at | timestamptz | nullable |
| updated_at | timestamptz | nullable |

### `share_links` 🟡
- **Rôle** : liens de partage émis par un utilisateur (`sender_id`, `token`, expiration) pour collecter des réponses. Vide aujourd'hui.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne gère que les liens qu'il a émis (`sender_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| token | text | NOT NULL (déf. uuid) |
| sender_id | uuid | NOT NULL |
| sender_name | text | NOT NULL |
| created_at | timestamptz | nullable |
| expires_at | timestamptz | nullable |

---

## Domaine 3 — Contacts, proches & partage

### `contacts` ✅
- **Rôle** : la fiche de chaque proche géré par le pilote (nom, relation, coordonnées, photo, adresse, date de naissance, niveau de proximité, cadence, mode « mémoire », lien vers un compte proche `proche_user_id`…). Table pivot de toute l'app.
- **Volume** : 3 lignes
- **Accès (RLS)** : chacun ne voit et ne gère que ses propres contacts (`user_id`).
- **Note** : la colonne `gift_wishlist` (jsonb) est **DÉPRÉCIÉE** (fusionnée dans `carnet_envies_items` à la migration 67, conservée mais plus alimentée).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| name | text | NOT NULL |
| relationship | text | NOT NULL |
| email | text | nullable |
| phone | text | nullable |
| created_at | timestamptz | nullable |
| archived_at | timestamptz | nullable |
| photo_url | text | nullable |
| gift_wishlist | jsonb | nullable (déf. `[]`) — **DÉPRÉCIÉE** |
| last_reminder_sent_at | timestamptz | nullable |
| proximity_level | text | nullable (déf. `close`) |
| cadence_override | text | nullable |
| last_suggestion_at | timestamptz | nullable |
| archive_reason | text | nullable |
| is_memory_mode | boolean | nullable (déf. false) |
| memory_anniversary_opt_out | boolean | nullable (déf. false) |
| proche_user_id | uuid | nullable |
| relationship_register | text | nullable |
| gender | text | nullable |
| idempotency_key | text | nullable |
| date_de_naissance | date | nullable |
| postal_address | text | nullable |

### `contact_consents` 🟡
- **Rôle** : les consentements entre un pilote et un proche. Deux natures (`kind`) : `contact_analysis` (le proche accepte d'être analysé) et `profile_view` (un tiers demande à voir le profil « de soi » du pilote). Gère le statut (en attente / actif / rejeté), la portée (`scope`) et les dates.
- **Volume** : 0 ligne
- **Accès (RLS)** — plusieurs règles combinées :
  - le **pilote** gère tous les consentements où il est le pilote (`pilote_id`) ;
  - le **proche** peut lire les consentements qui le concernent (`proche_user_id`) ;
  - le **proche** peut répondre (accepter/rejeter) à une demande d'analyse le concernant ;
  - un **demandeur** peut créer une demande de vue-profil (`profile_view`, en attente, sur lui-même) et annuler sa propre demande en attente.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| pilote_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| proche_user_id | uuid | nullable |
| status | text | NOT NULL (déf. `pending`) |
| scope | text[] | NOT NULL (déf. `{analysis}`) |
| requested_at | timestamptz | NOT NULL |
| responded_at | timestamptz | nullable |
| consented_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL |
| kind | text | NOT NULL (déf. `contact_analysis`) |
| requested_by | uuid | nullable |

### `profile_share_links` ✅
- **Rôle** : liens de partage du profil « de soi » du pilote (jeton haché `token_hash`, portée `scope`, expiration 30 j, qui a réclamé le lien, consentement associé, date de révocation). Mécanisme actuel de partage de fiche.
- **Volume** : 1 ligne
- **Accès (RLS)** : le propriétaire (`owner_id`) gère ses propres liens.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| owner_id | uuid | NOT NULL |
| token_hash | text | NOT NULL |
| scope | text[] | NOT NULL |
| created_at | timestamptz | NOT NULL |
| expires_at | timestamptz | NOT NULL (déf. now + 30 j) |
| claimed_by | uuid | nullable |
| claimed_at | timestamptz | nullable |
| consent_id | uuid | nullable |
| revoked_at | timestamptz | nullable |

### `invite_links` 🟡
- **Rôle** : liens d'invitation émis par un pilote pour inviter un proche (jeton, nom du pilote, contact lié, expiration 30 j, date d'utilisation).
- **Volume** : 0 ligne
- **Accès (RLS)** : le pilote (`pilote_id`) gère ses propres liens d'invitation.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| token | text | NOT NULL (déf. uuid) |
| pilote_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| pilote_name | text | nullable |
| expires_at | timestamptz | nullable (déf. now + 30 j) |
| used_at | timestamptz | nullable |
| created_at | timestamptz | nullable |

### `person_states` 🟡
- **Rôle** : l'état déclaré d'une personne à un instant (« pas le bon moment », etc.) — sujet soit le pilote lui-même (`subject_kind`), soit un contact. Sert au filtrage amont des recommandations (Espace Proche, moteur de reco).
- **Volume** : 0 ligne
- **Accès (RLS)** : le déclarant (`declared_by`) gère ses propres états ; **en plus**, un proche peut lire l'état « de soi » d'un pilote s'il a un partage `profile_view` actif avec ce pilote.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| subject_kind | text | NOT NULL |
| subject_user_id | uuid | nullable |
| contact_id | uuid | nullable |
| declared_by | uuid | NOT NULL |
| state | text | NOT NULL |
| note_free | text | nullable |
| event_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL |

### `cross_validations` ⚫
- **Rôle** : questions de « validation croisée » posées à un proche pour trancher un doute sur une reco (déclenchées ex. par un double refus). Rattachées à l'Espace Proche V2 (phases 7-10, non lancées).
- **Volume** : 0 ligne
- **Statut** : ⚫ — 0 ligne **et** aucune référence dans le code applicatif (`src/`) au moment du relevé ; la table existe en base mais n'est pas branchée à l'app (feature non lancée).
- **Accès (RLS)** : verrou activé **sans aucune policy** → aucun utilisateur connecté ne peut lire/écrire ; seul le service technique (`service_role`) y accède.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| reco_id | uuid | NOT NULL |
| trigger | text | NOT NULL (déf. `double_gout_refus`) |
| question_text | text | NOT NULL |
| proche_user_id | uuid | NOT NULL |
| proche_answer | text | nullable |
| status | text | NOT NULL (déf. `open`) |
| notified_pilot | boolean | NOT NULL (déf. false) |
| created_at | timestamptz | NOT NULL |
| answered_at | timestamptz | nullable |

### `_deprecated_profile_share_requests` ⚫
- **Rôle** : ancienne mécanique de demandes de partage de profil, **remplacée** par `contact_consents` (`kind = 'profile_view'`) + `profile_share_links`.
- **Volume** : 0 ligne
- **Statut** : ⚫ **MORTE** — préfixe `_deprecated_`, 0 ligne, aucune référence dans le code. Conservée en base par prudence (non droppée).
- **Accès (RLS)** : le propriétaire du profil et le demandeur gèrent leurs lignes respectives (règles héritées, sans effet réel puisque la table n'est plus alimentée).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| requester_id | uuid | nullable |
| profile_owner_id | uuid | nullable |
| status | text | nullable (déf. `pending`) |
| created_at | timestamptz | nullable |
| responded_at | timestamptz | nullable |
| confirmed_with_reauth | boolean | nullable (déf. false) |
| reauth_at | timestamptz | nullable |

---

## Domaine 4 — Recommandations, idées & attentions

### `contact_recommendations` 🟡
- **Rôle** : bloc de recommandations généré pour un contact — les idées (`ideas` en JSON), l'angle mort (`blind_spot`), la cadence suggérée (`kadence`), la date de génération. Une ligne = un jeu de recos pour un proche.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres recommandations (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| ideas | jsonb | NOT NULL (déf. `[]`) |
| blind_spot | jsonb | nullable |
| kadence | text | nullable |
| generated_at | timestamptz | NOT NULL |

### `contact_reco_items` 🟡
- **Rôle** : recommandations à la pièce (une idée = une ligne) pour un contact : type, titre, marque, prix indicatif, photo, traçabilité de la source (`source_trace`), certitude, justification (`why_json`), et **réservation invisible** (statut, qui a réservé, expiration). Version détaillée / moteur de reco.
- **Volume** : 0 ligne
- **Accès (RLS)** : le pilote (`pilot_id`) gère ses propres items.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| reco_type | text | NOT NULL |
| title | text | NOT NULL |
| brand | text | nullable |
| price_indicative | text | nullable |
| photo_url | text | nullable |
| source_trace | text | NOT NULL |
| certainty_pct | integer | nullable |
| why_json | jsonb | nullable |
| need_tag | text | nullable |
| origin_ref | uuid | nullable |
| status | text | NOT NULL (déf. `active`) |
| reservation_status | text | NOT NULL (déf. `available`) |
| reserved_by | uuid | nullable |
| reserved_at | timestamptz | nullable |
| reservation_expires_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

### `reco_refusals` 🟡
- **Rôle** : trace des refus de recommandations par le pilote (raison, sous-raison, note libre, si réactivable et quand `reappear_at`, si mis de côté pour une occasion). Sert au moteur à ne pas re-proposer.
- **Volume** : 0 ligne
- **Accès (RLS)** : le pilote (`pilot_id`) gère ses propres refus.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| reco_id | uuid | NOT NULL |
| reason | text | NOT NULL |
| sub_reason | text | nullable |
| note_free | text | nullable |
| reactivable | boolean | NOT NULL (déf. true) |
| reappear_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL |
| reserved_for_occasion | boolean | NOT NULL (déf. false) |

### `attention_log` 🟡
- **Rôle** : journal des « attentions » proposées à un contact (titre, type, statut proposé/agi, feedback, niveau d'amour `love_level`). Historise ce que Candice a suggéré et comment le pilote a réagi.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres lignes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| attention_title | text | NOT NULL |
| attention_type | text | nullable |
| status | text | NOT NULL (déf. `proposed`) |
| proposed_at | timestamptz | NOT NULL |
| actioned_at | timestamptz | nullable |
| feedback | text | nullable |
| feedback_note | text | nullable |
| feedback_at | timestamptz | nullable |
| love_level | text | nullable |

### `proactive_suggestions` 🟡
- **Rôle** : suggestions proactives générées par Candice pour un contact (titre, description, catégorie, raisonnement, prix estimé, indice partenaire, priorité, statut, expiration). Alimentées par les signaux contextuels.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres suggestions (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| signal_id | uuid | nullable |
| title | text | NOT NULL |
| description | text | NOT NULL |
| category | text | NOT NULL |
| reasoning | text | nullable |
| estimated_price | text | nullable |
| partner_hint | text | nullable |
| status | text | NOT NULL (déf. `pending`) |
| refusal_reason | text | nullable |
| priority | text | NOT NULL (déf. `normal`) |
| generated_at | timestamptz | nullable |
| responded_at | timestamptz | nullable |
| expires_at | timestamptz | nullable |

### `suggestions` 🟡
- **Rôle** : suggestions pour un contact, contenu libre en JSON (`content`). Format ancien/générique (le contenu n'est pas structuré en colonnes). Vide aujourd'hui mais référencée dans le code.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres suggestions (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| content | jsonb | NOT NULL |
| generated_at | timestamptz | nullable |

### `budget_feedback` ⚫
- **Rôle** : réaction du pilote au budget d'une suggestion (trop cher / OK…). Feedback d'ajustement du budget.
- **Volume** : 0 ligne
- **Statut** : ⚫ — 0 ligne **et** aucune référence dans le code applicatif (`src/`) ; table présente en base mais non branchée à l'app au moment du relevé.
- **Accès (RLS)** : chacun ne gère que ses propres lignes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| suggestion_id | uuid | nullable |
| reaction | text | NOT NULL |
| created_at | timestamptz | NOT NULL |

### `signals` ✅
- **Rôle** : signaux déduits sur un contact (type, valeur, polarité positif/négatif, confiance, fraîcheur, mémoire source, compteur d'utilisation en reco, signaux en conflit). Brique du moteur de reco (traçabilité `deduced`).
- **Volume** : 2 lignes
- **Accès (RLS)** : le pilote (`pilot_id`) gère ses propres signaux.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| signal_type | text | NOT NULL |
| signal_value | text | nullable |
| polarity | text | nullable |
| confidence | integer | nullable (déf. 60) |
| source_memory_id | uuid | nullable |
| freshness | timestamptz | nullable |
| used_in_recommendations_count | integer | nullable (déf. 0) |
| last_used_at | timestamptz | nullable |
| last_confirmed_at | timestamptz | nullable |
| conflicting_signals | uuid[] | nullable |
| status | text | nullable (déf. `actif`) |
| created_at | timestamptz | nullable |
| updated_at | timestamptz | nullable |

### `memories` ✅
- **Rôle** : les « mémoires » qu'un pilote enregistre sur un proche (entrée brute, résumé assaini, sentiment, catégorie, intensité, fiabilité de la source, score de confiance, dates de revalidation, niveau de visibilité, impact sur les recos, liens vers événements/wishlist/attentions). Base de connaissance riche par contact.
- **Volume** : 1 ligne
- **Accès (RLS)** : le pilote (`pilot_id`) gère ses propres mémoires.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| raw_input | text | NOT NULL |
| sanitized_summary | text | NOT NULL |
| sentiment | text | nullable |
| category | text | nullable |
| emotional_intensity | text | nullable |
| sensitivity_level | integer | nullable (déf. 1) |
| status | text | nullable (déf. `actif`) |
| source | text | nullable (déf. `w1`) |
| created_at | timestamptz | nullable |
| memory_type | text | nullable (déf. `événement_de_vie`) |
| subcategory | text | nullable |
| source_reliability | text | nullable (déf. `moyenne`) |
| confidence_score | integer | nullable (déf. 60) |
| valid_until | timestamptz | nullable |
| revalidation_date | timestamptz | nullable |
| visibility_level | text | nullable (déf. `privé`) |
| recommendation_impact | jsonb | nullable |
| related_events | uuid[] | nullable |
| related_wishlist_items | uuid[] | nullable |
| related_attention_history | uuid[] | nullable |
| admin_notes | text | nullable |
| updated_at | timestamptz | nullable |
| raw_text | text | nullable |
| reformulated_text | text | nullable |
| type | text | nullable |
| tonality | text | nullable |
| probable_needs | jsonb | nullable |
| confidence | numeric | nullable |
| revalidate_at | timestamptz | nullable |

### `context_journal` 🟡
- **Rôle** : journal de questions/réponses de contexte sur un contact (Candice pose une question, le pilote répond). Historise le dialogue de contextualisation.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres lignes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| question | text | NOT NULL |
| answer | text | nullable |
| answered_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL |
| type | text | nullable |

### `contextual_signals` 🟡
- **Rôle** : signaux contextuels datés (type, données JSON, date de déclenchement, priorité, statut, consommation, expiration). Alimente les suggestions proactives (ex. anniversaire, saison…). Détectés par les crons.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres signaux (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| signal_type | text | NOT NULL |
| signal_data | jsonb | NOT NULL (déf. `{}`) |
| trigger_date | date | NOT NULL |
| priority | text | NOT NULL (déf. `normal`) |
| status | text | NOT NULL (déf. `active`) |
| created_at | timestamptz | nullable |
| consumed_at | timestamptz | nullable |
| expires_at | timestamptz | nullable |

---

## Domaine 5 — Cadence (rythme des attentions)

### `cadence_log` ✅
- **Rôle** : journal des cadences calculées par contact (cadence retenue, raison, facteurs pris en compte). Historise les décisions de rythme.
- **Volume** : 31 lignes
- **Accès (RLS)** : chacun ne voit que ses propres lignes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| decision_at | timestamptz | nullable |
| computed_cadence | text | NOT NULL |
| reason | text | nullable |
| factors | jsonb | nullable (déf. `{}`) |

### `cadence_feedback` 🟡
- **Rôle** : bilan de cadence sur une fenêtre de temps (nb de suggestions, validées, refusées, reportées, ignorées, taux de validation, ajustement recommandé). Sert à ajuster automatiquement le rythme.
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres lignes (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| window_start | date | NOT NULL |
| window_end | date | NOT NULL |
| suggestions_count | integer | nullable (déf. 0) |
| validated_count | integer | nullable (déf. 0) |
| refused_count | integer | nullable (déf. 0) |
| snoozed_count | integer | nullable (déf. 0) |
| ignored_count | integer | nullable (déf. 0) |
| validation_rate | numeric | nullable |
| recommended_adjustment | text | nullable |
| created_at | timestamptz | nullable |

---

## Domaine 6 — Wishlist perso & Carnet d'envies

### `my_wishlist_items` 🟡
- **Rôle** : la **wishlist personnelle** du pilote (ce qu'il aimerait recevoir) — STRICTEMENT PRIVÉE. Photo, marque, lien, taille, prix indicatif (texte), occasion, niveau d'envie (`envy_level`), destinataires ciblés (`target_recipients`), traçabilité `declared`, et **réservation invisible** (statut, qui a réservé, expiration).
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit et ne modifie que sa propre wishlist (`user_id`) — jamais de vue tierce.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| title | text | NOT NULL |
| url | text | nullable |
| note | text | nullable |
| created_at | timestamptz | NOT NULL |
| photo_url | text | nullable |
| brand | text | nullable |
| web_link | text | nullable |
| size_ref | text | nullable |
| price_indicative | text | nullable |
| occasion | text | nullable |
| note_text | text | nullable |
| envy_level | text | nullable |
| target_recipients | uuid[] | NOT NULL (déf. vide) |
| source_trace | text | NOT NULL (déf. `declared`) |
| reservation_status | text | NOT NULL (déf. `available`) |
| reserved_by | uuid | nullable |
| reserved_at | timestamptz | nullable |
| reservation_expires_at | timestamptz | nullable |

### `carnet_envies_items` 🟡
- **Rôle** : le **carnet d'envies** repérées pour un proche (vit sur la fiche du proche) — description, photo, lien, marque, indice de lieu, occasion(s), phrase entendue (`heard_quote`), source (`heard`/`seen`/`link`), traçabilité `spotted`, niveau de confiance, statut, et modalités de paiement si sourcing marchand.
- **Volume** : 0 ligne
- **Accès (RLS)** : le pilote (`pilot_id`) gère son propre carnet.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| contact_id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| description | text | NOT NULL |
| photo_url | text | nullable |
| source_link | text | nullable |
| brand_name | text | nullable |
| brand_option | text | nullable |
| confidence_level | text | nullable (déf. `moyenne`) |
| location_hint | text | nullable |
| occasion_links | text[] | nullable |
| statut | text | nullable (déf. `actif`) |
| created_at | timestamptz | nullable |
| requires_payment_sourcing | boolean | NOT NULL (déf. false) |
| payment_modalities | jsonb | nullable |
| size_ref | text | nullable |
| price_indicative | text | nullable |
| occasion | text | nullable |
| note_text | text | nullable |
| source | text | nullable |
| heard_quote | text | nullable |
| source_trace | text | NOT NULL (déf. `spotted`) |

---

## Domaine 7 — Épargne & financement

> **Note transversale** : les trois tables ci-dessous ont un verrou RLS propriétaire cohérent (feature « épargne cadeau » prévue) mais **ne sont référencées par aucun code applicatif** (`src/`) au moment du relevé — uniquement dans des scripts de travail à la racine. Elles sont donc marquées ⚫ (présentes mais non branchées à l'app aujourd'hui). À confirmer par Estelle : feature en attente ou abandonnée.

### `savings_goal` ⚫
- **Rôle** : objectif d'épargne pour un cadeau (libellé, montant cible, montant mensuel, date cible, statut, source manuel/auto).
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne gère que ses propres objectifs (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| contact_id | uuid | nullable |
| item_label | text | NOT NULL |
| target_amount | numeric | NOT NULL |
| monthly_amount | numeric | NOT NULL |
| target_date | date | nullable |
| started_at | timestamptz | NOT NULL |
| status | text | NOT NULL (déf. `active`) |
| source | text | NOT NULL (déf. `manual`) |
| created_at | timestamptz | NOT NULL |

### `savings_contribution` ⚫
- **Rôle** : versement rattaché à un objectif d'épargne (`goal_id`, montant, date).
- **Volume** : 0 ligne
- **Accès (RLS)** : on ne gère un versement que si l'objectif parent appartient à l'utilisateur connecté (contrôle via `savings_goal`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| goal_id | uuid | NOT NULL |
| amount | numeric | NOT NULL |
| logged_at | timestamptz | NOT NULL |

### `finance_plans` ⚫
- **Rôle** : plans de financement/paiement en plusieurs fois par référence catalogue (`catalog_ref`, nombre d'échéances). Table de configuration.
- **Volume** : 1 ligne
- **Statut** : ⚫ — non référencée dans le code applicatif (`src/`) au moment du relevé (uniquement scripts de travail). Contient 1 ligne de configuration.
- **Accès (RLS)** : **lecture publique** (tout utilisateur connecté peut lire) ; écriture réservée au service technique.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| catalog_ref | text | NOT NULL |
| n_installments | integer | NOT NULL |
| configured_by | uuid | nullable |
| created_at | timestamptz | NOT NULL |

---

## Domaine 8 — Notifications & push

### `notification_log` 🟡
- **Rôle** : journal des notifications envoyées (canal push/email, type, suggestion/signal lié, titre, corps, statut, dates d'envoi/ouverture/clic, erreur éventuelle).
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne voit que ses propres notifications (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| channel | text | NOT NULL |
| notification_type | text | NOT NULL |
| related_suggestion_id | uuid | nullable |
| related_signal_id | uuid | nullable |
| title | text | nullable |
| body | text | nullable |
| status | text | NOT NULL (déf. `sent`) |
| sent_at | timestamptz | nullable |
| opened_at | timestamptz | nullable |
| clicked_at | timestamptz | nullable |
| error_message | text | nullable |

### `push_subscriptions` 🟡
- **Rôle** : abonnements aux notifications push du navigateur (endpoint, clés de chiffrement `p256dh_key`/`auth_key`, user-agent, dernière utilisation).
- **Volume** : 0 ligne
- **Accès (RLS)** : chacun ne gère que ses propres abonnements push (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| endpoint | text | NOT NULL |
| p256dh_key | text | NOT NULL |
| auth_key | text | NOT NULL |
| user_agent | text | nullable |
| created_at | timestamptz | nullable |
| last_used_at | timestamptz | nullable |

---

## Domaine 9 — Crons & technique

### `cron_runs` 🟡
- **Rôle** : journal des exécutions de tâches planifiées (nom du job, début/fin, statut, nb de signaux détectés, nb de suggestions générées, erreur, métadonnées). Suivi technique des crons.
- **Volume** : 0 ligne
- **Accès (RLS)** : verrou activé **sans policy** → aucun utilisateur connecté n'y accède ; seul le service technique (`service_role`, qui fait tourner les crons) écrit/lit.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| job_name | text | NOT NULL |
| started_at | timestamptz | nullable |
| finished_at | timestamptz | nullable |
| status | text | nullable (déf. `running`) |
| signals_detected | integer | nullable (déf. 0) |
| suggestions_generated | integer | nullable (déf. 0) |
| error_message | text | nullable |
| metadata | jsonb | nullable (déf. `{}`) |

### `processing_log` 🟡
- **Rôle** : journal technique du traitement des mémoires (identifiant de corrélation, pilote, mémoire, étape, statut, durée en ms, erreur, métadonnées). Traçabilité de la chaîne de traitement.
- **Volume** : 0 ligne
- **Accès (RLS)** : verrou activé **sans policy** → aucun utilisateur connecté n'y accède ; seul le service technique (`service_role`) écrit/lit.
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| correlation_id | uuid | NOT NULL |
| pilot_id | uuid | NOT NULL |
| memory_id | uuid | nullable |
| step | text | NOT NULL |
| status | text | NOT NULL |
| duration_ms | integer | nullable |
| error_message | text | nullable |
| metadata | jsonb | nullable |
| created_at | timestamptz | nullable |

---

## Domaine 10 — Abonnement & cycle de vie du compte

### `account_lifecycle_events` ✅
- **Rôle** : journal des événements du cycle de vie du compte (essai démarré, abonnement activé/pausé/annulé, suppression planifiée…). Chaque ligne = un changement d'état (statut précédent → nouveau, déclencheur, métadonnées). L'état courant de l'abonnement vit, lui, dans `my_profile`.
- **Volume** : 4 lignes
- **Accès (RLS)** : chacun ne voit que les événements de son propre compte (`user_id`).
- **Colonnes** :

| Colonne | Type | Null |
|---|---|---|
| id | uuid | NOT NULL |
| user_id | uuid | NOT NULL |
| event_type | text | NOT NULL |
| previous_status | text | nullable |
| new_status | text | nullable |
| triggered_by | text | nullable |
| metadata | jsonb | nullable (déf. `{}`) |
| created_at | timestamptz | nullable |

---

## Tableau récapitulatif

| Table | Domaine | Volume | RLS activée | Statut |
|---|---|---|---|---|
| my_profile | Profil pilote | 2 | oui | ✅ |
| profile_analysis | Profil pilote | 2 | oui | ✅ |
| profile_completion | Profil pilote | 0 | oui | 🟡 |
| profile_notes | Profil pilote | 1 | oui | ✅ |
| user_points | Profil pilote | 1 | oui | ✅ |
| discovery_questions | Questionnaire/Discovery | 70 | oui | ✅ |
| discovery_sessions | Questionnaire/Discovery | 57 | oui | ✅ |
| questionnaire_responses | Questionnaire/Discovery | 0 | oui | 🟡 |
| confidences | Questionnaire/Discovery | 2 | oui | ✅ |
| profile_updates_from_confidences | Questionnaire/Discovery | 0 | oui | 🟡 |
| shared_profile_responses | Questionnaire/Discovery | 0 | oui | 🟡 |
| share_links | Questionnaire/Discovery | 0 | oui | 🟡 |
| contacts | Contacts/Partage | 3 | oui | ✅ |
| contact_consents | Contacts/Partage | 0 | oui | 🟡 |
| profile_share_links | Contacts/Partage | 1 | oui | ✅ |
| invite_links | Contacts/Partage | 0 | oui | 🟡 |
| person_states | Contacts/Partage | 0 | oui | 🟡 |
| cross_validations | Contacts/Partage | 0 | oui (sans policy) | ⚫ |
| _deprecated_profile_share_requests | Contacts/Partage | 0 | oui | ⚫ |
| contact_recommendations | Recommandations | 0 | oui | 🟡 |
| contact_reco_items | Recommandations | 0 | oui | 🟡 |
| reco_refusals | Recommandations | 0 | oui | 🟡 |
| attention_log | Recommandations | 0 | oui | 🟡 |
| proactive_suggestions | Recommandations | 0 | oui | 🟡 |
| suggestions | Recommandations | 0 | oui | 🟡 |
| budget_feedback | Recommandations | 0 | oui | ⚫ |
| signals | Recommandations | 2 | oui | ✅ |
| memories | Recommandations | 1 | oui | ✅ |
| context_journal | Recommandations | 0 | oui | 🟡 |
| contextual_signals | Recommandations | 0 | oui | 🟡 |
| cadence_log | Cadence | 31 | oui | ✅ |
| cadence_feedback | Cadence | 0 | oui | 🟡 |
| my_wishlist_items | Wishlist/Carnet | 0 | oui | 🟡 |
| carnet_envies_items | Wishlist/Carnet | 0 | oui | 🟡 |
| savings_goal | Épargne | 0 | oui | ⚫ |
| savings_contribution | Épargne | 0 | oui | ⚫ |
| finance_plans | Épargne | 1 | oui | ⚫ |
| notification_log | Notifications | 0 | oui | 🟡 |
| push_subscriptions | Notifications | 0 | oui | 🟡 |
| cron_runs | Crons/Technique | 0 | oui (sans policy) | 🟡 |
| processing_log | Crons/Technique | 0 | oui (sans policy) | 🟡 |
| account_lifecycle_events | Abonnement | 4 | oui | ✅ |

**Bilan** :
- **42 tables**, RLS activée sur les 42.
- **3 tables « sans aucune policy »** = accès service technique (`service_role`) uniquement : `cron_runs`, `processing_log`, `cross_validations`. (Les 39 autres ont des policies « propriétaire » et/ou de partage.)
- **13 tables ✅** avec données réelles : `my_profile`, `profile_analysis`, `profile_notes`, `user_points`, `discovery_questions`, `discovery_sessions`, `confidences`, `contacts`, `profile_share_links`, `signals`, `memories`, `cadence_log`, `account_lifecycle_events`.
- **6 tables ⚫** mortes ou non branchées à l'app : `_deprecated_profile_share_requests`, `cross_validations`, `budget_feedback`, `savings_goal`, `savings_contribution`, `finance_plans`.
- **Le reste = 🟡** : vides aujourd'hui (0 ligne) mais branchées au code.

---

## ⚠ RAPPORT D'HYPOTHÈSES

**A. ZONES DE FLOU**
- **Distinction 🟡 vs ⚫ pour les tables à 0 ligne** : l'instruction dit « morte = 0 ligne ET non référencée dans le code ». J'ai mesuré les références dans `src/` avec `ripgrep`. Hypothèse prise : une table à 0 ligne mais référencée dans `src/` = 🟡 (vide mais branchée) ; à 0 ligne ET 0 référence applicative = ⚫. Alternative possible : certaines ⚫ (épargne, budget_feedback) sont peut-être des features en attente volontaire, pas des tables mortes.
- **`finance_plans`** : 1 ligne (pas 0) mais aucune référence dans `src/`. Je l'ai classée ⚫ (non branchée) par cohérence avec les tables épargne, malgré son unique ligne de config. Alternative : la laisser 🟡.
- **Comptage de références** : le nombre de fichiers citant un nom de table inclut de possibles faux positifs pour les mots génériques (`suggestions`, `signals`, `contacts`). Je ne m'en suis servie que pour trancher 🟡/⚫, pas pour décrire l'usage.

**B. DÉCISIONS PRISES SEUL**
- Regroupement des tables par domaine (10 domaines) : inventé pour la lisibilité, non dicté par la base.
- Rôles fonctionnels de chaque table : déduits du nom + colonnes + contexte CLAUDE.md/MEMORY ; aucune table ne porte de commentaire SQL.
- Traduction des règles RLS complexes (`contact_consents`, `profile_analysis`, `person_states`) résumée en langage simple — la formulation exacte des conditions SQL reste dans la base.

**C. LAISSÉ EN SUSPENS**
- Je n'ai pas inspecté les fonctions RPC / SECURITY DEFINER (ex. `reserve_wishlist_item`) ni les triggers : hors périmètre de la demande (tables uniquement).
- Je n'ai pas listé les clés étrangères / index : non demandés.
- Les scripts scratch à la racine (`s5.cjs`, `scratch_pg3.cjs`, `scratch_pg4.cjs`) référençant les tables épargne/finance sont pré-existants, non touchés.

**D. À VÉRIFIER PAR ESTELLE**
- Les 6 tables marquées ⚫ : confirmer lesquelles sont vraiment mortes (`_deprecated_profile_share_requests` l'est sans ambiguïté) vs. features en attente (`savings_*`, `finance_plans`, `budget_feedback`, `cross_validations` = Espace Proche P7-10).
- `cross_validations`, `cron_runs`, `processing_log` ont RLS activée **sans aucune policy** : voulu (accès service technique seul) — à confirmer.
- Colonne `contacts.gift_wishlist` marquée dépréciée : conforme à CLAUDE.md (migration 67).

**E. MIGRATIONS / BUILD**
- Aucune migration créée, aucune modification de base (lecture seule : uniquement `SELECT` / `information_schema` / `pg_catalog`).
- `npm run build` : non lancé (tâche documentaire, aucun code applicatif modifié).
- Fichier écrit : `docs/cartographie/14-base-de-donnees.md`.


---

<!-- ============ 15-api ============ -->

# 15 — API (routes serveur)

> Cartographie de TOUTES les routes API de l'application (dossier `src/app/api`, fichiers `route.ts`).
> **Total : 87 routes** (`find src/app/api -name route.ts | wc -l` → 87).
> Pour chaque route : méthode + chemin · qui peut l'appeler · ce qu'elle fait en clair · le CLIENT Supabase utilisé · validation des entrées.

## Lexique « client Supabase » (point de sécurité central)

- **Client UTILISATEUR** (`createClient`) : agit au nom de la personne connectée. Il est **soumis aux règles d'accès de la base (RLS)** — la base refuse d'elle-même de lire/écrire ce qui n'appartient pas à l'utilisateur. C'est la protection la plus sûre.
- **Client ADMIN** (`createAdminClient`) : clé de service qui **CONTOURNE toutes les règles d'accès (RLS)**. Tout ce qu'il touche n'est protégé QUE par le code écrit à la main (filtres `user_id`, vérifications de propriété). Si le code oublie un filtre, il n'y a plus de garde-fou. À surveiller.

Beaucoup de routes sont **MIXTES** : client UTILISATEUR pour vérifier l'identité (login), puis client ADMIN pour l'opération réelle. Le détail est précisé route par route.

## Qui peut appeler ?

- **Publique** : aucune authentification requise.
- **Connecté** : exige une session utilisateur valide (sinon 401).
- **Cron (secret)** : exige l'en-tête `Authorization: Bearer ${CRON_SECRET}` (sinon 401). Appelée par une tâche planifiée, pas par un humain.

---

## Récapitulatif par domaine

| Domaine | Nombre de routes |
|---------|------------------|
| Auth & accès bêta | 2 |
| Compte & abonnement | 6 |
| Identifiant (@handle) | 2 |
| Profil pilote | 10 |
| Questionnaire & découverte | 5 |
| Confidences & mémoires | 7 |
| Contacts | 6 |
| Cadence & préférences | 4 |
| Notes IA & carnet (identification) | 2 |
| Recommandations & suggestions | 9 |
| Lectures « respiration » (IA publiques) | 4 |
| Consentement & partage de profil | 9 |
| Invitations | 3 |
| Wishlist & carnet d'envies | 3 |
| Notifications push | 2 |
| Emails | 6 |
| Cron (tâches planifiées) | 5 |
| **TOTAL** | **87** |

---

## 1 — Auth & accès bêta (2)

### GET `/api/auth/callback`
- **Appelable par** : Publique (c'est l'étape qui établit la session).
- **Rôle** : callback OAuth / lien magique Supabase. Lit `code` et `next` (défaut `/dashboard`), échange le code contre une session (`exchangeCodeForSession`). Redirige vers `next` si succès, sinon `/login?error=auth_callback_failed`.
- **Client** : UTILISATEUR seul.
- **Validation** : vérifie présence du `code` et résultat de l'échange. Le paramètre `next` est réinjecté dans la redirection sans liste blanche (préfixé par l'`origin` du site).

### POST `/api/beta-access`
- **Appelable par** : Publique.
- **Rôle** : portail mot de passe bêta. Compare `password` à la variable d'env `BETA_PASSWORD` ; si correct, pose un cookie `beta_access=1` (30 jours).
- **Client** : AUCUN (ne touche pas Supabase).
- **Validation** : parsing JSON + égalité du mot de passe. **Point d'attention** : un mot de passe de repli est codé en dur dans le fichier si la variable d'env est absente.

---

## 2 — Compte & abonnement (6)

### POST `/api/account/cancel-deletion`
- **Appelable par** : Connecté.
- **Rôle** : annule une suppression de compte programmée. Repasse `my_profile` en `active` (efface `cancelled_at`, `deletion_scheduled_at`) si le compte est `cancelled` avec une date programmée. Journalise `deletion_cancelled`.
- **Client** : UTILISATEUR (lecture/écriture `my_profile`, RLS) ; ADMIN uniquement pour l'insert dans `account_lifecycle_events`.
- **Validation** : auth (401) ; état métier vérifié (doit être `cancelled` + date). Pas de body.

### POST `/api/account/delete`
- **Appelable par** : Connecté.
- **Rôle** : programme la suppression du compte à J+30. Passe le statut à `cancelled`, journalise `deletion_requested`, envoie un email de confirmation (voir doc 12, email n°12).
- **Client** : UTILISATEUR (update `my_profile` + `signInWithPassword`) ; ADMIN pour l'insert `account_lifecycle_events`.
- **Validation** : auth (401) ; `password` présent (400) ; **re-vérification du mot de passe** via `signInWithPassword` (403 si faux). Validation forte.

### POST `/api/account/export`
- **Appelable par** : Connecté.
- **Rôle** : export RGPD envoyé par email. Rassemble 8 tables filtrées sur `user_id` (`my_profile`, `contacts`+questionnaires, `suggestions`, `proactive_suggestions`, `confidences`, `profile_notes`, `notification_log`, `account_lifecycle_events`), JSON en pièce jointe.
- **Client** : UTILISATEUR seulement pour l'identité ; **toutes les lectures via ADMIN** (isolation reposant sur les filtres `.eq('user_id', uid)`, pas sur RLS).
- **Validation** : auth (401) ; présence de l'email (400).

### GET `/api/account/export-download`
- **Appelable par** : Connecté.
- **Rôle** : identique à l'export mais renvoie le JSON en téléchargement direct (pas d'email).
- **Client** : UTILISATEUR pour l'identité ; **toutes les lectures via ADMIN** (isolation par filtre applicatif).
- **Validation** : auth (401). Pas d'input.

### POST `/api/subscription/pause`
- **Appelable par** : Connecté.
- **Rôle** : met l'abonnement en pause (statut `paused`, `subscription_paused_at`) si le statut est `trial` ou `active`. Journalise `subscription_paused`.
- **Client** : UTILISATEUR (`my_profile`, RLS) ; ADMIN pour `account_lifecycle_events`.
- **Validation** : auth (401) ; état métier (trial/active) requis (400).

### POST `/api/subscription/resume`
- **Appelable par** : Connecté.
- **Rôle** : réactive un abonnement en pause. Recalcule si l'essai est encore valide (< 30 j → `trial`, sinon `active`). Journalise `subscription_resumed`.
- **Client** : UTILISATEUR (`my_profile`, RLS) ; ADMIN pour `account_lifecycle_events`.
- **Validation** : auth (401) ; statut doit être `paused` (400).

---

## 3 — Identifiant (@handle) (2)

### POST `/api/handle`
- **Appelable par** : Connecté.
- **Rôle** : enregistre/modifie le @identifiant de l'utilisateur. Normalise, valide le format, upsert dans `my_profile.handle`.
- **Client** : UTILISATEUR pour l'identité ; **ADMIN pour l'upsert `my_profile`** (le `user_id` est fixé en dur à l'appelant).
- **Validation** : auth (401) ; format du handle (400) ; unicité garantie par contrainte DB → 409 « déjà pris ».

### POST `/api/handle/check`
- **Appelable par** : Publique (utilisée AVANT inscription).
- **Rôle** : vérifie la disponibilité d'un @identifiant. Renvoie `{ available: bool }` sans révéler l'identité du détenteur.
- **Client** : **ADMIN** pour lire `my_profile` (nécessaire car aucune session).
- **Validation** : PAS d'auth (intentionnel) ; format du handle uniquement.

---

## 4 — Profil pilote (10)

### POST `/api/profil/submit`
- **Appelable par** : Connecté.
- **Rôle** : enregistre les réponses du questionnaire que le pilote saisit À PROPOS d'un contact. Force `data_source = "pilot_input"` (le client ne peut pas le modifier). Insert/update dans `questionnaire_responses` par `contact_id`.
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `contactId` présent (400). Propriété du contact déléguée au RLS (pas de re-vérification applicative).

### POST `/api/profile-notes`
- **Appelable par** : Connecté.
- **Rôle** : insère une note libre dans `profile_notes` (avec `contact_id` optionnel).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `note` non vide (400). `contact_id` non vérifié en propriété.

### GET / PATCH `/api/profile-updates/[id]`
- **Appelable par** : Connecté.
- **Rôle** : GET = lit une proposition de mise à jour (`profile_updates_from_confidences`). PATCH = applique (`apply`) ou rejette (`reject`) ; si `apply`, écrit le champ (whitelist stricte : `hobbies`, `favorite_foods`, `conversation_topics`, `things_to_avoid`, `additional_notes`, `gift_preference`) dans `questionnaire_responses`, puis marque le statut.
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `action` ∈ {apply, reject} (400) ; propriété explicite `.eq('user_id')` ; whitelist de champ ; statut `pending` requis (409).

### GET `/api/profile-updates/pending`
- **Appelable par** : Connecté.
- **Rôle** : liste les 20 propositions de mise à jour en attente (join `contacts`).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; propriété explicite.

### POST `/api/profile/art9`
- **Appelable par** : Connecté.
- **Rôle** : enregistre les données sensibles « Article 9 » du pilote (`religion`, `disability`, `health_comfort`) dans `my_profile` (upsert). Valeur vide = effacement, tronqué à 600 caractères.
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; whitelist stricte des 3 champs ; 400 si aucun champ valide.

### POST `/api/profile/avatar`
- **Appelable par** : Connecté.
- **Rôle** : upload de la photo de profil du pilote dans le bucket privé `avatars` (chemin dérivé du `user.id`), stocke `avatar_path`, renvoie une URL signée 1h.
- **Client** : MIXTE — **ADMIN** pour l'upload storage + URL signée ; UTILISATEUR pour l'upsert `avatar_path`.
- **Validation** : auth (401) ; fichier présent (400) ; type JPEG/PNG/WebP (415) ; taille ≤ 5 Mo (413). Chemin non contrôlable par le client.

### POST `/api/profile/generate`
- **Appelable par** : Connecté.
- **Rôle** : endpoint unique (source de vérité) de l'analyse de profil, appelé après chaque partie du questionnaire. Délègue à `generateProfileAnalysis` (analyse IA).
- **Client** : UTILISATEUR (transmis à la lib, RLS).
- **Validation** : auth (401). Pas de body.

### POST `/api/profile/practical`
- **Appelable par** : Connecté.
- **Rôle** : édition des faits pratiques du pilote (merge partiel dans `my_profile.practical_info` : adresse, tailles, régime, alcool, allergies, dates importantes…).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; validation stricte par champ (enums, troncatures, format de date, tailles de tableau) ; 400 si aucun champ valide.

### POST `/api/profile/synthesis`
- **Appelable par** : **Publique** (point d'attention : AUCUNE auth).
- **Rôle** : génère un récit de synthèse de profil via IA (`runSynthesisAI`) à partir de `facts` envoyés dans le corps. Ne touche pas la base.
- **Client** : AUCUN.
- **Validation** : **aucune auth**, seul le parsing JSON est protégé. Les `facts` viennent entièrement du client et sont envoyés à l'IA.

### POST `/api/profile/synthesis/generate`
- **Appelable par** : Connecté.
- **Rôle** : endpoint **déprécié** (remplacé par `/api/profile/generate`), gardé pour éviter les 404 en vol. Délègue à `generateProfileAnalysis`.
- **Client** : UTILISATEUR (RLS).
- **Validation** : auth (401). Pas de body.

---

## 5 — Questionnaire & découverte (5)

### POST `/api/discovery/answer`
- **Appelable par** : Connecté.
- **Rôle** : enregistre une réponse du parcours « discovery ». Crée la session au besoin, enregistre la réponse, répercute certaines réponses dans `my_profile.practical_info` (régime, mobilité), incrémente `discovery_fatigue_score`, pré-calcule les questions suivantes en tâche de fond, régénère l'analyse si session terminée.
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `questionKey` requis (400) ; `pendingKeys` requis si pas de session (400).

### GET `/api/discovery/next`
- **Appelable par** : n/a.
- **Rôle** : route **neutralisée** (legacy). Renvoie toujours **410 Gone** (« Ce point d'entrée n'existe plus. »).
- **Client** : AUCUN.
- **Validation** : aucune (toujours 410).

### POST `/api/questionnaire-insight`
- **Appelable par** : **Publique** (point d'attention : AUCUNE auth).
- **Rôle** : génère un court « insight » (1-2 phrases) à partir de réponses partielles, via IA (Anthropic `claude-sonnet-4-6`). Ne touche pas la base.
- **Client** : AUCUN.
- **Validation** : **aucune auth** ; si aucune réponse remplie → insight vide. Risque d'abus/coût (appel IA sans garde).

### POST `/api/questionnaire/proche-register`
- **Appelable par** : **Publique** (par design, sécurité par token).
- **Rôle** : permet à un proche non connecté d'enregistrer ses réponses à un questionnaire partagé. Vérifie le `token` dans `share_links` + expiration, upsert dans `shared_profile_responses` (`user_id: null`).
- **Client** : **ADMIN seul** (nécessaire car appelant non authentifié).
- **Validation** : `token` + `response_data` présents (400) ; token valide (404) ; non expiré (410). Sécurité = connaissance du token.

### POST `/api/questionnaire/voice-conversation`
- **Appelable par** : Connecté.
- **Rôle** : aide au remplissage vocal — mappe une dictée (`spoken_text`) aux options d'une question via IA (`claude-sonnet-4-6`). Filtre les valeurs contre la liste blanche des options.
- **Client** : UTILISATEUR (auth seulement, pas de DB).
- **Validation** : auth (401) ; si texte/options manquants → `{matched:[]}`.

---

## 6 — Confidences & mémoires (7)

### POST / GET `/api/confidences`
- **Appelable par** : Connecté.
- **Rôle** : POST = pipeline NLP « confidence ». Charge les contacts, appelle IA (`claude-sonnet-4-6`) pour extraire sujet/contact/ton/mises à jour de profil, valide que le `contact_id` extrait appartient au user, insère dans `confidences`, crée des propositions `pending` dans `profile_updates_from_confidences`, met éventuellement à jour `my_profile` (période difficile / accomplissement du pilote). GET = liste paginée des confidences (join `contacts`).
- **Client** : POST MIXTE — UTILISATEUR pour lire `contacts` ; **ADMIN pour les écritures** (`confidences`, `profile_updates_from_confidences`, `my_profile`) et la lecture `questionnaire_responses`. GET = UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `text` non vide (400) ; sortie IA re-validée (`contact_id` doit appartenir au user). **Point d'attention** : `field_name` issu de l'IA injecté dans un `.select()` (contraint par le prompt, pas par une whitelist code stricte).

### PATCH `/api/memories/[id]`
- **Appelable par** : Connecté.
- **Rôle** : met à jour le `status` d'une mémoire. Vérifie la propriété (`pilot_id === user.id`).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `status` valide (400) ; propriété explicite (404 sinon).

### POST `/api/memories/situation`
- **Appelable par** : Connecté.
- **Rôle** : crée une mémoire « situation » sur un proche avec enrichissement IA (extraction via `claude-haiku-4-5-20251001`, reformulation via `claude-sonnet-4-6`). Insert dans `memories` (`revalidate_at` +30 j). Si le proche a un compte (`contactUserId`), régénère son `profile_analysis`.
- **Client** : MIXTE — UTILISATEUR pour l'insert `memories` ; **ADMIN pour régénérer l'analyse d'un AUTRE utilisateur** (`generateProfileAnalysis(contactUserId, …)`).
- **Validation** : auth (401) ; `contactId` + `rawText` requis (400). **Point d'attention** : pas de vérification que `contactId`/`contactUserId` appartient à l'utilisateur (repose sur RLS pour l'insert ; l'ADMIN régénère l'analyse d'un `contactUserId` non validé).

### POST `/api/memories/situation/action`
- **Appelable par** : Connecté.
- **Rôle** : applique `revalidate` (repousse `revalidate_at` +30 j) ou `resolve` (statut `resolved`) sur une mémoire. Vérifie la propriété.
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `action` ∈ {revalidate, resolve} (400) ; propriété explicite (404 sinon).

### POST `/api/memories/w1`
- **Appelable par** : Connecté.
- **Rôle** : traite une mémoire (workflow « w1 ») via l'orchestrateur « brain » (`processMemory`), renvoie les champs enrichis (résumé, sentiment, catégorie, sensibilité…).
- **Client** : UTILISATEUR seul (transmis à la lib, RLS).
- **Validation** : auth (401) ; `contactId` + `text` requis (400) ; **propriété du contact vérifiée explicitement** (404 sinon).

### POST `/api/memories/w2`
- **Appelable par** : Connecté.
- **Rôle** : crée un item de carnet d'envies (`carnet_envies_items`) pour un contact (description, lien, marque, indice de lieu, niveau de confiance).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `contactId` + `description` requis (400) ; `confidenceLevel` validé (400) ; **propriété du contact vérifiée** (404 sinon).

### POST `/api/memories/w2-analyse`
- **Appelable par** : Connecté.
- **Rôle** : génère une description d'article (carnet) à partir d'une photo (IA vision `claude-sonnet-4-6`), d'un lien (déduction de marque par domaine) ou d'un texte (reformulation IA). N'ÉCRIT rien en base.
- **Client** : UTILISATEUR (auth seulement, pas de DB).
- **Validation** : auth (401) ; au moins une entrée requise (400) ; type MIME contrôlé ; repli déterministe.

---

## 7 — Contacts (6)

### POST `/api/contacts/archive`
- **Appelable par** : Connecté.
- **Rôle** : archive un contact (`archived_at`, `archive_reason`, mode souvenir).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `contactId` requis (400) ; `reason` ∈ liste (deceased, lost_contact, end_of_relationship, other). Propriété via filtre `user_id`.

### POST `/api/contacts/unarchive`
- **Appelable par** : Connecté.
- **Rôle** : désarchive un contact (`archived_at = null`).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `contactId` requis (400). Propriété via filtre `user_id`.

### POST `/api/contacts/delete`
- **Appelable par** : Connecté.
- **Rôle** : supprime définitivement un contact. Vérifie la propriété (SELECT) puis DELETE.
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `contactId` requis (400) ; propriété vérifiée explicitement (404 sinon) + double filtre `user_id`.

### POST `/api/contacts/create-incognito`
- **Appelable par** : Connecté.
- **Rôle** : crée un contact avec idempotence (`idempotency_key`) et anti-doublon (même nom < 30 s). Insert dans `contacts` ; si registre « compliqué/fragile » avec contexte, insert dans `context_journal`.
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `name`, `relationship` (∈ liste), `phone` requis (400) ; register/gender/key normalisés.

### POST `/api/contacts/lookup`
- **Appelable par** : Connecté.
- **Rôle** : recherche RGPD-safe pour savoir si un email/téléphone correspond à un utilisateur Candice. Renvoie `{ found, userId? }` sans PII. Exclut soi-même. Respecte `is_findable`.
- **Client** : MIXTE — UTILISATEUR pour l'identité ; **ADMIN pour les RPC** `lookup_candice_user_by_email` / `..._by_phone` (SECURITY DEFINER).
- **Validation** : auth (401) ; email normalisé ; résultats filtrés pour exclure `user.id`.

### POST `/api/contacts/upload-photo`
- **Appelable par** : Connecté.
- **Rôle** : upload d'une photo de contact dans le bucket `contact-photos` (chemin `{user.id}/{contactId}/…`), stocke le chemin dans `contacts.photo_url`, renvoie une URL signée 1h.
- **Client** : MIXTE — UTILISATEUR pour vérifier la propriété + update `photo_url` ; **ADMIN pour l'upload storage + URL signée**.
- **Validation** : auth (401) ; `file` + `contactId` requis (400) ; **propriété du contact vérifiée** (404 sinon).

---

## 8 — Cadence & préférences (4)

### PATCH `/api/contacts/[id]/cadence`
- **Appelable par** : Connecté.
- **Rôle** : définit/efface l'override de cadence d'un contact (`null` = suivre la cadence globale).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; valeur `null` ou ∈ {discreet, normal, sustained, intense} (400). Propriété via filtre `user_id`.

### POST `/api/cadence/auto-adjust`
- **Appelable par** : Connecté.
- **Rôle** : ajuste automatiquement la cadence globale d'après le feedback récent (`cadence_feedback`) : ≥3 recommandations d'augmentation → +1 cran, ≥3 de réduction → −1 cran. Met à jour `my_profile.cadence_preference`.
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401). Pas d'input ; message si données insuffisantes.

### PATCH `/api/parametres/cadence`
- **Appelable par** : Connecté.
- **Rôle** : définit la préférence de cadence globale (`my_profile.cadence_preference`).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; valeur ∈ {discreet, normal, sustained, intense} (400).

### PATCH `/api/parametres/notifications`
- **Appelable par** : Connecté.
- **Rôle** : met à jour les préférences de notifications (whitelist : `notif_push_enabled`, `notif_email_enabled`, `notif_quiet_hours_start/end`, `notif_max_per_day`). Upsert `my_profile`.
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; filtrage strict par allowlist (400 si aucun champ). Pas de validation runtime des valeurs elles-mêmes.

---

## 9 — Notes IA & carnet (identification) (2)

### POST `/api/candice-note`
- **Appelable par** : Connecté.
- **Rôle** : enregistre une note libre. Charge les contacts non archivés, appelle IA (`claude-sonnet-4-6`) pour identifier si un proche est mentionné, insert dans `profile_notes`.
- **Client** : UTILISATEUR seul (RLS). Externe : Anthropic.
- **Validation** : auth (401) ; `note` non vide (400). **Point d'attention** : le `contact_id` renvoyé par l'IA n'est PAS revalidé contre les contacts réels avant insertion.

### POST `/api/carnet/identify`
- **Appelable par** : Connecté.
- **Rôle** : identification IA d'un produit à partir d'une photo déjà stockée (bucket `contact-photos`), via IA vision (`claude-haiku-4-5-20251001`). Renvoie marque/produit. N'écrit rien.
- **Client** : MIXTE — UTILISATEUR pour l'identité ; **ADMIN pour le download storage**. Externe : Anthropic.
- **Validation** : auth (401) ; `path` requis ET **doit commencer par `{user.id}/`** (empêche de lire la photo d'un autre) (400 sinon).

---

## 10 — Recommandations & suggestions (9)

### POST `/api/recommendations/action`
- **Appelable par** : Connecté.
- **Rôle** : marque une attention comme faite/ignorée (`attention_log`, si statut `proposed`).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `contactId`, `attentionTitle`, `status` requis (400). La valeur de `status` n'est pas validée contre une liste.

### POST `/api/recommendations/context`
- **Appelable par** : Connecté.
- **Rôle** : enregistre la réponse à une question de contexte (`context_journal`).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `questionId` + `answer` non vide (400). Propriété via filtre `user_id`.

### POST `/api/recommendations/feedback`
- **Appelable par** : Connecté.
- **Rôle** : enregistre un feedback sur une attention (`attention_log`).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `feedback` ∈ {juste, a_cote, pas_le_moment} (400).

### POST `/api/recommendations/generate`
- **Appelable par** : Connecté.
- **Rôle** : génère un jeu de recommandations pour un contact. Lit contact + profils (pilote et éventuellement proche lié), historique d'attentions, feedbacks, contexte ; appelle le moteur `generateRecommendations` ; upsert `contact_recommendations` ; insert des idées `proposed` dans `attention_log` ; génère éventuellement une question proactive.
- **Client** : UTILISATEUR seulement pour l'identité ; **TOUTES les lectures/écritures via ADMIN** — la sécurité repose entièrement sur les filtres `user_id` manuels, pas sur RLS. Lit aussi le `my_profile` du proche lié via ADMIN.
- **Validation** : auth (401) ; `contactId` requis (400) ; contact filtré sur `user_id` (404 sinon).

### POST `/api/proactive-suggestions/[id]/refuse`
- **Appelable par** : Connecté.
- **Rôle** : refuse ou reporte (« pas maintenant » → `snoozed` +21 j, sinon `refused`) une suggestion proactive.
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `refusal_reason` requis (400) ; propriété explicite (403 si autre user) ; état `pending`/`snoozed` requis (409).

### POST `/api/proactive-suggestions/[id]/validate`
- **Appelable par** : Connecté.
- **Rôle** : valide une suggestion proactive (statut `validated`, met à jour `contacts.last_suggestion_at`, `trackActivity`).
- **Client** : UTILISATEUR pour les écritures métier (RLS) ; **ADMIN passé uniquement à `trackActivity`** (suivi de cycle de vie).
- **Validation** : auth (401) ; propriété explicite (403) ; état `pending`/`snoozed` requis (409).

### POST `/api/suggestions`
- **Appelable par** : Connecté.
- **Rôle** : génère 6 suggestions d'attention pour un contact via IA (`claude-sonnet-4-6`), upsert dans `suggestions`.
- **Client** : UTILISATEUR seul (RLS). Externe : Anthropic.
- **Validation** : auth (401) ; contact introuvable → 404 ; profil manquant → 400. Sortie IA parsée sans schéma strict.

### POST `/api/idea-suggestions`
- **Appelable par** : Connecté.
- **Rôle** : génère 3 idées adaptées à une occasion + budget via IA (`claude-sonnet-4-6`). N'écrit rien.
- **Client** : UTILISATEUR seul (RLS). Externe : Anthropic.
- **Validation** : auth (401) ; contact introuvable → 404 ; `occasion`/`budget` non validés (fallback).

### POST `/api/analyse`
- **Appelable par** : Connecté.
- **Rôle** : analyse de compatibilité relationnelle entre l'utilisateur et un contact via IA (`claude-sonnet-4-6`). N'écrit rien.
- **Client** : UTILISATEUR seul (RLS). Externe : Anthropic.
- **Validation** : auth (401) ; contact introuvable → 404 ; profil pilote manquant → 400 ; profil contact manquant → 400.

---

## 11 — Lectures « respiration » (IA publiques) (4)

> Ces 4 routes n'ont **AUCUNE authentification** et **aucun accès base de données** : elles reçoivent des `facts`/`text` arbitraires et appellent l'IA Anthropic. **Point d'attention commun** : pas de rate-limit ni d'auth → risque d'abus/coût.

### POST `/api/attention/breath`
- **Appelable par** : **Publique**.
- **Rôle** : génère une courte réflexion (2-3 phrases) sur la façon dont une personne reçoit/donne l'attention (IA `claude-sonnet-4-6`, repli local si échec).
- **Client** : AUCUN.
- **Validation** : aucune (facts déstructurés directement).

### POST `/api/lifestyle/breath`
- **Appelable par** : **Publique**.
- **Rôle** : courte « lecture » sur les goûts/mode de vie (étape 4) ou interdits/sensibilités (étape 5), selon `facts.step` (IA `claude-sonnet-4-6`, repli local).
- **Client** : AUCUN.
- **Validation** : aucune.

### POST `/api/lifestyle/extract-filters`
- **Appelable par** : **Publique**.
- **Rôle** : extrait 3-6 interdits relationnels d'un texte libre (IA `claude-haiku-4-5-20251001`). Renvoie `[]` si texte < 5 caractères.
- **Client** : AUCUN.
- **Validation** : aucune auth ; longueur minimale du texte ; sortie filtrée/tronquée à 6.

### POST `/api/temperament/breath`
- **Appelable par** : **Publique**.
- **Rôle** : courte lecture sur le fonctionnement relationnel/tempérament (IA `claude-sonnet-4-6`, repli local).
- **Client** : AUCUN.
- **Validation** : aucune.

---

## 12 — Consentement & partage de profil (9)

### PATCH `/api/consent/[consentId]/respond`
- **Appelable par** : Connecté (A ou B de la paire).
- **Rôle** : répond à un consentement de mise en relation. A peut `revoke` ; B peut `accept`/`reject`. Met à jour `contact_consents` (active/rejected/revoked).
- **Client** : UTILISATEUR seul (RLS ; seul A ou B peut lire la ligne).
- **Validation** : auth (401) ; `action` ∈ {accept, reject, revoke} (400) ; existence (404) ; rôle (403) ; état (409).

### POST `/api/profile-view/[consentId]/cancel`
- **Appelable par** : Connecté (le demandeur X).
- **Rôle** : X annule sa propre demande de consultation encore en attente. DELETE `contact_consents` filtré `requested_by = user.id`, `status='pending'`.
- **Client** : UTILISATEUR seul (RLS, policy `viewer_cancel_own_pending_request`).
- **Validation** : auth (401) ; propriété par filtres SQL ; 404 si rien supprimé.

### POST `/api/profile-view/[consentId]/respond`
- **Appelable par** : Connecté (la cible Y).
- **Rôle** : Y répond à « X veut voir ton profil » : `all`, `sections`, `blind` ou `reject`. Le `scope` est assaini côté serveur (`scopeForSelection`, jamais d'élargissement ; zéro case → `['socle']`).
- **Client** : UTILISATEUR seul (RLS, policy `pilote_manage_consents`).
- **Validation** : auth (401) ; `action` ∈ liste (400) ; propriété `pilote_id = user.id` (404) ; état `pending` (409) ; scope assaini.

### POST `/api/profile-view/[consentId]/revoke`
- **Appelable par** : Connecté (la cible Y).
- **Rôle** : Y retire un partage déjà accordé (`status='revoked'` si `active`). L'analyse se referme.
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; propriété par filtres ; 404 si rien mis à jour.

### POST `/api/profile-view/lookup`
- **Appelable par** : Connecté.
- **Rôle** : recherche exacte d'une personne (par @handle ou email) pour lui demander sa fiche. Exige un questionnaire complet. Résout l'UUID via RPC, écarte soi-même, renvoie l'état de relation existant, sans PII.
- **Client** : MIXTE — UTILISATEUR pour `my_profile` + `contact_consents` (RLS) ; **ADMIN pour les RPC** de lookup.
- **Validation** : auth (401) ; **questionnaire 5/5 requis** (403) ; handle validé ; auto-recherche écartée.

### POST `/api/profile-view/request`
- **Appelable par** : Connecté.
- **Rôle** : X demande à voir la fiche de Y. Crée une ligne `contact_consents` (`kind: profile_view`, `pending`) via client UTILISATEUR (la policy RLS `viewer_create_profile_view_request` est la garde réelle). Notifie Y par email (voir doc 12, email n°11).
- **Client** : MIXTE — UTILISATEUR pour l'insert (RLS) ; **ADMIN pour vérifier la cible (`is_findable`) et récupérer son email**.
- **Validation** : auth (401) ; **questionnaire 5/5 requis** (403) ; `targetUserId` requis (400) ; pas soi-même (400) ; cible trouvable (404) ; anti-doublon (409).

### POST `/api/share-link/create`
- **Appelable par** : Connecté.
- **Rôle** : Y génère un lien de partage sortant de sa fiche. Mode (`all`/`sections`/`blind`) figé via `scopeForSelection`. Génère un token aléatoire, stocke seulement son **hash SHA-256** dans `profile_share_links`. Renvoie l'URL `/rejoindre/{token}`.
- **Client** : UTILISATEUR seul (RLS, policy `owner_manage_share_links`).
- **Validation** : auth (401) ; **questionnaire complet requis** (403) ; `mode` ∈ liste (400) ; scope assaini.

### POST `/api/share-link/claim`
- **Appelable par** : Connecté.
- **Rôle** : le destinataire connecté réclame un lien de partage (flux d'inscription `register?share_token=…`). Délègue à `claimShareLink(token, user.id)`.
- **Client** : UTILISATEUR pour l'auth ; le traitement du claim est encapsulé dans la lib `@/lib/share-links` (client non déterminable depuis la route).
- **Validation** : auth (401) ; `token` validé dans la lib (400 `self` / 404).

### POST `/api/share-link/[linkId]/revoke`
- **Appelable par** : Connecté (le propriétaire Y).
- **Rôle** : Y annule un lien de partage pas encore réclamé (`revoked_at = now`, si `claimed_at IS NULL`).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; propriété par filtres `owner_id` ; 404 si rien mis à jour.

---

## 13 — Invitations (3)

### POST `/api/invite/create`
- **Appelable par** : Connecté.
- **Rôle** : le pilote crée un lien d'invitation. Insert dans `invite_links` (`pilote_id`, `contact_id` optionnel, `pilote_name`), renvoie le `token`.
- **Client** : UTILISATEUR pour l'identité ; **ADMIN pour l'insert `invite_links`** (`pilote_id` fixé à `user.id`).
- **Validation** : auth (401). **Point d'attention** : `contactId` optionnel n'est PAS vérifié en propriété.

### POST `/api/invite/link`
- **Appelable par** : Connecté (le proche qui ouvre le lien).
- **Rôle** : valide un lien d'invitation (`token`). Marque le lien utilisé (idempotent), rattache `proche_user_id` au contact, notifie le pilote par email (voir doc 12, email n°9).
- **Client** : UTILISATEUR pour l'identité ; **ADMIN pour lire/mettre à jour `invite_links`, `contacts` et récupérer l'email du pilote**.
- **Validation** : auth (401) ; `token` requis (400) ; token existant (404) ; non expiré (410).

### POST `/api/invite/nudge`
- **Appelable par** : Connecté (le pilote).
- **Rôle** : relance un proche. 3 cas : (a) proche non inscrit → nouveau lien + email de réinvitation ; (b) proche inscrit fiche incomplète → notification PUSH ; (c) push non parti → email de nudge. (Voir doc 12, email n°10 + section push.)
- **Client** : UTILISATEUR pour vérifier la propriété du contact ; **ADMIN pour lire/écrire `invite_links`, `contacts`, `my_profile` et récupérer les emails**.
- **Validation** : auth (401) ; `contactId` requis (400) ; contact filtré sur `user_id` (404 sinon).

---

## 14 — Wishlist & carnet d'envies (3)

### POST `/api/wishlist/offered`
- **Appelable par** : Connecté.
- **Rôle** : marque un cadeau comme « on me l'a offert » — insert dans `attention_log` (`attention_type='cadeau_recu'`, `status='done'`).
- **Client** : UTILISATEUR seul (RLS).
- **Validation** : auth (401) ; `contactId` + `title` requis (400) ; **propriété du contact vérifiée** (404 sinon).

### POST `/api/wishlist/og`
- **Appelable par** : Connecté.
- **Rôle** : récupère l'image OpenGraph d'une page web (aperçu de lien) via `fetch` externe (timeout 5s), extrait `og:image`/`twitter:image`. N'écrit rien.
- **Client** : UTILISATEUR (auth seulement, pas de DB).
- **Validation** : auth (401) ; `url` doit matcher `^https?://`. **Point d'attention** : fetch d'une URL arbitraire fournie par l'utilisateur → risque SSRF (pas de filtrage IP interne/localhost).

### POST `/api/wishlist/photo`
- **Appelable par** : Connecté.
- **Rôle** : upload d'une photo (wishlist ou carnet) dans le bucket `contact-photos` (chemin préfixé par `user.id`), renvoie chemin + URL signée 1h.
- **Client** : UTILISATEUR pour l'identité ; **ADMIN pour l'upload storage + URL signée**.
- **Validation** : auth (401) ; `file` requis (400). Chemin préfixé par `user.id`. **Point d'attention** : pour le scope carnet, `contactId` n'est pas vérifié en propriété.

---

## 15 — Notifications push (2)

### POST `/api/push/subscribe`
- **Appelable par** : Connecté.
- **Rôle** : enregistre un abonnement push (upsert `push_subscriptions`).
- **Client** : UTILISATEUR pour l'identité ; **ADMIN pour l'upsert** (`user_id` fixé à `user.id`).
- **Validation** : auth (401) ; `endpoint`, `p256dh_key`, `auth_key` requis (400).

### POST `/api/push/unsubscribe`
- **Appelable par** : Connecté.
- **Rôle** : supprime un abonnement push (DELETE `push_subscriptions` filtré `user_id` + `endpoint`).
- **Client** : UTILISATEUR pour l'identité ; **ADMIN pour le DELETE** (filtré sur `user.id`).
- **Validation** : auth (401) ; `endpoint` requis (400).

---

## 16 — Emails (6)

> Contenu verbatim et traçabilité détaillés dans **doc 12 — Emails & notifications**. Ici on note seulement le profil API.

### POST `/api/emails/welcome`
- **Appelable par** : Publique (exige un `email` dans le corps). Appelée depuis la page d'inscription.
- **Client** : AUCUN (envoi Resend uniquement).
- **Validation** : `email` requis (400).

### POST `/api/emails/reminder`
- **Appelable par** : Publique (exige `contactEmail`). Appelée depuis la fiche contact.
- **Client** : AUCUN.
- **Validation** : `contactEmail` requis (400).

### POST `/api/emails/profile-complete`
- **Appelable par** : Publique (exige `ownerEmail`). **ORPHELINE** : aucun appelant dans le code.
- **Client** : AUCUN.
- **Validation** : `ownerEmail` requis (400).

### POST `/api/emails/questionnaire-invite`
- **Appelable par** : Connecté. Appelée depuis le questionnaire.
- **Client** : UTILISATEUR (lit prénom + sexe du pilote pour personnaliser).
- **Validation** : auth (401) ; `contactEmail` requis (400).

### POST `/api/emails/reminder-suggestion`
- **Appelable par** : Cron (secret `CRON_SECRET`).
- **Client** : **ADMIN** (via la lib `sendReminderEmail`, qui écrit dans `notification_log`).
- **Validation** : secret cron (401) ; `user_id`, `suggestion_id`, `title`, `description`, `priority` requis (400).

### POST `/api/emails/trial-reminder`
- **Appelable par** : Cron (secret `CRON_SECRET`). Appelée par `lifecycle-check`.
- **Client** : **ADMIN** (écrit dans `notification_log` : `trial_reminder_{daysLeft}`).
- **Validation** : secret cron (401) ; `userId`, `email`, `daysLeft` requis (400).

---

## 17 — Cron (tâches planifiées) (5)

> Toutes protégées par `Authorization: Bearer ${CRON_SECRET}` (sauf la variante « manual »). Toutes utilisent le client **ADMIN** (bypass RLS) — normal pour un traitement système.

### GET `/api/cron/cadence-feedback`
- **Appelable par** : Cron (secret).
- **Rôle** : agrège sur 28 jours les taux de validation/refus des suggestions par (user, contact), écrit des lignes dans `cadence_feedback`, journalise dans `cron_runs`.
- **Client** : **ADMIN seul**.
- **Validation** : secret cron (401).

### GET `/api/cron/detect-and-generate`
- **Appelable par** : Cron (secret).
- **Rôle** : job principal — détecte les signaux contextuels par utilisateur (skip si `paused`/`cancelled`), génère des suggestions (`generateSuggestionForSignal`, IA indirecte), jusqu'à 50 utilisateurs. Journalise `cron_runs`.
- **Client** : **ADMIN seul**.
- **Validation** : secret cron (401, refuse aussi si secret absent).

### POST `/api/cron/detect-and-generate/manual`
- **Appelable par** : Connecté (déclenchement manuel, limité à SON propre compte).
- **Rôle** : version manuelle du job précédent, scoppée à `user.id`.
- **Client** : UTILISATEUR pour l'identité ; **ADMIN pour la détection/génération** (filtré `user_id`).
- **Validation** : auth (401). Pas de secret cron (déclenché par l'utilisateur).

### GET `/api/cron/email-reminders`
- **Appelable par** : Cron (secret).
- **Rôle** : envoie les emails de rappel des suggestions `pending` de plus de 48h (exclut celles déjà notifiées via `notification_log`), via `sendReminderEmail`. Journalise `cron_runs`.
- **Client** : **ADMIN seul** (+ envoi Resend).
- **Validation** : secret cron (401).

### GET `/api/cron/lifecycle-check`
- **Appelable par** : Cron (secret).
- **Rôle** : parcourt tous les profils et gère le cycle de vie : rappels d'essai J-7/J-3/J-1 (appelle `/api/emails/trial-reminder`), passage en `silent` (90 j d'inactivité), relance après pause (60 j), suppression définitive à échéance (`hardDeleteUser`). La bascule essai→pause est **désactivée** (`ENABLE_TRIAL_LOCKOUT = false`). Journalise `cron_runs`. (Emails détaillés en doc 12, n°14.)
- **Client** : **ADMIN seul** (+ envois Resend).
- **Validation** : secret cron (401).

---

## Points d'attention transverses (factuels, sans jugement)

- **Routes publiques appelant l'IA sans authentification** (risque de coût/abus non contrôlé) : `/api/profile/synthesis`, `/api/questionnaire-insight`, `/api/attention/breath`, `/api/lifestyle/breath`, `/api/lifestyle/extract-filters`, `/api/temperament/breath`.
- **Routes où le client ADMIN (contourne RLS) porte toute la sécurité via des filtres `user_id` manuels** : `/api/account/export`, `/api/account/export-download`, `/api/recommendations/generate`, `/api/confidences` (POST), plus les crons.
- **`contactId` / `contactUserId` non vérifiés en propriété** : `/api/invite/create`, `/api/wishlist/photo` (scope carnet), `/api/memories/situation`, `/api/candice-note` (contact_id issu de l'IA), `/api/profile-notes`.
- **SSRF potentiel** : `/api/wishlist/og` (fetch d'URL arbitraire).
- **Mot de passe codé en dur** en repli : `/api/beta-access`.
- **Route orpheline** (définie, jamais appelée) : `/api/emails/profile-complete`.
- **Route neutralisée** (410) : `/api/discovery/next`.
- **Route dépréciée** (conservée) : `/api/profile/synthesis/generate`.
</content>


---

<!-- ============ 16-securite ============ -->

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


---

<!-- ============ 17-dette-et-incoherences ============ -->

# 17 — Dette technique & incohérences (constats factuels)

> Constats vérifiés uniquement, **sans aucune recommandation** (consigne).
> Marquage : ⚫ = point lourd / mort ou franchement contradictoire · 🟡 = point mineur ou à surveiller.
> Chaque constat renvoie à sa source (fichier ou table).

---

## (a) Code mort / fichiers potentiellement inutilisés

**A1 — 🟡 `QuestionnaireForm.tsx` n'est PAS mort (contrairement à l'étiquette « legacy »)**
- **Source** : `src/components/questionnaire/QuestionnaireForm.tsx` (définit `export default function QuestionnaireForm()` ligne 169).
- Il est **importé et rendu** par `src/components/contacts/NewContactFlow.tsx` (import ligne 5, usage `<QuestionnaireForm />` ligne 402), lui-même utilisé par `src/app/contacts/new/page.tsx` (import ligne 4, usage ligne 20).
- Constat : le composant présenté comme « legacy » est toujours dans le chemin d'ajout d'un nouveau contact. Il est actif, pas mort.

**A2 — 🟡 Table `_deprecated_profile_share_requests` : présente en base, non référencée par le code**
- **Source** (base) : la table existe, a RLS activé et **5 policies** actives (`owner_manage_incoming_requests`, `requester_manage_own_requests`, `users_manage_own_share_requests`, `users_respond_to_requests_for_their_profile`, `users_see_requests_for_their_profile`).
- **Source** (code) : `grep -rln "_deprecated_profile_share_requests" src` → **aucune référence**.
- Constat : table marquée « deprecated » qui subsiste en base avec ses règles d'accès, mais que plus aucun code n'interroge.

**A3 — 🟡 Champ legacy `gift_wishlist` encore présent dans les types**
- **Source** : `src/types/index.ts:30` → `gift_wishlist: WishlistItem[] | null;`
- Constat : champ déclaré déprécié dans les consignes projet (fusionné, migration 67, jamais droppé) mais toujours présent dans le typage TypeScript. Seule occurrence de `gift_wishlist` dans `src`.

## (b) TODO / FIXME (verbatim)

**B1 — 🟡** `src/app/api/proactive-suggestions/[id]/validate/route.ts:46`
- Verbatim : `// TODO Phase 7: trigger facilitation flow (booking, purchase, etc.)`

**B2 — 🟡** `src/components/dashboard/ProactiveSuggestionDetail.tsx:165`
- Verbatim : `{/* TODO Phase 7: facilitation flow (booking, etc.) */}`

- Constat : ce sont les **deux seuls** `TODO`/`FIXME` du dossier `src` (`grep -rn "TODO\|FIXME" src`). Les deux pointent la même fonctionnalité « Phase 7 » non branchée (voir aussi section e).

## (c) Doublons (deux systèmes qui coexistent)

**C1 — ⚫ Deux systèmes de recommandations en parallèle**
- `contact_recommendations` — surface **pilote**. Écrite par `src/app/api/recommendations/generate/route.ts:171` (`upsert`), lue par `src/app/contacts/page.tsx:113`, `src/app/contacts/[id]/page.tsx:164`, `src/app/dashboard/page.tsx:117`.
- `contact_reco_items` — surface **Espace Proche** (`/proche/[id]`). Lue/écrite par `src/app/proche/[id]/EspaceProcheShell.tsx` (lignes 204, 216, 228, 243, 254) et `src/app/proche/[id]/page.tsx:46`.
- Constat : deux tables distinctes servent deux surfaces de reco différentes, chacune avec sa propre policy RLS (`owner_recommendations` sur `contact_recommendations` via `user_id` ; `owner_contact_reco_items` sur `contact_reco_items` via `pilot_id`). Les deux sont **vides en base** (0 ligne, voir section d).

**C2 — ⚫ Deux tables de liens de partage en parallèle**
- `share_links` — utilisée par le flux de partage-questionnaire : `src/app/profil-partage/[token]/page.tsx:16`, `src/app/api/shared-profile/complete/route.ts:41`, `src/app/api/questionnaire/proche-register/route.ts:15`.
- `profile_share_links` — utilisée par le flux de partage-profil : `src/app/moi/partage/page.tsx:74`, `src/app/api/share-link/create/route.ts:45`, `src/app/api/share-link/[linkId]/revoke/route.ts:18`, `src/app/rejoindre/[token]/page.tsx:51`, `src/lib/share-links.ts` (lignes 29, 45, 54, 68).
- Constat : deux tables aux noms très proches coexistent et sont toutes deux référencées par du code vivant. Les deux sont **vides en base** (0 ligne).

## (d) Colonnes jamais remplies (tables clés)

**D1 — 🟡 `profile_analysis` : colonnes `territory`, `universe`, `modes` à 0 % remplies**
- **Source** (base) : sur les **2 lignes** existantes de `profile_analysis` :
  - `territory` → 0/2 remplies
  - `universe` → 0/2 remplies
  - `modes` → 0/2 remplies
  - (à titre de comparaison, sur ces mêmes 2 lignes : `insights` 1/2, `style_radar` 1/2, `podium_intro` 1/2, `understood_cards` 1/2, `works_phrases` 1/2, `summary_long` 1/2, `dimension_scores` 1/2 sont partiellement remplies)
- Constat : `territory`, `universe` et `modes` ne sont remplies dans aucune des lignes présentes. **Réserve : échantillon de seulement 2 lignes** (environnement de vérification), donc ce constat porte sur un très petit volume.

## (e) Fonctionnalités à moitié branchées

**E1 — ⚫ Personnalisation IA des questions désactivée par un drapeau**
- **Source** : `src/lib/discovery/engine.ts:88` → `const PERSONALIZATION_ACTIVE = false;`
- Conséquences dans le même fichier : ligne 95 (`if (q.locked_text || !PERSONALIZATION_ACTIVE …)`), ligne 170, et les fonctions `precomputePersonalizationsForKeys` (ligne 507, court-circuitée ligne 513 `if (!PERSONALIZATION_ACTIVE …) return;`) et `precomputeUpcomingPersonalizations` (ligne 553, court-circuitée ligne 558).
- Constat : le pré-calcul de personnalisation est appelé depuis `src/app/api/discovery/answer/route.ts:123` (`after(() => precomputePersonalizationsForKeys(...))`) et depuis `src/lib/profile/generateProfileAnalysis.ts:760`, mais ces appels **retournent immédiatement sans rien faire** car le drapeau est à `false`. Code présent, chemin inactif.

**E2 — ⚫ `discovery_fatigue_score` : incrémenté mais jamais lu pour décider quoi que ce soit**
- **Source** : `src/app/api/discovery/answer/route.ts` lignes 102–111 : le score est lu (`.select("discovery_fatigue_score")`), incrémenté de 1 (`score = (… ?? 0) + 1`), puis réécrit (`.update({ discovery_fatigue_score: score })`).
- **Source** : `grep -rn "discovery_fatigue_score" src` → aucune autre occurrence.
- Constat : la valeur n'est utilisée nulle part ailleurs (aucune logique de décision, d'affichage ou de plafonnement ne la consomme). Elle n'est lue que pour être ré-incrémentée.

**E3 — ⚫ Flux « Phase 7 » (facilitation : réservation / achat) non implémenté**
- **Source** : les deux `TODO` de la section B (validate/route.ts et ProactiveSuggestionDetail.tsx).
- Constat : le déclenchement de réservation/achat depuis une suggestion proactive est annoncé mais non codé.

**E4 — 🟡 Nombreuses tables clés vides en base (fonctionnalités non exercées)**
- **Source** (base), comptages : `contact_recommendations` 0, `contact_reco_items` 0, `share_links` 0, `profile_share_links` 0, `suggestions` 0, `signals` 0, `savings_goal` 0, `savings_contribution` 0, `processing_log` 0, `cron_runs` 0. `finance_plans` 1, `profile_analysis` 2.
- Constat : plusieurs fonctionnalités disposent de leurs tables (reco, partage, signaux, suggestions, épargne, journaux) mais celles-ci ne contiennent aucune donnée dans l'environnement interrogé. **Réserve : il peut s'agir simplement d'un environnement de vérification peu alimenté** ; le constat est « aucune donnée présente », pas « fonctionnalité morte ».

## (f) Incohérences

**F1 — ⚫ `OnboardingProgressCard` lit des colonnes legacy à plat, alors que le reste de l'app utilise `practical_info`**
- **Source** : `src/components/dashboard/OnboardingProgressCard.tsx:37` → `.select("diet, food_allergies, clothing_size, shoe_size")` ; ligne 57 la logique teste `profile.diet || profile.food_allergies || profile.clothing_size || profile.shoe_size`.
- **Source** (base) : `my_profile` contient **à la fois** les colonnes à plat (`diet`, `food_allergies`, `clothing_size`, `shoe_size`) **et** la colonne `practical_info`.
- **Source** : le reste de l'app lit `practical_info` (ex. `src/app/moi/page.tsx`, `src/app/contacts/[id]/page.tsx`, `src/app/fiche/[consentId]/page.tsx`, `src/app/proche/[id]/page.tsx`, `src/app/api/discovery/answer/route.ts`, `src/app/api/recommendations/generate/route.ts`, `src/app/moi/partage/apercu/page.tsx`, `src/app/moi/questionnaire/QuestionnaireFlow.tsx`, `src/app/api/emails/*`).
- Constat : deux sources de vérité pour les infos pratiques (colonnes à plat vs `practical_info`). Un composant (la carte de progression d'onboarding) se base sur les anciennes colonnes ; le reste du produit sur la nouvelle. Une info saisie via `practical_info` peut donc ne pas être « vue » par la carte d'onboarding, et inversement.

**F2 — ⚫ Doublon de `sort_order = 425` dans `discovery_questions`**
- **Source** (base) : `select sort_order, count(*) from discovery_questions group by sort_order having count(*)>1` → **`sort_order = 425` apparaît 2 fois**.
- **Source** (code) : la valeur `425` apparaît aussi dans le test `src/lib/discovery/guard-paths.test.ts:68` (`sort_order: 425`).
- Constat : deux questions partagent le même rang d'affichage `425`, ce qui rend leur ordre relatif non déterministe.

**F3 — 🟡 `cadence_feedback` : policy en lecture seule mais droits d'écriture larges accordés**
- **Source** (base) : `cadence_feedback` a une seule policy RLS `users_own_cadence_feedback` de type `SELECT` (`qual = auth.uid() = user_id`). Il n'existe **pas** de policy INSERT/UPDATE/DELETE. Or les rôles `anon` et `authenticated` disposent des grants `INSERT, UPDATE, DELETE` sur la table.
- **Source** (code) : la cadence est écrite côté serveur, notamment via `src/app/api/cron/cadence-feedback/route.ts` et `src/app/api/cadence/auto-adjust/route.ts` (client admin, qui contourne RLS).
- Constat : incohérence entre les droits accordés (écriture) et les règles RLS (lecture seule côté utilisateur). En pratique l'écriture passe par le client admin ; les grants d'écriture directe aux rôles utilisateurs sont donc sans policy correspondante (RLS bloque par défaut), mais l'écart droits/policy existe.

**F4 — 🟡 Absence de bibliothèque de validation d'entrées**
- **Source** : `grep "zod|joi|yup|valibot|superstruct"` dans `package.json` → **aucune**. Dans le code, la validation est ad hoc (ex. `src/app/api/recommendations/generate/route.ts:27` : `if (!contactId) return … 400` ; corps de requête typé à la main via `as { contactId: string }`).
- Constat : les 87 routes API valident (ou non) leurs entrées à la main, sans schéma centralisé. Constat de dette de cohérence, listé aussi pour mémoire au chapitre 16.


---

<!-- ============ 18-tests ============ -->

# 18 — Tests (ce qui est couvert vs ce qui ne l'est pas)

> Constats factuels. Exécution de référence : `npm run test` (= `vitest run`, non interactif).

## Totaux

- **Fichiers de test** : **10** (tous sous `src/lib/…`, `find src -name "*.test.ts*"`).
- **Nombre de tests** : **165 tests**, **10 fichiers** — tous passants.
  - Sortie `vitest run` (v4.1.11) : `Test Files 10 passed (10)` / `Tests 165 passed (165)` / `Duration 238ms`.
- Framework : **Vitest** (`package.json` → `"test": "vitest run"`, dép. `vitest ^4.1.7`, ici v4.1.11).

## Détail par fichier de test (ce que ça couvre, en clair)

| Fichier | Ce que ça vérifie | Nb tests |
|---|---|---|
| `src/lib/attention/scoring.test.ts` | Calcul du score d'attention (« langage d'amour » côté réception) : valeurs brutes attendues par levier (MOT, GES, SER, EXP, CAD, SUR), cas issus de la « bible ». | 28 |
| `src/lib/temperament/scoring.test.ts` | Calcul du tempérament : introversion/extraversion, besoin d'espace, réaction au stress et au conflit, intensités. | 25 |
| `src/lib/lifestyle/scoring.test.ts` | Calcul du style de vie : profils « foodie », premium/simplicité, expérience vs objet, authenticité/luxe, exigence de standing. | 20 |
| `src/lib/profile/visibility.test.ts` | Matrice de visibilité V2 : quelles sections sont visibles selon le type de vue (pilote, 2e personne, lien public, filtre invité, socle), complétude de la matrice, place de la wishlist. | 20 |
| `src/lib/discovery/dataPresence.test.ts` | Moteur Discovery — présence de données : une question n'est proposée que si la donnée est absente ; cas parfums (structurés vs legacy), odeurs détestées, « risque parfum ». | 17 |
| `src/lib/profile/synthesis.test.ts` | Synthèse de profil : profil vide → tableaux vides ; extraction des dimensions dominantes réception/expression ; détection de contraste ; touchInsights et avoidAlerts ; label « besoin de contrôle ». | 12 |
| `src/lib/profile/v2-metrics.test.ts` | Métriques fiche V2 : podium à 7 barres (dimensions réelles, jamais « Présence »), libellés verrouillés, barème de largeurs, tri ; anneau de connaissance (source unique, plafonné tant que questions restantes). | 12 |
| `src/lib/discovery/guard-paths.test.ts` | Garde du moteur Discovery (chemins ②/③) : question jamais servie si donnée en fiche, GET sans écriture, statuts answered/archived/skipped, écriture du statut par `recordAnswer`. | 8 |
| `src/lib/profile/share-sections.test.ts` | Groupes de partage ↔ matrice V2 : couverture exacte des sections cochables, absence de doublon de clé, défauts de sélection, non-partage de la wishlist, intersection stricte du scope. | 8 |
| `src/lib/attention/breathFacts.test.ts` | « Faits de respiration » : cas de congruence multi-profils, profil unique, vrai écart réception/expression, cas vide (tout à zéro → neutre). | 4 |

- Décompte par comptage manuel des `it(`/`test(` : ≈ 154 ; le décompte **autoritatif de `vitest run` est 165** (l'écart vient des tests paramétrés/`.each`). C'est **165** qui fait foi.

## Grands domaines NON couverts par des tests (factuel)

Tous les fichiers de test sont concentrés sur la **logique de calcul pure** (`src/lib/attention`, `src/lib/temperament`, `src/lib/lifestyle`, `src/lib/profile`, `src/lib/discovery`). Aucun test trouvé (`find src -name "*.test.ts*"`) pour les domaines suivants :

- **Les 87 routes API** (`src/app/api/**/route.ts`) : aucune n'a de test. Cela inclut :
  - Compte / RGPD : `account/delete`, `account/export`, `account/export-download`, `account/cancel-deletion`.
  - Consentement et partage : `contacts/[id]/consent`, `profile-view/request`, `profile-view/lookup`, `share-link/create`, `share-link/[linkId]/revoke`, `shared-profile/complete`.
  - Réservation invisible / wishlist : `wishlist/photo`, `carnet/identify` (aucun test des RPC de réservation `reserve_wishlist_item` / `confirm_wishlist_purchase`).
  - Recommandations et suggestions : `recommendations/generate`, `proactive-suggestions/[id]/validate`.
  - Abonnement : `subscription/pause`, `subscription/resume`.
  - Invitations : `invite/create`, `invite/link`, `invite/nudge`.
  - Emails et tâches planifiées (cron) : `emails/*`, `cron/*` (5 routes).
  - Confidences / souvenirs : `confidences`, `memories/situation`.
  - Accès bêta : `beta-access`.
- **Les pages et composants React** (`src/app/**/page.tsx`, `src/components/**`) : aucun test de rendu ou d'interaction. Notamment `OnboardingProgressCard`, `NewContactFlow`, `QuestionnaireForm`, `ProactiveSuggestionDetail`, l'Espace Proche (`EspaceProcheShell`).
- **Les règles d'accès en base (RLS)** : aucune vérification automatisée que les policies isolent bien les données entre utilisateurs (aucun test de base de données).
- **Les fonctions de génération d'analyse de bout en bout** : `src/lib/profile/generateProfileAnalysis.ts` (le point d'entrée qui assemble tout) n'a pas de test dédié ; seuls des sous-modules (synthesis, scoring, metrics) sont testés isolément.
- **Le moteur de recommandations** `src/lib/recommendations/engine.ts` et `src/lib/recommendations/questions.ts` : pas de test.
- **La détection de signaux / cadence** : `src/lib/signals/detector.ts`, `src/lib/signals/generator.ts`, logique de cadence — pas de test.
- **Les liens de partage** `src/lib/share-links.ts` et **les URLs d'avatar/notifications** (`src/lib/profile/avatar-url.ts`, `src/lib/notifications/email-reminder.ts`) : pas de test.
- **Les intégrations externes** (Supabase, modèle IA Anthropic, emails Resend, notifications push VAPID) : aucun test (ni réel, ni simulé).

En résumé : les **calculs de profil** (attention, tempérament, lifestyle, synthèse, visibilité, podium, garde Discovery) sont couverts par 165 tests unitaires ; **tout le reste** (routes API, base/RLS, UI, intégrations, génération de bout en bout, reco, signaux, partage, abonnement, RGPD) n'a aucun test automatisé.
