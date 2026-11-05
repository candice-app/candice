// Orchestration de la génération par section (ligne 4) — logique PURE, modèle factice, pas de réseau ni base.
import { describe, expect, it, vi } from 'vitest';
import { resolveAffirmations, assembleText, generateAllSections, proportionalityViolation, type ModelAffirmation, type SectionModelCaller } from '../generate-sections';
import type { AttentionBreathTag, SocleFact } from '../../questionnaire/breath-tags';
import type { MatterItem } from '../profile-sections';

const matter = (key: string, sourceIds: string[], content = key): MatterItem => ({ key, content, confidence: 'high', sourceIds });

describe('resolveAffirmations — traçabilité à l\'affirmation + règle d\'ensemble vide', () => {
  it('résout treatedKeys → union des sourceIds (sous-ensemble exact)', () => {
    const m = [matter('A', ['s1']), matter('B', ['s2', 's3'])];
    const raw: ModelAffirmation[] = [{ id: 'a1', type: 'tendance', text: 'phrase A+B', treatedKeys: ['A', 'B'] }];
    const { affirmations, sourceEvidenceIds } = resolveAffirmations('deep_touch', m, raw, { warn: () => {} });
    expect(affirmations).toHaveLength(1);
    expect([...affirmations[0].evidence_ids].sort()).toEqual(['s1', 's2', 's3']);
    expect([...sourceEvidenceIds].sort()).toEqual(['s1', 's2', 's3']); // union de la section
  });

  it('RETIRE une affirmation à ensemble vide (clé sans source) et log BRUYANT', () => {
    const warn = vi.fn();
    const m = [matter('A', [])]; // clé présente mais sans aucune source
    const raw: ModelAffirmation[] = [{ id: 'empty', type: 'hypothese', text: 'spéculation', treatedKeys: ['A'] }];
    const { affirmations, sourceEvidenceIds } = resolveAffirmations('works', m, raw, { warn });
    expect(affirmations).toHaveLength(0);        // jamais publiée telle quelle
    expect(sourceEvidenceIds).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('RETIRÉE');
  });

  it('nomme les constructs FANTÔMES (cités mais absents de la matière) dans le log', () => {
    const warn = vi.fn();
    const m = [matter('A', ['s1'])];
    const raw: ModelAffirmation[] = [{ id: 'mix', type: 'tendance', text: 'A + fantôme', treatedKeys: ['A', 'GHOST'] }];
    const { affirmations } = resolveAffirmations('deep_touch', m, raw, { warn });
    expect(affirmations).toHaveLength(1);               // A suffit à la garder
    expect(affirmations[0].evidence_ids).toEqual(['s1']); // GHOST n'apporte rien
    expect(warn.mock.calls.some((c) => String(c[0]).includes('FANTÔMES') && String(c[0]).includes('GHOST'))).toBe(true);
  });

  it('assembleText garde l\'ordre du modèle et ignore le vide', () => {
    expect(assembleText([
      { id: '1', type: 'declaration', text: 'Un.', evidence_ids: ['s1'] },
      { id: '2', type: 'tendance', text: '  Deux.  ', evidence_ids: ['s2'] },
    ])).toBe('Un. Deux.');
  });
});

describe('generateAllSections — détails puis synthèses, synthèse hérite de l\'union', () => {
  const tag = (family: string, construct: string, sourceId: string, extra: Partial<AttentionBreathTag> = {}): AttentionBreathTag =>
    ({ family, construct, strength: 'strong', rank: 1, basis: 'self_report', confidence: 'high', sourceId, ...extra });
  const tags: AttentionBreathTag[] = [
    tag('AFFECTION_LANGUAGE', 'AFFECTION_RECEIVE_WORDS', 'src-words', { direction: 'receive', modality: 'WORDS' }),
    tag('NEED', 'NEED_TRUST', 'src-trust'),
    tag('DRIVER', 'DRV_RELIEF', 'src-relief'),
  ];
  const facts: SocleFact[] = [];

  // modèle factice : une affirmation par clé reçue, qui traite cette clé (détail) ; synthèse traite ses deps.
  const fakeCall: SectionModelCaller = async (req) => req.matter.map((m, i) => ({
    id: `${req.sectionKey}-${i}`, type: 'tendance' as const, text: `à propos de ${m.key}.`, treatedKeys: [m.key],
  }));

  it('les détails portent les sources de leur matière ; la section = union', async () => {
    const out = await generateAllSections(tags, facts, fakeCall, { warn: () => {} });
    const deepTouch = out.find((s) => s.key === 'deep_touch')!; // AFFECTION receive + DRIVER
    expect(deepTouch.sourceEvidenceIds).toContain('src-words');
    expect(deepTouch.affirmations.every((a) => a.evidence_ids.length > 0)).toBe(true); // aucune sans source
  });

  it('une synthèse hérite de l\'UNION des sources des détails qu\'elle cite', async () => {
    const out = await generateAllSections(tags, facts, fakeCall, { warn: () => {} });
    const resume = out.find((s) => s.key === 'resume')!; // synthèse dependsOn plusieurs détails
    expect(resume.tier).toBe('synthesis');
    // toutes ses sources proviennent de détails ; chaque affirmation a au moins une source
    expect(resume.affirmations.every((a) => a.evidence_ids.length > 0)).toBe(true);
    expect(resume.sourceEvidenceIds.length).toBeGreaterThan(0);
  });

  it('section freeTextOnly reste vide et sans source (signalée, jamais masquée)', async () => {
    const out = await generateAllSections(tags, facts, fakeCall, { warn: () => {} });
    const tables = out.find((s) => s.key === 'monde_tables')!;
    expect(tables.text).toBe('');
    expect(tables.sourceEvidenceIds).toEqual([]);
  });
});

describe('proportionnalité §30.2 — jamais plus d\'affirmations que d\'evidences distinctes', () => {
  it('détecte la violation (N affirmations > M evidences distinctes) et l\'épargne au cas conforme', () => {
    expect(proportionalityViolation(3, 1)).toBe(true);   // 3 affirmations, 1 preuve → inférences habillées
    expect(proportionalityViolation(2, 2)).toBe(false);  // autant d'affirmations que de preuves → conforme
    expect(proportionalityViolation(1, 3)).toBe(false);  // moins d'affirmations que de preuves → conforme
    expect(proportionalityViolation(0, 0)).toBe(false);  // section vide → conforme
  });

  it('resolveAffirmations LOGUE la violation (3 affirmations adossées à 1 seule evidence)', () => {
    const warnings: string[] = [];
    const m = [matter('K', ['s1'])]; // une seule source distincte
    const raw: ModelAffirmation[] = [
      { id: 'a1', type: 'declaration', text: 'une', treatedKeys: ['K'] },
      { id: 'a2', type: 'hypothese', text: 'deux', treatedKeys: ['K'] },
      { id: 'a3', type: 'hypothese', text: 'trois', treatedKeys: ['K'] },
    ];
    const { affirmations, sourceEvidenceIds } = resolveAffirmations('univers_marques', m, raw, { warn: (w) => warnings.push(w) });
    expect(affirmations.length).toBe(3);
    expect(sourceEvidenceIds).toEqual(['s1']); // 1 evidence distincte
    expect(warnings.some((w) => w.includes('PROPORTIONNALITÉ VIOLÉE'))).toBe(true);
  });
});
