// Production INCOGNITO — les six règles transversales (§3), les trois invariants pronom (§2/§6),
// la survie-zéro des jetons dans knowledge_sources, et la chaîne « intensity non renseignée ».
//
//   npx vitest run src/lib/knowledge-write/__tests__/produce-incognito.test.ts

import { describe, expect, it } from 'vitest';
import { asContactId, asUserId, contactAbout, type KnowledgeScope } from '../../knowledge';
import { INCOGNITO_QUESTIONS } from '../../knowledge/onboarding-incognito';
import type { IncognitoOption, IncognitoQuestion } from '../../knowledge/onboarding-incognito';
import { produceIncognitoOption, type IncognitoWriteContext } from '../produce-incognito';
import { resolvePronoun, type ContactGender } from '../pronoun';
import { openKnowledgeToRow } from '../rows';

const scope: KnowledgeScope = { about: contactAbout(asContactId('proche-1')), ownerId: asUserId('pilote-1') };

function ctxOf(firstName: string, gender: ContactGender, optionRef: string): IncognitoWriteContext {
  return {
    ...scope,
    sourceId: `00000000-0000-5000-8000-${optionRef.replace(/[^0-9a-f]/gi, '').padStart(12, '0').slice(0, 12)}`,
    timestamp: '2026-10-09T00:00:00Z',
    firstName,
    gender,
  };
}

function findQ(code: string): IncognitoQuestion {
  const q = INCOGNITO_QUESTIONS.find((x) => x.code === code);
  if (!q) throw new Error(`question ${code} introuvable`);
  return q;
}
function findOpt(qcode: string, ocode: string): { q: IncognitoQuestion; o: IncognitoOption } {
  const q = findQ(qcode);
  const o = q.options.find((x) => x.code === ocode);
  if (!o) throw new Error(`option ${ocode} introuvable`);
  return { q, o };
}
/** Produit chaque option de chaque question (contact par défaut : Camille, sans genre). */
function produceAll(firstName = 'Camille', gender: ContactGender = null) {
  return INCOGNITO_QUESTIONS.flatMap((q) =>
    q.options.map((o) => ({ q, o, write: produceIncognitoOption(ctxOf(firstName, gender, o.code), q, o) })),
  );
}

const all = produceAll();
const baseOf = (q: IncognitoQuestion, o: IncognitoOption) => o.assertionBasisOverride ?? q.baseAssertionBasis;

describe('R-I1 — strength = force du signal, jamais la provenance', () => {
  it('aucune evidence produite sous reporter_interpretation ne porte strong (plafond moderate)', () => {
    const strong: string[] = [];
    for (const { q, o, write } of all) {
      if (baseOf(q, o) !== 'reporter_interpretation') continue;
      for (const e of write.evidences) {
        if ('strength' in e && (e as { strength: string }).strength === 'strong') strong.push(`${o.code}/${e.target_family}`);
      }
    }
    expect(strong).toEqual([]);
  });
  it('I15.1 (reporter_interpretation) — guardrail LU à moderate, SOFT indépendant', () => {
    const { q, o } = findOpt('I15', 'I15.1');
    const g = produceIncognitoOption(ctxOf('Camille', null, o.code), q, o).evidences[0];
    expect(g.target_family).toBe('GUARDRAIL');
    expect((g as { strength: string }).strength).toBe('moderate'); // force du signal, lue du §4
    expect((g as { severity: string }).severity).toBe('SOFT'); // force de la contrainte, indépendante
  });
  it('aucun plafond AUTOMATIQUE : I5.1 (observed) reste strong', () => {
    const { q, o } = findOpt('I5', 'I5.1');
    const b = produceIncognitoOption(ctxOf('Camille', null, o.code), q, o).evidences[0];
    expect(b.target_family).toBe('BEHAVIOR');
    expect((b as { strength: string }).strength).toBe('strong');
  });
});

describe('R-I2 — l’incertitude produit zéro', () => {
  it('toute option UNKNOWN_BY_REPORTER : zéro evidence, FACT, OpenKnowledge', () => {
    const us = all.filter(({ o }) => o.status === 'UNKNOWN_BY_REPORTER');
    expect(us).toHaveLength(17); // une .U par question
    for (const { o, write } of us) {
      expect(write.evidences, o.code).toHaveLength(0);
      expect(write.facts, o.code).toHaveLength(0);
      expect(write.openKnowledge, o.code).toHaveLength(0);
    }
  });
  it('la source existe quand même (la non-réponse est tracée, pas niée)', () => {
    const { q, o } = findOpt('I1', 'I1.U');
    const { source } = produceIncognitoOption(ctxOf('Camille', null, o.code), q, o);
    expect(source.optionRef).toBe('I1.U');
    expect(source.questionCode).toBe('I1');
  });
});

describe('R-I3 — « ça dépend » est une vraie réponse (zéro, jamais UNKNOWN)', () => {
  it('toute option CONTEXT_DEPENDENT produit zéro', () => {
    const cds = all.filter(({ o }) => o.status === 'CONTEXT_DEPENDENT');
    expect(cds).toHaveLength(11);
    for (const { o, write } of cds) {
      expect(write.evidences, o.code).toHaveLength(0);
      expect(write.facts, o.code).toHaveLength(0);
      expect(write.openKnowledge, o.code).toHaveLength(0);
    }
  });
});

