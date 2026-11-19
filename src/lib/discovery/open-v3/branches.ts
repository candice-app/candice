// LES NOMS DE BRANCHE — façade historique. Tout vient désormais de la table figée et relue
// (`correspondances.ts`). Les seuils de fréquence qui décidaient ici (trois emplois, un quart de
// l'emploi principal, domaine majoritaire d'une branche) ont été retirés le 19 nov. : ils ne
// servent plus qu'à PROPOSER des candidats (`scripts/discovery/proposer-correspondances.mts`).
import { BANQUE } from './banque';
import { ALIAS_BRANCHES, libelleBranche, ouvertParDomaineJournal, memeSujet } from './correspondances';

export { ALIAS_BRANCHES, libelleBranche };

/** Les branches qu'ouvre un domaine parent du journal — table explicite, lignes établies seulement. */
export function branchesDuDomaineJournal(domaine: string): string[] {
  return [...new Set(ouvertParDomaineJournal(domaine).branches.flatMap((b) => memeSujet(b)))];
}

/** Toutes les branches nommées, pour un choix de sujets. */
export function branchesNommees(): { branche: string; libelle: string }[] {
  return [...new Set(BANQUE.map((q) => q.branche))].map((branche) => ({ branche, libelle: libelleBranche(branche) }))
    .filter((x): x is { branche: string; libelle: string } => x.libelle !== null)
    .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
}
