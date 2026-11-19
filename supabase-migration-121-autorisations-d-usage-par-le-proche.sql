-- Migration 121 — LE PROCHE RÈGLE SES AUTORISATIONS D'USAGE LUI-MÊME, SANS CLIENT PRIVILÉGIÉ (19 nov.).
--
-- POURQUOI. Estelle (19 nov., 17h43) : « Ajoute l'écran permettant au proche d'accorder ou retirer
-- `reco:gouts`. Une route seule ne termine pas cette fonctionnalité. » La route existante
-- (/api/consent/exclusions) écrivait avec le client `service_role` — ce que sa règle interdit
-- (« jamais une route portant le client admin »). Le proche ne peut pas, sous RLS :
--   · lire la fiche que le pilote a faite de lui (`contacts` : users_own_contacts) ;
--   · CRÉER une autorisation d'usage (`contact_consents` : aucune politique d'insertion pour lui).
-- Deux fonctions, SECURITY DEFINER, bornées à l'appelant, comblent exactement ce manque :
--   · mes_autorisations_d_usage() : les fiches dont il est le compte lié, avec le prénom du pilote
--     et les portées d'usage qu'IL a lui-même accordées (rien de ce qu'un autre aurait écrit) ;
--   · regler_usage(contact, portee, accorder) : accorde ou retire UNE portée sur UNE fiche.
-- La garde existante (garde_contact_consents, migration 117) reste l'autorité : appelée dans la
-- session de la personne, elle exige que ce soit le titulaire qui accorde, et écrit elle-même
-- granted_by / granted_at / granted_via. Ces fonctions n'écrivent jamais ces colonnes.
--
-- ADDITIVE : deux fonctions, aucune table ni ligne modifiée. Rejouable (CREATE OR REPLACE).
-- RETOUR ARRIÈRE : DROP FUNCTION des deux ; la route revient alors en erreur (elle ne retombe
-- jamais sur le client privilégié).
-- À APPLIQUER PAR ESTELLE sur la base vivante — jamais par un agent. Le code de l'écran et de la
-- route ne doit pas être servi AVANT : la route répondrait 503 (fonction absente).

BEGIN;

CREATE OR REPLACE FUNCTION public.mes_autorisations_d_usage()
RETURNS TABLE (contact_id uuid, pilote_prenom text, portees text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT c.id,
         nullif(split_part(coalesce(u.raw_user_meta_data->>'full_name', ''), ' ', 1), ''),
         coalesce((SELECT k.scope FROM public.contact_consents k
                    WHERE k.pilote_id = c.user_id AND k.contact_id = c.id AND k.proche_user_id = auth.uid()
                      AND k.kind = 'profile_usage' AND k.status = 'active' AND k.granted_by = auth.uid()
                    LIMIT 1), '{}'::text[])
    FROM public.contacts c
    JOIN auth.users u ON u.id = c.user_id
   WHERE auth.uid() IS NOT NULL
     AND c.proche_user_id = auth.uid()
     AND c.archived_at IS NULL
   ORDER BY 2 NULLS LAST, 1;
$$;

CREATE OR REPLACE FUNCTION public.regler_usage(p_contact uuid, p_portee text, p_accorder boolean)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_pilote uuid;
  v_ligne  public.contact_consents%ROWTYPE;
  v_reprises text[];
  v_apres  text[];
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'regler_usage : session requise'; END IF;
  -- La portée : un mot que la recommandation sait lire, rien d'autre (miroir de estUsageValide).
  IF p_portee IS NULL OR NOT (
       p_portee IN ('reco_exclusions', 'reco:profil', 'reco:regime', 'reco:alcool', 'reco:mobilite', 'reco:reponses_libres', 'reco:gouts')
       OR p_portee ~ '^reco:allergie:[a-z0-9_]{1,60}$') THEN
    RAISE EXCEPTION 'regler_usage : portée inconnue';
  END IF;
  -- La fiche doit être CELLE DE L'APPELANT : sinon, n'importe qui réglerait au nom d'un autre.
  SELECT c.user_id INTO v_pilote FROM public.contacts c
   WHERE c.id = p_contact AND c.proche_user_id = v_uid AND c.archived_at IS NULL;
  IF v_pilote IS NULL THEN RAISE EXCEPTION 'regler_usage : fiche introuvable'; END IF;

  SELECT * INTO v_ligne FROM public.contact_consents k
   WHERE k.pilote_id = v_pilote AND k.contact_id = p_contact AND k.proche_user_id = v_uid
     AND k.kind = 'profile_usage' AND k.status = 'active'
   FOR UPDATE;

  -- On n'hérite pas d'une portée dont l'accord n'est pas établi par CETTE personne.
  v_reprises := CASE WHEN FOUND AND v_ligne.granted_by = v_uid THEN coalesce(v_ligne.scope, '{}') ELSE '{}' END;

  IF p_accorder THEN
    v_apres := CASE WHEN p_portee = ANY (v_reprises) THEN v_reprises ELSE v_reprises || p_portee END;
    IF FOUND THEN
      UPDATE public.contact_consents SET scope = v_apres, responded_at = now(), consented_at = now() WHERE id = v_ligne.id;
    ELSE
      INSERT INTO public.contact_consents (pilote_id, contact_id, proche_user_id, kind, status, scope, responded_at, consented_at)
      VALUES (v_pilote, p_contact, v_uid, 'profile_usage', 'active', v_apres, now(), now());
    END IF;
    RETURN v_apres;
  END IF;

  -- RETRAIT de cette portée seulement. Sans ligne : rien, et surtout pas une ligne « revoked »
  -- fabriquée, qui laisserait croire qu'un accord a existé.
  IF NOT FOUND THEN RETURN '{}'::text[]; END IF;
  v_apres := array_remove(v_reprises, p_portee);
  IF cardinality(v_apres) = 0 THEN
    UPDATE public.contact_consents SET scope = '{}', status = 'revoked', responded_at = now() WHERE id = v_ligne.id;
  ELSE
    UPDATE public.contact_consents SET scope = v_apres, responded_at = now() WHERE id = v_ligne.id;
  END IF;
  RETURN v_apres;
END;
$$;

REVOKE ALL ON FUNCTION public.mes_autorisations_d_usage() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.regler_usage(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mes_autorisations_d_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.regler_usage(uuid, text, boolean) TO authenticated;

INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-121-autorisations-d-usage-par-le-proche.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations WHERE filename = 'supabase-migration-121-autorisations-d-usage-par-le-proche.sql'
);

COMMIT;

-- L'API (PostgREST) doit connaître les deux fonctions : sans ce signal, elle répond « fonction
-- introuvable » jusqu'à son prochain rechargement (constaté en local le 19 nov.).
NOTIFY pgrst, 'reload schema';

-- VÉRIFICATION (lecture seule) :
--   select proname, prosecdef from pg_proc where proname in ('mes_autorisations_d_usage', 'regler_usage');
