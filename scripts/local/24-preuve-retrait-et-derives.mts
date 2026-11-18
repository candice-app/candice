// PREUVE — une autorisation retirée ne nourrit plus rien : ni les nouvelles recommandations, ni
// ce qui s'affiche, ni ce qui a été calculé avant et reste accessible.
// Modèle SIMULÉ : il sert à dicter ce qu'un modèle aurait produit et à lire ce qu'on lui envoie.
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';

const MODELE = process.env.ANTHROPIC_BASE_URL!;
const m = (chemin: string, corps: unknown = {}) => fetch(`${MODELE}${chemin}`, { method: 'POST', body: JSON.stringify(corps) });
const recus = async () => ((await (await fetch(`${MODELE}/__etat`)).json()) as { recus: { systeme: string; texte: string }[] }).recus;
await m('/__raz');
const { admin } = pileLocale();
const v = verificateur();
const idee = (title: string, justification = 'Une attention simple.') => ({ title, justification, dim: 'CAD_C', canal: 'message', intensite: 'legere', declencheur: 'x' });
const dicter = (...lots: ReturnType<typeof idee>[][]) => m('/__script', { reponses: lots.map((l) => ({ __texte: JSON.stringify(l) })) });

const P = await compteLocal('retrait-pilote'), B = await compteLocal('retrait-proche'), X = await compteLocal('retrait-autre'), P2 = await compteLocal('retrait-pilote-deux');
await B.client.from('my_profile').upsert({ user_id: B.userId, practical_info: { vetos: { allergies: ['arachide'], halal: true } } }, { onConflict: 'user_id' });
const cP = await cookiesDe(P.email, P.motDePasse), cB = await cookiesDe(B.email, B.motDePasse), cP2 = await cookiesDe(P2.email, P2.motDePasse);
const fiche = async (c: typeof P, compte: string) => {
  const { data } = await c.client.from('contacts').insert({ user_id: c.userId, name: 'Bruno Test', relationship: 'friend' }).select('id').single();
  await c.client.from('contacts').update({ proche_user_id: compte }).eq('id', data!.id); return data!.id as string;
};
const k = await fiche(P, B.userId), k2 = await fiche(P2, B.userId);
// Ce que le PILOTE a fourni lui-même sur son proche.
await P.client.from('questionnaire_responses').insert({ user_id: P.userId, contact_id: k, things_to_avoid: 'les huîtres', data_source: 'pilot_input' });
await P.client.from('profile_notes').insert({ user_id: P.userId, contact_id: k, content: 'NOTE-DU-PILOTE' }).then(() => {}, () => {});
const regler = (cookie: string, contactId: string, action: string, portee: string) => poster('/api/consent/exclusions', cookie, { contactId, action, portee });
const generer = async (cookie: string, contactId: string) => { const avant = (await recus()).length; const r = await poster('/api/recommendations/generate', cookie, { contactId }); const envoye = (await recus()).slice(avant).map((x) => `${x.systeme}\n${x.texte}`).join('\n'); return { ...r, envoye }; };
const stocke = async (c: typeof P, contactId: string) => (await c.client.from('contact_recommendations').select('*').eq('contact_id', contactId).maybeSingle()).data as any;
const journal = async (c: typeof P, contactId: string) => ((await c.client.from('attention_log').select('*').eq('contact_id', contactId).order('proposed_at')).data ?? []) as any[];
// Les idées « issues des données du proche » portent le mot « halal » : le moteur écarte de lui-même
// toute idée qui NOMME un interdit (porc, arachide…), elles n'arriveraient donc jamais jusqu'ici.
const INTERDIT = /halal/i;

console.log('\n══ 1. AVANT TOUTE AUTORISATION — une recommandation faite des seules données du pilote');
await dicter([idee('Un livre choisi pour lui')]);
let r = await generer(cP, k);
let s = await stocke(P, k);
v.verifier(r.status === 200 && s.portees_proche.length === 0 && s.proche_compte === null, '1.1 : enregistrée SANS provenance du proche');

