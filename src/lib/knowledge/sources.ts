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
 * assertionStatus — DEUX AXES ORTHOGONAUX (arbitrage lot B), jamais saisi :
 *   - sourceType      : l'ACTE D'ACQUISITION (qui a parlé, comment c'est arrivé).
 *   - assertionStatus : le MÉCANISME PRODUCTEUR. explicit | inferred.
 *        · mapping direct d'une réponse        → 'explicit'
 *        · moteur d'extraction (à venir)       → 'inferred'
 * Les deux restent dérivés par le code producteur, jamais saisis par l'humain.
 *
 * L'ancien declared | observed | reported est supprimé : il redoublait le sourceType
 * (qui porte déjà « rapporté par un proche », « observé »…) sans rien ajouter, tandis que
 * la dimension critique — humain-affirmé vs Candice-inféré — manquait. L'acte d'acquisition
 * reste lisible via knowledge_sources.source_type (jointure ; source_type n'est pas recopié
 * sur les tables filles — perte nulle, jointure requise).
 *
 * 'inferred' n'a AUCUN producteur aujourd'hui : l'extraction n'existe pas encore. Les
 * producteurs actuels sont tous des mappings directs → 'explicit'. deriveAssertionStatus
 * répond donc « ce qu'un mapping direct affirme pour une source de ce type » = 'explicit' ;
 * le moteur d'extraction, lui, posera 'inferred' à son site de production (pas ici).
 * ──────────────────────────────────────────────────────────────────────── */

export const ASSERTION_STATUSES = ['explicit', 'inferred'] as const;
export type AssertionStatus = (typeof ASSERTION_STATUSES)[number];

const ASSERTION_BY_SOURCE: Record<SourceType, AssertionStatus> = {
  onboarding_closed: 'explicit',
  onboarding_open: 'explicit',
  discovery_closed: 'explicit',
  discovery_open: 'explicit',
  conversation: 'explicit',
  user_declaration: 'explicit',
  user_correction: 'explicit',
  wishlist: 'explicit',
  reported_by_relative: 'explicit',
  observed_behavior: 'explicit',
};

/** Statut d'assertion d'un mapping direct (producteur actuel) — 'explicit' pour tout
 *  sourceType. L'extraction (future) posera 'inferred' à son propre site, pas ici. */
export function deriveAssertionStatus(sourceType: SourceType): AssertionStatus {
  return ASSERTION_BY_SOURCE[sourceType];
}

/**
 * Acte d'acquisition « déclaratif de soi » : la personne décrite s'exprime elle-même,
 * ni rapportée par un tiers, ni simplement observée. C'est la distinction que portait
 * l'ancienne valeur d'assertion 'declared' ; elle vit désormais sur l'axe SOURCETYPE
 * (l'acte d'acquisition), pas sur assertionStatus (le mécanisme producteur). Le score de
 * consolidation s'en sert (un strong primary déclaré-de-soi pèse plus) — comportement
 * inchangé par la bascule explicit|inferred.
 */
export function isSelfDeclaredAct(sourceType: SourceType): boolean {
  return sourceType !== 'reported_by_relative' && sourceType !== 'observed_behavior';
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
    about: input.about,
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
