-- Migration 34 — lifetime_trial flag
-- Additive only. Run in Supabase SQL editor.

ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS lifetime_trial boolean NOT NULL DEFAULT false;

-- Seed: internal accounts get unlimited trial
UPDATE my_profile
SET lifetime_trial = true
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'thibaud.vicari@gmail.com',
    'papillon.estelle@gmail.com',
    'candiceapp.hello@gmail.com'
  )
);
