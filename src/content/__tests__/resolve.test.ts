// Résolution de contenu : {Prénom} inséré, aucun jeton ne survit (invariant de rendu).

import { describe, expect, it } from 'vitest';
import { resolveContent, resolveLines } from '../resolve';
import { INVITE_CONTENT, type InviteContentKey } from '../invite';

describe('resolveContent / resolveLines', () => {
  it('insère le prénom dans {Prénom}', () => {
    expect(resolveContent('mode.direct.label', 'Marc', 'homme')).toBe('Inviter Marc');
    expect(resolveContent('mode.incognito.label', 'Léa', 'femme')).toBe('Renseigner ce que tu sais de Léa');
  });

  it('rend toujours un tableau de paragraphes', () => {
    expect(resolveLines('mode.direct.verdict', 'Léa', 'femme')).toHaveLength(1);
    expect(resolveLines('mode.incognito.body', 'Léa', 'femme')).toHaveLength(2);
  });

  it('aucun jeton ne survit après résolution, quel que soit le genre', () => {
    for (const g of ['femme', 'homme', 'non_binaire', 'non_precise', null] as const) {
      for (const k of Object.keys(INVITE_CONTENT) as InviteContentKey[]) {
        for (const line of resolveLines(k, 'Dominique', g)) {
          expect(line.includes('{'), `${k} (${g})`).toBe(false);
          expect(line.includes('}'), `${k} (${g})`).toBe(false);
        }
      }
    }
  });
});
