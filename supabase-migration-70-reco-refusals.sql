-- Migration 70 — reco_refusals (flow « Pas ça », §3/§4). RLS owner-only.
-- reappear_at : refus financier → +6 mois ; réapparition PARESSEUSE à la lecture
-- (aucun job). Le 2e refus « gout » (compté ici) déclenche le workflow croisé.

CREATE TABLE IF NOT EXISTS reco_refusals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id    uuid NOT NULL,
  contact_id  uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  reco_id     uuid NOT NULL REFERENCES contact_reco_items(id) ON DELETE CASCADE,
  reason      text NOT NULL CHECK (reason IN ('gout','budget','deja','moment')),
  sub_reason  text,   -- moment : deuil|separation|maladie|hospitalisation|perte_emploi|stress|demenagement|examens|conflit|recu_beaucoup|budget_familial|autre
  note_free   text,   -- « Autre » libre
  reactivable boolean NOT NULL DEFAULT true,
  reappear_at timestamptz,   -- financier : now() + 6 mois
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reco_refusals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reco_refusals' AND policyname='owner_reco_refusals') THEN
    CREATE POLICY owner_reco_refusals ON reco_refusals FOR ALL
      USING (pilot_id = auth.uid()) WITH CHECK (pilot_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reco_refusals_reco ON reco_refusals (reco_id, reason);
