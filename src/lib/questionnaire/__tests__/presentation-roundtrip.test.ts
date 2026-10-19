// ROUND-TRIP de la couche de présentation (condition 2 Estelle) — par IMPORT des modules, jamais
// par parsing texte. Prouve : N paires (optionRef → subtext/icon) lues des banques = N paires dans
// l'asset, 0 inventée, 0 perdue, collisions et non-appariés nommés. + conformité écran → canonique
// (toute option active est rendue). Remplace l'ancien scripts/socle-delta.mjs (parseur texte, bugué :
// son regex single-quote ratait les labels double-guillemets de lifestyle → fausse lacune de 17).

import { describe, expect, it } from 'vitest';
import { RECEPTION_QUESTIONS, EXPRESSION_QUESTION } from '../../attention/questions';
import { ALL_TEMPERAMENT_QUESTIONS } from '../../temperament/questions';
import { ALL_LIFESTYLE_QUESTIONS } from '../../lifestyle/questions';
import { ONBOARDING_MAPPINGS } from '../../knowledge/onboarding';
import { OPTION_PRESENTATION } from '../presentation';

const norm = (s: string) =>
  s.normalize('NFC').replace(/[’ʼ‘`´]/g, "'").replace(/…/g, '...').replace(/\s+/g, ' ').replace(/[(),.:;!?]/g, '').trim().toLowerCase();

type UiOpt = { label: string; subtext?: string; icon?: string };
const uiQuestions = [...RECEPTION_QUESTIONS, EXPRESSION_QUESTION, ...ALL_TEMPERAMENT_QUESTIONS, ...ALL_LIFESTYLE_QUESTIONS] as Array<{ id: string; options: UiOpt[] }>;
const ui = uiQuestions.flatMap((q) => q.options.map((o) => ({ ...o, qc: q.id })));

// clé composite (questionCode|label) — le label seul n'est pas unique (ref 8/q2 et 83/q14 le partagent)
const canon: Record<string, { ref: string; active: boolean }> = {};
for (const m of ONBOARDING_MAPPINGS) canon[`${m.questionCode}|${norm(m.optionText)}`] = { ref: m.optionRef, active: m.status === 'ACTIF' };

// recalcul de l'asset depuis les banques
const rebuilt: Record<string, { subtext?: string; icon?: string }> = {};
let straggler = 0; const unmatched: string[] = []; const collisions: string[] = [];
for (const o of ui) {
  const c = canon[`${o.qc}|${norm(o.label)}`];
  if (!c) { if (o.subtext) unmatched.push(`${o.qc}|${o.label}`); continue; }
  if (c.active && (o.subtext || o.icon)) {
    if (rebuilt[c.ref]) collisions.push(c.ref);
    rebuilt[c.ref] = { ...(o.subtext ? { subtext: o.subtext } : {}), ...(o.icon ? { icon: o.icon } : {}) };
  } else if (!c.active && o.subtext) straggler++;
}

describe('Couche de présentation — round-trip par import (condition 2)', () => {
  it('128 subtexts = 106 actifs + 22 traînards + 0 non-apparié, 0 collision', () => {
    const withSub = ui.filter((o) => o.subtext).length;
    expect(withSub).toBe(128);
    expect(Object.values(rebuilt).filter((v) => v.subtext).length).toBe(106);
    expect(straggler).toBe(22);
    expect(unmatched).toEqual([]);
    expect(collisions).toEqual([]);
    expect(106 + straggler + unmatched.length).toBe(withSub); // balance
  });

  it('35 icônes = 28 actives + 7 traînards (q3)', () => {
    expect(ui.filter((o) => o.icon).length).toBe(35);
    expect(Object.values(rebuilt).filter((v) => v.icon).length).toBe(28);
  });

  it('conformité : TOUTES les 106 options canoniques actives sont rendues (lacune 0)', () => {
    const active = ONBOARDING_MAPPINGS.filter((m) => m.status === 'ACTIF');
    const uiKeys = new Set(ui.map((o) => `${o.qc}|${norm(o.label)}`));
    const uncovered = active.filter((m) => !uiKeys.has(`${m.questionCode}|${norm(m.optionText)}`));
    expect(active).toHaveLength(106);
    expect(uncovered.map((m) => `${m.questionCode}/${m.optionRef}`)).toEqual([]); // zéro lacune active
  });

  it('l’asset committé = l’extraction (0 inventé, 0 perdu)', () => {
    expect(OPTION_PRESENTATION).toEqual(rebuilt);
  });
});
