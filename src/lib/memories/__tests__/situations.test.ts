import { describe, it, expect } from 'vitest';
import { colonnesDepuisLecture, preparerPourReco, nommeUnDetailConfidentiel, validerLecture, enregistrerSituation, SituationRefusee, type LectureSituation } from '../situations';
import { buildContextString } from '@/lib/recommendations/engine';

// LES SITUATIONS — décisions d'Estelle du 18 nov.
// Une situation sensible, actuelle et autorisée DOIT changer ce que Candice propose ; son
// détail ne doit apparaître ni dans ce qui part au modèle, ni dans ce qui s'affiche.

const deuil: LectureSituation = {
  category: 'deuil', subcategory: 'perte d’un parent', tonality: 'fragile', emotional_intensity: 'high',
  probable_needs: ['présence'], sensitivity_level: 4, certitude: 'constat',
  reformulation: 'Julie traverse un deuil. À prendre en compte dans tes prochaines attentions.',
};
const DEMAIN = new Date(Date.now() + 86_400_000).toISOString();
const HIER = new Date(Date.now() - 86_400_000).toISOString();
const ligne = (p: Record<string, unknown> = {}) => ({ ...colonnesDepuisLecture(deuil), revalidation_date: DEMAIN, ...p });

describe('ce que la base reçoit suit le vocabulaire V26', () => {
  it('un deuil est « sensible », d’intensité « élevé » — jamais « active » ni « high »', () => {
    const c = colonnesDepuisLecture(deuil);
    expect(c.status).toBe('sensible');
    expect(c.emotional_intensity).toBe('élevé');
    expect(c.sanitized_summary).toBe(deuil.reformulation);
  });
  it('une impression non sensible est « incertain », de fiabilité « faible »', () => {
    const c = colonnesDepuisLecture({ ...deuil, category: 'travail', sensitivity_level: 1, certitude: 'impression' });
    expect(c.status).toBe('incertain');
    expect(c.source_reliability).toBe('faible');
  });
  it('un constat ordinaire est « actif »', () => {
    expect(colonnesDepuisLecture({ ...deuil, category: 'travail', sensitivity_level: 1 }).status).toBe('actif');
  });
  it('une sensibilité illisible vaut la plus haute', () => {
    expect(validerLecture({ ...deuil, sensitivity_level: 9 as never }).sensitivity_level).toBe(4);
  });
  it('une lecture hors vocabulaire est refusée plutôt qu’écrite', () => {
    expect(() => validerLecture({ ...deuil, tonality: 'dramatique' as never })).toThrow();
  });
});

describe('ce que la recommandation a le droit de savoir', () => {
  it('situation sensible actuelle : une consigne GÉNÉRALE, sans le mot « deuil »', () => {
    const r = preparerPourReco(ligne())!;
    expect(r.confidentielle).toBe(true);
    expect(r.consigne).toBe('période difficile, privilégier une proposition sans pression');
    expect(r.consigne).not.toMatch(/deuil|décès|mère|perte/i);
  });
  it('situation ordinaire : le sujet peut être nommé', () => {
    const r = preparerPourReco({ ...colonnesDepuisLecture({ ...deuil, category: 'travail', sensitivity_level: 1 }), revalidation_date: DEMAIN })!;
    expect(r.confidentielle).toBe(false);
    expect(r.consigne).toContain('contexte : travail');
  });
  it('situation ARCHIVÉE ou INVALIDÉE : elle n’influence plus rien', () => {
    expect(preparerPourReco(ligne({ status: 'archivé' }))).toBeNull();
    expect(preparerPourReco(ligne({ status: 'invalidé' }))).toBeNull();
    expect(preparerPourReco(ligne({ status: 'masqué' }))).toBeNull();
  });
  it('date de revalidation dépassée : plus tenue pour actuelle', () => {
    expect(preparerPourReco(ligne({ revalidation_date: HIER }))).toBeNull();
  });
  it('information rapportée ou impression : utilisée, mais marquée incertaine', () => {
    const r = preparerPourReco({ ...colonnesDepuisLecture({ ...deuil, category: 'humeur', sensitivity_level: 1, certitude: 'rapporte' }), revalidation_date: DEMAIN })!;
    expect(r.incertaine).toBe(true);
    expect(r.consigne).toMatch(/impression non confirmée/);
    expect(r.consigne).toMatch(/ne rien tenir pour acquis/);
  });
  it('note pas encore lue par le modèle : aucune consigne inventée', () => {
    expect(preparerPourReco({ status: 'sensible', category: null, tonality: null, sensitivity_level: 4, revalidation_date: DEMAIN })).toBeNull();
  });
});

describe('ce qui part au modèle de recommandation', () => {
  const base = {
    contactId: 'c', contactName: 'Julie Martin', contactFirstName: 'Julie', relationship: 'friend', proximityLevel: 'close', register: null,
    reception: null, expression: null, temperamentAxes: null, relationalFilters: null, vetos: null, singularity: null, classicProfile: null,
    piloteExpression: null, importantDates: [], recentContext: null, recentlyProposed: [], complicatedContext: null, feedbackHistory: [],
  } as never as Parameters<typeof buildContextString>[0];

  it('SANS situation, le contexte ne parle d’aucune période', () => {
    expect(buildContextString(base)).not.toMatch(/SITUATION ACTUELLE/);
  });
  it('AVEC une situation sensible : la consigne générale y est, la cause n’y est pas', () => {
    const ctx = buildContextString({ ...base, situations: [preparerPourReco(ligne())!] });
    expect(ctx).toMatch(/SITUATION ACTUELLE/);
    expect(ctx).toMatch(/période difficile, privilégier une proposition sans pression/);
    expect(ctx).toMatch(/CONFIDENTIALITÉ/);
    expect(ctx).not.toMatch(/deuil|décès|sa mère|perdu/i);
    expect(ctx).toMatch(/n'en déduis aucune envie/);
  });
  it('une situation archivée ne laisse aucune trace dans le contexte', () => {
    const s = preparerPourReco(ligne({ status: 'archivé' }));
    expect(buildContextString({ ...base, situations: s ? [s] : [] })).not.toMatch(/SITUATION ACTUELLE/);
  });
});

describe('ce qui s’affiche : une suggestion ne nomme pas le détail', () => {
  const s = [preparerPourReco(ligne())!];
  it('« depuis le décès de sa mère » est repéré', () => {
    expect(nommeUnDetailConfidentiel('Un dîner, pour l’entourer depuis le décès de sa mère', s)).toBe(true);
  });
  it('« Julie traverse une période difficile… à son rythme » passe', () => {
    expect(nommeUnDetailConfidentiel('Julie traverse une période difficile. Tu pourrais lui proposer de passer un moment ensemble, à son rythme.', s)).toBe(false);
  });
});

describe('accès refusé : rien n’est écrit, le modèle n’est pas appelé', () => {
  it('le contact d’un autre compte est introuvable, avant toute lecture', async () => {
    let appels = 0; const ecritures: string[] = [];
    const supabase = { from: (t: string) => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
      insert: () => { ecritures.push(t); return { select: () => ({ single: async () => ({ data: { id: 'x' }, error: null }) }) }; },
    }) };
    const lire = async () => { appels++; return deuil; };
    await expect(enregistrerSituation(supabase, { userId: 'u', contactId: '11111111-1111-4111-8111-111111111111', rawText: 'note' }, lire))
      .rejects.toBeInstanceOf(SituationRefusee);
    expect(appels).toBe(0);
    expect(ecritures).toEqual([]);
  });
});
