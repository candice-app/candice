// REGISTRE DES LECTEURS DU JOURNAL — garde anti-régression (demandé le 25 oct).
//
// RÈGLE : tout lecteur qui réduit le journal à UNE evidence par construct DOIT résoudre par PRÉSÉANCE
// (resolveJournalRows), jamais par récence seule. Sinon une inférence IA (niveau 5) écrite après une
// déclaration (niveau 1) l'écrase en silence à l'écran.
//
// Ce test exécute CHAQUE lecteur réel contre un journal où, pour un même construct, une DÉCLARATION
// (fort) est écrite d'abord puis une EXTRACTION (inférence IA, faible) EN DERNIER (plus récente). Le
// lecteur DOIT rendre la déclaration. Un lecteur qui résout par récence rendrait l'extraction → échec.
//
// ⚠ QUAND TU AJOUTES UN NOUVEAU LECTEUR DU JOURNAL qui réduit à un-par-construct : AJOUTE-LE À `READERS`
// ci-dessous. S'il ne passe pas par resolveJournalRows, ce test le fait échouer. (Les lecteurs de FACTs
// — readSocleFacts, readContactFacts — renvoient une LISTE sans réduire : ils ne masquent rien, ils ne
// sont donc pas concernés par la préséance. S'ils se mettaient un jour à réduire, ils entrent ici.)

import { describe, expect, it } from 'vitest';
import { readSocleTags, readContactTags, readAttentionTags } from '../../questionnaire/breath-tags';
import { readContactTraitRows } from '../../contacts/traits-from-journal';

// Un client supabase-like à UN `.eq` renvoyant `rows`.
const oneEq = (rows: unknown[]) => ({
  from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: rows, error: null }) }) }),
});
// Un client supabase-like à DEUX `.eq` (filtre about_id) renvoyant `rows`.
const twoEq = (rows: unknown[]) => ({
  from: () => ({ select: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: rows, error: null }) }) }) }),
});

// Construit une paire (déclaration ancienne forte, extraction récente faible) sur le MÊME construct.
// `declaredSource`/`declaredBasis` varient selon pilote (déclaration de soi, niv.1) ou proche (observation, niv.3) —
// dans les deux cas plus fort que l'extraction (niv.5), donc la déclaration doit gagner.
function pair(over: Partial<Record<string, unknown>>, declaredStatus: string, declaredBasis: string) {
  const base = {
    target_family: 'AFFECTION_LANGUAGE', target_construct: 'AFFECTION_RECEIVE',
    direction: 'receive', context: 'attention_received',
  };
  // assertion_status/assertion_basis = les SEULES colonnes de provenance d'une evidence (pas source_type).
  const declared = { ...base, ...over, modality: 'WORDS', strength: 'strong', rank: 1, confidence: 'high',
    assertion_basis: declaredBasis, assertion_status: declaredStatus, created_at: '2026-01-01T00:00:00Z' };
  const extracted = { ...base, ...over, modality: 'SERVICES', strength: 'weak', rank: 1, confidence: 'low',
    assertion_basis: 'self_report', assertion_status: 'inferred', created_at: '2026-10-25T00:00:00Z' };
  return [declared, extracted]; // extraction EN DERNIER (ordre d'insertion + date)
}

// Chaque lecteur : exécuté contre sa paire, renvoie TRUE si la DÉCLARATION a gagné.
const READERS: { name: string; declaredWon: () => Promise<boolean> }[] = [
  {
    name: 'readSocleTags (respiration socle, pilote)',
    declaredWon: async () => {
      const r = await readSocleTags(oneEq(pair({}, 'declared', 'self_report')) as never, 'u');
      const t = r.tags.find((x) => x.construct === 'AFFECTION_RECEIVE');
      return t?.confidence === 'high' && t?.modality === 'WORDS';
    },
  },
  {
    name: 'readAttentionTags (respiration attention, pilote)',
    declaredWon: async () => {
      const r = await readAttentionTags(oneEq(pair({}, 'declared', 'self_report')) as never, 'u');
      const t = r.tags.find((x) => x.construct === 'AFFECTION_RECEIVE');
      return t?.confidence === 'high' && t?.modality === 'WORDS';
    },
  },
  {
    name: 'readContactTags (respiration, proche)',
    declaredWon: async () => {
      const r = await readContactTags(twoEq(pair({}, 'observed', 'observed')) as never, 'u', 'c');
      const t = r.tags.find((x) => x.construct === 'AFFECTION_RECEIVE');
      return t?.confidence === 'high' && t?.modality === 'WORDS';
    },
  },
  {
    name: 'readContactTraitRows (bloc traits de la fiche proche)',
    declaredWon: async () => {
      const rows = await readContactTraitRows(twoEq(pair({}, 'observed', 'observed')) as never, 'u', 'c');
      const trait = rows.find((x) => x.label === 'Ce qui la touche');
      return trait?.value === 'Les mots'; // modality WORDS (déclarée), pas 'Les gestes…' (extraite)
    },
  },
];

describe('tout lecteur du journal résout par préséance (pas la récence seule)', () => {
  for (const reader of READERS) {
    it(`${reader.name} : la déclaration l'emporte sur l'extraction plus récente`, async () => {
      expect(await reader.declaredWon()).toBe(true);
    });
  }
});
