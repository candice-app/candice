// CONSOLIDATION — transforme un journal d'evidences en état consolidé par construct.
//
// HSG §19 (consolidation ≠ addition de points), §19.1 (convergence, pas de faux
// effet de volume), §20 (divergences), §20.5 (asymétrie RECEIVE/GIVE),
// §20.6 (deux contextes BEHAVIOR ≠ contradiction), §21 + R22 (corrections),
// §12.5 (BEHAVIOR jamais globalisé mécaniquement).
//
// Lot A bis : chaque famille produit son signal TYPÉ (union discriminée), portant la
// sémantique que le lot A perdait (relation, relationship, severity, value…). La
// consolidation est toujours celle d'UNE personne : elle prend un `scope`
// (about + ownerId) que porte chaque signal produit.
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
import type { EntityId, KnowledgeScope, SubjectId } from './identity';
import type {
  AffectionSignal,
  AffectionSignalSet,
  AffectionVector,
  BehaviorSignal,
  ContextSignal,
  DriverSignal,
  EntitySignal,
  GlobalStatus,
  GuardrailSignal,
  InterestSignal,
  NeedSignal,
  PreferenceSignal,
  ProfileSignal,
  Signal,
  SignalBase,
  SignalConfidence,
  SignalScore,
  SignalStability,
  SocialEnergySignal,
} from './signal';
import { constructIdentity, emptyBase } from './signal';
import type { Fact } from './fact';
import { deriveAssertionStatus, isSelfDeclaredAct } from './sources';
import { CONSOLIDATION_VERSION, VERSION_STAMP } from './version';
import { DEFAULT_EXPOSABLE, effectiveExposure, mostRestrictive, type VisibilityPolicy } from './visibility';

/**
 * Options communes de consolidation. `supportingFacts` permet la propagation de
 * visibilité (correction 5) : un signal hérite du niveau le plus restrictif parmi les
 * FACT qui le soutiennent (liés par evidence.fact_id).
 */
export interface ConsolidateOpts {
  readonly supportingFacts?: readonly Fact[];
}
import {
  AFFECTION_MODALITIES,
  type AffectionCadence,
  type ContextCode,
  type ContinuumValue,
  type DriverCode,
  type EntityRelation,
  type EvidenceStrength,
  type GuardrailCode,
  type GuardrailScope,
  type GuardrailSeverity,
  type GuardrailVerticalPath,
  type NeedCode,
  type PreferencePath,
  type ProfileDirectionalCode,
} from './vocabulary';

/* ────────────────────────────────────────────────────────────────────────
 * SEUILS DE CONSOLIDATION — objet typé UNIQUE, lu depuis le document arbitré
 * docs/ontologie/consolidation-rules.md (consolidation_version 1.0.0).
 * ──────────────────────────────────────────────────────────────────────── */

export const CONSOLIDATION_RULES = {
  source: 'docs/ontologie/consolidation-rules.md',
  version: CONSOLIDATION_VERSION,
  score: { independentPrimaryMinForHigh: 2 },
  confidence: {
    high: { minEvidences: 3, minIndependentSources: 2, minDistinctContexts: 2 },
    medium: { minEvidences: 2 },
  },
  globalConsolidated: { minLocalEvidences: 3, minDistinctContexts: 3, minIndependentSources: 2 },
} as const;

/* ────────────────────────────────────────────────────────────────────────
 * Helpers d'indépendance et de temporalité.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Indépendance (HSG §19.1 / consolidation-rules §4) : l'indépendance se compte sur
 * le `source_type`, JAMAIS sur le `source_id` ni sur le nombre d'evidences. Deux
 * evidences issues du même sourceType ne sont jamais indépendantes, quel que soit le
 * nombre de réponses derrière — sinon dix réponses d'onboarding se liraient comme dix
 * sources, et confidence: high deviendrait atteignable depuis le seul onboarding.
 */
function independentKey(e: Evidence): string {
  return e.source_type;
}

function independentCount(evidences: readonly Evidence[]): number {
  return new Set(evidences.map(independentKey)).size;
}

