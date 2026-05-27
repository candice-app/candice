-- Migration 18 — Moteur de recommandation d'attentions adaptatives
-- Tables : contact_recommendations, context_journal, attention_log

-- ─── contact_recommendations ─────────────────────────────────────────────────
-- Stores 1-3 tailored attention recommendations per contact.
-- Replaces the generic `suggestions` table as the primary display.
CREATE TABLE IF NOT EXISTS contact_recommendations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id   UUID NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  ideas        JSONB NOT NULL DEFAULT '[]',
  blind_spot   JSONB,
  kadence      TEXT CHECK (kadence IN ('haute', 'moyenne', 'basse')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_reco_user    ON contact_recommendations (user_id);
CREATE INDEX IF NOT EXISTS idx_contact_reco_contact ON contact_recommendations (contact_id);

ALTER TABLE contact_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_recommendations" ON contact_recommendations
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── context_journal ─────────────────────────────────────────────────────────
-- Warm proactive questions asked by Candice + Pilote answers.
-- Answers enrich context for future recommendations (never raw data displayed).
CREATE TABLE IF NOT EXISTS context_journal (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id  UUID NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  question    TEXT NOT NULL,
  answer      TEXT,
  answered_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_context_journal_contact ON context_journal (user_id, contact_id, created_at DESC);

ALTER TABLE context_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_context_journal" ON context_journal
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── attention_log ───────────────────────────────────────────────────────────
-- History of proposed / done / skipped attentions per contact.
-- Used to avoid repetition and respect cadence.
CREATE TABLE IF NOT EXISTS attention_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  attention_title TEXT NOT NULL,
  attention_type  TEXT,
  status          TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'done', 'skipped')),
  proposed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  actioned_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_attention_log_contact ON attention_log (user_id, contact_id, proposed_at DESC);

ALTER TABLE attention_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_attention_log" ON attention_log
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
