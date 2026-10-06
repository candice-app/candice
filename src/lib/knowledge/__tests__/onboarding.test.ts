// Tests 2, 30–34 — onboarding V15 : vocabulaire sans orphelin, 128/106,
// options non actives exclues, TOUS les chiffres de contrôle recalculés depuis
// le code, evidences négatives, et sorties `unknown` via consolidate.
//
// ⚠ Les chiffres de contrôle recalculés ci-dessous correspondent EXACTEMENT au
// fichier transcrit (docs/ontologie/onboarding-v15-mappings.md). DEUX d'entre eux
// (options avec PROFILE, evidences secondaires) divergeaient du résumé de
// onboarding-v15-clos.md, qui annonçait 55 et 20 : chiffres calculés AVANT les
// retraits V13 (option 105, IMPORTANCE_AUTHENTICITY) et V14 (APPETENCE_SPONTANEITY
// sur 7, 13, 27, 108, 109) documentés dans le fichier de mappings lui-même.
// Arbitrage Estelle (2026-10-02, écart §9) : les mappings détaillés font foi →
// valeurs retenues = 50 et 17, résumé clos corrigé. On asserte le réel transcrit.

import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_MAPPINGS,
  activeOptions,
  mappingByRef,
  type OnboardingMapping,
} from '../onboarding';
import {
  AFFECTION_CADENCES,
  AFFECTION_DIRECTIONS,
  AFFECTION_LANGUAGE_CODES,
  AFFECTION_MODALITIES,
  BEHAVIOR_CONTEXTS,
  BEHAVIOR_PATTERNS,
  DRIVER_CODES,
  GUARDRAIL_CODES,
  NEED_CODES,
  PROFILE_CONSTRUCT_CODES,
  SENSITIVITY_FACETS,
  isPreferencePath,
  normalizeBehaviorPattern,
} from '../vocabulary';
import type { EvidenceValue, ProfileDirectionalCode } from '../vocabulary';
import type { ProfileEvidence } from '../evidence';
import { consolidateProfileConstruct } from '../consolidate';
import { asContactId, asUserId, type KnowledgeScope } from '../identity';
import { JOURNAL_VERSION_STAMP } from '../version';

const scope: KnowledgeScope = { contactId: asContactId('c1'), ownerId: asUserId('u1') };

/* ── Helpers de recomptage, uniquement depuis le code. ── */
const active = activeOptions();
const allProfileActive = active.flatMap((m) => m.profileEvidences);

/* ────────────────────────────────────────────────────────────────────────
 * Test 2 — tout code utilisé dans onboarding.ts existe dans vocabulary.ts.
 * ──────────────────────────────────────────────────────────────────────── */

describe('Test 2 — aucun code orphelin (tout code ∈ vocabulary.ts)', () => {
  it('constructs PROFILE, facets, affection, needs, drivers, guardrails, cadences', () => {
    for (const m of ONBOARDING_MAPPINGS) {
      for (const p of m.profileEvidences) {
        expect(PROFILE_CONSTRUCT_CODES as readonly string[]).toContain(p.construct);
        if (p.facet) expect(SENSITIVITY_FACETS as readonly string[]).toContain(p.facet);
      }
      for (const a of m.affectionLanguage) {
        expect(AFFECTION_DIRECTIONS as readonly string[]).toContain(a.direction);
        expect(AFFECTION_MODALITIES as readonly string[]).toContain(a.modality);
        expect(AFFECTION_LANGUAGE_CODES as readonly string[]).toContain(a.code);
      }
      for (const n of m.needs) expect(NEED_CODES as readonly string[]).toContain(n);
      for (const d of m.drivers) expect(DRIVER_CODES as readonly string[]).toContain(d);
      for (const g of m.guardrails) expect(GUARDRAIL_CODES as readonly string[]).toContain(g.code);
      if (m.affectionCadence)
        expect(AFFECTION_CADENCES as readonly string[]).toContain(m.affectionCadence);
    }
  });

  it('chemins PREFERENCE bien formés (PREFERENCE.<context>.<attribute>)', () => {
    for (const m of ONBOARDING_MAPPINGS) {
      for (const p of m.preferences) expect(isPreferencePath(p.path)).toBe(true);
    }
  });

  it('BEHAVIOR : contextes ∈ socle (4), patterns normalisés et reconnus (alias HSG inclus)', () => {
    for (const m of ONBOARDING_MAPPINGS) {
      if (!m.behavior) continue;
      expect(BEHAVIOR_CONTEXTS.seed as readonly string[]).toContain(m.behavior.context);
      const norm = normalizeBehaviorPattern(m.behavior.pattern);
      expect(norm).toMatch(/^[a-z_]+$/); // normalisé, pas de code vide/invalide
      BEHAVIOR_PATTERNS.register(m.behavior.pattern);
      expect(BEHAVIOR_PATTERNS.has(m.behavior.pattern)).toBe(true);
    }
    // Les deux renommages V15 gagnent le nom canonique HSG (décision 2).
    expect(normalizeBehaviorPattern('withdraw_seek_calm')).toBe('withdraw');
    expect(normalizeBehaviorPattern('research_thoroughly')).toBe('extensive_research');
  });
});

