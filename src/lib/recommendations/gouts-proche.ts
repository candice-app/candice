// CE QUE LE PROCHE A DIT AIMER — usage POSITIF, sous une autorisation qui le nomme.
//
// Les goûts et les souhaits qu'une personne a déclarés peuvent aider à lui faire plaisir : c'est
// la raison d'être de Candice. Mais un goût fait APPARAÎTRE une idée, et l'apparition se
// remarque. Cinq règles, tenues ici et dans le moteur :
//
//   1. UNE AUTORISATION QUI NOMME CET USAGE (`reco:gouts`). L'autorisation d'écarter des idées
//      (`reco_exclusions`) ne l'ouvre pas : accepter qu'un refus retire une idée n'est pas
//      accepter que ses goûts en inspirent.
//   2. SA PAROLE, PAS CELLE D'UN AUTRE. Seules entrent les preuves de SON compte, à SON sujet,
//      explicites, nées d'un acte où il parle lui-même. Ce que le pilote rapporte de lui (« il a
//      adoré faire du pain ») vit sur le compte du pilote et n'entre jamais ici ; une lecture par
//      modèle non plus.
//   3. PAS DE CONTRADICTION TRANCHÉE EN SILENCE. Une chose à la fois aimée et écartée par ses
//      propres déclarations n'est pas transmise.
//   4. LE CONTEXTE ET L'ACTUALITÉ. Une réponse donnée pour un projet n'est pas un goût (elle
//      n'est pas une preuve, elle n'arrive donc pas ici). Un goût déclaré « passager » n'est
//      transmis que s'il est récent. Un sujet sensible n'est jamais transmis.
//   5. LA JUSTIFICATION NE RÉVÈLE RIEN. Le moteur remplace la justification de toute idée
//      inspirée par ces déclarations par une formule qui n'en dit rien et n'invente aucune
//      autre raison (engine.ts).
import { isSelfDeclaredAct, type SourceType } from '../knowledge/sources';
import { TYPE_USAGE, USAGE_GOUTS } from '../consent/usage-profil';
export { USAGE_GOUTS };
import { question as questionParId } from '../discovery/open-v3/banque';
import { analyserCondition } from '../discovery/open-v3/conditions';

/** Un goût déclaré « passager » (stabilité `temporary`) n'est transmis que s'il a moins de tant de jours.
 *  Seuil PROVISOIRE : aucune règle de péremption n'existe ailleurs dans le journal. */
export const JOURS_GOUT_PASSAGER = 60;
export const MAX_GOUTS_TRANSMIS = 12;

export interface GoutDeclare { readonly libelle: string; readonly famille: 'INTEREST' | 'ENTITY' | 'PREFERENCE'; readonly domaine: string | null; readonly source: SourceType; readonly date: string }
export type MotifGouts = 'autorise' | 'aucun_compte' | 'aucun_consentement' | 'portee_absente' | 'lecture_impossible';
export interface LectureGouts {
  readonly autorise: boolean; readonly motif: MotifGouts; readonly gouts: readonly GoutDeclare[];
  /** Ce qui existait et n'a pas été transmis, par motif. Aucun libellé. */
  readonly ecartes: Readonly<Record<string, number>>;
}
const REFUS = (motif: MotifGouts): LectureGouts => ({ autorise: false, motif, gouts: [], ecartes: {} });

type Reponse = { data: Record<string, unknown>[] | null; error: unknown };
interface Requete extends PromiseLike<Reponse> {
  select(cols: string): Requete; eq(col: string, val: unknown): Requete; in(col: string, vals: readonly string[]): Requete; is(col: string, val: null): Requete;
  maybeSingle(): PromiseLike<{ data: Record<string, unknown> | null; error: unknown }>;
}
export interface ClientLecture { from(table: string): Requete }
const POSITIVES = new Set(['LOVE', 'LIKE', 'CURIOUS', 'WANT_TO_TRY', 'WANT_TO_OWN', 'WANT_TO_VISIT']);
const NEGATIVES = new Set(['DISLIKE', 'AVOID']);
const cle = (s: unknown) => String(s ?? '').normalize('NFC').toLowerCase().trim();

