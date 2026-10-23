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
  'declared_via_relative', // mode « côte à côte » (sous-bloc 2) — voir MODE2_SOURCE_TYPE
  'observed_behavior',
  'extraction_inferred', // niveau 5 : inférence IA depuis un texte libre (hsg §48bis) — toujours < déclaré
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

/**
 * Mode « côte à côte » (sous-bloc 2) : le proche répond À VOIX HAUTE, le pilote SAISIT, le proche
 * n'a pas de compte. Sujet = contact (hérité de l'incognito) ; base épistémique = self_report
 * (hérité du direct : c'est le proche qui parle de LUI, seule la frappe est médiée). Il fallait donc
 * une 3e valeur de sourceType : 'declared' effacerait la médiation de la saisie, 'reported_by_relative'
 * ferait passer une déclaration de soi pour une observation de tiers. ASSERTION_BY_SOURCE en dérive
 * 'explicit'·self_report, SANS plafond de strength (le plafond moderate ne vise que
 * reporter_interpretation, cf. R-I1). Le producteur du mode 2 = le producteur SELF (produceFromOption,
 * qui force déjà assertionBasis='self_report') appelé avec about=contact:proche + ce sourceType.
 *
 * ⚠ NOM EN ATTENTE D'ARBITRAGE ÉDITORIAL — RÉVERSIBLE : un renommage ne touche QUE ce fichier
 * (le littéral dans SOURCE_TYPES, SOURCE_TYPE_LABELS, ASSERTION_BY_SOURCE, le case de isSelfDeclaredAct)
 * et cette constante. Le code applicatif (UI/producteur du mode 2) ne référence QUE ce symbole.
 */
export const MODE2_SOURCE_TYPE: SourceType = 'declared_via_relative';

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
  declared_via_relative: 'Déclaration du proche saisie par le pilote (côte à côte)', // descripteur interne, pas une copy UI
  observed_behavior: 'Comportement ou signal observé',
  extraction_inferred: 'Inférence IA depuis une réponse libre (niveau 5)',
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

/* ────────────────────────────────────────────────────────────────────────
 * assertionBasis — 3e axe (incognito §2) : SUR QUOI repose l'affirmation de celui qui parle.
 * Quatre valeurs, AUCUNE optionalité, AUCUN défaut. Dérivé du mapping à la production (déclaré
 * question par question), jamais saisi, jamais défailli — même discipline que `about`. N'entre
 * NI dans la clé-cible de l'evidence_id, NI dans signalKey (deux bases du même construct
 * consolident ensemble : leur convergence est précisément informative). Vocabulaire FERMÉ
 * (contrairement aux contextes) → CHECK en base (migration 86).
 *   self_report            : le sujet parle de lui-même (seule valeur du mode self)
 *   observed               : le pilote a vu
 *   subject_statement      : le pilote rapporte un propos du sujet
 *   reporter_interpretation: le pilote conclut (plafonne la strength à 'moderate', R-I1)
 * ──────────────────────────────────────────────────────────────────────── */
export const ASSERTION_BASES = ['self_report', 'observed', 'subject_statement', 'reporter_interpretation'] as const;
export type AssertionBasis = (typeof ASSERTION_BASES)[number];

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
  declared_via_relative: 'explicit', // mode 2 : mapping direct d'une réponse du proche
  observed_behavior: 'explicit',
  extraction_inferred: 'inferred', // niveau 5 : jamais promu au rang d'une déclaration
};

/** Statut d'assertion d'un mapping direct (producteur actuel) — 'explicit' pour tout
 *  sourceType. L'extraction (future) posera 'inferred' à son propre site, pas ici. */
export function deriveAssertionStatus(sourceType: SourceType): AssertionStatus {
  return ASSERTION_BY_SOURCE[sourceType];
}

/**
 * NIVEAU DE PROVENANCE (hsg §48bis) — échelle à 6 niveaux, du plus fort (1) au plus faible (6).
 * Keyé sur (sourceType, assertionBasis) : le 1 vs 2 vient du sourceType, le 3 vs 4 de l'assertionBasis
 * (observé vs interprété). L'EXTRACTION est une inférence IA = niveau 5, TOUJOURS sous une déclaration.
 * ⚠ Ne jamais confondre deux niveaux : une inférence ne monte jamais au rang d'une déclaration, quelles
 * que soient les dates. `user_correction` est un ACTE, pas un niveau ; il vaut 1 (déclaration explicite).
 */
