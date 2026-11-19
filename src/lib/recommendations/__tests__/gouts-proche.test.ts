import { describe, it, expect } from 'vitest';
import { fausseBase } from '../../knowledge/__tests__/fausse-base';
import { lireGoutsDuProche, citeUneDeclaration, USAGE_GOUTS, JOURS_GOUT_PASSAGER, JUSTIFICATION_NEUTRE } from '../gouts-proche';
import { PORTEE_EXCLUSIONS_RECO } from '../declarations-proche';
import { estUsageValide } from '../../consent/usage-profil';

const PILOTE = 'pilote-1', PROCHE = 'proche-1', CONTACT = 'contact-1';
const T = '2026-11-19T09:00:00.000Z';
const base = (scope: string[], evidences: Record<string, unknown>[], sources: Record<string, unknown>[], accordePar = PROCHE) => fausseBase({
  contacts: [{ id: CONTACT, user_id: PILOTE, proche_user_id: PROCHE }],
  contact_consents: [{ id: 'c1', pilote_id: PILOTE, contact_id: CONTACT, proche_user_id: PROCHE, kind: 'profile_usage', status: 'active', scope, granted_by: accordePar }],
  knowledge_evidences: evidences.map((e, i) => ({ id: `e${i}`, user_id: PROCHE, about_kind: 'account', about_id: PROCHE, superseded_at: null, assertion_status: 'explicit', stability: 'evolving', context: 'GLOBAL', ...e })),
  knowledge_sources: sources.map((s) => ({ ts: T, question_code: 'q', ...s })),
});
const lire = (b: ReturnType<typeof fausseBase>) => lireGoutsDuProche(b.client, { piloteId: PILOTE, contactId: CONTACT, maintenant: new Date(T) });
const JAZZ = { source_id: 's1', target_family: 'INTEREST', target_construct: 'jazz', subject_label: 'le jazz' };
const DECL = { id: 's1', source_type: 'onboarding_closed' };

