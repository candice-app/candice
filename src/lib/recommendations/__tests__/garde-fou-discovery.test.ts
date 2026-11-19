import { describe, it, expect } from 'vitest';
import { fausseBase } from '../../knowledge/__tests__/fausse-base';
import { lireRejetsDuProche, PORTEE_EXCLUSIONS_RECO } from '../declarations-proche';
import { candidateRejectedBy } from '../rejection-match';
import { appliquerGardeFous, comparer, gardeFouDe, verifierQualification, taxonomieDesDomaines, LIGNES_RESISTANTES, type QualificateurIdees, type QualificationIdee, type Taxonomie } from '../garde-fous-discovery';
import { consigneDeQualification } from '../qualifier-idees';
import comparables from '../../discovery/open-v3/garde-fous-comparables.json';
import matrice from '../../discovery/open-v3/garde-fous.json';
import { BANQUE } from '../../discovery/open-v3/banque';
import { produireDepuisOption } from '../../discovery/open-v3/produire';

const PILOTE = 'pilote-1', PROCHE = 'proche-1', CONTACT = 'contact-1';
const base = (evidences: Record<string, unknown>[], sources: Record<string, unknown>[]) => fausseBase({
  contacts: [{ id: CONTACT, user_id: PILOTE, proche_user_id: PROCHE }],
  contact_consents: [{ id: 'c1', pilote_id: PILOTE, contact_id: CONTACT, proche_user_id: PROCHE, kind: 'profile_usage', status: 'active', scope: [PORTEE_EXCLUSIONS_RECO], granted_by: PROCHE }],
  knowledge_evidences: evidences.map((e, i) => ({ id: `e${i}`, user_id: PROCHE, about_kind: 'account', superseded_at: null, assertion_status: 'explicit', ...e })),
  knowledge_sources: sources,
});
const CHS = BANQUE.find((q) => q.id === 'CHS-01')!;
const REFUS_CHAUSSURES = CHS.options.find((o) => o.libelle.startsWith('Je préfère qu’on ne m’offre pas de chaussures'))!;
const chaussures = gardeFouDe('CHS-01', REFUS_CHAUSSURES.libelle)!;
const idee = (title: string, canal: string, categorie?: string) => ({ title, justification: '', canal, ...(categorie ? { categorie } : {}) });

describe('la matrice des garde-fous du Discovery', () => {
  const m = (matrice as unknown as { matrice: { question: string; libelle: string; statut: string; motif?: string; canaux: string[]; contrainte: string; critere: string; cible: string }[] }).matrice;
  it('couvre chaque option qui écrit un garde-fou, une ligne par réponse', () => {
    let n = 0;
    for (const q of BANQUE) for (const o of q.options) {
      const p = produireDepuisOption(q, o);
      if (p.type !== 'evidence' || p.evidence.target_family !== 'GUARDRAIL') continue;
      n++;
      expect(m.some((l) => l.question === q.id && l.libelle === o.libelle), `${q.id} « ${o.libelle} »`).toBe(true);
    }
    expect(m).toHaveLength(n);
    expect(new Set(m.map((l) => `${l.question}|${l.libelle}`)).size).toBe(n);
  });
  it('chaque ligne traduite a une cible, des canaux, un critère ; chaque ligne indécidable dit pourquoi', () => {
    for (const l of m) {
      if (l.statut === 'traduit') { expect(l.cible && l.critere && l.canaux.length > 0).toBeTruthy(); expect(['SOFT', 'HARD']).toContain(l.contrainte); }
      else expect(l.motif, `${l.question} « ${l.libelle} »`).toBeTruthy();
    }
    expect(m.filter((l) => l.statut === 'indecidable').length).toBeLessThan(20);
  });
  it('le critère est la réponse replacée dans sa question, jamais le chemin technique', () => {
    expect(chaussures.critere).toContain(REFUS_CHAUSSURES.libelle);
    expect(chaussures.critere).toContain(CHS.enonce);
    expect(JSON.stringify(chaussures)).not.toContain('gift_openness');
  });
});


// ─── D1 : comparaison structurée, côté serveur ──────────────────────────────────────────────
const garde = (q: string, l: string) => { const g = gardeFouDe(q, l); if (!g) throw new Error(`${q} « ${l} » absent`); return g; };
const cuir = garde('fragrance2.1152', 'Cuir');                    // HARD, valeur d'une dimension
const voiture = garde('travel.0060B', 'La voiture');               // SOFT, valeur
const humourNoir = garde('HUM-06', 'Humour noir');                 // SOFT, valeur
const expose = (comparables as unknown as { lignes: { question: string; libelle: string; mode: string; dimension?: string; contrainte: string }[] }).lignes
  .find((l) => l.mode === 'maniere' && l.dimension === 'expose_au_regard' && l.contrainte === 'HARD')!;
