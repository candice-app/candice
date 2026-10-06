// Production d'evidences depuis une option d'onboarding (lot B bloc 2a).
//
// PURE et testable en isolation : (option du mapping + contexte d'acquisition) → source
// + evidences, prêtes pour la couche du bloc 1. Aucune UI, aucun réseau.
//
// Règles arbitrées :
//  - PROFILE / AFFECTION portent DÉJÀ leur role dans le mapping → on le reprend.
//  - NEED/DRIVER/BEHAVIOR/GUARDRAIL/PREFERENCE : role DÉRIVÉ du stem (famille que le stem
//    traite directement = primary ; le reste = secondary) via PRIMARY_NONROLE_FAMILY.
//  - context DÉRIVÉ (co-localisé PROFILE / stem), validé par isValidEvidenceContext ;
//    GUARDRAIL porte son propre context (mapping).
//  - strength PROVISOIRE : primary → strong, secondary → moderate (rattrapable par remap).
//  - evidence_id DÉTERMINISTE (ids.ts) → remap idempotent.

import {
  createFact,
  createProfileEvidence,
  createSocialEnergyEvidence,
  isValidEvidenceContext,
  JOURNAL_VERSION_STAMP,
  type AffectionEvidence,
  type BehaviorEvidence,
  type ContinuumValue,
  type DriverEvidence,
  type Evidence,
  type EvidenceRole,
  type EvidenceStrength,
  type EvidenceValue,
  type Fact,
  type GuardrailEvidence,
  type KnowledgeScope,
  type NeedEvidence,
  type OnboardingMapping,
  type PreferenceEvidence,
  type ProfileDirectionalCode,
  type SourceRecord,
  type SourceType,
  createSourceRecord,
} from '../knowledge';
import { evidenceId, factId } from './ids';

/** Famille hors-PROFILE/AFFECTION que le STEM de la question traite directement (→ primary). */
const PRIMARY_NONROLE_FAMILY: Record<string, Evidence['target_family'] | undefined> = {
  q2: 'DRIVER',
  q6: 'BEHAVIOR',
  q7: 'BEHAVIOR',
  q8: 'NEED',
  q9: 'PREFERENCE',
  q10: 'BEHAVIOR',
  q11: 'BEHAVIOR',
  q18: 'GUARDRAIL',
  q4b: 'PREFERENCE',
  q4c: 'PREFERENCE',
  q4d: 'PREFERENCE',
};

/** Contexte d'evidence des familles hors-PROFILE (co-localisé PROFILE / stem). GUARDRAIL : son propre. */
const NONROLE_CONTEXT: Record<string, string> = {
  q1: 'attention_received',
  q2: 'attention_received',
  q4: 'attention_received',
  qe: 'affection_given',
  q6: 'stress',
  q7: 'conflict',
  q8: 'relationship',
  q9: 'communication',
  q10: 'decision',
  q11: 'emotional_expression',
  q13: 'gift',
  q14: 'gift.material',
  q18: 'surprise',
  q19: 'relationship',
  q4a: 'GLOBAL',
  q4b: 'GLOBAL',
  q4c: 'organised_for_me',
  q4d: 'communication',
};

function roleFor(questionCode: string, family: Evidence['target_family']): EvidenceRole {
  return PRIMARY_NONROLE_FAMILY[questionCode] === family ? 'primary' : 'secondary';
}
function strengthFor(role: EvidenceRole): EvidenceStrength {
  return role === 'primary' ? 'strong' : 'moderate'; // provisoire (carnet), rattrapable par remap
}
function ctxFor(questionCode: string): string {
  const c = NONROLE_CONTEXT[questionCode] ?? 'GLOBAL';
  if (!isValidEvidenceContext(c)) throw new Error(`[produce] contexte invalide ${c} pour ${questionCode}`);
  return c;
}

export interface WriteContext extends KnowledgeScope {
  readonly sourceId: string; // uuid généré à l'acquisition
  readonly sourceType: SourceType;
  readonly timestamp: string;
  readonly confidence?: 'high' | 'medium' | 'low';
  readonly stability?: 'stable' | 'evolving' | 'contextual' | 'temporary';
}

export interface OptionWrite {
  readonly source: SourceRecord;
  readonly evidences: readonly Evidence[];
  readonly facts: readonly Fact[];
}

/**
 * Produit la source + les evidences + les FACT d'UNE option d'onboarding répondue.
 * `affectionRanks` : rang déclaré par modalité reçue (Q1 uniquement, écran de classement).
 */
