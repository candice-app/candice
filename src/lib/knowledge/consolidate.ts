// CONSOLIDATION — transforme un journal d'evidences en état consolidé par construct.
//
// HSG §19 (consolidation ≠ addition de points), §19.1 (convergence, pas de faux
// effet de volume), §20 (divergences : variation contextuelle / évolution /
// contradiction / tension structurante), §20.5 (asymétrie RECEIVE/GIVE),
// §20.6 (deux contextes BEHAVIOR ≠ contradiction), §21 + R22 (corrections),
// §12.5 (BEHAVIOR jamais globalisé mécaniquement).
//
// Les evidences sont un journal en AJOUT SEUL ; l'état consolidé en est dérivé,
// donc entièrement recalculable. Aucune fonction ici ne mute une evidence.

import type {
  AffectionEvidence,
  BehaviorEvidence,
  ContextEvidence,
  DirectionalEvidence,
  DriverEvidence,
  EntityEvidence,
  Evidence,
  EvidenceRole,
  GuardrailEvidence,
  InterestEvidence,
  NeedEvidence,
  PreferenceEvidence,
} from './evidence';
import type {
  AffectionSignalSet,
  AffectionVector,
  GlobalStatus,
  Signal,
  SignalConfidence,
  SignalScore,
  SignalStability,
} from './signal';
import { defaultSignal } from './signal';
import { AFFECTION_MODALITIES, type AffectionCadence, type EvidenceStrength } from './vocabulary';

/* ────────────────────────────────────────────────────────────────────────
 * Helpers d'indépendance et de temporalité.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Indépendance (HSG §19.1) : deux evidences issues de la même source ne comptent
 * pas comme deux observations indépendantes. Clé = source_id + source_type.
 * C'est ce qui évite le faux effet de volume (10 formulations ≠ 10 observations).
 */
function independentKey(e: Evidence): string {
  return `${e.source_id}::${e.source_type}`;
}

function independentCount(evidences: readonly Evidence[]): number {
  return new Set(evidences.map(independentKey)).size;
}

function hasRole(evidences: readonly Evidence[], role: EvidenceRole): boolean {
  return evidences.some((e) => e.evidence_role === role);
}

function distinctLocalContexts(evidences: readonly Evidence[]): string[] {
  const keyed = new Map<string, string>();
  for (const e of evidences) {
    if (e.context !== 'GLOBAL') keyed.set(independentKey(e), e.context);
  }
  return [...new Set(keyed.values())];
}

function latestTimestamp(evidences: readonly Evidence[]): string | null {
  let latest: string | null = null;
  for (const e of evidences) {
    if (latest === null || e.timestamp > latest) latest = e.timestamp;
  }
  return latest;
}

function strengthMagnitude(s: EvidenceStrength): 1 | 2 {
  return s === 'strong' ? 2 : 1;
}

/* ────────────────────────────────────────────────────────────────────────
 * Composantes communes : globalStatus, stability.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * globalStatus (R15 / HSG §8.3).
 *   - GLOBAL_DIRECT : au moins une evidence explicitement transversale (context GLOBAL).
 *   - GLOBAL_CONSOLIDATED : convergence d'au moins 2 evidences INDÉPENDANTES
 *     contextualisées dans ≥2 contextes distincts. JAMAIS produit par un mapping.
 *   - LOCAL_ONLY sinon.
 * `allowGlobal=false` force LOCAL_ONLY (BEHAVIOR jamais globalisé — §12.5).
 */
function computeGlobalStatus(evidences: readonly Evidence[], allowGlobal = true): GlobalStatus {
  if (!allowGlobal) return 'LOCAL_ONLY';
  if (evidences.some((e) => e.context === 'GLOBAL')) return 'GLOBAL_DIRECT';
  if (independentCount(evidences) >= 2 && distinctLocalContexts(evidences).length >= 2) {
    return 'GLOBAL_CONSOLIDATED';
  }
  return 'LOCAL_ONLY';
}

function computeStability(evidences: readonly Evidence[]): SignalStability {
  if (evidences.length === 0) return 'unknown';
  const set = new Set(evidences.map((e) => e.stability));
  if (set.has('evolving')) return 'evolving';
  if (set.has('temporary')) return 'temporary';
  if (set.size === 1 && set.has('stable') && independentCount(evidences) >= 2) return 'stable';
  if (set.has('contextual')) return 'contextual';
  // Info trop peu convergente pour être déclarée stable (HSG §5.2).
  return independentCount(evidences) >= 2 && set.has('stable') ? 'stable' : 'contextual';
}

function contexts(evidences: readonly Evidence[]): string[] {
  return [...new Set(evidences.map((e) => e.context))];
}
function evidenceIds(evidences: readonly Evidence[]): string[] {
  return evidences.map((e) => e.evidence_id);
}

