import { describe, it, expect } from 'vitest';
import { computeProfileSynthesis, buildFallbackNarrative } from './synthesis';
import type { FaceResult } from '@/lib/attention/scoring';

// Minimal FaceResult factory
function makeFace(dominant: string[] = [], secondaire: string[] = [], tertiaire: string[] = []): FaceResult {
  return {
    raw: { MOT: 0, SER: 0, CAD_C: 0, CAD_S: 0, EXP: 0, GES: 0, SUR: 0 },
    normalized: { MOT: 0, SER: 0, CAD_C: 0, CAD_S: 0, EXP: 0, GES: 0, SUR: 0 },
    dominant: dominant as any,
    secondaire: secondaire as any,
    tertiaire: tertiaire as any,
  };
}

const emptyInput = {
  reception: makeFace(),
  expression: makeFace(),
  temperamentAxes: null,
  temperamentModes: null,
  lifestyleAxes: null,
  relationalFilters: null,
  practicalInfo: null,
  singularity: null,
};

describe('computeProfileSynthesis', () => {
  it('returns empty arrays for a fully empty profile', () => {
    const facts = computeProfileSynthesis(emptyInput);
    expect(facts.topReceptionDims).toHaveLength(0);
    expect(facts.hasTemperamentData).toBe(false);
    expect(facts.hasLifestyleData).toBe(false);
  });

  it('extracts top reception dims from dominant and secondaire', () => {
    const reception = makeFace(['GES'], ['EXP', 'MOT']);
    const facts = computeProfileSynthesis({ ...emptyInput, reception });
    expect(facts.topReceptionDims).toContain('GES');
    expect(facts.topReceptionDims).toContain('EXP');
  });

  it('detects reception-expression contrast when dims differ', () => {
    const reception = makeFace(['GES'], ['EXP']);
    const expression = makeFace(['MOT'], []);
    const facts = computeProfileSynthesis({ ...emptyInput, reception, expression });
    expect(facts.hasReceptionExpressionContrast).toBe(true);
  });

  it('no contrast when reception and expression share top dim', () => {
    const reception = makeFace(['MOT'], ['GES']);
    const expression = makeFace(['MOT'], []);
    const facts = computeProfileSynthesis({ ...emptyInput, reception, expression });
    expect(facts.hasReceptionExpressionContrast).toBe(false);
  });

  it('adds touchInsights from reception dims', () => {
    const reception = makeFace(['GES'], ['EXP']);
    const facts = computeProfileSynthesis({ ...emptyInput, reception });
    expect(facts.touchInsights.length).toBeGreaterThanOrEqual(1);
  });

  it('adds avoidAlerts from relational filters', () => {
    const relationalFilters = {
      antiSurprisePublique: true,
      antiSurprisePlanning: false,
      antiSurpriseIntime: false,
      exigenceExecution: false,
      ouvertSurprise: false,
      besoinEcoute: false,
      peurOubli: false,
      besoinAir: false,
      sensibiliteCritique: false,
      besoinFiabilite: false,
      besoinProfondeur: false,
      sensibiliteChargeMetale: false,
      q17Text: '',
      q17Interdits: [],
    };
    const facts = computeProfileSynthesis({ ...emptyInput, relationalFilters });
    expect(facts.avoidAlerts).toContain("les surprises publiques ou devant du monde");
  });

  it('computes high besoin de controle label when score is positive', () => {
    const temperamentAxes = {
      spontaneiteControle: { score: 60, intensity: 3 },
      espaceProsimite: { score: 0, intensity: 0 },
      sensibiliteDetails: { score: 0, intensity: 0 },
      energieSociale: { score: 0, intensity: 0 },
      communicationStyle: { score: 0, intensity: 0 },
      expressiviteReserve: { score: 0, intensity: 0 },
      stabiliteNouveaute: { score: 0, intensity: 0 },
      exigenceStanding: { score: 0, intensity: 0 },
      rapportTemps: { score: 0, intensity: 0 },
    };
    const facts = computeProfileSynthesis({ ...emptyInput, temperamentAxes });
    expect(facts.controleLabel).toBe("plutôt élevé");
    expect(facts.spontaneiteLabel).toBe("plutôt discrète");
  });

  it('computes high spontaneite label when score is negative', () => {
    const temperamentAxes = {
      spontaneiteControle: { score: -60, intensity: 3 },
      espaceProsimite: { score: 0, intensity: 0 },
      sensibiliteDetails: { score: 0, intensity: 0 },
      energieSociale: { score: 0, intensity: 0 },
      communicationStyle: { score: 0, intensity: 0 },
      expressiviteReserve: { score: 0, intensity: 0 },
      stabiliteNouveaute: { score: 0, intensity: 0 },
      exigenceStanding: { score: 0, intensity: 0 },
      rapportTemps: { score: 0, intensity: 0 },
    };
    const facts = computeProfileSynthesis({ ...emptyInput, temperamentAxes });
    expect(facts.spontaneiteLabel).toBe("plutôt élevée");
    expect(facts.controleLabel).toBe("discret");
  });

  it('computes high besoin espace when espaceProsimite is negative', () => {
    const temperamentAxes = {
      spontaneiteControle: { score: 0, intensity: 0 },
      espaceProsimite: { score: -70, intensity: 3 },
      sensibiliteDetails: { score: 0, intensity: 0 },
      energieSociale: { score: 0, intensity: 0 },
      communicationStyle: { score: 0, intensity: 0 },
      expressiviteReserve: { score: 0, intensity: 0 },
      stabiliteNouveaute: { score: 0, intensity: 0 },
      exigenceStanding: { score: 0, intensity: 0 },
      rapportTemps: { score: 0, intensity: 0 },
    };
    const facts = computeProfileSynthesis({ ...emptyInput, temperamentAxes });
    expect(facts.besoinEspaceLabel).toBe("marqué");
  });

  it('slices touchInsights to max 5', () => {
    const reception = makeFace(['GES'], ['EXP', 'MOT'], ['SER', 'CAD_C']);
    const relationalFilters = {
      antiSurprisePublique: false, antiSurprisePlanning: false, antiSurpriseIntime: false,
      exigenceExecution: false, ouvertSurprise: false,
      besoinEcoute: true, peurOubli: false, besoinAir: false,
      sensibiliteCritique: false, besoinFiabilite: true, besoinProfondeur: true,
      sensibiliteChargeMetale: false, q17Text: '', q17Interdits: [],
    };
    const temperamentAxes = {
      spontaneiteControle: { score: 0, intensity: 0 },
      espaceProsimite: { score: 0, intensity: 0 },
      sensibiliteDetails: { score: 50, intensity: 2 },
      energieSociale: { score: 0, intensity: 0 },
      communicationStyle: { score: 0, intensity: 0 },
      expressiviteReserve: { score: 0, intensity: 0 },
      stabiliteNouveaute: { score: 0, intensity: 0 },
      exigenceStanding: { score: 60, intensity: 2 },
      rapportTemps: { score: 0, intensity: 0 },
    };
    const facts = computeProfileSynthesis({ ...emptyInput, reception, relationalFilters, temperamentAxes });
    expect(facts.touchInsights.length).toBeLessThanOrEqual(5);
  });
});

describe('buildFallbackNarrative', () => {
  it('builds a non-empty block1 for empty input', () => {
    const facts = computeProfileSynthesis(emptyInput);
    const narrative = buildFallbackNarrative(facts);
    expect(narrative.block1.length).toBeGreaterThan(0);
  });

  it('includes contrast text when reception and expression differ', () => {
    const reception = makeFace(['GES'], []);
    const expression = makeFace(['MOT'], []);
    const facts = computeProfileSynthesis({ ...emptyInput, reception, expression });
    const narrative = buildFallbackNarrative(facts);
    expect(narrative.block2_contrast_text.length).toBeGreaterThan(0);
  });
});
