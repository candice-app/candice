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
