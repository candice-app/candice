-- Migration 62 — F2 v2 : le beacon v1 mesurait le premier paint (= le
-- squelette), pas l'attente réelle (constat Estelle). Colonnes ajoutées :
--   to_content_ms   — délai jusqu'au CONTENU RÉEL ([data-page-ready])
--   skeleton_shown  — un squelette a précédé le contenu
-- Table toujours TEMPORAIRE (dépose complète = dernier commit du lot).

ALTER TABLE perf_beacons ADD COLUMN IF NOT EXISTS to_content_ms INTEGER;
ALTER TABLE perf_beacons ADD COLUMN IF NOT EXISTS skeleton_shown BOOLEAN;
