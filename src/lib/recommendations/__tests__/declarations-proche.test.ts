// LE CAS DÉCISIF — « il a adoré » contre ce que Thibaud a déclaré lui-même.
//
// Ce que ces essais prouvent, et qu'aucune relecture ne prouve :
//   · l'activité est écartée quand Thibaud a DÉCLARÉ un rejet qui la couvre ET l'a autorisé ;
//   · un rejet INFÉRÉ, OBSERVÉ ou RAPPORTÉ PAR UN TIERS n'écarte rien — même sur son compte,
//     même avec son consentement : il n'a pas dit cela, une machine ou quelqu'un d'autre l'a
//     conclu pour lui ;
//   · fiche silencieuse, compte absent, consentement absent ou retiré, portée absente,
//     lecture en erreur : aucun usage de ses données, et chacun reste DISTINCT des autres ;
//   · ce module ne rend JAMAIS une préférence positive.
import { describe, expect, it } from 'vitest';
import { lireRejetsDuProche, PORTEE_EXCLUSIONS_RECO } from '../declarations-proche';
import { candidateRejectedBy } from '../rejection-match';

const PILOTE = 'pilote-1';
const CONTACT = 'contact-thibaud';
const THIBAUD = 'user-thibaud';
const IDEE = 'Un atelier pour faire du pain au levain à deux';

interface Monde {
  contact?: { proche_user_id: string | null; user_id: string } | null;
  consent?: { scope: string[]; status: string } | null;
  journal?: Record<string, unknown>[];
  sources?: Record<string, unknown>[];
  erreurSur?: 'contacts' | 'contact_consents' | 'knowledge_evidences' | 'knowledge_sources';
}

/** Client qui HONORE réellement les filtres. Un faux qui rend toujours la même chose ne
 *  pourrait pas échouer, donc ne prouverait rien. */
function client(monde: Monde) {
  return {
    from(table: string) {
      const err = monde.erreurSur === table ? { message: 'panne' } : null;
      const f: Record<string, unknown> = {};
      let dansIds: readonly string[] = [];
      const lignes = () => {
        if (table === 'knowledge_evidences') {
          if (f.user_id !== THIBAUD || f.about_kind !== 'account') return [];
          return monde.journal ?? [];
        }
        return (monde.sources ?? []).filter((s) => dansIds.includes(String(s.id)));
      };
      const api = {
        select: () => api,
        eq: (c: string, v: unknown) => { f[c] = v; return api; },
        in: (_c: string, v: readonly string[]) => { dansIds = v; return api; },
        is: () => api,
        then: (res: (r: { data: unknown; error: unknown }) => unknown) =>
          Promise.resolve(res({ data: err ? null : lignes(), error: err })),
        maybeSingle: async () => {
          if (err) return { data: null, error: err };
          if (table === 'contacts') {
            const c = monde.contact ?? null;
            const ok = c && f.id === CONTACT && f.user_id === c.user_id;
            return { data: ok ? { proche_user_id: c!.proche_user_id } : null, error: null };
          }
          const k = monde.consent ?? null;
          const ok = k && f.pilote_id === PILOTE && f.contact_id === CONTACT && f.status === k.status;
          return { data: ok ? { scope: k!.scope, granted_by: 'granted_by' in k! ? (k as { granted_by?: string | null }).granted_by : THIBAUD } : null, error: null };
        },
      };
      return api as never;
    },
  };
}

const contactRelie = { proche_user_id: THIBAUD, user_id: PILOTE };
const consentOk = { scope: ['analysis', PORTEE_EXCLUSIONS_RECO], status: 'active' };

/** Un rejet d'entité sur son compte. `assertionStatus` et le type de SA source varient. */
const rejet = (sourceId: string, assertionStatus: string) => ({
  source_id: sourceId, target_family: 'ENTITY', entity_label: 'faire du pain',
  relation: 'DISLIKE', target_construct: 'faire-du-pain', severity: null,
  assertion_status: assertionStatus,
});

