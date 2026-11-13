// INTEREST.relationship — arbitrage du 13 novembre.
//
// INTEREST_RELATIONSHIPS fait foi : casual | curious | enthusiast | passion | expert.
// C'est une ÉCHELLE D'ENGAGEMENT, pas une nature de rapport.
//
//   · intérêt établi ET degré établi      → evidence INTEREST portant le degré
//   · intérêt établi, degré NON établi    → evidence INTEREST, relationship ABSENT
//     (absent = non précisé — jamais « casual », qui serait un degré inventé)
//   · action ponctuelle sans intérêt      → aucune evidence : le récit part en
//     connaissance ouverte, verbatim, et nourrit une relance
//   · rejet / désintérêt                  → jamais encodé dans l'échelle d'engagement :
//     la formulation est conservée en connaissance ouverte
//
// Et la règle qui tient tout : une valeur hors vocabulaire n'est JAMAIS convertie.
// « curiosity » ne devient pas « curious », « appreciation » et « aversion » ne
// deviennent pas des degrés. Une conversion serait une invention ; une absence est juste.
import { expect, it, vi } from 'vitest';
import { accountAbout, asUserId } from '../../knowledge/identity';
import { INTEREST_RELATIONSHIPS } from '../../knowledge/vocabulary';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@anthropic-ai/sdk', () => ({ default: class { messages = { create }; } }));

import { buildFromFreeText } from '../extract-free-text';

const ownerId = asUserId('fixture-owner');

function extraire(rawText: string, units: Record<string, unknown>[]) {
  create.mockResolvedValueOnce({ content: [{ type: 'tool_use', input: { units } }] });
  return buildFromFreeText({
    ownerId, about: accountAbout(ownerId), rawText,
    fieldContext: 'Cuisine', timestamp: '2026-11-13T12:00:00Z',
  });
}

const interet = (relationship?: string) => [{
  family: 'INTEREST', label: 'pain au levain', parentDomain: 'food_gastronomy',
  ...(relationship !== undefined ? { relationship } : {}),
}];

it('intérêt AVEC degré établi : le degré est écrit tel quel', async () => {
  const r = await extraire('Le pain au levain, c’est ma passion.', interet('passion'));
  expect(r.evidences).toMatchObject([{ target_family: 'INTEREST', relationship: 'passion' }]);
  expect(r.openKnowledge).toEqual([]);
});

it('intérêt SANS degré : l’evidence existe, relationship est ABSENT (jamais « casual »)', async () => {
  const r = await extraire('Je fais du pain au levain.', interet());
  expect(r.evidences).toHaveLength(1);
  const ev = r.evidences[0] as unknown as Record<string, unknown>;
  expect(ev.target_family).toBe('INTEREST');
  // La clé elle-même ne doit pas exister : un `undefined` explicite franchirait un
  // `?? 'casual'` posé plus tard sans que rien ne le signale.
  expect(Object.prototype.hasOwnProperty.call(ev, 'relationship')).toBe(false);
});

it('action ponctuelle (famille OTHER) : aucune evidence, le récit est conservé verbatim', async () => {
  const r = await extraire('J’ai fait du pain au levain ce week-end.', [
    { family: 'OTHER', label: 'a fait du pain au levain ce week-end', relation_label: 'a fait' },
  ]);
  expect(r.evidences).toEqual([]);
  expect(r.openKnowledge).toMatchObject([{ subjectLabel: 'a fait du pain au levain ce week-end' }]);
  expect(r.source?.rawText).toBe('J’ai fait du pain au levain ce week-end.');
});

it('rejet : conservé en connaissance ouverte, jamais encodé dans l’échelle d’engagement', async () => {
  const r = await extraire('J’ai détesté faire du pain au levain.', [
    { family: 'OTHER', label: 'faire du pain au levain', relation_label: 'a détesté' },
  ]);
  expect(r.evidences).toEqual([]);
  expect(r.openKnowledge).toMatchObject([{ subjectLabel: 'faire du pain au levain', relation: 'a détesté' }]);
});

// ── LE CAS DÉTERMINANT (arbitrage du 13 nov) ────────────────────────────────────────
// Le modèle renvoie « curiosity » — valeur de l'ANCIEN schéma, hors du vocabulaire qui
// fait foi — alors que les propos établissent clairement un intérêt. Trois issues
// possibles, une seule juste :
//   · traduire curiosity → curious  : INVENTION. Les deux mots se ressemblent, les deux
//     axes non : « curiosity » disait la nature du rapport, « curious » dit un degré
//     d'engagement. Rien dans les propos ne permet de situer la personne sur l'échelle.
//   · jeter l'evidence                : PERTE. L'intérêt, lui, EST établi par les propos.
//   · garder l'intérêt, degré absent  : JUSTE. On enregistre ce qu'on sait, pas plus.
it('curiosity + intérêt établi → l’intérêt est CONSERVÉ, le degré reste absent', async () => {
  const r = await extraire(
    'Je lis tout ce que je trouve sur le levain, j’en parle sans arrêt.',
    interet('curiosity'),
  );
  expect(r.evidences).toHaveLength(1);
  const ev = r.evidences[0] as unknown as Record<string, unknown>;
  expect(ev.target_family).toBe('INTEREST');
  expect(ev.subjectLabel).toBe('pain au levain');
  // Ni traduit…
  expect(ev.relationship).not.toBe('curious');
  // …ni inventé : la clé n'existe pas.
  expect(Object.prototype.hasOwnProperty.call(ev, 'relationship')).toBe(false);
  // Et l'intérêt n'est pas rétrogradé en reliquat : il est bien dans le journal structuré.
  expect(r.openKnowledge).toEqual([]);
});

// Le modèle ne respecte pas toujours l'énumération qu'on lui donne : la validation est
// côté application, pas côté confiance.
it.each([
  ['curiosity',    'ancien vocabulaire — ne devient PAS « curious »'],
  ['appreciation', 'nature du rapport, pas un degré'],
  ['aversion',     'polarité négative, pas un degré'],
  ['CASUAL',       'casse non canonique mais valeur réelle'],
  ['n’importe quoi', 'valeur libre'],
])('valeur hors vocabulaire « %s » (%s)', async (valeur) => {
  const r = await extraire('Le pain au levain.', interet(valeur));
  expect(r.evidences).toHaveLength(1);
  const ev = r.evidences[0] as unknown as Record<string, unknown>;
  const ecrit = ev.relationship as string | undefined;
  // Soit la valeur est canonique après normalisation de casse, soit elle est écartée.
  // Jamais traduite vers une autre valeur du vocabulaire.
  if (ecrit !== undefined) {
    expect(INTEREST_RELATIONSHIPS as readonly string[]).toContain(ecrit);
    expect(ecrit).toBe(valeur.trim().toLowerCase());
  } else {
    expect(Object.prototype.hasOwnProperty.call(ev, 'relationship')).toBe(false);
  }
});

it('le schéma soumis au modèle ne propose QUE le vocabulaire qui fait foi', async () => {
  await extraire('Le pain au levain.', interet());
  const schema = create.mock.calls.at(-1)?.[0]?.tools?.[0]?.input_schema;
  const enumere = schema?.properties?.units?.items?.properties?.relationship?.enum;
  expect(enumere).toEqual([...INTEREST_RELATIONSHIPS]);
  // Les quatre valeurs de l'ancien schéma ne doivent plus être proposées nulle part.
  for (const perimee of ['appreciation', 'curiosity', 'aversion']) {
    expect(enumere).not.toContain(perimee);
  }
});
