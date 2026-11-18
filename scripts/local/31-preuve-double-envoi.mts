// DOUBLE ENVOI ET RÉPONSE MODIFIÉE — vraie route HTTP, pile locale.
// Répondre deux fois la même chose à une question fermée ne doit écrire qu'une source et ne
// doubler aucune preuve ; répondre autre chose supersède l'ancienne réponse sans l'effacer.
import { compteLocal, verificateur } from './_compte-local.mts';
import { cookiesDe, poster } from './_session-http.mts';
import { lirePortrait } from '../../src/lib/knowledge/portrait.ts';
const v = verificateur();
const c = await compteLocal('double-envoi'); const cookie = await cookiesDe(c.email, c.motDePasse);
const corps = (answer: string[]) => ({ sessionId: null, pendingKeys: ['food2.0859'], currentIndex: 0, mode: 'full', questionKey: 'food2.0859', answer });
const etat = async () => {
  const s = (await c.client.from('knowledge_sources').select('id').eq('user_id', c.userId).eq('question_code', 'food2.0859')).data ?? [];
  const e = s.length ? ((await c.client.from('knowledge_evidences').select('id, superseded_at, preference_value').in('source_id', s.map((x) => x.id))).data ?? []) : [];
  return { sources: s.length, preuves: e.length, vivantes: e.filter((x) => x.superseded_at === null).map((x) => x.preference_value).sort() };
};
const r1 = await poster('/api/discovery/answer', cookie, corps(['r2', 'r7']));
const a = await etat();
v.verifier(r1.status === 200 && a.sources === 1 && a.preuves === 2, 'première réponse : une source, deux preuves', JSON.stringify(a));
const r2 = await poster('/api/discovery/answer', cookie, corps(['r7', 'r2']));
const b = await etat();
v.verifier(r2.status === 200 && b.sources === 1 && b.preuves === 2, 'la même réponse renvoyée (ordre différent) : toujours une source, deux preuves', JSON.stringify(b));
const r3 = await poster('/api/discovery/answer', cookie, corps(['r9']));
const d = await etat();
v.verifier(r3.status === 200 && d.sources === 2 && d.preuves === 3 && d.vivantes.length === 1, 'une réponse différente : nouvelle source ; l’ancienne est conservée, supersédée', JSON.stringify(d));
const p = await lirePortrait(c.client as never, { userId: c.userId });
const vals = p.preferences.filter((x) => String(x.path) === 'PREFERENCE.food.gift_format' || String(x.path).startsWith('PREFERENCE.food')).flatMap((x) => x.values);
v.verifier(vals.length === 1, 'le portrait ne retient que le dernier mot', JSON.stringify(vals));
const r4 = await poster('/api/discovery/answer', cookie, corps(['r2', 'r7']));
const f = await etat();
v.verifier(r4.status === 200 && f.sources === 3 && f.vivantes.length === 2, 'revenir à la première réponse : un nouveau dernier mot, sa propre source', JSON.stringify(f));
v.bilan();
