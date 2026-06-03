-- Migration 27 : table signals (Signal Engine — section 6)
-- Signaux exploitables extraits des mémoires par le Signal Engine.
-- Gestion des conflits via conflicting_signals UUID[].

CREATE TABLE IF NOT EXISTS signals (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id                 UUID        NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  pilot_id                   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type                TEXT        NOT NULL,
  signal_value               TEXT        CHECK (signal_value IN ('very_low','low','medium','high','very_high')),
  polarity                   TEXT        CHECK (polarity IN ('positive','negative','neutral')),
  confidence                 INTEGER     DEFAULT 60 CHECK (confidence BETWEEN 0 AND 100),
  source_memory_id           UUID        REFERENCES memories(id) ON DELETE SET NULL,
  freshness                  TIMESTAMPTZ DEFAULT now(),
  used_in_recommendations_count INTEGER  DEFAULT 0,
  last_used_at               TIMESTAMPTZ,
  last_confirmed_at          TIMESTAMPTZ,
  conflicting_signals        UUID[],
  status                     TEXT        DEFAULT 'actif'
                                         CHECK (status IN ('actif','à_clarifier','archivé','invalidé')),
  created_at                 TIMESTAMPTZ DEFAULT now(),
  updated_at                 TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signals_contact
  ON signals (contact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signals_pilot
  ON signals (pilot_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signals_type
  ON signals (contact_id, signal_type);

CREATE INDEX IF NOT EXISTS idx_signals_conflicts
  ON signals (status) WHERE status = 'à_clarifier';

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_signals" ON signals
  USING  (pilot_id = auth.uid())
  WITH CHECK (pilot_id = auth.uid());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at_signals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER signals_updated_at
  BEFORE UPDATE ON signals
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at_signals();