const exposeHard = garde(expose.question, expose.libelle);
/** Une description d'idée telle que le qualificateur la rendrait, déjà vérifiée. */
const q = (p: { domaines?: string[]; indetermine?: boolean; univ?: Record<string, 'oui' | 'non'>; dims?: Record<string, string[] | 'na' | '?'> }): QualificationIdee => ({
  domaines: { valeurs: p.domaines ?? [], etat: p.indetermine ? 'indetermine' : 'etabli' },
  universelles: Object.fromEntries(Object.entries(p.univ ?? {}).map(([k, v]) => [k, { valeur: v, etat: 'etabli' as const }])),
  dimensions: Object.fromEntries(Object.entries(p.dims ?? {}).map(([k, v]) => [k, v === 'na' ? { valeurs: [], etat: 'non_applicable' as const } : v === '?' ? { valeurs: [], etat: 'indetermine' as const } : { valeurs: v, etat: 'etabli' as const }])),
});

describe('D1 — « ne m’offrez pas de chaussures » concerne les chaussures offertes, rien d’autre', () => {
  it('une paire de baskets offerte : atteinte (SOFT) → rétrogradée, pas interdite', () => {
    expect(comparer(idee('Une paire de baskets', 'cadeau'), q({ domaines: ['shoe'] }), [chaussures]).verdict).toBe('retrogradee');
  });
  it('un livre de cuisine : hors périmètre → compatible vérifiée', () => {
    expect(comparer(idee('Un livre de cuisine', 'cadeau'), q({ domaines: ['food'] }), [chaussures]).verdict).toBe('compatible_verifiee');
  });
  it('une après-midi shopping (expérience) : le refus ne vise que les cadeaux → hors périmètre', () => {
    expect(comparer(idee('Une après-midi shopping', 'experience'), q({ domaines: ['shoe', 'fashion'] }), [chaussures]).verdict).toBe('compatible_verifiee');
  });
  it('domaine non établi : on ne conclut pas « hors sujet » — le doute est dit (SOFT : gardée, non vérifiée)', () => {
    expect(comparer(idee('Une surprise', 'cadeau'), q({ indetermine: true }), [chaussures]).verdict).toBe('compatible_avec_doute_soft');
  });
});

describe('D1 — une restriction HARD non vérifiée ne laisse pas présenter l’idée comme compatible', () => {
  it('un parfum au cuir : atteint → écarté', () => {
    expect(comparer(idee('Un parfum boisé', 'cadeau'), q({ domaines: ['fragrance'], dims: { 'fragrance2.1152': ['Cuir'] } }), [cuir]).verdict).toBe('ecartee_hard');
  });
  it('un parfum floral, famille établie : compatible vérifiée', () => {
    expect(comparer(idee('Un parfum floral', 'cadeau'), q({ domaines: ['fragrance'], dims: { 'fragrance2.1152': ['Floral'] } }), [cuir]).verdict).toBe('compatible_verifiee');
  });
  it('un parfum dont la famille n’est pas établie : écarté comme NON VÉRIFIÉ — pas présenté comme compatible', () => {
    expect(comparer(idee('Un parfum de niche', 'cadeau'), q({ domaines: ['fragrance'], dims: { 'fragrance2.1152': '?' } }), [cuir]).verdict).toBe('ecartee_non_verifiee');
  });
  it('une dimension sans objet pour l’idée (« non_applicable ») ne la bloque pas', () => {
    expect(comparer(idee('Une bougie', 'cadeau'), q({ domaines: ['fragrance'], dims: { 'fragrance2.1152': 'na' } }), [cuir]).verdict).toBe('compatible_verifiee');
  });
  it('une manière commune HARD (« ne pas m’exposer ») : établie à « oui » → écartée ; « non » → compatible ; inconnue → non vérifiée', () => {
    const disc = idee('Un discours en public', 'experience');
    expect(comparer(disc, q({ domaines: [], univ: { expose_au_regard: 'oui' } }), [exposeHard]).verdict).toBe('ecartee_hard');
    expect(comparer(disc, q({ domaines: [], univ: { expose_au_regard: 'non' } }), [exposeHard]).verdict).toBe('compatible_verifiee');
    expect(comparer(disc, q({ domaines: [] }), [exposeHard]).verdict).toBe('ecartee_non_verifiee');
  });
});

