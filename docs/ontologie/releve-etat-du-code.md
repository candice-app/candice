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

**97 APPLIQUÉE** (Estelle, 5 nov ; `supabase-migration-97-affirmations-scope.sql`) : `affirmations JSONB`
+ `scope` sur `profile_analysis_sections`, index GIN inverse, CHECK union exacte. La vérif Sophie peut tourner.

**Supersession 3ᵉ forme (5 nov) — LIVRÉ (primitives) :** migration **98 APPLIQUÉE** (Estelle, 5 nov) ajoute
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

**POURQUOI `QuestionnaireFlow.tsx` est classé « data » (5 nov).** Un octet **NUL (`0x00`)** à la ligne 747,
inséré DÉLIBÉRÉMENT entre `${question_text}` et `${raw_text}` comme séparateur de clé composite (le test
`field-extraction.test.ts` le documente : « séparateur null »). Ce n'est pas un octet parasite — c'est un
sentinel voulu. Conséquence : `grep`, `file`, certains éditeurs et diffs le traitent en binaire. Les 2 seuls
fichiers src « data » sont ce flux + ce test. **Décision de la suite = Estelle** (garder le NUL, ou le remplacer
par un sentinel imprimable).

**RE-JEU du recensement des lecteurs avec `-a` (5 nov) — PROUVÉ, pas déduit.** `grep -a` sur les 3 stores
legacy (`my_profile|questionnaire_responses|profile_analysis`) ajoute **exactement 1** fichier au set vu par
`grep` nu : `QuestionnaireFlow.tsx`, et il n'y touche que par `.upsert` (8 écritures, **zéro `.select`**) → c'est
un ÉCRIVAIN de projection, pas un lecteur. L'autre fichier binaire (`field-extraction.test.ts`) ne cite aucun
store legacy. **→ le compte des 38 lecteurs ne bouge pas : il reste 38.**

**RÈGLE DE MÉTHODE PERMANENTE (5 nov).** Tout recensement futur utilise `grep -a` (ou une lecture directe),
JAMAIS `grep` nu, et **annonce dans son résultat, en une ligne, le nombre de fichiers classés binaires** par
`file`. Un `grep` nu saute les binaires en silence : tout recensement rendu par `grep` nu est suspect.

| Voie | Point d'écriture (fichier:ligne) | Prod ? | Écrit | question_code | correction_event_id | provenance |
|---|---|---|---|---|---|---|
| Socle déclaré (fermé) — attention | `AttentionStep.tsx:251-254` (`produceSocleAnswer`) + legacy `AttentionStep.tsx:227` | **oui** (flag `true`) | journal **+** legacy my_profile | oui | non | declared (niv.1) |
| Socle déclaré (fermé) — tempérament | `QuestionnaireFlow.tsx:55` (`produceSocleAnswer`) + legacy `:462/:521` | **oui** | journal **+** legacy my_profile | oui | non | declared |
| Socle déclaré (fermé) — lifestyle | `QuestionnaireFlow.tsx:127` (`produceSocleAnswer`) + legacy `:590/:668` | **oui** | journal **+** legacy my_profile | oui | non | declared |
| Texte libre — VERBATIM déclaré | `QuestionnaireFlow.tsx:86` (q17), `:725` (singularité), `:825` (pratique) (`produceSocleFact`) + legacy my_profile | **oui** | journal **+** legacy my_profile | oui | non | declared |
| Texte libre — INFÉRÉ | route `extract-free-text` ← `QuestionnaireFlow.tsx:93,:732` | **oui** | journal seul | oui | **accepté** (route), pas encore envoyé par le client | inferred (niv.5) |
| Incognito (proche) | `IncognitoFlowCanonical.tsx:59` (`persistIncognitoAnswer`) + legacy `:78` | **oui** (flag `true`) | journal **+** legacy questionnaire_responses | oui (I-codes) | s.o. (voie tierce, hors scope supersession) | reported (rapporteur) |

