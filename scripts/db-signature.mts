// INTROSPECTION LECTURE SEULE de la base (client pg). Donne la signature réelle d'une fonction.
// SUPABASE_DB_URL lue depuis .env.local, JAMAIS affichée. AUCUNE requête d'écriture par ce client, jamais
// (migrations écrites par Claude, appliquées par Estelle). Usage : npx tsx scripts/db-signature.mts [proname]
import { readFileSync } from "node:fs";
import pg from "pg";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) { console.error("SUPABASE_DB_URL absent de .env.local"); process.exit(1); }
const proname = process.argv[2] ?? "persist_journal";

const client = new pg.Client({ connectionString: DB_URL });
await client.connect();
try {
  const { rows } = await client.query(
    `SELECT pg_get_function_identity_arguments(p.oid) AS args,
            pg_get_function_result(p.oid)            AS result,
            p.prosecdef                              AS security_definer,
            p.provolatile                            AS volatile,
            (SELECT rolname FROM pg_roles WHERE oid = p.proowner) AS owner,
            p.proconfig                              AS config
     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = $1`,
    [proname],
  );
  if (rows.length === 0) { console.error(`fonction public.${proname} introuvable en base`); process.exit(2); }
  for (const r of rows) {
    console.log(`public.${proname}(${r.args}) RETURNS ${r.result}`);
    console.log(`  security_definer = ${r.security_definer}  (false = INVOKER)`);
    console.log(`  owner            = ${r.owner}`);
    console.log(`  volatile         = ${r.volatile}  (v=VOLATILE)`);
    console.log(`  config           = ${r.config ?? "—"}`);
  }
  // GRANTs (qui peut EXECUTE)
  const { rows: grants } = await client.query(
    `SELECT grantee, privilege_type FROM information_schema.routine_privileges
     WHERE routine_schema='public' AND routine_name=$1 ORDER BY grantee`,
    [proname],
  );
  console.log(`  grants           = ${grants.map((g) => `${g.grantee}:${g.privilege_type}`).join(", ") || "—"}`);
} finally {
  await client.end();
}
