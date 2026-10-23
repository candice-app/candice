// A3 — ROUND-TRIP VERBATIM (fixtures) : produceSocleFact conserve la valeur saisie TELLE QUELLE
// (accents, apostrophes, virgules), un champ vide ne produit AUCUN FACT, un champ sensible → internal_only.
// Pas de base : un faux WriteClient capture ce qui serait inséré.

import { describe, expect, it } from 'vitest';
import { produceSocleFact } from '../produce-socle';
import { SINGULARITY_FACT_FIELDS, PRACTICAL_FACT_FIELDS, Q17_FACT_FIELD } from '../socle-facts-fields';
import type { WriteClient } from '../../knowledge-write/persist';

function captureClient() {
  const rows: Record<string, unknown[]> = {};
  const client = {
    from(table: string) {
      return { insert(payload: unknown) { (rows[table] ??= []).push(...(Array.isArray(payload) ? payload : [payload])); return Promise.resolve({ error: null }); } };
    },
  } as unknown as WriteClient;
  return { client, rows };
}

describe('produceSocleFact — round-trip verbatim (fixtures)', () => {
  it('conserve la valeur verbatim, ignore le vide, marque le sensible internal_only', async () => {
    const { client, rows } = captureClient();
    const entries = [
      { spec: SINGULARITY_FACT_FIELDS.adore_faire, value: 'la poterie, les brocantes & la rando' },
      { spec: SINGULARITY_FACT_FIELDS.peu_savent, value: "j'ai peur de l'avion, personne ne le sait" },
      { spec: PRACTICAL_FACT_FIELDS.allergies, value: 'gluten, lactose' },      // sensible
      { spec: Q17_FACT_FIELD, value: 'les surprises en public' },
      { spec: SINGULARITY_FACT_FIELDS.remarquer, value: '   ' },                // vide → aucun FACT
    ];
    const written = await produceSocleFact(client, { userId: '00000000-0000-0000-0000-000000000001', entries, timestamp: '2026-10-23T00:00:00.000Z' });

    expect(written).toBe(4); // le champ vide n'a rien produit
    const facts = (rows['knowledge_facts'] ?? []) as Array<{ fact_type: string; value: string; sensitivity_is_sensitive: boolean; visibility_derived: string }>;
    const byType = new Map(facts.map((f) => [f.fact_type, f]));

    // VERBATIM exact (aucune normalisation)
    expect(byType.get('singularity.adore_faire')?.value).toBe('la poterie, les brocantes & la rando');
    expect(byType.get('singularity.peu_savent')?.value).toBe("j'ai peur de l'avion, personne ne le sait");
    expect(byType.get('relational.q17_register')?.value).toBe('les surprises en public');
    // sensible → internal_only
    expect(byType.get('practical.allergies')?.sensitivity_is_sensitive).toBe(true);
    expect(byType.get('practical.allergies')?.visibility_derived).toBe('internal_only');
    // vide absent
    expect(byType.has('singularity.remarquer')).toBe(false);
  });
});
