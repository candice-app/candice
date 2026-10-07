-- Migration 86 — incognito §2 : axe `assertionBasis` sur knowledge_evidences.
--
-- assertionBasis = sur quoi repose l'affirmation de celui qui parle. Quatre valeurs, AUCUNE
-- optionalité, AUCUN défaut : dérivé du mapping à la production, jamais saisi, jamais défailli
-- (même discipline que about). N'entre NI dans la clé-cible de l'evidence_id (aucune migration
-- d'identifiant) NI dans signalKey (deux bases différentes du même construct consolident ensemble).
--
-- knowledge_evidences est VIDE (créée en 82, jamais alimentée — double-écriture non encore câblée)
-- → NOT NULL sans défaut est sûr. La couche d'écriture (rows.ts) l'émettra au câblage de la
-- production : self → 'self_report' ; incognito → valeur déclarée question par question.
--
-- ⚠ Le 14e contexte `relationship_with_reporter` N'EST PAS ici : knowledge_evidences.context est
--    du texte libre SANS CHECK en base → c'est un ajout de VOCABULAIRE CÔTÉ CODE (EVIDENCE_CONTEXTS
--    13→14), pas une migration DB. (À confirmer : le document annonçait « les deux demandent une
--    migration » ; en base, seul assertionBasis en exige une.)

BEGIN;

ALTER TABLE knowledge_evidences
  ADD COLUMN assertion_basis text NOT NULL
  CHECK (assertion_basis IN ('self_report', 'observed', 'subject_statement', 'reporter_interpretation'));

-- DERNIÈRE INSTRUCTION — auto-enregistrement (convention permanente depuis la 84).
INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-86-assertion-basis.sql')
  ON CONFLICT (filename) DO NOTHING;

COMMIT;
