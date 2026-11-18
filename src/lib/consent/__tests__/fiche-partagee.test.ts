import { describe, it, expect } from 'vitest';
import { partageEtabli, filtrerAnalyse } from '../fiche-partagee';

const O = '11111111-1111-4111-8111-111111111111', X = '22222222-2222-4222-8222-222222222222';
const ANALYSE = {
  summary: 'RESUME', gender: 'f', confidence: 0.8,
  sections: {
    what_touches: { text: 'TOUCHE' }, feels_loved: { text: 'AIMEE' }, gifts: { text: 'PLAISIR' },
    avoid: { text: 'A_COTE', chips: ['x'] }, restaurants: { text: 'TABLES' }, attention: { text: 'ATTENTION' },
    points_fixes: { text: 'POINTS' },
  },
};

describe('un partage de fiche n’ouvre que s’il est établi', () => {
  it('actif et accordé par son titulaire', () => expect(partageEtabli({ status: 'active', pilote_id: O, granted_by: O })).toBe(true));
  it('actif sans preuve (ligne ancienne)', () => expect(partageEtabli({ status: 'active', pilote_id: O, granted_by: null })).toBe(false));
  it('actif, « accordé » par le lecteur', () => expect(partageEtabli({ status: 'active', pilote_id: O, granted_by: X })).toBe(false));
  it('retiré', () => expect(partageEtabli({ status: 'revoked', pilote_id: O, granted_by: O })).toBe(false));
  it('en attente', () => expect(partageEtabli({ status: 'pending', pilote_id: O, granted_by: null })).toBe(false));
  it('absent', () => expect(partageEtabli(null)).toBe(false));
});

describe('l’analyse rendue suit la portée, section par section', () => {
  it('mode aveugle : rien', () => expect(filtrerAnalyse(ANALYSE, { aveugle: true, sections: [] })).toBeNull());
  it('essentiel seulement : le résumé, aucune section', () => {
    const r = filtrerAnalyse(ANALYSE, { aveugle: false, sections: [] })!;
    expect(r.summary).toBe('RESUME'); expect(Object.keys(r.sections)).toEqual([]);
  });
  it('une section cochée ne sort qu’elle', () => {
    const r = filtrerAnalyse(ANALYSE, { aveugle: false, sections: ['deep_miss'] })!;
    expect(Object.keys(r.sections)).toEqual(['avoid']);
    expect(JSON.stringify(r)).not.toMatch(/TOUCHE|AIMEE|PLAISIR|TABLES/);
  });
  it('une section sans case (jamais proposée au partage) ne sort jamais', () => {
    const r = filtrerAnalyse(ANALYSE, { aveugle: false, sections: ['deep_touch', 'deep_loved', 'deep_pleasure', 'deep_miss', 'monde_tables', 'univers'] })!;
    expect(JSON.stringify(r)).not.toMatch(/ATTENTION|POINTS/);
  });
  it('la mesure de confiance interne ne sort pas', () => expect(filtrerAnalyse(ANALYSE, { aveugle: false, sections: [] })!.confidence).toBeNull());
});