const SOURCES = [
  { id: 's-declaree', source_type: 'user_declaration' },
  { id: 's-inferee', source_type: 'extraction_inferred' },
  { id: 's-tiers', source_type: 'reported_by_relative' },
  { id: 's-observee', source_type: 'observed_behavior' },
];

const lire = (monde: Monde) => lireRejetsDuProche(client(monde) as never, { piloteId: PILOTE, contactId: CONTACT });

describe('les quatre provenances — une seule écarte l’idée', () => {
  it('DÉCLARÉ par lui, explicite, autorisé → l’idée est écartée', async () => {
    const r = await lire({ contact: contactRelie, consent: consentOk, sources: SOURCES, journal: [rejet('s-declaree', 'explicit')] });
    expect(r.autorise).toBe(true);
    expect(r.rejets).toMatchObject([{ label: 'faire du pain', family: 'ENTITY', relation: 'DISLIKE' }]);
    expect(candidateRejectedBy(IDEE, r.rejets)).not.toBeNull();
  });

  it.each([
    ['INFÉRÉ par un modèle', rejet('s-inferee', 'inferred'), 'infere'],
    ['RAPPORTÉ par un tiers', rejet('s-tiers', 'explicit'), 'rapporte_par_un_tiers'],
    ['OBSERVÉ, jamais dit', rejet('s-observee', 'explicit'), 'observe'],
  ])('%s → n’écarte RIEN, même avec son consentement', async (_, ligne, motif) => {
    const r = await lire({ contact: contactRelie, consent: consentOk, sources: SOURCES, journal: [ligne] });
    expect(r.autorise).toBe(true);      // la lecture est légitime…
    expect(r.rejets).toEqual([]);       // …mais la ligne n'est pas sa parole
    expect(r.ecartesSansDeclaration[motif]).toBe(1);
    expect(candidateRejectedBy(IDEE, r.rejets)).toBeNull();
  });

  it('une source INTROUVABLE rend la provenance invérifiable → écartée, jamais supposée', async () => {
    const r = await lire({ contact: contactRelie, consent: consentOk, sources: [], journal: [rejet('s-declaree', 'explicit')] });
    expect(r.rejets).toEqual([]);
    expect(r.ecartesSansDeclaration.source_introuvable).toBe(1);
  });

  it('un source_type inconnu n’est pas déclaratif par défaut', async () => {
    const r = await lire({
      contact: contactRelie, consent: consentOk,
      sources: [{ id: 's-x', source_type: 'un_type_jamais_vu' }], journal: [rejet('s-x', 'explicit')],
    });
    expect(r.rejets).toEqual([]);
    expect(r.ecartesSansDeclaration.source_type_inconnu).toBe(1);
  });

  it('le déclaré passe, le reste est écarté — dans le même lot', async () => {
    const r = await lire({
      contact: contactRelie, consent: consentOk, sources: SOURCES,
      journal: [rejet('s-inferee', 'inferred'), rejet('s-declaree', 'explicit'), rejet('s-tiers', 'explicit')],
    });
    expect(r.rejets).toHaveLength(1);
    expect(r.ecartesSansDeclaration).toEqual({ infere: 1, rapporte_par_un_tiers: 1 });
  });
});

