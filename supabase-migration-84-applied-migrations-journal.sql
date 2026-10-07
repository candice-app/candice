-- Migration 84 — journal des migrations (applied_migrations).
-- REJOUABLE sans dommage (CREATE IF NOT EXISTS, backfill auto-vérifiant, ON CONFLICT DO NOTHING).
--
-- Le journal n'existait pas. La table applied_migrations ci-dessous devient, à partir d'ICI,
-- la trace d'application — chaque migration future s'y inscrit en DERNIÈRE instruction.
--
-- Backfill AUTO-VÉRIFIANT : chaque migration 1→83 n'est inscrite QUE si un objet-signature
-- qu'elle a créé existe réellement en base (le schéma établit l'application, jamais la liste
-- de fichiers). Les migrations suivantes NE sont PAS backfillées (aucun objet vérifiable
-- aujourd'hui) — leur application réelle est connue mais non prouvable par le schéma seul :
--   • sans objet de schéma (data/valeurs) : supabase-migration-23b-dedup.sql, supabase-migration-31-discovery-bloc2.sql, supabase-migration-33-discovery-brain.sql, supabase-migration-48-discovery-questions-rework.sql, supabase-migration-51-socle-scope-backfill.sql, supabase-migration-59-nudge-labels.sql, supabase-migration-67-fuse-gift-wishlist.sql, supabase-migration-78-cron-metadata-purge.sql
--   • objets entièrement supersédés (droppés depuis) : supabase-migration-60-perf-beacons.sql, supabase-migration-62-perf-beacons-v2.sql
-- Estelle peut les ajouter à la main si elle le souhaite (elles ont bien tourné).

BEGIN;

CREATE TABLE IF NOT EXISTS applied_migrations (
  filename   text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO applied_migrations (filename) SELECT 'supabase-schema.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='contacts')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-2.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='phone')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-3.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='archived_at')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-4.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='contextual_signals')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-5.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='confidences')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-6.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='push_subscriptions')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-7.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cadence_log')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-8.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notification_log' AND column_name='notification_type')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-9.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='physical_contact_with')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-10-reconciliation.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='social_energy')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-11-attention-vectors.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='attention_answers')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-12-attention-breath-text.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='attention_breath_text')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-13-temperament.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='temperament_answers')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-14-lifestyle.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='lifestyle_answers')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-15-singularite-pratique.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='singularity_answers')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-16-profile-synthesis.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='profile_synthesis')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-17-proche-invite.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='proche_user_id')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-18-recommendations.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='contact_recommendations')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-19-relationship-register.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='relationship_register')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-20-incognito-questionnaire.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='gender')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-21-feedback-context.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='context_journal' AND column_name='type')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-22-interests.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='questionnaire_responses' AND column_name='interests')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-23-idempotency.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='idempotency_key')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-24-memories.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='memories')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-25-wishlist.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='carnet_envies_items')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-26-memories-v2.sql'
  WHERE EXISTS (SELECT 1 FROM pg_constraint WHERE conname='memories_sentiment_check')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-27-signals.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='signals')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-28-processing-log.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='processing_log')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-29-discovery.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='discovery_questions')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-30-profile-analysis.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profile_analysis')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-32-gender-situations.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='grammatical_gender')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-34-lifetime-trial.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='lifetime_trial')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-35-date-de-naissance.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='date_de_naissance')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-36-contact-date-naissance.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='date_de_naissance')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-37-is-findable.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='is_findable')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-38-lookup-security.sql'
  WHERE EXISTS (SELECT 1 FROM pg_proc pr JOIN pg_namespace n ON n.oid=pr.pronamespace WHERE n.nspname='public' AND pr.proname='lookup_candice_user_by_email')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-39-data-source.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='questionnaire_responses' AND column_name='data_source')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-40-contact-consents.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='contact_consents')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-41-budget-feedback.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='budget_feedback')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-42-savings.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='savings_goal')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-43-wishlist-sourcing.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='carnet_envies_items' AND column_name='requires_payment_sourcing')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-44-contacts-postal-address.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='postal_address')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-45-fix-public-read-my-profile.sql'
  WHERE NOT (EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='my_profile' AND policyname='public_read_my_profile'))
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-46-drop-legacy-sharing.sql'
  WHERE NOT (EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='my_profile' AND policyname='read_own_or_shared_profile'))
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-47-profile-analysis-enriched.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profile_analysis' AND column_name='insights')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-49-handle-profile-view.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='handle')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-50-profile-share-links.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profile_share_links')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-52-question-status.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profile_completion' AND column_name='status')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-53-fragrance-bank.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='discovery_questions' AND column_name='benefit_label')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-54-analysis-v2-fields.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profile_analysis' AND column_name='summary_long')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-55-avatars.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='avatar_path')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-56-locked-text.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='discovery_questions' AND column_name='locked_text')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-57-my-wishlist.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='my_wishlist_items')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-58-scope-v2-mapping.sql'
  WHERE EXISTS (SELECT 1 FROM pg_proc pr JOIN pg_namespace n ON n.oid=pr.pronamespace WHERE n.nspname='public' AND pr.proname='map_scope_v1_to_v2')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-61-onboarding-completed.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_profile' AND column_name='onboarding_completed')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-63-personalized-text.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profile_completion' AND column_name='personalized_text')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-64-drop-perf-beacons.sql'
  WHERE NOT (EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='perf_beacons'))
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-65-wishlist-v2-fields.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_wishlist_items' AND column_name='photo_url')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-66-carnet-v2-fields.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='carnet_envies_items' AND column_name='size_ref')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-68-wishlist-reservation.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='my_wishlist_items' AND column_name='reservation_status')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-69-contact-reco-items.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='contact_reco_items')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-70-reco-refusals.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reco_refusals')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-71-person-states.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='person_states')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-72-cross-validations.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cross_validations')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-73-finance-plans.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='finance_plans')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-74-attention-love-level.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='attention_log' AND column_name='love_level')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-75-reco-refusal-occasion.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reco_refusals' AND column_name='reserved_for_occasion')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-76-cron-runs-rls.sql'
  WHERE EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='cron_runs' AND c.relrowsecurity)
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-77-share-links-no-enum.sql'
  WHERE NOT (EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='share_links' AND policyname='public_read_share_links'))
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-79-processing-log-step-check.sql'
  WHERE EXISTS (SELECT 1 FROM pg_constraint WHERE conname='processing_log_step_check')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-80-profile-analysis-generation-meta.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profile_analysis' AND column_name='generation_meta')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-81-questionnaire-responses-unique.sql'
  WHERE EXISTS (SELECT 1 FROM pg_constraint WHERE conname='questionnaire_responses_contact_user_key')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-82-knowledge-schema.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='knowledge_sources')
  ON CONFLICT (filename) DO NOTHING;
INSERT INTO applied_migrations (filename) SELECT 'supabase-migration-83-about-ref.sql'
  WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='knowledge_sources' AND column_name='about_kind')
  ON CONFLICT (filename) DO NOTHING;

-- DERNIÈRE INSTRUCTION — auto-enregistrement (convention permanente à partir de la 84).
INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-84-applied-migrations-journal.sql')
  ON CONFLICT (filename) DO NOTHING;

COMMIT;
