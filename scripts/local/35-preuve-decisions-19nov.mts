// PREUVE LOCALE — décisions du 19 nov. (17h43) : D2, D8, D10, D11, D13 et l'écran `reco:gouts`.
//
// Contre la pile locale (base, PostgREST, GoTrue, application sur :3100, faux modèle sur :8787),
// avec des comptes de test SÉPARÉS. Le faux modèle éprouve la PLOMBERIE (ce qui est écrit, ce qui est
// refusé, ce qui survit à une panne), jamais la qualité d'une lecture : cela ne se juge qu'avec la
// vraie clé (script 34).
//
//   A. L'écran du proche : accorder et retirer `reco:gouts`, sans client privilégié (migration 121).
//   B. D2 « Ton quotidien » : déclarer, remplacer, « aucune », refus des combinaisons fausses.
//   C. D13 « Raconter » : le texte est gardé AVANT la lecture ; une panne le dit ; la relance lit.
//   D. D8 / D11 : les motivations écrites comme connaissance ouverte ou fait, rattachées au projet
//      quand la question dit « ce projet » ; une préférence de service porte ses rôles.
//   E. D10 : une question propre au séjour, répondue pour un séjour, revient pour le suivant.
//
// Usage : . /home/claude/pile/env-local.sh; export ANTHROPIC_BASE_URL=http://127.0.0.1:8787 ANTHROPIC_API_KEY=cle-locale-factice; npx tsx scripts/local/35-preuve-decisions-19nov.mts
import { randomUUID } from 'node:crypto';
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster, APP } from './_session-http.mts';
import { exigerLocal } from './_garde-locale.mts';

const MODELE = process.env.ANTHROPIC_BASE_URL!;
exigerLocal({ nom: 'ANTHROPIC_BASE_URL', url: MODELE, port: 8787 });
const dicter = (reponses: unknown[]) => fetch(`${MODELE}/__script`, { method: 'POST', body: JSON.stringify({ reponses }) });
const panne = (active: boolean) => fetch(`${MODELE}/__panne`, { method: 'POST', body: JSON.stringify({ active }) });
await fetch(`${MODELE}/__raz`, { method: 'POST', body: '{}' });
const { admin } = pileLocale();
const v = verificateur();

const svc = await import('../../src/lib/discovery/open-v3/service.ts');
const { lireEtat } = await import('../../src/lib/discovery/open-v3/etat.ts');
const { motifDExclusion } = await import('../../src/lib/discovery/open-v3/selection.ts');
const { question } = await import('../../src/lib/discovery/open-v3/banque.ts');
const { cleOption } = await import('../../src/lib/discovery/open-v3/cle-option.ts');
const { createSourceRecord } = await import('../../src/lib/knowledge/sources.ts');
const { persistKnowledge } = await import('../../src/lib/knowledge-write/persist.ts');
const { accountAbout, asUserId } = await import('../../src/lib/knowledge/identity.ts');
const cles = (id: string, ...l: string[]) => l.map((x) => cleOption(question(id)!.options.find((o) => o.libelle === x)!));

