// LECTURE SEULE : le droit TEMPORARY (créer des tables temporaires) est-il détenu par anon / authenticated
// sur la base ? C'est la condition qui rend exploitable function_search_path_mutable sur une SECURITY
// DEFINER (shadowing d'une table non qualifiée via pg_temp). AUCUNE écriture. SUPABASE_DB_URL lue de
// .env.local, jamais affichée. Usage : npx tsx scripts/db-temp-privilege.mts
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
    SELECT current_database() AS db,
           has_database_privilege('anon',          current_database(), 'TEMPORARY') AS anon_temp,
           has_database_privilege('authenticated', current_database(), 'TEMPORARY') AS auth_temp,
           has_database_privilege('public',        current_database(), 'TEMPORARY') AS public_temp`);
  const r = rows[0];
  console.log(`base : ${r.db}`);
  console.log(`TEMPORARY détenu par anon          : ${r.anon_temp}`);
  console.log(`TEMPORARY détenu par authenticated : ${r.auth_temp}`);
  console.log(`TEMPORARY détenu par PUBLIC        : ${r.public_temp}`);
  // ACL brute de la base, pour voir si TEMP a été explicitement révoqué de PUBLIC.
  const { rows: acl } = await client.query(
    `SELECT datacl::text AS datacl FROM pg_database WHERE datname = current_database()`);
  console.log(`\ndatacl (ACL brute de la base) : ${acl[0]?.datacl ?? "NULL (= défauts PostgreSQL : PUBLIC détient TEMP + CONNECT)"}`);
} finally {
  await client.end();
}
