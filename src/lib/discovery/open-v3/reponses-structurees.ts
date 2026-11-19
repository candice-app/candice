// RÉPONSES STRUCTURÉES — décisions 6 et 7 du 19 nov. (18h54). Voir reponses-structurees.json.
import table from './reponses-structurees.json';
import { BANQUE, type QuestionV3 } from './banque';

const T = table as unknown as {
  groupes_exclusifs: Record<string, Record<string, string[]>>;
  saisies_libres: Record<string, { option: string; fait: string; longueur_max: number; contrat: string }>;
};
const PAR_ID = new Map(BANQUE.map((q) => [q.id, q] as const));
// Vérifié au chargement : chaque libellé cité existe dans la banque.
for (const [id, groupes] of Object.entries(T.groupes_exclusifs)) for (const libs of Object.values(groupes)) for (const l of libs) {
  if (!PAR_ID.get(id)?.options.some((o) => o.libelle === l)) throw new Error(`reponses-structurees.json : « ${l} » absente de ${id}`);
}
for (const [id, s] of Object.entries(T.saisies_libres)) if (!PAR_ID.get(id)?.options.some((o) => o.libelle === s.option)) throw new Error(`reponses-structurees.json : « ${s.option} » absente de ${id}`);

/** Le premier groupe exclusif dont la réponse coche plusieurs options, ou null. */
export function groupeEnConflit(q: QuestionV3, libelles: readonly string[]): string | null {
  for (const [nom, libs] of Object.entries(T.groupes_exclusifs[q.id] ?? {})) if (libelles.filter((l) => libs.includes(l)).length > 1) return nom;
  return null;
}
export const saisieLibreDe = (q: Pick<QuestionV3, 'id'>) => T.saisies_libres[q.id] ?? null;
/** Le groupe exclusif auquel appartient cette option, ou null. */
export function groupeDe(q: Pick<QuestionV3, 'id'>, libelle: string): string | null {
  for (const [nom, libs] of Object.entries(T.groupes_exclusifs[q.id] ?? {})) if (libs.includes(libelle)) return nom;
  return null;
}
