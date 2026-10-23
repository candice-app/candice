// ÉGALITÉ DE VECTEUR LIFESTYLE (fixtures) — lifestyle_axes ET temperament_axes (étanchéité) reconstruits
// DEPUIS LE PONT == scoring legacy réel. Copié sur reconstruct-temperament.test.ts. Pas de base, pas de
// modèle : les fonctions + des ponts en mémoire. Rejoue la DOUBLE-APPLICATION du merge (step4 puis step5).

import { describe, expect, it } from 'vitest';
import { STEP4_QUESTIONS_ACTIVE, STEP5_CHOICE_QUESTIONS } from '../../lifestyle/questions';
import { scoreLifestyle, mergeTemperamentSupplements, type LifestyleAnswers } from '../../lifestyle/scoring';
import { scoreTemperament, type TemperamentAnswers } from '../../temperament/scoring';
import { STEP2_QUESTIONS, STEP3_QUESTIONS } from '../../temperament/questions';
import { ONBOARDING_MAPPINGS } from '../../knowledge/onboarding';
import { LIFESTYLE_DELTAS } from '../lifestyle-deltas';
import { TEMPERAMENT_DELTAS } from '../temperament-deltas';
import { reconstructLifestyleAxes, reconstructTemperamentAxesAfterLifestyle } from '../reconstruct-lifestyle';

const norm = (s: string) => s.normalize('NFC').replace(/[’ʼ‘`´]/g, "'").replace(/…/g, '...').replace(/\s+/g, ' ').replace(/[(),.:;!?]/g, '').trim().toLowerCase();
const canonRef = new Map<string, string>();
for (const m of ONBOARDING_MAPPINGS) if (m.status === 'ACTIF') canonRef.set(`${m.questionCode}|${norm(m.optionText)}`, m.optionRef);

describe('reconstruct lifestyle — égalité de vecteur (fixtures)', () => {
  // réponses : 1ʳᵉ option de chaque question active
  const lifeQs = [...STEP4_QUESTIONS_ACTIVE, ...STEP5_CHOICE_QUESTIONS];
  const lifestyleAnswers: LifestyleAnswers = {};
  const lifeBridges: Array<{ deltas: typeof LIFESTYLE_DELTAS[string] }> = [];
  for (const q of lifeQs) {
    const o = q.options[0];
    lifestyleAnswers[q.id] = o.id;
    const ref = canonRef.get(`${q.id}|${norm(o.label)}`);
    if (ref && LIFESTYLE_DELTAS[ref]) lifeBridges.push({ deltas: LIFESTYLE_DELTAS[ref] });
  }

  it('lifestyle_axes reconstruit == scoreLifestyle.axes', () => {
    const direct = scoreLifestyle(lifestyleAnswers).axes;
    const recon = reconstructLifestyleAxes(lifeBridges);
    for (const axis of Object.keys(direct)) {
      expect(recon[axis], axis).toEqual({ score: direct[axis as keyof typeof direct].score, intensity: direct[axis as keyof typeof direct].intensity });
    }
  });

  it('temperament_axes APRÈS lifestyle (étanchéité) : reconstruit == séquence legacy réelle (double-application)', () => {
    // base tempérament (q5–q11)
    const tempQs = [...STEP2_QUESTIONS, ...STEP3_QUESTIONS];
    const tempAnswers: TemperamentAnswers = {};
    const tempBridges: Array<{ deltas: typeof TEMPERAMENT_DELTAS[string] }> = [];
    for (const q of tempQs) {
      const o = q.options.find((x) => x.deltas.length > 0) ?? q.options[0];
      tempAnswers[q.id] = o.id;
      const ref = canonRef.get(`${q.id}|${norm(o.label)}`);
      if (ref && TEMPERAMENT_DELTAS[ref]) tempBridges.push({ deltas: TEMPERAMENT_DELTAS[ref] });
    }

    // séquence LIVE exacte (QuestionnaireFlow) : T0 → merge(step4) → merge(re-calcul step4+step5)
    const step4Answers: LifestyleAnswers = {};
    for (const q of STEP4_QUESTIONS_ACTIVE) step4Answers[q.id] = q.options[0].id;
    const T0 = scoreTemperament(tempAnswers).axes as unknown as Record<string, { score: number; intensity: number }>;
    const r4 = scoreLifestyle(step4Answers);
    const axes1 = mergeTemperamentSupplements(T0, r4.temperamentSupplements);
    const r5 = scoreLifestyle(lifestyleAnswers); // step4 + step5
    const live = mergeTemperamentSupplements(axes1, r5.temperamentSupplements);

    const step4Set = new Set(STEP4_QUESTIONS_ACTIVE.map((q) => q.id));
    const recon = reconstructTemperamentAxesAfterLifestyle(tempBridges, lifeBridges, step4Set);

    for (const axis of Object.keys(live)) {
      expect(recon[axis], axis).toEqual(live[axis]);
    }
  });
});
