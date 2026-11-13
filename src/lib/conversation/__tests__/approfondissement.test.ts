// La validation est le seul endroit où une piste peut devenir une écriture.
// Ce qu'elle laisse passer sera écrit dans le journal ; ce qu'elle refuse ne l'est pas.
import { describe, expect, it, vi } from 'vitest';
import {
  validerCandidats, matiereDuFil, planifierTour,
  type FilApprofondissement, type CandidatConnaissance,
} from '../approfondissement';

const about = { kind: 'account' as const, id: '00000000-0000-4000-8000-000000000001' as never };

const fil = (over: Partial<FilApprofondissement> = {}): FilApprofondissement => ({
  filId: 'fil-1', about,
  recitInitial: 'J’ai fait du pain au levain avec Thibaud ce week-end. J’ai détesté.',
  tours: [
    { question: 'Qu’est-ce qui t’a déplu ?', reponse: 'Attendre entre chaque étape. Pétrir, par contre, j’ai adoré.', ts: '2026-11-13T12:00:00Z' },
    { question: 'Tu fais parfois du pain autrement ?', reponse: 'Oui, du pain rapide presque tous les dimanches.', ts: '2026-11-13T12:01:00Z' },
  ],
  personnes: [{ mention: 'Thibaud', contactId: 'contact-thibaud', ambigu: false }],
  ...over,
});

const candidat = (over: Partial<CandidatConnaissance> = {}): CandidatConnaissance => ({
  segment: 'Pétrir, par contre, j’ai adoré',
  sujet: 'pétrir',
  aQuiCaSeRapporte: { kind: 'account', mention: null },
  provenance: 'narrateur_sur_lui',
  destination: 'INTEREST',
  portee: 'le pétrissage, dans cette expérience',
  ...over,
});

describe('la matière où un segment a le droit d’exister', () => {
  it('contient le récit et les RÉPONSES, jamais les questions de Candice', () => {
    const m = matiereDuFil(fil());
    expect(m).toContain('pain au levain');
    expect(m).toContain('presque tous les dimanches');
    // Un segment tiré de la question de Candice prouverait qu'elle se cite elle-même.
    expect(m).not.toContain('Qu’est-ce qui t’a déplu');
  });
});

describe('un segment doit être CITÉ, pas reformulé', () => {
  it('une citation exacte passe', () => {
    const v = validerCandidats(fil(), [candidat()]);
    expect(v.retenus).toHaveLength(1);
    expect(v.refuses).toEqual([]);
  });

  it('la casse, les accents et l’apostrophe typographique ne font pas échouer', () => {
    const v = validerCandidats(fil(), [candidat({ segment: "PETRIR, PAR CONTRE, J'AI ADORE" })]);
    expect(v.retenus).toHaveLength(1);
  });

  it('une REFORMULATION est refusée — c’est une invention présentée comme une citation', () => {
    const v = validerCandidats(fil(), [candidat({ segment: 'elle aime beaucoup pétrir la pâte' })]);
    expect(v.retenus).toEqual([]);
    expect(v.refuses[0].motif).toBe('segment_absent');
  });

  it('un segment vide est refusé', () => {
    expect(validerCandidats(fil(), [candidat({ segment: '  ' })]).refuses[0].motif).toBe('segment_vide');
  });
});

describe('la portée ne s’invente pas et ne s’élargit pas', () => {
  it('sans portée, refus', () => {
    expect(validerCandidats(fil(), [candidat({ portee: '' })]).refuses[0].motif).toBe('portee_absente');
  });

  it('une fréquence rattachée à la bonne pratique passe', () => {
    const v = validerCandidats(fil(), [candidat({
      segment: 'du pain rapide presque tous les dimanches',
      sujet: 'pain rapide', destination: 'FACT', portee: 'le pain rapide, pas le levain',
    })]);
    expect(v.retenus).toHaveLength(1);
  });
});

