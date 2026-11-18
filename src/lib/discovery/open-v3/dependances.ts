/**
 * LES DÉPENDANCES ENTRE QUESTIONS — « Sous-branche : manga apprécié (0415) ».
 *
 * Le référentiel écrit, pour les questions d'une sous-partie, de quelle RÉPONSE elles
 * dépendent : le numéro entre parenthèses est la question qui fait le tri (« Quels formats
 * te plaisent vraiment ? »), et le texte nomme l'option qu'il faut y avoir choisie.
 *
 * La première version ne lisait pas cette phrase. Deux effets, relevés le 18 nov. en
 * faisant tourner dix profils :
 *   · le nom de certaines sous-parties (« céramique », « peinture/dessin », « Pratiquant »)
 *     était pris pour un autre nom de la BRANCHE entière : quelqu'un qui dit vouloir apprendre
 *     la reliure se voyait demander « Tu préfères pratiquer la céramique… » ;
 *   · les autres restaient illisibles, donc fermées même après la bonne réponse.
 * Un intérêt général permet d'explorer un domaine ; il ne vaut pas pour chacune de ses
 * sous-catégories. Une sous-partie ne s'ouvre que sur la réponse qui la désigne.
 *
 * LE RAPPROCHEMENT NOM → OPTION EST MÉCANIQUE ET PUBLIÉ. Un mot du référentiel est rapproché
 * d'un mot du libellé de l'option s'ils ont la même racine (pluriel et féminin retirés). Ce qui ne se
 * rapproche d'aucune option reste NON RÉSOLU : la question n'est alors ni ouverte ni fermée,
 * elle est comptée. La table entière est écrite dans `docs/discovery/dependances.json` pour
 * être relue ligne à ligne ; rien ici ne crée de connaissance sur la personne.
 */
import { BANQUE, type QuestionV3 } from './banque';
import { clef } from './conditions';
import { cleOption } from './cle-option';

export interface Dependance {
  /** La question qui fait le tri, dans la même branche. */
  readonly selecteur: string;
  /** Les libellés d'option (forme normalisée) dont UN suffit. Vide = non résolu. Pour relecture. */
  readonly options: readonly string[];
  /** Les mêmes options, par leur identité (`cleOption`) : c'est elle que la progression conserve. */
  readonly cles: readonly string[];
  /** Ce que le référentiel a écrit, tel quel. */
  readonly sujet: string;
  /** Vrai si au moins une option a été rapprochée. */
  readonly resolu: boolean;
  /** La question porte elle-même la référence, ou l'hérite d'une voisine de même nom. */
  readonly origine: 'ecrite' | 'heritee';
}

// Mots qui qualifient la réponse attendue, pas son sujet.
const MOTS_VIDES = new Set(['si', 'ou', 'et', 'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'a', 'au', 'aux', 'en', 'est', 'd', 'l',
  'apprecie', 'appreciee', 'apprecies', 'appreciees', 'pratique', 'pratiquee', 'pratiques', 'pratiquees', 'desire', 'desiree', 'desires', 'desirees',
  'suivi', 'suivie', 'suivis', 'suivies', 'selectionne', 'selectionnee', 'selectionnes', 'selectionnees', 'choisi', 'choisie', 'utilise', 'utilisee',
  'lu', 'lue', 'categorie', 'dominante', 'dominant', 'accepte', 'acceptee', 'principe', 'seulement', 'uniquement', 'pertinent', 'detecte', 'detectee']);
const racine = (m: string) => m.replace(/(?:e?s|x|e)$/, '');
const mots = (s: string) => clef(s).split(/[^a-z0-9]+/).filter((m) => m.length > 1);
// Même racine, et rien de plus souple. Un essai avec « préfixe commun d'au moins sept
// lettres » rapprochait « Pratiquant » de « J'aimerais apprendre ou reprendre une pratique » :
// quelqu'un qui SOUHAITE pratiquer aurait reçu « Quelles activités pratiques-tu réellement
// aujourd'hui ? ». Ce qui ne se rapproche pas exactement reste non résolu.
const memeMot = (a: string, b: string) => racine(a) === racine(b);
/** Les termes que la phrase désigne : « céramique/poterie pratiquée ou désirée » → céramique, poterie. */
function termes(sujet: string): string[][] {
  return clef(sujet).split(/\s*\/\s*|\s+ou\s+|\s*,\s*/).map((t) => mots(t).filter((m) => !MOTS_VIDES.has(m))).filter((t) => t.length > 0);
}

