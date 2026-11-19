// LES PORTES QUE LA PERSONNE OUVRE, LE NIVEAU C, ET LE RECALCUL APRÈS CHAQUE RÉPONSE — vraies
// routes HTTP, pile locale, comptes de test séparés.
//   1. Niveau C : fermé sans projet ; un séjour déclaré l'ouvre pour SON domaine seulement ;
//      « achat concret » reste fermé ; le projet clos ou échu referme tout.
//   2. Explorer un sujet : quelqu'un à qui le moteur n'a rien à demander en choisit un ; les
//      questions arrivent ; aucune connaissance n'est créée par le choix ; le retrait referme.
//   3. Recalcul : « Très peu de place » pour le sport, en cours de session — la question de
//      sport suivante n'est pas servie, et n'est pas marquée posée.
//   4. Contre-exemples : rien de coché ; question hors banque ; compte d'un autre.
import { estQuestionDOrientation } from '../../src/lib/discovery/open-v3/selection.ts';
import { compteLocal, verificateur } from './_compte-local.mts';
import { cookiesDe, poster, obtenirLot, repondre } from './_session-http.mts';
import { produireInteretsOnboarding } from '../../src/lib/questionnaire/produce-interests.ts';
import { lireEtat } from '../../src/lib/discovery/open-v3/etat.ts';
import { BANQUE, question } from '../../src/lib/discovery/open-v3/banque.ts';
import { verdictDe, prochainesQuestions } from '../../src/lib/discovery/open-v3/selection.ts';
import { ouvrirProjet } from '../../src/lib/discovery/open-v3/service.ts';
import { poolDe } from '../../src/lib/discovery/open-v3/coexistence.ts';
import { analyserCondition } from '../../src/lib/discovery/open-v3/conditions.ts';

const v = verificateur();
type C = Awaited<ReturnType<typeof compteLocal>>;
const etatDe = async (c: C) => (await lireEtat(c.client as never, { userId: c.userId })).etat;
const admissibles = async (c: C) => { const e = await etatDe(c); return prochainesQuestions(e, { combien: BANQUE.length, parBranche: BANQUE.length }).choix.map((x) => x.question); };
const niveauC = (qs: readonly { id: string; niveau?: string; branche: string }[], pool?: string) => qs.filter((q) => q.niveau === 'C' && (!pool || poolDe(q.branche) === pool));
const preuves = async (c: C) => ((await c.client.from('knowledge_evidences').select('id').eq('user_id', c.userId)).data ?? []).length;
const ts = () => new Date().toISOString();

