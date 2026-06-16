-- Migration 39 — 4.3b-1 : colonne data_source sur questionnaire_responses
-- Distingue les données saisies par le Pilote A (incognito, privées)
-- des données que le proche pourrait valider lui-même à l'avenir.
--
-- RLS existant (users_own_responses : auth.uid() = user_id) garantit déjà
-- que seul le Pilote A peut lire ses propres rows — quel que soit data_source.
-- Le proche B ne peut JAMAIS accéder à ces rows, même en devenant Pilote.

ALTER TABLE questionnaire_responses
  ADD COLUMN IF NOT EXISTS data_source TEXT
    NOT NULL DEFAULT 'pilot_input'
    CHECK (data_source IN ('pilot_input', 'self_confirmed'));

COMMENT ON COLUMN questionnaire_responses.data_source IS
  'pilot_input  = saisi par le Pilote, privé à lui seul, jamais transmis au proche.
   self_confirmed = futur : le proche a explicitement validé/complété ces données lui-même.';
