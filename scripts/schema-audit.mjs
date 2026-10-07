// AUDIT DE SCHÉMA — lecture de fichiers SEULE, aucun accès base.
// Extrait les objets DDL de chaque migration, détecte les supersessions (objet créé puis
// droppé par une migration ultérieure, cascade DROP TABLE comprise), et GÉNÈRE une requête
// de contrôle en lecture seule. Le schéma réel est la seule vérité ; cette requête la lit.
// Usage : node scripts/schema-audit.mjs  → écrit scripts/schema-audit-check.sql
//
// Modèle d'un objet ATTENDU : { migration, kind, obj, parent, expect_present, superseded }
//   - créé par la migration        → expect_present = true
//   - rls activé (ENABLE RLS)       → expect_present = true  (vérifié via relrowsecurity)
//   - droppé par la migration       → expect_present = false (vérifié par l'absence)
//   - superseded = true : objet créé puis droppé par une migration ULTÉRIEURE. Son absence
//     n'est alors pas « non appliquée » mais « supersédée ».

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const files = readdirSync('.')
  .filter((f) => /^supabase-migration-.*\.sql$/.test(f))
  .sort((a, b) => {
    const na = parseFloat(a.match(/migration-(\d+)/)[1]);
    const nb = parseFloat(b.match(/migration-(\d+)/)[1]);
    return na !== nb ? na - nb : a.localeCompare(b);
  });
const ordered = ['supabase-schema.sql', ...files];

