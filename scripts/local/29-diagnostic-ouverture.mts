// POURQUOI CETTE QUESTION NE S'OUVRE PAS — pour un compte de la pile locale, branche par branche.
//   --prenom Léa                 bilan par branche (ouvrables / fermées / indécidables / stériles)
//   --prenom Léa --branche art   chaque question de la branche : niveau, verdict, condition
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { pileLocale } from './_compte-local.mts';
import { BANQUE } from '../../src/lib/discovery/open-v3/banque.ts';
import { lireEtat } from '../../src/lib/discovery/open-v3/etat.ts';
import { verdictDe } from '../../src/lib/discovery/open-v3/selection.ts';
import { coexistence } from '../../src/lib/discovery/open-v3/coexistence.ts';
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
const c = (JSON.parse(readFileSync('/home/claude/pile/profils-comptes.json', 'utf8')) as Record<string, { userId: string; email: string; motDePasse: string }>)[arg('prenom')!];
const { url, anon } = pileLocale();
const client = createClient(url, anon, { auth: { persistSession: false } });
await client.auth.signInWithPassword({ email: c.email, password: c.motDePasse });
const { etat } = await lireEtat(client as never, { userId: c.userId });
const br = arg('branche');
const bilan = new Map<string, Record<string, number>>();
for (const q of BANQUE) {
  let v: string = etat.dejaPosees.has(q.id) ? 'posee' : verdictDe(q, etat);
  if (v === 'ouvrir') { const c = coexistence(q.id, etat, true); if (!c.poser) v = `coexistence:${c.motif}`; }
  const b = bilan.get(q.branche) ?? {}; b[v] = (b[v] ?? 0) + 1; bilan.set(q.branche, b);
  if (br && q.branche === br) console.log(`${q.id} ${q.niveau ?? '-'} ${v.padEnd(11)} | ${q.condition_emission} | ${q.enonce.slice(0, 70)}`);
}
if (!br) {
  console.log('branches ouvertes :', [...etat.branchesOuvertes].join(', '));
  console.log('niveaux :', JSON.stringify([...etat.niveauParBranche]));
  for (const [b, r] of [...bilan].filter(([b, r]) => r.ouvrir || etat.branchesOuvertes.has(b))) console.log(b.padEnd(14), JSON.stringify(r));
}
