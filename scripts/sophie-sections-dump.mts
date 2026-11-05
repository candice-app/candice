// Dump READ-ONLY des sections de Sophie DÉJÀ stockées (profile_analysis_sections, scope='self'). Aucune
// génération, aucun appel modèle, aucune écriture. Vérifie la traçabilité à l'affirmation (union exacte).
// Usage : npx tsx scripts/sophie-sections-dump.mts
import { readFileSync } from "node:fs";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { createAdminClient } = await import("../src/utils/supabase/admin.ts");
const admin = createAdminClient();
const EMAIL = "sophie.test.journal@candice.app";

let page = 1, userId = "";
for (;;) {
  const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  const u = data.users.find((x) => x.email === EMAIL);
  if (u) { userId = u.id; break; }
  if (data.users.length < 200) break; page++;
}
if (!userId) { console.error("Sophie introuvable"); process.exit(1); }

const { data: rows, error } = await admin.from("profile_analysis_sections")
  .select("section_key, tier, scope, text, affirmations, source_evidence_ids, depends_on_sections, generated_at")
  .eq("user_id", userId).is("contact_id", null).order("tier").order("section_key");
if (error) { console.error("ERR:", error.message); process.exit(1); }

type Aff = { id: string; type: string; text: string; evidence_ids: string[] };
let empty = 0, unionOk = 0;
console.log(`# SECTIONS STOCKÉES — SOPHIE (${rows?.length} lignes, scope=self)\n`);
for (const r of rows ?? []) {
  const affs: Aff[] = Array.isArray(r.affirmations) ? r.affirmations : [];
  const isEmpty = !r.text && affs.length === 0;
  if (isEmpty) empty++;
  const union = Array.from(new Set(affs.flatMap((a) => a.evidence_ids ?? []))).sort();
  const secUnion = [...(r.source_evidence_ids ?? [])].sort();
  const match = JSON.stringify(union) === JSON.stringify(secUnion);
  if (match) unionOk++;
  console.log(`### ${r.section_key} [${r.tier}]${isEmpty ? " — VIDE" : ""}${r.depends_on_sections?.length ? ` ← ${r.depends_on_sections.join(",")}` : ""}`);
  console.log(`   affirmations=${affs.length} · source_evidence_ids=${secUnion.length} · union-exacte=${match ? "OUI" : "NON ⚠"}`);
  for (const a of affs) console.log(`   • (${a.type}) ev=[${(a.evidence_ids ?? []).length}] ${(a.evidence_ids ?? []).length === 0 ? "∅ ⚠" : ""} « ${a.text.slice(0, 90)}${a.text.length > 90 ? "…" : ""} »`);
  console.log("");
}
console.log(`## RÉCAP : ${rows?.length} sections · vides=${empty} · union-exacte OK=${unionOk}/${rows?.length} · affirmations sans evidence=${(rows ?? []).flatMap((r) => (Array.isArray(r.affirmations) ? r.affirmations : []) as Aff[]).filter((a) => (a.evidence_ids ?? []).length === 0).length}`);
