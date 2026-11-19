// LA ROUTE DE RÉPONSE EST FERMÉE, ET UN ACTE NE COMPTE QU'UNE FOIS — vraies routes HTTP, pile locale.
//
// Tout passe par l'application qui tourne (next dev), avec les cookies qu'un navigateur aurait.
// Après chaque refus on RELIT la base : rien ne doit avoir bougé — ni connaissance, ni réponse,
// ni progression, ni parcours. (Remplace l'essai 31, qui envoyait encore `pendingKeys`.)
import { compteLocal, verificateur } from './_compte-local.mts';
import { cookiesDe, poster, obtenirLot, repondre } from './_session-http.mts';
import { BANQUE, question } from '../../src/lib/discovery/open-v3/banque.ts';
import { analyserCondition } from '../../src/lib/discovery/open-v3/conditions.ts';
import { cleOption } from '../../src/lib/discovery/open-v3/cle-option.ts';
import { produireDepuisOption } from '../../src/lib/discovery/open-v3/produire.ts';

const v = verificateur();
const a = await compteLocal('route-fermee-a'); const cookieA = await cookiesDe(a.email, a.motDePasse);
const b = await compteLocal('route-fermee-b'); const cookieB = await cookiesDe(b.email, b.motDePasse);

/** Tout ce qu'une réponse peut écrire pour ce compte, compté. */
async function photo(c = a) {
  const n = async (table: string) => ((await c.client.from(table).select('id', { count: 'exact', head: true }).eq('user_id', c.userId)).count ?? -1);
  const fatigue = ((await c.client.from('my_profile').select('discovery_fatigue_score').eq('user_id', c.userId).maybeSingle()).data as { discovery_fatigue_score?: number } | null)?.discovery_fatigue_score ?? 0;
  return JSON.stringify({ sources: await n('knowledge_sources'), preuves: await n('knowledge_evidences'), faits: await n('knowledge_facts'), ouvertes: await n('knowledge_open_knowledge'), progression: await n('profile_completion'), parcours: await n('discovery_sessions'), fatigue });
}
const sujet = async (cookie: string, branche: string, choisi: boolean) => (await poster('/api/discovery/sujet', cookie, { branche, choisi })).status;

// ── Un sujet choisi par la personne : de quoi faire proposer un lot. On cherche un sujet dont
//    les trois premières questions sont fermées et productives.
const { sujetsExplorables } = await import('../../src/lib/discovery/open-v3/service.ts');
let lot: Awaited<ReturnType<typeof obtenirLot>> = null; let branche = '';
for (const s of sujetsExplorables()) {
  if (await sujet(cookieA, s.branche, true) !== 200) continue;
  const l = await obtenirLot(cookieA);
  const q = l && question(l.question.question_key);
  if (l && q && q.forme === 'single' && q.options.length >= 3 && q.options.slice(0, 2).every((o) => produireDepuisOption(q, o).type === 'evidence')) { lot = l; branche = s.branche; break; }
  await sujet(cookieA, s.branche, false);
}
if (!lot) throw new Error('aucun sujet ne donne un lot exploitable');
const Q = lot.question.question_key; const q = question(Q)!;
const A = [cleOption(q.options[0])], B = [cleOption(q.options[1])];
console.log(`sujet « ${branche} », question ${Q} (${q.forme})`);
// La fatigue se compte sur la fiche : le compte de test en reçoit une, comme après l'inscription.
{ const { error } = await a.client.from('my_profile').insert({ user_id: a.userId }); if (error && error.code !== '23505') throw new Error(`fiche de test : ${error.message}`); }
const depart = await photo();

