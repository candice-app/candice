-- Migration 94 — LA MATIÈRE DE GÉNÉRATION, conservée par section (décision 27 oct : deux sorties).
-- Chaque analyse produit DEUX choses pour DEUX lecteurs : la VITRINE (prose, déjà dans `text`/`chips`) et
-- les COULISSES (la matière brute, pour la future CONSOLE DE DÉCISION où Estelle arbitre). La génération doit
-- PRODUIRE sa matière, pas la jeter après usage — sinon on refait l'étape 4 quand la console arrivera.
--
-- `generation_material` (JSONB) conserve, pour la section :
--   selection        : les tags FOURNIS au modèle (construct, famille, direction/modalité, force, rang,
--                       provenance [assertion_status + assertion_basis], confiance), DANS L'ORDRE fourni ;
--   treated          : ce que le modèle dit avoir TRAITÉ (déjà produit pour le double contrôle omission/invention) ;
--   facts_used       : les FACTs restituables mobilisés ;
--   facts_excluded_sensitive : les FACTs écartés parce que sensibles (internal_only) — trace de l'exclusion ;
--   (les source_evidence_ids restent dans leur colonne dédiée).
-- Additive, nullable. Aucune lecture d'écran ne dépend d'elle aujourd'hui ; la console la lira plus tard
-- SANS retoucher la génération. RLS héritée de la table (policy owner existante).

ALTER TABLE profile_analysis_sections
  ADD COLUMN IF NOT EXISTS generation_material JSONB;

INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-94-generation-material.sql');
