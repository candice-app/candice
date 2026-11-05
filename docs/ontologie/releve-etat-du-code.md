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
données **périmées ou vides** (le piège silencieux).

**MÉTHODE (robuste, par allowlist — corrigée le 2 nov).** On ne liste PAS « les colonnes de connaissance »
(impossible à tenir exhaustive — `my_profile` a 76 colonnes, et une oubliée fait rater un lecteur). On fait
l'inverse : **une allowlist d'INFRA courte, et TOUT le reste de `my_profile` = connaissance.** On échoue du
côté sûr : un lecteur de trop vérifié, jamais un oublié. Stores visés :
- `my_profile` — toute colonne **hors** allowlist infra (voir seau B) ;
- `questionnaire_responses` — réponses proche/incognito, **direct** ou **imbriqué** (`contacts.select("*, questionnaire_responses(*)")`, noté `qr~`) ;
- **`profile_analysis` — le BLOB legacy** que la **ligne 4** remplace par `profile_analysis_sections`. Ce n'est pas le bon chemin : c'est l'ancien sous un autre nom. Piège : le jour où la ligne 4 écrit les sections, ces lecteurs servent un blob que plus personne n'alimente → suggestions périmées/vides.

Les libs de **transformation** (`sheet-data`, `v2-data`, `reconstruct-*`, `canonical-*`, `produce-*`) sont
**en aval** — elles reçoivent la ligne, ne requêtent pas — donc hors liste ; elles suivent leurs appelants.

### A — LECTEURS DE CONNAISSANCE à basculer sur le journal — **38** (la fiche proche `/contacts/[id]` EN PREMIER, cf. §3.6)

