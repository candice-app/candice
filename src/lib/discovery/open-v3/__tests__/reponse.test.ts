import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { fausseBase, type FausseBase } from '../../../knowledge/__tests__/fausse-base';
import { proposerLot, traiterReponse } from '../reponse';
import { signerLot, verifierLot, DUREE_LOT_MS } from '../lot';
import { sujetsExplorables } from '../service';
import { lireEtat, FAIT_SUJET_CHOISI } from '../etat';
import { BANQUE, question } from '../banque';
import { cleOption } from '../cle-option';
import { analyserCondition } from '../conditions';

// LA ROUTE DE RÉPONSE EST FERMÉE — tout est vérifié AVANT d'écrire, et un refus n'écrit rien.
// Mêmes cas rejoués par HTTP sur la pile locale : scripts/local/32-preuve-route-fermee-et-actes.mts.
const U = '00000000-0000-4000-8000-0000000000a1';
const AUTRE = '00000000-0000-4000-8000-0000000000b2';

beforeAll(() => { process.env.DISCOVERY_LOT_SECRET = 'secret-de-test-de-plus-de-trente-deux-caracteres'; });

/** Une personne qui a choisi d'explorer un sujet : de quoi faire proposer un lot de plusieurs questions. */
function baseAvecSujet(): { b: FausseBase; branche: string } {
  for (const s of sujetsExplorables()) {
    const b = fausseBase({ knowledge_facts: [{ id: 'f-sujet', user_id: U, about_kind: 'account', about_id: U, fact_type: FAIT_SUJET_CHOISI, value: s.branche, source: 'src-sujet', superseded_at: null }] });
    return { b, branche: s.branche };
  }
  throw new Error('aucun sujet explorable');
}
let b: FausseBase; let jeton: string; let cles: string[]; let branche: string;
/** Une réponse valide à la question : sa première option, ou un texte. */
const valide = (id: string) => { const q = question(id)!; return q.forme === 'open' ? 'Une phrase à moi.' : [cleOption(q.options[0])]; };
const figer = () => JSON.stringify(b.tables);

beforeEach(async () => {
  // On cherche un sujet dont le lot compte au moins trois questions fermées en tête.
  for (const s of sujetsExplorables()) {
    const base = fausseBase({ knowledge_facts: [{ id: 'f-sujet', user_id: U, about_kind: 'account', about_id: U, fact_type: FAIT_SUJET_CHOISI, value: s.branche, source: 'src-sujet', superseded_at: null }] });
    const { premiere } = await proposerLot(base.client, { userId: U, mode: 'full' });
    if (!premiere) continue;
    const v = verifierLot(premiere.jeton, U);
    if (!v.ok || v.lot.cles.length < 3) continue;
    if (v.lot.cles.slice(0, 3).some((k) => question(k)!.forme === 'open')) continue;
    b = base; jeton = premiere.jeton; cles = [...v.lot.cles]; branche = s.branche;
    expect(base.ecritures, 'proposer un lot n’écrit rien').toHaveLength(0);
    return;
  }
  throw new Error('aucun sujet ne donne un lot de trois questions fermées');
});