// ── 1. NIVEAU C ET PROJETS
console.log('\n══ 1. Niveau C : un projet, sinon rien');
{
  const c = await compteLocal('portes-voyageuse'); const cookie = await cookiesDe(c.email, c.motDePasse);
  await produireInteretsOnboarding(c.client as never, { userId: c.userId, categories: [{ id: 'voyage', label: 'Voyage' }, { id: 'cuisine', label: 'Cuisine & gastronomie' }], timestamp: ts() });
  let a = await admissibles(c);
  v.verifier(a.length > 0 && niveauC(a).length === 0, `intérêt pour le voyage et la cuisine : ${a.length} questions admissibles, aucune de niveau C`, niveauC(a).map((q) => q.id).join(','));
  const e0 = await etatDe(c);
  v.verifier(verdictDe(question('travel2.0937')!, e0) === 'fermer', '« Niveau C, séjour concret » (travel2.0937) : fermée — aimer le voyage ne crée pas un séjour', `${verdictDe(question('travel2.0937')!, e0)} · ${question('travel2.0937')!.condition_emission}`);

  const r = await poster('/api/discovery/projet', cookie, { action: 'ouvrir', type: 'sejour', branche: 'travel2', objet: 'Cinq jours à Lisbonne en mars' });
  const projetId = (r.json as { projet?: { id: string } }).projet?.id ?? '';
  v.verifier(r.status === 200 && !!projetId, 'un séjour est déclaré par la route, sous la session de la personne', JSON.stringify(r.json));
  a = await admissibles(c);
  const cVoyage = niveauC(a, 'travel'), cAilleurs = niveauC(a).filter((q) => poolDe(q.branche) !== 'travel');
  v.verifier(cVoyage.length > 0, `le séjour ouvre ${cVoyage.length} question(s) de niveau C du voyage`, cVoyage.map((q) => q.id).join(','));
  v.verifier(cAilleurs.length === 0, 'il n’ouvre AUCUNE question de niveau C d’un autre domaine (la cuisine reste fermée)', cAilleurs.map((q) => q.id).join(','));
  const achats = BANQUE.filter((q) => poolDe(q.branche) === 'travel' && /achat concret/i.test(q.condition_emission));
  const e1 = await etatDe(c);
  v.verifier(achats.every((q) => verdictDe(q, e1) !== 'ouvrir'), `un séjour n’est pas un achat : les ${achats.length} question(s) « achat concret » du domaine restent fermées`);
  v.verifier(cVoyage.every((q) => !analyserCondition(q.condition_emission).sensible), 'aucune des questions ouvertes par le projet n’est sensible');
  const liste = await poster('/api/discovery/projet', cookie, null, 'GET');
  v.verifier(liste.status === 200 && ((liste.json as { projets: unknown[] }).projets ?? []).length === 1, 'la personne retrouve son projet en cours');

  const clos = await poster('/api/discovery/projet', cookie, { action: 'clore', projetId, motif: 'annule' });
  a = await admissibles(c);
  v.verifier(clos.status === 200 && niveauC(a).length === 0, 'séjour annulé : plus aucune question de niveau C', niveauC(a).map((q) => q.id).join(','));
  const faits = (await c.client.from('knowledge_facts').select('fact_type, superseded_at').eq('user_id', c.userId).eq('fact_type', 'discovery.projet')).data ?? [];
  v.verifier(faits.length === 1 && faits[0].superseded_at !== null, 'le projet n’est pas effacé : il est conservé, marqué clos');

  // Échu : déclaré il y a un mois, pour une semaine. Écrit par le producteur, sous l'identité du compte.
  const ilYaUnMois = new Date(Date.now() - 30 * 864e5).toISOString(), finPassee = new Date(Date.now() - 23 * 864e5).toISOString();
  await ouvrirProjet(c.client as never, { userId: c.userId, type: 'sejour', branche: 'travel2', objet: 'Week-end passé', fin: finPassee, timestamp: ilYaUnMois });
  a = await admissibles(c);
  v.verifier(niveauC(a).length === 0, 'un séjour dont la date de fin est passée n’ouvre plus rien, sans que personne ait à le clore');

  const refus = [
    await poster('/api/discovery/projet', cookie, { action: 'ouvrir', type: 'sejour', branche: 'travel2', objet: '   ' }),
    await poster('/api/discovery/projet', cookie, { action: 'ouvrir', type: 'sejour', branche: 'pas-une-branche', objet: 'x' }),
    await poster('/api/discovery/projet', cookie, { action: 'ouvrir', type: 'loisir', branche: 'travel2', objet: 'x' }),
    await poster('/api/discovery/projet', cookie, { action: 'ouvrir', type: 'sejour', branche: 'travel2', objet: 'x', fin: '2001-01-01T00:00:00.000Z' }),
  ];
  v.verifier(refus.every((x) => x.status === 400), 'objet vide, branche inconnue, type inconnu, date passée : refusés (400), rien d’écrit', refus.map((x) => x.status).join(','));
  const anonyme = await poster('/api/discovery/projet', null, { action: 'ouvrir', type: 'sejour', branche: 'travel2', objet: 'x' });
  v.verifier(anonyme.status === 401, 'sans session : 401');
}

