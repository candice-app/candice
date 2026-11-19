// PREUVE — le contrat de `food2.0882A`, cinq situations, relues en base.
//
// Le vrai service, la pile locale, un compte de test PAR situation. Le modèle est le faux
// serveur (scripts/local/faux-modele.mjs) : on lui dicte ce qu'un modèle rendrait — y compris
// ce qu'un modèle rendrait À TORT — et on regarde ce que l'application écrit.
import { compteLocal, verificateur } from './_compte-local.mts';
import { enregistrerReponseOuverte, rejouerLecturesEnAttente } from '../../src/lib/discovery/open-v3/service.ts';

const MODELE = process.env.ANTHROPIC_BASE_URL ?? '';
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(MODELE)) throw new Error('ARRÊT — ANTHROPIC_BASE_URL doit pointer le faux modèle local.');
const dicter = (reponses: unknown[]) => fetch(`${MODELE}/__script`, { method: 'POST', body: JSON.stringify({ reponses }) });
const panne = (active: boolean) => fetch(`${MODELE}/__panne`, { method: 'POST', body: JSON.stringify({ active }) });
const etatModele = async () => (await fetch(`${MODELE}/__etat`)).json() as Promise<{ appels: number; pannes: number }>;
await fetch(`${MODELE}/__raz`, { method: 'POST', body: '{}' });

const v = verificateur();
const Q = 'food2.0882A';
async function relire(c: Awaited<ReturnType<typeof compteLocal>>) {
  const [f, e, o, s] = await Promise.all([
    c.client.from('knowledge_facts').select('fact_type,value,context,assertion_status,user_confirmed,sensitivity_is_sensitive,subject,relation,effect').eq('user_id', c.userId),
    c.client.from('knowledge_evidences').select('target_family,target_construct').eq('user_id', c.userId),
    c.client.from('knowledge_open_knowledge').select('subject_label,relation,visibility_derived').eq('user_id', c.userId),
    c.client.from('knowledge_sources').select('source_type,question_code').eq('user_id', c.userId),
  ]);
  return { faits: f.data!, preuves: e.data!, ouvert: o.data!, sources: s.data! };
}
const montrer = (r: Awaited<ReturnType<typeof relire>>) => {
  for (const f of r.faits) console.log(`     FAIT ${f.fact_type} = « ${f.value} »${f.context ? ` [période : ${f.context}]` : ''} (${f.assertion_status}${f.sensitivity_is_sensitive ? ', sensible' : ''})`);
  for (const o of r.ouvert) console.log(`     CONNAISSANCE OUVERTE « ${o.subject_label} » — ${o.relation} [${o.visibility_derived}]`);
  console.log(`     preuves HSG : ${r.preuves.length} · sources : ${r.sources.map((s) => s.source_type).join(', ')}`);
};
const aucuneDerive = (r: Awaited<ReturnType<typeof relire>>, nom: string) => {
  v.verifier(r.preuves.length === 0, `${nom} : aucune preuve HSG (ni préférence, ni veto, ni ENTITY, ni intérêt)`, JSON.stringify(r.preuves));
  v.verifier(r.faits.every((f) => !f.subject && !f.relation && !f.effect), `${nom} : aucun fait ne porte de sujet, de relation ni d’effet`);
};

