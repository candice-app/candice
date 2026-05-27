-- Migration 20: Incognito questionnaire support
-- Adds gender to contacts, attention_reception + incognito_signals to questionnaire_responses

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS gender TEXT
  CHECK(gender IN ('femme', 'homme', 'non_binaire', 'non_precise'));

ALTER TABLE questionnaire_responses
  ADD COLUMN IF NOT EXISTS attention_reception JSONB,
  ADD COLUMN IF NOT EXISTS incognito_signals JSONB;