console.log('\n— Refus : rien n’est écrit');
const refuse = async (libelle: string, cookie: string | null, corps: Record<string, unknown>, status: number, motif?: string) => {
  const r = await repondre(cookie, corps);
  const apres = await photo();
  v.verifier(r.status === status && (motif === undefined || r.motif === motif) && apres === depart, libelle, `HTTP ${r.status} ${r.motif ?? ''} · base ${apres === depart ? 'inchangée' : 'MODIFIÉE ' + apres}`);
};
await refuse('sans session : 401', null, { jeton: lot.jeton, questionKey: Q, answer: A }, 401);
await refuse('appel direct sans lot', cookieA, { questionKey: Q, answer: A }, 400, 'lot_absent');
await refuse('l’ancien corps (sessionId nul + pendingKeys) n’est plus cru', cookieA, { sessionId: null, pendingKeys: [Q], currentIndex: 0, mode: 'full', questionKey: Q, answer: A }, 400, 'lot_absent');
await refuse('une liste de questions à la place du jeton', cookieA, { jeton: JSON.stringify([Q]), questionKey: Q, answer: A }, 403, 'lot_invalide');
await refuse('jeton à la signature retouchée', cookieA, { jeton: lot.jeton.slice(0, -3) + (lot.jeton.endsWith('AAA') ? 'BBB' : 'AAA'), questionKey: Q, answer: A }, 403, 'lot_invalide');
{
  const [ver, corps, sig] = lot.jeton.split('.');
  const lu = JSON.parse(Buffer.from(corps, 'base64url').toString('utf8'));
  const sensible = BANQUE.find((x) => analyserCondition(x.condition_emission).sensible && x.forme === 'single')!;
  const reecrit = Buffer.from(JSON.stringify({ ...lu, k: [sensible.id] })).toString('base64url');
  await refuse(`jeton réécrit pour y glisser une question sensible (${sensible.id}), signature d’origine`, cookieA, { jeton: `${ver}.${reecrit}.${sig}`, questionKey: sensible.id, answer: [cleOption(sensible.options[0])] }, 403, 'lot_invalide');
  await refuse(`question sensible hors du lot (${sensible.id})`, cookieA, { jeton: lot.jeton, questionKey: sensible.id, answer: [cleOption(sensible.options[0])] }, 403, 'question_non_proposee');
}
const arbitraire = BANQUE.find((x) => x.branche !== q.branche && x.forme === 'single')!;
await refuse(`question arbitraire de la banque (${arbitraire.id})`, cookieA, { jeton: lot.jeton, questionKey: arbitraire.id, answer: [cleOption(arbitraire.options[0])] }, 403, 'question_non_proposee');
await refuse('clé de l’ancienne banque', cookieA, { jeton: lot.jeton, questionKey: 'practical.dietary', answer: { choices: ['vegan'] } }, 403, 'question_non_proposee');
await refuse('option étrangère à la question', cookieA, { jeton: lot.jeton, questionKey: Q, answer: ['option-fabriquee'] }, 400, 'forme_invalide');
await refuse('deux options à une question à choix unique', cookieA, { jeton: lot.jeton, questionKey: Q, answer: [...A, ...B] }, 400, 'forme_invalide');
await refuse('un objet à la place d’une réponse', cookieA, { jeton: lot.jeton, questionKey: Q, answer: { choices: A } }, 400, 'forme_invalide');
{
  const photoB = await photo(b);
  const r = await repondre(cookieB, { jeton: lot.jeton, questionKey: Q, answer: A });
  v.verifier(r.status === 403 && r.motif === 'lot_autre_compte' && (await photo(b)) === photoB && (await photo()) === depart, 'le lot de A présenté par B : refusé, rien d’écrit chez A ni chez B', `HTTP ${r.status} ${r.motif}`);
}
{
  // LA TABLE DES PARCOURS EST INSCRIPTIBLE PAR LA PERSONNE (politique d'accès). B y fabrique un
  // parcours listant une question qu'on ne lui a pas proposée : cela ne prouve rien.
  const ins = await b.client.from('discovery_sessions').insert({ user_id: b.userId, mode: 'full', pending_keys: [arbitraire.id], current_index: 0, status: 'active' }).select('id').single();
  const avant = await photo(b);
  const r = await repondre(cookieB, { sessionId: ins.data?.id, pendingKeys: [arbitraire.id], questionKey: arbitraire.id, answer: [cleOption(arbitraire.options[0])] });
  v.verifier(!!ins.data?.id && r.status === 400 && r.motif === 'lot_absent' && (await photo(b)) === avant, 'un parcours fabriqué directement en base ne vaut pas proposition', `HTTP ${r.status} ${r.motif}`);
}
{
  // CONDITIONS DEVENUES FAUSSES : la personne retire le sujet après avoir reçu le lot.
  v.verifier(await sujet(cookieA, branche, false) === 200, 'la personne retire le sujet');
  const apresRetrait = await photo();
  const r = await repondre(cookieA, { jeton: lot.jeton, questionKey: Q, answer: A });
  v.verifier(r.status === 409 && r.motif === 'conditions_non_tenues' && (await photo()) === apresRetrait, 'la question n’est plus d’actualité : refus, rien d’écrit', `HTTP ${r.status} ${r.motif}`);
  v.verifier(await sujet(cookieA, branche, true) === 200, 'elle le choisit de nouveau');
}

console.log('\n— Identité des actes');
// Trois lots proposés AVANT toute réponse : trois actes possibles sur la même question.
const lot1 = (await obtenirLot(cookieA))!, lot2 = (await obtenirLot(cookieA))!, lot3 = (await obtenirLot(cookieA))!;
v.verifier(lot1.question.question_key === Q && lot2.question.question_key === Q && new Set([lot1.jeton, lot2.jeton, lot3.jeton]).size === 3, 'proposer un lot n’écrit rien : la même question revient, sous trois lots distincts');
const journal = async () => {
  const s = (await a.client.from('knowledge_sources').select('id, ts, option_ref').eq('user_id', a.userId).eq('question_code', Q).order('ts')).data ?? [];
  const e = s.length ? ((await a.client.from('knowledge_evidences').select('id, source_id, superseded_at').in('source_id', s.map((x) => x.id))).data ?? []) : [];
  return { sources: s.length, refs: s.map((x) => x.option_ref), preuves: e.length, vivantes: [...new Set(e.filter((x) => x.superseded_at === null).map((x) => s.find((y) => y.id === x.source_id)?.option_ref))] };
};
const fatigue = async () => JSON.parse(await photo()).fatigue as number;
const f0 = await fatigue();

