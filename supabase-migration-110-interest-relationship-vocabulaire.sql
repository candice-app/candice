-- Migration 110 — INTEREST.relationship : vocabulaire FERMÉ (étape 3 sur 3).
--
-- ⚠ ÉCHOUE TANT QUE LES LIGNES HISTORIQUES ACTIVES N'ONT PAS ÉTÉ TRAITÉES. C'est voulu :
-- une contrainte posée NOT VALID, ou tolérant l'existant sans distinction, documenterait
-- une règle que la base n'applique pas. L'ordre — 108, 109, traitement, 110 — n'est pas
-- une consigne qu'on peut oublier : il est tenu par la garde ci-dessous.
--
-- ARBITRAGE DU 13 NOVEMBRE. Deux vocabulaires incompatibles vivaient dans la même colonne :
-- INTEREST_RELATIONSHIPS (casual|curious|enthusiast|passion|expert — une ÉCHELLE
-- D'ENGAGEMENT) et celui du schéma d'outil de l'extracteur (passion|appreciation|curiosity|
-- aversion — une NATURE de rapport). Deux axes, une colonne, aucun arbitre.
-- INTEREST_RELATIONSHIPS fait foi. NULL reste admis : c'est l'ABSENCE de degré, pas une
-- valeur illégale, et c'est l'état le plus fréquent — on sait qu'un sujet compte sans
-- savoir à quel point.
--
-- ─────────────────────────────────────────────────────────────────────────────────────
-- POURQUOI UN CHECK **ET** UN DÉCLENCHEUR. Ce ne sont pas deux fois la même chose.
--
-- L'histoire doit être préservée : les lignes RETIRÉES gardent la valeur qu'elles
-- portaient, sinon le retrait réécrirait ce qu'il documente. Le CHECK doit donc les
-- tolérer — et c'est précisément ce qui ouvre une faille : un CHECK ne voit ni l'opération
-- ni l'état antérieur. Une ligne INSÉRÉE avec `superseded_at` déjà posé passerait avec
-- n'importe quelle valeur. Aucun chemin d'écriture actuel ne fait cela (`evidenceToRow` ne
-- pose jamais ces colonnes), mais un chemin futur pourrait l'emprunter sans le savoir, et
-- rien ne l'arrêterait.
--
--   · le CHECK est le PLANCHER : il ne peut pas être contourné, et il tolère l'histoire ;
--   · le DÉCLENCHEUR ferme ce qu'un CHECK ne peut structurellement pas voir — INSERT
--     contre UPDATE, et OLD contre NEW.
--
-- Un déclencheur peut être désactivé (ALTER TABLE … DISABLE TRIGGER) ; un CHECK, non.
-- C'est pour cela que les deux sont là : ni l'un ni l'autre ne suffit seul.
-- ─────────────────────────────────────────────────────────────────────────────────────
--
-- Appliquée par Estelle, après revue du traitement et de ses preuves locales
-- (scripts/local/.resultats/correctif.txt).

BEGIN;

-- ── GARDE D'ORDRE : seules les lignes ACTIVES sont comptées. Les retirées gardent leur
--    valeur historique, c'est la règle même qu'on vient poser.
DO $$
DECLARE n integer; valeurs text;
BEGIN
  SELECT count(*), coalesce(string_agg(DISTINCT relationship, ', '), '')
    INTO n, valeurs
  FROM knowledge_evidences
  WHERE superseded_at IS NULL
    AND relationship IS NOT NULL
    AND relationship NOT IN ('casual','curious','enthusiast','passion','expert');
  IF n > 0 THEN
    RAISE EXCEPTION 'migration 110 : % ligne(s) ACTIVES portent encore une valeur hors vocabulaire (%). Traite-les AVANT — une contrainte qui tolère l''existant actif ne protège rien.', n, valeurs;
  END IF;
END $$;

