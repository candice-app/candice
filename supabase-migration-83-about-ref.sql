-- Migration 83 — AboutRef : la personne décrite devient une union {contact | account}.
--
-- BROUILLON EN ATTENTE D'ARBITRAGE — NE PAS APPLIQUER TEL QUEL.
-- Trois points « dis-le avant de la poser » sont marqués ⚠ ci-dessous (contact_id ;
-- FK composite sur signals/snapshots ; source nullable de facts/open_knowledge).
--
-- Contexte : about_kind/about_id REMPLACENT la fonction de contact_id, qui ne peut PAS
-- représenter un sujet 'account' (un titulaire n'a pas de ligne dans contacts). Les sept
-- tables sont VIDES → aucune donnée touchée. La partie « ajout de about_* » est purement
-- additive ; ce qui ne peut pas l'être est isolé et signalé.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- 1) AJOUT (pur) des colonnes about_kind / about_id + borne de valeurs.
--    Tables vides → NOT NULL posé directement. about_id est un uuid (contacts.id OU
--    auth.users.id selon le kind) ; PAS de FK vers contacts (ce serait interdire 'account').
--    La validité référentielle de about_id est applicative (pas de FK polymorphe en SQL).
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
-- 2) ⚠ DÉCISION 1 — contact_id. NOT « ajout pur » : contact_id est NOT NULL REFERENCES
--    contacts(id) sur les 7 tables, ce qui INTERDIT structurellement un sujet 'account'.
--    Quelque chose DOIT céder. Option retenue ici (conservatrice) : garder la colonne mais
--    la relâcher (DROP NOT NULL + DROP FK) pour débloquer 'account', en attendant un retrait
--    propre. Alternative (recommandée par moi) : DROP COLUMN contact_id — about_* la remplace
--    entièrement, et une colonne contacts-FK nullable à côté de about_id recrée exactement la
--    double-vérité que tu refuses. Tranche avant d'appliquer ; je laisse la version relâchée.
ALTER TABLE knowledge_sources            ALTER COLUMN contact_id DROP NOT NULL, DROP CONSTRAINT IF EXISTS knowledge_sources_contact_id_fkey;
ALTER TABLE knowledge_evidences          ALTER COLUMN contact_id DROP NOT NULL, DROP CONSTRAINT IF EXISTS knowledge_evidences_contact_id_fkey;
ALTER TABLE knowledge_facts              ALTER COLUMN contact_id DROP NOT NULL, DROP CONSTRAINT IF EXISTS knowledge_facts_contact_id_fkey;
ALTER TABLE knowledge_open_knowledge     ALTER COLUMN contact_id DROP NOT NULL, DROP CONSTRAINT IF EXISTS knowledge_open_knowledge_contact_id_fkey;
ALTER TABLE knowledge_signals            ALTER COLUMN contact_id DROP NOT NULL, DROP CONSTRAINT IF EXISTS knowledge_signals_contact_id_fkey;
ALTER TABLE knowledge_signal_snapshots   ALTER COLUMN contact_id DROP NOT NULL, DROP CONSTRAINT IF EXISTS knowledge_signal_snapshots_contact_id_fkey;
ALTER TABLE knowledge_extraction_records ALTER COLUMN contact_id DROP NOT NULL, DROP CONSTRAINT IF EXISTS knowledge_extraction_records_contact_id_fkey;
-- (si tu choisis le DROP COLUMN, remplacer les 7 lignes ci-dessus par DROP COLUMN contact_id,
--  ce qui supprime aussi les index idx_*_contact.)

