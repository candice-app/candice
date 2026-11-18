import { describe, it, expect } from 'vitest';
import { encoreCouverte } from '../usage-profil';

const B = '11111111-1111-4111-8111-111111111111', X = '22222222-2222-4222-8222-222222222222';

describe('un contenu calculé avec les données d’un proche suit son autorisation', () => {
  it('rien du proche n’a servi : toujours couvert, quoi qu’il arrive', () => {
    expect(encoreCouverte({ compte: null, portees: [] }, { compte: null, portees: [] })).toBe(true);
    expect(encoreCouverte({ compte: B, portees: [] }, { compte: X, portees: [] })).toBe(true);
  });
  it('tout ce qui a servi est encore autorisé', () =>
    expect(encoreCouverte({ compte: B, portees: ['reco:regime'] }, { compte: B, portees: ['reco:regime', 'reco:alcool'] })).toBe(true));
  it('une des portées utilisées a été retirée', () =>
    expect(encoreCouverte({ compte: B, portees: ['reco:regime', 'reco:allergie:arachide'] }, { compte: B, portees: ['reco:regime'] })).toBe(false));
  it('tout a été retiré', () => expect(encoreCouverte({ compte: B, portees: ['reco:regime'] }, { compte: B, portees: [] })).toBe(false));
  it('la fiche est rattachée à un autre compte, même avec les mêmes portées', () =>
    expect(encoreCouverte({ compte: B, portees: ['reco:regime'] }, { compte: X, portees: ['reco:regime'] })).toBe(false));
  it('la fiche n’est plus rattachée à aucun compte', () =>
    expect(encoreCouverte({ compte: B, portees: ['reco:regime'] }, { compte: null, portees: [] })).toBe(false));
});