export function provenanceLevel(sourceType: SourceType, basis: AssertionBasis): number {
  // Keyé D'ABORD sur la BASE (sur quoi repose l'affirmation), puis sur le sourceType. Ainsi une
  // user_correction sur UN PROCHE (base observed/reporter_interpretation) est un niveau 3/4, pas 1 —
  // ce n'est pas une déclaration du sujet, c'est l'observation/interprétation du pilote.
  if (sourceType === 'extraction_inferred') return 5;             // inférence IA (la base est self_report mais l'acte est une inférence)
  if (basis === 'reporter_interpretation') return 4;             // le pilote conclut
  if (basis === 'observed') return 3;                            // le pilote a vu
  if (sourceType === 'declared_via_relative') return 2;          // côte à côte : le proche parle de lui, saisi par le pilote
  return 1;                                                       // déclaration directe du sujet sur lui-même (self_report/subject_statement)
}

/**
 * Acte d'acquisition « déclaratif de soi » : la personne décrite s'exprime elle-même,
 * ni rapportée par un tiers, ni simplement observée. C'est la distinction que portait
 * l'ancienne valeur d'assertion 'declared' ; elle vit désormais sur l'axe SOURCETYPE
 * (l'acte d'acquisition), pas sur assertionStatus (le mécanisme producteur). Le score de
 * consolidation s'en sert (un strong primary déclaré-de-soi pèse plus) — comportement
 * inchangé par la bascule explicit|inferred.
 *
 * LISTE BLANCHE EXHAUSTIVE, jamais par exclusion : un `default` permissif ferait entrer
 * tout sourceType futur (l'incognito « le pilote suppose pour son proche ») dans le bonus
 * en silence — le `?? 'GLOBAL'` sous une autre forme. Le `never` force une décision
 * EXPLICITE à chaque nouveau type : l'ajout ne compile pas tant qu'il n'a pas de case, et
 * à l'exécution un type non décidé jette (aucune valeur par défaut).
 *
 * NB : dépend du source_type de la SOURCE. La consolidation depuis la base doit le charger
 * depuis knowledge_sources (jointure), jamais le deviner (source_type n'est pas sur les filles).
 */
export function isSelfDeclaredAct(sourceType: SourceType): boolean {
  switch (sourceType) {
    case 'onboarding_closed':
    case 'onboarding_open':
    case 'discovery_closed':
    case 'discovery_open':
    case 'conversation':
    case 'user_declaration':
    case 'user_correction':
    case 'wishlist':
    case 'declared_via_relative': // mode côte à côte : le proche parle de LUI (seule la frappe est médiée)
      return true; // la personne décrite s'exprime elle-même
    case 'reported_by_relative': // un tiers rapporte → PAS déclaré de soi
    case 'observed_behavior': // observé, non déclaré
    case 'extraction_inferred': // inférence IA (niveau 5) → PAS déclaré de soi
      return false;
    default: {
      const _exhaustive: never = sourceType;
      throw new Error(`isSelfDeclaredAct: sourceType sans décision explicite : ${String(_exhaustive)}`);
    }
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * RESPONDENT (3e rôle de provenance, sous-bloc 2) — DÉRIVÉ, jamais stocké.
 *
 * Trois rôles d'une evidence : subject (la personne concernée, portée par about),
 * entered_by (qui a saisi, porté par user_id), respondent (qui a FORMULÉ la réponse).
 * Le respondent n'est JAMAIS un tiers distinct : il est soit le subject, soit celui qui
 * saisit. Il se dérive donc de la base épistémique, sans colonne (une colonne dupliquerait
 * une info déjà portée et divergerait le jour où une assertion_basis est corrigée).
 *
 * Règle (écrite aussi dans docs/ontologie/hsg-architecture.md, autorité) :
 *   self_report | subject_statement → 'subject'   (le sujet a formulé, directement ou rapporté)
 *   observed | reporter_interpretation → 'reporter' (celui qui saisit a formulé)
 *
 * UNE SEULE fonction, utilisée partout — jamais réécrite au point de lecture (sinon divergence).
 * Liste blanche exhaustive + never, comme isSelfDeclaredAct.
 * ──────────────────────────────────────────────────────────────────────── */
export type RespondentRole = 'subject' | 'reporter';

export function deriveRespondentRole(basis: AssertionBasis): RespondentRole {
  switch (basis) {
    case 'self_report': // le sujet parle de lui (mode 1, et mode 2 : réponse orale du proche saisie)
    case 'subject_statement': // le pilote rapporte un propos explicite du sujet
      return 'subject';
    case 'observed': // le pilote a vu
    case 'reporter_interpretation': // le pilote conclut
      return 'reporter';
    default: {
      const _exhaustive: never = basis;
      throw new Error(`deriveRespondentRole: assertionBasis sans décision explicite : ${String(_exhaustive)}`);
    }
  }
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