/* ────────────────────────────────────────────────────────────────────────
 * Test 30 — 128 options présentes ; activeOptions() en renvoie 106.
 * ──────────────────────────────────────────────────────────────────────── */

describe('Test 30 — 128 options, 106 actives', () => {
  it('128 mappings au total', () => {
    expect(ONBOARDING_MAPPINGS).toHaveLength(128);
  });
  it('106 options actives via activeOptions()', () => {
    expect(active).toHaveLength(106);
  });
  it('106 et 106b sont deux options DISTINCTES (scission, même q4b)', () => {
    const a = mappingByRef('106');
    const b = mappingByRef('106b');
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a!.questionCode).toBe('q4b');
    expect(b!.questionCode).toBe('q4b');
    expect(a!.optionText).not.toBe(b!.optionText);
    expect(a!.preferences[0]?.path).toBe('PREFERENCE.brands.sensitivity');
    expect(b!.preferences[0]?.path).toBe('PREFERENCE.experience.tier');
  });
});

/* ────────────────────────────────────────────────────────────────────────
 * Test 31 — une option non active ne contribue à aucun compteur.
 * ──────────────────────────────────────────────────────────────────────── */

describe('Test 31 — les options non actives sont exclues de tout calcul', () => {
  it('activeOptions() ne contient AUCUNE option REMOVED/MOVED', () => {
    for (const m of active) expect(m.status).toBe('ACTIF');
  });
  it('des productions existent sur des options non actives mais ne comptent jamais', () => {
    // Option 95 (MOVED_TO_DISCOVERY_VOYAGE) porte APPETENCE_PREMIUM...
    const o95 = mappingByRef('95')!;
    expect(o95.status).toBe('MOVED_TO_DISCOVERY_VOYAGE');
    expect(o95.profileEvidences.some((p) => p.construct === 'APPETENCE_PREMIUM')).toBe(true);
    // ...mais aucun APPETENCE_PREMIUM n'apparaît côté actif.
    expect(allProfileActive.some((p) => p.construct === 'APPETENCE_PREMIUM')).toBe(false);
    // Option 72 (REMOVED) porte IMPORTANCE_AUTHENTICITY en contexte GLOBAL...
    const o72 = mappingByRef('72')!;
    expect(o72.status).toBe('REMOVED_FROM_ONBOARDING_CORE');
    expect(o72.profileEvidences.length).toBeGreaterThan(0);
  });
  it('compter sur TOUTES les options donne strictement plus que sur les actives', () => {
    const allProfileCount = ONBOARDING_MAPPINGS.flatMap((m) => m.profileEvidences).length;
    expect(allProfileCount).toBeGreaterThan(allProfileActive.length);
  });
});

/* ────────────────────────────────────────────────────────────────────────
 * Test 32 — TOUS les chiffres de contrôle recalculés depuis le code.
 * ──────────────────────────────────────────────────────────────────────── */

