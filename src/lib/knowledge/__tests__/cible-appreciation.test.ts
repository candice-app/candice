import { describe, it, expect } from 'vitest';
import { cibleDUneEntite } from '../cible-appreciation';

// 19 nov., 19h56 — « une appréciation ne doit pas changer de cible pendant l'extraction ».
describe('la cible d’une relation envers une entité, lue dans les mots', () => {
  it.each([
    // La chose elle-même.
    ['J’adore Patagonia.', 'Patagonia', 'referent'],
    ['Patagonia, je l’adore.', 'Patagonia', 'referent'],
    ['Patagonia me plaît énormément.', 'Patagonia', 'referent'],
    ['J’aimerais aller au Japon un jour.', 'Japon', 'referent'],
    ['J’ai envie d’aller à Kyoto.', 'Kyoto', 'referent'],
    ['Je rêve du Japon.', 'Japon', 'referent'],
    ['Le Café de Flore : j’adore cet endroit.', 'Café de Flore', 'referent'],
    ['J’adore Annie Ernaux.', 'Annie Ernaux', 'referent'],
    ['J’évite Zara.', 'Zara', 'referent'],
    // Un de ses aspects : pas la chose.
    ['J’adore l’ambiance du Café de Flore.', 'Café de Flore', 'aspect'],
    ['J’aimerais découvrir la cuisine du Japon.', 'Japon', 'aspect'],
    ['J’adore les couvertures des livres d’Annie Ernaux.', 'Annie Ernaux', 'aspect'],
    ['Le Café de Flore : j’y adore le silence du matin.', 'Café de Flore', 'indeterminee'],
    ['Je déteste la foule au Louvre.', 'Louvre', 'aspect'],
    // Rien ne la porte.
    ['Patagonia.', 'Patagonia', 'indeterminee'],
    ['Patagonia. J’adore.', 'Patagonia', 'indeterminee'],
    ['J’adore la montagne.', 'Patagonia', 'indeterminee'],
  ] as const)('« %s » → %s : %s', (texte, label, attendu) => {
    expect(cibleDUneEntite(texte, label).cible).toBe(attendu);
  });
});
