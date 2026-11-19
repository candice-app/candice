/**
 * LES CORRESPONDANCES EXPLICITES — tout ce qui relie un NOM à une BRANCHE passe par ici.
 *
 * Jusqu'au 19 nov., ces liens étaient DÉRIVÉS de la banque par des fréquences : un nom désignait
 * une branche s'il y était employé trois fois et à plus du quart de son emploi principal ; le
 * domaine d'une branche était celui que la majorité de ses options écrivaient. Une fréquence
 * n'est pas une preuve : « Couple » désignait ainsi la branche Relation entière, et ajouter une
 * question au classeur pouvait déplacer une correspondance sans que personne ne le décide.
 *
 * Trois fichiers FIGÉS, relus, chacun avec sa source et sa justification :
 *   · noms-officiels.json        le nom officiel de chaque branche et ses règles écrites
 *                                (feuille « Branches » de la Banque V1.1) ;
 *   · correspondances.json       chaque nom qu'une condition écrit → ce qu'il désigne ;
 *   · ouvertures-explicites.json ce qu'une catégorie d'onboarding ou un domaine du journal ouvre.
 * Seules les lignes « etablie » agissent. Une « hypothese » laisse la condition NON RÉSOLUE.
 * Rien ici n'est recalculé depuis la banque : `scripts/discovery/proposer-correspondances.mts`
 * propose, un humain relit, le fichier est figé.
 */
import noms from './correspondances.json';
import officiels from './noms-officiels.json';
import ouvertures from './ouvertures-explicites.json';
import { BANQUE } from './banque';
import { analyserCondition, clef } from './conditions';
import { poolDe } from './coexistence';

export type RegleSousPartie = 'dependance' | 'niveau_B_du_parent' | 'non_resolue';
interface LigneNom { nom: string; type: 'branche' | 'sous_partie'; branches: string[]; statut: 'etablie' | 'hypothese'; critere: string; ouverture?: RegleSousPartie; source: string; justification: string; candidates?: string[]; emplois: Record<string, number> }
const LIGNES = (noms as unknown as { noms: LigneNom[] }).noms;
const OFFICIELS = (officiels as unknown as { branches: { id: string; nom_officiel: string; regles?: Record<string, string | null> }[] }).branches;
const BRANCHES_BANQUE = [...new Set(BANQUE.map((q) => q.branche))];
const EXISTE = new Set(BRANCHES_BANQUE);

/** Le nom officiel sans ses annotations de version (« (refonte V2) », « (V1 — à remplacer au merge) »). */
const sansVersion = (nom: string) => nom.replace(/\s*\((?:refonte[^)]*|V1[^)]*)\)/gi, '').trim();
const NOM_OFFICIEL = new Map(OFFICIELS.map((b) => [b.id, sansVersion(b.nom_officiel)] as const));
/** Les cinq branches de questions paramétriques n'ont pas de nom de sujet. */
const SANS_NOM = new Set(['Questions paramétriques obligatoires']);

// ── 1. NOM → BRANCHES. L'identifiant, le nom officiel, puis la table relue.
const alias = new Map<string, Set<string>>();
const designer = (nom: string, branche: string) => { if (EXISTE.has(branche)) alias.set(nom, new Set([...(alias.get(nom) ?? []), branche])); };
for (const b of BRANCHES_BANQUE) {
  designer(clef(b), b);
  const off = NOM_OFFICIEL.get(b);
  if (off && !SANS_NOM.has(off)) designer(clef(off.replace(/[()]/g, ' ')), b);
}
const sousParties = new Map<string, { regle: RegleSousPartie; parents: readonly string[] }>();
for (const l of LIGNES) {
  if (l.statut !== 'etablie') continue;
  for (const b of l.branches) if (!EXISTE.has(b)) throw new Error(`correspondances.json : « ${l.nom} » désigne « ${b} », absente de la banque — table à relire`);
  if (l.type === 'branche') for (const b of l.branches) designer(l.nom, b);
  else sousParties.set(l.nom, { regle: l.ouverture ?? 'non_resolue', parents: l.branches });
}
/** Nom écrit par une condition → identifiants de branche désignés. Table figée. */
export const ALIAS_BRANCHES: ReadonlyMap<string, ReadonlySet<string>> = alias;
/** Sous-partie → sa branche et la règle qui l'ouvre. */
export const SOUS_PARTIES: ReadonlyMap<string, { readonly regle: RegleSousPartie; readonly parents: readonly string[] }> = sousParties;
/** Les noms que la table tient pour des hypothèses : ils n'ouvrent rien. Pour les rapports. */
export const HYPOTHESES: readonly LigneNom[] = LIGNES.filter((l) => l.statut === 'hypothese');
export const LIGNES_DE_CORRESPONDANCE: readonly LigneNom[] = LIGNES;

