// PARCOURS COMPLET AVEC LECTURE RÉELLE — préparé le 19 nov. (décision 10, 18h54), à lancer par Estelle.
//
// Ce que le script 34 ne prouve pas : la chaîne entière, sur une VRAIE base locale, par les VRAIES
// routes de l'application, avec le VRAI modèle :
//   1. réponse  — la proche (compte de test B) répond à une question libre (learning2.1459) ;
//   2. extraction et écriture — le vrai modèle découpe, l'application écrit ce que le contrat permet ;
//   3. relecture — le portrait relit ce qui est écrit, et seulement cela ;
//   4. usage autorisé — sans autorisation, rien de B ne part à la recommandation du pilote (compte P) ;
//      B accorde `reco:gouts` depuis SON écran (route + migration 121) ; alors, et alors seulement,
//      son goût déclaré peut inspirer une idée, dont la justification ne révèle rien.
//
// SÉCURITÉ, structurelle :
//   · BASE LOCALE SEULEMENT : le script s'arrête si l'adresse Supabase ou l'application ne sont pas
//     locales (127.0.0.1). Comptes de test séparés, jamais le tien.
//   · LA CLÉ reste dans l'environnement du processus de l'application et du script ; jamais affichée,
//     jamais écrite. Refus si elle manque, ou si le modèle visé est le faux modèle local.
//
// LANCEMENT (Terminal du Mac, dans ~/candice, pile locale montée par scripts/local/01-monter-la-pile.sh) :
//   1. read -s ANTHROPIC_API_KEY && export ANTHROPIC_API_KEY
//   2. dans ce même Terminal, lancer l'application locale (npm run dev -- -p 3100) en arrière-plan
//   3. npx tsx scripts/local/37-parcours-complet-lecture-reelle.mts
//   4. unset ANTHROPIC_API_KEY
import { compteLocal, verificateur, pileLocale } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';
import { enregistrerReponseOuverte } from '../../src/lib/discovery/open-v3/service.ts';
import { lirePortrait } from '../../src/lib/knowledge/portrait.ts';

if (!process.env.ANTHROPIC_API_KEY) { console.error('ARRÊT — aucune clé dans l’environnement.'); process.exit(2); }
if (process.env.ANTHROPIC_BASE_URL && /127\.0\.0\.1|localhost/.test(process.env.ANTHROPIC_BASE_URL)) { console.error('ARRÊT — le modèle visé est local : ce parcours exige le vrai modèle.'); process.exit(2); }
if (!/^http:\/\/127\.0\.0\.1:\d+/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')) { console.error('ARRÊT — base non locale.'); process.exit(2); }
pileLocale();
const v = verificateur();

const P = await compteLocal('reel-pilote'), B = await compteLocal('reel-proche');
const { data: k } = await P.client.from('contacts').insert({ user_id: P.userId, name: 'Proche Réel', relationship: 'friend', proche_user_id: B.userId }).select('id').single();
const cP = await cookiesDe(P.email, P.motDePasse), cB = await cookiesDe(B.email, B.motDePasse);

console.log('\n1–2. Réponse libre de B, lue par le VRAI modèle');
const r = await enregistrerReponseOuverte(B.client as never, { userId: B.userId, questionId: 'learning2.1459', texte: 'En ce moment la céramique japonaise, et un peu l’histoire des cartes anciennes. La chimie ne m’intéresse pas.', acteId: globalThis.crypto.randomUUID() });
const { data: p } = await B.client.from('knowledge_evidences').select('target_family, raw_information, polarity, assertion_status').eq('user_id', B.userId).is('superseded_at', null);
console.log('     écrit :', JSON.stringify(p));
v.verifier(!r.extractionEnAttente, '1 : la lecture a eu lieu');
v.verifier((p ?? []).some((x) => /c[ée]ramique/i.test(x.raw_information)) && !(p ?? []).some((x) => /chimie/i.test(x.raw_information) && x.polarity !== 'rejet'), '2 : la céramique est écrite ; la chimie (niée) n’est pas un intérêt');

console.log('\n3. Relecture par le portrait');
const portrait = await lirePortrait(B.client as never, { userId: B.userId });
v.verifier(portrait.interests.some((i) => /c[ée]ramique/i.test(i.subjectLabel)), '3 : le portrait relit l’intérêt écrit');

console.log('\n4. Usage autorisé');
const genere = async () => (await poster('/api/recommendations/generate', cP, { contactId: k!.id })).texte;
const sans = await genere();
v.verifier(!/c[ée]ramique/i.test(sans), '4a : sans reco:gouts, le goût de B n’inspire rien');
const acc = await poster('/api/consent/exclusions', cB, { contactId: k!.id, action: 'autoriser', portee: 'reco:gouts' });
v.verifier(acc.status === 200, '4b : B accorde reco:gouts depuis sa session');
const avec = await genere();
console.log('     recommandation après accord (extrait) :', avec.slice(0, 400));
v.verifier(!/apprentissage|learning2|a répondu|a déclaré/i.test(avec), '4c : aucune justification ne révèle d’où vient l’idée');
v.bilan();