describe('refus — rien n’est écrit', () => {
  const refuse = async (input: Record<string, unknown>, status: number, motif: string) => {
    const avant = figer();
    const r = await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: valide(cles[0]), ...input } as never);
    expect(r).toMatchObject({ ok: false, status, motif });
    expect(figer(), 'la base a bougé').toBe(avant);
    expect(b.ecritures).toHaveLength(0);
  };

  it('appel direct sans lot', () => refuse({ jeton: undefined }, 400, 'lot_absent'));
  it('une liste de questions envoyée à la place du lot (l’ancien `pendingKeys`)', () => refuse({ jeton: JSON.stringify(cles) }, 403, 'lot_invalide'));
  it('un lot dont la signature a été retouchée', () => refuse({ jeton: jeton.slice(0, -2) + (jeton.endsWith('aa') ? 'bb' : 'aa') }, 403, 'lot_invalide'));
  it('un lot dont le contenu a été réécrit en gardant la signature', () => {
    const [v, , s] = jeton.split('.');
    const faux = Buffer.from(JSON.stringify({ i: 'x', u: U, k: [BANQUE[0].id], m: 'full', t: Date.now(), b: 'x' })).toString('base64url');
    return refuse({ jeton: `${v}.${faux}.${s}`, questionKey: BANQUE[0].id }, 403, 'lot_invalide');
  });
  it('le lot d’un autre compte', async () => {
    const autre = signerLot({ userId: AUTRE, cles, mode: 'full' });
    await refuse({ jeton: autre.jeton }, 403, 'lot_autre_compte');
  });
  it('un lot expiré', () => refuse({ maintenant: Date.now() + DUREE_LOT_MS + 1000 }, 409, 'lot_expire'));
  it('une question arbitraire de la banque, hors du lot', async () => {
    const hors = BANQUE.find((q) => !cles.includes(q.id) && q.forme !== 'open')!;
    await refuse({ questionKey: hors.id, answer: valide(hors.id) }, 403, 'question_non_proposee');
  });
  it('une question SENSIBLE, hors du lot, avec une option valide', async () => {
    const sensible = BANQUE.find((q) => analyserCondition(q.condition_emission).sensible && q.forme !== 'open' && !cles.includes(q.id))!;
    await refuse({ questionKey: sensible.id, answer: valide(sensible.id) }, 403, 'question_non_proposee');
  });
  it('une clé de l’ancienne banque', () => refuse({ questionKey: 'practical.dietary', answer: { choices: ['vegan'] } }, 403, 'question_non_proposee'));
  it('une option qui n’appartient pas à la question', () => refuse({ answer: ['option-fabriquee'] }, 400, 'forme_invalide'));
  it('deux options à une question à choix unique', async () => {
    const i = cles.findIndex((k) => question(k)!.forme === 'single');
    if (i !== 0) return;
    const q = question(cles[0])!;
    await refuse({ answer: [cleOption(q.options[0]), cleOption(q.options[1])] }, 400, 'forme_invalide');
  });
  it('un objet à la place d’une réponse', () => refuse({ answer: { choices: ['r1'] } }, 400, 'forme_invalide'));
  it('aucune option', () => refuse({ answer: [] }, 400, 'forme_invalide'));
  it('la deuxième question du lot avant la première', () => refuse({ questionKey: cles[1], answer: valide(cles[1]) }, 409, 'pas_son_tour'));
  it('un parcours qui porte l’identifiant du lot mais appartient à quelqu’un d’autre', async () => {
    const id = (verifierLot(jeton, U) as { lot: { id: string } }).lot.id;
    b.tables.discovery_sessions = [{ id, user_id: AUTRE, current_index: 0, status: 'active' }];
    b.ecritures.length = 0;
    await refuse({}, 403, 'session_etrangere');
  });
  it('des conditions devenues fausses : la personne a retiré le sujet entre-temps', async () => {
    b.tables.knowledge_facts[0].superseded_at = '2026-11-19T08:00:00.000Z';
    await refuse({}, 409, 'conditions_non_tenues');
  });
  it('un état illisible : on ne sait pas si les conditions tiennent, donc on n’écrit pas', async () => {
    b.panne = (e) => (e.table === 'knowledge_facts' && e.op === 'select' ? 'base indisponible' : null);
    const r = await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: valide(cles[0]) });
    // Sans le sujet choisi relu, la question n'est plus admissible : refus, sans écriture.
    expect(r.ok).toBe(false);
    expect(b.ecritures).toHaveLength(0);
  });
  it('sans secret de signature, rien n’est accepté', async () => {
    const s = process.env.DISCOVERY_LOT_SECRET; delete process.env.DISCOVERY_LOT_SECRET;
    try { await refuse({}, 503, 'lot_indisponible'); } finally { process.env.DISCOVERY_LOT_SECRET = s; }
  });
  it('le journal refuse l’écriture : 503, ni progression, ni parcours', async () => {
    b.panne = (e) => (e.op === 'rpc' ? 'journal indisponible' : null);
    const r = await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: valide(cles[0]) });
    expect(r).toMatchObject({ ok: false, status: 503, motif: 'ecriture_impossible' });
    expect(b.ecritures).toHaveLength(0);
    expect(b.tables.profile_completion ?? []).toHaveLength(0);
    expect(b.tables.discovery_sessions ?? []).toHaveLength(0);
  });
});

