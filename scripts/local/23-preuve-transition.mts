// PREUVE DE TRANSITION — une version du code × un état du schéma.
//
// On ne suppose rien : on OBSERVE, par les vraies routes et par des requêtes directes sous
// l'identité de chaque partie, ce que fait le couple (code, schéma) réellement en place, puis on
// le compare à ce qui est attendu pour cet état. Les invariants de sécurité (« jamais ») sont
// vérifiés dans TOUS les états ; le reste dit quels flux marchent, lesquels sont suspendus.
//
//   npx tsx scripts/local/23-preuve-transition.mts --code A --schema 112
//     code   : A = version en ligne (680f896) · B = branche
//     schema : dernière migration appliquée, dans l'ordre réel (112, 115, 113, 114, 116, 118, 117)
import { createClient } from '@supabase/supabase-js';
import { pileLocale, verificateur, DOMAINE_TEST, type CompteLocal } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';

const arg = (n: string) => process.argv[process.argv.indexOf(`--${n}`) + 1];
const CODE = arg('code') as 'A' | 'B', SCHEMA = Number(arg('schema'));
// L'ordre réel d'application : 112 → 115 → 113 → 114 → 116 → 118 → [déploiement] → 117.
const RANG = [112, 115, 113, 114, 116, 118, 117].indexOf(SCHEMA);
if (!['A', 'B'].includes(CODE) || RANG < 0) throw new Error('usage : --code A|B --schema 112|115|113|114|116|118|117');
const a = (n: number) => RANG >= [112, 115, 113, 114, 116, 118, 117].indexOf(n); // « la migration n est appliquée »

