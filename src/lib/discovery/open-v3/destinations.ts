/**
 * LES DESTINATIONS CONDITIONNELLES — onglet 17 du référentiel (quinze destinations, neuf questions).
 *
 * Pour ces questions ouvertes, le référentiel ne dit pas « lis la réponse » : il dit, segment par
 * segment, CE QUI DÉCLENCHE une écriture, où elle va, et ce qu'il faut pour l'écrire. « Y a-t-il
 * une technique, un style ou une matière que tu n'aimes vraiment pas ? » : si le segment nomme
 * une technique → une préférence de type ; un style → un univers ; une matière → une matière.
 * Et sinon : « verbatim seul ». Rien d'autre ne s'écrit — ces questions ne passent donc PLUS par
 * la lecture générale des textes libres, qui pouvait écrire hors de ce contrat.
 *
 * LE MODÈLE NE FAIT QUE DÉCOUPER. Il rend, par déclencheur, les passages EXACTS de la réponse.
 * Le code garde ceux qui figurent réellement dans le texte, et écrit ce que le contrat prévoit.
 *
 * TROIS OBSTACLES EMPÊCHENT D'EXÉCUTER ONZE DESTINATIONS, et ils sont dits, pas contournés :
 *   · le contrat fixe la stabilité « undetermined » ; le journal ne l'admet pas (contrainte de
 *     colonne : stable, evolving, contextual, temporary). L'écrire sous une autre valeur
 *     affirmerait une stabilité que le contrat refuse justement d'affirmer ;
 *   · le contrat exige une œuvre, un épisode ou un lieu « résolu de façon unique » ; aucun
 *     résolveur de ce genre n'existe ;
 *   · le contrat exige un identifiant d'animal (`pet_id`) ; le modèle de données n'en a pas.
 * Pour celles-là, la règle du contrat s'applique : « verbatim seul ».
 */
import Anthropic from '@anthropic-ai/sdk';
import { DESTINATIONS_CONDITIONNELLES } from './contrats-ouverts';

export interface Destination {
  readonly question: string; readonly rang: string; readonly declencheur: string; readonly signification: string;
  readonly voie: 'HSG_EVIDENCE' | 'FACT'; readonly famille: string | null; readonly cle: string;
  readonly typeEntite: string | null; readonly stabilite: string | null; readonly identifiantRequis: string | null;
}
const nul = (v: string | null | undefined) => (!v || v === 'NONE' || v === 'None' ? null : v);
const TOUTES: Destination[] = DESTINATIONS_CONDITIONNELLES.map((d) => ({
  question: String(d.question_id), rang: String(d.rang_destination), declencheur: String(d.declencheur), signification: String(d.declencheur_signification),
  voie: d.voie === 'FACT' ? 'FACT' : 'HSG_EVIDENCE', famille: nul(d.famille), cle: String(d.attribut_ou_cle),
  typeEntite: nul(d.type_entite), stabilite: nul(d.stabilite), identifiantRequis: nul(d.identifiant_requis),
}));
export const DESTINATIONS_PAR_QUESTION: ReadonlyMap<string, readonly Destination[]> = TOUTES.reduce(
  (m, d) => m.set(d.question, [...(m.get(d.question) ?? []), d]), new Map<string, Destination[]>());

