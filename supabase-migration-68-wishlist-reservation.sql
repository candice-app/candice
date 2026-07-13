-- Migration 68 — Phase E : réservation INVISIBLE avec confirmation d'achat.
-- Sur les items de wishlist du pilote (que de futurs proches pourront réclamer
-- via la surface de reco à venir). Deux temps : intention (molle) → confirmation.
-- Règles : invisible du pilote (l'UI /moi/wishlist ne lit PAS ces colonnes) ;
-- un proche ne voit jamais qu'un autre a réservé (l'item disparaît, sans « déjà
-- pris ») ; transitions ATOMIQUES (SELECT ... FOR UPDATE dans des RPC SECURITY
-- DEFINER) ; garde-fou de péremption : une intention expirée redevient dispo.
-- Délai par défaut : 30 jours (proposé — arbitrage Estelle au STOP final).

ALTER TABLE my_wishlist_items
  ADD COLUMN IF NOT EXISTS reservation_status     text NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS reserved_by            uuid,
  ADD COLUMN IF NOT EXISTS reserved_at            timestamptz,
  ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='my_wishlist_items_reservation_status_check') THEN
    ALTER TABLE my_wishlist_items ADD CONSTRAINT my_wishlist_items_reservation_status_check
      CHECK (reservation_status IN ('available','intended','purchased'));
  END IF;
END $$;

-- ── Réserver (intention molle, atomique) ────────────────────────────────────
CREATE OR REPLACE FUNCTION reserve_wishlist_item(p_item uuid, p_days int DEFAULT 30)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r my_wishlist_items%ROWTYPE;
BEGIN
  SELECT * INTO r FROM my_wishlist_items WHERE id = p_item FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF r.reservation_status = 'purchased' THEN RETURN 'already_taken'; END IF;
  -- intention active d'un AUTRE proche, non expirée → indisponible
  IF r.reservation_status = 'intended'
     AND (r.reservation_expires_at IS NULL OR r.reservation_expires_at > now())
     AND r.reserved_by IS DISTINCT FROM auth.uid() THEN
    RETURN 'already_taken';
  END IF;
  UPDATE my_wishlist_items
    SET reservation_status = 'intended', reserved_by = auth.uid(), reserved_at = now(),
        reservation_expires_at = now() + make_interval(days => GREATEST(p_days, 1))
    WHERE id = p_item;
  RETURN 'reserved';
END $$;

-- ── Confirmer l'achat / relancer / relâcher (atomique) ──────────────────────
-- p_outcome : 'purchased' | 'not_yet' | 'declined'
CREATE OR REPLACE FUNCTION confirm_wishlist_purchase(p_item uuid, p_outcome text, p_days int DEFAULT 30)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r my_wishlist_items%ROWTYPE;
BEGIN
  SELECT * INTO r FROM my_wishlist_items WHERE id = p_item FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF r.reserved_by IS DISTINCT FROM auth.uid() THEN RETURN 'not_yours'; END IF;
  IF p_outcome = 'purchased' THEN
    UPDATE my_wishlist_items SET reservation_status = 'purchased' WHERE id = p_item;
    RETURN 'purchased';
  ELSIF p_outcome = 'not_yet' THEN
    UPDATE my_wishlist_items SET reservation_expires_at = now() + make_interval(days => GREATEST(p_days, 1)) WHERE id = p_item;
    RETURN 'extended';
  ELSIF p_outcome = 'declined' THEN
    UPDATE my_wishlist_items SET reservation_status = 'available', reserved_by = NULL,
      reserved_at = NULL, reservation_expires_at = NULL WHERE id = p_item;
    RETURN 'released';
  END IF;
  RETURN 'noop';
END $$;

REVOKE ALL ON FUNCTION reserve_wishlist_item(uuid, int) FROM public;
REVOKE ALL ON FUNCTION confirm_wishlist_purchase(uuid, text, int) FROM public;
GRANT EXECUTE ON FUNCTION reserve_wishlist_item(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_wishlist_purchase(uuid, text, int) TO authenticated;
