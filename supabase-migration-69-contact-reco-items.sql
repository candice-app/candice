-- Migration 69 — Espace Proche V2 : contact_reco_items (une ligne par reco).
-- Remplace le blob contact_recommendations.ideas (déprécié, conservé). RLS owner-only
-- (pilot_id = auth.uid()). Réservation invisible (pattern Wishlist V2 + RPC atomiques).
-- Deux dimensions orthogonales : status{active,refused} (refus) vs reservation_status
-- {available,intended,purchased} (cadeau). « Offered » = dérivé de purchased, jamais stocké.

CREATE TABLE IF NOT EXISTS contact_reco_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id      uuid NOT NULL,
  contact_id    uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  reco_type     text NOT NULL CHECK (reco_type IN ('object','experience','place','message')),
  title         text NOT NULL,
  brand         text,
  price_indicative text,
  photo_url     text,
  source_trace  text NOT NULL CHECK (source_trace IN ('declared','spotted','deduced','exploratory')),
  certainty_pct int CHECK (certainty_pct BETWEEN 0 AND 100),
  why_json      jsonb,
  need_tag      text,
  origin_ref    uuid,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','refused')),
  reservation_status text NOT NULL DEFAULT 'available' CHECK (reservation_status IN ('available','intended','purchased')),
  reserved_by            uuid,
  reserved_at            timestamptz,
  reservation_expires_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_reco_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contact_reco_items' AND policyname='owner_contact_reco_items') THEN
    CREATE POLICY owner_contact_reco_items ON contact_reco_items FOR ALL
      USING (pilot_id = auth.uid()) WITH CHECK (pilot_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contact_reco_items_pc ON contact_reco_items (pilot_id, contact_id);

-- Réservation atomique (calquée Wishlist V2, péremption 30 j)
CREATE OR REPLACE FUNCTION reserve_reco_item(p_item uuid, p_days int DEFAULT 30)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r contact_reco_items%ROWTYPE;
BEGIN
  SELECT * INTO r FROM contact_reco_items WHERE id = p_item FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF r.reservation_status = 'purchased' THEN RETURN 'already_taken'; END IF;
  IF r.reservation_status = 'intended'
     AND (r.reservation_expires_at IS NULL OR r.reservation_expires_at > now())
     AND r.reserved_by IS DISTINCT FROM auth.uid() THEN
    RETURN 'already_taken';
  END IF;
  UPDATE contact_reco_items
    SET reservation_status='intended', reserved_by=auth.uid(), reserved_at=now(),
        reservation_expires_at = now() + make_interval(days => GREATEST(p_days,1)), updated_at=now()
    WHERE id = p_item;
  RETURN 'reserved';
END $$;

CREATE OR REPLACE FUNCTION confirm_reco_purchase(p_item uuid, p_outcome text, p_days int DEFAULT 30)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r contact_reco_items%ROWTYPE;
BEGIN
  SELECT * INTO r FROM contact_reco_items WHERE id = p_item FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF r.reserved_by IS DISTINCT FROM auth.uid() THEN RETURN 'not_yours'; END IF;
  IF p_outcome = 'purchased' THEN
    UPDATE contact_reco_items SET reservation_status='purchased', updated_at=now() WHERE id = p_item;
    RETURN 'purchased';
  ELSIF p_outcome = 'not_yet' THEN
    UPDATE contact_reco_items SET reservation_expires_at = now() + make_interval(days => GREATEST(p_days,1)), updated_at=now() WHERE id = p_item;
    RETURN 'extended';
  ELSIF p_outcome = 'declined' THEN
    UPDATE contact_reco_items SET reservation_status='available', reserved_by=NULL, reserved_at=NULL, reservation_expires_at=NULL, updated_at=now() WHERE id = p_item;
    RETURN 'released';
  END IF;
  RETURN 'noop';
END $$;

REVOKE ALL ON FUNCTION reserve_reco_item(uuid,int) FROM public;
REVOKE ALL ON FUNCTION confirm_reco_purchase(uuid,text,int) FROM public;
GRANT EXECUTE ON FUNCTION reserve_reco_item(uuid,int) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_reco_purchase(uuid,text,int) TO authenticated;

COMMENT ON COLUMN contact_recommendations.ideas IS 'DÉPRÉCIÉ (Espace Proche V2) — la source des recos devient contact_reco_items (une ligne par reco). Conservé pour historique.';