export type MotifNonExecutable = 'stabilite_indeterminee_non_stockable' | 'resolution_d_entite_absente' | 'identifiant_requis_absent' | 'cle_a_parametre';
/** Peut-on écrire cette destination avec ce que le journal et le modèle de données offrent ? */
export function executable(d: Destination): { readonly ok: true } | { readonly ok: false; readonly motif: MotifNonExecutable } {
  if (d.identifiantRequis) return { ok: false, motif: 'identifiant_requis_absent' };
  if (d.typeEntite) return { ok: false, motif: 'resolution_d_entite_absente' };
  if (d.stabilite === 'undetermined') return { ok: false, motif: 'stabilite_indeterminee_non_stockable' };
  if (d.voie === 'FACT' && /[<{]/.test(d.cle)) return { ok: false, motif: 'cle_a_parametre' };
  return { ok: true };
}
/** Le relevé complet, pour les rapports : chaque destination et pourquoi elle s'exécute ou non. */
export function couvertureDestinations(): { question: string; rang: string; declencheur: string; executee: boolean; motif?: MotifNonExecutable }[] {
  return TOUTES.map((d) => { const e = executable(d); return { question: d.question, rang: d.rang, declencheur: d.declencheur, executee: e.ok, ...(e.ok ? {} : { motif: e.motif }) }; });
}

const aplat = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

export interface SegmentsValides {
  /** Déclencheur → passages de la réponse qui le satisfont, dans les mots de la personne. */
  readonly parDeclencheur: ReadonlyMap<string, readonly string[]>;
  /** Ce que le modèle a proposé et qui n'était pas dans le texte, ou sous un déclencheur inconnu. */
  readonly ecartes: readonly string[];
}
/** Un passage n'est gardé que s'il figure dans la réponse, sous un déclencheur du contrat. */
export function validerSegments(texte: string, brut: unknown, destinations: readonly Destination[]): SegmentsValides {
  const source = aplat(texte); const ecartes: string[] = []; const par = new Map<string, string[]>();
  const connus = new Set(destinations.map((d) => d.declencheur));
  const segments = (brut as { segments?: unknown })?.segments;
  for (const s of Array.isArray(segments) ? segments : []) {
    const declencheur = (s as { declencheur?: unknown }).declencheur, passage = (s as { passage?: unknown }).passage;
    if (typeof declencheur !== 'string' || typeof passage !== 'string' || !passage.trim()) continue;
    const p = passage.trim();
    if (!connus.has(declencheur) || !source.includes(aplat(p))) { ecartes.push(`${declencheur}: ${p}`); continue; }
    if (!(par.get(declencheur) ?? []).some((x) => aplat(x) === aplat(p))) par.set(declencheur, [...(par.get(declencheur) ?? []), p]);
  }
  return { parDeclencheur: par, ecartes };
}

/** Appelle le modèle pour DÉCOUPER. LÈVE s'il ne répond pas — une panne n'est pas « aucun segment ». */
export async function lireSegmentsParModele(enonce: string, texte: string, destinations: readonly Destination[], barriere: string): Promise<unknown> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const systeme = `Tu lis UNE réponse à la question « ${enonce} ». Tu DÉCOUPES la réponse, tu n'interprètes rien.
Pour chacun des déclencheurs ci-dessous, rends les passages EXACTS de la réponse qui le satisfont, copiés mot pour mot, sans reformuler ni compléter. Un passage qui ne satisfait aucun déclencheur n'est pas rendu. Si rien ne satisfait un déclencheur, ne rends rien pour lui.
${destinations.map((d) => `- ${d.declencheur} : ${d.signification}`).join('\n')}
INTERDICTIONS : ${barriere || 'ne déduis rien que la personne n’a pas écrit.'} Ne déduis aucun goût durable, aucun trait, aucune contrainte.`;
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 700, system: systeme,
    tools: [{ name: 'segments', description: 'Passages exacts de la réponse, rangés par déclencheur.', input_schema: { type: 'object' as const,
      properties: { segments: { type: 'array', items: { type: 'object', properties: { declencheur: { type: 'string', enum: destinations.map((d) => d.declencheur) }, passage: { type: 'string' } }, required: ['declencheur', 'passage'] } } },
      required: ['segments'] } }],
    tool_choice: { type: 'tool', name: 'segments' },
    messages: [{ role: 'user', content: `Réponse : « ${texte} »` }],
  });
  const bloc = msg.content.find((b) => b.type === 'tool_use');
  if (!bloc || bloc.type !== 'tool_use') throw new Error('réponse du modèle sans découpage');
  return bloc.input;
}
