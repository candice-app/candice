// PREUVE — les défauts relevés en relisant chaque route qui porte les droits serveur (18 nov.).
// Tout passe par les VRAIES routes de l'application locale, sous l'identité de chaque partie.
//   1. Invitation : fiche d'un autre, sa propre invitation, réutilisation, lien déjà confirmé.
//   2. Courriels : un prénom écrit par un autre n'y fait entrer ni balise ni lien.
//   3. Tâches planifiées : pas de secret valable, pas d'accès.
//   4. Annulation de suppression : ouvrir le lien ne fait rien ; le geste, oui.
//   5. Page d'un proche : son analyse ne sort que section par section, selon ce qu'il partage.
//   6. Dépôts de fichiers : ni type libre, ni chemin fabriqué, ni fichier d'un autre.
import { readFileSync, existsSync } from 'node:fs';
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster, APP } from './_session-http.mts';
import { ligneHistorique } from './_ligne-historique.mts';

const { admin } = pileLocale();
const v = verificateur();
const COURRIELS = process.env.MAIL_LOCAL_FILE ?? '/home/claude/pile/courriels.jsonl';
const courriels = () => existsSync(COURRIELS) ? readFileSync(COURRIELS, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l) as { to: string; subject: string; liens: string[] }) : [];
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const complet = { attention_reception: { x: 1 }, temperament_axes: { x: 1 }, lifestyle_axes: { x: 1 }, singularity_answers: { adore_faire: 'lire' } };

const A = await compteLocal('audit-pilote-a'), V = await compteLocal('audit-pilote-v'), O = await compteLocal('audit-proche'), T = await compteLocal('audit-tiers');
for (const [c, prenom] of [[A, 'Alice'], [V, 'Victor'], [O, 'Olga'], [T, 'Theo']] as const) {
  const { error } = await c.client.from('my_profile').upsert({ user_id: c.userId, ...complet, practical_info: { prenom } }, { onConflict: 'user_id' });
  if (error) throw error;
}
const cA = await cookiesDe(A.email, A.motDePasse), cV = await cookiesDe(V.email, V.motDePasse), cO = await cookiesDe(O.email, O.motDePasse), cT = await cookiesDe(T.email, T.motDePasse);
const fiche = async (c: typeof A, nom: string, extra: Record<string, unknown> = {}) => (await c.client.from('contacts').insert({ user_id: c.userId, name: nom, relationship: 'friend', ...extra }).select('id').single()).data!.id as string;
const lien = async (id: string) => (await admin.from('contacts').select('proche_user_id, proche_lien_confirme_par').eq('id', id).single()).data!;

console.log('\n══ 1. INVITATION');
const kv = await fiche(V, 'Proche de Victor'), ka = await fiche(A, 'Proche d’Alice');
let r = await poster('/api/invite/create', cA, { contactId: kv });
console.log('  A crée une invitation visant la fiche de V → HTTP', r.status);
v.verifier(r.status === 404, '1.1 : on n’invite pas sur la fiche d’un autre pilote');
r = await poster('/api/invite/create', null, { contactId: ka }); v.verifier(r.status === 401, '1.2 : sans session, 401');
r = await poster('/api/invite/create', cA, { contactId: ka });
const jeton = (r.json as { token: string }).token;
v.verifier(r.status === 200 && !!jeton, '1.3 : A invite sur SA fiche');
r = await poster('/api/invite/link', cA, { token: jeton });
v.verifier(r.status === 409 && (await lien(ka)).proche_user_id === null, '1.4 : A ne peut pas accepter sa propre invitation', `HTTP ${r.status}`);
r = await poster('/api/invite/link', cO, { token: jeton });
let l = await lien(ka);
console.log('  O accepte → HTTP', r.status, '· fiche liée à O, lien confirmé par O :', l.proche_user_id === O.userId && l.proche_lien_confirme_par === O.userId);
v.verifier(r.status === 200 && l.proche_user_id === O.userId && l.proche_lien_confirme_par === O.userId, '1.5 : la personne invitée accepte ; le lien est confirmé par elle');
r = await poster('/api/invite/link', cT, { token: jeton });
l = await lien(ka);
console.log('  T réutilise le même lien → HTTP', r.status);
v.verifier(r.status === 410 && l.proche_user_id === O.userId, '1.6 : une invitation ne sert qu’UNE fois — un second compte ne se rattache pas');
// Une invitation « d'avant », qui vise la fiche d'un autre pilote (elle pouvait être créée).
const { data: vieille } = await admin.from('invite_links').insert({ pilote_id: A.userId, contact_id: kv, pilote_name: 'Alice' }).select('token').single();
r = await poster('/api/invite/link', cT, { token: vieille!.token });
v.verifier(r.status === 409 && (await lien(kv)).proche_user_id === null, '1.7 : une ancienne invitation visant la fiche d’un autre ne rattache rien', `HTTP ${r.status}`);
r = await poster('/api/invite/create', cA, { contactId: ka });
r = await poster('/api/invite/link', cT, { token: (r.json as { token: string }).token });
l = await lien(ka);
v.verifier(r.status === 409 && l.proche_user_id === O.userId && l.proche_lien_confirme_par === O.userId, '1.8 : accepter une nouvelle invitation ne déplace pas un lien déjà confirmé par quelqu’un d’autre', `HTTP ${r.status}`);

