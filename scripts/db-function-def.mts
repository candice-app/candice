// LECTURE SEULE : dump pg_get_functiondef des fonctions nommées (ou de toutes les SECURITY DEFINER du schéma
// public si aucun argument). AUCUNE écriture. SUPABASE_DB_URL lue de .env.local, jamais affichée.
// Usage : npx tsx scripts/db-function-def.mts [nom ...]
import { readFileSync } from "node:fs";
import pg from "pg";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) { console.error("SUPABASE_DB_URL absent de .env.local"); process.exit(1); }
const names = process.argv.slice(2);

const client = new pg.Client({ connectionString: DB_URL });
await client.connect();
try {
  const q = names.length
    ? `SELECT p.proname, pg_get_functiondef(p.oid) AS def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname = ANY($1) ORDER BY array_position($1, p.proname)`
    : `SELECT p.proname, pg_get_functiondef(p.oid) AS def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.prosecdef ORDER BY p.proname`;
  const { rows } = await client.query(q, names.length ? [names] : []);
  for (const r of rows) {
    console.log(`\n═══════════════════════════════════════ ${r.proname} ═══════════════════════════════════════`);
    console.log(r.def);
  }
} finally {
  await client.end();
}
