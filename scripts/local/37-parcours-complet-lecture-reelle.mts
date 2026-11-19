// PARCOURS COMPLET — par les VRAIES routes, avec OBSERVATION de ce qui part au modèle (19 nov., 19h56).
//
// Ce que ce script exécute, de bout en bout, sur la pile locale et des comptes de test séparés :
//   1. SÉLECTION — la proche (B) choisit d'explorer l'apprentissage ; le SERVEUR propose les lots
//      (/api/discovery/lot), chaque réponse part avec le jeton signé (/api/discovery/answer).
//   2. RÉPONSES — une réponse FERMÉE « Astronomie » (learning2.1440 : sa déclaration explicite) et une
//      réponse LIBRE (learning2.1459), lue par le modèle des destinations. Les autres questions sont
//      passées : elles n'écrivent rien.
//   3. PERSISTANCE ET RELECTURE — le journal de B et son portrait sont relus dans la base.
//   4. RECOMMANDATION du pilote (P), /api/recommendations/generate, trois fois :
//        a. sans autorisation : AUCUNE donnée de B dans ce qui part au modèle ;
//        b. B accorde `reco:gouts` depuis sa session : sa déclaration éligible (« Astronomie ») PART
//           au modèle ; la lecture par modèle (« céramique… ») n'est pas éligible et ne part pas ;
//        c. B retire : ce qui en avait été tiré n'est plus restitué, et rien de B ne repart.
//   Ce qui part au modèle est OBSERVÉ par le relais (scripts/local/relais-observateur.mjs), placé
//   entre l'application et le modèle : on lit la consigne et les messages réellement envoyés, et la
//   provenance de chaque donnée de B qu'on y retrouve. L'absence d'un mot dans la RÉPONSE ne prouve rien.
//
// Chaque statut HTTP et chaque erreur de lecture sont vérifiés : une erreur arrête le script, elle
// n'est jamais prise pour « aucune donnée transmise ».
//
// DEUX MODES (variable PARCOURS_MODELE, obligatoire) :
//   · simule — relais → faux modèle (:8787). Prouve la PLOMBERIE de bout en bout ; ne dit rien de la
//              qualité d'une lecture. Les réponses du modèle sont dictées par ce script.
//   · reel   — relais → https://api.anthropic.com. La clé n'est JAMAIS dans ce script : elle est dans
//              l'environnement de l'APPLICATION seulement. Procédure : docs/discovery/procedure-vrai-modele.md
//              (lanceur : scripts/local/40-parcours-vrai-modele.sh).
//
// SÉCURITÉ : base, application et relais strictement locaux (adresse, protocole et port exacts) ;
// le processus de l'application ne doit avoir aucune connexion hors de la boucle locale.
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { MODELE_DESTINATIONS, VERSION_LECTURE } from '../../src/lib/discovery/open-v3/destinations.ts';
import { compteLocal, verificateur, pileLocale } from './_compte-local.mts';
import { cookiesDe, poster, obtenirLot, repondre } from './_session-http.mts';
import { exigerLocal, exigerProcessusLocal } from './_garde-locale.mts';
import { lirePortrait } from '../../src/lib/knowledge/portrait.ts';
import { lireGoutsDuProche, JUSTIFICATION_NEUTRE } from '../../src/lib/recommendations/gouts-proche.ts';

const MODE = process.env.PARCOURS_MODELE;
if (MODE !== 'simule' && MODE !== 'reel') { console.error('ARRÊT — PARCOURS_MODELE doit valoir « simule » ou « reel ».'); process.exit(2); }
const RELAIS = process.env.RELAIS_URL ?? 'http://127.0.0.1:8789';
exigerLocal({ nom: 'RELAIS_URL', url: RELAIS, port: 8789 });
const FAUX = 'http://127.0.0.1:8787';
const { admin } = pileLocale();
// En mode réel, la clé est dans le processus de l'application : on exige qu'il n'ait AUCUNE connexion
// hors de la boucle locale (il ne parle qu'au relais, et à la base locale). Le conteneur de travail
// ne permet pas à `lsof` de voir les sockets : le mode simulé, sans clé, s'en passe — et le dit.
if (MODE === 'reel') exigerProcessusLocal(3100);
else console.log('mode simulé : contrôle lsof du processus de l’application non exigé (aucune clé réelle en jeu).');

