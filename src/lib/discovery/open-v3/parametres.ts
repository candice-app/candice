/**
 * LES PARAMÈTRES D'ÉNONCÉ — « Pour {occasion}, quelles façons de célébrer te feraient plaisir ? ».
 *
 * Un paramètre n'est rempli que depuis sa SOURCE AUTORISÉE, écrite dans la table
 * (`parametres.json`, établie depuis les conditions des questions et l'onglet 12). Trois sources
 * exécutables : une entité déclarée (D9), un référent d'activité déclaré (20 nov.), et une PRÉPARATION EN COURS que la personne a déclarée et nommée :
 * son objet est la valeur du paramètre, la réponse lui appartient, et elle cesse de valoir quand
 * la préparation se termine. Sans valeur établie, la question n'est pas proposée : jamais une
 * accolade à l'écran, jamais une valeur supposée.
 */
import table from './parametres.json';
import { BANQUE, type QuestionV3 } from './banque';
import type { EtatDiscovery, TypeDeProjet } from './conditions';
import { poolDe } from './coexistence';

export interface Parametre {
  readonly question: string; readonly parametre: string; readonly source: 'projet' | 'entite' | 'activite' | 'non_etablie'; readonly genre?: TypeDeProjet;
  readonly statut: 'executable' | 'source_non_etablie'; readonly consulte: string; readonly manque?: string;
}
const LIGNES = (table as unknown as { parametres: Parametre[] }).parametres;
export const PARAMETRES: ReadonlyMap<string, Parametre> = new Map(LIGNES.map((l) => [l.question, l]));
const ACCOLADE = /\{([^}]+)\}/g;
export const parametresDe = (q: QuestionV3): string[] => [...q.enonce.matchAll(ACCOLADE)].map((m) => m[1]);

// La table couvre EXACTEMENT les questions à paramètre de la banque, et nomme le bon paramètre.
for (const q of BANQUE) {
  const ps = parametresDe(q); const l = PARAMETRES.get(q.id);
  if (ps.length === 0) { if (l) throw new Error(`parametres.json : ${q.id} n'a pas de paramètre dans son énoncé`); continue; }
  if (!l) throw new Error(`parametres.json : ${q.id} porte {${ps.join('}, {')}} et n'a pas de ligne`);
  if (ps.length !== 1 || ps[0] !== l.parametre) throw new Error(`parametres.json : ${q.id} porte {${ps.join('}, {')}}, la table dit {${l.parametre}}`);
}

/** Le genre de préparation qui remplit le paramètre de cette question, ou `null` si sa source n'est pas établie. */
export function genreQuiRemplit(q: QuestionV3): TypeDeProjet | null {
  const l = PARAMETRES.get(q.id);
  return l && l.statut === 'executable' && l.source === 'projet' && l.genre ? l.genre : null;
}
/** La valeur du paramètre pour cette personne, maintenant — ou `null` : rien n'est supposé. */
export function valeurDuParametre(q: QuestionV3, etat: Pick<EtatDiscovery, 'objetsDeProjet' | 'entiteParQuestion'>): string | null {
  // D9 : une question à propos d'une entité est remplie par CETTE entité (entites.ts).
  const entite = etat.entiteParQuestion?.get(q.id);
  if (entite) return entite.libelle;
  const genre = genreQuiRemplit(q);
  if (!genre) return null;
  const v = etat.objetsDeProjet?.get(`${poolDe(q.branche)}|${genre}`)?.trim();
  return v ? v : null;
}
/** L'énoncé tel qu'il sera lu. LÈVE si une accolade resterait : on ne sert jamais un gabarit. */
export function enonceRempli(q: QuestionV3, etat: Pick<EtatDiscovery, 'objetsDeProjet' | 'entiteParQuestion'>): string {
  if (parametresDe(q).length === 0) return q.enonce;
  const v = valeurDuParametre(q, etat);
  if (!v) throw new Error(`« ${q.id} » : paramètre sans valeur établie — la question ne doit pas être servie`);
  // « Pour Les 40 ans de Thibaud » : l'objet est inséré tel que la personne l'a écrit, la
  // majuscule initiale d'un article ramenée en minuscule au milieu de la phrase.
  const milieu = v.replace(/^(Le|La|Les|L’|L'|Un|Une|Des|Mon|Ma|Mes|Notre|Nos)(\s|’|')/, (m) => m.toLowerCase());
  return q.enonce.replace(ACCOLADE, (_, __, pos: number) => (pos === 0 ? v : milieu));
}
