// MAPPING SÉMANTIQUE option → dimensions affectives (hsg §47ter), keyé par optionRef. C'est le
// passage V15 d'une option d'attention vers les dimensions du vecteur (MOT/SER/CAD_C/CAD_S/EXP/GES/SUR).
// ⚠ CE N'EST PAS de la présentation (corrigé le 19 oct) : une dim est de la SÉMANTIQUE. Utilisé à la
// PRODUCTION (produce-socle) pour graver `dims` sur l'evidence → attention_reception reconstructible
// depuis le JOURNAL seul (le journal est l'autorité). Généré par import des banques V15, jamais inventé.

import type { AttentionDim } from '@/lib/attention/scoring';

/** optionRef (actif, domaine attention) → dims du scoring legacy. 28 entrées. */
export const ATTENTION_DIMS: Record<string, AttentionDim[]> = {
  '1': ['MOT'],
  '2': ['SER', 'GES'],
  '3': ['CAD_C'],
  '4': ['CAD_S'],
  '5': ['EXP'],
  '6': ['GES'],
  '7': ['SUR'],
  '8': ['CAD_C', 'GES'],
  '9': ['GES', 'SER'],
  '10': ['EXP', 'CAD_S'],
  '11': ['SER'],
  '12': ['MOT', 'GES'],
  '13': ['SUR'],
  '14': ['CAD_C'],
  '22': ['GES'],
  '23': ['EXP'],
  '24': ['SER'],
  '25': ['MOT'],
  '26': ['CAD_S'],
  '27': ['SUR'],
  '28': ['CAD_C'],
  '29': ['MOT'],
  '30': ['SER'],
  '31': ['CAD_C'],
  '32': ['CAD_S'],
  '33': ['EXP'],
  '34': ['GES'],
  '35': ['SUR'],
};
