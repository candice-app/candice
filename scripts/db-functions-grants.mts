// RECENSEMENT LECTURE SEULE de toutes les fonctions du schéma public : nom, INVOKER/DEFINER, search_path,
// et rôles ayant EXECUTE. Signale les SECURITY DEFINER exécutables par anon (vrai trou potentiel).
// AUCUNE écriture. SUPABASE_DB_URL lue de .env.local, jamais affichée. Usage : npx tsx scripts/db-functions-grants.mts
import { readFileSync } from "node:fs";
import pg from "pg";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) { console.error("SUPABASE_DB_URL absent de .env.local"); process.exit(1); }

const client = new pg.Client({ connectionString: DB_URL });
await client.connect();
try {
  const { rows } = await client.query(`
    SELECT p.proname AS name,
           pg_get_function_identity_arguments(p.oid) AS args,
           p.prosecdef AS definer,
           COALESCE((SELECT string_agg(c, ', ') FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'), '(non figé)') AS search_path,
           COALESCE((
             SELECT string_agg(DISTINCT rp.grantee, ', ' ORDER BY rp.grantee)
             FROM information_schema.routine_privileges rp
             WHERE rp.specific_schema = 'public' AND rp.routine_name = p.proname AND rp.privilege_type = 'EXECUTE'
           ), '—') AS exec_roles
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
    ORDER BY p.prosecdef DESC, p.proname`);

  const definerAnon: string[] = [];
  console.log(`# FONCTIONS DU SCHÉMA public (${rows.length})\n`);
  console.log(`DEF/INV | search_path        | EXECUTE roles                               | fonction`);
  console.log(`--------|--------------------|---------------------------------------------|---------`);
  for (const r of rows) {
    const mode = r.definer ? "DEFINER" : "invoker";
    const roles = String(r.exec_roles);
    const sp = String(r.search_path).replace(/^search_path=/, "");
    if (r.definer && /\banon\b/.test(roles)) definerAnon.push(`${r.name}(${r.args})`);
    console.log(`${mode.padEnd(7)} | ${sp.padEnd(18)} | ${roles.padEnd(43)} | ${r.name}`);
  }
  console.log(`\n## SECURITY DEFINER exécutables par anon (vrai trou potentiel) : ${definerAnon.length}`);
  if (definerAnon.length) for (const f of definerAnon) console.log(`  ⚠ ${f}`);
  else console.log(`  (aucune)`);

  // Récap : combien de fonctions portent anon et/ou service_role dans EXECUTE
  const withAnon = rows.filter((r) => /\banon\b/.test(String(r.exec_roles))).length;
  const withSvc = rows.filter((r) => /\bservice_role\b/.test(String(r.exec_roles))).length;
  console.log(`\n## Écart documentaire potentiel (default privileges Supabase) :`);
  console.log(`  fonctions avec anon dans EXECUTE        : ${withAnon}/${rows.length}`);
  console.log(`  fonctions avec service_role dans EXECUTE : ${withSvc}/${rows.length}`);
} finally {
  await client.end();
}
