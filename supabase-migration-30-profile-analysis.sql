-- Migration 30 — Source unique d'analyse : table profile_analysis
-- Lot 2 Phase 1 : Modèle de données

-- ── Table principale ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_analysis (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id       UUID        REFERENCES contacts(id) ON DELETE CASCADE,

  -- Résumé global (bloc narratif + chips)
  summary          TEXT,
  summary_chips    JSONB,       -- string[]

  -- Sections structurées : { attention, what_touches, feels_loved, gifts, avoid,
  --   style, brands, restaurants, travel, hobbies, attention_dna }
  -- Chaque section : { text: string, chips: string[] }
  sections         JSONB,

  -- Scores internes (non affichés) : { dim_key: 0–100 }
  dimension_scores JSONB,

  -- Incontournables & deal-breakers
  must_haves       JSONB,       -- string[]
  deal_breakers    JSONB,       -- string[]

  -- ADN attentions : { dimension: string, intensity: number, note: string }[]
  attention_dna    JSONB,

  -- Contraintes pratiques (allergies, mobilité…)
  constraints      JSONB,       -- string[]

  -- Entités extraites par Haiku (marques, lieux, hobbies nommés…)
  entities         JSONB,       -- { brands: [], places: [], hobbies: [], events: [] }

  -- Genre grammatical appliqué : 'feminine' | 'masculine' | 'neutral'
  gender           TEXT,

  -- Confiance du modèle (0–1) — usage interne uniquement, jamais affiché
  confidence       FLOAT        CHECK (confidence >= 0 AND confidence <= 1),

  -- Source des données ayant alimenté l'analyse
  source           TEXT,        -- ex: 'questionnaire+memories', 'questionnaire_only'

  -- Métadonnées
  generated_at     TIMESTAMPTZ  DEFAULT now(),
  engine_version   TEXT         DEFAULT '2.0',

  created_at       TIMESTAMPTZ  DEFAULT now(),
  updated_at       TIMESTAMPTZ  DEFAULT now()
);

-- Index partiels : une seule ligne par (user, profil-propre) et par (user, contact)
CREATE UNIQUE INDEX IF NOT EXISTS pa_self_unique
  ON profile_analysis(user_id)
  WHERE contact_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS pa_contact_unique
  ON profile_analysis(user_id, contact_id)
  WHERE contact_id IS NOT NULL;

-- Index de lookup rapide
CREATE INDEX IF NOT EXISTS idx_pa_user ON profile_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_pa_contact ON profile_analysis(contact_id) WHERE contact_id IS NOT NULL;

-- RLS : chaque utilisateur ne voit que ses propres analyses
ALTER TABLE profile_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_analysis" ON profile_analysis
  FOR ALL USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profile_analysis_updated_at
  BEFORE UPDATE ON profile_analysis
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Extensions additives de discovery_questions ───────────────────────────────
-- Colonnes utilisées par le Discovery Engine (Phase 6)
-- Toutes optionnelles pour rester compatibles avec les seeds existants.

ALTER TABLE discovery_questions
  ADD COLUMN IF NOT EXISTS trigger_from_main_question TEXT,
  ADD COLUMN IF NOT EXISTS trigger_condition           TEXT,
  ADD COLUMN IF NOT EXISTS priority                   INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS free_text_enabled          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updates_dimensions         TEXT[],
  ADD COLUMN IF NOT EXISTS updates_must_have          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updates_deal_breakers      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updates_supplier_rules     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updates_recommendation_logic BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS do_not_show_if             TEXT,
  ADD COLUMN IF NOT EXISTS profile_output_impact      TEXT,
  ADD COLUMN IF NOT EXISTS catalogue_matching_impact  TEXT;

-- ── Extension de my_profile ───────────────────────────────────────────────────

ALTER TABLE my_profile
  ADD COLUMN IF NOT EXISTS discovery_fatigue_score INTEGER DEFAULT 0;

-- Contrôle
SELECT 'profile_analysis created' AS status,
       count(*) AS rows
FROM profile_analysis;
