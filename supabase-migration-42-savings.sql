-- Migration 42 — Lot 6 : épargne (savings_goal + savings_contribution)
--
-- Candice NE DÉTIENT AUCUN FONDS. Ces tables servent uniquement au SUIVI
-- et aux RAPPELS. L'utilisateur note lui-même ce qu'il met de côté.
-- Aucun prélèvement, aucun mouvement d'argent réel.

-- ── Objectif d'épargne ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS savings_goal (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id     UUID                   REFERENCES contacts(id)   ON DELETE SET NULL,
  item_label     TEXT          NOT NULL,
  target_amount  NUMERIC(10,2) NOT NULL CHECK (target_amount > 0),
  monthly_amount NUMERIC(10,2) NOT NULL CHECK (monthly_amount > 0),
  target_date    DATE,
  started_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  status         TEXT          NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'completed', 'cancelled')),
  source         TEXT          NOT NULL DEFAULT 'manual'
                 CHECK (source IN ('manual', 'from_suggestion')),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_savings_goal_user
  ON savings_goal (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_savings_goal_user_contact
  ON savings_goal (user_id, contact_id);

ALTER TABLE savings_goal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_savings_goal" ON savings_goal
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Contribution (versement déclaré par l'utilisateur) ────────────────────────

CREATE TABLE IF NOT EXISTS savings_contribution (
  id        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id   UUID          NOT NULL REFERENCES savings_goal(id) ON DELETE CASCADE,
  amount    NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  logged_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_savings_contribution_goal
  ON savings_contribution (goal_id, logged_at DESC);

ALTER TABLE savings_contribution ENABLE ROW LEVEL SECURITY;

-- Accès via la table parente : un user ne voit que ses contributions
CREATE POLICY "owner_savings_contribution" ON savings_contribution
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM savings_goal sg
      WHERE sg.id = savings_contribution.goal_id
        AND sg.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM savings_goal sg
      WHERE sg.id = savings_contribution.goal_id
        AND sg.user_id = auth.uid()
    )
  );
