// Production d'evidences depuis une option INCOGNITO (le pilote répond pour son proche).
//
// PURE et testable en isolation, comme produce.ts (self), mais sur le modèle IncognitoOption :
// context / behaviorContext / strength / base sont DÉJÀ portés par la transcription (§4) — on les
// reprend, on NE RE-DÉRIVE RIEN. Deux différences structurelles avec le self :
//   1. sourceType = 'reported_by_relative' (invariant du jeu, §4) → assertionStatus 'explicit'.
//   2. assertionBasis VARIE : base de la question, surchargée par option (I12.1/I12.2). Le self,
//      lui, porte 'self_report' partout. assertionBasis n'entre ni dans evidence_id ni signalKey.
//
// Jetons {Prénom}/{Pronom}/{pronom} RÉSOLUS ici (resolvePronoun) AVANT le SourceRecord : la couche
// source ne stocke jamais un jeton. Les six règles transversales du §3 sont implémentées :
//   R-I1 strength indirecte plafonnée (reporter_interpretation → moderate ; appliqué au guardrail,
//        seule famille sans strength explicite) · R-I2 UNKNOWN_BY_REPORTER = zéro de tout ·
//   R-I3 CONTEXT_DEPENDENT = zéro, jamais UNKNOWN · R-I4 sévérité du guardrail = ce qui est exprimé ·
//   R-I5 aucune inférence PROFILE ajoutée (le secondaire n'existe que s'il est dans la donnée) ·
//   R-I6 FACT jamais user_confirmed=true.

import {
  assertValidBehaviorContext,
  assertValidEvidenceContext,
  asSubjectId,
  createFact,
  createOpenKnowledge,
  createProfileEvidence,
  createSocialEnergyEvidence,
  createSourceRecord,
  deriveAssertionStatus,
  JOURNAL_VERSION_STAMP,
  normalizeLabel,
  type AffectionEvidence,
  type AssertionBasis,
  type BehaviorEvidence,
  type ContinuumValue,
  type DriverEvidence,
  type Evidence,
  type EvidenceConfidence,
  type EvidenceStability,
  type EvidenceStrength,
  type EvidenceValue,
  type Fact,
  type GuardrailEvidence,
  type KnowledgeScope,
  type OpenKnowledge,
  type PreferenceEvidence,
  type ProfileDirectionalCode,
  type SourceRecord,
  type SourceType,
} from '../knowledge';
import type { IncognitoOption, IncognitoQuestion } from '../knowledge/onboarding-incognito';
import { evidenceId, factId, openKnowledgeId } from './ids';
import { resolvePronoun, type ContactGender } from './pronoun';

/** Invariant du jeu incognito (§4) : l'acte d'acquisition est toujours « rapporté par un proche ». */
const SOURCE_TYPE: SourceType = 'reported_by_relative';

/**
 * R-I1 : une interprétation est indirecte, donc plafonnée à 'moderate' — pas à cause de l'incognito.
 * Appliqué aux strength DÉRIVÉES par la production (le guardrail, seule famille sans strength dans la
 * donnée §4). Les strength EXPLICITES (affection/driver/behavior/preference) sont déjà conformes à
 * R-I1 dans la transcription (vérifié par incognito-conformance) et reprises telles quelles.
 */
function strengthUnderBase(base: AssertionBasis, baseline: EvidenceStrength): EvidenceStrength {
  return base === 'reporter_interpretation' && baseline === 'strong' ? 'moderate' : baseline;
}

export interface IncognitoWriteContext extends KnowledgeScope {
  readonly sourceId: string; // uuid généré à l'acquisition
  readonly timestamp: string;
  /** Identité du proche, pour résoudre {Prénom}/{Pronom}/{pronom} AVANT le SourceRecord. */
  readonly firstName: string;
  readonly gender: ContactGender;
  readonly confidence?: EvidenceConfidence;
  readonly stability?: EvidenceStability;
}

export interface IncognitoOptionWrite {
  readonly source: SourceRecord;
  readonly evidences: readonly Evidence[];
  readonly facts: readonly Fact[];
  readonly openKnowledge: readonly OpenKnowledge[];
}

/**
 * Produit source + evidences + FACT + OpenKnowledge d'UNE option incognito répondue.
 * `question` fournit la base d'assertion et l'énoncé ; `option` tout le reste.
 */
