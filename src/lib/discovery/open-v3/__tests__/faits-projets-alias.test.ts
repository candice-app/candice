import { describe, it, expect } from 'vitest';
import { fausseBase } from '../../../knowledge/__tests__/fausse-base';
import { BANQUE, question } from '../banque';
import { produireDepuisOption, PREFIXE_FAIT } from '../produire';
import { cleOption } from '../cle-option';
import { enregistrerReponseFermee, enregistrerReponseOuverte, estAliasMasque, optionCanonique, FAIT_REPONSE_DE_PROJET, connaissancesDuProjet } from '../service';
import { motifDExclusion, requiertProjet, aParametre } from '../selection';
import { ALIAS_BRANCHES, SOUS_PARTIES } from '../correspondances';
import type { EtatDiscovery } from '../conditions';
import type { Projet } from '../etat';

const U = '00000000-0000-4000-8000-0000000000c3';
const libelle = (id: string, l: string) => cleOption(question(id)!.options.find((o) => o.libelle === l)!);

describe('les options de fait écrivent un FAIT, tel que le contrat le dit', () => {
  it('« Vélo » à « Quels sports pratiques-tu réellement aujourd’hui ? » : un fait de pratique, pas un goût', async () => {
    const q = question('sportp.0504')!;
    const o = q.options.find((x) => x.libelle === 'Vélo')!;
    expect(produireDepuisOption(q, o)).toMatchObject({ type: 'fait', fait: { factType: `${PREFIXE_FAIT}sport_practice.pratique`, valeur: 'velo' } });
    const b = fausseBase();
    const r = await enregistrerReponseFermee(b.client, { userId: U, questionId: q.id, clesOptions: [cleOption(o)], acteId: 'lot-1' });
    expect(r).toMatchObject({ faitsEcrits: 1, preuvesEcrites: 0 });
    expect(b.tables.knowledge_evidences ?? []).toHaveLength(0);
    const f = b.tables.knowledge_facts[0];
    expect(f.fact_type).toBe('discovery.fait.sport_practice.pratique');
    expect(JSON.parse(String(f.value))).toMatchObject({ valeur: 'velo', polarite: 'factuelle', question: 'sportp.0504', libelle: 'Vélo' });
  });
  it('un fait porte la polarité et la stabilité de son contrat : « sous condition » ne se relit pas comme acquis', () => {
    const q = question('fashion2.1069')!; const o = q.options.find((x) => x.voie === 'FACT' && x.polarite === 'condition')!;
    const p = produireDepuisOption(q, o);
    expect(p.type).toBe('fait');
    if (p.type === 'fait') expect(p.fait).toMatchObject({ polarite: 'condition' });
  });
  it('sur toute la banque : chaque option de fait est écrite, ou son contrat incomplet est nommé', () => {
    let ecrites = 0; const incompletes: string[] = [];
    for (const q of BANQUE) for (const o of q.options) {
      if (o.voie !== 'FACT') continue;
      const p = produireDepuisOption(q, o);
      if (p.type === 'fait') { ecrites++; expect(p.fait.valeur).not.toMatch(/\{.*\}/); } else incompletes.push(`${q.id}:${cleOption(o)}`);
    }
    expect(ecrites + incompletes.length).toBe(600);
    expect(ecrites).toBeGreaterThan(560);
    // Ce qui reste incomplet est listé dans l'état, pas avalé.
    expect(incompletes.length).toBeLessThan(40);
  });
  it('une question qui n’écrit que des faits n’est plus « stérile »', () => {
    const vide: EtatDiscovery = { tags: new Map(), nePasCreuser: new Set(), branchesOuvertes: new Set(['sportp']), niveauParBranche: new Map([['sportp', 'C']]), dejaPosees: new Set(),
      attributsConnus: new Set(), sansAlcool: false, contextesConnus: new Set(), contextesActifs: new Set(), aliasBranches: ALIAS_BRANCHES, reglesSousParties: SOUS_PARTIES };
    expect(motifDExclusion(question('sportp.0504')!, vide)).not.toBe('sterile');
  });
});