describe('Test 32 — chiffres de contrôle recalculés = valeurs attendues', () => {
  it('128 lignes · 106 actives', () => {
    expect(ONBOARDING_MAPPINGS).toHaveLength(128);
    expect(active).toHaveLength(106);
  });

  it('59 evidences PROFILE : 11 GLOBAL_DIRECT · 48 LOCAL/CONTEXTUAL · 0 GLOBAL_CONSOLIDATED', () => {
    expect(allProfileActive).toHaveLength(59);
    const globalDirect = allProfileActive.filter((p) => p.context === 'GLOBAL');
    const local = allProfileActive.filter((p) => p.context !== 'GLOBAL');
    expect(globalDirect).toHaveLength(11);
    expect(local).toHaveLength(48);
    // Aucun mapping ne produit GLOBAL_CONSOLIDATED (ne vient que de la consolidation).
    expect(allProfileActive.filter((p) => p.context === 'GLOBAL_CONSOLIDATED')).toHaveLength(0);
  });

  it('les 11 GLOBAL_DIRECT viennent de 5 SOCIAL_ENERGY (q5) + 2 PROFILE_STRUCTURE (q4a) + 4 (q4b)', () => {
    const gd = active.flatMap((m) =>
      m.profileEvidences.filter((p) => p.context === 'GLOBAL').map((p) => ({ q: m.questionCode, c: p.construct })),
    );
    expect(gd).toHaveLength(11);
    expect(gd.filter((x) => x.q === 'q5' && x.c === 'SOCIAL_ENERGY')).toHaveLength(5);
    expect(gd.filter((x) => x.q === 'q4a' && x.c === 'PROFILE_STRUCTURE')).toHaveLength(2);
    expect(gd.filter((x) => x.q === 'q4b')).toHaveLength(4);
  });

  it('exactement 2 evidences PROFILE négatives (86 APPETENCE_OBJECT, 98 PROFILE_STRUCTURE)', () => {
    const neg = active.flatMap((m) =>
      m.profileEvidences.filter((p) => p.value < 0).map((p) => ({ ref: m.optionRef, c: p.construct })),
    );
    expect(neg).toHaveLength(2);
    expect(neg).toEqual(
      expect.arrayContaining([
        { ref: '86', c: 'APPETENCE_OBJECT' },
        { ref: '98', c: 'PROFILE_STRUCTURE' },
      ]),
    );
  });

  it('AFFECTION : 14 RECEIVE (2 par modalité) · 7 GIVE (vecteur séparé)', () => {
    const receive = active.flatMap((m) => m.affectionLanguage.filter((a) => a.direction === 'receive'));
    const give = active.flatMap((m) => m.affectionLanguage.filter((a) => a.direction === 'give'));
    expect(receive).toHaveLength(14);
    expect(give).toHaveLength(7);
    for (const mod of AFFECTION_MODALITIES) {
      expect(receive.filter((a) => a.modality === mod)).toHaveLength(2);
    }
  });

  it('BEHAVIOR : 20 sur 4 contextes ; Q9 produit 0 BEHAVIOR', () => {
    const behaviors = active.filter((m) => m.behavior);
    expect(behaviors).toHaveLength(20);
    const contexts = new Set(behaviors.map((m) => m.behavior!.context));
    expect([...contexts].sort()).toEqual(
      ['conflict_response', 'decision_process', 'emotional_expression', 'stress_response'].sort(),
    );
    expect(active.filter((m) => m.questionCode === 'q9' && m.behavior)).toHaveLength(0);
    // Q9 verse en PREFERENCE.communication.* (5 options).
    expect(active.filter((m) => m.questionCode === 'q9' && m.preferences.length > 0)).toHaveLength(5);
  });

  it('GUARDRAIL : 4 options porteuses · 5 codes · tous HARD · scopes attendus · 121 → 0', () => {
    const grdOptions = active.filter((m) => m.guardrails.length > 0);
    expect(grdOptions.map((m) => m.optionRef).sort()).toEqual(['117', '118', '119', '120']);
    const codes = active.flatMap((m) => m.guardrails);
    expect(codes).toHaveLength(5);
    for (const g of codes) expect(g.severity).toBe('HARD');
    // context: 'surprise' (lot A ter) — le stem « surprise détestée » borne le domaine.
    expect(mappingByRef('117')!.guardrails).toEqual([
      { code: 'GRD_PUBLIC_EXPOSURE', severity: 'HARD', guardrailScope: 'selection', context: 'surprise' },
    ]);
    expect(mappingByRef('118')!.guardrails).toEqual([
      { code: 'GRD_SCHEDULE_DISRUPTION', severity: 'HARD', guardrailScope: 'selection', context: 'surprise' },
    ]);
    expect(mappingByRef('119')!.guardrails).toEqual([
      { code: 'GRD_TOO_INTIMATE', severity: 'HARD', guardrailScope: 'selection', context: 'surprise' },
      { code: 'GRD_SENTIMENTAL_OVERLOAD', severity: 'HARD', guardrailScope: 'selection', context: 'surprise' },
    ]);
    expect(mappingByRef('120')!.guardrails).toEqual([
      { code: 'GRD_POOR_EXECUTION', severity: 'HARD', guardrailScope: 'execution', context: 'surprise' },
    ]);
    expect(mappingByRef('121')!.guardrails).toHaveLength(0);
  });

  it('FACT : 2 (100 habit · 101 functional_impact) ; 101 ne produit PAS NEED_RELIEF', () => {
    const facts = active.flatMap((m) => m.facts);
    expect(facts).toHaveLength(2);
    expect(mappingByRef('100')!.facts[0].fact_type).toBe('habit');
    const f101 = mappingByRef('101')!;
    expect(f101.facts[0].fact_type).toBe('functional_impact');
    expect(f101.facts[0].subject).toBe('mental_load');
    expect(f101.needs).not.toContain('NEED_RELIEF');
    expect(f101.needs).toHaveLength(0);
  });

  it('APPETENCE_SPONTANEITY = 0 evidence · APPETENCE_PREMIUM = 0 evidence (actif)', () => {
    expect(allProfileActive.filter((p) => p.construct === 'APPETENCE_SPONTANEITY')).toHaveLength(0);
    expect(allProfileActive.filter((p) => p.construct === 'APPETENCE_PREMIUM')).toHaveLength(0);
  });

  it('ligne 79 « Les deux me touchent » : aucune production', () => {
    const o79 = mappingByRef('79')!;
    expect(o79.profileEvidences).toHaveLength(0);
    expect(o79.affectionLanguage).toHaveLength(0);
    expect(o79.needs).toHaveLength(0);
    expect(o79.drivers).toHaveLength(0);
    expect(o79.guardrails).toHaveLength(0);
    expect(o79.preferences).toHaveLength(0);
    expect(o79.facts).toHaveLength(0);
    expect(o79.behavior).toBeUndefined();
    expect(o79.affectionCadence).toBeUndefined();
    expect(o79.retainedInformation).toBeNull();
  });

  // Deux compteurs divergeaient du résumé clos (qui annonçait 55 et 20, chiffres
  // pré-retraits V13/V14). Arbitrage Estelle (2026-10-02, écart §9) : les mappings
  // détaillés font foi → 50 et 17 sont les valeurs correctes, résumé clos corrigé.
  it('options avec PROFILE : 50 (écart §9 tranché — mappings font foi)', () => {
    const withProfile = active.filter((m) => m.profileEvidences.length > 0);
    expect(withProfile).toHaveLength(50);
  });
  it('evidences PROFILE secondaires : 17 (écart §9 tranché — mappings font foi)', () => {
    const secondaries = allProfileActive.filter((p) => p.evidence_role === 'secondary');
    expect(secondaries).toHaveLength(17);
  });
});

