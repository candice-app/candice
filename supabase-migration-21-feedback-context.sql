-- Migration 21: Part A — context_journal type column (for register_complicated_context)
ALTER TABLE context_journal
  ADD COLUMN IF NOT EXISTS type TEXT;

-- Migration 21: Part B — attention_log feedback columns
ALTER TABLE attention_log
  ADD COLUMN IF NOT EXISTS feedback TEXT CHECK(feedback IN ('juste', 'a_cote', 'pas_le_moment')),
  ADD COLUMN IF NOT EXISTS feedback_note TEXT,
  ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMPTZ;
