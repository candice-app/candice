-- Migration 73 — finance_plans (config console admin, §3.2).
-- Table créée ; UI financement s'affiche CONDITIONNELLEMENT (si un plan existe) — aucune
-- dépendance à la console admin inexistante. Lecture authentifiée (config non sensible),
-- écriture service-role uniquement. Seed TEMPORAIRE de test (retirable).

CREATE TABLE IF NOT EXISTS finance_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_ref   text NOT NULL,
  n_installments int NOT NULL CHECK (n_installments BETWEEN 2 AND 24),
  configured_by uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finance_plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='finance_plans' AND policyname='read_finance_plans') THEN
    CREATE POLICY read_finance_plans ON finance_plans FOR SELECT USING (true);
  END IF;
END $$;
-- Aucune policy INSERT/UPDATE/DELETE → écriture service-role uniquement.
-- Défense en profondeur : retirer aussi les privilèges d'écriture au rôle authenticated.
REVOKE INSERT, UPDATE, DELETE ON finance_plans FROM authenticated;

-- Seed TEMPORAIRE (retirable) pour tester l'affichage « payable en 3× ».
INSERT INTO finance_plans (catalog_ref, n_installments)
SELECT '[SEED-TEST] demo-3x', 3
WHERE NOT EXISTS (SELECT 1 FROM finance_plans WHERE catalog_ref = '[SEED-TEST] demo-3x');