console.log('\n══ 2. COURRIELS — un prénom hostile');
await admin.auth.admin.updateUserById(A.userId, { user_metadata: { candice_test: true, full_name: '<a href="http://mal.example/gagne">Clique</a> ici' } });
const cA2 = await cookiesDe(A.email, A.motDePasse);
let avant = courriels().length;
r = await poster('/api/profile-view/request', cA2, { targetUserId: O.userId });
await pause(1500);
let recus = courriels().slice(avant);
console.log('  A (prénom hostile) demande à voir la fiche de O → HTTP', r.status, '· courriel :', recus.map((c) => c.subject));
v.verifier(r.status === 200 && recus.length === 1 && recus[0].to === O.email, '2.1 : la demande part bien à la personne visée');
v.verifier(recus.every((c) => !/[<>]/.test(c.subject) && !/mal\.example/.test(c.subject) && c.liens.every((h) => !/mal\.example/.test(h))), '2.2 : ni balise ni lien étranger, dans le sujet comme dans le corps');
await A.client.from('profile_analysis').insert({ user_id: A.userId, contact_id: ka, summary: 'x' });
await A.client.from('contacts').update({ name: '<img src=x onerror=1> http://mal.example' }).eq('id', ka);
avant = courriels().length;
r = await poster(`/api/contacts/${ka}/consent`, cA2, {});
await pause(1500); recus = courriels().slice(avant);
console.log('  A propose de partager son analyse à O (lien confirmé) → HTTP', r.status, '·', recus.map((c) => c.subject));
v.verifier(r.status === 200 && recus.length === 1 && recus[0].to === O.email && !/[<>]/.test(recus[0].subject) && recus[0].liens.every((h) => !/mal\.example/.test(h)), '2.3 : proposition envoyée, sans balise ni lien étranger');
const kd = await fiche(A, 'Désigné', { proche_user_id: T.userId });
await A.client.from('profile_analysis').insert({ user_id: A.userId, contact_id: kd, summary: 'x' });
avant = courriels().length;
r = await poster(`/api/contacts/${kd}/consent`, cA2, {});
await pause(1200);
console.log('  A vise un compte qu’il a seulement DÉSIGNÉ (T n’a rien accepté) → HTTP', r.status, '· courriels :', courriels().length - avant);
v.verifier(r.status === 422 && courriels().length === avant, '2.4 : on n’écrit pas, au nom de Candice, à un compte seulement désigné');
r = await poster(`/api/contacts/${ka}/consent`, cV, {}); v.verifier(r.status === 404, '2.5 : un autre pilote ne peut pas proposer sur cette fiche', `HTTP ${r.status}`);

