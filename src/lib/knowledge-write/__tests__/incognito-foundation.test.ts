// Incognito — fondations §2 : résolveur de pronom + axe assertionBasis.
// (Transcription des 118 options et tests §3 : increment suivant.)

import { describe, expect, it } from 'vitest';
import { resolvePronoun } from '../pronoun';
import { ASSERTION_BASES } from '../../knowledge';

describe('resolvePronoun — trois cas de résolution, fonction pure', () => {
  const tpl = '{Pronom} arrive au bon moment et {pronom} y pense souvent.';
  it('femme → elle / Elle', () => {
    expect(resolvePronoun(tpl, 'Julie', 'femme')).toBe('Elle arrive au bon moment et elle y pense souvent.');
  });
  it('homme → il / Il', () => {
    expect(resolvePronoun(tpl, 'Marc', 'homme')).toBe('Il arrive au bon moment et il y pense souvent.');
  });
  it('non_binaire → le prénom (rien ne s’accorde, Camille épicène sans problème)', () => {
    expect(resolvePronoun(tpl, 'Camille', 'non_binaire')).toBe('Camille arrive au bon moment et Camille y pense souvent.');
  });
  it('non_precise → le prénom', () => {
    expect(resolvePronoun(tpl, 'Dominique', 'non_precise')).toBe('Dominique arrive au bon moment et Dominique y pense souvent.');
  });
  it('NULL → le prénom', () => {
    expect(resolvePronoun(tpl, 'Sacha', null)).toBe('Sacha arrive au bon moment et Sacha y pense souvent.');
  });
  it('aucun jeton résiduel {Pronom}/{pronom} après résolution, quel que soit le genre', () => {
    for (const g of ['femme', 'homme', 'non_binaire', 'non_precise', null] as const) {
      const out = resolvePronoun(tpl, 'Camille', g);
      expect(out).not.toMatch(/\{pronom\}/i);
    }
  });
  it('un libellé sans jeton est rendu inchangé', () => {
    expect(resolvePronoun('Un objet choisi avec soin.', 'Julie', 'femme')).toBe('Un objet choisi avec soin.');
  });
});

describe('assertionBasis — quatre valeurs fermées (incognito §2)', () => {
  it('exactement self_report / observed / subject_statement / reporter_interpretation', () => {
    expect([...ASSERTION_BASES]).toEqual(['self_report', 'observed', 'subject_statement', 'reporter_interpretation']);
  });
});