const [d1, d2] = await Promise.all([repondre(cookieA, { jeton: lot1.jeton, questionKey: Q, answer: A }), repondre(cookieA, { jeton: lot1.jeton, questionKey: Q, answer: A })]);
let j = await journal();
const parcours = async () => (await a.client.from('discovery_sessions').select('id, current_index, status').eq('user_id', a.userId)).data ?? [];
v.verifier(d1.status === 200 && d2.status === 200 && j.sources === 1 && j.vivantes.length === 1, 'double clic simultané : une seule source, des preuves une seule fois', JSON.stringify(j));
v.verifier((await parcours()).length === 1, 'double clic : un seul parcours créé', JSON.stringify(await parcours()));
v.verifier(d1.next?.question.question_key === d2.next?.question.question_key, 'double clic : les deux requêtes rendent la même question suivante');
const f1 = await fatigue();
v.verifier(f1 - f0 === 1, 'double clic : la fatigue compte un acte, pas deux requêtes', `${f0} → ${f1}`);
const index1 = (await parcours())[0]?.current_index;

const r = await repondre(cookieA, { jeton: lot1.jeton, questionKey: Q, answer: A });
j = await journal();
v.verifier(r.status === 200 && j.sources === 1 && (await fatigue()) === f1 && (await parcours())[0]?.current_index === index1, 'la même requête renvoyée : rien de plus, ni fatigue, ni avancée', JSON.stringify(j));
const autre = await repondre(cookieA, { jeton: lot1.jeton, questionKey: Q, answer: B });
v.verifier(autre.status === 409 && autre.motif === 'acte_deja_enregistre' && (await journal()).sources === 1, 'le même acte avec une AUTRE réponse : refusé', `HTTP ${autre.status} ${autre.motif}`);

const rb = await repondre(cookieA, { jeton: lot2.jeton, questionKey: Q, answer: B });
j = await journal();
v.verifier(rb.status === 200 && j.sources === 2 && JSON.stringify(j.vivantes) === JSON.stringify([B.join(',')]), 'A puis B (autre lot) : B est le dernier mot, A reste lisible', JSON.stringify(j));
const ra = await repondre(cookieA, { jeton: lot3.jeton, questionKey: Q, answer: A });
j = await journal();
v.verifier(ra.status === 200 && j.sources === 3 && JSON.stringify(j.vivantes) === JSON.stringify([A.join(',')]), 'A → B → A : le dernier A est un acte à part entière, seul vivant', JSON.stringify(j));
const f3 = await fatigue();
v.verifier(f3 - f0 === 3, 'trois actes distincts comptent trois fois', `${f0} → ${f3}`);
const avantRenvois = JSON.stringify(await journal());
const renvoiDernier = await repondre(cookieA, { jeton: lot3.jeton, questionKey: Q, answer: A });
const renvoiPremier = await repondre(cookieA, { jeton: lot1.jeton, questionKey: Q, answer: A });
v.verifier(renvoiDernier.status === 200 && renvoiPremier.status === 200 && JSON.stringify(await journal()) === avantRenvois && (await fatigue()) === f3, 'renvoi du dernier A, puis du tout premier : rien ne bouge, le vieux A ne ressuscite pas');

console.log('\n— La suite du lot vient du serveur');
{
  if (d1.next) v.verifier(d1.next.jeton === lot1.jeton, 'la question suivante porte le même lot signé');
  const lot4 = await obtenirLot(cookieA);
  v.verifier(!!lot4 && lot4.question.question_key !== Q, 'la question répondue n’est plus proposée ; le serveur en propose une autre', lot4?.question.question_key ?? 'aucune');
  if (lot4) {
    const hors = await repondre(cookieA, { jeton: lot4.jeton, questionKey: arbitraire.id, answer: [cleOption(arbitraire.options[0])] });
    v.verifier(hors.status === 403, 'une question hors du lot reste refusée', `HTTP ${hors.status}`);
    const avant = await photo();
    const s = await repondre(cookieA, { jeton: lot4.jeton, questionKey: lot4.question.question_key, skip: true });
    const s2 = await repondre(cookieA, { jeton: lot4.jeton, questionKey: lot4.question.question_key, skip: true });
    const ap = JSON.parse(await photo()), av = JSON.parse(avant);
    v.verifier(s.status === 200 && s2.status === 200 && ap.sources === av.sources && ap.fatigue === av.fatigue && ap.progression === av.progression + 1, 'passer une question : aucune connaissance, une trace ; le renvoi ne change rien', `${avant} → ${JSON.stringify(ap)}`);
    const apresPasse = await repondre(cookieA, { jeton: lot4.jeton, questionKey: lot4.question.question_key, answer: [lot4.question.options?.[0]?.value ?? 'x'] });
    v.verifier(apresPasse.status === 409, 'répondre après avoir passé n’est pas un renvoi : refusé', `HTTP ${apresPasse.status} ${apresPasse.motif}`);
  }
}
v.bilan();
