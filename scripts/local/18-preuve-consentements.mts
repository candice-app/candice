// PREUVE — qui peut accorder ou élargir un consentement, et ce qu'un consentement ouvre.
//
// Depuis la migration 116, trois types, trois sens :
//   contact_analysis — le PILOTE propose de partager son analyse, le proche accepte de la voir ;
//   profile_usage    — le PROCHE autorise l'usage de ses propres données, donnée par donnée ;
//   profile_view     — une personne partage SA fiche à quelqu'un.
//
// Partie A : APPELS DIRECTS À LA BASE, sous l'identité de chaque partie (RLS + garde).
// Partie B : la portée, donnée par donnée, dans ce qui part RÉELLEMENT au modèle.
// Partie C : la portée présentée est la portée acceptée ; le serveur n'accorde rien sans titulaire.
// Partie D : ce qu'un consentement ouvre à la LECTURE DIRECTE (sans passer par l'application).
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';
import { ligneHistorique } from './_ligne-historique.mts';

const MODELE = process.env.ANTHROPIC_BASE_URL!;
const dicter = (reponses: unknown[]) => fetch(`${MODELE}/__script`, { method: 'POST', body: JSON.stringify({ reponses }) });
const etat = async () => (await fetch(`${MODELE}/__etat`)).json() as Promise<{ recus: { systeme: string; texte: string }[] }>;
await fetch(`${MODELE}/__raz`, { method: 'POST', body: '{}' });
const { admin } = pileLocale();
const v = verificateur();
type R = { error: { message: string } | null; data?: unknown[] | null };
const refuse = (r: R) => !!r.error || (Array.isArray(r.data) && r.data.length === 0);
const dit = (r: R) => r.error ? `refusé (${r.error.message.slice(0, 78)})` : (Array.isArray(r.data) && r.data.length === 0 ? 'sans effet (aucune ligne)' : 'ACCEPTÉ');

const P = await compteLocal('consent-pilote'), B = await compteLocal('consent-proche'), X = await compteLocal('consent-tiers');
const { data: k } = await P.client.from('contacts').insert({ user_id: P.userId, name: 'Bruno Test', relationship: 'friend', proche_user_id: B.userId }).select('id').single();
const { data: k2 } = await P.client.from('contacts').insert({ user_id: P.userId, name: 'Autre', relationship: 'friend' }).select('id').single();
const ligne = async (id: string) => (await admin.from('contact_consents').select('*').eq('id', id).single()).data!;
const C = (c: typeof P) => c.client.from('contact_consents');

