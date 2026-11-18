// PREUVE — qui peut accorder ou élargir un consentement, et ce qu'un consentement ouvre.
//
// Partie A : APPELS DIRECTS À LA BASE, sous l'identité de chaque partie (donc à travers la RLS
//            et le déclencheur de la migration 112), sans passer par les routes.
// Partie B : la portée, donnée par donnée — un consentement partiel, puis son retrait, vus
//            dans ce qui part RÉELLEMENT au modèle de recommandation.
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';

const MODELE = process.env.ANTHROPIC_BASE_URL!;
const dicter = (reponses: unknown[]) => fetch(`${MODELE}/__script`, { method: 'POST', body: JSON.stringify({ reponses }) });
const etat = async () => (await fetch(`${MODELE}/__etat`)).json() as Promise<{ recus: { systeme: string; texte: string }[] }>;
await fetch(`${MODELE}/__raz`, { method: 'POST', body: '{}' });
const { admin } = pileLocale();
const v = verificateur();
const refuse = (r: { error: { message: string } | null; data?: unknown[] | null }) => !!r.error || (Array.isArray(r.data) && r.data.length === 0);
const dit = (r: { error: { message: string } | null; data?: unknown[] | null }) => r.error ? `refusé (${r.error.message.slice(0, 70)})` : (Array.isArray(r.data) && r.data.length === 0 ? 'sans effet (aucune ligne)' : 'ACCEPTÉ');

const P = await compteLocal('consent-pilote'), B = await compteLocal('consent-proche'), X = await compteLocal('consent-tiers');
const { data: k } = await P.client.from('contacts').insert({ user_id: P.userId, name: 'Bruno Test', relationship: 'friend', proche_user_id: B.userId }).select('id').single();
const { data: k2 } = await P.client.from('contacts').insert({ user_id: P.userId, name: 'Autre', relationship: 'friend' }).select('id').single();
const ligne = async (id: string) => (await admin.from('contact_consents').select('*').eq('id', id).single()).data!;

