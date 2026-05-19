-- Phase 6: Cycle de vie utilisateur + modes spéciaux

-- 8.0 Extension notification_log
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS notification_type TEXT;

-- 8.1 Extension de contacts pour mode souvenir
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS archive_reason TEXT CHECK (archive_reason IN ('deceased','lost_contact','end_of_relationship','other'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_memory_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS memory_anniversary_opt_out BOOLEAN DEFAULT FALSE;

-- 8.2 Extension my_profile pour cycle de vie
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial','active','paused','silent','cancelled'));
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS subscription_paused_at TIMESTAMPTZ;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS silent_since TIMESTAMPTZ;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ;

-- 8.3 Table account_lifecycle_events : journal des transitions de statut
CREATE TABLE IF NOT EXISTS account_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  triggered_by TEXT CHECK (triggered_by IN ('user','system','admin')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE account_lifecycle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_lifecycle" ON account_lifecycle_events FOR SELECT USING (auth.uid() = user_id);