function statements(sql) {
  const out = []; let i = 0, cur = '', n = sql.length;
  while (i < n) {
    const two = sql.slice(i, i + 2);
    if (two === '--') { const e = sql.indexOf('\n', i); i = e === -1 ? n : e; continue; }
    if (two === '/*') { const e = sql.indexOf('*/', i); i = e === -1 ? n : e + 2; continue; }
    const d = sql.slice(i).match(/^\$([A-Za-z0-9_]*)\$/);
    if (d) { const tag = d[0]; const e = sql.indexOf(tag, i + tag.length); const end = e === -1 ? n : e + tag.length; cur += sql.slice(i, end); i = end; continue; }
    const ch = sql[i];
    if (ch === ';') { if (cur.trim()) out.push(cur.trim()); cur = ''; i++; continue; }
    cur += ch; i++;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const clean = (s) => s.replace(/"/g, '').replace(/^public\./i, '').trim();

function extract(stmt) {
  const created = [], dropped = [];
  const s = stmt.replace(/\s+/g, ' ').trim();
  let m;
  if ((m = s.match(/^CREATE TABLE (?:IF NOT EXISTS )?("?[\w.]+"?)/i))) created.push({ kind: 'table', obj: clean(m[1]), parent: null });
  if ((m = s.match(/^ALTER TABLE (?:IF EXISTS )?(?:ONLY )?("?[\w.]+"?)/i))) {
    const t = clean(m[1]);
    let c; const colRe = /ADD COLUMN (?:IF NOT EXISTS )?("?\w+"?)/gi; const addedCols = [];
    while ((c = colRe.exec(s))) { const col = clean(c[1]); created.push({ kind: 'column', obj: col, parent: t }); addedCols.push(col); }
    // FK IMPLICITE : une colonne ajoutée avec REFERENCES crée une contrainte nommée par défaut
    // <table>_<col>_fkey (ex. la colonne générée contact_id de la 83 recrée *_contact_id_fkey).
    if (/\bREFERENCES\b/i.test(s)) for (const col of addedCols) created.push({ kind: 'constraint', obj: `${t}_${col}_fkey`, parent: t });
    let k; const conRe = /ADD CONSTRAINT ("?\w+"?)/gi;
    while ((k = conRe.exec(s))) created.push({ kind: 'constraint', obj: clean(k[1]), parent: t });
    if (/ENABLE ROW LEVEL SECURITY/i.test(s)) created.push({ kind: 'rls_enabled', obj: t, parent: t });
    let d; const dcol = /DROP COLUMN (?:IF EXISTS )?("?\w+"?)/gi;
    while ((d = dcol.exec(s))) dropped.push({ kind: 'column', obj: clean(d[1]), parent: t });
    let dc; const dcon = /DROP CONSTRAINT (?:IF EXISTS )?("?\w+"?)/gi;
    while ((dc = dcon.exec(s))) dropped.push({ kind: 'constraint', obj: clean(dc[1]), parent: t });
  }
  if ((m = s.match(/^CREATE (?:UNIQUE )?INDEX (?:CONCURRENTLY )?(?:IF NOT EXISTS )?("?[\w.]+"?) ON ("?[\w.]+"?)/i))) created.push({ kind: 'index', obj: clean(m[1]), parent: clean(m[2]) });
  if ((m = s.match(/^CREATE POLICY (?:"([^"]+)"|(\S+)) ON ("?[\w.]+"?)/i))) created.push({ kind: 'policy', obj: clean(m[1] || m[2]), parent: clean(m[3]) });
  // ALTER POLICY … RENAME TO … : la policy existe sous son NOUVEAU nom (effet vérifiable)
  if ((m = s.match(/^ALTER POLICY (?:"([^"]+)"|(\S+)) ON ("?[\w.]+"?) RENAME TO (?:"([^"]+)"|(\S+))/i))) created.push({ kind: 'policy', obj: clean(m[4] || m[5]), parent: clean(m[3]) });
  if ((m = s.match(/^CREATE (?:OR REPLACE )?FUNCTION ("?[\w.]+"?)\s*\(/i))) created.push({ kind: 'function', obj: clean(m[1]), parent: null });
  if ((m = s.match(/^CREATE (?:OR REPLACE )?(?:CONSTRAINT )?TRIGGER ("?\w+"?)/i))) created.push({ kind: 'trigger', obj: clean(m[1]), parent: null });
  if ((m = s.match(/^DROP TABLE (?:IF EXISTS )?("?[\w.]+"?)/i))) dropped.push({ kind: 'table', obj: clean(m[1]), parent: null });
  if ((m = s.match(/^DROP POLICY (?:IF EXISTS )?(?:"([^"]+)"|(\S+)) ON ("?[\w.]+"?)/i))) dropped.push({ kind: 'policy', obj: clean(m[1] || m[2]), parent: clean(m[3]) });
  if ((m = s.match(/^DROP INDEX (?:IF EXISTS )?("?[\w.]+"?)/i))) dropped.push({ kind: 'index', obj: clean(m[1]), parent: null });
  return { created, dropped };
}

const renameMap = new Map(); // ancien nom de table → nouveau (ALTER TABLE … RENAME TO …)
const migs = ordered.map((file, idx) => {
  let sql; try { sql = readFileSync(file, 'utf8'); } catch { return null; }
  const created = [], dropped = [];
  for (const st of statements(sql)) {
    const e = extract(st); created.push(...e.created); dropped.push(...e.dropped);
    const rm = st.replace(/\s+/g, ' ').match(/^ALTER TABLE (?:IF EXISTS )?("?[\w.]+"?) RENAME TO ("?[\w.]+"?)/i);
    if (rm) renameMap.set(clean(rm[1]), clean(rm[2]));
  }
  return { file, idx, created, dropped };
}).filter(Boolean);
// résolution 1 niveau (pas de chaîne de renommages dans ce dépôt)
const resolveT = (n) => (n == null ? n : (renameMap.get(n) ?? n));

// ── Supersession : drops directs + cascade DROP TABLE sur les enfants (même parent) ──
const dropIdxByKey = new Map();            // kind|obj|parent → idx du 1er drop
const dropByNameKind = new Map();          // kind|obj (parent ignoré) — index/contrainte : le DROP ne nomme pas la table
const tableDropIdx = new Map();            // table → idx du DROP TABLE
for (const mig of migs) for (const d of mig.dropped) {
  const k = `${d.kind}|${d.obj}|${d.parent ?? ''}`;
  if (!dropIdxByKey.has(k)) dropIdxByKey.set(k, mig.idx);
  const nk = `${d.kind}|${d.obj}`;
  if (!dropByNameKind.has(nk)) dropByNameKind.set(nk, mig.idx);
  if (d.kind === 'table' && !tableDropIdx.has(d.obj)) tableDropIdx.set(d.obj, mig.idx);
}
for (const mig of migs) for (const o of mig.created) {
  const direct = dropIdxByKey.get(`${o.kind}|${o.obj}|${o.parent ?? ''}`);
  const byName = (o.kind === 'index' || o.kind === 'constraint') ? dropByNameKind.get(`${o.kind}|${o.obj}`) : undefined;
  const viaTable = o.kind === 'table' ? tableDropIdx.get(o.obj)
    : (o.parent ? tableDropIdx.get(o.parent) : undefined);
  const di = [direct, byName, viaTable].filter((x) => x !== undefined && x > mig.idx).sort((a, b) => a - b)[0];
  o.supersededBy = di !== undefined ? migs.find((x) => x.idx === di).file : null;
}

// ── Objets ATTENDUS pour la requête ──
const expected = [];
// nom sous lequel vérifier l'objet aujourd'hui (table/rls → obj résolu ; colonne/policy → parent résolu)
const probeObj = (o) => (o.kind === 'table' || o.kind === 'rls_enabled') ? resolveT(o.obj) : o.obj;
const probeParent = (o) => (o.kind === 'column' || o.kind === 'policy') ? resolveT(o.parent) : o.parent;
for (const mig of migs) {
  const createdKeys = new Set(mig.created.map((o) => `${o.kind}|${o.obj}|${o.parent ?? ''}`));
  for (const o of mig.created) expected.push({ migration: mig.file, kind: o.kind, obj: o.obj, parent: o.parent, expect: true, superseded: !!o.supersededBy, pObj: probeObj(o), pParent: probeParent(o) });
  for (const d of mig.dropped) {
    // auto-drop idempotent (DROP IF EXISTS puis CREATE du même objet dans la même migration) → net créé
    if (createdKeys.has(`${d.kind}|${d.obj}|${d.parent ?? ''}`)) continue;
    expected.push({ migration: mig.file, kind: d.kind, obj: d.obj, parent: d.parent, expect: false, superseded: false, pObj: d.obj, pParent: d.parent });
  }
}
// Migrations SANS aucun objet attendu = invérifiables (data/valeurs pures)
const withItems = new Set(expected.map((e) => e.migration));
const unverifiable = migs.filter((m) => !withItems.has(m.file)).map((m) => m.file);

// ── Génération SQL ──
const esc = (v) => v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const valRows = expected.map((e) => `  (${esc(e.migration)}, ${esc(e.kind)}, ${esc(e.obj)}, ${esc(e.parent)}, ${e.expect}, ${e.superseded}, ${esc(e.pObj)}, ${esc(e.pParent)})`);

const withBlock = `WITH expected(migration, kind, obj, parent, expect_present, superseded, probe_obj, probe_parent) AS (VALUES
${valRows.join(',\n')}
),
checked AS (
  SELECT e.*,
    CASE e.kind
      WHEN 'table'       THEN EXISTS (SELECT 1 FROM information_schema.tables t  WHERE t.table_schema='public' AND t.table_name=e.probe_obj)
      WHEN 'column'      THEN EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=e.probe_parent AND c.column_name=e.probe_obj)
      WHEN 'index'       THEN EXISTS (SELECT 1 FROM pg_indexes i               WHERE i.schemaname='public' AND i.indexname=e.probe_obj)
      WHEN 'policy'      THEN EXISTS (SELECT 1 FROM pg_policies p               WHERE p.schemaname='public' AND p.tablename=e.probe_parent AND p.policyname=e.probe_obj)
      WHEN 'constraint'  THEN EXISTS (SELECT 1 FROM pg_constraint k            WHERE k.conname=e.probe_obj)
      WHEN 'function'    THEN EXISTS (SELECT 1 FROM pg_proc pr JOIN pg_namespace n ON n.oid=pr.pronamespace WHERE n.nspname='public' AND pr.proname=e.probe_obj)
      WHEN 'trigger'     THEN EXISTS (SELECT 1 FROM pg_trigger tg              WHERE NOT tg.tgisinternal AND tg.tgname=e.probe_obj)
      WHEN 'rls_enabled' THEN EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=e.probe_obj AND c.relrowsecurity)
    END AS present
  FROM expected e
)`;

const sqlOut = `-- AUDIT DE SCHÉMA — requête de CONTRÔLE, LECTURE SEULE. Généré par scripts/schema-audit.mjs.
-- N'ÉCRIT RIEN. Deux instructions AUTONOMES, exécutables telles quelles de haut en bas :
--   (B) verdict par migration   (le tableau demandé)
--   (A) détail objet par objet  (pour investiguer un verdict)
-- expect_present : l'objet doit-il exister ? (créé/rls = oui ; droppé = non).
-- superseded : objet créé puis droppé par une migration ULTÉRIEURE → son absence = « supersédée ».
--
-- INVÉRIFIABLES par le schéma seul (ni CREATE, ni DROP, ni ENABLE RLS — INSERT/UPDATE/COMMENT,
-- correctifs de valeurs) : à confirmer par comptage de lignes ou le journal applied_migrations.
-- Elles N'APPARAISSENT PAS ci-dessous (aucun objet à vérifier) :
--   ${unverifiable.join(', ') || '(aucune)'}

-- ════════════════ (B) VERDICT PAR MIGRATION ════════════════
${withBlock}
SELECT migration,
  CASE
    WHEN count(*) FILTER (WHERE expect_present) > 0
     AND count(*) FILTER (WHERE expect_present AND present) = 0
     AND count(*) FILTER (WHERE expect_present AND NOT present AND superseded)
         = count(*) FILTER (WHERE expect_present)
      THEN 'supersédée'
    WHEN count(*) FILTER (WHERE (expect_present AND present) OR (expect_present AND superseded) OR (NOT expect_present AND NOT present)) = count(*)
     AND count(*) FILTER (WHERE (expect_present AND present) OR (NOT expect_present AND NOT present)) > 0
      THEN 'appliquée'
    WHEN count(*) FILTER (WHERE expect_present AND present) = 0
     AND count(*) FILTER (WHERE NOT expect_present AND NOT present) = 0
      THEN 'non appliquée'
    ELSE 'PARTIELLE — investiguer via (A)'
  END AS verdict,
  count(*) FILTER (WHERE expect_present) AS attendus_presents,
  count(*) FILTER (WHERE expect_present AND present) AS reellement_presents,
  count(*) FILTER (WHERE NOT expect_present) AS attendus_absents,
  count(*) FILTER (WHERE NOT expect_present AND NOT present) AS reellement_absents
FROM checked GROUP BY migration
ORDER BY COALESCE(NULLIF(regexp_replace(migration, '\\D', '', 'g'), '')::int, 0), migration;

-- ════════════════ (A) DÉTAIL OBJET PAR OBJET ════════════════
${withBlock}
SELECT migration, kind, COALESCE(parent||'.', '')||obj AS objet,
       expect_present, present, superseded,
       (present = expect_present) AS conforme
FROM checked
ORDER BY migration, kind, objet;
`;
writeFileSync('scripts/schema-audit-check.sql', sqlOut);

// ── Impression ──
let nCreated = 0, nDropped = 0, nRls = 0, nSuper = 0;
for (const mig of migs) {
  const items = [];
  for (const o of mig.created) {
    if (o.kind === 'rls_enabled') nRls++; else nCreated++;
    if (o.supersededBy) nSuper++;
    items.push(`+${o.kind}:${o.parent && o.kind !== 'rls_enabled' ? o.parent + '.' : ''}${o.obj}${o.supersededBy ? ' ⟂' + o.supersededBy.match(/migration-([\w]+)/)[1] : ''}`);
  }
  for (const d of mig.dropped) { nDropped++; items.push(`−${d.kind}:${d.parent ? d.parent + '.' : ''}${d.obj}`); }
  const cls = items.length === 0 ? 'INVÉRIFIABLE' : 'vérifiable';
  console.log(`${mig.file}  [${cls}]  ${items.length ? items.join('  ') : '(aucun objet de schéma)'}`);
}
// ── Génération de la migration 84 (journal + backfill AUTO-VÉRIFIANT) ──
function probe(o) {
  const q = (v) => String(v).replace(/'/g, "''");
  switch (o.kind) {
    case 'table':       return `EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='${q(resolveT(o.obj))}')`;
    case 'column':      return `EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='${q(resolveT(o.parent))}' AND column_name='${q(o.obj)}')`;
    case 'index':       return `EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='${q(o.obj)}')`;
    case 'policy':      return `EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='${q(resolveT(o.parent))}' AND policyname='${q(o.obj)}')`;
    case 'constraint':  return `EXISTS (SELECT 1 FROM pg_constraint WHERE conname='${q(o.obj)}')`;
    case 'function':    return `EXISTS (SELECT 1 FROM pg_proc pr JOIN pg_namespace n ON n.oid=pr.pronamespace WHERE n.nspname='public' AND pr.proname='${q(o.obj)}')`;
    case 'trigger':     return `EXISTS (SELECT 1 FROM pg_trigger WHERE NOT tgisinternal AND tgname='${q(o.obj)}')`;
    case 'rls_enabled': return `EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='${q(resolveT(o.obj))}' AND c.relrowsecurity)`;
  }
}
const MIG84 = 'supabase-migration-84-applied-migrations-journal.sql';
// Helpers one-shot CADUCS : objet de schéma = fonction transitoire SANS appelant, qu'on
// n'applique JAMAIS (ex. 58 map_scope_v1_to_v2). Classés à part, pas « manque à combler ».
const CADUC = new Set(['supabase-migration-58-scope-v2-mapping.sql']);
const backfillLines = [], notBackfilled = [], caducHelpers = [];
for (const mig of migs) {
  if (mig.file === MIG84) continue; // la 84 s'auto-enregistre explicitement, pas de backfill d'elle-même
  if (CADUC.has(mig.file)) { caducHelpers.push(mig.file); continue; } // caduque, jamais appliquée
  const sig = mig.created.find((o) => !o.supersededBy);
  const f = mig.file.replace(/'/g, "''");
  if (sig) {
    // créé non supersédé → appliquée ⇔ l'objet existe
    backfillLines.push(`INSERT INTO applied_migrations (filename) SELECT '${f}'\n  WHERE ${probe(sig)}\n  ON CONFLICT (filename) DO NOTHING;`);
  } else if (mig.dropped.length) {
    // migration pur-DROP → appliquée ⇔ la cible est ABSENTE (cohérent avec le verdict B)
    backfillLines.push(`INSERT INTO applied_migrations (filename) SELECT '${f}'\n  WHERE NOT (${probe(mig.dropped[0])})\n  ON CONFLICT (filename) DO NOTHING;`);
  } else {
    notBackfilled.push(mig.file); // data pure, ou objets entièrement supersédés
  }
}
const mig84 = `-- Migration 84 — journal des migrations (applied_migrations).
-- REJOUABLE sans dommage (CREATE IF NOT EXISTS, backfill auto-vérifiant, ON CONFLICT DO NOTHING).
--
-- Le journal n'existait pas. La table applied_migrations ci-dessous devient, à partir d'ICI,
-- la trace d'application — chaque migration future s'y inscrit en DERNIÈRE instruction.
--
-- Backfill AUTO-VÉRIFIANT : chaque migration 1→83 n'est inscrite QUE si un objet-signature
-- qu'elle a créé existe réellement en base (le schéma établit l'application, jamais la liste
-- de fichiers). Les migrations suivantes NE sont PAS backfillées (aucun objet vérifiable
-- aujourd'hui) — leur application réelle est connue mais non prouvable par le schéma seul :
--   • sans objet de schéma (data/valeurs) : ${notBackfilled.filter((f) => unverifiable.includes(f)).join(', ') || '—'}
--   • objets entièrement supersédés (droppés depuis) : ${notBackfilled.filter((f) => !unverifiable.includes(f)).join(', ') || '—'}
--   • helper one-shot CADUC, jamais à appliquer (fonction transitoire sans appelant) : ${caducHelpers.join(', ') || '—'}
-- Estelle peut ajouter les deux premières catégories à la main (elles ont bien tourné) ;
-- la dernière NE doit PAS être appliquée (voir migration correspondante).

BEGIN;

CREATE TABLE IF NOT EXISTS applied_migrations (
  filename   text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- RLS activée DÉLIBÉRÉMENT SANS politique (même parti que cron_runs, migration 76) : aucun
-- client anon/authenticated n'a de raison de lire ce journal. Les migrations qui l'alimentent
-- tournent avec un rôle propriétaire/service_role qui CONTOURNE la RLS (ENABLE, pas FORCE) ;
-- les INSERT ci-dessous passent donc. Sans politique, RLS bloque tout rôle non-BYPASSRLS.
ALTER TABLE applied_migrations ENABLE ROW LEVEL SECURITY;

${backfillLines.join('\n')}

-- DERNIÈRE INSTRUCTION — auto-enregistrement (convention permanente à partir de la 84).
INSERT INTO applied_migrations (filename) VALUES ('supabase-migration-84-applied-migrations-journal.sql')
  ON CONFLICT (filename) DO NOTHING;

COMMIT;
`;
writeFileSync('supabase-migration-84-applied-migrations-journal.sql', mig84);

console.log(`\n════ SYNTHÈSE ════`);
console.log(`objets créés: ${nCreated} · rls activés: ${nRls} · objets droppés: ${nDropped} · dont supersédés (créés puis droppés ultérieurement): ${nSuper}`);
console.log(`INVÉRIFIABLES (${unverifiable.length}): ${unverifiable.join(', ') || '—'}`);
console.log(`\nRequête écrite dans scripts/schema-audit-check.sql (résultats A + B).`);