console.log('\n══ A. APPELS DIRECTS À LA BASE — consentement « contact_analysis » (titulaire : le proche B)');
let r: any = await P.client.from('contact_consents').insert({ pilote_id: P.userId, contact_id: k!.id, proche_user_id: B.userId, status: 'active', kind: 'contact_analysis' }).select('id');
console.log('  le demandeur insère directement un consentement ACTIF →', dit(r)); v.verifier(refuse(r), 'A1 : le demandeur ne peut pas créer un consentement actif');
r = await P.client.from('contact_consents').insert({ pilote_id: P.userId, contact_id: k!.id, proche_user_id: B.userId, status: 'pending', kind: 'contact_analysis', granted_by: B.userId, granted_via: 'titulaire', consented_at: new Date().toISOString() }).select('id');
const id = r.data?.[0]?.id as string;
console.log('  le demandeur crée une DEMANDE (pending), en glissant une fausse preuve →', dit(r));
let l = await ligne(id);
v.verifier(l.status === 'pending' && l.granted_by === null && l.granted_via === null, 'A2 : la demande est créée, la fausse preuve est effacée par la base', JSON.stringify({ granted_by: l.granted_by, granted_via: l.granted_via }));
r = await P.client.from('contact_consents').update({ status: 'active' }).eq('id', id).select('id');
console.log('  le demandeur passe sa demande à ACTIVE →', dit(r)); v.verifier(refuse(r) && (await ligne(id)).status === 'pending', 'A3 : changement de STATUT par le demandeur refusé');
r = await X.client.from('contact_consents').update({ status: 'active' }).eq('id', id).select('id');
console.log('  un TIERS active la demande →', dit(r)); v.verifier(refuse(r) && (await ligne(id)).status === 'pending', 'A4 : un tiers ne peut rien');
r = await P.client.from('contact_consents').update({ proche_user_id: P.userId }).eq('id', id).select('id');
console.log('  le demandeur change le COMPTE LIÉ (se désigne lui-même titulaire) →', dit(r)); v.verifier(refuse(r) && (await ligne(id)).proche_user_id === B.userId, 'A5 : changement de compte lié refusé');
r = await P.client.from('contact_consents').update({ contact_id: k2!.id }).eq('id', id).select('id');
v.verifier(refuse(r), 'A6 : changement de contact refusé');
r = await P.client.from('contact_consents').update({ kind: 'profile_view', contact_id: null, status: 'active' }).eq('id', id).select('id');
console.log('  le demandeur change le TYPE (contact_analysis → profile_view, dont il serait titulaire) et active →', dit(r));
l = await ligne(id); v.verifier(refuse(r) && l.kind === 'contact_analysis' && l.status === 'pending', 'A7 : changement de TYPE refusé');
// L'autre sens : créer un profile_view actif (dont le demandeur EST titulaire), puis le faire passer pour un contact_analysis.
r = await P.client.from('contact_consents').insert({ pilote_id: P.userId, proche_user_id: X.userId, status: 'active', kind: 'profile_view', scope: ['reco:regime'] }).select('id');
const idPV = r.data?.[0]?.id as string;
console.log('  P partage SA PROPRE fiche avec X (profile_view actif, il en est le titulaire) →', dit(r)); v.verifier(!refuse(r), 'A8 : partager sa propre fiche reste permis');
r = await P.client.from('contact_consents').update({ kind: 'contact_analysis', contact_id: k2!.id }).eq('id', idPV).select('id');
console.log('  …puis tente d’en faire un contact_analysis actif au nom de X →', dit(r)); v.verifier(refuse(r) && (await ligne(idPV)).kind === 'profile_view', 'A9 : un partage de fiche ne peut pas être requalifié en consentement d’un autre');
// Le titulaire accorde.
r = await B.client.from('contact_consents').update({ status: 'active' }).eq('id', id).select('id');
l = await ligne(id);
console.log('  le PROCHE accepte →', dit(r), '· preuve écrite par la base :', { granted_by: l.granted_by === B.userId ? 'le proche' : l.granted_by, granted_via: l.granted_via });
v.verifier(l.status === 'active' && l.granted_by === B.userId && l.granted_via === 'titulaire', 'A10 : le proche accorde ; la base enregistre QUI a accordé');
r = await P.client.from('contact_consents').update({ scope: ['analysis', 'reco:regime', 'reco:allergie:arachide'] }).eq('id', id).select('id');
console.log('  le demandeur ÉLARGIT la portée d’un consentement actif →', dit(r)); v.verifier(refuse(r) && !(await ligne(id)).scope.includes('reco:regime'), 'A11 : élargissement de PORTÉE par le demandeur refusé');
r = await P.client.from('contact_consents').update({ granted_by: P.userId }).eq('id', id).select('id');
v.verifier((await ligne(id)).granted_by === B.userId, 'A12 : le demandeur ne peut pas réécrire la preuve');
r = await P.client.from('contact_consents').update({ status: 'revoked' }).eq('id', id).select('id');
v.verifier(!refuse(r) && (await ligne(id)).status === 'revoked', 'A13 : le demandeur peut toujours RÉVOQUER');
r = await P.client.from('contact_consents').update({ status: 'active' }).eq('id', id).select('id');
console.log('  le demandeur RÉACTIVE un consentement révoqué →', dit(r)); v.verifier(refuse(r) && (await ligne(id)).status === 'revoked', 'A14 : réactivation par le demandeur refusée');

console.log('\n══ A bis. « profile_view » (titulaire : le propriétaire de la fiche) — les usages légitimes tiennent');
r = await X.client.from('contact_consents').insert({ pilote_id: B.userId, proche_user_id: X.userId, requested_by: X.userId, status: 'pending', kind: 'profile_view', scope: ['socle'] }).select('id');
const idDem = r.data?.[0]?.id as string;
console.log('  X DEMANDE à voir la fiche de B →', dit(r)); v.verifier(!refuse(r), 'A15 : demander à voir une fiche reste possible');
r = await X.client.from('contact_consents').insert({ pilote_id: B.userId, proche_user_id: X.userId, requested_by: X.userId, status: 'active', kind: 'profile_view', scope: ['socle'] }).select('id');
v.verifier(refuse(r), 'A16 : le demandeur ne peut pas s’ouvrir lui-même la fiche d’un autre');
r = await B.client.from('contact_consents').update({ status: 'active', scope: ['facts_tailles'] }).eq('id', idDem).select('id');
l = await ligne(idDem);
console.log('  B accepte et choisit ce qu’il montre →', dit(r)); v.verifier(l.status === 'active' && l.granted_by === B.userId, 'A17 : le propriétaire de la fiche accorde, la preuve est écrite');
r = await B.client.from('contact_consents').update({ scope: ['facts_tailles', 'facts_parfums'] }).eq('id', idDem).select('id');
v.verifier(!refuse(r), 'A18 : le propriétaire peut élargir ce qu’il montre');

