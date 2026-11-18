// PREUVE — partage PAR ÉLÉMENT : deux allergies dont une seule autorisée, puis le retrait.
// Vraies routes : la demande, la réponse du propriétaire, la fiche vue par le destinataire.
// On regarde ce qui est ENVOYÉ AU NAVIGATEUR du destinataire (toute la page, données comprises).
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';
const { admin } = pileLocale();
const v = verificateur();
const O = await compteLocal('partage-proprietaire'), X = await compteLocal('partage-destinataire'), T = await compteLocal('partage-tiers');
const cO = await cookiesDe(O.email, O.motDePasse), cX = await cookiesDe(X.email, X.motDePasse), cT = await cookiesDe(T.email, T.motDePasse);
const { error: eP } = await O.client.from('my_profile').upsert({ user_id: O.userId,
  practical_info: { allergies: ['gluten', 'fruits_a_coque'], allergies_detail: 'kiwi, réaction forte', regime: 'halal', alcool: 'ne_bois_pas', taille_vetements: '38' } }, { onConflict: 'user_id' });
if (eP) throw eP;
// Le destinataire doit avoir rempli son propre questionnaire pour consulter une fiche.
{
  const { error } = await X.client.from('my_profile').upsert({ user_id: X.userId, attention_reception: { x: 1 }, temperament_axes: { x: 1 }, lifestyle_axes: { x: 1 }, singularity_answers: { adore_faire: 'lire' }, practical_info: { prenom: 'Xavier' } }, { onConflict: 'user_id' });
  if (error) throw error;
}
// X demande à voir la fiche de O (parcours réel : une ligne en attente créée par le demandeur).
const { data: dem, error: eD } = await X.client.from('contact_consents').insert({ pilote_id: O.userId, proche_user_id: X.userId, requested_by: X.userId, status: 'pending', kind: 'profile_view', scope: ['socle'] }).select('id').single();
if (eD) throw eD;
const fiche = async (cookie: string) => { const r = await poster(`/fiche/${dem!.id}`, cookie, null, 'GET'); return { status: r.status, t: r.texte }; };
const voit = (t: string) => ({ gluten: /gluten/i.test(t), fruits_a_coque: /fruits à coque/i.test(t), kiwi: /kiwi/i.test(t), halal: /halal/i.test(t), alcool: /ne boit pas/i.test(t), taille: />38<|"38"|38 ·|: ?"?38/.test(t) });

// 1. O répond en n'autorisant qu'UNE allergie (et tente d'en glisser une qu'il n'a pas).
let r = await poster(`/api/profile-view/${dem!.id}/respond`, cX, { action: 'all' });
v.verifier(r.status === 404, '1 : le DEMANDEUR ne peut pas répondre à sa propre demande', `HTTP ${r.status}`);
r = await poster(`/api/profile-view/${dem!.id}/respond`, cT, { action: 'all' });
v.verifier(r.status === 404, '1 : un TIERS non plus', `HTTP ${r.status}`);
r = await poster(`/api/profile-view/${dem!.id}/respond`, cO, { action: 'sections', sections: ['facts_allergies:gluten', 'facts_allergies:arachide'] });
let ligne = (await admin.from('contact_consents').select('status, scope, granted_by').eq('id', dem!.id).single()).data!;
console.log('1. le propriétaire autorise UNE allergie → HTTP', r.status, '· portée enregistrée :', ligne.scope);
v.verifier(r.status === 200 && JSON.stringify(ligne.scope) === '["facts_allergies:gluten"]' && ligne.granted_by === O.userId, '1 : seule l’allergie réellement déclarée et cochée est dans la portée ; accord attesté');

let f = await fiche(cX);
console.log('   fiche vue par le destinataire → HTTP', f.status, voit(f.t));
v.verifier(f.status === 200 && voit(f.t).gluten, '2 : le destinataire voit l’allergie autorisée (gluten)');
v.verifier(!voit(f.t).fruits_a_coque && !voit(f.t).kiwi, '2 : il ne reçoit NI l’autre allergie (fruits à coque), NI la précision libre (kiwi)');
v.verifier(!voit(f.t).halal && !voit(f.t).alcool, '2 : ni le régime, ni le rapport à l’alcool');
v.verifier(!/aucune allergie|pas d.allergie|sans allergie/i.test(f.t), '2 : rien n’affirme qu’il n’y a pas d’autre allergie');
const fT = await fiche(cT);
v.verifier(!/gluten/i.test(fT.t), '2 : un tiers n’a pas accès à cette fiche', `HTTP ${fT.status}`);

// 2. Le propriétaire ajoute une allergie APRÈS le partage : elle n'est pas partagée.
await O.client.from('my_profile').update({ practical_info: { allergies: ['gluten', 'fruits_a_coque', 'lactose'], allergies_detail: 'kiwi, réaction forte', regime: 'halal', alcool: 'ne_bois_pas' } }).eq('user_id', O.userId);
f = await fiche(cX);
v.verifier(voit(f.t).gluten && !/lactose/i.test(f.t), '3 : une allergie ajoutée après le partage n’est pas partagée');

// 3. RETRAIT de l'allergie autorisée (le propriétaire restreint ce qu'il partage).
const { error: eR } = await O.client.from('contact_consents').update({ scope: ['socle'] }).eq('id', dem!.id);
f = await fiche(cX);
console.log('3. le propriétaire retire l’allergie →', eR?.message ?? 'accepté', '· fiche :', f.status, voit(f.t));
v.verifier(!eR && !voit(f.t).gluten && !voit(f.t).fruits_a_coque, '4 : après le retrait, plus aucune allergie n’est envoyée au destinataire');
v.verifier(!/aucune allergie|pas d.allergie|sans allergie/i.test(f.t), '4 : et rien n’affirme une absence d’allergie');
// Le destinataire ne peut pas se la rendre.
const q = await X.client.from('contact_consents').update({ scope: ['socle', 'facts_allergies:gluten'] }).eq('id', dem!.id).select('id');
v.verifier(!!q.error || (q.data ?? []).length === 0, '5 : le destinataire ne peut pas élargir lui-même ce qu’il voit', q.error?.message);
// 4. RÉVOCATION complète.
r = await poster(`/api/profile-view/${dem!.id}/revoke`, cO, {});
f = await fiche(cX);
console.log('4. révocation → HTTP', r.status, '· fiche pour le destinataire : HTTP', f.status);
v.verifier(!/gluten|halal|fruits à coque/i.test(f.t), '6 : après révocation, la fiche ne livre plus rien');
v.bilan();
