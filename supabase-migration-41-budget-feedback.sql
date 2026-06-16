-- Migration 41 — Lot 6 : table budget_feedback
--
-- Sert à apprendre le seuil de confort budgétaire de l'utilisateur
-- via ses réactions aux propositions. AUCUN budget n'est saisi ou affiché ici.
-- Le seuil sera DÉDUIT de l'historique des réactions (Lot 8).
--
-- suggestion_id est nullable et sans FK : une réaction peut pointer vers
-- proactive_suggestions ou contact_recommendations selon le contexte ;
-- le type source sera précisé à l'implémentation du Lot 8.

CREATE TABLE IF NOT EXISTS budget_feedback (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id    UUID                 REFERENCES contacts(id)   ON DELETE CASCADE,
  suggestion_id UUID,
  reaction      TEXT        NOT NULL
                CHECK (reaction IN (
                  'save_for_it',
                  'see_payment',
                  'interested_later',
                  'too_expensive_never',
                  'perfect',
                  'can_more'
                )),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_feedback_user_contact
  ON budget_feedback (user_id, contact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_budget_feedback_user
  ON budget_feedback (user_id, created_at DESC);

ALTER TABLE budget_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_budget_feedback" ON budget_feedback
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
