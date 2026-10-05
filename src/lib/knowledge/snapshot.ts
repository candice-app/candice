// HISTORIQUE CONSOLIDÉ (lot A bis, section 6.4).
//
// En AJOUT SEUL, jamais écrasé. Deux instantanés successifs permettent de distinguer
// les trois causes d'un changement de signal, sans construire aucune couche d'analyse :
//   - la personne a changé  : mêmes evidenceIds (ou enrichis) + une evidence evolving,
//                             ou une relation ENTITY plus récente qui contredit l'ancienne ;
//   - le modèle a changé    : le `version` du signal diffère entre les deux instantanés ;
//   - une evidence nouvelle a augmenté la confiance : evidenceCount a crû et confidence avec.
//
// Ce lot crée la structure et le test ; il ne construit aucune couche d'analyse.

import type { Signal } from './signal';

export interface SignalSnapshot {
  readonly signalKey: string;
  readonly takenAt: string;
  readonly signal: Signal;
}
