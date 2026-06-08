-- Migration 35 — date_de_naissance column on my_profile
-- Additive only. Never touches existing data.
-- Note: practical_info->>'age' is deprecated — no longer written by the app,
-- existing values are retained in place and not deleted.

ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS date_de_naissance date;
