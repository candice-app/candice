-- Migration 28 : table processing_log (observabilité Brain — section 46)
-- Chaque mémoire est retraçable de bout en bout via correlation_id.
-- Suppression RGPD : cascade sur pilot_id.

CREATE TABLE IF NOT EXISTS processing_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID        NOT NULL,
  pilot_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_id      UUID        REFERENCES memories(id) ON DELETE CASCADE,
  step           TEXT        NOT NULL CHECK (step IN ('memory','signal','trust','orchestrator')),
  status         TEXT        NOT NULL CHECK (status IN ('success','fallback','error','skipped')),
  duration_ms    INTEGER,
  error_message  TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processing_log_correlation
  ON processing_log (correlation_id);

CREATE INDEX IF NOT EXISTS idx_processing_log_memory
  ON processing_log (memory_id);

CREATE INDEX IF NOT EXISTS idx_processing_log_pilot
  ON processing_log (pilot_id, created_at DESC);

-- Pas de RLS : accessible uniquement en console admin (via service_role).
-- Les utilisateurs n'ont jamais accès direct à cette table.
