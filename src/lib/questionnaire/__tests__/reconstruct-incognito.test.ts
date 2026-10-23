// INCOGNITO — ÉGALITÉ DE VECTEUR 7D (fixtures) : attention_reception reconstruit DEPUIS LE JOURNAL
// (modalités AFFECTION_RECEIVE + rang) == projection compute7DFromI1. Pas de base : rows en mémoire.

import { describe, expect, it } from 'vitest';
import { compute7DFromI1, MODALITY_TO_DIM } from '../canonical-incognito';
import { reconstruct7DFromJournal, type AffectionRow } from '../reconstruct-incognito';

describe('reconstruct incognito 7D — égalité de vecteur (fixtures)', () => {
  it('7D reconstruit du journal == compute7DFromI1 (rang 5/3/1 préservé)', () => {
    const orderedModalities = ['WORDS', 'QUALITY_TIME', 'PERSONALIZED_GIFT']; // rangs 1,2,3
    const proj = compute7DFromI1(orderedModalities);

    const rows: AffectionRow[] = orderedModalities.map((modality, i) => ({
      target_construct: `AFFECTION_RECEIVE_${modality}`,
      direction: 'receive',
      modality,
      rank: (i + 1) as number,
      created_at: `2026-10-23T00:00:0${i}.000Z`,
    }));
    const recon = reconstruct7DFromJournal(rows);

    expect(recon).toEqual(proj);
    // non-trivial : MOT dominant (rang 1 → 100), EXP rang 2, CAD_C rang 3
    expect(proj[MODALITY_TO_DIM.WORDS]).toBe(100);
    expect(proj[MODALITY_TO_DIM.QUALITY_TIME]).toBeGreaterThan(0);
    expect(proj[MODALITY_TO_DIM.PERSONALIZED_GIFT]).toBeGreaterThan(0);
  });

  it('récence par modalité : une evidence plus récente écrase l\'ancienne', () => {
    const rows: AffectionRow[] = [
      { target_construct: 'AFFECTION_RECEIVE_WORDS', direction: 'receive', modality: 'WORDS', rank: 3, created_at: '2026-10-23T00:00:00.000Z' },
      { target_construct: 'AFFECTION_RECEIVE_WORDS', direction: 'receive', modality: 'WORDS', rank: 1, created_at: '2026-10-23T09:00:00.000Z' }, // plus récent
    ];
    const recon = reconstruct7DFromJournal(rows);
    expect(recon[MODALITY_TO_DIM.WORDS]).toBe(100); // rang 1 récent gagne
  });
});
