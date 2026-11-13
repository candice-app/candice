// LE CAS DÉCISIF — « il a adoré » contre ce que Thibaud a déclaré lui-même.
//
// Ce que ces essais prouvent, et qu'aucune relecture ne prouve :
//   · l'activité est écartée quand Thibaud a déclaré un rejet qui la couvre ET l'a autorisé ;
//   · mon témoignage seul ne déclenche rien et ne touche pas son profil ;
//   · fiche silencieuse, compte absent, consentement absent, portée absente, lecture en
//     erreur : aucun usage de ses données, et chacun de ces cas reste DISTINCT des autres ;
//   · ce module ne rend JAMAIS une préférence positive — pas même une qu'il « pourrait ».
import { describe, expect, it } from 'vitest';
import { lireRejetsDuProche, PORTEE_EXCLUSIONS_RECO } from '../declarations-proche';
import { candidateRejectedBy } from '../rejection-match';

const PILOTE = 'pilote-1';
const CONTACT = 'contact-thibaud';
const THIBAUD = 'user-thibaud';

/** Client minimal qui HONORE réellement les filtres. Un faux qui rend toujours la même
 *  chose ne pourrait pas échouer, donc ne prouverait rien — la leçon de la pagination. */
function client(monde: {
  contact?: { proche_user_id: string | null; user_id: string } | null;
  consent?: { scope: string[]; status: string } | null;
  journal?: Record<string, unknown>[];
  erreurSur?: 'contacts' | 'contact_consents' | 'knowledge_evidences';
}) {
  return {
    from(table: string) {
      const err = monde.erreurSur === table ? { message: 'panne' } : null;
      const filtres: Record<string, unknown> = {};
      const api = {
        select: () => api,
        eq: (c: string, v: unknown) => { filtres[c] = v; return api; },
        is: async () => ({ data: err ? null : journal(), error: err }),
        maybeSingle: async () => {
          if (err) return { data: null, error: err };
          if (table === 'contacts') {
            const c = monde.contact ?? null;
            const ok = c && filtres.id === CONTACT && filtres.user_id === c.user_id;
            return { data: ok ? { proche_user_id: c!.proche_user_id } : null, error: null };
          }
          const k = monde.consent ?? null;
          const ok = k && filtres.pilote_id === PILOTE && filtres.contact_id === CONTACT
                       && filtres.status === k.status;
          return { data: ok ? { scope: k!.scope } : null, error: null };
        },
      };
      function journal() {
        // Le filtre d'identité est honoré : lire le journal de quelqu'un d'autre rend vide.
        if (filtres.user_id !== THIBAUD || filtres.about_kind !== 'account') return [];
        return monde.journal ?? [];
      }
      return api as never;
    },
  };
}

const contactRelie = { proche_user_id: THIBAUD, user_id: PILOTE };
const consentOk = { scope: ['analysis', PORTEE_EXCLUSIONS_RECO], status: 'active' };

const rejetPain = {
  target_family: 'ENTITY', entity_label: 'faire du pain', relation: 'DISLIKE',
  target_construct: 'faire-du-pain', severity: null, superseded_at: null,
};
const gouteCuisine = {
  target_family: 'INTEREST', entity_label: null, relation: null,
  target_construct: 'cuisine', relationship: 'passion', severity: null, superseded_at: null,
};

describe('le cas décisif : sa déclaration l’emporte sur mon impression', () => {
  it('rejet déclaré + consentement → l’activité est écartée', async () => {
    const r = await lireRejetsDuProche(client({ contact: contactRelie, consent: consentOk, journal: [rejetPain] }), {
      piloteId: PILOTE, contactId: CONTACT,
    });
    expect(r.autorise).toBe(true);
    expect(r.motif).toBe('autorise');
    expect(r.rejets).toMatchObject([{ label: 'faire du pain', family: 'ENTITY', relation: 'DISLIKE' }]);

    // Et le prédicat du moteur écarte bien l'idée proposée.
    expect(candidateRejectedBy('Un atelier pour faire du pain au levain', r.rejets)).not.toBeNull();
    // Sans écarter une idée étrangère au rejet.
    expect(candidateRejectedBy('Un concert de jazz', r.rejets)).toBeNull();
  });

  it('fiche SILENCIEUSE : autorisé, mais aucun rejet — et ce n’est pas la même chose qu’un refus', async () => {
    const r = await lireRejetsDuProche(client({ contact: contactRelie, consent: consentOk, journal: [] }), {
      piloteId: PILOTE, contactId: CONTACT,
    });
    expect(r.autorise).toBe(true);
    expect(r.rejets).toEqual([]);
    // Le motif, pas la longueur de la liste, distingue les deux états.
    expect(r.motif).toBe('autorise');
  });
});

