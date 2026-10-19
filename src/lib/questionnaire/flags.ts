// Feature-flags du lot B (banque unique). OFF par défaut : sans la variable, parcours legacy
// inchangé. Allumé via env (NEXT_PUBLIC_*). Retour arrière = retirer la variable.

// Domaine ATTENTION entier (q1 classé, q2, q4, qe) rendu depuis le canonique + journal.
export const socleCanonicalAttention = process.env.NEXT_PUBLIC_SOCLE_CANONICAL_ATTENTION === '1';

// Domaine TEMPÉRAMENT (q5–q11) rendu depuis le canonique + journal + pont + respiration cumulative.
export const socleCanonicalTemperament = process.env.NEXT_PUBLIC_SOCLE_CANONICAL_TEMPERAMENT === '1';
