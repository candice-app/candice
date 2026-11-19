// LES GARDE-FOUS DU DISCOVERY, COMPARÉS CÔTÉ SERVEUR — décision D1 d'Estelle (19 nov., 17h43).
//
// Un garde-fou déclaré par le proche n'entre JAMAIS dans un prompt. On procède en deux temps :
//
//   1. QUALIFIER L'IDÉE. Un modèle peut décrire l'idée, mais il ne reçoit que l'idée et la
//      TAXONOMIE publique (garde-fous-comparables.json) : des domaines, des dimensions (une par
//      question de la banque) et leurs valeurs possibles, les mêmes pour tout le monde. Il ne voit
//      ni le proche, ni ses réponses, ni aucun refus. Sa description est VÉRIFIÉE (valeurs dans
//      les listes, rien d'inventé) et elle peut rester « indéterminée ».
//   2. COMPARER, ICI. Chaque garde-fou a un mode (valeur, catégorie, manière, réserve, condition)
//      et un périmètre (canaux, domaine). La comparaison se fait champ à champ. Jamais un mot
//      partagé, jamais le chemin technique.
//
// Ce qui en sort, pour chaque idée :
//   · une restriction HARD atteinte          → l'idée est écartée ;
//   · une restriction HARD NON VÉRIFIABLE     → l'idée est écartée aussi : on ne la présente pas
//     (description indéterminée, réserve, condition non remplie, ligne résistante)   comme compatible ;
//   · une préférence SOFT atteinte           → l'idée est gardée, RÉTROGRADÉE (après les autres) ;
//   · un doute sur une préférence SOFT        → gardée ; compatibilité non vérifiée, et dite telle ;
//   · rien de tout cela                       → compatible VÉRIFIÉE.
// Une idée hors du périmètre d'un garde-fou n'est jamais concernée par lui : « ne m'offrez pas de
// chaussures » ne touche ni un livre, ni une sortie liée à la mode.
import matrice from '../discovery/open-v3/garde-fous.json';
import comparables from '../discovery/open-v3/garde-fous-comparables.json';

export interface GardeFouStructure {
  readonly question: string; readonly libelle: string; readonly domaine: string;
  readonly canaux: readonly string[]; readonly contrainte: 'SOFT' | 'HARD'; readonly nature: 'refus' | 'condition';
  readonly cible: string; readonly critere: string;
}
interface Ligne extends GardeFouStructure { readonly statut: 'traduit' | 'indecidable' }
const LIGNES = (matrice as unknown as { matrice: Ligne[] }).matrice;
const PAR_REPONSE = new Map(LIGNES.map((l) => [`${l.question}|${l.libelle}`, l]));

type Mode = 'valeur' | 'categorie' | 'maniere' | 'reserve' | 'condition' | 'resistant';
interface LigneComparable {
  readonly question: string; readonly libelle: string; readonly domaine: string; readonly canaux: readonly string[];
  readonly contrainte: 'SOFT' | 'HARD'; readonly nature: 'refus' | 'condition'; readonly mode: Mode;
  readonly dimension?: string; readonly valeurs?: readonly string[]; readonly portee?: 'domaine' | 'toutes';
  readonly motif?: string; readonly exemple?: string;
}
interface Dimension { readonly id: string; readonly domaine: string; readonly intitule: string; readonly valeurs: readonly string[] }
const C = comparables as unknown as {
  domaines: string[]; universelles: Record<string, { intitule: string; valeurs: string[] }>; dimensions: Dimension[]; lignes: LigneComparable[];
};
const COMPARABLE = new Map(C.lignes.map((l) => [`${l.question}|${l.libelle}`, l]));
const DIMENSIONS_PAR_DOMAINE = C.dimensions.reduce((m, d) => m.set(d.domaine, [...(m.get(d.domaine) ?? []), d]), new Map<string, Dimension[]>());
const DIMENSION = new Map(C.dimensions.map((d) => [d.id, d]));

/** Les domaines de la banque où un garde-fou peut être dit : la liste fermée des catégories d'idée. */
export const CATEGORIES_D_IDEE: readonly string[] = C.domaines;

/** La forme utilisable d'un garde-fou, ou `null` si la ligne est absente ou indécidable dans la matrice. */
export function gardeFouDe(question: string, libelle: string): GardeFouStructure | null {
  const l = PAR_REPONSE.get(`${question}|${libelle}`);
  if (!l || l.statut !== 'traduit') return null;
  return { question: l.question, libelle: l.libelle, domaine: l.domaine, canaux: l.canaux, contrainte: l.contrainte, nature: l.nature, cible: l.cible, critere: l.critere };
}

// ─── 1. La taxonomie publique, et la qualification vérifiée d'une idée ───────────────────────

