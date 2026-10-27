// COMPTE DE PARCOURS NAVIGATEUR — neuf, SÉPARÉ de Sophie et du compte d'Estelle (règle : un profil de test
// est toujours un compte à part, jamais le compte d'Estelle). Identifiants ICI, jamais dans la conversation.
// Supprimé proprement par sophie-delete.mts (email ajouté à sa liste). Usage : npx tsx scripts/walkthrough-account.mts
import { readFileSync } from "node:fs";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { createAdminClient } = await import("../src/utils/supabase/admin.ts");
const admin = createAdminClient();

export const EMAIL = "parcours.test.journal@candice.app";
const PASSWORD = "Parcours-Test-Journal-2026!"; // fixe, connu, dans le script seulement
const DISPLAY = "Parcours — COMPTE DE TEST";

// repart propre (delete cascade knowledge_* + my_profile) puis recrée
let page = 1;
for (;;) {
  const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  const existing = data.users.find((u) => u.email === EMAIL);
  if (existing) { await admin.auth.admin.deleteUser(existing.id); console.log(`ancien ${EMAIL} supprimé`); break; }
  if (data.users.length < 200) break; page++;
}
const { data, error } = await admin.auth.admin.createUser({
  email: EMAIL, password: PASSWORD, email_confirm: true,
  user_metadata: { display_name: DISPLAY, test_account: true },
});
if (error) { console.error(error); process.exit(1); }
console.log(`créé ${EMAIL} → ${data.user.id}`); // mot de passe NON imprimé (il vit dans ce script)
