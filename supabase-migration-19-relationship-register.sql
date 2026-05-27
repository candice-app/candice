-- Migration 19: Relationship register on contacts
-- The register is the primary proximity signal for Module 6 engine.
-- It is never exposed to the proche (pilote-only field).

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS relationship_register TEXT
    CHECK (relationship_register IN (
      'très_proche_fluide',
      'proche_quotidien',
      'importante_distante',
      'compliquée_fragile',
      'formelle_occasionnelle',
      'je_ne_sais_pas'
    ));

COMMENT ON COLUMN contacts.relationship_register IS
  'Pilote-only proximity register: gates repertoire, cadence and tone for Module 6 recommendations.';
