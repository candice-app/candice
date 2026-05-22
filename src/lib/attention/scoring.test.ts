import { describe, it, expect } from 'vitest';
import { scoreAttention } from './scoring';
import type { AttentionAnswers, AttentionDim } from './scoring';

// ─── Cas bible ────────────────────────────────────────────────────────────────

describe('scoreAttention — cas bible (réception)', () => {
  const answers: AttentionAnswers = {
    reception: [
      // Q1 : rang1=[MOT,GES] rang2=[SER]
      [['MOT', 'GES'], ['SER']],
      // Q2 : rang1=[MOT,GES] rang2=[SER]
      [['MOT', 'GES'], ['SER']],
      // Q3 : rang1=[MOT,GES] rang2=[EXP]
      [['MOT', 'GES'], ['EXP']],
      // Q4 : rang1=[MOT]
      [['MOT']],
    ],
    expression: [],
  };

  const result = scoreAttention(answers).reception;

  it('brut MOT = 20', () => expect(result.raw.MOT).toBe(20));
  it('brut GES = 15', () => expect(result.raw.GES).toBe(15));
  it('brut SER = 6',  () => expect(result.raw.SER).toBe(6));
  it('brut EXP = 3',  () => expect(result.raw.EXP).toBe(3));
  it('brut CAD_C = 0', () => expect(result.raw.CAD_C).toBe(0));
  it('brut CAD_S = 0', () => expect(result.raw.CAD_S).toBe(0));
  it('brut SUR = 0',  () => expect(result.raw.SUR).toBe(0));

  it('normalisé MOT = 100', () => expect(result.normalized.MOT).toBe(100));
  it('normalisé GES = 75',  () => expect(result.normalized.GES).toBe(75));
  it('normalisé SER = 30',  () => expect(result.normalized.SER).toBe(30));
  it('normalisé EXP = 15',  () => expect(result.normalized.EXP).toBe(15));

  it('dominant = [MOT]',   () => expect(result.dominant).toEqual(['MOT']));
  it('secondaire = [GES]', () => expect(result.secondaire).toEqual(['GES']));
  it('tertiaire = []',     () => expect(result.tertiaire).toEqual([]));
});

// ─── Cas limite : entrée vide ─────────────────────────────────────────────────

describe('scoreAttention — entrée vide', () => {
  const result = scoreAttention({ reception: [], expression: [] });

  it('réception raw tous à 0', () => {
    const dims: AttentionDim[] = ['MOT', 'SER', 'CAD_C', 'CAD_S', 'EXP', 'GES', 'SUR'];
    for (const d of dims) expect(result.reception.raw[d]).toBe(0);
  });

  it('réception normalized tous à 0', () => {
    const dims: AttentionDim[] = ['MOT', 'SER', 'CAD_C', 'CAD_S', 'EXP', 'GES', 'SUR'];
    for (const d of dims) expect(result.reception.normalized[d]).toBe(0);
  });

  it('réception dominant = []',   () => expect(result.reception.dominant).toEqual([]));
  it('réception secondaire = []', () => expect(result.reception.secondaire).toEqual([]));
  it('réception tertiaire = []',  () => expect(result.reception.tertiaire).toEqual([]));
});

// ─── Cas limite : une seule dimension ─────────────────────────────────────────

describe('scoreAttention — une seule dimension', () => {
  const answers: AttentionAnswers = {
    reception: [[['SER']]],
    expression: [],
  };

  const result = scoreAttention(answers).reception;

  it('brut SER = 5 (rang 1)',  () => expect(result.raw.SER).toBe(5));
  it('normalisé SER = 100',    () => expect(result.normalized.SER).toBe(100));
  it('dominant = [SER]',       () => expect(result.dominant).toEqual(['SER']));
  it('secondaire = []',        () => expect(result.secondaire).toEqual([]));
  it('tertiaire = []',         () => expect(result.tertiaire).toEqual([]));
});

// ─── Les deux faces sont indépendantes ───────────────────────────────────────

describe('scoreAttention — faces non additionnées', () => {
  const answers: AttentionAnswers = {
    reception:  [[['MOT']]],
    expression: [[['SER']]],
  };

  const result = scoreAttention(answers);

  it('réception dominant = [MOT]',   () => expect(result.reception.dominant).toEqual(['MOT']));
  it('expression dominant = [SER]',  () => expect(result.expression.dominant).toEqual(['SER']));
  it('réception raw SER = 0',        () => expect(result.reception.raw.SER).toBe(0));
  it('expression raw MOT = 0',       () => expect(result.expression.raw.MOT).toBe(0));
});
