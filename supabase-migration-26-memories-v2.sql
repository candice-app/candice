-- Migration 26 : memories V2 — schéma complet (section 5)
-- Préserve toutes les données existantes du Lot 1.
-- Renomme les colonnes : reformulation→sanitized_summary, nature→sentiment,
-- theme→category, urgence→emotional_intensity, statut→status.
-- Migre les valeurs vers les nouveaux enums.
-- Ajoute les champs manquants du schéma V2.6.

-- ── 1. Renommages ────────────────────────────────────────────────────────────

ALTER TABLE memories RENAME COLUMN reformulation    TO sanitized_summary;
ALTER TABLE memories RENAME COLUMN nature           TO sentiment;
ALTER TABLE memories RENAME COLUMN theme            TO category;
ALTER TABLE memories RENAME COLUMN urgence          TO emotional_intensity;
ALTER TABLE memories RENAME COLUMN statut           TO status;

-- ── 2. Supprimer les vieilles contraintes CHECK (noms auto PostgreSQL) ───────

DO $$
BEGIN
  ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_nature_check;
  ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_urgence_check;
  ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_statut_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── 3. Migrer les valeurs vers les nouveaux enums ────────────────────────────

-- sentiment: positive→positif, negative→négatif
UPDATE memories SET sentiment = 'positif'   WHERE sentiment = 'positive';
UPDATE memories SET sentiment = 'négatif'   WHERE sentiment = 'negative';
-- 'neutre' reste identique

-- emotional_intensity: modérée→moyen, haute→élevé, critique→très_élevé
UPDATE memories SET emotional_intensity = 'moyen'      WHERE emotional_intensity = 'modérée';
UPDATE memories SET emotional_intensity = 'élevé'      WHERE emotional_intensity = 'haute';
UPDATE memories SET emotional_intensity = 'très_élevé' WHERE emotional_intensity = 'critique';
-- 'faible' reste identique

-- status: a_revalider→à_revalider, archive→archivé, invalide→invalidé
UPDATE memories SET status = 'à_revalider' WHERE status = 'a_revalider';
UPDATE memories SET status = 'archivé'     WHERE status = 'archive';
UPDATE memories SET status = 'invalidé'    WHERE status = 'invalide';
-- 'actif', 'sensible' restent identiques

-- ── 4. Nouvelles contraintes CHECK ──────────────────────────────────────────

ALTER TABLE memories ADD CONSTRAINT memories_sentiment_check
  CHECK (sentiment IN ('très_négatif', 'négatif', 'neutre', 'positif', 'très_positif'));

ALTER TABLE memories ADD CONSTRAINT memories_emotional_intensity_check
  CHECK (emotional_intensity IN ('faible', 'moyen', 'élevé', 'très_élevé'));

ALTER TABLE memories ADD CONSTRAINT memories_status_check
  CHECK (status IN ('actif', 'à_revalider', 'archivé', 'invalidé', 'sensible', 'masqué', 'confirmé', 'incertain'));

-- ── 5. Nouveaux champs ───────────────────────────────────────────────────────

ALTER TABLE memories ADD COLUMN IF NOT EXISTS memory_type         TEXT DEFAULT 'événement_de_vie';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS subcategory         TEXT;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS source_reliability  TEXT DEFAULT 'moyenne';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS confidence_score    INTEGER DEFAULT 60;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS valid_until         TIMESTAMPTZ;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS revalidation_date   TIMESTAMPTZ;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS visibility_level    TEXT DEFAULT 'privé';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS recommendation_impact JSONB;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS related_events      UUID[];
ALTER TABLE memories ADD COLUMN IF NOT EXISTS related_wishlist_items UUID[];
ALTER TABLE memories ADD COLUMN IF NOT EXISTS related_attention_history UUID[];
ALTER TABLE memories ADD COLUMN IF NOT EXISTS admin_notes         TEXT;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ DEFAULT now();

ALTER TABLE memories ADD CONSTRAINT memories_confidence_score_check
  CHECK (confidence_score BETWEEN 0 AND 100);

-- ── 6. Trigger updated_at ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at_memories()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS memories_updated_at ON memories;
CREATE TRIGGER memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at_memories();

-- ── 7. Index ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_memories_type
  ON memories (memory_type);

CREATE INDEX IF NOT EXISTS idx_memories_status
  ON memories (status) WHERE status IN ('actif', 'confirmé', 'incertain');
