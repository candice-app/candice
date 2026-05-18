-- Phase 5: Cadence dynamique

-- 7.1 cadence_log : journal des décisions du moteur de cadence
CREATE TABLE IF NOT EXISTS cadence_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id      UUID        REFERENCES contacts(id) ON DELETE CASCADE,
  decision_at     TIMESTAMPTZ DEFAULT NOW(),
  computed_cadence TEXT       NOT NULL CHECK (computed_cadence IN ('discreet','normal','sustained','intense')),
  reason          TEXT,
  factors         JSONB       DEFAULT '{}'::jsonb
);
ALTER TABLE cadence_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_cadence_log" ON cadence_log FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_cadence_log_user_contact ON cadence_log(user_id, contact_id, decision_at DESC);

-- 7.2 cadence_feedback : ajustement basé sur le comportement validation/refus
CREATE TABLE IF NOT EXISTS cadence_feedback (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id              UUID        REFERENCES contacts(id) ON DELETE CASCADE,
  window_start            DATE        NOT NULL,
  window_end              DATE        NOT NULL,
  suggestions_count       INTEGER     DEFAULT 0,
  validated_count         INTEGER     DEFAULT 0,
  refused_count           INTEGER     DEFAULT 0,
  snoozed_count           INTEGER     DEFAULT 0,
  ignored_count           INTEGER     DEFAULT 0,
  validation_rate         DECIMAL(5,2),
  recommended_adjustment  TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cadence_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_cadence_feedback" ON cadence_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_cadence_feedback_user ON cadence_feedback(user_id, created_at DESC);
