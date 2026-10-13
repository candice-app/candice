// Garde des 3 règles d'Estelle sur la copy arbitrée (src/content/invite.ts).

import { describe, expect, it } from 'vitest';
import { INVITE_CONTENT, type ContentValue } from '../invite';

const values: Array<[string, string]> = [];
for (const [k, raw] of Object.entries(INVITE_CONTENT) as Array<[string, ContentValue]>) {
  for (const s of Array.isArray(raw) ? raw : [raw]) values.push([k, s]);
}

describe('Copy invitation — règles Estelle', () => {
  it('règle 1 : aucun « Julie » en dur (le prénom est le jeton {Prénom})', () => {
    const offenders = values.filter(([, s]) => /Julie/.test(s)).map(([k]) => k);
    expect(offenders).toEqual([]);
  });

  it('règle 2 : aucune durée variable {durée} (les mentions fixes restent de la copy)', () => {
    const offenders = values.filter(([, s]) => /\{dur[ée]e?\}/i.test(s)).map(([k]) => k);
    expect(offenders).toEqual([]);
  });

  it('aucun jeton {…} hors {Prénom}/{Pronom}/{pronom} (pas de clé provisoire oubliée)', () => {
    const allowed = new Set(['Prénom', 'Pronom', 'pronom']);
    const stray: string[] = [];
    for (const [k, s] of values) {
      for (const m of s.matchAll(/\{([^}]+)\}/g)) if (!allowed.has(m[1])) stray.push(`${k}: {${m[1]}}`);
    }
    expect(stray).toEqual([]);
  });

  it('les clés des trois cartes + footer sont présentes', () => {
    for (const k of [
      'mode.direct.label', 'mode.direct.badge', 'mode.direct.body', 'mode.direct.verdict',
      'mode.cotecote.label', 'mode.cotecote.body', 'mode.cotecote.verdict',
      'mode.incognito.label', 'mode.incognito.body', 'mode.incognito.verdict',
      'mode.footer', 'incognito.reminder',
    ] as const) {
      expect(INVITE_CONTENT[k], k).toBeTruthy();
    }
  });

  it('la clé signup.consent est ABSENTE (à rédiger par Estelle, jamais inventée en code)', () => {
    expect('signup.consent' in INVITE_CONTENT).toBe(false);
  });
});
