// PREUVE — les 148 options reclassées DRIVER → PREFERENCE s'écrivent et se relisent.
//
// Pour chaque option active reclassée par la révision 2 : la réponse est enregistrée par le
// VRAI chemin (`enregistrerReponseFermee`), sous l'identité d'un compte de test, sur la pile
// locale ; puis on RELIT la base. Attendu, pour chacune : exactement une preuve
// PREFERENCE.<contexte>.<attribut> portant la valeur choisie — et, sur tout le compte,
// AUCUN DRIVER, AUCUN NEED, AUCUN PROFILE (trait du répondant).
import { readFileSync } from 'node:fs';
import { compteLocal, verificateur } from './_compte-local.mts';
import { question } from '../../src/lib/discovery/open-v3/banque.ts';
import { cleOption, enregistrerReponseFermee } from '../../src/lib/discovery/open-v3/service.ts';
import { lirePortrait } from '../../src/lib/knowledge/portrait.ts';

// DÉCISION N° 8 (19 nov.) : les motivations de vie et les aides à l'apprentissage ont été reclassées
// sans que l'accord les couvre ; tant que leur sens n'est pas établi, elles n'écrivent RIEN, et le
// motif est rendu. Le script le vérifie au lieu d'attendre une préférence.
const D8 = new Set(['dreams.2004', 'philovie.1636', 'values.1910', 'learning2.1455']);   // décision D8 (sens-en-revue.json est vide depuis)

// Les 162 lignes reclassées, avec leur ligne dans l'onglet 0_FICHE_CANONIQUE.
const reclassees: { ligne: number; q: string; libelle: string }[] =
  JSON.parse(readFileSync('docs/discovery/revision-2-reclassement-driver.json', 'utf8'));
const v = verificateur();
const c = await compteLocal('preuve-value-sought');

const cibles = new Map<string, Set<string>>();
for (const l of reclassees) {
  if (!cibles.has(l.q)) cibles.set(l.q, new Set());
  cibles.get(l.q)!.add(l.libelle);
}
let nOptions = 0, nEcrites = 0, nHorsBanque = 0, nEnRevue = 0, nEnRevueMuettes = 0;
const attendus: { q: string; libelle: string; chemin: string; valeur: string }[] = [];
for (const [qid, libelles] of cibles) {
  const q = question(qid);
  if (!q) { nHorsBanque += libelles.size; continue; }   // question en arbitrage : fermée
  for (const o of q.options) {
    if (!libelles.has(o.libelle)) continue;
    nOptions++;
    // UNE RÉPONSE PAR OPTION : chacune est éprouvée seule (les combinaisons sont plus bas).
    const r = await enregistrerReponseFermee(c.client as never, {
      acteId: globalThis.crypto.randomUUID(), userId: c.userId, questionId: qid, clesOptions: [cleOption(o)],
    });
    // DÉCISION D8 (19 nov., 17h43) : les quatre questions « en revue » ont reçu leur destination —
    // connaissance ouverte (dreams.2004, philovie.1636, values.1910) ou fait déclaré (learning2.1455).
    // Elles n'écrivent AUCUNE preuve (ni DRIVER, ni value_sought) : une connaissance, ou un fait.
    if (D8.has(qid)) {
      nEnRevue++;
      if (r.preuvesEcrites === 0 && ((r.connaissancesOuvertes ?? 0) + r.faitsEcrits) === 1) nEnRevueMuettes++;
      else console.log(`  ✗ ${qid} « ${o.libelle} » (D8) : ${r.preuvesEcrites} preuve(s), ${r.connaissancesOuvertes ?? 0} connaissance(s), ${r.faitsEcrits} fait(s)`);
      continue;
    }
    if (r.preuvesEcrites === 1) nEcrites++;
    else console.log(`  ✗ ${qid} « ${o.libelle} » : ${JSON.stringify(r.sansEmission)}`);
    attendus.push({ q: qid, libelle: o.libelle, chemin: `PREFERENCE.${o.domaine}.${o.attribut}`, valeur: '' });
  }
}
console.log(`\noptions reclassées : ${nOptions} dans la banque active, ${nHorsBanque} dans des questions en arbitrage (fermées).`);
// 148 ce matin ; la révision 6 a rendu actives des questions qui étaient en arbitrage. Aucune ligne
// reclassée ne doit se perdre : celles de la banque active + celles des questions encore en arbitrage.
v.verifier(nOptions + nHorsBanque === reclassees.length - (reclassees.length - [...cibles.values()].reduce((n, s) => n + s.size, 0)), 'toutes les options reclassées sont retrouvées (banque active ou arbitrage)', `${nOptions} actives + ${nHorsBanque} en arbitrage`);
v.verifier(nEnRevue === 42 && nEnRevueMuettes === nEnRevue, 'décision D8 : les 42 options des quatre questions écrivent une connaissance ouverte ou un fait, jamais une preuve', `${nEnRevueMuettes}/${nEnRevue}`);
v.verifier(nEcrites === nOptions - nEnRevue, 'chaque autre option a produit exactement une preuve', `${nEcrites}/${nOptions - nEnRevue}`);

