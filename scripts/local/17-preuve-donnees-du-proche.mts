// PREUVE — ce que la recommandation lit du COMPTE d'un proche, et sur la foi de quoi.
//
// Un pilote rattache un de ses contacts à un compte Candice (`contacts.proche_user_id`).
// La route de recommandation lit alors le profil de ce compte avec le client privilégié.
// Question : sur quelle autorisation ? On regarde ce qui part RÉELLEMENT au modèle.
//   V  un compte sans AUCUN lien avec le pilote, qui a déclaré deux allergies et un régime ;
//   P  le pilote, qui écrit lui-même l'identifiant de V sur un de ses contacts.
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';

const MODELE = process.env.ANTHROPIC_BASE_URL!;
const dicter = (reponses: unknown[]) => fetch(`${MODELE}/__script`, { method: 'POST', body: JSON.stringify({ reponses }) });
const etat = async () => (await fetch(`${MODELE}/__etat`)).json() as Promise<{ recus: { systeme: string; texte: string }[] }>;
await fetch(`${MODELE}/__raz`, { method: 'POST', body: '{}' });
const { admin } = pileLocale();
const v = verificateur();
const APRES = process.argv.includes('--apres-correction');

const P = await compteLocal('proche-pilote'), V = await compteLocal('proche-victime');
const cP = await cookiesDe(P.email, P.motDePasse);
// Le profil de V, écrit par V lui-même.
const { error: eV } = await V.client.from('my_profile').upsert({
  user_id: V.userId,
  practical_info: { allergies: ['arachide', 'gluten'], regime: 'halal', vetos: { allergies: ['arachide', 'gluten'], halal: true, no_alcohol: true } },
  singularity_answers: { cadeaux_non: 'les bougies parfumées', evite_deteste: 'les foules' },
}, { onConflict: 'user_id' });
if (eV) throw eV;

// P crée un contact et y écrit l'identifiant de V — sans que V ait rien accepté.
const { data: k, error: eK } = await P.client.from('contacts').insert({ user_id: P.userId, name: 'Victor Test', relationship: 'friend' }).select('id').single();
if (eK) throw eK;
const { error: eL } = await P.client.from('contacts').update({ proche_user_id: V.userId }).eq('id', k!.id);
console.log('P écrit proche_user_id = V sur son propre contact →', eL ? `refusé (${eL.message})` : 'ACCEPTÉ par la base');
const consent = (await admin.from('contact_consents').select('id').eq('pilote_id', P.userId)).data ?? [];
console.log('consentements entre P et V :', consent.length);

const IDEE = { __texte: JSON.stringify([{ title: 'Un livre choisi pour lui', justification: 'Une attention simple.', dim: 'CAD_C', canal: 'message', intensite: 'legere', declencheur: 'x' }]) };
const reco = async () => {
  const avant = (await etat()).recus.length;
  await dicter([IDEE]);
  const r = await poster('/api/recommendations/generate', cP, { contactId: k!.id });
  const envoye = (await etat()).recus.slice(avant).map((x) => `${x.systeme}\n${x.texte}`).join('\n');
  return { r, envoye };
};
const fuites = (t: string) => ['arachide', 'gluten', 'porc', 'jambon', 'alcool', 'bougies parfumées', 'les foules'].filter((m) => t.includes(m));

const x = await reco();
console.log('\nrecommandation → HTTP', x.r.status);
console.log('   mots du profil de V retrouvés dans ce qui part au modèle :', fuites(x.envoye));
console.log('   ligne des filtres :', (x.envoye.match(/FILTRES DURS[^\n]*/) ?? ['(aucune)'])[0]);
if (APRES) {
  v.verifier(fuites(x.envoye).length === 0, 'sans consentement, rien du profil de V ne part au modèle', fuites(x.envoye).join(', '));
  // La suite — consentement partiel, retrait, preuve d'accord — est dans 18-preuve-consentements.
  v.bilan();
}