console.log('\n══ B. LA PORTÉE, DONNÉE PAR DONNÉE — ce qui part au modèle de recommandation');
await B.client.from('my_profile').upsert({ user_id: B.userId,
  practical_info: { vetos: { allergies: ['arachide', 'gluten'], halal: true, no_alcohol: true } },
  singularity_answers: { cadeaux_non: 'les bougies parfumées', evite_deteste: 'les foules' } }, { onConflict: 'user_id' });
const cP = await cookiesDe(P.email, P.motDePasse), cB = await cookiesDe(B.email, B.motDePasse), cX = await cookiesDe(X.email, X.motDePasse);
const IDEE = { __texte: JSON.stringify([{ title: 'Un livre choisi pour lui', justification: 'Une attention simple.', dim: 'CAD_C', canal: 'message', intensite: 'legere', declencheur: 'x' }]) };
const TEMOINS = ['arachide', 'gluten', 'porc', 'jambon', 'alcool', 'bougies parfumées', 'les foules'];
const reco = async () => {
  const avant = (await etat()).recus.length; await dicter([IDEE]);
  const res = await poster('/api/recommendations/generate', cP, { contactId: k!.id });
  const envoye = (await etat()).recus.slice(avant).map((x) => `${x.systeme}\n${x.texte}`).join('\n');
  return { status: res.status, vus: TEMOINS.filter((m) => envoye.includes(m)) };
};
const regler = (cookie: string, action: string, portee: string) => poster('/api/consent/exclusions', cookie, { contactId: k!.id, action, portee });

let x = await reco(); console.log('  aucun consentement actif →', x.vus);
v.verifier(x.status === 200 && x.vus.length === 0, 'B1 : sans consentement, rien du profil de B ne part au modèle', x.vus.join(', '));
// Un consentement actif SANS preuve (ligne d'avant la migration, ou écrite par le serveur sans dire qui).
await admin.from('contact_consents').insert({ pilote_id: P.userId, contact_id: k2!.id, proche_user_id: null, status: 'pending', kind: 'contact_analysis' });
const { data: ancien } = await admin.from('contact_consents').insert({ pilote_id: P.userId, contact_id: k!.id, proche_user_id: B.userId, status: 'active', kind: 'contact_analysis', scope: ['analysis', 'reco:regime', 'reco:allergie:arachide', 'reco:reponses_libres'] }).select('id, granted_by, granted_via').single();
x = await reco(); console.log('  consentement actif SANS preuve d’accord (granted_by vide) →', x.vus, ancien);
v.verifier(x.vus.length === 0, 'B2 : un consentement actif dont l’accord n’est pas établi n’ouvre RIEN', x.vus.join(', '));
await admin.from('contact_consents').update({ status: 'revoked' }).eq('id', ancien!.id);

// Le parcours serveur : c'est le PROCHE, connecté, qui règle — une donnée à la fois.
let rr = await regler(cP, 'autoriser', 'reco:allergie:arachide');
console.log('  le PILOTE appelle la route de réglage pour s’accorder l’allergie → HTTP', rr.status); v.verifier(rr.status === 404, 'B3 : le pilote ne peut pas utiliser la route du proche (404)');
rr = await regler(cX, 'autoriser', 'reco:allergie:arachide'); v.verifier(rr.status === 404, 'B4 : un tiers non plus');
rr = await regler(cB, 'autoriser', 'tout'); v.verifier(rr.status === 400, 'B5 : une portée inconnue est refusée');
rr = await regler(cB, 'autoriser', 'reco:allergie:arachide');
x = await reco(); console.log('  B autorise UNE allergie (arachide) → HTTP', rr.status, '· au modèle :', x.vus);
v.verifier(JSON.stringify(x.vus) === '["arachide"]', 'B6 : consentement PARTIEL — l’arachide part, ni le gluten, ni le régime, ni l’alcool, ni les réponses libres', x.vus.join(', '));
await regler(cB, 'autoriser', 'reco:regime');
x = await reco(); console.log('  B autorise aussi son régime → au modèle :', x.vus);
v.verifier(x.vus.includes('porc') && x.vus.includes('arachide') && !x.vus.includes('gluten') && !x.vus.includes('bougies parfumées'), 'B7 : le régime s’ajoute ; gluten et réponses libres toujours absents', x.vus.join(', '));
await regler(cB, 'retirer', 'reco:allergie:arachide');
x = await reco(); console.log('  B RETIRE l’allergie → au modèle :', x.vus);
v.verifier(!x.vus.includes('arachide') && x.vus.includes('porc'), 'B8 : retrait de l’allergie — elle ne part plus, le régime reste', x.vus.join(', '));
await regler(cB, 'retirer', 'reco:regime');
x = await reco(); console.log('  B retire son régime → au modèle :', x.vus);
v.verifier(x.vus.length === 0, 'B9 : tout retiré — plus rien du profil de B ne part au modèle', x.vus.join(', '));
// Le pilote repointe son contact vers un autre compte : l'accord de B ne vaut pas pour X.
await regler(cB, 'autoriser', 'reco:regime');
await P.client.from('contacts').update({ proche_user_id: X.userId }).eq('id', k!.id);
await X.client.from('my_profile').upsert({ user_id: X.userId, practical_info: { vetos: { allergies: ['gluten'], halal: true } } }, { onConflict: 'user_id' });
x = await reco(); console.log('  le pilote repointe son contact vers le compte de X → au modèle :', x.vus);
v.verifier(x.vus.length === 0, 'B10 : changer le compte lié du contact n’ouvre pas le profil du nouveau compte', x.vus.join(', '));

