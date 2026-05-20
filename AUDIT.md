# AUDIT EXHAUSTIF — Candice
_Généré le 2026-05-20. Basé uniquement sur le code source réel._

---

## 1. ARBORESCENCE

```
src/app/aide/page.tsx
src/app/api/account/cancel-deletion/route.ts
src/app/api/account/delete/route.ts
src/app/api/account/export/route.ts
src/app/api/analyse/route.ts
src/app/api/auth/callback/route.ts
src/app/api/beta-access/route.ts
src/app/api/cadence/auto-adjust/route.ts
src/app/api/candice-note/route.ts
src/app/api/confidences/route.ts
src/app/api/contacts/[id]/cadence/route.ts
src/app/api/contacts/archive/route.ts
src/app/api/contacts/create-incognito/route.ts
src/app/api/contacts/delete/route.ts
src/app/api/contacts/unarchive/route.ts
src/app/api/contacts/upload-photo/route.ts
src/app/api/cron/cadence-feedback/route.ts
src/app/api/cron/detect-and-generate/manual/route.ts
src/app/api/cron/detect-and-generate/route.ts
src/app/api/cron/email-reminders/route.ts
src/app/api/cron/lifecycle-check/route.ts
src/app/api/emails/profile-complete/route.ts
src/app/api/emails/questionnaire-invite/route.ts
src/app/api/emails/reminder-suggestion/route.ts
src/app/api/emails/reminder/route.ts
src/app/api/emails/trial-reminder/route.ts
src/app/api/emails/welcome/route.ts
src/app/api/idea-suggestions/route.ts
src/app/api/parametres/cadence/route.ts
src/app/api/parametres/notifications/route.ts
src/app/api/proactive-suggestions/[id]/refuse/route.ts
src/app/api/proactive-suggestions/[id]/validate/route.ts
src/app/api/profil/submit/route.ts
src/app/api/profile-notes/route.ts
src/app/api/profile-updates/[id]/route.ts
src/app/api/profile-updates/pending/route.ts
src/app/api/push/subscribe/route.ts
src/app/api/push/unsubscribe/route.ts
src/app/api/questionnaire-insight/route.ts
src/app/api/questionnaire/proche-register/route.ts
src/app/api/questionnaire/voice-conversation/route.ts
src/app/api/shared-profile/complete/route.ts
src/app/api/sharing/respond/route.ts
src/app/api/sharing/revoke/route.ts
src/app/api/subscription/pause/route.ts
src/app/api/subscription/resume/route.ts
src/app/api/suggestions/route.ts
src/app/beta-access/page.tsx
src/app/concept/page.tsx
src/app/conditions-generales/page.tsx
src/app/confidentialite/page.tsx
src/app/contact/page.tsx
src/app/contacts/[id]/AnalysisPanel.tsx
src/app/contacts/[id]/ContactActions.tsx
src/app/contacts/[id]/ContactHeader.tsx
src/app/contacts/[id]/MatchingCard.tsx
src/app/contacts/[id]/page.tsx
src/app/contacts/[id]/SuggestionsPanel.tsx
src/app/contacts/[id]/WishlistSection.tsx
src/app/contacts/new/page.tsx
src/app/dashboard/archives/ArchivesClient.tsx
src/app/dashboard/archives/page.tsx
src/app/dashboard/page.tsx
src/app/dashboard/sharing/page.tsx
src/app/dashboard/sharing/SharingClient.tsx
src/app/fonctionnement/page.tsx
src/app/globals.css
src/app/historique/page.tsx
src/app/icon.svg
src/app/idees/page.tsx
src/app/layout.tsx
src/app/login/layout.tsx
src/app/login/page.tsx
src/app/mentions-legales/page.tsx
src/app/metadata.ts
src/app/moi/page.tsx
src/app/moi/questionnaire/page.tsx
src/app/moi/ShareButton.tsx
src/app/offre/page.tsx
src/app/page.tsx
src/app/parametres/abonnement/AbonnementActions.tsx
src/app/parametres/abonnement/page.tsx
src/app/parametres/notifications/page.tsx
src/app/partage/[id]/page.tsx
src/app/profil-partage/[token]/page.tsx
src/app/profil-partage/[token]/SharedForm.tsx
src/app/profil-partage/[token]/SharedProfileFlow.tsx
src/app/profil/[id]/page.tsx
src/app/profil/[id]/PublicForm.tsx
src/app/register/layout.tsx
src/app/register/page.tsx
src/app/robots.ts
src/app/sitemap.ts
src/components/brand/Logo.tsx
src/components/contact/ArchiveDialog.tsx
src/components/ContactActionModal.tsx
src/components/contacts/NewContactFlow.tsx
src/components/CookieBanner.tsx
src/components/dashboard/CadenceGlobal.tsx
src/components/dashboard/CadencePerContact.tsx
src/components/dashboard/CandiceInput.tsx
src/components/dashboard/ContactCard.tsx
src/components/dashboard/ContactNotes.tsx
src/components/dashboard/DashboardActions.tsx
src/components/dashboard/IdeaModal.tsx
src/components/dashboard/ManualTriggerButton.tsx
src/components/dashboard/NotificationSettings.tsx
src/components/dashboard/OnboardingProgressCard.tsx
src/components/dashboard/PauseBanner.tsx
src/components/dashboard/PendingProfileUpdates.tsx
src/components/dashboard/ProactiveDashboardCard.tsx
src/components/dashboard/ProactiveSuggestionDetail.tsx
src/components/dashboard/PushPrompt.tsx
src/components/dashboard/WeeklyCheckin.tsx
src/components/layout/BetaBanner.tsx
src/components/layout/BottomNav.tsx
src/components/layout/DashboardShell.tsx
src/components/layout/MarketingFooter.tsx
src/components/layout/MarketingNav.tsx
src/components/layout/Navbar.tsx
src/components/onboarding/OnboardingFlow.tsx
src/components/onboarding/OnboardingOverlay.tsx
src/components/onboarding/TourReplay.tsx
src/components/questionnaire/InsightCard.tsx
src/components/questionnaire/QuestionnaireForm.tsx
src/components/questionnaire/ResumePrompt.tsx
src/components/questionnaire/SelfProfileForm.tsx
src/components/questionnaire/StickyProgressBar.tsx
src/components/questionnaire/VoiceMode.tsx
src/components/SendShareRequest.tsx
src/components/ShareRequestModal.tsx
src/hooks/useWebPush.ts
src/lib/cadence/resolver.ts
src/lib/lifecycle/hard-delete.ts
src/lib/lifecycle/track-activity.ts
src/lib/notifications/email-reminder.ts
src/lib/notifications/push-sender.ts
src/lib/questionnaire/candice-speak.ts
src/lib/questionnaire/listen.ts
src/lib/resend.ts
src/lib/signals/detector.ts
src/lib/signals/generator.ts
src/proxy.ts
src/scripts/generate-vapid-keys.js
src/types/index.ts
src/utils/awardPoints.ts
src/utils/supabase/admin.ts
src/utils/supabase/client.ts
src/utils/supabase/middleware.ts
src/utils/supabase/server.ts
```