describe('D1 — une préférence SOFT n’est pas une interdiction', () => {
  it('« éviter la voiture » : un road-trip est rétrogradé, pas retiré', () => {
    expect(comparer(idee('Un road-trip', 'experience'), q({ domaines: ['travel'], dims: { 'travel.0060B': ['La voiture'] } }), [voiture]).verdict).toBe('retrogradee');
  });
  it('« humour noir » : un spectacle d’humour noir est rétrogradé ; un autre humour, compatible', () => {
    expect(comparer(idee('Un spectacle', 'experience'), q({ domaines: ['humor'], dims: { 'HUM-06': ['Humour noir'] } }), [humourNoir]).verdict).toBe('retrogradee');
    expect(comparer(idee('Un spectacle', 'experience'), q({ domaines: ['humor'], dims: { 'HUM-06': ['Absurde'] } }), [humourNoir]).verdict).toBe('compatible_verifiee');
  });
});

describe('D1 — la qualification est vérifiée, et ne voit jamais les refus du proche', () => {
  it('une valeur hors taxonomie est ignorée ; « établi » sans valeur valable devient indéterminé', () => {
    const dims = taxonomieDesDomaines(['fragrance']).dimensions;
    const v = verifierQualification({ domaines: { valeurs: ['fragrance', 'inventé'], etat: 'etabli' } }, { 'fragrance2.1152': { valeurs: ['Cuir de Russie inventé'], etat: 'etabli' } }, dims);
    expect(v.domaines.valeurs).toEqual(['fragrance']);
    expect(v.dimensions['fragrance2.1152'].etat).toBe('indetermine');
  });
  it('la taxonomie d’un domaine contient TOUTES ses dimensions, pas seulement celles qu’un proche a refusées', () => {
    const t = taxonomieDesDomaines(['fragrance']);
    expect(t.dimensions.find((d) => d.id === 'fragrance2.1152')!.valeurs.length).toBeGreaterThan(4);
  });
  it('le texte envoyé au modèle est IDENTIQUE quels que soient les garde-fous du proche, et n’en contient aucun', async () => {
    const vus: string[] = [];
    const espion: QualificateurIdees = async (i, t: Taxonomie) => { vus.push(consigneDeQualification(i, t)); return i.map(() => ({ domaines: { valeurs: ['fragrance'], etat: 'etabli' }, universelles: {} })); };
    const idees = [idee('Un parfum', 'cadeau', 'fragrance')];
    await appliquerGardeFous(idees, [cuir], espion);
    const avecCuir = [...vus]; vus.length = 0;
    await appliquerGardeFous(idees, [voiture, humourNoir], espion);
    expect(vus).toEqual(avecCuir);
    // L'intitulé d'une dimension est l'énoncé PUBLIC de la question (le même pour tous) ; ce qui ne doit
    // jamais y être, c'est ce qu'un proche a répondu : aucun critère, aucune phrase « a répondu ».
    for (const t of avecCuir) { expect(t).not.toContain('a répondu'); for (const g of [cuir, voiture, humourNoir]) expect(t).not.toContain(g.critere); }
  });
  it('qualification en panne : rien n’est vérifié — les idées dans le périmètre d’un HARD sont écartées, le reste gardé, et c’est dit', async () => {
    const panne: QualificateurIdees = async () => { throw new Error('panne'); };
    const r = await appliquerGardeFous([idee('Un parfum', 'cadeau', 'fragrance'), idee('Un message', 'message', 'relation')], [cuir], panne);
    expect(r.bilan.qualificationEchouee).toBe(true);
    expect(r.gardees.map((x) => x.title)).toEqual(['Un message']);
  });
  it('les rétrogradées passent après les compatibles', async () => {
    const qual: QualificateurIdees = async (i, t) => t.domaines.length > 0
      ? i.map((x) => ({ domaines: { valeurs: [x.title.includes('baskets') ? 'shoe' : 'reading'], etat: 'etabli' }, universelles: {} }))
      : i.map(() => ({}));
    const r = await appliquerGardeFous([idee('Des baskets', 'cadeau'), idee('Un roman', 'cadeau')], [chaussures], qual);
    expect(r.gardees.map((x) => [x.title, x.compatibilite])).toEqual([['Un roman', 'compatible_verifiee'], ['Des baskets', 'retrogradee']]);
  });
});

describe('D1 — ce qui résiste est listé, avec motif et exemple', () => {
  it('chaque ligne résistante a un motif et un exemple ; elles restent peu nombreuses', () => {
    for (const l of LIGNES_RESISTANTES) { expect(l.motif!.length).toBeGreaterThan(20); expect(l.exemple).toBeTruthy(); }
    expect(LIGNES_RESISTANTES.length).toBeLessThan(80);
  });
});
