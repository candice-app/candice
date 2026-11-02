# Relevé de l'état du code — tenu par l'assistant

> **Nature de ce fichier.** Factuel, pas doctrinal. Il décrit **ce que le code fait aujourd'hui**
> (lecteurs recensés, état réel des migrations, comportement de telle fonction). L'assistant l'écrit et le
> met à jour **librement** — c'est son relevé. La **doctrine** d'Estelle (ses règles, ses décisions, la
> séquence du chantier) vit dans `hsg-architecture.md` et ne se touche que sur sa dictée.
>
> Un relevé est daté et peut se périmer : vérifier contre le code avant de s'appuyer dessus.

---

## Lecteurs de l'ancien stockage de connaissance (recensement du 2026-11-02)

**But.** La **liste de contrôle d'entrée de la ligne 7a du chantier** (cf. `hsg-architecture.md`) : avant de
supprimer l'ancien chemin, chacun de ces points d'entrée doit lire le JOURNAL. Si un seul est oublié, 7a
supprime l'ancien stockage alors qu'un lecteur en dépend encore → il ne casse pas forcément, il sert des
données périmées ou vides (le piège silencieux).

**Stores legacy visés :** `my_profile` (colonnes de connaissance : `temperament_axes`, `temperament_modes`,
`attention_reception`, `attention_expression`, `relational_filters`, `lifestyle_answers`, `lifestyle_axes`,
`singularity_answers`, `discovery_answers`, `dimension_scores`, `practical_info`, `gift_wishlist`, +
`PROFILE_ROW_SELECT`) ; `questionnaire_responses` (réponses proche/incognito, direct **ou imbriqué** via
`contacts.select("*, questionnaire_responses(*)")`) ; **`profile_analysis` — le BLOB legacy** que la ligne 4
remplace par `profile_analysis_sections` (le blob n'est PAS le bon chemin : c'est l'ancien sous un autre nom).

**Méthode.** Recensement statique (`from()` direct + selects imbriqués + usage de `PROFILE_ROW_SELECT`).
Les libs de **transformation** (`sheet-data`, `v2-data`, `reconstruct-*`, `canonical-*`, `produce-*`) sont
**en aval** — elles reçoivent la ligne, ne requêtent pas — donc hors liste ; elles suivent leurs appelants.

### A — LECTEURS DE CONNAISSANCE à basculer sur le journal — **38** (la fiche proche `/contacts/[id]` EN PREMIER, cf. §3.6)

`[*]` = `select('*')` sur `my_profile` → lit toute la ligne, dépendance connaissance à confirmer au câblage.

**Pages / écrans (17)**
- [ ] `src/app/contacts/[id]/page.tsx` — **fiche proche (EN PREMIER)** — my_profile + qr-imbriqué + profile_analysis(blob)
- [ ] `src/app/moi/page.tsx` — my_profile + profile_analysis(blob)
- [ ] `src/app/moi/partage/page.tsx` — my_profile (PROFILE_ROW_SELECT)
- [ ] `src/app/moi/partage/apercu/page.tsx` — my_profile + profile_analysis(blob)
- [ ] `src/app/moi/discovery/page.tsx` — profile_analysis(blob)
- [ ] `src/app/fiche/[consentId]/page.tsx` — my_profile + profile_analysis(blob)
- [ ] `src/app/recherche/page.tsx` — my_profile (PROFILE_ROW_SELECT)
- [ ] `src/app/proche/[id]/page.tsx` — my_profile + profile_analysis(blob)
- [ ] `src/app/contacts/page.tsx` — qr-imbriqué
- [ ] `src/app/contacts/partage/[consentId]/page.tsx` — profile_analysis(blob)
- [ ] `src/app/dashboard/page.tsx` — my_profile + qr-imbriqué
- [ ] `src/app/moi/questionnaire/page.tsx` — my_profile `[*]`
- [ ] `src/app/moi/questionnaire/QuestionnaireFlow.tsx` — my_profile (préremplissage)
- [ ] `src/app/contacts/[id]/questionnaire/page.tsx` — qr
- [ ] `src/app/parametres/compte/page.tsx` — my_profile (practical_info)
- [ ] `src/app/parametres/compte/CompteActions.tsx` — my_profile (practical_info)
- [ ] `src/components/questionnaire/QuestionnaireForm.tsx` — qr

**Routes API (17)**
- [ ] `src/app/api/recommendations/generate/route.ts` — **moteur de reco au STRICT MINIMUM** (va chercher dans le journal, pas de réécriture) — my_profile + qr-imbriqué
- [ ] `src/app/api/suggestions/route.ts` — qr-imbriqué
- [ ] `src/app/api/idea-suggestions/route.ts` — qr-imbriqué
- [ ] `src/app/api/invite/nudge/route.ts` — my_profile
- [ ] `src/app/api/profile-view/lookup/route.ts` — my_profile (PROFILE_ROW_SELECT)
- [ ] `src/app/api/profile-view/request/route.ts` — my_profile (PROFILE_ROW_SELECT)
- [ ] `src/app/api/share-link/create/route.ts` — my_profile (PROFILE_ROW_SELECT)
- [ ] `src/app/api/discovery/answer/route.ts` — my_profile (practical_info)
- [ ] `src/app/api/profile/practical/route.ts` — my_profile (practical_info)
- [ ] `src/app/api/emails/questionnaire-invite/route.ts` — my_profile (practical_info)
- [ ] `src/app/api/confidences/route.ts` — my_profile + qr
- [ ] `src/app/api/profil/submit/route.ts` — qr
- [ ] `src/app/api/profile-updates/[id]/route.ts` — qr
- [ ] `src/app/api/contacts/[id]/consent/route.ts` — profile_analysis(blob)
- [ ] `src/app/api/analyse/route.ts` — my_profile `[*]` + qr-imbriqué
- [ ] `src/app/api/account/export/route.ts` — my_profile `[*]` + qr-imbriqué
- [ ] `src/app/api/account/export-download/route.ts` — my_profile `[*]` + qr-imbriqué

**Libs / moteurs (requêtent directement) (4)**
- [ ] `src/lib/profile/generateProfileAnalysis.ts` — **le plus gros** (écrit le blob, lit my_profile) — c'est le cœur de la ligne 4
- [ ] `src/lib/discovery/engine.ts` — my_profile
- [ ] `src/lib/signals/generator.ts` — my_profile + qr
- [ ] `src/lib/signals/detector.ts` — my_profile + qr-imbriqué

*(17 + 17 + 4 = 38 fichiers distincts. Les tags « my_profile + qr + … » montrent qu'un même fichier lit souvent plusieurs stores.)*

### B — my_profile INFRA-SEULE — **15** — PAS la cible (ces colonnes restent)

Lisent `my_profile` pour abonnement / cadence / handle / notifications / cycle de vie / suppression — colonnes
d'infrastructure qui **survivent** à la mort de la projection. À **re-vérifier** quand même pour les
`select('*')` au câblage de 7a (un `*` pourrait masquer un usage de colonne de connaissance).
account/cancel-deletion · cadence/auto-adjust · cron/detect-and-generate · cron/lifecycle-check ·
handle/check · subscription/pause · subscription/resume · parametres/abonnement · parametres/confidentialite ·
parametres/notifications · components/dashboard/OnboardingProgressCard · lib/cadence/resolver ·
lib/lifecycle/track-activity · lib/notifications/email-reminder · lib/notifications/push-sender

### C — ÉCRITURE-seule — **13** — retirées en 7a mais ce ne sont pas des lecteurs

account/delete · handle · parametres/cadence · parametres/notifications · profile/art9 · profile/avatar ·
IncognitoFlow · IncognitoFlowCanonical · register · onboarding/OnboardingFlow · profile/GenderModal ·
questionnaire/AttentionStep · questionnaire/GenderStep

---

## État réel des migrations (vérifié en base le 2026-11-02)

90→95 toutes **appliquées** (journal `applied_migrations` + sondes de colonnes). 96 écrite, à appliquer par
Estelle. Détail et méthode : voir la mémoire `project_migration_journal`. (Rappel : ne jamais interroger la
base par une route — script CLI qu'Estelle lance elle-même.)
