// Feature-flags du lot B (banque unique). OFF par défaut : sans la variable, parcours legacy
// inchangé. Allumé via env (NEXT_PUBLIC_*). Retour arrière = retirer la variable.

export const socleCanonicalQ2 = process.env.NEXT_PUBLIC_SOCLE_CANONICAL_Q2 === '1';
