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
