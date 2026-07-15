-- Migration 71 — person_states (miroir d'état, §5/§12.5).
-- subject_kind='pilot'  → subject_user_id = le pilote lui-même (source du miroir, vu par proches).
-- subject_kind='contact'→ contact_id = le proche (proche SANS compte OK). declared_by = toujours l'auteur (pilote).
-- RLS : owner (declared_by) ; miroir : un proche lit UNIQUEMENT l'état-sur-soi du pilote
-- via un consentement profile_view ACTIF le liant. Les notes sur le proche restent privées.

CREATE TABLE IF NOT EXISTS person_states (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_kind    text NOT NULL CHECK (subject_kind IN ('pilot','contact')),
  subject_user_id uuid,
  contact_id      uuid REFERENCES contacts(id) ON DELETE CASCADE,
  declared_by     uuid NOT NULL,
  state           text NOT NULL CHECK (state IN ('deuil','separation','maladie','perte_emploi','stress','demenagement','conflit','recu_beaucoup','belle_nouvelle','fatigue','evenement','ok')),
  note_free       text,
  event_at        timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT person_states_subject_xor CHECK (
    (subject_kind='pilot'   AND subject_user_id IS NOT NULL AND contact_id IS NULL) OR
    (subject_kind='contact' AND contact_id IS NOT NULL AND subject_user_id IS NULL)
  )
);

ALTER TABLE person_states ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='person_states' AND policyname='owner_person_states') THEN
    CREATE POLICY owner_person_states ON person_states FOR ALL
      USING (declared_by = auth.uid()) WITH CHECK (declared_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='person_states' AND policyname='proche_reads_pilot_self_state') THEN
    CREATE POLICY proche_reads_pilot_self_state ON person_states FOR SELECT
      USING (
        subject_kind = 'pilot'
        AND EXISTS (
          SELECT 1 FROM contact_consents cc
          WHERE cc.pilote_id      = person_states.subject_user_id
            AND cc.proche_user_id = auth.uid()
            AND cc.status         = 'active'
            AND cc.kind           = 'profile_view'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_person_states_subject ON person_states (subject_kind, subject_user_id, contact_id, created_at DESC);
