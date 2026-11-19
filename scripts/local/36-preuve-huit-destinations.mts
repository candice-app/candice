// PREUVE LOCALE — les HUIT destinations de l'onglet 17 qui n'étaient prouvées que par tests unitaires
// (décision 10 du 19 nov., 18h54). Sur la VRAIE base locale, par le vrai chemin d'écriture, avec le
// modèle SIMULÉ : on lui dicte un découpage, on vérifie ce que l'application ÉCRIT, ce qu'elle ÉCARTE
// (négation, autre personne), et ce qui se RELIT. La qualité d'un vrai découpage, elle, se juge au script 34.
//
//   CRE-06 #2 style · CRE-06 #3 matière · drinks.2102 #1 projection · time.1566 #1 projection
//   sensory2.1482 #1 lieu référent · sensory2.1482 #2 appréciation distincte
//   sensory2.1487 #1 élément esthétique · sensory2.1487 #2 élément sensoriel
import { compteLocal, verificateur } from './_compte-local.mts';
import { enregistrerReponseOuverte } from '../../src/lib/discovery/open-v3/service.ts';
import { clarificationsOuvertes, repondreClarification } from '../../src/lib/discovery/open-v3/destinations-ecriture.ts';
import { lirePortrait } from '../../src/lib/knowledge/portrait.ts';

const MODELE = process.env.ANTHROPIC_BASE_URL ?? '';
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(MODELE)) throw new Error('ARRÊT — ANTHROPIC_BASE_URL doit pointer le faux modèle local.');
const dicter = (reponses: unknown[]) => fetch(`${MODELE}/__script`, { method: 'POST', body: JSON.stringify({ reponses }) });
await fetch(`${MODELE}/__raz`, { method: 'POST', body: '{}' });
const v = verificateur();
const acte = () => globalThis.crypto.randomUUID();
type C = Awaited<ReturnType<typeof compteLocal>>;
const preuves = async (c: C) => (await c.client.from('knowledge_evidences').select('target_family,preference_value,polarity,stability,raw_information,entity_id,relation,subject_label,superseded_at').eq('user_id', c.userId).is('superseded_at', null)).data!;
const faits = async (c: C) => (await c.client.from('knowledge_facts').select('fact_type,value,context').eq('user_id', c.userId).like('fact_type', 'discovery.fait.%')).data!;
const seg = (declencheur: string, passage: string, attitude: string, plus: Record<string, unknown> = {}) =>
  ({ declencheur, passage, attitude, affirme: true, personne: 'soi', temps: 'actuel', condition: null, limite: null, ...plus });

