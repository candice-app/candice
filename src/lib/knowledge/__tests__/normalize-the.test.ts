import { describe, it, expect } from 'vitest';
import { normalizeLabel } from '../normalize';

describe('un mot accentué n’est jamais pris pour un article', () => {
  it('« thé » n’est pas « the »', () => {
    expect(normalizeLabel('Thé en vrac, pas en sachet')).toBe('the en vrac pas en sachet');
    expect(normalizeLabel('le thé')).toBe('the');
    expect(normalizeLabel('Le thé matcha')).toBe('the matcha');
  });
  it('« à » n’est pas l’article anglais « a »', () => {
    expect(normalizeLabel('sac à dos')).toBe('sac a dos');
  });
  it('les vrais articles, français et anglais, sont toujours retirés', () => {
    expect(normalizeLabel('The Row')).toBe('row');
    expect(normalizeLabel('L’histoire de l’art')).toBe('histoire art');
    expect(normalizeLabel('une bonne encre')).toBe('bonne encre');
  });
  it('une forme décomposée (NFD) et une forme composée donnent la même clé', () => {
    expect(normalizeLabel('thé vert')).toBe(normalizeLabel('thé vert'));
  });
});
