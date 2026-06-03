-- Migration 23: idempotency key on contacts
-- Prevents duplicate rows when the same form is submitted more than once
-- (network retry, double-click, page refresh on POST).

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Partial unique index: uniqueness is only enforced when the key is present.
-- Multiple legacy rows without a key are left untouched.
CREATE UNIQUE INDEX IF NOT EXISTS contacts_user_idempotency_unique
  ON contacts(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
