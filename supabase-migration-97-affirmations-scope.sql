-- Migration 97 — TRAÇABILITÉ À L'AFFIRMATION + TAMPON DE PÉRIMÈTRE (ligne 4 du chantier, conditions Estelle 2 nov).
--
-- Contexte : §30.2 bis du prompt maître — la traçabilité SECTIONNELLE (source_evidence_ids, migration 91) ne
-- satisfait pas « Pourquoi dis-tu cela ? » phrase par phrase. Décision d'architecture : OPTION A — les
-- affirmations sont un ATTRIBUT de la section (même cycle de vie : régénérer la section les remplace toutes),
-- stockées en JSONB sur la ligne, PAS une table séparée. Chaque affirmation :
--   { "id": "...", "range": [start,end]|null, "type": "declaration|tendance|hypothese|implication",
--     "evidence_ids": ["<knowledge_sources.id>", ...] }
-- UNITÉ de traçabilité = knowledge_sources.id (ce sur quoi supersession/autorisation/récence opèrent déjà :
-- supersedeSources marque par source, liveSelfSourceIdsForQuestion rend des source_id).
--
-- (a) INDEX GIN sur les evidence_ids À L'INTÉRIEUR du JSONB — la traçabilité marche dans les DEUX sens :
--     « quelles sources soutiennent cette conclusion » (lecture de la ligne) ET « à quoi contribue cette
--     source » (requête inverse `affirmations @> '[{"evidence_ids":["<id>"]}]'`), indexée, pas un balayage.
--
-- (b) CONTRAINTE, pas convention : source_evidence_ids de la section = UNION EXACTE des evidence_ids de ses
--     affirmations. Vérifiable en base (fonctions IMMUTABLE + CHECK), pour que les deux ne divergent jamais —
--     sinon la section prétendrait s'appuyer sur des sources qu'aucune de ses phrases n'utilise.
--
-- TAMPON DE PÉRIMÈTRE (condition cache différé à 7bis) : chaque section porte son `scope` EXPLICITEMENT.
--     Une section générée pour le périmètre 'self' ne doit jamais pouvoir être servie à un autre périmètre,
--     même par accident, même si elle est déjà là. Le read filtre par scope ; la colonne rend la réutilisation
--     accidentelle impossible le jour de 7bis. Ligne 4 : scope = 'self' uniquement.
--
-- Additive. profile_analysis_sections est VIDE aujourd'hui (aucune orchestration n'écrit encore) → la CHECK
-- et le NOT NULL passent sur l'existant.

BEGIN;

-- Colonnes additives (idempotentes).
ALTER TABLE profile_analysis_sections
  ADD COLUMN IF NOT EXISTS affirmations JSONB,
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'self';

-- (a) Index GIN inverse, à l'intérieur du JSONB (jsonb_path_ops : compact, supporte @>).
CREATE INDEX IF NOT EXISTS pas_affirmations_gin
  ON profile_analysis_sections USING GIN (affirmations jsonb_path_ops);

-- (b) UNION exacte, vérifiable. Fonctions PURES (IMMUTABLE) : extrait+trie+dédoublonne les evidence_ids des
--     affirmations, et compare à source_evidence_ids trié+dédoublonné. '{}' des deux côtés si vides.
CREATE OR REPLACE FUNCTION pas_affirmations_union(affs jsonb) RETURNS uuid[]
LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(array_agg(DISTINCT e ORDER BY e), '{}'::uuid[])
  FROM jsonb_array_elements(COALESCE(affs, '[]'::jsonb)) AS a
  CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(a->'evidence_ids', '[]'::jsonb)) AS t(txt)
  CROSS JOIN LATERAL (SELECT t.txt::uuid AS e) AS x;
$$;

CREATE OR REPLACE FUNCTION pas_union_ok(seids uuid[], affs jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(
           (SELECT array_agg(DISTINCT s ORDER BY s) FROM unnest(COALESCE(seids, '{}'::uuid[])) AS s),
           '{}'::uuid[]
         ) IS NOT DISTINCT FROM pas_affirmations_union(affs);
$$;

-- CHECK rejouable (PostgreSQL n'a pas d'ADD CONSTRAINT IF NOT EXISTS).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_pas_source_evidence_union') THEN
    ALTER TABLE profile_analysis_sections
      ADD CONSTRAINT chk_pas_source_evidence_union
      CHECK (pas_union_ok(source_evidence_ids, affirmations));
  END IF;
END $$;

-- Auto-enregistrement idempotent (modèle de la 96).
INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-97-affirmations-scope.sql')
  ON CONFLICT (filename) DO NOTHING;

COMMIT;