describe('réponse admise — journal, puis progression, puis avancée', () => {
  it('écrit dans cet ordre, et pose la question suivante DU MÊME LOT', async () => {
    const r = await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: valide(cles[0]) });
    expect(r).toMatchObject({ ok: true, nouvelActe: true });
    expect(b.ecritures[0]).toMatchObject({ op: 'rpc' });
    const ordre = b.ecritures.map((e) => e.table);
    expect(ordre.indexOf('persist_journal')).toBeLessThan(ordre.indexOf('profile_completion'));
    expect(ordre.indexOf('profile_completion')).toBeLessThan(ordre.indexOf('discovery_sessions'));
    expect(b.tables.profile_completion).toMatchObject([{ question_key: cles[0], is_filled: true, status: 'answered' }]);
    if (r.ok && r.next) { expect(cles).toContain(r.next.question.question_key); expect(r.next.jeton).toBe(jeton); }
  });

  it('la même requête renvoyée ne compte pas deux fois et ne fait pas sauter la question suivante', async () => {
    const r1 = await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: valide(cles[0]) });
    const index1 = b.tables.discovery_sessions[0].current_index;
    const journal = JSON.stringify([b.tables.knowledge_sources, b.tables.knowledge_evidences]);
    const r2 = await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: valide(cles[0]) });
    expect(r2).toMatchObject({ ok: true, nouvelActe: false });
    expect(JSON.stringify([b.tables.knowledge_sources, b.tables.knowledge_evidences])).toBe(journal);
    expect(b.tables.discovery_sessions[0].current_index).toBe(index1);
    expect(b.tables.discovery_sessions).toHaveLength(1);
    expect(b.tables.profile_completion).toHaveLength(1);
    if (r1.ok && r2.ok) expect(r2.next?.question.question_key).toBe(r1.next?.question.question_key);
  });

  it('double clic simultané : un acte, un parcours, une position', async () => {
    const [r1, r2] = await Promise.all([
      traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: valide(cles[0]) }),
      traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: valide(cles[0]) }),
    ]);
    expect(r1.ok && r2.ok).toBe(true);
    expect(b.tables.knowledge_sources).toHaveLength(1);
    expect(b.tables.discovery_sessions).toHaveLength(1);
    expect(b.tables.profile_completion).toHaveLength(1);
    if (r1.ok && r2.ok) {
      expect([r1.nouvelActe, r2.nouvelActe].filter(Boolean).length).toBeLessThanOrEqual(1 + Number(r1.nouvelActe && r2.nouvelActe));
      expect(r2.next?.question.question_key).toBe(r1.next?.question.question_key);
    }
  });

  it('le même acte avec une autre réponse est refusé', async () => {
    const q = question(cles[0])!;
    await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: [cleOption(q.options[0])] });
    const journal = JSON.stringify([b.tables.knowledge_sources, b.tables.knowledge_evidences]);
    const r = await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: [cleOption(q.options[1])] });
    expect(r).toMatchObject({ ok: false, status: 409, motif: 'acte_deja_enregistre' });
    expect(JSON.stringify([b.tables.knowledge_sources, b.tables.knowledge_evidences])).toBe(journal);
  });

  it('PANNE entre la connaissance et la progression : la réponse n’est pas perdue, la question ne revient pas, le renvoi répare', async () => {
    b.panne = (e) => (e.table === 'profile_completion' && e.op !== 'select' ? 'coupure' : e.table === 'discovery_sessions' && e.op !== 'select' ? 'coupure' : null);
    const r1 = await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: valide(cles[0]) });
    expect(r1.ok).toBe(true);
    expect(b.tables.knowledge_sources).toHaveLength(1);
    expect(b.tables.profile_completion ?? []).toHaveLength(0);
    // Le journal fait foi : la question est tenue pour posée, elle ne sera pas resservie.
    b.panne = null;
    const { etat } = await lireEtat(b.client, { userId: U });
    expect(etat.dejaPosees.has(cles[0])).toBe(true);
    const { premiere } = await proposerLot(b.client, { userId: U, mode: 'full' });
    expect((verifierLot(premiere!.jeton, U) as unknown as { lot: { cles: string[] } }).lot.cles).not.toContain(cles[0]);
    // Le renvoi de la requête refait ce qui manquait, sans rien compter deux fois.
    const r2 = await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: valide(cles[0]) });
    expect(r2).toMatchObject({ ok: true, nouvelActe: false });
    expect(b.tables.knowledge_sources).toHaveLength(1);
    expect(b.tables.profile_completion).toMatchObject([{ question_key: cles[0], is_filled: true }]);
    expect(b.tables.discovery_sessions[0].current_index).toBeGreaterThanOrEqual(1);
  });

  it('passer une question : aucune connaissance, une trace, et le renvoi ne change rien', async () => {
    const r1 = await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], skip: true });
    expect(r1).toMatchObject({ ok: true, nouvelActe: false });
    expect(b.tables.knowledge_sources ?? []).toHaveLength(0);
    expect(b.tables.profile_completion).toMatchObject([{ question_key: cles[0], is_filled: false, status: 'skipped' }]);
    const index = b.tables.discovery_sessions[0].current_index;
    const r2 = await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], skip: true });
    expect(r2.ok).toBe(true);
    expect(b.tables.discovery_sessions[0].current_index).toBe(index);
    // Répondre après avoir passé n'est pas un renvoi.
    const r3 = await traiterReponse(b.client, { userId: U, jeton, questionKey: cles[0], answer: valide(cles[0]) });
    expect(r3).toMatchObject({ ok: false, status: 409 });
    expect(b.tables.knowledge_sources ?? []).toHaveLength(0);
  });

  it('A → B → A par trois lots proposés avant toute réponse, puis renvois', async () => {
    const q = question(cles[0])!;
    const A = [cleOption(q.options[0])]; const B = [cleOption(q.options[1])];
    const lot2 = (await proposerLot(b.client, { userId: U, mode: 'full' })).premiere!.jeton;
    const lot3 = (await proposerLot(b.client, { userId: U, mode: 'full' })).premiere!.jeton;
    const env = (j: string, a: string[]) => traiterReponse(b.client, { userId: U, jeton: j, questionKey: cles[0], answer: a });
    expect(await env(jeton, A)).toMatchObject({ ok: true, nouvelActe: true });
    expect(await env(lot2, B)).toMatchObject({ ok: true, nouvelActe: true });
    expect(await env(lot3, A)).toMatchObject({ ok: true, nouvelActe: true });
    expect(b.tables.knowledge_sources).toHaveLength(3);
    const vivantes = () => new Set((b.tables.knowledge_evidences ?? []).filter((e) => e.superseded_at === null).map((e) => e.source_id));
    const dernier = b.tables.knowledge_sources[2].id;
    if ((b.tables.knowledge_evidences ?? []).length > 0) expect(vivantes()).toEqual(new Set([dernier]));
    const journal = JSON.stringify([b.tables.knowledge_sources, b.tables.knowledge_evidences]);
    // Renvoi du dernier A, puis du tout premier A : rien ne bouge, B ne revient pas, le vieux A non plus.
    expect(await env(lot3, A)).toMatchObject({ ok: true, nouvelActe: false });
    expect(await env(jeton, A)).toMatchObject({ ok: true, nouvelActe: false });
    expect(JSON.stringify([b.tables.knowledge_sources, b.tables.knowledge_evidences])).toBe(journal);
  });

  it('va au bout du lot : chaque question posée vient du lot, dans l’ordre, et le parcours se termine', async () => {
    let courante: string | null = cles[0]; const posees: string[] = [];
    while (courante) {
      posees.push(courante);
      const r = await traiterReponse(b.client, { userId: U, jeton, questionKey: courante, answer: valide(courante) });
      if (!r.ok) throw new Error(`${courante} refusée : ${r.motif}`);
      courante = r.next?.question.question_key ?? null;
      if (r.done) break;
    }
    expect(posees.every((k) => cles.includes(k))).toBe(true);
    expect([...posees].sort((x, y) => cles.indexOf(x) - cles.indexOf(y))).toEqual(posees);
    expect(b.tables.discovery_sessions[0].status).toBe('completed');
    void branche; void baseAvecSujet;
  }, 30_000);
});
