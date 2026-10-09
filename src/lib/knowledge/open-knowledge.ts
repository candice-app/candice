// CONNAISSANCE DESCRIPTIVE OUVERTE (lot A bis, section 6.1).
//
// Forme littérale du Dictionnaire §12 et du HSG §11, donnée à l'identique :
//   type · subject · relation · intensity · context · source
// Elle représente ce qui ne nécessite pas de construct canonique sans jamais perdre
// la formulation précise, et rend `gaps.ts` cohérent (structured_open_knowledge cesse
// de pointer vers le vide). Elle est interrogeable au même titre que les constructs
// canoniques : un concept non canonique n'est pas invisible aux analyses.
//
// Ce lot crée la structure, ses factories et ses tests. AUCUN extracteur : rien ici
// ne produit d'OpenKnowledge à partir d'un texte libre.

import type { AssertionStatus } from './sources';
import type { EvidenceConfidence, EvidenceContext } from './evidence';
import type { KnowledgeScope, SubjectId } from './identity';
import type { EvidenceStrength, OpenKnowledgeType } from './vocabulary';
import { DEFAULT_EXPOSABLE, INTERNAL_ONLY_POLICY, type VisibilityPolicy } from './visibility';
import { JOURNAL_VERSION_STAMP, type JournalVersionStamp } from './version';

// FRONTIÈRE (lot A ter) : un OpenKnowledge ne produit JAMAIS de signal. Seules les
// evidences alimentent la consolidation. `type: 'PROFILE'` ne crée pas un ProfileSignal —
// ce serait une seconde représentation parallèle des signaux HSG. On le prouve par
// l'ABSENCE de chemin : ce fichier n'importe aucune fonction de consolidation, et aucune
// fonction de consolidation n'accepte un OpenKnowledge (elles prennent des Evidence).
// Une connaissance descriptive et une evidence sur le même sujet coexistent et disent
// deux choses différentes : l'une conserve la description, l'autre porte le signal mesurable.
export interface OpenKnowledge extends KnowledgeScope {
  readonly open_knowledge_id: string;
  readonly type: OpenKnowledgeType; // qualifie la nature descriptive (recherche/routage) ; peut reprendre un nom de famille sans en faire une evidence
  readonly subject: SubjectId; // identité résolue
  readonly subjectLabel: string; // formulation verbatim, jamais écrasée
  readonly relation: string; // « passion », « collectionne », « fasciné par »
  /**
   * Intensité DÉCLARÉE du rapport au sujet — FACULTATIVE (comme InterestEvidence.relationship,
   * rendu optionnel le 6 oct pour la même raison). Absente = NON RENSEIGNÉE, jamais 'weak' :
   * l'incognito I7 constate qu'une modalité « semble faire du bien » sans dire à quel point.
   * Aucun défaut nulle part (ni ?? 'weak', ni projection qui la remplirait) — un défaut
   * silencieux fabriquerait une donnée que personne n'a énoncée (même interdit que ?? 'GLOBAL').
   * La strength (force du signal) reste portée par les evidences ; l'intensity ne s'y substitue pas.
   */
  readonly intensity?: EvidenceStrength;
  readonly context: EvidenceContext;
  readonly source: string; // source_id
  readonly timestamp: string;
  readonly confidence: EvidenceConfidence;
  readonly assertionStatus: AssertionStatus;
  readonly evidence_ids: readonly string[];
  readonly visibility: VisibilityPolicy;
  readonly version: JournalVersionStamp;
}

export interface CreateOpenKnowledgeInput extends KnowledgeScope {
  open_knowledge_id: string;
  type: OpenKnowledgeType;
  subject: SubjectId;
  subjectLabel: string;
  relation: string;
  /** Facultative — absente = non renseignée (voir OpenKnowledge.intensity). Aucun défaut. */
  intensity?: EvidenceStrength;
  context: EvidenceContext;
  source: string;
  timestamp: string;
  confidence: EvidenceConfidence;
  assertionStatus: AssertionStatus;
  evidence_ids?: readonly string[];
  /** Politique explicite ; par défaut candidate au portrait (exposable). */
  visibility?: VisibilityPolicy;
  /** Marque l'information comme sensible → politique internal_only (plafond). */
  sensitive?: boolean;
}

export function createOpenKnowledge(input: CreateOpenKnowledgeInput): OpenKnowledge {
  const visibility: VisibilityPolicy =
    input.visibility ?? (input.sensitive ? INTERNAL_ONLY_POLICY : DEFAULT_EXPOSABLE);
  return {
    about: input.about,
    ownerId: input.ownerId,
    open_knowledge_id: input.open_knowledge_id,
    type: input.type,
    subject: input.subject,
    subjectLabel: input.subjectLabel,
    relation: input.relation,
    // absence préservée telle quelle : aucune valeur de repli (I7 = intensity non renseignée)
    ...(input.intensity !== undefined ? { intensity: input.intensity } : {}),
    context: input.context,
    source: input.source,
    timestamp: input.timestamp,
    confidence: input.confidence,
    assertionStatus: input.assertionStatus,
    evidence_ids: input.evidence_ids ?? [],
    visibility,
    version: JOURNAL_VERSION_STAMP,
  };
}
