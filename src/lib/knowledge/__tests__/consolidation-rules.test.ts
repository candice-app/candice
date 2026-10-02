// Seuils de consolidation (docs/ontologie/consolidation-rules.md, v1.0.0).
// Vérifie les trois points de vigilance du document + l'estampille de version.

import { describe, expect, it } from 'vitest';
import { createProfileEvidence } from '../evidence';
import type { DirectionalEvidence } from '../evidence';
import {
  CONSOLIDATION_RULES,
  consolidateAffection,
  consolidateProfileConstruct,
} from '../consolidate';
import { defaultSignal } from '../signal';
import { CONSOLIDATION_VERSION, HSG_VERSION, ONTOLOGY_VERSION } from '../version';

const base = {
  raw_information: 'v',
  confidence: 'high' as const,
  timestamp: '2026-10-02T00:00:00Z',
  stability: 'contextual' as const,
  evidence_role: 'primary' as const,
  source_type: 'onboarding_closed' as const,
};

function ev(
  o: Partial<Parameters<typeof createProfileEvidence>[0]> & {
    source_id: string;
    evidence_id: string;
    target_construct: Parameters<typeof createProfileEvidence>[0]['target_construct'];
    value: Parameters<typeof createProfileEvidence>[0]['value'];
    context: string;
  },
): DirectionalEvidence {
  return createProfileEvidence({ ...base, ...o });
}

describe('Les seuils vivent dans un objet unique qui cite le document', () => {
  it('CONSOLIDATION_RULES cite consolidation-rules.md et porte sa version', () => {
    expect(CONSOLIDATION_RULES.source).toBe('docs/ontologie/consolidation-rules.md');
    expect(CONSOLIDATION_RULES.version).toBe(CONSOLIDATION_VERSION);
    expect(CONSOLIDATION_RULES.version).toBe('1.0.0');
  });
});

describe('low ne se produit QUE sur evidence contraire nette, jamais par faiblesse du nombre (R1)', () => {
  it('une seule evidence positive → jamais low (medium), jamais unknown', () => {
    const s = consolidateProfileConstruct('PROFILE_AUTONOMY', [
      ev({ evidence_id: 'e', source_id: 's', target_construct: 'PROFILE_AUTONOMY', value: 1, context: 'decision' }),
    ]);
    expect(s.score).not.toBe('low');
    expect(s.score).toBe('medium');
  });
  it('une seule evidence secondaire (info mince) → jamais low ; confiance low, pas score low', () => {
    const s = consolidateProfileConstruct('PROFILE_OPENNESS', [
      ev({
        evidence_id: 'e',
        source_id: 's',
        target_construct: 'PROFILE_OPENNESS',
        value: 2,
        context: 'GLOBAL',
        evidence_role: 'secondary',
      }),
    ]);
    expect(s.score).not.toBe('low'); // info mince ≠ faiblesse démontrée
    expect(s.confidence).toBe('low');
  });
  it('evidence contraire nette (−) → low démontré', () => {
    const s = consolidateProfileConstruct('APPETENCE_OBJECT', [
      ev({
        evidence_id: 'e',
        source_id: 's',
        target_construct: 'APPETENCE_OBJECT',
        value: -1,
        context: 'GLOBAL',
        contraryMapping: true,
      }),
    ]);
    expect(s.score).toBe('low');
  });
});

describe('L’indépendance se compte sur source_id + source_type, jamais sur le nombre d’evidences (§4)', () => {
  function three(sourceIds: [string, string, string]) {
    return consolidateProfileConstruct('PROFILE_STRUCTURE', [
      ev({ evidence_id: 'e1', source_id: sourceIds[0], target_construct: 'PROFILE_STRUCTURE', value: 1, context: 'travel' }),
      ev({ evidence_id: 'e2', source_id: sourceIds[1], target_construct: 'PROFILE_STRUCTURE', value: 1, context: 'home' }),
      ev({ evidence_id: 'e3', source_id: sourceIds[2], target_construct: 'PROFILE_STRUCTURE', value: 1, context: 'work' }),
    ]);
  }
  it('3 evidences / 3 contextes mais UNE source → pas de GLOBAL_CONSOLIDATED (volume ≠ indépendance)', () => {
    const s = three(['same', 'same', 'same']);
    expect(s.globalStatus).toBe('LOCAL_ONLY');
  });
  it('3 evidences / 3 contextes / 3 sources indépendantes → GLOBAL_CONSOLIDATED', () => {
    const s = three(['s1', 's2', 's3']);
    expect(s.globalStatus).toBe('GLOBAL_CONSOLIDATED');
  });
});

describe('Conséquence voulue (§4) : l’onboarding seul (une source) n’atteint presque jamais confidence high', () => {
  it('5 evidences, contextes variés, mais une seule source onboarding → confiance jamais high', () => {
    const evidences: DirectionalEvidence[] = [
      ev({ evidence_id: 'a', source_id: 'onb', target_construct: 'PROFILE_RELATIONALITY', value: 2, context: 'GLOBAL' }),
      ev({ evidence_id: 'b', source_id: 'onb', target_construct: 'PROFILE_RELATIONALITY', value: 1, context: 'gift' }),
      ev({ evidence_id: 'c', source_id: 'onb', target_construct: 'PROFILE_RELATIONALITY', value: 1, context: 'travel' }),
      ev({ evidence_id: 'd', source_id: 'onb', target_construct: 'PROFILE_RELATIONALITY', value: 1, context: 'home' }),
      ev({ evidence_id: 'e', source_id: 'onb', target_construct: 'PROFILE_RELATIONALITY', value: 1, context: 'work' }),
    ];
    const s = consolidateProfileConstruct('PROFILE_RELATIONALITY', evidences);
    expect(s.confidence).not.toBe('high');
  });
});

describe('Toute structure consolidée persistée porte les trois versions', () => {
  const stamp = {
    ontology_version: ONTOLOGY_VERSION,
    hsg_version: HSG_VERSION,
    consolidation_version: CONSOLIDATION_VERSION,
  };
  it('un Signal consolidé porte version { ontology, hsg, consolidation }', () => {
    const s = consolidateProfileConstruct('PROFILE_AUTONOMY', [
      ev({ evidence_id: 'e', source_id: 's', target_construct: 'PROFILE_AUTONOMY', value: 1, context: 'decision' }),
    ]);
    expect(s.version).toEqual(stamp);
  });
  it('le signal par défaut (unknown) porte aussi la version', () => {
    expect(defaultSignal('PROFILE_OPENNESS').version).toEqual(stamp);
  });
  it('l’ensemble affectif consolidé porte la version', () => {
    const set = consolidateAffection([]);
    expect(set.version).toEqual(stamp);
  });
});
