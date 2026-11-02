-- Migration 96 — COHÉRENCE DU MARQUEUR DE SUPERSESSION + garde de rejouabilité (décision Estelle 2 nov).
--
-- (a) superseded_at et superseded_by vont TOUJOURS ensemble : soit les deux nuls (ligne vivante), soit les
--     deux remplis (ligne remplacée, avec la source qui la remplace). Une moitié seule = traçabilité cassée
--     (« remplacée mais par quoi ? » ou « pointe vers une source mais compte encore ? »). On l'interdit en
--     base, sur les 3 tables restituables de la 95. supersedeSources() écrit déjà les deux ensemble ; la
--     contrainte verrouille l'invariant pour tout autre chemin d'écriture, présent ou futur.
--
-- (b) GARDE DE REJOUABILITÉ — RÈGLE PERMANENTE À PARTIR D'ICI : rejouer une migration ne doit JAMAIS
--     produire ni doublon ni échec. Les 90→95 se sont auto-enregistrées en `INSERT … VALUES` nu : rejouer
--     l'une casse sur la PK de applied_migrations. À partir de la 96, l'auto-enregistrement porte
--     `ON CONFLICT (filename) DO NOTHING` (comme la 84 l'avait déjà fait pour le backfill). Et chaque objet
--     ajouté est gardé pour l'idempotence : colonnes en ADD COLUMN IF NOT EXISTS, contraintes via un bloc
--     qui vérifie pg_constraint d'abord (PostgreSQL n'a pas d'ADD CONSTRAINT IF NOT EXISTS).
--
-- Additive. Aucune donnée touchée : aucune supersession n'a encore tourné (ligne 4 du chantier non livrée), toutes les
-- lignes ont les deux colonnes nulles → la contrainte passe sur l'existant.

BEGIN;

-- (a) Contrainte de cohérence, rejouable (vérifie l'existence avant d'ajouter).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_kev_supersede_coherence') THEN
    ALTER TABLE knowledge_evidences
      ADD CONSTRAINT chk_kev_supersede_coherence
      CHECK ((superseded_at IS NULL) = (superseded_by IS NULL));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_kfacts_supersede_coherence') THEN
    ALTER TABLE knowledge_facts
      ADD CONSTRAINT chk_kfacts_supersede_coherence
      CHECK ((superseded_at IS NULL) = (superseded_by IS NULL));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_kopen_supersede_coherence') THEN
    ALTER TABLE knowledge_open_knowledge
      ADD CONSTRAINT chk_kopen_supersede_coherence
      CHECK ((superseded_at IS NULL) = (superseded_by IS NULL));
  END IF;
END $$;

-- (b) Auto-enregistrement idempotent — le modèle de TOUTES les migrations suivantes.
INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-96-supersede-coherence.sql')
  ON CONFLICT (filename) DO NOTHING;

COMMIT;
