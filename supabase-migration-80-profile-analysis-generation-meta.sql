-- Migration 80 — profile_analysis.generation_meta (Lot A — réparations moteur d'analyse).
--
-- Trace en base l'état de chacun des deux appels IA de generateProfileAnalysis :
--   { "entity_extraction": { "status": "success|fallback", "model": "…" },
--     "narrative":         { "status": "success|fallback", "model": "…" },
--     "generated_at":      "<ISO>" }
-- status = 'success' si le JSON du modèle a été parsé, 'fallback' sinon.
-- Additive ; RLS existante (owner) inchangée.

ALTER TABLE profile_analysis ADD COLUMN IF NOT EXISTS generation_meta jsonb;
