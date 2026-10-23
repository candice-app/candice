// Cœur déterministe de la génération par section (fixtures) : sélection (le modèle n'élit rien) + double
// contrôle (7a mécanique). Pas de modèle, pas de base.
import { describe, expect, it } from 'vitest';
import { selectSectionInputs, verifySection, SECTION_SPECS, consumedFamilies } from '../profile-sections';
import type { AttentionBreathTag, SocleFact } from '../../questionnaire/breath-tags';

const tag = (family: string, construct: string, strength: string, rank: number | null, extra: Partial<AttentionBreathTag> = {}): AttentionBreathTag =>
  ({ family, construct, strength, rank, basis: 'self_report', confidence: 'high', ...extra });

describe('selectSectionInputs — le modèle n\'élit rien (sélection + ordre déterministes)', () => {
  const tags: AttentionBreathTag[] = [
    tag('AFFECTION_LANGUAGE', 'AFFECTION_RECEIVE_WORDS', 'strong', 1, { direction: 'receive', modality: 'WORDS' }),
    tag('AFFECTION_LANGUAGE', 'AFFECTION_RECEIVE_QUALITY_TIME', 'moderate', 2, { direction: 'receive', modality: 'QUALITY_TIME' }),
    tag('NEED', 'NEED_TRUST', 'strong', null),
    tag('PROFILE', 'IMPORTANCE_AESTHETIC', 'moderate', null),
    tag('GUARDRAIL', 'GRD_PUBLIC_EXPOSURE', 'strong', null),
  ];
  const facts: SocleFact[] = [
    { factType: 'singularity.marques_lieux', value: 'Aesop, Le Bon Marché' },
    { factType: 'singularity.envies_reves', value: 'apprendre la céramique' },
  ];
  const inputs = selectSectionInputs(tags, facts);
  const byKey = new Map(inputs.map((i) => [i.key, i]));

  it('deep_touch reçoit les AFFECTION reçues, ordonnées par force puis rang', () => {
    const items = byKey.get('deep_touch')!.items;
    expect(items.map((i) => i.key)).toEqual(['AFFECTION_RECEIVE_WORDS', 'AFFECTION_RECEIVE_QUALITY_TIME']); // strong avant moderate
    expect(items[0].confidence).toBe('high'); // la confiance voyage
  });
  it('univers_marques reçoit le FACT verbatim (se remplit maintenant)', () => {
    expect(byKey.get('univers_marques')!.items[0].content).toBe('Aesop, Le Bon Marché');
  });
  it('deep_miss reçoit le GUARDRAIL ; deep_loved le NEED', () => {
    expect(byKey.get('deep_miss')!.items.map((i) => i.key)).toContain('GRD_PUBLIC_EXPOSURE');
    expect(byKey.get('deep_loved')!.items.map((i) => i.key)).toContain('NEED_TRUST');
  });
  it('monde_tables (texte libre) : vide et signalé, jamais masqué', () => {
    const s = byKey.get('monde_tables')!;
    expect(s.freeTextOnly).toBe(true);
    expect(s.items).toHaveLength(0);
  });
});

describe('verifySection — 7a mécanique (omission / invention / forme)', () => {
  it('traité == entrée, phrase finie → ok', () => {
    expect(verifySection(['a', 'b'], ['a', 'b'], 'Elle aime les mots et le temps partagé.')).toEqual({ ok: true, omission: [], invention: [], formFault: null });
  });
  it('OMISSION : une clé d\'entrée non traitée', () => {
    const v = verifySection(['a', 'b'], ['a'], 'Texte.');
    expect(v.ok).toBe(false); expect(v.omission).toEqual(['b']);
  });
  it('INVENTION : une clé traitée absente de l\'entrée', () => {
    const v = verifySection(['a'], ['a', 'z'], 'Texte.');
    expect(v.ok).toBe(false); expect(v.invention).toEqual(['z']);
  });
  it('FORME : vide avec matière → empty_with_matter ; tronqué → truncated', () => {
    expect(verifySection(['a'], ['a'], '   ').formFault).toBe('empty_with_matter');
    expect(verifySection(['a'], ['a'], 'Elle aime les mots et').formFault).toBe('truncated');
  });
});

// CONTRÔLE STRUCTUREL (hsg §48octies) : toute famille qui PRODUIT des tags doit être CONSOMMÉE par au
// moins une section. L'angle mort que le double contrôle ne voit pas (il ne vérifie que ce qui est DONNÉ
// à une section, pas qu'une famille entière n'est jamais donnée). ENTITY/CONTEXT exemptées : aucun
// producteur aujourd'hui (elles viendront de l'extraction / du lot ÉTATS).
it('toute famille produite est consommée par ≥1 section (pas d\'angle mort)', () => {
  const PRODUCED = ['AFFECTION_LANGUAGE', 'NEED', 'PREFERENCE', 'PROFILE', 'GUARDRAIL', 'DRIVER', 'BEHAVIOR', 'INTEREST'];
  const consumed = consumedFamilies();
  for (const fam of PRODUCED) expect(consumed.has(fam), `famille ${fam} consommée par aucune section`).toBe(true);
});

it('synthèses dépendent uniquement de détails (jamais d\'autres synthèses)', () => {
  const detailKeys = new Set(SECTION_SPECS.filter((s) => s.tier === 'detail').map((s) => s.key));
  for (const s of SECTION_SPECS.filter((s) => s.tier === 'synthesis')) {
    for (const dep of s.dependsOn ?? []) expect(detailKeys.has(dep), `${s.key} → ${dep}`).toBe(true);
  }
});
