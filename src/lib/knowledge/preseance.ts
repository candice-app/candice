// PRÉSÉANCE PAR NIVEAU DE PROVENANCE (hsg §48bis) — à construct égal, le NIVEAU LE PLUS FORT gagne
// (1 > 2 > … > 6), quelles que soient les dates ; à niveau ÉGAL, la récence décide. Une evidence EXTRAITE
// (inférence IA, niveau 5) ne l'emporte JAMAIS sur une DÉCLARATION (niveau 1), même plus récente.
// C'est la résolution au read de l'échelle à 6 niveaux ; on étend l'esprit de reviseWithCorrection, on ne
// crée pas une 2ᵉ échelle.

import { provenanceLevel, type SourceType, type AssertionBasis } from './sources';

export interface ResolvableEvidence {
  readonly target_construct: string;
  readonly source_type: SourceType;
  readonly assertionBasis: AssertionBasis;
  readonly created_at: string; // ISO
}

/** Résout, par construct, l'evidence qui FAIT FOI : niveau le plus fort d'abord, récence à niveau égal. */
export function resolveByProvenance<E extends ResolvableEvidence>(evidences: readonly E[]): E[] {
  const winner = new Map<string, E>();
  for (const e of evidences) {
    const cur = winner.get(e.target_construct);
    if (!cur) { winner.set(e.target_construct, e); continue; }
    const le = provenanceLevel(e.source_type, e.assertionBasis);
    const lc = provenanceLevel(cur.source_type, cur.assertionBasis);
    if (le < lc) winner.set(e.target_construct, e);                 // niveau plus fort (chiffre plus petit) gagne
    else if (le === lc && e.created_at > cur.created_at) winner.set(e.target_construct, e); // récence à niveau égal
    // sinon : le gagnant courant reste (niveau plus fort, ou même niveau mais plus récent)
  }
  return [...winner.values()];
}