---

## 2. PAGES

| URL | Fichier | Rôle |
|-----|---------|------|
| `/` | `src/app/page.tsx` | Landing marketing (hero, témoignages, features, CTA inscription) |
| `/aide` | `src/app/aide/page.tsx` | FAQ / centre d'aide utilisateur |
| `/beta-access` | `src/app/beta-access/page.tsx` | Accès beta protégé par mot de passe (BETA_PASSWORD) |
| `/concept` | `src/app/concept/page.tsx` | Page marketing "comment ça marche" (concept produit) |
| `/conditions-generales` | `src/app/conditions-generales/page.tsx` | CGU légales |
| `/confidentialite` | `src/app/confidentialite/page.tsx` | Politique de confidentialité (mentionne Claude) |
| `/contact` | `src/app/contact/page.tsx` | Formulaire de contact |
| `/contacts/[id]` | `src/app/contacts/[id]/page.tsx` | Fiche détaillée d'un proche (questionnaire, suggestions, wishlist, analyse) |
| `/contacts/new` | `src/app/contacts/new/page.tsx` | Création d'un nouveau contact via NewContactFlow |
| `/dashboard` | `src/app/dashboard/page.tsx` | Dashboard principal (contacts, suggestions proactives, onboarding, check-in) |
| `/dashboard/archives` | `src/app/dashboard/archives/page.tsx` | Contacts archivés (mode souvenir inclus) |
| `/dashboard/sharing` | `src/app/dashboard/sharing/page.tsx` | Gestion des demandes de partage de profil |
| `/fonctionnement` | `src/app/fonctionnement/page.tsx` | Page marketing "comment ça fonctionne" |
| `/historique` | `src/app/historique/page.tsx` | Historique des suggestions validées / refusées |
| `/idees` | `src/app/idees/page.tsx` | Générateur d'idées à la demande (IdeaModal) |
| `/login` | `src/app/login/page.tsx` | Authentification Supabase (email + password) |
| `/mentions-legales` | `src/app/mentions-legales/page.tsx` | Mentions légales |
| `/moi` | `src/app/moi/page.tsx` | Vue du profil personnel de l'utilisateur + bouton partage + ResumePrompt |
| `/moi/questionnaire` | `src/app/moi/questionnaire/page.tsx` | Formulaire de profil personnel (SelfProfileForm, 4 sections, 41 questions) |
| `/offre` | `src/app/offre/page.tsx` | Page offre / pricing |
| `/parametres/abonnement` | `src/app/parametres/abonnement/page.tsx` | Gestion abonnement (pause, annulation, suppression compte) |
| `/parametres/notifications` | `src/app/parametres/notifications/page.tsx` | Préférences notifications push et email |
| `/partage/[id]` | `src/app/partage/[id]/page.tsx` | Vue lecture seule du profil partagé d'un autre utilisateur (accès via lien) |
| `/profil-partage/[token]` | `src/app/profil-partage/[token]/page.tsx` | Flow en 6 écrans : un proche remplit son propre profil via lien de partage |
| `/profil/[id]` | `src/app/profil/[id]/page.tsx` | Formulaire public (PublicForm) — ancien flow de remplissage proche via contact ID |
| `/register` | `src/app/register/page.tsx` | Inscription (nom, email, mot de passe, téléphone optionnel) |

---

## 3. ROUTES API