// ═══ A. L'ÉCRAN DU PROCHE — reco:gouts ═══
console.log('\n═══ A. Écran « Les idées qu’on te destine » (reco:gouts) ═══');
const P = await compteLocal('d19-pilote'), B = await compteLocal('d19-proche'), X = await compteLocal('d19-tiers');
const { data: k } = await P.client.from('contacts').insert({ user_id: P.userId, name: 'Bruno D19', relationship: 'friend', proche_user_id: B.userId }).select('id').single();
const cB = await cookiesDe(B.email, B.motDePasse), cX = await cookiesDe(X.email, X.motDePasse);
let page = await poster('/moi/idees', cB, null, 'GET');
v.verifier(page.status === 200 && page.texte.includes('Les idées qu’on te destine'), 'A1 : l’écran s’affiche pour le proche', `statut ${page.status}`);
v.verifier(page.texte.includes('Mes goûts et mes envies peuvent inspirer les idées de'), 'A2 : une ligne par pilote, avec l’interrupteur');
let r = await poster('/api/consent/exclusions', cB, { contactId: k!.id, action: 'autoriser', portee: 'reco:gouts' });
v.verifier(r.status === 200 && (r.json as { actif?: boolean }).actif === true, 'A3 : accorder reco:gouts → actif', JSON.stringify(r.json));
let ligne = (await admin.from('contact_consents').select('status, scope, granted_by, granted_via').eq('contact_id', k!.id).eq('kind', 'profile_usage').eq('status', 'active').maybeSingle()).data;
v.verifier(!!ligne && ligne.granted_by === B.userId && ligne.granted_via === 'titulaire' && (ligne.scope as string[]).includes('reco:gouts'), 'A4 : la base atteste que c’est LE PROCHE qui accorde (granted_via = titulaire)', JSON.stringify(ligne));
const { data: vuParP } = await P.client.from('contact_consents').select('id').eq('contact_id', k!.id).eq('kind', 'profile_usage');
v.verifier((vuParP ?? []).length === 0, 'A5 : le pilote ne voit pas ce réglage');
r = await poster('/api/consent/exclusions', cX, { contactId: k!.id, action: 'autoriser', portee: 'reco:gouts' });
v.verifier(r.status === 404, 'A6 : un tiers ne règle rien sur une fiche qui n’est pas la sienne', `statut ${r.status}`);
r = await poster('/api/consent/exclusions', cB, { contactId: k!.id, action: 'autoriser', portee: 'reco:tout' });
v.verifier(r.status === 400, 'A7 : une portée inconnue est refusée');
page = await poster('/moi/idees', cB, null, 'GET');
v.verifier(/aria-checked="true"/.test(page.texte), 'A8 : l’écran relu montre l’accord donné (lu en base)');
r = await poster('/api/consent/exclusions', cB, { contactId: k!.id, action: 'retirer', portee: 'reco:gouts' });
v.verifier(r.status === 200 && (r.json as { actif?: boolean }).actif === false, 'A9 : retirer → inactif');
ligne = (await admin.from('contact_consents').select('status').eq('contact_id', k!.id).eq('kind', 'profile_usage').eq('status', 'active').maybeSingle()).data;
v.verifier(!ligne, 'A10 : plus aucune autorisation active (la ligne est révoquée, pas effacée)');
r = await poster('/api/consent/exclusions', cB, { contactId: k!.id, action: 'autoriser', portee: 'reco:gouts' });
v.verifier(r.status === 200 && (r.json as { actif?: boolean }).actif === true, 'A11 : accorder de nouveau → une nouvelle autorisation (l’ancienne ne se réactive pas)');
const { count: lignesUsage } = await admin.from('contact_consents').select('id', { count: 'exact', head: true }).eq('contact_id', k!.id).eq('kind', 'profile_usage');
v.verifier(lignesUsage === 2, 'A12 : historique conservé : une révoquée, une active', `lignes ${lignesUsage}`);
const { readFileSync } = await import('node:fs');
v.verifier(!/createAdminClient/.test(readFileSync('src/app/api/consent/exclusions/route.ts', 'utf8')) && !/createAdminClient/.test(readFileSync('src/app/moi/idees/page.tsx', 'utf8')),
  'A13 : ni la route ni l’écran ne portent le client privilégié');

// ═══ B. D2 — Ton quotidien ═══
console.log('\n═══ B. D2 « Ton quotidien » ═══');
const S = await compteLocal('d19-quotidien'); const cS = await cookiesDe(S.email, S.motDePasse);
let e = (await lireEtat(S.client as never, { userId: S.userId })).etat;
v.verifier(!!e.situations && e.situations.size === 0, 'B1 : rien déclaré → aucune situation (rien n’est déduit)');
r = await poster('/api/discovery/situation', cS, { coches: ['couple', 'travail_a_domicile'], aucune: false });
v.verifier(r.status === 200, 'B2 : déclarer « couple » et « travail depuis chez moi »', JSON.stringify(r.json));
e = (await lireEtat(S.client as never, { userId: S.userId })).etat;
v.verifier(e.situations?.get('couple') === true && e.situations?.get('travail_a_domicile') === true && !e.situations?.has('enfants_au_quotidien'), 'B3 : relu tel quel ; « enfants » non coché reste INCONNU (pas « non »)');
r = await poster('/api/discovery/situation', cS, { coches: ['couple'], aucune: true });
v.verifier(r.status === 400, 'B4 : « aucune » avec une situation cochée : refusé');
r = await poster('/api/discovery/situation', cS, { coches: ['parentalite_supposee'], aucune: false });
v.verifier(r.status === 400, 'B5 : une situation inconnue : refusée');
r = await poster('/api/discovery/situation', cS, { coches: [], aucune: true });
e = (await lireEtat(S.client as never, { userId: S.userId })).etat;
v.verifier(r.status === 200 && [...(e.situations?.values() ?? [])].every((x) => x === false) && e.situations?.size === 4, 'B6 : « aucune » remplace la déclaration précédente (supersession)');
const { count: hist } = await admin.from('knowledge_facts').select('id', { count: 'exact', head: true }).eq('user_id', S.userId).eq('fact_type', 'discovery.situation_de_vie');
v.verifier((hist ?? 0) === 6, 'B7 : l’historique reste (2 anciennes lignes supersédées + 4 vivantes)', `lignes ${hist}`);
page = await poster('/moi/discovery', cS, null, 'GET');
v.verifier(page.status === 200 && page.texte.includes('Ton quotidien'), 'B8 : la carte « Ton quotidien » est affichée');