// ── 1. UNE ENVIE, AVEC DÉTAILS ET PÉRIODE.
{
  console.log('\n1. « J’ai très envie de ramen tonkotsu en ce moment, surtout le soir »');
  const c = await compteLocal('envie-1');
  const texte = 'J’ai très envie de ramen tonkotsu en ce moment, surtout le soir';
  await dicter([{ exprime_envie: true, details: ['ramen tonkotsu'], periode: 'en ce moment, surtout le soir', contraintes_declarees: [] }]);
  const res = await enregistrerReponseOuverte(c.client as never, { acteId: globalThis.crypto.randomUUID(), userId: c.userId, questionId: Q, texte });
  const r = await relire(c); montrer(r);
  v.verifier(r.faits.some((f) => f.fact_type === `discovery.${Q}` && f.value === texte), '1 : le verbatim est conservé, mot pour mot');
  const envie = r.faits.find((f) => f.fact_type === 'food.current_craving');
  v.verifier(envie?.value === 'ramen tonkotsu', '1 : un fait d’envie culinaire actuelle, avec le détail cité', envie?.value);
  v.verifier(envie?.context === 'en ce moment, surtout le soir', '1 : la période est celle que la personne a écrite', String(envie?.context));
  v.verifier(res.envie?.ecrite === true && !res.extractionEnAttente, '1 : le service rend compte de ce qu’il a écrit');
  aucuneDerive(r, '1');
}

// ── 2. LE MODÈLE INVENTE : un détail absent du texte, une allergie déduite, une habitude.
{
  console.log('\n2. « Une bonne pizza napolitaine » — et un modèle qui en rajoute');
  const c = await compteLocal('envie-2');
  const texte = 'Une bonne pizza napolitaine';
  await dicter([{ exprime_envie: true, details: ['pizza napolitaine', 'cuisine italienne en général'], periode: 'tous les vendredis',
    contraintes_declarees: ['sans doute intolérante au lactose', 'végétarienne'] }]);
  const res = await enregistrerReponseOuverte(c.client as never, { acteId: globalThis.crypto.randomUUID(), userId: c.userId, questionId: Q, texte });
  const r = await relire(c); montrer(r);
  const envie = r.faits.find((f) => f.fact_type === 'food.current_craving');
  v.verifier(envie?.value === 'pizza napolitaine', '2 : seul le détail présent dans la réponse est gardé', envie?.value);
  v.verifier(!envie?.context, '2 : la période inventée (« tous les vendredis ») n’est pas écrite', String(envie?.context));
  v.verifier(r.ouvert.length === 0, '2 : aucune allergie ni régime déduit n’est écrit', JSON.stringify(r.ouvert));
  v.verifier((res.envie?.ecartes.length ?? 0) === 4, '2 : les quatre inventions sont écartées et comptées', JSON.stringify(res.envie?.ecartes));
  aucuneDerive(r, '2');
}

// ── 3. UNE ENVIE ET, À PART, UNE ALLERGIE DÉCLARÉE.
{
  console.log('\n3. « Envie d’un pad thaï. Par contre je suis allergique aux cacahuètes. »');
  const c = await compteLocal('envie-3');
  const texte = 'Envie d’un pad thaï. Par contre je suis allergique aux cacahuètes.';
  await dicter([{ exprime_envie: true, details: ['pad thaï'], contraintes_declarees: ['je suis allergique aux cacahuètes'] }]);
  await enregistrerReponseOuverte(c.client as never, { acteId: globalThis.crypto.randomUUID(), userId: c.userId, questionId: Q, texte });
  const r = await relire(c); montrer(r);
  v.verifier(r.faits.some((f) => f.fact_type === 'food.current_craving' && f.value === 'pad thaï'), '3 : l’envie est écrite');
  v.verifier(r.ouvert.length === 1 && r.ouvert[0].subject_label === 'je suis allergique aux cacahuètes', '3 : la contrainte déclarée est conservée dans les mots de la personne');
  v.verifier(r.ouvert[0]?.visibility_derived === 'internal_only', '3 : elle est marquée sensible (jamais nommée dans un texte généré)', r.ouvert[0]?.visibility_derived);
  v.verifier(!r.faits.some((f) => f.fact_type === 'food.current_craving' && /allerg|cacahu/i.test(f.value)), '3 : l’allergie n’entre pas dans le fait d’envie');
  aucuneDerive(r, '3');
}

