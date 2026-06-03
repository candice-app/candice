-- Migration 22: Add interests JSONB column to questionnaire_responses
ALTER TABLE questionnaire_responses ADD COLUMN IF NOT EXISTS interests JSONB;
