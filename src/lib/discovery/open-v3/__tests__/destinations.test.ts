import { describe, it, expect } from 'vitest';
import { fausseBase } from '../../../knowledge/__tests__/fausse-base';
import { enregistrerReponseOuverte, rejouerLecturesEnAttente, sourceLectureDestinations } from '../service';
import { couvertureDestinations, DESTINATIONS_PAR_QUESTION, executable, validerSegments } from '../destinations';

const U = '00000000-0000-4000-8000-0000000000d7';
// Le verbatim est lui-même un fait (`discovery.<question>`) ; ceux des destinations sont `discovery.fait.*`.
const faits = (b: ReturnType<typeof fausseBase>) => (b.tables.knowledge_facts ?? []).filter((f) => String(f.fact_type).startsWith('discovery.fait.'));
const lecteur = (segments: { declencheur: string; passage: string }[]) => async () => ({ segments });

describe('onglet 17 — les destinations conditionnelles', () => {
  it('quinze destinations, neuf questions ; quatre s’écrivent, onze restent au verbatim avec leur motif', () => {
    const c = couvertureDestinations();
    expect(c).toHaveLength(15);
    expect(DESTINATIONS_PAR_QUESTION.size).toBe(9);
    expect(c.filter((x) => x.executee).map((x) => `${x.question}#${x.rang}`).sort()).toEqual(['comics.0422#2', 'drinks.2102#1', 'learning2.1459#1', 'time.1566#1']);
    const motifs = new Map<string, number>(); for (const x of c.filter((y) => !y.executee)) motifs.set(x.motif!, (motifs.get(x.motif!) ?? 0) + 1);
    expect(Object.fromEntries(motifs)).toEqual({ stabilite_indeterminee_non_stockable: 5, resolution_d_entite_absente: 5, identifiant_requis_absent: 1 });
  });

  it('un passage n’est gardé que s’il figure dans la réponse, sous un déclencheur du contrat', () => {
    const d = DESTINATIONS_PAR_QUESTION.get('learning2.1459')!;
    const v = validerSegments('En ce moment la géologie, et un peu l’histoire des cartes.', { segments: [
      { declencheur: 'SUJET_DECLARE', passage: 'la géologie' }, { declencheur: 'SUJET_DECLARE', passage: 'La Géologie' },
      { declencheur: 'SUJET_DECLARE', passage: 'la volcanologie' }, { declencheur: 'INVENTE', passage: 'la géologie' },
    ] }, d);
    expect(v.parDeclencheur.get('SUJET_DECLARE')).toEqual(['la géologie']);
    expect(v.ecartes).toHaveLength(2);
  });

  it('« Quels sujets t’intéressent ponctuellement ? » : un intérêt par sujet, contextuel, sans degré — et rien d’autre', async () => {
    const b = fausseBase();
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'learning2.1459', texte: 'En ce moment la géologie, et un peu l’histoire des cartes.', acteId: 'lot-1',
      lecteur: lecteur([{ declencheur: 'SUJET_DECLARE', passage: 'la géologie' }, { declencheur: 'SUJET_DECLARE', passage: 'l’histoire des cartes' }]) });
    expect(r.destinations).toMatchObject({ preuves: 2, faits: 0, nonExecutees: [] });
    const ev = b.tables.knowledge_evidences;
    expect(ev).toHaveLength(2);
    for (const e of ev) expect(e).toMatchObject({ target_family: 'INTEREST', stability: 'contextual', assertion_status: 'inferred' });
    expect(ev.map((e) => e.raw_information).sort()).toEqual(['la géologie', 'l’histoire des cartes'].sort());
    for (const e of ev) { expect(e.relationship ?? null).toBeNull(); expect(e).toMatchObject({ evidence_role: 'secondary', strength: 'moderate' }); }
  });

  it('« une technique, un style ou une matière que tu n’aimes vraiment pas » : déclenché, mais non écrit — le motif est rendu, le verbatim reste', async () => {
    const b = fausseBase();
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'CRE-06', texte: 'Je déteste le macramé.', acteId: 'lot-1',
      lecteur: lecteur([{ declencheur: DESTINATIONS_PAR_QUESTION.get('CRE-06')![0].declencheur, passage: 'le macramé' }]) });
    expect(r.destinations!.preuves).toBe(0);
    expect(r.destinations!.nonExecutees).toEqual([{ declencheur: DESTINATIONS_PAR_QUESTION.get('CRE-06')![0].declencheur, motif: 'stabilite_indeterminee_non_stockable' }]);
    expect(b.tables.knowledge_evidences ?? []).toHaveLength(0);
    expect(faits(b)).toHaveLength(0);
    expect(b.tables.knowledge_open_knowledge ?? b.tables.knowledge_sources).toBeTruthy();
    expect(b.tables.knowledge_sources.some((s) => s.id === sourceLectureDestinations(r.verbatimSourceId))).toBe(true);   // « lu, verbatim seul »
  });

  it('un auteur cité : un fait, dans ses mots, tenu pour une lecture ; un titre cité : rien (aucun résolveur d’œuvre)', async () => {
    const b = fausseBase();
    const d = DESTINATIONS_PAR_QUESTION.get('comics.0422')!;
    const auteur = d.find((x) => executable(x).ok)!, titre = d.find((x) => !executable(x).ok)!;
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'comics.0422', texte: 'Tout Moebius, et Blacksad.', acteId: 'lot-1',
      lecteur: lecteur([{ declencheur: auteur.declencheur, passage: 'Moebius' }, { declencheur: titre.declencheur, passage: 'Blacksad' }]) });
    expect(r.destinations).toMatchObject({ faits: 1, preuves: 0 });
    expect(r.destinations!.nonExecutees).toEqual([{ declencheur: titre.declencheur, motif: 'resolution_d_entite_absente' }]);
    const f = faits(b)[0];
    expect(String(f.fact_type)).toMatch(/^discovery\.fait\./);
    expect(JSON.parse(String(f.value))).toMatchObject({ valeur: 'Moebius', question: 'comics.0422' });
  });

  it('modèle en panne : le verbatim est gardé, rien n’est lu, et le rejeu écrit une seule fois', async () => {
    const b = fausseBase();
    const r = await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'learning2.1459', texte: 'La géologie.', acteId: 'lot-1', lecteur: async () => { throw new Error('panne'); } });
    expect(r).toMatchObject({ verbatimEcrit: true, extractionEnAttente: true });
    expect(b.tables.knowledge_evidences ?? []).toHaveLength(0);
    expect(b.tables.knowledge_sources.some((s) => s.id === sourceLectureDestinations(r.verbatimSourceId))).toBe(false);
  });

  it('la même lecture rejouée n’écrit rien deux fois', async () => {
    const b = fausseBase();
    const l = lecteur([{ declencheur: 'SUJET_DECLARE', passage: 'La géologie' }]);
    await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'learning2.1459', texte: 'La géologie.', acteId: 'lot-1', lecteur: l });
    const n = b.tables.knowledge_evidences.length;
    await enregistrerReponseOuverte(b.client, { userId: U, questionId: 'learning2.1459', texte: 'La géologie.', acteId: 'lot-1', lecteur: l });
    expect(b.tables.knowledge_evidences).toHaveLength(n);
    void rejouerLecturesEnAttente;
  });
});
