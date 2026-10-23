// Péremption par requête (fixtures) — fraîche, modifiée-après, supprimée, non-autorisée.
import { describe, expect, it } from 'vitest';
import { isTextStale, type StoredText, type CurrentEvidence } from '../staleness';

const text: StoredText = { sourceEvidenceIds: ['a', 'b'], generatedAt: '2026-10-23T10:00:00.000Z' };
const authorized = (id: string, createdAt: string): CurrentEvidence => ({ id, createdAt, authorized: true });

describe('isTextStale', () => {
  it('FRAÎCHE : sources inchangées, aucune evidence postérieure → non périmé', () => {
    const current = [authorized('a', '2026-10-23T09:00:00Z'), authorized('b', '2026-10-23T09:30:00Z')];
    expect(isTextStale(text, current)).toBe(false);
  });

  it('MODIFIÉE APRÈS : une evidence du sujet postérieure à generated_at → périmé', () => {
    const current = [authorized('a', '2026-10-23T09:00:00Z'), authorized('b', '2026-10-23T09:30:00Z'), authorized('c', '2026-10-23T11:00:00Z')];
    expect(isTextStale(text, current)).toBe(true);
  });

  it('SUPPRIMÉE : une source absente du journal courant → périmé', () => {
    const current = [authorized('a', '2026-10-23T09:00:00Z')]; // 'b' supprimée
    expect(isTextStale(text, current)).toBe(true);
  });

  it('NON AUTORISÉE : une source dont la visibilité/consentement est révoqué → périmé', () => {
    const current = [authorized('a', '2026-10-23T09:00:00Z'), { id: 'b', createdAt: '2026-10-23T09:30:00Z', authorized: false }];
    expect(isTextStale(text, current)).toBe(true);
  });
});
