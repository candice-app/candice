// ONTOLOGY_GAP — mécanisme de remontée, PAS une famille.
//
// Dictionnaire §13, HSG §36, R24. L'absence d'un code fermé n'est JAMAIS un gap.
// Avant de signaler, on VÉRIFIE D'ABORD que l'information ne peut pas être
// représentée par l'une des voies existantes. Un gap ne crée jamais de construct :
// il est mis en file d'arbitrage humain.

/** Les voies de représentation à tester AVANT de signaler un gap (HSG §36). */
export const REPRESENTATION_PATHS = [
  'canonical_family', // une des 10 familles existantes
  'fact', // conservable comme FACT
  'structured_open_knowledge', // connaissance descriptive structurée (OpenKnowledge, open-knowledge.ts)
  'entity', // ENTITY
  'context', // CONTEXT
  'behavior_pattern', // pattern BEHAVIOR extensible
] as const;
export type RepresentationPath = (typeof REPRESENTATION_PATHS)[number];

/** Les 4 critères d'un véritable ONTOLOGY_GAP (Dictionnaire §13 / HSG §36). */
export interface GapCriteria {
  /** 1. le phénomène apparaît de manière récurrente. */
  readonly recurrent: boolean;
  /** 2. importance opérationnelle réelle. */
  readonly operationallyImportant: boolean;
  /** 3. nécessite une logique spécifique de raisonnement/consolidation. */
  readonly needsSpecificLogic: boolean;
  /** 4. non représentable par les structures existantes. */
  readonly notRepresentable: boolean;
}

export interface GapCandidateInput {
  /** Description du phénomène observé. */
  readonly phenomenon: string;
  /** Voies de représentation qui conviennent déjà (si une convient → pas un gap). */
  readonly coveredBy?: RepresentationPath[];
  readonly criteria: GapCriteria;
}

export type GapAssessment =
  | { readonly isGap: false; readonly reason: string; readonly representableBy?: RepresentationPath[] }
  | { readonly isGap: true; readonly queued: OntologyGap };

/** Un gap mis en file d'arbitrage. Ne crée aucun construct. */
export interface OntologyGap {
  readonly phenomenon: string;
  readonly criteria: GapCriteria;
  readonly status: 'queued_for_human_arbitration';
}

/**
 * Évalue si un phénomène est un véritable ONTOLOGY_GAP.
 *   - S'il est déjà représentable par une voie existante → PAS un gap (R24).
 *   - Les 4 critères doivent être réunis SIMULTANÉMENT (§36).
 *   - Un gap est seulement mis en file d'arbitrage, jamais transformé en construct.
 */
export function assessOntologyGap(input: GapCandidateInput): GapAssessment {
  if (input.coveredBy && input.coveredBy.length > 0) {
    return {
      isGap: false,
      reason:
        'Information représentable par une voie existante — l’absence de code fermé n’est pas un gap (R24).',
      representableBy: input.coveredBy,
    };
  }
  const c = input.criteria;
  const allFour = c.recurrent && c.operationallyImportant && c.needsSpecificLogic && c.notRepresentable;
  if (!allFour) {
    return {
      isGap: false,
      reason: 'Les 4 critères d’un ONTOLOGY_GAP ne sont pas réunis simultanément (§36).',
    };
  }
  return {
    isGap: true,
    queued: {
      phenomenon: input.phenomenon,
      criteria: c,
      status: 'queued_for_human_arbitration',
    },
  };
}
