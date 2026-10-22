// A4 — INCOGNITO rendu depuis la BANQUE CANONIQUE unique (INCOGNITO_QUESTIONS, 17 questions). Fin de la
// maladie des deux banques : le composant ne code plus ses questions en dur. Jetons {Prénom}/{Pronom}/
// {pronom} résolus au rendu. Production au submit via produceIncognitoOption (journal about=contact,
// sourceType=reported_by_relative, assertionBasis PAR QUESTION, jamais self_report) + GARDE deriveRespondentRole.

import { INCOGNITO_QUESTIONS, type IncognitoQuestion } from '../knowledge/onboarding-incognito';
import { produceIncognitoOption } from '../knowledge-write/produce-incognito';
import { persistKnowledge, type WriteClient } from '../knowledge-write/persist';
import { contactAbout, asContactId, asUserId } from '../knowledge/identity';
import { deriveRespondentRole } from '../knowledge/sources';
import { resolvePronoun, type ContactGender } from '../knowledge-write/pronoun';
import type { Evidence } from '../knowledge';

/** 7 modalités canoniques → dimensions du vecteur 7D (net, sans le split legacy `presence`). */
export const MODALITY_TO_DIM: Record<string, string> = {
  WORDS: 'MOT', SERVICES: 'SER', PERSONALIZED_GIFT: 'CAD_C', SYMBOLIC_GIFT: 'CAD_S',
  QUALITY_TIME: 'EXP', MICRO_ATTENTIONS: 'GES', SURPRISE: 'SUR',
};
export const DIMS_7D = ['MOT', 'SER', 'CAD_C', 'CAD_S', 'EXP', 'GES', 'SUR'] as const;
export const RANK_WEIGHTS_7D = [5, 3, 1];

export interface ResolvedIncognitoOption { readonly code: string; readonly text: string; readonly unknownOrContextual: boolean; }
export interface ResolvedIncognitoQuestion {
  readonly code: string;
  readonly stem: string;
  readonly selection: IncognitoQuestion['selection'];
  readonly options: readonly ResolvedIncognitoOption[];
}

/** Résout les jetons des 17 questions pour le RENDU (identité du proche injectée). */
export function resolveIncognitoQuestions(firstName: string, gender: ContactGender): ResolvedIncognitoQuestion[] {
  const r = (t: string) => resolvePronoun(t, firstName, gender);
  return INCOGNITO_QUESTIONS.map((q) => ({
    code: q.code,
    stem: r(q.stem),
    selection: q.selection,
    options: q.options.map((o) => ({ code: o.code, text: r(o.text), unknownOrContextual: o.status === 'UNKNOWN_BY_REPORTER' || o.status === 'CONTEXT_DEPENDENT' })),
  }));
}

const questionByCode = new Map(INCOGNITO_QUESTIONS.map((q) => [q.code, q]));

/** code d'option I1 (I1.1…) → modalité canonique (WORDS…), pour le 7D côté composant. */
export const I1_MODALITY_BY_CODE: Record<string, string> = Object.fromEntries(
  (INCOGNITO_QUESTIONS.find((q) => q.code === 'I1')?.options ?? [])
    .filter((o) => o.affection?.modality)
    .map((o) => [o.code, o.affection!.modality]),
);

/**
 * Persiste au JOURNAL les options sélectionnées d'UNE question incognito (ordre = rang pour I1).
 * - provenance : about=contact, sourceType=reported_by_relative, entered_by=pilote (ownerId).
 * - GARDE deriveRespondentRole : l'incognito est TOUJOURS 'reporter' (jamais 'subject'). Jette sinon.
 * - rang : l'evidence AFFECTION de I1 (multi:3 ordonné) porte son rang (1..3) → 7D reconstructible.
 * Append : un source_id FRAIS par option répondue. Renvoie le nb d'evidences écrites.
 */
export async function persistIncognitoAnswer(
  client: WriteClient,
  ctx: { contactId: string; ownerId: string; firstName: string; gender: ContactGender; timestamp: string },
  questionCode: string,
  orderedOptionCodes: readonly string[],
): Promise<number> {
  const question = questionByCode.get(questionCode);
  if (!question) throw new Error(`[canonical-incognito] question ${questionCode} inconnue`);
  const about = contactAbout(asContactId(ctx.contactId));
  const ownerId = asUserId(ctx.ownerId);
  let written = 0;
  for (let i = 0; i < orderedOptionCodes.length; i++) {
    const option = question.options.find((o) => o.code === orderedOptionCodes[i]);
    if (!option) continue;
    // GARDE : l'invariant du mode 3. deriveRespondentRole doit renvoyer 'reporter' (jamais 'subject').
    const role = deriveRespondentRole(option.assertionBasisOverride ?? question.baseAssertionBasis);
    if (role !== 'reporter') throw new Error(`[canonical-incognito] ${option.code} : respondentRole=${role} ≠ reporter (invariant incognito violé)`);
    const out = produceIncognitoOption(
      { about, ownerId, sourceId: globalThis.crypto.randomUUID(), timestamp: ctx.timestamp, firstName: ctx.firstName, gender: ctx.gender },
      question,
      option,
    );
    // rang (I1 ordonné) sur l'evidence AFFECTION → 7D reconstructible du journal.
    const rank = i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined;
    const evidences: Evidence[] = rank
      ? out.evidences.map((e) => (e.target_family === 'AFFECTION_LANGUAGE' ? ({ ...e, rank }) : e))
      : [...out.evidences];
    await persistKnowledge(client, { source: out.source, evidences, facts: out.facts, openKnowledge: out.openKnowledge });
    written += evidences.length;
  }
  return written;
}

/** Projection 7D depuis la sélection I1 ORDONNÉE (modalités canoniques). Réplique la forme legacy (rang × dim, normalisé). */
export function compute7DFromI1(orderedModalities: readonly string[]): Record<string, number> {
  const raw: Record<string, number> = Object.fromEntries(DIMS_7D.map((d) => [d, 0]));
  orderedModalities.forEach((mod, idx) => {
    const dim = MODALITY_TO_DIM[mod];
    if (dim) raw[dim] += (RANK_WEIGHTS_7D[idx] ?? 0) * 1.0;
  });
  const max = Math.max(...DIMS_7D.map((d) => raw[d]));
  const normalized: Record<string, number> = Object.fromEntries(DIMS_7D.map((d) => [d, 0]));
  if (max > 0) for (const d of DIMS_7D) normalized[d] = Math.round((raw[d] / max) * 100);
  return normalized;
}