// L'invitation par courriel : destinataire, prénom et lien étaient lus dans la requête.
avant = courriels().length;
r = await poster('/api/emails/questionnaire-invite', cA2, { contactEmail: 'victime@test.candice.invalid', contactFirstName: 'Vous', profileUrl: 'http://mal.example/connexion' });
await pause(800);
console.log('  A fait envoyer une « invitation » à une adresse et vers un lien de son choix → HTTP', r.status, '· courriels :', courriels().length - avant);
v.verifier(r.status === 400 && courriels().length === avant, '2.6 : l’adresse et le lien fournis par le navigateur ne sont plus acceptés');
r = await poster('/api/emails/questionnaire-invite', cA2, { contactId: kv });
v.verifier(r.status === 404, '2.7 : ni pour la fiche d’un autre pilote', `HTTP ${r.status}`);
const kmail = await fiche(A, '<b>Zoé</b> http://mal.example', { email: 'zoe@test.candice.invalid' });
const { data: invV } = await admin.from('invite_links').insert({ pilote_id: V.userId, contact_id: kv, pilote_name: 'Victor' }).select('token').single();
r = await poster('/api/emails/questionnaire-invite', cA2, { contactId: kmail, token: invV!.token });
v.verifier(r.status === 404, '2.8 : ni avec le jeton d’invitation d’un autre', `HTTP ${r.status}`);
avant = courriels().length;
r = await poster('/api/emails/questionnaire-invite', cA2, { contactId: kmail, profileUrl: 'http://mal.example/x', contactEmail: 'autre@test.candice.invalid' });
await pause(800); recus = courriels().slice(avant);
const hotes = [...new Set(recus.flatMap((c) => c.liens.map((h) => { try { return new URL(h).host; } catch { return h; } })))];
console.log('  A invite sa propre fiche (en glissant encore un lien et une adresse) → HTTP', r.status, '· à :', recus.map((c) => c.to), '· hôtes des liens :', hotes);
v.verifier(r.status === 200 && recus.length === 1 && recus[0].to === 'zoe@test.candice.invalid' && hotes.length === 1 && !/mal\.example/.test(hotes[0]) && !/[<>]/.test(recus[0].subject),
  '2.9 : le courriel part à l’adresse DE LA FICHE, avec des liens vers Candice seulement');
r = await poster('/api/emails/profile-complete', null, { ownerEmail: 'victime@test.candice.invalid', ownerFirstName: '<a href="http://mal.example">x</a>' });
console.log('  l’ancienne route d’envoi SANS authentification → HTTP', r.status, '· courriels :', courriels().length - avant - recus.length);
v.verifier(r.status !== 200 && courriels().length === avant + recus.length, '2.10 : la route qui envoyait un courriel à n’importe qui, sans session, n’existe plus');

console.log('\n══ 3. TÂCHES PLANIFIÉES');
const cron = async (chemin: string, methode: string, entete?: string) => (await fetch(`${APP}${chemin}`, { method: methode, headers: { 'content-type': 'application/json', ...(entete ? { authorization: entete } : {}) }, ...(methode === 'POST' ? { body: JSON.stringify({ userId: T.userId, email: 'personne@test.candice.invalid', daysLeft: 3 }) } : {}) })).status;
avant = courriels().length;
const essais = [await cron('/api/emails/trial-reminder', 'POST'), await cron('/api/emails/trial-reminder', 'POST', 'Bearer undefined'), await cron('/api/emails/trial-reminder', 'POST', 'Bearer '), await cron('/api/emails/trial-reminder', 'POST', 'Bearer faux-secret-de-vingt-quatre-c'),
  await cron('/api/cron/cadence-feedback', 'GET', 'Bearer undefined'), await cron('/api/cron/email-reminders', 'GET', 'Bearer undefined'), await cron('/api/cron/lifecycle-check', 'GET', 'Bearer undefined'), await cron('/api/cron/detect-and-generate', 'GET', 'Bearer undefined'), await cron('/api/emails/reminder-suggestion', 'POST', 'Bearer undefined')];
console.log('  sans en-tête, « Bearer undefined », vide, faux → HTTP', essais.join(' '));
v.verifier(essais.every((s) => s === 401) && courriels().length === avant, '3.1 : six routes planifiées, aucune ne s’ouvre sans le secret ; aucun courriel parti');
v.verifier(await cron('/api/cron/cadence-feedback', 'GET', `Bearer ${process.env.CRON_SECRET ?? 'secret-local-de-vingt-quatre-car'}`) === 200, '3.2 : avec le secret, la tâche s’exécute');