| Méthode | Chemin | Rôle | Tables touchées |
|---------|--------|------|-----------------|
| POST | `/api/analyse` | Analyse de compatibilité LLM entre user et contact | `contacts`, `questionnaire_responses`, `my_profile` (lecture seule) |
| GET | `/api/auth/callback` | Callback OAuth Supabase après magic link / OAuth | — |
| POST | `/api/beta-access` | Vérifie le mot de passe beta (BETA_PASSWORD) | — |
| POST | `/api/cadence/auto-adjust` | Ajuste automatiquement cadence_preference selon métriques | `cadence_feedback`, `my_profile` |
| POST | `/api/candice-note` | Traite une note libre (CandiceInput), identifie le contact concerné | `contacts`, `profile_notes` (à vérifier) |
| POST | `/api/confidences` | Pipeline NLP : analyse texte libre → émotion → suggestion de mise à jour profil | `confidences`, `profile_updates_from_confidences` |
| PATCH | `/api/contacts/[id]/cadence` | Modifie cadence_override d'un contact | `contacts` |
| POST | `/api/contacts/archive` | Archive un contact (archive_reason + archived_at) | `contacts` |
| POST | `/api/contacts/create-incognito` | Crée un contact + questionnaire vide (mode incognito) | `contacts`, `questionnaire_responses` |
| POST | `/api/contacts/delete` | Supprime un contact (soft check puis delete) | `contacts` |
| POST | `/api/contacts/unarchive` | Désarchive un contact | `contacts` |
| POST | `/api/contacts/upload-photo` | Upload photo vers bucket Supabase Storage | `contacts`, `contact-photos` (storage bucket) |
| GET | `/api/cron/cadence-feedback` | Calcule et insère les métriques de cadence hebdo | `proactive_suggestions`, `cadence_feedback`, `cron_runs` |
| POST | `/api/cron/detect-and-generate/manual` | Déclenche manuellement le moteur detect-and-generate | `contextual_signals` |
| GET | `/api/cron/detect-and-generate` | Détecte signaux + génère suggestions proactives (via LLM) | `contacts`, `my_profile`, `contextual_signals`, `cron_runs` |
| GET | `/api/cron/email-reminders` | Envoie emails de rappel pour suggestions en attente | `proactive_suggestions`, `notification_log`, `cron_runs` |
| GET | `/api/cron/lifecycle-check` | Transitions de statut abonnement (trial→paused→silent) | `my_profile`, `notification_log`, `account_lifecycle_events`, `cron_runs` |
| POST | `/api/emails/profile-complete` | Envoie email "profil complété" via Resend | — (email only) |
| POST | `/api/emails/questionnaire-invite` | Envoie invitation à remplir un questionnaire | — (email only) |
| POST | `/api/emails/reminder` | Envoie rappel email générique | — (email only) |
| POST | `/api/emails/reminder-suggestion` | Envoie email de rappel lié à une suggestion | — (email only) |
| POST | `/api/emails/trial-reminder` | Envoie rappel de fin de trial | `notification_log` |
| POST | `/api/emails/welcome` | Envoie email de bienvenue | — (email only) |
| POST | `/api/idea-suggestions` | Génère des idées d'attentions pour une occasion donnée (LLM) | `contacts`, `questionnaire_responses` (lecture) |
| PATCH | `/api/parametres/cadence` | Met à jour cadence_preference de l'utilisateur | `my_profile` |
| PATCH | `/api/parametres/notifications` | Met à jour préférences notifications | `my_profile` |
| POST | `/api/proactive-suggestions/[id]/refuse` | Marque une suggestion comme refusée + raison | `proactive_suggestions` |
| POST | `/api/proactive-suggestions/[id]/validate` | Marque une suggestion comme validée + last_suggestion_at | `proactive_suggestions`, `contacts` |
| POST | `/api/profil/submit` | Soumet questionnaire d'un contact (ancien flow proche) | `contacts`, `questionnaire_responses` |
| POST | `/api/profile-notes` | Insère une note libre sur un contact | `profile_notes` |
| GET | `/api/profile-updates/pending` | Liste les suggestions de MAJ profil en attente (depuis confidences) | `profile_updates_from_confidences` |
| GET + PATCH | `/api/profile-updates/[id]` | Lit ou applique/rejette une suggestion de MAJ profil | `profile_updates_from_confidences`, `questionnaire_responses` |
| POST | `/api/push/subscribe` | Enregistre un endpoint de push notification | `push_subscriptions` |
| POST | `/api/push/unsubscribe` | Supprime un endpoint push | `push_subscriptions` |
| POST | `/api/questionnaire-insight` | Génère un insight temps réel sur réponses partielles (LLM) | — (stateless, pas de DB) |
| POST | `/api/questionnaire/proche-register` | Soumet les réponses anonymes d'un proche via token | `share_links`, `shared_profile_responses` |
| POST | `/api/questionnaire/voice-conversation` | Mappe un texte vocal vers les options d'une question (LLM) | — (stateless) |
| POST | `/api/shared-profile/complete` | Notifie la complétion d'un profil partagé (email + points) | `user_points`, `share_links` |
| POST | `/api/sharing/respond` | Accepte ou refuse une demande de partage de profil | `profile_share_requests` |
| POST | `/api/sharing/revoke` | Révoque une demande de partage acceptée | `profile_share_requests` |
| POST | `/api/subscription/pause` | Met en pause l'abonnement | `my_profile`, `account_lifecycle_events` |
| POST | `/api/subscription/resume` | Réactive un abonnement en pause | `my_profile`, `account_lifecycle_events` |
| POST | `/api/suggestions` | Génère et met en cache des suggestions IA pour un contact | `contacts`, `questionnaire_responses`, `my_profile`, `suggestions` |
| POST | `/api/account/cancel-deletion` | Annule une suppression de compte programmée | `my_profile`, `account_lifecycle_events` |
| POST | `/api/account/delete` | Planifie la suppression du compte (deletion_scheduled_at) | `my_profile`, `account_lifecycle_events` |
| POST | `/api/account/export` | Exporte toutes les données utilisateur en JSON | `my_profile`, `contacts`, `suggestions`, `proactive_suggestions`, `confidences`, `profile_notes`, `notification_log` |

---