type Trace = { n: number; outil: string | null; modele: string | null; statut: number | string | null; systeme: string; messages: { role: string; contenu: string }[] };
const etatRelais = async (): Promise<{ amont: string; appels: number; recus: Trace[] }> => {
  const r = await fetch(`${RELAIS}/__etat`);
  if (!r.ok) throw new Error(`relais illisible : HTTP ${r.status}`);
  return r.json() as never;
};
const razRelais = async () => { const r = await fetch(`${RELAIS}/__raz`, { method: 'POST', body: '{}' }); if (!r.ok) throw new Error(`relais : remise à zéro impossible (${r.status})`); };
const amont = (await etatRelais()).amont;
if (MODE === 'simule' && amont !== FAUX) throw new Error(`ARRÊT — mode simulé, mais le relais transmet à ${amont}`);
if (MODE === 'reel' && amont !== 'https://api.anthropic.com') throw new Error(`ARRÊT — mode réel, mais le relais transmet à ${amont}`);
const dicter = async (reponses: unknown[]) => {
  if (MODE !== 'simule') return;
  const r = await fetch(`${FAUX}/__script`, { method: 'POST', body: JSON.stringify({ reponses }) });
  if (!r.ok) throw new Error(`faux modèle : dictée refusée (${r.status})`);
};
if (MODE === 'simule') { const r = await fetch(`${FAUX}/__raz`, { method: 'POST', body: '{}' }); if (!r.ok) throw new Error('faux modèle injoignable'); }
await razRelais();

const v = verificateur();
let COMMIT: string, MODIFIE: boolean;
try { COMMIT = execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); MODIFIE = execSync('git status --porcelain -- src', { encoding: 'utf8' }).trim().length > 0; }
catch {
  // Le mode réel exige un commit : un essai réel qui ne dit pas ce qu'il a testé ne prouve rien.
  // Le mode simulé tourne aussi dans la copie de travail sans git du conteneur : il le dit.
  if (MODE === 'reel') { console.error('ARRÊT — commit testé illisible (git).'); process.exit(2); }
  COMMIT = 'copie de travail non versionnée (mode simulé)'; MODIFIE = true;
}
console.log(`commit ${COMMIT}${MODIFIE ? ' (+ modifications non commitées dans src)' : ''} · lecteur v${VERSION_LECTURE} · modèle des destinations ${MODELE_DESTINATIONS} · mode ${MODE}`);
const rapport: Record<string, unknown> = { date: new Date().toISOString(), commit: COMMIT, modifications_non_commitees_dans_src: MODIFIE, version_du_lecteur: VERSION_LECTURE, modele_destinations: MODELE_DESTINATIONS, mode: MODE, amont,
  nature: MODE === 'simule' ? 'parcours complet EXÉCUTÉ, modèle SIMULÉ (plomberie seulement)' : 'parcours complet EXÉCUTÉ avec le VRAI modèle' };
