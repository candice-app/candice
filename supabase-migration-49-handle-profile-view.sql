-- Migration 49 — B.2 Phase 6 : @identifiant unique + demandes de vue de profil + durcissement RLS
--
-- 1. HANDLE   : my_profile.handle — identifiant unique choisi à l'inscription
--               (style Instagram : minuscules, chiffres, . et _, 3-20 caractères).
--               RPC lookup_candice_user_by_handle : même contrat que la migration 38
--               (UUID seul, jamais de PII, respecte is_findable).
-- 2. CONSENTS : contact_consents accueille un 2e type de lien — kind = 'profile_view' :
--               X (proche_user_id, demandeur) demande à voir la fiche de Y (pilote_id).
--               Y répond ; scope stocke les sections partagées (SectionKey[]),
--               ou ARRAY['blind'] pour le mode aveugle.
--               contact_id devient NULLABLE (une demande de vue ne passe pas par contacts).
-- 3. RLS      : durcissement proche_respond_consents (A.4 : statut résultant contraint
--               en base + policy cantonnée au flux historique contact_analysis),
--               INSERT du demandeur, lecture de l'auto-analyse du partageur par le
--               proche autorisé (jamais en mode aveugle).
--
-- Additive uniquement — aucune donnée existante modifiée hors backfill requested_by.

-- ── 1. Handle unique ───────────────────────────────────────────────────────────

ALTER TABLE my_profile ADD COLUMN IF NOT EXISTS handle TEXT;

-- Format verrouillé : minuscules/chiffres/./_, 3-20 caractères (stocké en minuscules)
ALTER TABLE my_profile DROP CONSTRAINT IF EXISTS my_profile_handle_format;
ALTER TABLE my_profile ADD CONSTRAINT my_profile_handle_format
  CHECK (handle IS NULL OR handle ~ '^[a-z0-9._]{3,20}$');

CREATE UNIQUE INDEX IF NOT EXISTS my_profile_handle_key ON my_profile (handle);

-- Lookup par identifiant EXACT — pas de recherche floue, pas de nom.
-- INNER JOIN implicite : pas de row my_profile → jamais retourné (cf. migration 38).
CREATE OR REPLACE FUNCTION lookup_candice_user_by_handle(p_handle TEXT)
RETURNS TABLE (proche_user_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Enumeration risk : l'appelant apprend si un identifiant existe et est trouvable.
  -- Mitigé : appelants authentifiés seulement, aucun PII retourné.
  SELECT mp.user_id AS proche_user_id
  FROM my_profile mp
  WHERE mp.handle = lower(trim(p_handle))
    AND mp.is_findable = true;
$$;

GRANT EXECUTE ON FUNCTION lookup_candice_user_by_handle(TEXT) TO authenticated, service_role;

-- ── 2. contact_consents : type profile_view ────────────────────────────────────

ALTER TABLE contact_consents ALTER COLUMN contact_id DROP NOT NULL;

ALTER TABLE contact_consents ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'contact_analysis';
ALTER TABLE contact_consents DROP CONSTRAINT IF EXISTS contact_consents_kind_check;
ALTER TABLE contact_consents ADD CONSTRAINT contact_consents_kind_check
  CHECK (kind IN ('contact_analysis', 'profile_view'));

-- Cohérence : contact_analysis exige un contact, profile_view n'en a jamais
ALTER TABLE contact_consents DROP CONSTRAINT IF EXISTS contact_consents_kind_contact_coherence;
ALTER TABLE contact_consents ADD CONSTRAINT contact_consents_kind_contact_coherence
  CHECK (
    (kind = 'contact_analysis' AND contact_id IS NOT NULL)
    OR (kind = 'profile_view' AND contact_id IS NULL)
  );

-- Qui a initié la demande (X pour profile_view, A pour contact_analysis)
ALTER TABLE contact_consents ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
UPDATE contact_consents SET requested_by = pilote_id WHERE requested_by IS NULL;

-- Un seul consent profile_view ACTIF par (partageur, demandeur)
CREATE UNIQUE INDEX IF NOT EXISTS idx_consents_one_active_profile_view
  ON contact_consents (pilote_id, proche_user_id)
  WHERE status = 'active' AND kind = 'profile_view';

-- Une seule demande EN ATTENTE par (partageur, demandeur) — anti-spam
CREATE UNIQUE INDEX IF NOT EXISTS idx_consents_one_pending_profile_view
  ON contact_consents (pilote_id, proche_user_id)
  WHERE status = 'pending' AND kind = 'profile_view';

-- ── 3. RLS ─────────────────────────────────────────────────────────────────────

-- 3a. Durcissement (A.4) : le statut résultant est contraint EN BASE
--     ('active'/'rejected' seulement) et la policy est cantonnée au flux
--     historique contact_analysis. Pour profile_view, c'est le PARTAGEUR
--     (pilote_id) qui répond, via pilote_manage_consents — sans ce
--     cantonnement, un demandeur pourrait s'auto-accorder l'accès.
DROP POLICY IF EXISTS "proche_respond_consents" ON contact_consents;
CREATE POLICY "proche_respond_consents" ON contact_consents
  FOR UPDATE
  USING     (auth.uid() = proche_user_id AND kind = 'contact_analysis')
  WITH CHECK (auth.uid() = proche_user_id AND kind = 'contact_analysis'
              AND status IN ('active', 'rejected'));

-- 3b. Le demandeur X crée sa demande de vue — toujours 'pending', jamais pour soi
DROP POLICY IF EXISTS "viewer_create_profile_view_request" ON contact_consents;
CREATE POLICY "viewer_create_profile_view_request" ON contact_consents
  FOR INSERT
  WITH CHECK (
    kind = 'profile_view'
    AND auth.uid() = proche_user_id
    AND auth.uid() = requested_by
    AND status = 'pending'
    AND contact_id IS NULL
    AND pilote_id <> auth.uid()
  );

-- 3c. X (autorisé, non-aveugle) lit l'auto-analyse de Y (contact_id IS NULL).
--     En mode aveugle ('blind' ∈ scope), AUCUNE lecture : seule Candice s'en
--     sert, côté serveur. Le filtrage par section (scope) est appliqué par la
--     couche serveur via VISIBILITY_MATRIX — cette policy n'ouvre que la ligne
--     d'analyse, jamais les données brutes.
DROP POLICY IF EXISTS "viewer_read_shared_self_analysis" ON profile_analysis;
CREATE POLICY "viewer_read_shared_self_analysis" ON profile_analysis
  FOR SELECT
  USING (
    contact_id IS NULL
    AND EXISTS (
      SELECT 1 FROM contact_consents cc
      WHERE cc.kind           = 'profile_view'
        AND cc.status         = 'active'
        AND cc.pilote_id      = profile_analysis.user_id
        AND cc.proche_user_id = auth.uid()
        AND NOT ('blind' = ANY(cc.scope))
    )
  );