## 4. COMPOSANTS PRINCIPAUX

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `SelfProfileForm` | `components/questionnaire/SelfProfileForm.tsx` | Formulaire profil personnel (4 sections, 41 questions, draft auto-save, mode vocal, sticky progress) |
| `QuestionnaireForm` | `components/questionnaire/QuestionnaireForm.tsx` | Formulaire questionnaire d'un proche (ancien format, 12 questions psycho + préférences) |
| `SharedForm` | `app/profil-partage/[token]/SharedForm.tsx` | Formulaire pour qu'un proche remplisse son propre profil via lien de partage (Phase 7) |
| `SharedProfileFlow` | `app/profil-partage/[token]/SharedProfileFlow.tsx` | Orchestrateur du flow en 6 écrans : landing → privacy → account → form → done |
| `PublicForm` | `app/profil/[id]/PublicForm.tsx` | Ancien formulaire public pour un proche (via contact ID, pas token) |
| `StickyProgressBar` | `components/questionnaire/StickyProgressBar.tsx` | Header sticky avec progression, burger menu (mode vocal, sauvegarder, quitter) |
| `VoiceMode` | `components/questionnaire/VoiceMode.tsx` | Mode vocal questionnaire (orbe Terra, cycle speaking/listening/processing/confirmed) |
| `InsightCard` | `components/questionnaire/InsightCard.tsx` | Affiche l'insight LLM temps réel pendant la saisie du questionnaire |
| `ResumePrompt` | `components/questionnaire/ResumePrompt.tsx` | Détecte un brouillon localStorage et propose de reprendre ou recommencer |
| `ProactiveDashboardCard` | `components/dashboard/ProactiveDashboardCard.tsx` | Carte suggestion proactive dans le dashboard (valider / refuser / snooze) |
| `ProactiveSuggestionDetail` | `components/dashboard/ProactiveSuggestionDetail.tsx` | Vue détaillée d'une suggestion proactive (reasoning, prix estimé, actions) |
| `CandiceInput` | `components/dashboard/CandiceInput.tsx` | Champ de saisie libre "dis à Candice" → appelle api/candice-note |
| `ContactCard` | `components/dashboard/ContactCard.tsx` | Carte contact dans le dashboard (nom, relation, dates, statut) |
| `NewContactFlow` | `components/contacts/NewContactFlow.tsx` | Wizard de création d'un contact |
| `OnboardingFlow` | `components/onboarding/OnboardingFlow.tsx` | Overlay onboarding (3 étapes, écrit onboarding_completed=true dans my_profile) |
| `OnboardingProgressCard` | `components/dashboard/OnboardingProgressCard.tsx` | Carte de progression onboarding (localStorage-based) |
| `PendingProfileUpdates` | `components/dashboard/PendingProfileUpdates.tsx` | Affiche les propositions de MAJ profil issues des confidences |
| `AnalysisPanel` | `app/contacts/[id]/AnalysisPanel.tsx` | Affiche l'analyse compatibilité LLM (score, points communs, zones de différence) |
| `MatchingCard` | `app/contacts/[id]/MatchingCard.tsx` | Carte compacte de score de compatibilité |
| `SuggestionsPanel` | `app/contacts/[id]/SuggestionsPanel.tsx` | Panneau de suggestions pour un contact (ancienne table suggestions) |
| `WishlistSection` | `app/contacts/[id]/WishlistSection.tsx` | Gestion de la liste de souhaits d'un contact (gift_wishlist JSONB) |
| `DashboardShell` | `components/layout/DashboardShell.tsx` | Enveloppe de layout pour les pages app (navbar + bottom nav) |
| `PauseBanner` | `components/dashboard/PauseBanner.tsx` | Bannière affichée quand subscription_status = paused ou silent |
| `CadenceGlobal` | `components/dashboard/CadenceGlobal.tsx` | Contrôle de cadence globale de l'utilisateur |
| `CadencePerContact` | `components/dashboard/CadencePerContact.tsx` | Contrôle de cadence par contact |
| `WeeklyCheckin` | `components/dashboard/WeeklyCheckin.tsx` | Check-in hebdomadaire (récap attentions de la semaine) |
| `NotificationSettings` | `components/dashboard/NotificationSettings.tsx` | UI préférences notifications (appelle api/parametres/notifications) |
| `PushPrompt` | `components/dashboard/PushPrompt.tsx` | Invite à activer les notifications push (useWebPush hook) |
| `SendShareRequest` | `components/SendShareRequest.tsx` | Bouton pour envoyer une demande de partage de profil |
| `ShareRequestModal` | `components/ShareRequestModal.tsx` | Modal de réponse à une demande de partage reçue |
| `ContactActionModal` | `components/ContactActionModal.tsx` | Modal d'actions sur un contact (archiver, supprimer, etc.) |

---

## 5. SCHÉMA SUPABASE RÉEL

_Source : `supabase-schema.sql` (base) + migrations 2 à 9._
_Dernière migration présente dans le repo : **migration-9** (Phase 7, 2026-05-18)._

> **Attention** : `supabase-schema.sql` n'est pas numéroté "migration-1". Il constitue le schéma initial. Les migrations 2–9 s'appliquent par-dessus.

---

### `contacts`
| Colonne | Type | Ajouté dans |
|---------|------|-------------|
| id | UUID PK | schema.sql |
| user_id | UUID → auth.users | schema.sql |
| name | TEXT NOT NULL | schema.sql |
| relationship | TEXT CHECK (partner\|friend\|family\|colleague\|other) | schema.sql |
| email | TEXT | schema.sql |
| phone | TEXT | schema.sql / migration-2 |
| created_at | TIMESTAMPTZ DEFAULT NOW() | schema.sql |
| photo_url | TEXT | migration-2 |
| gift_wishlist | JSONB DEFAULT '[]' | migration-2 |
| archived_at | TIMESTAMPTZ | migration-3 |
| last_reminder_sent_at | TIMESTAMPTZ | migration-3 |
| proximity_level | TEXT CHECK (inner_circle\|close\|extended\|distant) DEFAULT 'close' | migration-4 |
| cadence_override | TEXT CHECK (discreet\|normal\|sustained\|intense) | migration-4 |
| last_suggestion_at | TIMESTAMPTZ | migration-4 |
| archive_reason | TEXT CHECK (deceased\|lost_contact\|end_of_relationship\|other) | migration-8 |
| is_memory_mode | BOOLEAN DEFAULT FALSE | migration-8 |
| memory_anniversary_opt_out | BOOLEAN DEFAULT FALSE | migration-8 |

