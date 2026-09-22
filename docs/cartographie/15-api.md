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
