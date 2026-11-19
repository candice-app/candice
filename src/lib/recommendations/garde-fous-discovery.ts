// LES GARDE-FOUS DU DISCOVERY, EN FORME UTILISABLE.
//
// Un garde-fou écrit par le Discovery est stocké sous un chemin technique. Ce module le rend
// sous la forme que la matrice lui donne (scripts/discovery/matrice-garde-fous.mts) : une CIBLE,
// un PÉRIMÈTRE (canaux et domaine), un CRITÈRE, une CONTRAINTE. Et il applique trois règles :
//
//   1. HORS DE SON PÉRIMÈTRE, UN REFUS NE S'APPLIQUE JAMAIS. « Ne m'offrez pas de chaussures »
//      ne concerne que les CADEAUX du domaine CHAUSSURES : ni un autre cadeau, ni une sortie
//      liée à la mode. Le périmètre se vérifie sur des champs déclarés de l'idée, pas sur ses mots.
//   2. DANS SON PÉRIMÈTRE, IL FAUT ENCORE JUGER LE CRITÈRE. Une idée du bon canal et du bon
//      domaine n'est pas forcément ce qui a été refusé (un refus des séances photo n'écarte pas
//      un livre de photographie). Ce jugement n'est jamais un mot partagé : il est rendu par un
//      JUGE, passé par l'appelant. Sans juge, RIEN n'est écarté, et c'est compté.
//   3. UNE CONDITION N'EST PAS UN REFUS. « Oui, si je valide le contenu » n'écarte aucune idée.
//
// La ligne se retrouve par la QUESTION et la RÉPONSE (lues sur la source et la preuve), jamais
// par le chemin stocké : cinq questions différentes écrivent le même chemin
// « memories.gift_openness.a_eviter », et ne refusent pas la même chose.
import matrice from '../discovery/open-v3/garde-fous.json';

export interface GardeFouStructure {
  readonly question: string; readonly libelle: string; readonly domaine: string;
  readonly canaux: readonly string[]; readonly contrainte: 'SOFT' | 'HARD'; readonly nature: 'refus' | 'condition';
  readonly cible: string; readonly critere: string;
}
interface Ligne extends GardeFouStructure { readonly statut: 'traduit' | 'indecidable' }
const LIGNES = (matrice as unknown as { matrice: Ligne[] }).matrice;
const PAR_REPONSE = new Map(LIGNES.map((l) => [`${l.question}|${l.libelle}`, l]));
/** Les domaines de la banque où un garde-fou peut être dit : la liste fermée des catégories d'idée. */
export const CATEGORIES_D_IDEE: readonly string[] = [...new Set(LIGNES.map((l) => l.domaine))].sort();

/** La forme utilisable d'un garde-fou, ou `null` si la ligne est absente ou indécidable. */
export function gardeFouDe(question: string, libelle: string): GardeFouStructure | null {
  const l = PAR_REPONSE.get(`${question}|${libelle}`);
  if (!l || l.statut !== 'traduit') return null;
  return { question: l.question, libelle: l.libelle, domaine: l.domaine, canaux: l.canaux, contrainte: l.contrainte, nature: l.nature, cible: l.cible, critere: l.critere };
}

export interface IdeeJugee { readonly title: string; readonly justification: string; readonly canal: string; readonly categorie?: string | null }
/** Vrai si l'idée PEUT être concernée. Une catégorie non déclarée ne sort pas l'idée du périmètre :
 *  on ne conclut pas « hors sujet » de ce qu'on ignore. */
export function dansLePerimetre(idee: Pick<IdeeJugee, 'canal' | 'categorie'>, g: GardeFouStructure): boolean {
  if (!g.canaux.includes(idee.canal)) return false;
  const c = idee.categorie && CATEGORIES_D_IDEE.includes(idee.categorie) ? idee.categorie : null;
  return c === null || c === g.domaine;
}

/** Pour UNE idée et les critères qui la concernent peut-être : vrai là où l'idée est ce qui a été refusé. */
export type JugeDeGardeFous = (idee: IdeeJugee, criteres: readonly string[]) => Promise<readonly boolean[]>;
export interface BilanGardeFous { ecartees: number; horsPerimetre: number; conditions: number; aJugerSansJuge: number; jugeesNonConcernees: number }

export async function appliquerGardeFous<T extends IdeeJugee>(
  idees: readonly T[], gardeFous: readonly GardeFouStructure[], juge?: JugeDeGardeFous,
): Promise<{ readonly gardees: T[]; readonly bilan: BilanGardeFous }> {
  const bilan: BilanGardeFous = { ecartees: 0, horsPerimetre: 0, conditions: 0, aJugerSansJuge: 0, jugeesNonConcernees: 0 };
  const gardees: T[] = [];
  for (const idee of idees) {
    const concernables: GardeFouStructure[] = [];
    for (const g of gardeFous) {
      if (!dansLePerimetre(idee, g)) { bilan.horsPerimetre++; continue; }
      if (g.nature === 'condition') { bilan.conditions++; continue; }
      concernables.push(g);
    }
    if (concernables.length === 0) { gardees.push(idee); continue; }
    if (!juge) { bilan.aJugerSansJuge += concernables.length; gardees.push(idee); continue; }
    const verdicts = await juge(idee, concernables.map((g) => g.critere));
    // Un juge qui ne rend pas exactement un verdict par critère n'a rien jugé.
    if (verdicts.length !== concernables.length) throw new Error('le juge n’a pas rendu un verdict par critère');
    if (verdicts.some((v) => v === true)) bilan.ecartees++;
    else { bilan.jugeesNonConcernees += concernables.length; gardees.push(idee); }
  }
  return { gardees, bilan };
}
