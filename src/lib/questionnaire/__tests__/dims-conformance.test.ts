// CONFORMITÉ dims : le code (attention-dims.ts) == la DOC D'AUTORITÉ (onboarding-v15-mappings.md).
// La doc fait foi (les dims y sont inscrites, reprises du scoring déployé). Le code est vérifié
// CONTRE elle — comme la conformité des libellés. Zéro écart. Par parsing de la table de la doc.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ATTENTION_DIMS } from '../attention-dims';

function parseDocDims(): Record<string, string[]> {
  const md = readFileSync('docs/ontologie/onboarding-v15-mappings.md', 'utf8').split('\n');
  const out: Record<string, string[]> = {};
  // lignes « | <ref> | <q> | <libellé> | `DIM, DIM` | » de la section dims
  for (const l of md) {
    const m = l.match(/^\|\s*([0-9]+[a-z]?)\s*\|\s*(q[0-9a-z]+)\s*\|[^|]*\|\s*`([^`]+)`\s*\|/);
    if (m && ['q1', 'q2', 'q4', 'qe'].includes(m[2])) {
      out[m[1]] = m[3].split(',').map((s) => s.trim());
    }
  }
  return out;
}

describe('Conformité dims — code ↔ doc d’autorité (onboarding-v15-mappings.md)', () => {
  const doc = parseDocDims();

  it('28 dims inscrites dans la doc', () => {
    expect(Object.keys(doc)).toHaveLength(28);
  });

  it('code == doc, zéro écart (la doc fait foi)', () => {
    expect(ATTENTION_DIMS).toEqual(doc);
  });
});
