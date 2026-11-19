-- Migration 120 — STABILITÉ NON ÉTABLIE (19 nov.).
--
-- POURQUOI. Le référentiel Discovery (onglet 17, destinations conditionnelles) fixe pour huit
-- destinations la stabilité `undetermined` : la personne a dit qu'elle n'aime pas une technique,
-- une matière, une ambiance — elle n'a PAS dit si c'est durable, passager ou lié à un contexte.
-- Le journal n'admettait que stable, evolving, contextual, temporary : écrire l'une des quatre
-- aurait affirmé une stabilité que personne n'a déclarée. Ces preuves n'étaient donc pas écrites.
--
-- CE QUE LA MIGRATION FAIT. Elle élargit le vocabulaire de knowledge_evidences.stability d'UNE
-- valeur, `undetermined`. Rien d'autre.
--   · knowledge_signals.stability garde son vocabulaire : la valeur consolidée d'un ensemble de
--     preuves dont aucune n'établit de stabilité est `unknown`, qui y existe déjà.
--   · persist_journal n'est pas recréée : elle insère la colonne telle qu'elle la reçoit.
--
-- ADDITIVE ET SANS REPRISE DE DONNÉES : aucune ligne existante n'est modifiée, aucune valeur
-- existante ne devient invalide. Rejouable.
-- RETOUR ARRIÈRE : possible tant qu'aucune ligne ne porte `undetermined` (remettre l'ancienne
-- contrainte) ; ensuite il faudrait décider du sort de ces lignes — ce n'est pas automatique.
-- À APPLIQUER PAR ESTELLE sur la base vivante — jamais par un agent. Le code qui écrit cette
-- valeur ne doit pas être servi AVANT cette migration : l'écriture serait refusée par la base.

BEGIN;

ALTER TABLE knowledge_evidences DROP CONSTRAINT IF EXISTS knowledge_evidences_stability_check;
ALTER TABLE knowledge_evidences ADD CONSTRAINT knowledge_evidences_stability_check
  CHECK (stability IN ('stable', 'evolving', 'contextual', 'temporary', 'undetermined'));

COMMENT ON COLUMN knowledge_evidences.stability IS
  'Stabilité DÉCLARÉE par la source. undetermined = la source n''établit aucune stabilité ; jamais un défaut.';

INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-120-stabilite-non-etablie.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations WHERE filename = 'supabase-migration-120-stabilite-non-etablie.sql'
);

COMMIT;

-- VÉRIFICATION (lecture seule) :
--   select pg_get_constraintdef(oid) from pg_constraint where conname = 'knowledge_evidences_stability_check';
--     → doit lister cinq valeurs, dont 'undetermined'.