console.log('\n══ 4. ANNULATION D’UNE SUPPRESSION DE COMPTE');
const jetonSup = globalThis.crypto.randomUUID();
await admin.from('my_profile').update({ subscription_status: 'cancelled', cancelled_at: new Date().toISOString(), deletion_scheduled_at: new Date(Date.now() + 30 * 864e5).toISOString(), deletion_cancel_token: jetonSup }).eq('user_id', T.userId);
const etatT = async () => (await admin.from('my_profile').select('subscription_status, deletion_scheduled_at').eq('user_id', T.userId).single()).data!;
let g = await fetch(`${APP}/api/account/cancel-deletion?t=${jetonSup}`, { headers: { 'user-agent': 'ScannerDeMessagerie/1.0' } });
let e = await etatT();
console.log('  un robot de messagerie OUVRE le lien → HTTP', g.status, '· suppression toujours programmée :', e.subscription_status === 'cancelled');
v.verifier(g.status === 200 && e.subscription_status === 'cancelled' && !!e.deletion_scheduled_at, '4.1 : ouvrir le lien n’annule rien');
g = await fetch(`${APP}/api/account/cancel-deletion`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `t=${globalThis.crypto.randomUUID()}` });
v.verifier((await etatT()).subscription_status === 'cancelled', '4.2 : un jeton inventé n’annule rien');
g = await fetch(`${APP}/api/account/cancel-deletion`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `t=${jetonSup}` });
e = await etatT();
console.log('  la personne appuie sur « Garder mon compte » → HTTP', g.status, '· état :', e.subscription_status);
v.verifier(e.subscription_status === 'active' && e.deletion_scheduled_at === null, '4.3 : le geste annule la suppression');

console.log('\n══ 5. PAGE D’UN PROCHE — son analyse, section par section');
await O.client.from('profile_analysis').insert({ user_id: O.userId, contact_id: null, summary: 'RESUME-OLGA', confidence: 0.9,
  sections: { what_touches: { text: 'TOUCHE-OLGA' }, avoid: { text: 'ACOTE-OLGA', chips: ['PUCE-ACOTE'] }, attention: { text: 'ATTENTION-OLGA' }, feels_loved: { text: 'INTIME-OLGA' } } });
const kvo = await fiche(V, 'Olga Test', { proche_user_id: O.userId });
const page = async () => { const p = await poster(`/contacts/${kvo}`, cV, null, 'GET'); return { status: p.status, vus: ['RESUME-OLGA', 'TOUCHE-OLGA', 'ACOTE-OLGA', 'PUCE-ACOTE', 'ATTENTION-OLGA', 'INTIME-OLGA'].filter((m) => p.texte.includes(m)) }; };
let p = await page(); console.log('  aucun partage → HTTP', p.status, p.vus);
v.verifier(p.status === 200 && p.vus.length === 0, '5.1 : sans partage, rien de l’analyse de O ne sort');
const { data: dem } = await V.client.from('contact_consents').insert({ pilote_id: O.userId, proche_user_id: V.userId, requested_by: V.userId, status: 'pending', kind: 'profile_view', scope: [] }).select('id').single();
p = await page(); v.verifier(p.vus.length === 0, '5.2 : demande en attente → rien');
r = await poster(`/api/profile-view/${dem!.id}/respond`, cO, { action: 'sections', sections: ['deep_miss'] });
p = await page(); console.log('  O partage UNE section (« ce qui tombe à côté ») → HTTP', r.status, '· sur la page de V :', p.vus);
v.verifier(JSON.stringify(p.vus) === '["RESUME-OLGA","ACOTE-OLGA","PUCE-ACOTE"]', '5.3 : le résumé (socle) et CETTE section sortent ; ni « ce qui touche », ni l’intime, ni la section jamais proposée', p.vus.join(', '));
await O.client.from('contact_consents').update({ scope: ['blind'] }).eq('id', dem!.id);
p = await page(); v.verifier(p.vus.length === 0, '5.4 : mode aveugle → rien ne sort', p.vus.join(', '));
r = await poster(`/api/profile-view/${dem!.id}/revoke`, cO, {});
p = await page(); console.log('  O retire son partage → HTTP', r.status, '·', p.vus);
v.verifier(p.vus.length === 0, '5.5 : partage retiré → rien');
const idH = ligneHistorique({ kind: 'profile_view', piloteId: O.userId, procheId: V.userId, scope: ['deep_touch', 'deep_miss', 'deep_loved'] });
p = await page();
const f = await poster(`/fiche/${idH}`, cV, null, 'GET');
console.log('  ligne ancienne, active, SANS preuve → page du proche :', p.vus, '· fiche partagée :', /non disponible/i.test(f.texte) ? 'non disponible' : 'AFFICHÉE');
v.verifier(p.vus.length === 0 && !/OLGA/.test(f.texte), '5.6 : un partage actif sans preuve d’accord n’ouvre ni la page du proche, ni la fiche partagée');

