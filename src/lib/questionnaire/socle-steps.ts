// STRUCTURE D'ÉTAPES DU SOCLE — NOMMÉE et explicite (hsg §47bis.2 : c'est de la STRUCTURE, pas un
// asset de présentation). Elle détermine OÙ TOMBENT LES RESPIRATIONS, donc la progressivité de
// l'analyse cumulative : chaque respiration lit les tags produits aux étapes 1..N (règle 7).

export interface SocleStep {
  readonly id: string;
  readonly label: string; // nom interne de l'étape
  readonly questionCodes: readonly string[]; // questions canoniques rendues à cette étape
  readonly breathAfter: boolean; // une respiration tombe après cette étape
}

/**
 * Ordre du socle. La respiration d'une étape lit TOUT le journal produit jusqu'à elle (cumulatif) :
 * mince à l'attention (peu de tags), dense à la fin (règle 7b).
 */
export const SOCLE_STEPS: readonly SocleStep[] = [
  { id: 'attention', label: 'Langages d’attention', questionCodes: ['q1', 'q2', 'q4', 'qe'], breathAfter: true },
  { id: 'temperament', label: 'Tempérament', questionCodes: ['q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11'], breathAfter: true },
  { id: 'lifestyle', label: 'Mode de vie', questionCodes: ['q4a', 'q4b', 'q4c', 'q4d', 'q12', 'q13', 'q14', 'q18', 'q19'], breathAfter: true },
  { id: 'singularity', label: 'Singularité & pratique', questionCodes: [], breathAfter: true }, // texte libre, hors mapping
] as const;
