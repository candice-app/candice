// SIGNAL — état consolidé par construct (lot A bis, correction 2).
//
// Union DISCRIMINÉE par `family`, comme l'evidence : chaque membre porte exactement
// ce que sa famille exige et rien d'autre. AUCUN champ sémantique optionnel. Critère
// d'acceptation : un consommateur comprend un signal sans rouvrir une seule evidence.
//
// Invariants (lot A, conservés) :
//   - DÉFAUT = score:'unknown', confidence:'none', evidenceCount:0 (R1 : UNKNOWN ≠ LOW).
//   - AUCUN chemin ne produit score:'low' sans evidence contraire nette.
//   - globalStatus distingue GLOBAL_DIRECT / GLOBAL_CONSOLIDATED / LOCAL_ONLY (R15).
//   - AFFECTION_LANGUAGE : deux vecteurs ENTIÈREMENT séparés (R5).
//
// SignalBase porte les deux identités (contactId + ownerId), comme toute structure
// persistée (point d'arrêt 1 tranché). La clé de signal, elle, est scopée sur
// contactId SEUL (signalKey).

import type { EvidenceContext } from './evidence';
import type { KnowledgeScope, EntityId, SubjectId } from './identity';
import type {
  AffectionCadence,
  AffectionDirection,
  AffectionModality,
  BehaviorContext,
  BehaviorPattern,
  ContextCode,
  ContinuumValue,
  DriverCode,
  EntityRelation,
  EntityType,
  GuardrailCode,
  GuardrailScope,
  GuardrailSeverity,
  GuardrailVerticalPath,
  InterestParentDomain,
  InterestRelationship,
  NeedCode,
  PreferencePath,
  ProfileDirectionalCode,
  SensitivityFacet,
} from './vocabulary';
import { VERSION_STAMP, type VersionStamp } from './version';
import { DEFAULT_EXPOSABLE, type VisibilityPolicy } from './visibility';

export type SignalScore = 'high' | 'medium' | 'low' | 'unknown';
export type SignalConfidence = 'high' | 'medium' | 'low' | 'none';

/** Provenance du caractère transversal d'un signal (R15 / HSG §8.3). */
export type GlobalStatus = 'GLOBAL_DIRECT' | 'GLOBAL_CONSOLIDATED' | 'LOCAL_ONLY';

/** Stabilité consolidée (reprend l'échelle d'evidence). */
export type SignalStability = 'stable' | 'evolving' | 'contextual' | 'temporary' | 'unknown';

/** Ce que toute consolidation produit, quelle que soit la famille. */
export interface SignalBase extends KnowledgeScope {
  readonly score: SignalScore;
  readonly confidence: SignalConfidence;
  readonly evidenceCount: number;
  readonly evidenceIds: readonly string[];
  readonly contexts: readonly string[];
  readonly globalStatus: GlobalStatus;
  readonly stability: SignalStability;
  readonly lastUpdated: string | null;
  readonly contradiction?: boolean;
  readonly version: VersionStamp;
  readonly visibility: VisibilityPolicy;
}

export interface ProfileSignal extends SignalBase {
  readonly family: 'PROFILE';
  readonly construct: ProfileDirectionalCode;
  readonly facet?: SensitivityFacet;
  readonly direction: 'positive' | 'negative' | 'mixed';
}

export interface SocialEnergySignal extends SignalBase {
  readonly family: 'PROFILE';
  readonly construct: 'SOCIAL_ENERGY';
  /** Position consolidée sur le continuum 0..4. Jamais recentrée. null si inconnue. */
  readonly position: ContinuumValue | null;
}

export interface InterestSignal extends SignalBase {
  readonly family: 'INTEREST';
  readonly subject: SubjectId;
  readonly subjectLabel: string;
  readonly parent_domain?: InterestParentDomain;
  /**
   * Rapport consolidé au sujet. FACULTATIF (lot A ter) : absent = non précisé,
   * jamais inventé. Une sélection d'intérêt sans niveau n'en fabrique aucun.
   */
  readonly relationship?: InterestRelationship;
}

export interface EntitySignal extends SignalBase {
  readonly family: 'ENTITY';
  readonly entity: EntityId;
  readonly entityLabel: string;
  readonly entityType: EntityType;
  /** Relation courante. Jamais déduite d'une moyenne. */
  readonly relation: EntityRelation;
  /** Historique daté des relations observées (point d'arrêt 3). */
  readonly relationHistory: readonly {
    readonly relation: EntityRelation;
    readonly timestamp: string;
    readonly evidenceId: string;
  }[];
}

export interface PreferenceSignal extends SignalBase {
  readonly family: 'PREFERENCE';
  readonly path: PreferencePath;
  readonly value: string;
}

export interface BehaviorSignal extends SignalBase {
  readonly family: 'BEHAVIOR';
  readonly behaviorContext: BehaviorContext;
  readonly pattern: BehaviorPattern;
  /** BEHAVIOR n'est jamais globalisé mécaniquement (§12.5). */
  readonly globalStatus: 'LOCAL_ONLY';
}

