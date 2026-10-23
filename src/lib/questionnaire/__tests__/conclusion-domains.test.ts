// RÈGLE 7e (fixtures) — un domaine qui a des tags ne peut pas disparaître de la conclusion. Part
// DÉTERMINISTE testable : readSocleTags + readSocleFacts transmettent à l'entrée de la conclusion la
// matière des CINQ domaines (attention, tempérament, lifestyle = constructs ; singularité, pratique =
// FACTs). La prose elle-même est écrite par le modèle (non fixturable) ; 7e est garantie en entrée +
// portée par le prompt. Faux client en mémoire, pas de base, pas de modèle.

import { describe, expect, it } from 'vitest';
import { readSocleTags, readSocleFacts, type TagsReadClient } from '../breath-tags';

// journal fixture : 5 domaines
const EVIDENCES = [
  { target_family: 'AFFECTION_LANGUAGE', target_construct: 'AFFECTION_RECEIVE_WORDS', direction: 'receive', modality: 'WORDS', strength: 'strong', rank: 1, assertion_basis: 'self_report', context: 'attention_received', created_at: '2026-10-23T00:00:01Z' }, // attention
  { target_family: 'PROFILE', target_construct: 'SOCIAL_ENERGY', strength: 'moderate', rank: null, assertion_basis: 'self_report', context: 'general', created_at: '2026-10-23T00:00:02Z' }, // tempérament
  { target_family: 'BEHAVIOR', target_construct: 'stress_response:internalize', strength: 'strong', rank: null, assertion_basis: 'self_report', context: 'stress', created_at: '2026-10-23T00:00:03Z' }, // tempérament
  { target_family: 'PREFERENCE', target_construct: 'PREFERENCE.gift.value_basis', strength: 'strong', rank: null, assertion_basis: 'self_report', context: 'gift', created_at: '2026-10-23T00:00:04Z' }, // lifestyle
];
const FACTS = [
  { fact_type: 'singularity.adore_faire', value: 'la poterie', visibility_derived: 'exposable' }, // singularité
  { fact_type: 'practical.animaux', value: 'un chat', visibility_derived: 'exposable' },           // pratique
  { fact_type: 'practical.allergies', value: 'gluten', visibility_derived: 'internal_only' },      // sensible → filtré
];

function fakeClient(): TagsReadClient {
  return {
    from(table: string) {
      return { select() { return { eq() { return Promise.resolve({ data: table === 'knowledge_facts' ? FACTS : EVIDENCES, error: null }); } }; } };
    },
  } as unknown as TagsReadClient;
}

describe('règle 7e — les 5 domaines atteignent l\'entrée de la conclusion (fixtures)', () => {
  it('readSocleTags transmet attention + tempérament + lifestyle ; readSocleFacts transmet singularité + pratique (sensible filtré)', async () => {
    const input = await readSocleTags(fakeClient(), 'u');
    const facts = await readSocleFacts(fakeClient(), 'u');
    const families = new Set(input.tags.map((t) => t.family));

    // 3 domaines de constructs présents, aucun omis
    expect(families.has('AFFECTION_LANGUAGE')).toBe(true); // attention
    expect(families.has('PROFILE')).toBe(true);            // tempérament
    expect(families.has('BEHAVIOR')).toBe(true);           // tempérament
    expect(families.has('PREFERENCE')).toBe(true);         // lifestyle

    // 2 domaines FACT présents ; le FACT sensible NE PASSE PAS (7d)
    const factTypes = facts.map((f) => f.factType);
    expect(factTypes).toContain('singularity.adore_faire'); // singularité
    expect(factTypes).toContain('practical.animaux');       // pratique
    expect(factTypes).not.toContain('practical.allergies'); // sensible → hors prose

    // total : les 5 domaines ont de la matière à l'entrée (la prose les tisse tous — règle 7e, prompt)
    expect(input.tags.length + facts.length).toBeGreaterThanOrEqual(6);
  });
});