-- ─────────────────────────────────────────────────────────────────────────
-- 3) Parent du FK composite : UNIQUE (id, about_kind, about_id) sur knowledge_sources.
--    id est déjà PK → l'unicité est garantie ; la contrainte explicite rend le triplet
--    ciblable par une FK composite (indivergeabilité about fille → source).
ALTER TABLE knowledge_sources ADD CONSTRAINT ksources_id_about_uniq UNIQUE (id, about_kind, about_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 4) FK COMPOSITE (about fille = about de la source) — tables QUI ONT une source.
--    evidences + extraction_records : source NOT NULL → FK stricte, toujours vérifiée.
ALTER TABLE knowledge_evidences
  ADD CONSTRAINT kev_about_matches_source
  FOREIGN KEY (source_id, about_kind, about_id)
  REFERENCES knowledge_sources (id, about_kind, about_id) ON DELETE CASCADE;
ALTER TABLE knowledge_extraction_records
  ADD CONSTRAINT kextr_about_matches_source
  FOREIGN KEY (source_id, about_kind, about_id)
  REFERENCES knowledge_sources (id, about_kind, about_id) ON DELETE CASCADE;

-- ⚠ DÉCISION 2 — facts.source et open_knowledge.source sont NULLABLES. Une FK composite
--    avec une colonne NULL n'est PAS vérifiée (MATCH SIMPLE, défaut Postgres) : les lignes
--    SANS source échappent au contrôle (elles reposent alors sur la dérivation en persistance
--    seule). Pour les lignes AVEC source, la FK vaut. Acceptable ? Sinon : NOT NULL sur source,
--    ou MATCH FULL. Je pose la FK telle quelle (vérifiée dès que source est présent).
ALTER TABLE knowledge_facts
  ADD CONSTRAINT kfacts_about_matches_source
  FOREIGN KEY (source, about_kind, about_id)
  REFERENCES knowledge_sources (id, about_kind, about_id) ON DELETE CASCADE;
ALTER TABLE knowledge_open_knowledge
  ADD CONSTRAINT kok_about_matches_source
  FOREIGN KEY (source, about_kind, about_id)
  REFERENCES knowledge_sources (id, about_kind, about_id) ON DELETE CASCADE;

-- ⚠ DÉCISION 3 — signals + snapshots n'ont AUCUNE source (un signal est consolidé depuis
--    plusieurs evidences ; le snapshot est jsonb daté). La FK composite y est donc IMPOSSIBLE.
--    L'intégrité about y repose sur la CLÉ : signal_key = aboutKind:aboutId::family::construct.
--    Proposition (à valider) : un CHECK liant la colonne about au préfixe de la clé, pour qu'une
--    divergence soit structurellement rejetée sans source à référencer. Fragile si le formatage
--    de l'uuid diffère (uuid::text = canonique minuscule) — dis-moi si tu le veux ou si la
--    dérivation en consolidation (un signal ne groupe que des evidences d'UN about) suffit.
ALTER TABLE knowledge_signals
  ADD CONSTRAINT ksig_about_in_key
  CHECK (signal_key LIKE about_kind || ':' || about_id::text || '::%');
ALTER TABLE knowledge_signal_snapshots
  ADD CONSTRAINT ksnap_about_in_key
  CHECK (signal_key LIKE about_kind || ':' || about_id::text || '::%');

-- ─────────────────────────────────────────────────────────────────────────
-- 5) Index about (remplacent la fonction des idx_*_contact ; ces derniers subsistent tant
--    que contact_id n'est pas DROP COLUMN — à nettoyer avec la décision 1).
CREATE INDEX IF NOT EXISTS idx_ksources_about ON knowledge_sources            (about_kind, about_id);
CREATE INDEX IF NOT EXISTS idx_kev_about      ON knowledge_evidences          (about_kind, about_id);
CREATE INDEX IF NOT EXISTS idx_kfacts_about   ON knowledge_facts              (about_kind, about_id);
CREATE INDEX IF NOT EXISTS idx_kok_about      ON knowledge_open_knowledge     (about_kind, about_id);
CREATE INDEX IF NOT EXISTS idx_ksig_about     ON knowledge_signals            (about_kind, about_id);
CREATE INDEX IF NOT EXISTS idx_kextr_about    ON knowledge_extraction_records (about_kind, about_id);

COMMIT;
