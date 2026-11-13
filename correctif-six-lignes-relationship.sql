-- CORRECTIF DES SIX LIGNES `relationship` — une seule transaction, tout ou rien.
--
-- Décision métier du 13 novembre, sur les six identifiants EXACTS du relevé.
--
--   RESTENT INTEREST, degré retiré, source et contexte intacts :
--     2f2ab134  « écoute podcasts en marchant »
--     51d54fc5  « marche en ville en solitaire »
--     086597af  « reliure livres main »
--
--   SORTENT DES INTÉRÊTS ACTIFS par supersession SANS remplaçant :
--     ebb91e3c  préférence positive que la personne n'a JAMAIS exprimée.
--               Rien n'en est conservé : une préférence inventée ne se recycle pas en
--               connaissance ouverte. On garde la source et la trace du retrait, c'est tout.
--     8814c5be  « Les dîners où il faut parler fort pour exister. »
--               Ce qui gêne est l'AMBIANCE. Pas les dîners.
--     a75060b6  « les repas-surprise au restaurant, c'est souvent compliqué. »
--               Ce qui gêne est le FORMAT SURPRISE — ne pas savoir à l'avance. Pas les
--               restaurants, pas la nourriture. La contrainte alimentaire est déclarée
--               ailleurs, à sa place : les fondre ferait d'une gêne de format une aversion.
--
-- AUCUN REJET STRUCTURÉ n'est créé. Pas d'ENTITY/AVOID, pas de GUARDRAIL : ceux-là
-- alimentent rejection-match, donc ils ARMENT un filtre. La connaissance ouverte conserve
-- la formulation sans armer quoi que ce soit, et sans élargir sa portée.
--
-- PRÉREQUIS : migrations 108 (relationship facultatif) et 109 (retrait sans remplaçant).
-- La 110 (vocabulaire) vient APRÈS ce correctif, et sa garde échoue s'il n'a pas eu lieu.
--
-- ÉCHOUE FERMÉ : chaque ligne est vérifiée contre l'état relu AVANT toute écriture. Une
-- ligne absente, déjà retirée, ou dont la valeur a changé depuis le relevé fait tout
-- annuler. On ne corrige pas un état qu'on n'a pas vu.

BEGIN;

-- ── 1. VÉRIFICATION DE L'ÉTAT RELU. Rien n'est écrit avant que les six soient conformes.
DO $$
DECLARE
  attendu CONSTANT jsonb := '[
    {"id":"2f2ab134-c4f1-5b17-8732-6dff064fb656","v":"appreciation"},
    {"id":"51d54fc5-2f64-5b82-8ed7-112eba9f6b76","v":"appreciation"},
    {"id":"086597af-abf3-57d0-91f0-c78383b16800","v":"curiosity"},
    {"id":"ebb91e3c-45c2-562a-ac74-24bcc08945bb","v":"appreciation"},
    {"id":"8814c5be-9781-5d77-bdbb-6214f1d48e74","v":"aversion"},
    {"id":"a75060b6-87c8-5f56-8de2-ea9613e8902b","v":"aversion"}
  ]'::jsonb;
  l jsonb; trouve record;
BEGIN
  FOR l IN SELECT * FROM jsonb_array_elements(attendu) LOOP
    SELECT id, target_family, relationship, superseded_at INTO trouve
    FROM knowledge_evidences WHERE id = (l->>'id')::uuid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'correctif : la ligne % est ABSENTE — l''état a changé depuis le relevé, rien n''est corrigé', l->>'id';
    END IF;
    IF trouve.target_family <> 'INTEREST' THEN
      RAISE EXCEPTION 'correctif : la ligne % n''est plus un INTEREST (%) — état inattendu', l->>'id', trouve.target_family;
    END IF;
    IF trouve.relationship IS DISTINCT FROM (l->>'v') THEN
      RAISE EXCEPTION 'correctif : la ligne % porte « % » au lieu de « % » — l''état a changé depuis le relevé', l->>'id', coalesce(trouve.relationship,'NULL'), l->>'v';
    END IF;
    IF trouve.superseded_at IS NOT NULL THEN
      RAISE EXCEPTION 'correctif : la ligne % est DÉJÀ retirée — le correctif a peut-être déjà été joué', l->>'id';
    END IF;
  END LOOP;
  RAISE NOTICE 'correctif : les 6 lignes correspondent à l''état relu.';
END $$;

-- ── 2. LES TROIS QUI RESTENT. Le sujet, la source et le contexte ne bougent pas :
--       seul le degré, qui n'était pas établi, est retiré.
UPDATE knowledge_evidences SET relationship = NULL
WHERE id IN (
  '2f2ab134-c4f1-5b17-8732-6dff064fb656',
  '51d54fc5-2f64-5b82-8ed7-112eba9f6b76',
  '086597af-abf3-57d0-91f0-c78383b16800'
);

