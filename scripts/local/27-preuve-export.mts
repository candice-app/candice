// PREUVE — l'export de ses données : complet, et sans les données des autres.
// Un vrai export, téléchargé par la vraie route, sur des comptes fictifs.
import { execFileSync } from 'node:child_process';
import { compteLocal, pileLocale, verificateur } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';
const { admin } = pileLocale();
const v = verificateur();
const BASE = process.env.BASE_LOCALE ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
if (!/@127\.0\.0\.1:54322\//.test(BASE)) throw new Error('base locale uniquement');
const sql = (q: string) => execFileSync('psql', [BASE, '-At', '-v', 'ON_ERROR_STOP=1', '-c', q], { encoding: 'utf8' }).trim();
const ok = async (p: PromiseLike<{ error: { message: string } | null }>, quoi: string) => { const { error } = await p; if (error) throw new Error(`${quoi} : ${error.message}`); };

const M = await compteLocal('export-moi'), B = await compteLocal('export-proche'), A = await compteLocal('export-autre-pilote'), R = await compteLocal('export-lecteur');
const cM = await cookiesDe(M.email, M.motDePasse), cB = await cookiesDe(B.email, B.motDePasse);
// ── CE QUI EST À MOI ────────────────────────────────────────────────────────────────────────
await ok(M.client.from('my_profile').upsert({ user_id: M.userId, practical_info: { prenom: 'Moi', note: 'MON-PROFIL' } }, { onConflict: 'user_id' }), 'profil');
const { data: k } = await M.client.from('contacts').insert({ user_id: M.userId, name: 'Bruno MA-FICHE', relationship: 'friend' }).select('id').single();
await M.client.from('contacts').update({ proche_user_id: B.userId }).eq('id', k!.id);
await ok(M.client.from('questionnaire_responses').insert({ user_id: M.userId, contact_id: k!.id, things_to_avoid: 'MON-QUESTIONNAIRE', data_source: 'pilot_input' }), 'questionnaire');
await ok(M.client.from('profile_notes').insert({ user_id: M.userId, contact_id: k!.id, note: 'MA-NOTE' }), 'note');
await ok(M.client.from('my_wishlist_items').insert({ user_id: M.userId, title: 'MON-ENVIE' }), 'envie');
await ok(M.client.from('carnet_envies_items').insert({ pilot_id: M.userId, contact_id: k!.id, description: 'MON-CARNET' }), 'carnet');
await ok(M.client.from('person_states').insert({ subject_kind: 'pilot', subject_user_id: M.userId, declared_by: M.userId, state: 'fatigue', note_free: 'MON-ETAT' }), 'état');
// Souvenir et journal de connaissance : par les vraies routes (modèle simulé pour la lecture).
const MODELE = process.env.ANTHROPIC_BASE_URL!;
await fetch(`${MODELE}/__raz`, { method: 'POST', body: '{}' });
sql(`insert into memories (pilot_id, contact_id, type, status, raw_input, sanitized_summary) values ('${M.userId}', '${k!.id}', 'situation', 'actif', 'MON-SOUVENIR brut', 'MON-SOUVENIR')`);
sql(`insert into knowledge_sources (id, user_id, about_kind, about_id, source_type, assertion_status, raw_text, ts) values (gen_random_uuid(), '${M.userId}', 'account', '${M.userId}', 'discovery_open', 'explicit', 'MON-JOURNAL-VERBATIM', now())`);
// Plus de mille lignes dans une table : l'export ne doit pas s'arrêter à mille.
sql(`insert into attention_log (user_id, contact_id, attention_title, attention_type, status) select '${M.userId}', '${k!.id}', 'LIGNE-' || g, 'CAD_C', 'proposed' from generate_series(1, 1250) g`);
// Mes consentements : je partage ma fiche à R ; B m'a autorisé un usage (ce réglage ne m'appartient PAS).
const { data: dem } = await R.client.from('contact_consents').insert({ pilote_id: M.userId, proche_user_id: R.userId, requested_by: R.userId, status: 'pending', kind: 'profile_view', scope: [] }).select('id').single();
await poster(`/api/profile-view/${dem!.id}/respond`, cM, { action: 'sections', sections: ['deep_miss'] });
await poster('/api/consent/exclusions', cB, { contactId: k!.id, action: 'autoriser', portee: 'reco:regime' });
// ── CE QUI EST AUX AUTRES ───────────────────────────────────────────────────────────────────
// Un autre pilote me tient pour proche, et écrit sur moi.
const { data: ka } = await A.client.from('contacts').insert({ user_id: A.userId, name: 'FICHE-D-UN-AUTRE-SUR-MOI', relationship: 'friend' }).select('id').single();
await A.client.from('contacts').update({ proche_user_id: M.userId }).eq('id', ka!.id);
await A.client.from('profile_notes').insert({ user_id: A.userId, contact_id: ka!.id, note: 'NOTE-D-UN-AUTRE-SUR-MOI' });
await A.client.from('profile_analysis').insert({ user_id: A.userId, contact_id: ka!.id, summary: 'ANALYSE-D-UN-AUTRE-SUR-MOI' });
// Quelqu'un a réservé une de mes envies (surprise).
sql(`update my_wishlist_items set reservation_status = 'intended', reserved_by = '${A.userId}', reserved_at = now() where user_id = '${M.userId}'`);
await B.client.from('my_profile').upsert({ user_id: B.userId, practical_info: { prenom: 'Bruno', vetos: { halal: true }, note: 'PROFIL-DU-PROCHE' } }, { onConflict: 'user_id' });

const r = await poster('/api/account/export-download', cM, null, 'GET');
const t = r.texte; const e = r.json as any;
console.log('export → HTTP', r.status, '·', Math.round(t.length / 1024), 'ko ·', Object.keys(e?.donnees ?? {}).length, 'rubriques');
v.verifier(r.status === 200 && e?.version === 2 && (e?.lectures_incompletes ?? ['?']).length === 0, '0 : l’export est constitué en entier (aucune lecture incomplète)', JSON.stringify(e?.lectures_incompletes ?? e)?.slice(0, 300));

console.log('\n══ COMPLET');
for (const [marque, quoi] of [['MON-PROFIL', 'mon profil'], ['MA-FICHE', 'mes proches'], ['MON-QUESTIONNAIRE', 'ce que j’ai saisi sur un proche'], ['MA-NOTE', 'mes notes'], ['MON-ENVIE', 'mes envies'], ['MON-CARNET', 'le Carnet d’envies'], ['MON-ETAT', 'mes états déclarés'], ['MON-SOUVENIR', 'mes souvenirs'], ['MON-JOURNAL-VERBATIM', 'le journal de connaissance']] as const)
  v.verifier(t.includes(marque), `présent : ${quoi}`);
v.verifier((e.donnees.journal_des_attentions ?? []).length === 1250, 'une table de 1 250 lignes sort en entier (pas de coupe à mille)', String((e.donnees.journal_des_attentions ?? []).length));
const cons = (e.consentements ?? []) as any[];
v.verifier(cons.some((c) => c.type === 'profile_view' && c.ton_role === 'tu partages ta fiche' && c.accorde_par_toi === true && JSON.stringify(c.portee) === '["deep_miss"]'), 'présent : le partage de fiche que j’ai accordé, avec sa portée et la preuve que c’est moi');
const exportB = (await poster('/api/account/export-download', cB, null, 'GET')).json as any;
v.verifier((exportB.consentements as any[]).some((c) => c.type === 'profile_usage' && c.ton_role === 'tu autorises l’usage de tes données' && JSON.stringify(c.portee) === '["reco:regime"]'), 'le PROCHE, lui, retrouve dans SON export l’autorisation qu’il a donnée');

console.log('\n══ SANS LES DONNÉES DES AUTRES');
v.verifier(!cons.some((c) => c.type === 'profile_usage') && !t.includes('reco:regime'), 'absent : ce que mon proche a autorisé à Candice (son réglage ne m’est pas révélé)');
for (const id of [B.userId, A.userId, R.userId]) v.verifier(!t.includes(id), `absent : l’identifiant d’un autre compte (${id === B.userId ? 'mon proche' : id === A.userId ? 'l’autre pilote, qui a aussi réservé mon envie' : 'le lecteur de ma fiche'})`);
v.verifier(![B.email, A.email, R.email].some((m) => t.includes(m)), 'absent : l’adresse d’un autre');
v.verifier(!/reserved_by|reservation_status|reserved_at/.test(t), 'absent : le fait que mon envie a été réservée, et par qui');
v.verifier(!/D-UN-AUTRE-SUR-MOI/.test(t), 'absent : la fiche, la note et l’analyse qu’un autre pilote tient sur moi');
v.verifier(!t.includes('PROFIL-DU-PROCHE'), 'absent : le profil de mon proche');
v.verifier(!/token_hash|p256dh|auth_key/.test(t), 'absent : empreintes de jetons et clés de notification');
v.verifier(Array.isArray(e.non_inclus) && e.non_inclus.length === 5, 'le fichier DIT ce qu’il ne contient pas, par catégorie');
const k1 = (e.tes_proches as any[])[0];
v.verifier(k1.rattachee_a_un_compte === true && !('proche_user_id' in k1), 'ma fiche dit qu’elle est rattachée à un compte, sans dire lequel');
v.verifier((await poster('/api/account/export-download', null, null, 'GET')).status === 401, 'sans session : 401');
v.bilan();
