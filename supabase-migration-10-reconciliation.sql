-- Migration 10 — Réconciliation schéma repo ↔ base Supabase de production
-- Appliquée le : À COMPLÉTER
--
-- CONTEXTE : les colonnes ci-dessous existent en prod mais n'apparaissent dans
-- aucun fichier de migration numéroté (migration-2 à migration-9).
-- Elles ont été créées via supabase-schema.sql appliqué manuellement.
-- Ce fichier les rend explicitement idempotentes dans la séquence de migrations.
--
-- ORPHELINES À ARBITRER (présentes en prod, absentes du code et des migrations)
-- NE PAS SUPPRIMER sans validation explicite :
--   ALTER TABLE my_profile DROP COLUMN energy_type;        -- probablement remplacé par social_energy
--   ALTER TABLE my_profile DROP COLUMN conflict_style;     -- probablement remplacé par conflict_resolution
--   ALTER TABLE my_profile DROP COLUMN food_preferences;   -- probablement remplacé par favorite_foods
--   ALTER TABLE my_profile DROP COLUMN surprise_preference; -- concept non recouvert par le formulaire actuel
--   ALTER TABLE my_profile DROP COLUMN wishlist;           -- concept géré côté contacts.gift_wishlist (JSONB)
--
-- NOTE : hobbies est bien TEXT (pas ARRAY) dans toute la chaîne — aucune correction nécessaire.

-- ─── Colonnes issues du schéma initial (supabase-schema.sql) ──────────────────
-- Garantit leur présence quelle que soit la séquence d'application des migrations.

ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS social_energy          TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS conflict_resolution     TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS decision_making         TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS emotional_expression    TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS core_values             TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS recognition_preference  TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS boundaries              TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS growth_mindset          TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS favorite_foods          TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS gift_preference         TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS conversation_topics     TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS things_to_avoid         TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS best_contact_method     TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS important_dates         TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS clothing_size           TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS shoe_size               TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS ring_size               TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS pants_size              TEXT;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS pets                    TEXT;
