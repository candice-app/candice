-- Migration 15 — Module 4 : Singularité + Informations pratiques

ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS singularity_answers    jsonb,
  ADD COLUMN IF NOT EXISTS practical_info         jsonb,
  ADD COLUMN IF NOT EXISTS practical_computed_at  timestamptz;

-- Control query
SELECT user_id,
       singularity_answers IS NOT NULL    AS has_singularity,
       practical_info IS NOT NULL         AS has_practical,
       practical_computed_at
FROM my_profile
LIMIT 5;
