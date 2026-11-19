/**
 * UNE SEULE QUESTION PAR INTENTION — décision D7 d'Estelle (19 nov.).
 *
 * `equivalences-d-intention.json` déclare, à la main, les groupes de questions qui demandent la
 * même chose (même intention, même objet, même portée), leur version CANONIQUE, et pour chaque
 * autre membre si la réponse est réutilisable (« identique », vérifié ici au mot près) ou non
 * (« echelle_differente »).
 *
 * Deux règles, et seulement deux :
 *   1. une question est RENSEIGNÉE dès qu'elle, ou un membre IDENTIQUE, a une réponse ;
 *   2. une question non canonique n'est pas posée tant que la canonique a une réponse ou peut
 *      être posée. Une ancienne réponse à échelle différente ne dispense pas de la canonique.
 */
import table from './equivalences-d-intention.json';
import { BANQUE } from './banque';

interface Membre { id: string; equivalence: 'identique' | 'echelle_differente'; justification: string }
interface Groupe { intention: string; canonique: string; membres: Membre[] }
const T = table as unknown as { groupes: Groupe[] };
const PAR_ID = new Map(BANQUE.map((q) => [q.id, q] as const));
// Les libellés sont comparés à l'apostrophe près (’ ou ') : la même option, deux typographies.
const options = (id: string) => (PAR_ID.get(id)?.options ?? []).map((o) => o.libelle.replace(/’/g, "'").replace(/\s+/g, ' ').trim()).join('|');

export interface Appartenance { readonly groupe: Groupe; readonly canonique: boolean; readonly identiques: readonly string[] }
const APPARTENANCE = new Map<string, Appartenance>();
for (const g of T.groupes) {
  for (const id of [g.canonique, ...g.membres.map((m) => m.id)]) {
    if (!PAR_ID.has(id)) throw new Error(`equivalences-d-intention.json : ${id} absente de la banque`);
    if (APPARTENANCE.has(id)) throw new Error(`equivalences-d-intention.json : ${id} dans deux groupes`);
  }
  for (const m of g.membres) if (m.equivalence === 'identique' && options(m.id) !== options(g.canonique)) {
    throw new Error(`equivalences-d-intention.json : ${m.id} déclarée identique à ${g.canonique}, mais leurs options diffèrent`);
  }
  const identiques = [g.canonique, ...g.membres.filter((m) => m.equivalence === 'identique').map((m) => m.id)];
  APPARTENANCE.set(g.canonique, { groupe: g, canonique: true, identiques });
  for (const m of g.membres) APPARTENANCE.set(m.id, { groupe: g, canonique: false, identiques: m.equivalence === 'identique' ? identiques : [m.id] });
}
export const appartenance = (id: string): Appartenance | undefined => APPARTENANCE.get(id);
export const GROUPES_D_INTENTION: readonly Groupe[] = T.groupes;
