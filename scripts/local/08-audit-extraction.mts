#!/usr/bin/env -S node --experimental-strip-types
/**
 * AUDIT D'EXTRACTION — est-ce que Candice extrait la bonne chose, question par question ?
 *
 * LECTURE SEULE. Aucune écriture, aucune migration, aucun appel modèle. Il peut tourner sur
 * un compte de test comme sur un compte réel sans rien y changer.
 *
 * CE QU'IL VÉRIFIE, et pourquoi chaque contrôle existe :
 *
 *  1. UNE RÉPONSE QUI N'A RIEN PRODUIT. Une question fermée répondue sans aucune preuve
 *     derrière : la personne a répondu, Candice n'a rien appris. C'est le défaut le plus
 *     coûteux parce qu'il est invisible — l'écran a l'air d'avoir marché.
 *
 *  2. UN CONSTRUCT HORS VOCABULAIRE. `knowledge_evidences.target_construct` n'a AUCUNE
 *     contrainte en base : la base accepterait n'importe quelle chaîne. Une écriture hors
 *     vocabulaire passe, se consolide, et remonte dans le portrait sous un nom que personne
 *     n'a défini — jusque dans les écrans de respiration. Ce contrôle est le seul filet.
 *
 *  3. UNE CONTRADICTION ENTRE CE QUI EST AIMÉ ET CE QUI EST ÉVITÉ. Sur le compte de test,
 *     un week-end surprise était enregistré comme AIMÉ (ENTITY/LOVE) alors que deux réponses
 *     fermées déclaraient le contraire : « j'aime tout savoir à l'avance » et un garde-fou
 *     sur le planning bousculé. Candice tenait les deux et n'en savait rien.
 *
 *  4. UN DEGRÉ D'ENGAGEMENT HORS ÉCHELLE. `relationship` doit valoir casual, curious,
 *     enthusiast, passion ou expert — ou rien. « passion » est le seul mot de l'ancien
 *     vocabulaire qui franchit la contrainte, parce qu'il existe dans les deux : il est
 *     donc signalé à part quand il vient d'une extraction, où il voulait dire autre chose.
 *
 *  5. UN REFUS SANS INTENSITÉ. « Surtout pas de fleurs coupées » et « les bijoux, très peu
 *     pour moi » sortaient tous deux en `moderate`. Un veto catégorique et une mise en
 *     retrait enregistrés à l'identique : l'un sera trop appliqué, l'autre pas assez.
 *
 *  6. UNE DÉCLARATION CLASSÉE COMME INFÉRENCE. Tout le texte libre est marqué `inferred` en
 *     dur. « Surtout pas de fleurs coupées » n'est pas une inférence. Conséquence : dans
 *     l'Espace Proche, un refus écrit noir sur blanc ne sera jamais lu, parce que le filtre
 *     exige `explicit`.
 *
 * Usage, dans TON terminal (jamais depuis un agent) :
 *   node --experimental-strip-types scripts/local/08-audit-extraction.mts [userId]
 * Sans userId : le compte qui porte le plus de preuves (le compte de test, en général).
 *
 * Variables attendues : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY, ou
 * l'URL/clé locale. La clé ne quitte pas ta machine et n'est jamais affichée.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
// LES RÈGLES VIVENT DANS src/lib/knowledge/audit-extraction.ts : ce sont de la logique
// produit, éprouvée par la suite de tests. Ce script ne fait que lire la base et appeler.
import { examiner, type Ligne, type SourceAuditee } from '../../src/lib/knowledge/audit-extraction.ts';

const SORTIE = 'scripts/local/.resultats';
const VERSION = 'audit-extraction / 1';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !cle) {
    console.error('Variables manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(2);
  }
  // L'hôte seul est affiché. La clé n'est jamais écrite nulle part, ni dans le rapport.
  console.log(`${VERSION}\nbase : ${new URL(url).host}`);
  const db = createClient(url, cle, { auth: { persistSession: false } });

  let userId = process.argv[2];
  if (!userId) {
    const { data, error } = await db.from('knowledge_evidences').select('user_id');
    if (error) throw new Error(`lecture des comptes : ${error.message}`);
    const compte = new Map<string, number>();
    for (const r of (data ?? []) as { user_id: string }[]) compte.set(r.user_id, (compte.get(r.user_id) ?? 0) + 1);
    const top = [...compte].sort((a, b) => b[1] - a[1])[0];
    if (!top) { console.log('Aucune preuve dans le journal : rien à auditer.'); return; }
    userId = top[0];
    console.log(`compte choisi : celui qui porte le plus de preuves (${top[1]})`);
  }

  const { data: evs, error: e1 } = await db
    .from('knowledge_evidences')
    .select('source_id, target_family, target_construct, subject_label, entity_label, preference_path, pattern, relationship, relation, strength, severity, value, confidence, assertion_status, superseded_at')
    .eq('user_id', userId);
  if (e1) throw new Error(`knowledge_evidences : ${e1.message}`);
  const { data: srcs, error: e2 } = await db
    .from('knowledge_sources')
    .select('id, question_text, answer_text, raw_text, source_type, ts')
    .eq('user_id', userId);
  if (e2) throw new Error(`knowledge_sources : ${e2.message}`);

  type Src = { id: string; question_text: string | null; answer_text: string | null; raw_text: string | null; source_type: string; ts: string | null };
  const parSource = new Map((srcs as Src[]).map((s) => [s.id, s] as const));

  const lignes: Ligne[] = [];
  for (const e of (evs ?? []) as Record<string, unknown>[]) {
    if (e.superseded_at) continue; // une preuve retirée ne compte pas dans l'état courant
    const s = parSource.get(String(e.source_id));
    lignes.push({
      source_id: String(e.source_id),
      question: s?.question_text ?? null,
      reponse: s?.answer_text ?? s?.raw_text ?? null,
      source_type: s?.source_type ?? '(source introuvable)',
      ts: s?.ts ?? null,
      assertion_status: (e.assertion_status as string) ?? null,
      famille: (e.target_family as string) ?? null,
      construct: (e.target_construct as string) ?? null,
      libelle: (e.subject_label ?? e.entity_label ?? e.preference_path ?? e.pattern ?? null) as string | null,
      relationship: (e.relationship as string) ?? null,
      relation: (e.relation as string) ?? null,
      strength: (e.strength as string) ?? null,
      severity: (e.severity as string) ?? null,
      value: (e.value as number) ?? null,
      confidence: (e.confidence as string) ?? null,
    });
  }

  const constats = examiner(lignes, (srcs as Src[]).map((s) => ({
    id: s.id, question_text: s.question_text, answer_text: s.answer_text,
    raw_text: s.raw_text, source_type: s.source_type,
  })));

  // ── Rapport.
  const parQuestion = new Map<string, Ligne[]>();
  for (const l of lignes) {
    const k = l.question ?? '(sans question)';
    (parQuestion.get(k) ?? parQuestion.set(k, []).get(k)!).push(l);
  }

  const bloquants = constats.filter((c) => c.gravite === 'BLOQUANT');
  const lignesRapport: string[] = [
    `${VERSION}`,
    `compte : ${userId}`,
    `base   : ${new URL(url).host}`,
    `date   : ${new Date().toISOString()}`,
    ``,
    `sources : ${(srcs ?? []).length}   ·   preuves actives : ${lignes.length}   ·   questions distinctes : ${parQuestion.size}`,
    ``,
    `CONSTATS : ${bloquants.length} bloquant(s), ${constats.length - bloquants.length} à regarder`,
    ``,
  ];
  for (const g of ['BLOQUANT', 'À REGARDER'] as const) {
    const liste = constats.filter((c) => c.gravite === g);
    if (liste.length === 0) continue;
    lignesRapport.push(`── ${g} ──`);
    const parQuoi = new Map<string, string[]>();
    for (const c of liste) (parQuoi.get(c.quoi) ?? parQuoi.set(c.quoi, []).get(c.quoi)!).push(c.detail);
    for (const [quoi, details] of parQuoi) {
      lignesRapport.push(`  ${quoi} — ${details.length}`);
      for (const d of details.slice(0, 12)) lignesRapport.push(`      · ${d}`);
      if (details.length > 12) lignesRapport.push(`      · … et ${details.length - 12} autres`);
    }
    lignesRapport.push('');
  }

  lignesRapport.push('── CE QUI A ÉTÉ EXTRAIT, QUESTION PAR QUESTION ──', '');
  for (const [q, ls] of parQuestion) {
    lignesRapport.push(`« ${q} »`);
    lignesRapport.push(`   réponse : ${(ls[0].reponse ?? '').slice(0, 120)}`);
    for (const l of ls) {
      const bouts = [l.famille, l.construct, l.libelle, l.relationship, l.relation,
                     l.strength, l.severity, l.value === null ? null : `value=${l.value}`,
                     l.confidence].filter(Boolean);
      lignesRapport.push(`   → ${bouts.join(' · ')}`);
    }
    lignesRapport.push('');
  }

  mkdirSync(SORTIE, { recursive: true });
  const chemin = `${SORTIE}/audit-extraction.txt`;
  writeFileSync(chemin, lignesRapport.join('\n'), 'utf8');

  console.log(`\nsources : ${(srcs ?? []).length} · preuves actives : ${lignes.length} · questions : ${parQuestion.size}`);
  console.log(`constats : ${bloquants.length} bloquant(s), ${constats.length - bloquants.length} à regarder`);
  for (const c of bloquants.slice(0, 10)) console.log(`  ✗ ${c.quoi} — ${c.detail}`);
  if (bloquants.length > 10) console.log(`  … et ${bloquants.length - 10} autres`);
  console.log(`\nrapport complet : ${chemin}`);
  // Sortie NON NULLE s'il y a un bloquant : l'audit doit pouvoir servir de garde dans une
  // chaîne, pas seulement de lecture. Un audit qui sort toujours 0 ne garde rien.
  process.exit(bloquants.length > 0 ? 1 : 0);
}

// NE S'EXÉCUTE QUE LANCÉ DIRECTEMENT. Sans cette garde, importer le module pour éprouver
// ses règles lançait l'audit — donc une tentative de connexion, donc un process.exit au
// milieu d'une suite de tests. Un outil de diagnostic ne doit rien faire quand on le lit.
const lanceDirectement = process.argv[1]
  && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (lanceDirectement) {
  main().catch((e) => {
    console.error('ÉCHEC de l’audit :', e instanceof Error ? e.message : String(e));
    process.exit(2);
  });
}
