// RECEVOIR UNE RÉPONSE — tout ce que le serveur vérifie AVANT d'écrire quoi que ce soit.
//
// Cinq contrôles, dans cet ordre, et aucun ne dépend de ce que le navigateur affirme :
//   1. le lot a été signé par ce serveur, pour ce compte, et n'a pas expiré (lot.ts) ;
//   2. la question fait partie de ce lot, existe et reste active dans la banque ;
//   3. la réponse a la forme de la question, et ses options lui appartiennent ;
//   4. le parcours (la session) appartient à la personne, et la question y est bien celle
//      qui est posée maintenant — ou une question déjà traitée dont on renvoie la requête ;
//   5. ses conditions tiennent encore, rejugées avec l'état relu à l'instant.
// Un refus n'écrit RIEN : ni connaissance, ni réponse, ni progression, ni session.
//
// Puis, dans cet ordre : la connaissance (journal), la progression, l'avancée du parcours.
// Chacune de ces trois écritures est idempotente pour un même ACTE (« cette question dans ce
// lot »). Une requête renvoyée — double clic, reprise après coupure, panne entre la
// connaissance et la progression — refait donc ce qui manquait et ne compte rien deux fois.
import { question as questionParId, type QuestionV3 } from './banque';
import { cleOption } from './cle-option';
import { verifierLot, signerLot, type Lot, LotIndisponibleError } from './lot';
import { lireEtat } from './etat';
import { motifDExclusion, requiertProjet } from './selection';
import { poolDe } from './coexistence';
import type { Projet } from './etat';
import {
  enregistrerReponseFermee, enregistrerReponseOuverte, prochainesQuestionsPour, sourceDeLActe, projetsEnCours, estAliasMasque,
  ActeDejaEnregistreError, ReponseInvalideError, type QuestionAServir,
} from './service';
import { libelleBranche } from './branches';
import { marquerProgression } from '../completion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

export interface QuestionPosee {
  readonly question: {
    readonly id: string; readonly question_key: string; readonly dimension: string; readonly subdimension: null;
    readonly question_text: string; readonly question_type: 'chips_single' | 'chips_multi' | 'text';
    readonly options: { label: string; value: string }[] | null; readonly sort_order: number; readonly locked_text: true;
  };
  /** Le lot signé. À renvoyer tel quel avec chaque réponse. */
  readonly jeton: string;
  readonly sessionId: string;
  readonly mode: 'quick' | 'full';
  readonly sectionLabel: string;
  readonly progress: { current: number; total: number } | null;
}

function poser(q: QuestionV3, lot: Lot, jeton: string, index: number, libelle?: string | null): QuestionPosee {
  const type = q.forme === 'open' ? 'text' : q.forme === 'single' ? 'chips_single' : 'chips_multi';
  return {
    question: {
      id: q.id, question_key: q.id, dimension: q.branche, subdimension: null,
      // Texte du référentiel, revu et validé : JAMAIS reformulé par un modèle.
      question_text: q.enonce, question_type: type,
      // Un alias masqué (onglet 6) n'est jamais affiché ; reçu, il vaut l'option canonique.
      options: type === 'text' ? null : q.options.filter((o) => !estAliasMasque(q.id, o)).map((o) => ({ label: o.libelle, value: cleOption(o) })),
      sort_order: 0, locked_text: true,
    },
    jeton, sessionId: lot.id, mode: lot.mode,
    // Le nom lisible de la branche — jamais son identifiant (« travel2 ») : sans nom, rien.
    sectionLabel: libelle ?? libelleBranche(q.branche) ?? '',
    progress: lot.mode === 'full' ? { current: index + 1, total: lot.cles.length } : null,
  };
}

/**
 * PROPOSER UN LOT. Lecture seule : aucune session, aucune trace — la session naît à la
 * première réponse. Le lot est signé ; c'est cette signature que la réponse devra présenter.
 */
export async function proposerLot(
  client: Client, input: { userId: string; mode: 'quick' | 'full'; section?: string },
): Promise<{ premiere: QuestionPosee | null; diagnostic: unknown; manques: readonly string[] }> {
  const { questions, diagnostic, manques } = await prochainesQuestionsPour(client, { userId: input.userId, combien: input.mode === 'full' ? 6 : 1 });
  // `section` restreint à une branche quand la page est ouverte depuis un appel ciblé.
  const retenues: readonly QuestionAServir[] = input.section ? questions.filter((q) => q.dimension === input.section) : questions;
  if (retenues.length === 0) return { premiere: null, diagnostic, manques };
  const { lot, jeton } = signerLot({ userId: input.userId, cles: retenues.map((q) => q.question_key), mode: input.mode });
  const q = questionParId(retenues[0].question_key)!;
  return { premiere: poser(q, lot, jeton, 0, retenues[0].libelle), diagnostic, manques };
}

