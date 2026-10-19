// ÉGALITÉ DE VECTEUR — temperament_axes reconstruit DEPUIS LE PONT == scoring legacy réel.
// Même barre que l'attention : pas une couverture d'options. Condition de retrait du scoring.

import { describe, expect, it } from 'vitest';
import { STEP2_QUESTIONS, STEP3_QUESTIONS } from '../../temperament/questions';
import { scoreTemperament, type TemperamentAnswers } from '../../temperament/scoring';
import { ONBOARDING_MAPPINGS } from '../../knowledge/onboarding';
import { TEMPERAMENT_DELTAS } from '../temperament-deltas';
import { reconstructTemperamentAxes } from '../reconstruct-temperament';

const norm = (s: string) => s.normalize('NFC').replace(/[’ʼ‘`´]/g, "'").replace(/…/g, '...').replace(/\s+/g, ' ').replace(/[(),.:;!?]/g, '').trim().toLowerCase();

describe('reconstruct temperament_axes — égalité de vecteur', () => {
  it('36 deltas dans le pont (toutes les options tempérament actives)', () => {
    expect(Object.keys(TEMPERAMENT_DELTAS)).toHaveLength(36);
  });

  it('axes reconstruits depuis le pont == scoreTemperament legacy (vecteur égal)', () => {
    const qs = [...STEP2_QUESTIONS, ...STEP3_QUESTIONS];
    const canonRef = new Map<string, string>(); // (qid|label) → optionRef actif
    for (const m of ONBOARDING_MAPPINGS) if (m.status === 'ACTIF') canonRef.set(`${m.questionCode}|${norm(m.optionText)}`, m.optionRef);

    // sélection : une option par question (la 1ʳᵉ non-"ça dépend")
    const answers: TemperamentAnswers = {};
    const bridges: Array<{ deltas: typeof TEMPERAMENT_DELTAS[string] }> = [];
    for (const q of qs) {
      const opt = q.options.find((o) => o.deltas.length > 0) ?? q.options[0];
      answers[q.id] = opt.id; // id legacy → scoreTemperament
      const ref = canonRef.get(`${q.id}|${norm(opt.label)}`);
      if (ref && TEMPERAMENT_DELTAS[ref]) bridges.push({ deltas: TEMPERAMENT_DELTAS[ref] });
    }

    const direct = scoreTemperament(answers); // projection réelle (ce que my_profile stocke)
    const reconstructed = reconstructTemperamentAxes(bridges); // depuis le pont du journal

    for (const axis of Object.keys(reconstructed)) {
      expect(reconstructed[axis], axis).toEqual({ score: direct.axes[axis as keyof typeof direct.axes].score, intensity: direct.axes[axis as keyof typeof direct.axes].intensity });
    }
  });
});
