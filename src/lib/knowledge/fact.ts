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
import { JOURNAL_VERSION_STAMP, type JournalVersionStamp } from './version';

/** Confiance portée par un FACT. */
export type FactConfidence = 'high' | 'medium' | 'low';

/**
 * Sensibilité d'un FACT. `usableInVisibleRationale: false` signale explicitement
 * qu'un fait sensible ne doit pas apparaître dans une justification visible
 * (HSG §35/§48). Le drapeau est optionnel mais, lorsqu'il est à false, il est
 * contraignant pour toute surface de restitution.
 */
export interface FactSensitivity {
  readonly isSensitive: boolean;
  /** Catégorie libre (santé, handicap, neurodivergence, religion, deuil…). */
  readonly category?: string;
  /** Drapeau explicite : utilisable dans une justification visible ? */
  readonly usableInVisibleRationale?: false | boolean;
}

export interface Fact {
  readonly fact_id: string;
  readonly fact_type: string;
  readonly value: string;
  /** Id de la source (verbatim conservé côté SourceRecord). */
  readonly source: string;
  readonly timestamp: string;
  readonly context?: string;
  readonly confidence: FactConfidence;
  readonly sensitivity?: FactSensitivity;
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

export interface CreateFactInput {
  fact_id: string;
  fact_type: string;
  value: string;
  source: string;
  timestamp: string;
  confidence: FactConfidence;
  context?: string;
  sensitivity?: FactSensitivity;
  user_confirmed?: boolean;
  assertionStatus?: AssertionStatus;
  subject?: string;
  relation?: string;
  effect?: string;
}

export function createFact(input: CreateFactInput): Fact {
  return {
    fact_id: input.fact_id,
    fact_type: input.fact_type,
    value: input.value,
    source: input.source,
    timestamp: input.timestamp,
    confidence: input.confidence,
    context: input.context,
    sensitivity: input.sensitivity,
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
