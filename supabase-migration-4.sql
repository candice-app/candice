-- Migration 4 : moteur proactif — signaux contextuels + suggestions proactives
-- À exécuter dans le SQL Editor de Supabase

-- 4.1 Table contextual_signals
CREATE TABLE IF NOT EXISTS contextual_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  signal_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  trigger_date DATE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','consumed','expired','dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
ALTER TABLE contextual_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_signals" ON contextual_signals FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_signals_user_status ON contextual_signals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_signals_trigger_date ON contextual_signals(trigger_date) WHERE status = 'active';

-- 4.2 Table proactive_suggestions
CREATE TABLE IF NOT EXISTS proactive_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES contextual_signals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  reasoning TEXT,
  estimated_price TEXT,
  partner_hint TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','validated','refused','snoozed','expired')),
  refusal_reason TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
ALTER TABLE proactive_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_proactive_suggestions" ON proactive_suggestions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_user_status ON proactive_suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_proactive_priority ON proactive_suggestions(priority) WHERE status = 'pending';

-- 4.3 Colonnes additionnelles sur contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS proximity_level TEXT DEFAULT 'close' CHECK (proximity_level IN ('inner_circle','close','extended','distant'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS cadence_override TEXT CHECK (cadence_override IN ('discreet','normal','sustained','intense'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_suggestion_at TIMESTAMPTZ;

-- 4.4 Colonnes sur my_profile
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS cadence_preference TEXT DEFAULT 'normal' CHECK (cadence_preference IN ('discreet','normal','sustained','intense'));
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT FALSE;

-- 4.5 Table cron_runs (journal admin)
CREATE TABLE IF NOT EXISTS cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running','success','error')),
  signals_detected INTEGER DEFAULT 0,
  suggestions_generated INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_cron_runs_recent ON cron_runs(started_at DESC);