**Écritures SANS appelant de production (isolées) :**
- **Côte-à-côte** (`declared_via_relative`, `MODE2_SOURCE_TYPE` `sources.ts:48`) : **défini, AUCUN écrivain** — non implémenté (l'UI proche dit « dès que X aura son profil »). ⚠ Conséquence : le test côte-à-côte « cas Julie » (`supersession-correction.test.ts`) garde un cas INATTEIGNABLE en prod — il passe au vert en prouvant le filtre unitaire, pas une réalité. Renommé **`vide_jusqu_a_7bis`** ; **à REJOUER contre de vraies lignes côte-à-côte quand la voie sera câblée (7bis)**. (Un 2ᵉ test côte-à-côte Julie existe dans `supersession.test.ts`, mais il garde la primitive DÉPRÉCIÉE `liveSelfSourceIdsForQuestion` et meurt avec elle — lot dédié.)
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

## Lot DOUBLE-ÉCRITURE — option C (décision Estelle 5 nov)

**Cadre.** Ni A (ordre seul) ni B (transaction + rapatriement projection). **C = atomicité du JOURNAL seul.**
Découverte déclencheuse : `persistKnowledge` fait **4 `.insert()` séparés** → une source peut atterrir sans ses
evidences = **corruption de l'autorité** (le seul dégât qui survit à la 7b). La projection `my_profile` reste où
elle est (hors transaction) : une projection se **reconstruit**, elle ne se perd pas.

**Ordre (verrouillé) :** 1) RPC `persist_journal` (4 inserts → 1 commit) — *migration écrite, Estelle applique* ;
2) `writeDouble` câblé par-dessus (journal d'abord, projection après, `DivergenceError` si projection KO) ;
3) retry + message doux, **texte relu avant d'être posé** ; 4) *puis seulement* émission uuid à chaque écriture
+ invocation supersession.

