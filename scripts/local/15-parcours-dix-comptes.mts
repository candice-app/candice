// LES DIX COMPTES FICTIFS — les VRAIS parcours, de bout en bout, sur la pile locale.
//
// Pour chacun des dix comptes (les dix « voix » de 09-faux-comptes) :
//   1. l'onboarding : réponses fermées par le producteur réel, sous l'identité du compte ;
//   2. les réponses LIBRES : verbatim d'abord, puis la lecture par le modèle via la VRAIE
//      ROUTE HTTP de l'application — avec une PANNE du modèle pour un compte sur deux, puis
//      la relance, puis une relance de trop ;
//   3. le Discovery depuis /moi/discovery : la page est demandée en HTTP, les réponses
//      partent par la VRAIE route /api/discovery/answer, et après chacune on RELIT en base
//      ce qui a été écrit ;
//   4. la reprise : nouvelle session HTTP, et les questions déjà vues ne reviennent pas.
// Le modèle est le faux serveur : cet essai éprouve la plomberie (ordre des écritures,
// sauvegarde, rejeu, doublons), pas la qualité de lecture d'une phrase.
import { compteLocal, verificateur } from './_compte-local.mts';
import { cookiesDe, poster, APP, obtenirLot } from './_session-http.mts';
import { VOIX, repartir } from './09-faux-comptes.mts';
import { produceSocleAnswer, produceSocleFact } from '../../src/lib/questionnaire/produce-socle.ts';
import { produireInteretsOnboarding } from '../../src/lib/questionnaire/produce-interests.ts';
import { prochainesQuestionsPour } from '../../src/lib/discovery/open-v3/service.ts';
import { lireEtat } from '../../src/lib/discovery/open-v3/etat.ts';
import { question } from '../../src/lib/discovery/open-v3/banque.ts';

const MODELE = process.env.ANTHROPIC_BASE_URL!;
const dicter = (reponses: unknown[]) => fetch(`${MODELE}/__script`, { method: 'POST', body: JSON.stringify({ reponses }) });
const panne = (active: boolean) => fetch(`${MODELE}/__panne`, { method: 'POST', body: JSON.stringify({ active }) });
const appelsModele = async () => ((await (await fetch(`${MODELE}/__etat`)).json()) as { appels: number }).appels;
await fetch(`${MODELE}/__raz`, { method: 'POST', body: '{}' });

const v = verificateur();
const lots = repartir();
const NB_DISCOVERY = 6;
// Les treize catégories de l'écran « centres d'intérêt » de l'onboarding (identifiant, libellé).
const CATEGORIES = [['lecture', 'Lecture'], ['cuisine', 'Cuisine & gastronomie'], ['sport', 'Sport'], ['musique', 'Musique'], ['cinema', 'Ciné & séries'], ['art', 'Art & culture'], ['voyage', 'Voyage'], ['mode', 'Mode & beauté'], ['tech', 'Tech & jeux'], ['nature', 'Nature & jardinage'], ['bienetre', 'Bien-être'], ['deco', 'Déco & maison'], ['vin', 'Vin & spiritueux']] as const;
const bilan: Record<string, unknown>[] = [];

