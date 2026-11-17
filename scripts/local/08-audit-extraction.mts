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

const SORTIE = 'scripts/local/.resultats';
const VERSION = 'audit-extraction / 1';

function vocabulaire(nom: string): Set<string> {
  const src = readFileSync('src/lib/knowledge/vocabulary.ts', 'utf8');
  const m = src.match(new RegExp(`export const ${nom} = \\[(.*?)\\] as const;`, 's'));
  if (!m) throw new Error(`${nom} introuvable dans vocabulary.ts — l'audit ne devine pas un vocabulaire`);
  const v = new Set([...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
  if (v.size === 0) throw new Error(`${nom} lu vide — un contrôle sur un ensemble vide ne prouve rien`);
  return v;
}
/** Les codes GRD_ sont étalés depuis un objet : on les prend où ils sont, et on exige d'en trouver. */
function codesGardeFous(): Set<string> {
  const src = readFileSync('src/lib/knowledge/vocabulary.ts', 'utf8');
  const v = new Set([...src.matchAll(/'(GRD_[A-Z_]+)'/g)].map((x) => x[1]));
  if (v.size === 0) throw new Error('aucun code GRD_ trouvé — le contrôle serait creux');
  return v;
}

const DRIVERS = vocabulaire('DRIVER_CODES');
const NEEDS = vocabulaire('NEED_CODES');
const GARDES = codesGardeFous();
const DEGRES = vocabulaire('INTEREST_RELATIONSHIPS');
const RELATIONS = vocabulaire('ENTITY_RELATIONS');
const MODALITES = vocabulaire('AFFECTION_MODALITIES');
const PROFILE_F = vocabulaire('PROFILE_FUNCTIONING_CODES');
const PROFILE_O = vocabulaire('PROFILE_ORIENTATION_CODES');

/** Chemin vertical de garde-fou : libre sous préfixe connu (Dictionnaire §8.3). */
const PREFIXES_VERTICAUX = vocabulaire('GUARDRAIL_VERTICAL_PREFIXES');

interface Ligne {
  source_id: string; question: string | null; reponse: string | null; source_type: string;
  ts: string | null; assertion_status: string | null;
  famille: string | null; construct: string | null; libelle: string | null;
  relationship: string | null; relation: string | null; strength: string | null;
  severity: string | null; value: number | null; confidence: string | null;
}

function constructConnu(famille: string, construct: string): boolean {
  switch (famille) {
    case 'DRIVER': return DRIVERS.has(construct);
    case 'NEED': return NEEDS.has(construct);
    case 'GUARDRAIL':
      return GARDES.has(construct)
        || [...PREFIXES_VERTICAUX].some((p) => construct === p || construct.startsWith(`${p}.`))
        // Les chemins verticaux produits par Discovery OPEN V3 : <domaine>.<attribut>[.<valeur>].
        || /^[a-z0-9_]+\.[a-z0-9_]+/.test(construct);
    case 'PROFILE': return construct === 'SOCIAL_ENERGY' || PROFILE_F.has(construct) || PROFILE_O.has(construct);
    case 'AFFECTION_LANGUAGE': return /^AFFECTION_(RECEIVE|GIVE)_[A-Z_]+$/.test(construct)
      && MODALITES.has(construct.replace(/^AFFECTION_(RECEIVE|GIVE)_/, ''));
    // INTEREST, ENTITY, PREFERENCE, BEHAVIOR, CONTEXT : vocabulaires OUVERTS par conception.
    // On ne peut donc rien y refuser — et c'est le dire qui compte, pas le taire.
    default: return true;
  }
}

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

  const constats: { gravite: 'BLOQUANT' | 'À REGARDER'; quoi: string; detail: string }[] = [];
  const ajout = (gravite: 'BLOQUANT' | 'À REGARDER', quoi: string, detail: string) =>
    constats.push({ gravite, quoi, detail });

  // ── 1. Une source sans aucune preuve : la personne a répondu, Candice n'a rien appris.
  const avecPreuve = new Set(lignes.map((l) => l.source_id));
  for (const s of srcs as Src[]) {
    if (avecPreuve.has(s.id)) continue;
    ajout('BLOQUANT', 'réponse sans aucune preuve',
      `« ${(s.question_text ?? '?').slice(0, 58)} » → « ${(s.answer_text ?? s.raw_text ?? '').slice(0, 44)} » (${s.source_type})`);
  }

  // ── 2. Un construct hors vocabulaire : il empoisonne le portrait sans être rejeté.
  for (const l of lignes) {
    if (!l.famille || !l.construct) {
      ajout('BLOQUANT', 'preuve sans famille ou sans construct', JSON.stringify(l).slice(0, 110));
      continue;
    }
    if (!constructConnu(l.famille, l.construct)) {
      ajout('BLOQUANT', 'construct hors vocabulaire',
        `${l.famille} / « ${l.construct} » — la base l'a accepté, le portrait l'affichera`);
    }
  }

  // ── 3. Aimé ET évité : la contradiction que personne ne voit.
  const aimes = new Map<string, string>(), evites = new Map<string, string>();
  for (const l of lignes) {
    if (l.famille !== 'ENTITY' || !l.construct) continue;
    if (['LOVE', 'LIKE', 'WANT_TO_OWN', 'WANT_TO_TRY', 'WANT_TO_VISIT'].includes(l.relation ?? '')) {
      aimes.set(l.construct, l.libelle ?? l.construct);
    }
    if (['AVOID', 'DISLIKE'].includes(l.relation ?? '')) evites.set(l.construct, l.libelle ?? l.construct);
  }
  for (const [c, lib] of aimes) {
    if (evites.has(c)) ajout('BLOQUANT', 'entité à la fois aimée et évitée', `« ${lib} »`);
  }
  // Et la contradiction de SENS : une surprise aimée alors qu'un garde-fou la refuse.
  const gardeSurprise = lignes.some((l) => l.famille === 'GUARDRAIL'
    && /SCHEDULE_DISRUPTION|LOSS_OF_CONTROL|LAST_MINUTE|surprise/i.test(l.construct ?? ''));
  for (const [, lib] of aimes) {
    if (gardeSurprise && /surprise/i.test(lib)) {
      ajout('BLOQUANT', 'surprise aimée malgré un garde-fou contraire',
        `« ${lib} » est enregistrée comme aimée alors qu'un garde-fou refuse l'imprévu`);
    }
  }

  // ── 4. Degré d'engagement hors échelle, et « passion » venu d'une extraction.
  for (const l of lignes) {
    if (!l.relationship) continue;
    if (!DEGRES.has(l.relationship)) {
      ajout('BLOQUANT', 'degré d’engagement hors échelle',
        `« ${l.relationship} » sur « ${l.libelle ?? l.construct} »`);
    } else if (l.relationship === 'passion' && l.source_type.startsWith('extraction')) {
      ajout('À REGARDER', 'degré « passion » issu d’une extraction',
        `« ${l.libelle ?? l.construct} » — seul mot commun aux deux vocabulaires, où il voulait dire « nature du rapport »`);
    }
  }

  // ── 5. Un refus sans intensité distinguée.
  const refus = lignes.filter((l) => ['AVOID', 'DISLIKE'].includes(l.relation ?? '') || l.famille === 'GUARDRAIL');
  const intensites = new Set(refus.map((l) => l.severity ?? l.strength ?? '∅'));
  if (refus.length >= 2 && intensites.size === 1) {
    ajout('À REGARDER', 'tous les refus à la même intensité',
      `${refus.length} refus, tous « ${[...intensites][0]} » — un veto et une simple mise en retrait ne se distinguent pas`);
  }

  // ── 6. Une déclaration classée comme inférence.
  for (const l of lignes) {
    if (l.assertion_status !== 'inferred') continue;
    const dit = (l.reponse ?? '').toLowerCase();
    if (/surtout pas|jamais|je refuse|je ne veux pas|je déteste|hors de question/.test(dit)) {
      ajout('BLOQUANT', 'déclaration explicite classée comme inférence',
        `« ${(l.reponse ?? '').slice(0, 64)} » → le filtre des rejets déclarés exige « explicit » : ce refus ne sera jamais lu`);
    }
  }

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

main().catch((e) => {
  console.error('ÉCHEC de l’audit :', e instanceof Error ? e.message : String(e));
  process.exit(2);
});