describe('une réponse de niveau C appartient à son projet, pas à la personne en général', () => {
  const projet: Projet = { id: '11111111-1111-4111-8111-111111111111', type: 'achat', branche: 'craft', objet: 'Un vase pour le salon', debut: '2026-11-19T08:00:00.000Z' };
  const qC = BANQUE.find((q) => q.branche === 'craft' && requiertProjet(q) && q.forme === 'single' && q.options.some((o) => produireDepuisOption(q, o).type === 'evidence'))!;
  it('la règle : niveau C, ou « achat concret » / « séjour concret »', () => {
    expect(requiertProjet(question('craft.0664')!)).toBe('achat');
    expect(requiertProjet(question('craft.0615')!)).toBeNull();
    expect(qC).toBeDefined();
  });
  it('rattachée au projet : la preuve garde son contrat, mais dans la PORTÉE du projet — elle n’entre dans aucune lecture générale', async () => {
    const o = qC.options.find((x) => produireDepuisOption(qC, x).type === 'evidence')!;
    const attendu = produireDepuisOption(qC, o); if (attendu.type !== 'evidence') throw new Error('contrat attendu');
    const b = fausseBase();
    const r = await enregistrerReponseFermee(b.client, { userId: U, questionId: qC.id, clesOptions: [cleOption(o)], acteId: 'lot-1', projet });
    expect(r.preuvesEcrites).toBeGreaterThan(0);
    const e = b.tables.knowledge_evidences[0];
    // Le sens structuré est celui du contrat ; seule la portée change.
    expect(e).toMatchObject({ target_family: attendu.evidence.target_family, target_construct: attendu.evidence.target_construct, context: `projet:${projet.id}`, assertion_status: 'explicit' });
    expect((b.tables.knowledge_facts ?? []).filter((f) => f.fact_type === FAIT_REPONSE_DE_PROJET)).toEqual([]);
    expect(b.tables.knowledge_sources[0].branch_id).toBe(`projet:${projet.id}`);
    // Lecture générale : rien. Lecture du projet : la preuve, structurée.
    const { readJournalEvidences } = await import('../../../knowledge/read-journal');
    expect(await readJournalEvidences(b.client, { userId: U, aboutId: U })).toEqual([]);
    const duProjet = await connaissancesDuProjet(b.client, { userId: U, projetId: projet.id });
    expect(duProjet.preuves).toHaveLength(r.preuvesEcrites);
    expect(await connaissancesDuProjet(b.client, { userId: U, projetId: '22222222-2222-4222-8222-222222222222' })).toMatchObject({ preuves: [], faits: [] });
  });
  it('un paramètre d’action, qui n’écrit rien hors projet, est un fait DU projet', async () => {
    const qP = BANQUE.find((q) => q.forme === 'single' && requiertProjet(q) && q.options.some((o) => { const p = produireDepuisOption(q, o); return p.type === 'rien' && p.motif === 'action_interface'; }))!;
    const o = qP.options.find((x) => { const p = produireDepuisOption(qP, x); return p.type === 'rien' && p.motif === 'action_interface'; })!;
    const pr: Projet = { ...projet, branche: qP.branche };
    const b = fausseBase();
    await enregistrerReponseFermee(b.client, { userId: U, questionId: qP.id, clesOptions: [cleOption(o)], acteId: 'lot-1', projet: pr });
    const f = b.tables.knowledge_facts.filter((x) => x.fact_type === 'discovery.parametre_de_projet');
    expect(f).toHaveLength(1);
    expect(f[0].context).toBe(`projet:${pr.id}`);
    expect(JSON.parse(String(f[0].value))).toMatchObject({ projet: pr.id, question: qP.id, libelle: o.libelle });
    expect((await connaissancesDuProjet(b.client, { userId: U, projetId: pr.id })).faits).toHaveLength(1);
    // Hors projet, la même option n'écrit rien.
    const sans = fausseBase();
    await enregistrerReponseFermee(sans.client, { userId: U, questionId: qP.id, clesOptions: [cleOption(o)], acteId: 'lot-1' });
    expect(sans.tables.knowledge_facts ?? []).toEqual([]);
  });
  it('réponse ouverte de projet : la phrase est gardée, rattachée, et aucun modèle n’est appelé', async () => {
    const ouverte = BANQUE.find((q) => q.forme === 'open' && requiertProjet(q) && q.id !== 'food2.0882A' && (q.inferences_interdites || q.options.some((o) => o.inferences_interdites)))!;
    const b = fausseBase();
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: ouverte.id, texte: 'Plutôt quelque chose de sobre.', acteId: 'lot-1', projet });
    expect(r).toMatchObject({ verbatimEcrit: true, rattacheeAuProjet: projet.id, extractionEnAttente: false, preuvesExtraites: 0 });
    expect(b.tables.knowledge_sources.map((s) => s.source_type)).toEqual(['discovery_open']);
    expect(b.tables.knowledge_facts[0].context).toBe(`projet:${projet.id}`);
  });
});

describe('alias d’options (onglet 6) et énoncés à paramètre', () => {
  it('un alias masqué n’est pas affiché, et produit exactement la connaissance de l’option canonique', async () => {
    const q = question('live.0478')!;
    const alias = q.options.find((o) => o.libelle === 'Trop de monde')!;
    expect(estAliasMasque(q.id, alias)).toBe(true);
    expect(optionCanonique(q.id, cleOption(alias))).toBe(libelle('live.0478', 'Trop de foule'));
    const a = fausseBase(); await enregistrerReponseFermee(a.client, { userId: U, questionId: q.id, clesOptions: [cleOption(alias)], acteId: 'lot-1', timestamp: '2026-11-19T08:00:00.000Z' });
    const c = fausseBase(); await enregistrerReponseFermee(c.client, { userId: U, questionId: q.id, clesOptions: [libelle('live.0478', 'Trop de foule')], acteId: 'lot-1', timestamp: '2026-11-19T08:00:00.000Z' });
    expect(JSON.stringify(a.tables)).toBe(JSON.stringify(c.tables));
  });
  it('aucune question à paramètre non rempli n’est admissible : jamais d’accolade à l’écran', () => {
    const tout: EtatDiscovery = { tags: new Map(), nePasCreuser: new Set(), branchesOuvertes: new Set(BANQUE.map((q) => q.branche)), niveauParBranche: new Map(BANQUE.map((q) => [q.branche, 'C' as const])),
      dejaPosees: new Set(), attributsConnus: new Set(), sansAlcool: false, contextesConnus: new Set(), contextesActifs: new Set(), aliasBranches: ALIAS_BRANCHES, reglesSousParties: SOUS_PARTIES };
    const parametrees = BANQUE.filter(aParametre);
    expect(parametrees.length).toBe(24);
    for (const q of parametrees) expect(motifDExclusion(q, tout), q.id).not.toBeNull();
  });
});
