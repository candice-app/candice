import { describe, it, expect } from 'vitest';
import { affirmeUneAbsence, LIGNE_INCONNU_NON_ABSENT } from '../engine';

describe("ne pas lire une allergie n'est pas savoir qu'il n'y en a pas", () => {
  it.each([
    'Un dîner sans risque pour lui',
    'Un gâteau sans allergène',
    "Il n'a aucune allergie, tu peux y aller",
    "Pas d'allergie connue : un plateau de fruits de mer",
    'Un menu compatible avec son régime',
    'Chocolats garantis sans arachide',
    'Aucune restriction alimentaire à prévoir',
  ])('écarte « %s »', (t) => expect(affirmeUneAbsence(t)).toBe(true));

  it.each([
    'Un livre choisi pour lui',
    'Un dîner dans le restaurant dont il parle — vérifie la carte avec lui',
    'Une balade sans prétention',
    'Un message sans raison particulière',
    'Demande-lui s’il a des allergies avant de réserver',
  ])('laisse passer « %s »', (t) => expect(affirmeUneAbsence(t)).toBe(false));

  it('le rappel au modèle ne dit pas qu’il n’y a rien', () => {
    expect(LIGNE_INCONNU_NON_ABSENT).toMatch(/ne signifie pas qu'il n'y en a pas/);
  });
});
