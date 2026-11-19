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
import { clarificationsOuvertes, repondreClarification, FAIT_LECTURE } from '../../src/lib/discovery/open-v3/destinations-ecriture.ts';
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
{ console.log('\n3. sensory2.1482 #1 lieu référent et #2 appréciation distincte : la CIBLE de l’appréciation ne change pas (19 nov., 19h56)');
  // 3a — « j'y ai adoré le silence » : l'appréciation porte sur le silence, pas sur l'établissement.
  //      Le faux modèle MENT exprès (cible « referent ») : c'est la lecture des mots qui doit refuser.
  const c = await compteLocal('d8-lieu-aspect');
  await dicter([{ segments: [seg('REFERENT_RESOLU', 'Les thermes de Bagnères', 'referent', { temps: 'passe_revolu', identite: { nature: 'lieu', nom: 'thermes de Bagnères' } }), seg('RELATION_EXPLICITE_DISTINCTE', 'j’y ai adoré le silence', 'appreciation', { cible: 'referent', relation: 'LOVE' })] }]);
  const r = await enregistrerReponseOuverte(c.client as never, { userId: c.userId, questionId: 'sensory2.1482', texte: 'Les thermes de Bagnères : j’y ai adoré le silence.', acteId: acte() });
  // Le relevé est RELU dans la base (fait de lecture), pas pris dans la valeur de retour.
  const { data: lec, error: eLec } = await c.client.from('knowledge_facts').select('value').eq('user_id', c.userId).eq('fact_type', FAIT_LECTURE);
  if (eLec) throw new Error(`relecture du relevé impossible : ${eLec.message}`);
  const motif = (JSON.parse(String(lec?.[0]?.value ?? '{}')).releve ?? []).find((l: { declencheur: string }) => l.declencheur === 'RELATION_EXPLICITE_DISTINCTE') as { issue?: string; motif?: string } | undefined;
  v.verifier(r.destinations?.preuves === 0 || !(await preuves(c)).some((x) => x.relation), '3a : la lecture n’a écrit aucune relation', JSON.stringify(r.destinations));
  console.log('     relevé du second segment :', JSON.stringify(motif));
  const cl = (await clarificationsOuvertes(c.client as never, { userId: c.userId }))[0];
  if (cl) await repondreClarification(c.client as never, { userId: c.userId, clarificationId: cl.id, reponse: { nom: 'Thermes de Bagnères', rattachement: 'Bagnères-de-Bigorre' } });
  const apres = await preuves(c);
  v.verifier(!apres.some((x) => x.target_family === 'ENTITY' && x.relation), '3a : « j’y ai adoré le silence » : AUCUNE relation envers l’établissement (même après la précision du lieu)', JSON.stringify(apres));
  v.verifier(motif?.issue === 'non_ecrit' && motif.motif === 'appreciation_d_un_aspect', '3a : le relevé RELU en base porte le motif « appreciation_d_un_aspect »', JSON.stringify(motif));

  // 3b — « j'adore cet établissement » : la relation porte sur le lieu lui-même. Identité établie par
  //      la personne (localité donnée) : la relation LOVE est écrite, puis relue.
  const c3 = await compteLocal('d8-lieu-referent');
  await dicter([{ segments: [seg('REFERENT_RESOLU', 'Les thermes de Bagnères', 'referent', { temps: 'actuel', identite: { nature: 'lieu', nom: 'thermes de Bagnères', rattachement: 'Bagnères-de-Bigorre' } }), seg('RELATION_EXPLICITE_DISTINCTE', 'j’adore cet établissement', 'appreciation', { cible: 'referent', relation: 'LOVE' })] }]);
  const r3 = await enregistrerReponseOuverte(c3.client as never, { userId: c3.userId, questionId: 'sensory2.1482', texte: 'Les thermes de Bagnères, à Bagnères-de-Bigorre : j’adore cet établissement.', acteId: acte() });
  const cl3 = (await clarificationsOuvertes(c3.client as never, { userId: c3.userId }))[0];
  if (cl3) await repondreClarification(c3.client as never, { userId: c3.userId, clarificationId: cl3.id, reponse: { nom: 'Thermes de Bagnères', rattachement: 'Bagnères-de-Bigorre' } });
  const p3 = await preuves(c3);
  console.log('     écrit :', r3.destinations?.preuves, 'preuve(s) ;', r3.destinations?.clarifications, 'clarification(s)');
  v.verifier(p3.some((x) => x.target_family === 'ENTITY' && x.relation === 'LOVE' && /bagn/i.test(String(x.entity_id))), '3b : « j’adore cet établissement » : relation LOVE envers le lieu identifié', JSON.stringify(p3));
  const portrait3 = await lirePortrait(c3.client as never, { userId: c3.userId });
  v.verifier(portrait3.nbPreuves >= 1, '3b : relue par le portrait', String(portrait3.nbPreuves));

  // 3c — même règle pour un ÉPISODE et une ŒUVRE.
  const c4 = await compteLocal('d8-episode-aspect');
  await dicter([{ segments: [seg('REFERENT_RESOLU', 'L’épisode 12 de Transfert', 'referent', { temps: 'passe_revolu', identite: { nature: 'episode', nom: '12', rattachement: 'Transfert' } }), seg('RELATION_EXPLICITE_DISTINCTE', 'J’ai adoré la voix de l’invitée', 'appreciation', { cible: 'referent', relation: 'LOVE' })] }]);
  await enregistrerReponseOuverte(c4.client as never, { userId: c4.userId, questionId: 'podcast.0467', texte: 'L’épisode 12 de Transfert. J’ai adoré la voix de l’invitée.', acteId: acte() });
  v.verifier(!(await preuves(c4)).some((x) => x.target_family === 'ENTITY' && x.relation), '3c : épisode — « la voix de l’invitée » n’est pas une relation envers l’épisode');
  const c5 = await compteLocal('d8-oeuvre-aspect');
  await dicter([{ segments: [seg('OEUVRE_RESOLUE_APPRECIEE', 'Blacksad', 'appreciation', { cible: 'referent', identite: { nature: 'oeuvre', nom: 'Blacksad' } }), seg('AUTEUR_MENTIONNE', 'Canales', 'mention')] }]);
  await enregistrerReponseOuverte(c5.client as never, { userId: c5.userId, questionId: 'comics.0422', texte: 'J’adore le dessin de Blacksad, et Canales.', acteId: acte() });
  const p5 = await preuves(c5);
  v.verifier(!p5.some((x) => x.target_family === 'ENTITY'), '3c : œuvre — « le dessin de Blacksad » n’est pas une relation envers Blacksad ; l’auteur n’en reçoit aucune', JSON.stringify(p5));

  const c2 = await compteLocal('d8-lieu-autrui');
  await dicter([{ segments: [seg('REFERENT_RESOLU', 'son spa à Biarritz', 'referent', { personne: 'autre', identite: { nature: 'lieu', nom: 'spa à Biarritz' } })] }]);
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
