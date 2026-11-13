-- Migration 108 — INTEREST.relationship devient FACULTATIF (étape 1 sur 2).
--
-- POURQUOI DEUX MIGRATIONS. Mettre les lignes historiques à NULL exige que la contrainte
-- soit déjà relâchée ; verrouiller le vocabulaire exige que ces lignes soient déjà
-- traitées. L'ordre est donc : 108 (relâche) → traitement des lignes → 109 (verrouille).
-- La 109 porte une garde qui ÉCHOUE si le traitement n'a pas eu lieu : l'ordre n'est pas
-- une consigne qu'on peut oublier, il est tenu par la base.
--
-- RAISON D'ÊTRE. `relationship` était EXIGÉ (ev_interest_shape, migration 82 l.103) alors
-- que le code le déclare facultatif à trois endroits (evidence.ts, rows.ts:159,
-- produce.ts:404 — « ABSENT volontairement »). Conséquence MESURÉE le 13 nov par la sonde
-- scripts/local/04 : un intérêt sans degré faisait échouer TOUT le lot de persistKnowledge
-- — la source, les preuves ET la connaissance ouverte, dont le §27.6 garantit qu'elle est
-- « conservée, verbatim, jamais jetée ». La garantie était défaite par une contrainte
-- portant sur une ligne VOISINE, dans la même transaction, sur le chemin vivant de
-- l'onboarding (/api/knowledge/extract-free-text ← QuestionnaireFlow.tsx), et sans que
-- rien ne remonte à l'utilisateur : un compteur dans console.error.
--
-- CE QUI RESTE EXIGÉ. Une famille INTEREST ne porte pas de `value` (la force passe par
-- `strength`, cf. ev_value_xor_strength) et doit porter son sujet. Le DEGRÉ, lui, n'est
-- pas constitutif de l'intérêt : on peut savoir qu'un sujet compte sans savoir à quel
-- point, et c'est le cas le plus fréquent. L'exiger forçait à inventer une valeur — que
-- R1/R2 interdisent, « jamais casual par défaut » — ou à perdre l'information.
--
-- Enveloppe BEGIN/COMMIT. S'auto-enregistre. Appliquée par Estelle.

BEGIN;

ALTER TABLE knowledge_evidences DROP CONSTRAINT IF EXISTS ev_interest_shape;
ALTER TABLE knowledge_evidences ADD CONSTRAINT ev_interest_shape CHECK (
  target_family <> 'INTEREST' OR (value IS NULL AND subject_id IS NOT NULL)
);

-- ASSERTION DE L'EFFET, avant COMMIT. Une migration qui annonce une règle sans vérifier
-- qu'elle s'applique est une note de bas de page, pas une contrainte.
-- On éprouve la FORME sur une ligne jetable, dans un sous-bloc qui l'annule ensuite.
DO $$
DECLARE deja boolean;
BEGIN
  -- a) un INTEREST SANS degré doit désormais passer la contrainte de forme…
  BEGIN
    INSERT INTO knowledge_evidences (
      id, user_id, source_id, target_family, target_construct, evidence_role, context,
      confidence, stability, raw_information, assertion_status, ontology_version,
      hsg_version, strength, subject_id, about_kind, about_id, assertion_basis
    ) VALUES (
      '00000000-0000-4000-8000-0000000c108a', '00000000-0000-4000-8000-0000000c1080',
      '00000000-0000-4000-8000-0000000c1081', 'INTEREST', 'essai-108', 'primary', 'GLOBAL',
      'low', 'contextual', 'essai', 'explicit', '1', '1', 'moderate', 'essai-108',
      'account', '00000000-0000-4000-8000-0000000c1080', 'self_report'
    );
    DELETE FROM knowledge_evidences WHERE id = '00000000-0000-4000-8000-0000000c108a';
  EXCEPTION
    WHEN check_violation THEN
      RAISE EXCEPTION 'migration 108 : un INTEREST SANS degré est encore refusé (%) — la contrainte de forme n''a pas pris', SQLERRM;
    WHEN foreign_key_violation THEN
      NULL; -- la FK tombe sur un compte fictif ; la FORME, elle, a bien été acceptée
  END;

  -- b) …et un INTEREST SANS sujet doit rester refusé : on relâche le degré, pas le sujet.
  BEGIN
    INSERT INTO knowledge_evidences (
      id, user_id, source_id, target_family, target_construct, evidence_role, context,
      confidence, stability, raw_information, assertion_status, ontology_version,
      hsg_version, strength, about_kind, about_id, assertion_basis
    ) VALUES (
      '00000000-0000-4000-8000-0000000c108c', '00000000-0000-4000-8000-0000000c1080',
      '00000000-0000-4000-8000-0000000c1081', 'INTEREST', 'essai-108', 'primary', 'GLOBAL',
      'low', 'contextual', 'essai', 'explicit', '1', '1', 'moderate',
      'account', '00000000-0000-4000-8000-0000000c1080', 'self_report'
    );
    DELETE FROM knowledge_evidences WHERE id = '00000000-0000-4000-8000-0000000c108c';
    RAISE EXCEPTION 'migration 108 : un INTEREST SANS SUJET a été accepté — la relâche est allée trop loin';
  EXCEPTION
    WHEN check_violation THEN NULL;          -- refusé : c'est ce qu'on veut
    WHEN foreign_key_violation THEN
      RAISE EXCEPTION 'migration 108 : un INTEREST sans sujet a franchi le CHECK (rejeté seulement par la FK) — le sujet n''est plus exigé';
  END;

  SELECT true INTO deja;   -- silence le « variable inutilisée » des relecteurs stricts
END $$;

INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-108-interest-relationship.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations WHERE filename = 'supabase-migration-108-interest-relationship.sql'
);

COMMIT;
