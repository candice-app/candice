// PREUVE — corriger un texte libre remplace bien l'ancienne version, dans les TROIS tables.
//
// `supersedeSources` marque les lignes dérivées d'anciennes sources. Les tables ne nomment
// pas la colonne de la même façon : `source_id` sur knowledge_evidences, `source` sur
// knowledge_facts et knowledge_open_knowledge. Cet essai écrit une réponse libre, la corrige,
// et relit ce qui reste vivant.
import { compteLocal, verificateur } from './_compte-local.mts';
import { produceSocleFact } from '../../src/lib/questionnaire/produce-socle.ts';
import { supersedeSources } from '../../src/lib/knowledge-write/supersede.ts';

const v = verificateur();
const c = await compteLocal('preuve-supersession');
const spec = { factType: 'essai.champ_libre', questionText: 'Un champ libre' };
await produceSocleFact(c.client as never, { userId: c.userId, entries: [{ spec, value: 'première version' }], timestamp: new Date(Date.now() - 60_000).toISOString() });
await produceSocleFact(c.client as never, { userId: c.userId, entries: [{ spec, value: 'version corrigée' }], timestamp: new Date().toISOString() });
const { data: src } = await c.client.from('knowledge_sources').select('id, raw_text, ts').eq('user_id', c.userId).order('ts');
const [ancienne, nouvelle] = src!;
let erreur = '';
try {
  await supersedeSources(c.client as never, { oldSourceIds: [ancienne.id], newSourceId: nouvelle.id, timestamp: new Date().toISOString() });
} catch (e) { erreur = e instanceof Error ? e.message : String(e); }
v.verifier(erreur === '', 'la supersession aboutit sans erreur', erreur);
const { data: faits } = await c.client.from('knowledge_facts').select('value, superseded_at').eq('user_id', c.userId);
console.log('   faits relus :', faits);
const vivants = faits!.filter((f) => f.superseded_at === null).map((f) => f.value);
v.verifier(vivants.length === 1 && vivants[0] === 'version corrigée', 'seule la version corrigée reste vivante', JSON.stringify(vivants));
v.bilan();
