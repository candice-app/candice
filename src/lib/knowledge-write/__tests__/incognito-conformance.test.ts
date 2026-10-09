// CONFORMITÉ CODE ↔ DOCUMENT — jeu INCOGNITO (docs/ontologie/onboarding-incognito-v1.md §4).
//
// Même dispositif que flow-conformance pour le self, mais sur l'espace de noms I*.* — les deux
// jeux ne sont JAMAIS mélangés (I*.* contre numérique est la garde). Extrait du code les 118
// textes d'option + les 17 énoncés et les compare au document, verbatim (jetons {Prénom}/{Pronom}/
// {pronom} inclus — ils sont résolus à la production, pas ici). Zéro écart attendu.
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