// ── 2. UN SEUL DOMAINE VISIBLE. Deux branches s'ouvrent ensemble quand le référentiel les
//       tient pour le même sujet : les deux générations d'un domaine (onglet 13), ou une branche
//       de la refonte et la branche historique de MÊME NOM OFFICIEL (« Chaussures » et shoes,
//       « Food & Gastronomie » et food2). L'égalité des noms d'abord ; à défaut seulement, le
//       nom de la refonte contenu dans un nom officiel (« Learning » dans « Learning — ADN de
//       curiosité »). « THE-06 » est un identifiant de question resté dans la colonne branche :
//       ses deux questions appartiennent à « Théâtre & spectacle vivant » (onglet 5).
const mots = (s: string) => new Set(clef(s).split(/[^a-z0-9]+/).filter((m) => m.length > 2 && m !== 'les' && m !== 'des'));
const REFONTE = BRANCHES_BANQUE.filter((b) => !NOM_OFFICIEL.has(b));
const jumelles = new Map<string, Set<string>>();
const lier = (a: string, b: string) => { jumelles.set(a, new Set([...(jumelles.get(a) ?? []), b])); jumelles.set(b, new Set([...(jumelles.get(b) ?? []), a])); };
for (const r of REFONTE) {
  if (r === 'THE-06') { lier(r, 'Théâtre & spectacle vivant'); continue; }
  const historiques = BRANCHES_BANQUE.filter((b) => NOM_OFFICIEL.has(b));
  const egales = historiques.filter((b) => clef(NOM_OFFICIEL.get(b)!) === clef(r));
  const mr = mots(r);
  const contenues = egales.length ? egales : historiques.filter((b) => { const o = mots(NOM_OFFICIEL.get(b)!); return [...mr].every((m) => o.has(m)) && o.size - mr.size <= 3 && !/avanc/.test(clef(NOM_OFFICIEL.get(b)!)); });
  for (const b of contenues) lier(r, b);
}
/** Les branches qui s'ouvrent AVEC celle-ci : même domaine (onglet 13) ou même nom officiel. */
export function memeSujet(branche: string): readonly string[] {
  const vu = new Set<string>([branche]); const file = [branche];
  while (file.length) {
    const b = file.pop()!;
    const voisines = [...(jumelles.get(b) ?? []), ...BRANCHES_BANQUE.filter((x) => x !== b && poolDe(x) === poolDe(b))];
    for (const v of voisines) if (!vu.has(v)) { vu.add(v); file.push(v); }
  }
  return [...vu];
}
export const JUMELLES: ReadonlyMap<string, ReadonlySet<string>> = jumelles;

// ── 3. LE TAG QU'UNE BRANCHE DE LA REFONTE ATTEND. Ses propres conditions le nomment
//       (`INTEREST.creativity=positive` sur les questions « CRE- ») : quand cette branche est
//       ouverte, c'est ce tag-là qui est vrai. Lu dans ses conditions, pas déduit de ses options.
const tags = new Map<string, Set<string>>();
for (const q of BANQUE) for (const c of analyserCondition(q.condition_emission).clauses) {
  if (c.type === 'tag' && c.operateur === '=' && c.valeur === 'positive' && /^INTEREST\.[a-z_]+$/.test(c.chemin)) {
    tags.set(q.branche, new Set([...(tags.get(q.branche) ?? []), c.chemin]));
  }
}
export const TAGS_ATTENDUS: ReadonlyMap<string, ReadonlySet<string>> = tags;

