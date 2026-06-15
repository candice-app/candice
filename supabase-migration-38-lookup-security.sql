-- Migration 38 — Lookup security hardening (Lot 4.3a)
--
-- Fixes three issues in the user-lookup layer:
--   1. [CRITIQUE]   is_findable filter: INNER JOIN replaces LEFT JOIN + COALESCE so that a user
--                   with no my_profile row is NEVER returned (privacy-first default).
--   2. [SÉCURITÉ]   Return column renamed found_user_id → proche_user_id. Both functions return
--                   only a UUID — no email, phone, name, or any PII.
--                   Enumeration-risk note: an authenticated caller can probe arbitrary UUIDs and
--                   learn whether a given email/phone belongs to a findable user. Risk is accepted
--                   because (a) callers must hold a valid session, (b) only a boolean presence is
--                   revealed, (c) no PII leaks. Rate-limiting should be applied at the edge layer.
--   3. [TÉLÉPHONE]  Phone normalization: regexp_replace strips spaces, dots, dashes, parentheses
--                   on BOTH the stored value and the input so "06 12 34 56 78" = "0612345678".


-- ── 1. Fix email lookup RPC ───────────────────────────────────────────────────

DROP FUNCTION IF EXISTS lookup_candice_user_by_email(TEXT);

CREATE OR REPLACE FUNCTION lookup_candice_user_by_email(p_email TEXT)
RETURNS TABLE (proche_user_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Enumeration risk: caller learns whether the email maps to a findable user.
  -- Mitigated: authenticated callers only, no PII in return set.
  SELECT au.id AS proche_user_id
  FROM auth.users au
  INNER JOIN my_profile mp ON mp.user_id = au.id
  WHERE au.email = lower(p_email)
    AND mp.is_findable = true;
$$;

GRANT EXECUTE ON FUNCTION lookup_candice_user_by_email(TEXT) TO authenticated, service_role;


-- ── 2. Phone lookup RPC with normalization ────────────────────────────────────

CREATE OR REPLACE FUNCTION lookup_candice_user_by_phone(p_phone TEXT)
RETURNS TABLE (proche_user_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Enumeration risk: caller learns whether the phone maps to a findable user.
  -- Mitigated: authenticated callers only, no PII in return set.
  -- Normalization: strips spaces, dots, dashes, parentheses on both sides.
  SELECT mp.user_id AS proche_user_id
  FROM my_profile mp
  WHERE regexp_replace(mp.phone, '[\s.()\-]+', '', 'g') = regexp_replace(p_phone, '[\s.()\-]+', '', 'g')
    AND mp.is_findable = true;
$$;

GRANT EXECUTE ON FUNCTION lookup_candice_user_by_phone(TEXT) TO authenticated, service_role;
