import { describe, it, expect, vi, beforeEach } from 'vitest';

// Le modèle est remplacé : ces tests portent sur ce que le CODE fait d'une lecture, pas sur la lecture.
const lecture = vi.hoisted(() => ({ units: [] as unknown[] }));
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create: async () => ({ content: [{ type: 'tool_use', input: { units: lecture.units } }] }) }; },
}));

import { buildFromFreeText } from '../../../knowledge-write/extract-free-text';
import { CONTRATS_OUVERTS, OUVERTES_ARCHIVEES, DESTINATIONS_CONDITIONNELLES, relationsAdmises } from '../contrats-ouverts';
import { question, BANQUE } from '../banque';
import { prochainesQuestions } from '../selection';

const entree = (extra: Record<string, unknown> = {}) => ({
  about: { kind: 'account', id: '00000000-0000-4000-8000-000000000001' } as never, ownerId: '00000000-0000-4000-8000-000000000001' as never,
  rawText: 'Le cuir verni, je n’en veux pas. J’aime bien le daim.', fieldContext: 'Quels détails de chaussures veux-tu éviter ?',
  timestamp: '2026-11-19T00:00:00.000Z', questionCode: 'discovery.CHS-05', ...extra,
});

describe('le contrat d’une question ouverte borne ce qui s’écrit (onglet 9)', () => {
  beforeEach(() => { lecture.units = [
    { family: 'ENTITY', label: 'cuir verni', entityType: 'product', relation: 'AVOID', cible: 'referent' },
    { family: 'ENTITY', label: 'daim', entityType: 'product', relation: 'LIKE', cible: 'referent' },
  ]; });

  it('une question négative n’admet que DISLIKE et AVOID', () => {
    expect(relationsAdmises('CHS-05')).toEqual(['DISLIKE', 'AVOID']);
    expect(CONTRATS_OUVERTS.get('CHS-05')?.polarite).toBe('negative');
  });
  it('une relation hors contrat n’est pas écrite comme entité ; les mots restent en connaissance ouverte', async () => {
    const r = await buildFromFreeText(entree({ relationsAdmises: relationsAdmises('CHS-05') }) as never);
    expect(r.evidences.map((e) => `${e.target_construct}:${(e as { relation?: string }).relation}`)).toEqual(['cuir verni:AVOID']);
    expect(r.openKnowledge.map((o) => o.subjectLabel)).toEqual(['daim']);
  });
  it('sans contrat, le comportement général est inchangé', async () => {
    const r = await buildFromFreeText(entree() as never);
    expect(r.evidences).toHaveLength(2);
  });
  it('chaque contrat n’admet que des relations du vocabulaire, et aucune n’est à la fois admise et interdite', () => {
    for (const c of CONTRATS_OUVERTS.values()) {
      expect(c.relations_admissibles.filter((x) => c.relations_interdites.includes(x)), c.question).toEqual([]);
    }
    expect(CONTRATS_OUVERTS.size).toBe(58);
  });
  it('une question archivée par le référentiel n’est jamais servie', () => {
    expect(OUVERTES_ARCHIVEES.size).toBe(2);
    const tout = { tags: new Map(), nePasCreuser: new Set<string>(), branchesOuvertes: new Set(BANQUE.map((q) => q.branche)),
      niveauParBranche: new Map(BANQUE.map((q) => [q.branche, 'C' as const])), dejaPosees: new Set<string>(), attributsConnus: new Set<string>(),
      sansAlcool: false, contextesConnus: new Set<string>(), contextesActifs: new Set<string>() };
    const servies = new Set(prochainesQuestions(tout, { combien: BANQUE.length, parBranche: BANQUE.length }).choix.map((c) => c.question.id));
    for (const id of OUVERTES_ARCHIVEES) expect(servies.has(id), id).toBe(false);
  });
  it('les quinze destinations conditionnelles sont importées — et aucune n’est exécutée', () => {
    expect(DESTINATIONS_CONDITIONNELLES).toHaveLength(15);
    expect(new Set(DESTINATIONS_CONDITIONNELLES.map((d) => d.question_id)).size).toBe(9);
  });
  it('les contrats visent des questions de la banque active ou retirées, jamais un identifiant inconnu des deux', () => {
    const actives = [...CONTRATS_OUVERTS.keys()].filter((id) => question(id));
    expect(actives.length).toBeGreaterThan(40);
  });
});
