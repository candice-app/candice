// PREUVE DE BOUT EN BOUT — « à l'écran », pas dans une fonction isolée.
//
// On ne teste PAS resolveByProvenance ici (c'est fait dans preseance.test.ts). On teste le LECTEUR que
// l'écran appelle vraiment : QuestionnaireFlow.tsx:61 fait `readSocleTags(supabase, userId)` et affiche
// l'`input` qu'il retourne. Donc : si on écrit dans le journal une DÉCLARATION (niveau 1) puis, EN DERNIER
// (plus récent, inséré après), une EXTRACTION (inférence IA, niveau 5) visant le MÊME construct, alors le
// tag que l'écran reçoit doit porter la DÉCLARATION — jamais l'inférence, malgré la récence et l'ordre.
//
// Avant le branchement de la préséance, la récence seule aurait fait gagner l'extraction (écrite en dernier)
// et l'écran aurait montré une supposition du modèle à la place d'une déclaration. C'est le silence qu'on ferme.

import { describe, expect, it } from 'vitest';
import { readSocleTags, type TagsReadClient } from '../breath-tags';

// Une ligne du journal telle que la table knowledge_evidences la stocke (colonnes lues par readSocleTags).
type JournalRow = {
  target_family: string;
  target_construct: string;
  direction?: string;
  modality?: string;
  strength: string | null;
  rank: number | null;
  assertion_basis: string;
  assertion_status: string;
  confidence: string | null;
  context: string;
  created_at: string;
};

// Client minimal conforme à TagsReadClient — exactement l'interface que l'écran passe (un supabase chaînable
// `.from(...).select(...).eq('user_id', ...)`). Il rejoue le journal APPEND-ONLY dans l'ordre d'insertion.
function journalClient(rows: JournalRow[]): TagsReadClient {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return Promise.resolve({ data: rows, error: null });
            },
          };
        },
      };
    },
  };
}

describe('préséance À L\'ÉCRAN : l\'extraction écrite EN DERNIER ne masque pas la déclaration', () => {
  it('readSocleTags (le lecteur de l\'écran) rend la DÉCLARÉE, pas l\'extraite plus récente', async () => {
    const construct = 'IMPORTANCE_AESTHETIC';
    // 1) La personne DÉCLARE (onboarding, self_report) — niveau 1, écrite EN PREMIER (plus ancienne).
    const declared: JournalRow = {
      target_family: 'VALUES', target_construct: construct,
      strength: 'strong', rank: 1,
      assertion_basis: 'self_report', assertion_status: 'declared', confidence: 'high',
      context: 'values', created_at: '2026-01-01T00:00:00Z',
    };
    // 2) PLUS TARD, l'extraction d'une réponse libre INFÈRE le même construct — niveau 5, source_type
    //    'extraction_inferred', confidence 'low' : exactement ce qu'écrit extract-free-text.ts. Écrite EN
    //    DERNIER (plus récente ET insérée après). C'est elle que la récence seule aurait élue.
    const extracted: JournalRow = {
      target_family: 'VALUES', target_construct: construct,
      strength: 'weak', rank: 3,
      assertion_basis: 'self_report', assertion_status: 'inferred', confidence: 'low',
      context: 'values', created_at: '2026-10-25T00:00:00Z',
    };

    // Journal append-only : déclaration d'abord, extraction écrite EN DERNIER.
    const input = await readSocleTags(journalClient([declared, extracted]), 'user-qa');

    // Un seul tag pour ce construct (préséance par construct), et c'est la DÉCLARÉE qui s'affiche.
    const shown = input.tags.filter((t) => t.construct === construct);
    expect(shown).toHaveLength(1);
    expect(shown[0].strength).toBe('strong');   // la déclaration (pas 'weak' de l'inférence)
    expect(shown[0].rank).toBe(1);              // le rang de la déclaration
    expect(shown[0].confidence).toBe('high');   // la confiance de la déclaration, pas 'low'
  });
});