export async function lireGoutsDuProche(
  admin: ClientLecture, { piloteId, contactId, maintenant }: { piloteId: string; contactId: string; maintenant?: Date },
): Promise<LectureGouts> {
  const { data: contact, error: eContact } = await admin.from('contacts').select('proche_user_id').eq('id', contactId).eq('user_id', piloteId).maybeSingle();
  if (eContact) return REFUS('lecture_impossible');
  const proche = contact?.proche_user_id as string | null | undefined;
  if (!proche) return REFUS('aucun_compte');
  const { data: consent, error: eConsent } = await admin.from('contact_consents').select('scope, granted_by')
    .eq('pilote_id', piloteId).eq('contact_id', contactId).eq('proche_user_id', proche).eq('kind', TYPE_USAGE).eq('status', 'active').maybeSingle();
  if (eConsent) return REFUS('lecture_impossible');
  if (!consent || consent.granted_by !== proche) return REFUS('aucun_consentement');
  if (!((consent.scope as string[] | null) ?? []).includes(USAGE_GOUTS)) return REFUS('portee_absente');

  const { data: lignes, error: eJ } = await admin.from('knowledge_evidences')
    .select('source_id, target_family, target_construct, subject_label, entity_label, relation, preference_value, polarity, stability, assertion_status, raw_information, context')
    .eq('user_id', proche).eq('about_kind', 'account').eq('about_id', proche).is('superseded_at', null);
  if (eJ) return REFUS('lecture_impossible');
  const utiles = (lignes ?? []).filter((l) => ['INTEREST', 'ENTITY', 'PREFERENCE'].includes(String(l.target_family)));
  if (utiles.length === 0) return { autorise: true, motif: 'autorise', gouts: [], ecartes: {} };
  const { data: sources, error: eS } = await admin.from('knowledge_sources').select('id, source_type, question_code, ts').in('id', [...new Set(utiles.map((l) => String(l.source_id)))]);
  if (eS) return REFUS('lecture_impossible');
  const src = new Map((sources ?? []).map((s) => [String(s.id), s]));

  const ecartes: Record<string, number> = {}; const ecarter = (m: string) => { ecartes[m] = (ecartes[m] ?? 0) + 1; };
  const now = (maintenant ?? new Date()).getTime();
  // La cible d'une preuve : ce sur quoi « j'aime » et « je n'aime pas » se contrediraient.
  const cible = (l: Record<string, unknown>) => l.target_family === 'PREFERENCE' ? `P|${cle(l.target_construct)}|${cle(l.preference_value)}` : `${String(l.target_family)[0]}|${cle(l.target_construct)}`;
  const positives: { l: Record<string, unknown>; s: Record<string, unknown> }[] = []; const rejetees = new Set<string>();
  for (const l of utiles) {
    const s = src.get(String(l.source_id));
    if (!s) { ecarter('source_introuvable'); continue; }
    let declaratif = false;
    try { declaratif = l.assertion_status === 'explicit' && isSelfDeclaredAct(s.source_type as SourceType); } catch { declaratif = false; }
    if (!declaratif) { ecarter('pas_sa_declaration'); continue; }
    const negatif = l.target_family === 'ENTITY' ? NEGATIVES.has(String(l.relation)) : l.polarity === 'rejet';
    if (negatif) { rejetees.add(cible(l)); continue; }
    const positif = l.target_family === 'ENTITY' ? POSITIVES.has(String(l.relation))
      : l.target_family === 'PREFERENCE' ? l.polarity === 'positive'
      : l.polarity == null || l.polarity === 'positive';
    if (!positif) { ecarter('ni_gout_ni_souhait'); continue; }       // neutre, condition, absence de critère, factuel
    const q = questionParId(String(s.question_code ?? ''));
    if (q && analyserCondition(q.condition_emission).sensible) { ecarter('sujet_sensible'); continue; }
    if (l.stability === 'temporary' && now - new Date(String(s.ts)).getTime() > JOURS_GOUT_PASSAGER * 86_400_000) { ecarter('gout_passager_ancien'); continue; }
    positives.push({ l, s });
  }
  const gouts: GoutDeclare[] = []; const vus = new Set<string>();
  for (const { l, s } of positives.sort((a, b) => String(b.s.ts).localeCompare(String(a.s.ts)))) {
    const c = cible(l);
    if (rejetees.has(c)) { ecarter('contredit_par_sa_propre_declaration'); continue; }
    if (vus.has(c)) continue;
    const libelle = String((l.target_family === 'INTEREST' ? l.subject_label : l.target_family === 'ENTITY' ? l.entity_label : l.raw_information) ?? '').trim();
    if (!libelle) { ecarter('sans_libelle'); continue; }
    if (gouts.length >= MAX_GOUTS_TRANSMIS) { ecarter('au_dela_du_plafond'); continue; }
    vus.add(c);
    gouts.push({ libelle, famille: l.target_family as GoutDeclare['famille'], domaine: l.context && l.context !== 'GLOBAL' ? String(l.context) : null, source: s.source_type as SourceType, date: String(s.ts) });
  }
  return { autorise: true, motif: 'autorise', gouts, ecartes };
}

/** La seule justification montrée pour une idée inspirée par une déclaration privée : elle ne
 *  cite rien, ne révèle rien, et n'invente aucune autre raison. */
export const JUSTIFICATION_NEUTRE = 'Une idée choisie pour lui correspondre.';
const mots = (s: string) => new Set(s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 3));
/** Vrai si la justification reprend les mots d'une déclaration privée. Ce filet ne décide PAS
 *  de garder ou d'écarter une idée : il ne fait que neutraliser une phrase qui en dirait trop. */
export function citeUneDeclaration(texte: string, gouts: readonly GoutDeclare[]): boolean {
  const t = mots(texte);
  return gouts.some((g) => { const m = [...mots(g.libelle)]; return m.length > 0 && m.every((w) => t.has(w)); });
}
