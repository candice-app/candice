/**
 * LES LECTURES DE CONDITIONS — quand le référentiel écrit une condition en prose.
 *
 * « Si festivals appréciés (0475) », « Cadeau de transmission », « Sous-branche : catégorie
 * Cabas choisie » : le moteur ne sait pas lire ces phrases, et la question restait NON RÉSOLUE.
 * `lectures-de-conditions.json` (produit par scripts/discovery/lectures-de-conditions.py, relu,
 * figé) en donne une lecture dans le vocabulaire exécuté :
 *
 *     « Réponse à live.0475 : Festival »
 *
 * Seules les lignes « etablie » agissent. Vérifié AU CHARGEMENT, et bruyamment :
 *   · la condition d'origine recopiée doit être exactement celle de la banque — si le classeur
 *     change, la lecture n'est plus la bonne, et on ne la sert pas ;
 *   · une condition sensible n'a jamais de lecture (sa garde reste entière) ;
 *   · la lecture est entièrement comprise par le moteur ;
 *   · chaque option citée existe, et son identité (`cleOption`) est résolue ici.
 * Une lecture remplace la condition de la question, et celle dont elle héritait par le nom de
 * sa sous-partie : la ligne relue est la lecture complète.
 */
import table from './lectures-de-conditions.json';
import { BANQUE, type QuestionV3 } from './banque';
import { analyserCondition, clef, type Clause, type ConditionAnalysee } from './conditions';
import { cleOption } from './cle-option';

interface Ligne { question: string; origine: string; lue: string; statut: 'etablie'; critere: string; justification: string; non_repris: string[] }
interface NonLue { question: string; origine: string; statut: 'hypothese' | 'sans_lecture'; manque: string; choix?: string[] }
const T = table as unknown as { version: string; lectures: Ligne[]; non_lues: NonLue[] };

const PAR_ID = new Map(BANQUE.map((q) => [q.id, q] as const));
const espaces = (s: string) => s.replace(/\s+/g, ' ').trim();
// Une parenthèse est retirée par la lecture des conditions (« Confirmé(e) » → « Confirmé ») :
// on compare donc les libellés sans parenthèses, de part et d'autre.
const forme = (s: string) => clef(s.replace(/\([^)]*\)/g, ' ').replace(/[’']/g, "'")).replace(/\s+/g, ' ').trim();

function resoudre(c: Clause, question: string): Clause {
  if (c.type !== 'reponse') return c;
  const sel = PAR_ID.get(c.selecteur);
  if (!sel) throw new Error(`lectures-de-conditions.json : ${question} cite ${c.selecteur}, absente de la banque`);
  const cles = c.libelles.map((l) => {
    const trouvees = sel.options.filter((o) => forme(o.libelle) === forme(l));
    if (trouvees.length !== 1) throw new Error(`lectures-de-conditions.json : ${question} cite « ${l} » à ${c.selecteur} — ${trouvees.length} option(s) correspondante(s), il en faut une`);
    return cleOption(trouvees[0]);
  });
  return { ...c, cles };
}

function charger(): Map<string, { ligne: Ligne; analyse: ConditionAnalysee }> {
  const m = new Map<string, { ligne: Ligne; analyse: ConditionAnalysee }>();
  for (const l of T.lectures) {
    if (l.statut !== 'etablie') continue;
    const q = PAR_ID.get(l.question);
    if (!q) throw new Error(`lectures-de-conditions.json : ${l.question} absente de la banque`);
    if (espaces(q.condition_emission) !== espaces(l.origine)) {
      throw new Error(`lectures-de-conditions.json : la condition de ${l.question} a changé dans le classeur — lecture à relire`);
    }
    const origine = analyserCondition(q.condition_emission);
    const brute = analyserCondition(l.lue);
    if (origine.sensible || origine.ouvertureSurDemarche) {
      // UNE QUESTION SENSIBLE NE SE LIT QUE SI ELLE S'OUVRE SUR DÉMARCHE, et seulement sa condition
      // d'origine (après « ║ ») : la marque et la consigne qui la précèdent sont recopiées à
      // l'identique, si bien que la garde (sensibilité, démarche exigée) reste exactement la même.
      const garde = (t: string) => (t.includes('║') ? espaces(t.slice(0, t.indexOf('║') + 1)) : null);
      if (!origine.ouvertureSurDemarche || !garde(q.condition_emission) || garde(q.condition_emission) !== garde(l.lue)
        || brute.sensible !== origine.sensible || brute.niveauSensibilite !== origine.niveauSensibilite || !brute.ouvertureSurDemarche) {
        throw new Error(`lectures-de-conditions.json : ${l.question} est sensible ; seule la condition d'origine d'une question ouverte sur démarche se lit, garde recopiée`);
      }
    } else if (brute.sensible || brute.ouvertureSurDemarche) {
      throw new Error(`lectures-de-conditions.json : la lecture de ${l.question} ajoute une marque de sensibilité`);
    }
    if (brute.inconnues.length > 0) throw new Error(`lectures-de-conditions.json : la lecture de ${l.question} n'est pas comprise (« ${brute.inconnues.join(' », « ')} »)`);
    const groupes = brute.groupes.map((g) => g.map((alt) => alt.map((c) => resoudre(c, l.question))));
    m.set(l.question, { ligne: l, analyse: { ...brute, groupes, clauses: groupes.flat(2) } });
  }
  return m;
}
const LECTURES = charger();

/** La condition à évaluer pour cette question : sa lecture établie, sinon le texte du référentiel. */
export function analyseDe(q: QuestionV3): ConditionAnalysee {
  return LECTURES.get(q.id)?.analyse ?? analyserCondition(q.condition_emission);
}
/** Vrai si la question a une lecture établie (elle n'hérite alors plus d'une tête de sous-partie). */
export const aUneLecture = (q: QuestionV3): boolean => LECTURES.has(q.id);
/** La lecture appliquée, pour les rapports. */
export const lectureDe = (id: string): Ligne | undefined => LECTURES.get(id)?.ligne;
/** Les questions dont une lecture lit la réponse : leurs options choisies doivent être relues. */
export const SELECTEURS_DE_LECTURE: ReadonlySet<string> = new Set(
  [...LECTURES.values()].flatMap((x) => x.analyse.clauses.filter((c): c is Extract<Clause, { type: 'reponse' }> => c.type === 'reponse').map((c) => c.selecteur)));
/** Ce qui n'a pas de lecture : hypothèses (choix écrits) et conditions que le moteur ne constate pas. */
export const NON_LUES: readonly NonLue[] = T.non_lues;
export const VERSION_LECTURES = T.version;
