// La relation give≈receive est DÉFINIE par le HSG (déterministe), jamais observée par le modèle (7c).

import { describe, expect, it } from 'vitest';
import { deriveAttentionRelation, type AttentionBreathTag } from '../breath-tags';

const t = (direction: 'receive' | 'give', modality: string, rank: number): AttentionBreathTag => ({
  family: 'AFFECTION_LANGUAGE', construct: `AFFECTION_${direction.toUpperCase()}_${modality}`, direction, modality, strength: 'strong', rank, basis: 'self_report', confidence: 'high',
});

describe('deriveAttentionRelation — relation DÉFINIE par le HSG (7c)', () => {
  it('congruence : la modalité reçue de rang 1 est aussi donnée', () => {
    const r = deriveAttentionRelation([t('receive', 'WORDS', 1), t('give', 'WORDS', 1), t('give', 'SERVICES', 2)]);
    expect(r.relation).toBe('congruence');
    expect(r.receiveTop).toBe('WORDS');
  });
  it('ecart : la 1ʳᵉ modalité reçue n’est pas parmi les données', () => {
    const r = deriveAttentionRelation([t('receive', 'QUALITY_TIME', 1), t('give', 'WORDS', 1)]);
    expect(r.relation).toBe('ecart');
    expect(r.receiveTop).toBe('QUALITY_TIME');
    expect(r.giveTop).toBe('WORDS');
  });
  it('neutre : il manque le reçu ou le donné (on ne relie rien)', () => {
    expect(deriveAttentionRelation([t('receive', 'WORDS', 1)]).relation).toBe('neutre');
    expect(deriveAttentionRelation([]).relation).toBe('neutre');
  });
});