export function produceIncognitoOption(
  ctx: IncognitoWriteContext,
  question: IncognitoQuestion,
  option: IncognitoOption,
): IncognitoOptionWrite {
  const resolve = (t: string): string => resolvePronoun(t, ctx.firstName, ctx.gender);
  const stem = resolve(question.stem);
  const answer = resolve(option.text); // verbatim affiché, jetons résolus
  const base: AssertionBasis = option.assertionBasisOverride ?? question.baseAssertionBasis;

  const source = createSourceRecord({
    about: ctx.about,
    ownerId: ctx.ownerId,
    id: ctx.sourceId,
    sourceType: SOURCE_TYPE,
    questionText: stem,
    answerText: answer,
    questionCode: question.code,
    optionRef: option.code,
    timestamp: ctx.timestamp,
  });

  // R-I2 / R-I3 : incertitude et « ça dépend » ne produisent RIEN (zéro evidence/FACT/OpenKnowledge,
  // aucune evidence négative, aucune baisse de confiance). Une non-réponse n'est pas une réponse.
  if (option.status === 'UNKNOWN_BY_REPORTER' || option.status === 'CONTEXT_DEPENDENT') {
    return { source, evidences: [], facts: [], openKnowledge: [] };
  }

  const confidence: EvidenceConfidence = ctx.confidence ?? 'high';
  const stability: EvidenceStability = ctx.stability ?? 'contextual';
  const common = {
    about: ctx.about,
    ownerId: ctx.ownerId,
    source_id: ctx.sourceId,
    source_type: SOURCE_TYPE,
    raw_information: answer,
    confidence,
    timestamp: ctx.timestamp,
    stability,
    assertionBasis: base, // dérivé du mapping, jamais 'self_report' en incognito
    version: JOURNAL_VERSION_STAMP,
  } as const;
  const eid = (targetKey: string): string => evidenceId(ctx.sourceId, targetKey);

  /** Contexte porté par l'option (non-BEHAVIOR). Aucun repli 'GLOBAL' : absence → jette. */
  const optionContext = (): string => {
    if (option.context === undefined) {
      throw new Error(`[produce-incognito] ${option.code} : contexte d'option absent (aucun repli GLOBAL)`);
    }
    return option.context;
  };

  const evidences: Evidence[] = [];

  // PROFILE (value + role + facet explicites ; context = celui de l'option). R-I5 : le secondaire
  // n'est produit que parce qu'il est dans la donnée (I8.3, I13.1), jamais inféré ici.
  for (const p of option.profile ?? []) {
    const tkey = `PROFILE:${p.construct}${p.facet ? '.' + p.facet : ''}`;
    const evBase = { ...common, evidence_id: eid(tkey), context: optionContext(), evidence_role: p.evidence_role };
    if (p.construct === 'SOCIAL_ENERGY') {
      evidences.push(createSocialEnergyEvidence({ ...evBase, value: p.value as ContinuumValue }));
    } else {
      evidences.push(
        createProfileEvidence({
          ...evBase,
          target_construct: p.construct as ProfileDirectionalCode,
          value: p.value as EvidenceValue,
          ...(p.facet ? { facet: p.facet } : {}),
          ...((p.value as number) < 0 ? { contraryMapping: true as const } : {}),
        }),
      );
    }
  }

  // AFFECTION (strength explicite ; role primary — la question porte dessus ; context de l'option)
  if (option.affection) {
    const a = option.affection;
    const ev: AffectionEvidence = {
      ...common,
      evidence_id: eid(`AFFECTION:${a.direction}:${a.modality}`),
      context: optionContext(),
      evidence_role: 'primary',
      target_family: 'AFFECTION_LANGUAGE',
      direction: a.direction,
      modality: a.modality,
      target_construct: `AFFECTION_${a.direction.toUpperCase()}_${a.modality}`,
      strength: a.strength,
    };
    evidences.push(ev);
  }

  // DRIVER (strength explicite partagée ; role primary ; context de l'option)
  for (const drv of option.drivers ?? []) {
    if (option.driversStrength === undefined) {
      throw new Error(`[produce-incognito] ${option.code} : drivers sans driversStrength`);
    }
    const ev: DriverEvidence = {
      ...common,
      evidence_id: eid(`DRIVER:${drv}`),
      context: optionContext(),
      evidence_role: 'primary',
      target_family: 'DRIVER',
      target_construct: drv,
      strength: option.driversStrength,
    };
    evidences.push(ev);
  }

  // BEHAVIOR (un seul ; context LOCAL + behaviorContext portés par la donnée ; strength explicite)
  if (option.behavior) {
    const b = option.behavior;
    const tc = `${b.behaviorContext}:${b.pattern}`;
    const ev: BehaviorEvidence = {
      ...common,
      evidence_id: eid(`BEHAVIOR:${tc}`),
      context: b.context,
      evidence_role: 'primary',
      target_family: 'BEHAVIOR',
      behaviorContext: b.behaviorContext,
      pattern: b.pattern,
      target_construct: tc,
      strength: b.strength,
    };
    evidences.push(ev);
  }

  // PREFERENCE (strength explicite ; role primary ; context de l'option)
  for (const p of option.preferences ?? []) {
    const ev: PreferenceEvidence = {
      ...common,
      evidence_id: eid(`PREFERENCE:${p.path}`),
      context: optionContext(),
      evidence_role: 'primary',
      target_family: 'PREFERENCE',
      target_construct: p.path,
      preferenceValue: p.value,
      strength: p.strength,
    };
    evidences.push(ev);
  }

  // GUARDRAIL (severity + scope portés par la donnée ; strength DÉRIVÉE : baseline strong plafonnée
  // par R-I1 → moderate sous reporter_interpretation. R-I4 : la sévérité vient de l'expression,
  // jamais de la provenance — aucune formulation fermée ne fabrique un HARD ici.)
  for (const g of option.guardrails ?? []) {
    const ev: GuardrailEvidence = {
      ...common,
      evidence_id: eid(`GUARDRAIL:${g.code}`),
      context: optionContext(),
      evidence_role: 'primary',
      target_family: 'GUARDRAIL',
      target_construct: g.code,
      severity: g.severity,
      guardrailScope: g.guardrailScope,
      strength: strengthUnderBase(base, 'strong'),
    };
    evidences.push(ev);
  }

  // OpenKnowledge — I7 uniquement (support_modality). intensity NON RENSEIGNÉE : omise, jamais
  // remplie par défaut (décision du 9 oct, cf. OpenKnowledge.intensity).
  const openKnowledge: OpenKnowledge[] = [];
  if (option.openKnowledge) {
    const ok = option.openKnowledge;
    openKnowledge.push(
      createOpenKnowledge({
        about: ctx.about,
        ownerId: ctx.ownerId,
        open_knowledge_id: openKnowledgeId(ctx.sourceId, ok.subject),
        type: ok.type,
        subject: asSubjectId(normalizeLabel(ok.subject)),
        subjectLabel: answer, // formulation verbatim affichée
        relation: ok.relation,
        // pas d'intensity : I7 ne la renseigne pas
        context: ok.context,
        source: ctx.sourceId,
        timestamp: ctx.timestamp,
        confidence,
        assertionStatus: deriveAssertionStatus(SOURCE_TYPE), // 'explicit'
      }),
    );
  }

  // FACT — I11b uniquement (habit). R-I6 : jamais user_confirmed=true (Julie n'a rien confirmé).
  const facts: Fact[] = [];
  for (const f of option.facts ?? []) {
    facts.push(
      createFact({
        about: ctx.about,
        ownerId: ctx.ownerId,
        fact_id: factId(ctx.sourceId, f.fact_type, f.value),
        fact_type: f.fact_type,
        value: f.value,
        source: ctx.sourceId,
        timestamp: ctx.timestamp,
        confidence,
        user_confirmed: f.user_confirmed, // toujours false par le type IncognitoFact
        assertionStatus: deriveAssertionStatus(SOURCE_TYPE),
      }),
    );
  }

  // Garde-fou : aucun contexte hors vocabulaire ne sort de la production (coquille → consolidation
  // scindée en silence). Registre BEHAVIOR séparé, contrôlé sur son propre champ.
  for (const e of evidences) {
    assertValidEvidenceContext(e.context);
    if (e.target_family === 'BEHAVIOR') assertValidBehaviorContext(e.behaviorContext);
  }

  return { source, evidences, facts, openKnowledge };
}