console.log('\n══ 6. DÉPÔTS DE FICHIERS');
const deposer = async (chemin: string, cookie: string, champs: Record<string, string>, fichier: { nom: string; type: string; contenu: string }) => {
  const fd = new FormData(); for (const [k, val] of Object.entries(champs)) fd.set(k, val);
  fd.set('file', new File([fichier.contenu], fichier.nom, { type: fichier.type }));
  return (await fetch(`${APP}${chemin}`, { method: 'POST', headers: { cookie, 'user-agent': UA }, body: fd })).status;
};
const s1 = await deposer('/api/wishlist/photo', cA2, {}, { nom: 'x.html', type: 'text/html', contenu: '<script>1</script>' });
const s2 = await deposer('/api/wishlist/photo', cA2, {}, { nom: 'photo.jpg', type: 'image/svg+xml', contenu: '<svg/>' });
const s3 = await deposer('/api/wishlist/photo', cA2, { scope: 'carnet', contactId: `../../${V.userId}` }, { nom: 'a.png', type: 'image/png', contenu: 'x' });
const s4 = await deposer('/api/wishlist/photo', cA2, { scope: 'carnet', contactId: kv }, { nom: 'a.png', type: 'image/png', contenu: 'x' });
const s5 = await deposer('/api/contacts/upload-photo', cA2, { contactId: kv }, { nom: 'a.png', type: 'image/png', contenu: 'x' });
const s6 = await deposer('/api/contacts/upload-photo', cA2, { contactId: ka }, { nom: 'a.png/../../x', type: 'text/html', contenu: 'x' });
console.log('  type html, svg déguisé, identifiant fabriqué, fiche d’un autre (carnet), fiche d’un autre (photo), extension fabriquée → HTTP', s1, s2, s3, s4, s5, s6);
v.verifier(s1 === 415 && s2 === 415, '6.1 : seul un type image admis entre');
v.verifier(s3 === 400 && s4 === 404 && s5 === 404, '6.2 : ni identifiant fabriqué, ni fiche d’un autre dans le chemin');
v.verifier(s6 === 415, '6.3 : l’extension ne vient plus du nom du fichier');
r = await poster('/api/carnet/identify', cA2, { path: `${V.userId}/wishlist/1.jpg` });
const r2 = await poster('/api/carnet/identify', cA2, { path: `${A.userId}/../${V.userId}/wishlist/1.jpg` });
v.verifier(r.status === 400 && r2.status === 400, '6.4 : on ne fait pas lire au modèle le fichier d’un autre', `HTTP ${r.status} ${r2.status}`);