describe('usage positif des goûts déclarés par le proche', () => {
  it('`reco:gouts` est une portée accordable ; l’autorisation d’écarter ne l’ouvre pas', async () => {
    expect(estUsageValide(USAGE_GOUTS)).toBe(true);
    expect(await lire(base([PORTEE_EXCLUSIONS_RECO], [JAZZ], [DECL]))).toMatchObject({ autorise: false, motif: 'portee_absente', gouts: [] });
    expect((await lire(base([USAGE_GOUTS], [JAZZ], [DECL]))).gouts.map((g) => g.libelle)).toEqual(['le jazz']);
  });
  it('un accord que le proche n’a pas donné lui-même n’ouvre rien ; le contact d’un autre pilote non plus', async () => {
    expect(await lire(base([USAGE_GOUTS], [JAZZ], [DECL], PILOTE))).toMatchObject({ autorise: false, motif: 'aucun_consentement' });
    const b = base([USAGE_GOUTS], [JAZZ], [DECL]);
    expect(await lireGoutsDuProche(b.client, { piloteId: 'autre-pilote', contactId: CONTACT })).toMatchObject({ autorise: false, motif: 'aucun_compte' });
  });
  it('seule SA parole entre : ni ce qu’un proche rapporte, ni ce qu’un modèle a lu, ni ce qui décrit quelqu’un d’autre', async () => {
    const b = base([USAGE_GOUTS], [
      JAZZ,
      { source_id: 's2', target_family: 'INTEREST', target_construct: 'pain', subject_label: 'faire du pain' },                              // rapporté par un tiers
      { source_id: 's3', target_family: 'INTEREST', target_construct: 'geologie', subject_label: 'la géologie', assertion_status: 'inferred' }, // lu par un modèle
      { source_id: 's1', target_family: 'INTEREST', target_construct: 'golf', subject_label: 'le golf', about_id: 'un-autre' },                // au sujet d'un autre
    ], [DECL, { id: 's2', source_type: 'reported_by_relative' }, { id: 's3', source_type: 'extraction_inferred' }]);
    const r = await lire(b);
    expect(r.gouts.map((g) => g.libelle)).toEqual(['le jazz']);
    expect(r.ecartes).toEqual({ pas_sa_declaration: 2 });
  });
  it('une chose à la fois aimée et écartée par ses propres déclarations n’est pas transmise', async () => {
    const b = base([USAGE_GOUTS], [
      { source_id: 's1', target_family: 'ENTITY', target_construct: 'sushi', entity_label: 'les sushis', relation: 'LOVE' },
      { source_id: 's1', target_family: 'ENTITY', target_construct: 'sushi', entity_label: 'les sushis', relation: 'AVOID' },
      { source_id: 's1', target_family: 'PREFERENCE', target_construct: 'PREFERENCE.music.genre', preference_value: 'rock', polarity: 'positive', raw_information: 'Le rock' },
      { source_id: 's1', target_family: 'PREFERENCE', target_construct: 'PREFERENCE.music.genre', preference_value: 'rap', polarity: 'rejet', raw_information: 'Le rap' },
    ], [DECL]);
    const r = await lire(b);
    expect(r.gouts.map((g) => g.libelle)).toEqual(['Le rock']);
    expect(r.ecartes).toEqual({ contredit_par_sa_propre_declaration: 1 });
  });
  it('ni neutre, ni condition, ni absence de critère : seulement ce qui est aimé ou souhaité', async () => {
    const b = base([USAGE_GOUTS], [
      { source_id: 's1', target_family: 'ENTITY', target_construct: 'a', entity_label: 'A', relation: 'NEUTRAL' },
      { source_id: 's1', target_family: 'PREFERENCE', target_construct: 'PREFERENCE.x.y', preference_value: 'v', polarity: 'condition', raw_information: 'Si…' },
      { source_id: 's1', target_family: 'PREFERENCE', target_construct: 'PREFERENCE.x.z', preference_value: 'v', polarity: 'absence_de_critere', raw_information: 'Peu importe' },
      { source_id: 's1', target_family: 'ENTITY', target_construct: 'b', entity_label: 'Lisbonne', relation: 'WANT_TO_VISIT' },
    ], [DECL]);
    const r = await lire(b);
    expect(r.gouts.map((g) => g.libelle)).toEqual(['Lisbonne']);
    expect(r.ecartes).toEqual({ ni_gout_ni_souhait: 3 });
  });
  it('un goût passager ancien n’est plus transmis ; récent, il l’est', async () => {
    const vieux = new Date(new Date(T).getTime() - (JOURS_GOUT_PASSAGER + 1) * 86_400_000).toISOString();
    const b = base([USAGE_GOUTS], [
      { source_id: 's1', target_family: 'INTEREST', target_construct: 'ramen', subject_label: 'les ramens', stability: 'temporary' },
      { source_id: 's9', target_family: 'INTEREST', target_construct: 'tricot', subject_label: 'le tricot', stability: 'temporary' },
    ], [DECL, { id: 's9', source_type: 'discovery_closed', ts: vieux }]);
    const r = await lire(b);
    expect(r.gouts.map((g) => g.libelle)).toEqual(['les ramens']);
    expect(r.ecartes).toEqual({ gout_passager_ancien: 1 });
  });
  it('un sujet sensible du Discovery n’est jamais transmis', async () => {
    const { BANQUE } = await import('../../discovery/open-v3/banque');
    const { analyserCondition } = await import('../../discovery/open-v3/conditions');
    const sensible = BANQUE.find((q) => analyserCondition(q.condition_emission).sensible)!;
    const b = base([USAGE_GOUTS], [{ source_id: 's5', target_family: 'INTEREST', target_construct: 'cause', subject_label: 'une cause' }], [{ id: 's5', source_type: 'discovery_closed', question_code: sensible.id }]);
    expect(await lire(b)).toMatchObject({ gouts: [], ecartes: { sujet_sensible: 1 } });
  });
  it('lecture en panne : refus, jamais « aucun goût »', async () => {
    const b = base([USAGE_GOUTS], [JAZZ], [DECL]);
    b.panne = ({ table }) => (table === 'knowledge_evidences' ? 'panne' : null);
    expect(await lire(b)).toMatchObject({ autorise: false, motif: 'lecture_impossible' });
  });
  it('la justification qui reprend les mots d’une déclaration est repérée ; la formule neutre ne dit rien', () => {
    const g = [{ libelle: 'le jazz manouche', famille: 'INTEREST' as const, domaine: null, source: 'onboarding_closed' as const, date: T }];
    expect(citeUneDeclaration('Il adore le jazz manouche depuis toujours', g)).toBe(true);
    expect(citeUneDeclaration('Une soirée musicale qui devrait lui plaire', g)).toBe(false);
    expect(citeUneDeclaration(JUSTIFICATION_NEUTRE, g)).toBe(false);
  });
});