console.log('\n══ A. APPELS DIRECTS — « contact_analysis » : le pilote propose, le proche accepte');
let r: any = await C(P).insert({ pilote_id: P.userId, contact_id: k!.id, proche_user_id: B.userId, status: 'active', kind: 'contact_analysis', scope: ['analysis'] }).select('id');
console.log('  le pilote insère directement un partage ACTIF →', dit(r)); v.verifier(refuse(r), 'A1 : le pilote ne peut pas créer un partage déjà actif');
r = await C(P).insert({ pilote_id: P.userId, contact_id: k!.id, proche_user_id: B.userId, status: 'pending', kind: 'contact_analysis', scope: ['analysis'], granted_by: B.userId, granted_via: 'titulaire', consented_at: new Date().toISOString(), requested_by: B.userId }).select('id');
const id = r.data?.[0]?.id as string;
console.log('  le pilote crée une DEMANDE, en glissant une fausse preuve et un faux demandeur →', dit(r));
let l = await ligne(id);
v.verifier(l.status === 'pending' && l.granted_by === null && l.granted_via === null && l.requested_by === P.userId, 'A2 : demande créée ; fausse preuve effacée, demandeur réécrit par la base', JSON.stringify({ granted_by: l.granted_by, requested_by: l.requested_by === P.userId ? 'le pilote' : l.requested_by }));
r = await C(P).update({ status: 'active' }).eq('id', id).select('id');
console.log('  le pilote passe sa demande à ACTIVE →', dit(r)); v.verifier(refuse(r) && (await ligne(id)).status === 'pending', 'A3 : changement de STATUT par le demandeur refusé');
r = await C(X).update({ status: 'active' }).eq('id', id).select('id');
console.log('  un TIERS active la demande →', dit(r)); v.verifier(refuse(r) && (await ligne(id)).status === 'pending', 'A4 : un tiers ne peut rien');
r = await C(P).update({ proche_user_id: P.userId }).eq('id', id).select('id');
console.log('  le pilote change le COMPTE LIÉ (se désigne lui-même) →', dit(r)); v.verifier(refuse(r) && (await ligne(id)).proche_user_id === B.userId, 'A5 : changement de compte lié refusé');
r = await C(P).update({ contact_id: k2!.id }).eq('id', id).select('id');
v.verifier(refuse(r), 'A6 : changement de fiche refusé');
r = await C(P).update({ kind: 'profile_view', contact_id: null, status: 'active' }).eq('id', id).select('id');
console.log('  le pilote change le TYPE (→ profile_view, dont il serait titulaire) et active →', dit(r));
l = await ligne(id); v.verifier(refuse(r) && l.kind === 'contact_analysis' && l.status === 'pending', 'A7 : changement de TYPE refusé');
r = await C(P).insert({ pilote_id: P.userId, proche_user_id: X.userId, status: 'active', kind: 'profile_view', scope: ['facts_tailles'] }).select('id');
const idPV = r.data?.[0]?.id as string;
console.log('  P partage SA PROPRE fiche avec X (il en est le titulaire) →', dit(r)); v.verifier(!refuse(r), 'A8 : partager sa propre fiche reste permis');
r = await C(P).update({ kind: 'contact_analysis', contact_id: k2!.id }).eq('id', idPV).select('id');
console.log('  …puis tente d’en faire un consentement au nom de X →', dit(r)); v.verifier(refuse(r) && (await ligne(idPV)).kind === 'profile_view', 'A9 : un partage de fiche ne se requalifie pas');
r = await C(P).update({ scope: ['facts_tailles', 'reco:regime'] }).eq('id', idPV).select('id');
v.verifier(refuse(r), 'A9 bis : une portée d’usage ne se glisse pas dans un partage de fiche');
r = await C(P).update({ scope: ['analysis', 'reco:regime', 'reco:allergie:arachide'] }).eq('id', id).select('id');
console.log('  le pilote ajoute des portées d’USAGE à sa demande d’analyse →', dit(r)); v.verifier(refuse(r) && JSON.stringify((await ligne(id)).scope) === '["analysis"]', 'A10 : une demande d’analyse ne peut porter aucun usage des données du proche');
r = await C(B).update({ status: 'active' }).eq('id', id).select('id');
l = await ligne(id);
console.log('  le PROCHE accepte →', dit(r), '· preuve écrite par la base :', { granted_by: l.granted_by === B.userId ? 'le proche' : l.granted_by, granted_via: l.granted_via });
v.verifier(l.status === 'active' && l.granted_by === B.userId && l.granted_via === 'titulaire', 'A11 : le proche accepte ; la base enregistre QUI a accordé');
r = await C(P).update({ granted_by: P.userId }).eq('id', id).select('id');
v.verifier((await ligne(id)).granted_by === B.userId, 'A12 : le pilote ne peut pas réécrire la preuve');
r = await C(P).update({ scope: [] }).eq('id', id).select('id');
v.verifier(!refuse(r) && (await ligne(id)).scope.length === 0, 'A13 : le pilote peut RETIRER la portée « analysis »');
r = await C(B).update({ scope: ['analysis'] }).eq('id', id).select('id');
console.log('  le PROCHE remet lui-même la portée « analysis » que le pilote a retirée →', dit(r));
v.verifier(refuse(r) && (await ligne(id)).scope.length === 0, 'A14 : le proche ne peut pas se rouvrir l’analyse du pilote');
r = await C(P).update({ status: 'revoked' }).eq('id', id).select('id');
v.verifier(!refuse(r) && (await ligne(id)).status === 'revoked', 'A15 : le pilote peut RÉVOQUER');
r = await C(P).update({ status: 'active' }).eq('id', id).select('id');
v.verifier(refuse(r) && (await ligne(id)).status === 'revoked', 'A16 : réactivation par le pilote refusée');
r = await C(B).update({ status: 'active' }).eq('id', id).select('id');
console.log('  le PROCHE réactive un partage que le pilote a révoqué →', dit(r));
v.verifier(refuse(r) && (await ligne(id)).status === 'revoked', 'A17 : le proche ne peut pas réactiver un partage retiré');