export interface IdeeJugee { readonly title: string; readonly justification: string; readonly canal: string; readonly categorie?: string | null }
export type Etat = 'etabli' | 'indetermine';
export interface QualificationIdee {
  readonly domaines: { readonly valeurs: readonly string[]; readonly etat: Etat };
  readonly universelles: Readonly<Record<string, { readonly valeur: 'oui' | 'non' | null; readonly etat: Etat }>>;
  readonly dimensions: Readonly<Record<string, { readonly valeurs: readonly string[]; readonly etat: Etat | 'non_applicable' }>>;
}
/** Ce qu'un qualificateur reçoit. La même chose pour TOUS les proches : aucune donnée de personne. */
export interface Taxonomie {
  readonly domaines: readonly string[];
  readonly universelles: Readonly<Record<string, { readonly intitule: string; readonly valeurs: readonly string[] }>>;
  readonly dimensions: readonly Dimension[];
}
/** Étape 1 : domaines et manières, pour toutes les idées. */
export function taxonomieGenerale(): Taxonomie { return { domaines: C.domaines, universelles: C.universelles, dimensions: [] }; }
/** Étape 2 : TOUTES les dimensions des domaines donnés — pas seulement celles qu'un proche a refusées. */
export function taxonomieDesDomaines(domaines: readonly string[]): Taxonomie {
  return { domaines: [], universelles: {}, dimensions: [...new Set(domaines)].flatMap((d) => DIMENSIONS_PAR_DOMAINE.get(d) ?? []) };
}
/** Le qualificateur : l'idée, la taxonomie, rien d'autre. Rend une description brute, vérifiée ensuite. */
export type QualificateurIdees = (
  idees: readonly Pick<IdeeJugee, 'title' | 'justification' | 'canal'>[], taxonomie: Taxonomie,
) => Promise<readonly unknown[]>;

const objet = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' ? x as Record<string, unknown> : {});
/** Ne garde que ce que la taxonomie permet ; tout le reste devient « indéterminé ». */
export function verifierQualification(brutGeneral: unknown, brutDimensions: unknown, dimensionsAttendues: readonly Dimension[]): QualificationIdee {
  const g = objet(brutGeneral), d = objet(brutDimensions);
  const doms = objet(g.domaines);
  const valeursDom = (Array.isArray(doms.valeurs) ? doms.valeurs : []).filter((v): v is string => typeof v === 'string' && C.domaines.includes(v));
  const domaines = { valeurs: valeursDom, etat: (doms.etat === 'etabli' && valeursDom.length > 0 ? 'etabli' : 'indetermine') as Etat };
  const universelles: Record<string, { valeur: 'oui' | 'non' | null; etat: Etat }> = {};
  const u = objet(g.universelles);
  for (const k of Object.keys(C.universelles)) {
    const x = objet(u[k]);
    const v = x.valeur === 'oui' || x.valeur === 'non' ? x.valeur : null;
    universelles[k] = v && x.etat === 'etabli' ? { valeur: v, etat: 'etabli' } : { valeur: null, etat: 'indetermine' };
  }
  const dimensions: Record<string, { valeurs: string[]; etat: Etat | 'non_applicable' }> = {};
  for (const dim of dimensionsAttendues) {
    const x = objet(d[dim.id]);
    const vals = (Array.isArray(x.valeurs) ? x.valeurs : []).filter((v): v is string => typeof v === 'string' && dim.valeurs.includes(v));
    if (x.etat === 'non_applicable') dimensions[dim.id] = { valeurs: [], etat: 'non_applicable' };
    else if (x.etat === 'etabli' && (vals.length > 0 || (Array.isArray(x.valeurs) && x.valeurs.length === 0))) dimensions[dim.id] = { valeurs: vals, etat: 'etabli' };
    else dimensions[dim.id] = { valeurs: [], etat: 'indetermine' };
  }
  return { domaines, universelles, dimensions };
}

// ─── 2. La comparaison, ici ──────────────────────────────────────────────────────────────────

export type Verdict = 'compatible_verifiee' | 'compatible_avec_doute_soft' | 'retrogradee' | 'ecartee_hard' | 'ecartee_non_verifiee';
type Issue = 'hors_perimetre' | 'atteint' | 'doute' | 'respecte';

function issue(idee: Pick<IdeeJugee, 'canal' | 'categorie'>, q: QualificationIdee, g: GardeFouStructure): Issue {
  if (!g.canaux.includes(idee.canal)) return 'hors_perimetre';
  const l = COMPARABLE.get(`${g.question}|${g.libelle}`);
  if (!l) return 'doute';
  if (l.portee !== 'toutes') {
    // Le domaine de l'idée : ce que la description établit, plus la catégorie que l'idée déclare.
    const doms = new Set([...q.domaines.valeurs, ...(idee.categorie && C.domaines.includes(idee.categorie) ? [idee.categorie] : [])]);
    if (!doms.has(l.domaine)) return q.domaines.etat === 'etabli' ? 'hors_perimetre' : 'doute';
  }
  switch (l.mode) {
    case 'categorie': return 'atteint';
    case 'reserve': case 'resistant': return 'doute';
    case 'condition': return 'doute';
    case 'maniere': {
      const u = q.universelles[l.dimension!];
      if (!u || u.etat !== 'etabli') return 'doute';
      return l.valeurs!.includes(u.valeur!) ? 'atteint' : 'respecte';
    }
    case 'valeur': {
      const d = q.dimensions[l.dimension!];
      if (!d || d.etat === 'indetermine') return 'doute';
      if (d.etat === 'non_applicable') return 'respecte';
      return d.valeurs.some((v) => l.valeurs!.includes(v)) ? 'atteint' : 'respecte';
    }
  }
}

