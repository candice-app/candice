// PREUVE — /api/memories/situation : qui peut provoquer quoi, sur le compte de qui.
//
// L'application tourne en local (pile locale, faux modèle). Quatre comptes de test :
//   P le pilote · R son proche, qui a un compte et un lien établi · X un autre compte ·
//   V un compte sans aucun lien avec personne.
// Pour chaque essai on relève le RÉSULTAT RÉEL : code HTTP, ce qui est écrit, et surtout ce
// qui a été fait sur le compte d'un AUTRE (journal de traitement, analyse de profil), plus
// le nombre d'appels au modèle provoqués.
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';
import { enregistrerReponseFermee, cleOption } from '../../src/lib/discovery/open-v3/service.ts';
import { question } from '../../src/lib/discovery/open-v3/banque.ts';

const MODELE = process.env.ANTHROPIC_BASE_URL!;
const etatModele = async () => (await fetch(`${MODELE}/__etat`)).json() as Promise<{ appels: number }>;
const { admin } = pileLocale();
const v = verificateur();
const ATTENDU = process.argv.includes('--apres-correction');

const P = await compteLocal('situation-pilote'), R = await compteLocal('situation-proche');
const X = await compteLocal('situation-autre'), V = await compteLocal('situation-victime');
// R et V ont un journal (sinon la régénération s'arrête d'elle-même et ne prouve rien).
for (const c of [R, V]) {
  const q = question('animals.2131')!;
  await enregistrerReponseFermee(c.client as never, { acteId: globalThis.crypto.randomUUID(), userId: c.userId, questionId: q.id, clesOptions: q.options.slice(0, 2).map(cleOption) });
}
// Le lien P → R : un contact de P rattaché au compte de R, et un consentement actif.
const { data: contact, error: eC } = await P.client.from('contacts').insert({ user_id: P.userId, name: 'Rose', relationship: 'friend', proche_user_id: R.userId }).select('id').single();
if (eC) throw eC;
// Le pilote DEMANDE, le proche ACCEPTE : depuis la migration 112, le demandeur ne peut plus créer lui-même un consentement actif.
const { data: consent, error: eK } = await P.client.from('contact_consents').insert({ pilote_id: P.userId, contact_id: contact!.id, proche_user_id: R.userId, status: 'pending', kind: 'contact_analysis' }).select('id').single();
if (eK) throw eK;
{ const { error } = await R.client.from('contact_consents').update({ status: 'active' }).eq('id', consent!.id); if (error) throw error; }
const cookie = { P: await cookiesDe(P.email, P.motDePasse), X: await cookiesDe(X.email, X.motDePasse) };

// Ce qui a été fait SUR le compte d'un autre : lu avec la clé de service, hors RLS — c'est
// un instrument de mesure pour l'essai, pas un chemin de l'application.
const effetsSur = async (userId: string) => {
  const [log, ana] = await Promise.all([
    admin.from('processing_log').select('step,status').eq('pilot_id', userId),
    admin.from('profile_analysis').select('id,updated_at').eq('user_id', userId),
  ]);
  return { journal: log.data?.length ?? 0, analyses: ana.data?.length ?? 0 };
};
const notesDe = async (pilote: string) => (await admin.from('memories').select('id,contact_id,pilot_id').eq('pilot_id', pilote)).data ?? [];
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function essai(nom: string, qui: 'P' | 'X' | null, corps: Record<string, unknown>, cible: { userId: string }, auteur: { userId: string }) {
  const avant = { modele: (await etatModele()).appels, effets: await effetsSur(cible.userId), notes: (await notesDe(auteur.userId)).length };
  const r = await poster('/api/memories/situation', qui ? cookie[qui] : null, corps);
  await attendre(2500);                                  // la régénération part en arrière-plan
  const apres = { modele: (await etatModele()).appels, effets: await effetsSur(cible.userId), notes: (await notesDe(auteur.userId)).length };
  const bilan = {
    http: r.status, reponse: JSON.stringify(r.json ?? r.texte.slice(0, 80)).slice(0, 140),
    noteEcrite: apres.notes - avant.notes, appelsModele: apres.modele - avant.modele,
    operationSurLaCible: (apres.effets.journal - avant.effets.journal) + (apres.effets.analyses - avant.effets.analyses),
  };
  console.log(`\n${nom}\n   →`, bilan);
  return bilan;
}
const note = { contactFirstName: 'Rose', rawText: 'Elle traverse une période chargée au travail.' };

const a = await essai('A. UTILISATEUR AUTORISÉ — P écrit une note sur son contact, lié au compte de R (lien et consentement actifs)', 'P', { ...note, contactId: contact!.id, contactUserId: R.userId }, R, P);
const b = await essai('B. AUTRE COMPTE — X vise le contact de P et le compte de R, avec lesquels il n’a aucun lien', 'X', { ...note, contactId: contact!.id, contactUserId: R.userId }, R, X);
const c = await essai('C. IDENTIFIANT FALSIFIÉ — P utilise son vrai contact mais désigne le compte de V, qui n’a aucun lien avec lui', 'P', { ...note, contactId: contact!.id, contactUserId: V.userId }, V, P);
await P.client.from('contact_consents').update({ status: 'revoked' }).eq('id', consent!.id);
const d = await essai('D. AUTORISATION RETIRÉE — le consentement de R est révoqué, P recommence', 'P', { ...note, contactId: contact!.id, contactUserId: R.userId }, R, P);
const e = await essai('E. SANS SESSION', null, { ...note, contactId: contact!.id, contactUserId: R.userId }, R, P);

if (ATTENDU) {
  console.log('\n── CE QUI EST EXIGÉ APRÈS CORRECTION');
  v.verifier(a.http === 200 && a.noteEcrite === 1, 'A : l’utilisateur autorisé enregistre sa note', JSON.stringify(a));
  v.verifier(a.operationSurLaCible === 0, 'A : aucune opération n’est provoquée sur le compte du proche', JSON.stringify(a));
  v.verifier(b.http === 404 && b.noteEcrite === 0 && b.appelsModele === 0 && b.operationSurLaCible === 0, 'B : un autre compte est refusé, sans écriture ni appel au modèle', JSON.stringify(b));
  v.verifier(c.operationSurLaCible === 0, 'C : un identifiant de compte falsifié ne provoque rien sur ce compte', JSON.stringify(c));
  v.verifier(d.operationSurLaCible === 0, 'D : après retrait de l’autorisation, rien n’est provoqué sur le compte du proche', JSON.stringify(d));
  v.verifier(e.http === 401 && e.appelsModele === 0, 'E : sans session, refus avant tout appel au modèle', JSON.stringify(e));
  v.bilan();
}