/* ────────────────────────────────────────────────────────────────────────
 * Test 33 — les 2 seules evidences PROFILE négatives sont 86 et 98.
 * ──────────────────────────────────────────────────────────────────────── */

describe('Test 33 — evidences PROFILE négatives : uniquement 86 et 98', () => {
  it('aucune autre option active ne porte de value < 0', () => {
    const negativeRefs = active
      .filter((m) => m.profileEvidences.some((p) => p.value < 0))
      .map((m) => m.optionRef)
      .sort();
    expect(negativeRefs).toEqual(['86', '98']);
    expect(mappingByRef('86')!.profileEvidences.find((p) => p.value < 0)!.construct).toBe('APPETENCE_OBJECT');
    expect(mappingByRef('98')!.profileEvidences.find((p) => p.value < 0)!.construct).toBe('PROFILE_STRUCTURE');
  });
});

/* ────────────────────────────────────────────────────────────────────────
 * Test 34 — APPETENCE_SPONTANEITY et APPETENCE_PREMIUM sortent `unknown`
 * de l'onboarding (via consolidate).
 * ──────────────────────────────────────────────────────────────────────── */

describe('Test 34 — SPONTANEITY / PREMIUM : `unknown` via consolidate', () => {
  // Journal directionnel reconstruit depuis les evidences PROFILE actives,
  // hors SOCIAL_ENERGY (continuum 0..4, hors échelle EvidenceValue).
  const journal: ProfileEvidence[] = active.flatMap((m) =>
    m.profileEvidences
      .filter((p) => p.construct !== 'SOCIAL_ENERGY')
      .map((p, i) => ({
        contactId: asContactId('c1'),
        ownerId: asUserId('u1'),
        evidence_id: `${m.optionRef}:${i}`,
        source_id: m.optionRef,
        source_type: 'onboarding_closed' as const,
        raw_information: m.optionText,
        confidence: 'high' as const,
        context: p.context,
        timestamp: '2026-10-02T00:00:00Z',
        stability: 'contextual' as const,
        evidence_role: p.evidence_role,
        target_family: 'PROFILE' as const,
        target_construct: p.construct as ProfileDirectionalCode,
        facet: p.facet,
        value: p.value as EvidenceValue,
        version: JOURNAL_VERSION_STAMP,
      })),
  );

  it('APPETENCE_SPONTANEITY → score unknown / confidence none', () => {
    const s = consolidateProfileConstruct(scope, 'APPETENCE_SPONTANEITY', journal);
    expect(s.score).toBe('unknown');
    expect(s.confidence).toBe('none');
    expect(s.evidenceCount).toBe(0);
  });
  it('APPETENCE_PREMIUM → score unknown / confidence none', () => {
    const s = consolidateProfileConstruct(scope, 'APPETENCE_PREMIUM', journal);
    expect(s.score).toBe('unknown');
    expect(s.confidence).toBe('none');
    expect(s.evidenceCount).toBe(0);
  });
});
