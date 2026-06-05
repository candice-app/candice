-- Migration 32: grammatical_gender + style_gender_orientation + memories situation columns
-- Additive only — no destructive changes

-- A1: Genre grammatical sur my_profile
-- Pas de DEFAULT : les profils existants restent NULL → déclenchent la modale
ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS grammatical_gender TEXT
    CHECK (grammatical_gender IS NULL OR grammatical_gender IN ('feminine', 'masculine', 'neutral', 'unspecified')),
  ADD COLUMN IF NOT EXISTS style_gender_orientation TEXT[];

-- A8: Colonnes situation sur memories
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS raw_text TEXT,
  ADD COLUMN IF NOT EXISTS reformulated_text TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS tonality TEXT
    CHECK (tonality IS NULL OR tonality IN ('fragile', 'tendue', 'positive', 'neutre')),
  ADD COLUMN IF NOT EXISTS emotional_intensity TEXT
    CHECK (emotional_intensity IS NULL OR emotional_intensity IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS probable_needs JSONB,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    CHECK (status IS NULL OR status IN ('active', 'resolved')),
  ADD COLUMN IF NOT EXISTS source TEXT
    CHECK (source IS NULL OR source IN ('self', 'pilot', 'inferred')),
  ADD COLUMN IF NOT EXISTS confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS revalidate_at TIMESTAMPTZ;

-- Index for quick active-situation queries
CREATE INDEX IF NOT EXISTS memories_type_status_idx
  ON memories (type, status, contact_id, pilot_id)
  WHERE type = 'situation' AND status = 'active';

-- A8: summary_third_person on profile_analysis
ALTER TABLE profile_analysis
  ADD COLUMN IF NOT EXISTS summary_third_person TEXT;
