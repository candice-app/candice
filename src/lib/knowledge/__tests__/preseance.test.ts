// Préséance par niveau (fixtures) — une inférence IA (niveau 5) ne bat JAMAIS une déclaration (niveau 1),
// même plus récente. Keyé sur les SEULES colonnes présentes sur une evidence : assertion_status + assertion_basis
// (source_type N'EXISTE PAS sur l'evidence — bug attrapé en garnissant Sophie sur la vraie base).
import { describe, expect, it } from 'vitest';
import { resolveByProvenance, type ResolvableEvidence } from '../preseance';
import { provenanceLevel } from '../sources';

const ev = (assertion_status: string, created_at: string, assertion_basis = 'self_report'): ResolvableEvidence =>
  ({ target_construct: 'IMPORTANCE_AESTHETIC', assertion_status, assertion_basis: assertion_basis as never, created_at });

describe('préséance par niveau de provenance', () => {
  it('déclaration (niv.1) bat extraction (niv.5), MÊME si l\'extraction est plus récente', () => {
    const declared = ev('declared', '2026-10-01T00:00:00Z');   // niveau 1, plus ANCIEN
    const extracted = ev('inferred', '2026-10-25T00:00:00Z');  // niveau 5, plus RÉCENT
    const [winner] = resolveByProvenance([extracted, declared]);
    expect(winner.assertion_status).toBe('declared'); // la déclarée gagne malgré la date
  });

  it('à niveau ÉGAL, la récence décide', () => {
    const older = ev('declared', '2026-10-01T00:00:00Z');
    const newer = ev('declared', '2026-10-25T00:00:00Z', 'subject_statement'); // même niveau 1
    const [winner] = resolveByProvenance([older, newer]);
    expect(winner.created_at).toBe('2026-10-25T00:00:00Z'); // plus récent à niveau égal
  });

  it('les niveaux : extraction=5, interprété=4, observé/rapporté=3, déclaration=1', () => {
    expect(provenanceLevel('inferred', 'self_report')).toBe(5);        // extraction (inférence IA)
    expect(provenanceLevel('reported', 'reporter_interpretation')).toBe(4); // le pilote conclut
    expect(provenanceLevel('observed', 'observed')).toBe(3);           // le pilote a vu
    expect(provenanceLevel('reported', 'self_report')).toBe(3);        // rapporté par un tiers
    expect(provenanceLevel('declared', 'self_report')).toBe(1);        // déclaration directe
  });

  it('user_correction est un ACTE, pas un niveau : niveau 1 sur SOI, 3/4 sur un PROCHE', () => {
    // sur soi : correction = déclaration directe (declared/self_report) → niveau 1
    expect(provenanceLevel('declared', 'self_report')).toBe(1);
    // sur un proche : le pilote a VU (observed → 3) ou CONCLUT (reporter_interpretation → 4)
    expect(provenanceLevel('observed', 'observed')).toBe(3);
    expect(provenanceLevel('reported', 'reporter_interpretation')).toBe(4);
    // conséquence au read : une déclaration de soi (niv.1) l'emporte sur une observation du pilote (niv.3)
    const selfDeclared = ev('declared', '2026-01-01T00:00:00Z', 'self_report');    // niv.1, ancien
    const pilotObserved = ev('observed', '2026-10-25T00:00:00Z', 'observed');      // niv.3, récent
    const [winner] = resolveByProvenance([pilotObserved, selfDeclared]);
    expect(winner.assertion_status).toBe('declared');
  });
});