/**
 * Statut d'assertion RÉSOLU. `assertionStatus` est FACULTATIF sur l'evidence en mémoire,
 * NOT NULL en base. On le résout depuis le sourceType quand il manque, et on ne suppose
 * RIEN quand ni l'un ni l'autre n'est disponible : undefined, donc non compté.
 */
function resolvedAssertionStatus(e: Evidence): string | undefined {
  if (e.assertionStatus !== undefined) return e.assertionStatus;
  return e.source_type === undefined ? undefined : deriveAssertionStatus(e.source_type);
}

function explicitCount(evidences: readonly Evidence[]): number {
  return evidences.filter((e) => resolvedAssertionStatus(e) === 'explicit').length;
}

function hasRole(evidences: readonly Evidence[], role: EvidenceRole): boolean {
  return evidences.some((e) => e.evidence_role === role);
}

/** Contextes locaux distincts (valeurs de contexte hors GLOBAL), indépendamment des sources. */
function distinctLocalContexts(evidences: readonly Evidence[]): string[] {
  return [...new Set(evidences.filter((e) => e.context !== 'GLOBAL').map((e) => e.context))];
}

/**
 * ORDRE TEMPOREL — on compare des INSTANTS, jamais des chaînes. Deux écritures du même
 * instant (« …T09:30:00Z », « …T09:30:00.000Z », « …T10:30:00+01:00 ») sont équivalentes et
 * la persistance les accepte ; comparées comme du texte, elles s'ordonnent à l'envers
 * (« . » précède « Z », « 10:30 » suit « 09:30 »). L'ordre avant écriture et après relecture
 * divergerait alors en silence — et « la plus récente supplante » désignerait l'autre.
 * Un horodatage illisible LÈVE : il ne se range pas au hasard.
 */
function instant(ts: string, ou: string): number {
  const n = Date.parse(ts);
  if (Number.isNaN(n)) {
    throw new Error(`[knowledge] horodatage illisible sur ${ou} : « ${ts} » — l'ordre temporel serait arbitraire.`);
  }
  return n;
}

/**
 * Plus récente d'abord par instant ; à instant ÉGAL, par `evidence_id`. Le départage est
 * nécessaire et doit être STABLE : avant écriture l'ordre du tableau est celui de la
 * production, après relecture celui de `id`. Sans départage déterministe, deux preuves
 * du même instant pourraient se succéder différemment des deux côtés.
 */
function plusRecente<T extends { timestamp: string; evidence_id: string }>(a: T, b: T): T {
  const ia = instant(a.timestamp, a.evidence_id);
  const ib = instant(b.timestamp, b.evidence_id);
  if (ib !== ia) return ib > ia ? b : a;
  return b.evidence_id > a.evidence_id ? b : a;
}

/**
 * Valide TOUS les horodatages, y compris quand il n'y en a qu'un. `reduce` et `sort`
 * n'appellent jamais leur comparateur sur un ensemble d'un seul élément : sans cette passe,
 * une preuve isolée à l'horodatage illisible traverserait la consolidation en silence et
 * ressortirait telle quelle dans `lastUpdated`.
 */
function validerInstants(evs: readonly { timestamp: string; evidence_id: string }[]): void {
  for (const e of evs) instant(e.timestamp, e.evidence_id);
}

function latestTimestamp(evidences: readonly Evidence[]): string | null {
  if (evidences.length === 0) return null;
  validerInstants(evidences);
  return evidences.reduce(plusRecente).timestamp;
}

/** Evidence la plus récente d'un ensemble non vide. */
function mostRecent<T extends { timestamp: string; evidence_id: string }>(evs: readonly T[]): T {
  validerInstants(evs);
  return evs.reduce(plusRecente);
}

function strengthMagnitude(s: EvidenceStrength): 1 | 2 {
  return s === 'strong' ? 2 : 1;
}

/* ────────────────────────────────────────────────────────────────────────
 * Composantes communes : globalStatus, stability.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * globalStatus (R15 / HSG §8.3, seuils consolidation-rules §5).
 * `allowGlobal=false` force LOCAL_ONLY (BEHAVIOR jamais globalisé — §12.5).
 * `coherent=false` (direction mixte) interdit la consolidation globale.
 */
