// Couche d'écriture — persistance Supabase (lot B, bloc 1).
//
// Mince par construction : la valeur est dans rows.ts (mapping pur, testé). Ici on
// écrit dans l'ORDRE imposé — la SOURCE d'abord, les evidences ENSUITE (une evidence
// sans source résoluble est invalide ; la FK source_id l'exige de toute façon).
//
// Le lien inverse source → evidences n'est PAS stocké (pas de produced_*_ids, cf.
// migration 82 C2) : il se DÉRIVE par une requête sur source_id (evidencesForSource).
// Le producedEvidenceIds de l'objet SourceRecord du module est rempli À LA LECTURE.

import type { Evidence, Fact, OpenKnowledge, SourceRecord } from '../knowledge';
import { attachEvidenceToSource } from '../knowledge';
import {
  evidenceToRow,
  factToRow,
  openKnowledgeToRow,
  sourceToRow,
  type KnowledgeEvidenceRow,
} from './rows';

/** Client minimal attendu (permet un faux client en test). */
export interface WriteClient {
  from(table: string): {
    insert(rows: unknown): Promise<{ error: { message: string } | null }>;
  };
}
export interface ReadClient {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: string): Promise<{ data: unknown[] | null; error: { message: string } | null }>;
    };
  };
}

export interface KnowledgePayload {
  readonly source: SourceRecord;
  readonly evidences?: readonly Evidence[];
  readonly facts?: readonly Fact[];
  readonly openKnowledge?: readonly OpenKnowledge[];
}

export class PersistError extends Error {}

/**
 * Écrit une source et tout ce qu'elle a produit, DANS L'ORDRE : source d'abord.
 * Chaque evidence/fact/openKnowledge référence `source.id` INCHANGÉ (jamais régénéré).
 * S'arrête à la première erreur (pas d'evidence orpheline de source).
 */
export async function persistKnowledge(client: WriteClient, payload: KnowledgePayload): Promise<void> {
  const srcErr = (await client.from('knowledge_sources').insert(sourceToRow(payload.source))).error;
  if (srcErr) throw new PersistError(`knowledge_sources: ${srcErr.message}`);

  if (payload.evidences && payload.evidences.length > 0) {
    // garde-fou : toute evidence pointe bien vers CETTE source (source_id identique)
    for (const e of payload.evidences) {
      if (e.source_id !== payload.source.id) {
        throw new PersistError(`evidence ${e.evidence_id} : source_id ${e.source_id} ≠ source ${payload.source.id}`);
      }
    }
    const rows: KnowledgeEvidenceRow[] = payload.evidences.map(evidenceToRow);
    const evErr = (await client.from('knowledge_evidences').insert(rows)).error;
    if (evErr) throw new PersistError(`knowledge_evidences: ${evErr.message}`);
  }

  if (payload.facts && payload.facts.length > 0) {
    const err = (await client.from('knowledge_facts').insert(payload.facts.map((f) => factToRow(f, payload.source.id)))).error;
    if (err) throw new PersistError(`knowledge_facts: ${err.message}`);
  }

  if (payload.openKnowledge && payload.openKnowledge.length > 0) {
    const err = (await client.from('knowledge_open_knowledge').insert(payload.openKnowledge.map(openKnowledgeToRow))).error;
    if (err) throw new PersistError(`knowledge_open_knowledge: ${err.message}`);
  }
}

/**
 * Lien inverse DÉRIVÉ (HSG §47) : les evidences d'une source, par source_id (FK, jamais
 * divergente). Rend aussi la SourceRecord hydratée (producedEvidenceIds rempli à la lecture).
 */
export async function evidencesForSource(
  client: ReadClient,
  sourceId: string,
): Promise<{ evidenceIds: string[] }> {
  const { data, error } = await client.from('knowledge_evidences').select('id').eq('source_id', sourceId);
  if (error) throw new PersistError(`knowledge_evidences read: ${error.message}`);
  return { evidenceIds: (data ?? []).map((r) => (r as { id: string }).id) };
}

/** Hydrate une SourceRecord avec les evidences qu'elle a produites (objet en mémoire). */
export function hydrateSource(source: SourceRecord, evidences: readonly Evidence[]): SourceRecord {
  return evidences.filter((e) => e.source_id === source.id).reduce((s, e) => attachEvidenceToSource(s, e), source);
}