// ── 4. CE QU'UNE CATÉGORIE D'ONBOARDING, OU UN DOMAINE LU DANS UN TEXTE LIBRE, OUVRE.
interface Ouverture { branches: string[]; statut: string; signaux?: { question: string }[]; orientation?: string[] }
const O = ouvertures as unknown as {
  categories_onboarding: (Ouverture & { id: string; libelle: string })[];
  domaines_journal: (Ouverture & { journal: string })[];
  questions_qui_presument_l_alcool: { questions: { question: string; raison: string }[] };
};
const verifier = (o: Ouverture, qui: string) => {
  for (const b of [...o.branches, ...(o.orientation ?? [])]) if (!EXISTE.has(b)) throw new Error(`ouvertures-explicites.json : ${qui} ouvre « ${b} », absente de la banque`);
  for (const s of o.signaux ?? []) if (!BANQUE.some((q) => q.id === s.question)) throw new Error(`ouvertures-explicites.json : ${qui} signale « ${s.question} », absente de la banque`);
};
const parCategorie = new Map<string, Ouverture>(); const parJournal = new Map<string, Ouverture>();
for (const c of O.categories_onboarding) { verifier(c, c.id); if (c.statut === 'etablie') { parCategorie.set(clef(c.id), c); parCategorie.set(clef(c.libelle), c); } }
for (const d of O.domaines_journal) { verifier(d, d.journal); if (d.statut === 'etablie') { parJournal.set(clef(d.journal), d); parJournal.set(clef(d.journal).replace(/_/g, ' '), d); } }
// `orientation` : branches qu'une catégorie COMPOSITE (« Mode & beauté », « Tech & jeux ») n'ouvre
// que pour leurs questions d'orientation. Elle annonce plusieurs familles et n'en prouve aucune.
const rendre = (o: Ouverture | undefined) => ({ branches: o?.branches ?? [], questions: (o?.signaux ?? []).map((s) => s.question), orientation: o?.orientation ?? [] });
/** Ce qu'ouvre un intérêt écrit sous ce sujet (identifiant de catégorie ou libellé). */
export const ouvertParCategorie = (sujet: string) => rendre(parCategorie.get(clef(sujet)));
/** Ce qu'ouvre un domaine parent du journal (`books_literature`). */
export const ouvertParDomaineJournal = (domaine: string) => rendre(parJournal.get(clef(domaine)));
/** Les questions qui présument que la personne boit de l'alcool. */
export const PRESUMENT_L_ALCOOL: ReadonlySet<string> = new Set(O.questions_qui_presument_l_alcool.questions.map((x) => x.question));
for (const id of PRESUMENT_L_ALCOOL) if (!BANQUE.some((q) => q.id === id)) throw new Error(`ouvertures-explicites.json : question alcool « ${id} » absente de la banque`);

// ── 5. LE NOM QUE LA PERSONNE LIT : le nom officiel, sans ses annotations de version.
/** Le nom lisible d'une branche, ou `null` si le référentiel ne lui en donne pas. */
export function libelleBranche(branche: string): string | null {
  const off = NOM_OFFICIEL.get(branche);
  if (off) return SANS_NOM.has(off) ? null : off;
  // Une branche de la refonte EST son nom (« Fleurs & Plantes ») ; « THE-06 » n'en est pas un.
  return /^[A-ZÀ-Ý][^0-9]*$/.test(branche) ? branche : null;
}
/** Les règles écrites d'une branche (feuille Branches), mot pour mot, ou `null`. */
export function reglesEcrites(branche: string): Record<string, string | null> | null {
  return OFFICIELS.find((b) => b.id === branche)?.regles ?? null;
}
