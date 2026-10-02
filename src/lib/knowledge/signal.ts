// SIGNAL — état consolidé par construct (dérivé des evidences).
//
// Dictionnaire §0.1 + onboarding-clos §Modèle de stockage, HSG §8.3 (globalStatus).
//
// Invariants :
//   - DÉFAUT = { score:'unknown', confidence:'none', evidenceCount:0 } (R1 : UNKNOWN ≠ LOW).
//   - AUCUN chemin ne produit score:'low' sans ≥1 evidence.
//   - globalStatus distingue GLOBAL_DIRECT / GLOBAL_CONSOLIDATED / LOCAL_ONLY (R15).
//   - AFFECTION_LANGUAGE : deux vecteurs ENTIÈREMENT séparés receive/give,
//     + affectionCadence + regularityImportance conservés à part (R5).

import type { AffectionCadence, AffectionModality } from './vocabulary';

export type SignalScore = 'high' | 'medium' | 'low' | 'unknown';
export type SignalConfidence = 'high' | 'medium' | 'low' | 'none';

/** Provenance du caractère transversal d'un signal (R15 / HSG §8.3). */
export type GlobalStatus = 'GLOBAL_DIRECT' | 'GLOBAL_CONSOLIDATED' | 'LOCAL_ONLY';

/** Stabilité consolidée (reprend l'échelle d'evidence). */
export type SignalStability = 'stable' | 'evolving' | 'contextual' | 'temporary' | 'unknown';

export interface Signal {
  readonly construct: string;
  readonly score: SignalScore;
  readonly confidence: SignalConfidence;
  readonly evidenceCount: number;
  readonly evidenceIds: string[];
  readonly contexts: string[];
  readonly globalStatus: GlobalStatus;
  readonly stability: SignalStability;
  readonly lastUpdated: string | null;
  /** Direction consolidée pour les constructs directionnels (PROFILE). */
  readonly direction?: 'positive' | 'negative' | 'mixed';
  /** Evidences contradictoires conservées comme candidates à clarification (§20.3). */
  readonly contradiction?: boolean;
}

/** État par défaut d'un construct jamais renseigné : UNKNOWN, pas LOW. */
export const DEFAULT_SIGNAL: Omit<Signal, 'construct'> = {
  score: 'unknown',
  confidence: 'none',
  evidenceCount: 0,
  evidenceIds: [],
  contexts: [],
  globalStatus: 'LOCAL_ONLY',
  stability: 'unknown',
  lastUpdated: null,
};

/** Fabrique un signal par défaut pour un construct donné. */
export function defaultSignal(construct: string): Signal {
  return { construct, ...DEFAULT_SIGNAL };
}

/* ────────────────────────────────────────────────────────────────────────
 * AFFECTION_LANGUAGE — deux vecteurs entièrement séparés.
 * ──────────────────────────────────────────────────────────────────────── */

/** Un vecteur affectif = un signal par modalité. */
export type AffectionVector = Record<AffectionModality, Signal>;

export interface AffectionSignalSet {
  /** Vecteur RECEIVE, jamais déduit de GIVE (R5). */
  readonly receive: AffectionVector;
  /** Vecteur GIVE, jamais déduit de RECEIVE (R5). */
  readonly give: AffectionVector;
  /** Cadence conservée à part de la modalité (Dictionnaire §4.5). */
  readonly affectionCadence: AffectionCadence;
  /** Importance de la régularité (0–4), à part. */
  readonly regularityImportance: number | null;
}
