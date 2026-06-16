-- Migration 40 — 4.3b-2 : table contact_consents + policy lecture de profile_analysis pour le proche
--
-- MODÈLE :
--   A = Pilote qui a saisi la fiche d'un proche B
--   B = le proche, qui peut CONSENTIR à voir l'analyse relationnelle que A a générée
--
-- RÈGLES GRAVÉES :
--   • A initie manuellement ("Partager mon analyse avec B") — jamais automatique
--   • B consent explicitement — aucune case pré-cochée
--   • B ne voit que profile_analysis (analyse) — jamais questionnaire_responses (données brutes)
--   • Un seul consent ACTIF par (pilote, contact) à la fois
--   • Révocation + re-demande toujours possibles (pas de UNIQUE dur sur la paire)

-- ── Table ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contact_consents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pilote_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id      UUID        NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  proche_user_id  UUID                 REFERENCES auth.users(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','active','rejected','revoked')),
  scope           TEXT[]      NOT NULL DEFAULT ARRAY['analysis'],
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at    TIMESTAMPTZ,
  consented_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garde-fou : un seul consent ACTIF par (pilote, contact)
-- Permet de créer de nouvelles lignes 'pending' après révocation
CREATE UNIQUE INDEX IF NOT EXISTS idx_consents_one_active
  ON contact_consents (pilote_id, contact_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_consents_pilote  ON contact_consents (pilote_id);
CREATE INDEX IF NOT EXISTS idx_consents_proche  ON contact_consents (proche_user_id);
CREATE INDEX IF NOT EXISTS idx_consents_contact ON contact_consents (contact_id);

-- ── RLS ────────────────────────────────────────────────────────────────────────

ALTER TABLE contact_consents ENABLE ROW LEVEL SECURITY;

-- A gère TOUTES ses demandes (créer, lire, révoquer)
CREATE POLICY "pilote_manage_consents" ON contact_consents
  FOR ALL
  USING  (auth.uid() = pilote_id)
  WITH CHECK (auth.uid() = pilote_id);

-- B voit uniquement les demandes qui le concernent
CREATE POLICY "proche_read_own_consents" ON contact_consents
  FOR SELECT
  USING (auth.uid() = proche_user_id);

-- B peut répondre (changer status, responded_at, consented_at)
-- seul le status autorisé en résultat : 'active' ou 'rejected'
CREATE POLICY "proche_respond_consents" ON contact_consents
  FOR UPDATE
  USING     (auth.uid() = proche_user_id)
  WITH CHECK (auth.uid() = proche_user_id);

-- ── profile_analysis — accès B sur l'analyse consentie ────────────────────────
--
-- S'ajoute à la policy existante 'users_own_analysis'.
-- B peut lire les rows profile_analysis où :
--   • contact_id IS NOT NULL (analyse de B par A — jamais l'auto-analyse de A)
--   • un consent ACTIF lie bien (pilote_id=A, contact_id, proche_user_id=B)
-- Les champs bruts questionnaire_responses ne sont JAMAIS exposés via cette policy.

CREATE POLICY "proche_read_consented_analysis" ON profile_analysis
  FOR SELECT
  USING (
    contact_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM contact_consents cc
      WHERE cc.pilote_id      = profile_analysis.user_id
        AND cc.contact_id     = profile_analysis.contact_id
        AND cc.proche_user_id = auth.uid()
        AND cc.status         = 'active'
    )
  );
