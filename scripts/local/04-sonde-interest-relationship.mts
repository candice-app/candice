// SONDE — ev_interest_shape contre la doctrine « relationship FACULTATIF ».
//
// CE QUE LA SONDE ÉPROUVE, et qu'aucun test unitaire ne peut éprouver : le dépôt déclare
// trois fois que `relationship` est facultatif sur une evidence INTEREST —
//   · src/lib/knowledge/evidence.ts  : « FACULTATIF : absent = NON PRÉCISÉ, jamais "faible" »
//   · src/lib/knowledge-write/rows.ts:159 : « facultatif — absent = non précisé, jamais inventé »
//   · src/lib/knowledge-write/produce.ts:404 : « relationship ABSENT volontairement »
// — et la base le refuse :
//   · supabase-migration-82-knowledge-schema.sql:103
//       CONSTRAINT ev_interest_shape CHECK (target_family <> 'INTEREST' OR (
//           value IS NULL AND subject_id IS NOT NULL AND relationship IS NOT NULL))
//   (jamais modifiée depuis : aucune migration 83..105 n'y touche.)
//
// Les tests unitaires passent parce qu'ils ne voient jamais la base. La contradiction
// n'apparaît qu'en écrivant pour de vrai. C'est ce que fait cette sonde.
//
// ⚠ LE VRAI DÉGÂT N'EST PAS LA PREUVE PERDUE. `persistKnowledge` écrit une source, ses
// evidences ET sa connaissance ouverte dans UNE SEULE transaction (RPC persist_journal).
// Un INTEREST sans relationship fait donc tomber TOUT le lot — y compris la connaissance
// ouverte, dont le §27.6 garantit qu'elle est « conservée, verbatim, jamais jetée ».
// La garantie du §27.6 est défaite par une contrainte portant sur une ligne voisine.
//
// Chemin VIVANT : /api/knowledge/extract-free-text (appelé par QuestionnaireFlow.tsx:94 et
// :733). Le schéma d'outil du modèle (extract-free-text.ts:53) ne rend PAS `relationship`
// obligatoire et dit au modèle « laisse vide si non évident ». L'absence est donc le
// comportement INSTRUIT, pas un cas limite. La route journalise un compteur dans
// console.error et rend { extracted, failed } : la perte ne remonte à personne.
//
//   bash scripts/local/00-lancer.sh sonde
import { createClient } from '@supabase/supabase-js';
import { persistKnowledge } from '../../src/lib/knowledge-write/persist';
import { createSourceRecord } from '../../src/lib/knowledge/sources';
import { createOpenKnowledge } from '../../src/lib/knowledge/open-knowledge';
import { exigerLocal } from './_garde-locale.mjs';

const URL = process.env.SUPABASE_URL ?? '';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!URL || !KEY) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
exigerLocal({ nom: 'API Supabase', url: URL, port: 54321 });

const admin = createClient(URL, KEY, { auth: { persistSession: false } });

