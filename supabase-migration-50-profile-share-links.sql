-- Migration 50 — B.2 Phase 7 : lien de partage sortant + annulation d'une demande
--
-- 1. profile_share_links : Y génère un lien APRÈS avoir choisi ce qu'il partage
--    (scope = sections cochables, ou ARRAY['blind'] pour l'aveugle).
--    Le lien est à USAGE UNIQUE : la première personne connectée qui le
--    réclame obtient un consent profile_view ACTIF (pilote = Y), puis le
--    lien est marqué réclamé. Un lien ne donne JAMAIS accès sans compte.
-- 2. RLS : le propriétaire gère ses liens ; la réclamation passe par la
--    couche serveur (service_role) après validation du token — aucun accès
--    public en lecture (pas d'énumération de tokens possible).
-- 3. contact_consents : le demandeur X peut ANNULER (DELETE) sa propre
--    demande profile_view tant qu'elle est 'pending' — jamais après réponse.
--
-- Additive uniquement.

-- ── 1. Table ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_share_links (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  scope       TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_by  UUID                 REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at  TIMESTAMPTZ,
  consent_id  UUID                 REFERENCES contact_consents(id) ON DELETE SET NULL,
  revoked_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_share_links_owner ON profile_share_links (owner_id);

-- ── 2. RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE profile_share_links ENABLE ROW LEVEL SECURITY;

-- Le propriétaire gère ses liens (créer, lister, révoquer)
DROP POLICY IF EXISTS "owner_manage_share_links" ON profile_share_links;
CREATE POLICY "owner_manage_share_links" ON profile_share_links
  FOR ALL
  USING  (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Aucune policy de lecture publique : la résolution d'un token se fait
-- exclusivement côté serveur (service_role) dans l'API de réclamation.

-- ── 3. Annulation d'une demande par le demandeur (X) ──────────────────────────

DROP POLICY IF EXISTS "viewer_cancel_own_pending_request" ON contact_consents;
CREATE POLICY "viewer_cancel_own_pending_request" ON contact_consents
  FOR DELETE
  USING (
    auth.uid() = requested_by
    AND kind = 'profile_view'
    AND status = 'pending'
  );