describe('sans autorisation, mon témoignage seul ne déclenche rien', () => {
  it.each([
    ['aucun compte relié',      { contact: { proche_user_id: null, user_id: PILOTE }, consent: consentOk }, 'aucun_compte'],
    ['aucun consentement',      { contact: contactRelie, consent: null },              'aucun_consentement'],
    ['consentement révoqué',    { contact: contactRelie, consent: { scope: [PORTEE_EXCLUSIONS_RECO], status: 'revoked' } }, 'aucun_consentement'],
    ['portée absente',          { contact: contactRelie, consent: { scope: ['analysis'], status: 'active' } }, 'portee_absente'],
    ['contact inexistant',      { contact: null, consent: consentOk },                 'aucun_compte'],
  ])('%s → refus, motif « %s »', async (_, monde, motif) => {
    const r = await lireRejetsDuProche(client({ ...monde, journal: [rejetPain] } as never), {
      piloteId: PILOTE, contactId: CONTACT,
    });
    expect(r.autorise).toBe(false);
    expect(r.motif).toBe(motif);
    expect(r.rejets).toEqual([]);
  });

  it('une fiche appartenant à un AUTRE pilote n’est pas lisible', async () => {
    const r = await lireRejetsDuProche(
      client({ contact: { proche_user_id: THIBAUD, user_id: 'un-autre-pilote' }, consent: consentOk, journal: [rejetPain] }),
      { piloteId: PILOTE, contactId: CONTACT },
    );
    expect(r.autorise).toBe(false);
    expect(r.rejets).toEqual([]);
  });
});

describe('échoue FERMÉ : une panne n’est pas un consentement', () => {
  it.each(['contacts', 'contact_consents', 'knowledge_evidences'] as const)(
    'lecture en erreur sur %s → lecture_impossible, aucun rejet',
    async (table) => {
      const r = await lireRejetsDuProche(
        client({ contact: contactRelie, consent: consentOk, journal: [rejetPain], erreurSur: table }),
        { piloteId: PILOTE, contactId: CONTACT },
      );
      expect(r.autorise).toBe(false);
      expect(r.motif).toBe('lecture_impossible');
      expect(r.rejets).toEqual([]);
    },
  );
});

describe('aucune préférence positive ne sort d’ici, jamais', () => {
  it('un INTEREST « passion » présent dans son journal n’est pas rendu', async () => {
    const r = await lireRejetsDuProche(
      client({ contact: contactRelie, consent: consentOk, journal: [gouteCuisine, rejetPain] }),
      { piloteId: PILOTE, contactId: CONTACT },
    );
    expect(r.rejets).toHaveLength(1);
    expect(r.rejets[0].family).toBe('ENTITY');
    // Son goût pour la cuisine ne doit apparaître NULLE PART dans ce qui sort du module :
    // il me dirait, indirectement, ce qu'il a déclaré.
    expect(JSON.stringify(r)).not.toContain('cuisine');
    expect(JSON.stringify(r)).not.toContain('passion');
  });

  it('une relation NEUTRAL ou positive n’est pas un rejet', async () => {
    const r = await lireRejetsDuProche(
      client({
        contact: contactRelie, consent: consentOk,
        journal: [
          { ...rejetPain, relation: 'NEUTRAL', entity_label: 'le pain' },
          { ...rejetPain, relation: 'LOVE', entity_label: 'les pâtes' },
        ],
      }),
      { piloteId: PILOTE, contactId: CONTACT },
    );
    expect(r.rejets).toEqual([]);
  });
});