**Migration 99 ÉCRITE, à appliquer par Estelle** (`supabase-migration-99-persist-journal.sql`) :
`CREATE FUNCTION public.persist_journal(p_source, p_evidences, p_facts, p_open jsonb)`, `SECURITY INVOKER`
(RLS owner-only inchangé, zéro service_role, zéro route), mapping canonique **reste en TS** (fonction = pur
perséiteur JSONB). `created_at` **non inséré** → DEFAULT now() ; `ts` inséré. Colonnes = exactement `rows.ts`.
`GRANT EXECUTE` à **`authenticated` seul** (pas `service_role` : il contourne le RLS → chemin sans propriétaire).
**ON CONFLICT (id) DO NOTHING** sur les 4 inserts (ids générés client → collision = même écriture logique →
retry idempotent : une file locale qui repousse après un commit non confirmé devient un no-op, jamais un faux
échec ; c'est ce qui rend `RETURNS void` honnête). **user_id FORCÉ à `auth.uid()`** (jamais le JSON) : user_id =
AUTEUR (identity.ts « DÉTENTEUR »), `about` = sujet ; ceinture+bretelles au-dessus du RLS `WITH CHECK
(user_id = auth.uid())` des 4 tables (migration 82), n'affecte pas l'incognito (qui fait varier `about`).
`search_path = public` (sans `pg_temp`). Additive : **rien ne l'appelle tant que `persistKnowledge` n'est pas
recâblé** (migration-first). **Garde-fou dérive TS→SQL : `scripts/persist-journal-roundtrip.mts`** (POST-APPLY,
auth comme Sophie) clone de vrais jeux, les repousse par la fonction, relit et compare chaque colonne.
**RESTE (gated sur apply) :** recâbler `persistKnowledge` (N inserts → **un seul** `rpc`), étendre `WriteClient`
(+`.rpc`) et les fakes, câbler `writeDouble`, retry+texte.

**FK vers knowledge_sources — ÉTABLIE (pas déduite), confirme l'utilité de la 99.** `knowledge_evidences.source_id`
→ `knowledge_sources(id)` NOT NULL ON DELETE CASCADE (82:57) **+** composite `(source_id, about_kind, about_id)`
(83:96) ; `knowledge_facts.source` (82:120 + 83:103) ; `knowledge_open_knowledge.source` (82:154 + 83:106).
**Aucun DROP** de ces FK dans les migrations (les seuls drops en 83 sont les `contact_id_fkey` du refactor
about-ref). Donc une evidence au `source_id` erroné est refusée (about compris) → dans la transaction de la 99,
rollback total. La 99 ferme « source manquante » ET « source ne correspond pas ». **Pas de migration FK à écrire.**

**service_role sur persist_journal : conséquence à traiter au recâblage.** `sophie-garnish.mts` écrit le journal
via le client ADMIN (service_role). Grant retiré → au recâblage, garnish devra s'authentifier COMME Sophie
(`signInWithPassword`, rôle `authenticated`) pour appeler `persist_journal`. Lifecycle user (create/delete) reste
admin. Noté, non bloquant (rien n'appelle la fonction aujourd'hui).

**Proportionnalité §30.2 — DIAGNOSTIC DE CAUSE (5 nov, `scripts/sophie-prop-diagnose.mts`, lecture seule).** Le
compteur mesure les SOURCES distinctes (`source_evidence_ids`) ; re-mesuré sur les EVIDENCES (constructs) :
`deep_loved` 10 aff / **21 ev** et `deep_miss` 3 aff / **3 ev** → **conformes, faux positifs du compteur** (une
réponse fermée produit légitimement plusieurs constructs : « simplicité authentique » → simplicité + authenticité ;
+ une affirmation de convergence §30.1). `univers_marques` et `univers_reves` : 3 aff / **0 ev** → **vraies
violations**, cas « sous-découpage extraction » : source `onboarding_open` verbatim (3 items / 2 envies dans une
ligne) ayant produit ZÉRO evidence ; les entités réelles existent sous des sources d'EXTRACTION non câblées dans
la matière de ces sections. **Aucune sur-lecture du générateur.**

**Re-base FAITE (5 nov) + contrôle ZÉRO EVIDENCE + exemption CONVERGENCE bornée.** Dénominateur re-basé sur les
**evidences distinctes de la matière** (`MatterItem.fromFact` marque les items verbatim ; dénominateur = items
non-fact). Contrôle « zéro evidence résolue » (affirmations sur verbatim non extrait → log bruyant, branche
`else if`). **Exemption convergence (décision Estelle 5 nov) :** une affirmation citant ≥2 evidences de type
`tendance`|`implication` (jamais `declaration`) ne compte pas au plafond, **au plus UNE exemptée** (les suivantes
comptent → pas de gaming ; pas de règle dure « >1 convergence » qui faux-flaggerait une section riche sous budget).
Mesuré (déterministe, `sophie-sections-dump.mts`) sur les 17 : **proportionnalité = 0** (`deep_miss` au vert par
l'exemption, `deep_loved` au vert par la re-base) ; **zéro evidence = 2** (`univers_marques`, `univers_reves`).
**EN ATTENTE :** câblage amont des `univers_*` (ci-dessous) — « montre-moi avant de faire ».

**Lot `univers_*` RÉDUIT À PRESQUE RIEN (5 nov).** Les sources d'EXTRACTION portent `question_code` = la clé du
champ libre (`SINGULARITY_FACT_FIELDS[fieldKey].factType` = `singularity.marques_lieux` / `singularity.envies_reves`,
= même clé stable que le verbatim ; `extract-free-text.ts:110`, `QuestionnaireFlow onExtractField`). **Le lien
existe déjà** → PAS de lot extraction. Le câblage se réduit à : (1) exposer `question_code` sur le tag résolu
(`readSocleTags` joint `knowledge_sources`) ; (2) un sélecteur `SECTION_SPECS` (kind `questionCode`) qui tire les
evidences dont la source porte ce code. Entièrement dans la couche read/génération. Gated sur le go d'Estelle.

**Migration 99 — GARDE D'IDENTITÉ DE SOURCE ajoutée (5 nov).** `ON CONFLICT (id) DO NOTHING` est silencieux : un
id de source appartenant à AUTRUI passerait sans bruit, et les evidences s'accrocheraient à une source invisible
à l'appelant (provenance illisible = autorité corrompue). Après l'insert source : `PERFORM 1 FROM knowledge_sources
WHERE id = … AND user_id = v_uid` → sinon `RAISE`. Le RLS ne rend visibles que les siennes → source étrangère =
NOT FOUND = échec bruyant + rollback. DOCTRINE à graver : **DO NOTHING, JAMAIS DO UPDATE** (journal append-only ;
une correction = nouvelle ligne + supersession, jamais dernier-arrivé-gagne).

**Proportionnalité §30.2 — DÉFAUT, pas ton (décision Estelle 5 nov).** Règle : *une section ne publie jamais
plus d'affirmations que d'evidences DISTINCTES*. Détecteur `proportionalityViolation` (pur, testé) + log bruyant
dans `resolveAffirmations` (**non mutant** : la stratégie de réduction — relance plafonnée / fusion / retrait
des moins soutenues — est une décision produit EN ATTENTE). Mesuré sur Sophie : **4 / 17 en violation** —
`deep_loved` (10>9), `deep_miss` (3>2), `univers_marques` (3>1), `univers_reves` (3>1). Pas encore de CHECK DB
(elle casserait la génération sur ces 4 tant que l'enforcement n'existe pas).

**NUL → jeton imprimable (fait).** Le séparateur de clé composite `\u0000` (ligne 747 + `doneKey`) est remplacé
par `FIELD_KEY_SEP = '__CANDICE_KEYSEP__'` (source unique, exportée de `field-extraction.ts`). **Non persisté**
(clé en mémoire, reconstruite de `question_text`/`raw_text` ; `ResumePrompt` ne stocke qu'un brouillon
my_profile) → **aucune migration**. Effet : **0 fichier src classé binaire** (les 2 seuls le devaient à ce NUL)
→ la règle méthode `grep -a` reste, mais le piège est retiré à la source.

**resolve vs supersede — distinction à garder (facile à oublier).** Sophie : 76 evidences → 56 tags résolus par
**préséance/récence** (chemin `resolve` PROUVÉ). Le chemin `supersede` n'est PAS encore exercé (aucun
`correction_event_id` porté — gated derrière le chemin d'écriture, étape 4 de l'ordre).

**2ᵉ test Julie marqué.** `supersession.test.ts` (primitive dépréciée `liveSelfSourceIdsForQuestion`) porte
aussi `vide_jusqu_a_7bis` ; meurt avec sa primitive.

---

## LIGNE 5 — premier éclat (lecteur owner-only des sections du journal) + constat deux-moteurs (5 nov)

**DEUX MOTEURS D'ANALYSE COEXISTENT, et c'est l'hérité qu'on lit.** Constat du diagnostic « fiche Sophie vide ».

- **Moteur hérité** `generateProfileAnalysis.ts` → écrit `profile_analysis` (singulier). Matière = `my_profile`
  (+ `memories`), JAMAIS le journal. **Zéro traçabilité** : la ligne porte du narratif (`summary`, `sections:{text,chips,more}`,
  `modes`…), aucun `evidence_ids`, aucune affirmation adossée. **Tourne en PROD** : appelé fire-and-forget par
  `/api/profile/generate` (après chaque partie du questionnaire), `/api/discovery/answer`, `/api/memories/situation`,
  et déclenché au montage de `/moi` (`GenerateAnalysisOnMount` quand `attention_reception && !analysis`).
- **Moteur journal** (ligne 4) `generate-sections.ts`/`storeSelfSections` → écrit `profile_analysis_sections` (pluriel).
  Matière = `knowledge_*`. Porte la traçabilité à l'affirmation (`[{id,type,text,evidence_ids}]`), les 4 niveaux §30.1,
  la proportionnalité, le zéro-evidence, l'exemption convergence. **Rien ne le rend** (0 lecteur applicatif avant ce lot).
- **La fiche `/moi` lit le couple hérité** `my_profile` + `profile_analysis`. Tout ce qu'on affine depuis des semaines
  s'applique au moteur que personne ne voit.
- **CONSÉQUENCE SUR 7a** : ce n'est pas seulement « migrer 38 lecteurs », c'est **débrancher un moteur vivant** qui
  produit aujourd'hui ce que les gens lisent. Périmètre élargi — à acter avant 7a.

**Lecteur owner-only `/moi/sections` (fait — `src/app/moi/sections/page.tsx`).** Décision Estelle : ce n'est pas du
debug, c'est le plus petit morceau utile du rendu de la ligne 5. Composant serveur, client RLS de l'appelant
(`pas_owner`, migration 92 : `FOR ALL USING auth.uid()=user_id`), **zéro client admin, aucune route à droits élargis**.
Rendu brut, aucun design (la maquette gelée viendra plus tard). Rend les **trois exigences** : (1) texte de chaque
section ; (2) par affirmation, ses evidence ids + le verbatim derrière (résolu via `knowledge_sources`
question_text/answer_text/raw_text, owner-only) ; (3) le niveau d'interprétation (déclaration/tendance/hypothèse/
implication, libellés §30.1). Le niveau est le point jamais vérifié : les dumps prouvent qu'il est *posé*, pas qu'il se
*lit* juste — seule Estelle peut le dire en lisant.
**Vérif du chemin owner-only** (`scripts/sophie-sections-reader-check.mts`, authentifié COMME Sophie, env, lecture
seule, rejoue les 2 requêtes de la page) : 17 sections · 72 affirmations · 23 evidences **toutes résolues avec
verbatim** · 0 affirmation sans evidence · niveaux tendance 48 · declaration 12 · hypothese 10 · implication 2.