const plier = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’`]/g, "'");
const lu = <T,>(r: { data: T | null; error: { message: string } | null }, quoi: string): T => {
  if (r.error) throw new Error(`lecture impossible (${quoi}) : ${r.error.message}`);
  return r.data as T;
};

// ═══ 0. Les comptes ═══
const P = await compteLocal('parcours37-pilote'), B = await compteLocal('parcours37-proche');
const k = lu(await P.client.from('contacts').insert({ user_id: P.userId, name: 'Proche Parcours', relationship: 'friend', proche_user_id: B.userId }).select('id').single(), 'fiche') as { id: string };
const cP = await cookiesDe(P.email, P.motDePasse), cB = await cookiesDe(B.email, B.motDePasse);
console.log('Fiche créée par le pilote sous sa session (RLS) ; le lien de compte est posé à la main, comme aux scripts 18 et 35.');

// ═══ 1–2. Sélection et réponses, par les routes ═══
console.log('\n1–2. Sélection par le serveur, réponses avec le jeton signé');
const TEXTE_LIBRE = 'En ce moment la céramique japonaise, et un peu l’histoire des cartes anciennes. La chimie ne m’intéresse pas.';
const sujet = await poster('/api/discovery/sujet', cB, { branche: 'learning2', choisi: true });
v.verifier(sujet.status === 200, '1 : B choisit d’explorer l’apprentissage (HTTP 200)', `HTTP ${sujet.status}`);
let lot = await obtenirLot(cB, 'full');
let q = lot?.question, jeton = lot?.jeton;
const parcours: { cle: string; acte: string; statut: number }[] = [];
let fermee = false, libre = false;
for (let i = 0; i < 80 && q && !(fermee && libre); i++) {
  const cle = q.question_key;
  let corps: Record<string, unknown>;
  if (cle === 'learning2.1440') {
    const opt = (q.options ?? []).find((o) => o.label === 'Astronomie');
    if (!opt) throw new Error('learning2.1440 servie sans l’option « Astronomie »');
    corps = { jeton, questionKey: cle, answer: [opt.value] };
  } else if (cle === 'learning2.1459') {
    // Simulé : le découpage qu'un modèle CONFORME rendrait. Réel : le vrai modèle lit.
    await dicter([{ segments: [
      { declencheur: 'SUJET_DECLARE', passage: 'la céramique japonaise', attitude: 'interet', affirme: true, personne: 'soi', temps: 'actuel', condition: null, limite: null },
      { declencheur: 'SUJET_DECLARE', passage: 'l’histoire des cartes anciennes', attitude: 'interet', affirme: true, personne: 'soi', temps: 'actuel', condition: null, limite: null },
      { declencheur: 'SUJET_DECLARE', passage: 'La chimie', attitude: 'interet', affirme: true, personne: 'soi', temps: 'actuel', condition: null, limite: null },
    ] }]);
    corps = { jeton, questionKey: cle, answer: TEXTE_LIBRE };
  } else corps = { jeton, questionKey: cle, skip: true };
  const r = await repondre(cB, corps);
  parcours.push({ cle, acte: 'answer' in corps ? 'réponse' : 'passée', statut: r.status });
  if (r.status !== 200) throw new Error(`réponse refusée : ${cle} HTTP ${r.status} ${r.motif ?? ''} ${r.erreur ?? ''}`);
  if (cle === 'learning2.1440') fermee = true;
  if (cle === 'learning2.1459') libre = true;
  q = r.next?.question; jeton = r.next?.jeton ?? jeton;
  if (!q && !(fermee && libre)) { lot = await obtenirLot(cB, 'full'); q = lot?.question; jeton = lot?.jeton; }
}
rapport.parcours = parcours;
v.verifier(fermee && libre, `2 : les deux questions ont été SERVIES par le serveur et répondues (${parcours.length} actes, tous HTTP 200)`);
const lecture = (await etatRelais()).recus.filter((t) => t.outil === 'segments');
v.verifier(lecture.length >= 1 && lecture.every((t) => t.statut === 200), '2 : la lecture de la réponse libre est partie au modèle, statut 200', JSON.stringify(lecture.map((t) => t.statut)));
v.verifier(lecture.some((t) => t.messages.some((m) => m.contenu.includes('céramique japonaise'))), '2 : ce que le modèle des destinations a reçu contient la réponse libre, telle qu’écrite');
rapport.lecture_observee = lecture.map((t) => ({ statut: t.statut, modele: t.modele, outil: t.outil }));

// ═══ 3. Persistance et relecture ═══
console.log('\n3. Persistance et relecture');
type Ev = { id: string; source_id: string; target_family: string; subject_label: string | null; entity_label: string | null; preference_value: string | null; raw_information: string | null; polarity: string | null; assertion_status: string | null };
const journalDeB = async () => lu(await admin.from('knowledge_evidences').select('id, source_id, target_family, subject_label, entity_label, preference_value, raw_information, polarity, assertion_status')
  .eq('user_id', B.userId).is('superseded_at', null), 'journal de B') as Ev[];
const vuParB = lu(await B.client.from('knowledge_evidences').select('id').eq('user_id', B.userId).is('superseded_at', null), 'journal relu par B') as { id: string }[];
const journal = await journalDeB();
v.verifier(vuParB.length === journal.length && journal.length > 0, `3 : B relit son journal sous sa session (${vuParB.length} preuves)`);
const libelle = (e: Ev) => String(e.subject_label ?? e.entity_label ?? e.preference_value ?? e.raw_information ?? '');
const astro = journal.filter((e) => plier(libelle(e)).includes('astronomie'));
v.verifier(astro.length === 1 && astro[0].target_family === 'INTEREST' && astro[0].assertion_status === 'explicit', '3 : « Astronomie » : un intérêt EXPLICITE (sa déclaration)', JSON.stringify(astro));
const ceram = journal.filter((e) => plier(libelle(e)).includes('ceramique'));
// Exigé dans les DEUX modes (20 nov.) : sans cette preuve inférée réellement écrite, le test « elle ne
// part pas au modèle » (4b) passerait sans rien démontrer — c'est ce qui s'est produit au premier passage réel.
v.verifier(ceram.length >= 1 && ceram.every((e) => e.assertion_status === 'inferred'), '3 : « la céramique japonaise » : un intérêt LU PAR MODÈLE (inféré), réellement écrit — condition du cas négatif 4b', JSON.stringify(ceram));
if (ceram.length === 0) {
  console.error('ARRÊT — la lecture n’a pas écrit la céramique : le cas négatif 4b ne prouverait rien.');
  rapport.arret = 'lecture sans preuve inférée de la céramique : parcours interrompu avant la recommandation';
  rapport.journal_de_B = journal.map((e) => ({ famille: e.target_family, libelle: libelle(e), statut: e.assertion_status, polarite: e.polarity }));
  rapport.resultats_par_cas = v.resultats;
  try { writeFileSync(`docs/discovery/parcours-complet-${MODE}.json`, JSON.stringify(rapport, null, 1)); } catch (e) { console.error(`ÉCHEC — rapport non écrit : ${e instanceof Error ? e.message : 'erreur'}`); process.exit(3); }
  v.bilan(); process.exit(1);
}
v.verifier(!journal.some((e) => plier(libelle(e)).includes('chimie') && e.polarity !== 'rejet'), '3 : « la chimie » (niée) n’est écrite comme aucun intérêt');
const portrait = await lirePortrait(B.client as never, { userId: B.userId });
v.verifier(portrait.interests.some((i) => plier(i.subjectLabel).includes('astronomie')), '3 : le portrait relit « Astronomie »');
rapport.journal_de_B = journal.map((e) => ({ famille: e.target_family, libelle: libelle(e), statut: e.assertion_status, polarite: e.polarity }));

// ═══ 4. Recommandation, avec observation de ce qui part au modèle ═══
const marqueurs = journal.map((e) => ({ libelle: libelle(e), cle: plier(libelle(e)).trim(), statut: e.assertion_status, famille: e.target_family })).filter((m) => m.cle.length >= 4);
const IDEE_SIMULEE = { __texte: JSON.stringify([
  { title: 'Une carte du ciel encadrée', justification: 'Pour sa passion de l’astronomie.', dim: 'CAD_C', canal: 'cadeau', intensite: 'legere', declencheur: 'x', appuiPrive: true },
  { title: 'Un carnet relié', justification: 'Une attention simple.', dim: 'CAD_C', canal: 'cadeau', intensite: 'legere', declencheur: 'x' }]) };
// Les routes de B lancent des travaux APRÈS leur réponse (son analyse de profil, le rejeu des lectures) :
// on attend que plus rien ne parte au modèle avant d'ouvrir la fenêtre d'observation d'une génération.
const attendreCalme = async () => {
  let dernier = -1, stable = 0;
  for (let i = 0; i < 180 && stable < 5; i++) {
    const n = (await etatRelais()).appels;
    stable = n === dernier ? stable + 1 : 0; dernier = n;
    await new Promise((ok) => setTimeout(ok, 1000));
  }
  if (stable < 5) throw new Error('le relais ne se calme pas : la fenêtre d’observation ne peut pas être isolée');
};
const CONSIGNE_RECO = /^Tu es Candice, un copilote relationnel premium\. Tu génères des recommandations/;
async function generer(etape: string) {
  await attendreCalme();
  await razRelais();
  await dicter([IDEE_SIMULEE]);
  const res = await poster('/api/recommendations/generate', cP, { contactId: k.id });
  const traces = (await etatRelais()).recus;
  const envoye = traces.map((t) => `${t.systeme}\n${t.messages.map((m) => m.contenu).join('\n')}`).join('\n');
  const plie = plier(envoye);
  const retrouves = marqueurs.filter((m) => plie.includes(m.cle));
  const ligneGouts = envoye.split('\n').find((l) => /A DÉCLARÉ AIMER OU SOUHAITER/.test(l)) ?? null;
  const obs = { etape, http: res.status, appels: traces.map((t) => { const p = plier(`${t.systeme}\n${t.messages.map((m) => m.contenu).join('\n')}`);
      return { statut: t.statut, outil: t.outil, modele: t.modele, debut_consigne: t.systeme.slice(0, 120), donnees_de_B: marqueurs.filter((m) => p.includes(m.cle)).map((m) => m.libelle) }; }),
    donnees_de_B_dans_l_envoi: retrouves.map((m) => ({ libelle: m.libelle, famille: m.famille, statut: m.statut })), ligne_des_gouts: ligneGouts };
  for (const x of obs.appels) console.log('       appel :', JSON.stringify(x));
  console.log(`     ${etape} : HTTP ${res.status} · ${traces.length} appel(s) au modèle · données de B retrouvées dans l’envoi : ${JSON.stringify(obs.donnees_de_B_dans_l_envoi)}`);
  if (res.status !== 200) throw new Error(`génération ${etape} : HTTP ${res.status} ${res.texte.slice(0, 200)}`);
  if (traces.length === 0) throw new Error(`génération ${etape} : aucun appel au modèle observé — rien ne peut être conclu`);
  const etrangers = traces.filter((t) => !CONSIGNE_RECO.test(t.systeme));
  if (etrangers.length > 0) throw new Error(`génération ${etape} : fenêtre non isolée, appels étrangers à la recommandation ${JSON.stringify(obs.appels.filter((x) => !CONSIGNE_RECO.test(x.debut_consigne)))}`);
  if (traces.some((t) => t.statut !== 200)) throw new Error(`génération ${etape} : un appel au modèle a échoué ${JSON.stringify(obs.appels)}`);
  return { res, obs, retrouves, ligneGouts };
}
const reco = async () => lu(await P.client.from('contact_recommendations').select('ideas, portees_proche, proche_compte, a_recalculer').eq('contact_id', k.id).maybeSingle(), 'recommandation du pilote') as
  { ideas: { title: string; justification: string }[]; portees_proche: string[]; proche_compte: string | null; a_recalculer: boolean } | null;
const gouts = async () => { const g = await lireGoutsDuProche(admin as never, { piloteId: P.userId, contactId: k.id }); if (g.motif === 'lecture_impossible') throw new Error('lecture des goûts impossible — rien ne peut être conclu'); return g; };

console.log('\n4a. Sans autorisation');
let g = await gouts();
v.verifier(!g.autorise && g.motif === 'aucun_consentement', '4a : la lecture des goûts (même fonction que la route) refuse : aucun consentement — pas une erreur', g.motif);
const a = await generer('sans autorisation');
v.verifier(a.retrouves.length === 0 && a.ligneGouts === null, '4a : AUCUNE donnée de B dans ce qui est parti au modèle (consigne et messages relus au relais)', JSON.stringify(a.obs.donnees_de_B_dans_l_envoi));
let r0 = await reco();
v.verifier(!!r0 && r0.portees_proche.length === 0 && r0.proche_compte === null, '4a : la recommandation enregistrée ne déclare aucune donnée de B', JSON.stringify(r0 && { portees: r0.portees_proche }));

console.log('\n4b. B accorde reco:gouts depuis sa session');
const acc = await poster('/api/consent/exclusions', cB, { contactId: k.id, action: 'autoriser', portee: 'reco:gouts' });
v.verifier(acc.status === 200 && (acc.json as { actif?: boolean }).actif === true, '4b : accord donné (HTTP 200, actif)', `HTTP ${acc.status}`);
g = await gouts();
v.verifier(g.autorise && g.gouts.some((x) => plier(x.libelle).includes('astronomie')), '4b : « Astronomie » est éligible (déclarée par B, explicite)', JSON.stringify(g.gouts.map((x) => x.libelle)));
v.verifier(!g.gouts.some((x) => plier(x.libelle).includes('ceramique') || plier(x.libelle).includes('cartes'))
  && (g.ecartes['pas_sa_declaration'] ?? 0) >= 1, '4b : la réponse libre lue par modèle EXISTE et n’est PAS éligible (écartée : pas sa déclaration)', JSON.stringify(g.ecartes));
const b = await generer('après accord');
v.verifier(!!b.ligneGouts && plier(b.ligneGouts).includes('astronomie'), '4b : « Astronomie » PART au modèle, dans la ligne des goûts déclarés', b.ligneGouts ?? '(absente)');
v.verifier(b.retrouves.every((m) => m.statut === 'explicit'), '4b : rien de ce qui part n’est une lecture par modèle (provenance : déclarations explicites seulement)', JSON.stringify(b.obs.donnees_de_B_dans_l_envoi));
const ideesB = ((b.res.json as { recommendations?: { ideas?: { title: string; justification: string; appuiPrive?: boolean }[] } })?.recommendations?.ideas
  ?? (b.res.json as { ideas?: { title: string; justification: string; appuiPrive?: boolean }[] })?.ideas ?? []);
const inspirees = ideesB.filter((i) => i.appuiPrive === true);
if (MODE === 'simule') v.verifier(inspirees.length === 1 && inspirees[0].justification === JUSTIFICATION_NEUTRE, '4b : l’idée qui s’en inspire est rendue, avec la justification neutre (rien n’est cité)', JSON.stringify(ideesB));
else console.log('     idées inspirées par une déclaration (vrai modèle) :', inspirees.length, JSON.stringify(inspirees.map((i) => i.title)));
v.verifier(!ideesB.some((i) => plier(i.justification).includes('astronomie')), '4b : aucune justification affichée ne cite la déclaration');
let r1 = await reco();
v.verifier(!!r1 && r1.portees_proche.includes('reco:gouts') && r1.proche_compte === B.userId, '4b : la recommandation enregistrée porte sa provenance (reco:gouts, compte de B)', JSON.stringify(r1 && { portees: r1.portees_proche }));
const titresB = (r1?.ideas ?? []).map((i) => i.title);
const journalP = lu(await P.client.from('attention_log').select('id, attention_title, portees_proche').eq('contact_id', k.id).eq('status', 'proposed'), 'idées proposées') as { id: string; attention_title: string; portees_proche: string[] }[];
v.verifier(journalP.some((l) => l.portees_proche.includes('reco:gouts')), '4b : les idées proposées portent la même provenance');

console.log('\n4c. B retire reco:gouts');
const ret = await poster('/api/consent/exclusions', cB, { contactId: k.id, action: 'retirer', portee: 'reco:gouts' });
v.verifier(ret.status === 200 && (ret.json as { actif?: boolean }).actif === false, '4c : retrait (HTTP 200, inactif)', `HTTP ${ret.status}`);
r1 = await reco();
v.verifier(!!r1 && r1.ideas.length === 0 && r1.a_recalculer === true && r1.portees_proche.length === 0, '4c : la recommandation tirée de ses goûts n’est plus restituée (vidée, à recalculer)', JSON.stringify(r1));
const journalApres = lu(await P.client.from('attention_log').select('id, portees_proche').eq('contact_id', k.id).eq('status', 'proposed'), 'idées proposées après retrait') as { id: string; portees_proche: string[] }[];
v.verifier(!journalApres.some((l) => l.portees_proche.includes('reco:gouts')), '4c : les idées seulement proposées qui en venaient sont retirées');
const page = await poster(`/contacts/${k.id}`, cP, null, 'GET');
v.verifier(page.status === 200, '4c : la fiche du pilote s’affiche (HTTP 200)', `HTTP ${page.status}`);
v.verifier(titresB.length > 0 && !titresB.some((t) => page.texte.includes(t)), '4c : aucune des idées tirées de ses goûts n’apparaît sur la fiche', JSON.stringify(titresB));
g = await gouts();
v.verifier(!g.autorise, '4c : la lecture des goûts refuse de nouveau', g.motif);
const c = await generer('après retrait');
v.verifier(c.retrouves.length === 0 && c.ligneGouts === null, '4c : plus AUCUNE donnée de B dans ce qui part au modèle', JSON.stringify(c.obs.donnees_de_B_dans_l_envoi));
const r2 = await reco();
v.verifier(!!r2 && r2.portees_proche.length === 0 && r2.proche_compte === null, '4c : la nouvelle recommandation ne déclare aucune donnée de B');

rapport.generations = [a.obs, b.obs, c.obs];
rapport.resultats_par_cas = v.resultats;
const fichier = `docs/discovery/parcours-complet-${MODE}.json`;
rapport.modeles_observes_au_relais = [...new Set([a, b, c].flatMap((x) => x.obs.appels.map((y) => y.modele)).concat((rapport.lecture_observee as { modele: string | null }[]).map((y) => y.modele)))];
try { writeFileSync(fichier, JSON.stringify(rapport, null, 1)); }
catch (e) { console.error(`ÉCHEC — rapport non écrit : ${e instanceof Error ? e.message : 'erreur'}`); process.exit(3); }
console.log(`\nRapport : ${fichier} — ${rapport.nature}. Aucune clé, aucun en-tête n’y figure.`);
v.bilan();
