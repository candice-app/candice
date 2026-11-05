-- Migration 99 — persist_journal : ATOMICITÉ DU JOURNAL (décision Estelle 5 nov, option C).
--
-- Les 4 inserts du journal (sources → evidences → facts → open_knowledge) deviennent UN SEUL COMMIT.
-- Aujourd'hui persistKnowledge fait 4 `.insert()` séparés (4 transactions) : une source peut atterrir
-- SANS ses evidences → autorité corrompue (evidences irrésolubles, source orpheline). Ce qui survit à la
-- 7b ne doit jamais être à moitié écrit. Cette fonction ferme ce trou.
--
-- CONTRAINTES (verrouillées par Estelle) :
--   • SECURITY INVOKER : s'exécute sous le JWT de l'appelant → RLS owner-only INCHANGÉ (WITH CHECK
--     user_id = auth.uid() sur les 4 tables, migration 82). Aucun service_role, aucun client admin, aucune route.
--   • user_id FORCÉ à auth.uid() (jamais le JSON) : user_id = AUTEUR (identity.ts : « DÉTENTEUR ») ; le SUJET
--     est `about`. Ceinture+bretelles au-dessus du RLS, coût nul, et n'affecte pas l'incognito (qui fait varier
--     `about`, pas user_id). Un appel sans JWT (ex. service_role) n'a pas d'auth.uid() → rejeté.
--   • ON CONFLICT (id) DO NOTHING sur les 4 inserts : les id sont générés CÔTE CLIENT → une collision = la
--     MÊME écriture logique. Un retry (file locale qui repousse après un commit non confirmé) devient un no-op.
--     C'est ce qui rend `RETURNS void` honnête : un appel réussi veut dire « c'est en base », écrit ou no-op.
--   • Le MAPPING CANONIQUE reste en TypeScript : cette fonction n'est qu'un PERSISTEUR qui reçoit du JSONB.
--   • created_at N'EST PAS inséré → DEFAULT now() (récence = horloge base). `ts` (horloge client) EST inséré.
--     Les listes de colonnes = exactement ce que rows.ts écrit, created_at omis.
--   • Additive : TANT QUE persistKnowledge n'appelle pas cette fonction, rien ne l'utilise (migration-first).
--
-- Atomicité : une fonction plpgsql s'exécute dans la transaction de l'instruction appelante ; un rpc Supabase
-- = une instruction = une transaction. Toute erreur (FK, RLS, contrainte) annule l'ensemble → rien d'écrit.

CREATE OR REPLACE FUNCTION public.persist_journal(
  p_source     jsonb,
  p_evidences  jsonb DEFAULT '[]'::jsonb,
  p_facts      jsonb DEFAULT '[]'::jsonb,
  p_open       jsonb DEFAULT '[]'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
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
END;
$$;

-- Exécutable par les seuls utilisateurs authentifiés : RLS owner-only s'applique dans la fonction (INVOKER).
-- PAS de service_role : il contourne le RLS → l'appeler ainsi ferait un chemin d'écriture SANS propriétaire.
-- Rien ne doit appeler persist_journal en service_role (conséquence : les scripts de test qui écrivent le
-- journal devront s'authentifier COMME l'utilisateur, pas via le client admin — cf. recâblage persistKnowledge).
REVOKE ALL ON FUNCTION public.persist_journal(jsonb, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.persist_journal(jsonb, jsonb, jsonb, jsonb) TO authenticated;

-- Auto-enregistrement (convention applied_migrations, dès la 83 — dernière instruction).
INSERT INTO applied_migrations (migration) VALUES ('99-persist-journal') ON CONFLICT DO NOTHING;
