// ASSET DE DIMS — métadonnée de PROJECTION (hsg §47bis.3), keyée par optionRef. Alimente le
// scoring legacy (attention_reception) pour les lecteurs ; JAMAIS lue par le HSG/produceFromOption.
// Générée par import des banques attention. Round-trip : attention-dims-roundtrip.test.ts.

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