---

### `questionnaire_responses`
| Colonne | Type | Ajouté dans |
|---------|------|-------------|
| id | UUID PK | schema.sql |
| contact_id | UUID → contacts | schema.sql |
| user_id | UUID → auth.users | schema.sql |
| love_language | TEXT | schema.sql |
| communication_style | TEXT | schema.sql |
| stress_response | TEXT | schema.sql |
| social_energy | TEXT | schema.sql |
| appreciation_style | TEXT | schema.sql |
| conflict_resolution | TEXT | schema.sql |
| decision_making | TEXT | schema.sql |
| emotional_expression | TEXT | schema.sql |
| core_values | TEXT | schema.sql |
| recognition_preference | TEXT | schema.sql |
| boundaries | TEXT | schema.sql |
| growth_mindset | TEXT | schema.sql |
| hobbies | TEXT | schema.sql |
| favorite_foods | TEXT | schema.sql |
| gift_preference | TEXT | schema.sql |
| standing | TEXT | schema.sql |
| gastronomy | TEXT | schema.sql |
| accommodation | TEXT | schema.sql |
| gift_style | TEXT | schema.sql |
| conversation_topics | TEXT | schema.sql |
| things_to_avoid | TEXT | schema.sql |
| best_contact_method | TEXT | schema.sql |
| important_dates | TEXT | schema.sql |
| additional_notes | TEXT | schema.sql |
| created_at | TIMESTAMPTZ | schema.sql |
| updated_at | TIMESTAMPTZ | schema.sql |
| clothing_size | TEXT | schema.sql |
| shoe_size | TEXT | schema.sql |
| ring_size | TEXT | schema.sql |
| pants_size | TEXT | schema.sql |
| pets | TEXT | schema.sql |
| physical_contact_with | TEXT[] | migration-9 |
| input_mode | TEXT | migration-9 |

---

### `my_profile`
| Colonne | Type | Ajouté dans |
|---------|------|-------------|
| id | UUID PK | schema.sql |
| user_id | UUID UNIQUE → auth.users | schema.sql |
| love_language | TEXT | schema.sql |
| communication_style | TEXT | schema.sql |
| stress_response | TEXT | schema.sql |
| social_energy | TEXT | schema.sql |
| appreciation_style | TEXT | schema.sql |
| conflict_resolution | TEXT | schema.sql |
| decision_making | TEXT | schema.sql |
| emotional_expression | TEXT | schema.sql |
| core_values | TEXT | schema.sql |
| recognition_preference | TEXT | schema.sql |
| boundaries | TEXT | schema.sql |
| growth_mindset | TEXT | schema.sql |
| hobbies | TEXT | schema.sql |
| favorite_foods | TEXT | schema.sql |
| gift_preference | TEXT | schema.sql |
| standing | TEXT | schema.sql |
| gastronomy | TEXT | schema.sql |
| accommodation | TEXT | schema.sql |
| gift_style | TEXT | schema.sql |
| conversation_topics | TEXT | schema.sql |
| things_to_avoid | TEXT | schema.sql |
| best_contact_method | TEXT | schema.sql |
| important_dates | TEXT | schema.sql |
| created_at | TIMESTAMPTZ | schema.sql |
| updated_at | TIMESTAMPTZ | schema.sql |
| additional_notes | TEXT | schema.sql |
| onboarding_completed | BOOLEAN DEFAULT FALSE | schema.sql |
| disliked_activities | TEXT | schema.sql |
| disliked_foods | TEXT | schema.sql |
| tactility | TEXT | schema.sql |
| health_comfort | TEXT | schema.sql |
| family_life | TEXT | schema.sql |
| character_emotions | TEXT | schema.sql |
| cannot_stand | TEXT | schema.sql |
| few_know | TEXT | schema.sql |
| food_allergies | TEXT | schema.sql |
| diet | TEXT | schema.sql |
| religion | TEXT | schema.sql |
| disability | TEXT | schema.sql |
| postal_address | TEXT | schema.sql |
| clothing_size | TEXT | schema.sql |
| shoe_size | TEXT | schema.sql |
| ring_size | TEXT | schema.sql |
| pants_size | TEXT | schema.sql |
| pets | TEXT | schema.sql |
| phone | TEXT | migration-2 |
| cadence_preference | TEXT DEFAULT 'normal' | migration-4 |
| has_children | BOOLEAN DEFAULT FALSE | migration-4 |
| pilote_difficult_period_until | DATE | migration-5 |
| pilote_last_achievement_at | DATE | migration-5 |
| notif_push_enabled | BOOLEAN DEFAULT TRUE | migration-6 |
| notif_email_enabled | BOOLEAN DEFAULT TRUE | migration-6 |
| notif_quiet_hours_start | INTEGER DEFAULT 21 | migration-6 |
| notif_quiet_hours_end | INTEGER DEFAULT 8 | migration-6 |
| notif_max_per_day | INTEGER DEFAULT 2 | migration-6 |
| trial_started_at | TIMESTAMPTZ DEFAULT NOW() | migration-8 |
| subscription_status | TEXT DEFAULT 'trial' | migration-8 |
| subscription_paused_at | TIMESTAMPTZ | migration-8 |
| silent_since | TIMESTAMPTZ | migration-8 |
| last_active_at | TIMESTAMPTZ DEFAULT NOW() | migration-8 |
| cancelled_at | TIMESTAMPTZ | migration-8 |
| deletion_scheduled_at | TIMESTAMPTZ | migration-8 |
| physical_contact_with | TEXT[] | migration-9 |
| questionnaire_input_mode | TEXT | migration-9 |