console.log('\n══ A bis. « profile_view » (titulaire : le propriétaire de la fiche)');
r = await C(X).insert({ pilote_id: B.userId, proche_user_id: X.userId, requested_by: X.userId, status: 'pending', kind: 'profile_view', scope: ['socle'] }).select('id');
const idDem = r.data?.[0]?.id as string;
console.log('  X DEMANDE à voir la fiche de B →', dit(r)); v.verifier(!refuse(r), 'A18 : demander à voir une fiche reste possible');
r = await C(X).insert({ pilote_id: P.userId, proche_user_id: X.userId, requested_by: X.userId, status: 'active', kind: 'profile_view', scope: ['socle'] }).select('id');
v.verifier(refuse(r), 'A19 : le demandeur ne peut pas s’ouvrir lui-même la fiche d’un autre');
r = await C(B).update({ status: 'active', scope: ['facts_tailles'] }).eq('id', idDem).select('id');
l = await ligne(idDem);
console.log('  B accepte et choisit ce qu’il montre →', dit(r)); v.verifier(l.status === 'active' && l.granted_by === B.userId, 'A20 : le propriétaire accorde, la preuve est écrite');
r = await C(B).update({ scope: ['facts_tailles', 'facts_parfums'] }).eq('id', idDem).select('id');
v.verifier(!refuse(r), 'A21 : le propriétaire peut élargir ce qu’il montre');
r = await C(X).update({ scope: ['facts_tailles', 'facts_parfums', 'deep_loved'] }).eq('id', idDem).select('id');
v.verifier(refuse(r) && !(await ligne(idDem)).scope.includes('deep_loved'), 'A22 : le lecteur ne peut pas élargir ce qu’on lui montre');
await C(B).update({ status: 'revoked' }).eq('id', idDem);
r = await C(X).update({ status: 'active' }).eq('id', idDem).select('id');
v.verifier(refuse(r) && (await ligne(idDem)).status === 'revoked', 'A23 : le lecteur ne peut pas réactiver un partage retiré');

console.log('\n══ A ter. « profile_usage » : ce que le proche autorise — invisible et intouchable pour le pilote');
r = await C(P).insert({ pilote_id: P.userId, contact_id: k!.id, proche_user_id: B.userId, status: 'pending', kind: 'profile_usage', scope: ['reco:regime'] }).select('id');
console.log('  le pilote DEMANDE une autorisation d’usage (pending) →', dit(r)); v.verifier(refuse(r), 'A24 : le pilote ne peut pas créer, même en attente, une autorisation d’usage');
r = await C(P).insert({ pilote_id: P.userId, contact_id: k!.id, proche_user_id: B.userId, status: 'active', kind: 'profile_usage', scope: ['reco:regime'] }).select('id');
v.verifier(refuse(r), 'A25 : ni active');
r = await C(B).insert({ pilote_id: P.userId, contact_id: k!.id, proche_user_id: B.userId, status: 'active', kind: 'profile_usage', scope: ['reco:regime', 'analysis'] }).select('id');
v.verifier(refuse(r), 'A26 : la portée « analysis » ne se glisse pas dans une autorisation d’usage');

console.log('\n══ B. LA PORTÉE, DONNÉE PAR DONNÉE — ce qui part au modèle de recommandation');
await B.client.from('my_profile').upsert({ user_id: B.userId,
  practical_info: { vetos: { allergies: ['arachide', 'gluten'], halal: true, no_alcohol: true } },
  singularity_answers: { cadeaux_non: 'les bougies parfumées', evite_deteste: 'les foules' } }, { onConflict: 'user_id' });
const cP = await cookiesDe(P.email, P.motDePasse), cB = await cookiesDe(B.email, B.motDePasse), cX = await cookiesDe(X.email, X.motDePasse);
const IDEE = { __texte: JSON.stringify([{ title: 'Un livre choisi pour lui', justification: 'Une attention simple.', dim: 'CAD_C', canal: 'message', intensite: 'legere', declencheur: 'x' }]) };
const TEMOINS = ['arachide', 'gluten', 'porc', 'jambon', 'alcool', 'bougies parfumées', 'les foules'];
let dernierEnvoi = '';
const recoPour = (cookie: string, contactId: string) => async () => {
  const avant = (await etat()).recus.length; await dicter([IDEE]);
  const res = await poster('/api/recommendations/generate', cookie, { contactId });
  dernierEnvoi = (await etat()).recus.slice(avant).map((x) => `${x.systeme}\n${x.texte}`).join('\n');
  return { status: res.status, vus: TEMOINS.filter((m) => dernierEnvoi.includes(m)), texte: res.texte };
};
const reco = recoPour(cP, k!.id);
const regler = (cookie: string, action: string, portee: string) => poster('/api/consent/exclusions', cookie, { contactId: k!.id, action, portee });

