import { describe, it, expect } from 'vitest';
import { scoreLifestyle } from './scoring';
import type { LifestyleAnswers } from './scoring';

// ─── Lifestyle axes — foodie + premium ───────────────────────────────────────

describe('scoreLifestyle — foodie et premium', () => {
  const answers: LifestyleAnswers = {
    q12: 'q12_3', // qualite: premiumSimplicite+1, exigence+1(temp)
    q15: 'q15_3', // belles tables: foodie+1, premiumSimplicite+2
    q16: 'q16_4', // luxe: authenticiteLuxe-2, premiumSimplicite+1
  };
  const result = scoreLifestyle(answers);

  it('foodie positif', () => {
    expect(result.axes.foodie.score).toBeGreaterThan(0);
  });
  it('premiumSimplicite positif (premium)', () => {
    expect(result.axes.premiumSimplicite.score).toBeGreaterThan(0);
  });
  it('authenticiteLuxe negatif (vers luxe)', () => {
    expect(result.axes.authenticiteLuxe.score).toBeLessThan(0);
  });
  it('exigenceStanding dans supplements temperament', () => {
    expect(result.temperamentSupplements.exigenceStanding).toBeDefined();
  });
});

// ─── Lifestyle axes — experience + simplicite ────────────────────────────────

describe('scoreLifestyle — experience et simplicite', () => {
  const answers: LifestyleAnswers = {
    q12: 'q12_1', // attention sincere: premiumSimplicite-2, authenticite+1
    q13: 'q13_1', // experiences: experienceObjet+2
    q14: 'q14_5', // prefere experiences: experienceObjet+2
    q16: 'q16_1', // destination: aventureConfort+2
  };
  const result = scoreLifestyle(answers);

  it('experienceObjet tres positif', () => {
    expect(result.axes.experienceObjet.score).toBeGreaterThanOrEqual(50);
  });
  it('premiumSimplicite negatif (simplicite)', () => {
    expect(result.axes.premiumSimplicite.score).toBeLessThan(0);
  });
  it('aventureConfort positif', () => {
    expect(result.axes.aventureConfort.score).toBeGreaterThan(0);
  });
  it('authenticiteLuxe positif', () => {
    expect(result.axes.authenticiteLuxe.score).toBeGreaterThan(0);
  });
});

// ─── Supplements temperament — Q4a planning ──────────────────────────────────

describe('scoreLifestyle — supplements temperament Q4a Q4c', () => {
  const answers: LifestyleAnswers = {
    q4a: 'q4a_1', // planifie: rapportTemps+2, spontaneiteControle+1
    q4c: 'q4c_1', // tout savoir: spontaneiteControle+2, rapportTemps+1, filter antiSurprisePlanning
  };
  const result = scoreLifestyle(answers);

  it('rapportTemps supplement eleve', () => {
    expect((result.temperamentSupplements.rapportTemps ?? 0)).toBeGreaterThan(0);
  });
  it('spontaneiteControle supplement eleve', () => {
    expect((result.temperamentSupplements.spontaneiteControle ?? 0)).toBeGreaterThan(0);
  });
  it('antiSurprisePlanning actif', () => {
    expect(result.relationalFilters.antiSurprisePlanning).toBe(true);
  });
});

// ─── Canal supplement — Q4d ecrit ────────────────────────────────────────────

describe('scoreLifestyle — canal supplement Q4d', () => {
  const answers: LifestyleAnswers = {
    q4d: 'q4d_2', // ecrit
  };
  const result = scoreLifestyle(answers);

  it('canal supplement ecrit', () => {
    expect(result.canalSupplements).toContain('écrit');
  });
});

// ─── Filtres relationnels — Q18 Q19 ──────────────────────────────────────────

describe('scoreLifestyle — filtres relationnels Q18 Q19', () => {
  const answers: LifestyleAnswers = {
    q18: 'q18_1', // surprise publique: antiSurprisePublique
    q19: 'q19_3', // envahi: besoinAir + espaceProsimite-2
  };
  const result = scoreLifestyle(answers);

  it('antiSurprisePublique actif', () => {
    expect(result.relationalFilters.antiSurprisePublique).toBe(true);
  });
  it('besoinAir actif', () => {
    expect(result.relationalFilters.besoinAir).toBe(true);
  });
  it('espaceProsimite supplement negatif', () => {
    expect((result.temperamentSupplements.espaceProsimite ?? 0)).toBeLessThan(0);
  });
  it('antiSurprisePlanning inactif par defaut', () => {
    expect(result.relationalFilters.antiSurprisePlanning).toBe(false);
  });
});

// ─── Scores bornes a 100 ─────────────────────────────────────────────────────

describe('scoreLifestyle — scores bornes', () => {
  const answers: LifestyleAnswers = {
    q13: 'q13_1', // experienceObjet+2
    q14: 'q14_5', // experienceObjet+2
  };
  const result = scoreLifestyle(answers);

  it('tous les axes dans [-100, 100]', () => {
    for (const axis of Object.values(result.axes)) {
      expect(axis.score).toBeGreaterThanOrEqual(-100);
      expect(axis.score).toBeLessThanOrEqual(100);
    }
  });
});

// ─── Entree vide ─────────────────────────────────────────────────────────────

describe('scoreLifestyle — entree vide', () => {
  const result = scoreLifestyle({});

  it('tous les axes lifestyle a 0', () => {
    for (const axis of Object.values(result.axes)) {
      expect(axis.score).toBe(0);
    }
  });
  it('aucun filtre actif', () => {
    expect(result.relationalFilters.antiSurprisePublique).toBe(false);
    expect(result.relationalFilters.besoinAir).toBe(false);
    expect(result.relationalFilters.peurOubli).toBe(false);
  });
  it('supplements temperament vides', () => {
    expect(Object.keys(result.temperamentSupplements)).toHaveLength(0);
  });
});
