-- Migration 25 : table wishlist_items (W2 — Repéré quelque chose)
-- Remplace / complète le champ gift_wishlist JSONB sur contacts.
-- confidence_level code la source de l'envie (spec section 20, étape 5).

CREATE TABLE IF NOT EXISTS wishlist_items (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id       UUID        NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  pilot_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description      TEXT        NOT NULL,
  photo_url        TEXT,
  source_link      TEXT,
  brand_name       TEXT,
  brand_option     TEXT,
  confidence_level TEXT        DEFAULT 'moyenne'
                               CHECK (confidence_level IN ('haute', 'moyenne_haute', 'moyenne', 'moyenne_basse')),
  location_hint    TEXT,
  occasion_links   TEXT[],
  statut           TEXT        DEFAULT 'actif'
                               CHECK (statut IN ('actif', 'offert', 'archive')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wishlist_contact
  ON wishlist_items (contact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wishlist_pilot
  ON wishlist_items (pilot_id, created_at DESC);

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_wishlist_items" ON wishlist_items
  USING  (pilot_id = auth.uid())
  WITH CHECK (pilot_id = auth.uid());
