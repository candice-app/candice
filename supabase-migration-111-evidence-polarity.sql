-- Migration 111 — POLARITÉ D'UNE PREUVE (18 nov.).
--
-- POURQUOI. Le référentiel Discovery donne à chaque option une POLARITÉ : positive, rejet,
-- condition, absence_de_critere, factuelle. Le journal n'avait aucune colonne pour la porter :
-- une option « je n'y attache pas beaucoup d'importance » s'écrivait exactement comme
-- « j'y tiens beaucoup », et la relecture ne pouvait plus les distinguer. Relevé le 18 nov.
-- en comparant, option par option, ce que le référentiel dit et ce que le journal recevait.
--
-- CE QUE LA MIGRATION FAIT.
--   1. Ajoute knowledge_evidences.polarity (texte, NULL permis, vocabulaire fermé par CHECK).
--      NULL = polarité NON DÉCLARÉE par la source — c'est le cas de tout ce qui existe déjà
--      (onboarding, extraction) : on n'attribue aucune polarité rétroactivement.
--   2. Recrée persist_journal à l'identique, colonne `polarity` ajoutée à l'insert des preuves.
--      SECURITY INVOKER, user_id forcé, ON CONFLICT DO NOTHING, garde d'identité : INCHANGÉS.
--
-- ADDITIVE ET SANS REPRISE DE DONNÉES : aucune ligne existante n'est modifiée.
-- À APPLIQUER PAR ESTELLE sur la base vivante — jamais par un agent.

ALTER TABLE knowledge_evidences ADD COLUMN IF NOT EXISTS polarity text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_kev_polarity') THEN
    ALTER TABLE knowledge_evidences ADD CONSTRAINT chk_kev_polarity
      CHECK (polarity IS NULL OR polarity IN ('positive', 'rejet', 'condition', 'absence_de_critere', 'factuelle'));
  END IF;
END $$;

COMMENT ON COLUMN knowledge_evidences.polarity IS
  'Polarité DÉCLARÉE par la source (référentiel Discovery). NULL = non déclarée. Jamais déduite.';

CREATE OR REPLACE FUNCTION public.persist_journal(p_source jsonb, p_evidences jsonb DEFAULT '[]'::jsonb, p_facts jsonb DEFAULT '[]'::jsonb, p_open jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid  uuid := auth.uid();
  n_src  int;
  n_ev   int;
  n_fact int;
  n_open int;
BEGIN
  IF p_source IS NULL OR jsonb_typeof(p_source) <> 'object' THEN
    RAISE EXCEPTION 'persist_journal: p_source manquant ou non-objet';
  END IF;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'persist_journal: aucun auth.uid() (appel sans JWT utilisateur interdit)';
  END IF;

  -- 1. SOURCE d'abord (cible des FK source_id des tables filles). user_id FORCÉ à v_uid.
  INSERT INTO knowledge_sources
    (id, about_kind, about_id, user_id, source_type, assertion_status, question_code, option_ref,
     branch_id, rapporteur, question_text, answer_text, raw_text, correction_event_id, ts)
  SELECT id, about_kind, about_id, v_uid, source_type, assertion_status, question_code, option_ref,
         branch_id, rapporteur, question_text, answer_text, raw_text, correction_event_id, ts
  FROM jsonb_populate_record(null::knowledge_sources, p_source)
  ON CONFLICT (id) DO NOTHING;
  GET DIAGNOSTICS n_src = ROW_COUNT;

  -- GARDE D'IDENTITÉ : la source doit exister ET appartenir à v_uid (sinon evidences accrochées à une source
  -- étrangère → provenance illisible). Le RLS ne rend visibles que les siennes → id d'autrui = NOT FOUND.
  PERFORM 1 FROM knowledge_sources WHERE id = (p_source->>'id')::uuid AND user_id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'persist_journal: source % absente ou appartenant a un autre detenteur', p_source->>'id';
  END IF;

  -- 2. EVIDENCES (chacune référence source_id ; FK + CHECK par famille gérées par la base).
  INSERT INTO knowledge_evidences
    (id, about_kind, about_id, user_id, source_id, target_family, target_construct, evidence_role, context,
     confidence, stability, raw_information, fact_id, assertion_status, assertion_basis, ontology_version,
     hsg_version, dims, rank, projection_bridge, value, strength, direction, modality, relation, relationship,
     severity, guardrail_scope, subject_id, subject_label, entity_id, entity_label, entity_type, parent_domain,
     preference_path, preference_value, behavior_context, pattern, facet, polarity)
  SELECT id, about_kind, about_id, v_uid, source_id, target_family, target_construct, evidence_role, context,
         confidence, stability, raw_information, fact_id, assertion_status, assertion_basis, ontology_version,
         hsg_version, dims, rank, projection_bridge, value, strength, direction, modality, relation, relationship,
         severity, guardrail_scope, subject_id, subject_label, entity_id, entity_label, entity_type, parent_domain,
         preference_path, preference_value, behavior_context, pattern, facet, polarity
  FROM jsonb_populate_recordset(null::knowledge_evidences, coalesce(p_evidences, '[]'::jsonb))
  ON CONFLICT (id) DO NOTHING;
  GET DIAGNOSTICS n_ev = ROW_COUNT;

  -- 3. FACTS. user_id FORCÉ à v_uid.
  INSERT INTO knowledge_facts
    (id, about_kind, about_id, user_id, source, fact_type, value, context, confidence, assertion_status,
     sensitivity_is_sensitive, sensitivity_category, visibility_derived, visibility_user_override,
     user_confirmed, subject, relation, effect, evidence_ids, ontology_version, hsg_version, ts)
  SELECT id, about_kind, about_id, v_uid, source, fact_type, value, context, confidence, assertion_status,
         sensitivity_is_sensitive, sensitivity_category, visibility_derived, visibility_user_override,
         user_confirmed, subject, relation, effect, evidence_ids, ontology_version, hsg_version, ts
  FROM jsonb_populate_recordset(null::knowledge_facts, coalesce(p_facts, '[]'::jsonb))
  ON CONFLICT (id) DO NOTHING;
  GET DIAGNOSTICS n_fact = ROW_COUNT;

  -- 4. OPEN KNOWLEDGE (reliquat). user_id FORCÉ à v_uid.
  INSERT INTO knowledge_open_knowledge
    (id, about_kind, about_id, user_id, type, subject_id, subject_label, relation, intensity, context, source,
     confidence, assertion_status, evidence_ids, visibility_derived, visibility_user_override, ontology_version,
     hsg_version, ts)
  SELECT id, about_kind, about_id, v_uid, type, subject_id, subject_label, relation, intensity, context, source,
         confidence, assertion_status, evidence_ids, visibility_derived, visibility_user_override, ontology_version,
         hsg_version, ts
  FROM jsonb_populate_recordset(null::knowledge_open_knowledge, coalesce(p_open, '[]'::jsonb))
  ON CONFLICT (id) DO NOTHING;
  GET DIAGNOSTICS n_open = ROW_COUNT;

  RETURN jsonb_build_object('sources', n_src, 'evidences', n_ev, 'facts', n_fact, 'open', n_open);
END;
$function$;
