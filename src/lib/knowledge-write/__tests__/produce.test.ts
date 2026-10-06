// Lot B bloc 2a — production d'evidences : compteurs du parcours simulé complet
// confrontés aux chiffres du document de clôture. Tout écart = échec (on ne l'ajuste pas).

import { describe, expect, it } from 'vitest';
import { activeOptions } from '../../knowledge';
import type { Evidence, Fact } from '../../knowledge';
import { asContactId, contactAbout, asUserId, type KnowledgeScope } from '../../knowledge';
import { consolidateJournal } from '../consolidate-journal';
import { produceFromOption, type WriteContext } from '../produce';

const scope: KnowledgeScope = { about: contactAbout(asContactId('c1')), ownerId: asUserId('u1') };

// Parcours simulé COMPLET : chaque option active répondue, une source (uuid) par option.
const active = activeOptions();
const allEvidences: Evidence[] = [];
const allFacts: Fact[] = [];
const sourceIds = new Set<string>();
let optionsWithNoEvidence = 0;
for (const m of active) {
  const ctx: WriteContext = {
    ...scope,
    sourceId: `00000000-0000-5000-8000-${m.optionRef.replace(/[^0-9a-f]/gi, '').padStart(12, '0').slice(0, 12)}`,
    sourceType: 'onboarding_closed',
    timestamp: '2026-10-06T00:00:00Z',
  };
  const { source, evidences, facts } = produceFromOption(ctx, m);
  sourceIds.add(source.id);
  allEvidences.push(...evidences);
  allFacts.push(...facts);
  if (evidences.length === 0) optionsWithNoEvidence += 1;
}

const prof = allEvidences.filter((e) => e.target_family === 'PROFILE');
const aff = allEvidences.filter((e) => e.target_family === 'AFFECTION_LANGUAGE');
const beh = allEvidences.filter((e) => e.target_family === 'BEHAVIOR');
const grd = allEvidences.filter((e) => e.target_family === 'GUARDRAIL');
const pref = allEvidences.filter((e) => e.target_family === 'PREFERENCE');

describe('Compteurs du parcours simulé complet (vs clos)', () => {
  it('options actives = 106', () => {
    expect(active).toHaveLength(106);
  });
  it('PROFILE = 59 · GLOBAL_DIRECT 11 · LOCAL 48 · secondaires 17 · négatives 2', () => {
    expect(prof).toHaveLength(59);
    expect(prof.filter((e) => e.context === 'GLOBAL')).toHaveLength(11);
    expect(prof.filter((e) => e.context !== 'GLOBAL')).toHaveLength(48);
    expect(prof.filter((e) => e.evidence_role === 'secondary')).toHaveLength(17);
    expect(prof.filter((e) => 'value' in e && (e as { value: number }).value < 0)).toHaveLength(2);
  });
  it('AFFECTION_RECEIVE = 14 · AFFECTION_GIVE = 7', () => {
    expect(aff.filter((e) => 'direction' in e && (e as { direction: string }).direction === 'receive')).toHaveLength(14);
    expect(aff.filter((e) => 'direction' in e && (e as { direction: string }).direction === 'give')).toHaveLength(7);
  });
  it('BEHAVIOR = 20 sur 4 contextes', () => {
    expect(beh).toHaveLength(20);
    const ctxs = new Set(beh.map((e) => (e as { behaviorContext: string }).behaviorContext));
    expect(ctxs.size).toBe(4);
  });
  it('GUARDRAIL = 4 options → 5 evidences', () => {
    expect(active.filter((m) => m.guardrails.length > 0)).toHaveLength(4);
    expect(grd).toHaveLength(5);
  });
  it('PREFERENCE = 17 · FACT = 2', () => {
    expect(pref).toHaveLength(17);
    expect(allFacts).toHaveLength(2);
  });
  it('options sans evidence : cas normal, > 0 et pas une erreur', () => {
    expect(optionsWithNoEvidence).toBeGreaterThan(0);
  });
});

describe('Invariants du branchement', () => {
  const { signals } = consolidateJournal(scope, allEvidences);
  it('aucun construct en score low sans contraire net (R1)', () => {
    // la consolidation ne produit 'low' que sur contraire net ; on vérifie qu'un low
    // s'accompagne toujours d'une evidence de direction négative sur le construct.
    const lowWithoutContrary = signals.filter(
      (s) => s.score === 'low' && !allEvidences.some((e) => e.target_construct === (s as { construct?: string }).construct && 'value' in e && (e as { value: number }).value < 0),
    );
    expect(lowWithoutContrary).toHaveLength(0);
  });
  it('aucun construct en confidence high (une seule source_type à l’onboarding)', () => {
    expect(signals.filter((s) => s.confidence === 'high')).toHaveLength(0);
  });
  it('aucune evidence sans source_id résoluble', () => {
    expect(allEvidences.filter((e) => !sourceIds.has(e.source_id))).toHaveLength(0);
  });
});

