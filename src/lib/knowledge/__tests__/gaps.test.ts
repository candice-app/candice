// Test 35 — ONTOLOGY_GAP : l'absence de code fermé n'est pas un gap (R24) ;
// les 4 critères doivent être réunis simultanément (§36) ; un gap ne crée rien.

import { describe, expect, it } from 'vitest';
import { assessOntologyGap } from '../gaps';

const allCriteria = {
  recurrent: true,
  operationallyImportant: true,
  needsSpecificLogic: true,
  notRepresentable: true,
};

describe('Test 35 — détection d’un véritable ONTOLOGY_GAP', () => {
  it('information représentable par une voie existante → PAS un gap (R24)', () => {
    const r = assessOntologyGap({
      phenomenon: 'a vécu à Tokyo 2014–2018',
      coveredBy: ['fact', 'entity', 'context'],
      criteria: allCriteria,
    });
    expect(r.isGap).toBe(false);
  });
  it('les 4 critères manquants → pas un gap', () => {
    const r = assessOntologyGap({
      phenomenon: 'phénomène isolé',
      criteria: { ...allCriteria, recurrent: false },
    });
    expect(r.isGap).toBe(false);
  });
  it('4 critères réunis + non représentable → gap mis en file d’arbitrage, sans construct', () => {
    const r = assessOntologyGap({
      phenomenon: 'coût énergétique de l’organisation comme contrainte de reco',
      criteria: allCriteria,
    });
    expect(r.isGap).toBe(true);
    if (r.isGap) {
      expect(r.queued.status).toBe('queued_for_human_arbitration');
    }
  });
});
