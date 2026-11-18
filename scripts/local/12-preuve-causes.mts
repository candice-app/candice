// PREUVE — la branche « causes » ne s'ouvre que sur la démarche de la personne.
//
// Sur la pile locale, par les VRAIS chemins : lecture de l'état depuis le journal, sélection,
// enregistrement des réponses, relecture en base. Quatre temps :
//   1. un compte qui a du terrain (un intérêt déclaré pour les causes) mais n'a rien demandé ;
//   2. il demande à explorer le sujet ;  3. il répond ;  4. il revient sur sa démarche.
import { compteLocal, verificateur } from './_compte-local.mts';
import { BANQUE, question } from '../../src/lib/discovery/open-v3/banque.ts';
import { lireEtat } from '../../src/lib/discovery/open-v3/etat.ts';
import { prochainesQuestions } from '../../src/lib/discovery/open-v3/selection.ts';
import { analyserCondition, evaluerCondition } from '../../src/lib/discovery/open-v3/conditions.ts';
import { cleOption, declarerSujet, enregistrerReponseFermee, branchesSurDemarche } from '../../src/lib/discovery/open-v3/service.ts';
import { persistKnowledge } from '../../src/lib/knowledge-write/persist.ts';
import { createSourceRecord } from '../../src/lib/knowledge/sources.ts';
import { accountAbout, asUserId, asSubjectId } from '../../src/lib/knowledge/identity.ts';
import { evidenceId } from '../../src/lib/knowledge-write/ids.ts';
import { JOURNAL_VERSION_STAMP } from '../../src/lib/knowledge/version.ts';

const v = verificateur();
const c = await compteLocal('preuve-causes');
const causes = BANQUE.filter((q) => q.branche === 'causes');
const ouvertes = async () => {
  const { etat, manques } = await lireEtat(c.client as never, { userId: c.userId });
  if (manques.length) console.log('   manques :', manques);
  const ids = causes.filter((q) => !etat.dejaPosees.has(q.id) && evaluerCondition(analyserCondition(q.condition_emission), etat, { branche: q.branche }) === 'ouvrir').map((q) => q.id);
  const servies = prochainesQuestions(etat, { combien: 200, parBranche: 200 }).choix.filter((x) => x.question.branche === 'causes').map((x) => x.question.id);
  return { ids, servies, etat };
};

console.log('branches à ouverture sur démarche :', branchesSurDemarche());
v.verifier(branchesSurDemarche().includes('causes') && !branchesSurDemarche().includes('travel'), '« causes » attend une démarche ; une branche ordinaire comme « travel », non');

// ── 1. DU TERRAIN, SANS DÉMARCHE : un intérêt pour les causes, déclaré dans une réponse fermée.
const ts = new Date().toISOString(); const sid = globalThis.crypto.randomUUID();
const about = accountAbout(asUserId(c.userId));
await persistKnowledge(c.client as never, {
  source: createSourceRecord({ about, ownerId: asUserId(c.userId), id: sid, sourceType: 'onboarding_closed', questionCode: 'essai.interets', questionText: 'Tes centres d’intérêt', answerText: 'Causes', timestamp: ts }),
  evidences: [{ about, ownerId: asUserId(c.userId), evidence_id: evidenceId(sid, 'INTEREST:causes'), source_id: sid, source_type: 'onboarding_closed',
    raw_information: 'Causes', confidence: 'medium', context: 'GLOBAL', timestamp: ts, stability: 'evolving', evidence_role: 'primary', assertionBasis: 'self_report',
    target_family: 'INTEREST', subject: asSubjectId('causes'), target_construct: asSubjectId('causes'), subjectLabel: 'Causes', strength: 'moderate', version: JOURNAL_VERSION_STAMP } as never],
});
let r = await ouvertes();
console.log(`\n1. intérêt « causes » déclaré, aucune démarche → branche ouverte : ${r.etat.branchesOuvertes.has('causes')} · questions causes ouvertes : ${r.ids.length}`);
v.verifier(r.etat.branchesOuvertes.has('causes'), 'le terrain existe (branche causes ouverte par un intérêt)');
v.verifier(r.ids.length === 0 && r.servies.length === 0, 'aucune question « causes » n’est proposée sur ce seul terrain', r.ids.join(' '));

