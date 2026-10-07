-- Migration 83 — AboutRef : la personne décrite devient une union {contact | account}.
--
-- À RELIRE AVANT APPLICATION (Estelle veut voir le fichier avant qu'il ne soit posé).
--
-- Additive sur `subject` (le thème : non touché). Retire ce que l'union remplace (contact_id)
-- et pose les quatre arbitrages du lot. Les sept tables sont VIDES → aucune donnée touchée.
-- Constaté sur la base (PG 17.6) : une colonne GENERATED … STORED accepte une FK, et un INSERT
-- explicite dedans est refusé (« cannot insert a non-DEFAULT value ») → non-inscriptible.
--
-- Arbitrages :
--   D1 · contact_id SUPPRIMÉE puis RECRÉÉE en colonne GÉNÉRÉE STORED + FK (intégrité des lignes
--        contact rendue à la base, divergence impossible, colonne non-inscriptible → pas de
--        porte de derrière). Dépendances de contact_id retirées EXPLICITEMENT (jamais CASCADE).
--   D2 · source devient NOT NULL sur facts et open_knowledge (un FACT a toujours une provenance).
--   D3 · signals/snapshots : pas de source → pas de FK composite ; CHECK liant about au préfixe
--        de la clé, EN PLUS du grain de consolidation.
--   D4 · assertion_status : enum devient explicit | inferred (mécanisme producteur).
--
-- RLS : les politiques owner-only ne s'appuient QUE sur user_id (vérifié) — aucune ne dépend de
-- contact_id, donc aucune politique à retirer ni recréer ici.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- 0) JOURNAL DE MIGRATIONS — créé ici (il n'existait pas). À partir de cette migration,
--    CHAQUE fichier de migration s'inscrit lui-même en DERNIÈRE instruction (voir fin).
--    Les migrations 1→82 ne s'y trouvent pas (appliquées avant le journal) : leur état réel
--    est établi une fois par l'audit scripts/schema-audit-check.sql, jamais par ce journal.
CREATE TABLE IF NOT EXISTS applied_migrations (
  filename   text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 1) about_kind / about_id (ajout pur). Tables vides → NOT NULL direct.
--    about_id = uuid (contacts.id OU auth.users.id selon le kind). Pas de FK directe
--    (polymorphe, impossible en SQL) ; l'intégrité des lignes 'contact' est rendue en D1.
ALTER TABLE knowledge_sources            ADD COLUMN about_kind text NOT NULL, ADD COLUMN about_id uuid NOT NULL;
ALTER TABLE knowledge_evidences          ADD COLUMN about_kind text NOT NULL, ADD COLUMN about_id uuid NOT NULL;
ALTER TABLE knowledge_facts              ADD COLUMN about_kind text NOT NULL, ADD COLUMN about_id uuid NOT NULL;
ALTER TABLE knowledge_open_knowledge     ADD COLUMN about_kind text NOT NULL, ADD COLUMN about_id uuid NOT NULL;
ALTER TABLE knowledge_signals            ADD COLUMN about_kind text NOT NULL, ADD COLUMN about_id uuid NOT NULL;
ALTER TABLE knowledge_signal_snapshots   ADD COLUMN about_kind text NOT NULL, ADD COLUMN about_id uuid NOT NULL;
ALTER TABLE knowledge_extraction_records ADD COLUMN about_kind text NOT NULL, ADD COLUMN about_id uuid NOT NULL;

ALTER TABLE knowledge_sources            ADD CONSTRAINT ksources_about_kind CHECK (about_kind IN ('contact','account'));
ALTER TABLE knowledge_evidences          ADD CONSTRAINT kev_about_kind      CHECK (about_kind IN ('contact','account'));
ALTER TABLE knowledge_facts              ADD CONSTRAINT kfacts_about_kind   CHECK (about_kind IN ('contact','account'));
ALTER TABLE knowledge_open_knowledge     ADD CONSTRAINT kok_about_kind      CHECK (about_kind IN ('contact','account'));
ALTER TABLE knowledge_signals            ADD CONSTRAINT ksig_about_kind     CHECK (about_kind IN ('contact','account'));
ALTER TABLE knowledge_signal_snapshots   ADD CONSTRAINT ksnap_about_kind    CHECK (about_kind IN ('contact','account'));
ALTER TABLE knowledge_extraction_records ADD CONSTRAINT kextr_about_kind    CHECK (about_kind IN ('contact','account'));

-- ─────────────────────────────────────────────────────────────────────────
-- 2) D1 · Retrait EXPLICITE des dépendances de contact_id (jamais via CASCADE), puis DROP.
--    Dépendances recensées : 7 FK inline (<table>_contact_id_fkey) + 5 index idx_*_contact.
--    (extraction_records et signal_snapshots n'avaient PAS d'index contact.)
--    Aucune politique RLS, aucun CHECK ne dépend de contact_id.
ALTER TABLE knowledge_sources            DROP CONSTRAINT IF EXISTS knowledge_sources_contact_id_fkey;
ALTER TABLE knowledge_evidences          DROP CONSTRAINT IF EXISTS knowledge_evidences_contact_id_fkey;
ALTER TABLE knowledge_facts              DROP CONSTRAINT IF EXISTS knowledge_facts_contact_id_fkey;
ALTER TABLE knowledge_open_knowledge     DROP CONSTRAINT IF EXISTS knowledge_open_knowledge_contact_id_fkey;
ALTER TABLE knowledge_signals            DROP CONSTRAINT IF EXISTS knowledge_signals_contact_id_fkey;
ALTER TABLE knowledge_signal_snapshots   DROP CONSTRAINT IF EXISTS knowledge_signal_snapshots_contact_id_fkey;
ALTER TABLE knowledge_extraction_records DROP CONSTRAINT IF EXISTS knowledge_extraction_records_contact_id_fkey;

