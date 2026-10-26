// Appelle la VRAIE route /api/socle/breath (serveur dev) avec les tags/facts de Sophie → textes réels.
// (c) respiration socle cumulative · (d) conclusion finale (subject:self). Aucun texte fabriqué.
import { readFileSync } from "node:fs";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { createAdminClient } = await import("../src/utils/supabase/admin.ts");
const { readSocleTags, readSocleFacts } = await import("../src/lib/questionnaire/breath-tags.ts");
const admin = createAdminClient();

const EMAIL = "sophie.test.journal@candice.app";
let page = 1, userId = "";
for (;;) {
  const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  const u = data.users.find((x) => x.email === EMAIL);
  if (u) { userId = u.id; break; }
  if (data.users.length < 200) break; page++;
}

const input = await readSocleTags(admin as never, userId);
const facts = await readSocleFacts(admin as never, userId);

async function breath(label: string, body: unknown) {
  const res = await fetch("http://localhost:3000/api/socle/breath", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: "beta_access=1" }, body: JSON.stringify(body),
  });
  const data = (await res.json()) as { text?: string };
  console.log(`\n================ ${label} ================\n`);
  console.log(data.text ?? `(vide — HTTP ${res.status})`);
}

// (c) respiration socle cumulative
await breath("RESPIRATION SOCLE (cumulative)", { ...input, facts });
// (d) conclusion analytique finale
await breath("CONCLUSION ANALYTIQUE FINALE (subject:self)", { ...input, facts, subject: "self" });