console.log('\n══ 7. ROUTES QUI APPELLENT LE MODÈLE — plus aucune sans session');
{
  const MODELE = process.env.ANTHROPIC_BASE_URL!;
  const appels = async () => ((await (await fetch(`${MODELE}/__etat`)).json()) as { recus: unknown[] }).recus.length;
  const n0 = await appels();
  const a = await poster('/api/lifestyle/extract-filters', null, { text: 'il déteste les surprises publiques et le bruit' });
  const b = await poster('/api/questionnaire-insight', null, { answers: { love_language: 'words' }, persona: 'self' });
  const c = await poster('/api/profile/synthesis', null, { facts: {} });
  const n1 = await appels();
  console.log('  sans session → HTTP', a.status, b.status, c.status, '· appels au modèle provoqués :', n1 - n0);
  v.verifier(a.status === 401 && b.status === 401 && c.status === 401 && n1 === n0, '7.1 : trois routes fermées ; aucun appel au modèle provoqué par un inconnu');
  const d = await poster('/api/questionnaire/proche-register', null, { token: 'x', response_data: { a: 1 } });
  v.verifier(d.status === 404, '7.2 : l’ancienne route d’écriture sans session n’existe plus', `HTTP ${d.status}`);
}

console.log('\n══ 8. LIEN DE PARTAGE, RETRAIT, ANNULATION — chaque route, par chaque partie');
{
  let q = await poster('/api/share-link/create', null, { mode: 'all' }); v.verifier(q.status === 401, '8.1 : créer un lien sans session → 401');
  q = await poster('/api/share-link/create', cO, { mode: 'sections', sections: ['deep_miss', 'analysis', 'reco:regime', 'facts_allergies:arachide'] });
  const url = (q.json as { url: string }).url; const jetonLien = url.split('/').pop()!;
  const ouvrir = (cookie: string) => poster(`/rejoindre/${jetonLien}`, cookie, null, 'GET');
  const duLien = async (lecteur: string) => (await admin.from('contact_consents').select('id, status, scope, granted_by, granted_via, requested_by').eq('kind', 'profile_view').eq('pilote_id', O.userId).eq('proche_user_id', lecteur).eq('status', 'active')).data ?? [];
  let o = await ouvrir(cO);
  v.verifier((await duLien(O.userId)).length === 0, '8.2 : le propriétaire ne « réclame » pas son propre lien');
  o = await ouvrir(cA2);
  let la = await duLien(A.userId);
  console.log('  O crée un lien (une section ; il tente d’y glisser « analysis », un usage et une allergie qu’il n’a pas) → A l’ouvre → HTTP', o.status, '· portée :', la[0]?.scope, '· accordé par O :', la[0]?.granted_by === O.userId, '· via', la[0]?.granted_via);
  v.verifier(la.length === 1 && JSON.stringify(la[0].scope) === '["deep_miss"]' && la[0].granted_by === O.userId && la[0].granted_via === 'serveur',
    '8.3 : le lien ouvre exactement la section choisie ; la base n’accepte l’écriture du serveur que parce qu’elle nomme le propriétaire');
  o = await ouvrir(cT);
  v.verifier((await duLien(T.userId)).length === 0, '8.4 : le lien est à usage unique — un second compte n’obtient rien');
  const idLien = la[0].id as string;
  q = await poster(`/api/profile-view/${idLien}/revoke`, cA2, {}); const q2 = await poster(`/api/profile-view/${idLien}/revoke`, cT, {}); const q3 = await poster(`/api/profile-view/${idLien}/revoke`, null, {});
  v.verifier(q.status === 404 && q2.status === 404 && q3.status === 401 && (await duLien(A.userId)).length === 1, '8.5 : ni le lecteur, ni un tiers, ni un inconnu ne retirent le partage à la place du propriétaire', `HTTP ${q.status} ${q2.status} ${q3.status}`);
  q = await poster(`/api/profile-view/${idLien}/respond`, cA2, { action: 'all' });
  v.verifier(q.status === 404 && JSON.stringify((await duLien(A.userId))[0].scope) === '["deep_miss"]', '8.6 : le lecteur ne peut pas « répondre » pour tout s’ouvrir', `HTTP ${q.status}`);
  q = await poster(`/api/profile-view/${idLien}/revoke`, cO, {});
  v.verifier(q.status === 200 && (await duLien(A.userId)).length === 0, '8.7 : le propriétaire retire ; le partage est fermé');
  o = await ouvrir(cA2);
  v.verifier((await duLien(A.userId)).length === 0, '8.8 : rouvrir le lien après le retrait ne recrée pas l’accès');
  // Annuler une demande : seulement son auteur, seulement en attente.
  const { data: dd } = await T.client.from('contact_consents').insert({ pilote_id: O.userId, proche_user_id: T.userId, requested_by: T.userId, status: 'pending', kind: 'profile_view', scope: [] }).select('id').single();
  q = await poster(`/api/profile-view/${dd!.id}/cancel`, cA2, {}); const qo = await poster(`/api/profile-view/${dd!.id}/cancel`, cO, {});
  const encore = (await admin.from('contact_consents').select('id').eq('id', dd!.id)).data ?? [];
  v.verifier(q.status === 404 && qo.status === 404 && encore.length === 1, '8.9 : seul l’auteur d’une demande peut l’annuler', `HTTP ${q.status} ${qo.status}`);
  q = await poster(`/api/profile-view/${dd!.id}/cancel`, cT, {});
  v.verifier(q.status === 200, '8.10 : son auteur l’annule');
}