DROP INDEX IF EXISTS idx_ksources_contact;
DROP INDEX IF EXISTS idx_kev_contact;
DROP INDEX IF EXISTS idx_kfacts_contact;
DROP INDEX IF EXISTS idx_kok_contact;
DROP INDEX IF EXISTS idx_ksig_contact;

-- DROP COLUMN sans CASCADE : s'il restait une dépendance non recensée, cette ligne ÉCHOUE
-- (c'est voulu — on veut le voir, pas l'emporter en silence).
ALTER TABLE knowledge_sources            DROP COLUMN contact_id;
ALTER TABLE knowledge_evidences          DROP COLUMN contact_id;
ALTER TABLE knowledge_facts              DROP COLUMN contact_id;
ALTER TABLE knowledge_open_knowledge     DROP COLUMN contact_id;
ALTER TABLE knowledge_signals            DROP COLUMN contact_id;
ALTER TABLE knowledge_signal_snapshots   DROP COLUMN contact_id;
ALTER TABLE knowledge_extraction_records DROP COLUMN contact_id;

-- D1 · contact_id RECRÉÉE en colonne générée STORED (projection pure de about_id, non-inscriptible)
--      + FK vers contacts : intégrité référentielle des lignes 'contact' rendue à la base.
--      NULL pour les lignes 'account' (le CASE renvoie NULL ; la FK tolère NULL).
ALTER TABLE knowledge_sources            ADD COLUMN contact_id uuid GENERATED ALWAYS AS (CASE WHEN about_kind = 'contact' THEN about_id END) STORED REFERENCES contacts(id) ON DELETE CASCADE;
ALTER TABLE knowledge_evidences          ADD COLUMN contact_id uuid GENERATED ALWAYS AS (CASE WHEN about_kind = 'contact' THEN about_id END) STORED REFERENCES contacts(id) ON DELETE CASCADE;
ALTER TABLE knowledge_facts              ADD COLUMN contact_id uuid GENERATED ALWAYS AS (CASE WHEN about_kind = 'contact' THEN about_id END) STORED REFERENCES contacts(id) ON DELETE CASCADE;
ALTER TABLE knowledge_open_knowledge     ADD COLUMN contact_id uuid GENERATED ALWAYS AS (CASE WHEN about_kind = 'contact' THEN about_id END) STORED REFERENCES contacts(id) ON DELETE CASCADE;
ALTER TABLE knowledge_signals            ADD COLUMN contact_id uuid GENERATED ALWAYS AS (CASE WHEN about_kind = 'contact' THEN about_id END) STORED REFERENCES contacts(id) ON DELETE CASCADE;
ALTER TABLE knowledge_signal_snapshots   ADD COLUMN contact_id uuid GENERATED ALWAYS AS (CASE WHEN about_kind = 'contact' THEN about_id END) STORED REFERENCES contacts(id) ON DELETE CASCADE;
ALTER TABLE knowledge_extraction_records ADD COLUMN contact_id uuid GENERATED ALWAYS AS (CASE WHEN about_kind = 'contact' THEN about_id END) STORED REFERENCES contacts(id) ON DELETE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────
-- 3) D2 · source devient obligatoire (un FACT / OpenKnowledge a toujours une provenance).
ALTER TABLE knowledge_facts          ALTER COLUMN source SET NOT NULL;
ALTER TABLE knowledge_open_knowledge ALTER COLUMN source SET NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- 4) FK composite « about de la fille = about de sa source » (indivergeabilité en base).
--    Parent : UNIQUE (id, about_kind, about_id) sur knowledge_sources (id déjà PK).
ALTER TABLE knowledge_sources ADD CONSTRAINT ksources_id_about_uniq UNIQUE (id, about_kind, about_id);

