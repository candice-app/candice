// Incognito — fondations §2 : résolveur de pronom + axe assertionBasis.
// (Transcription des 118 options et tests §3 : increment suivant.)

import { describe, expect, it } from 'vitest';
import { resolvePronoun } from '../pronoun';
import { ASSERTION_BASES, MODE2_SOURCE_TYPE, deriveAssertionStatus, deriveRespondentRole, isSelfDeclaredAct } from '../../knowledge';

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

describe('Mode « côte à côte » — provenance (sous-bloc 2)', () => {
  it('MODE2_SOURCE_TYPE dérive explicit, et vaut acte déclaré de soi (self_report, sans plafond)', () => {
    // le proche parle de LUI (frappe médiée) : explicit + déclaré-de-soi, comme le direct.
    expect(MODE2_SOURCE_TYPE).toBe('declared_via_relative');
    expect(deriveAssertionStatus(MODE2_SOURCE_TYPE)).toBe('explicit');
    expect(isSelfDeclaredAct(MODE2_SOURCE_TYPE)).toBe(true);
  });
  it('se distingue de reported_by_relative (tiers), qui n’est PAS déclaré de soi', () => {
    expect(isSelfDeclaredAct('reported_by_relative')).toBe(false);
  });
});

describe('deriveRespondentRole — respondent dérivé, jamais stocké (fonction unique)', () => {
  it('self_report / subject_statement → subject ; observed / reporter_interpretation → reporter', () => {
    expect(deriveRespondentRole('self_report')).toBe('subject'); // mode 1, et mode 2 (réponse orale du proche)
    expect(deriveRespondentRole('subject_statement')).toBe('subject');
    expect(deriveRespondentRole('observed')).toBe('reporter');
    expect(deriveRespondentRole('reporter_interpretation')).toBe('reporter'); // mode 3 incognito
  });
  it('couvre exhaustivement les 4 bases (aucune non décidée)', () => {
    for (const b of ASSERTION_BASES) expect(() => deriveRespondentRole(b)).not.toThrow();
  });
});
