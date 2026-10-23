-- Migration 91 — péremption PAR REQUÊTE (hsg §48septies, décision 23 oct) : le texte stocké porte la
-- LISTE des connaissances dont il est issu. Pas de drapeau `stale` (champ dérivable qu'on stocke = ment).
-- `generated_at` existe déjà (migration 30). On ajoute seulement la liste des evidence_ids sources.
-- Un texte est périmé (calculé à l'affichage) si une de ses sources a été modifiée après generated_at,
-- supprimée, ou n'est plus autorisée. Vaut pour l'analyse profil (contact_id null) ET les fiches (contact_id set).
-- Additive, aucune donnée touchée.

ALTER TABLE profile_analysis ADD COLUMN IF NOT EXISTS source_evidence_ids uuid[];

INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-91-analysis-source-evidences.sql');