**Convention `applied_migrations` — 99 corrigée.** Le fichier portait `INSERT (migration) VALUES ('99-persist-journal')
ON CONFLICT`. Corrigé vers la convention 95→98 : colonne **`filename`**, **nom complet du fichier**
(`supabase-migration-99-persist-journal.sql`), insert **conditionnel** (`WHERE NOT EXISTS`, pas de ON CONFLICT — la PK
casserait). La 99 est déjà appliquée en base ; la correction du fichier est documentaire/idempotente.

**Proxy Next 16.** Il n'y a pas de `middleware.ts` mais un `src/proxy.ts` (renommage Next 16) : refresh de session +
redirections (`/login` si non authentifié, `/dashboard` si déjà connecté). **Aucun message d'erreur de connexion** :
il ne fait que rediriger sur présence/absence d'auth.

**Login — lot diagnosticabilité (DIFFÉRÉ, basse priorité, NON fait).** `src/app/login/page.tsx` écrase toutes les
erreurs GoTrue (mdp faux, e-mail non confirmé, compte désactivé, rate-limit) en une seule chaîne « E-mail ou mot de
passe incorrect. » → un utilisateur rate-limité change un mot de passe qui était bon. Aucune vérif applicative cachée
en aval de l'auth (le handler redirige, point). Minimum quand on y touchera : distinguer les cas **qui ne sont pas des
identifiants** (rate-limit, e-mail non confirmé, compte désactivé) ; garder un message générique pour les identifiants ;
**ne JAMAIS dire** lequel de l'e-mail ou du mot de passe est faux (énumération de comptes).

