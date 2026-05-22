-- Migration 13 — Tempérament (Étapes 2-3)
-- Additive, idempotente. N'altère aucune colonne existante.

ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS temperament_answers     jsonb,
  ADD COLUMN IF NOT EXISTS temperament_axes        jsonb,
  ADD COLUMN IF NOT EXISTS temperament_modes       jsonb,
  ADD COLUMN IF NOT EXISTS temperament_computed_at timestamptz;

-- Contrôle : vérifier que les 4 colonnes existent
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'my_profile'
  AND column_name IN (
    'temperament_answers',
    'temperament_axes',
    'temperament_modes',
    'temperament_computed_at'
  )
ORDER BY column_name;
