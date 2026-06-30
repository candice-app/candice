-- Migration 44 — Fix : postal_address déplacée sur contacts
--
-- La colonne était insérée à tort dans questionnaire_responses (qui n'a pas
-- cette colonne). Elle appartient à contacts : c'est une donnée de livraison
-- liée à la personne, pas à ses réponses au questionnaire.
-- RLS héritée de la policy existante "owner_contacts".

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS postal_address TEXT;
