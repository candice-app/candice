// Un rejet déclaré écarte mécaniquement, quelle que soit la famille (GUARDRAIL ou ENTITY DISLIKE/AVOID).
import { describe, expect, it } from 'vitest';
import { candidateRejectedBy, isRejection, type JournalRejection } from '../rejection-match';

const rejections: JournalRejection[] = [
  { label: 'fleurs coupées', family: 'ENTITY', relation: 'AVOID', severity: 'SOFT' }, // « je ne supporte pas les fleurs coupées »
  { label: 'surprises en public', family: 'GUARDRAIL', severity: 'SOFT' },
];

describe('rejet mécaniquement excluant', () => {
  it('« je ne supporte pas les fleurs coupées » → un bouquet de fleurs est ÉCARTÉ', () => {
    const hit = candidateRejectedBy('Un beau bouquet de fleurs fraîches', rejections);
    expect(hit?.label).toBe('fleurs coupées');
  });
  it('une ENTITY NEUTRAL/LOVE n\'exclut pas', () => {
    expect(isRejection({ family: 'ENTITY', relation: 'LOVE' })).toBe(false);
    expect(isRejection({ family: 'ENTITY', relation: 'AVOID' })).toBe(true);
    expect(isRejection({ family: 'GUARDRAIL' })).toBe(true);
  });
  it('un candidat sans rapport n\'est pas écarté', () => {
    expect(candidateRejectedBy('Une boîte de chocolats artisanaux', rejections)).toBeNull();
  });
  it('le GUARDRAIL exclut aussi (autre famille, même effet)', () => {
    expect(candidateRejectedBy('Une surprise devant tout le monde en public', rejections)?.family).toBe('GUARDRAIL');
  });
});
