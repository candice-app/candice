-- Migration 14 — Module 3 : Lifestyle + Ce qu'il vaut mieux éviter

ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS lifestyle_answers     jsonb,
  ADD COLUMN IF NOT EXISTS lifestyle_axes        jsonb,
  ADD COLUMN IF NOT EXISTS relational_filters    jsonb,
  ADD COLUMN IF NOT EXISTS lifestyle_computed_at timestamptz;

-- Control query
SELECT user_id,
       lifestyle_answers IS NOT NULL     AS has_lifestyle_answers,
       lifestyle_axes IS NOT NULL        AS has_lifestyle_axes,
       relational_filters IS NOT NULL    AS has_relational_filters,
       lifestyle_computed_at
FROM my_profile
LIMIT 5;