let x = await reco(); console.log('  aucune autorisation →', x.vus);
v.verifier(x.status === 200 && x.vus.length === 0, 'B1 : sans autorisation, rien du profil de B ne part au modèle', x.vus.join(', '));
v.verifier(/N'EST PAS CONNU/.test(dernierEnvoi) && !/aucune allergie|pas d'allergie|sans allergie/i.test(dernierEnvoi),
  'B1 bis : le modèle lit « ce qui n’est pas écrit n’est pas connu » — jamais « aucune allergie »');
// Une idée qui AFFIRME l'absence de risque est écartée avant d'atteindre l'écran.
{
  const avant = (await etat()).recus.length;
  await dicter([{ __texte: JSON.stringify([
    { title: 'Un dîner de fruits de mer, sans risque', justification: "Il n'a aucune allergie.", dim: 'CAD_C', canal: 'message', intensite: 'legere', declencheur: 'x' },
    { title: 'Un carnet relié', justification: 'Une attention simple.', dim: 'CAD_C', canal: 'message', intensite: 'legere', declencheur: 'x' }]) }]);
  const res = await poster('/api/recommendations/generate', cP, { contactId: k!.id });
  void avant;
  console.log('  le modèle répond « sans risque / aucune allergie » → affiché :', /sans risque|aucune allergie/i.test(res.texte) ? 'OUI' : 'non', '· l’autre idée :', /carnet relié/i.test(res.texte) ? 'présente' : 'absente');
  v.verifier(!/sans risque|aucune allergie/i.test(res.texte), 'B1 ter : une idée qui affirme l’absence d’allergie n’est pas affichée');
}
// Une ligne « d'avant » : active, sans preuve, portant déjà des usages.
const idHist = ligneHistorique({ kind: 'profile_usage', piloteId: P.userId, procheId: B.userId, contactId: k!.id, scope: ['reco:regime', 'reco:allergie:arachide', 'reco:reponses_libres'] });
x = await reco(); console.log('  ligne ancienne, active, SANS preuve d’accord →', x.vus);
v.verifier((await ligne(idHist)).granted_by === null && x.vus.length === 0, 'B2 : une autorisation active dont l’accord n’est pas établi n’ouvre RIEN', x.vus.join(', '));
await admin.from('contact_consents').update({ status: 'revoked' }).eq('id', idHist);