/* ────────────────────────────────────────────────────────────────────────
 * Score / confidence génériques, fondés sur la QUALITÉ (pas l'addition).
 * ──────────────────────────────────────────────────────────────────────── */

interface ScoreInputs {
  indep: number;
  hasPrimary: boolean;
  maxMagnitude: 1 | 2;
  distinctContexts: number;
  anyGlobalDirect: boolean;
  contradiction: boolean;
}

function computeScore(i: ScoreInputs): SignalScore {
  if (i.indep === 0) return 'unknown';
  // Une evidence secondaire ne peut jamais, seule, porter un construct à high
  // (décision 4) : sans primaire, le score est plafonné à 'medium'.
  if (!i.hasPrimary) return i.indep >= 2 ? 'medium' : 'low';
  const strongPrimary = i.maxMagnitude === 2;
  if ((strongPrimary && i.indep >= 2) || (strongPrimary && i.anyGlobalDirect) || i.indep >= 3) {
    return 'high';
  }
  if (strongPrimary || i.indep >= 2) return 'medium';
  return 'low';
}

function computeConfidence(i: ScoreInputs): SignalConfidence {
  if (i.indep === 0) return 'none';
  if (i.contradiction) return 'low'; // contradiction → confiance ajustée à la baisse (§20.3)
  // Secondaire seul : confiance plafonnée à 'low' (décision 4).
  if (!i.hasPrimary) return 'low';
  if (i.indep >= 3 && (i.distinctContexts >= 2 || i.anyGlobalDirect)) return 'high';
  if (i.indep >= 2 || i.maxMagnitude === 2) return 'medium';
  return 'low';
}

/* ────────────────────────────────────────────────────────────────────────
 * PROFILE (directionnel) — value ±1/±2, SOCIAL_ENERGY avec 0 possible.
 * ──────────────────────────────────────────────────────────────────────── */

function groupBy<T>(items: readonly T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
}

/** Consolide un seul construct PROFILE directionnel. */
export function consolidateProfileConstruct(
  construct: string,
  evidences: readonly DirectionalEvidence[],
): Signal {
  const forConstruct = evidences.filter((e) => e.target_construct === construct);
  if (forConstruct.length === 0) return defaultSignal(construct);

  const positives = forConstruct.filter((e) => e.value > 0);
  const negatives = forConstruct.filter((e) => e.value < 0);
  const indep = independentCount(forConstruct);
  const hasPrimary = hasRole(forConstruct, 'primary');
  const maxMagnitude = (Math.max(...forConstruct.map((e) => Math.abs(e.value))) >= 2 ? 2 : 1) as
    | 1
    | 2;
  const local = distinctLocalContexts(forConstruct);
  const anyGlobalDirect = forConstruct.some((e) => e.context === 'GLOBAL');

  // Contradiction (§20.3) : un même contexte porte des directions opposées.
  const contradiction = hasDirectionalContradiction(forConstruct);

  const inputs: ScoreInputs = {
    indep,
    hasPrimary,
    maxMagnitude,
    distinctContexts: local.length + (anyGlobalDirect ? 1 : 0),
    anyGlobalDirect,
    contradiction,
  };

  const direction: Signal['direction'] =
    positives.length > 0 && negatives.length > 0
      ? 'mixed'
      : negatives.length > 0
        ? 'negative'
        : 'positive';

  return {
    construct,
    score: computeScore(inputs),
    confidence: computeConfidence(inputs),
    evidenceCount: forConstruct.length,
    evidenceIds: evidenceIds(forConstruct),
    contexts: contexts(forConstruct),
    globalStatus: computeGlobalStatus(forConstruct),
    stability: computeStability(forConstruct),
    lastUpdated: latestTimestamp(forConstruct),
    direction,
    contradiction: contradiction || undefined,
  };
}

/** Consolide tous les constructs PROFILE présents dans le journal. */
export function consolidateProfile(evidences: readonly DirectionalEvidence[]): Signal[] {
  const groups = groupBy(evidences, (e) => e.target_construct);
  return [...groups.entries()].map(([construct, evs]) => consolidateProfileConstruct(construct, evs));
}

/** Deux evidences directionnelles de même contexte et de signes opposés = contradiction. */
function hasDirectionalContradiction(evidences: readonly DirectionalEvidence[]): boolean {
  const byContext = groupBy(evidences, (e) => e.context);
  for (const evs of byContext.values()) {
    const hasPos = evs.some((e) => e.value > 0);
    const hasNeg = evs.some((e) => e.value < 0);
    if (hasPos && hasNeg) return true;
  }
  return false;
}

