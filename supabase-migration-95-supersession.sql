-- Migration 95 — SUPERSESSION EXPLICITE (décision Estelle 27 oct). À la correction d'une réponse, l'évènement
-- de correction MARQUE les lignes de l'ancienne version : `superseded_at` + `superseded_by` (le source_id qui
-- les remplace). Le journal GARDE tout (l'append reste l'append) ; ce sont les LECTEURS qui excluent les
-- lignes supersédées (readResolvedEvidences, FACTs, et l'HISTORIQUE — une supersédée = une correction =
-- fate b = REMPLACÉE, nulle part, historique inclus).
--
-- Pourquoi un marqueur EXPLICITE et pas une exclusion implicite par champ :
--  1. supprime la dépendance à my_profile (les FACT se résolvent comme le reste ; my_profile meurt à l'étape 7) ;
--  2. traçabilité dans les deux sens : « pourquoi cette ligne ne compte plus ? » → superseded_by/at répond,
--     et ça ne casse pas si un champ est renommé/scindé ou si la ligne vient d'une autre source (côte à côte) ;
--  3. sert gratuitement le lot « trace des exclusions ».
--
-- Additive, nullable. `superseded_by` = id de la source qui remplace (pas de FK dure : le journal n'efface pas,
-- et un ON DELETE ne doit pas « dé-superséder » par surprise).

ALTER TABLE knowledge_evidences
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz,
  ADD COLUMN IF NOT EXISTS superseded_by uuid;

ALTER TABLE knowledge_facts
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz,
  ADD COLUMN IF NOT EXISTS superseded_by uuid;

ALTER TABLE knowledge_open_knowledge
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz,
  ADD COLUMN IF NOT EXISTS superseded_by uuid;

-- Lecture courante = lignes vivantes : index partiels sur le non-supersédé (le cas lu à chaque affichage).
CREATE INDEX IF NOT EXISTS idx_kev_live   ON knowledge_evidences      (user_id) WHERE superseded_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_kfacts_live ON knowledge_facts         (user_id) WHERE superseded_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_kopen_live  ON knowledge_open_knowledge (user_id) WHERE superseded_at IS NULL;

INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-95-supersession.sql');
