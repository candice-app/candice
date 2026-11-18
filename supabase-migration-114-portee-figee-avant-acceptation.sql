-- Migration 114 — LE PROCHE ACCEPTE EXACTEMENT CE QUI LUI A ÉTÉ PRÉSENTÉ (18 nov.).
--
-- Complète la 112, déjà appliquée. Deux trous qu'elle laissait :
--
--   1. PORTÉE MODIFIÉE AVANT L'ACCEPTATION. La 112 n'interdisait au demandeur d'élargir la
--      portée que sur une ligne ACTIVE. Sur une demande en attente, il pouvait l'élargir pendant
--      que le proche la lisait : l'acceptation, qui ne porte que sur le statut, ouvrait alors
--      une portée jamais présentée.
--      Désormais, le demandeur ne peut JAMAIS élargir la portée d'une ligne, quel que soit son
--      statut. Il peut la restreindre (le proche accepte alors moins que ce qu'il a vu, jamais
--      plus), ou supprimer sa demande et en faire une autre — qui porte un autre identifiant,
--      que l'écran déjà ouvert chez le proche ne peut pas accepter.
--
--   2. PREUVE CONSERVÉE APRÈS UN ÉLARGISSEMENT PAR LE SERVEUR. Une écriture du serveur qui
--      élargissait la portée gardait l'ancienne preuve d'accord, qui ne couvrait pas l'ajout.
--      Désormais l'écriture est refusée, sauf si le serveur atteste dans la même écriture
--      qui accorde (le titulaire) et quand. Une portée sans accord ne reste jamais dans une ligne.
--
-- Ne modifie aucune ligne. Remplace la fonction du déclencheur, qui reste le même.
-- À APPLIQUER PAR ESTELLE sur la base vivante.

CREATE OR REPLACE FUNCTION public.garde_contact_consents()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_role      text := coalesce(auth.role(), '');
  v_claims    text := coalesce(current_setting('request.jwt.claims', true), '');
  -- Le serveur : la clé de service, ou une session d'administration directe (sans JWT).
  v_serveur   boolean := (v_role = 'service_role')
                      OR (v_claims = '' AND session_user IN ('postgres', 'supabase_admin'));
  v_titulaire uuid;
  v_devient_active boolean;
  v_elargit   boolean;
BEGIN
  v_titulaire := CASE WHEN NEW.kind = 'contact_analysis' THEN NEW.proche_user_id ELSE NEW.pilote_id END;

  IF v_serveur THEN
    -- Écriture du serveur : acceptée, mais MARQUÉE. La preuve n'est jamais héritée d'un
    -- champ que l'appelant aurait pu remplir sous une autre identité.
    IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
      NEW.granted_via := 'serveur';
      NEW.granted_at  := coalesce(NEW.granted_at, now());
      -- `granted_by` : tel que le serveur l'a renseigné (NULL s'il ne l'a pas fait).
    ELSIF TG_OP = 'UPDATE' AND NOT (NEW.scope <@ OLD.scope) THEN
      -- LE SERVEUR ÉLARGIT LA PORTÉE. Il doit ATTESTER, dans cette même écriture, qui accorde
      -- (le titulaire) et quand (une date nouvelle). Sans cela l'écriture est REFUSÉE : une
      -- portée ajoutée sans accord resterait dans la ligne, et le prochain accord du titulaire
      -- — donné pour autre chose — la couvrirait à son insu.
      IF NEW.granted_by IS DISTINCT FROM v_titulaire OR NEW.granted_at IS NULL
         OR NEW.granted_at IS NOT DISTINCT FROM OLD.granted_at THEN
        RAISE EXCEPTION 'contact_consents : le serveur n''élargit une portée qu''en attestant l''accord du titulaire';
      END IF;
      NEW.granted_via := 'serveur';
    ELSIF TG_OP = 'UPDATE' AND NEW.granted_by IS DISTINCT FROM OLD.granted_by THEN
      NEW.granted_via := 'serveur';
      NEW.granted_at  := coalesce(NEW.granted_at, now());
    END IF;
    RETURN NEW;
  END IF;

  -- ── À partir d'ici : un utilisateur (ou un appel anonyme, que la RLS arrête déjà).

  IF TG_OP = 'UPDATE' THEN
    IF NEW.kind IS DISTINCT FROM OLD.kind
       OR NEW.pilote_id IS DISTINCT FROM OLD.pilote_id
       OR NEW.contact_id IS DISTINCT FROM OLD.contact_id
       OR NEW.proche_user_id IS DISTINCT FROM OLD.proche_user_id THEN
      RAISE EXCEPTION 'contact_consents : le type et les parties d''un consentement ne se modifient pas';
    END IF;
  END IF;

  v_devient_active := NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active');
  -- ÉLARGIR LA PORTÉE, QUEL QUE SOIT LE STATUT. La première version ne gardait que les lignes
  -- actives : le demandeur pouvait donc élargir une demande EN ATTENTE pendant que le proche la
  -- consultait, et l'acceptation ouvrait une portée qu'il n'avait jamais vue.
  v_elargit := TG_OP = 'UPDATE' AND NOT (NEW.scope <@ OLD.scope);

  IF (v_devient_active OR v_elargit) AND (v_uid IS NULL OR v_titulaire IS NULL OR v_uid <> v_titulaire) THEN
    RAISE EXCEPTION 'contact_consents : seule la personne concernée peut accorder ou élargir ce consentement';
  END IF;

  -- LA PREUVE est écrite ICI. Ce que l'appelant a mis dans ces colonnes est ignoré.
  IF NEW.status = 'active' AND (v_devient_active OR v_elargit) THEN
    NEW.granted_by := v_uid; NEW.granted_at := now(); NEW.granted_via := 'titulaire';
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.granted_by := OLD.granted_by; NEW.granted_at := OLD.granted_at; NEW.granted_via := OLD.granted_via;
  ELSE
    NEW.granted_by := NULL; NEW.granted_at := NULL; NEW.granted_via := NULL;
  END IF;

  RETURN NEW;
END;
$$;

