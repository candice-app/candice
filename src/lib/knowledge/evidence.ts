// EVIDENCE — unité de preuve, discriminée PAR FAMILLE (pas un objet fourre-tout).
//
// HSG §5 (structure), §5.1 (force/direction), §5.2 (stabilité), §8 (contexte),
// §17 (primary/secondary). Décisions 3 (value XOR strength), 4 (evidence_role),
// 6 (context littéral vs globalStatus du signal), 7 (guardrailScope).
//
// Invariants TYPÉS :
//   - value ∈ {-2,-1,1,2} : le type interdit 0 (0 n'est jamais une evidence),
//     SAUF SOCIAL_ENERGY (ContinuumValue 0..4 définitif, 0 = extrémité réelle).
//   - value pour les constructs DIRECTIONNELS (PROFILE + continuum),
//     strength pour les familles SANS direction — jamais les deux (décision 3).
//   - une evidence ne porte JAMAIS globalStatus (ça appartient au signal — décision 6).
//   - evidence négative seulement via mapping contraire explicite : aucun chemin
//     ne crée du négatif par absence ou symétrie (R3/R4).

import type { AssertionStatus, SourceType } from './sources';
import type { EntityId, KnowledgeScope, SubjectId } from './identity';
import { JOURNAL_VERSION_STAMP, type JournalVersionStamp } from './version';
import type {
  AffectionDirection,
  AffectionModality,
  BehaviorContext,
  BehaviorPattern,
  ContextCode,
  ContinuumValue,
  DriverCode,
  EntityRelation,
  EntityType,
  EvidenceStrength,
  EvidenceValue,
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

/** Stabilité d'une evidence (HSG §5.2). Jamais `stable` par défaut sur info récente. */
export type EvidenceStability = 'stable' | 'evolving' | 'contextual' | 'temporary';

/** Rôle de l'evidence (décision 4). `secondary` ne porte jamais seule un `high`. */
export type EvidenceRole = 'primary' | 'secondary';

/** Confiance dans l'interprétation (HSG §5.3), orthogonale à la force. */
export type EvidenceConfidence = 'high' | 'medium' | 'low';

/**
 * Contexte de l'evidence (décision 6) : le littéral `GLOBAL` ou un chemin de
 * domaine (ex. `travel.accommodation`). JAMAIS `GLOBAL_CONSOLIDATED` (c'est un
 * globalStatus de signal). Le `(string & {})` préserve l'autocomplétion de 'GLOBAL'.
 */
export type EvidenceContext = 'GLOBAL' | (string & {});

/** Champs communs à toutes les evidences. Porte les deux colonnes d'identité
 *  (about + ownerId), comme questionnaire_responses(contact_id, user_id). */
interface EvidenceBase extends KnowledgeScope {
  readonly evidence_id: string;
  readonly source_id: string;
  readonly source_type: SourceType;
  /** Information brute dont l'evidence est extraite (verbatim, jamais résumé). */
  readonly raw_information: string;
  readonly confidence: EvidenceConfidence;
  readonly context: EvidenceContext;
  readonly timestamp: string;
  readonly stability: EvidenceStability;
  readonly evidence_role: EvidenceRole;
  readonly assertionStatus?: AssertionStatus;
  readonly notes?: string;
  /** Lien vers le FACT source éventuel (le FACT ne disparaît jamais — R16). */
  readonly fact_id?: string;
  /**
   * Versions sous lesquelles cette evidence a été enregistrée (ontology + hsg).
   * PAS de consolidation_version : une evidence préexiste aux règles de
   * consolidation et n'en dépend pas.
   */
  readonly version: JournalVersionStamp;
}

/* ── PROFILE directionnel (dimensions + orientations) : value ±1/±2, pas 0 ── */
export interface ProfileEvidence extends EvidenceBase {
  readonly target_family: 'PROFILE';
  readonly target_construct: ProfileDirectionalCode;
  /** Sous-facette pour PROFILE_SENSITIVITY (sensory/aesthetic/emotional). */
  readonly facet?: SensitivityFacet;
  readonly value: EvidenceValue; // le type interdit 0
}

/* ── SOCIAL_ENERGY : continuum ordinal 0..4 (0 = recharge solitaire, extrémité) ── */
export interface SocialEnergyEvidence extends EvidenceBase {
  readonly target_family: 'PROFILE';
  readonly target_construct: 'SOCIAL_ENERGY';
  readonly value: ContinuumValue; // 0..4 définitif : 0 est une extrémité réelle, pas le milieu
}

/* ── AFFECTION_LANGUAGE : strength + direction + modality (pas de value) ── */
export interface AffectionEvidence extends EvidenceBase {
  readonly target_family: 'AFFECTION_LANGUAGE';
  readonly direction: AffectionDirection;
  readonly modality: AffectionModality;
  readonly target_construct: string; // code dérivé AFFECTION_<DIR>_<MOD>
  readonly strength: EvidenceStrength;
  /**
   * Rang DÉCLARÉ par l'utilisateur (lot A ter) — uniquement pour les questions où
   * l'écran demande explicitement un classement (Q1 : « la première compte le plus »).
   * Donnée déclarée, conservée telle quelle. La force se dérive du rang
   * (rankToAffectionStrength), mais le rang n'ordonne JAMAIS l'AffectionSignalSet.
   */
  readonly rank?: 1 | 2 | 3;
}

/* ── NEED : strength ── */
export interface NeedEvidence extends EvidenceBase {
  readonly target_family: 'NEED';
  readonly target_construct: NeedCode;
  readonly strength: EvidenceStrength;
}

/* ── DRIVER : strength ── */
export interface DriverEvidence extends EvidenceBase {
  readonly target_family: 'DRIVER';
  readonly target_construct: DriverCode;
  readonly strength: EvidenceStrength;
}

/* ── BEHAVIOR : strength + pattern + trigger? (context = contexte comportemental) ── */
export interface BehaviorEvidence extends EvidenceBase {
  readonly target_family: 'BEHAVIOR';
  readonly behaviorContext: BehaviorContext;
  readonly pattern: BehaviorPattern;
  readonly target_construct: string; // behaviorContext:pattern
  readonly strength: EvidenceStrength;
  readonly trigger?: string;
}

/* ── GUARDRAIL : strength + severity + guardrailScope (décision 7) ── */
export interface GuardrailEvidence extends EvidenceBase {
  readonly target_family: 'GUARDRAIL';
  /** Code canonique OU chemin vertical (food.allergy.* …). */
  readonly target_construct: GuardrailCode | GuardrailVerticalPath;
  readonly severity: GuardrailSeverity;
  readonly guardrailScope: GuardrailScope;
  readonly strength: EvidenceStrength;
  readonly trigger?: string;
}

/* ── INTEREST : strength + subject (identité résolue) + relationship ── */
export interface InterestEvidence extends EvidenceBase {
  readonly target_family: 'INTEREST';
  /** Identité conceptuelle résolue (namespace subject). */
  readonly subject: SubjectId;
  /** Formulation verbatim de CETTE evidence, jamais écrasée par la résolution. */
  readonly subjectLabel: string;
  readonly parent_domain?: InterestParentDomain;
  /**
   * Intensité du rapport au sujet (lot A ter). FACULTATIF : absent = NON PRÉCISÉ,
   * jamais « faible ». Le radar d'intérêts produit une sélection sans niveau ;
   * aucun chemin ne remplit ce champ par défaut (surtout pas `casual`) — R1/R2.
   */
  readonly relationship?: InterestRelationship;
  readonly target_construct: SubjectId; // = subject
  readonly strength: EvidenceStrength;
}

/* ── ENTITY : strength + entity_id (identité résolue) + relation ── */
export interface EntityEvidence extends EvidenceBase {
  readonly target_family: 'ENTITY';
  /** Identité d'entité résolue (namespace entity). */
  readonly entity_id: EntityId;
  /** Formulation verbatim de CETTE evidence, jamais écrasée par la résolution. */
  readonly entityLabel: string;
  readonly entityType: EntityType;
  readonly relation: EntityRelation;
  readonly target_construct: EntityId; // = entity_id
  readonly strength: EvidenceStrength;
}

/* ── CONTEXT : strength ── */
export interface ContextEvidence extends EvidenceBase {
  readonly target_family: 'CONTEXT';
  readonly target_construct: ContextCode;
  readonly strength: EvidenceStrength;
}

/* ── PREFERENCE : strength + chemin PREFERENCE.[context].[attribute]=value ── */
export interface PreferenceEvidence extends EvidenceBase {
  readonly target_family: 'PREFERENCE';
  readonly target_construct: PreferencePath;
  readonly preferenceValue: string;
  readonly strength: EvidenceStrength;
}

/** Union discriminée de toutes les evidences (par `target_family` / `target_construct`). */
export type Evidence =
  | ProfileEvidence
  | SocialEnergyEvidence
  | AffectionEvidence
  | NeedEvidence
  | DriverEvidence
  | BehaviorEvidence
  | GuardrailEvidence
  | InterestEvidence
  | EntityEvidence
  | ContextEvidence
  | PreferenceEvidence;

/** Evidence directionnelle = porte `value` (PROFILE + continuum). */
export type DirectionalEvidence = ProfileEvidence | SocialEnergyEvidence;

export function isDirectionalEvidence(e: Evidence): e is DirectionalEvidence {
  return e.target_family === 'PROFILE';
}

/* ────────────────────────────────────────────────────────────────────────
 * Factories avec garde-fous d'invariants (testables).
 * ──────────────────────────────────────────────────────────────────────── */

export interface ProfileEvidenceInput extends Omit<ProfileEvidence, 'target_family' | 'version'> {
  /**
   * Doit être `true` lorsque `value < 0` : une evidence négative n'existe que
   * sur une formulation réellement contraire (R3). Sans ce drapeau explicite,
   * toute tentative de valeur négative échoue — aucun négatif par défaut/symétrie.
   */
  contraryMapping?: boolean;
}

/**
 * Crée une evidence PROFILE directionnelle.
 * - Rejette value 0 (interdit par le type, verrouillé aussi à l'exécution).
 * - Rejette toute value < 0 sans `contraryMapping: true` (R3/R4).
 */
export function createProfileEvidence(input: ProfileEvidenceInput): ProfileEvidence {
  if ((input.value as number) === 0) {
    throw new Error(
      `[knowledge] value 0 interdite pour ${input.target_construct} (0 n'est jamais une evidence — HSG §5.1).`,
    );
  }
  if (input.value < 0 && input.contraryMapping !== true) {
    throw new Error(
      `[knowledge] evidence négative sur ${input.target_construct} sans mapping contraire explicite (R3/R4).`,
    );
  }
  const { contraryMapping: _ignored, ...rest } = input;
  void _ignored;
  return { ...rest, target_family: 'PROFILE', version: JOURNAL_VERSION_STAMP };
}

/** Crée une evidence SOCIAL_ENERGY (continuum 0..4). */
export function createSocialEnergyEvidence(
  input: Omit<SocialEnergyEvidence, 'target_family' | 'target_construct' | 'version'>,
): SocialEnergyEvidence {
  return {
    ...input,
    target_family: 'PROFILE',
    target_construct: 'SOCIAL_ENERGY',
    version: JOURNAL_VERSION_STAMP,
  };
}
