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
