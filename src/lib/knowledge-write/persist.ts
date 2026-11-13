// Couche d'écriture — persistance Supabase (lot B, bloc 1 ; recâblée sur persist_journal au lot RECÂBLAGE).
//
// Mince par construction : la valeur est dans rows.ts (mapping pur, testé). Ici on écrit en UN SEUL
// COMMIT, via la RPC `persist_journal` (migrations 99/103) : les 4 inserts (source → evidences → facts →
// open) dans la transaction de la fonction. Atomicité — toute erreur annule l'ensemble, jamais d'evidence
// orpheline de source. Le MAPPING CANONIQUE reste ICI ; la RPC n'est qu'un persisteur qui reçoit du JSONB,
// FORCE user_id = auth.uid(), déduplique par ON CONFLICT (id) DO NOTHING, et renvoie le décompte réel.
//
// UN SEUL CHEMIN D'ÉCRITURE (invariant B) : aucun .insert()/.upsert()/.update()/.delete() PostgREST sur les
// quatre tables du journal ici ni ailleurs dans src/ (seul `supersede.ts` écrit encore, et uniquement le
// marqueur superseded_at/superseded_by — sa mise sous RPC atomique est le lot suivant).
//
// ABOUT INDIVERGEABLE (arbitrage) : les colonnes about_kind/about_id des tables filles sont un SECOND
// emplacement de la même propriété. La persistance les DÉRIVE de la source (seule à porter l'about de
// référence) et écrase ce que porterait la structure fille. La FK composite l'impose aussi en base.

import type { Evidence, Fact, OpenKnowledge, SourceRecord } from '../knowledge';
import { attachEvidenceToSource } from '../knowledge';
import { evidenceToRow, factToRow, openKnowledgeToRow, sourceToRow } from './rows';

/** Client minimal attendu (permet un faux client en test). persistKnowledge n'écrit QUE par la RPC. */
export interface WriteClient {
  rpc(fn: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>;
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

/** Issue d'une écriture : du contenu a été réellement posé, ou tout a été absorbé (rejeu idempotent). */
export type PersistOutcome = 'written' | 'replayed';

const COUNT_KEYS = ['sources', 'evidences', 'facts', 'open'] as const;

/**
 * Écrit une source et tout ce qu'elle a produit en UN SEUL COMMIT (persist_journal). Renvoie 'written' si au
 * moins une ligne a été posée, 'replayed' si tout a été absorbé par ON CONFLICT (rejeu idempotent, journalisé).
 * PRÉ-VOL (identité seule) : source présente + id ; chaque enfant rattaché à CETTE source. Zéro enfant → passe.
 * Aucune dégradation : si la RPC lève, on propage — jamais de repli PostgREST, jamais d'avalement d'erreur.
 */
export async function persistKnowledge(client: WriteClient, payload: KnowledgePayload): Promise<PersistOutcome> {
  // PRÉ-VOL — IDENTITÉ SEULE (défense en profondeur, EN PLUS de la garde interne de persist_journal).
  if (!payload.source?.id) throw new PersistError('persist_journal: source absente ou sans id');
  const sourceId = payload.source.id;
  const about = payload.source.about;
  for (const e of payload.evidences ?? []) {
    if (e.source_id !== sourceId) throw new PersistError(`evidence ${e.evidence_id} : source_id ${e.source_id} ≠ source ${sourceId}`);
  }
  for (const f of payload.facts ?? []) {
    if (f.source !== sourceId) throw new PersistError(`fact ${f.fact_id} : source ${f.source} ≠ source ${sourceId}`);
  }
  for (const k of payload.openKnowledge ?? []) {
    if (k.source !== sourceId) throw new PersistError(`openKnowledge ${k.open_knowledge_id} : source ${k.source} ≠ source ${sourceId}`);
  }

  // INSTANT INDIVERGEABLE (arbitrage du 12/11) : `knowledge_sources.ts` est l'instant de
  // référence de TOUTES les preuves de cette source. `Evidence.timestamp` n'a pas de colonne —
  // il est DÉRIVÉ en mémoire et reconstruit depuis la source à la relecture. Une preuve dont
  // l'instant diffère réellement de celui de sa source produirait donc des signaux différents
  // avant écriture et après relecture : on refuse AVANT la RPC, jamais après.
  // On compare les INSTANTS, pas les chaînes : deux écritures équivalentes du même horodatage
  // (avec ou sans millisecondes, autre décalage) sont acceptées.
  const instantSource = Date.parse(payload.source.timestamp);
  if (Number.isNaN(instantSource)) {
    throw new PersistError(`persist_journal: instant de source illisible (${payload.source.timestamp})`);
  }
  for (const e of payload.evidences ?? []) {
    const instant = Date.parse(e.timestamp);
    if (Number.isNaN(instant)) {
      throw new PersistError(`evidence ${e.evidence_id} : instant illisible (${e.timestamp})`);
    }
    if (instant !== instantSource) {
      throw new PersistError(
        `evidence ${e.evidence_id} : instant ${e.timestamp} ≠ instant de sa source ${payload.source.timestamp} — ` +
        `la base ne stocke que celui de la source, l'écart serait perdu à la relecture`,
      );
    }
  }

  // UN SEUL APPEL. Toujours les 4 paramètres (tableaux vides si rien : jsonb_populate_recordset sur '[]' n'écrit rien).
  const { data, error } = await client.rpc('persist_journal', {
    p_source: sourceToRow(payload.source),
    p_evidences: (payload.evidences ?? []).map((e) => evidenceToRow(e, about)),
    p_facts: (payload.facts ?? []).map((f) => factToRow(f, sourceId, about)),
    p_open: (payload.openKnowledge ?? []).map((k) => openKnowledgeToRow(k, about)),
  });
  if (error) throw new PersistError(`persist_journal: ${error.message}`);

  // VALIDATION DU RETOUR AVANT LECTURE. Objet à 4 clés numériques. Une clé manquante ou non numérique LÈVE :
  // elle ne doit JAMAIS être lue comme falsy (une écriture réelle rapportée en rejeu). 0 étant falsy, on compare
  // explicitement (> 0 / === 0) et jamais par test de véracité.
  if (data === null || typeof data !== 'object') {
    throw new PersistError(`persist_journal: retour absent ou non-objet (${JSON.stringify(data)})`);
  }
  let total = 0;
  for (const key of COUNT_KEYS) {
    const v = (data as Record<string, unknown>)[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw new PersistError(`persist_journal: clé « ${key} » absente ou non numérique dans le retour (${JSON.stringify(data)})`);
    }
    total += v;
  }
  if (total > 0) return 'written';
  // total === 0 : rejeu idempotent. Journalisé DISTINCTEMENT d'une écriture — ni erreur, ni succès muet.
  console.info(`[persistKnowledge] REJOUÉ (idempotent) : persist_journal a tout absorbé par ON CONFLICT (0 ligne), source ${sourceId}`);
  return 'replayed';
}

/**
 * Lien inverse DÉRIVÉ (HSG §47) : les evidences d'une source, par source_id (FK, jamais divergente).
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