---

## Règle permanente (gravée 9 nov 2026) — toujours vers l'exigeant

Aucune concession sur la qualité du produit et du système. Aucun risque pris, aucune faille tolérée — même
connue et jugée peu exploitable. Si la bonne solution prend plus de temps, elle prend plus de temps. Quand on
hésite entre le propre et le rapide : **proposer le propre, laisser Estelle décider, ne jamais trancher vers le
raccourci.** Pas de « dégradation gracieuse » offerte par défaut. Un défaut repéré en passant devient un lot
nommé et ordonnancé, pas un relevé « pour plus tard » vague.

## Lot RECÂBLAGE persistKnowledge → persist_journal — arbitrages verrouillés (9 nov 2026)

- **Isolation : (B) stricte, une seule porte.** `persist_journal` seul chemin qui CRÉE des lignes du journal ;
  la supersession passe AUSSI par une RPC atomique (pas d'exception permanente dans l'invariant). Le test
  interdit deux choses : (1) tout troisième écrivain sur les 4 tables ; (2) que `supersedeSources` déborde de
  `superseded_at`/`superseded_by` (ni 3ᵉ colonne, ni `knowledge_sources`).
- **Doublon humain : corrigé à la source**, par un **jeton d'idempotence porté par la soumission** (renvoyé tel
  quel si le code réessaie, abandonné quand la personne revient répondre délibérément). Option « source_id
  déterministe » écartée (absorberait une vraie correction) ; option « dédoublonnage au read » écartée
  (pansement, laisse le bruit s'accumuler dans un journal non effaçable).
- **No-op :** payload VIDE = bug d'appelant → LÈVE en pré-vol TS (avant l'appel réseau) ; payload PLEIN tous
  compteurs à 0 = rejeu légitime → journalisé avec l'outcome, pas d'exception. `persist_journal` renvoie le
  décompte des lignes réellement écrites (migration 103) pour permettre la distinction.
- **Ordre de déploiement : strict.** Estelle applique la 103, vérifie en base, PUIS push de persist.ts. Aucune
  dégradation gracieuse d'un retour indéterminé (l'ancien persist.ts n'appelle pas la RPC → appliquer en
  avance ne casse rien).

### Ordre des lots verrouillé (9 nov 2026)