console.log('\n══ 9. UNE ADRESSE OU UN NUMÉRO NE RÉVÈLE PLUS L’EXISTENCE D’UN COMPTE');
{
  await admin.from('my_profile').update({ handle: `olga_${Date.now().toString(36)}`, phone: '06 11 22 33 44' }).eq('user_id', O.userId);
  const identifiant = (await admin.from('my_profile').select('handle').eq('user_id', O.userId).single()).data!.handle as string;
  const inconnu = 'personne-inexistante@test.candice.invalid';
  const a1 = await poster('/api/contacts/lookup', cA2, { email: O.email }), a2 = await poster('/api/contacts/lookup', cA2, { email: inconnu });
  const a3 = await poster('/api/contacts/lookup', cA2, { phone: '0611223344' }), a4 = await poster('/api/contacts/lookup', cA2, { phone: '0700000000' });
  console.log('  ajout d’un proche — adresse d’un compte existant :', a1.texte, '· adresse inconnue :', a2.texte, '· numéro existant :', a3.texte);
  v.verifier(a1.status === 200 && a1.texte === a2.texte && a3.texte === a4.texte && a1.texte === a3.texte && !a1.texte.includes(O.userId), '9.1 : ajouter un proche — même réponse, à l’octet près, que l’adresse ou le numéro ait un compte ou non');
  const b1 = await poster('/api/profile-view/lookup', cA2, { query: O.email }), b2 = await poster('/api/profile-view/lookup', cA2, { query: inconnu }), b3 = await poster('/api/profile-view/lookup', cA2, { query: 'identifiant-qui-n-existe-pas' });
  console.log('  recherche d’une fiche — adresse existante :', b1.texte, '· adresse inconnue :', b2.texte, '· identifiant inconnu :', b3.texte);
  v.verifier(b1.status === 200 && b1.texte === b2.texte && b1.texte === b3.texte && !b1.texte.includes(O.userId), '9.2 : chercher une fiche par adresse — même réponse qu’une adresse inconnue et qu’un identifiant inconnu');
  const b4 = await poster('/api/profile-view/lookup', cA2, { query: `@${identifiant}` });
  v.verifier((b4.json as { found?: boolean }).found === true, '9.3 : (contrôle) l’identifiant que la personne a choisi et donné permet toujours de lui adresser une demande');
  await admin.from('my_profile').update({ is_findable: false }).eq('user_id', O.userId);
  const b5 = await poster('/api/profile-view/lookup', cA2, { query: `@${identifiant}` });
  const b6 = await poster('/api/profile-view/lookup', cA2, { query: 'identifiant_inconnu_valide' });
  v.verifier(b5.texte === b3.texte && b6.texte === b3.texte, '9.4 : une personne qui ne veut pas être trouvée, un identifiant inconnu, un format invalide : la même réponse');
  const d1 = await A.client.rpc('lookup_candice_user_by_email', { p_email: O.email }), d2 = await A.client.rpc('lookup_candice_user_by_phone', { p_phone: '0611223344' });
  v.verifier(!!d1.error && !!d2.error, '9.5 : les fonctions de recherche de la base ne s’appellent pas directement depuis un compte', `${d1.error?.message ?? 'OUVERTE'} · ${d2.error?.message ?? 'OUVERTE'}`);
}
v.bilan();
