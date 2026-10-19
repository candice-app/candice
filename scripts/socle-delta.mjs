// CONFORMITÉ ÉCRAN → CANONIQUE (socle). Méthode obligatoire : on part de ce qui est RENDU À
// L'ÉCRAN (banques UI effectivement affichées) et on remonte vers le document d'autorité V15
// (onboarding.ts, conforme à onboarding-v15-mappings.md). Lecture seule, aucun effet.
//
//   node scripts/socle-delta.mjs
//
// Chaque chiffre imprimé porte, en commentaire, la commande qui le dérive.

import { readFileSync } from 'node:fs';

const norm = (s) =>
  s.normalize('NFC')
    .replace(/[’ʼ‘`´]/g, "'") // apostrophes typographiques → droite (sinon faux négatifs)
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .replace(/[(),.:;!?]/g, '')
    .trim()
    .toLowerCase();

// ── CANONIQUE : onboarding.ts → {questionCode: [{text, status}]} ─────────────
// cmd: grep -oE 'optionRef: "[^"]+"' src/lib/knowledge/onboarding.ts | wc -l  → total options
function parseCanonical() {
  const ob = readFileSync('src/lib/knowledge/onboarding.ts', 'utf8');
  const re =
    /optionRef: "([^"]+)",\s*\n\s*questionCode: "([^"]+)",\s*\n\s*questionText: "(?:[^"\\]|\\.)*",\s*\n\s*optionText: "((?:[^"\\]|\\.)*)",\s*\n\s*domain: "[^"]*",\s*\n\s*status: "([^"]+)"/g;
  const byQ = {};
  let m;
  while ((m = re.exec(ob))) {
    (byQ[m[2]] ||= []).push({ ref: m[1], text: m[3].replace(/\\"/g, '"'), active: m[4] === 'ACTIF' });
  }
  return byQ;
}

// ── ÉCRAN : les 3 banques UI effectivement rendues ──────────────────────────
// cmd: grep -c "label: '" src/lib/attention/questions.ts src/lib/temperament/questions.ts src/lib/lifestyle/questions.ts
function parseScreen() {
  const files = ['src/lib/attention/questions.ts', 'src/lib/temperament/questions.ts', 'src/lib/lifestyle/questions.ts'];
  const labels = [];
  for (const f of files) {
    for (const l of readFileSync(f, 'utf8').split('\n')) {
      const mm = l.match(/label: '((?:[^'\\]|\\.)*)'/);
      if (mm) labels.push(mm[1].replace(/\\'/g, "'"));
    }
  }
  return labels;
}

const canon = parseCanonical();
const screen = parseScreen();
const screenSet = new Set(screen.map(norm));

// ── Delta par question, SUR LES OPTIONS ACTIVES (les inactives ne doivent pas être rendues) ──
let identique = 0, partielle = 0, absente = 0, totalActive = 0, rendues = 0;
const gaps = [];
const rows = [];
for (const q of Object.keys(canon)) {
  const act = canon[q].filter((o) => o.active);
  totalActive += act.length;
  const matched = act.filter((o) => screenSet.has(norm(o.text))).length;
  rendues += matched;
  const verdict = matched === act.length ? 'IDENTIQUE' : matched === 0 ? 'ABSENTE' : 'PARTIELLE';
  if (verdict === 'IDENTIQUE') identique++;
  else { verdict === 'ABSENTE' ? absente++ : partielle++; gaps.push(`${q} ${matched}/${act.length}`); }
  rows.push(`${q.padEnd(5)} | ${String(act.length).padStart(2)} actives | ${String(matched).padStart(2)} rendues | ${verdict}`);
}

// ── Sens inverse : chaque libellé rendu est-il actif-canon, inactif-canon (traînard), ou étranger ? ──
const canonActiveSet = new Set(Object.values(canon).flatMap((o) => o.filter((x) => x.active).map((x) => norm(x.text))));
const canonAllSet = new Set(Object.values(canon).flatMap((o) => o.map((x) => norm(x.text))));
const screenUniq = [...new Set(screen)];
const stragglers = screenUniq.filter((s) => !canonActiveSet.has(norm(s)) && canonAllSet.has(norm(s))); // inactif-canon, encore rendu
const foreign = screenUniq.filter((s) => !canonAllSet.has(norm(s))); // vraiment étranger au V15

console.log('CONFORMITÉ ÉCRAN → CANONIQUE (options ACTIVES du V15)\n');
rows.forEach((r) => console.log('  ' + r));
console.log('');
// Chiffres + commande de dérivation :
console.log(`questionCodes canoniques : ${Object.keys(canon).length}   [node: Object.keys(canon).length]`);
console.log(`options ACTIVES canon    : ${totalActive}   [grep -c 'status: "ACTIF"' onboarding.ts = 106]`);
console.log(`options rendues à l'écran: ${rendues}`);
console.log(`VRAIE LACUNE (active, non rendue) : ${totalActive - rendues}`);
console.log(`verdicts : IDENTIQUE ${identique} · PARTIELLE ${partielle} · ABSENTE ${absente}`);
console.log(`lacune par question : ${gaps.join(' · ')}`);
// Traînards legacy : rendus à l'écran MAIS inactifs au V15 (retirés/déplacés) → (B) les retirera.
console.log(`\nTRAÎNARDS legacy (rendus mais INACTIFS au V15 — à retirer par B) : ${stragglers.length}`);
stragglers.forEach((s) => console.log('   · ' + s));
console.log(`   [typiquement q3 (retirée), q15 Food & q16 Voyage (déplacées vers Discovery)]`);
console.log(`\nlibellés VRAIMENT étrangers au V15 (ni actif ni inactif) : ${foreign.length}`);
foreign.forEach((s) => console.log('   · ' + s));

// Gate : aucun libellé d'écran ne doit être VRAIMENT étranger au V15 (inconnu du canonique).
if (foreign.length !== 0) {
  console.error(`\n⚠ ${foreign.length} libellé(s) d'écran inconnu(s) du V15 — à investiguer.`);
  process.exit(1);
}
console.log('\n✓ Aucun libellé rendu n’est étranger au V15 ; mais l’écran rend encore des traînards inactifs (ci-dessus).');