let rr = await regler(cP, 'autoriser', 'reco:allergie:arachide');
console.log('  le PILOTE appelle la route de réglage pour s’accorder l’allergie → HTTP', rr.status); v.verifier(rr.status === 404, 'B3 : le pilote ne peut pas utiliser la route du proche (404)');
rr = await regler(cX, 'autoriser', 'reco:allergie:arachide'); v.verifier(rr.status === 404, 'B4 : un tiers non plus');
rr = await regler(null as never, 'autoriser', 'reco:allergie:arachide'); v.verifier(rr.status === 401, 'B4 bis : sans session, 401');
rr = await regler(cB, 'autoriser', 'tout'); v.verifier(rr.status === 400, 'B5 : une portée inconnue est refusée');
rr = await regler(cB, 'autoriser', 'analysis'); v.verifier(rr.status === 400, 'B5 bis : « analysis » n’est pas une portée que le proche peut s’accorder');
rr = await regler(cB, 'autoriser', 'reco:allergie:arachide');
x = await reco(); console.log('  B autorise UNE allergie (arachide) → HTTP', rr.status, '· au modèle :', x.vus);
v.verifier(JSON.stringify(x.vus) === '["arachide"]', 'B6 : l’arachide part ; ni le gluten, ni le régime, ni l’alcool, ni les réponses libres', x.vus.join(', '));
// Ce que le PILOTE peut voir de ce réglage, par une lecture directe.
r = await C(P).select('id, kind, scope').eq('contact_id', k!.id);
console.log('  le pilote lit directement les consentements de cette fiche →', (r.data ?? []).map((z: any) => `${z.kind}:${z.scope}`));
v.verifier(!(r.data ?? []).some((z: any) => z.kind === 'profile_usage'), 'B6 bis : le pilote ne VOIT PAS ce que le proche a réglé');
const usage = (await admin.from('contact_consents').select('id').eq('kind', 'profile_usage').eq('contact_id', k!.id).eq('status', 'active').single()).data!;
r = await C(P).update({ scope: ['reco:allergie:arachide', 'reco:regime'] }).eq('id', usage.id).select('id');
v.verifier(refuse(r) && !(await ligne(usage.id)).scope.includes('reco:regime'), 'B6 ter : le pilote ne peut pas élargir l’autorisation du proche');
r = await C(P).delete().eq('id', usage.id).select('id');
v.verifier(refuse(r) && !!(await ligne(usage.id)), 'B6 quater : ni la supprimer');
r = await C(B).update({ scope: ['reco:allergie:arachide', 'reco:reponses_libres'] }).eq('id', usage.id).select('id');
console.log('  le proche modifie sa ligne EN DIRECT, hors de la route →', dit(r));
v.verifier(refuse(r), 'B6 quinquies : l’autorisation ne se règle que par la route, qui vérifie l’identité et la portée');
await regler(cB, 'autoriser', 'reco:regime');
x = await reco(); console.log('  B autorise aussi son régime → au modèle :', x.vus);
v.verifier(x.vus.includes('porc') && x.vus.includes('arachide') && !x.vus.includes('gluten') && !x.vus.includes('bougies parfumées'), 'B7 : le régime s’ajoute ; gluten et réponses libres toujours absents', x.vus.join(', '));
await regler(cB, 'retirer', 'reco:allergie:arachide');
x = await reco(); console.log('  B RETIRE l’allergie → au modèle :', x.vus);
v.verifier(!x.vus.includes('arachide') && x.vus.includes('porc'), 'B8 : retrait de l’allergie — elle ne part plus, le régime reste', x.vus.join(', '));
await regler(cB, 'retirer', 'reco:regime');
x = await reco(); console.log('  B retire son régime → au modèle :', x.vus);
v.verifier(x.vus.length === 0, 'B9 : tout retiré — plus rien du profil de B ne part au modèle', x.vus.join(', '));
await regler(cB, 'autoriser', 'reco:regime');
await P.client.from('contacts').update({ proche_user_id: X.userId }).eq('id', k!.id);
await X.client.from('my_profile').upsert({ user_id: X.userId, practical_info: { vetos: { allergies: ['gluten'], halal: true } } }, { onConflict: 'user_id' });
x = await reco(); console.log('  le pilote repointe sa fiche vers le compte de X → au modèle :', x.vus);
v.verifier(x.vus.length === 0, 'B10 : repointer la fiche ne transfère aucun droit — ni ceux de B, ni sur X', x.vus.join(', '));
rr = await poster('/api/consent/exclusions', cX, { contactId: k!.id, action: 'autoriser', portee: 'reco:regime' });
const lignesUsage = (await admin.from('contact_consents').select('proche_user_id, scope').eq('kind', 'profile_usage').eq('contact_id', k!.id).eq('status', 'active')).data ?? [];
const deX = lignesUsage.filter((z) => z.proche_user_id === X.userId), deB = lignesUsage.filter((z) => z.proche_user_id === B.userId);
x = await reco();
console.log('  X, désormais désigné, règle à son tour → HTTP', rr.status, '· sa ligne :', deX.map((z) => z.scope), '· celle de B :', deB.map((z) => z.scope), '· au modèle :', x.vus);
v.verifier(rr.status === 200 && deX.length === 1 && JSON.stringify(deX[0].scope) === '["reco:regime"]' && deB.length === 1 && JSON.stringify(deB[0].scope) === '["reco:regime"]',
  'B11 : X règle SA propre autorisation, sans rien reprendre de celle de B ni la toucher');
v.verifier(x.vus.includes('porc') && !x.vus.includes('gluten') && !x.vus.includes('arachide') && !x.vus.includes('bougies parfumées'),
  'B12 : seul ce que X a autorisé (son régime) part — pas son allergie, et rien de B', x.vus.join(', '));
await P.client.from('contacts').update({ proche_user_id: B.userId }).eq('id', k!.id);

