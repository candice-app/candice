// Couche d'écriture du module de connaissance — lot B, bloc 1.
//
// Mapping PUR (et donc testable en isolation) des structures TYPÉES du module
// (src/lib/knowledge, le contrat) vers les lignes des tables de la migration 82.
// Ne touche jamais au module ni au réseau : juste la traduction structure → ligne.
//
// Invariants gravés aussi en base (migration 82, CHECK) : ici on ne REMPLIT que les
// colonnes qui appartiennent à la famille de l'evidence ; les autres restent null.
// Le source_id voyage INCHANGÉ (evidence.source_id === source.id) — jamais régénéré.

import type { AboutRef, Evidence, Fact, OpenKnowledge, SourceRecord, Signal } from '../knowledge';
import { constructIdentity, deriveAssertionStatus, signalKey } from '../knowledge';

/* ── knowledge_sources ── */
export interface KnowledgeSourceRow {
  id: string;
  about_kind: string;
  about_id: string;
  user_id: string;
  source_type: string;
  assertion_status: string;
  question_code: string | null;
  option_ref: string | null;
  branch_id: string | null;
  rapporteur: string | null;
  question_text: string | null;
  answer_text: string | null;
  raw_text: string | null;
  ts: string;
}

export function sourceToRow(s: SourceRecord): KnowledgeSourceRow {
  return {
    id: s.id,
    about_kind: s.about.kind,
    about_id: s.about.id,
    user_id: s.ownerId,
    source_type: s.sourceType,
    assertion_status: s.assertionStatus, // dérivé par le module, jamais saisi, jamais null
    question_code: s.questionCode ?? null,
    option_ref: s.optionRef ?? null,
    branch_id: s.branchId ?? null,
    rapporteur: s.rapporteur ?? null,
    question_text: s.questionText ?? null, // verbatim, jamais tronqué
    answer_text: s.answerText ?? null, // verbatim
    raw_text: s.rawText ?? null, // verbatim
    ts: s.timestamp,
  };
}

/* ── knowledge_evidences (table large : colonnes sémantiques nullables par famille) ── */
export interface KnowledgeEvidenceRow {
  id: string;
  about_kind: string;
  about_id: string;
  user_id: string;
  source_id: string;
  target_family: string;
  target_construct: string;
  evidence_role: string;
  context: string;
  confidence: string;
  stability: string;
  raw_information: string;
  fact_id: string | null;
  assertion_status: string;
  assertion_basis: string;
  ontology_version: string;
  hsg_version: string;
  value: number | null;
  strength: string | null;
  direction: string | null;
  modality: string | null;
  relation: string | null;
  relationship: string | null;
  severity: string | null;
  guardrail_scope: string | null;
  subject_id: string | null;
  subject_label: string | null;
  entity_id: string | null;
  entity_label: string | null;
  entity_type: string | null;
  parent_domain: string | null;
  preference_path: string | null;
  preference_value: string | null;
  behavior_context: string | null;
  pattern: string | null;
  facet: string | null;
}

/** assertion_status : porté par l'evidence si présent (ex. extraction → 'inferred'),
 *  sinon dérivé par le mécanisme producteur direct (deriveAssertionStatus) — jamais null. */
function evidenceAssertion(e: Evidence): string {
  return e.assertionStatus ?? deriveAssertionStatus(e.source_type);
}

/** `about` n'est PAS lu de l'evidence : il est fourni par l'appelant (la persistance le
 *  dérive de la SOURCE, seule à en porter la référence). Rien à écraser, rien à diverger. */
export function evidenceToRow(e: Evidence, about: AboutRef): KnowledgeEvidenceRow {
  const base = {
    id: e.evidence_id,
    about_kind: about.kind,
    about_id: about.id,
    user_id: e.ownerId,
    source_id: e.source_id, // === source.id, jamais régénéré
    target_family: e.target_family,
    target_construct: e.target_construct,
    evidence_role: e.evidence_role,
    context: e.context,
    confidence: e.confidence,
    stability: e.stability,
    raw_information: e.raw_information,
    fact_id: e.fact_id ?? null,
    assertion_status: evidenceAssertion(e),
    assertion_basis: e.assertionBasis, // dérivé à la production, jamais null (migration 86 : NOT NULL)
    ontology_version: e.version.ontology_version,
    hsg_version: e.version.hsg_version,
    // toutes les colonnes sémantiques à null par défaut ; chaque famille ne remplit QUE les siennes
    value: null as number | null,
    strength: null as string | null,
    direction: null as string | null,
    modality: null as string | null,
    relation: null as string | null,
    relationship: null as string | null,
    severity: null as string | null,
    guardrail_scope: null as string | null,
    subject_id: null as string | null,
    subject_label: null as string | null,
    entity_id: null as string | null,
    entity_label: null as string | null,
    entity_type: null as string | null,
    parent_domain: null as string | null,
    preference_path: null as string | null,
    preference_value: null as string | null,
    behavior_context: null as string | null,
    pattern: null as string | null,
    facet: null as string | null,
  };
  switch (e.target_family) {
    case 'PROFILE':
      // ProfileEvidence (value ±1/±2) OU SocialEnergyEvidence (value 0..4)
      return { ...base, value: e.value, facet: 'facet' in e ? (e.facet ?? null) : null };
    case 'AFFECTION_LANGUAGE':
      return { ...base, strength: e.strength, direction: e.direction, modality: e.modality };
    case 'INTEREST':
      return {
        ...base,
        strength: e.strength,
        subject_id: e.subject,
        subject_label: e.subjectLabel,
        relationship: e.relationship ?? null, // facultatif — absent = non précisé, jamais inventé
        parent_domain: e.parent_domain ?? null,
      };
    case 'ENTITY':
      return {
        ...base,
        strength: e.strength,
        entity_id: e.entity_id,
        entity_label: e.entityLabel,
        entity_type: e.entityType,
        relation: e.relation,
      };
    case 'PREFERENCE':
      return { ...base, strength: e.strength, preference_path: e.target_construct, preference_value: e.preferenceValue };
    case 'BEHAVIOR':
      return { ...base, strength: e.strength, behavior_context: e.behaviorContext, pattern: e.pattern };
    case 'GUARDRAIL':
      return { ...base, strength: e.strength, severity: e.severity, guardrail_scope: e.guardrailScope };
    case 'NEED':
    case 'DRIVER':
    case 'CONTEXT':
      return { ...base, strength: e.strength };
  }
}

