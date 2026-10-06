// FACT — couche de connaissance amont, hors familles canoniques.
//
// Dictionnaire §11, HSG §10. Un FACT conserve une proposition ayant une valeur
// sémantique propre, même quand elle ne produit aucun signal.
//
// Invariants :
//   R16  — un FACT ne disparaît JAMAIS quand un signal en est dérivé.
//   R12  — une condition sensible déclarée ne produit AUCUN trait/besoin/
//          comportement/guardrail automatiquement : aucun chemin de code ne
//          convertit un FACT sensible en PROFILE/NEED/BEHAVIOR/GUARDRAIL.
//   §11.1 — un FACT produit 0..n signaux (0 est normal).

import type { AssertionStatus } from './sources';
import type { KnowledgeScope } from './identity';
import { DEFAULT_EXPOSABLE, INTERNAL_ONLY_POLICY, type VisibilityPolicy } from './visibility';
import { JOURNAL_VERSION_STAMP, type JournalVersionStamp } from './version';

/** Confiance portée par un FACT. */
export type FactConfidence = 'high' | 'medium' | 'low';

/**
 * Sensibilité d'un FACT. Le pilotage de la restitution n'est plus porté ici :
 * `usableInVisibleRationale` est REMPLACÉ par la VisibilityPolicy du FACT (lot A bis).
 * Un FACT sensible a `visibility.derived === 'internal_only'` — le comportement du
 * HSG §35 est conservé (une contrainte de santé écarte une recommandation sans jamais
 * apparaître dans la justification visible).
 */
export interface FactSensitivity {
  readonly isSensitive: boolean;
  /** Catégorie libre (santé, handicap, neurodivergence, religion, deuil…). */
  readonly category?: string;
}

export interface Fact extends KnowledgeScope {
  readonly fact_id: string;
  readonly fact_type: string;
  readonly value: string;
  /** Id de la source (verbatim conservé côté SourceRecord). */
  readonly source: string;
  readonly timestamp: string;
  readonly context?: string;
  readonly confidence: FactConfidence;
  readonly sensitivity?: FactSensitivity;
  /** Politique de visibilité (remplace usableInVisibleRationale). Sensible → internal_only. */
  readonly visibility: VisibilityPolicy;
  /** L'utilisateur a-t-il validé explicitement cette information ? */
  readonly user_confirmed: boolean;
  /** Traçabilité FACT → evidences dérivées (peut être vide — §11.1). */
  readonly evidence_ids: string[];
  /** Statut d'assertion, pour ne jamais présenter un déclaré comme vérifié (§10.2). */
  readonly assertionStatus?: AssertionStatus;
  // Structuration optionnelle (Dictionnaire §11, exemple charge mentale).
  readonly subject?: string;
  readonly relation?: string;
  readonly effect?: string;
  /**
   * Versions sous lesquelles ce FACT a été enregistré (ontology + hsg). Comme
   * l'evidence, un FACT préexiste à la consolidation : pas de consolidation_version.
   */
  readonly version: JournalVersionStamp;
}

export interface CreateFactInput extends KnowledgeScope {
  fact_id: string;
  fact_type: string;
  value: string;
  source: string;
  timestamp: string;
  confidence: FactConfidence;
  context?: string;
  sensitivity?: FactSensitivity;
  /** Politique explicite ; sinon dérivée de la sensibilité. */
  visibility?: VisibilityPolicy;
  user_confirmed?: boolean;
  assertionStatus?: AssertionStatus;
  subject?: string;
  relation?: string;
  effect?: string;
}

export function createFact(input: CreateFactInput): Fact {
  // Un FACT sensible est internal_only (plafond) ; sinon candidat au portrait.
  const visibility: VisibilityPolicy =
    input.visibility ?? (input.sensitivity?.isSensitive ? INTERNAL_ONLY_POLICY : DEFAULT_EXPOSABLE);
  return {
    about: input.about,
    ownerId: input.ownerId,
    fact_id: input.fact_id,
    fact_type: input.fact_type,
    value: input.value,
    source: input.source,
    timestamp: input.timestamp,
    confidence: input.confidence,
    context: input.context,
    sensitivity: input.sensitivity,
    visibility,
    user_confirmed: input.user_confirmed ?? false,
    evidence_ids: [],
    assertionStatus: input.assertionStatus,
    subject: input.subject,
    relation: input.relation,
    effect: input.effect,
    version: JOURNAL_VERSION_STAMP,
  };
}

/** Un FACT est-il une condition sensible ? (Utilisé pour verrouiller R12.) */
export function isSensitiveFact(fact: Fact): boolean {
  return fact.sensitivity?.isSensitive === true;
}

/**
 * Câblage du lien inverse FACT → evidence (lot A bis, section 6.3). Immuable :
 * renvoie une copie, ne mute rien, et ne touche AUCUN verbatim (R16).
 */
export function attachEvidenceToFact(fact: Fact, evidence: { evidence_id: string }): Fact {
  if (fact.evidence_ids.includes(evidence.evidence_id)) return { ...fact };
  return { ...fact, evidence_ids: [...fact.evidence_ids, evidence.evidence_id] };
}

/**
 * Familles vers lesquelles un FACT sensible ne peut JAMAIS être converti
 * automatiquement (R12 / Dictionnaire §11.2). Exporté pour que la couche de
 * mapping puisse s'auto-contrôler : aucune de ces familles ne doit être
 * produite par inférence depuis une condition sensible déclarée.
 */
export const FAMILIES_FORBIDDEN_FROM_SENSITIVE_FACT = [
  'PROFILE',
  'NEED',
  'BEHAVIOR',
  'GUARDRAIL',
] as const;
