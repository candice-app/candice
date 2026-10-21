// RECONSTRUCTION du vecteur 7D attention_reception (perception du proche) DEPUIS LE JOURNAL about=contact.
// Réplique EXACTEMENT compute7DFromI1 : rang × modalité→dim, normalisé sur le max. Le journal porte la
// modalité (target_construct AFFECTION_RECEIVE_*) et le rang (1..3) de l'evidence AFFECTION de I1.
// Prouve que le journal est l'AUTORITÉ du 7D (pas seulement une projection écrite à côté).

import { MODALITY_TO_DIM, DIMS_7D, RANK_WEIGHTS_7D } from './canonical-incognito';

export interface AffectionRow {
  readonly target_construct: string; // AFFECTION_RECEIVE_WORDS…
  readonly direction?: string;       // receive
  readonly modality?: string;        // WORDS…
  readonly rank: number | null;      // 1..3
  readonly created_at: string;       // récence
}

/** Reconstruit le 7D normalisé depuis les evidences AFFECTION_RECEIVE du journal (récence par modalité). */
export function reconstruct7DFromJournal(rows: readonly AffectionRow[]): Record<string, number> {
  // récence : la plus récente par modalité reçue
  const latest = new Map<string, AffectionRow>();
  for (const r of rows) {
    if (r.direction !== 'receive' || !r.modality) continue;
    const prev = latest.get(r.modality);
    if (!prev || r.created_at > prev.created_at) latest.set(r.modality, r);
  }
  const raw: Record<string, number> = Object.fromEntries(DIMS_7D.map((d) => [d, 0]));
  for (const r of latest.values()) {
    const dim = MODALITY_TO_DIM[r.modality!];
    const rw = r.rank != null ? (RANK_WEIGHTS_7D[r.rank - 1] ?? 0) : 0;
    if (dim) raw[dim] += rw * 1.0;
  }
  const max = Math.max(...DIMS_7D.map((d) => raw[d]));
  const normalized: Record<string, number> = Object.fromEntries(DIMS_7D.map((d) => [d, 0]));
  if (max > 0) for (const d of DIMS_7D) normalized[d] = Math.round((raw[d] / max) * 100);
  return normalized;
}