// ── 2. EXPLORER UN SUJET
console.log('\n══ 2. Explorer un sujet');
{
  const c = await compteLocal('portes-discrete'); const cookie = await cookiesDe(c.email, c.motDePasse);
  let a = await admissibles(c);
  v.verifier(a.length === 0, 'domaine non renseigné : rien de coché, rien à demander', String(a.length));
  const page = await poster('/moi/discovery?mode=full', cookie, null, 'GET');
  v.verifier(page.status === 200 && page.texte.includes('Explorer un sujet') && page.texte.includes('Un achat ou un séjour en préparation'), 'la page /moi/discovery offre les deux portes');
  const avant = await preuves(c);
  const r = await poster('/api/discovery/sujet', cookie, { branche: 'home2', choisi: true });
  a = await admissibles(c);
  v.verifier(r.status === 200 && a.length > 0 && a.every((q) => poolDe(q.branche) === 'home'), `elle choisit « Maison » : ${a.length} question(s) admissible(s), toutes de ce domaine`, JSON.stringify(r.json) + ' ' + [...new Set(a.map((q) => q.branche))].join(','));
  v.verifier(await preuves(c) === avant, 'choisir un sujet n’écrit aucune connaissance sur elle (ni intérêt, ni préférence)', `${avant} → ${await preuves(c)}`);
  v.verifier(a.every((q) => !analyserCondition(q.condition_emission).sensible || analyserCondition(q.condition_emission).ouvertureSurDemarche), 'aucune question sensible sans mode d’ouverture écrit ne s’ouvre');
  const page2 = await poster('/moi/discovery?mode=full', cookie, null, 'GET');
  const premiere = prochainesQuestions(await etatDe(c), { combien: 1 }).choix[0]?.question;
  v.verifier(!!premiere && page2.texte.includes(premiere.enonce.slice(0, 25).replace(/’/g, '&#x27;')) || page2.texte.includes(premiere!.enonce.slice(0, 25)), 'la page affiche maintenant la question que le moteur choisit', premiere?.enonce);
  v.verifier(!/>(home2|travel2|food2|sportp)</.test(page2.texte), 'aucun identifiant technique de branche n’est affiché');
  const retrait = await poster('/api/discovery/sujet', cookie, { branche: 'home2', choisi: false });
  a = await admissibles(c);
  v.verifier(retrait.status === 200 && a.length === 0, 'elle revient sur son choix : les questions se referment', String(a.length));
  const inconnu = await poster('/api/discovery/sujet', cookie, { branche: 'pas-un-sujet', choisi: true });
  v.verifier(inconnu.status === 400, 'un sujet inconnu est refusé (400)');
}

