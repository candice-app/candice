// CONFORMITÉ ÉCRAN ↔ DOCUMENT — le document fait mécaniquement autorité sur le flux.
//
// Compare le VERBATIM réellement affiché par le questionnaire pilote (les tableaux de
// données que les composants rendent) aux `optionText` / `questionText` de
// docs/ontologie/onboarding-v15-mappings.md, pour les 19 questions actives et les 106
// options actives. Zéro écart attendu (structure.md : « toute divergence entre l'écran et
// ce fichier est une erreur »). Les options REMOVED/MOVED du document sont ignorées : elles
// gardent leurs mappings mais ne sont plus posées.
//
// Commande :  npx vitest run src/app/moi/questionnaire/__tests__/flow-conformance.test.ts
//
// Normalisation : seules les variantes TYPOGRAPHIQUES sont neutralisées (apostrophe ’/',
// points de suspension …/..., guillemets, espaces insécables/fines). La casse et les mots
// sont comparés tels quels — un mot faux, lui, ne passe pas.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RECEPTION_QUESTIONS_ACTIVE, EXPRESSION_QUESTION } from '../../../../lib/attention/questions';
import { STEP2_QUESTIONS, STEP3_QUESTIONS } from '../../../../lib/temperament/questions';
import { STEP4_QUESTIONS_ACTIVE, STEP5_CHOICE_QUESTIONS } from '../../../../lib/lifestyle/questions';

const norm = (s: string): string =>
  s
    .normalize('NFC')
    .replace(/[’ʼ′]/g, "'")
    .replace(/…/g, '...')
    .replace(/[«»“”]/g, '"')
    .replace(/[    ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ── Côté ÉCRAN : ce que le flux affiche réellement (import des données, pas du texte) ──
interface FlowQ { code: string; title: string; options: string[] }
const flow: FlowQ[] = [
  ...RECEPTION_QUESTIONS_ACTIVE.map((q) => ({ code: q.id, title: q.title, options: q.options.map((o) => o.label) })),
  { code: EXPRESSION_QUESTION.id, title: EXPRESSION_QUESTION.title, options: EXPRESSION_QUESTION.options.map((o) => o.label) },
  ...STEP2_QUESTIONS.map((q) => ({ code: q.id, title: q.title, options: q.options.map((o) => o.label) })),
  ...STEP3_QUESTIONS.map((q) => ({ code: q.id, title: q.title, options: q.options.map((o) => o.label) })),
  ...STEP4_QUESTIONS_ACTIVE.map((q) => ({ code: q.id, title: q.title, options: q.options.map((o) => o.label) })),
  ...STEP5_CHOICE_QUESTIONS.map((q) => ({ code: q.id, title: q.title, options: q.options.map((o) => o.label) })),
];

// ── Côté DOCUMENT : les options ACTIF, groupées par questionCode dans l'ordre du doc ──
function parseDoc(): FlowQ[] {
  const md = readFileSync('docs/ontologie/onboarding-v15-mappings.md', 'utf8').split('\n');
  const bang = (l: string, key: string): string | null => {
    const m = l.match(new RegExp('`' + key + '`\\s*:\\s*«\\s*(.*?)\\s*»'));
    return m ? m[1] : null;
  };
  type Opt = { status: string | null; q: string | null; qText: string | null; oText: string | null };
  const opts: Opt[] = [];
  let cur: Opt | null = null;
  for (const l of md) {
    if (/^### Option `/.test(l)) { cur = { status: null, q: null, qText: null, oText: null }; opts.push(cur); continue; }
    if (!cur) continue;
    const s = l.match(/`status`\s*:\s*`([^`]+)`/); if (s) cur.status = s[1];
    const q = l.match(/`questionCode`\s*:\s*`([^`]+)`/); if (q) cur.q = q[1];
    const qt = bang(l, 'questionText'); if (qt !== null) cur.qText = qt;
    const ot = bang(l, 'optionText'); if (ot !== null) cur.oText = ot;
  }
  const order: string[] = [];
  const byCode = new Map<string, FlowQ>();
  for (const o of opts) {
    if (o.status !== 'ACTIF' || !o.q) continue;
    if (!byCode.has(o.q)) { byCode.set(o.q, { code: o.q, title: o.qText ?? '', options: [] }); order.push(o.q); }
    byCode.get(o.q)!.options.push(o.oText ?? '');
  }
  return order.map((c) => byCode.get(c)!);
}

const doc = parseDoc();

describe('Conformité verbatim écran ↔ onboarding-v15-mappings.md', () => {
  it('le flux pose exactement les 19 questions actives du document (mêmes codes)', () => {
    expect(flow.map((q) => q.code).sort()).toEqual(doc.map((q) => q.code).sort());
    expect(flow).toHaveLength(19);
    expect(doc).toHaveLength(19);
  });

  it('106 options actives affichées, réparties comme le document', () => {
    expect(flow.reduce((n, q) => n + q.options.length, 0)).toBe(106);
    expect(doc.reduce((n, q) => n + q.options.length, 0)).toBe(106);
  });

  it('zéro écart de verbatim : chaque titre et chaque option (ordre inclus) est identique au document', () => {
    const docByCode = new Map(doc.map((q) => [q.code, q]));
    const diffs: string[] = [];
    for (const fq of flow) {
      const dq = docByCode.get(fq.code);
      if (!dq) { diffs.push(`question hors document : ${fq.code}`); continue; }
      if (norm(fq.title) !== norm(dq.title)) diffs.push(`[${fq.code}] titre\n  écran: ${fq.title}\n  doc  : ${dq.title}`);
      if (fq.options.length !== dq.options.length) diffs.push(`[${fq.code}] nombre d'options écran ${fq.options.length} ≠ doc ${dq.options.length}`);
      const n = Math.min(fq.options.length, dq.options.length);
      for (let i = 0; i < n; i++) {
        if (norm(fq.options[i]) !== norm(dq.options[i])) diffs.push(`[${fq.code}] option #${i + 1}\n  écran: ${fq.options[i]}\n  doc  : ${dq.options[i]}`);
      }
    }
    if (diffs.length) throw new Error(`${diffs.length} écart(s) écran↔document :\n\n${diffs.join('\n\n')}`);
  });
});
