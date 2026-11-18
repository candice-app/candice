-- Migration 113 — LE LIEN ENTRE UN CONTACT ET UN COMPTE N'EST ÉTABLI QUE PAR CE COMPTE (18 nov.).
--
-- CONSTAT. `contacts.proche_user_id` est écrit par le PILOTE (RLS : « mes contacts »), y compris
-- depuis le formulaire d'ajout après une recherche de compte. Ce champ dit donc QUI le pilote
-- désigne — pas que cette personne a accepté. Plusieurs chemins le prenaient pourtant pour un
-- lien établi : la recommandation y lisait le profil du compte désigné, et la relance
-- (`/api/invite/nudge`) lui envoyait une notification ou un courriel au nom du pilote.
--
-- CE QUE LA MIGRATION AJOUTE : la PREUVE que le compte désigné a lui-même accepté le lien.
--   · `proche_lien_confirme_par` / `proche_lien_confirme_le`, sur `contacts`.
--   · Un déclencheur : un utilisateur ne peut PAS écrire ces colonnes (la RLS ne laisse écrire
--     que le pilote, qui n'est justement pas celui qui confirme) ; seul le serveur le fait,
--     après avoir vérifié l'identité du proche (acceptation d'une invitation). Et si le pilote
--     change le compte désigné, la confirmation tombe.
-- Le pilote garde le droit de DÉSIGNER un compte : c'est le parcours produit. Ce qui change,
-- c'est qu'une désignation ne vaut plus acceptation.
--
-- Aucune ligne existante n'est modifiée : les liens déjà posés restent NON confirmés jusqu'à
-- décision (reprise depuis les invitations utilisées, ou nouvelle acceptation).
-- À APPLIQUER PAR ESTELLE sur la base vivante.

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS proche_lien_confirme_par uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proche_lien_confirme_le  timestamptz;

CREATE OR REPLACE FUNCTION public.garde_lien_proche()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_role    text := coalesce(auth.role(), '');
  v_claims  text := coalesce(current_setting('request.jwt.claims', true), '');
  v_serveur boolean := (v_role = 'service_role')
                    OR (v_claims = '' AND session_user IN ('postgres', 'supabase_admin'));
BEGIN
  IF v_serveur THEN
    -- Le serveur confirme, mais seulement pour le compte réellement désigné.
    IF NEW.proche_lien_confirme_par IS NOT NULL AND NEW.proche_lien_confirme_par IS DISTINCT FROM NEW.proche_user_id THEN
      RAISE EXCEPTION 'contacts : la confirmation du lien doit venir du compte désigné';
    END IF;
    IF NEW.proche_lien_confirme_par IS NOT NULL AND NEW.proche_lien_confirme_le IS NULL THEN
      NEW.proche_lien_confirme_le := now();
    END IF;
    RETURN NEW;
  END IF;

  -- Un utilisateur : il désigne, il ne confirme pas.
  IF TG_OP = 'INSERT' THEN
    NEW.proche_lien_confirme_par := NULL; NEW.proche_lien_confirme_le := NULL;
  ELSIF NEW.proche_user_id IS DISTINCT FROM OLD.proche_user_id THEN
    -- Le compte désigné change : la confirmation de l'ancien ne vaut pas pour le nouveau.
    NEW.proche_lien_confirme_par := NULL; NEW.proche_lien_confirme_le := NULL;
  ELSE
    NEW.proche_lien_confirme_par := OLD.proche_lien_confirme_par;
    NEW.proche_lien_confirme_le  := OLD.proche_lien_confirme_le;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_garde_lien_proche ON public.contacts;
CREATE TRIGGER trg_garde_lien_proche
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.garde_lien_proche();

-- INVENTAIRE (lecture seule) — les liens existants, et ce qui peut attester d'une acceptation :
--   select c.id, c.user_id as pilote, c.proche_user_id, c.proche_lien_confirme_par,
--          (select max(used_at) from invite_links i where i.contact_id = c.id) as invitation_utilisee_le
--   from contacts c where c.proche_user_id is not null;
