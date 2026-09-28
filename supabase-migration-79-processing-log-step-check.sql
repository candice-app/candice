-- Migration 79 — étend processing_log_step_check aux valeurs de `step` réellement écrites.
--
-- CONTEXTE : la contrainte n'autorisait que 'memory','signal','trust','orchestrator'
-- (écrits par src/lib/brain/orchestrator.ts). generateProfileAnalysis écrit
-- 'entity_extraction','generate_narrative','generate_analysis' → chaque insert était
-- rejeté (erreur 23514) et aucune ligne n'était tracée.
--
-- Relevé EXHAUSTIF des valeurs de step dans le code (sept. 2026) :
--   - src/lib/brain/orchestrator.ts : memory, signal, trust, orchestrator
--   - src/lib/profile/generateProfileAnalysis.ts : entity_extraction, generate_narrative, generate_analysis
-- (aucune autre écriture de processing_log.step trouvée.)
--
-- Additive : élargit l'ensemble autorisé, n'en retire aucun.

ALTER TABLE processing_log DROP CONSTRAINT IF EXISTS processing_log_step_check;
ALTER TABLE processing_log ADD CONSTRAINT processing_log_step_check
  CHECK (step IN (
    'memory', 'signal', 'trust', 'orchestrator',
    'entity_extraction', 'generate_narrative', 'generate_analysis'
  ));
