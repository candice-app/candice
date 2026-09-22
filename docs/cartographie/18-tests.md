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