-- ── LE PLANCHER. Tolère l'histoire retirée ; refuse tout le reste.
ALTER TABLE knowledge_evidences DROP CONSTRAINT IF EXISTS ev_interest_relationship_vocab;
ALTER TABLE knowledge_evidences ADD CONSTRAINT ev_interest_relationship_vocab CHECK (
  relationship IS NULL
  OR relationship IN ('casual','curious','enthusiast','passion','expert')
  OR superseded_at IS NOT NULL
);

-- ── LE DÉCLENCHEUR. Ferme la faille que le CHECK laisse ouverte par construction.
CREATE OR REPLACE FUNCTION kev_relationship_vocabulaire()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE hors boolean;
BEGIN
  hors := NEW.relationship IS NOT NULL
      AND NEW.relationship NOT IN ('casual','curious','enthusiast','passion','expert');
  IF NOT hors THEN RETURN NEW; END IF;

  -- INSERTION : refusée, quelle que soit la famille et même marquée comme retirée.
  -- Quelle que soit la famille, parce qu'une valeur hors vocabulaire n'a de sens nulle
  -- part — et parce qu'une ligne posée en PREFERENCE puis basculée en INTEREST
  -- contournerait une règle qui ne regarderait que la famille d'arrivée.
  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'knowledge_evidences : « % » est hors du vocabulaire de relationship (casual|curious|enthusiast|passion|expert). Une insertion ne peut pas porter une valeur historique, même marquée comme retirée.', NEW.relationship;
  END IF;

  -- MISE À JOUR : on ne refuse que si la valeur hors vocabulaire est INTRODUITE.
  IF NEW.relationship IS DISTINCT FROM OLD.relationship THEN
    RAISE EXCEPTION 'knowledge_evidences : mise à jour introduisant « % », hors du vocabulaire de relationship.', NEW.relationship;
  END IF;
  IF NEW.target_family = 'INTEREST' AND OLD.target_family IS DISTINCT FROM 'INTEREST' THEN
    RAISE EXCEPTION 'knowledge_evidences : bascule vers INTEREST en conservant « % », hors du vocabulaire de relationship.', NEW.relationship;
  END IF;

  -- Valeur historique INCHANGÉE et famille inchangée : une modification sans rapport avec
  -- le vocabulaire (poser une date de retrait, corriger un contexte) reste possible.
  -- Sinon, une ligne retirée deviendrait intouchable, et son propre retrait impossible.
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_kev_relationship_vocabulaire ON knowledge_evidences;
CREATE TRIGGER trg_kev_relationship_vocabulaire
  BEFORE INSERT OR UPDATE ON knowledge_evidences
  FOR EACH ROW EXECUTE FUNCTION kev_relationship_vocabulaire();

-- ── ASSERTION DE L'EFFET, avant COMMIT. Quatre cas, éprouvés SÉPARÉMENT : chacun peut
--    échouer pour une raison différente, et un bloc unique masquerait laquelle.
DO $$
DECLARE
  u uuid := '00000000-0000-4000-8000-0000000c1100';
  s uuid := '00000000-0000-4000-8000-0000000c1101';
  a uuid := '00000000-0000-4000-8000-0000000c110a';
