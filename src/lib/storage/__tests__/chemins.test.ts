import { describe, it, expect } from 'vitest';
import { estDansLEspaceDe, estIdentifiant, extensionImage } from '../chemins';

const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';

describe('on ne signe que le fichier de son propriétaire', () => {
  it('son propre fichier', () => {
    expect(estDansLEspaceDe(`${A}/avatar.jpg`, A)).toBe(true);
    expect(estDansLEspaceDe(`${A}/carnet/${B}/1-2.png`, A)).toBe(true);
  });
  it.each([
    [`${B}/avatar.jpg`, 'le fichier d’un autre'],
    [`${A}/../${B}/avatar.jpg`, 'une remontée de dossier'],
    [`${A}/./x.jpg`, 'un segment point'],
    [`${A}//x.jpg`, 'un segment vide'],
    [`/${A}/x.jpg`, 'une barre en tête'],
    [`${A}`, 'le dossier seul'],
    [`${A}/`, 'un nom vide'],
    [`${A}\\..\\${B}\\x.jpg`, 'des barres inversées'],
    [`${A}x/avatar.jpg`, 'un préfixe qui ressemble'],
    ['', 'vide'],
  ])('refuse %s (%s)', (chemin) => expect(estDansLEspaceDe(chemin, A)).toBe(false));
  it('refuse un propriétaire qui n’est pas un identifiant', () => expect(estDansLEspaceDe('x/y.jpg', 'x')).toBe(false));
  it('refuse null', () => expect(estDansLEspaceDe(null, A)).toBe(false));
});

describe('ce qui entre dans un chemin', () => {
  it('identifiant de fiche', () => {
    expect(estIdentifiant(A)).toBe(true);
    expect(estIdentifiant(`../../${B}`)).toBe(false);
    expect(estIdentifiant(null)).toBe(false);
  });
  it('l’extension vient du type, pas du nom', () => {
    expect(extensionImage('image/png')).toBe('png');
    expect(extensionImage('image/svg+xml')).toBeNull();
    expect(extensionImage('text/html')).toBeNull();
    expect(extensionImage('')).toBeNull();
  });
});