// ── 2. LA DÉMARCHE.
const d = await declarerSujet(c.client as never, { userId: c.userId, branche: 'causes', choisi: true });
r = await ouvertes();
console.log(`\n2. démarche enregistrée (${d.etat}) → questions causes ouvertes : ${r.ids.length} : ${r.ids.join(' ')}`);
v.verifier(r.ids.length > 0, 'des questions « causes » s’ouvrent après la démarche');
const interdites = ['causes.1918', 'causes.1924', 'causes.1934', 'causes.1935', 'causes.1938', 'causes.1939', 'causes.1940'];
v.verifier(!r.ids.some((id) => interdites.includes(id)), 'les questions que le référentiel marquait déjà HIGH / MAXIMALE restent fermées', r.ids.filter((id) => interdites.includes(id)).join(' '));
v.verifier(JSON.stringify(r.servies.sort()) === JSON.stringify([...r.ids].sort()), 'la sélection sert exactement les questions ouvertes');
const { data: faits } = await c.client.from('knowledge_facts').select('fact_type,value,superseded_at,user_confirmed').eq('user_id', c.userId);
console.log('   fait relu en base :', faits);

// ── 3. DES RÉPONSES : portée exacte, aucune appartenance déduite.
for (const id of ['causes.1920', 'causes.1921', 'causes.1922']) {
  const q = question(id)!;
  const cles = q.options.slice(0, q.forme === 'single' ? 1 : 2).map(cleOption);
  await enregistrerReponseFermee(c.client as never, { userId: c.userId, questionId: id, clesOptions: cles });
}
const { data: ev } = await c.client.from('knowledge_evidences').select('target_family,target_construct,context,preference_value,polarity,raw_information,source_id').eq('user_id', c.userId).neq('source_id', sid);
console.log('\n3. relu en base après trois réponses :'); for (const e of ev!) console.log(`   ${e.target_family} ${e.target_construct} = ${e.preference_value ?? ''} [contexte ${e.context}, polarité ${e.polarity}] « ${e.raw_information} »`);
v.verifier(ev!.length > 0, 'les réponses sont écrites');
v.verifier(ev!.every((e) => e.context === 'causes'), 'chaque preuve garde la portée « causes »');
v.verifier(!ev!.some((e) => ['PROFILE', 'NEED', 'DRIVER'].includes(e.target_family)), 'aucun trait, besoin ou moteur déduit');
{
  const { etat } = await lireEtat(c.client as never, { userId: c.userId });
  const fuite = ['enfants', 'children', 'family', 'personnes_vulnerables'].filter((b) => etat.branchesOuvertes.has(b));
  v.verifier(fuite.length === 0, 'être touché par la cause des enfants n’ouvre PAS la branche « Enfants »', fuite.join(' '));
}
v.verifier(!ev!.some((e) => /polit|relig|parti|syndic|associat|militant|croyan/i.test(`${e.target_construct} ${e.preference_value ?? ''}`)), 'aucune appartenance politique, religieuse ou associative écrite');

// ── 4. LE RETRAIT.
const d2 = await declarerSujet(c.client as never, { userId: c.userId, branche: 'causes', choisi: false });
r = await ouvertes();
console.log(`\n4. démarche retirée (${d2.etat}) → questions causes ouvertes : ${r.ids.length}`);
v.verifier(r.ids.length === 0 && r.servies.length === 0, 'après le retrait, plus aucune question « causes » n’est proposée');
const { data: apres } = await c.client.from('knowledge_evidences').select('id').eq('user_id', c.userId).neq('source_id', sid).is('superseded_at', null);
v.verifier(apres!.length === ev!.length, 'les réponses déjà données sont conservées (le retrait ferme les questions, il n’efface pas)');

// ── Une branche qui n'attend aucune démarche ne peut pas en recevoir.
let refus = ''; try { await declarerSujet(c.client as never, { userId: c.userId, branche: 'travel', choisi: true }); } catch (e) { refus = (e as Error).message; }
v.verifier(refus !== '', 'déclarer une démarche pour une branche ordinaire est refusé', refus);
v.bilan();