async function clientDeLaPersonne(email: string, motDePasse: string) {
  const anon = createClient(URL, process.env.SUPABASE_ANON_KEY ?? '', { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email, password: motDePasse });
  if (error || !data.session) throw new Error(`connexion du compte fictif : ${error?.message}`);
  return createClient(URL, process.env.SUPABASE_ANON_KEY ?? '', {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
}

const ok = (m: string) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const ko = (m: string) => { console.error(`\n\x1b[31mÉCHEC DE LA SONDE — ${m}\x1b[0m`); process.exitCode = 1; };

// Un lot tel que l'extracteur texte libre le produit : une source, une evidence INTEREST,
// une connaissance ouverte. Seul `relationship` varie d'un cas à l'autre.
function lot(userId: string, avecRelationship: boolean) {
  const about = { kind: 'account' as const, id: userId as never };
  const sourceId = crypto.randomUUID();
  const ts = new Date().toISOString();
  const source = createSourceRecord({
    about, ownerId: userId as never, id: sourceId,
    sourceType: 'extraction_inferred', questionText: 'q', rawText: 'pain au levain', timestamp: ts,
  });
  const evidence = {
    about, ownerId: userId, evidence_id: crypto.randomUUID(), source_id: sourceId,
    source_type: 'extraction_inferred', raw_information: 'pain au levain', confidence: 'low',
    context: 'GLOBAL', timestamp: ts, stability: 'contextual', evidence_role: 'primary',
    assertionBasis: 'inference', assertionStatus: 'inferred', target_family: 'INTEREST',
    subject: 'pain-au-levain', subjectLabel: 'pain au levain', target_construct: 'pain-au-levain',
    strength: 'moderate', version: { ontology_version: '1', hsg_version: '1' },
    ...(avecRelationship ? { relationship: 'passion' } : {}),
  };
  const ouverte = createOpenKnowledge({
    about, ownerId: userId as never, open_knowledge_id: crypto.randomUUID(),
    type: 'descriptive', subject: 'pain-au-levain', subjectLabel: 'pain au levain',
    relation: 'évoqué', context: 'GLOBAL', source: sourceId, timestamp: ts,
    confidence: 'low', assertionStatus: 'inferred',
  } as never);
  return { sourceId, charge: { source, evidences: [evidence as never], facts: [], openKnowledge: [ouverte as never] } };
}

async function compter(client: unknown, table: string, sourceId: string, colonne: string) {
  const { count, error } = await (client as never as ReturnType<typeof createClient>)
    .from(table).select('*', { count: 'exact', head: true }).eq(colonne, sourceId);
  if (error) throw new Error(`${table} : ${error.message}`);
  return count ?? 0;
}

async function main() {
  const email = `sonde-${Date.now()}@essai.local`;
  const motDePasse = crypto.randomUUID();
  const { data: u, error: eu } = await admin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
  if (eu || !u.user) return ko(`création du compte fictif : ${eu?.message}`);
  const userId = u.user.id;
  const personne = await clientDeLaPersonne(email, motDePasse);
  ok(`compte ${email} · ${userId}`);

  // ── TÉMOIN — le même lot AVEC relationship doit passer. Sans ce témoin, un échec du
  //    cas suivant ne prouverait rien : il pourrait venir de n'importe quoi d'autre.
  console.log('\n═══ témoin : le lot AVEC relationship ═══');
  const t = lot(userId, true);
  try {
    await persistKnowledge(personne as never, t.charge as never);
    ok('écrit');
  } catch (e) {
    return ko(`le témoin lui-même échoue (${(e as Error).message}) — la sonde ne prouve rien`);
  }
  const tEv = await compter(personne, 'knowledge_evidences', t.sourceId, 'source_id');
  const tOk = await compter(personne, 'knowledge_open_knowledge', t.sourceId, 'source');
  if (tEv !== 1 || tOk !== 1) return ko(`témoin incomplet : ${tEv} preuve(s), ${tOk} connaissance(s) ouverte(s)`);
  ok('1 preuve + 1 connaissance ouverte en base');

  // ── CAS MESURÉ — le même lot SANS relationship.
  console.log('\n═══ mesuré : le même lot SANS relationship ═══');
  const m = lot(userId, false);
  let refus: string | null = null;
  try {
    await persistKnowledge(personne as never, m.charge as never);
  } catch (e) { refus = (e as Error).message; }

  if (!refus) {
    ok('ACCEPTÉ — la base ne l\'exige donc pas ici : contradiction NON reproduite');
    console.log('    → vérifie ev_interest_shape dans le relevé (05) avant toute conclusion.');
  } else {
    console.log(`  \x1b[31m✗\x1b[0m REFUSÉ par la base : ${refus}`);
    if (!/ev_interest_shape/.test(refus)) {
      return ko(`refus pour une AUTRE raison que ev_interest_shape — la sonde mesure autre chose que ce qu'elle annonce`);
    }
    ok('refus bien imputable à ev_interest_shape');
  }

  // ── LE POINT QUI COMPTE : qu'est-il advenu de la connaissance ouverte du MÊME lot ?
  console.log('\n═══ conséquence sur la connaissance ouverte du même lot (§27.6) ═══');
  const mSrc = await compter(personne, 'knowledge_sources', m.sourceId, 'id');
  const mEv = await compter(personne, 'knowledge_evidences', m.sourceId, 'source_id');
  const mOk = await compter(personne, 'knowledge_open_knowledge', m.sourceId, 'source');
  console.log(`    source : ${mSrc} · preuve : ${mEv} · connaissance ouverte : ${mOk}`);

  if (refus && mOk === 0) {
    console.log('\n\x1b[31m  DÉFAUT CONFIRMÉ\x1b[0m — la connaissance ouverte du lot est perdue avec lui.');
    console.log('  Le §27.6 garantit qu\'elle est « conservée, verbatim, jamais jetée ». Une contrainte');
    console.log('  portant sur une ligne VOISINE, dans la même transaction, défait cette garantie.');
    console.log('  Chemin vivant : /api/knowledge/extract-free-text ← QuestionnaireFlow.tsx:94, :733.');
    console.log('  Remontée à l\'utilisateur : aucune (route.ts:48, un compteur dans console.error).');
  } else if (refus && mOk > 0) {
    ok('la connaissance ouverte SURVIT au refus — la transaction n\'est donc pas tout-ou-rien');
    console.log('    → à vérifier dans persist_journal : la garantie du §27.6 tient malgré le refus.');
  }

  await admin.auth.admin.deleteUser(userId).catch(() => {});
  console.log('\n  compte fictif supprimé.');
}

main().catch((e) => { console.error(e); process.exit(1); });
