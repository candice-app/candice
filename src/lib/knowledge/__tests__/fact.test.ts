// Tests 24–26 — FACT & traçabilité.

import { describe, expect, it } from 'vitest';
import { createFact, isSensitiveFact } from '../fact';
import { createSourceRecord } from '../sources';
import { asContactId, contactAbout, asUserId, type KnowledgeScope } from '../identity';
import { effectiveExposure } from '../visibility';

const scope: KnowledgeScope = { about: contactAbout(asContactId('c1')), ownerId: asUserId('u1') };

describe('Test 24 — un FACT peut ne produire aucun signal (0 est normal, §11.1)', () => {
  it('evidence_ids vide par défaut, le FACT existe quand même', () => {
    const f = createFact({
      ...scope,
      fact_id: 'f1',
      fact_type: 'biographical',
      value: 'a vécu dix ans au Japon',
      source: 's1',
      timestamp: '2026-10-02T00:00:00Z',
      confidence: 'high',
    });
    expect(f.evidence_ids).toEqual([]);
    expect(f.value).toContain('Japon');
  });
});

describe('Test 25 — FACT sensible : visibilité internal_only (remplace usableInVisibleRationale, R12/§11.2)', () => {
  it('un FACT sensible a visibility.derived = internal_only et n’apparaît dans aucune justification visible', () => {
    const f = createFact({
      ...scope,
      fact_id: 'f2',
      fact_type: 'health',
      value: 'TDAH déclaré',
      source: 's2',
      timestamp: '2026-10-02T00:00:00Z',
      confidence: 'high',
      sensitivity: { isSensitive: true, category: 'neurodivergence' },
    });
    expect(isSensitiveFact(f)).toBe(true);
    expect(f.visibility.derived).toBe('internal_only');
    // Même avec un override utilisateur, le plafond de sensibilité tient (point d'arrêt 2).
    expect(effectiveExposure({ ...f.visibility, userOverride: 'shared_with_relatives' })).toBe('internal_only');
  });
});

describe('Test 26 — traçabilité : la source conserve le verbatim et les liens produits', () => {
  it('verbatim non tronqué + tableaux de traçabilité initialisés', () => {
    const long = 'A'.repeat(500) + ' réponse ouverte complète, jamais résumée.';
    const src = createSourceRecord({
      ...scope,
      id: 'src1',
      sourceType: 'onboarding_open',
      questionText: 'Qu’est-ce qui te touche ?',
      rawText: long,
      timestamp: '2026-10-02T00:00:00Z',
    });
    expect(src.rawText).toBe(long); // aucun tronquage / résumé
    expect(src.assertionStatus).toBe('declared'); // dérivé
    expect(src.producedEvidenceIds).toEqual([]);
    expect(src.producedFactIds).toEqual([]);
    expect(src.producedOpenKnowledgeIds).toEqual([]);
  });
});