1. **Recâblage** persistKnowledge → persist_journal (en cours).
2. **Supersession atomique** — `supersedeSources` fait 3 UPDATE sur 3 tables, même défaut d'atomicité que
   l'ancien persistKnowledge (supersession interrompue = evidences marquées, facts non marqués). Lot ferme.
3. **Jeton d'idempotence à la soumission** — AVANT l'import du référentiel Discovery (le site est en ligne, le
   doublon peut déjà se produire aujourd'hui).
4. **search_path** sur les 12 fonctions restantes (ex-103, devient lot 4 ; `persist_journal` est déjà durci par
   la migration 103, `public, pg_temp`).
Puis seulement : import du référentiel Discovery.

### Append-only du journal : discipline de code, PAS garantie de base (constaté 10 nov 2026)

- **Politiques** (migration 82, aucune autre ensuite) : `ksources_owner`/`kev_owner`/`kfacts_owner`/`kok_owner`,
  une seule par table, PERMISSIVE, `FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`.
  Aucune restrictive, aucune cmd dédiée.
- **Privilèges** (audit Estelle, défaut Supabase non resserré) : `anon`, `authenticated`, `service_role` ont tous
  `DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE` sur les 4 tables. Donc le propriétaire peut
  SUPPRIMER et RÉÉCRIRE sur place ses lignes de journal. `TRUNCATE`/`TRIGGER`/`REFERENCES` accordés à anon+authenticated
  sans usage légitime (`TRUNCATE` échappe à la RLS — doc PostgreSQL).
- **Migration 104** (durcissement des privilèges, écrite plus tard) : révoquer `DELETE, TRUNCATE, TRIGGER, REFERENCES`
  à anon+authenticated ; révoquer TOUT à anon (la RLS exige auth.uid(), anon n'en a pas) ; CONSERVER `SELECT`+`INSERT`
  à authenticated (persist_journal est INVOKER, révoquer INSERT casserait la RPC) ; NE PAS toucher `UPDATE` authenticated
  (la supersession le marque côté client — part au lot 2, en DEFINER).

### Périmètre réel du journal : 7 tables, 3 catégories (constaté 10 nov 2026)

- **Journal primaire append-only (4)** : `knowledge_sources`, `knowledge_evidences`, `knowledge_facts`,
  `knowledge_open_knowledge`. Écrites UNIQUEMENT par `persist_journal`.
- **Relevé d'actes append-only (1)** : `knowledge_extraction_records` — model, prompt_version, produced_*_ids, ts ;
  une ligne par acte d'extraction, jamais mise à jour. Porte source_id + clé composite about. **Écrite par AUCUN
  chemin actuel** (dormante).
- **État dérivé recalculable (2)** : `knowledge_signals` (état consolidé courant, PK `signal_key`, UPSERT par
  conception → PAS append-only) et `knowledge_signal_snapshots` (historique en ajout seul de l'état dérivé).
  Ne référencent pas `knowledge_sources`. **Écrites par AUCUN chemin actuel** (dormantes). Recalculabilité PROUVÉE :
  `src/lib/knowledge-write/consolidate-journal.ts` (« dérivé… entièrement recalculable », « ne mute jamais le
  journal », exposée mais câblée nulle part).

### `contacts` = porte latérale LIVE dans le journal (constaté 10 nov 2026)

- Toutes les tables du journal : `contact_id → contacts(id) ON DELETE CASCADE` ET `user_id → auth.users(id) ON DELETE CASCADE`.
- **Retrait d'un proche** : `src/app/api/contacts/delete/route.ts` — route serveur, client **authenticated** (pas
  service_role), vérifie la propriété puis `.from('contacts').delete()`. Politique `users_own_contacts ON contacts
  FOR ALL USING (auth.uid() = user_id)` → l'owner supprime son contact, **la cascade détruit tout le journal du proche**.
  Révoquer DELETE sur les tables du journal ne ferme PAS ce chemin.
- **Effacement de compte** : `src/lib/lifecycle/hard-delete.ts` (appelé par `src/app/api/cron/lifecycle-check/route.ts`),
  client **service_role**, supprime les photos storage puis `auth.admin.deleteUser` → cascade via `auth.users`.
  `user_id` en CASCADE → l'effacement de compte continue de fonctionner après la 104.
- **Aucun autre chemin de suppression** du journal : zéro `.delete()`/`TRUNCATE` sur les 7 tables dans `src`/`scripts`
  (hors les deletes admin du roundtrip, retirés en Décision 1) ; zéro `DELETE FROM knowledge_*` en migration/RPC.

### CHANTIER « EFFACEMENT ET DROIT À L'OUBLI » — INSCRIT, NON OUVERT (10 nov 2026)

À livrer le jour où le lot s'ouvre (décision d'Estelle, pas encore prise) :
- une RPC d'effacement `SECURITY DEFINER` avec contrôle de propriété (aucun effacement depuis une session ordinaire,
  ligne par ligne, sans trace — c'est précisément ce que la 104 ferme, et c'est voulu) ;
