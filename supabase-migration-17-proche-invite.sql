-- Migration 17 — Onboarding Proche : fondation

-- 1. Link authenticated Proche account back to Pilote's contact record
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS proche_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Canonical invite-link table (replaces the old share_links flow)
CREATE TABLE IF NOT EXISTS invite_links (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token       text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  pilote_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id  uuid REFERENCES contacts(id) ON DELETE SET NULL,
  pilote_name text,
  expires_at  timestamptz DEFAULT (now() + interval '30 days'),
  used_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;

-- Pilotes can manage their own invite links
CREATE POLICY "pilote_manage_invite_links"
  ON invite_links FOR ALL
  USING (auth.uid() = pilote_id);

-- Fast token lookups (used by landing page + link API)
CREATE INDEX IF NOT EXISTS idx_invite_links_token ON invite_links(token);

-- Control query
SELECT column_name FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name = 'proche_user_id';
