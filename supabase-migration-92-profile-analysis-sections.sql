-- Migration 92 — textes de profil/fiche STOCKÉS PAR SECTION (hsg §48octies, décision 24 oct).
-- Le partage est déjà par section (scope/SectionPicker) ; la génération et la péremption doivent l'être
-- aussi. Deux étages : 'detail' (écrite depuis ses tags, régénérable seule) et 'synthesis' (résumé,
-- carrousel, mode d'emploi du duo — écrite APRÈS en recevant les sections de détail, via depends_on_sections).
-- contact_id null = profil du pilote, set = fiche d'un proche. Péremption PAR REQUÊTE (source_evidence_ids
-- + generated_at), jamais de drapeau. Additive ; l'ancien blob profile_analysis.sections reste le temps
-- que la génération soit reconstruite sur le journal (puis supprimé à l'étape 2, sans drop de colonne ici).

CREATE TABLE IF NOT EXISTS profile_analysis_sections (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id          UUID        REFERENCES contacts(id) ON DELETE CASCADE,  -- null = profil self
  section_key         TEXT        NOT NULL,
  tier                TEXT        NOT NULL CHECK (tier IN ('detail','synthesis')),
  text                TEXT,
  chips               JSONB,
  source_evidence_ids UUID[],                                               -- péremption par requête
  depends_on_sections TEXT[],                                               -- synthèses : clés de détail dont elles dépendent
  generated_at        TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- unicité par (sujet, section) — self et proche séparés (null distinct en SQL : deux index partiels)
CREATE UNIQUE INDEX IF NOT EXISTS pas_self_unique    ON profile_analysis_sections(user_id, section_key)             WHERE contact_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pas_contact_unique ON profile_analysis_sections(user_id, contact_id, section_key) WHERE contact_id IS NOT NULL;

ALTER TABLE profile_analysis_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY pas_owner ON profile_analysis_sections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-92-profile-analysis-sections.sql');
