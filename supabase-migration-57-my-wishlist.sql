-- Migration 57 — point 13 ajusté + vocabulaire verrouillé (Estelle).
--
-- Deux notions, deux noms, JAMAIS mélangés :
--   · WISHLIST         = la liste personnelle de l'utilisateur (SON profil) —
--                         ce qu'il aimerait recevoir. Candice s'en inspire pour
--                         recommander sans jamais dévoiler la demande.
--   · CARNET D'ENVIES  = les envies REPÉRÉES pour un proche (sourcing).
--
-- 1. my_wishlist_items : la wishlist personnelle (option A validée).
-- 2. wishlist_items (sourcing proche) RENOMMÉE carnet_envies_items —
--    la table n'est PAS étendue (lot Carnet d'envies, ex-lot 11).
--
-- Additive + renommage sans perte (RLS et index suivent le rename).

-- ── 1. Wishlist personnelle ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS my_wishlist_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL CHECK (length(trim(title)) > 0),
  url         TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_my_wishlist_user ON my_wishlist_items (user_id, created_at DESC);

ALTER TABLE my_wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_wishlist" ON my_wishlist_items;
CREATE POLICY "users_own_wishlist" ON my_wishlist_items
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 2. Sourcing proche : wishlist_items → carnet_envies_items ─────────────────

ALTER TABLE IF EXISTS wishlist_items RENAME TO carnet_envies_items;