const REF = /\((\d{4}[A-Z]?)\)/;
const SOUS_PARTIE = /(?:^|;\s*)\s*(sous-branche|axe)\s*([^:;(—–]*?)\s*(?::\s*([^;(]*?))?\s*(?:\(|—|–|;|$)/i;

function deriver(banque: readonly QuestionV3[]) {
  const parId = new Map(banque.map((q) => [q.id, q] as const));
  const parQuestion = new Map<string, Dependance>();
  const parNom = new Map<string, Dependance>();           // « branche|nom » → dépendance écrite
  const ecrites: { branche: string; racines: Set<string>; dep: Dependance }[] = [];
  for (const q of banque) {
    const sp = q.condition_emission.match(SOUS_PARTIE);
    const ref = q.condition_emission.match(REF);
    if (!sp || !ref) continue;
    const nom = clef(sp[2] ?? ''), detail = (sp[3] ?? '').trim();
    const selecteur = `${q.branche}.${ref[1]}`;
    const cible = parId.get(selecteur);
    // Le NOM désigne le sujet quand il y en a un (« Soins corps : si catégorie choisie ») ;
    // sinon c'est le détail (« : manga apprécié »).
    const sujet = nom || detail;
    const voulus = termes(sujet);
    const retenues = !cible ? [] : cible.options.filter((o) => {
      const lib = mots(o.libelle);
      return voulus.some((t) => t.every((m) => lib.some((l) => memeMot(m, l))));
    });
    const options = retenues.map((o) => clef(o.libelle));
    const dep: Dependance = { selecteur, options, cles: retenues.map(cleOption), sujet: norme(sp[0]), resolu: options.length > 0, origine: 'ecrite' };
    parQuestion.set(q.id, dep);
    if (nom) parNom.set(`${q.branche}|${sp[1].toLowerCase()}|${nom}`, dep);
    ecrites.push({ branche: q.branche, racines: new Set(voulus.flat().map(racine)), dep });
  }
  // Les questions suivantes d'une sous-partie nommée répètent le nom sans la référence
  // (« Axe Pratiquant (0614) », puis « Axe Pratiquant ») : elles en héritent.
  for (const q of banque) {
    if (parQuestion.has(q.id)) continue;
    const sp = q.condition_emission.match(SOUS_PARTIE);
    if (!sp) continue;
    // … ou reprennent en NOM ce que la première écrivait en détail (« Sous-branche :
    // céramique/poterie pratiquée ou désirée (0615) », puis « Sous-branche céramique ») :
    // tous les mots du nom doivent se retrouver dans UNE SEULE dépendance écrite de la branche.
    const nomHeritier = clef(sp[2] ?? '');
    const motsNom = termes(nomHeritier).flat().map(racine);
    const candidates = motsNom.length === 0 ? [] : ecrites.filter((e) => e.branche === q.branche && motsNom.every((m) => e.racines.has(m)));
    const dep = parNom.get(`${q.branche}|${sp[1].toLowerCase()}|${nomHeritier}`) ?? (candidates.length === 1 ? candidates[0].dep : undefined);
    if (dep && dep.selecteur !== q.id) parQuestion.set(q.id, { ...dep, origine: 'heritee' });
  }
  return parQuestion;
}
function norme(s: string) { return s.replace(/^;\s*/, '').replace(/[(—–;]\s*$/, '').replace(/\s+/g, ' ').trim(); }

/** Question → la réponse dont elle dépend. Absente d'ici = aucune dépendance écrite. */
export const DEPENDANCES: ReadonlyMap<string, Dependance> = deriver(BANQUE);
/** Les questions qui font le tri : leurs réponses doivent être relues pour évaluer les autres. */
export const SELECTEURS: ReadonlySet<string> = new Set([...DEPENDANCES.values()].map((d) => d.selecteur));

/**
 * LA CONDITION D'UNE SOUS-PARTIE EST ÉCRITE UNE FOIS, SUR SA PREMIÈRE QUESTION.
 *
 * « Sous-branche Couple : uniquement si un partenaire existe ET si la personne accepte
 * d'enrichir cette dimension », puis trois questions qui disent seulement « Sous-branche
 * Couple ». La première version lisait chacune isolément : la première était illisible, donc
 * fermée ; les suivantes, réduites à un nom, s'ouvraient avec la branche — et demandaient
 * « Le romantisme, pour toi… » à quelqu'un dont on ne sait pas s'il a un partenaire.
 *
 * Une question qui ne porte que le nom de sa sous-partie hérite donc de la condition de la
 * question qui l'ouvre. Si cette condition n'est pas comprise, toute la sous-partie reste non
 * résolue. Une sous-partie dont la première question ne porte elle-même que le nom est un
 * regroupement éditorial : elle suit sa branche, comme avant.
 */
const NOM_SEUL = /^\s*(sous-branche|axe)\s+([^:;(—–]+?)\s*(?:[—–]\s*(?:sensitivity\s*:\s*\w+|facultative|tr[èe]s optionnelle|askable_about_other\s*=\s*\w+)\s*)*$/i;
const EN_TETE = /^\s*(sous-branche|axe)\s+([^:;(—–]+?)\s*(?:[:(—–]|$)/i;
function deriverTetes(banque: readonly QuestionV3[]) {
  const premiere = new Map<string, QuestionV3>();
  for (const q of banque) {
    const m = q.condition_emission.match(EN_TETE);
    if (!m) continue;
    const k = `${q.branche}|${m[1].toLowerCase()}|${clef(m[2])}`;
    if (!premiere.has(k)) premiere.set(k, q);
  }
  const tetes = new Map<string, string>();
  for (const q of banque) {
    const m = q.condition_emission.match(NOM_SEUL);
    if (!m) continue;
    const tete = premiere.get(`${q.branche}|${m[1].toLowerCase()}|${clef(m[2])}`);
    if (tete && tete.id !== q.id && !NOM_SEUL.test(tete.condition_emission)) tetes.set(q.id, tete.id);
  }
  return tetes;
}
/** Question qui ne porte que le nom de sa sous-partie → la question dont elle hérite la condition. */
export const TETES_DE_SOUS_PARTIE: ReadonlyMap<string, string> = deriverTetes(BANQUE);