ALTER TABLE knowledge_evidences
  ADD CONSTRAINT kev_about_matches_source
  FOREIGN KEY (source_id, about_kind, about_id) REFERENCES knowledge_sources (id, about_kind, about_id) ON DELETE CASCADE;
ALTER TABLE knowledge_extraction_records
  ADD CONSTRAINT kextr_about_matches_source
  FOREIGN KEY (source_id, about_kind, about_id) REFERENCES knowledge_sources (id, about_kind, about_id) ON DELETE CASCADE;
-- facts.source / open_knowledge.source sont désormais NOT NULL (D2) → FK composite toujours vérifiée.
ALTER TABLE knowledge_facts
  ADD CONSTRAINT kfacts_about_matches_source
  FOREIGN KEY (source, about_kind, about_id) REFERENCES knowledge_sources (id, about_kind, about_id) ON DELETE CASCADE;
ALTER TABLE knowledge_open_knowledge
  ADD CONSTRAINT kok_about_matches_source
  FOREIGN KEY (source, about_kind, about_id) REFERENCES knowledge_sources (id, about_kind, about_id) ON DELETE CASCADE;

-- D3 · signals + snapshots n'ont PAS de source (projection consolidée) → pas de FK possible.
--      Le grain de consolidation protège déjà (signalKey inclut l'about) ; on AJOUTE un CHECK
--      liant la colonne about au préfixe de la clé (forme canonique uuid::text, minuscule).
ALTER TABLE knowledge_signals
  ADD CONSTRAINT ksig_about_in_key
  CHECK (signal_key LIKE about_kind || ':' || about_id::text || '::%');
ALTER TABLE knowledge_signal_snapshots
  ADD CONSTRAINT ksnap_about_in_key
  CHECK (signal_key LIKE about_kind || ':' || about_id::text || '::%');

-- ─────────────────────────────────────────────────────────────────────────
-- 5) D4 · assertion_status : declared|observed|reported|inferred → explicit|inferred.
--    (source_type reste l'axe « acte d'acquisition » ; il n'est PAS recopié sur les filles.)
ALTER TABLE knowledge_sources        DROP CONSTRAINT IF EXISTS knowledge_sources_assertion_status_check;
ALTER TABLE knowledge_evidences      DROP CONSTRAINT IF EXISTS knowledge_evidences_assertion_status_check;
ALTER TABLE knowledge_facts          DROP CONSTRAINT IF EXISTS knowledge_facts_assertion_status_check;
ALTER TABLE knowledge_open_knowledge DROP CONSTRAINT IF EXISTS knowledge_open_knowledge_assertion_status_check;

ALTER TABLE knowledge_sources        ADD CONSTRAINT ksources_assertion CHECK (assertion_status IN ('explicit','inferred'));
ALTER TABLE knowledge_evidences      ADD CONSTRAINT kev_assertion      CHECK (assertion_status IN ('explicit','inferred'));
ALTER TABLE knowledge_facts          ADD CONSTRAINT kfacts_assertion   CHECK (assertion_status IS NULL OR assertion_status IN ('explicit','inferred'));
ALTER TABLE knowledge_open_knowledge ADD CONSTRAINT kok_assertion      CHECK (assertion_status IN ('explicit','inferred'));

-- ─────────────────────────────────────────────────────────────────────────
-- 6) Index about (remplacent les idx_*_contact supprimés ; la requête par personne passe par about).
CREATE INDEX IF NOT EXISTS idx_ksources_about ON knowledge_sources            (about_kind, about_id);
CREATE INDEX IF NOT EXISTS idx_kev_about      ON knowledge_evidences          (about_kind, about_id);
CREATE INDEX IF NOT EXISTS idx_kfacts_about   ON knowledge_facts              (about_kind, about_id);
CREATE INDEX IF NOT EXISTS idx_kok_about      ON knowledge_open_knowledge     (about_kind, about_id);
CREATE INDEX IF NOT EXISTS idx_ksig_about     ON knowledge_signals            (about_kind, about_id);
CREATE INDEX IF NOT EXISTS idx_kextr_about    ON knowledge_extraction_records (about_kind, about_id);

-- DERNIÈRE INSTRUCTION — auto-enregistrement au journal (convention permanente).
INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-83-about-ref.sql')
  ON CONFLICT (filename) DO NOTHING;

COMMIT;
