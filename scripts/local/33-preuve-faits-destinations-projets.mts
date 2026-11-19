// PREUVE — faits d'option, destinations conditionnelles (onglet 17), réponses de projet, et ce
// que les lecteurs en rendent. Vrai service, vraie base locale (PostgreSQL, politiques d'accès),
// un compte de test par situation. Le modèle est le FAUX serveur : on lui dicte un découpage —
// y compris un découpage faux — et on regarde ce que l'application écrit. Cela ne dit RIEN de
// ce qu'un vrai modèle découperait dans une vraie phrase.
import { compteLocal, verificateur } from './_compte-local.mts';
import { BANQUE, question } from '../../src/lib/discovery/open-v3/banque.ts';
import { cleOption } from '../../src/lib/discovery/open-v3/cle-option.ts';
import { produireDepuisOption } from '../../src/lib/discovery/open-v3/produire.ts';
import { requiertProjet } from '../../src/lib/discovery/open-v3/selection.ts';
import { enregistrerReponseFermee, enregistrerReponseOuverte, ouvrirProjet, rejouerLecturesEnAttente } from '../../src/lib/discovery/open-v3/service.ts';
import { DESTINATIONS_PAR_QUESTION } from '../../src/lib/discovery/open-v3/destinations.ts';
import { faitsDiscoveryPourPortrait } from '../../src/lib/discovery/open-v3/faits-portrait.ts';
import { readSocleFacts } from '../../src/lib/questionnaire/breath-tags.ts';

const MODELE = process.env.ANTHROPIC_BASE_URL ?? '';
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(MODELE)) throw new Error('ARRÊT — ANTHROPIC_BASE_URL doit pointer le faux modèle local.');
const dicter = (reponses: unknown[]) => fetch(`${MODELE}/__script`, { method: 'POST', body: JSON.stringify({ reponses }) });
const panne = (active: boolean) => fetch(`${MODELE}/__panne`, { method: 'POST', body: JSON.stringify({ active }) });
const etatModele = async () => (await fetch(`${MODELE}/__etat`)).json() as Promise<{ appels: number; recus: { outil: string; texte: string }[] }>;
await fetch(`${MODELE}/__raz`, { method: 'POST', body: '{}' });
const v = verificateur();
const acte = () => globalThis.crypto.randomUUID();
type C = Awaited<ReturnType<typeof compteLocal>>;
const faits = async (c: C) => (await c.client.from('knowledge_facts').select('fact_type,value,context,assertion_status,superseded_at').eq('user_id', c.userId)).data!;
const preuves = async (c: C) => (await c.client.from('knowledge_evidences').select('target_family,subject_label,stability,assertion_status,raw_information').eq('user_id', c.userId)).data!;

