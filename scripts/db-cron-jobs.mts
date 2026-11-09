// LECTURE SEULE : liste les jobs pg_cron programmés en base (cron.job) et leur commande.
// Sert à vérifier qu'aucun job planifié n'appelle une fonction qu'on s'apprête à verrouiller.
// AUCUNE écriture. SUPABASE_DB_URL lue de .env.local, jamais affichée. Usage : npx tsx scripts/db-cron-jobs.mts
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
  // L'extension pg_cron peut être absente : on protège la lecture.
  const ext = await client.query(`SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'`);
  if (ext.rowCount === 0) { console.log("pg_cron non installé — aucun job programmé."); process.exit(0); }
  const { rows } = await client.query(
    `SELECT jobid, schedule, jobname, active, command FROM cron.job ORDER BY jobid`,
  );
  if (rows.length === 0) { console.log("cron.job : aucune ligne (aucun job programmé)."); process.exit(0); }
  console.log(`# JOBS pg_cron (${rows.length})\n`);
  for (const r of rows) {
    console.log(`[${r.jobid}] ${r.jobname ?? "(sans nom)"}  schedule=${r.schedule}  active=${r.active}`);
    console.log(`   command: ${r.command}\n`);
  }
} finally {
  await client.end();
}