console.log('\n══ C. LA PORTÉE PRÉSENTÉE EST LA PORTÉE ACCEPTÉE — et le serveur n’accorde rien sans titulaire');
const Q = await compteLocal('consent-pilote-c'), K = await compteLocal('consent-proche-c'), T = await compteLocal('consent-tiers-c');
const { data: kc } = await Q.client.from('contacts').insert({ user_id: Q.userId, name: 'Chloé Test', relationship: 'friend', proche_user_id: K.userId }).select('id').single();
await K.client.from('my_profile').upsert({ user_id: K.userId, practical_info: { vetos: { allergies: ['arachide'], halal: true } }, singularity_answers: { cadeaux_non: 'les bougies parfumées' } }, { onConflict: 'user_id' });
const cQ = await cookiesDe(Q.email, Q.motDePasse), cK = await cookiesDe(K.email, K.motDePasse), cT = await cookiesDe(T.email, T.motDePasse);
const recoC = recoPour(cQ, kc!.id);
let d: any = await C(Q).insert({ pilote_id: Q.userId, contact_id: kc!.id, proche_user_id: K.userId, status: 'pending', kind: 'contact_analysis', scope: ['analysis'] }).select('id').single();
const idC = d.data.id as string;
const vue = (await C(K).select('scope').eq('id', idC).single()).data!.scope;
let q: any = await C(Q).update({ scope: ['analysis', 'reco:regime', 'reco:reponses_libres'] }).eq('id', idC).select('id');
console.log('  demande affichée', vue, '→ le demandeur élargit pendant la consultation →', dit(q));
v.verifier(refuse(q), 'C1 : le demandeur ne peut pas élargir une demande EN ATTENTE');
rr = await poster(`/api/consent/${idC}/respond`, cT, { action: 'accept' }, 'PATCH');
v.verifier(rr.status === 404 || rr.status === 403, 'C2 : un tiers ne peut pas accepter à la place du proche', `HTTP ${rr.status}`);
rr = await poster(`/api/consent/${idC}/respond`, cQ, { action: 'accept' }, 'PATCH');
v.verifier(rr.status === 403 && (await ligne(idC)).status === 'pending', 'C3 : le demandeur ne peut pas accepter sa propre demande', `HTTP ${rr.status}`);
rr = await poster(`/api/consent/${idC}/respond`, null, { action: 'accept' }, 'PATCH');
v.verifier(rr.status === 401, 'C3 bis : sans session, 401', `HTTP ${rr.status}`);
rr = await poster(`/api/consent/${idC}/respond`, cK, { action: 'accept' }, 'PATCH');
let lc = await ligne(idC);
console.log('  le proche accepte par la route → HTTP', rr.status, '· portée active :', lc.scope, '· accordé par :', lc.granted_by === K.userId ? 'le proche' : lc.granted_by);
v.verifier(rr.status === 200 && lc.status === 'active' && JSON.stringify(lc.scope) === JSON.stringify(vue) && lc.granted_by === K.userId, 'C4 : la portée acceptée est exactement celle qui était affichée');
let y = await recoC();
v.verifier(y.vus.length === 0, 'C5 : accepter de VOIR une analyse n’ouvre aucune donnée du proche à la recommandation', y.vus.join(', '));
await C(Q).update({ status: 'revoked' }).eq('id', idC);
d = await C(Q).insert({ pilote_id: Q.userId, contact_id: kc!.id, proche_user_id: K.userId, status: 'pending', kind: 'contact_analysis', scope: ['analysis'] }).select('id').single();
const idAncien = d.data.id as string;
await C(Q).delete().eq('id', idAncien);
d = await C(Q).insert({ pilote_id: Q.userId, contact_id: kc!.id, proche_user_id: K.userId, status: 'pending', kind: 'contact_analysis', scope: ['analysis'] }).select('id').single();
rr = await poster(`/api/consent/${idAncien}/respond`, cK, { action: 'accept' }, 'PATCH');
lc = await ligne(d.data.id);
console.log('  demande remplacée ; le proche accepte l’ANCIENNE → HTTP', rr.status, '· nouvelle demande :', lc.status);
v.verifier(rr.status === 404 && lc.status === 'pending', 'C6 : accepter l’ancienne demande n’active pas la nouvelle');
// Le SERVEUR — les routes portent ses droits : la base lui refuse ce qu'il n'atteste pas.
q = await admin.from('contact_consents').insert({ pilote_id: Q.userId, contact_id: kc!.id, proche_user_id: K.userId, kind: 'profile_usage', status: 'active', scope: ['reco:regime'] }).select('id');
console.log('  le serveur écrit une autorisation ACTIVE sans nommer qui accorde →', dit(q));
v.verifier(refuse(q), 'C7 : le serveur ne peut pas écrire un consentement actif sans titulaire nommé');
q = await admin.from('contact_consents').insert({ pilote_id: Q.userId, contact_id: kc!.id, proche_user_id: K.userId, kind: 'profile_usage', status: 'active', scope: ['reco:regime'], granted_by: Q.userId }).select('id');
v.verifier(refuse(q), 'C8 : ni en nommant quelqu’un d’autre que le titulaire (ici le pilote)');
q = await admin.from('contact_consents').insert({ pilote_id: Q.userId, proche_user_id: T.userId, kind: 'profile_view', status: 'active', scope: ['socle'], granted_by: T.userId }).select('id');
v.verifier(refuse(q), 'C8 bis : un partage de fiche « accordé » par le lecteur est refusé');
q = await admin.from('contact_consents').insert({ pilote_id: Q.userId, contact_id: kc!.id, proche_user_id: K.userId, kind: 'contact_analysis', status: 'pending', scope: ['analysis'] }).select('id');
v.verifier(refuse(q), 'C8 ter : le serveur ne fabrique pas un partage d’analyse à la place du pilote');
rr = await poster('/api/consent/exclusions', cK, { contactId: kc!.id, action: 'autoriser', portee: 'reco:regime' });
const idU = (await admin.from('contact_consents').select('id').eq('kind', 'profile_usage').eq('contact_id', kc!.id).eq('status', 'active').single()).data!.id as string;
q = await admin.from('contact_consents').update({ scope: ['reco:regime', 'reco:reponses_libres'] }).eq('id', idU).select('id');
lc = await ligne(idU); y = await recoC();
console.log('  le serveur élargit une autorisation active sans attester →', dit(q), '· portée :', lc.scope);
v.verifier(refuse(q) && JSON.stringify(lc.scope) === '["reco:regime"]' && !y.vus.includes('bougies parfumées'), 'C9 : le serveur n’élargit pas sans attestation nouvelle du titulaire');
q = await admin.from('contact_consents').update({ scope: ['reco:regime', 'reco:reponses_libres'], granted_by: K.userId }).eq('id', idU).select('id');
v.verifier(refuse(q), 'C9 bis : reprendre l’ANCIENNE attestation pour une portée nouvelle ne suffit pas');
q = await admin.from('contact_consents').update({ kind: 'contact_analysis', scope: ['analysis'] }).eq('id', idU).select('id');
v.verifier(refuse(q), 'C9 ter : même le serveur ne change pas le type d’une ligne');
await poster('/api/consent/exclusions', cK, { contactId: kc!.id, action: 'retirer', portee: 'reco:regime' });
// LIGNE HISTORIQUE portant une portée que personne n'a validée, puis accord pour AUTRE chose.
const idH = ligneHistorique({ kind: 'profile_usage', piloteId: Q.userId, procheId: K.userId, contactId: kc!.id, scope: ['reco:reponses_libres'] });
y = await recoC();
v.verifier(y.vus.length === 0, 'C10 : une ligne historique sans preuve n’ouvre rien', y.vus.join(', '));
rr = await poster('/api/consent/exclusions', cK, { contactId: kc!.id, action: 'autoriser', portee: 'reco:regime' });
lc = await ligne(idH); y = await recoC();
console.log('  le proche autorise son RÉGIME sur cette ligne → HTTP', rr.status, '· portée :', lc.scope, '· au modèle :', y.vus);
v.verifier(rr.status === 200 && lc.granted_by === K.userId && y.vus.includes('porc') && !y.vus.includes('bougies parfumées') && !lc.scope.includes('reco:reponses_libres'),
  'C11 : son accord pour le régime ne valide PAS la portée historique qu’il n’a jamais accordée', `${y.vus.join(', ')} · ${JSON.stringify(lc.scope)}`);