---

### `suggestions` (ancienne table, encore active)
| Colonne | Type |
|---------|------|
| id | UUID PK |
| contact_id | UUID → contacts |
| user_id | UUID → auth.users |
| content | JSONB |
| generated_at | TIMESTAMPTZ |

---

### `user_points`
| Colonne | Type |
|---------|------|
| id | UUID PK |
| user_id | UUID → auth.users |
| action_type | TEXT |
| points | INTEGER |
| created_at | TIMESTAMPTZ |

---

### `share_links`
| Colonne | Type |
|---------|------|
| id | UUID PK |
| token | TEXT UNIQUE DEFAULT gen_random_uuid()::text |
| sender_id | UUID → auth.users |
| sender_name | TEXT |
| created_at | TIMESTAMPTZ |
| expires_at | TIMESTAMPTZ |

---

### `shared_profile_responses`
| Colonne | Type |
|---------|------|
| id | UUID PK |
| token | TEXT |
| user_id | UUID → auth.users |
| response_data | JSONB |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| UNIQUE(token, user_id) | — |

---

### `profile_notes`
| Colonne | Type |
|---------|------|
| id | UUID PK |
| contact_id | UUID → contacts (nullable) |
| user_id | UUID → auth.users |
| note | TEXT |
| created_at | TIMESTAMPTZ |

---

### `profile_share_requests` (migration-3)
| Colonne | Type |
|---------|------|
| id | UUID PK |
| requester_id | UUID → auth.users |
| profile_owner_id | UUID → auth.users |
| status | TEXT DEFAULT 'pending' |
| confirmed_with_reauth | BOOLEAN DEFAULT FALSE |
| reauth_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |
| responded_at | TIMESTAMPTZ |

---

### `contextual_signals` (migration-4)
| Colonne | Type |
|---------|------|
| id | UUID PK |
| user_id | UUID → auth.users |
| contact_id | UUID → contacts (nullable) |
| signal_type | TEXT |
| signal_data | JSONB |
| trigger_date | DATE |
| priority | TEXT DEFAULT 'normal' |
| status | TEXT DEFAULT 'active' |
| created_at | TIMESTAMPTZ |
| consumed_at | TIMESTAMPTZ |
| expires_at | TIMESTAMPTZ |

---

### `proactive_suggestions` (migration-4, contact_id nullable depuis migration-5)
| Colonne | Type |
|---------|------|
| id | UUID PK |
| user_id | UUID → auth.users |
| contact_id | UUID → contacts (nullable) |
| signal_id | UUID → contextual_signals (nullable) |
| title | TEXT |
| description | TEXT |
| category | TEXT |
| reasoning | TEXT |
| estimated_price | TEXT |
| partner_hint | TEXT |
| status | TEXT DEFAULT 'pending' |
| refusal_reason | TEXT |
| priority | TEXT DEFAULT 'normal' |
| generated_at | TIMESTAMPTZ |
| responded_at | TIMESTAMPTZ |
| expires_at | TIMESTAMPTZ |

---

### `cron_runs` (migration-4)
| Colonne | Type |
|---------|------|
| id | UUID PK |
| job_name | TEXT |
| started_at | TIMESTAMPTZ |
| finished_at | TIMESTAMPTZ |
| status | TEXT DEFAULT 'running' |
| signals_detected | INTEGER DEFAULT 0 |
| suggestions_generated | INTEGER DEFAULT 0 |
| error_message | TEXT |
| metadata | JSONB |

---

### `confidences` (migration-5)
| Colonne | Type |
|---------|------|
| id | UUID PK |
| user_id | UUID → auth.users |
| contact_id | UUID → contacts (nullable) |
| raw_text | TEXT |
| input_mode | TEXT DEFAULT 'text' CHECK (text\|voice) |
| detected_subject | TEXT CHECK (contact\|pilote\|general) |
| emotional_tone | TEXT CHECK (positive\|negative\|neutral\|mixed\|urgent) |
| candice_response | TEXT |
| created_at | TIMESTAMPTZ |

---

### `profile_updates_from_confidences` (migration-5)
| Colonne | Type |
|---------|------|
| id | UUID PK |
| user_id | UUID → auth.users |
| confidence_id | UUID → confidences |
| contact_id | UUID → contacts (nullable) |
| field_name | TEXT |
| old_value | TEXT |
| new_value | TEXT |
| status | TEXT DEFAULT 'pending' CHECK (pending\|applied\|rejected) |
| created_at | TIMESTAMPTZ |
| reviewed_at | TIMESTAMPTZ |

---

### `push_subscriptions` (migration-6)
| Colonne | Type |
|---------|------|
| id | UUID PK |
| user_id | UUID → auth.users |
| endpoint | TEXT |
| p256dh_key | TEXT |
| auth_key | TEXT |
| user_agent | TEXT |
| created_at | TIMESTAMPTZ |
| last_used_at | TIMESTAMPTZ |
| UNIQUE(user_id, endpoint) | — |

---

### `notification_log` (migration-6)
| Colonne | Type |
|---------|------|
| id | UUID PK |
| user_id | UUID → auth.users |
| channel | TEXT CHECK (push\|email) |
| notification_type | TEXT |
| related_suggestion_id | UUID → proactive_suggestions (nullable) |
| related_signal_id | UUID → contextual_signals (nullable) |
| title | TEXT |
| body | TEXT |
| status | TEXT DEFAULT 'sent' CHECK (sent\|failed\|opened\|clicked) |
| sent_at | TIMESTAMPTZ |
| opened_at | TIMESTAMPTZ |
| clicked_at | TIMESTAMPTZ |
| error_message | TEXT |

---