import { SOUTIEN, MOTEURS } from '../../knowledge';
import { produceSoutienOption, produceMoteursOption } from '../produce';

describe('Bloc 2b — soutien / moteurs (entièrement spécifiés)', () => {
  const ctx = { ...scope, sourceId: '00000000-0000-5000-8000-000000000s01', sourceType: 'onboarding_closed' as const, timestamp: '2026-10-06T00:00:00Z' };
  it('soutien : 1 NEED primary/strong/context distress, source_id identique', () => {
    const { source, evidences } = produceSoutienOption(ctx, SOUTIEN.options[0]); // « Qu'on m'écoute » → NEED_SEEN_UNDERSTOOD
    expect(evidences).toHaveLength(1);
    const e = evidences[0];
    expect(e.target_construct).toBe('NEED_SEEN_UNDERSTOOD');
    expect(e.evidence_role).toBe('primary');
    expect(e.strength).toBe('strong');
    expect(e.context).toBe('distress');
    expect(e.source_id).toBe(source.id);
    expect(source.assertionStatus).toBe('declared'); // dérivé du sourceType
  });
  it('moteurs : 1 OpenKnowledge life_priority, AUCUNE evidence, label verbatim conservé', () => {
    const { source, openKnowledge } = produceMoteursOption(ctx, MOTEURS.options[0]); // « La liberté » → freedom
    expect(openKnowledge).toHaveLength(1);
    const k = openKnowledge[0];
    expect(k.type).toBe('life_priority');
    expect(k.relation).toBe('matters_to');
    expect(k.intensity).toBe('strong');
    expect(k.context).toBe('GLOBAL');
    expect(k.subjectLabel).toBe('La liberté'); // verbatim affiché
    expect(k.source).toBe(source.id);
  });
});

import { affectionStrengthFor } from '../produce';

describe('Bloc 2b — strength affective (table discrète, switch exhaustif, aucun produit)', () => {
  it('Q1 par rang : 1,2→strong, 3→moderate', () => {
    expect(affectionStrengthFor('q1', 1)).toBe('strong');
    expect(affectionStrengthFor('q1', 2)).toBe('strong');
    expect(affectionStrengthFor('q1', 3)).toBe('moderate');
  });
  it('Q4 → moderate (demi-poids) ; QE → strong', () => {
    expect(affectionStrengthFor('q4')).toBe('moderate');
    expect(affectionStrengthFor('qe')).toBe('strong');
  });
  it('question sans règle affective → jette (aucun défaut silencieux)', () => {
    expect(() => affectionStrengthFor('q7')).toThrow();
  });
  it('Q2 ne produit AUCUNE evidence affective', () => {
    const q2 = active.filter((m) => m.questionCode === 'q2');
    expect(q2.length).toBeGreaterThan(0);
    for (const m of q2) {
      const { evidences } = produceFromOption({ ...scope, sourceId: '00000000-0000-5000-8000-0000000000q2', sourceType: 'onboarding_closed', timestamp: '2026-10-06T00:00:00Z' }, m);
      expect(evidences.filter((e) => e.target_family === 'AFFECTION_LANGUAGE')).toHaveLength(0);
    }
  });
});

import { produceInterest } from '../produce';
import { EVIDENCE_CONTEXTS } from '../../knowledge';

describe('Bloc 2b — intérêt coché (GLOBAL déclaré, moderate, relationship absent)', () => {
  const ctx = { ...scope, sourceId: '00000000-0000-5000-8000-00000000int1', sourceType: 'onboarding_closed' as const, timestamp: '2026-10-06T00:00:00Z' };
  it('context GLOBAL · strength moderate · relationship absent · subjectLabel verbatim', () => {
    const { evidences } = produceInterest(ctx, 'Cuisine', 'food_gastronomy');
    const e = evidences[0];
    expect(e.context).toBe('GLOBAL');
    expect((e as { strength: string }).strength).toBe('moderate');
    expect('relationship' in e).toBe(false); // non précisé, jamais « faible »
    expect((e as { subjectLabel: string }).subjectLabel).toBe('Cuisine');
  });
  it('EVIDENCE_CONTEXTS reste à 13 (chiffre de contrôle inchangé)', () => {
    expect(EVIDENCE_CONTEXTS.seed).toHaveLength(13);
  });
});
