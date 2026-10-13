// ORCHESTRATEUR DE DOUBLE-ÉCRITURE (sous-bloc 2, décision du 13 oct).
//
// ⚠ TEMPORAIRE PAR CONSTRUCTION. Le journal de connaissance (knowledge_*) est l'AUTORITÉ dès le
// jour 1 ; les colonnes plates (questionnaire_responses, my_profile) sont une PROJECTION DE SERVICE,
// maintenue le temps que le moteur de recommandation soit raccordé au journal.
//
//   SORTIE ATTENDUE (à exécuter quand la reco lira le journal) : supprimer l'appel à `flatWrite`,
//   puis ce module, et ne garder que `persistKnowledge`. Tant que ce fichier existe, la bascule
//   n'est pas faite.
//
// Trois règles (Estelle) :
//   1. Journal d'abord, autorité. S'il échoue, on N'ÉCRIT PAS la projection (pas de copie sans vérité).
//   2. Journal OK mais projection en échec = DIVERGENCE : on la SIGNALE (DivergenceError), jamais
//      réconciliée en silence — une divergence est une information, pas un défaut à masquer.
//   3. L'équivalence journal↔projection se teste AVANT toute bascule (incrément suivant : equivalence.ts).
//      Si les deux divergent après coup, c'est le journal qui fait foi et la projection qui a un bug.

import { persistKnowledge, type KnowledgePayload, type WriteClient } from './persist';

/** Le journal a été écrit, mais la projection plate a échoué : à signaler, pas à réconcilier. */
export class DivergenceError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'DivergenceError';
  }
}

/**
 * Écrit le journal (autorité) PUIS la projection plate. `flatWrite` encapsule l'écriture legacy
 * existante (colonnes plates), passée en thunk pour rester indépendante de la cible.
 */
export async function writeDouble(
  client: WriteClient,
  journal: KnowledgePayload,
  flatWrite: () => Promise<void>,
): Promise<void> {
  // 1. JOURNAL = autorité. persistKnowledge jette à la première erreur → on s'arrête ici, pas de projection.
  await persistKnowledge(client, journal);

  // 2. PROJECTION de service. Un échec APRÈS un journal réussi est une divergence SIGNALÉE.
  try {
    await flatWrite();
  } catch (e) {
    throw new DivergenceError(
      'journal écrit, projection plate en échec — divergence à signaler, jamais à réconcilier en silence',
      e,
    );
  }
}