export interface Comparaison { readonly verdict: Verdict; readonly hardAtteints: number; readonly hardDoutes: number; readonly softAtteints: number; readonly softDoutes: number; readonly horsPerimetre: number }
export function comparer(idee: Pick<IdeeJugee, 'canal' | 'categorie'>, q: QualificationIdee, gardeFous: readonly GardeFouStructure[]): Comparaison {
  const c = { hardAtteints: 0, hardDoutes: 0, softAtteints: 0, softDoutes: 0, horsPerimetre: 0 };
  for (const g of gardeFous) {
    const i = issue(idee, q, g);
    if (i === 'hors_perimetre') { c.horsPerimetre++; continue; }
    // Une condition SOFT n'écarte ni ne rétrograde rien : « oui, si… » n'est pas un refus.
    if (g.nature === 'condition' && g.contrainte === 'SOFT') continue;
    if (i === 'atteint') { if (g.contrainte === 'HARD') c.hardAtteints++; else c.softAtteints++; }
    else if (i === 'doute') { if (g.contrainte === 'HARD') c.hardDoutes++; else c.softDoutes++; }
  }
  const verdict: Verdict = c.hardAtteints > 0 ? 'ecartee_hard' : c.hardDoutes > 0 ? 'ecartee_non_verifiee'
    : c.softAtteints > 0 ? 'retrogradee' : c.softDoutes > 0 ? 'compatible_avec_doute_soft' : 'compatible_verifiee';
  return { verdict, ...c };
}

export interface BilanGardeFous {
  compatiblesVerifiees: number; compatiblesAvecDouteSoft: number; retrogradees: number;
  ecarteesHard: number; ecarteesNonVerifiees: number; qualificationEchouee: boolean;
}
/** Qualifie puis compare. Rend les idées gardées (compatibles d'abord, rétrogradées ensuite) et
 *  des COMPTES — aucun libellé : dire au pilote pourquoi une idée manque trahirait le proche. */
export async function appliquerGardeFous<T extends IdeeJugee>(
  idees: readonly T[], gardeFous: readonly GardeFouStructure[], qualifier: QualificateurIdees | undefined,
): Promise<{ readonly gardees: (T & { compatibilite: Verdict })[]; readonly bilan: BilanGardeFous }> {
  const bilan: BilanGardeFous = { compatiblesVerifiees: 0, compatiblesAvecDouteSoft: 0, retrogradees: 0, ecarteesHard: 0, ecarteesNonVerifiees: 0, qualificationEchouee: false };
  let generales: readonly unknown[] = [], parDimension: readonly unknown[] = [];
  let attendues: Dimension[][] = idees.map(() => []);
  if (qualifier && idees.length > 0) {
    try {
      generales = await qualifier(idees.map(({ title, justification, canal }) => ({ title, justification, canal })), taxonomieGenerale());
      // Étape 2 : les dimensions de TOUS les domaines où l'idée peut se trouver.
      attendues = idees.map((idee, i) => {
        const v = objet(objet(generales[i]).domaines).valeurs;
        const doms = [...(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []), ...(idee.categorie ? [idee.categorie] : [])];
        return taxonomieDesDomaines(doms).dimensions as Dimension[];
      });
      const toutes = [...new Map(attendues.flat().map((d) => [d.id, d])).values()];
      parDimension = toutes.length > 0 ? await qualifier(idees.map(({ title, justification, canal }) => ({ title, justification, canal })), { domaines: [], universelles: {}, dimensions: toutes }) : idees.map(() => ({}));
    } catch { bilan.qualificationEchouee = true; generales = []; parDimension = []; }
  } else bilan.qualificationEchouee = true;
  const compatibles: (T & { compatibilite: Verdict })[] = [], retrogradees: (T & { compatibilite: Verdict })[] = [];
  idees.forEach((idee, i) => {
    // Sans qualification, tout est indéterminé : les restrictions HARD du périmètre ne sont pas vérifiées.
    const q = verifierQualification(generales[i], parDimension[i], attendues[i]);
    const { verdict } = comparer(idee, q, gardeFous);
    const avec = { ...idee, compatibilite: verdict };
    if (verdict === 'ecartee_hard') bilan.ecarteesHard++;
    else if (verdict === 'ecartee_non_verifiee') bilan.ecarteesNonVerifiees++;
    else if (verdict === 'retrogradee') { bilan.retrogradees++; retrogradees.push(avec); }
    else { if (verdict === 'compatible_verifiee') bilan.compatiblesVerifiees++; else bilan.compatiblesAvecDouteSoft++; compatibles.push(avec); }
  });
  return { gardees: [...compatibles, ...retrogradees], bilan };
}

/** Les lignes que cette approche ne sait pas comparer, avec leur motif et un exemple (rapport). */
export const LIGNES_RESISTANTES = C.lignes.filter((l) => l.mode === 'resistant');
