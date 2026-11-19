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
import { enregistrerReponseFermee, enregistrerReponseOuverte, ouvrirProjet, rejouerLecturesEnAttente, connaissancesDuProjet } from '../../src/lib/discovery/open-v3/service.ts';
import { clarificationsOuvertes, repondreClarification, declarerAnimal, entitesConnues } from '../../src/lib/discovery/open-v3/destinations-ecriture.ts';
import { lirePortrait } from '../../src/lib/knowledge/portrait.ts';
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
const seg = (declencheur: string, passage: string, attitude: string, plus: Record<string, unknown> = {}) =>
  ({ declencheur, passage, attitude, affirme: true, personne: 'soi', temps: 'actuel', condition: null, limite: null, ...plus });
{ console.log('\n2. Onglet 17 — « Quels sujets t’intéressent ponctuellement ? » : un sujet présent, un sujet inventé, un sujet NIÉ');
  const c = await compteLocal('faits-2'); const texte = 'En ce moment la géologie, depuis mon déménagement. La chimie ne m’intéresse pas.';
  await dicter([{ segments: [seg('SUJET_DECLARE', 'la géologie', 'interet'), seg('SUJET_DECLARE', 'la volcanologie', 'interet'), seg('SUJET_DECLARE', 'La chimie', 'interet')] }]);
  const r = await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'learning2.1459', texte, acteId: acte() });
  const p = await preuves(c);
  v.verifier(p.length === 1 && p[0].target_family === 'INTEREST' && p[0].raw_information === 'la géologie' && p[0].stability === 'contextual' && p[0].assertion_status === 'inferred',
    '2 : un seul intérêt, celui qui est dans la phrase et qu’elle affirme', JSON.stringify(p));
  const motifs = r.destinations?.releve.filter((l) => l.issue === 'ecarte').map((l) => l.motif).sort();
  v.verifier(JSON.stringify(motifs) === JSON.stringify(['copie_inexacte', 'negation_dans_la_proposition']), '2 : le sujet inventé et le sujet nié sont écartés, chacun avec son motif', JSON.stringify(motifs));
  const e = await etatModele();
  v.verifier(e.recus.at(-1)?.outil === 'segments', '2 : c’est le découpage par destinations qui a été demandé au modèle, pas la lecture générale', e.recus.at(-1)?.outil);
  const socle = await readSocleFacts(c.client as never, c.userId);
  v.verifier(!JSON.stringify(socle).includes('déménagement'), '2 : la phrase entière ne sort pas vers les lecteurs du socle (respirations, sections)');
}
{ console.log('\n3. Onglet 17 — « …que tu n’aimes vraiment pas ? » : la stabilité NON ÉTABLIE est acceptée par la base (migration 120)');
  const c = await compteLocal('faits-3');
  await dicter([{ segments: [seg('SEGMENT_TECHNIQUE', 'le macramé', 'rejet')] }]);
  const r = await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'CRE-06', texte: 'Je déteste le macramé.', acteId: acte() });
  const { data: p } = await c.client.from('knowledge_evidences').select('target_family,preference_value,polarity,stability,evidence_role,severity,context').eq('user_id', c.userId);
  v.verifier(p!.length === 1 && p![0].target_family === 'PREFERENCE' && p![0].preference_value === 'le macramé' && p![0].polarity === 'rejet' && p![0].stability === 'undetermined' && p![0].evidence_role === 'secondary' && !p![0].severity,
    '3 : une préférence en rejet, stabilité undetermined, rôle secondaire, aucun veto', JSON.stringify(p));
  v.verifier(!r.extractionEnAttente, '3 : la lecture n’est pas « en attente »');
  v.verifier((await faits(c)).some((f) => f.fact_type === 'discovery.CRE-06' && f.value === 'Je déteste le macramé.'), '3 : le verbatim est conservé');
  const portrait = await lirePortrait(c.client as never, { userId: c.userId });
  const pref = portrait.preferences.find((x) => String(x.path).includes('type_preference'));
  console.log('     consolidation :', JSON.stringify({ path: pref?.path, stability: pref?.stability, score: pref?.score, polarites: pref?.valuesDetail }));
  v.verifier(pref?.stability === 'unknown', '3 : consolidée, une preuve seule de stabilité non établie rend « unknown » — ni contextuelle, ni stable', String(pref?.stability));
}
{ console.log('\n4. Onglet 17 — panne du modèle, puis rejeu');
  const c = await compteLocal('faits-4');
  await panne(true);
  const r = await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'learning2.1459', texte: 'La géologie.', acteId: acte() });
  v.verifier(r.verbatimEcrit && r.extractionEnAttente && (await preuves(c)).length === 0, '4 : verbatim gardé, lecture en attente, rien d’écrit');
  await panne(false); await dicter([{ segments: [seg('SUJET_DECLARE', 'La géologie', 'interet')] }]);
  await rejouerLecturesEnAttente(c.client as never, { userId: c.userId });
  v.verifier((await preuves(c)).length === 1, '4 : le rejeu écrit l’intérêt');
  const avant = (await etatModele()).appels;
  await rejouerLecturesEnAttente(c.client as never, { userId: c.userId });
  v.verifier((await preuves(c)).length === 1 && (await etatModele()).appels === avant, '4 : un second rejeu n’appelle pas le modèle et n’écrit rien');
}
{ console.log('\n4 bis. Onglet 17 — une œuvre, un auteur ; puis la même œuvre citée de nouveau : un seul référent');
  const c = await compteLocal('faits-4b');
  await dicter([{ segments: [seg('OEUVRE_RESOLUE_APPRECIEE', 'Blacksad', 'appreciation', { identite: { nature: 'oeuvre', nom: 'Blacksad' } }), seg('AUTEUR_MENTIONNE', 'Moebius', 'mention')] }]);
  await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'comics.0422', texte: 'J’adore Blacksad, et tout Moebius.', acteId: acte() });
  const { data: p } = await c.client.from('knowledge_evidences').select('target_family,entity_id,entity_label,entity_type,relation,stability').eq('user_id', c.userId);
  v.verifier(p!.length === 1 && p![0].entity_id === 'oeuvre:bande_dessinee:blacksad' && p![0].relation === 'LIKE' && p![0].stability === 'undetermined', '4 bis : l’œuvre a une identité propre et une relation LIKE', JSON.stringify(p));
  const f = await faits(c);
  v.verifier(f.filter((x) => x.fact_type === 'discovery.entite').length === 1, '4 bis : le référent est au registre, avec sa provenance');
  v.verifier(f.some((x) => x.fact_type.startsWith('discovery.fait.') && JSON.parse(x.value).sens === 'mention' && JSON.parse(x.value).valeur === 'Moebius'), '4 bis : l’auteur est un fait de simple mention');
  v.verifier((await entitesConnues(c.client as never, c.userId)).length === 1, '4 bis : un seul référent connu');
}
{ console.log('\n4 ter. Onglet 17 — un épisode sans émission : clarification ; un animal : déclaré, puis choisi');
  const c = await compteLocal('faits-4c');
  await dicter([{ segments: [seg('REFERENT_RESOLU', 'L’épisode 12', 'referent', { temps: 'passe_revolu', identite: { nature: 'episode', nom: '12' } }), seg('RELATION_EXPLICITE_DISTINCTE', 'J’ai adoré', 'appreciation', { relation: 'LOVE' })] }]);
  const r = await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'podcast.0467', texte: 'L’épisode 12. J’ai adoré.', acteId: acte() });
  v.verifier(r.destinations?.clarifications === 1 && (await preuves(c)).length === 0, '4 ter : rien n’est écrit, une clarification est ouverte');
  const [cl] = await clarificationsOuvertes(c.client as never, { userId: c.userId });
  const fin = await repondreClarification(c.client as never, { userId: c.userId, clarificationId: cl.id, reponse: { nom: '12', rattachement: 'Transfert' } });
  const { data: p } = await c.client.from('knowledge_evidences').select('entity_id,relation,superseded_at').eq('user_id', c.userId).is('superseded_at', null);
  v.verifier(fin.etat === 'ecrite' && p!.length === 1 && p![0].entity_id === 'episode:podcast:12|transfert' && p![0].relation === 'LOVE', '4 ter : la précision de la personne écrit le fait et la relation en attente', JSON.stringify(p));
  v.verifier((await clarificationsOuvertes(c.client as never, { userId: c.userId })).length === 0, '4 ter : la clarification est fermée');
  const { petId } = await declarerAnimal(c.client as never, { userId: c.userId, nom: 'Mina', espece: 'chat' });
  await dicter([{ segments: [seg('SOUHAIT_AVEC_IDENTIFIANT', 'un arbre à chat', 'souhait', { temps: 'futur_ou_souhait' })] }]);
  await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'pets.0403', texte: 'J’aimerais lui offrir un arbre à chat.', acteId: acte() });
  const souhait = (await faits(c)).find((x) => x.fact_type.startsWith('discovery.fait.') && x.value.includes('pet_id') && !x.superseded_at);
  v.verifier(!!souhait && JSON.parse(souhait.value).pet_id === petId, '4 ter : un seul animal déclaré → le souhait porte son identifiant', souhait?.value);
  const autre = await compteLocal('faits-4d');
  const { data: vu } = await autre.client.from('knowledge_facts').select('id').eq('id', petId);
  v.verifier((vu ?? []).length === 0, '4 ter : un autre compte ne peut pas lire cet animal (politique d’accès)');
}
{ console.log('\n5. Une réponse de niveau C appartient au projet');
  const c = await compteLocal('faits-5');
  const qC = BANQUE.find((q) => q.branche === 'craft' && requiertProjet(q) && q.forme === 'single' && q.options.some((o) => produireDepuisOption(q, o).type === 'evidence'))!;
  const o = qC.options.find((x) => produireDepuisOption(qC, x).type === 'evidence')!;
  const { projet } = await ouvrirProjet(c.client as never, { userId: c.userId, type: requiertProjet(qC) === 'sejour' ? 'sejour' : 'achat', branche: 'craft', objet: 'Un vase pour le salon' });
  await enregistrerReponseFermee(c.client as never, { userId: c.userId, questionId: qC.id, clesOptions: [cleOption(o)], acteId: acte(), projet });
  const { data: ev } = await c.client.from('knowledge_evidences').select('target_family,target_construct,context').eq('user_id', c.userId);
  v.verifier(ev!.length >= 1 && ev!.every((e) => e.context === `projet:${projet.id}`), `5 : ${qC.id} → la preuve du contrat est écrite, dans la portée du projet`, JSON.stringify(ev));
  const portrait = await lirePortrait(c.client as never, { userId: c.userId });
  v.verifier(portrait.nbPreuves === 0, '5 : le portrait général ne la lit pas — aucune préférence générale n’en est tirée', String(portrait.nbPreuves));
  const duProjet = await connaissancesDuProjet(c.client as never, { userId: c.userId, projetId: projet.id });
  v.verifier(duProjet.preuves.length === ev!.length, '5 : le lecteur du projet la rend, structurée');
  const rendu = faitsDiscoveryPourPortrait(await readSocleFacts(c.client as never, c.userId, { discovery: 'seulement' }));
  v.verifier(rendu.lignes.length === 0, '5 : rien du projet n’est rendu au portrait comme fait général');
}
v.bilan();
