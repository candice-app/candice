-- Migration 102 — confirm_reco_purchase / confirm_wishlist_purchase : correction de la garde NULL.
--
-- POURQUOI. La garde de propriété de ces deux SECURITY DEFINER était :
--     IF r.reserved_by IS DISTINCT FROM auth.uid() THEN RETURN 'not_yours'; END IF;
-- Quand l'item n'est réservé par personne (reserved_by NULL) ET que l'appelant n'a pas de JWT
-- (auth.uid() NULL), `NULL IS DISTINCT FROM NULL` vaut FALSE → la garde ne se déclenche pas → l'appelant
-- passe et peut marquer 'purchased' / prolonger / 'declined' un item qu'il n'a jamais réservé.
-- La migration 101 a déjà retiré `anon` de ces fonctions, ce qui ferme la porte d'entrée ; mais la garde
-- elle-même reste fausse pour tout appelant futur. On la corrige à la source.
--
-- CORRECTION. On rejette explicitement l'absence de JWT, en plus de la non-propriété :
--     IF auth.uid() IS NULL OR r.reserved_by IS DISTINCT FROM auth.uid() THEN RETURN 'not_yours'; END IF;
-- Effet pour un appelant LÉGITIME (proche connecté qui a réservé l'item) : AUCUN — auth.uid() n'est pas
-- NULL et r.reserved_by = auth.uid(), la condition reste FALSE, il passe comme avant. Seuls deux cas qui
-- n'auraient jamais dû passer sont désormais refusés : pas de JWT, et confirmer un item que personne n'a
-- réservé (reserved_by NULL).
--
-- PORTÉE. Correctif de LOGIQUE uniquement. CREATE OR REPLACE FUNCTION conserve l'ACL existante : les grants
-- posés par la 101 (authenticated, postgres) ne sont PAS touchés, et on ne les réécrit pas ici (droits et
-- logique ne voyagent pas ensemble). Le `SET search_path TO 'public'` est laissé IDENTIQUE à l'existant —
-- son durcissement (pg_temp) relève de la 103, pas de cette migration. Aucune donnée touchée.
-- Rejouable : CREATE OR REPLACE est idempotent.

CREATE OR REPLACE FUNCTION public.confirm_reco_purchase(p_item uuid, p_outcome text, p_days integer DEFAULT 30)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r contact_reco_items%ROWTYPE;
BEGIN
  SELECT * INTO r FROM contact_reco_items WHERE id = p_item FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF auth.uid() IS NULL OR r.reserved_by IS DISTINCT FROM auth.uid() THEN RETURN 'not_yours'; END IF;
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
END $function$;

CREATE OR REPLACE FUNCTION public.confirm_wishlist_purchase(p_item uuid, p_outcome text, p_days integer DEFAULT 30)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r my_wishlist_items%ROWTYPE;
BEGIN
  SELECT * INTO r FROM my_wishlist_items WHERE id = p_item FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF auth.uid() IS NULL OR r.reserved_by IS DISTINCT FROM auth.uid() THEN RETURN 'not_yours'; END IF;
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
END $function$;

-- Auto-enregistrement (convention applied_migrations : colonne `filename`, nom COMPLET du fichier, insert
-- CONDITIONNEL — PAS de colonne `migration`, PAS de ON CONFLICT ; rejouable sans erreur).
INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-102-confirm-garde-null.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations
  WHERE filename = 'supabase-migration-102-confirm-garde-null.sql'
);