// ── 3. « TRÈS PEU DE PLACE » N'EST PAS UN REFUS ; LE REFUS EST UN ACTE (décision du 19 nov.)
console.log('\n══ 3. Faible place, refus explicite, recalcul');
{
  // Une catégorie SIMPLE (« Bien-être ») : elle ouvre pleinement sa branche.
  const BR = 'wellbeing';
  const c = await compteLocal('portes-nature'); const cookie = await cookiesDe(c.email, c.motDePasse);
  await produireInteretsOnboarding(c.client as never, { userId: c.userId, categories: [{ id: 'bienetre', label: 'Bien-être' }], timestamp: ts() });
  const Q1 = BANQUE.find((q) => q.branche === BR && /^Quelle place /.test(q.enonce))!;
  const avant = (await admissibles(c)).filter((q) => q.branche === BR).map((q) => q.id);
  v.verifier(avant.includes(Q1.id) && avant.length > 1, `« Bien-être » cochée : ${avant.length} questions de bien-être admissibles`);
  let lot = await obtenirLot(cookie);
  v.verifier(lot?.question.question_key === Q1.id, 'la première question proposée est celle de la place du bien-être', lot?.question.question_key);
  v.verifier(Q1.enonce === 'Quelle place le bien-être et le repos occupent-ils réellement dans ta vie ?', 'son énoncé est celui de la révision éditoriale');
  const r5 = Q1.options.find((o) => o.libelle === 'Très peu de place')!;
  const r = await repondre(cookie, { jeton: lot!.jeton, questionKey: Q1.id, answer: [`r${r5.rang}`] });
  const Q2 = r.next?.question.question_key ?? '';
  v.verifier(r.status === 200 && question(Q2)?.branche === BR, 'elle répond « Très peu de place » : la question de bien-être suivante RESTE posée — une faible place n’interdit rien', `suivante = ${Q2}`);
  const pref = (await c.client.from('knowledge_evidences').select('target_construct, polarity, strength').eq('user_id', c.userId).like('target_construct', 'PREFERENCE.%.domain_importance')).data ?? [];
  v.verifier(pref.length === 1 && pref[0].polarity === 'absence_de_critere' && pref[0].strength !== 'weak', 'au journal : une faible place, ni rejet ni preuve « faible »', JSON.stringify(pref));
  const e1 = await etatDe(c);
  v.verifier(e1.placeFaible?.has(BR) === true && !e1.nePasCreuser.has(BR), 'l’état retient une place faible, et aucun refus');
  v.verifier((await admissibles(c)).some((q) => q.branche === BR), 'les questions de bien-être restent admissibles');
  const interet = (await c.client.from('knowledge_evidences').select('target_construct').eq('user_id', c.userId).eq('target_family', 'INTEREST')).data ?? [];
  v.verifier(interet.length >= 1, 'réponse contradictoire : la case cochée et la faible place sont conservées toutes deux');

  // LE REFUS EXPLICITE : le seul acte qui arrête les questions du sujet.
  const n0 = await preuves(c);
  const refus = await poster('/api/discovery/sujet', cookie, { branche: BR, refuse: true });
  v.verifier(refus.status === 200 && (await preuves(c)) === n0, 'elle demande à ne plus être questionnée sur le bien-être : acte enregistré, aucune préférence écrite');
  v.verifier(!(await admissibles(c)).some((q) => q.branche === BR), 'plus aucune question de bien-être n’est admissible');
  const apresRefus = await repondre(cookie, { jeton: lot!.jeton, questionKey: Q2, answer: [`r${question(Q2)!.options[0].rang}`] });
  v.verifier(apresRefus.status === 409 && apresRefus.motif === 'conditions_non_tenues' && (await preuves(c)) === n0, 'la question de bien-être restée à l’écran est refusée, rien n’est écrit', `HTTP ${apresRefus.status} ${apresRefus.motif}`);
  v.verifier(!(await etatDe(c)).dejaPosees.has(Q2), 'la question refusée n’est pas marquée posée');
  const reprise = await poster('/api/discovery/sujet', cookie, { branche: BR, refuse: false });
  v.verifier(reprise.status === 200 && (await admissibles(c)).some((q) => q.branche === BR), 'elle accepte de nouveau : les questions redeviennent admissibles');
  const double = await poster('/api/discovery/sujet', cookie, { branche: BR, refuse: true, choisi: true });
  v.verifier(double.status === 400, 'refuser et choisir dans la même requête est refusé (400)');

  // Non-réponse : passer une question n'écrit rien et elle ne revient pas.
  lot = await obtenirLot(cookie);
  const cle = lot!.question.question_key;
  const passe = await repondre(cookie, { jeton: lot!.jeton, questionKey: cle, skip: true });
  v.verifier(passe.status === 200 && await preuves(c) === n0 && (await etatDe(c)).dejaPosees.has(cle), 'non-réponse : la question passée n’écrit rien et ne revient pas', cle);
  // Question retirée de la banque : absente du moteur, donc d'aucun lot — refusée, rien d'écrit.
  const archivee = await repondre(cookie, { jeton: lot!.jeton, questionKey: 'series.0094', answer: ['r1'] });
  v.verifier(question('series.0094') === undefined && archivee.status === 403 && await preuves(c) === n0, 'question retirée de la banque : refusée, aucune preuve écrite', `HTTP ${archivee.status} ${archivee.motif}`);
}

