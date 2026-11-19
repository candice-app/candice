/**
 * LES CONTRATS DES QUESTIONS OUVERTES — onglet 9_CONTRATS_OUVERTS (colonnes `_v2`, « seules
 * exécutables : elles font autorité ») et onglet 17_DESTINATIONS_CONDITIONNELLES.
 *
 * Une question ouverte dit, dans son contrat, quelle relation une entité nommée peut y
 * recevoir. « Quels détails de chaussures veux-tu éviter ? » n'admet que DISLIKE et AVOID :
 * si le modèle y lisait un LIKE, ce serait écrire l'inverse de ce que la question demande.
 * La première version transmettait au modèle la barrière en prose et écrivait ensuite la
 * relation qu'il rendait, quelle qu'elle soit. La relation est désormais vérifiée APRÈS la
 * lecture, par le code : une relation hors contrat n'est jamais écrite comme une entité —
 * les mots de la personne restent, eux, conservés tels quels.
 *
 * LES QUINZE DESTINATIONS CONDITIONNELLES de l'onglet 17 sont exécutées par `destinations.ts` :
 * les neuf questions concernées ne passent plus par le contrat général. Onze destinations ne
 * peuvent pas s'écrire en l'état (stabilité « undetermined » refusée par le journal, entité à
 * résoudre de façon unique, identifiant d'animal) : la règle du contrat s'applique alors —
 * « verbatim seul » — et le motif est rendu.
 *
 * Données importées par `scripts/discovery/importer-contrats-ouverts.py` (empreinte vérifiée).
 */
import brut from './contrats-ouverts.json';

export interface ContratOuvert {
  readonly question: string;
  readonly statut: 'ACTIF_VERBATIM_ET_EXTRACTION_CONDITIONNELLE' | 'ARCHIVE_NON_EXECUTABLE';
  readonly polarite: string;
  readonly type_entite: string | null;
  readonly relations_admissibles: readonly string[];
  readonly relations_interdites: readonly string[];
  readonly inferences_interdites: string | null;
  readonly permissions: string | null;
}
interface Donnees { contrats: ContratOuvert[]; destinations_conditionnelles: Record<string, string | null>[] }
const D = brut as unknown as Donnees;

export const CONTRATS_OUVERTS: ReadonlyMap<string, ContratOuvert> = new Map(D.contrats.map((c) => [c.question, c] as const));
/** Questions que le référentiel a archivées : ni servies, ni lues. */
export const OUVERTES_ARCHIVEES: ReadonlySet<string> = new Set(D.contrats.filter((c) => c.statut === 'ARCHIVE_NON_EXECUTABLE').map((c) => c.question));
/** Destinations conditionnelles de l'onglet 17, telles qu'importées (exécution : destinations.ts). */
export const DESTINATIONS_CONDITIONNELLES: readonly Record<string, string | null>[] = D.destinations_conditionnelles;

/**
 * Les relations qu'une entité peut recevoir dans la réponse à cette question, ou `undefined`
 * si la question n'a pas de contrat dans l'onglet 9 (le contrat général s'applique alors).
 */
export function relationsAdmises(questionId: string): readonly string[] | undefined {
  const c = CONTRATS_OUVERTS.get(questionId);
  return c ? c.relations_admissibles : undefined;
}
