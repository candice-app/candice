// Sources de connaissance et traçabilité.
//
// HSG §2 (périmètre : toute source autorisée alimente le même graphe),
// §10.2 + §33 (statut de déclaration), §47 (traçabilité double sens),
// ecarts décision 5 (assertionStatus dérivé de sourceType, jamais saisi).
//
// Principe de non-perte (HSG §4) : le verbatim (questionText, answerText /
// rawText) est conservé TEL QUEL — jamais tronqué, résumé ni normalisé.

import type { Evidence } from './evidence';
import type { KnowledgeScope } from './identity';

/* ────────────────────────────────────────────────────────────────────────
 * Types de source (10 valeurs, fermé).
 * ──────────────────────────────────────────────────────────────────────── */

export const SOURCE_TYPES = [
  'onboarding_closed',
  'onboarding_open',
  'discovery_closed',
  'discovery_open',
  'conversation',
  'user_declaration',
  'user_correction',
  'wishlist',
  'reported_by_relative',
  'observed_behavior',
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  onboarding_closed: 'Réponse fermée de l’onboarding',
  onboarding_open: 'Réponse ouverte de l’onboarding',
  discovery_closed: 'Réponse fermée du Discovery',
  discovery_open: 'Réponse ouverte du Discovery',
  conversation: 'Conversation',
  user_declaration: 'Déclaration explicite de l’utilisateur',
  user_correction: 'Correction apportée par l’utilisateur',
  wishlist: 'Wishlist / Carnet d’envies',
  reported_by_relative: 'Information renseignée par un proche',
  observed_behavior: 'Comportement ou signal observé',
};

/* ────────────────────────────────────────────────────────────────────────
 * assertionStatus — DÉRIVÉ de sourceType (décision 5), jamais saisi.
 * declared | observed | reported | inferred.
 *   - 'inferred' n'est produit par AUCUNE source : c'est le statut d'une
 *     compréhension issue de la consolidation (HSG §9), pas d'un enregistrement
 *     de source. Il appartient donc au type mais n'est jamais retourné ici.
 *   - Une info 'observed' ne devient jamais 'declared'.
 * ──────────────────────────────────────────────────────────────────────── */

export const ASSERTION_STATUSES = ['declared', 'observed', 'reported', 'inferred'] as const;
export type AssertionStatus = (typeof ASSERTION_STATUSES)[number];

const ASSERTION_BY_SOURCE: Record<SourceType, Exclude<AssertionStatus, 'inferred'>> = {
  onboarding_closed: 'declared',
  onboarding_open: 'declared',
  discovery_closed: 'declared',
  discovery_open: 'declared',
  conversation: 'declared',
  user_declaration: 'declared',
  user_correction: 'declared',
  wishlist: 'declared',
  reported_by_relative: 'reported',
  observed_behavior: 'observed',
};

/** Dérive le statut d'assertion depuis le type de source (décision 5). */
export function deriveAssertionStatus(sourceType: SourceType): AssertionStatus {
  return ASSERTION_BY_SOURCE[sourceType];
}

/* ────────────────────────────────────────────────────────────────────────
 * Enregistrement d'une source.
 * Verbatim strict : questionText / answerText|rawText conservés sans retouche.
 * Traçabilité double sens : une source référence les evidences / FACT / signaux
 * qu'elle a produits (producedEvidenceIds / producedFactIds), et chaque evidence
 * référence sa source (evidence.source_id). HSG §47.
 * ──────────────────────────────────────────────────────────────────────── */

export interface SourceRecord extends KnowledgeScope {
  readonly id: string;
  readonly sourceType: SourceType;
  /** Statut dérivé (décision 5), conservé pour traçabilité. */
  readonly assertionStatus: AssertionStatus;
  /** Verbatim de la question, jamais reformulé. */
  readonly questionText: string;
  /**
   * Verbatim de la réponse / texte brut, JAMAIS tronqué/résumé/normalisé.
   * `answerText` pour une réponse structurée, `rawText` pour un texte libre.
   */
  readonly answerText?: string;
  readonly rawText?: string;
  readonly questionCode?: string;
  readonly optionRef?: string;
  readonly branchId?: string;
  readonly timestamp: string;
  /** Qui rapporte, uniquement pour reported_by_relative. */
  readonly rapporteur?: string;
  /** Traçabilité source → evidences / FACT / connaissance ouverte produits (HSG §47). */
  readonly producedEvidenceIds?: string[];
  readonly producedFactIds?: string[];
  readonly producedOpenKnowledgeIds?: string[];
}

export interface CreateSourceInput extends KnowledgeScope {
  id: string;
  sourceType: SourceType;
  questionText: string;
  answerText?: string;
  rawText?: string;
  questionCode?: string;
  optionRef?: string;
  branchId?: string;
  timestamp: string;
  rapporteur?: string;
}

/**
 * Crée un enregistrement de source. assertionStatus est TOUJOURS dérivé ici
 * (jamais passé en entrée). Le verbatim n'est pas touché.
 */
export function createSourceRecord(input: CreateSourceInput): SourceRecord {
  return {
    contactId: input.contactId,
    ownerId: input.ownerId,
    id: input.id,
    sourceType: input.sourceType,
    assertionStatus: deriveAssertionStatus(input.sourceType),
    questionText: input.questionText,
    answerText: input.answerText,
    rawText: input.rawText,
    questionCode: input.questionCode,
    optionRef: input.optionRef,
    branchId: input.branchId,
    timestamp: input.timestamp,
    rapporteur: input.rapporteur,
    producedEvidenceIds: [],
    producedFactIds: [],
    producedOpenKnowledgeIds: [],
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Câblage du LIEN INVERSE (lot A bis, section 6.3 / HSG §47).
 * Le sens aller existe depuis le lot A (evidence.source_id obligatoire) ; le sens
 * retour (source → ce qu'elle a produit) était déclaré mais jamais alimenté. Ces
 * fonctions sont immuables : elles renvoient une copie, ne mutent rien.
 * ──────────────────────────────────────────────────────────────────────── */

function addUnique(list: readonly string[] | undefined, id: string): string[] {
  const base = list ?? [];
  return base.includes(id) ? [...base] : [...base, id];
}

/** Enregistre qu'une evidence a été produite par cette source (sens retour). */
export function attachEvidenceToSource(source: SourceRecord, evidence: Evidence): SourceRecord {
  return { ...source, producedEvidenceIds: addUnique(source.producedEvidenceIds, evidence.evidence_id) };
}

/** Enregistre qu'un FACT a été produit par cette source. */
export function attachFactToSource(source: SourceRecord, factId: string): SourceRecord {
  return { ...source, producedFactIds: addUnique(source.producedFactIds, factId) };
}

/** Enregistre qu'une connaissance ouverte a été produite par cette source. */
export function attachOpenKnowledgeToSource(source: SourceRecord, openKnowledgeId: string): SourceRecord {
  return {
    ...source,
    producedOpenKnowledgeIds: addUnique(source.producedOpenKnowledgeIds, openKnowledgeId),
  };
}