/* ────────────────────────────────────────────────────────────────────────
 * Familles à `strength` (NEED, DRIVER, GUARDRAIL, INTEREST, ENTITY, CONTEXT,
 * PREFERENCE, et chaque modalité AFFECTION). Pas de direction.
 * ──────────────────────────────────────────────────────────────────────── */

type StrengthEvidence =
  | NeedEvidence
  | DriverEvidence
  | GuardrailEvidence
  | InterestEvidence
  | EntityEvidence
  | ContextEvidence
  | PreferenceEvidence
  | AffectionEvidence
  | BehaviorEvidence;

function consolidateStrengthConstruct(
  construct: string,
  evidences: readonly StrengthEvidence[],
  opts: { allowGlobal?: boolean } = {},
): Signal {
  const forConstruct = evidences.filter((e) => e.target_construct === construct);
  if (forConstruct.length === 0) return defaultSignal(construct);

  const indep = independentCount(forConstruct);
  const hasPrimary = hasRole(forConstruct, 'primary');
  const maxMagnitude = (Math.max(...forConstruct.map((e) => strengthMagnitude(e.strength))) >= 2
    ? 2
    : 1) as 1 | 2;
  const local = distinctLocalContexts(forConstruct);
  const anyGlobalDirect = forConstruct.some((e) => e.context === 'GLOBAL');

  const inputs: ScoreInputs = {
    indep,
    hasPrimary,
    maxMagnitude,
    distinctContexts: local.length + (anyGlobalDirect ? 1 : 0),
    anyGlobalDirect,
    contradiction: false,
  };

  return {
    construct,
    score: computeScore(inputs),
    confidence: computeConfidence(inputs),
    evidenceCount: forConstruct.length,
    evidenceIds: evidenceIds(forConstruct),
    contexts: contexts(forConstruct),
    globalStatus: computeGlobalStatus(forConstruct, opts.allowGlobal ?? true),
    stability: computeStability(forConstruct),
    lastUpdated: latestTimestamp(forConstruct),
  };
}

/** NEED. */
export function consolidateNeeds(evidences: readonly NeedEvidence[]): Signal[] {
  return [...groupBy(evidences, (e) => e.target_construct).entries()].map(([c, evs]) =>
    consolidateStrengthConstruct(c, evs),
  );
}

/** GUARDRAIL. */
export function consolidateGuardrails(evidences: readonly GuardrailEvidence[]): Signal[] {
  return [...groupBy(evidences, (e) => e.target_construct).entries()].map(([c, evs]) =>
    consolidateStrengthConstruct(c, evs),
  );
}

/**
 * Familles descriptives OUVERTES (INTEREST, ENTITY, CONTEXT, PREFERENCE, DRIVER).
 * Même mécanique de consolidation par strength.
 */