### `cadence_log` (migration-7)
| Colonne | Type |
|---------|------|
| id | UUID PK |
| user_id | UUID → auth.users |
| contact_id | UUID → contacts (nullable) |
| decision_at | TIMESTAMPTZ |
| computed_cadence | TEXT CHECK (discreet\|normal\|sustained\|intense) |
| reason | TEXT |
| factors | JSONB |

---

### `cadence_feedback` (migration-7)
| Colonne | Type |
|---------|------|
| id | UUID PK |
| user_id | UUID → auth.users |
| contact_id | UUID → contacts (nullable) |
| window_start | DATE |
| window_end | DATE |
| suggestions_count | INTEGER DEFAULT 0 |
| validated_count | INTEGER DEFAULT 0 |
| refused_count | INTEGER DEFAULT 0 |
| snoozed_count | INTEGER DEFAULT 0 |
| ignored_count | INTEGER DEFAULT 0 |
| validation_rate | DECIMAL(5,2) |
| recommended_adjustment | TEXT |
| created_at | TIMESTAMPTZ |

---

### `account_lifecycle_events` (migration-8)
| Colonne | Type |
|---------|------|
| id | UUID PK |
| user_id | UUID → auth.users |
| event_type | TEXT |
| previous_status | TEXT |
| new_status | TEXT |
| triggered_by | TEXT CHECK (user\|system\|admin) |
| metadata | JSONB |
| created_at | TIMESTAMPTZ |

---

## 6. APPELS IA (Anthropic)

Tous les appels utilisent le modèle **`claude-sonnet-4-6`** via `@anthropic-ai/sdk ^0.91.0`.

| Fichier | Route déclenchante | Rôle |
|---------|-------------------|------|
| `api/suggestions/route.ts` | POST `/api/suggestions` | Génère 5 suggestions d'attentions personnalisées pour un contact (quality_time, gift, message, gesture, activity), mises en cache dans la table `suggestions` |
| `api/analyse/route.ts` | POST `/api/analyse` | Analyse de compatibilité relationnelle entre le profil utilisateur et celui d'un contact — retourne score (0-100), points communs, zones de différence, conseils |
| `api/questionnaire-insight/route.ts` | POST `/api/questionnaire-insight` | Génère un insight psychologique court (1-2 phrases) en temps réel pendant la saisie du questionnaire, sans accès à la DB |
| `api/confidences/route.ts` | POST `/api/confidences` | Pipeline NLP complet : analyse texte libre → détecte sujet/émotion → propose mises à jour de champs de profil → enregistre dans `profile_updates_from_confidences` |
| `api/candice-note/route.ts` | POST `/api/candice-note` | Traite une note libre saisie dans CandiceInput — identifie le contact concerné parmi la liste de l'utilisateur, génère une réponse contextuelle |
| `api/idea-suggestions/route.ts` | POST `/api/idea-suggestions` | Génère des idées d'attentions pour une occasion spécifique (anniversaire, sans raison, félicitations, etc.) — stateless, pas de cache |
| `api/questionnaire/voice-conversation/route.ts` | POST `/api/questionnaire/voice-conversation` | Mappe un transcript vocal (SpeechRecognition) vers les valeurs d'options d'une question questionnaire — stateless |
| `lib/signals/generator.ts` | Appelé par GET `/api/cron/detect-and-generate` | **Deux appels distincts** : (1) Génère une suggestion proactive à partir d'un signal contextuel — résultat écrit dans `proactive_suggestions` ; (2) Génère un insight sur une période de silence relationnelle |

---

## 7. POINT CRITIQUE — MOTEUR DE SCORING PROFIL

**NON. Ce système n'existe pas dans le code.**

Recherche effectuée sur les termes : `MOT`, `CAD_S`, `CAD_C`, `EXP`, `GES`, `SER`, `SUR`, `COM`, `scoring`, `radar`, `profil dominant`, `normaliz`, `5.*3.*1`, `rang.*point`, `dimension`.

Aucun résultat pertinent trouvé.

Ce qui **existe** et pourrait être confondu avec du "scoring" :
- **`compatibility_score`** : entier 0–100 dans `AnalysisResult`, affiché dans `AnalysisPanel.tsx` et `MatchingCard.tsx`. Ce score est **entièrement généré par Claude** via un prompt LLM dans `api/analyse`. Il n'y a aucune formule, aucun calcul de rang (5/3/1), aucune normalisation, aucun profil dominant/secondaire/tertiaire dans le code.
- **`completion_score`** dans `contacts/[id]/page.tsx` : calcul de la complétude d'un questionnaire (nombre de champs remplis / total). Ce n'est pas un scoring psychologique.

**Conclusion** : tout document décrivant un "moteur de scoring sur 7 dimensions", des profils dominants, un radar chart ou une page `/moi/resultats` décrit une fonctionnalité qui n'existe pas dans le code actuel.

---

## 8. CRONS

Configurés dans `vercel.json` (4 crons, plan Vercel Pro requis) :

| Nom | Fréquence | Ce qu'il fait |
|-----|-----------|---------------|
| `detect-and-generate` | `0 6,14 * * *` (6h et 14h, tous les jours) | Détecte les signaux contextuels (anniversaires, silences, dates importantes) pour tous les contacts actifs, génère des suggestions proactives via LLM et les écrit dans `proactive_suggestions` |
| `email-reminders` | `0 10 * * *` (10h, tous les jours) | Envoie des emails de rappel aux utilisateurs ayant des suggestions proactives en attente non répondues |
| `cadence-feedback` | `0 4 * * 1` (4h, chaque lundi) | Calcule les métriques de validation/refus par fenêtre hebdomadaire et insère dans `cadence_feedback` |
| `lifecycle-check` | `0 3 * * *` (3h, tous les jours) | Fait passer les comptes en `paused` (30j d'inactivité) ou `silent` (90j d'inactivité), envoie notifications |