console.log('\n══ D. CE QU’UN CONSENTEMENT OUVRE À LA LECTURE DIRECTE (requêtes du navigateur, hors application)');
// L'analyse que le pilote Q tient sur K, et la propre analyse de Q.
await Q.client.from('profile_analysis').insert({ user_id: Q.userId, contact_id: kc!.id, summary: 'ANALYSE-PRIVEE-DU-PILOTE', sections: { avoid: { text: 'NOTE-PRIVEE' } } });
await Q.client.from('profile_analysis').insert({ user_id: Q.userId, contact_id: null, summary: 'AUTO-ANALYSE-DE-Q', sections: { what_touches: { text: 'CE-QUI-TOUCHE-Q' }, feels_loved: { text: 'INTIME-Q' } } });
await Q.client.from('person_states').insert({ subject_kind: 'pilot', subject_user_id: Q.userId, declared_by: Q.userId, state: 'deuil', note_free: 'ETAT-PRIVE-DE-Q' });
const lit = async (c: typeof P, filtre: (q: any) => any) => ((await filtre(c.client.from('profile_analysis').select('summary, sections'))).data ?? []) as any[];
const analyseDuPilote = (c: typeof P) => lit(c, (q) => q.eq('user_id', Q.userId).eq('contact_id', kc!.id));
const autoAnalyse = (c: typeof P) => lit(c, (q) => q.eq('user_id', Q.userId).is('contact_id', null));
// K a une autorisation d'usage ACTIVE (régime) — et rien d'autre.
let vu = await analyseDuPilote(K);
console.log('  K a seulement autorisé l’usage de son régime → il lit l’analyse privée du pilote ?', vu.length ? 'OUI' : 'non');
v.verifier(vu.length === 0, 'D1 : autoriser l’usage de ses données n’ouvre PAS l’analyse que le pilote tient sur soi');
d = await C(Q).select('id').eq('contact_id', kc!.id).eq('kind', 'contact_analysis').eq('status', 'pending').single();
vu = await analyseDuPilote(K);
v.verifier(vu.length === 0, 'D2 : partage proposé, pas encore accepté → rien');
await C(K).update({ status: 'active' }).eq('id', d.data.id);
vu = await analyseDuPilote(K);
console.log('  le pilote a proposé, K accepte → K lit :', vu.map((z) => z.summary));
v.verifier(vu.length === 1 && vu[0].summary === 'ANALYSE-PRIVEE-DU-PILOTE', 'D3 : proposé par le pilote ET accepté par le proche → l’analyse s’ouvre');
v.verifier((await analyseDuPilote(T)).length === 0, 'D4 : un tiers ne lit rien');
await C(Q).update({ status: 'revoked' }).eq('id', d.data.id);
vu = await analyseDuPilote(K);
v.verifier(vu.length === 0, 'D5 : le pilote révoque → la lecture se ferme aussitôt');
await C(K).update({ status: 'active' }).eq('id', d.data.id);
v.verifier((await analyseDuPilote(K)).length === 0, 'D6 : et le proche ne peut pas la rouvrir');
ligneHistorique({ kind: 'contact_analysis', piloteId: Q.userId, procheId: K.userId, contactId: kc!.id, scope: ['analysis'] });
vu = await analyseDuPilote(K);
v.verifier(vu.length === 0, 'D7 : une ligne ancienne, active, sans preuve → rien, tant qu’elle n’est pas redemandée et réacceptée');
// Fiche partagée : Q partage SA fiche à T, UNE section seulement.
d = await C(T).insert({ pilote_id: Q.userId, proche_user_id: T.userId, requested_by: T.userId, status: 'pending', kind: 'profile_view', scope: [] }).select('id').single();
await C(Q).update({ status: 'active', scope: ['deep_touch'] }).eq('id', d.data.id);
vu = await autoAnalyse(T);
console.log('  Q partage UNE section de sa fiche à T → T lit toute l’auto-analyse par requête directe ?', vu.length ? 'OUI' : 'non');
v.verifier(vu.length === 0, 'D8 : un partage de fiche n’ouvre plus l’analyse entière au navigateur — seul le serveur la lit, et la filtre');
const etats = (await T.client.from('person_states').select('note_free').eq('subject_user_id', Q.userId)).data ?? [];
v.verifier(etats.length === 0, 'D9 : ni les états déclarés par la personne');

