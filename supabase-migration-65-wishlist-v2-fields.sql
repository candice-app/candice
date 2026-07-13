-- Migration 65 — Lot Wishlist V2 : enrichissement de my_wishlist_items.
-- WISHLIST = envies du pilote POUR LUI-MÊME, STRICTEMENT PRIVÉE (RLS owner-only).
-- Additive uniquement (ADD COLUMN IF NOT EXISTS). Table à 0 ligne.
-- NB : les colonnes V1 `url` et `note` sont superseded par `web_link` / `note_text`
--      (noms de la spec). Conservées (0 ligne) — nettoyage éventuel plus tard.

ALTER TABLE my_wishlist_items
  ADD COLUMN IF NOT EXISTS photo_url        text,
  ADD COLUMN IF NOT EXISTS brand            text,
  ADD COLUMN IF NOT EXISTS web_link         text,
  ADD COLUMN IF NOT EXISTS size_ref         text,
  ADD COLUMN IF NOT EXISTS price_indicative text,        -- libre (« 1 900 € »)
  ADD COLUMN IF NOT EXISTS occasion         text,
  ADD COLUMN IF NOT EXISTS note_text        text,
  ADD COLUMN IF NOT EXISTS envy_level       text,        -- dream | pleasure
  ADD COLUMN IF NOT EXISTS target_recipients uuid[] NOT NULL DEFAULT '{}',  -- vide = n'importe qui
  ADD COLUMN IF NOT EXISTS source_trace     text NOT NULL DEFAULT 'declared';

-- CHECKs idempotents (spec : enum d'occasions verrouillé)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='my_wishlist_items_occasion_check') THEN
    ALTER TABLE my_wishlist_items ADD CONSTRAINT my_wishlist_items_occasion_check
      CHECK (occasion IS NULL OR occasion IN (
        'none','birthday','christmas','wedding_anniversary','valentine','mothers_day',
        'fathers_day','naissance','cremaillere','diplome','retraite','just_because'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='my_wishlist_items_envy_level_check') THEN
    ALTER TABLE my_wishlist_items ADD CONSTRAINT my_wishlist_items_envy_level_check
      CHECK (envy_level IS NULL OR envy_level IN ('dream','pleasure'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='my_wishlist_items_source_trace_check') THEN
    ALTER TABLE my_wishlist_items ADD CONSTRAINT my_wishlist_items_source_trace_check
      CHECK (source_trace IN ('declared','spotted','deduced'));
  END IF;
END $$;
