# Audit des mutations Supabase — lecture du `.error`

> Chantier 0 — parcours ligne à ligne de tous les `.insert()`, `.update()`, `.upsert()`, `.delete()`.
> Rappel : `supabase-js` ne lève pas d'exception sur erreur DB — l'erreur est renvoyée dans `.error`. Une mutation qui ne lit pas `.error` échoue silencieusement.
> État « .error lu » = AVANT correction. Toutes les mutations non lues ont été corrigées (au minimum journalisation ; propagation en 500 sur les routes où l'écriture est l'opération).
> Généré le 2026-09-29.

## Chiffres

- **Mutations auditées : 164**
- **Sans lecture de `.error` (avant) : 118**
- **Corrigées : 118** (100 % des non-lues ; re-scan après correction : 0 mutation sans lecture de `.error`)

## Tableau

| Fichier | Ligne | Table | Op | `.error` lu (avant) | Corrigé |
|---|---|---|---|---|---|
| `src/app/api/account/cancel-deletion/route.ts` | 20 | my_profile | update | **non** | oui |
| `src/app/api/account/cancel-deletion/route.ts` | 27 | account_lifecycle_events | insert | **non** | oui |
| `src/app/api/account/delete/route.ts` | 25 | my_profile | update | **non** | oui |
| `src/app/api/account/delete/route.ts` | 32 | account_lifecycle_events | insert | **non** | oui |
| `src/app/api/cadence/auto-adjust/route.ts` | 55 | my_profile | update | **non** | oui |
| `src/app/api/candice-note/route.ts` | 54 | profile_notes | insert | **non** | oui |
| `src/app/api/confidences/route.ts` | 110 | confidences | insert | oui | — (déjà) |
| `src/app/api/confidences/route.ts` | 142 | profile_updates_from_confidences | insert | **non** | oui |
| `src/app/api/confidences/route.ts` | 162 | my_profile | update | **non** | oui |
| `src/app/api/confidences/route.ts` | 167 | my_profile | update | **non** | oui |
| `src/app/api/consent/[consentId]/respond/route.ts` | 68 | contact_consents | update | oui | — (déjà) |
| `src/app/api/contacts/[id]/cadence/route.ts` | 26 | contacts | update | oui | — (déjà) |
| `src/app/api/contacts/[id]/consent/route.ts` | 66 | contact_consents | insert | oui | — (déjà) |
| `src/app/api/contacts/archive/route.ts` | 25 | contacts | update | oui | — (déjà) |
| `src/app/api/contacts/create-incognito/route.ts` | 55 | contacts | insert | oui | — (déjà) |
| `src/app/api/contacts/create-incognito/route.ts` | 74 | context_journal | insert | oui | — (déjà) |
| `src/app/api/contacts/delete/route.ts` | 24 | contacts | delete | oui | — (déjà) |
| `src/app/api/contacts/unarchive/route.ts` | 14 | contacts | update | oui | — (déjà) |
| `src/app/api/contacts/upload-photo/route.ts` | 45 | contacts | update | **non** | oui |
| `src/app/api/cron/cadence-feedback/route.ts` | 23 | cron_runs | insert | **non** | oui |
| `src/app/api/cron/cadence-feedback/route.ts` | 68 | cadence_feedback | insert | oui | — (déjà) |
| `src/app/api/cron/cadence-feedback/route.ts` | 71 | cron_runs | insert | **non** | oui |
| `src/app/api/cron/cadence-feedback/route.ts` | 75 | cron_runs | insert | **non** | oui |
| `src/app/api/cron/detect-and-generate/route.ts` | 30 | cron_runs | insert | **non** | oui |
| `src/app/api/cron/detect-and-generate/route.ts` | 97 | cron_runs | update | **non** | oui |
| `src/app/api/cron/detect-and-generate/route.ts` | 122 | cron_runs | update | **non** | oui |
| `src/app/api/cron/email-reminders/route.ts` | 16 | cron_runs | insert | **non** | oui |
| `src/app/api/cron/email-reminders/route.ts` | 60 | cron_runs | update | **non** | oui |
| `src/app/api/cron/lifecycle-check/route.ts` | 45 | cron_runs | insert | **non** | oui |
| `src/app/api/cron/lifecycle-check/route.ts` | 94 | my_profile | update | **non** | oui |
| `src/app/api/cron/lifecycle-check/route.ts` | 96 | account_lifecycle_events | insert | **non** | oui |
| `src/app/api/cron/lifecycle-check/route.ts` | 116 | my_profile | update | **non** | oui |
| `src/app/api/cron/lifecycle-check/route.ts` | 118 | account_lifecycle_events | insert | **non** | oui |
| `src/app/api/cron/lifecycle-check/route.ts` | 154 | cron_runs | update | **non** | oui |
| `src/app/api/cron/lifecycle-check/route.ts` | 164 | cron_runs | update | **non** | oui |
| `src/app/api/discovery/answer/route.ts` | 73 | my_profile | update | **non** | oui |
| `src/app/api/discovery/answer/route.ts` | 87 | my_profile | update | **non** | oui |
| `src/app/api/discovery/answer/route.ts` | 111 | my_profile | update | **non** | oui |
| `src/app/api/emails/trial-reminder/route.ts` | 70 | notification_log | insert | **non** | oui |
| `src/app/api/handle/route.ts` | 28 | my_profile | upsert | oui | — (déjà) |
| `src/app/api/invite/create/route.ts` | 20 | invite_links | insert | oui | — (déjà) |
| `src/app/api/invite/link/route.ts` | 30 | invite_links | update | **non** | oui |
| `src/app/api/invite/link/route.ts` | 38 | contacts | update | **non** | oui |
| `src/app/api/invite/nudge/route.ts` | 35 | invite_links | insert | **non** | oui |
| `src/app/api/memories/[id]/route.ts` | 36 | memories | update | oui | — (déjà) |
| `src/app/api/memories/situation/action/route.ts` | 27 | memories | update | **non** | oui |
| `src/app/api/memories/situation/action/route.ts` | 32 | memories | update | **non** | oui |
| `src/app/api/memories/situation/route.ts` | 95 | memories | insert | oui | — (déjà) |
| `src/app/api/memories/w2/route.ts` | 52 | carnet_envies_items | insert | oui | — (déjà) |
| `src/app/api/parametres/cadence/route.ts` | 20 | my_profile | update | oui | — (déjà) |
| `src/app/api/parametres/notifications/route.ts` | 24 | my_profile | upsert | oui | — (déjà) |
| `src/app/api/proactive-suggestions/[id]/refuse/route.ts` | 50 | proactive_suggestions | update | **non** | oui |
| `src/app/api/proactive-suggestions/[id]/validate/route.ts` | 33 | proactive_suggestions | update | **non** | oui |
| `src/app/api/proactive-suggestions/[id]/validate/route.ts` | 37 | proactive_suggestions | update | **non** | oui |
| `src/app/api/profil/submit/route.ts` | 42 | questionnaire_responses | update | oui | — (déjà) |
| `src/app/api/profil/submit/route.ts` | 48 | questionnaire_responses | insert | oui | — (déjà) |
| `src/app/api/profile-notes/route.ts` | 12 | profile_notes | insert | oui | — (déjà) |
| `src/app/api/profile-updates/[id]/route.ts` | 60 | questionnaire_responses | update | **non** | oui |
| `src/app/api/profile-updates/[id]/route.ts` | 68 | profile_updates_from_confidences | update | **non** | oui |
| `src/app/api/profile-view/[consentId]/cancel/route.ts` | 20 | contact_consents | delete | oui | — (déjà) |
| `src/app/api/profile-view/[consentId]/respond/route.ts` | 54 | contact_consents | update | oui | — (déjà) |
| `src/app/api/profile-view/[consentId]/revoke/route.ts` | 21 | contact_consents | update | oui | — (déjà) |
| `src/app/api/profile-view/request/route.ts` | 64 | contact_consents | insert | oui | — (déjà) |
| `src/app/api/profile/art9/route.ts` | 33 | my_profile | upsert | oui | — (déjà) |
| `src/app/api/profile/avatar/route.ts` | 41 | my_profile | upsert | **non** | oui |
| `src/app/api/profile/practical/route.ts` | 69 | my_profile | upsert | oui | — (déjà) |
| `src/app/api/push/subscribe/route.ts` | 20 | push_subscriptions | upsert | oui | — (déjà) |
| `src/app/api/push/unsubscribe/route.ts` | 16 | push_subscriptions | delete | **non** | oui |
| `src/app/api/questionnaire/proche-register/route.ts` | 27 | shared_profile_responses | upsert | oui | — (déjà) |
| `src/app/api/recommendations/action/route.ts` | 22 | attention_log | update | **non** | oui |
| `src/app/api/recommendations/context/route.ts` | 15 | context_journal | update | **non** | oui |
| `src/app/api/recommendations/feedback/route.ts` | 27 | attention_log | update | **non** | oui |
| `src/app/api/recommendations/generate/route.ts` | 171 | contact_recommendations | upsert | **non** | oui |
| `src/app/api/recommendations/generate/route.ts` | 185 | attention_log | insert | **non** | oui |
| `src/app/api/recommendations/generate/route.ts` | 220 | context_journal | insert | **non** | oui |
| `src/app/api/share-link/[linkId]/revoke/route.ts` | 19 | profile_share_links | update | oui | — (déjà) |
| `src/app/api/share-link/create/route.ts` | 46 | profile_share_links | insert | oui | — (déjà) |
| `src/app/api/shared-profile/complete/route.ts` | 23 | user_points | insert | **non** | oui |
| `src/app/api/subscription/pause/route.ts` | 24 | my_profile | update | **non** | oui |
| `src/app/api/subscription/pause/route.ts` | 28 | account_lifecycle_events | insert | **non** | oui |
| `src/app/api/subscription/resume/route.ts` | 28 | my_profile | update | **non** | oui |
| `src/app/api/subscription/resume/route.ts` | 32 | account_lifecycle_events | insert | **non** | oui |
| `src/app/api/suggestions/route.ts` | 192 | suggestions | upsert | **non** | oui |
| `src/app/api/wishlist/offered/route.ts` | 22 | attention_log | insert | oui | — (déjà) |
| `src/app/contacts/[id]/CarnetV2Section.tsx` | 134 | carnet_envies_items | update | oui | — (déjà) |
| `src/app/contacts/[id]/CarnetV2Section.tsx` | 141 | carnet_envies_items | insert | oui | — (déjà) |
| `src/app/contacts/[id]/CarnetV2Section.tsx` | 156 | carnet_envies_items | update | **non** | oui |
| `src/app/contacts/[id]/ContactActions.tsx` | 71 | contacts | update | **non** | oui |
| `src/app/contacts/[id]/page.tsx` | 356 | context_journal | insert | **non** | oui |
| `src/app/contacts/[id]/questionnaire/IncognitoFlow.tsx` | 381 | questionnaire_responses | upsert | **non** | oui |
| `src/app/contacts/[id]/questionnaire/IncognitoFlow.tsx` | 396 | questionnaire_responses | upsert | **non** | oui |
| `src/app/contacts/[id]/questionnaire/IncognitoFlow.tsx` | 416 | questionnaire_responses | upsert | **non** | oui |
| `src/app/contacts/[id]/RegisterEditor.tsx` | 43 | contacts | update | **non** | oui |
| `src/app/contacts/[id]/RegisterEditor.tsx` | 71 | context_journal | delete | **non** | oui |
| `src/app/contacts/[id]/RegisterEditor.tsx` | 77 | context_journal | insert | **non** | oui |
| `src/app/moi/questionnaire/QuestionnaireFlow.tsx` | 326 | my_profile | upsert | **non** | oui |
| `src/app/moi/questionnaire/QuestionnaireFlow.tsx` | 378 | my_profile | upsert | **non** | oui |
| `src/app/moi/questionnaire/QuestionnaireFlow.tsx` | 440 | my_profile | upsert | **non** | oui |
| `src/app/moi/questionnaire/QuestionnaireFlow.tsx` | 511 | my_profile | upsert | **non** | oui |
| `src/app/moi/questionnaire/QuestionnaireFlow.tsx` | 556 | my_profile | upsert | **non** | oui |
| `src/app/moi/questionnaire/QuestionnaireFlow.tsx` | 563 | my_profile | upsert | **non** | oui |
| `src/app/moi/questionnaire/QuestionnaireFlow.tsx` | 596 | my_profile | upsert | **non** | oui |
| `src/app/moi/questionnaire/QuestionnaireFlow.tsx` | 603 | my_profile | upsert | **non** | oui |
| `src/app/moi/wishlist/WishlistV2Client.tsx` | 135 | my_wishlist_items | update | oui | — (déjà) |
| `src/app/moi/wishlist/WishlistV2Client.tsx` | 143 | my_wishlist_items | insert | oui | — (déjà) |
| `src/app/moi/wishlist/WishlistV2Client.tsx` | 170 | my_wishlist_items | delete | **non** | oui |
| `src/app/parametres/compte/CompteActions.tsx` | 83 | my_profile | update | oui | — (déjà) |
| `src/app/parametres/confidentialite/ConfidentialiteActions.tsx` | 77 | my_profile | update | **non** | oui |
| `src/app/proche/[id]/EspaceProcheShell.tsx` | 201 | reco_refusals | insert | **non** | oui |
| `src/app/proche/[id]/EspaceProcheShell.tsx` | 204 | contact_reco_items | update | **non** | oui |
| `src/app/proche/[id]/EspaceProcheShell.tsx` | 212 | reco_refusals | insert | **non** | oui |
| `src/app/proche/[id]/EspaceProcheShell.tsx` | 216 | contact_reco_items | update | **non** | oui |
| `src/app/proche/[id]/EspaceProcheShell.tsx` | 224 | attention_log | insert | **non** | oui |
| `src/app/proche/[id]/EspaceProcheShell.tsx` | 228 | contact_reco_items | update | **non** | oui |
| `src/app/proche/[id]/EspaceProcheShell.tsx` | 239 | reco_refusals | insert | **non** | oui |
| `src/app/proche/[id]/EspaceProcheShell.tsx` | 243 | contact_reco_items | update | **non** | oui |
| `src/app/proche/[id]/EspaceProcheShell.tsx` | 254 | contact_reco_items | update | **non** | oui |
| `src/app/proche/[id]/EspaceProcheShell.tsx` | 270 | person_states | insert | **non** | oui |
| `src/app/register/page.tsx` | 215 | my_profile | upsert | **non** | oui |
| `src/components/onboarding/OnboardingFlow.tsx` | 63 | my_profile | upsert | **non** | oui |
| `src/components/profile/GenderModal.tsx` | 41 | my_profile | update | **non** | oui |
| `src/components/questionnaire/AttentionStep.tsx` | 210 | my_profile | upsert | oui | — (déjà) |
| `src/components/questionnaire/AttentionStep.tsx` | 243 | my_profile | update | **non** | oui |
| `src/components/questionnaire/GenderStep.tsx` | 41 | my_profile | upsert | **non** | oui |
| `src/components/questionnaire/QuestionnaireForm.tsx` | 239 | context_journal | insert | **non** | oui |
| `src/components/questionnaire/QuestionnaireForm.tsx` | 262 | contacts | insert | oui | — (déjà) |
| `src/components/questionnaire/QuestionnaireForm.tsx` | 401 | contacts | insert | oui | — (déjà) |
| `src/components/questionnaire/QuestionnaireForm.tsx` | 411 | questionnaire_responses | insert | oui | — (déjà) |
| `src/lib/brain/orchestrator.ts` | 28 | processing_log | insert | **non** | oui |
| `src/lib/brain/orchestrator.ts` | 70 | signals | update | **non** | oui |
| `src/lib/brain/orchestrator.ts` | 78 | signals | update | **non** | oui |
| `src/lib/brain/orchestrator.ts` | 94 | context_journal | insert | **non** | oui |
| `src/lib/brain/orchestrator.ts` | 156 | memories | insert | oui | — (déjà) |
| `src/lib/brain/orchestrator.ts` | 224 | signals | insert | **non** | oui |
| `src/lib/cadence/resolver.ts` | 163 | cadence_log | insert | **non** | oui |
| `src/lib/discovery/engine.ts` | 207 | profile_completion | upsert | **non** | oui |
| `src/lib/discovery/engine.ts` | 229 | my_profile | update | **non** | oui |
| `src/lib/discovery/engine.ts` | 252 | discovery_sessions | update | **non** | oui |
| `src/lib/discovery/engine.ts` | 260 | discovery_sessions | update | **non** | oui |
| `src/lib/discovery/engine.ts` | 274 | discovery_sessions | update | **non** | oui |
| `src/lib/discovery/engine.ts` | 477 | discovery_sessions | insert | **non** | oui |
| `src/lib/discovery/engine.ts` | 491 | profile_completion | upsert | **non** | oui |
| `src/lib/discovery/engine.ts` | 539 | profile_completion | upsert | **non** | oui |
| `src/lib/discovery/status.ts` | 73 | profile_completion | upsert | **non** | oui |
| `src/lib/lifecycle/track-activity.ts` | 22 | my_profile | update | **non** | oui |
| `src/lib/lifecycle/track-activity.ts` | 25 | account_lifecycle_events | insert | **non** | oui |
| `src/lib/lifecycle/track-activity.ts` | 35 | my_profile | update | **non** | oui |
| `src/lib/notifications/email-reminder.ts` | 109 | notification_log | insert | **non** | oui |
| `src/lib/notifications/push-sender.ts` | 94 | push_subscriptions | delete | **non** | oui |
| `src/lib/notifications/push-sender.ts` | 98 | notification_log | insert | **non** | oui |
| `src/lib/profile/generateProfileAnalysis.ts` | 460 | processing_log | insert | oui | — (déjà) |
| `src/lib/profile/generateProfileAnalysis.ts` | 765 | profile_analysis | update | **non** | oui |
| `src/lib/profile/generateProfileAnalysis.ts` | 771 | profile_analysis | insert | **non** | oui |
| `src/lib/share-links.ts` | 45 | profile_share_links | update | **non** | oui |
| `src/lib/share-links.ts` | 55 | profile_share_links | update | **non** | oui |
| `src/lib/share-links.ts` | 68 | profile_share_links | update | **non** | oui |
| `src/lib/share-links.ts` | 92 | contact_consents | insert | oui | — (déjà) |
| `src/lib/signals/detector.ts` | 108 | contextual_signals | insert | oui | — (déjà) |
| `src/lib/signals/generator.ts` | 239 | proactive_suggestions | insert | oui | — (déjà) |
| `src/lib/signals/generator.ts` | 271 | contextual_signals | update | **non** | oui |
| `src/lib/signals/generator.ts` | 314 | contextual_signals | update | **non** | oui |
| `src/lib/signals/generator.ts` | 392 | proactive_suggestions | insert | oui | — (déjà) |
| `src/lib/signals/generator.ts` | 424 | contextual_signals | update | **non** | oui |
| `src/utils/awardPoints.ts` | 29 | user_points | insert | **non** | oui |