console.log('\n══ E. EFFACER UN COMPTE — par le vrai service d’authentification, pilote encore présent');
{
  const avantE = (await admin.from('contact_consents').select('id, kind').or(`proche_user_id.eq.${K.userId},pilote_id.eq.${K.userId}`)).data ?? [];
  const { error: eSup } = await admin.auth.admin.deleteUser(K.userId);
  const apresE = (await admin.from('contact_consents').select('id').or(`proche_user_id.eq.${K.userId},pilote_id.eq.${K.userId},granted_by.eq.${K.userId},requested_by.eq.${K.userId}`)).data ?? [];
  const ficheQ = (await admin.from('contacts').select('proche_user_id, proche_lien_confirme_par').eq('id', kc!.id).single()).data!;
  console.log('  K était partie de', avantE.length, 'consentement(s) (', [...new Set(avantE.map((z) => z.kind))].join(', '), ') → effacement :', eSup ? `ÉCHEC (${eSup.message})` : 'réussi', '· lignes restantes :', apresE.length);
  v.verifier(avantE.length > 0 && !eSup && apresE.length === 0, 'E1 : effacer un compte réussit et emporte les consentements dont il était partie');
  v.verifier(ficheQ.proche_user_id === null && ficheQ.proche_lien_confirme_par === null, 'E2 : la fiche du pilote n’est plus rattachée à aucun compte');
  const yy = await recoC();
  v.verifier(yy.status === 200 && yy.vus.length === 0, 'E3 : la recommandation du pilote fonctionne toujours, sans rien de K', yy.vus.join(', '));
}
v.bilan();
