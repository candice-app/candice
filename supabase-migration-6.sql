-- Phase 4: Notifications push + emails de rappel

-- 6.1 push_subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL,
  p256dh_key  TEXT        NOT NULL,
  auth_key    TEXT        NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_push_subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

-- 6.2 notification_log
CREATE TABLE IF NOT EXISTS notification_log (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel                TEXT        NOT NULL CHECK (channel IN ('push', 'email')),
  notification_type      TEXT        NOT NULL,
  related_suggestion_id  UUID        REFERENCES proactive_suggestions(id) ON DELETE SET NULL,
  related_signal_id      UUID        REFERENCES contextual_signals(id) ON DELETE SET NULL,
  title                  TEXT,
  body                   TEXT,
  status                 TEXT        NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'opened', 'clicked')),
  sent_at                TIMESTAMPTZ DEFAULT NOW(),
  opened_at              TIMESTAMPTZ,
  clicked_at             TIMESTAMPTZ,
  error_message          TEXT
);
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_notification_log" ON notification_log FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notif_log_user ON notification_log(user_id, sent_at DESC);

-- 6.3 Préférences notifications sur my_profile
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS notif_push_enabled   BOOLEAN DEFAULT TRUE;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS notif_email_enabled   BOOLEAN DEFAULT TRUE;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS notif_quiet_hours_start INTEGER DEFAULT 21 CHECK (notif_quiet_hours_start BETWEEN 0 AND 23);
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS notif_quiet_hours_end   INTEGER DEFAULT 8  CHECK (notif_quiet_hours_end   BETWEEN 0 AND 23);
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS notif_max_per_day       INTEGER DEFAULT 2  CHECK (notif_max_per_day       BETWEEN 0 AND 10);
