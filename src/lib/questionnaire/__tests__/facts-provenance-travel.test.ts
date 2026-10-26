// La PROVENANCE d'un FACT voyage jusqu'à l'affichage (hsg §48bis) — même sans résolution.
// Les FACTs ne se résolvent pas (liste à valeurs multiples légitimes), donc un fait SUPPOSÉ (extrait) et un
// fait DÉCLARÉ coexistent. Le read ne doit PAS perdre `assertion_status` : sinon un inféré passe pour un
// déclaré à l'écran. (La FORME de la distinction est éditoriale ; ici on prouve seulement que le signal arrive.)
import { describe, expect, it } from 'vitest';
import { readSocleFacts, readContactFacts, type TagsReadClient, type ContactTagsReadClient } from '../breath-tags';

const FACTS = [
  { fact_type: 'singularity.marques_lieux', value: 'Aesop', visibility_derived: 'public', assertion_status: 'explicit' },
  { fact_type: 'singularity.envies_reves', value: 'la céramique', visibility_derived: 'public', assertion_status: 'inferred' },
];
const oneEq = (rows: unknown[]) => ({ from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: rows, error: null }) }) }) });
const twoEq = (rows: unknown[]) => ({ from: () => ({ select: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: rows, error: null }) }) }) }) });

describe('la provenance d\'un FACT voyage jusqu\'à SocleFact', () => {
  it('readSocleFacts porte assertionStatus (déclaré vs supposé)', async () => {
    const facts = await readSocleFacts(oneEq(FACTS) as unknown as TagsReadClient, 'u');
    expect(facts.find((f) => f.value === 'Aesop')?.assertionStatus).toBe('explicit');
    expect(facts.find((f) => f.value === 'la céramique')?.assertionStatus).toBe('inferred');
  });
  it('readContactFacts porte assertionStatus aussi', async () => {
    const facts = await readContactFacts(twoEq(FACTS) as unknown as ContactTagsReadClient, 'u', 'c');
    expect(facts.find((f) => f.value === 'la céramique')?.assertionStatus).toBe('inferred');
  });
});
