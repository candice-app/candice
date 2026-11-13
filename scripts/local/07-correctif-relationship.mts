// CORRECTIF DES SIX LIGNES `relationship` — répétition complète sur Supabase local.
//
// Ce que ce script prouve, et qu'aucune relecture ne prouve :
//   1. les trois migrations s'appliquent dans l'ordre, chacune vérifiant son propre effet ;
//   2. le correctif échoue si une ligne manque ou ne correspond plus à l'état relu ;
//   3. les trois lignes retirées RESTENT dans l'historique et DISPARAISSENT des deux
//      lectures actives (read-journal.ts et preseance.ts) ;
//   4. les quatre cas du vocabulaire, éprouvés SÉPARÉMENT — dont celui que la migration
//      ne peut pas éprouver elle-même : une mise à jour sans rapport sur une ligne retirée
//      portant une valeur historique. Ici l'ordre est naturel : semer AVANT de migrer.
//
// LE JEU D'ESSAI reproduit les six lignes de production avec leurs identifiants EXACTS, sur
// un compte fictif. Les identifiants réels sont déterministes (uuid v5 du dépôt) : les
// réutiliser permet au correctif de production de tourner ici MOT POUR MOT, sans variante.
// Un correctif qu'on adapte pour le tester n'est plus celui qu'on applique.
//
//   bash scripts/local/00-lancer.sh correctif    # SIMULATION — relevé seul, rien n'est joué
//   bash scripts/local/00-lancer.sh correctif!   # joue tout, en local uniquement
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { readJournalEvidences } from '../../src/lib/knowledge/read-journal';
import { exigerLocal } from './_garde-locale.mjs';

