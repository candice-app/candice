// PÉREMPTION PAR REQUÊTE (hsg §48septies) — fonction PURE, pas de drapeau stocké. Un texte (analyse
// profil ou fiche proche) est périmé si l'une de ses `source_evidence_ids` : a été modifiée après
// `generated_at` (journal append : une evidence du sujet plus récente), supprimée, ou n'est plus autorisée.
// Décidé À L'AFFICHAGE depuis l'état courant du journal — jamais lu d'un champ `stale` qui pourrait mentir.

export interface StoredText {
  readonly sourceEvidenceIds: readonly string[];
  readonly generatedAt: string; // ISO
}

/** État courant d'UNE evidence du sujet (lu du journal au moment de l'affichage). */
export interface CurrentEvidence {
  readonly id: string;
  readonly createdAt: string; // ISO
  readonly authorized: boolean; // visibilité/consentement courant
}

/**
 * Le texte est-il périmé ? `current` = TOUTES les evidences courantes du sujet (du journal).
 * Périmé ssi : (newer) une evidence du sujet est postérieure à generatedAt ; OU (deleted) une source
 * n'existe plus ; OU (unauthorized) une source n'est plus autorisée. Aucune mutation, aucune date système.
 */
export function isTextStale(text: StoredText, current: readonly CurrentEvidence[]): boolean {
  const byId = new Map(current.map((e) => [e.id, e]));

  // newer : une connaissance du sujet est arrivée APRÈS l'écriture du texte → texte dépassé.
  for (const e of current) if (e.createdAt > text.generatedAt) return true;

  for (const id of text.sourceEvidenceIds) {
    const e = byId.get(id);
    if (!e) return true;            // deleted : source disparue
    if (!e.authorized) return true; // unauthorized : visibilité/consentement révoqués
  }
  return false;
}