function computeGlobalStatus(
  evidences: readonly Evidence[],
  allowGlobal = true,
  coherent = true,
): GlobalStatus {
  if (!allowGlobal) return 'LOCAL_ONLY';
  if (evidences.some((e) => e.context === 'GLOBAL')) return 'GLOBAL_DIRECT';
  const g = CONSOLIDATION_RULES.globalConsolidated;
  const localCount = evidences.filter((e) => e.context !== 'GLOBAL').length;
  if (
    coherent &&
    localCount >= g.minLocalEvidences &&
    distinctLocalContexts(evidences).length >= g.minDistinctContexts &&
    independentCount(evidences) >= g.minIndependentSources
  ) {
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
  evidenceCount: number;
  indep: number;
  indepPrimary: number;
  strongPrimary: boolean;
  explicitCount: number;
  declaredStrongPrimary: boolean;
  onlySecondary: boolean;
  netContrary: boolean;
  distinctContexts: number;
  contradiction: boolean;
}

/** SCORE (§2). low UNIQUEMENT sur contraire net (R1). high : ≥1 primaire +2 OU ≥N primaires indép. */
function computeScore(i: ScoreInputs): SignalScore {
  if (i.evidenceCount === 0) return 'unknown';
  if (i.netContrary) return 'low';
  const high =
    !i.contradiction &&
    (i.declaredStrongPrimary || i.indepPrimary >= CONSOLIDATION_RULES.score.independentPrimaryMinForHigh);
  if (high) return 'high';
  return 'medium';
}

/** CONFIANCE (§3). high exige ≥2 sources indépendantes → l'onboarding seul ne l'atteint pas (§4). */
function computeConfidence(i: ScoreInputs): SignalConfidence {
  if (i.evidenceCount === 0) return 'none';
  if (i.contradiction) return 'low';
  if (i.onlySecondary) return 'low';
  const h = CONSOLIDATION_RULES.confidence.high;
  if (i.evidenceCount >= h.minEvidences && i.indep >= h.minIndependentSources && i.distinctContexts >= h.minDistinctContexts) {
    return 'high';
  }
  // §48bis : le NOMBRE ne compte que des preuves EXPLICITES. Une inférence ne fabrique
  // jamais de confiance par accumulation, et un statut NON RÉSOLU ne compte pas non plus
  // (absence n'est pas explicite) : le doute se tranche vers le bas.
  if (i.explicitCount >= CONSOLIDATION_RULES.confidence.medium.minEvidences
      || i.declaredStrongPrimary) {
    return 'medium';
  }
  return 'low';
}

/* ────────────────────────────────────────────────────────────────────────
 * Base commune d'un signal consolidé (hors discriminateur et champs sémantiques).
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

/**
 * Visibilité héritée (correction 5) : le niveau le plus restrictif parmi `exposable`
 * (défaut) et la visibilité effective des FACT soutenant ces evidences (liés par
 * evidence.fact_id). Aucune source plus restrictive → reste `exposable`.
 */
function deriveVisibility(
  forConstruct: readonly Evidence[],
  supportingFacts?: readonly Fact[],
): VisibilityPolicy {
  if (!supportingFacts || supportingFacts.length === 0) return DEFAULT_EXPOSABLE;
  const factIds = new Set(forConstruct.map((e) => e.fact_id).filter((id): id is string => !!id));
  const levels = supportingFacts
    .filter((f) => factIds.has(f.fact_id))
    .map((f) => effectiveExposure(f.visibility));
  return { derived: mostRestrictive(['exposable', ...levels]) };
}

function baseFrom(
  scope: KnowledgeScope,
  forConstruct: readonly Evidence[],
  inputs: ScoreInputs,
  opts: { allowGlobal?: boolean; coherent?: boolean; visibility?: VisibilityPolicy; supportingFacts?: readonly Fact[] } = {},
): SignalBase {
  return {
    about: scope.about,
    ownerId: scope.ownerId,
    score: computeScore(inputs),
    confidence: computeConfidence(inputs),
    evidenceCount: forConstruct.length,
    evidenceIds: evidenceIds(forConstruct),
    contexts: contexts(forConstruct),
    globalStatus: computeGlobalStatus(forConstruct, opts.allowGlobal ?? true, opts.coherent ?? true),
    stability: computeStability(forConstruct),
    lastUpdated: latestTimestamp(forConstruct),
    contradiction: inputs.contradiction || undefined,
    version: VERSION_STAMP,
    visibility: opts.visibility ?? deriveVisibility(forConstruct, opts.supportingFacts),
  };
}

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

function strengthInputs(forConstruct: readonly StrengthEvidence[]): ScoreInputs {
  const primaries = forConstruct.filter((e) => e.evidence_role === 'primary');
  const local = distinctLocalContexts(forConstruct);
  const anyGlobalDirect = forConstruct.some((e) => e.context === 'GLOBAL');
  return {
    evidenceCount: forConstruct.length,
    indep: independentCount(forConstruct),
    indepPrimary: independentCount(primaries),
    strongPrimary: primaries.some((e) => strengthMagnitude(e.strength) >= 2),
    explicitCount: explicitCount(forConstruct),
    declaredStrongPrimary: primaries.some(
      (e) => strengthMagnitude(e.strength) >= 2 && isSelfDeclaredAct(e.source_type),
    ),
    onlySecondary: !forConstruct.some((e) => e.evidence_role === 'primary'),
    // Familles sans direction : aucune evidence contraire possible → jamais 'low' par le
    // score. Pour ENTITY en particulier (point d'arrêt 3) : la DIRECTION d'une relation
    // (DISLIKE, AVOID) n'est PAS une evidence contraire — netContrary reste donc false.
    netContrary: false,
    distinctContexts: local.length + (anyGlobalDirect ? 1 : 0),
    contradiction: false,
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * PROFILE (directionnel) + SOCIAL_ENERGY (continuum 0..4).
 * ──────────────────────────────────────────────────────────────────────── */

function directionalInputs(forConstruct: readonly DirectionalEvidence[]): {
  inputs: ScoreInputs;
  direction: 'positive' | 'negative' | 'mixed';
  coherent: boolean;
} {
  const positives = forConstruct.filter((e) => e.value > 0);
  const negatives = forConstruct.filter((e) => e.value < 0);
  const primaries = forConstruct.filter((e) => e.evidence_role === 'primary');
  const local = distinctLocalContexts(forConstruct);
  const anyGlobalDirect = forConstruct.some((e) => e.context === 'GLOBAL');
  const contradiction = hasDirectionalContradiction(forConstruct);
  const coherent = !(positives.length > 0 && negatives.length > 0);
  const inputs: ScoreInputs = {
    evidenceCount: forConstruct.length,
    indep: independentCount(forConstruct),
    indepPrimary: independentCount(primaries),
    strongPrimary: primaries.some((e) => Math.abs(e.value) >= 2),
    explicitCount: explicitCount(forConstruct),
    declaredStrongPrimary: primaries.some(
      (e) => Math.abs(e.value) >= 2 && isSelfDeclaredAct(e.source_type),
    ),
    onlySecondary: !hasRole(forConstruct, 'primary'),
    netContrary: negatives.length > 0 && positives.length === 0,
    distinctContexts: local.length + (anyGlobalDirect ? 1 : 0),
    contradiction,
  };
  const direction = positives.length > 0 && negatives.length > 0 ? 'mixed' : negatives.length > 0 ? 'negative' : 'positive';
  return { inputs, direction, coherent };
}

/** Consolide un seul construct PROFILE directionnel (ou SOCIAL_ENERGY). */
export function consolidateProfileConstruct(
  scope: KnowledgeScope,
  construct: string,
  evidences: readonly DirectionalEvidence[],
  opts: ConsolidateOpts = {},
): ProfileSignal | SocialEnergySignal {
  const isSocialEnergy = construct === 'SOCIAL_ENERGY';
  const forConstruct = evidences.filter((e) => e.target_construct === construct);
  if (forConstruct.length === 0) {
    return isSocialEnergy
      ? { ...emptyBase(scope), family: 'PROFILE', construct: 'SOCIAL_ENERGY', position: null }
      : { ...emptyBase(scope), family: 'PROFILE', construct: construct as ProfileDirectionalCode, direction: 'positive' };
  }
  const { inputs, direction, coherent } = directionalInputs(forConstruct);
  const base = baseFrom(scope, forConstruct, inputs, { coherent, supportingFacts: opts.supportingFacts });
  if (isSocialEnergy) {
    // position = valeur la plus récente sur 0..4 (jamais recentrée).
    const latest = mostRecent(forConstruct);
    return { ...base, family: 'PROFILE', construct: 'SOCIAL_ENERGY', position: latest.value as ContinuumValue };
  }
  const facet = forConstruct.map((e) => ('facet' in e ? e.facet : undefined)).find((f) => f !== undefined);
  return {
    ...base,
    family: 'PROFILE',
    construct: construct as ProfileDirectionalCode,
    direction,
    ...(facet ? { facet } : {}),
  };
}

/** Consolide tous les constructs PROFILE présents dans le journal. */
export function consolidateProfile(
  scope: KnowledgeScope,
  evidences: readonly DirectionalEvidence[],
  opts: ConsolidateOpts = {},
): (ProfileSignal | SocialEnergySignal)[] {
  return [...groupBy(evidences, (e) => e.target_construct).entries()].map(([c, evs]) =>
    consolidateProfileConstruct(scope, c, evs, opts),
  );
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
 * Familles à `strength` — chacune produit son signal typé.
 * ──────────────────────────────────────────────────────────────────────── */

/** NEED. */
export function consolidateNeeds(scope: KnowledgeScope, evidences: readonly NeedEvidence[], opts: ConsolidateOpts = {}): NeedSignal[] {
  return [...groupBy(evidences, (e) => e.target_construct).entries()].map(([c, evs]) => ({
    ...baseFrom(scope, evs, strengthInputs(evs), { supportingFacts: opts.supportingFacts }),
    family: 'NEED',
    construct: c as NeedCode,
  }));
}

/** DRIVER. */
export function consolidateDrivers(scope: KnowledgeScope, evidences: readonly DriverEvidence[], opts: ConsolidateOpts = {}): DriverSignal[] {
  return [...groupBy(evidences, (e) => e.target_construct).entries()].map(([c, evs]) => ({
    ...baseFrom(scope, evs, strengthInputs(evs), { supportingFacts: opts.supportingFacts }),
    family: 'DRIVER',
    construct: c as DriverCode,
  }));
}

/** CONTEXT. */
export function consolidateContexts(scope: KnowledgeScope, evidences: readonly ContextEvidence[], opts: ConsolidateOpts = {}): ContextSignal[] {
  return [...groupBy(evidences, (e) => e.target_construct).entries()].map(([c, evs]) => ({
    ...baseFrom(scope, evs, strengthInputs(evs), { supportingFacts: opts.supportingFacts }),
    family: 'CONTEXT',
    construct: c as ContextCode,
  }));
}

/**
 * Restrictivité du scope d'un guardrail (correction 4) : selection > execution > context.
 * Ce n'est PAS une échelle temporelle — selection élimine une catégorie (R19), execution
 * ne pénalise qu'une exécution incertaine (R21). Le scope consolidé est le PLUS restrictif.
 */
const GUARDRAIL_SCOPE_RESTRICTIVENESS: Record<GuardrailScope, number> = {
  selection: 0,
  execution: 1,
  context: 2,
};

/**
 * GUARDRAIL — sévérité consolidée = la plus contraignante (HARD parmi SOFT → HARD, R19) ;
 * scope consolidé = le PLUS restrictif (selection > execution > context, correction 4),
 * jamais le plus récent — sinon un guardrail de selection pourrait être silencieusement
 * remplacé par un guardrail d'execution et laisser passer une reco à éliminer.
 */
export function consolidateGuardrails(scope: KnowledgeScope, evidences: readonly GuardrailEvidence[], opts: ConsolidateOpts = {}): GuardrailSignal[] {
  // GRAIN = (code, context). Grouper par code seul fusionnerait noise@restaurant et
  // noise@concert — la fusion elle-même élargirait le domaine. severity/scope se
  // calculent DANS chaque groupe ; un HARD en restaurant ne rend pas HARD le concert.
  return [...groupBy(evidences, (e) => `${e.target_construct}::${e.context}`).entries()].map(([, evs]) => {
    const code = evs[0].target_construct;
    const context = evs[0].context; // tous identiques dans le groupe (grain)
    const severity: GuardrailSeverity = evs.some((e) => e.severity === 'HARD') ? 'HARD' : 'SOFT';
    const guardrailScope = evs
      .map((e) => e.guardrailScope)
      .reduce((lo, s) => (GUARDRAIL_SCOPE_RESTRICTIVENESS[s] < GUARDRAIL_SCOPE_RESTRICTIVENESS[lo] ? s : lo));
    return {
      ...baseFrom(scope, evs, strengthInputs(evs), { supportingFacts: opts.supportingFacts }),
      family: 'GUARDRAIL',
      code: code as GuardrailCode | GuardrailVerticalPath,
      context,
      severity,
      guardrailScope,
    };
  });
}

/**
 * INTEREST — conserve le `relationship`. Relationship courant = evidence la plus récente.
 * NOTE (carnet) : casual|curious|enthusiast|passion|expert est une échelle d'intensité ;
 * une mention casual isolée ne devrait pas faire redescendre un expert. À revoir avec du
 * volume réel — pas de données pour trancher maintenant.
 */
export function consolidateInterests(scope: KnowledgeScope, evidences: readonly InterestEvidence[], opts: ConsolidateOpts = {}): InterestSignal[] {
  return [...groupBy(evidences, (e) => e.target_construct as string).entries()].map(([subject, evs]) => {
    const latest = mostRecent(evs);
    // relationship FACULTATIF (lot A ter) : on prend le plus récent qui en porte un ;
    // si aucune evidence n'en déclare, le signal n'en invente aucun (absent = non précisé).
    const withRel = evs.filter((e) => e.relationship !== undefined);
    const relationship = withRel.length > 0 ? mostRecent(withRel).relationship : undefined;
    return {
      ...baseFrom(scope, evs, strengthInputs(evs), { supportingFacts: opts.supportingFacts }),
      family: 'INTEREST',
      subject: subject as SubjectId,
      subjectLabel: latest.subjectLabel,
      ...(relationship ? { relationship } : {}),
      ...(latest.parent_domain ? { parent_domain: latest.parent_domain } : {}),
    };
  });
}

/* ── Polarité ENTITY (POINT D'ARRÊT 3, arbitré) ──
 * AFFECTIVE = valence (LOVE, LIKE, DISLIKE). AVOID est COMPORTEMENTAL (pas affectif).
 * NEUTRAL = valence la plus faible, jamais une position contraire : elle est SUPPLANTÉE,
 * jamais contredite (3.1). Contradiction réelle = positive {LOVE,LIKE} + DISLIKE (3.2).
 * LOVE/LIKE + AVOID = tension structurante (§20.4/R18), JAMAIS contradiction — surfacée
 * par hasActiveAvoidance (3.2/3.3). WANT_TO_* + DISLIKE : pas de contradiction automatique.
 */
const ENTITY_AFFECTIVE: readonly EntityRelation[] = ['LOVE', 'LIKE', 'DISLIKE'];

function entityContradiction(evs: readonly EntityEvidence[]): boolean {
  const hasPositive = evs.some((e) => e.relation === 'LOVE' || e.relation === 'LIKE');
  const hasDislike = evs.some((e) => e.relation === 'DISLIKE');
  return hasPositive && hasDislike;
}

/**
 * ENTITY — relation courante :
 *   - contradiction affective NON RÉSOLUE ({LOVE,LIKE}+DISLIKE) → la valence NÉGATIVE
 *     (DISLIKE) gagne, par PRUDENCE : recommander ce que la personne n'aime pas (cadeau
 *     raté) est plus coûteux que manquer une bonne idée. Cohérent avec severity/scope/
 *     visibilité, où le doute se tranche toujours vers le plus contraignant. Le LOVE
 *     reste dans relationHistory ; contradiction: true en fait une candidate à
 *     clarification ; dès qu'une evidence résout (correction, evidence plus forte), la
 *     consolidation normale reprend.
 *   - sinon → valence affective dominante (la plus récente parmi LOVE/LIKE/DISLIKE) ;
 *     sinon la plus récente hors NEUTRAL ; sinon NEUTRAL.
 * AVOID n'entre PAS ici : {LOVE,LIKE}+AVOID est une tension (pas une contradiction),
 * relation garde la valence affective, l'évitement est lisible via hasActiveAvoidance.
 */
export function consolidateEntities(scope: KnowledgeScope, evidences: readonly EntityEvidence[], opts: ConsolidateOpts = {}): EntitySignal[] {
  return [...groupBy(evidences, (e) => e.target_construct as string).entries()].map(([entity, evs]) => {
    // Chronologie par INSTANT, départage stable par evidence_id : relationHistory et la
    // « valence la plus récente » doivent être identiques avant écriture et après relecture.
    validerInstants(evs);
    const sorted = [...evs].sort((a, b) => {
      const d = instant(a.timestamp, a.evidence_id) - instant(b.timestamp, b.evidence_id);
      return d !== 0 ? d : (a.evidence_id < b.evidence_id ? -1 : a.evidence_id > b.evidence_id ? 1 : 0);
    });
    const contradiction = entityContradiction(evs);
    let current: EntityEvidence;
    if (contradiction) {
      // Contradiction affective : la valence négative (DISLIKE) transporte le champ unique.
      const dislikes = sorted.filter((e) => e.relation === 'DISLIKE');
      current = dislikes[dislikes.length - 1];
    } else {
      const affective = sorted.filter((e) => ENTITY_AFFECTIVE.includes(e.relation));
      const nonNeutral = sorted.filter((e) => e.relation !== 'NEUTRAL');
      const pool = affective.length ? affective : nonNeutral.length ? nonNeutral : sorted;
      current = pool[pool.length - 1];
    }
    const inputs: ScoreInputs = { ...strengthInputs(evs), contradiction };
    return {
      ...baseFrom(scope, evs, inputs, { supportingFacts: opts.supportingFacts }),
      family: 'ENTITY',
      entity: entity as EntityId,
      entityLabel: current.entityLabel,
      entityType: current.entityType,
      relation: current.relation,
      relationHistory: sorted.map((e) => ({ relation: e.relation, timestamp: e.timestamp, evidenceId: e.evidence_id })),
    };
  });
}

/**
 * Évitement actif (point d'arrêt 3, 3.3) : dérivé pur de relationHistory, aucun champ
 * stocké. LOVE + AVOID = tension structurante où relation=LOVE ; l'évitement ne doit
 * JAMAIS se perdre (perdre un AVOID = recommander ce que la personne fuit).
 */
export function hasActiveAvoidance(signal: EntitySignal): boolean {
  return signal.relationHistory.some((r) => r.relation === 'AVOID');
}

/** PREFERENCE — conserve la valeur (la plus récente supplante). */
export function consolidatePreferences(scope: KnowledgeScope, evidences: readonly PreferenceEvidence[], opts: ConsolidateOpts = {}): PreferenceSignal[] {
  return [...groupBy(evidences, (e) => e.target_construct).entries()].map(([path, evs]) => ({
    ...baseFrom(scope, evs, strengthInputs(evs), { supportingFacts: opts.supportingFacts }),
    family: 'PREFERENCE',
    path: path as PreferencePath,
    value: mostRecent(evs).preferenceValue,
  }));
}

/* ────────────────────────────────────────────────────────────────────────
 * BEHAVIOR — jamais globalisé mécaniquement (§12.5). Deux contextes ≠ contradiction (§20.6).
 * ──────────────────────────────────────────────────────────────────────── */

export function consolidateBehavior(scope: KnowledgeScope, evidences: readonly BehaviorEvidence[], opts: ConsolidateOpts = {}): BehaviorSignal[] {
  return [...groupBy(evidences, (e) => e.target_construct).entries()].map(([, evs]) => {
    const latest = mostRecent(evs);
    return {
      ...baseFrom(scope, evs, strengthInputs(evs), { allowGlobal: false, supportingFacts: opts.supportingFacts }),
      family: 'BEHAVIOR',
      behaviorContext: latest.behaviorContext,
      pattern: latest.pattern,
      globalStatus: 'LOCAL_ONLY' as const,
    };
  });
}

/* ────────────────────────────────────────────────────────────────────────
 * AFFECTION_LANGUAGE — deux vecteurs ENTIÈREMENT séparés (R5).
 * ──────────────────────────────────────────────────────────────────────── */

function buildAffectionVector(
  scope: KnowledgeScope,
  evidences: readonly AffectionEvidence[],
  direction: 'receive' | 'give',
  supportingFacts?: readonly Fact[],
): AffectionVector {
  const dirEv = evidences.filter((e) => e.direction === direction);
  const vector = {} as AffectionVector;
  for (const modality of AFFECTION_MODALITIES) {
    const code = `AFFECTION_${direction.toUpperCase()}_${modality}`;
    const evs = dirEv.filter((e) => e.target_construct === code);
    vector[modality] =
      evs.length === 0
        ? { ...emptyBase(scope), family: 'AFFECTION_LANGUAGE', direction, modality }
        : { ...baseFrom(scope, evs, strengthInputs(evs), { supportingFacts }), family: 'AFFECTION_LANGUAGE', direction, modality };
  }
  return vector;
}

export function consolidateAffection(
  scope: KnowledgeScope,
  evidences: readonly AffectionEvidence[],
  extra: { affectionCadence?: AffectionCadence; regularityImportance?: number | null; supportingFacts?: readonly Fact[] } = {},
): AffectionSignalSet {
  return {
    about: scope.about,
    ownerId: scope.ownerId,
    receive: buildAffectionVector(scope, evidences, 'receive', extra.supportingFacts),
    give: buildAffectionVector(scope, evidences, 'give', extra.supportingFacts),
    affectionCadence: extra.affectionCadence ?? 'unknown',
    regularityImportance: extra.regularityImportance ?? null,
    version: VERSION_STAMP,
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * DIVERGENCES (§20) — quatre phénomènes distincts, jamais confondus.
 * ──────────────────────────────────────────────────────────────────────── */

export type DivergenceKind =
  | 'contextual_variation'
  | 'evolution'
  | 'contradiction'
  | 'structural_tension';

export interface Divergence {
  readonly kind: DivergenceKind;
  readonly evidenceIds: string[];
  readonly note: string;
}

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

/** Tension structurante (§20.4 / R18) : deux signaux forts coexistent. Jamais moyennée. */
export interface StructuralTension {
  readonly constructs: [string, string];
  readonly signals: [Signal, Signal];
  readonly note: string;
}

export function asStructuralTension(a: Signal, b: Signal, note: string): StructuralTension {
  return { constructs: [constructIdentity(a), constructIdentity(b)], signals: [a, b], note };
}

/** Asymétrie RECEIVE/GIVE (§20.5) : information relationnelle, ni contradiction ni tension. */
export function describeAffectionAsymmetry(
  set: AffectionSignalSet,
): { receiveStrong: string[]; giveStrong: string[]; note: string } | null {
  const strong = (v: AffectionVector) =>
    AFFECTION_MODALITIES.filter((m) => v[m].score === 'high' || v[m].score === 'medium');
  const receiveStrong = strong(set.receive);
  const giveStrong = strong(set.give);
  const asymmetric =
    receiveStrong.some((m) => !giveStrong.includes(m)) || giveStrong.some((m) => !receiveStrong.includes(m));
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

export function reviseWithCorrection(prior: Signal, correction: Evidence): Signal {
  if (correction.source_type !== 'user_correction') return prior;
  const isDirectional = correction.target_family === 'PROFILE';
  const contrary = isDirectional && 'value' in correction && (correction.value as number) < 0;
  const evidenceIdsNext = [...prior.evidenceIds, correction.evidence_id];
  return {
    ...prior,
    score: contrary ? 'low' : prior.score === 'high' ? 'medium' : prior.score,
    confidence: 'low',
    contradiction: contrary ? true : prior.contradiction,
    evidenceIds: evidenceIdsNext,
    evidenceCount: evidenceIdsNext.length,
    lastUpdated: correction.timestamp,
    contexts: [...new Set([...prior.contexts, correction.context])],
  } as Signal;
}
