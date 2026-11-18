// PREUVE — limites d'envoi des courriels déclenchés par un utilisateur (migration 119).
// Vraies routes ; les courriels « partis » sont ceux que le transport local a consignés.
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';

const { admin } = pileLocale();
const v = verificateur();
const BASE = process.env.BASE_LOCALE ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
if (!/@127\.0\.0\.1:54322\//.test(BASE)) throw new Error('base locale uniquement');
const sql = (q: string) => execFileSync('psql', [BASE, '-At', '-v', 'ON_ERROR_STOP=1', '-c', q], { encoding: 'utf8' }).trim();
const COURRIELS = process.env.MAIL_LOCAL_FILE ?? '/home/claude/pile/courriels.jsonl';
const partis = (vers?: string) => (existsSync(COURRIELS) ? readFileSync(COURRIELS, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l) as { to: string }) : []).filter((c) => !vers || c.to === vers).length;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const marque = Date.now().toString(36);
const adr = (n: string) => `${n}-${marque}@test.candice.invalid`;
const fiche = async (c: Awaited<ReturnType<typeof compteLocal>>, email: string) => (await c.client.from('contacts').insert({ user_id: c.userId, name: 'Zoé Test', relationship: 'friend', email }).select('id').single()).data!.id as string;
const inviter = (cookie: string, contactId: string) => poster('/api/emails/questionnaire-invite', cookie, { contactId });
// Faire vieillir les réservations d'un expéditeur vers un destinataire (base locale) : remplace l'attente.
const vieillir = (expediteur: string, heures: number) => sql(`update envois_courriel set cree_le = cree_le - interval '${heures} hours' where expediteur = '${expediteur}'`);

const A = await compteLocal('limite-alice');
const cA = await cookiesDe(A.email, A.motDePasse);

console.log('\n══ 1. RÉPÉTITION — même expéditeur, même destinataire');
const z = adr('zoe'), kz = await fiche(A, z);
let r1 = await inviter(cA, kz), r2 = await inviter(cA, kz), r3 = await inviter(cA, kz); await pause(600);
console.log('  trois invitations de suite à la même adresse → HTTP', r1.status, r2.status, r3.status, '· courriels partis :', partis(z));
v.verifier(r1.status === 200 && r2.status === 429 && r3.status === 429 && partis(z) === 1, '1.1 : un seul courriel part ; les répétitions sont refusées (429)');
v.verifier(!/zoe|@/.test(sql('select string_agg(destinataire_h, \',\') from envois_courriel')), '1.2 : la base ne conserve aucune adresse — seulement une empreinte');
const rap = await poster('/api/emails/reminder', cA, { contactId: kz }); await pause(400);
v.verifier(rap.status === 200 && partis(z) === 2, '1.3 : un autre type de courriel (rappel) vers la même personne a sa propre limite', `HTTP ${rap.status}`);
v.verifier((await poster('/api/emails/reminder', cA, { contactId: kz })).status === 429, '1.4 : et sa propre répétition est refusée');

console.log('\n══ 2. APPELS SIMULTANÉS');
const y = adr('yann'), ky = await fiche(A, y);
const rafale = await Promise.all(Array.from({ length: 8 }, () => inviter(cA, ky))); await pause(800);
const codes = rafale.map((x) => x.status).sort().join(' ');
console.log('  huit invitations lancées EN MÊME TEMPS à la même adresse → HTTP', codes, '· courriels partis :', partis(y));
v.verifier(rafale.filter((x) => x.status === 200).length === 1 && partis(y) === 1, '2.1 : une seule passe, un seul courriel part — pas de course');

console.log('\n══ 3. DANS LA DURÉE — trois par trente jours');
vieillir(A.userId, 25);                       // comme si 25 h s'étaient écoulées
r1 = await inviter(cA, kz); vieillir(A.userId, 25); r2 = await inviter(cA, kz); vieillir(A.userId, 25); r3 = await inviter(cA, kz); await pause(500);
console.log('  une invitation par « jour » à la même adresse (2e, 3e, 4e) → HTTP', r1.status, r2.status, r3.status);
v.verifier(r1.status === 200 && r2.status === 200 && r3.status === 429, '3.1 : la 2e et la 3e passent à un jour d’écart ; la 4e en trente jours est refusée');

console.log('\n══ 4. PLAFOND PAR EXPÉDITEUR — vingt par jour');
const S = await compteLocal('limite-serge'); const cS = await cookiesDe(S.email, S.motDePasse);
const resultats: number[] = [];
for (let i = 0; i < 22; i++) resultats.push((await inviter(cS, await fiche(S, adr(`cible${i}`)))).status);
await pause(600);
console.log('  22 invitations à 22 adresses différentes → acceptées :', resultats.filter((x) => x === 200).length, '· refusées :', resultats.filter((x) => x === 429).length);
v.verifier(resultats.slice(0, 20).every((x) => x === 200) && resultats.slice(20).every((x) => x === 429), '4.1 : les vingt premières passent, les suivantes sont refusées');

console.log('\n══ 5. PLAFOND PAR DESTINATAIRE — cinq par jour, tous expéditeurs réunis');
const cible = adr('tres-sollicitee'); const codes5: number[] = [];
for (let i = 0; i < 6; i++) { const E = await compteLocal(`limite-exp${i}`); codes5.push((await inviter(await cookiesDe(E.email, E.motDePasse), await fiche(E, cible))).status); }
await pause(600);
console.log('  six comptes différents invitent la même adresse → HTTP', codes5.join(' '), '· courriels reçus :', partis(cible));
v.verifier(codes5.slice(0, 5).every((x) => x === 200) && codes5[5] === 429 && partis(cible) === 5, '5.1 : la personne ne reçoit pas plus de cinq courriels par jour, quel que soit le nombre de comptes');

console.log('\n══ 6. VERS SOI-MÊME, ET HORS DE PORTÉE DES SESSIONS');
const ex = [await poster('/api/account/export', cA, {}), await poster('/api/account/export', cA, {}), await poster('/api/account/export', cA, {}), await poster('/api/account/export', cA, {})].map((x) => x.status);
v.verifier(ex.slice(0, 3).every((x) => x === 200) && ex[3] === 429, '6.1 : export de ses données : trois par jour, le quatrième est refusé', ex.join(' '));
const direct = await A.client.rpc('reserver_envoi', { p_expediteur: A.userId, p_destinataire_h: 'x', p_type: 'invitation', p_a_soi: false });
const lecture = await A.client.from('envois_courriel').select('id').limit(1);
const purge = await A.client.from('envois_courriel').delete().eq('expediteur', A.userId).select('id');
v.verifier(!!direct.error && (lecture.data ?? []).length === 0 && (purge.data ?? []).length === 0, '6.2 : une session ne peut ni appeler la réservation, ni lire le registre, ni l’effacer pour repartir de zéro', direct.error?.message ?? 'OUVERT');
console.log('  registre :', sql('select count(*) from envois_courriel'), 'réservations, tenues dans la base (elles survivent à un redémarrage du serveur)');
v.bilan();