describe('R-I4 — sévérité du guardrail = ce qui est exprimé, jamais la provenance', () => {
  it('les guardrails de I15 sont tous SOFT (aucune formulation fermée ne fabrique un HARD)', () => {
    const grd = all.flatMap(({ write }) => write.evidences).filter((e) => e.target_family === 'GUARDRAIL');
    expect(grd.length).toBeGreaterThan(0);
    for (const g of grd) expect((g as { severity: string }).severity).toBe('SOFT');
    expect(grd.filter((g) => (g as { severity: string }).severity === 'HARD')).toHaveLength(0);
  });
});

describe('R-I5 — aucune inférence PROFILE ajoutée', () => {
  it('le PROFILE secondaire ne vient QUE de I8.3 et I13.1 (contenu explicite de la réponse)', () => {
    const secondaryFrom = new Set<string>();
    for (const { o, write } of all) {
      for (const e of write.evidences) {
        if (e.target_family === 'PROFILE' && e.evidence_role === 'secondary') secondaryFrom.add(o.code);
      }
    }
    expect([...secondaryFrom].sort()).toEqual(['I13.1', 'I8.3']);
  });
});

describe('R-I6 — FACT jamais user_confirmed=true en mode rapporté', () => {
  it('I11b.2 / I11b.3 produisent un FACT habit user_confirmed=false', () => {
    const facts = all.flatMap(({ write }) => write.facts);
    expect(facts).toHaveLength(2);
    for (const f of facts) {
      expect(f.fact_type).toBe('habit');
      expect(f.user_confirmed).toBe(false);
    }
  });
});

describe('Invariants pronom (§2/§6)', () => {
  it('P1 — aucun pronom genré EN DUR référant au PROCHE (il/elle de la personne = jeton)', () => {
    // Exception d'accord NOMINAL, pas de genre de personne : en I2 (« Quand une attention fait
    // plaisir à {Prénom}… »), « Elle montre qu'on a écouté » agrée avec « l'attention » (nom
    // féminin de l'énoncé) — correct pour un proche de n'importe quel genre, ne se tokenise pas.
    const NOUN_AGREEMENT = new Set(['I2']);
    const offenders: string[] = [];
    for (const q of INCOGNITO_QUESTIONS) {
      if (NOUN_AGREEMENT.has(q.code)) continue;
      const texts = [q.stem, ...q.options.map((o) => o.text)];
      for (const t of texts) if (/\b(il|elle|ils|elles)\b/i.test(t)) offenders.push(t);
    }
    expect(offenders).toEqual([]);
    // et l'exception reste bien circonscrite : I2 est le seul « Elle » non-personne du jeu
    const i2 = findQ('I2').options.filter((o) => /\bElle\b/.test(o.text));
    expect(i2.length).toBe(7); // les 7 options productrices de I2, « Elle » = l'attention
  });

  it('P2 — résolveur : femme→Elle/elle, homme→Il/il, non_binaire/non_precise/NULL→prénom', () => {
    const tpl = '{Pronom} aime quand {pronom} voit {Prénom}';
    expect(resolvePronoun(tpl, 'Marie', 'femme')).toBe('Elle aime quand elle voit Marie');
    expect(resolvePronoun(tpl, 'Paul', 'homme')).toBe('Il aime quand il voit Paul');
    expect(resolvePronoun(tpl, 'Camille', 'non_binaire')).toBe('Camille aime quand Camille voit Camille');
    expect(resolvePronoun(tpl, 'Alex', 'non_precise')).toBe('Alex aime quand Alex voit Alex');
    expect(resolvePronoun(tpl, 'Sacha', null)).toBe('Sacha aime quand Sacha voit Sacha');
  });

  it('P3 — aucun jeton ne survit dans knowledge_sources (un { ou } dans une source est un bug)', () => {
    for (const gender of ['femme', 'homme', 'non_binaire', null] as const) {
      for (const { q, o } of all) {
        const { source } = produceIncognitoOption(ctxOf('Dominique', gender, o.code), q, o);
        for (const txt of [source.questionText, source.answerText ?? '']) {
          expect(txt.includes('{'), `${o.code} (${gender}) : ${txt}`).toBe(false);
          expect(txt.includes('}'), `${o.code} (${gender}) : ${txt}`).toBe(false);
          for (const tok of ['{Prénom}', '{Pronom}', '{pronom}']) expect(txt).not.toContain(tok);
        }
      }
    }
  });
});

describe('I7 — « intensity non renseignée » traverse la chaîne sans acquérir de valeur', () => {
  it('I7.1 → OpenKnowledge sans intensity → ligne intensity NULL (jamais weak)', () => {
    const { q, o } = findOpt('I7', 'I7.1');
    const { openKnowledge } = produceIncognitoOption(ctxOf('Camille', null, o.code), q, o);
    expect(openKnowledge).toHaveLength(1);
    const ok = openKnowledge[0];
    expect(ok.intensity).toBeUndefined();
    const row = openKnowledgeToRow(ok, scope.about);
    expect(row.intensity).toBeNull();
    expect(row.intensity).not.toBe('weak');
  });
  it('I7 produit 5 OpenKnowledge support_modality (I7.1–5), aucun NEED', () => {
    const oks = all.flatMap(({ write }) => write.openKnowledge);
    expect(oks).toHaveLength(5);
    for (const ok of oks) {
      expect(ok.type).toBe('support_modality');
      expect(ok.relation).toBe('appears_to_help');
      expect(ok.context).toBe('distress');
    }
    const needs = all.flatMap(({ write }) => write.evidences).filter((e) => e.target_family === 'NEED');
    expect(needs).toHaveLength(0);
  });
});
