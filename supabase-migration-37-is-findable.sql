-- LOT 4.3a — Lookup opt-out flag
-- Adds is_findable to my_profile. DEFAULT true = opt-out model.
-- Existing rows are backfilled with true automatically.
ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS is_findable BOOLEAN NOT NULL DEFAULT true;

-- Partial index: only findable rows need to be searched
CREATE INDEX IF NOT EXISTS my_profile_is_findable_phone_idx ON my_profile (phone) WHERE is_findable = true;

-- SECURITY DEFINER function: lets the API query auth.users by email
-- without exposing the auth schema to the public REST layer.
-- Returns (user_id, is_findable) only for users who have opted in.
CREATE OR REPLACE FUNCTION lookup_candice_user_by_email(p_email TEXT)
RETURNS TABLE (found_user_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id AS found_user_id
  FROM auth.users au
  LEFT JOIN my_profile mp ON mp.user_id = au.id
  WHERE au.email = lower(p_email)
  AND COALESCE(mp.is_findable, true) = true;
$$;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION lookup_candice_user_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION lookup_candice_user_by_email(TEXT) TO service_role;