- un journal de l'ACTE d'effacement tenu HORS du périmètre effacé (prouver l'effacement sans conserver la donnée) ;
- l'arbitrage du sort des **fiches de proches** (jamais consenti, peuvent demander un effacement de leur côté) —
  **point juridique, pas technique, en attente d'une réponse qui ne vient pas de l'assistant** ;
- question produit ouverte (Estelle tranche) : **retrait d'un proche en ARCHIVAGE** plutôt qu'en suppression dure —
  colonne d'archivage sur `contacts`, filtrage des lectures (**76 sites `.select` sur `contacts`, 43 fichiers** →
  surface à couvrir par vue/RLS plutôt qu'à la main), cascade qui ne se déclenche plus (journal du proche préservé).
  Tension RGPD inverse : l'archivage RETIENT la donnée d'un proche non consentant.

**TRANCHÉ par Estelle (10 nov 2026) — la porte `contacts` se résout par QUI agit :**
- **l'utilisateur retire un proche de sa liste = rangement → ARCHIVER** (défaut de la gestion de liste) ;
- **le proche demande un effacement = obligation légale → DÉTRUIRE, et ça prime** ;
- **l'utilisateur supprime son compte = il part → DÉTRUIRE TOUT** (la cascade actuelle via `auth.users`).
L'archivage devient le défaut ; la destruction reste outillée pour répondre DÉLIBÉRÉMENT à une demande d'effacement,
au lieu de détruire par accident. **Les 76 lectures passent par une politique RLS ou une vue filtrée, JAMAIS site par
site** (une lecture oubliée ré-expose un proche retiré = défaut de CONFIDENTIALITÉ, pas d'affichage). La part juridique
(sort des fiches de proches) attend la réponse d'Estelle, qui ne vient pas de l'assistant seul.

### Cron de suppression dure `lifecycle-check` — relevé (constaté 10 nov 2026)

- **Chemin** : `src/app/api/account/delete/route.ts` (utilisateur, re-auth mot de passe) pose `subscription_status='cancelled'`
  + `deletion_scheduled_at = now + 30 j` ; annulable via `src/app/api/account/cancel-deletion/route.ts` jusqu'à la date.
  Le cron `src/app/api/cron/lifecycle-check/route.ts` (vercel.json, `0 3 * * *`, quotidien, auth `Bearer CRON_SECRET`)
  exécute `hardDeleteUser` quand `status==='cancelled' && deletion_scheduled_at <= now`. Branche NON gardée par
  `ENABLE_TRIAL_LOCKOUT=false` (ce flag ne garde que trial→paused) → la branche de suppression est LIVE.
- **Délai de grâce** : 30 j, réversible, posé en amont (pas dans le cron) ; e-mail de confirmation. Le cron n'a ni
  dry-run ni confirmation propre : il fait confiance au timestamp.
- **⚠ DÉFAUT GRAVE (constaté, NON corrigé)** : rien n'écrit CE QUI est supprimé (aucun manifeste contacts/journal).
  Pire, `account_lifecycle_events.user_id → auth.users ON DELETE CASCADE` : l'évènement `deletion_requested` posé à la
  demande est **détruit par la cascade de la suppression qu'il enregistrait**. Seule trace survivante = `cron_runs.metadata.transitions`
  (`hard_deleted:<uid>`, `cron_runs` sans FK user) — mais écrite SEULEMENT sur run entièrement réussi (le chemin d'erreur
  omet `metadata`). → Après un run réussi : on sait QUI (uid), jamais QUOI. Après un run en erreur : potentiellement
  AUCUNE trace. C'est le « indétectable après coup » anticipé. À verser au chantier EFFACEMENT (journal de l'acte HORS
  périmètre effacé).
