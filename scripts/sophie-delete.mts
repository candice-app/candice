// SUPPRESSION PROPRE des comptes de test (Sophie, Thomas). deleteUser → cascade ON DELETE sur knowledge_*.
// Usage : npx tsx scripts/sophie-delete.mts
import { readFileSync } from "node:fs";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { createAdminClient } = await import("../src/utils/supabase/admin.ts");
const admin = createAdminClient();
const EMAILS = ["sophie.test.journal@candice.app", "thomas.test.journal@candice.app", "parcours.test.journal@candice.app"];

let page = 1;
const toDelete: { id: string; email: string }[] = [];
for (;;) {
  const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  for (const u of data.users) if (u.email && EMAILS.includes(u.email)) toDelete.push({ id: u.id, email: u.email });
  if (data.users.length < 200) break; page++;
}
for (const u of toDelete) {
  await admin.auth.admin.deleteUser(u.id); // cascade knowledge_sources/evidences/facts/open_knowledge
  console.log(`supprimé ${u.email} (${u.id})`);
}
if (!toDelete.length) console.log("aucun compte de test trouvé.");
