-- Migration 117 — Le serveur nomme TOUJOURS le titulaire
--
-- Lève la seule tolérance laissée par la 116 : un lien de partage de fiche créé sans nommer
-- celui qui accorde. À appliquer APRÈS le déploiement de la branche, quand l'ancienne version
-- du code ne peut plus tourner. À partir d'ici, aucune ligne active ne peut être écrite sans
-- preuve, par aucun chemin.
--
-- Ne modifie que la fonction de garde. Aucune donnée touchée. Rejouable.
-- RETOUR ARRIÈRE : supabase-migration-117-ROLLBACK-tolerance-de-transition.sql (remet la fonction
-- de la 116), à utiliser seulement si l'on doit revenir durablement à l'ancienne version du code.

BEGIN;

CREATE OR REPLACE FUNCTION public.garde_contact_consents()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_role      text := coalesce(auth.role(), '');
  v_claims    text := coalesce(current_setting('request.jwt.claims', true), '');
  v_serveur   boolean := (v_role = 'service_role')
                      OR (v_claims = '' AND session_user IN ('postgres', 'supabase_admin'));
  v_titulaire uuid;
  v_devient_active boolean;
  v_elargit   boolean;
BEGIN
  -- Le titulaire est la personne dont l'accord fait foi : celle qui partage sa fiche
  -- (profile_view), celle qui accepte de voir ou qui autorise l'usage de ses données (les deux autres).
  v_titulaire := CASE WHEN NEW.kind = 'profile_view' THEN NEW.pilote_id ELSE NEW.proche_user_id END;

  -- B. Vocabulaire par type — vaut pour tout le monde, serveur compris.
  IF NEW.kind = 'contact_analysis' AND NOT (NEW.scope <@ ARRAY['analysis']) THEN
    RAISE EXCEPTION 'contact_consents : un partage d''analyse ne porte que la portée « analysis »';
  END IF;
  IF NEW.kind = 'profile_usage' AND EXISTS (
       SELECT 1 FROM unnest(NEW.scope) p WHERE p <> 'reco_exclusions' AND p NOT LIKE 'reco:%') THEN
    RAISE EXCEPTION 'contact_consents : une autorisation d''usage ne porte que des portées d''usage';
  END IF;
  IF NEW.kind = 'profile_view' AND EXISTS (
       SELECT 1 FROM unnest(NEW.scope) p WHERE p = 'analysis' OR p = 'reco_exclusions' OR p LIKE 'reco:%') THEN
    RAISE EXCEPTION 'contact_consents : un partage de fiche ne porte ni « analysis » ni portée d''usage';
  END IF;

  -- Type et parties figés — pour tout le monde. Changer le type changerait le titulaire.
  IF TG_OP = 'UPDATE' AND (
       NEW.kind IS DISTINCT FROM OLD.kind
    OR NEW.pilote_id IS DISTINCT FROM OLD.pilote_id
    OR NEW.contact_id IS DISTINCT FROM OLD.contact_id
    OR NEW.proche_user_id IS DISTINCT FROM OLD.proche_user_id) THEN
    RAISE EXCEPTION 'contact_consents : le type et les parties d''un consentement ne se modifient pas';
  END IF;

  v_devient_active := NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active');
  v_elargit := TG_OP = 'UPDATE' AND NOT (NEW.scope <@ OLD.scope);

  -- C. Ce qui a été refusé ou retiré ne se réactive pas.
  IF TG_OP = 'UPDATE' AND v_devient_active AND OLD.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'contact_consents : un consentement refusé ou retiré ne se réactive pas, il se redemande';
  END IF;
  -- Un partage d'analyse ne s'élargit pas après coup : il se redemande.
  IF NEW.kind = 'contact_analysis' AND v_elargit THEN
    RAISE EXCEPTION 'contact_consents : un partage d''analyse ne s''élargit pas, il se redemande';
  END IF;

  IF v_serveur THEN
    -- Le serveur ne crée pas de partage d'analyse : c'est le geste du pilote, dans sa session.
    IF TG_OP = 'INSERT' AND NEW.kind = 'contact_analysis' THEN
      RAISE EXCEPTION 'contact_consents : un partage d''analyse se crée dans la session du pilote';
    END IF;
    -- D. Activer ou élargir = attester QUI accorde. Sans nom, pas d'écriture.
    IF v_devient_active OR v_elargit THEN
      IF v_titulaire IS NULL OR NEW.granted_by IS DISTINCT FROM v_titulaire THEN
        RAISE EXCEPTION 'contact_consents : le serveur n''accorde ni n''élargit sans attester l''accord du titulaire';
      END IF;
      IF v_elargit AND (NEW.granted_at IS NULL OR NEW.granted_at IS NOT DISTINCT FROM OLD.granted_at) THEN
        RAISE EXCEPTION 'contact_consents : un élargissement exige une attestation nouvelle';
      END IF;
      NEW.granted_via := 'serveur';
      NEW.granted_at  := coalesce(NEW.granted_at, now());
    ELSIF TG_OP = 'UPDATE' AND NEW.granted_by IS DISTINCT FROM OLD.granted_by THEN
      NEW.granted_via := 'serveur';
      NEW.granted_at  := coalesce(NEW.granted_at, now());
    END IF;
    RETURN NEW;
  END IF;

  -- ── Session d'une personne ────────────────────────────────────────────────
  -- E. Qui demande : l'identité de la session, jamais une valeur fournie.
  IF TG_OP = 'INSERT' THEN
    NEW.requested_by := v_uid;
    IF NEW.kind = 'contact_analysis' AND (v_uid IS NULL OR v_uid <> NEW.pilote_id) THEN
      RAISE EXCEPTION 'contact_consents : seul le pilote propose de partager son analyse';
    END IF;
    IF NEW.kind = 'profile_usage' AND (v_uid IS NULL OR v_titulaire IS NULL OR v_uid <> v_titulaire) THEN
      RAISE EXCEPTION 'contact_consents : seule la personne concernée ouvre une autorisation d''usage';
    END IF;
  ELSE
    NEW.requested_by := OLD.requested_by;
  END IF;

  IF (v_devient_active OR v_elargit) AND (v_uid IS NULL OR v_titulaire IS NULL OR v_uid <> v_titulaire) THEN
    RAISE EXCEPTION 'contact_consents : seule la personne concernée peut accorder ou élargir ce consentement';
  END IF;

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

COMMIT;

-- VÉRIFICATION (lecture seule) :
--   select md5(prosrc) from pg_proc where proname = 'garde_contact_consents';
