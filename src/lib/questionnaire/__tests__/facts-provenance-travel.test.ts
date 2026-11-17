// La PROVENANCE d'un FACT voyage jusqu'à l'affichage (hsg §48bis) — même sans résolution.
// Les FACTs ne se résolvent pas (liste à valeurs multiples légitimes), donc un fait SUPPOSÉ (extrait) et un
// fait DÉCLARÉ coexistent. Le read ne doit PAS perdre `assertion_status` : sinon un inféré passe pour un
// déclaré à l'écran. (La FORME de la distinction est éditoriale ; ici on prouve seulement que le signal arrive.)
import { describe, expect, it } from 'vitest';
import { fauxClientLecture } from '../../knowledge/__tests__/faux-client';
import { readSocleFacts, readContactFacts, type TagsReadClient, type ContactTagsReadClient } from '../breath-tags';

const FACTS = [
  { fact_type: 'singularity.marques_lieux', value: 'Aesop', visibility_derived: 'public', assertion_status: 'explicit', user_id: 'u', about_id: 'u' },
  { fact_type: 'singularity.envies_reves', value: 'la céramique', visibility_derived: 'public', assertion_status: 'inferred', user_id: 'u', about_id: 'u' },
];
// Faux client partagé : il applique les filtres, donc les fixtures portent la double identité.
const oneEq = (rows: unknown[]) => fauxClientLecture({ knowledge_facts: rows, knowledge_evidences: rows });
const twoEq = oneEq;

describe('la provenance d\'un FACT voyage jusqu\'à SocleFact', () => {
  it('readSocleFacts porte assertionStatus (déclaré vs supposé)', async () => {
    const facts = await readSocleFacts(oneEq(FACTS) as unknown as TagsReadClient, 'u');
    expect(facts.find((f) => f.value === 'Aesop')?.assertionStatus).toBe('explicit');
    expect(facts.find((f) => f.value === 'la céramique')?.assertionStatus).toBe('inferred');
  });
  it('readContactFacts porte assertionStatus aussi', async () => {
    // La fiche d'un PROCHE : mêmes faits, mais décrits SUR lui — `about_id` vaut son
    // identifiant, pas celui du pilote. C'est tout l'intérêt du filtre.
    const FACTS_PROCHE = FACTS.map((f) => ({ ...f, about_id: 'c' }));
    const facts = await readContactFacts(twoEq(FACTS_PROCHE) as unknown as ContactTagsReadClient, 'u', 'c');
    expect(facts.find((f) => f.value === 'la céramique')?.assertionStatus).toBe('inferred');
  });
});
