// PREUVE — désigner un compte n'est pas être lié à lui (migration 113), et la relance ne part
// que vers un compte qui a lui-même accepté le lien.
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';
const { admin } = pileLocale();
const v = verificateur();
const P = await compteLocal('lien-pilote'), V = await compteLocal('lien-designe');
const cP = await cookiesDe(P.email, P.motDePasse);
const lire = async (id: string) => (await admin.from('contacts').select('proche_user_id, proche_lien_confirme_par, proche_lien_confirme_le').eq('id', id).single()).data!;

// Le pilote désigne V et tente de confirmer lui-même le lien.
let r: any = await P.client.from('contacts').insert({ user_id: P.userId, name: 'Vera <b>Test</b>', relationship: 'friend', proche_user_id: V.userId, proche_lien_confirme_par: V.userId, proche_lien_confirme_le: new Date().toISOString() }).select('id').single();
const id = r.data.id as string; let l = await lire(id);
console.log('le pilote désigne V en glissant une fausse confirmation →', l);
v.verifier(l.proche_user_id === V.userId && l.proche_lien_confirme_par === null, '1 : désigner reste possible ; la fausse confirmation est effacée par la base');
await P.client.from('contacts').update({ proche_lien_confirme_par: V.userId }).eq('id', id);
v.verifier((await lire(id)).proche_lien_confirme_par === null, '2 : le pilote ne peut pas confirmer le lien par une mise à jour');

// La relance vers un compte seulement DÉSIGNÉ.
const pushAvant = ((await admin.from('notification_log').select('id').eq('user_id', V.userId)).data ?? []).length;
let n = await poster('/api/invite/nudge', cP, { contactId: id });
console.log('relance vers un compte seulement désigné → HTTP', n.status, JSON.stringify(n.json));
v.verifier(n.status === 200 && (n.json as any).reason === 'lien_non_confirme', '3 : aucune notification ni courriel vers un compte qui n’a pas accepté le lien');
v.verifier(((await admin.from('notification_log').select('id').eq('user_id', V.userId)).data ?? []).length === pushAvant, '3 bis : rien n’est journalisé comme envoyé à V');

// Le serveur confirme pour le BON compte (acceptation d'invitation) ; pas pour un autre.
r = await admin.from('contacts').update({ proche_lien_confirme_par: P.userId }).eq('id', id).select('id');
v.verifier(!!r.error, '4 : même le serveur ne peut pas attribuer la confirmation à un autre compte que celui désigné', r.error?.message);
r = await admin.from('contacts').update({ proche_user_id: V.userId, proche_lien_confirme_par: V.userId }).eq('id', id).select('id');
l = await lire(id);
v.verifier(!r.error && l.proche_lien_confirme_par === V.userId && !!l.proche_lien_confirme_le, '5 : acceptation par le compte désigné (parcours serveur) → lien confirmé, daté');
// Le pilote repointe vers un autre compte : la confirmation tombe.
await P.client.from('contacts').update({ proche_user_id: P.userId }).eq('id', id);
l = await lire(id);
v.verifier(l.proche_lien_confirme_par === null, '6 : changer le compte désigné fait tomber la confirmation');
n = await poster('/api/invite/nudge', cP, { contactId: id });
v.verifier((n.json as any).reason === 'lien_non_confirme', '7 : et la relance redevient impossible');
v.bilan();
