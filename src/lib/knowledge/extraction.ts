// ACTE D'EXTRACTION (lot A bis, section 6.2).
//
// Trace qu'une source a été transformée en connaissance par un modèle donné, sous
// des versions données. Plusieurs extractions peuvent porter sur une même source :
// une réponse ouverte rejouée avec un modèle plus récent produit un second
// ExtractionRecord, et les deux restent comparables — c'est ce qui permettra demain
// de distinguer « la personne a changé » de « le modèle a changé ».
//
// Structure et factory seulement. AUCUN appel à un modèle dans ce lot.

import type { EntityId, KnowledgeScope } from './identity';
import { JOURNAL_VERSION_STAMP, type JournalVersionStamp } from './version';

export interface ExtractionRecord extends KnowledgeScope {
  readonly extraction_id: string;
  readonly source_id: string;
  readonly timestamp: string;
  /** Modèle ayant produit l'extraction, et version du prompt. */
  readonly extractor: { readonly model: string; readonly promptVersion: string };
  readonly version: JournalVersionStamp;
  readonly producedFactIds: readonly string[];
  readonly producedOpenKnowledgeIds: readonly string[];
  readonly producedEvidenceIds: readonly string[];
  readonly producedEntityIds: readonly EntityId[];
}

export interface CreateExtractionInput extends KnowledgeScope {
  extraction_id: string;
  source_id: string;
  timestamp: string;
  extractor: { model: string; promptVersion: string };
  producedFactIds?: readonly string[];
  producedOpenKnowledgeIds?: readonly string[];
  producedEvidenceIds?: readonly string[];
  producedEntityIds?: readonly EntityId[];
}

export function createExtractionRecord(input: CreateExtractionInput): ExtractionRecord {
  return {
    about: input.about,
    ownerId: input.ownerId,
    extraction_id: input.extraction_id,
    source_id: input.source_id,
    timestamp: input.timestamp,
    extractor: { model: input.extractor.model, promptVersion: input.extractor.promptVersion },
    version: JOURNAL_VERSION_STAMP,
    producedFactIds: input.producedFactIds ?? [],
    producedOpenKnowledgeIds: input.producedOpenKnowledgeIds ?? [],
    producedEvidenceIds: input.producedEvidenceIds ?? [],
    producedEntityIds: input.producedEntityIds ?? [],
  };
}