export function produceFromOption(
  ctx: WriteContext,
  mapping: OnboardingMapping,
  opts: { affectionRankByModality?: Record<string, 1 | 2 | 3> } = {},
): OptionWrite {
  const confidence = ctx.confidence ?? 'high';
  const stability = ctx.stability ?? 'contextual';
  const common = {
    contactId: ctx.contactId,
    ownerId: ctx.ownerId,
    source_id: ctx.sourceId,
    source_type: ctx.sourceType,
    raw_information: mapping.optionText, // verbatim
    confidence,
    timestamp: ctx.timestamp,
    stability,
    version: JOURNAL_VERSION_STAMP, // les littéraux le requièrent ; les factories l'ignorent et réinjectent
  } as const;
  const eid = (targetKey: string) => evidenceId(ctx.sourceId, targetKey);

  const source = createSourceRecord({
    contactId: ctx.contactId,
    ownerId: ctx.ownerId,
    id: ctx.sourceId,
    sourceType: ctx.sourceType,
    questionText: mapping.questionText,
    answerText: mapping.optionText,
    questionCode: mapping.questionCode,
    optionRef: mapping.optionRef,
    timestamp: ctx.timestamp,
  });

  const evidences: Evidence[] = [];

  // PROFILE (value/role/context/facet du mapping ; SOCIAL_ENERGY = continuum)
  for (const p of mapping.profileEvidences) {
    const tkey = `PROFILE:${p.construct}${p.facet ? '.' + p.facet : ''}`;
    const evBase = { ...common, evidence_id: eid(tkey), context: p.context, evidence_role: p.evidence_role };
    if (p.construct === 'SOCIAL_ENERGY') {
      evidences.push(createSocialEnergyEvidence({ ...evBase, value: p.value as ContinuumValue }));
    } else {
      evidences.push(
        createProfileEvidence({
          ...evBase,
          target_construct: p.construct as ProfileDirectionalCode,
          value: p.value as EvidenceValue,
          ...(p.facet ? { facet: p.facet } : {}),
          ...(p.value < 0 ? { contraryMapping: true as const } : {}),
        }),
      );
    }
  }

  // AFFECTION (role du mapping ; strength = rang si Q1, sinon strong ; context par direction)
  for (const a of mapping.affectionLanguage) {
    const tkey = `AFFECTION:${a.direction}:${a.modality}`;
    const rank = opts.affectionRankByModality?.[a.modality];
    const strength: EvidenceStrength = rank ? (rank === 3 ? 'moderate' : 'strong') : 'strong';
    const ev: AffectionEvidence = {
      ...common,
      evidence_id: eid(tkey),
      context: a.direction === 'give' ? 'affection_given' : 'attention_received',
      evidence_role: a.evidence_role,
      target_family: 'AFFECTION_LANGUAGE',
      direction: a.direction,
      modality: a.modality,
      target_construct: a.code,
      strength,
      ...(rank ? { rank } : {}),
    };
    evidences.push(ev);
  }

  // NEED
  for (const need of mapping.needs) {
    const role = roleFor(mapping.questionCode, 'NEED');
    const ev: NeedEvidence = { ...common, evidence_id: eid(`NEED:${need}`), context: ctxFor(mapping.questionCode), evidence_role: role, target_family: 'NEED', target_construct: need, strength: strengthFor(role) };
    evidences.push(ev);
  }
  // DRIVER
  for (const drv of mapping.drivers) {
    const role = roleFor(mapping.questionCode, 'DRIVER');
    const ev: DriverEvidence = { ...common, evidence_id: eid(`DRIVER:${drv}`), context: ctxFor(mapping.questionCode), evidence_role: role, target_family: 'DRIVER', target_construct: drv, strength: strengthFor(role) };
    evidences.push(ev);
  }
  // BEHAVIOR (un seul par option)
  if (mapping.behavior) {
    const role = roleFor(mapping.questionCode, 'BEHAVIOR');
    const tc = `${mapping.behavior.context}:${mapping.behavior.pattern}`;
    const ev: BehaviorEvidence = { ...common, evidence_id: eid(`BEHAVIOR:${tc}`), context: ctxFor(mapping.questionCode), evidence_role: role, target_family: 'BEHAVIOR', behaviorContext: mapping.behavior.context, pattern: mapping.behavior.pattern, target_construct: tc, strength: strengthFor(role) };
    evidences.push(ev);
  }
  // GUARDRAIL (context porté par le mapping)
  for (const g of mapping.guardrails) {
    const role = roleFor(mapping.questionCode, 'GUARDRAIL');
    const ev: GuardrailEvidence = { ...common, evidence_id: eid(`GUARDRAIL:${g.code}`), context: g.context, evidence_role: role, target_family: 'GUARDRAIL', target_construct: g.code, severity: g.severity, guardrailScope: g.guardrailScope, strength: strengthFor(role) };
    evidences.push(ev);
  }
  // PREFERENCE
  for (const p of mapping.preferences) {
    const role = roleFor(mapping.questionCode, 'PREFERENCE');
    const ev: PreferenceEvidence = { ...common, evidence_id: eid(`PREFERENCE:${p.path}`), context: ctxFor(mapping.questionCode), evidence_role: role, target_family: 'PREFERENCE', target_construct: p.path, preferenceValue: p.value, strength: strengthFor(role) };
    evidences.push(ev);
  }

  // FACT (ne produit pas forcément de signal — R16/§11.1)
  const facts: Fact[] = [];
  for (const f of mapping.facts) {
    facts.push(
      createFact({
        contactId: ctx.contactId,
        ownerId: ctx.ownerId,
        fact_id: factId(ctx.sourceId, f.fact_type, f.subject ?? f.value ?? ''),
        fact_type: f.fact_type,
        value: f.value ?? f.detail,
        source: ctx.sourceId,
        timestamp: ctx.timestamp,
        confidence,
        user_confirmed: f.user_confirmed,
        ...(f.subject ? { subject: f.subject } : {}),
        ...(f.relation ? { relation: f.relation } : {}),
        ...(f.effect ? { effect: f.effect } : {}),
      }),
    );
  }

  return { source, evidences, facts };
}