{ console.log('\n1. CRE-06 #2 style et #3 matière (rejet) ; une matière AIMÉE n’est pas un rejet');
  const c = await compteLocal('d8-cre06');
  await dicter([{ segments: [seg('SEGMENT_STYLE', 'Le shabby chic', 'rejet'), seg('SEGMENT_MATIERE', 'le plastique', 'rejet')] }]);
  await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'CRE-06', texte: 'Le shabby chic me hérisse, et je déteste le plastique.', acteId: acte() });
  const p = await preuves(c);
  v.verifier(p.length === 2 && p.every((x) => x.target_family === 'PREFERENCE' && x.polarity === 'rejet' && x.stability === 'undetermined'), '1 : style et matière écrits en rejet, stabilité non établie', JSON.stringify(p));
  const c2 = await compteLocal('d8-cre06-nie');
  await dicter([{ segments: [seg('SEGMENT_MATIERE', 'le lin', 'rejet')] }]);
  await enregistrerReponseOuverte(c2.client as never, { userId: c2.userId, questionId: 'CRE-06', texte: 'J’aime beaucoup le lin.', acteId: acte() });
  v.verifier((await preuves(c2)).length === 0, '1 : « J’aime beaucoup le lin » : le rejet inventé par le modèle est écarté');
}
{ console.log('\n2. drinks.2102 et time.1566 #1 projection ; une projection d’AUTRUI n’est pas écrite');
  const c = await compteLocal('d8-projections');
  await dicter([{ segments: [seg('PROJECTION_DECLAREE', 'Un verre de vin nature sur une terrasse', 'projection', { temps: 'hypothetique' })] }]);
  await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'drinks.2102', texte: 'Un verre de vin nature sur une terrasse, au coucher du soleil.', acteId: acte() });
  await dicter([{ segments: [seg('PROJECTION_DECLAREE', 'un mois entier pour marcher jusqu’à Compostelle', 'projection', { temps: 'futur_ou_souhait' })] }]);
  await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'time.1566', texte: 'J’aimerais prendre un mois entier pour marcher jusqu’à Compostelle.', acteId: acte() });
  const f = await faits(c); const p = await preuves(c);
  v.verifier(f.length === 2 && p.every((x) => x.target_family !== 'INTEREST'), '2 : deux faits de projection, aucun intérêt ni goût', JSON.stringify(f.map((x) => x.fact_type)));
  const c2 = await compteLocal('d8-projection-autrui');
  await dicter([{ segments: [seg('PROJECTION_DECLAREE', 'partir un mois à Compostelle', 'projection', { personne: 'autre' })] }]);
  await enregistrerReponseOuverte(c2.client as never, { userId: c2.userId, questionId: 'time.1566', texte: 'Ma sœur veut partir un mois à Compostelle.', acteId: acte() });
  v.verifier((await faits(c2)).length === 0, '2 : la projection de sa sœur n’est pas écrite');
}
{ console.log('\n3. sensory2.1482 #1 lieu référent et #2 appréciation distincte : clarification, puis écriture ; jamais un lieu inventé');
  const c = await compteLocal('d8-lieu');
  await dicter([{ segments: [seg('REFERENT_RESOLU', 'Les thermes de Bagnères', 'referent', { temps: 'passe_revolu', identite: { nature: 'lieu', nom: 'thermes de Bagnères' } }), seg('RELATION_EXPLICITE_DISTINCTE', 'j’y ai adoré le silence', 'appreciation', { relation: 'LOVE' })] }]);
  const r = await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'sensory2.1482', texte: 'Les thermes de Bagnères : j’y ai adoré le silence.', acteId: acte() });
  const avant = await preuves(c);
  console.log('     écrit d’abord :', avant.length, 'preuve(s) ;', r.destinations?.clarifications, 'clarification(s)');
  v.verifier((r.destinations?.clarifications ?? 0) + avant.length >= 1, '3 : le lieu est soit résolu et écrit, soit soumis à clarification — jamais ignoré en silence');
  const cl = (await clarificationsOuvertes(c.client as never, { userId: c.userId }))[0];
  if (cl) {
    const fin = await repondreClarification(c.client as never, { userId: c.userId, clarificationId: cl.id, reponse: { nom: 'Thermes de Bagnères', rattachement: 'Bagnères-de-Bigorre' } });
    const apres = await preuves(c);
    v.verifier(fin.etat === 'ecrite' && apres.some((x) => x.target_family === 'ENTITY' && x.relation === 'LOVE'), '3 : la précision de la personne écrit le lieu et l’appréciation distincte', JSON.stringify(apres));
  } else v.verifier(avant.some((x) => x.target_family === 'ENTITY' && x.relation === 'LOVE'), '3 : lieu résolu directement, écrit avec l’appréciation distincte (LOVE)', JSON.stringify(avant));
  const c2 = await compteLocal('d8-lieu-autrui');
  await dicter([{ segments: [seg('REFERENT_RESOLU', 'son spa à Biarritz', 'referent', { personne: 'autre', identite: { nature: 'lieu', nom: 'spa de Biarritz' } })] }]);
  const r2 = await enregistrerReponseOuverte(c2.client as never, { userId: c2.userId, questionId: 'sensory2.1482', texte: 'Ma mère adore son spa à Biarritz.', acteId: acte() });
  v.verifier((await preuves(c2)).length === 0 && (r2.destinations?.clarifications ?? 0) === 0, '3 : le lieu de sa mère : ni écrit, ni soumis à clarification');
}
{ console.log('\n4. sensory2.1487 #1 élément esthétique et #2 élément sensoriel (présence voulue) ; un refus n’est pas une présence voulue');
  const c = await compteLocal('d8-lieu-ideal');
  await dicter([{ segments: [seg('ELEMENT_ESTHETIQUE', 'Beaucoup de bois clair', 'presence_voulue'), seg('ELEMENT_SENSORIEL', 'l’odeur du feu de cheminée', 'presence_voulue')] }]);
  await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'sensory2.1487', texte: 'Beaucoup de bois clair, et l’odeur du feu de cheminée.', acteId: acte() });
  const p = await preuves(c);
  v.verifier(p.length === 2 && p.every((x) => x.polarity !== 'rejet'), '4 : deux éléments voulus écrits', JSON.stringify(p));
  const portrait = await lirePortrait(c.client as never, { userId: c.userId });
  v.verifier(portrait.nbPreuves >= 2, '4 : relus par le portrait (lecture du journal)', String(portrait.nbPreuves));
  const c2 = await compteLocal('d8-lieu-ideal-nie');
  await dicter([{ segments: [seg('ELEMENT_SENSORIEL', 'musique d’ambiance', 'presence_voulue')] }]);
  await enregistrerReponseOuverte(c2.client as never, { userId: c2.userId, questionId: 'sensory2.1487', texte: 'Surtout pas de musique d’ambiance.', acteId: acte() });
  v.verifier((await preuves(c2)).every((x) => x.polarity === 'rejet' || x.polarity === null) && !(await preuves(c2)).some((x) => x.polarity === 'positive'), '4 : « surtout pas » n’est pas écrit comme une présence voulue');
}
v.bilan();
