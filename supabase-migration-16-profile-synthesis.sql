-- Migration 16 — Module 5 : Fiche profil de synthèse

ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS profile_synthesis      jsonb,
  ADD COLUMN IF NOT EXISTS synthesis_computed_at  timestamptz;

-- Control query
SELECT user_id,
       profile_synthesis IS NOT NULL    AS has_synthesis,
       synthesis_computed_at
FROM my_profile
LIMIT 5;
