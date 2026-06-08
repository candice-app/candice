-- Migration 36 — date_de_naissance column on contacts
-- Additive only. Never touches existing data.
-- RLS policy "users_own_contacts" ON contacts FOR ALL USING (auth.uid() = user_id)
-- covers this column automatically — no new policy needed.

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS date_de_naissance date;