console.log('\n══ C. LA PORTÉE PRÉSENTÉE EST LA PORTÉE ACCEPTÉE (migration 114)');
{
  const Q = await compteLocal('consent-pilote-c'), C = await compteLocal('consent-proche-c'), T = await compteLocal('consent-tiers-c');
  const { data: kc } = await Q.client.from('contacts').insert({ user_id: Q.userId, name: 'Chloé Test', relationship: 'friend', proche_user_id: C.userId }).select('id').single();
  await C.client.from('my_profile').upsert({ user_id: C.userId, practical_info: { vetos: { allergies: ['arachide'], halal: true } }, singularity_answers: { cadeaux_non: 'les bougies parfumées' } }, { onConflict: 'user_id' });
  const cQ = await cookiesDe(Q.email, Q.motDePasse), cC = await cookiesDe(C.email, C.motDePasse), cT = await cookiesDe(T.email, T.motDePasse);
  let d: any = await Q.client.from('contact_consents').insert({ pilote_id: Q.userId, contact_id: kc!.id, proche_user_id: C.userId, status: 'pending', kind: 'contact_analysis', scope: ['analysis'] }).select('id').single();
  const idC = d.data.id as string;
  // Le proche CONSULTE la demande : il voit « analysis ».
  const vue = (await C.client.from('contact_consents').select('scope').eq('id', idC).single()).data!.scope;
  // Pendant ce temps, le demandeur tente d'élargir.
  let q: any = await Q.client.from('contact_consents').update({ scope: ['analysis', 'reco:regime', 'reco:allergie:arachide', 'reco:reponses_libres'] }).eq('id', idC).select('id');
  console.log('  demande affichée', vue, '→ le demandeur élargit la portée pendant la consultation →', dit(q));
  v.verifier(refuse(q), 'C1 : le demandeur ne peut pas élargir une demande EN ATTENTE');
  // Le proche accepte ce qu'il a vu — par la VRAIE route.
  let rr = await poster(`/api/consent/${idC}/respond`, cT, { action: 'accept' }, 'PATCH');
  v.verifier(rr.status === 404 || rr.status === 403, 'C2 : un tiers ne peut pas accepter à la place du proche', `HTTP ${rr.status}`);
  rr = await poster(`/api/consent/${idC}/respond`, cQ, { action: 'accept' }, 'PATCH');
  v.verifier(rr.status === 403 && (await ligne(idC)).status === 'pending', 'C3 : le demandeur ne peut pas accepter sa propre demande par la route', `HTTP ${rr.status}`);
  rr = await poster(`/api/consent/${idC}/respond`, cC, { action: 'accept' }, 'PATCH');
  let lc = await ligne(idC);
  console.log('  le proche accepte par la route → HTTP', rr.status, '· portée active :', lc.scope, '· accordé par :', lc.granted_by === C.userId ? 'le proche' : lc.granted_by);
  v.verifier(rr.status === 200 && lc.status === 'active' && JSON.stringify(lc.scope) === JSON.stringify(vue) && lc.granted_by === C.userId, 'C4 : la portée acceptée est exactement celle qui était affichée');
  const recoC = async () => { const avant = (await etat()).recus.length; await dicter([IDEE]); await poster('/api/recommendations/generate', cQ, { contactId: kc!.id }); const e = (await etat()).recus.slice(avant).map((x) => `${x.systeme}\n${x.texte}`).join('\n'); return TEMOINS.filter((m) => e.includes(m)); };
  let vus = await recoC();
  v.verifier(vus.length === 0, 'C5 : aucune donnée ajoutée n’est devenue accessible', vus.join(', '));
  // Variante : supprimer la demande et en recréer une plus large ; l'écran du proche tient l'ANCIEN identifiant.
  await Q.client.from('contact_consents').update({ status: 'revoked' }).eq('id', idC);
  d = await Q.client.from('contact_consents').insert({ pilote_id: Q.userId, contact_id: kc!.id, proche_user_id: C.userId, status: 'pending', kind: 'contact_analysis', scope: ['analysis'] }).select('id').single();
  const idAncien = d.data.id as string;
  await Q.client.from('contact_consents').delete().eq('id', idAncien);
  d = await Q.client.from('contact_consents').insert({ pilote_id: Q.userId, contact_id: kc!.id, proche_user_id: C.userId, status: 'pending', kind: 'contact_analysis', scope: ['analysis', 'reco:regime'] }).select('id').single();
  rr = await poster(`/api/consent/${idAncien}/respond`, cC, { action: 'accept' }, 'PATCH');
  lc = await ligne(d.data.id);
  console.log('  demande remplacée par une plus large ; le proche accepte l’ANCIENNE → HTTP', rr.status, '· nouvelle demande :', lc.status);
  v.verifier(rr.status === 404 && lc.status === 'pending', 'C6 : accepter l’ancienne demande n’active pas la nouvelle');
  // Restreindre reste permis.
  q = await Q.client.from('contact_consents').update({ scope: ['analysis'] }).eq('id', d.data.id).select('id');
  v.verifier(!refuse(q), 'C7 : le demandeur peut RESTREINDRE sa demande');
  // Le SERVEUR élargit une ligne active sans attester l'accord : REFUSÉ.
  await C.client.from('contact_consents').update({ status: 'active' }).eq('id', d.data.id);
  q = await admin.from('contact_consents').update({ scope: ['analysis', 'reco:regime', 'reco:reponses_libres'] }).eq('id', d.data.id).select('id');
  lc = await ligne(d.data.id); vus = await recoC();
  console.log('  le serveur élargit sans attester →', dit(q), '· portée :', lc.scope);
  v.verifier(refuse(q) && JSON.stringify(lc.scope) === '["analysis"]' && vus.length === 0, 'C8 : le serveur ne peut pas élargir une portée sans attester l’accord du titulaire');
  q = await admin.from('contact_consents').update({ scope: ['analysis', 'reco:regime'], granted_by: Q.userId, granted_at: new Date().toISOString() }).eq('id', d.data.id).select('id');
  v.verifier(refuse(q), 'C9 : ni en attestant au nom de quelqu’un d’autre que le titulaire');
  // LIGNE HISTORIQUE : active, sans preuve, portant déjà une portée que personne n'a validée.
  await Q.client.from('contact_consents').update({ status: 'revoked' }).eq('id', d.data.id);
  const { data: hist } = await admin.from('contact_consents').insert({ pilote_id: Q.userId, contact_id: kc!.id, proche_user_id: C.userId, status: 'active', kind: 'contact_analysis', scope: ['analysis', 'reco:reponses_libres'] }).select('id, granted_by').single();
  vus = await recoC();
  v.verifier(hist!.granted_by === null && vus.length === 0, 'C10 : une ligne historique sans preuve n’ouvre rien', vus.join(', '));
  rr = await poster('/api/consent/exclusions', cC, { contactId: kc!.id, action: 'autoriser', portee: 'reco:regime' });
  lc = await ligne(hist!.id); vus = await recoC();
  console.log('  le proche autorise son RÉGIME sur cette ligne → portée :', lc.scope, '· au modèle :', vus);
  v.verifier(lc.granted_by === C.userId && vus.includes('porc') && !vus.includes('bougies parfumées') && !lc.scope.includes('reco:reponses_libres'),
    'C11 : son accord pour le régime ne valide PAS la portée historique (réponses libres) qu’il n’a jamais accordée', `${vus.join(', ')} · ${JSON.stringify(lc.scope)}`);
}
v.bilan();
