-- Migration 72 — cross_validations (workflow croisé INVISIBLE au pilote, §12.14/§13.7).
-- RLS deny-direct TOTAL (aucune policy permissive + REVOKE ALL) : le pilote ne peut
-- JAMAIS lire qu'une validation a été déclenchée ; le proche ne voit JAMAIS pilot_id.
-- Accès uniquement : service-role (moteur) + 2 RPC SECURITY DEFINER assainies.

CREATE TABLE IF NOT EXISTS cross_validations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id       uuid NOT NULL,
  contact_id     uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  reco_id        uuid NOT NULL REFERENCES contact_reco_items(id) ON DELETE CASCADE,
  trigger        text NOT NULL DEFAULT 'double_gout_refus',
  question_text  text NOT NULL,      -- STOCKÉ déjà neutre (aucun nom de pilote)
  proche_user_id uuid NOT NULL,
  proche_answer  text CHECK (proche_answer IN ('confirm','deny')),
  status         text NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
  notified_pilot boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  answered_at    timestamptz
);

ALTER TABLE cross_validations ENABLE ROW LEVEL SECURITY;
-- AUCUNE policy permissive → deny total pour tout rôle client (pilote inclus).
REVOKE ALL ON cross_validations FROM authenticated, anon;

-- Proche : lit uniquement la question neutre de SES validations ouvertes. Jamais pilot_id/contact_id.
CREATE OR REPLACE FUNCTION get_pending_cross_validations()
RETURNS TABLE (id uuid, question_text text)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, question_text FROM cross_validations
  WHERE proche_user_id = auth.uid() AND status = 'open';
$$;

-- Proche : répond, sans jamais voir la source.
CREATE OR REPLACE FUNCTION answer_cross_validation(p_id uuid, p_answer text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_answer NOT IN ('confirm','deny') THEN RETURN 'bad_answer'; END IF;
  UPDATE cross_validations
    SET proche_answer = p_answer, status = 'answered', answered_at = now()
    WHERE id = p_id AND proche_user_id = auth.uid() AND status = 'open';
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  RETURN 'ok';
END $$;

REVOKE ALL ON FUNCTION get_pending_cross_validations() FROM public;
REVOKE ALL ON FUNCTION answer_cross_validation(uuid,text) FROM public;
GRANT EXECUTE ON FUNCTION get_pending_cross_validations() TO authenticated;
GRANT EXECUTE ON FUNCTION answer_cross_validation(uuid,text) TO authenticated;
