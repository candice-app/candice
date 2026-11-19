/**
 * L'ENTRÉE LARGE — décision D13 du 19 nov.
 *
 * « Oui à une entrée large, facultative : permettre de choisir un sujet, de raconter quelque chose
 *   ou de passer. Aucun centre d'intérêt coché ne signifie pas que la personne n'en a aucun. Ne la
 *   laisse pas dans une impasse et ne lui fabrique pas d'intérêts. »
 *
 * Choisir un sujet passe par la porte existante (`declarerSujet`) : cela ouvre des questions, et
 * n'écrit AUCUNE préférence. Passer n'écrit rien. Ce module tient le troisième geste, RACONTER :
 *
 *   1. le texte est d'abord gardé tel quel, sous l'identité de la personne (`discovery.recit_libre`),
 *      AVANT tout appel au modèle : une panne ne perd rien ;
 *   2. il est ensuite lu par l'extracteur du journal (`extractFreeText`), qui n'écrit que ce que le
 *      texte dit, et dont la lecture est rattachée à ce verbatim. Elle est idempotente : relancer la
 *      lecture d'un même récit ne la double pas ;
 *   3. si la lecture échoue, on le DIT, et la personne peut la relancer : on n'annonce jamais une
 *      lecture qui n'a pas eu lieu.
 */
import { randomUUID } from 'node:crypto';
import { createFact } from '@/lib/knowledge/fact';
import { createSourceRecord } from '@/lib/knowledge/sources';
import { factId } from '@/lib/knowledge-write/ids';
import { persistKnowledge, type WriteClient } from '@/lib/knowledge-write/persist';
import { extractFreeText } from '@/lib/knowledge-write/extract-free-text';
import { accountAbout, asUserId } from '@/lib/knowledge/identity';

export const FAIT_RECIT = 'discovery.recit_libre';
export const LONGUEUR_MAX_RECIT = 2000;

/** Les textes EXACTS de l'entrée large (proposés dans le dossier D13). */
export const ENTREE_LARGE = {
  titre: 'Par où veux-tu commencer ?',
  texte: 'Il n’y a pas de question en attente pour l’instant. Tu peux choisir un sujet dont tu as envie de parler, raconter quelque chose avec tes mots, ou simplement passer.',
  choisir: 'Choisir un sujet',
  raconter: 'Raconter quelque chose',
  invite: 'Ce qui t’occupe en ce moment, ce que tu aimes faire, un souvenir, une envie… ce que tu veux.',
  passer: 'Passer',
} as const;

export type Lecture = 'lue' | 'deja_lue' | 'echec';

/** Lit un récit déjà gardé. Ne lève jamais : un échec est un résultat, rendu à la personne. */
async function lire(client: WriteClient, userId: string, sourceId: string, texte: string, timestamp: string, extraire: typeof extractFreeText): Promise<Lecture> {
  try {
    const owner = asUserId(userId);
    const r = await extraire(client, {
      about: accountAbout(owner), ownerId: owner, rawText: texte, timestamp,
      fieldContext: 'Récit libre de la personne (entrée large du Discovery)',
      questionCode: `${FAIT_RECIT}.${sourceId}`, verbatimSourceId: sourceId,
    });
    return r.dejaFaite ? 'deja_lue' : 'lue';
  } catch (e) {
    console.error('[discovery/entree] lecture du récit impossible', e instanceof Error ? e.message : String(e));
    return 'echec';
  }
}

export async function raconter(
  client: WriteClient,
  input: { readonly userId: string; readonly texte: string; readonly timestamp?: string },
  extraire: typeof extractFreeText = extractFreeText,
): Promise<{ readonly recitId: string; readonly lecture: Lecture }> {
  const texte = input.texte.trim();
  if (!texte) throw new RangeError('récit vide');
  if (texte.length > LONGUEUR_MAX_RECIT) throw new RangeError(`récit trop long (${LONGUEUR_MAX_RECIT} caractères au plus)`);
  const timestamp = input.timestamp ?? new Date().toISOString();
  const owner = asUserId(input.userId), about = accountAbout(owner);
  const sourceId = randomUUID();
  const source = createSourceRecord({
    about, ownerId: owner, id: sourceId, sourceType: 'user_declaration', questionCode: FAIT_RECIT,
    questionText: ENTREE_LARGE.invite, answerText: texte, timestamp,
  });
  const fact = createFact({
    about, ownerId: owner, fact_id: factId(sourceId, FAIT_RECIT, 'verbatim'), fact_type: FAIT_RECIT, value: texte,
    source: sourceId, timestamp, confidence: 'high', user_confirmed: true, assertionStatus: 'explicit',
  });
  await persistKnowledge(client, { source, facts: [fact] });
  return { recitId: sourceId, lecture: await lire(client, input.userId, sourceId, texte, timestamp, extraire) };
}

/** Relance la lecture d'un récit DE CETTE PERSONNE (lu en base, sous RLS). */
export async function relireRecit(
  client: WriteClient,
  input: { readonly userId: string; readonly recitId: string },
  extraire: typeof extractFreeText = extractFreeText,
): Promise<{ readonly lecture: Lecture } | null> {
  const lecture = client as unknown as { from(t: string): { select(c: string): { eq(c: string, v: string): { eq(c: string, v: string): { maybeSingle(): Promise<{ data: { answer_text: string; ts: string; user_id: string } | null; error: { message: string } | null }> } } } } };
  const { data, error } = await lecture.from('knowledge_sources').select('answer_text, ts, user_id').eq('id', input.recitId).eq('question_code', FAIT_RECIT).maybeSingle();
  if (error) throw new Error(`lecture du récit impossible : ${error.message}`);
  if (!data || data.user_id !== input.userId) return null;
  return { lecture: await lire(client, input.userId, input.recitId, data.answer_text, data.ts, extraire) };
}