// ── 4. PAS D'ENVIE : réponse de refus, « aucune envie particulière », et variantes.
{
  console.log('\n4. refus et « aucune envie particulière » — sans appeler le modèle');
  const avant = (await etatModele()).appels;
  for (const texte of ['Aucune envie particulière', 'Non', 'Pas en ce moment', 'rien de spécial', 'Je préfère ne pas répondre']) {
    const c = await compteLocal('envie-4');
    await dicter([]);                                    // si le modèle était appelé, l'essai échouerait
    const res = await enregistrerReponseOuverte(c.client as never, { acteId: globalThis.crypto.randomUUID(), userId: c.userId, questionId: Q, texte });
    const r = await relire(c);
    v.verifier(!r.faits.some((f) => f.fact_type === 'food.current_craving') && r.ouvert.length === 0 && r.preuves.length === 0 && !res.extractionEnAttente,
      `4 : « ${texte} » ne crée aucune envie`, JSON.stringify(r.faits));
    v.verifier(r.faits.some((f) => f.value === texte), `4 : « ${texte} » — le verbatim reste conservé`);
  }
  v.verifier((await etatModele()).appels === avant, '4 : le modèle n’a pas été appelé une seule fois');
  let refusVide = ''; const c = await compteLocal('envie-4');
  try { await enregistrerReponseOuverte(c.client as never, { acteId: globalThis.crypto.randomUUID(), userId: c.userId, questionId: Q, texte: '   ' }); } catch (e) { refusVide = (e as Error).message; }
  const r = await relire(c);
  v.verifier(refusVide !== '' && r.faits.length === 0 && r.sources.length === 0, '4 : une réponse vide n’écrit rien du tout', refusVide);
}

// ── 5. PANNE DU MODÈLE : le verbatim est sauvegardé, la lecture rejouée UNE fois.
{
  console.log('\n5. panne du modèle pendant la lecture, puis rejeu');
  const c = await compteLocal('envie-5');
  const texte = 'Des gyozas maison ce week-end';
  await panne(true);
  const res = await enregistrerReponseOuverte(c.client as never, { acteId: globalThis.crypto.randomUUID(), userId: c.userId, questionId: Q, texte });
  let r = await relire(c); montrer(r);
  v.verifier(res.verbatimEcrit && res.extractionEnAttente, '5 : le service signale que la lecture reste à faire');
  v.verifier(r.faits.length === 1 && r.faits[0].value === texte, '5 : pendant la panne, le verbatim est en base — et lui seul');
  v.verifier(r.sources.length === 1, '5 : aucune source de lecture n’a été écrite pendant la panne', r.sources.map((s) => s.source_type).join(','));
  const pendant = await rejouerLecturesEnAttente(c.client as never, { userId: c.userId });
  v.verifier(pendant.rejouees === 0 && pendant.encoreEnAttente === 1, '5 : un rejeu PENDANT la panne n’écrit rien et laisse la lecture en attente', JSON.stringify(pendant));
  await panne(false);
  await dicter([{ exprime_envie: true, details: ['gyozas maison'], periode: 'ce week-end', contraintes_declarees: [] }]);
  const un = await rejouerLecturesEnAttente(c.client as never, { userId: c.userId });
  r = await relire(c); montrer(r);
  v.verifier(un.rejouees === 1, '5 : après la panne, la lecture est rejouée', JSON.stringify(un));
  v.verifier(r.faits.filter((f) => f.fact_type === 'food.current_craving').length === 1, '5 : le fait d’envie est écrit une fois');
  const appels = (await etatModele()).appels;
  const deux = await rejouerLecturesEnAttente(c.client as never, { userId: c.userId });
  const trois = await rejouerLecturesEnAttente(c.client as never, { userId: c.userId });
  r = await relire(c);
  v.verifier(deux.rejouees === 0 && trois.rejouees === 0 && (await etatModele()).appels === appels, '5 : deux rejeux de plus ne rappellent pas le modèle');
  v.verifier(r.faits.length === 2 && r.sources.length === 2, '5 : aucun doublon — un verbatim, une envie, deux sources', `${r.faits.length} faits, ${r.sources.length} sources`);
  aucuneDerive(r, '5');
}
v.bilan();