export function consolidateOpenFamily(
  evidences: readonly (DriverEvidence | InterestEvidence | EntityEvidence | ContextEvidence | PreferenceEvidence)[],
): Signal[] {
  return [...groupBy(evidences, (e) => e.target_construct).entries()].map(([c, evs]) =>
    consolidateStrengthConstruct(c, evs),
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * BEHAVIOR — jamais globalisé mécaniquement (§12.5). Chaque (contexte:pattern)
 * est un construct distinct ; deux contextes différents ≠ contradiction (§20.6).
 * ──────────────────────────────────────────────────────────────────────── */

export function consolidateBehavior(evidences: readonly BehaviorEvidence[]): Signal[] {
  return [...groupBy(evidences, (e) => e.target_construct).entries()].map(([c, evs]) =>
    consolidateStrengthConstruct(c, evs, { allowGlobal: false }),
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * AFFECTION_LANGUAGE — deux vecteurs ENTIÈREMENT séparés (R5).
 * ──────────────────────────────────────────────────────────────────────── */

function buildAffectionVector(
  evidences: readonly AffectionEvidence[],
  direction: 'receive' | 'give',
): AffectionVector {
  const dirEv = evidences.filter((e) => e.direction === direction);
  const vector = {} as AffectionVector;
  for (const modality of AFFECTION_MODALITIES) {
    const code = `AFFECTION_${direction.toUpperCase()}_${modality}`;
    const evs = dirEv.filter((e) => e.target_construct === code);
    vector[modality] = evs.length === 0 ? defaultSignal(code) : consolidateStrengthConstruct(code, evs);
  }
  return vector;
}

export function consolidateAffection(
  evidences: readonly AffectionEvidence[],
  extra: { affectionCadence?: AffectionCadence; regularityImportance?: number | null } = {},
): AffectionSignalSet {
  return {
    receive: buildAffectionVector(evidences, 'receive'),
    give: buildAffectionVector(evidences, 'give'),
    affectionCadence: extra.affectionCadence ?? 'unknown',
    regularityImportance: extra.regularityImportance ?? null,
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * DIVERGENCES (§20) — quatre phénomènes distincts, jamais confondus.
 * ──────────────────────────────────────────────────────────────────────── */

export type DivergenceKind =
  | 'contextual_variation' // §20.1 : contextes différents, aucune contradiction
  | 'evolution' // §20.2 : la personne a changé dans le temps
  | 'contradiction' // §20.3 : incompatibilité réelle, mêmes conditions
  | 'structural_tension'; // §20.4 : deux forces coexistent, informatives

export interface Divergence {
  readonly kind: DivergenceKind;
  readonly evidenceIds: string[];
  readonly note: string;
}

/**
 * Qualifie les divergences internes d'un construct directionnel.
 * Deux evidences de contextes différents = variation contextuelle, pas contradiction.
 */
export function detectDivergences(evidences: readonly DirectionalEvidence[]): Divergence[] {
  const out: Divergence[] = [];
  if (evidences.some((e) => e.stability === 'evolving')) {
    out.push({
      kind: 'evolution',
      evidenceIds: evidences.filter((e) => e.stability === 'evolving').map((e) => e.evidence_id),
      note: 'Evidence marquée evolving : évolution dans le temps, à conserver avec sa temporalité.',
    });
  }
  const byContext = groupBy(evidences, (e) => e.context);
  for (const [ctx, evs] of byContext.entries()) {
    if (evs.some((e) => e.value > 0) && evs.some((e) => e.value < 0)) {
      out.push({
        kind: 'contradiction',
        evidenceIds: evs.map((e) => e.evidence_id),
        note: `Contradiction dans le contexte ${ctx} : conserver les deux, ajuster la confiance, candidate à clarification.`,
      });
    }
  }
  if (byContext.size >= 2) {
    out.push({
      kind: 'contextual_variation',
      evidenceIds: evidences.map((e) => e.evidence_id),
      note: 'Contextes distincts : variation contextuelle, pas contradiction.',
    });
  }
  return out;
}

/**
 * Tension structurante (§20.4 / R18) : deux signaux forts coexistent.
 * Renvoyée COMME tension — jamais moyennée.
 */
export interface StructuralTension {
  readonly constructs: [string, string];
  readonly signals: [Signal, Signal];
  readonly note: string;
}

export function asStructuralTension(a: Signal, b: Signal, note: string): StructuralTension {
  return { constructs: [a.construct, b.construct], signals: [a, b], note };
}

/**
 * Asymétrie RECEIVE/GIVE (§20.5) : ce n'est ni contradiction ni tension à résoudre.
 * Renvoie une description de l'asymétrie lorsqu'elle existe, sinon null.
 */
export function describeAffectionAsymmetry(
  set: AffectionSignalSet,
): { receiveStrong: string[]; giveStrong: string[]; note: string } | null {
  const strong = (v: AffectionVector) =>
    AFFECTION_MODALITIES.filter((m) => v[m].score === 'high' || v[m].score === 'medium');
  const receiveStrong = strong(set.receive);
  const giveStrong = strong(set.give);
  const asymmetric =
    receiveStrong.some((m) => !giveStrong.includes(m)) ||
    giveStrong.some((m) => !receiveStrong.includes(m));
  if (!asymmetric) return null;
  return {
    receiveStrong,
    giveStrong,
    note: 'Asymétrie RECEIVE/GIVE : information relationnelle normale, pas une contradiction.',
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * CORRECTIONS UTILISATEUR (§21 / R22) — priorité sur une inférence incompatible.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Révise un signal antérieur à la lumière d'une correction explicite de l'utilisateur.
 * La correction (source_type 'user_correction') prime : si elle est incompatible
 * avec la direction/inférence antérieure, le signal est affaibli/invalidé et marqué,
 * et la correction est jointe au journal d'evidences du construct. Jamais de
 * conservation de l'ancienne conclusion comme vraie.
 */
export function reviseWithCorrection(prior: Signal, correction: Evidence): Signal {
  if (correction.source_type !== 'user_correction') return prior;
  const isDirectional = correction.target_family === 'PROFILE';
  const contrary = isDirectional && 'value' in correction && (correction.value as number) < 0;
  const evidenceIdsNext = [...prior.evidenceIds, correction.evidence_id];
  // Une correction contraire invalide l'inférence trop large ; sinon elle nuance.
  return {
    ...prior,
    score: contrary ? 'low' : prior.score === 'high' ? 'medium' : prior.score,
    confidence: 'low',
    contradiction: contrary ? true : prior.contradiction,
    evidenceIds: evidenceIdsNext,
    evidenceCount: evidenceIdsNext.length,
    lastUpdated: correction.timestamp,
    contexts: [...new Set([...prior.contexts, correction.context])],
  };
}
