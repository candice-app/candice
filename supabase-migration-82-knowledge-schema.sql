-- Migration 82 — schéma de persistance du module de connaissance (lot B).
--
-- Premier consommateur de src/lib/knowledge/ : le questionnaire d'onboarding écrit
-- désormais dans ces tables (et PAS dans questionnaire_responses, dépréciée ci-dessous).
--
-- Contrat UNIQUE : les sept tables naissent ensemble (une application partielle
-- laisserait des evidences sans source ou des signaux sans journal). Arbitrage lot B :
--   - forme (a) relationnelle dédiée (pas de jsonb pour ce qu'on agrège : evidences, signaux) ;
--   - identité contact_id + user_id sur CHAQUE table (RLS owner-only sans jointure) ;
--   - signalKey scopé sur contact_id SEUL (contactId :: family :: construct) ;
--   - RLS owner-only USING (user_id = auth.uid()) comme les tables existantes ;
--   - AUCUNE colonne de visibilité sur sources ni evidences (provenance interne par nature) ;
--   - C1 : les invariants du modèle sont gravés en CHECK, pas seulement en TypeScript ;
--   - C2 : pas de produced_*_ids sur knowledge_sources — le lien inverse se DÉRIVE des
--          tables filles par leur source_id (FK), pour ne pas créer deux vérités ;
--   - C3 : knowledge_signal_snapshots.signal en jsonb (lu par clé+date, jamais agrégé).
--
-- Additive. Aucune donnée existante touchée.

-- ─────────────────────────────────────────────────────────────────────────
-- questionnaire_responses — DÉPRÉCIÉE (son vocabulaire est l'ancien modèle).
-- Laissée en place (0 ligne ; la reco lit encore questionnaire_responses(*) imbriqué,
-- vide) ; retrait dans un lot ultérieur de suppression des anciens modules.
COMMENT ON TABLE questionnaire_responses IS
  'DÉPRÉCIÉE (lot B, 2026-10-05) — la vérité brute vit désormais dans knowledge_sources. '
  'Colonnes = ancien vocabulaire (love_language, stress_response…). Ne plus écrire ici. '
  'Retrait prévu au lot de suppression des anciens modules (attention/temperament/lifestyle).';

-- ─────────────────────────────────────────────────────────────────────────
-- 1. knowledge_sources — le verbatim. id = source_id généré en amont (jamais régénéré).
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id              uuid PRIMARY KEY,
  contact_id      uuid NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type     text NOT NULL CHECK (source_type IN (
                    'onboarding_closed','onboarding_open','discovery_closed','discovery_open',
                    'conversation','user_declaration','user_correction','wishlist',
                    'reported_by_relative','observed_behavior')),
  assertion_status text NOT NULL CHECK (assertion_status IN ('declared','observed','reported','inferred')),
  question_code   text,
  option_ref      text,
  branch_id       text,
  rapporteur      text,
  question_text   text,       -- verbatim, jamais tronqué/résumé/normalisé
  answer_text     text,       -- verbatim (réponse structurée)
  raw_text        text,       -- verbatim (texte libre)
  ts              timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. knowledge_evidences — table LARGE (meilleure pour l'agrégation que 7 tables),
--    mais les invariants du lot A/A bis sont gravés en CHECK (C1).
CREATE TABLE IF NOT EXISTS knowledge_evidences (
  id               uuid PRIMARY KEY,
  contact_id       uuid NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id        uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  target_family    text NOT NULL CHECK (target_family IN (
                     'INTEREST','PREFERENCE','PROFILE','AFFECTION_LANGUAGE','NEED',
                     'DRIVER','BEHAVIOR','GUARDRAIL','ENTITY','CONTEXT')),
  target_construct text NOT NULL,
  evidence_role    text NOT NULL CHECK (evidence_role IN ('primary','secondary')),
  context          text NOT NULL,
  confidence       text NOT NULL CHECK (confidence IN ('high','medium','low')),
  stability        text NOT NULL CHECK (stability IN ('stable','evolving','contextual','temporary')),
  raw_information  text NOT NULL,
  fact_id          uuid,
  assertion_status text NOT NULL CHECK (assertion_status IN ('declared','observed','reported','inferred')),
  ontology_version text NOT NULL,
  hsg_version      text NOT NULL,
  -- colonnes sémantiques, nullables par famille
  value            smallint,       -- PROFILE directionnel (±1/±2) + SOCIAL_ENERGY (0..4)
  strength         text CHECK (strength IS NULL OR strength IN ('weak','moderate','strong')),
  direction        text,           -- AFFECTION (receive|give)
  modality         text,           -- AFFECTION
  relation         text,           -- ENTITY
  relationship     text,           -- INTEREST
  severity         text CHECK (severity IS NULL OR severity IN ('SOFT','HARD')),
  guardrail_scope  text CHECK (guardrail_scope IS NULL OR guardrail_scope IN ('selection','execution','context')),
  subject_id       text,           -- INTEREST (SubjectId)
  subject_label    text,           -- INTEREST (verbatim)
  entity_id        text,           -- ENTITY (EntityId)
  entity_label     text,           -- ENTITY (verbatim)
  entity_type      text,           -- ENTITY
  parent_domain    text,           -- INTEREST
  preference_path  text,           -- PREFERENCE
  preference_value text,           -- PREFERENCE
  behavior_context text,           -- BEHAVIOR
  pattern          text,           -- BEHAVIOR
  facet            text,           -- PROFILE (sensitivity)
  created_at       timestamptz NOT NULL DEFAULT now(),
  -- C1 · « 0 n'est jamais une evidence », sauf SOCIAL_ENERGY (position réelle 0..4)
  CONSTRAINT ev_value_zero_only_social CHECK (value IS NULL OR value <> 0 OR target_construct = 'SOCIAL_ENERGY'),
  -- C1 · value XOR strength : exactement l'un des deux porte la force
  CONSTRAINT ev_value_xor_strength CHECK ((value IS NULL) <> (strength IS NULL)),
  -- C1 · chaque famille interdit les colonnes qui ne lui appartiennent pas
  CONSTRAINT ev_profile_shape CHECK (target_family <> 'PROFILE' OR (
      strength IS NULL AND relation IS NULL AND relationship IS NULL AND severity IS NULL
      AND guardrail_scope IS NULL AND subject_id IS NULL AND entity_id IS NULL
      AND preference_path IS NULL AND behavior_context IS NULL AND direction IS NULL AND modality IS NULL)),
  CONSTRAINT ev_guardrail_shape CHECK (target_family <> 'GUARDRAIL' OR (
      value IS NULL AND severity IS NOT NULL AND guardrail_scope IS NOT NULL)),
  CONSTRAINT ev_interest_shape CHECK (target_family <> 'INTEREST' OR (
      value IS NULL AND subject_id IS NOT NULL AND relationship IS NOT NULL)),
  CONSTRAINT ev_entity_shape CHECK (target_family <> 'ENTITY' OR (
      value IS NULL AND entity_id IS NOT NULL AND relation IS NOT NULL)),
  CONSTRAINT ev_preference_shape CHECK (target_family <> 'PREFERENCE' OR (
      value IS NULL AND preference_path IS NOT NULL)),
  CONSTRAINT ev_behavior_shape CHECK (target_family <> 'BEHAVIOR' OR (
      value IS NULL AND behavior_context IS NOT NULL AND pattern IS NOT NULL)),
  CONSTRAINT ev_affection_shape CHECK (target_family <> 'AFFECTION_LANGUAGE' OR (
      value IS NULL AND direction IS NOT NULL AND modality IS NOT NULL))
);

-- 3. knowledge_facts — porte la visibilité (remplace usableInVisibleRationale).
CREATE TABLE IF NOT EXISTS knowledge_facts (
  id                     uuid PRIMARY KEY,
  contact_id             uuid NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source                 uuid REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  fact_type              text NOT NULL,
  value                  text NOT NULL,
  context                text,
  confidence             text NOT NULL CHECK (confidence IN ('high','medium','low')),
  assertion_status       text CHECK (assertion_status IS NULL OR assertion_status IN ('declared','observed','reported','inferred')),
  sensitivity_is_sensitive boolean NOT NULL DEFAULT false,
  sensitivity_category   text,
  visibility_derived     text NOT NULL CHECK (visibility_derived IN ('internal_only','exposable','visible','shared_with_relatives')),
  visibility_user_override text CHECK (visibility_user_override IS NULL OR visibility_user_override IN ('internal_only','exposable','visible','shared_with_relatives')),
  user_confirmed         boolean NOT NULL DEFAULT false,
  subject                text,
  relation               text,
  effect                 text,
  evidence_ids           uuid[] NOT NULL DEFAULT '{}',
  ontology_version       text NOT NULL,
  hsg_version            text NOT NULL,
  ts                     timestamptz NOT NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  -- un FACT sensible est internal_only (plafond de sensibilité du lot A bis)
  CONSTRAINT fact_sensitive_internal CHECK (NOT sensitivity_is_sensitive OR visibility_derived = 'internal_only')
);

-- 4. knowledge_open_knowledge — connaissance descriptive structurée (Dictionnaire §12).
CREATE TABLE IF NOT EXISTS knowledge_open_knowledge (
  id                 uuid PRIMARY KEY,
  contact_id         uuid NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type               text NOT NULL,
  subject_id         text NOT NULL,
  subject_label      text NOT NULL,       -- verbatim, jamais écrasé
  relation           text NOT NULL,
  intensity          text NOT NULL CHECK (intensity IN ('weak','moderate','strong')),
  context            text NOT NULL,
  source             uuid REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  confidence         text NOT NULL CHECK (confidence IN ('high','medium','low')),
  assertion_status   text NOT NULL CHECK (assertion_status IN ('declared','observed','reported','inferred')),
  evidence_ids       uuid[] NOT NULL DEFAULT '{}',
  visibility_derived text NOT NULL CHECK (visibility_derived IN ('internal_only','exposable','visible','shared_with_relatives')),
  visibility_user_override text CHECK (visibility_user_override IS NULL OR visibility_user_override IN ('internal_only','exposable','visible','shared_with_relatives')),
  ontology_version   text NOT NULL,
  hsg_version        text NOT NULL,
  ts                 timestamptz NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- 5. knowledge_signals — état consolidé. signal_key scopé sur contact_id SEUL.
CREATE TABLE IF NOT EXISTS knowledge_signals (
  signal_key          text PRIMARY KEY,   -- contactId :: family :: constructIdentity
  contact_id          uuid NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family              text NOT NULL,
  construct_identity  text NOT NULL,
  score               text NOT NULL CHECK (score IN ('high','medium','low','unknown')),
  confidence          text NOT NULL CHECK (confidence IN ('high','medium','low','none')),
  evidence_count      integer NOT NULL DEFAULT 0,
  evidence_ids        uuid[] NOT NULL DEFAULT '{}',
  contexts            text[] NOT NULL DEFAULT '{}',
  global_status       text NOT NULL CHECK (global_status IN ('GLOBAL_DIRECT','GLOBAL_CONSOLIDATED','LOCAL_ONLY')),
  stability           text NOT NULL CHECK (stability IN ('stable','evolving','contextual','temporary','unknown')),
  last_updated        timestamptz,
  contradiction       boolean,
  direction           text,   -- PROFILE
  position            smallint, -- SOCIAL_ENERGY (0..4)
  relation            text,   -- ENTITY (courante)
  relationship        text,   -- INTEREST
  severity            text,   -- GUARDRAIL
  guardrail_scope     text,   -- GUARDRAIL
  subject_id          text,   -- INTEREST
  subject_label       text,
  entity_id           text,   -- ENTITY
  entity_label        text,
  entity_type         text,
  preference_path     text,   -- PREFERENCE
  preference_value    text,
  behavior_context    text,   -- BEHAVIOR
  pattern             text,
  modality            text,   -- AFFECTION
  construct_code      text,   -- NEED/DRIVER/CONTEXT/PROFILE
  facet               text,
  visibility_derived  text NOT NULL CHECK (visibility_derived IN ('internal_only','exposable','visible','shared_with_relatives')),
  visibility_user_override text CHECK (visibility_user_override IS NULL OR visibility_user_override IN ('internal_only','exposable','visible','shared_with_relatives')),
  ontology_version      text NOT NULL,
  hsg_version           text NOT NULL,
  consolidation_version text NOT NULL,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- 6. knowledge_signal_snapshots — historique en AJOUT SEUL. signal en jsonb (C3).
CREATE TABLE IF NOT EXISTS knowledge_signal_snapshots (
  id          uuid PRIMARY KEY,
  signal_key  text NOT NULL,
  contact_id  uuid NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  taken_at    timestamptz NOT NULL,
  signal      jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 7. knowledge_extraction_records — acte d'extraction (produced_* légitimes ici :
--    c'est le relevé de ce qu'UNE extraction a produit, pas le lien inverse d'une source).
CREATE TABLE IF NOT EXISTS knowledge_extraction_records (
  id                         uuid PRIMARY KEY,
  contact_id                 uuid NOT NULL REFERENCES contacts(id)   ON DELETE CASCADE,
  user_id                    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id                  uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  model                      text NOT NULL,
  prompt_version             text NOT NULL,
  produced_fact_ids          uuid[] NOT NULL DEFAULT '{}',
  produced_open_knowledge_ids uuid[] NOT NULL DEFAULT '{}',
  produced_evidence_ids      uuid[] NOT NULL DEFAULT '{}',
  produced_entity_ids        text[] NOT NULL DEFAULT '{}',
  ontology_version           text NOT NULL,
  hsg_version                text NOT NULL,
  ts                         timestamptz NOT NULL,
  created_at                 timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Index d'agrégation transverse (sans désérialiser le verbatim).
CREATE INDEX IF NOT EXISTS idx_ksources_contact   ON knowledge_sources (contact_id);
CREATE INDEX IF NOT EXISTS idx_ksources_user      ON knowledge_sources (user_id);
CREATE INDEX IF NOT EXISTS idx_kev_contact        ON knowledge_evidences (contact_id);
CREATE INDEX IF NOT EXISTS idx_kev_user           ON knowledge_evidences (user_id);
CREATE INDEX IF NOT EXISTS idx_kev_family_constr  ON knowledge_evidences (target_family, target_construct);
CREATE INDEX IF NOT EXISTS idx_kev_assertion      ON knowledge_evidences (assertion_status);
CREATE INDEX IF NOT EXISTS idx_kev_subject        ON knowledge_evidences (subject_id);
CREATE INDEX IF NOT EXISTS idx_kev_source         ON knowledge_evidences (source_id);
CREATE INDEX IF NOT EXISTS idx_kfacts_contact     ON knowledge_facts (contact_id);
CREATE INDEX IF NOT EXISTS idx_kfacts_user        ON knowledge_facts (user_id);
CREATE INDEX IF NOT EXISTS idx_kok_contact        ON knowledge_open_knowledge (contact_id);
CREATE INDEX IF NOT EXISTS idx_kok_subject        ON knowledge_open_knowledge (subject_id);
CREATE INDEX IF NOT EXISTS idx_ksig_contact       ON knowledge_signals (contact_id);
CREATE INDEX IF NOT EXISTS idx_ksig_user          ON knowledge_signals (user_id);
CREATE INDEX IF NOT EXISTS idx_ksig_family        ON knowledge_signals (family, construct_identity);
CREATE INDEX IF NOT EXISTS idx_ksnap_key          ON knowledge_signal_snapshots (signal_key, taken_at);
CREATE INDEX IF NOT EXISTS idx_kextr_source       ON knowledge_extraction_records (source_id);

-- ─────────────────────────────────────────────────────────────────────────
-- RLS owner-only (user_id = auth.uid()), comme les tables existantes.
ALTER TABLE knowledge_sources            ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_evidences          ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_facts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_open_knowledge     ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_signals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_signal_snapshots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_extraction_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY ksources_owner   ON knowledge_sources            FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY kev_owner        ON knowledge_evidences          FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY kfacts_owner     ON knowledge_facts              FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY kok_owner        ON knowledge_open_knowledge     FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ksig_owner       ON knowledge_signals            FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ksnap_owner      ON knowledge_signal_snapshots   FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY kextr_owner      ON knowledge_extraction_records FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
