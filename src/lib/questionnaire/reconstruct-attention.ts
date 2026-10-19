// RECONSTRUCTION de attention_reception / attention_expression DEPUIS LE JOURNAL SEUL (hsg §47ter).
// C'est ce qui fait du journal l'AUTORITÉ : si le vecteur n'est pas dérivable du journal, le journal
// n'est qu'un second log. Chaque evidence du domaine attention porte `dims` (sémantique) + `rank`
// (ordre de sélection) ; sa source porte `question_code`. On regroupe par face/question, on ordonne
// par rang, et on rejoue le scoring conservé (§47bis.3) — qui n'est plus alimenté par les réponses
// brutes mais par le journal.

import { scoreAttention, type AttentionDim, type AttentionResult } from '../attention/scoring';

/** Un fragment du journal : une evidence d'attention + le questionCode de sa source. */
export interface AttentionJournalItem {
  readonly questionCode: string; // q1 | q2 | q4 (reçues) | qe (donnée)
  readonly dims: readonly string[]; // dimensions affectives de l'option
  readonly rank: number; // ordre de sélection 1..3
}

const RECEPTION_QC = new Set(['q1', 'q2', 'q4']);

/** Reconstruit {reception, expression} depuis des fragments de journal. Dé-doublonne par
 *  (questionCode, rank) : plusieurs evidences d'une même option-réponse portent les mêmes dims/rang. */
export function reconstructAttentionVectors(items: readonly AttentionJournalItem[]): AttentionResult {
  const faces = { reception: new Map<string, Map<number, string[]>>(), expression: new Map<string, Map<number, string[]>>() };
  for (const it of items) {
    const face = RECEPTION_QC.has(it.questionCode) ? faces.reception : faces.expression;
    const q = face.get(it.questionCode) ?? new Map<number, string[]>();
    q.set(it.rank, [...it.dims]); // (questionCode, rank) unique → dims de l'option à ce rang
    face.set(it.questionCode, q);
  }
  const toQuestions = (face: Map<string, Map<number, string[]>>): AttentionDim[][][] =>
    [...face.values()].map((byRank) =>
      [...byRank.entries()].sort((a, b) => a[0] - b[0]).map(([, dims]) => dims as AttentionDim[]),
    );
  return scoreAttention({ reception: toQuestions(faces.reception), expression: toQuestions(faces.expression) });
}