{ console.log('\n1. Une option de FAIT : « Vélo » aux sports pratiqués');
  const c = await compteLocal('faits-1'); const q = question('sportp.0504')!;
  const r = await enregistrerReponseFermee(c.client as never, { userId: c.userId, questionId: q.id, clesOptions: [cleOption(q.options.find((o) => o.libelle === 'Vélo')!)], acteId: acte() });
  const f = (await faits(c)).filter((x) => x.fact_type.startsWith('discovery.fait.'));
  v.verifier(r.faitsEcrits === 1 && f.length === 1 && f[0].fact_type === 'discovery.fait.sport_practice.pratique', '1 : un fait de pratique est en base', JSON.stringify(f));
  v.verifier((await preuves(c)).length === 0, '1 : aucune preuve de goût n’est écrite pour un fait');
  const rendu = faitsDiscoveryPourPortrait(await readSocleFacts(c.client as never, c.userId, { discovery: 'seulement' }));
  console.log('     rendu au portrait :', rendu.lignes[0]);
  v.verifier(rendu.lignes.length === 1 && /Vélo \[dit par la personne\]$/.test(rendu.lignes[0]), '1 : le lecteur du portrait le rend, avec sa question et sa provenance');
}
{ console.log('\n2. Onglet 17 — « Quels sujets t’intéressent ponctuellement ? », et un modèle qui invente un sujet');
  const c = await compteLocal('faits-2'); const texte = 'En ce moment la géologie, depuis mon déménagement.';
  await dicter([{ segments: [{ declencheur: 'SUJET_DECLARE', passage: 'la géologie' }, { declencheur: 'SUJET_DECLARE', passage: 'la volcanologie' }] }]);
  const r = await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'learning2.1459', texte, acteId: acte() });
  const p = await preuves(c);
  v.verifier(p.length === 1 && p[0].target_family === 'INTEREST' && p[0].raw_information === 'la géologie' && p[0].stability === 'contextual' && p[0].assertion_status === 'inferred',
    '2 : un seul intérêt, celui qui est dans la phrase, contextuel, tenu pour une lecture', JSON.stringify(p));
  v.verifier(r.destinations?.ecartes.length === 1, '2 : le sujet inventé est écarté et compté', JSON.stringify(r.destinations));
  const e = await etatModele();
  v.verifier(e.recus.at(-1)?.outil === 'segments', '2 : c’est le découpage par destinations qui a été demandé au modèle, pas la lecture générale', e.recus.at(-1)?.outil);
  const socle = await readSocleFacts(c.client as never, c.userId);
  v.verifier(!JSON.stringify(socle).includes('déménagement'), '2 : la phrase entière ne sort pas vers les lecteurs du socle (respirations, sections)');
}
{ console.log('\n3. Onglet 17 — « …que tu n’aimes vraiment pas ? » : déclenché, non écrit (stabilité que le journal n’admet pas)');
  const c = await compteLocal('faits-3'); const d = DESTINATIONS_PAR_QUESTION.get('CRE-06')![0];
  await dicter([{ segments: [{ declencheur: d.declencheur, passage: 'le macramé' }] }]);
  const r = await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'CRE-06', texte: 'Je déteste le macramé.', acteId: acte() });
  v.verifier((await preuves(c)).length === 0, '3 : aucune preuve écrite');
  v.verifier(r.destinations?.nonExecutees[0]?.motif === 'stabilite_indeterminee_non_stockable' && !r.extractionEnAttente, '3 : le motif est rendu ; la lecture n’est pas « en attente »', JSON.stringify(r.destinations));
  v.verifier((await faits(c)).some((f) => f.fact_type === 'discovery.CRE-06' && f.value === 'Je déteste le macramé.'), '3 : le verbatim est conservé');
}
{ console.log('\n4. Onglet 17 — panne du modèle, puis rejeu');
  const c = await compteLocal('faits-4');
  await panne(true);
  const r = await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'learning2.1459', texte: 'La géologie.', acteId: acte() });
  v.verifier(r.verbatimEcrit && r.extractionEnAttente && (await preuves(c)).length === 0, '4 : verbatim gardé, lecture en attente, rien d’écrit');
  await panne(false); await dicter([{ segments: [{ declencheur: 'SUJET_DECLARE', passage: 'La géologie' }] }]);
  await rejouerLecturesEnAttente(c.client as never, { userId: c.userId });
  v.verifier((await preuves(c)).length === 1, '4 : le rejeu écrit l’intérêt');
  const avant = (await etatModele()).appels;
  await rejouerLecturesEnAttente(c.client as never, { userId: c.userId });
  v.verifier((await preuves(c)).length === 1 && (await etatModele()).appels === avant, '4 : un second rejeu n’appelle pas le modèle et n’écrit rien');
}
{ console.log('\n5. Une réponse de niveau C appartient au projet');
  const c = await compteLocal('faits-5');
  const qC = BANQUE.find((q) => q.branche === 'craft' && requiertProjet(q) && q.forme === 'single' && q.options.some((o) => produireDepuisOption(q, o).type === 'evidence'))!;
  const o = qC.options.find((x) => produireDepuisOption(qC, x).type === 'evidence')!;
  const { projet } = await ouvrirProjet(c.client as never, { userId: c.userId, type: requiertProjet(qC) === 'sejour' ? 'sejour' : 'achat', branche: 'craft', objet: 'Un vase pour le salon' });
  await enregistrerReponseFermee(c.client as never, { userId: c.userId, questionId: qC.id, clesOptions: [cleOption(o)], acteId: acte(), projet });
  const f = (await faits(c)).filter((x) => x.fact_type === 'discovery.reponse_de_projet');
  v.verifier(f.length === 1 && f[0].context === `projet:${projet.id}`, `5 : ${qC.id} → un fait rattaché au projet`, JSON.stringify(f));
  v.verifier((await preuves(c)).length === 0, '5 : aucune préférence générale n’en est tirée');
  const rendu = faitsDiscoveryPourPortrait(await readSocleFacts(c.client as never, c.userId, { discovery: 'seulement' }));
  v.verifier(rendu.lignes.length === 0 && rendu.ecartes.reponsesDeProjet === 1, '5 : le portrait ne la reçoit pas comme connaissance générale');
}
v.bilan();