---

## 9. CONFIG

### Dépendances principales (`package.json`)
| Package | Version |
|---------|---------|
| next | 16.2.4 |
| react | 19.2.4 |
| react-dom | 19.2.4 |
| @anthropic-ai/sdk | ^0.91.0 |
| @supabase/ssr | ^0.10.2 |
| @supabase/supabase-js | ^2.104.1 |
| resend | ^6.12.3 |
| web-push | ^3.6.7 |
| tailwindcss | ^4 |
| typescript | ^5 |

### Variables d'environnement (`.env.example`)
| Variable | Usage |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé anon publique Supabase (nom non-standard — convention habituelle : `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin Supabase (bypass RLS, utilisée côté serveur) |
| `ANTHROPIC_API_KEY` | Clé API Anthropic pour tous les appels Claude |
| `RESEND_API_KEY` | Clé Resend pour les emails transactionnels |
| `RESEND_FROM_EMAIL` | Adresse d'expédition des emails |
| `BETA_PASSWORD` | Mot de passe pour l'accès beta (`/beta-access`) |
| `CRON_SECRET` | Token de sécurisation des routes cron (`Authorization: Bearer`) |

---

## 10. CE QUI MANQUE OU SEMBLE CASSÉ

### Champs DB jamais écrits par le code

| Champ | Table | Constat |
|-------|-------|---------|
| `additional_notes` | `my_profile` | Colonne existante, dans le type TypeScript, utilisée par `api/suggestions` (ligne 86) et `api/confidences` — mais `SelfProfileForm` ne l'écrit plus depuis la refonte Phase 7. Systématiquement `null` pour tous les profils créés post-Phase 7. |
| `questionnaire_input_mode` | `my_profile` | Colonne ajoutée en migration-9, présente dans le type `MyProfile`, mais `SelfProfileForm` ne l'écrit jamais. Toujours `null`. |
| `onboarding_completed` | `my_profile` | Colonne en DB, écrite par `OnboardingFlow.tsx` (upsert direct) et lue dans `dashboard/page.tsx` — mais absente du type `MyProfile` (cast manuel `as { onboarding_completed?: boolean }`). Incohérence de typage. |
| `has_children` | `my_profile` | Colonne en DB (migration-4), dans le type `MyProfile` — mais aucun formulaire ne la demande ni ne l'écrit. |
| `pilote_difficult_period_until` | `my_profile` | Colonne en DB (migration-5), dans le type — aucun UI ne permet de la renseigner. Semble prévue pour un mode "période difficile" non implémenté. |
| `pilote_last_achievement_at` | `my_profile` | Même constat que `pilote_difficult_period_until`. |
| `additional_notes` | `questionnaire_responses` | Présente dans le schéma de base et dans le type `QuestionnaireResponse` — `QuestionnaireForm.tsx` (ancien flow) l'écrit, mais le flow Phase 7 (`SharedForm.tsx`) ne la remplit pas. |

### Colonnes orphelines suspectées en vraie DB Supabase mais absentes des migrations du repo

Les colonnes `energy_type`, `conflict_style`, `food_preferences`, `surprise_preference`, `wishlist` sont mentionnées comme existant dans la vraie DB Supabase — **aucune de ces colonnes ne figure dans aucun fichier de migration du repo ni dans le code source**. Elles préexistaient probablement à la migration-2 et n'ont jamais été déclarées dans les fichiers versionnés.

### Tables incomplètes ou à risque

| Table | Constat |
|-------|---------|
| `suggestions` (ancienne) | Coexiste avec `proactive_suggestions`. Encore active : `api/suggestions` y écrit, `contacts/[id]/page.tsx` et `dashboard/page.tsx` y lisent. Deux systèmes de suggestions en parallèle — risque de confusion. |
| `shared_profile_responses` | `api/questionnaire/proche-register` y écrit les réponses anonymes d'un proche. Aucun code ne relit ensuite ces données pour les transférer dans `questionnaire_responses` d'un contact. Les données y entrent mais ne sont jamais exploitées. |
| `cadence_log` | Table créée en migration-7, écrite par `lib/cadence/resolver.ts`. Le resolver est appelé indirectement — à vérifier que les données y arrivent réellement en production. |

### Routes incomplètes / TODO

| Localisation | Constat |
|-------------|---------|
| `api/proactive-suggestions/[id]/validate/route.ts:46` | `// TODO Phase 7: trigger facilitation flow (booking, purchase, etc.)` — fonctionnalité de facilitation non implémentée |
| `components/dashboard/ProactiveSuggestionDetail.tsx:165` | `{/* TODO Phase 7: facilitation flow (booking, etc.) */}` — même TODO côté UI |

### Décalages intention / implémentation

| Sujet | Décalage |
|-------|---------|
| Flow proche | Deux flows parallèles : `/profil/[id]` (ancien, via PublicForm + api/profil/submit) et `/profil-partage/[token]` (Phase 7, via SharedForm + api/questionnaire/proche-register). L'ancien n'a pas été supprimé. Les deux écrivent dans des tables différentes (`questionnaire_responses` vs `shared_profile_responses`). |
| Env var Supabase | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` est un nom non-standard. Les clients Supabase (`client.ts`, `server.ts`, `middleware.ts`) doivent impérativement référencer la même clé. |
| `api/cron/detect-and-generate` | La route vérifie `CRON_SECRET` en header `Authorization: Bearer`. La route manual (`/manual`) est une route POST séparée — à vérifier si elle est aussi protégée. |
| Mode vocal questionnaire | `VoiceMode.tsx` + `candice-speak.ts` + `listen.ts` utilisent les Web Speech APIs (SpeechRecognition / SpeechSynthesisUtterance) — non disponibles sur iOS Safari sans flag expérimental. Aucun fallback dans le code. |
