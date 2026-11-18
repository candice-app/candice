-- Migration 112 — SEUL LE TITULAIRE DES DONNÉES ACCORDE OU ÉLARGIT UN CONSENTEMENT (18 nov.).
--
-- CONSTAT (pile locale, puis politiques relevées sur la base vivante par Estelle) :
--   `pilote_manage_consents` vaut pour TOUTES les opérations, avec la seule condition
--   `auth.uid() = pilote_id`. Pour un consentement `contact_analysis`, `pilote_id` est celui
--   qui DEMANDE : il pouvait donc écrire lui-même une ligne `active` au nom d'un autre compte,
--   par un appel direct à la base. Les politiques permissives se COMBINENT : en ajouter une
--   plus stricte ne retire rien à celle-ci. Il faut une garde que toute écriture traverse,
--   quelle que soit la politique qui l'a laissée passer : un déclencheur.
--
-- QUI EST LE TITULAIRE.
--   · `contact_analysis` : la personne dont on utilise les données est `proche_user_id`.
--   · `profile_view`     : la personne dont on consulte la fiche est `pilote_id`.
--
-- CE QUE LE DÉCLENCHEUR IMPOSE à toute écriture qui ne vient pas du serveur :
--   1. Les PARTIES et le TYPE ne changent pas après création (`pilote_id`, `proche_user_id`,
--      `contact_id`, `kind`). Changer le type changerait le titulaire : c'était un moyen de
--      créer une ligne active sous un type, puis de la faire passer pour l'autre.
--   2. Une ligne ne DEVIENT active que par son titulaire.
--   3. La PORTÉE d'une ligne active ne s'ÉLARGIT que par son titulaire. La restreindre ou
--      révoquer reste ouvert aux deux parties.
--   4. La PREUVE de l'accord est écrite par le déclencheur lui-même, jamais par l'appelant :
--      `granted_by` (qui), `granted_at` (quand), `granted_via` (« titulaire » ou « serveur »).
--      `consented_at` ne prouvait rien : le demandeur pouvait l'écrire.
--
-- LE SERVEUR est reconnu par son RÔLE, pas par l'absence d'utilisateur : rôle JWT
-- `service_role`, ou session directe d'administration sans JWT (éditeur SQL, migrations).
-- `auth.uid() IS NULL` seul ne suffit pas — il est vrai aussi pour un appel anonyme.
-- Une écriture du serveur n'est pas refusée (les routes déployées doivent continuer de
-- fonctionner) ; elle est MARQUÉE `granted_via = 'serveur'`, et `granted_by` ne vaut que si
-- le serveur l'a renseigné.
--
-- CE QUE LA MIGRATION NE FAIT PAS : elle ne modifie, ne révoque ni ne valide aucune ligne
-- existante. Les consentements déjà actifs gardent `granted_by` NULL : aucune preuve d'accord.
-- Le code les traite comme NON établis pour tout usage de données sensibles, jusqu'à décision.
-- À APPLIQUER PAR ESTELLE sur la base vivante.

ALTER TABLE public.contact_consents
  ADD COLUMN IF NOT EXISTS granted_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS granted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS granted_via text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_consents_granted_via_check') THEN
    ALTER TABLE public.contact_consents ADD CONSTRAINT contact_consents_granted_via_check
      CHECK (granted_via IS NULL OR granted_via IN ('titulaire', 'serveur'));
  END IF;
END $$;

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
    ELSIF TG_OP = 'UPDATE' AND NEW.granted_by IS DISTINCT FROM OLD.granted_by THEN
      -- Le serveur atteste d'un accord sur une ligne déjà active (portée élargie par son
      -- titulaire, via une route qui a vérifié son identité).
      NEW.granted_via := 'serveur';
      NEW.granted_at  := now();
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
  v_elargit := TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status = 'active' AND NOT (NEW.scope <@ OLD.scope);

  IF (v_devient_active OR v_elargit) AND (v_uid IS NULL OR v_titulaire IS NULL OR v_uid <> v_titulaire) THEN
    RAISE EXCEPTION 'contact_consents : seule la personne concernée peut accorder ou élargir ce consentement';
  END IF;

  -- LA PREUVE est écrite ICI. Ce que l'appelant a mis dans ces colonnes est ignoré.
  IF v_devient_active OR v_elargit THEN
    NEW.granted_by := v_uid; NEW.granted_at := now(); NEW.granted_via := 'titulaire';
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.granted_by := OLD.granted_by; NEW.granted_at := OLD.granted_at; NEW.granted_via := OLD.granted_via;
  ELSE
    NEW.granted_by := NULL; NEW.granted_at := NULL; NEW.granted_via := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_garde_contact_consents ON public.contact_consents;
CREATE TRIGGER trg_garde_contact_consents
  BEFORE INSERT OR UPDATE ON public.contact_consents
  FOR EACH ROW EXECUTE FUNCTION public.garde_contact_consents();

-- (essai local du 18 nov., retiré : une politique en double de `proche_respond_consents`)
DROP POLICY IF EXISTS proche_respond_own_consents ON public.contact_consents;

-- INVENTAIRE (lecture seule, à lancer AVANT et APRÈS) — les consentements actifs et ce qui
-- atteste de leur accord :
--   select id, kind, pilote_id, proche_user_id, contact_id, scope, requested_by,
--          requested_at, responded_at, consented_at, granted_by, granted_at, granted_via
--   from contact_consents where status = 'active' order by requested_at;
