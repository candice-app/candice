-- Migration 93 — ajoute 'extraction_inferred' au CHECK source_type de knowledge_sources (hsg §48bis,
-- niveau 5 de l'échelle de provenance : inférence IA depuis une réponse libre, toujours < une déclaration).
-- Le lot d'extraction du texte libre produit des evidences marquées de cette provenance (assertion_status
-- 'inferred', confiance basse). Additive, aucune donnée touchée. (Même forme que la migration 90.)

ALTER TABLE knowledge_sources DROP CONSTRAINT IF EXISTS knowledge_sources_source_type_check;
ALTER TABLE knowledge_sources ADD CONSTRAINT knowledge_sources_source_type_check CHECK (source_type IN (
  'onboarding_closed','onboarding_open','discovery_closed','discovery_open',
  'conversation','user_declaration','user_correction','wishlist',
  'reported_by_relative','declared_via_relative','observed_behavior','extraction_inferred'));

INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-93-source-type-extraction.sql');
