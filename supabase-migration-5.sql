-- Phase 3: Conversational mode + bilateral care
-- Tables: confidences, profile_updates_from_confidences
-- Alters: proactive_suggestions.contact_id nullable, new my_profile columns

-- 1. confidences
CREATE TABLE IF NOT EXISTS confidences (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id       UUID        REFERENCES contacts(id) ON DELETE SET NULL,
  raw_text         TEXT        NOT NULL,
  input_mode       TEXT        NOT NULL DEFAULT 'text' CHECK (input_mode IN ('text', 'voice')),
  detected_subject TEXT        NOT NULL CHECK (detected_subject IN ('contact', 'pilote', 'general')),
  emotional_tone   TEXT        NOT NULL CHECK (emotional_tone IN ('positive', 'negative', 'neutral', 'mixed', 'urgent')),
  candice_response TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE confidences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own confidences" ON confidences
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_confidences_user_id    ON confidences(user_id);
CREATE INDEX idx_confidences_contact_id ON confidences(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_confidences_created_at ON confidences(user_id, created_at DESC);

-- 2. profile_updates_from_confidences
CREATE TABLE IF NOT EXISTS profile_updates_from_confidences (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confidence_id UUID        NOT NULL REFERENCES confidences(id) ON DELETE CASCADE,
  contact_id    UUID        REFERENCES contacts(id) ON DELETE CASCADE,
  field_name    TEXT        NOT NULL,
  old_value     TEXT,
  new_value     TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ
);

ALTER TABLE profile_updates_from_confidences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile updates" ON profile_updates_from_confidences
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_profile_updates_user_id    ON profile_updates_from_confidences(user_id);
CREATE INDEX idx_profile_updates_pending    ON profile_updates_from_confidences(user_id, status) WHERE status = 'pending';
CREATE INDEX idx_profile_updates_confidence ON profile_updates_from_confidences(confidence_id);

-- 3. Allow pilote-level suggestions (contact_id nullable)
ALTER TABLE proactive_suggestions ALTER COLUMN contact_id DROP NOT NULL;

-- 4. Bilateral care columns on my_profile
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS pilote_difficult_period_until DATE DEFAULT NULL;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS pilote_last_achievement_at   DATE DEFAULT NULL;
