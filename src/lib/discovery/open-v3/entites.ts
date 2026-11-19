/**
 * D9 — LES QUESTIONS À PROPOS D'UNE ENTITÉ (« Qu'est-ce que tu aimes surtout chez {marque} ? »).
 * Voir entites-de-questions.json : quelles entités, quelles relations, et pourquoi pour chaque question.
 */
import table from './entites-de-questions.json';
import { BANQUE } from './banque';

export interface EntiteDuJournal { readonly id: string; readonly libelle: string; readonly type: string; readonly relation: string; readonly depuis: string }
interface Ligne { serie: string; relations: string[]; pourquoi: string }
const T = table as unknown as { series: Record<string, { types: string[] }>; questions: Record<string, Ligne>; fermees: Record<string, string> };
const IDS = new Set(BANQUE.map((q) => q.id));
for (const id of [...Object.keys(T.questions), ...Object.keys(T.fermees)]) if (!IDS.has(id)) throw new Error(`entites-de-questions.json : ${id} absente de la banque`);
for (const [id, l] of Object.entries(T.questions)) if (!T.series[l.serie]) throw new Error(`entites-de-questions.json : série inconnue pour ${id}`);

export const QUESTIONS_D_ENTITE: ReadonlySet<string> = new Set([...Object.keys(T.questions), ...Object.keys(T.fermees)]);
export const ligneDEntite = (id: string): Ligne | null => T.questions[id] ?? null;

/**
 * L'entité pour laquelle cette question peut être posée MAINTENANT : la plus récente qui a le bon type
 * et une relation que la question présume, et pour laquelle elle n'a pas déjà été posée (D10 par entité).
 */
export function entitePour(questionId: string, entites: readonly EntiteDuJournal[], poseesParEntite: ReadonlyMap<string, ReadonlySet<string>>): EntiteDuJournal | null {
  const l = T.questions[questionId];
  if (!l) return null;
  const types = new Set(T.series[l.serie].types);
  const deja = poseesParEntite.get(questionId) ?? new Set<string>();
  return [...entites].filter((e) => types.has(e.type) && l.relations.includes(e.relation) && !deja.has(e.id))
    .sort((a, b) => (a.depuis < b.depuis ? 1 : -1))[0] ?? null;
}
