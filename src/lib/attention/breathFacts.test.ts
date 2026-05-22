import { describe, it, expect } from 'vitest';
import { computeBreathFacts } from './breathFacts';
import type { FaceResult, AttentionDim } from './scoring';

const ALL_DIMS: AttentionDim[] = ['MOT', 'SER', 'CAD_C', 'CAD_S', 'EXP', 'GES', 'SUR'];

function makeFace(normalized: Partial<Record<AttentionDim, number>>): FaceResult {
  const n: Record<AttentionDim, number> = { MOT: 0, SER: 0, CAD_C: 0, CAD_S: 0, EXP: 0, GES: 0, SUR: 0 };
  for (const [k, v] of Object.entries(normalized)) n[k as AttentionDim] = v as number;
  return {
    raw:        { ...n },
    normalized: n,
    dominant:   ALL_DIMS.filter(d => n[d] === 100),
    secondaire: ALL_DIMS.filter(d => n[d] > 45 && n[d] < 100),
    tertiaire:  ALL_DIMS.filter(d => n[d] > 30 && n[d] <= 45),
  };
}

describe('computeBreathFacts', () => {
  it('control case — multi + congruence (CAD_C 100, GES 92, EXP 75, MOT 58 / GES 100, MOT 60)', () => {
    const reception  = makeFace({ CAD_C: 100, GES: 92, EXP: 75, MOT: 58 });
    const expression = makeFace({ GES: 100, MOT: 60 });
    const facts = computeBreathFacts(reception, expression);

    expect(facts.receptionShape).toBe('multi');
    expect(facts.receptionTop).toEqual(['CAD_C', 'GES', 'EXP', 'MOT']);
    expect(facts.fortR).toEqual(['CAD_C', 'GES', 'EXP', 'MOT']);
    expect(facts.fortE).toEqual(['GES', 'MOT']);
    expect(facts.shared).toEqual(['GES', 'MOT']);
    expect(facts.congruenceRatio).toBe(1);
    expect(facts.relation).toBe('congruence');
    expect(facts.ecart).toBeUndefined();
  });

  it('single profile — one dominant in reception, different dominant in expression', () => {
    // Reception: MOT=100, EXP=35 → strongR=[MOT], fortR=[MOT,EXP] (top-2 fallback)
    // Expression: SER=100 → fortE=[SER]; shared=[] → ratio=0 → ecart
    const reception  = makeFace({ MOT: 100, EXP: 35 });
    const expression = makeFace({ SER: 100 });
    const facts = computeBreathFacts(reception, expression);

    expect(facts.receptionShape).toBe('single');
    expect(facts.fortR[0]).toBe('MOT');
    expect(facts.relation).toBe('ecart');
    expect(facts.ecart?.ecartGive).toBe('SER');
    expect(facts.ecart?.ecartNeed).toBe('MOT');
  });

  it('true gap — multi-strong expression, none overlapping reception', () => {
    // Reception: MOT=100, GES=42 → fortR=[MOT,GES]
    // Expression: EXP=100, SUR=70 → fortE=[EXP,SUR]; shared=[] → ratio=0 → ecart
    const reception  = makeFace({ MOT: 100, GES: 42 });
    const expression = makeFace({ EXP: 100, SUR: 70 });
    const facts = computeBreathFacts(reception, expression);

    expect(facts.relation).toBe('ecart');
    expect(facts.ecart).toBeDefined();
    expect(facts.ecart?.ecartGive).toBe('EXP');
    expect(facts.ecart?.ecartNeed).toBe('MOT');
    expect(facts.shared).toHaveLength(0);
  });

  it('empty / all zeros → neutre', () => {
    const reception  = makeFace({});
    const expression = makeFace({});
    const facts = computeBreathFacts(reception, expression);

    expect(facts.relation).toBe('neutre');
    expect(facts.ecart).toBeUndefined();
  });
});
