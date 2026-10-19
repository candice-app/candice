// Équivalence de PROJECTION : la question q2 rendue depuis le canonique produit, pour un même
// libellé choisi, les MÊMES dims que la banque legacy → attention_reception inchangée (14 lecteurs).
// Asset de dims : round-trip 28 entrées actives. Par import, jamais parseur texte.

import { describe, expect, it } from 'vitest';
import { RECEPTION_QUESTIONS } from '../../attention/questions';
import { ONBOARDING_MAPPINGS } from '../../knowledge/onboarding';
import { ATTENTION_DIMS } from '../attention-dims';
import { buildCanonicalAttentionQuestion } from '../canonical-attention';

const norm = (s: string) => s.normalize('NFC').replace(/[’ʼ‘`´]/g, "'").replace(/…/g, '...').replace(/\s+/g, ' ').replace(/[(),.:;!?]/g, '').trim().toLowerCase();

describe('canonical-attention — équivalence de projection q2', () => {
  it('ATTENTION_DIMS : 28 entrées actives (domaine attention)', () => {
    expect(Object.keys(ATTENTION_DIMS)).toHaveLength(28);
  });

  it('q2 canonique : 7 options actives, ids = optionRef, labels = canonique', () => {
    const q2 = buildCanonicalAttentionQuestion('q2');
    const canonQ2 = ONBOARDING_MAPPINGS.filter((m) => m.questionCode === 'q2' && m.status === 'ACTIF');
    expect(q2.options).toHaveLength(canonQ2.length);
    expect(q2.options.map((o) => o.id)).toEqual(canonQ2.map((m) => m.optionRef));
    expect(q2.options.map((o) => o.label)).toEqual(canonQ2.map((m) => m.optionText));
  });

  it('dims identiques legacy ↔ canonique par LIBELLÉ (projection inchangée)', () => {
    const q2 = buildCanonicalAttentionQuestion('q2');
    const legacyQ2 = RECEPTION_QUESTIONS.find((q) => q.id === 'q2')!;
    const legacyByLabel = new Map(legacyQ2.options.map((o) => [norm(o.label), o.dims] as const));
    for (const o of q2.options) {
      expect(o.dims, o.label).toEqual(legacyByLabel.get(norm(o.label)));
    }
  });

  it('chaque option canonique q2 porte un subtext (présentation inerte)', () => {
    const q2 = buildCanonicalAttentionQuestion('q2');
    for (const o of q2.options) expect(o.subtext.length).toBeGreaterThan(0);
  });
});