console.log('\n══ 2. LE PROCHE AUTORISE SON RÉGIME ET UNE ALLERGIE — la recommandation en dépend');
await regler(cB, k, 'autoriser', 'reco:regime'); await regler(cB, k, 'autoriser', 'reco:allergie:arachide');
await dicter([idee('Un dîner halal chez Samia', 'Pensé pour lui.'), idee('Un panier halal du traiteur')]);
r = await generer(cP, k);
s = await stocke(P, k);
console.log('  provenance enregistrée :', s.portees_proche, '· compte du proche :', s.proche_compte === B.userId);
v.verifier(r.status === 200 && JSON.stringify([...s.portees_proche].sort()) === '["reco:allergie:arachide","reco:regime"]' && s.proche_compte === B.userId, '2.1 : la provenance note le compte et les deux autorisations utilisées');
v.verifier(/arachide/.test(r.envoye) && /porc/.test(r.envoye), '2.2 : (contrôle) le modèle a bien reçu les deux données autorisées');
// Le pilote RÉALISE la première idée ; la seconde reste seulement proposée.
await poster('/api/recommendations/action', cP, { contactId: k, attentionTitle: 'Un dîner halal chez Samia', status: 'done' });
// Un autre pilote a la même personne pour proche, avec sa propre autorisation.
await regler(cB, k2, 'autoriser', 'reco:regime');
await dicter([idee('Un repas halal pour lui')]);
await generer(cP2, k2);
let j = await journal(P, k);
v.verifier(j.length === 3 && j.filter((l) => l.status === 'done').length === 1, '2.3 : journal du pilote : 1 idée ancienne, 1 réalisée, 1 seulement proposée', `${j.length} lignes`);

console.log('\n══ 3. LE PROCHE RETIRE SON ALLERGIE (le régime reste autorisé)');
r = await regler(cB, k, 'retirer', 'reco:allergie:arachide');
s = await stocke(P, k); j = await journal(P, k);
console.log('  recommandation enregistrée →', { idees: s.ideas.length, a_recalculer: s.a_recalculer, provenance: s.portees_proche });
console.log('  journal →', j.map((l) => `${l.status}: ${l.attention_title}`));
v.verifier(s.ideas.length === 0 && s.a_recalculer === true && !INTERDIT.test(JSON.stringify(s)), '3.1 : la recommandation est rendue INDISPONIBLE (elle mêlait les deux données : on ne sait pas en retirer une part)');
v.verifier(!j.some((l) => INTERDIT.test(l.attention_title)), '3.2 : plus aucun intitulé du journal ne porte une donnée retirée');
v.verifier(j.some((l) => l.status === 'done' && l.actioned_at && l.detail_retire_le && !INTERDIT.test(l.attention_title)), '3.3 : l’attention RÉALISÉE est conservée (date, statut) — seul son intitulé est remplacé');
v.verifier(!j.some((l) => l.status === 'proposed' && l.portees_proche.length > 0) && j.length === 2, '3.4 : l’idée seulement proposée, issue de ces données, est retirée');
v.verifier(j.some((l) => l.attention_title === 'Un livre choisi pour lui'), '3.5 : l’idée d’avant l’autorisation, faite des données du pilote, est intacte');
const qr = (await P.client.from('questionnaire_responses').select('things_to_avoid').eq('contact_id', k).single()).data!;
v.verifier(qr.things_to_avoid === 'les huîtres', '3.6 : ce que le pilote a fourni lui-même n’est pas touché');
const s2 = await stocke(P2, k2);
v.verifier(s2.ideas.length === 1 && s2.a_recalculer === false, '3.7 : la recommandation de l’AUTRE pilote, dont l’autorisation n’a pas bougé, est intacte');
// Ce qui s'AFFICHE.
let page = await poster(`/contacts/${k}`, cP, null, 'GET');
v.verifier(page.status === 200 && !INTERDIT.test(page.texte), '3.8 : la page de la fiche n’affiche plus les idées retirées');
// Ce qui PART AU MODÈLE au recalcul.
await dicter([idee('Une promenade au marché')]);
r = await generer(cP, k);
s = await stocke(P, k);
console.log('  recalcul → provenance :', s.portees_proche, '· « arachide » envoyé au modèle :', /arachide/.test(r.envoye), '· « porc » (régime, toujours autorisé) :', /porc/.test(r.envoye));
v.verifier(r.status === 200 && !/arachide/.test(r.envoye) && /porc/.test(r.envoye), '3.9 : le recalcul n’emploie plus l’allergie ; le régime, toujours autorisé, sert encore');
v.verifier(!INTERDIT.test(r.envoye), '3.10 : les anciennes idées ne reviennent pas par « déjà proposé »');
v.verifier(JSON.stringify(s.portees_proche) === '["reco:regime"]' && s.a_recalculer === false && s.ideas.length === 1, '3.11 : nouvelle recommandation enregistrée, provenance à jour');