export type MotifRefus =
  | 'lot_absent' | 'lot_invalide' | 'lot_expire' | 'lot_autre_compte'
  | 'question_inconnue' | 'question_non_proposee' | 'forme_invalide'
  | 'session_etrangere' | 'pas_son_tour' | 'conditions_non_tenues' | 'acte_deja_enregistre'
  | 'etat_illisible' | 'ecriture_impossible' | 'lot_indisponible';

export type IssueReponse =
  | { readonly ok: true; readonly next: QuestionPosee | null; readonly done: boolean;
      /** Faux quand la requête est le renvoi d'un acte déjà enregistré : rien ne se compte. */
      readonly nouvelActe: boolean; readonly lectureEnAttente: boolean }
  | { readonly ok: false; readonly status: 400 | 403 | 409 | 503; readonly motif: MotifRefus; readonly message: string };

const refus = (status: 400 | 403 | 409 | 503, motif: MotifRefus, message: string): IssueReponse => ({ ok: false, status, motif, message });

interface Session { id: string; user_id: string; current_index: number; status: string }

/** La session du lot : même identifiant que lui. Créée à la première réponse, jamais avant. */
async function lireSession(client: Client, lot: Lot): Promise<Session | null> {
  const { data, error } = await client.from('discovery_sessions').select('id, user_id, current_index, status').eq('id', lot.id).maybeSingle();
  if (error) throw new Error(`lecture du parcours impossible : ${error.message}`);
  return (data as Session | null) ?? null;
}

