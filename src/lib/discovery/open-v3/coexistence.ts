/**
 * DEUX GÉNÉRATIONS D'UNE MÊME BRANCHE — onglet 13_COEXISTENCE_GENERATIONS du référentiel.
 *
 * Vingt domaines existent deux fois dans la banque : la branche historique (`travel`) et
 * celle qui la reprend (`travel2`). Le référentiel dit comment elles cohabitent, et la
 * première version du moteur ne le lisait pas : pour lui c'étaient deux branches sans lien,
 * et « Quand tu voyages, qu'est-ce que tu recherches d'abord ? » pouvait suivre « Quels
 * formats de séjour te font réellement envie ? » comme si de rien n'était.
 *
 * Par BRANCHE : « Un seul pool visible ; `2` prioritaire sur intention équivalente,
 * l'historique seulement pour précision unique utile ; pas de fusion brute ».
 *   → les deux générations comptent pour UNE branche dans le plafond d'un lot, et la
 *     génération prioritaire passe devant à score égal.
 * Par QUESTION, trois décisions :
 *   NEW_PRIMARY (+ OLD_OFF_PROACTIVE)  l'ancienne n'est plus jamais proposée d'initiative ;
 *   ALIAS_OLD_TO_NEW                   l'ancienne est retirée de la rotation ;
 *   KEEP_DISTINCT_CONDITIONED          l'ancienne ne se pose que « si facette inconnue et
 *                                      utile, jamais à la suite par défaut ».
 * Aucune de ces décisions ne migre une réponse : « PAS_DE_MIGRATION_AUTOMATIQUE » est écrit
 * dans la règle. Une réponse donnée à l'ancienne question reste ce qu'elle est.
 *
 * Les données sont importées du classeur par `scripts/discovery/importer-coexistence.py`,
 * qui vérifie son empreinte et s'arrête sur une décision inconnue.
 */
import brut from './coexistence.json';

export type DecisionCoexistence = 'NEW_PRIMARY' | 'KEEP_DISTINCT_CONDITIONED' | 'ALIAS_OLD_TO_NEW';
interface Donnees {
  sha256_classeur: string;
  branches: { domaine: string; historique: string; prioritaire: string; regle: string }[];
  questions: { ancienne: string; nouvelle: string; decision: DecisionCoexistence; regle: string }[];
}
const D = brut as unknown as Donnees;

/** Ancienne question → celle qui la reprend, et la décision. */
export const REMPLACEMENTS: ReadonlyMap<string, { nouvelle: string; decision: DecisionCoexistence }> =
  new Map(D.questions.map((q) => [q.ancienne, { nouvelle: q.nouvelle, decision: q.decision }] as const));

const POOL = new Map<string, string>(); const PRIORITAIRES = new Set<string>();
for (const b of D.branches) { POOL.set(b.historique, b.domaine); POOL.set(b.prioritaire, b.domaine); PRIORITAIRES.add(b.prioritaire); }
/** Le pool auquel une branche appartient : le domaine commun à ses deux générations, sinon elle-même. */
export const poolDe = (branche: string): string => POOL.get(branche) ?? branche;
/** Vrai pour la génération que le référentiel dit prioritaire. */
export const estPrioritaire = (branche: string): boolean => PRIORITAIRES.has(branche);
export const SHA_CLASSEUR_COEXISTENCE = D.sha256_classeur;

export type VerdictCoexistence =
  | { readonly poser: true }
  | { readonly poser: false; readonly motif: 'remplacee' | 'alias_retire' | 'nouvelle_pas_encore_posee' | 'a_la_suite' | 'facette_deja_connue' | 'facette_indeterminee' };

/**
 * Une question historique peut-elle être proposée D'INITIATIVE ?
 * `facetteInconnue` : vrai si une information qu'elle vise manque encore, faux si tout est
 * connu, `null` si elle ne nomme aucune information (on ne peut pas dire qu'il manque
 * quelque chose : elle n'est alors pas posée).
 */
export function coexistence(
  questionId: string,
  etat: { readonly dejaPosees: ReadonlySet<string>; readonly dernierePosee?: string },
  facetteInconnue: boolean | null,
): VerdictCoexistence {
  const r = REMPLACEMENTS.get(questionId);
  if (!r) return { poser: true };
  if (r.decision === 'NEW_PRIMARY') return { poser: false, motif: 'remplacee' };
  if (r.decision === 'ALIAS_OLD_TO_NEW') return { poser: false, motif: 'alias_retire' };
  if (!etat.dejaPosees.has(r.nouvelle)) return { poser: false, motif: 'nouvelle_pas_encore_posee' };
  if (etat.dernierePosee === r.nouvelle) return { poser: false, motif: 'a_la_suite' };
  if (facetteInconnue === null) return { poser: false, motif: 'facette_indeterminee' };
  return facetteInconnue ? { poser: true } : { poser: false, motif: 'facette_deja_connue' };
}