/* ────────────────────────────────────────────────────────────────────────
 * Les deux questions ajoutées (lot B bloc 2b) — entièrement spécifiées par
 * mapping-soutien-moteurs.md. Une option sélectionnée = une source (uuid), comme le socle.
 * ──────────────────────────────────────────────────────────────────────── */

import {
  MOTEURS,
  SOUTIEN,
  createOpenKnowledge,
  deriveAssertionStatus,
  normalizeLabel,
  asSubjectId,
  type MoteurOption,
  type NeedCode,
  type OpenKnowledge,
  type SoutienOption,
} from '../knowledge';
import { openKnowledgeId } from './ids';

/** Une option de `soutien` répondue → source + 1 NEED (primary, strong, context distress). */
export function produceSoutienOption(ctx: WriteContext, option: SoutienOption): {
  source: SourceRecord;
  evidences: readonly NeedEvidence[];
} {
  const source = createSourceRecord({
    contactId: ctx.contactId,
    ownerId: ctx.ownerId,
    id: ctx.sourceId,
    sourceType: ctx.sourceType,
    questionText: SOUTIEN.questionText,
    answerText: option.optionText,
    questionCode: SOUTIEN.questionCode,
    timestamp: ctx.timestamp,
  });
  const ev: NeedEvidence = {
    contactId: ctx.contactId,
    ownerId: ctx.ownerId,
    source_id: ctx.sourceId,
    source_type: ctx.sourceType,
    evidence_id: evidenceId(ctx.sourceId, `NEED:${option.need}`),
    raw_information: option.optionText,
    confidence: ctx.confidence ?? 'high',
    context: SOUTIEN.evidence.context, // 'distress'
    timestamp: ctx.timestamp,
    stability: ctx.stability ?? 'contextual',
    evidence_role: SOUTIEN.evidence.evidence_role, // 'primary'
    version: JOURNAL_VERSION_STAMP,
    target_family: 'NEED',
    target_construct: option.need as NeedCode,
    strength: SOUTIEN.evidence.strength, // 'strong'
  };
  return { source, evidences: [ev] };
}

/** Une option de `moteurs` répondue → source + 1 OpenKnowledge life_priority (AUCUNE evidence). */
export function produceMoteursOption(ctx: WriteContext, option: MoteurOption): {
  source: SourceRecord;
  openKnowledge: readonly OpenKnowledge[];
} {
  const source = createSourceRecord({
    contactId: ctx.contactId,
    ownerId: ctx.ownerId,
    id: ctx.sourceId,
    sourceType: ctx.sourceType,
    questionText: MOTEURS.questionText,
    answerText: option.optionText,
    questionCode: MOTEURS.questionCode,
    timestamp: ctx.timestamp,
  });
  const ok = createOpenKnowledge({
    contactId: ctx.contactId,
    ownerId: ctx.ownerId,
    open_knowledge_id: openKnowledgeId(ctx.sourceId, option.subject),
    type: MOTEURS.openKnowledge.type, // 'life_priority'
    subject: asSubjectId(normalizeLabel(option.subject)),
    subjectLabel: option.optionText, // verbatim affiché
    relation: MOTEURS.openKnowledge.relation, // 'matters_to'
    intensity: MOTEURS.openKnowledge.intensity, // 'strong'
    context: MOTEURS.openKnowledge.context, // 'GLOBAL'
    source: ctx.sourceId,
    timestamp: ctx.timestamp,
    confidence: MOTEURS.openKnowledge.confidence, // 'high'
    assertionStatus: deriveAssertionStatus(ctx.sourceType),
  });
  return { source, openKnowledge: [ok] };
}