for (let i = 0; i < VOIX.length; i++) {
  const voix = VOIX[i];
  const avecPanne = i % 2 === 0;
  console.log(`\n══ ${voix.prenom}${avecPanne ? '  (panne du modèle pendant ses réponses libres)' : ''}`);
  const c = await compteLocal(`parcours-${voix.prenom.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}`);
  const cookie = await cookiesDe(c.email, c.motDePasse);
  const ts = new Date().toISOString();

  // ── 1. ONBOARDING FERMÉ
  let fermees = 0;
  for (const ref of lots[i]) fermees += await produceSocleAnswer(c.client as never, { userId: c.userId, selectedOptionRefs: [ref], timestamp: ts });

  // ── 1 bis. LES CENTRES D'INTÉRÊT cochés à l'onboarding : trois catégories, différentes d'un
  //    compte à l'autre ; le dernier compte n'en coche AUCUNE (quelqu'un qui passe l'écran).
  const cochees = i === VOIX.length - 1 ? [] : [0, 1, 2].map((k) => CATEGORIES[(i * 3 + k) % CATEGORIES.length]).map(([id, label]) => ({ id, label }));
  const nInterets = await produireInteretsOnboarding(c.client as never, { userId: c.userId, categories: cochees, timestamp: ts });
  const nRejeu = await produireInteretsOnboarding(c.client as never, { userId: c.userId, categories: cochees, timestamp: new Date().toISOString() });
  const relusI = ((await c.client.from('knowledge_evidences').select('subject_id').eq('user_id', c.userId).eq('target_family', 'INTEREST')).data ?? []).map((x) => x.subject_id);
  v.verifier(relusI.length === cochees.length && nInterets === nRejeu, `${voix.prenom} · ${cochees.length} centre(s) d’intérêt coché(s), relus au journal, sans doublon au second passage`, relusI.join(','));
  console.log(`   centres d’intérêt cochés : ${cochees.map((x) => x.id).join(', ') || '(aucun)'}`);

  // ── 2. RÉPONSES LIBRES : verbatim, puis lecture par la route HTTP.
  const sources = async (type: string) => (await c.client.from('knowledge_sources').select('id, question_code, raw_text').eq('user_id', c.userId).eq('source_type', type)).data ?? [];
  let lus = 0, enAttente = 0;
  for (const l of voix.libres) {
    await produceSocleFact(c.client as never, { userId: c.userId, entries: [{ spec: { factType: l.code, questionText: l.question }, value: l.texte }], timestamp: ts } as never);
    const corps = { entries: [{ rawText: l.texte, fieldContext: l.question, questionCode: l.code }], timestamp: ts };
    if (avecPanne) {
      await panne(true);
      const r = await poster('/api/knowledge/extract-free-text', cookie, corps);
      const echec = (r.json as { failed?: number })?.failed ?? 0;
      const verbatims = (await sources('onboarding_open')).filter((s) => s.raw_text === l.texte).length;
      const lectures = (await sources('extraction_inferred')).filter((s) => s.raw_text === l.texte).length;
      v.verifier(echec === 1 && verbatims === 1 && lectures === 0, `${voix.prenom} · panne : la route signale l’échec, le verbatim est en base, aucune lecture écrite (${l.code})`, JSON.stringify({ http: r.status, r: r.json, verbatims, lectures }));
      enAttente++;
      await panne(false);
    }
    // La lecture (ou sa RELANCE après la panne).
    await dicter([{ units: [{ family: 'OTHER', label: l.texte.split(/[.!?]/)[0].trim(), relation_label: 'évoqué' }] }]);
    const r1 = await poster('/api/knowledge/extract-free-text', cookie, corps);
    const apres1 = (await sources('extraction_inferred')).filter((s) => s.raw_text === l.texte).length;
    v.verifier(r1.status === 200 && (r1.json as { failed?: number }).failed === 0 && apres1 === 1, `${voix.prenom} · lecture${avecPanne ? ' rejouée après la panne' : ''} : une source de lecture (${l.code})`, JSON.stringify({ r: r1.json, apres1 }));
    // Une relance DE TROP : pas de second appel au modèle, pas de doublon.
    const avant = await appelsModele();
    await dicter([]);
    const r2 = await poster('/api/knowledge/extract-free-text', cookie, corps);
    const apres2 = (await sources('extraction_inferred')).filter((s) => s.raw_text === l.texte).length;
    const ok = (await c.client.from('knowledge_open_knowledge').select('id').eq('user_id', c.userId)).data ?? [];
    v.verifier((r2.json as { failed?: number }).failed === 0 && apres2 === 1 && (await appelsModele()) === avant, `${voix.prenom} · relance de trop : aucun appel au modèle, aucun doublon (${l.code})`, JSON.stringify({ r: r2.json, apres2 }));
    lus++; void ok;
  }
  const nOuvert = ((await c.client.from('knowledge_open_knowledge').select('id').eq('user_id', c.userId)).data ?? []).length;
  v.verifier(nOuvert === voix.libres.length, `${voix.prenom} · autant de connaissances lues que de réponses libres (${voix.libres.length})`, String(nOuvert));

  // ── 3. DISCOVERY depuis /moi/discovery
  const { etat } = await lireEtat(c.client as never, { userId: c.userId });
  const tout = await prochainesQuestionsPour(c.client as never, { userId: c.userId, combien: 5000 });
  const ouvertesAuDepart = tout.questions.length;
  const page = await poster('/moi/discovery?mode=full', cookie, null, 'GET');
  const premieres = (await prochainesQuestionsPour(c.client as never, { userId: c.userId, combien: 6 })).questions;
  const texte0 = premieres[0]?.question_text ?? '';
  const pageMontre = !!texte0 && page.texte.includes(texte0.slice(0, 30).replace(/’/g, '&#x27;')) || page.texte.includes(texte0.slice(0, 30));
  if (page.status >= 300 && page.status < 400) console.log('   redirection de la page :', page.status);
  console.log(`   onboarding : ${fermees} preuves fermées · branches ouvertes : ${etat.branchesOuvertes.size} · questions Discovery ouvertes : ${ouvertesAuDepart} · page /moi/discovery : HTTP ${page.status}`);
  if (ouvertesAuDepart > 0) v.verifier(page.status === 200 && pageMontre, `${voix.prenom} · /moi/discovery affiche la première question que le moteur a choisie`, `HTTP ${page.status} · « ${texte0.slice(0, 40)} »`);

  const repondues: string[] = []; let preuvesDiscovery = 0;
  for (let n = 0; n < NB_DISCOVERY; n++) {
    // Le SERVEUR propose (lot signé) ; on répond à ce qu'il a proposé, avec son jeton.
    const propose = await obtenirLot(cookie, 'quick');
    if (!propose) break;
    const suiv = propose.question;
    if (repondues.includes(suiv.question_key)) { v.verifier(false, `${voix.prenom} · une question déjà répondue est resservie`, suiv.question_key); break; }
    const q = question(suiv.question_key)!;
    let answer: string | string[];
    if (suiv.question_type === 'text') { answer = 'Une réponse libre de test, sans rien de particulier.'; await dicter([{ units: [] }]); }
    else answer = suiv.question_type === 'chips_single' ? [suiv.options![0].value] : suiv.options!.slice(0, 2).map((o) => o.value);
    const r = await poster('/api/discovery/answer', cookie, { jeton: propose.jeton, questionKey: suiv.question_key, answer });
    // RELECTURE : ce que CETTE réponse a écrit, retrouvé par le code de la question.
    const src = (await c.client.from('knowledge_sources').select('id, source_type').eq('user_id', c.userId).in('question_code', [suiv.question_key, `discovery.${suiv.question_key}`])).data ?? [];
    const ev = src.length ? ((await c.client.from('knowledge_evidences').select('target_family, target_construct, preference_value, polarity').in('source_id', src.map((s) => s.id))).data ?? []) : [];
    const pc = (await c.client.from('profile_completion').select('is_filled').eq('user_id', c.userId).eq('question_key', suiv.question_key)).data ?? [];
    const attendues = suiv.question_type === 'text' ? 0 : (Array.isArray(answer) ? answer : [answer]).length;
    console.log(`   ${suiv.question_key} (${q.forme}) → HTTP ${r.status} · écrit et relu : ${ev.map((e) => `${e.target_family}:${e.target_construct}${e.preference_value ? '=' + e.preference_value : ''}`).join(' | ') || (suiv.question_type === 'text' ? 'verbatim' : '— (options sans émission)')}`);
    v.verifier(r.status === 200 && src.length >= 1 || (r.status === 200 && attendues > 0 && ev.length === 0 && src.length === 0), `${voix.prenom} · ${suiv.question_key} : la réponse est acceptée et sa source relue`, `HTTP ${r.status} ${JSON.stringify(r.json).slice(0, 100)}`);
    v.verifier(pc.length === 1 && pc[0].is_filled === true, `${voix.prenom} · ${suiv.question_key} : la progression est marquée APRÈS l’écriture`);
    preuvesDiscovery += ev.length; repondues.push(suiv.question_key);
  }

  // ── 4. REPRISE : nouvelle session HTTP ; rien de déjà vu ne revient.
  const cookie2 = await cookiesDe(c.email, c.motDePasse);
  const page2 = await poster('/moi/discovery?mode=full', cookie2, null, 'GET');
  const reste = (await prochainesQuestionsPour(c.client as never, { userId: c.userId, combien: 5000 })).questions.map((x) => x.question_key);
  v.verifier(page2.status === 200 && !reste.some((k) => repondues.includes(k)), `${voix.prenom} · reprise : aucune des ${repondues.length} questions répondues ne revient`);
  // Aucune preuve de moteur, de besoin ou de trait écrite PAR le Discovery.
  const srcD = (await c.client.from('knowledge_sources').select('id').eq('user_id', c.userId).in('source_type', ['discovery_closed', 'discovery_open'])).data ?? [];
  const evD = srcD.length ? ((await c.client.from('knowledge_evidences').select('target_family').in('source_id', srcD.map((s) => s.id))).data ?? []) : [];
  v.verifier(!evD.some((e) => ['DRIVER', 'NEED', 'PROFILE'].includes(e.target_family)), `${voix.prenom} · le Discovery n’a écrit ni moteur, ni besoin, ni trait`);
  bilan.push({ compte: voix.prenom, onboarding: fermees, libres: `${lus}/${voix.libres.length}`, pannes: enAttente, branches: etat.branchesOuvertes.size, ouvertes: ouvertesAuDepart, repondues: repondues.length, preuves: preuvesDiscovery, restantes: reste.length });
}
console.log(`\nApplication : ${APP}`); console.table(bilan);
v.bilan();
