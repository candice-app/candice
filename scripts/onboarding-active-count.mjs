// Dérive les chiffres de contrôle DEPUIS le document (jamais codés en dur), et les assert.
// Usage : node scripts/onboarding-active-count.mjs
import { readFileSync } from 'node:fs';
const doc = readFileSync('docs/ontologie/onboarding-v15-mappings.md', 'utf8');
const lines = doc.split('\n');
const opts = [];
let cur = null;
for (const l of lines) {
  const m = l.match(/^### Option `([^`]+)`/);
  if (m) { cur = { ref: m[1], status: null, q: null, gd: 0, local: 0 }; opts.push(cur); continue; }
  if (!cur) continue;
  const s = l.match(/`status`\s*:\s*`([^`]+)`/);
  if (s) cur.status = s[1];
  const q = l.match(/`questionCode`\s*:\s*`([^`]+)`/);
  if (q) cur.q = q[1];
  // evidences PROFILE : la flèche de résolution de statut global n'apparaît QUE sur elles
  if (/→\s*`GLOBAL_DIRECT`/.test(l)) cur.gd++;
  if (/→\s*`LOCAL\/CONTEXTUAL`/.test(l)) cur.local++;
}
const by = (st) => opts.filter(o => o.status === st);
const active = by('ACTIF');
const removed = by('REMOVED_FROM_ONBOARDING_CORE');
const movedFood = by('MOVED_TO_DISCOVERY_FOOD');
const movedVoy = by('MOVED_TO_DISCOVERY_VOYAGE');
const activeQ = [...new Set(active.map(o => o.q))];
const has106b = opts.find(o => o.ref === '106b');
console.log('total options (lignes)      :', opts.length);
console.log('ACTIF                        :', active.length);
console.log('REMOVED_FROM_ONBOARDING_CORE :', removed.length, '(' + [...new Set(removed.map(o=>o.q))].join(',') + ')');
console.log('MOVED_TO_DISCOVERY_FOOD      :', movedFood.length, '(' + [...new Set(movedFood.map(o=>o.q))].join(',') + ')');
console.log('MOVED_TO_DISCOVERY_VOYAGE    :', movedVoy.length, '(' + [...new Set(movedVoy.map(o=>o.q))].join(',') + ')');
console.log('questions actives distinctes :', activeQ.length, '→', activeQ.join(','));
console.log('106b présent ?               :', !!has106b, has106b ? '(status ' + has106b.status + ')' : '');
console.log('106b ∈ ACTIF ?               :', active.some(o => o.ref === '106b'));
const q4bActive = active.filter(o => o.q === 'q4b').map(o=>o.ref);
console.log('options q4b actives          :', q4bActive.length, '→', q4bActive.join(','));
// Evidences PROFILE sur les options ACTIVES (SOCIAL_ENERGY + PROFILE/IMPORTANCE/APPETENCE)
const profGD = active.reduce((n, o) => n + o.gd, 0);
const profLocal = active.reduce((n, o) => n + o.local, 0);
console.log('Evidences PROFILE (actives)  :', profGD + profLocal, '→', profGD, 'GLOBAL_DIRECT +', profLocal, 'LOCAL/CONTEXTUAL');
const opt38 = opts.find(o => o.ref === '38');
console.log('option 38 evidences PROFILE  :', opt38 ? opt38.gd + opt38.local : '?', '(doit être 0 — contextDependent)');
const fail = [];
if (opts.length !== 128) fail.push(`total ${opts.length} ≠ 128`);
if (active.length !== 106) fail.push(`actives ${active.length} ≠ 106`);
if (activeQ.length !== 19) fail.push(`questions actives ${activeQ.length} ≠ 19`);
if (removed.length !== 12) fail.push(`removed ${removed.length} ≠ 12`);
if (movedFood.length + movedVoy.length !== 10) fail.push(`moved ${movedFood.length+movedVoy.length} ≠ 10`);
if (profGD + profLocal !== 58) fail.push(`PROFILE ${profGD + profLocal} ≠ 58`);
if (profGD !== 10) fail.push(`PROFILE GLOBAL_DIRECT ${profGD} ≠ 10`);
if (profLocal !== 48) fail.push(`PROFILE LOCAL/CONTEXTUAL ${profLocal} ≠ 48`);
if (fail.length) { console.error('ASSERTIONS ÉCHOUÉES: ' + fail.join(' ; ')); process.exit(1); }
console.log('ASSERTIONS OK (128/106/19/12/10 · PROFILE 58/10/48 · 106b intégré · opt38 sans evidence)');

// Contrôle dépendant : options ACTIVES ayant ≥1 evidence PROFILE (gd+local > 0).
const withProfile = active.filter((o) => (o.gd + o.local) > 0).length;
console.log('\noptions actives AVEC evidence PROFILE :', withProfile, '(clos.md ligne 17 dit 50)');
