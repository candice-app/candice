-- Migration 90 — ajoute 'declared_via_relative' (mode « côte à côte », MODE2_SOURCE_TYPE) au CHECK
-- source_type de knowledge_sources. La valeur existe dans le code (SOURCE_TYPES) depuis le lot incognito
-- mais le CHECK de la migration 82 ne la listait pas → toute evidence côte à côte était rejetée en base.
-- Additive : on remplace la contrainte par la même liste + la valeur manquante. Aucune donnée touchée.
-- (Les niveaux 5 « inférence IA » et 6 « information non confirmée » de l'échelle de provenance, hsg §48bis,
--  n'ont pas encore de source_type : ils seront ajoutés avec le lot d'extraction, pas ici.)

ALTER TABLE knowledge_sources DROP CONSTRAINT IF EXISTS knowledge_sources_source_type_check;
ALTER TABLE knowledge_sources ADD CONSTRAINT knowledge_sources_source_type_check CHECK (source_type IN (
  'onboarding_closed','onboarding_open','discovery_closed','discovery_open',
  'conversation','user_declaration','user_correction','wishlist',
  'reported_by_relative','declared_via_relative','observed_behavior'));

INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-90-source-type-cote-a-cote.sql');
