import { describe, it, expect } from 'vitest';
import { examiner, type Ligne, type SourceAuditee } from '../../../../scripts/local/08-audit-extraction.mts';

// LES RÈGLES DE L'AUDIT, ÉPROUVÉES SUR LE RELEVÉ RÉEL DU COMPTE DE TEST.
//
// Les six défauts ci-dessous ont été trouvés à la main dans le relevé de Sophie. Si l'audit
// ne les retrouve pas, il ne sert à rien — et un audit qui ne trouve rien RASSURE, ce qui est
// pire que pas d'audit du tout. Chaque cas vient donc de vraies lignes, pas d'une invention.

const src = (p: Partial<SourceAuditee>): SourceAuditee => ({
  id: 's1', question_text: 'Une question', answer_text: 'Une réponse',
  raw_text: null, source_type: 'onboarding_closed', ...p,
});
const l = (p: Partial<Ligne>): Ligne => ({
  source_id: 's1', question: 'Une question', reponse: 'Une réponse',
  source_type: 'onboarding_closed', ts: null, assertion_status: 'explicit',
  famille: 'PREFERENCE', construct: 'PREFERENCE.x.y', libelle: null,
  relationship: null, relation: null, strength: 'moderate', severity: null,
  value: null, confidence: 'high', ...p,
});
const quoi = (cs: ReturnType<typeof examiner>) => cs.map((c) => c.quoi);

describe('une réponse qui n’a rien produit est signalée', () => {
  it('une source sans aucune preuve remonte en bloquant', () => {
    const cs = examiner([], [src({ id: 'orpheline', question_text: 'Ce que j’adore faire' })]);
    expect(quoi(cs)).toContain('réponse sans aucune preuve');
    expect(cs.find((c) => c.quoi === 'réponse sans aucune preuve')!.gravite).toBe('BLOQUANT');
  });

  it('une source qui a produit quelque chose ne remonte pas', () => {
    const cs = examiner([l({ source_id: 'ok' })], [src({ id: 'ok' })]);
    expect(quoi(cs)).not.toContain('réponse sans aucune preuve');
  });
});

describe('un construct hors vocabulaire est signalé — la base ne le refuse pas', () => {
  it('« value_sought » comme DRIVER remonte', () => {
    // Le cas réel : le référentiel Discovery range « leur affection » sous un DRIVER nommé
    // `value_sought`, que le journal ne connaît pas. La base l'accepterait.
    const cs = examiner([l({ famille: 'DRIVER', construct: 'value_sought' })], [src({})]);
    expect(quoi(cs)).toContain('construct hors vocabulaire');
  });

  it('un vrai code DRIVER ne remonte pas', () => {
    const cs = examiner([l({ famille: 'DRIVER', construct: 'DRV_ATTENTIVENESS' })], [src({})]);
    expect(quoi(cs)).not.toContain('construct hors vocabulaire');
  });

  it('un garde-fou en chemin vertical est accepté, un garde-fou inventé non', () => {
    const vertical = examiner([l({ famille: 'GUARDRAIL', construct: 'shoe.gift_openness.refuse' })], [src({})]);
    expect(quoi(vertical)).not.toContain('construct hors vocabulaire');
    const invente = examiner([l({ famille: 'GUARDRAIL', construct: 'GRD_INVENTE' })], [src({})]);
    expect(quoi(invente)).toContain('construct hors vocabulaire');
  });

  it('un langage d’affection mal formé remonte', () => {
    const bon = examiner([l({ famille: 'AFFECTION_LANGUAGE', construct: 'AFFECTION_RECEIVE_WORDS' })], [src({})]);
    expect(quoi(bon)).not.toContain('construct hors vocabulaire');
    const faux = examiner([l({ famille: 'AFFECTION_LANGUAGE', construct: 'AFFECTION_RECEIVE_CALINS' })], [src({})]);
    expect(quoi(faux)).toContain('construct hors vocabulaire');
  });
});

describe('la contradiction du week-end du Jura est retrouvée', () => {
  it('une surprise aimée alors qu’un garde-fou refuse l’imprévu remonte', () => {
    // Lignes réelles du compte de test : ENTITY/LOVE sur « week-end surprise dans le Jura »,
    // et un garde-fou GRD_SCHEDULE_DISRUPTION déclaré par le questionnaire fermé.
    const cs = examiner([
      l({ famille: 'ENTITY', construct: 'week_end_surprise_dans_jura',
          libelle: 'week-end surprise dans le Jura', relation: 'LOVE',
          source_type: 'extraction_inferred', assertion_status: 'inferred' }),
      l({ famille: 'GUARDRAIL', construct: 'GRD_SCHEDULE_DISRUPTION', severity: 'HARD', strength: 'strong' }),
    ], [src({})]);
    expect(quoi(cs)).toContain('surprise aimée malgré un garde-fou contraire');
  });

  it('la même entité aimée ET évitée remonte', () => {
    const cs = examiner([
      l({ famille: 'ENTITY', construct: 'bijoux', libelle: 'bijoux', relation: 'LIKE' }),
      l({ famille: 'ENTITY', construct: 'bijoux', libelle: 'bijoux', relation: 'AVOID' }),
    ], [src({})]);
    expect(quoi(cs)).toContain('entité à la fois aimée et évitée');
  });
});