describe('sans autorisation, mon témoignage seul ne déclenche rien', () => {
  it.each([
    ['aucun compte relié',   { contact: { proche_user_id: null, user_id: PILOTE }, consent: consentOk }, 'aucun_compte'],
    ['aucun consentement',   { contact: contactRelie, consent: null },              'aucun_consentement'],
    ['consentement RETIRÉ',  { contact: contactRelie, consent: { scope: [PORTEE_EXCLUSIONS_RECO], status: 'revoked' } }, 'aucun_consentement'],
    ['portée absente',       { contact: contactRelie, consent: { scope: ['analysis'], status: 'active' } }, 'portee_absente'],
    // Un consentement actif que le proche n'a pas accordé lui-même (preuve absente, ou d'un autre).
    ['accord sans preuve',   { contact: contactRelie, consent: { scope: ['analysis', PORTEE_EXCLUSIONS_RECO], status: 'active', granted_by: null } as never }, 'aucun_consentement'],
    ['accord d’un autre',    { contact: contactRelie, consent: { scope: ['analysis', PORTEE_EXCLUSIONS_RECO], status: 'active', granted_by: PILOTE } as never }, 'aucun_consentement'],
    ['contact inexistant',   { contact: null, consent: consentOk },                 'aucun_compte'],
  ])('%s → refus, motif « %s »', async (_, monde, motif) => {
    const r = await lire({ ...(monde as Monde), sources: SOURCES, journal: [rejet('s-declaree', 'explicit')] });
    expect(r.autorise).toBe(false);
    expect(r.motif).toBe(motif);
    expect(r.rejets).toEqual([]);
    expect(candidateRejectedBy(IDEE, r.rejets)).toBeNull();
  });

  it('une fiche appartenant à un AUTRE pilote n’est pas lisible', async () => {
    const r = await lire({
      contact: { proche_user_id: THIBAUD, user_id: 'un-autre-pilote' }, consent: consentOk,
      sources: SOURCES, journal: [rejet('s-declaree', 'explicit')],
    });
    expect(r.autorise).toBe(false);
    expect(r.rejets).toEqual([]);
  });
});

describe('échoue FERMÉ : une panne n’est pas un consentement', () => {
  it.each(['contacts', 'contact_consents', 'knowledge_evidences', 'knowledge_sources'] as const)(
    'lecture en erreur sur %s → lecture_impossible, aucun rejet',
    async (table) => {
      const r = await lire({
        contact: contactRelie, consent: consentOk, sources: SOURCES,
        journal: [rejet('s-declaree', 'explicit')], erreurSur: table,
      });
      expect(r.autorise).toBe(false);
      expect(r.motif).toBe('lecture_impossible');
      expect(r.rejets).toEqual([]);
    },
  );
});

describe('fiche silencieuse ≠ refus', () => {
  it('autorisé, aucun rejet, et le motif les distingue', async () => {
    const r = await lire({ contact: contactRelie, consent: consentOk, sources: SOURCES, journal: [] });
    expect(r.autorise).toBe(true);
    expect(r.motif).toBe('autorise');
    expect(r.rejets).toEqual([]);
  });
});

describe('aucune préférence positive ne sort d’ici, jamais', () => {
  it('un INTEREST « passion » déclaré n’est pas rendu', async () => {
    const r = await lire({
      contact: contactRelie, consent: consentOk, sources: SOURCES,
      journal: [
        { source_id: 's-declaree', target_family: 'INTEREST', target_construct: 'cuisine', relationship: 'passion', relation: null, entity_label: null, severity: null, assertion_status: 'explicit' },
        rejet('s-declaree', 'explicit'),
      ],
    });
    expect(r.rejets).toHaveLength(1);
    expect(r.rejets[0].family).toBe('ENTITY');
    // Son goût ne doit apparaître NULLE PART dans ce qui sort du module : il me dirait,
    // indirectement, ce qu'il a déclaré. On cherche dans la sortie ENTIÈRE.
    expect(JSON.stringify(r)).not.toContain('cuisine');
    expect(JSON.stringify(r)).not.toContain('passion');
  });

  it('une relation NEUTRAL ou positive n’est pas un rejet', async () => {
    const r = await lire({
      contact: contactRelie, consent: consentOk, sources: SOURCES,
      journal: [
        { ...rejet('s-declaree', 'explicit'), relation: 'NEUTRAL', entity_label: 'le pain' },
        { ...rejet('s-declaree', 'explicit'), relation: 'LOVE', entity_label: 'les pâtes' },
      ],
    });
    expect(r.rejets).toEqual([]);
  });

  it('le diagnostic des écartés ne porte AUCUN libellé — il ne peut rien révéler', async () => {
    const r = await lire({
      contact: contactRelie, consent: consentOk, sources: SOURCES,
      journal: [{ ...rejet('s-inferee', 'inferred'), entity_label: 'les dîners bruyants' }],
    });
    expect(JSON.stringify(r.ecartesSansDeclaration)).not.toContain('dîners');
    expect(Object.keys(r.ecartesSansDeclaration)).toEqual(['infere']);
  });
});
