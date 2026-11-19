/**
 * LES RÉFÉRENTS D'ACTIVITÉ (20 nov.) — « Qu'est-ce que tu aimes le plus dans {activité} ? ».
 *
 * Principe validé par Estelle : une activité peut être le sujet d'un intérêt ou d'une pratique ; elle
 * sert de paramètre à une question SANS devenir une entité marchande ni une famille de connaissance.
 * Le référent n'est donc écrit nulle part : il est DÉRIVÉ, à la lecture de l'état, d'une réponse
 * fermée de la personne (activites-referents.json), et il garde son construct canonique, son mode et
 * sa provenance. Ce n'est ni un atelier, ni un établissement, ni un événement (aucun lieu, aucune date).
 *
 * LES MODES, et ce qu'ils ne prouvent pas :
 *   attrait  — elle aime (ou aime regarder) : ne prouve pas qu'elle pratique ;
 *   pratique — elle pratique aujourd'hui : ne prouve ni niveau, ni fréquence, ni équipement, ni envie
 *              de progresser.
 * Chaque question nomme le mode qu'elle présume ; une question dont le prérequis n'est établi par
 * aucune réponse reste fermée (activity.0285 : un équipement).
 */
import table from './activites-referents.json';
import { BANQUE, question } from './banque';
import { cleOption } from './cle-option';

export type ModeActivite = 'attrait' | 'pratique';
export interface ReferentActivite {
  /** `activite:<domaine>:<activité>` — distinct pour un même nom vu ou pratiqué (deux constructs). */
  readonly id: string;
  /** La forme lue dans l'énoncé, avec son article (« la céramique ou la poterie »). */
  readonly libelle: string;
  readonly mode: ModeActivite;
  readonly construct: string;
  readonly provenance: { readonly question: string; readonly option: string };
}
interface Option { question: string; option: string; mode: ModeActivite; domaine: string; construct: string; id: string; forme: string }
const T = table as unknown as { options: Option[]; questions: Record<string, { modes: ModeActivite[]; pourquoi: string }>; fermees: Record<string, string> };

// La table est vérifiée au chargement : chaque option existe à sa question, chaque question existe.
const PAR_CLE = new Map<string, Option>();
for (const o of T.options) {
  const q = question(o.question);
  const opt = q?.options.find((x) => x.libelle === o.option);
  if (!opt) throw new Error(`activites-referents.json : « ${o.option} » absente de ${o.question}`);
  PAR_CLE.set(`${o.question}|${cleOption(opt)}`, o);
}
const IDS = new Set(BANQUE.map((q) => q.id));
for (const id of [...Object.keys(T.questions), ...Object.keys(T.fermees)]) if (!IDS.has(id)) throw new Error(`activites-referents.json : ${id} absente de la banque`);
const SOURCES = [...new Set(T.options.map((o) => o.question))];

export const QUESTIONS_D_ACTIVITE: ReadonlySet<string> = new Set([...Object.keys(T.questions), ...Object.keys(T.fermees)]);
export const prerequisDActivite = (id: string) => T.questions[id] ?? null;

/** Les activités que la personne a déclarées, d'après ses DERNIÈRES réponses relues dans le journal. */
export function activitesDeclarees(dernieresReponses: ReadonlyMap<string, ReadonlySet<string>>): ReferentActivite[] {
  const vus = new Map<string, ReferentActivite>();
  for (const q of SOURCES) for (const cle of dernieresReponses.get(q) ?? []) {
    const o = PAR_CLE.get(`${q}|${cle}`);
    if (o && !vus.has(o.id)) vus.set(o.id, { id: o.id, libelle: o.forme, mode: o.mode, construct: o.construct, provenance: { question: o.question, option: o.option } });
  }
  return [...vus.values()];
}

/**
 * L'activité pour laquelle cette question peut être posée MAINTENANT : la première, dans l'ordre de la
 * banque, dont le mode est celui que la question présume, et pour laquelle elle n'a pas déjà été posée.
 */
export function activitePour(questionId: string, activites: readonly ReferentActivite[], poseesParEntite: ReadonlyMap<string, ReadonlySet<string>>): ReferentActivite | null {
  const l = T.questions[questionId];
  if (!l) return null;                                  // inconnue, ou fermée par son prérequis
  const deja = poseesParEntite.get(questionId) ?? new Set<string>();
  return activites.find((a) => l.modes.includes(a.mode) && !deja.has(a.id)) ?? null;
}
