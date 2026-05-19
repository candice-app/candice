-- Phase 7: Questionnaire refonte mobile-first
-- Migration 9 — Champs conditionnels physical_contact_with + input_mode
-- Appliquée en prod le 18 mai 2026

-- 9.1 my_profile : physical_contact_with (multi-valeurs)
ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS physical_contact_with TEXT[];

-- 9.2 my_profile : questionnaire_input_mode (texte ou vocal)
ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS questionnaire_input_mode TEXT;

-- 9.3 questionnaire_responses : physical_contact_with (multi-valeurs)
ALTER TABLE questionnaire_responses
  ADD COLUMN IF NOT EXISTS physical_contact_with TEXT[];

-- 9.4 questionnaire_responses : input_mode (texte ou vocal)
ALTER TABLE questionnaire_responses
  ADD COLUMN IF NOT EXISTS input_mode TEXT;
