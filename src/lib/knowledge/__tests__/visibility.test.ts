// Lot A bis — politique de visibilité (échelle ordonnée, plafond de sensibilité).

import { describe, expect, it } from 'vitest';
import {
  EXPOSURE_LEVELS,
  SENSITIVITY_CEILING,
  effectiveExposure,
  type VisibilityPolicy,
} from '../visibility';
import { createProfileEvidence } from '../evidence';
import { createSourceRecord } from '../sources';
import { createFact } from '../fact';
import { asContactId, contactAbout, asUserId, type KnowledgeScope } from '../identity';

const scope: KnowledgeScope = { about: contactAbout(asContactId('c1')), ownerId: asUserId('u1') };

describe('15 — ni evidence ni SourceRecord ne portent de champ de visibilité', () => {
  it('une evidence est de la provenance interne par nature : aucun champ visibility', () => {
    const e = createProfileEvidence({
      ...scope,
      evidence_id: 'e',
      source_id: 's',
      source_type: 'onboarding_closed',
      raw_information: 'v',
      confidence: 'high',
      context: 'GLOBAL',
      timestamp: '2026-10-02T00:00:00Z',
      stability: 'contextual',
      evidence_role: 'primary',
      target_construct: 'PROFILE_OPENNESS',
      value: 1,
    });
    expect('visibility' in e).toBe(false);
    const src = createSourceRecord({
      ...scope,
      id: 's',
      sourceType: 'onboarding_open',
      questionText: 'q',
      rawText: 'r',
      timestamp: '2026-10-02T00:00:00Z',
    });
    expect('visibility' in src).toBe(false);
  });
});

describe('16 — effectiveExposure fait primer userOverride sur derived (contenu non sensible)', () => {
  it('un choix utilisateur explicite prime sur le niveau dérivé', () => {
    const p: VisibilityPolicy = { derived: 'exposable', userOverride: 'visible' };
    expect(effectiveExposure(p)).toBe('visible');
    const q: VisibilityPolicy = { derived: 'visible', userOverride: 'exposable' };
    expect(effectiveExposure(q)).toBe('exposable'); // abaisse aussi
  });
});

describe('17 — un FACT sensible est internal_only et n’apparaît dans aucune justification visible', () => {
  it('derived = internal_only sur FACT sensible', () => {
    const f = createFact({
      ...scope,
      fact_id: 'f',
      fact_type: 'health',
      value: 'contrainte de santé',
      source: 's',
      timestamp: '2026-10-02T00:00:00Z',
      confidence: 'high',
      sensitivity: { isSensitive: true, category: 'santé' },
    });
    expect(f.visibility.derived).toBe('internal_only');
    expect(effectiveExposure(f.visibility)).toBe('internal_only');
  });
});

describe('18 — plafond de sensibilité isolé derrière une constante nommée (POINT D’ARRÊT 2)', () => {
  it('SENSITIVITY_CEILING = internal_only ; userOverride ne peut JAMAIS l’élever', () => {
    expect(SENSITIVITY_CEILING).toBe('internal_only');
    // Comportement actuel implémenté, en attente d'arbitrage Estelle :
    const p: VisibilityPolicy = { derived: 'internal_only', userOverride: 'shared_with_relatives' };
    expect(effectiveExposure(p)).toBe('internal_only');
    // L'échelle est bien ordonnée et monotone.
    expect(EXPOSURE_LEVELS[0]).toBe('internal_only');
    expect(EXPOSURE_LEVELS[EXPOSURE_LEVELS.length - 1]).toBe('shared_with_relatives');
  });
});