// ── 4. DONNÉE INACCESSIBLE : le compte d'un autre
console.log('\n══ 4. Donnée inaccessible');
{
  const a = await compteLocal('portes-alpha'), b = await compteLocal('portes-beta');
  await produireInteretsOnboarding(a.client as never, { userId: a.userId, categories: [{ id: 'voyage', label: 'Voyage' }], timestamp: ts() });
  await ouvrirProjet(a.client as never, { userId: a.userId, type: 'sejour', branche: 'travel2', objet: 'Séjour d’alpha' });
  const { etat, manques } = await lireEtat(b.client as never, { userId: a.userId });   // beta lit « l'état d'alpha » avec SA session
  v.verifier(etat.branchesOuvertes.size === 0 && (etat.projets?.size ?? 0) === 0, 'avec la session d’un autre compte, l’état lu est vide : ni intérêt, ni projet', JSON.stringify({ branches: [...etat.branchesOuvertes], manques }));
  v.verifier(prochainesQuestions(etat, { combien: 50 }).choix.length === 0, 'et aucune question ne s’ouvre sur ce qu’on ne peut pas lire');
  const cb = await cookiesDe(b.email, b.motDePasse);
  const liste = await poster('/api/discovery/projet', cb, null, 'GET');
  v.verifier(((liste.json as { projets: unknown[] }).projets ?? []).length === 0, 'la route des projets ne rend que ceux de l’appelant');
}
// ── CATÉGORIE COMPOSITE (décision du 19 nov., 09h31) : « Nature & jardinage » annonce deux familles
//    et n'en prouve aucune. Seules les questions d'orientation sont posées, jusqu'au signal propre.
console.log('\n══ Catégorie composite : orientation seulement');
{
  const c = await compteLocal('portes-composite'); const cookie = await cookiesDe(c.email, c.motDePasse);
  await produireInteretsOnboarding(c.client as never, { userId: c.userId, categories: [{ id: 'nature', label: 'Nature & jardinage' }], timestamp: ts() });
  const n0 = await preuves(c);
  const adm = (await admissibles(c)).filter((q) => q.branche === 'nature' || q.branche === 'garden');
  v.verifier(adm.length > 0 && adm.every(estQuestionDOrientation), `seules des questions d’orientation sont admissibles en nature et en jardinage (${adm.map((q) => q.id).join(', ')})`);
  v.verifier(adm.some((q) => q.branche === 'garden') && adm.some((q) => q.branche === 'nature'), 'les deux familles annoncées ont leur question d’orientation');
  v.verifier((await preuves(c)) === n0, 'cette ouverture n’écrit aucune connaissance');
  const lot = await obtenirLot(cookie);
  const q1 = question(lot!.question.question_key)!;
  v.verifier(estQuestionDOrientation(q1), 'la première question proposée est une question d’orientation', q1.id);
  const positive = q1.options.find((o) => o.polarite === 'positive')!;
  const r = await repondre(cookie, { jeton: lot!.jeton, questionKey: q1.id, answer: [`r${positive.rang}`] });
  v.verifier(r.status === 200, `elle répond « ${positive.libelle} » à « ${q1.enonce} »`);
  const apres = await admissibles(c);
  v.verifier(apres.some((q) => q.branche === q1.branche && !estQuestionDOrientation(q)), `réponse positive : les questions spécialisées de « ${q1.branche} » s’ouvrent`);
  const autre = q1.branche === 'nature' ? 'garden' : 'nature';
  v.verifier(apres.filter((q) => q.branche === autre).every(estQuestionDOrientation), `l’autre famille (« ${autre} ») reste à l’orientation : rien ne la prouve`);
}
v.bilan();
