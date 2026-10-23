// Préséance par niveau (fixtures) — une inférence IA (niveau 5) ne bat JAMAIS une déclaration (niveau 1),
// même plus récente. C'est le danger que posait assertionBasis='self_report' sur une evidence extraite.
import { describe, expect, it } from 'vitest';
import { resolveByProvenance, type ResolvableEvidence } from '../preseance';
import { provenanceLevel } from '../sources';

const ev = (source_type: string, created_at: string, assertionBasis = 'self_report'): ResolvableEvidence =>
  ({ target_construct: 'IMPORTANCE_AESTHETIC', source_type: source_type as never, assertionBasis: assertionBasis as never, created_at });

describe('préséance par niveau de provenance', () => {
  it('déclaration (niv.1) bat extraction (niv.5), MÊME si l\'extraction est plus récente', () => {
    const declared = ev('onboarding_open', '2026-10-01T00:00:00Z');       // niveau 1, plus ANCIEN
    const extracted = ev('extraction_inferred', '2026-10-25T00:00:00Z');  // niveau 5, plus RÉCENT
    const [winner] = resolveByProvenance([extracted, declared]);
    expect(winner.source_type).toBe('onboarding_open'); // la déclarée gagne malgré la date
  });

  it('à niveau ÉGAL, la récence décide', () => {
    const older = ev('onboarding_open', '2026-10-01T00:00:00Z');
    const newer = ev('onboarding_closed', '2026-10-25T00:00:00Z'); // même niveau 1
    const [winner] = resolveByProvenance([older, newer]);
    expect(winner.source_type).toBe('onboarding_closed'); // plus récent à niveau égal
  });

  it('les six niveaux : extraction=5, incognito observé=3 / interprété=4, côte à côte=2, déclaration=1', () => {
    expect(provenanceLevel('extraction_inferred', 'self_report')).toBe(5);
    expect(provenanceLevel('reported_by_relative', 'observed')).toBe(3);
    expect(provenanceLevel('reported_by_relative', 'reporter_interpretation')).toBe(4);
    expect(provenanceLevel('declared_via_relative', 'self_report')).toBe(2);
    expect(provenanceLevel('onboarding_open', 'self_report')).toBe(1);
  });

  it('user_correction est un ACTE, pas un niveau : niveau 1 sur SOI, 3/4 sur un PROCHE', () => {
    // sur soi (self_report) : correction d'une déclaration directe → niveau 1
    expect(provenanceLevel('user_correction', 'self_report')).toBe(1);
    // sur un proche : le pilote a VU (observed) → niveau 3 ; il CONCLUT (reporter_interpretation) → niveau 4
    expect(provenanceLevel('user_correction', 'observed')).toBe(3);
    expect(provenanceLevel('user_correction', 'reporter_interpretation')).toBe(4);
    // conséquence au read : une déclaration de soi (niv.1) l'emporte sur une correction-observation du pilote (niv.3)
    const selfDeclared = ev('onboarding_open', '2026-01-01T00:00:00Z', 'self_report');          // niv.1, ancien
    const pilotObserved = ev('user_correction', '2026-10-25T00:00:00Z', 'observed');            // niv.3, récent
    const [winner] = resolveByProvenance([pilotObserved, selfDeclared]);
    expect(winner.source_type).toBe('onboarding_open');
  });
});
