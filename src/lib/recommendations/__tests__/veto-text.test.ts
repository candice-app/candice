// RÉGRESSION — le veto textuel écartait des idées au hasard.
//
// `texte.includes('vin')` écartait « vinyle », « Vincent », « divin ». Le veto se
// retournait contre la personne qu'il protège, et sans aucune trace. Ces cas sont
// épinglés ici : ils doivent échouer si quelqu'un revient à une recherche de sous-chaîne.
import { describe, expect, it } from 'vitest';
import { mentionne, vetoEnfreint, motifVeto } from '../veto-text';

describe('le veto reconnaît ce qu’il vise', () => {
  it.each([
    ['vin', 'Un atelier dégustation de vin nature'],
    ['vin', 'Deux vins de Loire à partager'],          // pluriel
    ['vin', 'VIN de Bourgogne'],                        // casse
    ['alcool', "Un coffret d'alcool fort"],             // précédé d'une apostrophe
    ['crustacés', 'Un plateau de crustaces'],           // texte saisi sans accent
    ['crustaces', 'Un plateau de crustacés'],           // veto saisi sans accent
    ['randonnée', 'Une randonnée en forêt'],
    ['surprise publique', 'Une surprise publique au restaurant'],
    ['surprise publique', 'Des surprises  publiques'],  // pluriel ET double espace
    ['devant tout le monde', 'Lui offrir devant tout le monde'],
    ['sans prévenir', 'Arriver sans prévenir chez lui'],
  ])('veto « %s » reconnaît « %s »', (veto, texte) => {
    expect(mentionne(texte, veto)).toBe(true);
  });
});

describe('le veto laisse passer ce qu’il ne vise pas — LE DÉFAUT CORRIGÉ', () => {
  it.each([
    ['vin', 'Un coffret de vinyles'],        // vin en PRÉFIXE
    ['vin', 'Un dîner chez Vincent'],        // vin en PRÉFIXE d'un prénom
    ['vin', 'Un paysage divin au coucher'],  // vin en SUFFIXE
    ['vin', 'Une balade vinicole'],          // vin suivi de lettres
    ['pain', 'Un week-end avec ses copains'],// pain en SUFFIXE
    ['art', 'Un départ en train'],           // art en SUFFIXE
    ['art', 'Une carte postale'],            // art au MILIEU
    ['porc', 'Un porche fleuri'],
    ['mer', 'Une après-midi au Mercure'],
  ])('veto « %s » laisse passer « %s »', (veto, texte) => {
    expect(mentionne(texte, veto)).toBe(false);
  });
});

describe('un veto vide n’écarte rien', () => {
  // Un veto vide passé à `includes` renvoyait TRUE sur tout texte : toutes les idées
  // écartées, silencieusement. La liste est filtrée en amont, mais la fonction doit
  // tenir seule : une protection qui dépend d'un filtrage ailleurs n'en est pas une.
  // Et une saisie faite UNIQUEMENT de ponctuation n'est pas un mot : la garder
  // fabriquerait un motif reconnaissant de la ponctuation présente dans presque
  // n'importe quelle idée — un veto involontaire, invisible, sans raison affichable.
  it.each(['', '   ', '!!', '-', '...', '??!'])('veto « %s »', (veto) => {
    expect(motifVeto(veto)).toBeNull();
    expect(mentionne("N'importe quelle idée", veto)).toBe(false);
  });
});

describe('vetoEnfreint rend LEQUEL, pas seulement que', () => {
  const liste = ['vin', 'alcool', 'surprise publique'];

  it('rend le veto fautif', () => {
    expect(vetoEnfreint('Un atelier vin nature', liste)).toBe('vin');
    expect(vetoEnfreint('Une surprise publique', liste)).toBe('surprise publique');
  });

  it('rend null quand rien n’est enfreint', () => {
    expect(vetoEnfreint('Un coffret de vinyles pour Vincent', liste)).toBeNull();
  });

  it('un caractère spécial dans un veto ne casse pas l’expression', () => {
    // Un veto saisi par la personne peut contenir n'importe quoi. Un `(` non échappé
    // ferait lever `new RegExp` et emporterait tout le filtrage avec lui.
    expect(() => vetoEnfreint('un texte', ['chocolat (noir)', 'a+b', '[x]'])).not.toThrow();
    expect(vetoEnfreint('Un chocolat (noir) artisanal', ['chocolat (noir)'])).toBe('chocolat (noir)');
  });
});
