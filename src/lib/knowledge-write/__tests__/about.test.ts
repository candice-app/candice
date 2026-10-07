// Lot B — AboutRef : plafond par égalité, étanchéité entre personnes décrites,
// chemin evidence → source → about, non-fusion §3, deux sourceType, et les trois
// invariants demandés en correction (0 = absence, ordre soutien inerte, verbatim moteurs).
//
// Tout est ADDITIF : aucune mécanique de consolidation ni de résolution de contradiction
// n'est introduite ici (arbitrage : la contradiction appartient à consolidate/consolidation-rules).

import { describe, expect, it } from 'vitest';
import {
  accountAbout,
  accountScope,
  activeOptions,
  asContactId,
  asUserId,
  consolidateInterests,
  contactAbout,
  contactScope,
  deriveAssertionStatus,
  effectiveExposure,
  MOTEURS,
  normalizeLabel,
  signalKey,
  SOUTIEN,
  type Evidence,
  type InterestEvidence,
  type VisibilityPolicy,
} from '../../knowledge';
import {
  produceFromOption,
  produceInterest,
  produceMoteursOption,
  produceSoutienOption,
  type WriteContext,
} from '../produce';

const HOLDER = asUserId('u1');
const ts = '2026-10-06T00:00:00Z';

/* ────────────────────────────────────────────────────────────────────────
 * PLAFOND DE SENSIBILITÉ — se lève par ÉGALITÉ, jamais par un drapeau.
 * ──────────────────────────────────────────────────────────────────────── */
describe('Plafond de sensibilité — levée par égalité about===détenteur seulement', () => {
  const sensitive: VisibilityPolicy = { derived: 'internal_only', userOverride: 'shared_with_relatives' };

  it('A · la personne décrite EST le détenteur (account===holder) → le plafond se lève', () => {
    expect(effectiveExposure(sensitive, { about: accountAbout(HOLDER), holderUserId: HOLDER }))
      .toBe('shared_with_relatives');
  });
  it('B · un account qui n’est PAS le détenteur ne lève rien', () => {
    expect(effectiveExposure(sensitive, { about: accountAbout(asUserId('u2')), holderUserId: HOLDER }))
      .toBe('internal_only');
  });
  it('C · about.kind==="contact" ne lève jamais, même si l’id coïncide avec le détenteur (aucune devinette d’identité)', () => {
    expect(effectiveExposure(sensitive, { about: contactAbout(asContactId('u1')), holderUserId: HOLDER }))
      .toBe('internal_only');
  });
  it('sans contexte, le plafond s’applique (cas sûr par défaut)', () => {
    expect(effectiveExposure(sensitive)).toBe('internal_only');
  });
  it('un contenu non sensible n’est pas concerné par le plafond', () => {
    expect(effectiveExposure({ derived: 'exposable', userOverride: 'visible' })).toBe('visible');
  });
});

/* ────────────────────────────────────────────────────────────────────────
 * ÉTANCHÉITÉ entre personnes décrites : même family/construct/détenteur,
 * about différent → signalKey différent → aucune consolidation croisée.
 * ──────────────────────────────────────────────────────────────────────── */
describe('Étanchéité entre personnes décrites', () => {
  const estelle = accountScope(HOLDER, HOLDER); // about = account:u1 (elle sur elle-même)
  const paul = contactScope(asContactId('paul'), HOLDER); // about = contact:paul

  const evFor = (ctx: WriteContext) => produceInterest(ctx, 'Vin nature', 'food_gastronomy').evidences as InterestEvidence[];
  const evE = evFor({ ...estelle, sourceId: '00000000-0000-5000-8000-0000000000e1', sourceType: 'onboarding_closed', timestamp: ts });
  const evP = evFor({ ...paul, sourceId: '00000000-0000-5000-8000-0000000000p1', sourceType: 'onboarding_closed', timestamp: ts });

  it('même intérêt, deux personnes → deux clés de signal distinctes', () => {
    const sigE = consolidateInterests(estelle, evE)[0];
    const sigP = consolidateInterests(paul, evP)[0];
    const kE = signalKey(estelle.about, sigE);
    const kP = signalKey(paul.about, sigP);
    expect(kE).not.toBe(kP);
    expect(kE.startsWith('account:u1::')).toBe(true);
    expect(kP.startsWith('contact:paul::')).toBe(true);
  });
  it('consolider la personne A n’utilise aucune evidence de la personne B', () => {
    // le journal de A ne contient que les evidences de A (about identique)
    expect(evE.every((e) => e.about.kind === 'account' && e.about.id === HOLDER)).toBe(true);
    expect(evP.every((e) => e.about.kind === 'contact')).toBe(true);
  });
});

