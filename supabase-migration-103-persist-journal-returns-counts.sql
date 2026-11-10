-- Migration 103 — persist_journal RENVOIE un décompte des lignes réellement écrites, et durcit son search_path.
--
-- POURQUOI (décompte). RETURNS void masque le no-op : un ON CONFLICT qui absorbe tout le lot (rejeu), ou un
-- payload sans contenu, réussissent SANS rien écrire — l'appelant ne peut pas le savoir. On renvoie donc le
-- nombre de lignes RÉELLEMENT insérées par table (0 = conflit/no-op). persistKnowledge distinguera alors :
--   • au moins un compteur > 0        → ÉCRIT
--   • tous à 0, payload non vide       → REJOUÉ à l'identique (idempotent ; journalisé, pas d'erreur)
--   • payload vide                     → refusé EN PRÉ-VOL côté TS (bug d'appelant), n'atteint jamais la RPC.
--
-- POURQUOI (DROP + CREATE). PostgreSQL INTERDIT à CREATE OR REPLACE de changer le type de retour
-- (void → jsonb). Il faut DROP puis CREATE.
--
-- ⚠ PIÈGE ACL — le DROP RÉARME les default privileges Supabase : au CREATE, anon / authenticated /
-- service_role reçoivent EXECUTE par défaut. SANS le bloc de re-verrouillage ci-dessous, cette migration
-- ROUVRIRAIT le trou fermé par la 100 (anon + service_role sur persist_journal). Le REVOKE est donc
-- OBLIGATOIRE et fait partie intégrante de la migration, pas une précaution optionnelle.
--
-- SEARCH_PATH durci ICI (public, pg_temp). La 99 posait `public` seul. pg_temp étant consulté
-- IMPLICITEMENT AVANT public pour les relations, une table temporaire de l'appelant pouvait masquer une table
-- du journal (function_search_path_mutable). En le nommant EN DERNIER, public passe devant : plus de shadowing.
-- Puisqu'on recrée la fonction de toute façon, on ferme la faille maintenant — gratuit, et le lot 4
-- (search_path) ne couvrira plus que les 12 autres fonctions. auth.uid() reste qualifié → insensible au change.
--
-- CORPS, GARDES, user_id FORCÉ, ON CONFLICT, LISTES DE COLONNES : identiques à la 99. Seuls ajouts : le type
-- de retour, les GET DIAGNOSTICS après chaque insert, et le RETURN jsonb_build_object final.

DROP FUNCTION IF EXISTS public.persist_journal(jsonb, jsonb, jsonb, jsonb);

CREATE FUNCTION public.persist_journal(
  p_source     jsonb,
  p_evidences  jsonb DEFAULT '[]'::jsonb,
  p_facts      jsonb DEFAULT '[]'::jsonb,
  p_open       jsonb DEFAULT '[]'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
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
     preference_path, preference_value, behavior_context, pattern, facet)
  SELECT id, about_kind, about_id, v_uid, source_id, target_family, target_construct, evidence_role, context,
         confidence, stability, raw_information, fact_id, assertion_status, assertion_basis, ontology_version,
         hsg_version, dims, rank, projection_bridge, value, strength, direction, modality, relation, relationship,
         severity, guardrail_scope, subject_id, subject_label, entity_id, entity_label, entity_type, parent_domain,
         preference_path, preference_value, behavior_context, pattern, facet
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
$$;

-- RE-VERROUILLAGE OBLIGATOIRE (le DROP a réarmé les default privileges Supabase). Ramène persist_journal
-- à l'état posé par la 100 : authenticated + postgres seuls. SANS ceci, anon + service_role seraient rouverts.
REVOKE ALL     ON FUNCTION public.persist_journal(jsonb, jsonb, jsonb, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.persist_journal(jsonb, jsonb, jsonb, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.persist_journal(jsonb, jsonb, jsonb, jsonb) FROM service_role;
GRANT  EXECUTE ON FUNCTION public.persist_journal(jsonb, jsonb, jsonb, jsonb) TO authenticated;

-- Auto-enregistrement (convention applied_migrations : colonne `filename`, nom COMPLET, insert CONDITIONNEL).
INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-103-persist-journal-returns-counts.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations
  WHERE filename = 'supabase-migration-103-persist-journal-returns-counts.sql'
);