// ═══ C. D13 — Raconter quelque chose ═══
console.log('\n═══ C. D13 « Raconter quelque chose » ═══');
const N = await compteLocal('d19-sans-interet'); const cN = await cookiesDe(N.email, N.motDePasse);
page = await poster('/moi/discovery', cN, null, 'GET');
v.verifier(page.status === 200 && page.texte.includes('Par où veux-tu commencer') && !page.texte.includes('Candice a bien noté ça'), 'C1 : sans question en attente : l’entrée large, jamais un « merci » pour rien');
v.verifier(page.texte.includes('Choisir un sujet') && page.texte.includes('Raconter quelque chose') && page.texte.includes('Passer'), 'C2 : trois gestes proposés');
await panne(true);
r = await poster('/api/discovery/recit', cN, { texte: 'Le week-end je fais de la poterie avec ma sœur, et j’adore les marchés.' });
const recitId = (r.json as { recitId?: string }).recitId;
v.verifier(r.status === 200 && (r.json as { lecture?: string }).lecture === 'echec' && !!recitId, 'C3 : panne du modèle → le texte est enregistré, la lecture dite en échec', JSON.stringify(r.json));
const { data: verb } = await admin.from('knowledge_sources').select('answer_text, source_type').eq('id', recitId!).maybeSingle();
v.verifier(!!verb && verb.source_type === 'user_declaration' && verb.answer_text.includes('poterie'), 'C4 : le verbatim existe AVANT toute lecture');
await panne(false);
await dicter([{ units: [{ family: 'INTEREST', label: 'la poterie', parentDomain: 'arts' }] }]);
r = await poster('/api/discovery/recit', cN, { recitId });
v.verifier(r.status === 200 && (r.json as { lecture?: string }).lecture === 'lue', 'C5 : relancer la lecture → lue', JSON.stringify(r.json));
await dicter([{ units: [{ family: 'INTEREST', label: 'la poterie', parentDomain: 'arts' }] }]);
r = await poster('/api/discovery/recit', cN, { recitId });
v.verifier((r.json as { lecture?: string }).lecture === 'deja_lue', 'C6 : relancer encore → déjà lue, rien n’est doublé');
r = await poster('/api/discovery/recit', cS, { recitId });
v.verifier(r.status === 404, 'C7 : le récit d’une autre personne est introuvable');

// ═══ D. D8 / D11 ═══
console.log('\n═══ D. D8 (motivations) et D11 (rôles des préférences de service) ═══');
const M = await compteLocal('d19-motivations');
const owner = asUserId(M.userId), about = accountAbout(owner);
const reve = randomUUID();
await persistKnowledge(M.client as never, { source: createSourceRecord({ about, ownerId: owner, id: reve, sourceType: 'discovery_open', questionCode: 'dreams.1997',
  questionText: question('dreams.1997')!.enonce, rawText: 'Ouvrir un petit atelier de céramique', timestamp: new Date().toISOString() }) });