export interface GuardrailSignal extends SignalBase {
  readonly family: 'GUARDRAIL';
  readonly code: GuardrailCode | GuardrailVerticalPath;
  /**
   * Le GRAIN du signal : un guardrail est consolidé par (code, context). La consolidation
   * n'élargit jamais le domaine — un HARD en restaurant ne rend pas HARD le concert. Champ
   * SCALAIRE (pas contexts[0], pas de fallback GLOBAL) : si l'invariant « un seul contexte »
   * casse, c'est un bug, pas une bascule silencieuse vers le domaine le plus large.
   */
  readonly context: EvidenceContext;
  /** La sévérité appartient à l'evidence (R20) ; la consolidée est la plus contraignante DANS le groupe. */
  readonly severity: GuardrailSeverity;
  /** Le plus restrictif PARMI les scopes observés dans le groupe — jamais une escalade. */
  readonly guardrailScope: GuardrailScope;
}

export interface NeedSignal extends SignalBase {
  readonly family: 'NEED';
  readonly construct: NeedCode;
}
export interface DriverSignal extends SignalBase {
  readonly family: 'DRIVER';
  readonly construct: DriverCode;
}
export interface ContextSignal extends SignalBase {
  readonly family: 'CONTEXT';
  readonly construct: ContextCode;
}

export interface AffectionSignal extends SignalBase {
  readonly family: 'AFFECTION_LANGUAGE';
  readonly direction: AffectionDirection;
  readonly modality: AffectionModality;
}

export type Signal =
  | ProfileSignal
  | SocialEnergySignal
  | InterestSignal
  | EntitySignal
  | PreferenceSignal
  | BehaviorSignal
  | GuardrailSignal
  | NeedSignal
  | DriverSignal
  | ContextSignal
  | AffectionSignal;

/* ────────────────────────────────────────────────────────────────────────
 * Identité du construct dans sa famille, et clé de signal.
 * ──────────────────────────────────────────────────────────────────────── */

/** Identité stable du construct au sein de sa famille (sert à signalKey). */
export function constructIdentity(s: Signal): string {
  switch (s.family) {
    case 'PROFILE':
      return 'position' in s ? 'SOCIAL_ENERGY' : s.facet ? `${s.construct}.${s.facet}` : s.construct;
    case 'INTEREST':
      return s.subject;
    case 'ENTITY':
      return s.entity;
    case 'PREFERENCE':
      return s.path;
    case 'BEHAVIOR':
      return `${s.behaviorContext}:${s.pattern}`;
    case 'GUARDRAIL':
      return `${s.code}@${s.context}`; // grain (code, context) — jamais élargi
    case 'AFFECTION_LANGUAGE':
      return `${s.direction}:${s.modality}`;
    case 'NEED':
    case 'DRIVER':
    case 'CONTEXT':
      return s.construct;
  }
}

/**
 * Clé stable d'un signal : contactId :: family :: identité du construct.
 * Scopée sur contactId SEUL (point d'arrêt 1 tranché). Déterministe et stable au
 * recalcul : deux consolidations du même journal produisent la même clé.
 */
export function signalKey(contactId: KnowledgeScope['contactId'], s: Signal): string {
  return `${contactId}::${s.family}::${constructIdentity(s)}`;
}

/* ────────────────────────────────────────────────────────────────────────
 * Base commune par défaut (UNKNOWN, pas LOW) — réutilisée par chaque famille.
 * ──────────────────────────────────────────────────────────────────────── */

/** Champs SignalBase d'un construct jamais renseigné. */
export function emptyBase(scope: KnowledgeScope): SignalBase {
  return {
    contactId: scope.contactId,
    ownerId: scope.ownerId,
    score: 'unknown',
    confidence: 'none',
    evidenceCount: 0,
    evidenceIds: [],
    contexts: [],
    globalStatus: 'LOCAL_ONLY',
    stability: 'unknown',
    lastUpdated: null,
    version: VERSION_STAMP,
    visibility: DEFAULT_EXPOSABLE,
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * AFFECTION_LANGUAGE — deux vecteurs entièrement séparés (R5, inchangé lot A).
 * ──────────────────────────────────────────────────────────────────────── */

/** Un vecteur affectif = un AffectionSignal par modalité. */
export type AffectionVector = Record<AffectionModality, AffectionSignal>;

export interface AffectionSignalSet extends KnowledgeScope {
  /** Vecteur RECEIVE, jamais déduit de GIVE (R5). */
  readonly receive: AffectionVector;
  /** Vecteur GIVE, jamais déduit de RECEIVE (R5). */
  readonly give: AffectionVector;
  /** Cadence conservée à part de la modalité (Dictionnaire §4.5). */
  readonly affectionCadence: AffectionCadence;
  /** Importance de la régularité (0–4), à part. */
  readonly regularityImportance: number | null;
  /** Versions sous lesquelles cet ensemble consolidé a été produit. */
  readonly version: VersionStamp;
}