describe('les degrés d’engagement', () => {
  it('une valeur hors échelle remonte en bloquant', () => {
    const cs = examiner([l({ famille: 'INTEREST', construct: 'lecture', relationship: 'appreciation' })], [src({})]);
    const c = cs.find((x) => x.quoi === 'degré d’engagement hors échelle');
    expect(c).toBeDefined();
    expect(c!.gravite).toBe('BLOQUANT');
  });

  it('« passion » venu d’une extraction est signalé à part — le mot existe dans les deux vocabulaires', () => {
    const cs = examiner([l({
      famille: 'INTEREST', construct: 'lecture_au_lit', libelle: 'lecture au lit le dimanche matin',
      relationship: 'passion', source_type: 'extraction_inferred',
    })], [src({})]);
    const c = cs.find((x) => x.quoi === 'degré « passion » issu d’une extraction');
    expect(c).toBeDefined();
    expect(c!.gravite).toBe('À REGARDER');
  });

  it('« passion » déclaré dans un questionnaire fermé ne remonte pas', () => {
    const cs = examiner([l({
      famille: 'INTEREST', construct: 'x', relationship: 'passion', source_type: 'onboarding_closed',
    })], [src({})]);
    expect(quoi(cs)).not.toContain('degré « passion » issu d’une extraction');
  });
});

describe('l’intensité des refus', () => {
  it('deux refus à la même intensité remontent', () => {
    // Le cas réel : « surtout pas de fleurs coupées » et « les bijoux, très peu pour moi »,
    // tous deux en `moderate`.
    const cs = examiner([
      l({ famille: 'ENTITY', construct: 'fleurs_coupees', relation: 'AVOID', strength: 'moderate' }),
      l({ famille: 'ENTITY', construct: 'bijoux', relation: 'AVOID', strength: 'moderate' }),
    ], [src({})]);
    expect(quoi(cs)).toContain('tous les refus à la même intensité');
  });

  it('des refus d’intensités différentes ne remontent pas', () => {
    const cs = examiner([
      l({ famille: 'ENTITY', construct: 'fleurs_coupees', relation: 'AVOID', strength: 'strong' }),
      l({ famille: 'ENTITY', construct: 'bijoux', relation: 'AVOID', strength: 'moderate' }),
    ], [src({})]);
    expect(quoi(cs)).not.toContain('tous les refus à la même intensité');
  });
});

describe('une déclaration classée comme inférence', () => {
  it('« surtout pas de fleurs coupées » marqué `inferred` remonte en bloquant', () => {
    const cs = examiner([l({
      famille: 'ENTITY', construct: 'fleurs_coupees', relation: 'AVOID',
      reponse: 'Surtout pas de fleurs coupées — ça me déprime de les regarder faner.',
      assertion_status: 'inferred', source_type: 'extraction_inferred',
    })], [src({})]);
    const c = cs.find((x) => x.quoi === 'déclaration explicite classée comme inférence');
    expect(c).toBeDefined();
    expect(c!.gravite).toBe('BLOQUANT');
    // Le détail doit dire la CONSÉQUENCE, pas seulement le constat.
    expect(c!.detail).toContain('ne sera jamais lu');
  });

  it('une inférence qui ne contient aucune déclaration ferme ne remonte pas', () => {
    const cs = examiner([l({
      reponse: 'J’aime bien marcher en ville de temps en temps.',
      assertion_status: 'inferred', source_type: 'extraction_inferred',
    })], [src({})]);
    expect(quoi(cs)).not.toContain('déclaration explicite classée comme inférence');
  });
});

describe('l’audit ne crie pas sur un journal sain', () => {
  it('des lignes correctes ne produisent aucun constat', () => {
    const cs = examiner([
      l({ famille: 'PROFILE', construct: 'PROFILE_STRUCTURE', strength: null, value: 2 }),
      l({ famille: 'AFFECTION_LANGUAGE', construct: 'AFFECTION_RECEIVE_QUALITY_TIME', strength: 'strong' }),
      l({ famille: 'NEED', construct: 'NEED_CONNECTION', strength: 'strong' }),
      l({ famille: 'DRIVER', construct: 'DRV_SIMPLICITY', strength: 'moderate' }),
    ], [src({})]);
    expect(cs).toEqual([]);
  });
});