// ── RELECTURE EN BASE, par le client du compte (donc à travers la RLS).
const { data: lignes, error } = await c.client.from('knowledge_evidences')
  .select('target_family,target_construct,preference_path,preference_value,raw_information,about_id,user_id,assertion_status')
  .eq('user_id', c.userId);
if (error) throw error;
const fam: Record<string, number> = {};
for (const l of lignes!) fam[l.target_family] = (fam[l.target_family] ?? 0) + 1;
console.log('relu en base :', lignes!.length, 'preuves', fam);
v.verifier(lignes!.length === nOptions - nEnRevue, 'autant de preuves relues que d’options qui écrivent', `${lignes!.length}`);
v.verifier(lignes!.every((l) => l.target_family === 'PREFERENCE'), 'toutes de famille PREFERENCE');
v.verifier(!lignes!.some((l) => ['DRIVER', 'NEED', 'PROFILE'].includes(l.target_family)), 'aucun DRIVER, aucun NEED, aucun trait PROFILE');
v.verifier(lignes!.every((l) => /^PREFERENCE\.[a-z0-9_]+\.(value_sought|facilitator)$/.test(l.target_construct)),
  'chemins PREFERENCE.<contexte>.value_sought (ou .facilitator pour learning2.1455)',
  [...new Set(lignes!.map((l) => l.target_construct))].filter((x) => !/\.(value_sought|facilitator)$/.test(x)).join(', '));
v.verifier(lignes!.every((l) => l.preference_value && l.preference_value.length > 0), 'chaque preuve porte la valeur choisie');
v.verifier(lignes!.every((l) => l.about_id === c.userId), 'toutes décrivent le compte lui-même');
const parChemin: Record<string, string[]> = {};
for (const l of lignes!) (parChemin[l.target_construct] ??= []).push(l.preference_value);
for (const [k, vals] of Object.entries(parChemin).sort()) console.log(`   ${k}  (${vals.length}) : ${vals.slice(0, 4).join(', ')}${vals.length > 4 ? ', …' : ''}`);

// ── RELECTURE PAR LE PORTRAIT (ce que l'application lit).
const p = await lirePortrait(c.client as never, { userId: c.userId });
v.verifier(p.drivers.length === 0, 'portrait : aucun moteur (drivers)');
v.verifier(p.needs.length === 0, 'portrait : aucun besoin (needs)');
v.verifier(p.profile.length === 0, 'portrait : aucun trait de personnalité');
v.verifier(p.preferences.length > 0, 'portrait : les préférences sont lues', `${p.preferences.length}`);
console.log('   exemple relu par le portrait :', JSON.stringify(p.preferences.find((x: any) => String(x.path ?? x.construct ?? '').includes('animals')) ?? p.preferences[0]));

// ── UNE RÉPONSE MULTIPLE : deux valeurs du même contexte dans la MÊME réponse.
const c2 = await compteLocal('preuve-value-sought-multi');
const qm = question('animals.2131')!;
const deux = qm.options.slice(0, 3).map(cleOption);
const rm = await enregistrerReponseFermee(c2.client as never, { acteId: globalThis.crypto.randomUUID(), userId: c2.userId, questionId: qm.id, clesOptions: deux });
const { data: lm } = await c2.client.from('knowledge_evidences').select('preference_value').eq('user_id', c2.userId);
console.log(`\nréponse multiple animals.2131 (3 options) : ${rm.preuvesEcrites} produites, ${lm!.length} relues :`, lm!.map((l) => l.preference_value));
v.verifier(lm!.length === 3, 'les trois valeurs d’une même réponse multiple sont toutes relues', `${lm!.length} relue(s)`);
const p2 = await lirePortrait(c2.client as never, { userId: c2.userId });
const pref = p2.preferences.find((x) => String(x.path) === 'PREFERENCE.animals.value_sought');
console.log('   portrait :', JSON.stringify({ value: pref?.value, values: pref?.values }));
v.verifier(pref?.values.length === 3, 'le portrait rend les trois valeurs, pas seulement la dernière', `${pref?.values.length}`);
// REJEU de la même réponse (même source impossible : nouvelle source) → coexistence sans doublon de valeur.
await enregistrerReponseFermee(c2.client as never, { acteId: globalThis.crypto.randomUUID(), userId: c2.userId, questionId: qm.id, clesOptions: deux });
const p3 = await lirePortrait(c2.client as never, { userId: c2.userId });
const pref3 = p3.preferences.find((x) => String(x.path) === 'PREFERENCE.animals.value_sought');
v.verifier(pref3?.values.length === 3, 'répondre une seconde fois ne duplique aucune valeur', `${pref3?.values.length}`);
v.bilan();
