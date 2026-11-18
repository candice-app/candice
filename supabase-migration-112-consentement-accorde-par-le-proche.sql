-- Migration 112 — UN CONSENTEMENT N'EST ACTIF QUE SI LE PROCHE L'A ACCORDÉ (18 nov.).
--
-- CONSTAT, sur la pile locale montée depuis les migrations du dépôt :
--   · `contact_consents` n'avait qu'une politique d'écriture : `pilote_manage_consents`
--     (auth.uid() = pilote_id), pour TOUTES les opérations. Le pilote — celui qui DEMANDE —
--     pouvait donc insérer lui-même une ligne `status = 'active'` au nom de n'importe quel
--     compte, sans passer par les routes de l'application. Essai : accepté par la base.
--   Toute vérification « un consentement actif existe » était donc falsifiable par le
--   demandeur. Même politique relevée sur la base vivante par Estelle le 18 nov.
--
-- CE QUE LA MIGRATION FAIT, pour les consentements `contact_analysis` uniquement
-- (les `profile_view` sont déjà gérés par le propriétaire du profil, qui est `pilote_id`) :
--   1. Un déclencheur refuse qu'une ligne DEVIENNE `active` autrement que par le proche
--      lui-même (auth.uid() = proche_user_id) ou par le serveur (rôle de service).
--      Il fige aussi `proche_user_id`, `pilote_id`, `contact_id` et `kind` après création,
--      et refuse que le demandeur élargisse la portée d'un consentement actif.
-- Le pilote garde tout le reste : demander (`pending`), révoquer, supprimer sa demande.
--
-- ADDITIVE. Aucune ligne existante n'est modifiée. Les consentements déjà actifs le restent ;
-- s'il en existe qui n'ont pas été accordés par le proche, cette migration ne les détecte pas
-- — une requête de contrôle est donnée en fin de fichier (lecture seule).
-- À APPLIQUER PAR ESTELLE sur la base vivante.

CREATE OR REPLACE FUNCTION public.garde_contact_consents()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid();           -- NULL sous le rôle de service (serveur)
BEGIN
  IF NEW.kind IS DISTINCT FROM 'contact_analysis' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.pilote_id IS DISTINCT FROM OLD.pilote_id
       OR NEW.contact_id IS DISTINCT FROM OLD.contact_id
       OR NEW.kind IS DISTINCT FROM OLD.kind
       OR (OLD.proche_user_id IS NOT NULL AND NEW.proche_user_id IS DISTINCT FROM OLD.proche_user_id AND v_uid IS NOT NULL) THEN
      RAISE EXCEPTION 'contact_consents : les parties d''un consentement ne se modifient pas';
    END IF;
  END IF;

  -- DEVENIR ACTIF : le proche, ou le serveur. Jamais le demandeur.
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    IF v_uid IS NOT NULL AND (NEW.proche_user_id IS NULL OR v_uid <> NEW.proche_user_id) THEN
      RAISE EXCEPTION 'contact_consents : seul le proche peut accorder ce consentement';
    END IF;
  END IF;

  -- PORTÉE D'UN CONSENTEMENT ACTIF : le demandeur ne peut pas l'élargir.
  IF TG_OP = 'UPDATE' AND NEW.status = 'active' AND v_uid IS NOT NULL
     AND v_uid <> NEW.proche_user_id AND NOT (NEW.scope <@ OLD.scope) THEN
    RAISE EXCEPTION 'contact_consents : seul le proche peut élargir ce qu''il partage';
  END IF;

  -- LE PROCHE ne change que le statut, la portée et ses dates de réponse.
  IF TG_OP = 'UPDATE' AND v_uid IS NOT NULL AND v_uid = NEW.proche_user_id AND v_uid <> NEW.pilote_id THEN
    IF NEW.requested_at IS DISTINCT FROM OLD.requested_at OR NEW.requested_by IS DISTINCT FROM OLD.requested_by THEN
      RAISE EXCEPTION 'contact_consents : le proche ne modifie pas la demande elle-même';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_garde_contact_consents ON public.contact_consents;
CREATE TRIGGER trg_garde_contact_consents
  BEFORE INSERT OR UPDATE ON public.contact_consents
  FOR EACH ROW EXECUTE FUNCTION public.garde_contact_consents();

-- (La politique qui laisse le proche RÉPONDRE, `proche_respond_consents`, existe déjà :
--  migrations 40 et 49. Rien à ajouter de ce côté.)

-- CONTRÔLE (lecture seule, à lancer après application) — consentements actifs sans date
-- d'accord, qui n'ont donc pas suivi le parcours d'acceptation :
--   select id, pilote_id, proche_user_id, requested_at from contact_consents
--   where kind = 'contact_analysis' and status = 'active' and consented_at is null;
