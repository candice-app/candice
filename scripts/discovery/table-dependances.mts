// Écrit la table des dépendances entre questions, pour relecture ligne à ligne.
import { writeFileSync } from 'node:fs';
import { DEPENDANCES } from '../../src/lib/discovery/open-v3/dependances.ts';
import { question } from '../../src/lib/discovery/open-v3/banque.ts';
const lignes = [...DEPENDANCES].map(([id, d]) => ({ question: id, enonce: question(id)!.enonce, condition: question(id)!.condition_emission, selecteur: d.selecteur, enonce_selecteur: question(d.selecteur)?.enonce ?? null, options_retenues: d.options, resolu: d.resolu, origine: d.origine }));
const r = lignes.filter((l) => l.resolu).length;
writeFileSync(new URL('../../docs/discovery/dependances.json', import.meta.url), JSON.stringify({ total: lignes.length, resolues: r, non_resolues: lignes.length - r, lignes }, null, 1));
console.log(`${lignes.length} questions dépendantes · ${r} résolues · ${lignes.length - r} non résolues`);
for (const l of lignes.filter((l) => !l.resolu)) console.log('  NON RÉSOLU', l.question, '|', l.condition.slice(0, 70), '| sélecteur', l.selecteur, l.enonce_selecteur ? '' : '(ABSENT)');
for (const l of lignes.filter((l) => l.resolu && l.origine === 'ecrite')) console.log('  ', l.question, '|', l.condition.slice(0, 55), '→', l.options_retenues.join(' ; ').slice(0, 90));
