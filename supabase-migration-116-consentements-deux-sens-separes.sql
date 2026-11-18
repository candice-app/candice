-- Migration 116 — Deux sens, deux lignes : ce que le pilote partage, ce que le proche autorise
--
-- CONSTAT (audit des lectures privilégiées, 18 nov.)
--
--   Une même ligne `contact_analysis` portait deux accords de sens OPPOSÉ :
--     • « analysis »            — le PILOTE partage au proche l'analyse qu'il a de lui ;
--     • « reco:* », « reco_exclusions » — le PROCHE autorise l'usage de ses propres données.
--   Trois conséquences, toutes réelles :
--
--   1. La politique `proche_read_consented_analysis` ouvrait l'analyse du pilote dès qu'une
--      ligne était ACTIVE, sans regarder la portée. Un proche qui autorisait seulement
--      « écarter certaines idées » obtenait donc, par une requête directe, l'analyse privée
--      que le pilote tient sur lui — sans que le pilote l'ait jamais partagée.
--   2. `pilote_manage_consents` laissait le pilote LIRE ces lignes : il voyait ce que le
--      proche avait réglé, alors que ce réglage doit lui rester inconnu.
--   3. Le proche, titulaire de la ligne, pouvait RÉACTIVER un partage que le pilote avait
--      retiré, ou y rajouter lui-même la portée « analysis ».
--
--   Et deux politiques ouvraient des données au navigateur sans passer par le filtre serveur :
--     • `viewer_read_shared_self_analysis` : toute l'analyse d'une fiche partagée, même quand
--       UNE seule section avait été accordée ;
--     • `proche_reads_pilot_self_state` : les états déclarés, y compris en mode aveugle.
--   Aucune lecture applicative n'en dépend plus (elles passent par le serveur, qui filtre).
--
-- CE QUE FAIT CETTE MIGRATION
--
--   A. Nouveau type `profile_usage` : les autorisations données par le proche. Le pilote ne
--      peut ni les lire ni les écrire. `contact_analysis` ne porte plus que « analysis ».
--   B. Vocabulaire de portée contrôlé par type : une portée d'un sens ne peut plus se glisser
--      dans une ligne de l'autre sens.
--   C. Un consentement refusé ou retiré ne se réactive pas : il se redemande.
--   D. Le serveur n'active et n'élargit qu'en NOMMANT le titulaire (`granted_by`) : une ligne
--      active sans preuve ne peut plus être écrite, par aucun chemin.
--   E. `requested_by` est écrit par la base (identité de la session), jamais par le client.
--   F. L'analyse du pilote ne s'ouvre au proche que si le PILOTE l'a demandée (ligne créée
--      par lui, portée « analysis ») ET que le proche l'a acceptée (preuve écrite par la base).
--   G. Suppression des deux politiques de lecture directe.
--
-- PRÉALABLE : 112, 114 et 115 appliquées, et le code de la branche déployé AVANT (la version
-- actuellement en ligne crée ses liens de partage sans nommer le titulaire : D la refuserait). Aucune donnée n'est modifiée ; si une ligne existante
-- contredit la séparation, la migration S'ARRÊTE et le dit, plutôt que de trancher seule.

BEGIN;

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM public.contact_consents
   WHERE kind = 'contact_analysis' AND NOT (scope <@ ARRAY['analysis']);
  IF n > 0 THEN
    RAISE EXCEPTION 'Migration 116 interrompue : % ligne(s) contact_analysis portent une autre portée que « analysis ». Les inventorier avant de poursuivre.', n;
  END IF;
END $$;

-- A. Le type et sa cohérence
ALTER TABLE public.contact_consents DROP CONSTRAINT IF EXISTS contact_consents_kind_check;
ALTER TABLE public.contact_consents ADD CONSTRAINT contact_consents_kind_check
  CHECK (kind IN ('contact_analysis', 'profile_view', 'profile_usage'));

ALTER TABLE public.contact_consents DROP CONSTRAINT IF EXISTS contact_consents_kind_contact_coherence;
ALTER TABLE public.contact_consents ADD CONSTRAINT contact_consents_kind_contact_coherence
  CHECK (
    (kind IN ('contact_analysis', 'profile_usage') AND contact_id IS NOT NULL)
    OR (kind = 'profile_view' AND contact_id IS NULL)
  );

-- La portée par défaut était « analysis » : une insertion qui oubliait la portée partageait
-- l'analyse. Désormais, rien par défaut.
ALTER TABLE public.contact_consents ALTER COLUMN scope SET DEFAULT '{}'::text[];

-- Une ligne active par (pilote, fiche), PAR SENS et PAR COMPTE. Sans le compte dans la clé,
-- l'autorisation laissée par un ancien compte lié empêchait le nouveau de régler la sienne —
-- et l'échec lui apprenait qu'un autre avait réglé quelque chose.
DROP INDEX IF EXISTS public.idx_consents_one_active;
CREATE UNIQUE INDEX idx_consents_one_active
  ON public.contact_consents (pilote_id, contact_id, kind, proche_user_id)
  WHERE status = 'active' AND contact_id IS NOT NULL;

-- B à E. La garde
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

-- Le pilote ne voit ni n'écrit les autorisations d'usage du proche.
DROP POLICY IF EXISTS "pilote_manage_consents" ON public.contact_consents;
CREATE POLICY "pilote_manage_consents" ON public.contact_consents
  FOR ALL
  USING      (auth.uid() = pilote_id AND kind <> 'profile_usage')
  WITH CHECK (auth.uid() = pilote_id AND kind <> 'profile_usage');

-- F. L'analyse du pilote : demandée par lui, acceptée par le proche, portée présente.
DROP POLICY IF EXISTS "proche_read_consented_analysis" ON public.profile_analysis;
CREATE POLICY "proche_read_consented_analysis" ON public.profile_analysis
  FOR SELECT
  USING (
    contact_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.contact_consents cc
      WHERE cc.kind           = 'contact_analysis'
        AND cc.pilote_id      = profile_analysis.user_id
        AND cc.contact_id     = profile_analysis.contact_id
        AND cc.proche_user_id = auth.uid()
        AND cc.status         = 'active'
        AND 'analysis'        = ANY (cc.scope)
        AND cc.requested_by   = cc.pilote_id
        AND cc.granted_by     = cc.proche_user_id
    )
  );

-- G. Plus de lecture directe d'une fiche partagée : le serveur filtre section par section.
DROP POLICY IF EXISTS "viewer_read_shared_self_analysis" ON public.profile_analysis;
DROP POLICY IF EXISTS "proche_reads_pilot_self_state" ON public.person_states;

COMMIT;

-- VÉRIFICATION APRÈS APPLICATION (lecture seule)
--   select polname from pg_policy
--    where polrelid in ('public.profile_analysis'::regclass, 'public.person_states'::regclass,
--                       'public.contact_consents'::regclass) order by 1;
--   → ne doit plus contenir viewer_read_shared_self_analysis ni proche_reads_pilot_self_state.
--   select md5(prosrc) from pg_proc where proname = 'garde_contact_consents';
