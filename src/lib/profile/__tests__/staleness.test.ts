// Péremption par requête (fixtures) — réécriture vs sécurité (ne jamais afficher).
import { describe, expect, it } from 'vitest';
import { needsRegeneration, mustNotDisplay, type StoredText, type CurrentEvidence } from '../staleness';

const text: StoredText = { sourceEvidenceIds: ['a', 'b'], generatedAt: '2026-10-23T10:00:00.000Z' };
const ok = (id: string, createdAt: string): CurrentEvidence => ({ id, createdAt, authorized: true });

describe('péremption — réécriture', () => {
  it('fraîche → ni réécriture ni masquage', () => {
    const cur = [ok('a', '2026-10-23T09:00:00Z'), ok('b', '2026-10-23T09:30:00Z')];
    expect(needsRegeneration(text, cur)).toBe(false);
    expect(mustNotDisplay(text, cur)).toBe(false);
  });
  it('fate a/b : une evidence postérieure → à réécrire, mais PAS masquée (pas de sécurité)', () => {
    const cur = [ok('a', '2026-10-23T09:00:00Z'), ok('b', '2026-10-23T09:30:00Z'), ok('c', '2026-10-23T11:00:00Z')];
    expect(needsRegeneration(text, cur)).toBe(true);
    expect(mustNotDisplay(text, cur)).toBe(false);
  });
});

describe('péremption — sécurité (fate c)', () => {
  it('source SUPPRIMÉE → masquée ET à réécrire', () => {
    const cur = [ok('a', '2026-10-23T09:00:00Z')]; // 'b' supprimée
    expect(mustNotDisplay(text, cur)).toBe(true);
    expect(needsRegeneration(text, cur)).toBe(true);
  });
  it('source NON AUTORISÉE → masquée ET à réécrire', () => {
    const cur = [ok('a', '2026-10-23T09:00:00Z'), { id: 'b', createdAt: '2026-10-23T09:30:00Z', authorized: false }];
    expect(mustNotDisplay(text, cur)).toBe(true);
    expect(needsRegeneration(text, cur)).toBe(true);
  });
});
