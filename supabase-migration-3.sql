-- Migration 3 : colonnes et tables manquantes utilisées par le code mais absentes du schéma initial
-- À exécuter dans le SQL Editor de Supabase

-- 3.1 Colonne archived_at sur contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- 3.2 Colonne last_reminder_sent_at sur contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

-- 3.3 Table profile_share_requests (référencée dans le code mais inexistante)
CREATE TABLE IF NOT EXISTS profile_share_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked')),
  confirmed_with_reauth BOOLEAN DEFAULT FALSE,
  reauth_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

ALTER TABLE profile_share_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_share_requests" ON profile_share_requests
  FOR ALL USING (auth.uid() = requester_id);

CREATE POLICY "users_see_requests_for_their_profile" ON profile_share_requests
  FOR SELECT USING (auth.uid() = profile_owner_id);

CREATE POLICY "users_respond_to_requests_for_their_profile" ON profile_share_requests
  FOR UPDATE USING (auth.uid() = profile_owner_id);

CREATE INDEX IF NOT EXISTS idx_share_requests_requester ON profile_share_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_share_requests_owner ON profile_share_requests(profile_owner_id);
CREATE INDEX IF NOT EXISTS idx_share_requests_status ON profile_share_requests(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_share_requests_unique_active
  ON profile_share_requests(requester_id, profile_owner_id)
  WHERE status IN ('pending', 'accepted');
