-- Migration 66 — Lot Carnet d'envies V2 : enrichissement de carnet_envies_items.
-- CARNET = envies que le pilote REPÈRE POUR UN PROCHE (privé côté pilote,
-- RLS owner-only via pilot_id). Additive uniquement.
-- Déjà présents (chemin W2, conservés) : description, photo_url, source_link,
-- brand_name, brand_option, confidence_level, location_hint, occasion_links,
-- statut, requires_payment_sourcing, payment_modalities.

ALTER TABLE carnet_envies_items
  ADD COLUMN IF NOT EXISTS size_ref         text,
  ADD COLUMN IF NOT EXISTS price_indicative text,
  ADD COLUMN IF NOT EXISTS occasion         text,        -- scalaire, aligné wishlist (occasion_links[] W2 conservé)
  ADD COLUMN IF NOT EXISTS note_text        text,
  ADD COLUMN IF NOT EXISTS source           text,        -- heard | seen | link
  ADD COLUMN IF NOT EXISTS heard_quote      text,        -- « ce que tu as repéré » (phrase/contexte)
  ADD COLUMN IF NOT EXISTS source_trace     text NOT NULL DEFAULT 'spotted';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='carnet_envies_items_occasion_check') THEN
    ALTER TABLE carnet_envies_items ADD CONSTRAINT carnet_envies_items_occasion_check
      CHECK (occasion IS NULL OR occasion IN (
        'none','birthday','christmas','wedding_anniversary','valentine','mothers_day',
        'fathers_day','naissance','cremaillere','diplome','retraite','just_because'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='carnet_envies_items_source_check') THEN
    ALTER TABLE carnet_envies_items ADD CONSTRAINT carnet_envies_items_source_check
      CHECK (source IS NULL OR source IN ('heard','seen','link'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='carnet_envies_items_source_trace_check') THEN
    ALTER TABLE carnet_envies_items ADD CONSTRAINT carnet_envies_items_source_trace_check
      CHECK (source_trace IN ('declared','spotted','deduced'));
  END IF;
END $$;