/* ────────────────────────────────────────────────────────────────────────
 * CHEMIN evidence → source_id → source.about ; l’about n’est PAS dans la clé-cible
 * de l’evidence_id (donc aucune migration d’evidence_id ; remap idempotent).
 * ──────────────────────────────────────────────────────────────────────── */
describe('evidence_id : about porté par la source, jamais dupliqué dans la clé-cible', () => {
  const SRC = '00000000-0000-5000-8000-00000000src1';
  const active = activeOptions();
  const mapping = active.find((m) => produceFromOption({ ...contactScope(asContactId('c1'), HOLDER), sourceId: SRC, sourceType: 'onboarding_closed', timestamp: ts }, m).evidences.length > 0)!;

  it('chaque evidence référence sa source ; la source porte l’about', () => {
    const scope = contactScope(asContactId('c1'), HOLDER);
    const { source, evidences } = produceFromOption({ ...scope, sourceId: SRC, sourceType: 'onboarding_closed', timestamp: ts }, mapping);
    expect(source.about).toEqual(scope.about);
    for (const e of evidences) {
      expect(e.source_id).toBe(source.id); // evidence → source
      expect(e.about).toEqual(source.about); // à l’écriture, dérivable de la source
    }
  });

  it('même source_id, about différent → MÊME evidence_id (l’about n’entre pas dans la clé-cible)', () => {
    const asContact = produceFromOption({ ...contactScope(asContactId('c1'), HOLDER), sourceId: SRC, sourceType: 'onboarding_closed', timestamp: ts }, mapping);
    const asAccount = produceFromOption({ ...accountScope(HOLDER, HOLDER), sourceId: SRC, sourceType: 'onboarding_closed', timestamp: ts }, mapping);
    expect(asContact.evidences.map((e) => e.evidence_id)).toEqual(asAccount.evidences.map((e) => e.evidence_id));
  });

  it('remap idempotent : reproduire la même source donne les mêmes evidence_id', () => {
    const a = produceFromOption({ ...contactScope(asContactId('c1'), HOLDER), sourceId: SRC, sourceType: 'onboarding_closed', timestamp: ts }, mapping);
    const b = produceFromOption({ ...contactScope(asContactId('c1'), HOLDER), sourceId: SRC, sourceType: 'onboarding_closed', timestamp: ts }, mapping);
    expect(a.evidences.map((e) => e.evidence_id)).toEqual(b.evidences.map((e) => e.evidence_id));
  });
});

/* ────────────────────────────────────────────────────────────────────────
 * NON-FUSION §3 + les deux sourceType (deux cas, pas trois).
 * ──────────────────────────────────────────────────────────────────────── */
describe('Non-fusion §3 : auto-déclaré (account/declared) vs rapporté (contact/reported)', () => {
  const elleSelf = accountScope(HOLDER, HOLDER); // cas A — elle sur elle-même
  const elleByPilot = contactScope(asContactId('contact-elle'), asUserId('pilote')); // cas B — incognito

  const A = produceInterest({ ...elleSelf, sourceId: '00000000-0000-5000-8000-00000000a001', sourceType: 'onboarding_closed', timestamp: ts }, 'Vin nature', 'food_gastronomy');
  const B = produceInterest({ ...elleByPilot, sourceId: '00000000-0000-5000-8000-00000000b001', sourceType: 'reported_by_relative', timestamp: ts }, 'Vin nature', 'food_gastronomy');

  it('cas A → declared, cas B → reported (dérivation inchangée, deux sourceType)', () => {
    expect(A.source.assertionStatus).toBe('declared');
    expect(B.source.assertionStatus).toBe('reported');
    expect(deriveAssertionStatus('onboarding_closed')).toBe('declared');
    expect(deriveAssertionStatus('reported_by_relative')).toBe('reported');
  });
  it('deux abouts, deux sources → deux clés, deux evidence_id : aucun chemin ne les rapproche', () => {
    const sigA = consolidateInterests(elleSelf, A.evidences as InterestEvidence[])[0];
    const sigB = consolidateInterests(elleByPilot, B.evidences as InterestEvidence[])[0];
    expect(signalKey(elleSelf.about, sigA)).not.toBe(signalKey(elleByPilot.about, sigB));
    expect(A.evidences[0].evidence_id).not.toBe(B.evidences[0].evidence_id);
  });
});