export async function traiterReponse(
  client: Client,
  input: { userId: string; jeton: unknown; questionKey: unknown; answer?: unknown; skip?: boolean; maintenant?: number },
): Promise<IssueReponse> {
  const skip = input.skip === true;

  // ── 1. LE LOT.
  let lot: Lot; let jeton: string;
  try {
    const v = verifierLot(input.jeton, input.userId, input.maintenant);
    if (!v.ok) {
      if (v.motif === 'absent') return refus(400, 'lot_absent', 'cette réponse ne se rattache à aucune question posée');
      if (v.motif === 'expire' || v.motif === 'banque_changee') return refus(409, 'lot_expire', 'ces questions ont expiré — recharge la page');
      if (v.motif === 'autre_compte') return refus(403, 'lot_autre_compte', 'ce parcours appartient à un autre compte');
      return refus(403, 'lot_invalide', 'cette réponse ne se rattache à aucune question posée');
    }
    lot = v.lot; jeton = input.jeton as string;
  } catch (e) {
    if (e instanceof LotIndisponibleError) { console.error('[discovery/reponse]', e.message); return refus(503, 'lot_indisponible', 'les questions ne sont pas disponibles pour le moment'); }
    throw e;
  }

  // ── 2. LA QUESTION : dans ce lot, et toujours dans la banque active.
  if (typeof input.questionKey !== 'string' || !input.questionKey) return refus(400, 'question_inconnue', 'question absente');
  const position = lot.cles.indexOf(input.questionKey);
  if (position < 0) return refus(403, 'question_non_proposee', 'cette question ne t’a pas été posée');
  const q = questionParId(input.questionKey);
  if (!q) return refus(409, 'question_inconnue', 'cette question n’existe plus');

  // ── 3. LA FORME. Jugée ici, sans base, avant toute lecture.
  let cles: string[] = []; let texte = '';
  if (!skip) {
    if (q.forme === 'open') {
      if (typeof input.answer !== 'string' || input.answer.trim().length === 0) return refus(400, 'forme_invalide', 'réponse vide');
      texte = input.answer.trim();
      if (texte.length > 4000) return refus(400, 'forme_invalide', 'réponse trop longue');
    } else {
      const a = input.answer;
      if (!(typeof a === 'string' || (Array.isArray(a) && a.every((x) => typeof x === 'string')))) return refus(400, 'forme_invalide', 'réponse illisible');
      cles = [...new Set(typeof a === 'string' ? [a] : (a as string[]))];
      if (cles.length === 0) return refus(400, 'forme_invalide', 'aucune option reçue');
      if (q.forme === 'single' && cles.length > 1) return refus(400, 'forme_invalide', 'cette question n’accepte qu’une réponse');
      const connues = new Set(q.options.map(cleOption));
      if (cles.some((c) => !connues.has(c))) return refus(400, 'forme_invalide', 'option inconnue de cette question');
    }
  }

  // ── 4. LE PARCOURS. Il appartient à la personne ; la question y est la question courante,
  //       ou une question déjà traitée (renvoi). Rien n'est encore écrit.
  let session: Session | null;
  let dejaActe = false; let dejaTraitee = false;
  try {
    session = await lireSession(client, lot);
    if (session && session.user_id !== input.userId) return refus(403, 'session_etrangere', 'ce parcours appartient à un autre compte');
    const type = q.forme === 'open' ? 'discovery_open' as const : 'discovery_closed' as const;
    const idActe = sourceDeLActe(type, input.userId, q.id, lot.id);
    const { data: acte, error: eActe } = await client.from('knowledge_sources').select('id').eq('id', idActe).maybeSingle();
    if (eActe) throw new Error(eActe.message);
    dejaActe = !!acte;
    if (!dejaActe && session && position < session.current_index) {
      // Passée ou sautée dans CE parcours ? Seule une question réellement passée par la
      // personne a laissé une trace ; une question que le recalcul a sautée n'en a pas.
      const { data: trace, error: eTrace } = await client.from('profile_completion').select('status, last_asked_at')
        .eq('user_id', input.userId).eq('question_key', q.id).is('contact_id', null).maybeSingle();
      if (eTrace) throw new Error(eTrace.message);
      dejaTraitee = !!trace && (trace as { status?: string }).status === 'skipped';
    }
  } catch (e) {
    console.error('[discovery/reponse] état du parcours illisible', e);
    return refus(503, 'etat_illisible', 'la réponse n’a pas pu être vérifiée — rien n’est enregistré');
  }
  const courant = session ? session.current_index : 0;
  const renvoi = dejaActe || dejaTraitee;
  if (!renvoi && position !== courant) {
    return refus(409, 'pas_son_tour', position < courant ? 'cette question n’est plus posée dans ce parcours' : 'cette question n’est pas encore posée');
  }
  if (!renvoi && session && session.status === 'completed') return refus(409, 'pas_son_tour', 'ce parcours est terminé');
  // Un renvoi qui change de nature (répondre après avoir passé, passer après avoir répondu)
  // n'est pas un renvoi.
  if (dejaActe && skip) return refus(409, 'acte_deja_enregistre', 'cette question a déjà reçu une réponse dans ce parcours');
  if (dejaTraitee && !skip) return refus(409, 'pas_son_tour', 'cette question n’est plus posée dans ce parcours');

  // ── 5. LES CONDITIONS, rejugées maintenant. Un acte déjà enregistré a été jugé en son temps.
  if (!renvoi && !skip) {
    try {
      const { etat, manques } = await lireEtat(client, { userId: input.userId });
      if (manques.some((m) => m.includes('progression illisible'))) throw new Error(manques.join(' ; '));
      const motif = motifDExclusion(q, etat, { ignorerDejaPosee: true });
      if (motif !== null) {
        console.warn('[discovery/reponse] conditions non tenues', q.id, motif);
        return refus(409, 'conditions_non_tenues', 'cette question n’est plus d’actualité — recharge la page');
      }
    } catch (e) {
      console.error('[discovery/reponse] conditions invérifiables', e);
      return refus(503, 'etat_illisible', 'la réponse n’a pas pu être vérifiée — rien n’est enregistré');
    }
  }

  // ── 5 bis. LE PROJET AUQUEL LA RÉPONSE APPARTIENT. Une question de niveau C, ou qui nomme un
  //    achat ou un séjour concret, se répond POUR un projet en cours du même domaine : c'est à
  //    lui que la réponse est rattachée. Plusieurs projets en cours dans le domaine : le plus
  //    récent. Aucun : la question n'aurait pas dû être posée — refus, rien n'est écrit.
  let projet: Projet | undefined;
  const besoin = skip ? null : requiertProjet(q);
  if (besoin && !renvoi) {
    try {
      const enCours = (await projetsEnCours(client, { userId: input.userId }))
        .filter((p) => poolDe(p.branche) === poolDe(q.branche) && (besoin === 'tout' || p.type === besoin))
        .sort((a, b) => (a.debut < b.debut ? 1 : -1));
      projet = enCours[0];
    } catch (e) {
      console.error('[discovery/reponse] projets illisibles', e);
      return refus(503, 'etat_illisible', 'la réponse n’a pas pu être vérifiée — rien n’est enregistré');
    }
    if (!projet) return refus(409, 'conditions_non_tenues', 'cette question n’est plus d’actualité — recharge la page');
  }

  // ═════════ À PARTIR D'ICI ON ÉCRIT. Tout ce qui précède n'a fait que lire.

  // ── LE JOURNAL D'ABORD. S'il échoue, on ne marque RIEN : la question sera reposée.
  let nouvelActe = false; let lectureEnAttente = false; let instant = new Date(input.maintenant ?? Date.now()).toISOString();
  if (!skip) {
    try {
      if (q.forme === 'open') {
        const r = await enregistrerReponseOuverte(client, { userId: input.userId, questionId: q.id, texte, acteId: lot.id, timestamp: instant, ...(projet ? { projet } : {}) });
        nouvelActe = !r.dejaFaite; lectureEnAttente = r.extractionEnAttente; instant = r.timestamp;
      } else {
        const r = await enregistrerReponseFermee(client, { userId: input.userId, questionId: q.id, clesOptions: cles, acteId: lot.id, timestamp: instant, ...(projet ? { projet } : {}) });
        nouvelActe = !r.dejaFaite; instant = r.timestamp;
      }
    } catch (e) {
      if (e instanceof ActeDejaEnregistreError) return refus(409, 'acte_deja_enregistre', 'cette question a déjà reçu une autre réponse dans ce parcours');
      if (e instanceof ReponseInvalideError) { console.warn('[discovery/reponse] réponse refusée', q.id, e.message); return refus(400, 'forme_invalide', 'réponse refusée'); }
      console.error('[discovery/reponse] écriture du journal impossible', q.id, e);
      return refus(503, 'ecriture_impossible', 'la réponse n’a pas pu être enregistrée — elle te sera reposée');
    }
  }

  // ── LA PROGRESSION. Mêmes valeurs pour le même acte : la réécrire ne change rien.
  //    Un échec ici n'efface pas la connaissance ; le journal fait foi (voir etat.ts), et le
  //    renvoi de la requête la répare.
  const { error: eProg } = await marquerProgression(client, input.userId, q.id, skip
    ? { is_filled: false, answer_data: null, answered_at: null, last_asked_at: instant, skipped_count: 1, status: 'skipped' }
    : { is_filled: true, answer_data: q.forme === 'open' ? texte : cles, answered_at: instant, last_asked_at: instant, status: 'answered' });
  if (eProg) console.error('[discovery/reponse] progression non écrite (le journal fait foi)', q.id, eProg.message);

  // ── L'AVANCÉE, PAR LA POSITION DE LA QUESTION et non par « +1 » : une requête renvoyée
  //    retombe sur la même position et ne fait pas sauter la question suivante.
  //    APRÈS CHAQUE RÉPONSE, RECALCULER (référentiel, onglet 8) : ce que la personne vient de
  //    dire peut avoir fermé une question à venir. On saute celles qui ne sont plus
  //    admissibles — sans les marquer posées : une question non montrée n'est pas refusée.
  //    La session naît ICI, après la connaissance : un refus ou une écriture de journal
  //    impossible ne laisse derrière lui aucun parcours vide.
  if (!session) {
    const { error } = await client.from('discovery_sessions').insert({
      id: lot.id, user_id: input.userId, mode: lot.mode, pending_keys: lot.cles, current_index: 0, status: 'active',
    });
    // 23505 : une requête simultanée du même lot vient de la créer. C'est la même session.
    if (error && error.code !== '23505') console.error('[discovery/reponse] création du parcours', error.message);
    try { session = await lireSession(client, lot); } catch { session = null; }
    if (!session || session.user_id !== input.userId) {
      // La réponse est au journal ; seul le fil du parcours manque. On s'arrête là plutôt que
      // de poser la suite sans savoir où l'on en est — la page relira et le moteur choisira.
      console.error('[discovery/reponse] parcours introuvable après écriture — arrêt du parcours', lot.id);
      return { ok: true, next: null, done: true, nouvelActe, lectureEnAttente };
    }
  }
  let suivant = Math.max(session.current_index, position + 1);
  try {
    if (suivant < lot.cles.length) {
      const { etat, manques } = await lireEtat(client, { userId: input.userId });
      if (manques.some((m) => m.includes('progression illisible'))) throw new Error(manques.join(' ; '));
      while (suivant < lot.cles.length) {
        const qs = questionParId(lot.cles[suivant]);
        if (qs && motifDExclusion(qs, etat) === null) break;
        suivant++;
      }
    }
  } catch (e) {
    // Sans l'état relu on ne sait pas ce qui reste admissible : on arrête le parcours plutôt
    // que de poser une question que la réponse précédente a peut-être fermée.
    console.error('[discovery/reponse] recalcul impossible, parcours arrêté', e);
    suivant = lot.cles.length;
  }
  const fini = suivant >= lot.cles.length;
  const { error: eSess } = await client.from('discovery_sessions')
    .update({ current_index: suivant, status: fini ? 'completed' : 'active', last_activity_at: new Date(input.maintenant ?? Date.now()).toISOString() })
    .eq('id', lot.id).eq('user_id', input.userId);
  if (eSess) console.error('[discovery/reponse] avancée du parcours non écrite', eSess.message);

  if (fini) return { ok: true, next: null, done: true, nouvelActe, lectureEnAttente };
  return { ok: true, next: poser(questionParId(lot.cles[suivant])!, lot, jeton, suivant), done: false, nouvelActe, lectureEnAttente };
}
