-- Migration 50 — B.2 Phase 7 : lien de partage sortant + annulation d'une demande
-- (RÉVISION post-revue Estelle : expires_at, token_hash, CHECK scope ≥ 1)
--
-- 1. profile_share_links : Y génère un lien APRÈS avoir choisi ce qu'il partage
--    (scope = sections cochables, ou ARRAY['blind'] pour l'aveugle — JAMAIS vide).
--    Le lien est à USAGE UNIQUE et EXPIRE à 30 jours. La première personne
--    connectée qui le réclame obtient un consent profile_view ACTIF (pilote = Y),
--    puis le lien est marqué réclamé. Un lien ne donne JAMAIS accès sans compte.
-- 2. Le token n'est JAMAIS stocké en clair : seule son empreinte SHA-256
--    (token_hash) vit en base. Le token brut n'existe qu'à la génération et
--    dans l'URL envoyée ; la réclamation hashe le token reçu et compare.
-- 3. RLS : le propriétaire gère ses liens ; la réclamation passe par la
--    couche serveur (service_role) après hachage du token — aucun accès
--    public en lecture (pas d'énumération possible).
-- 4. contact_consents : le demandeur X peut ANNULER (DELETE) sa propre
--    demande profile_view tant qu'elle est 'pending' — jamais après réponse.
--
-- Additive uniquement.

-- ── 1. Table ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_share_links (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL UNIQUE,
  scope       TEXT[]      NOT NULL CHECK (array_length(scope, 1) >= 1),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 days',
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

-- Aucune policy de lecture publique : la résolution d'un token (hashé) se
-- fait exclusivement côté serveur (service_role) dans l'API de réclamation.
-- Garanties appliquées par cette API :
--   • réclamation par UPDATE ATOMIQUE
--     … WHERE claimed_at IS NULL AND revoked_at IS NULL AND expires_at > now()
--     (usage unique garanti contre les réclamations simultanées)
--   • le propriétaire ne peut JAMAIS réclamer son propre lien (erreur douce)
--   • lien expiré / révoqué / déjà réclamé → « Ce lien n'est plus valide »

-- ── 3. Annulation d'une demande par le demandeur (X) ──────────────────────────

DROP POLICY IF EXISTS "viewer_cancel_own_pending_request" ON contact_consents;
CREATE POLICY "viewer_cancel_own_pending_request" ON contact_consents
  FOR DELETE
  USING (
    auth.uid() = requested_by
    AND kind = 'profile_view'
    AND status = 'pending'
  );
