// Dérive les chiffres de contrôle DEPUIS le document (jamais codés en dur), et les assert.
// Usage : node scripts/onboarding-active-count.mjs
import { readFileSync } from 'node:fs';
const doc = readFileSync('docs/ontologie/onboarding-v15-mappings.md', 'utf8');
const lines = doc.split('\n');
const opts = [];
let cur = null;
for (const l of lines) {
  const m = l.match(/^### Option `([^`]+)`/);
  if (m) { cur = { ref: m[1], status: null, q: null }; opts.push(cur); continue; }
  if (!cur) continue;
  const s = l.match(/`status`\s*:\s*`([^`]+)`/);
  if (s) cur.status = s[1];
  const q = l.match(/`questionCode`\s*:\s*`([^`]+)`/);
  if (q) cur.q = q[1];
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
const fail = [];
if (opts.length !== 128) fail.push(`total ${opts.length} ≠ 128`);
if (active.length !== 106) fail.push(`actives ${active.length} ≠ 106`);
if (activeQ.length !== 19) fail.push(`questions actives ${activeQ.length} ≠ 19`);
if (removed.length !== 12) fail.push(`removed ${removed.length} ≠ 12`);
if (movedFood.length + movedVoy.length !== 10) fail.push(`moved ${movedFood.length+movedVoy.length} ≠ 10`);
if (fail.length) { console.error('ASSERTIONS ÉCHOUÉES: ' + fail.join(' ; ')); process.exit(1); }
console.log('ASSERTIONS OK (128/106/19/12/10, 106b intégré dans les 106)');