/* ── knowledge_facts ── */
export interface KnowledgeFactRow {
  id: string;
  about_kind: string;
  about_id: string;
  user_id: string;
  source: string | null;
  fact_type: string;
  value: string;
  context: string | null;
  confidence: string;
  assertion_status: string | null;
  sensitivity_is_sensitive: boolean;
  sensitivity_category: string | null;
  visibility_derived: string;
  visibility_user_override: string | null;
  user_confirmed: boolean;
  subject: string | null;
  relation: string | null;
  effect: string | null;
  evidence_ids: string[];
  ontology_version: string;
  hsg_version: string;
  ts: string;
}

export function factToRow(f: Fact, source: string | null, about: AboutRef): KnowledgeFactRow {
  return {
    id: f.fact_id,
    about_kind: about.kind,
    about_id: about.id,
    user_id: f.ownerId,
    source,
    fact_type: f.fact_type,
    value: f.value,
    context: f.context ?? null,
    confidence: f.confidence,
    assertion_status: f.assertionStatus ?? null,
    sensitivity_is_sensitive: f.sensitivity?.isSensitive ?? false,
    sensitivity_category: f.sensitivity?.category ?? null,
    visibility_derived: f.visibility.derived,
    visibility_user_override: f.visibility.userOverride ?? null,
    user_confirmed: f.user_confirmed,
    subject: f.subject ?? null,
    relation: f.relation ?? null,
    effect: f.effect ?? null,
    evidence_ids: [...f.evidence_ids],
    ontology_version: f.version.ontology_version,
    hsg_version: f.version.hsg_version,
    ts: f.timestamp,
  };
}

/* ── knowledge_open_knowledge ── */
export interface KnowledgeOpenKnowledgeRow {
  id: string;
  about_kind: string;
  about_id: string;
  user_id: string;
  type: string;
  subject_id: string;
  subject_label: string;
  relation: string;
  intensity: string;
  context: string;
  source: string;
  confidence: string;
  assertion_status: string;
  evidence_ids: string[];
  visibility_derived: string;
  visibility_user_override: string | null;
  ontology_version: string;
  hsg_version: string;
  ts: string;
}

export function openKnowledgeToRow(k: OpenKnowledge, about: AboutRef): KnowledgeOpenKnowledgeRow {
  return {
    id: k.open_knowledge_id,
    about_kind: about.kind,
    about_id: about.id,
    user_id: k.ownerId,
    type: k.type,
    subject_id: k.subject,
    subject_label: k.subjectLabel, // verbatim, jamais écrasé
    relation: k.relation,
    intensity: k.intensity,
    context: k.context,
    source: k.source,
    confidence: k.confidence,
    assertion_status: k.assertionStatus,
    evidence_ids: [...k.evidence_ids],
    visibility_derived: k.visibility.derived,
    visibility_user_override: k.visibility.userOverride ?? null,
    ontology_version: k.version.ontology_version,
    hsg_version: k.version.hsg_version,
    ts: k.timestamp,
  };
}

/* ── knowledge_signals (clé = about scopé, grain par construct) ── */
export interface KnowledgeSignalRow {
  signal_key: string;
  about_kind: string;
  about_id: string;
  user_id: string;
  family: string;
  construct_identity: string;
  score: string;
  confidence: string;
  evidence_count: number;
  evidence_ids: string[];
  contexts: string[];
  global_status: string;
  stability: string;
  last_updated: string | null;
  contradiction: boolean | null;
  visibility_derived: string;
  visibility_user_override: string | null;
  ontology_version: string;
  hsg_version: string;
  consolidation_version: string;
}

// Un signal est une PROJECTION sans source : son `about` provient du grain de consolidation
// (un signal ne groupe qu'une personne décrite). On le passe explicitement et on l'utilise
// pour la clé ET les colonnes — jamais deux valeurs à réconcilier.
export function signalToRow(about: AboutRef, s: Signal): KnowledgeSignalRow {
  return {
    signal_key: signalKey(about, s),
    about_kind: about.kind,
    about_id: about.id,
    user_id: s.ownerId,
    family: s.family,
    construct_identity: constructIdentity(s),
    score: s.score,
    confidence: s.confidence,
    evidence_count: s.evidenceCount,
    evidence_ids: [...s.evidenceIds],
    contexts: [...s.contexts],
    global_status: s.globalStatus,
    stability: s.stability,
    last_updated: s.lastUpdated,
    contradiction: s.contradiction ?? null,
    visibility_derived: s.visibility.derived,
    visibility_user_override: s.visibility.userOverride ?? null,
    ontology_version: s.version.ontology_version,
    hsg_version: s.version.hsg_version,
    consolidation_version: s.version.consolidation_version,
  };
}
