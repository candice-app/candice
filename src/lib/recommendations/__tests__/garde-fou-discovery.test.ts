import { describe, it, expect } from 'vitest';
import { fausseBase } from '../../knowledge/__tests__/fausse-base';
import { lireRejetsDuProche, PORTEE_EXCLUSIONS_RECO } from '../declarations-proche';
import { candidateRejectedBy } from '../rejection-match';
import { appliquerGardeFous, dansLePerimetre, gardeFouDe, CATEGORIES_D_IDEE, type JugeDeGardeFous } from '../garde-fous-discovery';
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

describe('« ne m’offrez pas de chaussures » concerne les chaussures offertes — rien d’autre', () => {
  it('le défaut d’origine : apparié mot à mot, le chemin technique retirait toute idée qui dit « cadeau »', () => {
    expect(candidateRejectedBy('Un cadeau pour son anniversaire : un livre de cuisine', [{ label: 'shoe.gift_openness.cadeau_chaussures_refuse', family: 'GUARDRAIL', severity: 'SOFT' }])).not.toBeNull();
  });
  it('périmètre : un cadeau du domaine chaussures peut être concerné ; un autre cadeau, une sortie mode, non', () => {
    expect(chaussures).toMatchObject({ canaux: ['cadeau'], domaine: 'shoe', contrainte: 'SOFT', nature: 'refus' });
    expect(CATEGORIES_D_IDEE).toContain('shoe');
    expect(dansLePerimetre(idee('Une paire de baskets', 'cadeau', 'shoe'), chaussures)).toBe(true);
    expect(dansLePerimetre(idee('Un livre de cuisine', 'cadeau', 'food'), chaussures)).toBe(false);
    expect(dansLePerimetre(idee('Une après-midi shopping', 'experience', 'shoe'), chaussures)).toBe(false);
    // Catégorie non déclarée : on ne conclut pas « hors sujet » de ce qu'on ignore.
    expect(dansLePerimetre(idee('Une surprise', 'cadeau'), chaussures)).toBe(true);
    expect(dansLePerimetre(idee('Une surprise', 'cadeau', 'inventee'), chaussures)).toBe(true);
  });
  it('dans le périmètre, c’est le JUGE qui décide — et il ne reçoit que le critère', async () => {
    const vus: string[][] = [];
    const juge: JugeDeGardeFous = async (i, criteres) => { vus.push([...criteres]); return criteres.map(() => /baskets|chaussures|bottines/i.test(i.title)); };
    const idees = [idee('Une paire de baskets', 'cadeau', 'shoe'), idee('Un cirage et une brosse', 'cadeau', 'shoe'), idee('Un livre de cuisine', 'cadeau', 'food'), idee('Une après-midi shopping', 'experience', 'shoe')];
    const r = await appliquerGardeFous(idees, [chaussures], juge);
    expect(r.gardees.map((i) => i.title)).toEqual(['Un cirage et une brosse', 'Un livre de cuisine', 'Une après-midi shopping']);
    expect(r.bilan).toMatchObject({ ecartees: 1, horsPerimetre: 2, jugeesNonConcernees: 1 });
    expect(vus).toHaveLength(2);                                   // le juge n'est jamais consulté hors périmètre
    expect(vus.every((c) => c.length === 1 && c[0] === chaussures.critere)).toBe(true);
  });
  it('sans juge, rien n’est écarté — et c’est compté, pas tu', async () => {
    const r = await appliquerGardeFous([idee('Une paire de baskets', 'cadeau', 'shoe')], [chaussures]);
    expect(r.gardees).toHaveLength(1);
    expect(r.bilan.aJugerSansJuge).toBe(1);
  });
  it('une condition n’écarte jamais ; un juge qui ne rend pas un verdict par critère n’a rien jugé', async () => {
    const condition = (matrice as unknown as { matrice: { question: string; libelle: string; nature: string; statut: string }[] }).matrice.find((l) => l.nature === 'condition' && l.statut === 'traduit')!;
    const g = gardeFouDe(condition.question, condition.libelle)!;
    const r = await appliquerGardeFous([{ title: 'x', justification: '', canal: g.canaux[0], categorie: g.domaine }], [g], async () => [true]);
    expect(r.gardees).toHaveLength(1);
    expect(r.bilan.conditions).toBe(1);
    await expect(appliquerGardeFous([idee('Une paire de baskets', 'cadeau', 'shoe')], [chaussures], async () => [])).rejects.toThrow(/verdict par critère/);
  });
});

describe('lecture chez le proche', () => {
  it('le garde-fou du Discovery est rendu STRUCTURÉ, jamais comme rejet à apparier ; une ligne inconnue est comptée', async () => {
    const b = base(
      [{ source_id: 's-disc', target_family: 'GUARDRAIL', target_construct: 'shoe.gift_openness.cadeau_chaussures_refuse', severity: 'SOFT', raw_information: REFUS_CHAUSSURES.libelle },
       { source_id: 's-disc2', target_family: 'GUARDRAIL', target_construct: 'x.y.z', severity: 'SOFT', raw_information: 'réponse disparue de la banque' },
       { source_id: 's-onb', target_family: 'GUARDRAIL', target_construct: 'fleurs coupées', severity: 'SOFT' }],
      [{ id: 's-disc', source_type: 'discovery_closed', question_code: 'CHS-01' }, { id: 's-disc2', source_type: 'discovery_closed', question_code: 'CHS-01' }, { id: 's-onb', source_type: 'onboarding_closed', question_code: 'q' }]);
    const r = await lireRejetsDuProche(b.client, { piloteId: PILOTE, contactId: CONTACT });
    expect(r.autorise).toBe(true);
    expect(r.rejets.map((x) => x.label)).toEqual(['fleurs coupées']);
    expect(r.gardeFous).toEqual([chaussures]);
    expect(r.ecartesSansDeclaration).toEqual({ garde_fou_discovery_non_traduit: 1 });
  });
});
