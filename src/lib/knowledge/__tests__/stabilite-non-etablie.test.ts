import { describe, it, expect } from 'vitest';
import { computeStability } from '../consolidate';
import { EVIDENCE_STABILITIES, type Evidence } from '../evidence';
import { evidenceToRow } from '../../knowledge-write/rows';

const ev = (stability: string, source: string) => ({ stability, source_id: source, source_type: 'discovery_closed', evidence_id: `e-${source}` } as unknown as Evidence);

describe('la stabilité non établie (`undetermined`) ne pèse sur aucun calcul', () => {
  it('fait partie du vocabulaire fermé, et une valeur inconnue est refusée avant la base', () => {
    expect(EVIDENCE_STABILITIES).toContain('undetermined');
    expect(() => evidenceToRow({ ...ev('durable', 's1'), ownerId: 'u', target_family: 'INTEREST' } as unknown as Evidence, { kind: 'account', id: 'u' } as never)).toThrow(/hors vocabulaire/);
  });
  it('seule, elle se consolide en « unknown » — ni contextuelle, ni stable', () => {
    expect(computeStability([ev('undetermined', 's1')])).toBe('unknown');
    expect(computeStability([ev('undetermined', 's1'), ev('undetermined', 's2')])).toBe('unknown');
  });
  it('elle ne change pas la stabilité que d’autres preuves établissent', () => {
    for (const s of ['evolving', 'temporary', 'contextual'] as const) expect(computeStability([ev(s, 's1'), ev('undetermined', 's2')])).toBe(computeStability([ev(s, 's1')]));
  });
  it('elle ne sert pas de seconde source pour atteindre « stable »', () => {
    expect(computeStability([ev('stable', 's1'), ev('undetermined', 's2')])).toBe(computeStability([ev('stable', 's1')]));
    expect(computeStability([ev('stable', 's1'), ev('undetermined', 's2')])).not.toBe('stable');
  });
});