/* ────────────────────────────────────────────────────────────────────────
 * 15 catégories = radar initial, jamais une taxonomie fermée.
 * ──────────────────────────────────────────────────────────────────────── */
describe('Radar d’intérêts ouvert : un intérêt hors des 15 est représentable', () => {
  it('une catégorie inédite produit une evidence, verbatim conservé, domaine porté', () => {
    const ctx: WriteContext = { ...contactScope(asContactId('c1'), HOLDER), sourceId: '00000000-0000-5000-8000-0000000op3n', sourceType: 'onboarding_closed', timestamp: ts };
    const { evidences } = produceInterest(ctx, 'Spéléologie souterraine', 'speleologie_inedite');
    const e = evidences[0] as Evidence & { subjectLabel: string; parent_domain?: string };
    expect(e.subjectLabel).toBe('Spéléologie souterraine'); // verbatim, jamais normalisé à l’affichage
    expect(e.parent_domain).toBe('speleologie_inedite'); // domaine hors seed accepté (vocabulaire ouvert)
  });
});

/* ────────────────────────────────────────────────────────────────────────
 * Trois invariants demandés en correction.
 * ──────────────────────────────────────────────────────────────────────── */
describe('0 est une absence d’evidence, jamais une evidence de valeur nulle — explicitement sur Q2', () => {
  const scope = contactScope(asContactId('c1'), HOLDER);
  const q2 = activeOptions().filter((m) => m.questionCode === 'q2');

  it('Q2 existe et ne produit aucune evidence AFFECTION', () => {
    expect(q2.length).toBeGreaterThan(0);
    for (const m of q2) {
      const { evidences } = produceFromOption({ ...scope, sourceId: '00000000-0000-5000-8000-0000000000q2', sourceType: 'onboarding_closed', timestamp: ts }, m);
      expect(evidences.filter((e) => e.target_family === 'AFFECTION_LANGUAGE')).toHaveLength(0);
    }
  });
  it('aucune evidence produite par Q2 ne porte value===0 (absence ≠ zéro ; le 0 réel est réservé à SOCIAL_ENERGY)', () => {
    for (const m of q2) {
      const { evidences } = produceFromOption({ ...scope, sourceId: '00000000-0000-5000-8000-0000000000q2', sourceType: 'onboarding_closed', timestamp: ts }, m);
      for (const e of evidences) {
        if ('value' in e && e.target_construct !== 'SOCIAL_ENERGY') {
          expect((e as { value: number }).value).not.toBe(0);
        }
      }
    }
  });
});

describe('Soutien : l’ordre de sélection ne modifie ni la strength ni la priorité', () => {
  const scope = contactScope(asContactId('c1'), HOLDER);
  it('toute option, quel que soit son rang de sélection, reste primary/strong/distress', () => {
    const order = [SOUTIEN.options[2], SOUTIEN.options[0], SOUTIEN.options[4], SOUTIEN.options[1]];
    for (const [i, opt] of order.entries()) {
      const { evidences } = produceSoutienOption({ ...scope, sourceId: `00000000-0000-5000-8000-00000000so0${i}`, sourceType: 'onboarding_closed', timestamp: ts }, opt);
      const e = evidences[0];
      expect(e.evidence_role).toBe('primary');
      expect(e.strength).toBe('strong');
      expect(e.context).toBe('distress');
    }
  });
});

describe('Moteurs : on conserve le code de l’option ET le verbatim affiché, pas seulement la catégorie normalisée', () => {
  const scope = contactScope(asContactId('c1'), HOLDER);
  it('subject = code normalisé stable ; subjectLabel = texte réellement affiché/répondu', () => {
    const opt = MOTEURS.options[0]; // { subject: 'freedom', optionText: 'La liberté' }
    const { source, openKnowledge } = produceMoteursOption({ ...scope, sourceId: '00000000-0000-5000-8000-0000000mot1', sourceType: 'onboarding_closed', timestamp: ts }, opt);
    const k = openKnowledge[0];
    expect(k.subject).toBe(normalizeLabel(opt.subject)); // code conservé
    expect(k.subjectLabel).toBe(opt.optionText); // verbatim affiché, jamais remplacé par le code
    expect(source.answerText).toBe(opt.optionText); // la réponse réellement donnée est conservée verbatim
  });
});
