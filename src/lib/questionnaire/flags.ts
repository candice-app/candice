// Feature-flags du lot B (banque unique). OFF par défaut : sans la variable, parcours legacy
// inchangé. Allumé via env (NEXT_PUBLIC_*). Retour arrière = retirer la variable.

// Domaine ATTENTION entier (q1 classé, q2, q4, qe) rendu depuis le canonique + journal.
export const socleCanonicalAttention = process.env.NEXT_PUBLIC_SOCLE_CANONICAL_ATTENTION === '1';

// Domaine TEMPÉRAMENT (q5–q11) rendu depuis le canonique + journal + pont + respiration cumulative.
export const socleCanonicalTemperament = process.env.NEXT_PUBLIC_SOCLE_CANONICAL_TEMPERAMENT === '1';

// Domaine LIFESTYLE (q13/q14/q4a–q4d, q18/q19) rendu depuis le canonique + journal + pont + respiration cumulative.
export const socleCanonicalLifestyle = process.env.NEXT_PUBLIC_SOCLE_CANONICAL_LIFESTYLE === '1';

// A3 — SINGULARITÉ & PRATIQUE (texte libre + champs pratiques + q17) journalisés en FACT verbatim.
// Pas d'axes, pas de pont : un FACT ne produit aucun signal. Projection my_profile inchangée.
export const socleCanonicalSingularity = process.env.NEXT_PUBLIC_SOCLE_CANONICAL_SINGULARITY === '1';

// A4 — INCOGNITO rendu depuis la banque canonique unique (17 questions), journal about=contact.
// Provenance reported_by_relative, assertionBasis par question. Projection questionnaire_responses inchangée.
export const socleCanonicalIncognito = process.env.NEXT_PUBLIC_SOCLE_CANONICAL_INCOGNITO === '1';
