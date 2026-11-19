// LE LOT PROPOSÉ — la preuve que c'est le SERVEUR qui a proposé ces questions.
//
// Jusqu'au 19 nov., la route de réponse recevait du navigateur la liste des questions du
// parcours (`pendingKeys`) et la croyait. Un appel direct pouvait donc répondre à n'importe
// quelle question de la banque — y compris une question sensible que le moteur n'aurait jamais
// ouverte — et la réponse devenait une connaissance.
//
// La table `discovery_sessions` ne peut pas servir de preuve : sa politique laisse la personne
// y écrire ce qu'elle veut. Et la route ne porte jamais le client d'administration. La seule
// chose que le navigateur ne peut pas fabriquer est une SIGNATURE faite avec un secret qui ne
// quitte pas le serveur. Le lot est donc signé au moment où il est proposé, et la signature
// est exigée à chaque réponse.
//
// Le jeton porte : le compte, les questions DANS L'ORDRE, l'instant, un identifiant de lot tiré
// au hasard par le serveur, et l'empreinte de la banque. Il sert aussi d'IDENTITÉ D'ACTE :
// « la réponse à cette question dans ce lot » est un acte et un seul (voir reponse.ts).
//
// SANS SECRET, RIEN N'EST PROPOSÉ NI ACCEPTÉ. Pas de secret par défaut, pas de mode dégradé.
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { BANQUE } from './banque';
import { cleOption } from './cle-option';

/** Durée de vie d'un lot. Au-delà, la page est relue et le moteur choisit de nouveau. */
export const DUREE_LOT_MS = 24 * 60 * 60 * 1000;
const VERSION = 'v1';

export class LotIndisponibleError extends Error {}

/** Empreinte de ce que la banque sert : identifiants, formes, clés d'option. Un lot signé
 *  pour une autre banque n'est plus accepté — ses questions ou ses options ont pu changer. */
export const EMPREINTE_BANQUE: string = createHash('sha256')
  .update(BANQUE.map((q) => `${q.id}|${q.forme}|${q.options.map(cleOption).join(',')}`).join('\n'))
  .digest('hex').slice(0, 16);

function secret(): Buffer {
  const s = process.env.DISCOVERY_LOT_SECRET;
  if (!s || s.length < 32) {
    throw new LotIndisponibleError('DISCOVERY_LOT_SECRET absent ou trop court (32 caractères au moins) : aucun lot ne peut être signé ni vérifié');
  }
  return Buffer.from(s, 'utf8');
}

export interface Lot {
  /** Identifiant du lot, tiré par le serveur. C'est aussi l'identifiant de la session. */
  readonly id: string;
  readonly userId: string;
  readonly cles: readonly string[];
  readonly mode: 'quick' | 'full';
  readonly emisA: number;
}

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64url');
const signature = (corps: string) => createHmac('sha256', secret()).update(`${VERSION}.${corps}`).digest('base64url');

/** Signe un lot que le moteur vient de choisir. `maintenant` et `id` ne se passent qu'en test. */
export function signerLot(input: { userId: string; cles: readonly string[]; mode: 'quick' | 'full'; maintenant?: number; id?: string }): { lot: Lot; jeton: string } {
  if (input.cles.length === 0) throw new Error('un lot vide ne se signe pas');
  const lot: Lot = { id: input.id ?? randomUUID(), userId: input.userId, cles: [...input.cles], mode: input.mode, emisA: input.maintenant ?? Date.now() };
  const corps = b64(JSON.stringify({ i: lot.id, u: lot.userId, k: lot.cles, m: lot.mode, t: lot.emisA, b: EMPREINTE_BANQUE }));
  return { lot, jeton: `${VERSION}.${corps}.${signature(corps)}` };
}

export type VerdictLot =
  | { readonly ok: true; readonly lot: Lot }
  | { readonly ok: false; readonly motif: 'absent' | 'malforme' | 'signature' | 'autre_compte' | 'expire' | 'banque_changee' };

/** Vérifie un jeton pour CE compte. Ne lève que si le secret manque (LotIndisponibleError). */
export function verifierLot(jeton: unknown, userId: string, maintenant: number = Date.now()): VerdictLot {
  if (typeof jeton !== 'string' || jeton.length === 0) return { ok: false, motif: 'absent' };
  const parties = jeton.split('.');
  if (parties.length !== 3 || parties[0] !== VERSION) return { ok: false, motif: 'malforme' };
  const attendue = Buffer.from(signature(parties[1]), 'utf8');
  const recue = Buffer.from(parties[2], 'utf8');
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return { ok: false, motif: 'signature' };
  let c: { i?: unknown; u?: unknown; k?: unknown; m?: unknown; t?: unknown; b?: unknown };
  try { c = JSON.parse(Buffer.from(parties[1], 'base64url').toString('utf8')); } catch { return { ok: false, motif: 'malforme' }; }
  if (typeof c.i !== 'string' || typeof c.u !== 'string' || !Array.isArray(c.k) || c.k.some((x) => typeof x !== 'string')
    || (c.m !== 'quick' && c.m !== 'full') || typeof c.t !== 'number') return { ok: false, motif: 'malforme' };
  if (c.u !== userId) return { ok: false, motif: 'autre_compte' };
  if (c.b !== EMPREINTE_BANQUE) return { ok: false, motif: 'banque_changee' };
  if (maintenant - c.t > DUREE_LOT_MS || c.t - maintenant > 60_000) return { ok: false, motif: 'expire' };
  return { ok: true, lot: { id: c.i, userId: c.u, cles: c.k as string[], mode: c.m, emisA: c.t } };
}
