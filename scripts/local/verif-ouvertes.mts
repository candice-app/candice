import { BANQUE } from '../../src/lib/discovery/open-v3/banque.ts';
const ouvertes = BANQUE.filter(q => q.forme === 'open');
const sans = ouvertes.filter(q => !q.inferences_interdites);
console.log(`questions ouvertes : ${ouvertes.length} · sans inférences interdites : ${sans.length}`);
console.log('\nexemples :');
for (const q of sans.slice(0, 10)) console.log(`  ${q.id.padEnd(18)} ${q.enonce.slice(0, 72)}`);
const parBranche = new Map<string, number>();
for (const q of sans) parBranche.set(q.branche, (parBranche.get(q.branche) ?? 0) + 1);
console.log('\npar branche :', [...parBranche.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>`${k}=${v}`).join(' · '));
// Et combien portent au moins une option OPEN_KNOWLEDGE avec le contrat d'extraction ?
const avecOption = sans.filter(q => q.options.some(o => o.voie === 'OPEN_KNOWLEDGE' && o.inferences_interdites));
console.log(`\nparmi elles, ${avecOption.length} portent la barrière au niveau de l'OPTION plutôt que de la question.`);