console.log('\n══ 4. LES AUTRES CHEMINS DE RETRAIT');
await regler(cB, k, 'retirer', 'reco:regime');
s = await stocke(P, k);
v.verifier(s.ideas.length === 0 && s.a_recalculer === true, '4.1 : retrait de la dernière autorisation → indisponible');
await regler(cB, k, 'autoriser', 'reco:regime'); await dicter([idee('Un dîner halal')]); await generer(cP, k);
await P.client.from('contacts').update({ proche_user_id: X.userId }).eq('id', k);
s = await stocke(P, k);
v.verifier(s.ideas.length === 0 && s.a_recalculer === true && !INTERDIT.test(JSON.stringify(await journal(P, k))), '4.2 : le pilote rattache la fiche à un AUTRE compte → ce qui venait du premier est retiré');
await P.client.from('contacts').update({ proche_user_id: B.userId }).eq('id', k);
await dicter([idee('Un dîner halal')]); await generer(cP, k);
v.verifier((await stocke(P, k)).ideas.length === 1, '4.3 : (contrôle) de retour sur le bon compte, l’autorisation toujours active sert de nouveau');
const rpc = await P.client.rpc('purger_derives_du_proche', { p_pilote: P2.userId, p_contact: k2 });
v.verifier(!!rpc.error && (await stocke(P2, k2)).ideas.length === 1, '4.4 : personne ne peut appeler la purge de l’extérieur pour vider les recommandations d’un autre', rpc.error?.message ?? 'aucune erreur');

console.log('\n══ 5. RETRAIT PENDANT UNE GÉNÉRATION');
await m('/__attente', { ms: 4000 });
await dicter([idee('Un dîner halal, lancé avant le retrait')], [idee('Une idée recalculée, sans rien du proche')]);
const avant5 = (await recus()).length;
const enCours = poster('/api/recommendations/generate', cP, { contactId: k });   // lancée, non attendue
await new Promise((ok) => setTimeout(ok, 1500));
const retrait = await regler(cB, k, 'retirer', 'reco:regime');                    // le proche retire PENDANT
const rep = await enCours;
await m('/__attente', { ms: 0 });
s = await stocke(P, k); j = await journal(P, k);
console.log('  génération lancée, retrait 1,5 s après (HTTP', retrait.status, ') → réponse HTTP', rep.status, '· idée issue du proche dans la réponse :', INTERDIT.test(rep.texte));
v.verifier(rep.status === 409 && !INTERDIT.test(rep.texte), '5.1 : la réponse partie avant le retrait n’est PAS publiée (409, sans contenu)');
v.verifier(s.ideas.length === 0 && !INTERDIT.test(JSON.stringify(s)) && !j.some((l) => INTERDIT.test(l.attention_title)), '5.2 : rien de cette génération n’est enregistré, ni dans la recommandation ni dans le journal');
r = await generer(cP, k);
v.verifier(r.status === 200 && !/porc|arachide/.test(r.envoye) && !INTERDIT.test(r.envoye) && /recalculée/.test(r.texte), '5.3 : la relance (ce que fait l’écran) recalcule sans rien du proche', r.envoye.match(INTERDIT)?.[0] ?? '');
void avant5;

console.log('\n══ 6. EFFACEMENT DU COMPTE DU PROCHE');
await regler(cB, k, 'autoriser', 'reco:regime'); await dicter([idee('Un dîner halal')]); await generer(cP, k);
v.verifier((await stocke(P, k)).portees_proche.length === 1, '6.0 : (contrôle) une recommandation dépend de nouveau du proche');
const { error: eSup } = await admin.auth.admin.deleteUser(B.userId);
s = await stocke(P, k); const s2b = await stocke(P2, k2);
v.verifier(!eSup && s.ideas.length === 0 && s.a_recalculer === true && s2b.ideas.length === 0, '6.1 : le compte effacé, ce qui avait été calculé avec ses données est retiré — chez les deux pilotes', eSup?.message ?? '');
v.verifier((await journal(P, k)).some((l) => l.status === 'done'), '6.2 : l’attention réalisée par le pilote existe toujours');
v.bilan();
