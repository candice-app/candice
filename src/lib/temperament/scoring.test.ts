import { describe, it, expect } from 'vitest';
import { scoreTemperament } from './scoring';
import type { TemperamentAnswers } from './scoring';

// ─── Cas bible : introversion + espace forts ──────────────────────────────────

describe('scoreTemperament — introversion + espace forts', () => {
  const answers: TemperamentAnswers = {
    q5: 'q5_1', // seul: energieSociale -2, espaceProsimite -2
    q6: 'q6_2', // retrait: espaceProsimite -2, stress=retrait
    q7: 'q7_3', // evite conflit: expressiviteReserve +1, conflit=évitant
    q8: 'q8_2', // liberte+espace: espaceProsimite -2
  };
  const result = scoreTemperament(answers);

  it('energieSociale negatif (introversion)', () => {
    expect(result.axes.energieSociale.score).toBeLessThan(0);
  });
  it('espaceProsimite tres negatif (besoin espace)', () => {
    expect(result.axes.espaceProsimite.score).toBeLessThan(-50);
  });
  it('stress=retrait', () => {
    expect(result.modes.stress?.label).toBe('retrait');
  });
  it('conflit=evitant', () => {
    expect(result.modes.conflit?.label).toBe('évitant');
  });
  it('energieSociale intensity = 1', () => {
    expect(result.axes.energieSociale.intensity).toBe(1);
  });
  it('espaceProsimite intensity = 3', () => {
    expect(result.axes.espaceProsimite.intensity).toBe(3);
  });
});

// ─── Cas bible : extraversion + besoin de profondeur (contradiction) ──────────

describe('scoreTemperament — extraversion + profondeur', () => {
  const answers: TemperamentAnswers = {
    q5: 'q5_4', // entoure: energieSociale +2, espaceProsimite +1
    q6: 'q6_3', // parler: expressiviteReserve -2, stress=parole
    q7: 'q7_1', // direct: communicationStyle -2, conflit=direct
    q8: 'q8_3', // profondeur: expressiviteReserve -1
  };
  const result = scoreTemperament(answers);

  it('energieSociale positif (extraversion)', () => {
    expect(result.axes.energieSociale.score).toBeGreaterThan(0);
  });
  it('expressiviteReserve negatif (expressivite/profondeur)', () => {
    expect(result.axes.expressiviteReserve.score).toBeLessThan(0);
  });
  it('conflit=direct', () => {
    expect(result.modes.conflit?.label).toBe('direct');
  });
  it('stress=parole', () => {
    expect(result.modes.stress?.label).toBe('parole');
  });
});

// ─── Cas bible : évitement conflit ───────────────────────────────────────────

describe('scoreTemperament — evitement du conflit', () => {
  const answers: TemperamentAnswers = {
    q5: 'q5_3', // ca depend: aucun delta
    q6: 'q6_1', // silence: expressiviteReserve +2, stress=silence
    q7: 'q7_3', // evite: expressiviteReserve +1, conflit=evitant
    q8: 'q8_1', // stabilite: stabiliteNouveaute -2
  };
  const result = scoreTemperament(answers);

  it('conflit=evitant', () => expect(result.modes.conflit?.label).toBe('évitant'));
  it('stress=silence', () => expect(result.modes.stress?.label).toBe('silence'));
  it('expressiviteReserve positif (reserve)', () => {
    expect(result.axes.expressiviteReserve.score).toBeGreaterThan(0);
  });
  it('stabiliteNouveaute negatif (stabilite)', () => {
    expect(result.axes.stabiliteNouveaute.score).toBeLessThan(0);
  });
});

// ─── Cas bible : contrôle élevé ──────────────────────────────────────────────

describe('scoreTemperament — controle eleve', () => {
  const answers: TemperamentAnswers = {
    q5: 'q5_3', // ca depend
    q6: 'q6_5', // controle: spontaneiteControle +2, rapportTemps +1, stress=controle
    q7: 'q7_2', // temps: rapportTemps +1, conflit=temporisateur
    q8: 'q8_6', // rythme: espaceProsimite -1, spontaneiteControle +1
  };
  const result = scoreTemperament(answers);

  it('spontaneiteControle tres positif (controle fort)', () => {
    expect(result.axes.spontaneiteControle.score).toBeGreaterThan(30);
  });
  it('rapportTemps positif (anticipation)', () => {
    expect(result.axes.rapportTemps.score).toBeGreaterThan(0);
  });
  it('stress=controle', () => expect(result.modes.stress?.label).toBe('contrôle'));
});

// ─── Étape 3 : communication directe + décision rationnelle ──────────────────

describe('scoreTemperament — direct + rationnel (etape 3)', () => {
  const answers: TemperamentAnswers = {
    q9:  'q9_1',  // droit au but: communicationStyle -2
    q10: 'q10_1', // pour et contre: sensibiliteDetails +1, decision=rationnel
    q11: 'q11_4', // rarement: expressiviteReserve +2
  };
  const result = scoreTemperament(answers);

  it('communicationStyle negatif (directe)', () => {
    expect(result.axes.communicationStyle.score).toBeLessThan(0);
  });
  it('decision=rationnel', () => expect(result.modes.decision?.label).toBe('rationnel'));
  it('expressiviteReserve positif (reserve)', () => {
    expect(result.axes.expressiviteReserve.score).toBeGreaterThan(0);
  });
});

// ─── Entrée vide ─────────────────────────────────────────────────────────────

describe('scoreTemperament — entree vide', () => {
  const result = scoreTemperament({});

  it('tous les axes a 0', () => {
    const axes = result.axes;
    expect(axes.energieSociale.score).toBe(0);
    expect(axes.espaceProsimite.score).toBe(0);
    expect(axes.communicationStyle.score).toBe(0);
    expect(axes.expressiviteReserve.score).toBe(0);
  });
  it('tous les modes null', () => {
    expect(result.modes.conflit).toBeNull();
    expect(result.modes.stress).toBeNull();
    expect(result.modes.decision).toBeNull();
    expect(result.modes.canal).toBeNull();
  });
});

// ─── Canal : écrit convergent (Q7 + Q9) ──────────────────────────────────────

describe('scoreTemperament — canal ecrit convergent', () => {
  const answers: TemperamentAnswers = {
    q7:  'q7_5',  // ecrit: communicationStyle +1, canal=ecrit
    q9:  'q9_5',  // ecrire: canal=ecrit
    q10: 'q10_2', // instinct: spontaneiteControle -1, decision=intuitif
    q11: 'q11_2', // quelques proches: expressiviteReserve -1
  };
  const result = scoreTemperament(answers);

  it('canal=ecrit avec intensity=2', () => {
    expect(result.modes.canal?.label).toBe('écrit');
    expect(result.modes.canal?.intensity).toBe(2);
  });
  it('decision=intuitif', () => expect(result.modes.decision?.label).toBe('intuitif'));
});

// ─── Normalisation bornée à ±100 ─────────────────────────────────────────────

describe('scoreTemperament — score borne a 100', () => {
  const answers: TemperamentAnswers = { q5: 'q5_5' }; // +2 extraversion
  const result = scoreTemperament(answers);

  it('score dans [-100, 100]', () => {
    for (const axis of Object.values(result.axes)) {
      expect(axis.score).toBeGreaterThanOrEqual(-100);
      expect(axis.score).toBeLessThanOrEqual(100);
    }
  });
});
