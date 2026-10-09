// Dérive les chiffres de contrôle du questionnaire INCOGNITO DEPUIS le document
// (docs/ontologie/onboarding-incognito-v1.md §9), jamais comptés à la main, et les assert.
// Usage : node scripts/incognito-control-count.mjs   (exit ≠ 0 sur tout écart)
import { readFileSync } from 'node:fs';
const doc = readFileSync('docs/ontologie/onboarding-incognito-v1.md', 'utf8');
const lines = doc.split('\n');
const count = (re) => lines.filter((l) => re.test(l)).length;

const questions = count(/^### I\d+b? — /);
const optionLines = count(/^\| I\d+b?\.[0-9U]/);
const active = count(/^\| I\d+b?\.[0-9]/);
const uncertainty = count(/^\| I\d+b?\.U/);
const zeroProd = count(/^\| I\d+b?\.[0-9].*\| (aucun|\*\*aucun\*\*) \|/);
const freeText = count(/^\| L[0-9] \|/);
const rules = count(/^\*\*R-I[0-9]/);
// La colonne « lignes » ne porte QUE ce qu'un grep dérive. Le nombre de productrices (80),
// comme OpenKnowledge-seul (5) et FACT-seul (2), vit dans la colonne « distinctes » — vérifié
// par incognito-conformance. Ne PAS le re-calculer ici : 101−11−5−2 soustrait des totaux
// distincts (11/5/2) d'un total de lignes qui compte 3 récaps en trop → chiffre faux (Estelle, 9 oct).

// Invariant « une sortie d'incertitude par question : 17 pour 17 »
const uByQ = {};
for (const l of lines) { const m = l.match(/^\| (I\d+b?)\.U/); if (m) uByQ[m[1]] = (uByQ[m[1]] || 0) + 1; }
const qWithOneU = Object.values(uByQ).filter((n) => n === 1).length;
const qWithBadU = Object.entries(uByQ).filter(([, n]) => n !== 1);

const row = (l, v, exp) => console.log(`${l.padEnd(34)} ${String(v).padStart(4)}  (attendu ${exp})`);
row('questions', questions, 17);
row('lignes option', optionLines, 118);
row('options actives', active, 101);
row('sorties incertitude', uncertainty, 17);
row('options à zéro production', zeroProd, 11);
row('champs libres', freeText, 7);
row('règles transversales', rules, 6);
row('questions avec exactement une .U', qWithOneU, 17);

const fail = [];
if (questions !== 17) fail.push(`questions ${questions}≠17`);
if (optionLines !== 118) fail.push(`lignes ${optionLines}≠118`);
if (active !== 101) fail.push(`actives ${active}≠101`);
if (uncertainty !== 17) fail.push(`incertitude ${uncertainty}≠17`);
if (zeroProd !== 11) fail.push(`zéro-prod ${zeroProd}≠11`);
if (freeText !== 7) fail.push(`champs libres ${freeText}≠7`);
if (rules !== 6) fail.push(`règles ${rules}≠6`);
if (qWithOneU !== 17 || qWithBadU.length) fail.push(`17/17 cassé : ${qWithBadU.map(([q, n]) => q + '×' + n).join(',') || qWithOneU}`);
if (fail.length) { console.error('\nASSERTIONS ÉCHOUÉES : ' + fail.join(' ; ')); process.exit(1); }
console.log('\nASSERTIONS OK (lignes : 17/118/101/17/11/7/6 · une sortie .U par question, 17/17)');