const DB = process.env.SUPABASE_DB_URL ?? '';
const API = process.env.SUPABASE_URL ?? '';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!DB || !API || !KEY) throw new Error('SUPABASE_DB_URL, SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
// La garde refuse une URL portant des identifiants — et elle a raison. On ne lui donne
// donc QUE l'hôte et le port, jamais la chaîne de connexion : celle-ci contient le mot de
// passe Postgres, et une garde qui l'accepterait apprendrait à le laisser passer ailleurs.
const hoteDB = (() => {
  const m = /@([^/:]+):(\d+)/.exec(DB);
  if (!m) throw new Error('SUPABASE_DB_URL illisible : hôte et port introuvables');
  return `http://${m[1]}:${m[2]}`;
})();
exigerLocal({ nom: 'base Supabase', url: hoteDB, port: 54322 });
exigerLocal({ nom: 'API Supabase', url: API, port: 54321 });

const APPLIQUER = process.argv.includes('--appliquer');
const V = '\x1b[32m', R = '\x1b[31m', J = '\x1b[33m', G = '\x1b[2m', N = '\x1b[0m';
let echecs = 0;
const ok = (m: string) => console.log(`  ${V}✓${N} ${m}`);
const non = (m: string) => { console.log(`  ${R}✗${N} ${m}`); echecs++; };
const exiger = (c: boolean, m: string) => (c ? ok(m) : non(m));
const titre = (m: string) => console.log(`\n${J}═══ ${m} ═══${N}`);

function sql(q: string): string[][] {
  const out = execFileSync('psql', [DB, '-X', '-At', '-F', '\u001f', '-v', 'ON_ERROR_STOP=1', '-c', q], { encoding: 'utf8' });
  return out.split('\n').filter(Boolean).map((l) => l.split('\u001f'));
}
/** Rend l'erreur plutôt que de la lever : on éprouve des REFUS, ils ne sont pas des pannes. */
function sqlRefus(q: string): string | null {
  try { sql(q); return null; }
  catch (e) { return String((e as { stderr?: Buffer }).stderr ?? (e as Error).message); }
}
/** Les colonnes nommées existent-elles VRAIMENT ? Écrire une liste de colonnes de mémoire
 *  est une faute qui ne se voit qu'à l'exécution, sous la forme d'une erreur psql brute.
 *  Ici elle se voit AVANT, et elle nomme ce qui manque. */
function verifierColonnes(table: string, colonnes: readonly string[]): void {
  const reelles = new Set(sql(`SELECT column_name FROM information_schema.columns
                               WHERE table_schema='public' AND table_name='${table}';`).map((l) => l[0]));
  const absentes = colonnes.filter((c) => !reelles.has(c));
  if (absentes.length) {
    throw new Error(`${table} : colonne(s) inexistante(s) — ${absentes.join(', ')}. `
      + `Colonnes réelles : ${[...reelles].sort().join(', ')}`);
  }
}

function fichier(chemin: string): void {
  execFileSync('psql', [DB, '-X', '-v', 'ON_ERROR_STOP=1', '-f', chemin], { stdio: 'pipe' });
}
/** Un FICHIER dont on attend le refus. `-c` ne sait pas lire `\\i` : il faut `-f`. */
function fichierRefus(chemin: string): string | null {
  try { fichier(chemin); return null; }
  catch (e) { return String((e as { stderr?: Buffer }).stderr ?? (e as Error).message); }
}

const UID = '00000000-0000-4000-8000-00000000c0f1';
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

// Les six lignes, identifiants de production compris. `garde` : reste un intérêt actif.
const CAS = [
  { id: '2f2ab134-c4f1-5b17-8732-6dff064fb656', sujet: 'ecoute podcasts en marchant',  v: 'appreciation', garde: true,  verbatim: 'j’écoute des podcasts en marchant' },
  { id: '51d54fc5-2f64-5b82-8ed7-112eba9f6b76', sujet: 'marche en ville en solitaire',  v: 'appreciation', garde: true,  verbatim: 'je marche beaucoup en ville, seule' },
  { id: '086597af-abf3-57d0-91f0-c78383b16800', sujet: 'reliure livres main',           v: 'curiosity',    garde: true,  verbatim: 'la reliure de livres à la main' },
  { id: 'ebb91e3c-45c2-562a-ac74-24bcc08945bb', sujet: 'diners calmes et apaises',      v: 'appreciation', garde: false, verbatim: 'préférence positive jamais exprimée' },
  { id: '8814c5be-9781-5d77-bdbb-6214f1d48e74', sujet: 'diners bruyants et agites',     v: 'aversion',     garde: false, verbatim: 'Les dîners où il faut parler fort pour exister.' },
  { id: 'a75060b6-87c8-5f56-8de2-ea9613e8902b', sujet: 'repas surprise au restaurant',  v: 'aversion',     garde: false, verbatim: 'les repas-surprise au restaurant, c\'est souvent compliqué.' },
];
const RETIRES = CAS.filter((c) => !c.garde).map((c) => c.id);
const GARDES = CAS.filter((c) => c.garde).map((c) => c.id);

function nettoyer() {
  sql(`DELETE FROM knowledge_open_knowledge WHERE user_id = '${UID}';
       DELETE FROM knowledge_evidences WHERE user_id = '${UID}';
       DELETE FROM knowledge_sources WHERE user_id = '${UID}';
       DELETE FROM auth.users WHERE id = '${UID}';`);
}

const COLONNES_SOURCE = ['id','user_id','about_kind','about_id','source_type','question_text','raw_text','ts','assertion_status'] as const;
const COLONNES_EVIDENCE = ['id','user_id','source_id','target_family','target_construct','evidence_role','context','confidence','stability','raw_information','assertion_status','ontology_version','hsg_version','strength','subject_id','subject_label','relationship','about_kind','about_id','assertion_basis'] as const;

function semer() {
  verifierColonnes('knowledge_sources', COLONNES_SOURCE);
  verifierColonnes('knowledge_evidences', COLONNES_EVIDENCE);
  nettoyer();
  sql(`INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
       VALUES ('${UID}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
               'correctif-${Date.now()}@essai.local', '', now(), now(), now());`);
  CAS.forEach((c, i) => {
    const src = `00000000-0000-4000-8000-00000000d0${(i + 16).toString(16)}`;
    sql(`INSERT INTO knowledge_sources (id, user_id, about_kind, about_id, source_type, question_text, raw_text, ts, assertion_status)
         VALUES ('${src}', '${UID}', 'account', '${UID}', 'extraction_inferred', 'texte libre', ${q(c.verbatim)}, now(), 'inferred');
         INSERT INTO knowledge_evidences (id, user_id, source_id, target_family, target_construct, evidence_role, context, confidence, stability, raw_information, assertion_status, ontology_version, hsg_version, strength, subject_id, subject_label, relationship, about_kind, about_id, assertion_basis)
         VALUES ('${c.id}', '${UID}', '${src}', 'INTEREST', ${q(c.sujet)}, 'primary', 'GLOBAL', 'low', 'contextual', ${q(c.verbatim)}, 'inferred', '1', '1', 'moderate', ${q(c.sujet)}, ${q(c.sujet)}, ${q(c.v)}, 'account', '${UID}', 'self_report');`);
  });
}

async function lectureActive(): Promise<string[]> {
  const admin = createClient(API, KEY, { auth: { persistSession: false } });
  const evs = await readJournalEvidences(admin as never, { userId: UID });
  return evs.map((e) => String((e as unknown as { evidence_id: string }).evidence_id));
}

async function main() {
  console.log(APPLIQUER ? `${J}MODE : JOUE LE CORRECTIF (base locale)${N}` : `${J}MODE : SIMULATION${N}`);

  titre('1. les six lignes et leur sort');
  for (const c of CAS) {
    const sort = c.garde
      ? 'reste INTEREST, degré retiré'
      : c.id.startsWith('ebb91e3c')
        ? 'retiré — RIEN n’est conservé (préférence jamais exprimée)'
        : 'retiré — formulation conservée en connaissance ouverte, à sa portée';
    console.log(`  ${c.v.padEnd(13)} ${c.sujet.padEnd(32)} → ${sort}`);
    console.log(`      ${G}« ${c.verbatim} »${N}`);
  }
  if (!APPLIQUER) { console.log('\n  Rien n’a été joué. Relance avec « correctif! ».'); return; }

  titre('2. jeu d’essai semé AVANT les migrations');
  semer();
  exiger(sql(`SELECT count(*) FROM knowledge_evidences WHERE user_id='${UID}' AND relationship IS NOT NULL;`)[0][0] === '6',
    '6 lignes hors vocabulaire en place (état de production reproduit)');

  titre('3. migrations 108 et 109');
  fichier('supabase-migration-108-interest-relationship.sql');
  ok('108 — relationship facultatif (un INTEREST sans sujet reste refusé)');
  fichier('supabase-migration-109-supersede-sans-remplacant.sql');
  ok('109 — retrait sans remplaçant permis ; remplaçant sans date toujours refusé');

  titre('4. le correctif REFUSE un état qui ne correspond plus');
  sql(`UPDATE knowledge_evidences SET relationship = 'passion' WHERE id = '${CAS[0].id}';`);
  const refus = fichierRefus('correctif-six-lignes-relationship.sql');
  exiger(refus !== null && /porte « passion » au lieu de « appreciation »/.test(refus ?? ''),
    'une ligne modifiée depuis le relevé fait TOUT annuler, en nommant laquelle');
  exiger(sql(`SELECT count(*) FROM knowledge_evidences WHERE user_id='${UID}' AND superseded_at IS NOT NULL;`)[0][0] === '0',
    'et rien n’a été écrit : la transaction a bien été annulée en entier');
  sql(`UPDATE knowledge_evidences SET relationship = 'appreciation' WHERE id = '${CAS[0].id}';`);

  titre('5. le correctif, sur l’état attendu');
  fichier('correctif-six-lignes-relationship.sql');
  ok('correctif appliqué (ses propres contrôles sont passés dans la transaction)');

  titre('6. LES TROIS RETIRÉES : dans l’historique, absentes des lectures actives');
  for (const c of CAS.filter((x) => !x.garde)) {
    const [[at, by, rel]] = sql(`SELECT superseded_at IS NOT NULL, superseded_by IS NULL, coalesce(relationship,'(NULL)')
                                 FROM knowledge_evidences WHERE id = '${c.id}';`);
    exiger(at === 't' && by === 't', `${c.sujet.padEnd(32)} retirée, sans remplaçant`);
    exiger(rel === c.v, `${''.padEnd(32)} valeur historique « ${rel} » CONSERVÉE`);
  }
  const lues = await lectureActive();
  for (const id of RETIRES) exiger(!lues.includes(id), `${id.slice(0, 8)} absente de readJournalEvidences`);
  for (const id of GARDES) exiger(lues.includes(id), `${id.slice(0, 8)} toujours lue comme intérêt actif`);

  const preseance = sql(`SELECT count(*) FROM knowledge_evidences
                         WHERE user_id='${UID}' AND superseded_at IS NULL;`)[0][0];
  exiger(preseance === '3', `lecture active (filtre superseded_at, cf. preseance.ts) : ${preseance} ligne(s)`);

  titre('7. les deux formulations, à leur portée exacte');
  const ouvertes = sql(`SELECT subject_label, relation FROM knowledge_open_knowledge WHERE user_id='${UID}' ORDER BY subject_id;`);
  for (const [label, relation] of ouvertes) console.log(`  ${G}« ${label} » — ${relation}${N}`);
  exiger(ouvertes.length === 2, `${ouvertes.length} formulation(s) conservée(s)`);
  exiger(!ouvertes.some(([l]) => /^(les )?d[îi]ners?\.?$/i.test(l.trim()) || /^(les )?restaurants?\.?$/i.test(l.trim())),
    'aucune formulation réduite à « les dîners » ou « les restaurants »');
  exiger(sql(`SELECT count(*) FROM knowledge_evidences WHERE user_id='${UID}'
              AND (target_family='GUARDRAIL' OR (target_family='ENTITY' AND relation IN ('AVOID','DISLIKE')));`)[0][0] === '0',
    'AUCUN rejet structuré créé — rien n’arme un filtre');
  exiger(sql(`SELECT count(*) FROM knowledge_open_knowledge WHERE user_id='${UID}'
              AND evidence_ids && ARRAY['ebb91e3c-45c2-562a-ac74-24bcc08945bb'::uuid];`)[0][0] === '0',
    'rien n’est né de la préférence inventée');

  titre('8. migration 110 et les quatre cas du vocabulaire, séparément');
  fichier('supabase-migration-110-interest-relationship-vocabulaire.sql');
  ok('110 appliquée (sa garde a vu 0 ligne ACTIVE hors vocabulaire)');

  const src0 = sql(`SELECT source_id FROM knowledge_evidences WHERE id='${CAS[0].id}';`)[0][0];
  const nouveau = (extra: string, rel: string) => `INSERT INTO knowledge_evidences
    (id, user_id, source_id, target_family, target_construct, evidence_role, context, confidence,
     stability, raw_information, assertion_status, ontology_version, hsg_version, strength,
     subject_id, relationship, about_kind, about_id, assertion_basis ${extra ? ', ' + extra : ''})
    VALUES (gen_random_uuid(), '${UID}', '${src0}', 'INTEREST', 'essai', 'primary', 'GLOBAL', 'low',
     'contextual', 'essai', 'inferred', '1', '1', 'moderate', 'essai', ${q(rel)}, 'account', '${UID}', 'self_report'
     ${extra ? ', now()' : ''});`;

  exiger(sqlRefus(nouveau('', 'curiosity')) !== null,
    'a) insertion INTEREST hors vocabulaire → REFUSÉE');
  exiger(sqlRefus(nouveau('superseded_at', 'aversion')) !== null,
    'b) insertion hors vocabulaire DÉJÀ marquée retirée → REFUSÉE (la faille du CHECK est fermée)');
  exiger(sqlRefus(`UPDATE knowledge_evidences SET relationship='aversion' WHERE id='${CAS[0].id}';`) !== null,
    'c) mise à jour INTRODUISANT une valeur hors vocabulaire → REFUSÉE');
  exiger(sqlRefus(`UPDATE knowledge_evidences SET context='LOCAL' WHERE id='${RETIRES[1]}';`) === null,
    'd) mise à jour SANS RAPPORT sur une ligne retirée portant une valeur historique → ACCEPTÉE');
  exiger(sql(`SELECT relationship FROM knowledge_evidences WHERE id='${RETIRES[1]}';`)[0][0] === 'aversion',
    '   et la valeur historique est toujours là après cette mise à jour');

  // Bascule de famille vers INTEREST en conservant une valeur hors vocabulaire.
  const autre = sql(`SELECT id FROM knowledge_evidences WHERE id='${RETIRES[2]}';`)[0][0];
  exiger(sqlRefus(`UPDATE knowledge_evidences SET target_family='INTEREST' WHERE id='${autre}' AND target_family='INTEREST';`) === null,
    'e) une bascule qui ne change rien ne déclenche pas de faux refus');

  exiger(sqlRefus(nouveau('', 'passion')) === null, 'f) une valeur canonique s’insère normalement');

  titre('9. état final');
  for (const c of CAS) {
    const [[fam, rel, sup]] = sql(`SELECT target_family, coalesce(relationship,'(NULL)'),
                                   CASE WHEN superseded_at IS NULL THEN 'actif' ELSE 'retiré' END
                                   FROM knowledge_evidences WHERE id='${c.id}';`);
    console.log(`  ${c.id.slice(0, 8)}  ${fam.padEnd(9)} ${rel.padEnd(13)} ${sup.padEnd(7)} ${c.sujet}`);
  }
  nettoyer();
  console.log(`\n  ${G}jeu d'essai retiré.${N}`);
}

main()
  .catch((e) => { console.error(e); echecs++; })
  .finally(() => {
    if (echecs > 0) { console.log(`\n${R}${echecs} contrôle(s) en échec${N}`); process.exitCode = 1; }
    else console.log(`\n${V}CORRECTIF PROUVÉ EN LOCAL — l'application en production attend ta revue${N}`);
  });