const { url, anon, admin } = pileLocale();
const v = verificateur();
const MODELE = process.env.ANTHROPIC_BASE_URL!;
const sfx = `${CODE.toLowerCase()}${SCHEMA}-${Date.now().toString(36)}`;
// Comptes à nom unique : sur le schéma 112, effacer un compte partie d'un consentement échoue
// (c'est le défaut que la 115 corrige) — on ne peut donc pas compter sur un nettoyage.
async function compte(nom: string): Promise<CompteLocal> {
  const email = `tr-${nom}-${sfx}@${DOMAINE_TEST}`, motDePasse = `T!${globalThis.crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true, user_metadata: { candice_test: true, full_name: nom } });
  if (error || !data?.user) throw new Error(`création ${email} : ${error?.message}`);
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { error: e2 } = await client.auth.signInWithPassword({ email, password: motDePasse });
  if (e2) throw e2;
  return { userId: data.user.id, email, client, motDePasse };
}
const complet = { attention_reception: { x: 1 }, temperament_axes: { x: 1 }, lifestyle_axes: { x: 1 }, singularity_answers: { adore_faire: 'lire' } };
const O = await compte('olga'), R = await compte('remi'), R2 = await compte('rose'), P = await compte('paul'), B = await compte('bruno'), T = await compte('tiers'), P2 = await compte('pia'), B2 = await compte('basile');
for (const [c, prenom] of [[O, 'Olga'], [R, 'Remi'], [R2, 'Rose'], [P, 'Paul'], [T, 'Theo'], [P2, 'Pia']] as const) {
  const { error } = await c.client.from('my_profile').upsert({ user_id: c.userId, ...complet, practical_info: { prenom } }, { onConflict: 'user_id' }); if (error) throw error;
}
for (const c of [B, B2]) {
  const { error } = await c.client.from('my_profile').upsert({ user_id: c.userId, ...complet, practical_info: { prenom: 'Bruno', vetos: { halal: true, allergies: ['arachide'] } } }, { onConflict: 'user_id' }); if (error) throw error;
}
const ck = async (c: CompteLocal) => cookiesDe(c.email, c.motDePasse);
const cO = await ck(O), cR = await ck(R), cP = await ck(P), cB = await ck(B), cB2 = await ck(B2);
await O.client.from('profile_analysis').insert({ user_id: O.userId, contact_id: null, summary: 'RESUME-OLGA', sections: { what_touches: { text: 'TOUCHE-OLGA' }, avoid: { text: 'ACOTE-OLGA' } } });
await O.client.from('person_states').insert({ subject_kind: 'pilot', subject_user_id: O.userId, declared_by: O.userId, state: 'deuil', note_free: 'ETAT-OLGA' });

console.log(`\n══ CODE ${CODE} × SCHÉMA ${SCHEMA} ══`);
const obs: Record<string, unknown> = {};

// 1 ── Lien de partage de fiche
let r = await poster('/api/share-link/create', cO, { mode: 'sections', sections: ['deep_miss'] });
const jeton = ((r.json as { url?: string } | null)?.url ?? '').split('/').pop() ?? '';
await poster(`/rejoindre/${jeton}`, cR, null, 'GET');
const parLien = (await admin.from('contact_consents').select('id, granted_by, scope').eq('kind', 'profile_view').eq('pilote_id', O.userId).eq('proche_user_id', R.userId).eq('status', 'active')).data ?? [];
obs.lien = parLien.length === 1;
obs.lienProuve = parLien[0]?.granted_by === O.userId;
if (parLien[0]) { const f = await poster(`/fiche/${parLien[0].id}`, cR, null, 'GET'); obs.ficheParLien = /RESUME-OLGA|ACOTE-OLGA/.test(f.texte); obs.ficheDeborde = /TOUCHE-OLGA/.test(f.texte); }

// 2 ── Demande de voir une fiche, réponse du propriétaire (une section)
const { data: dem, error: eDem } = await R2.client.from('contact_consents').insert({ pilote_id: O.userId, proche_user_id: R2.userId, requested_by: R2.userId, status: 'pending', kind: 'profile_view', scope: ['socle'] }).select('id').single();
if (eDem) throw eDem;
r = await poster(`/api/profile-view/${dem!.id}/respond`, cO, { action: 'sections', sections: ['deep_miss'] });
const apresRep = (await admin.from('contact_consents').select('status, granted_by').eq('id', dem!.id).single()).data!;
obs.demande = r.status === 200 && apresRep.status === 'active' && apresRep.granted_by === O.userId;
// Lecture DIRECTE par le lecteur (requête du navigateur, hors application)
obs.analyseEntiereDirecte = ((await R2.client.from('profile_analysis').select('summary, sections').eq('user_id', O.userId).is('contact_id', null)).data ?? []).length > 0;
obs.etatsDirects = ((await R2.client.from('person_states').select('note_free').eq('subject_user_id', O.userId)).data ?? []).length > 0;
obs.tiersLitFiche = ((await T.client.from('profile_analysis').select('summary').eq('user_id', O.userId)).data ?? []).length > 0;

// 3 ── Invitation, puis proposition de partager l'analyse du pilote
const { data: kp } = await P.client.from('contacts').insert({ user_id: P.userId, name: 'Bruno Test', relationship: 'friend' }).select('id').single();
await P.client.from('profile_analysis').insert({ user_id: P.userId, contact_id: kp!.id, summary: 'ANALYSE-PRIVEE-DE-PAUL' });
r = await poster('/api/invite/create', cP, { contactId: kp!.id });
const inv = (r.json as { token?: string } | null)?.token ?? '';
r = await poster('/api/invite/link', cB, { token: inv });
const lie = (await admin.from('contacts').select('*').eq('id', kp!.id).single()).data!;
obs.invitation = lie.proche_user_id === B.userId;
obs.lienConfirme = 'proche_lien_confirme_par' in lie ? (lie.proche_lien_confirme_par === B.userId ? 'oui' : 'non') : 'colonne absente';
const analyseDePaul = async (c: CompteLocal) => ((await c.client.from('profile_analysis').select('summary').eq('user_id', P.userId).eq('contact_id', kp!.id)).data ?? []).length > 0;
obs.analyseAvantProposition = await analyseDePaul(B);
r = await poster(`/api/contacts/${kp!.id}/consent`, cP, {});
obs.propositionHttp = r.status;
const cid = (r.json as { consentId?: string } | null)?.consentId;
if (cid) { await poster(`/api/consent/${cid}/respond`, cB, { action: 'accept' }, 'PATCH'); }
obs.analyseApresAcceptation = await analyseDePaul(B);
obs.tiersLitAnalyse = await analyseDePaul(T);

// 4 ── Recommandation : ce qui part au modèle, AVANT toute autorisation du proche
const etat = async () => ((await (await fetch(`${MODELE}/__etat`)).json()) as { recus: { systeme: string; texte: string }[] }).recus;
const IDEE = { __texte: JSON.stringify([{ title: 'Un livre choisi pour lui', justification: 'Une attention simple.', dim: 'CAD_C', canal: 'message', intensite: 'legere', declencheur: 'x' }]) };
const reco = async (cookie: string, contactId: string) => {
  const avant = (await etat()).length; await fetch(`${MODELE}/__script`, { method: 'POST', body: JSON.stringify({ reponses: [IDEE] }) });
  const res = await poster('/api/recommendations/generate', cookie, { contactId });
  const envoye = (await etat()).slice(avant).map((x) => `${x.systeme}\n${x.texte}`).join('\n');
  return { http: res.status, vus: ['porc', 'jambon', 'arachide'].filter((m) => envoye.includes(m)) };
};
let x = await reco(cP, kp!.id);
obs.recoSansAutorisation = x.vus.join(',') || 'rien';
obs.recoEnregistree = ((await P.client.from('contact_recommendations').select('id').eq('contact_id', kp!.id)).data ?? []).length === 1;

// 5 ── Autorisation d'usage par le proche (route de la branche)
r = await poster('/api/consent/exclusions', cB, { contactId: kp!.id, action: 'autoriser', portee: 'reco:regime' });
obs.usageHttp = r.status;
x = await reco(cP, kp!.id);
obs.recoApresAutorisation = x.vus.join(',') || 'rien';
// Un proche qui n'a QUE autorisé un usage : lit-il l'analyse privée de son pilote ?
const { data: k2 } = await P2.client.from('contacts').insert({ user_id: P2.userId, name: 'Basile Test', relationship: 'friend' }).select('id').single();
await P2.client.from('contacts').update({ proche_user_id: B2.userId }).eq('id', k2!.id);
await P2.client.from('profile_analysis').insert({ user_id: P2.userId, contact_id: k2!.id, summary: 'ANALYSE-PRIVEE-DE-PIA' });
r = await poster('/api/consent/exclusions', cB2, { contactId: k2!.id, action: 'autoriser', portee: 'reco:regime' });
obs.usageSeulOuvreAnalyse = ((await B2.client.from('profile_analysis').select('summary').eq('user_id', P2.userId).eq('contact_id', k2!.id)).data ?? []).length > 0;

// 6 ── Effacer un compte partie d'un consentement (le lecteur R2), puis un compte sans rapport
const { error: eSup } = await admin.auth.admin.deleteUser(R2.userId);
obs.effacement = !eSup;
obs.autresIntacts = ((await admin.from('contact_consents').select('id').eq('pilote_id', P.userId)).data ?? []).length >= (cid ? 1 : 0);

console.log(JSON.stringify(obs, null, 1).replace(/\n\s*/g, ' '));

// ── INVARIANTS : vrais dans TOUS les états ─────────────────────────────────────────────────
console.log('  — jamais, quel que soit l’état —');
v.verifier(obs.tiersLitFiche === false && obs.tiersLitAnalyse === false, 'un tiers ne lit ni une fiche, ni une analyse');
v.verifier(obs.analyseAvantProposition === false, 'le proche ne lit pas l’analyse du pilote avant qu’elle lui soit proposée et qu’il l’accepte');
v.verifier(obs.recoSansAutorisation === 'rien', 'sans autorisation, rien du profil du proche ne part au modèle');
v.verifier(obs.usageSeulOuvreAnalyse === false, 'autoriser un usage n’ouvre pas l’analyse privée du pilote');
v.verifier(CODE === 'A' ? obs.recoApresAutorisation === 'rien' : true, 'version en ligne : la lecture du profil lié reste désactivée');
v.verifier(obs.usageHttp === 200 ? obs.recoApresAutorisation === 'porc,jambon' : obs.recoApresAutorisation === 'rien', 'ce qui part au modèle après le réglage = exactement ce qui a été autorisé (le régime, pas l’allergie) — ou rien si le réglage a échoué');
v.verifier(obs.ficheDeborde !== true, 'la fiche servie par l’application ne déborde pas de la section partagée');

// ── ATTENDUS DE CET ÉTAT ──────────────────────────────────────────────────────────────────
console.log('  — attendu pour cet état —');
const att = {
  // Le lien de partage : l'ancienne version ne nomme pas le titulaire ; la 117 le refuse alors.
  lien: !(CODE === 'A' && a(117)),
  // Lecture directe de toute l'analyse d'une fiche partagée : défaut ANCIEN, fermé par la 116.
  analyseEntiereDirecte: !a(116),
  etatsDirects: !a(116),
  // L'invitation de la branche écrit la confirmation du lien : il lui faut la colonne de la 113.
  invitation: CODE === 'A' || a(113),
  // Proposer son analyse : la branche exige un lien confirmé (donc la 113).
  propositionHttp: CODE === 'A' || a(113) ? 200 : 404,
  // Régler un usage : route absente de la version en ligne ; la branche a besoin du type créé par la 116.
  // Sans la 113, l'invitation de la branche n'a rattaché aucun compte : la route ne trouve pas de fiche (404).
  usageHttp: CODE === 'A' ? 404 : a(116) ? 200 : a(113) ? 500 : 404,
  // Enregistrer une recommandation : la branche écrit sa provenance, il lui faut les colonnes de la 118.
  recoEnregistree: CODE === 'A' || a(118),
  // Effacer un compte partie d'un consentement : corrigé par la 115.
  effacement: a(115),
};
v.verifier(obs.lien === att.lien, `lien de partage de fiche : ${att.lien ? 'fonctionne' : 'SUSPENDU (refusé fermé)'}`, String(obs.lien));
if (obs.lien) v.verifier(obs.ficheParLien === (CODE === 'A' || obs.lienProuve === true), 'la fiche ouverte par ce lien s’affiche', String(obs.ficheParLien));
v.verifier(obs.demande === true, 'demande de voir une fiche + réponse du propriétaire : fonctionne');
v.verifier(obs.analyseEntiereDirecte === att.analyseEntiereDirecte, `lecture directe de l’analyse entière d’une fiche partagée : ${att.analyseEntiereDirecte ? 'ENCORE OUVERTE (défaut ancien, pas encore fermé)' : 'fermée'}`, String(obs.analyseEntiereDirecte));
v.verifier(obs.etatsDirects === att.etatsDirects, `lecture directe des états déclarés : ${att.etatsDirects ? 'ENCORE OUVERTE (défaut ancien)' : 'fermée'}`, String(obs.etatsDirects));
v.verifier(obs.invitation === att.invitation, `invitation acceptée : ${att.invitation ? 'fonctionne' : 'SUSPENDUE'}`, String(obs.invitation));
v.verifier(obs.propositionHttp === att.propositionHttp, `proposer son analyse : HTTP ${att.propositionHttp}${att.propositionHttp === 200 ? '' : ' (SUSPENDU)'}`, String(obs.propositionHttp));
if (att.propositionHttp === 200) v.verifier(obs.analyseApresAcceptation === true, 'analyse proposée puis acceptée : le proche la lit');
v.verifier(obs.usageHttp === att.usageHttp, `régler un usage : HTTP ${att.usageHttp}${att.usageHttp === 200 ? '' : CODE === 'A' ? ' (route absente de cette version)' : ' (SUSPENDU, refusé fermé)'}`, String(obs.usageHttp));
v.verifier(obs.recoEnregistree === att.recoEnregistree, `recommandation enregistrée : ${att.recoEnregistree ? 'oui' : 'NON (SUSPENDU : la branche attend la 118)'}`, String(obs.recoEnregistree));
v.verifier(obs.effacement === att.effacement, `effacer un compte partie d’un consentement : ${att.effacement ? 'réussit' : 'ÉCHOUE (défaut de la 112, corrigé par la 115)'}`, String(obs.effacement));
v.bilan();