-- ── 3. LES DEUX FORMULATIONS CONSERVÉES, à leur portée exacte, AVANT le retrait des
--       lignes (pour que la source soit encore manifestement rattachée en cas d'échec).
--       Garde de complétude : si une colonne obligatoire n'est pas couverte, on le dit et
--       on annule, plutôt que d'écrire une ligne dont la forme serait devinée.
DO $$
DECLARE manquantes text;
BEGIN
  SELECT string_agg(column_name, ', ') INTO manquantes
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'knowledge_open_knowledge'
    AND is_nullable = 'NO' AND column_default IS NULL
    AND is_generated = 'NEVER'
    AND column_name NOT IN (
      'id','user_id','about_kind','about_id','subject_id','subject_label','relation',
      'type','context','source','ts','confidence','assertion_status',
      'ontology_version','hsg_version','visibility_derived','evidence_ids'
    );
  IF manquantes IS NOT NULL THEN
    RAISE EXCEPTION 'correctif : colonne(s) obligatoire(s) non couverte(s) dans knowledge_open_knowledge : %. Le correctif s''arrête plutôt que de deviner une forme.', manquantes;
  END IF;
END $$;

INSERT INTO knowledge_open_knowledge (
  id, user_id, about_kind, about_id, subject_id, subject_label, relation, type,
  context, source, ts, confidence, assertion_status,
  ontology_version, hsg_version, visibility_derived, evidence_ids
)
SELECT
  gen_random_uuid(), e.user_id, e.about_kind, e.about_id,
  d.sujet, d.formulation, d.relation, 'descriptive',
  'GLOBAL', e.source_id, s.ts, 'low', e.assertion_status,
  e.ontology_version, e.hsg_version, 'internal_only', ARRAY[e.id]
FROM (VALUES
  ('8814c5be-9781-5d77-bdbb-6214f1d48e74'::uuid,
   'ambiance-diners-bruyants',
   'Les dîners où il faut parler fort pour exister.',
   'gêne exprimée sur l''ambiance'),
  ('a75060b6-87c8-5f56-8de2-ea9613e8902b'::uuid,
   'format-repas-surprise',
   'les repas-surprise au restaurant, c''est souvent compliqué.',
   'difficulté exprimée sur le format surprise')
) AS d(ev, sujet, formulation, relation)
JOIN knowledge_evidences e ON e.id = d.ev
JOIN knowledge_sources   s ON s.id = e.source_id;

-- ── 4. LES TROIS RETRAITS. superseded_by reste NULL : rien ne les remplace.
--       La valeur historique de `relationship` est CONSERVÉE : le retrait documente ce
--       qui a été écrit, il ne le réécrit pas.
UPDATE knowledge_evidences SET superseded_at = now()
WHERE id IN (
  'ebb91e3c-45c2-562a-ac74-24bcc08945bb',
  '8814c5be-9781-5d77-bdbb-6214f1d48e74',
  'a75060b6-87c8-5f56-8de2-ea9613e8902b'
);

-- ── 5. CONTRÔLES FINAUX, dans la MÊME transaction. Un seul écart annule tout.
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM knowledge_evidences
  WHERE id IN ('2f2ab134-c4f1-5b17-8732-6dff064fb656','51d54fc5-2f64-5b82-8ed7-112eba9f6b76','086597af-abf3-57d0-91f0-c78383b16800')
    AND relationship IS NULL AND superseded_at IS NULL AND target_family = 'INTEREST';
  IF n <> 3 THEN RAISE EXCEPTION 'correctif : % intérêt(s) actif(s) au lieu de 3', n; END IF;

  SELECT count(*) INTO n FROM knowledge_evidences
  WHERE id IN ('ebb91e3c-45c2-562a-ac74-24bcc08945bb','8814c5be-9781-5d77-bdbb-6214f1d48e74','a75060b6-87c8-5f56-8de2-ea9613e8902b')
    AND superseded_at IS NOT NULL AND superseded_by IS NULL;
  IF n <> 3 THEN RAISE EXCEPTION 'correctif : % retrait(s) sans remplaçant au lieu de 3', n; END IF;

  -- L'HISTOIRE EST PRÉSERVÉE : les valeurs retirées sont toujours là.
  SELECT count(*) INTO n FROM knowledge_evidences
  WHERE id IN ('ebb91e3c-45c2-562a-ac74-24bcc08945bb','8814c5be-9781-5d77-bdbb-6214f1d48e74','a75060b6-87c8-5f56-8de2-ea9613e8902b')
    AND relationship IS NOT NULL;
  IF n <> 3 THEN RAISE EXCEPTION 'correctif : % valeur(s) historique(s) conservée(s) au lieu de 3 — le retrait a réécrit ce qu''il documente', n; END IF;

  -- Les deux formulations sont conservées, et RIEN pour la préférence inventée.
  SELECT count(*) INTO n FROM knowledge_open_knowledge
  WHERE evidence_ids && ARRAY['8814c5be-9781-5d77-bdbb-6214f1d48e74'::uuid,'a75060b6-87c8-5f56-8de2-ea9613e8902b'::uuid];
  IF n <> 2 THEN RAISE EXCEPTION 'correctif : % formulation(s) conservée(s) au lieu de 2', n; END IF;

  SELECT count(*) INTO n FROM knowledge_open_knowledge
  WHERE evidence_ids && ARRAY['ebb91e3c-45c2-562a-ac74-24bcc08945bb'::uuid];
  IF n <> 0 THEN RAISE EXCEPTION 'correctif : % connaissance(s) créée(s) depuis la préférence INVENTÉE — elle ne se recycle pas', n; END IF;

  -- AUCUN REJET STRUCTURÉ n'a été fabriqué au passage.
  SELECT count(*) INTO n FROM knowledge_evidences
  WHERE source_id IN (SELECT source_id FROM knowledge_evidences WHERE id IN ('8814c5be-9781-5d77-bdbb-6214f1d48e74','a75060b6-87c8-5f56-8de2-ea9613e8902b'))
    AND (target_family = 'GUARDRAIL' OR (target_family = 'ENTITY' AND relation IN ('AVOID','DISLIKE')));
  IF n <> 0 THEN RAISE EXCEPTION 'correctif : % rejet(s) structuré(s) créé(s) — aucun ne doit l''être', n; END IF;

  RAISE NOTICE 'correctif : 3 intérêts actifs · 3 retraits sans remplaçant · 3 valeurs historiques conservées · 2 formulations · 0 rejet structuré.';
END $$;

COMMIT;