Stores lus en tag. `[SELECT *]` = `select('*')` sur `my_profile` → **point nommé de la condition d'entrée au
même titre que les autres** : coché seulement après avoir confirmé au câblage s'il dépend d'une colonne de
connaissance (ce n'est pas une note qu'on oublie, c'est une case).

**Pages / écrans (17)**
- [ ] `src/app/contacts/[id]/page.tsx` — **fiche proche (EN PREMIER)** · blob + my_profile + qr~
- [ ] `src/app/moi/page.tsx` · blob + my_profile
- [ ] `src/app/moi/partage/page.tsx` · my_profile
- [ ] `src/app/moi/partage/apercu/page.tsx` · blob + my_profile
- [ ] `src/app/moi/discovery/page.tsx` · blob
- [ ] `src/app/fiche/[consentId]/page.tsx` · blob + my_profile
- [ ] `src/app/recherche/page.tsx` · my_profile
- [ ] `src/app/proche/[id]/page.tsx` · blob + my_profile
- [ ] `src/app/contacts/page.tsx` · qr~
- [ ] `src/app/contacts/partage/[consentId]/page.tsx` · blob
- [ ] `src/app/dashboard/page.tsx` · qr~
- [ ] `src/app/moi/questionnaire/page.tsx` · my_profile `[SELECT *]`
- [ ] `src/app/contacts/[id]/questionnaire/page.tsx` · qr
- [ ] `src/app/parametres/compte/page.tsx` · my_profile (date_de_naissance, practical_info)
- [ ] `src/app/parametres/compte/CompteActions.tsx` · my_profile (practical_info)
- [ ] `src/components/dashboard/OnboardingProgressCard.tsx` · my_profile (diet, food_allergies, clothing_size, shoe_size) — *raté au 1er recensement, rattrapé par la méthode allowlist*
- [ ] `src/components/questionnaire/QuestionnaireForm.tsx` · qr

**Routes API (17)**
- [ ] `src/app/api/recommendations/generate/route.ts` — **moteur de reco au STRICT MINIMUM** (va chercher dans le journal, pas de réécriture) · my_profile + qr~
- [ ] `src/app/api/suggestions/route.ts` · qr~
- [ ] `src/app/api/idea-suggestions/route.ts` · qr~
- [ ] `src/app/api/invite/nudge/route.ts` · my_profile
- [ ] `src/app/api/profile-view/lookup/route.ts` · my_profile (PROFILE_ROW_SELECT)
- [ ] `src/app/api/profile-view/request/route.ts` · my_profile (PROFILE_ROW_SELECT)
- [ ] `src/app/api/share-link/create/route.ts` · my_profile (PROFILE_ROW_SELECT)
- [ ] `src/app/api/discovery/answer/route.ts` · my_profile
- [ ] `src/app/api/profile/practical/route.ts` · my_profile
- [ ] `src/app/api/emails/questionnaire-invite/route.ts` · my_profile
- [ ] `src/app/api/confidences/route.ts` · qr (+ my_profile)
- [ ] `src/app/api/profil/submit/route.ts` · qr
- [ ] `src/app/api/profile-updates/[id]/route.ts` · qr
- [ ] `src/app/api/contacts/[id]/consent/route.ts` · blob
- [ ] `src/app/api/analyse/route.ts` · my_profile `[SELECT *]` + qr~
- [ ] `src/app/api/account/export/route.ts` · my_profile `[SELECT *]` + qr~
- [ ] `src/app/api/account/export-download/route.ts` · my_profile `[SELECT *]` + qr~

**Libs / moteurs (requêtent directement) (4)**
- [ ] `src/lib/profile/generateProfileAnalysis.ts` — **le cœur de la ligne 4** (lit my_profile, écrit le blob)
- [ ] `src/lib/discovery/engine.ts` · my_profile
- [ ] `src/lib/signals/generator.ts` · my_profile + qr
- [ ] `src/lib/signals/detector.ts` · my_profile + qr~

*(17 + 17 + 4 = 38 fichiers distincts. Un même fichier lit souvent plusieurs stores.)*

**Les 4 `[SELECT *]` (points de condition d'entrée, à confirmer au câblage) :** `moi/questionnaire/page.tsx`,
`api/analyse`, `api/account/export`, `api/account/export-download`.

### B — my_profile INFRA-SEULE — **14** — PAS la cible (ces colonnes restent)

**Allowlist INFRA** (colonnes de `my_profile` qui survivent à la mort de la projection) : `id`, `user_id`,
`created_at`, `subscription_status`, `subscription_paused_at`, `cancelled_at`, `trial_started_at`,
`lifetime_trial`, `deletion_scheduled_at`, `handle`, `is_findable`, `avatar_path`, `phone`,
`notif_email_enabled`, `notif_push_enabled`, `notif_max_per_day`, `notif_quiet_hours_start`,
`notif_quiet_hours_end`, `cadence_preference`, `questionnaire_input_mode`, `last_active_at`, `silent_since`,
`onboarding_completed`, `pilote_difficult_period_until`, `pilote_last_achievement_at`.

> **Note cadence (précision Estelle 2 nov).** `cadence_preference` = **fréquence des relances que Candice
> envoie au pilote** (réglage produit) → infra. Ce n'est PAS `affection_cadence` (à quelle fréquence la
> personne veut *recevoir* de l'attention) : cette dernière est une **connaissance** et vit dans le JOURNAL,
> pas comme colonne de `my_profile` (aucune colonne de ce nom n'existe sur la table).

> **Colonne qui MEURT en 7b — ni infra, ni à migrer (décision Estelle, 2 nov).** `grammatical_gender` ne va
> **nulle part** : le prompt maître (§36 / §824, et §5 des consignes) tranche que toute l'application s'écrit
> en formulations naturellement neutres et que **les accords ne dépendent jamais de ce champ**. Il n'est donc
> ni dans l'allowlist infra, ni un lecteur de connaissance à basculer : il rejoint la **liste des colonnes
> supprimées à la ligne 7b** (comme `my_profile` et les colonnes legacy). Le genre éventuellement demandé en
> début de profil n'est pas une source de personnalisation grammaticale.

Lecteurs infra-seule (lisent `my_profile` uniquement pour l'allowlist, et ne lisent ni qr ni blob) :
`api/account/cancel-deletion` · `api/cadence/auto-adjust` · `api/cron/detect-and-generate` ·
`api/cron/lifecycle-check` · `api/handle/check` · `api/subscription/pause` · `api/subscription/resume` ·
`parametres/abonnement` · `parametres/confidentialite` · `parametres/notifications` · `lib/cadence/resolver` ·
`lib/lifecycle/track-activity` · `lib/notifications/email-reminder` · `lib/notifications/push-sender`.

### C — ÉCRITURE-seule — **13** — retirées en 7a mais ce ne sont pas des lecteurs

`api/account/delete` · `api/handle` · `api/parametres/cadence` · `api/parametres/notifications` ·
`api/profile/art9` · `api/profile/avatar` · `contacts/[id]/questionnaire/IncognitoFlow` ·
`contacts/[id]/questionnaire/IncognitoFlowCanonical` · `register` · `onboarding/OnboardingFlow` ·
`profile/GenderModal` · `questionnaire/AttentionStep` · `questionnaire/GenderStep`.

---

## État réel des migrations (vérifié en base le 2026-11-02)

**97 ÉCRITE, à appliquer par Estelle** (`supabase-migration-97-affirmations-scope.sql`) : `affirmations JSONB`
+ `scope` sur `profile_analysis_sections`, index GIN inverse, CHECK union exacte. Tant qu'elle n'est pas
appliquée, l'écriture des sections (`storeSelfSections`) échoue (colonnes absentes) → **la vérif Sophie attend 97**.

**Supersession 3ᵉ forme (5 nov) — LIVRÉ (primitives) :** migration **98** (à appliquer) ajoute
`knowledge_sources.correction_event_id` + index partiel. `correctionEventId` threadé par `createSourceRecord`
/`SourceRecord`/`sourceToRow` (et `extract-free-text` lib+route). Nouvelles primitives `oldSelfSourceIdsForCorrection`
+ `supersedePriorVersions` (`supersede.ts`) : supersède les sources vivantes self free-text de la question SAUF
celles portant l'id de correction courant ; `superseded_by` = source DÉCLARÉE. `created_at` = `DEFAULT now()`
DB confirmé (`sourceToRow` n'écrit que `ts`). Testé (4 cas). **RESTE** : invoquer `supersedePriorVersions` au
point d'écriture du verbatim déclaré (= `produceSocleFact` dans `QuestionnaireFlow.tsx`, PINNÉ — voir
recensement écrivains) + le client qui tire l'uuid à CHAQUE écriture (règle d'émission 5 nov) et l'envoie aux
deux écritures ; threader `correctionEventId` dans `produceSocleFact`/`produceSocleAnswer` (fait pour
`extract-free-text`).

## Recensement des ÉCRIVAINS (2026-11-05) — par voie

⚠ **CORRECTION D'UNE ERREUR À MOI (5 nov).** J'avais écrit (3 nov) que « le socle déclaré n'atteint pas le
journal en production ». **FAUX.** Cause : `grep` est une fonction shell et saute les fichiers que `file`
classe « binaires » ; **`src/app/moi/questionnaire/QuestionnaireFlow.tsx` (le flux pilote vivant) est classé
« data »** → tous mes greps l'ont sauté en silence. Lu avec `grep -a`/Read : il écrit bien le socle déclaré
(fermé ET verbatim) au journal. Seuls 2 fichiers src sont « binaires » (ce flux + un test) → le recensement
des 38 lecteurs n'est pas affecté (QuestionnaireFlow est un écrivain, pas un lecteur de connaissance).

| Voie | Point d'écriture (fichier:ligne) | Prod ? | Écrit | question_code | correction_event_id | provenance |
|---|---|---|---|---|---|---|
| Socle déclaré (fermé) — attention | `AttentionStep.tsx:251-254` (`produceSocleAnswer`) + legacy `AttentionStep.tsx:227` | **oui** (flag `true`) | journal **+** legacy my_profile | oui | non | declared (niv.1) |
| Socle déclaré (fermé) — tempérament | `QuestionnaireFlow.tsx:55` (`produceSocleAnswer`) + legacy `:462/:521` | **oui** | journal **+** legacy my_profile | oui | non | declared |
| Socle déclaré (fermé) — lifestyle | `QuestionnaireFlow.tsx:127` (`produceSocleAnswer`) + legacy `:590/:668` | **oui** | journal **+** legacy my_profile | oui | non | declared |
| Texte libre — VERBATIM déclaré | `QuestionnaireFlow.tsx:86` (q17), `:725` (singularité), `:825` (pratique) (`produceSocleFact`) + legacy my_profile | **oui** | journal **+** legacy my_profile | oui | non | declared |
| Texte libre — INFÉRÉ | route `extract-free-text` ← `QuestionnaireFlow.tsx:93,:732` | **oui** | journal seul | oui | **accepté** (route), pas encore envoyé par le client | inferred (niv.5) |
| Incognito (proche) | `IncognitoFlowCanonical.tsx:59` (`persistIncognitoAnswer`) + legacy `:78` | **oui** (flag `true`) | journal **+** legacy questionnaire_responses | oui (I-codes) | s.o. (voie tierce, hors scope supersession) | reported (rapporteur) |

**Écritures SANS appelant de production (isolées) :**
- **Côte-à-côte** (`declared_via_relative`, `MODE2_SOURCE_TYPE` `sources.ts:48`) : **défini, AUCUN écrivain** — non implémenté (l'UI proche dit « dès que X aura son profil »).
- **`writeDouble`** (`double-write.ts:32`) : **aucun appelant de prod** — la double-écriture est faite À LA MAIN dans `QuestionnaireFlow`/`AttentionStep` (legacy upsert PUIS journal, l'échec journal seulement loggué). ⚠ La garantie « journal d'abord, sinon pas de projection » (règle 1 de double-write) **n'est donc PAS en vigueur** : le legacy est écrit AVANT le journal, et un échec journal ne bloque pas le legacy. Divergence silencieuse possible. À remonter avant 7a.
- **`IncognitoFlow.tsx`** (legacy, saveStage1/2/3 → questionnaire_responses) + Steps non montés via ce chemin : **code mort** (flag incognito `true` → `IncognitoFlowCanonical` seul monté). Meurt en 7a.

**Conséquence pour la ligne 4 :** le journal reçoit les 5 domaines self déclarés en prod → la génération Sophie
sera nourrie partout (pas « maigre »). Le vrai défaut n'est pas l'écriture du socle (elle existe) mais : (a) la
double-écriture non atomique (ordre inversé) ; (b) le verbatim déclaré et l'inféré ne portent pas encore
`correction_event_id` → aucune supersession ne tourne à la correction aujourd'hui (append pur).

**Ligne 4 — état (3 nov).** Construit + testé + build vert : traçabilité à l'affirmation (`source_id` porté
jusqu'à `MatterItem.sourceIds`), orchestration `generate-sections.ts` (règle d'ensemble vide : affirmation sans
source retirée + log bruyant ; union exacte), caller Anthropic + `storeSelfSections` (tampon `scope='self'`),
point d'entrée `regenerateSelfSections`. **RESTE** : (1) câblage supersession à la correction — BIFURCATION RÉSOLUE par la 3ᵉ forme (migration 98,
`supersedePriorVersions`) ; reste à l'INVOQUER au point d'écriture déclaré (`QuestionnaireFlow`, pinné) + client
qui tire l'uuid ; (2) déclencheur de réécriture paresseuse à l'ouverture (couplé à l'affichage, ligne 5/6) ;
(3) correctif ENTITY à vérifier au rendu ; (4) vérif Sophie (gated sur 97+98 appliquées). `generateProfileAnalysis`
écrit TOUJOURS le blob legacy en parallèle (retrait = ligne 7). *(La note « double-write câblé au seul chemin
test/Sophie » du 3 nov était FAUSSE — grep sautait QuestionnaireFlow « binaire » ; voir recensement écrivains.)*

90→96 toutes **appliquées** (journal `applied_migrations` + sondes de colonnes ; 96 confirmée appliquée par
Estelle le 2 nov). Détail et méthode : voir la mémoire `project_migration_journal`. (Rappel : ne jamais
interroger la base par une route — script CLI qu'Estelle lance elle-même.)