let res = await svc.enregistrerReponseFermee(M.client as never, { userId: M.userId, questionId: 'dreams.2004', clesOptions: cles('dreams.2004', 'Apprendre', 'Créer'), acteId: 'acte-d8-1' });
const { data: ok1 } = await admin.from('knowledge_open_knowledge').select('subject_label, relation, context, assertion_status').eq('source', res.sourceId);
v.verifier((ok1 ?? []).length === 2 && ok1!.every((x) => x.relation === 'raison pour laquelle ce projet compte' && x.context === `projet:dreams.1997:${reve}`), 'D1 : dreams.2004 → deux connaissances ouvertes, rattachées au projet nommé à dreams.1997', JSON.stringify(ok1));
const { count: ev1 } = await admin.from('knowledge_evidences').select('id', { count: 'exact', head: true }).eq('source_id', res.sourceId);
v.verifier(ev1 === 0, 'D2 : aucune preuve (ni DRIVER, ni NEED, ni goût) n’est écrite');
res = await svc.enregistrerReponseFermee(M.client as never, { userId: M.userId, questionId: 'philovie.1636', clesOptions: cles('philovie.1636', 'Apprendre'), acteId: 'acte-d8-2' });
const { data: ok2 } = await admin.from('knowledge_open_knowledge').select('subject_label, relation, context').eq('source', res.sourceId);
v.verifier(ok2?.length === 1 && ok2[0].context === 'GLOBAL' && ok2[0].relation !== 'raison pour laquelle ce projet compte' && ok2[0].subject_label === 'Apprendre', 'D3 : philovie.1636 « Apprendre » : connaissance globale distincte (même mot, autre portée — pas fusionnée)');
res = await svc.enregistrerReponseFermee(M.client as never, { userId: M.userId, questionId: 'learning2.1455', clesOptions: cles('learning2.1455', 'Une rencontre'), acteId: 'acte-d8-3' });
const { data: f3 } = await admin.from('knowledge_facts').select('fact_type').eq('source', res.sourceId);
const { count: ev3 } = await admin.from('knowledge_evidences').select('id', { count: 'exact', head: true }).eq('source_id', res.sourceId);
v.verifier(f3?.length === 1 && f3[0].fact_type === 'discovery.fait.learning.declencheur_d_apprentissage' && ev3 === 0, 'D4 : learning2.1455 « Une rencontre » → un fait déclaré, aucun intérêt pour des personnes');
res = await svc.enregistrerReponseFermee(M.client as never, { userId: M.userId, questionId: 'dreams.1999', clesOptions: cles('dreams.1999', 'M’encourage simplement'), acteId: 'acte-d11-1' });
const { data: p11 } = await admin.from('knowledge_evidences').select('behavior_context, context').eq('source_id', res.sourceId);
v.verifier(p11?.length === 1 && JSON.parse(p11[0].behavior_context).acteur === 'non_etabli' && JSON.parse(p11[0].behavior_context).beneficiaire === 'la_personne' && p11[0].context === `projet:dreams.1997:${reve}`,
  'D5 : dreams.1999 → préférence de service : acteur non établi, bénéficiaire la personne, rattachée au projet', JSON.stringify(p11));
res = await svc.enregistrerReponseFermee(M.client as never, { userId: M.userId, questionId: 'daily2.1120', clesOptions: cles('daily2.1120', 'Quelques jours avant'), acteId: 'acte-d11-2' });
const { data: p12 } = await admin.from('knowledge_evidences').select('behavior_context').eq('source_id', res.sourceId);
v.verifier(p12?.length === 1 && JSON.parse(p12[0].behavior_context).acteur === 'non_etabli', 'D6 : « être prévenu(e) » : qui prévient reste non établi');

// ═══ E. D10 ═══
console.log('\n═══ E. D10 — progression par (question, préparation) ═══');
const T = await compteLocal('d19-sejours');
const lisbonne = (await svc.ouvrirProjet(T.client as never, { userId: T.userId, type: 'sejour', branche: 'travel2', objet: 'Cinq jours à Lisbonne', timestamp: '2026-11-19T09:00:00Z' })).projet;
await svc.enregistrerReponseFermee(T.client as never, { userId: T.userId, questionId: 'travel2.0937', clesOptions: [cleOption(question('travel2.0937')!.options[0])], acteId: 'acte-d10-1', projet: lisbonne });
const q937 = question('travel2.0937')!;
const e1 = (await lireEtat(T.client as never, { userId: T.userId })).etat;
v.verifier(motifDExclusion(q937, e1) === 'deja_posee', 'E1 : répondue pour Lisbonne : pas reposée pour Lisbonne');
await svc.ouvrirProjet(T.client as never, { userId: T.userId, type: 'sejour', branche: 'travel2', objet: 'Une semaine à Kyoto', timestamp: '2026-11-19T10:00:00Z' });
const e2 = (await lireEtat(T.client as never, { userId: T.userId })).etat;
v.verifier(motifDExclusion(q937, e2) !== 'deja_posee', 'E2 : un nouveau séjour (Kyoto) : la question propre au séjour revient', String(motifDExclusion(q937, e2)));
const { count: hist10 } = await admin.from('knowledge_sources').select('id', { count: 'exact', head: true }).eq('user_id', T.userId).eq('branch_id', `projet:${lisbonne.id}`);
v.verifier(hist10 === 1, 'E3 : la réponse donnée pour Lisbonne reste rattachée à Lisbonne (historique intact)');

console.log(`\n(application ${APP}, modèle simulé ${MODELE})`);
v.bilan();
