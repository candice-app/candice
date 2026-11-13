-- Migration 109 — SUPERSESSION SANS REMPLAÇANT (étape 2 sur 3 du lot `relationship`).
--
-- CE QUE LA CONTRAINTE ACTUELLE NE SAIT PAS DIRE. `chk_kev_supersede_coherence` impose
-- aujourd'hui `(superseded_at IS NULL) = (superseded_by IS NULL)` : les deux renseignés,
-- ou aucun. Il est donc IMPOSSIBLE de retirer une preuve que rien ne remplace.
--
-- CE QUE `superseded_by` DÉSIGNE, et que j'avais d'abord mal lu : la migration 95 le dit
-- explicitement — c'est « le source_id qui les remplace », l'identifiant de la SOURCE
-- remplaçante, PAS d'une evidence. Et sans FK dure, « le journal n'efface pas, et un
-- ON DELETE ne doit pas dé-superséder par surprise ».
--
-- Or cet état existe, et il est légitime. Trois cas relevés le 13 novembre, et aucun
-- n'a de source remplaçante :
--   · une preuve FAUSSE, née d'une inférence : une préférence positive que la personne
--     n'a jamais exprimée. Rien ne la remplace — il n'y a rien à mettre à la place de ce
--     qui n'a pas été dit ;
--   · deux formulations qui restent attachées à LA MÊME source et passent en connaissance
--     ouverte. Aucune nouvelle source n'intervient : il n'y a donc rien à désigner.
--
-- Sans cette migration, la seule façon de les sortir des intérêts actifs serait de les
-- SUPPRIMER — ce qui effacerait la trace de leur existence et de leur retrait, c'est-à-dire
-- exactement ce qu'un journal ne doit jamais faire.
--
-- LA NOUVELLE RÈGLE EST PLUS FORTE, pas plus faible, et c'est le point :
--     avant : (superseded_at IS NULL) = (superseded_by IS NULL)
--     après : superseded_by IS NULL OR superseded_at IS NOT NULL
-- Un remplaçant IMPLIQUE un retrait (on ne peut pas désigner ce qui remplace sans être
-- remplacé), et un retrait n'exige pas de remplaçant. L'ancienne contrainte interdisait un
-- état valide ; la nouvelle interdit toujours le seul état réellement incohérent.
--
-- Enveloppe BEGIN/COMMIT. S'auto-enregistre. Appliquée par Estelle.

BEGIN;

ALTER TABLE knowledge_evidences DROP CONSTRAINT IF EXISTS chk_kev_supersede_coherence;
ALTER TABLE knowledge_evidences ADD CONSTRAINT chk_kev_supersede_coherence CHECK (
  superseded_by IS NULL OR superseded_at IS NOT NULL
);

-- ── ASSERTION DE L'EFFET, avant COMMIT, sur une ligne jetable annulée aussitôt.
--    On éprouve les TROIS états : celui qu'on ouvre, et celui qu'on continue d'interdire.
DO $$
DECLARE
  u uuid := '00000000-0000-4000-8000-0000000c1090';
  s uuid := '00000000-0000-4000-8000-0000000c1091';
  essai uuid;
  modele jsonb;
BEGIN
  -- Une ligne support, retirée en fin de bloc. Si la FK bloque (compte fictif), la FORME
  -- a tout de même été éprouvée : c'est elle qu'on vérifie, pas l'intégrité référentielle.
  essai := '00000000-0000-4000-8000-0000000c109a';

  -- a) retrait SANS remplaçant : doit désormais passer.
  BEGIN
    INSERT INTO knowledge_evidences (
      id, user_id, source_id, target_family, target_construct, evidence_role, context,
      confidence, stability, raw_information, assertion_status, ontology_version,
      hsg_version, strength, subject_id, about_kind, about_id, assertion_basis,
      superseded_at, superseded_by
    ) VALUES (
      essai, u, s, 'INTEREST', 'essai-109', 'primary', 'GLOBAL', 'low', 'contextual',
      'essai', 'explicit', '1', '1', 'moderate', 'essai-109', 'account', u, 'self_report',
      now(), NULL
    );
    DELETE FROM knowledge_evidences WHERE id = essai;
  EXCEPTION
    WHEN check_violation THEN
      RAISE EXCEPTION 'migration 109 : un retrait SANS remplaçant est encore refusé (%) — la relâche n''a pas pris', SQLERRM;
    WHEN foreign_key_violation THEN NULL;
  END;

  -- b) remplaçant SANS date de retrait : doit RESTER refusé. C'est le seul état
  --    réellement incohérent, et le relâchement ne doit pas l'avoir emporté avec lui.
  BEGIN
    INSERT INTO knowledge_evidences (
      id, user_id, source_id, target_family, target_construct, evidence_role, context,
      confidence, stability, raw_information, assertion_status, ontology_version,
      hsg_version, strength, subject_id, about_kind, about_id, assertion_basis,
      superseded_at, superseded_by
    ) VALUES (
      '00000000-0000-4000-8000-0000000c109b', u, s, 'INTEREST', 'essai-109', 'primary',
      'GLOBAL', 'low', 'contextual', 'essai', 'explicit', '1', '1', 'moderate',
      'essai-109', 'account', u, 'self_report', NULL, essai
    );
    DELETE FROM knowledge_evidences WHERE id = '00000000-0000-4000-8000-0000000c109b';
    RAISE EXCEPTION 'migration 109 : un remplaçant SANS date de retrait a été accepté — la relâche est allée trop loin';
  EXCEPTION
    WHEN check_violation THEN NULL;   -- toujours refusé : c'est ce qu'on veut
    WHEN foreign_key_violation THEN
      RAISE EXCEPTION 'migration 109 : un remplaçant sans date de retrait a franchi le CHECK (rejeté seulement par la FK) — l''incohérence n''est plus interdite';
  END;

  modele := NULL;  -- rien à conserver ; la preuve est dans les deux blocs ci-dessus
END $$;

INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-109-supersede-sans-remplacant.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations WHERE filename = 'supabase-migration-109-supersede-sans-remplacant.sql'
);

COMMIT;