BEGIN
  -- Ligne support RETIRÉE portant une valeur historique. Posée en deux temps : l'insertion
  -- se fait avec une valeur canonique (le déclencheur refuserait l'autre), puis la valeur
  -- historique est écrite par un chemin qui contourne volontairement le déclencheur —
  -- ALTER TABLE … DISABLE TRIGGER est hors de portée ici, on simule donc l'état existant
  -- en posant d'abord la valeur, avant la création du déclencheur, ce qui n'est pas
  -- possible dans la même transaction. On éprouve donc ce qui EST éprouvable sans elle.

  -- 1) INSERTION hors vocabulaire → refusée.
  BEGIN
    INSERT INTO knowledge_evidences (
      id, user_id, source_id, target_family, target_construct, evidence_role, context,
      confidence, stability, raw_information, assertion_status, ontology_version,
      hsg_version, strength, subject_id, relationship, about_kind, about_id, assertion_basis
    ) VALUES (a, u, s, 'INTEREST', 'essai-110', 'primary', 'GLOBAL', 'low', 'contextual',
              'essai', 'explicit', '1', '1', 'moderate', 'essai-110', 'curiosity', 'account', u, 'self_report');
    RAISE EXCEPTION 'migration 110 : « curiosity » a été INSÉRÉ — le déclencheur ne protège pas';
  EXCEPTION
    WHEN raise_exception THEN
      IF position('hors du vocabulaire' in SQLERRM) = 0 THEN RAISE; END IF;
    WHEN check_violation THEN NULL;  -- le plancher a suffi : acceptable
  END;

  -- 2) INSERTION hors vocabulaire DÉJÀ MARQUÉE COMME RETIRÉE → refusée aussi.
  --    C'est exactement la faille que le CHECK seul laissait ouverte.
  BEGIN
    INSERT INTO knowledge_evidences (
      id, user_id, source_id, target_family, target_construct, evidence_role, context,
      confidence, stability, raw_information, assertion_status, ontology_version,
      hsg_version, strength, subject_id, relationship, about_kind, about_id, assertion_basis,
      superseded_at
    ) VALUES ('00000000-0000-4000-8000-0000000c110b', u, s, 'INTEREST', 'essai-110', 'primary',
              'GLOBAL', 'low', 'contextual', 'essai', 'explicit', '1', '1', 'moderate',
              'essai-110', 'aversion', 'account', u, 'self_report', now());
    RAISE EXCEPTION 'migration 110 : une insertion hors vocabulaire marquée RETIRÉE est passée — la faille du CHECK reste ouverte';
  EXCEPTION
    WHEN raise_exception THEN
      IF position('hors du vocabulaire' in SQLERRM) = 0 THEN RAISE; END IF;
  END;

  -- 3) Une valeur CANONIQUE s'insère normalement — la règle ne bloque pas le cas sain.
  BEGIN
    INSERT INTO knowledge_evidences (
      id, user_id, source_id, target_family, target_construct, evidence_role, context,
      confidence, stability, raw_information, assertion_status, ontology_version,
      hsg_version, strength, subject_id, relationship, about_kind, about_id, assertion_basis
    ) VALUES ('00000000-0000-4000-8000-0000000c110c', u, s, 'INTEREST', 'essai-110', 'primary',
              'GLOBAL', 'low', 'contextual', 'essai', 'explicit', '1', '1', 'moderate',
              'essai-110', 'passion', 'account', u, 'self_report');
    DELETE FROM knowledge_evidences WHERE id = '00000000-0000-4000-8000-0000000c110c';
  EXCEPTION
    WHEN foreign_key_violation THEN NULL;  -- compte fictif ; la FORME est passée
    WHEN raise_exception THEN
      RAISE EXCEPTION 'migration 110 : « passion », pourtant canonique, a été refusé (%)', SQLERRM;
  END;

  -- 4) NULL s'insère normalement — l'absence de degré reste dicible.
  BEGIN
    INSERT INTO knowledge_evidences (
      id, user_id, source_id, target_family, target_construct, evidence_role, context,
      confidence, stability, raw_information, assertion_status, ontology_version,
      hsg_version, strength, subject_id, about_kind, about_id, assertion_basis
    ) VALUES ('00000000-0000-4000-8000-0000000c110d', u, s, 'INTEREST', 'essai-110', 'primary',
              'GLOBAL', 'low', 'contextual', 'essai', 'explicit', '1', '1', 'moderate',
              'essai-110', 'account', u, 'self_report');
    DELETE FROM knowledge_evidences WHERE id = '00000000-0000-4000-8000-0000000c110d';
  EXCEPTION
    WHEN foreign_key_violation THEN NULL;
    WHEN raise_exception THEN
      RAISE EXCEPTION 'migration 110 : un INTEREST sans degré a été refusé (%)', SQLERRM;
  END;
END $$;

INSERT INTO applied_migrations (filename)
SELECT 'supabase-migration-110-interest-relationship-vocabulaire.sql'
WHERE NOT EXISTS (
  SELECT 1 FROM applied_migrations WHERE filename = 'supabase-migration-110-interest-relationship-vocabulaire.sql'
);

COMMIT;