describe('qui a dit quoi — et ce qui n’est PAS une déclaration de sa part', () => {
  it('mon impression sur lui ne devient pas une préférence sur SA fiche', () => {
    const v = validerCandidats(fil(), [candidat({
      segment: 'J’ai fait du pain au levain avec Thibaud',
      aQuiCaSeRapporte: { kind: 'contact', mention: 'Thibaud' },
      provenance: 'narrateur_impression',
    })]);
    expect(v.retenus).toEqual([]);
    expect(v.refuses[0].motif).toBe('impression_sur_autrui');
  });

  it('ses mots rapportés par moi, lui, peuvent être retenus — avec LEUR provenance', () => {
    const f = fil({
      tours: [{ question: 'Et lui ?', reponse: 'Il m’a dit qu’il avait adoré pétrir.', ts: '2026-11-13T12:02:00Z' }],
    });
    const v = validerCandidats(f, [candidat({
      segment: 'Il m’a dit qu’il avait adoré pétrir',
      aQuiCaSeRapporte: { kind: 'contact', mention: 'Thibaud' },
      provenance: 'narrateur_rapporte',
    })]);
    expect(v.retenus).toHaveLength(1);
    expect(v.retenus[0].provenance).toBe('narrateur_rapporte');
  });

  it.each([
    ['prénom inconnu du fil', { mention: 'Thibaud', contactId: null, ambigu: false }, 'identite_non_resolue'],
    ['deux Thibaud possibles', { mention: 'Thibaud', contactId: 'c1', ambigu: true }, 'identite_ambigue'],
  ])('%s → aucune écriture rattachée à sa fiche', (_, personne, motif) => {
    const v = validerCandidats(fil({ personnes: [personne] }), [candidat({
      segment: 'J’ai fait du pain au levain avec Thibaud',
      aQuiCaSeRapporte: { kind: 'contact', mention: 'Thibaud' },
      provenance: 'narrateur_rapporte',
    })]);
    expect(v.retenus).toEqual([]);
    expect(v.refuses[0].motif).toBe(motif);
  });

  it('une mention absente de la liste des personnes est non résolue', () => {
    const v = validerCandidats(fil(), [candidat({
      segment: 'avec Thibaud', aQuiCaSeRapporte: { kind: 'contact', mention: 'lui' },
      provenance: 'narrateur_rapporte',
    })]);
    expect(v.refuses[0].motif).toBe('identite_non_resolue');
  });
});

describe('un refus n’emporte pas les autres candidats', () => {
  it('le valide passe, l’invalide est rendu avec son motif', () => {
    const v = validerCandidats(fil(), [
      candidat(),
      candidat({ segment: 'quelque chose qu’elle n’a jamais dit' }),
      candidat({ segment: 'du pain rapide presque tous les dimanches', destination: 'FACT' }),
    ]);
    expect(v.retenus).toHaveLength(2);
    expect(v.refuses).toHaveLength(1);
    // Le refusé est RENDU, pas effacé : il peut rester une piste ou partir en
    // connaissance ouverte. Un refus silencieux serait une perte (§27.6).
    expect(v.refuses[0].candidat.segment).toBe('quelque chose qu’elle n’a jamais dit');
  });
});

describe('le modèle n’est jamais cru sur parole', () => {
  const modele = (reponse: unknown) => ({
    messages: { create: vi.fn().mockResolvedValue(reponse) },
  });

  it('un modèle qui rend n’importe quoi arrête le fil, sans rien inventer', async () => {
    for (const r of [{ content: [] }, { content: [{ type: 'text' }] }, { content: [{ type: 'tool_use' }] }]) {
      const s = await planifierTour(modele(r) as never, fil());
      expect(s).toEqual({ relance: null, pistes: [], candidats: [] });
    }
  });

  it('un modèle en erreur arrête le fil — zéro, jamais une relance de repli', async () => {
    const s = await planifierTour({ messages: { create: vi.fn().mockRejectedValue(new Error('panne')) } } as never, fil());
    expect(s.relance).toBeNull();
    expect(s.candidats).toEqual([]);
  });

  it('une relance vide vaut un arrêt, pas une question blanche', async () => {
    const s = await planifierTour(modele({ content: [{ type: 'tool_use', input: { relance: '   ', pistes: [], candidats: [] } }] }) as never, fil());
    expect(s.relance).toBeNull();
  });

  it('des pistes ne deviennent jamais des candidats', async () => {
    const s = await planifierTour(modele({
      content: [{ type: 'tool_use', input: { relance: 'Tu en refais ?', pistes: ['un goût pour la cuisine ?', 'la place de Thibaud'], candidats: [] } }],
    }) as never, fil());
    expect(s.pistes).toHaveLength(2);
    expect(s.candidats).toEqual([]);
    // Et rien ne sort de la validation à partir de pistes seules.
    expect(validerCandidats(fil(), s.candidats).retenus).toEqual([]);
  });
});
