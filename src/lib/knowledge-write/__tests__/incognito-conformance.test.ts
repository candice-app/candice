// CONFORMITÉ CODE ↔ DOCUMENT — jeu INCOGNITO (docs/ontologie/onboarding-incognito-v1.md §4).
//
// Même dispositif que flow-conformance pour le self, mais sur l'espace de noms I*.* — les deux
// jeux ne sont JAMAIS mélangés (I*.* contre numérique est la garde). Extrait du code les 115
// textes d'option distincts + les 17 énoncés et les compare au document, verbatim (jetons
// {Prénom}/{Pronom}/{pronom} inclus — résolus à la production, pas ici). Zéro écart attendu.
// Tient en plus la colonne distincte du §9 (115 · 98 · 80) et l'invariant R-I1.
//
// Commande :  npx vitest run src/lib/knowledge-write/__tests__/incognito-conformance.test.ts
//
// Normalisation : variantes typographiques seulement (apostrophe ’/', …/..., guillemets,
// espaces insécables/fines). Mots et casse comparés tels quels.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INCOGNITO_QUESTIONS } from '../../knowledge/onboarding-incognito';

const norm = (s: string): string =>
  s
    .normalize('NFC')
    .replace(/[’ʼ′]/g, "'")
    .replace(/…/g, '...')
    .replace(/[«»“”]/g, '"')
    .replace(/[    ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ── Côté DOCUMENT : énoncés (> « … ») et lignes d'option (| I*.* | texte | …) du §4 ──
function parseDoc(): { stems: Map<string, string>; options: Map<string, string> } {
  const md = readFileSync('docs/ontologie/onboarding-incognito-v1.md', 'utf8').split('\n');
  const stems = new Map<string, string>();
  const options = new Map<string, string>();
  let curQ: string | null = null;
  let in4 = false; // borné au §4 : des tables récap de §8/§9 re-listent certains codes (I4.3, I11.2, I11b.2)
  for (const l of md) {
    if (/^## 4 ·/.test(l)) { in4 = true; continue; }
    if (/^## 5 ·/.test(l)) { in4 = false; continue; }
    if (!in4) continue;
    const h = l.match(/^### (I\d+b?) — /);
    if (h) { curQ = h[1]; continue; }
    const s = l.match(/^> «\s*(.*?)\s*»\s*$/);
    if (s && curQ && !stems.has(curQ)) stems.set(curQ, s[1]);
    const o = l.match(/^\|\s*(I\d+b?\.[0-9A-Za-z]+)\s*\|\s*([^|]*?)\s*\|/);
    if (o) options.set(o[1], o[2]);
  }
  return { stems, options };
}

const doc = parseDoc();

describe('Conformité incognito — code ↔ onboarding-incognito-v1.md §4', () => {
  it('les 17 énoncés sont présents côté document (espace I*.*)', () => {
    expect(doc.stems.size).toBe(17);
    expect(INCOGNITO_QUESTIONS).toHaveLength(17);
  });

  it('115 options DISTINCTES au §4 (le « 118 » du §9 est un compte de LIGNES, 3 récaps de §8/§9 inclus)', () => {
    // §9 « 118 lignes d'option » = grep brut : I4.3, I11.2, I11b.2 sont re-listées dans une
    // table récap hors §4 → 118 lignes mais 115 options distinctes. La gate vérifie le 118 ;
    // la conformité vérifie les 115 textes distincts du §4, 1:1 avec le code.
    expect(doc.options.size).toBe(115);
    expect(INCOGNITO_QUESTIONS.reduce((n, q) => n + q.options.length, 0)).toBe(115);
  });

  it('zéro écart de verbatim : énoncés et options identiques au document', () => {
    const diffs: string[] = [];
    for (const q of INCOGNITO_QUESTIONS) {
      const ds = doc.stems.get(q.code);
      if (ds === undefined) diffs.push(`[${q.code}] énoncé absent du document`);
      else if (norm(q.stem) !== norm(ds)) diffs.push(`[${q.code}] énoncé\n  code: ${q.stem}\n  doc : ${ds}`);
      for (const o of q.options) {
        const dt = doc.options.get(o.code);
        if (dt === undefined) diffs.push(`[${o.code}] option absente du document`);
        else if (norm(o.text) !== norm(dt)) diffs.push(`[${o.code}] option\n  code: ${o.text}\n  doc : ${dt}`);
      }
    }
    // tout code I*.* du document doit exister dans le code (aucune option oubliée)
    const codeSet = new Set(INCOGNITO_QUESTIONS.flatMap((q) => q.options.map((o) => o.code)));
    for (const dc of doc.options.keys()) if (!codeSet.has(dc)) diffs.push(`[${dc}] présent au document, absent du code`);
    if (diffs.length) throw new Error(`${diffs.length} écart(s) code↔document :\n\n${diffs.join('\n\n')}`);
  });
});

// ── Colonne « options DISTINCTES » du §9 (115 · 98 · 80) ─────────────────────
// La gate (scripts/incognito-control-count.mjs) tient la colonne « lignes » — 118 · 101 —
// qui compte les récaps de §8/§9. La conformité tient la colonne « options distinctes »,
// dérivée du code (1:1 avec le §4). Les deux sont à vérifier : un écart > 3 entre colonnes
// signale une NOUVELLE duplication dans un récapitulatif (aujourd'hui exactement 3 : I4.3,
// I11.2, I11b.2 re-listées). Garde posée par Estelle (9 oct., doc sha 052cb1f).
const ALL = INCOGNITO_QUESTIONS.flatMap((q) => q.options);
const isUncertainty = (o: (typeof ALL)[number]) => o.status === 'UNKNOWN_BY_REPORTER';
const hasEvidence = (o: (typeof ALL)[number]) =>
  !!(o.profile?.length || o.affection || o.behavior || o.drivers?.length || o.preferences?.length || o.guardrails?.length);
const hasOpenKnowledge = (o: (typeof ALL)[number]) => !!o.openKnowledge;
const hasFact = (o: (typeof ALL)[number]) => !!o.facts?.length;

describe('Colonne distincte (§9) — 115 · 98 · 80, dérivée du code', () => {
  it('115 distinctes · 98 actives (hors .U) · 11 zéro · 5 OpenKnowledge · 2 FACT · 80 productrices', () => {
    const distinct = ALL.length;
    const uncertainty = ALL.filter(isUncertainty);
    const active = ALL.filter((o) => !isUncertainty(o));
    const productrices = active.filter(hasEvidence);
    const okOnly = active.filter((o) => hasOpenKnowledge(o) && !hasEvidence(o) && !hasFact(o));
    const factOnly = active.filter((o) => hasFact(o) && !hasEvidence(o) && !hasOpenKnowledge(o));
    const zero = active.filter((o) => !hasEvidence(o) && !hasOpenKnowledge(o) && !hasFact(o));

    expect(distinct).toBe(115);
    expect(uncertainty).toHaveLength(17); // une sortie .U par question
    expect(active).toHaveLength(98);
    expect(zero).toHaveLength(11);
    expect(okOnly).toHaveLength(5);
    expect(factOnly).toHaveLength(2);
    expect(productrices).toHaveLength(80);
    // la décomposition est exhaustive et disjointe
    expect(productrices.length + zero.length + okOnly.length + factOnly.length).toBe(active.length);
  });

  it('écart lignes↔distinctes ≤ 3 (sinon nouvelle duplication dans un récapitulatif)', () => {
    // compte brut de TOUTES les lignes d'option du document (colonne « lignes » = 118),
    // récaps de §8/§9 inclus — le même grep que la gate.
    const md = readFileSync('docs/ontologie/onboarding-incognito-v1.md', 'utf8').split('\n');
    const lineRows = md.filter((l) => /^\|\s*I\d+b?\.[0-9A-Za-z]+\s*\|/.test(l)).length;
    expect(lineRows).toBe(118);
    expect(lineRows - doc.options.size).toBeGreaterThanOrEqual(0);
    expect(lineRows - doc.options.size).toBeLessThanOrEqual(3); // exactement 3 aujourd'hui
  });
});

// ── Invariant R-I1 : reporter_interpretation plafonne la strength à moderate ──
// R-I1 (§3) : aucun plafond automatique sur le MODE rapporté. observed et subject_statement
// autorisent strong (les strong du §4 sont justes) ; reporter_interpretation plafonne à
// moderate — car une interprétation est indirecte, pas parce qu'elle vient de l'incognito.
// Base effective = surcharge de l'option, sinon base de la question. Couvre I1.*, I2.*,
// I16.3–6 (affection/drivers moderate) ; I15.* porte une sévérité, pas une strength ;
// les surcharges I12.1/I12.2 portent un value, pas de strength → hors champ.
describe('R-I1 — toute strength sous reporter_interpretation est moderate', () => {
  it('aucune strength strong/weak sur une base reporter_interpretation', () => {
    const violations: string[] = [];
    for (const q of INCOGNITO_QUESTIONS) {
      for (const o of q.options) {
        const base = o.assertionBasisOverride ?? q.baseAssertionBasis;
        if (base !== 'reporter_interpretation') continue;
        const strengths: Array<[string, string]> = [];
        if (o.affection) strengths.push(['affection', o.affection.strength]);
        if (o.drivers?.length && o.driversStrength) strengths.push(['drivers', o.driversStrength]);
        if (o.behavior) strengths.push(['behavior', o.behavior.strength]);
        for (const p of o.preferences ?? []) strengths.push([`preference ${p.path}`, p.strength]);
        for (const [where, s] of strengths) {
          if (s !== 'moderate') violations.push(`[${o.code}] ${where} = ${s} (attendu moderate sous reporter_interpretation)`);
        }
      }
    }
    if (violations.length) throw new Error(`${violations.length} violation(s) R-I1 :\n\n${violations.join('\n')}`);
  });
});
