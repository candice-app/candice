// DIAGNOSTIC DE CAUSE — proportionnalité §30.2 (lecture SEULE). Pour les sections en violation, montre pour
// chaque affirmation ses source_id, puis le VERBATIM de chaque source et les evidences qu'elle a produites.
// But : distinguer « evidence atomique SUR-LUE » (1 preuve → N affirmations) de « evidence composite
// SOUS-DÉCOUPÉE » (1 ligne de texte libre portant N faits → aurait dû faire N evidences). Aucune écriture.
// Usage : npx tsx scripts/sophie-prop-diagnose.mts
import { readFileSync } from "node:fs";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { createAdminClient } = await import("../src/utils/supabase/admin.ts");
const admin = createAdminClient();
const EMAIL = "sophie.test.journal@candice.app";
const SECTIONS = ["deep_loved", "deep_miss", "univers_marques", "univers_reves"];

let page = 1, userId = "";
for (;;) {
  const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  const u = data.users.find((x) => x.email === EMAIL);
  if (u) { userId = u.id; break; }
  if (data.users.length < 200) break; page++;
}
if (!userId) { console.error("Sophie introuvable"); process.exit(1); }

const { data: secRows } = await admin.from("profile_analysis_sections")
  .select("section_key, affirmations, source_evidence_ids")
  .eq("user_id", userId).is("contact_id", null).in("section_key", SECTIONS);

type Aff = { id: string; type: string; text: string; evidence_ids: string[] };

for (const key of SECTIONS) {
  const row = (secRows ?? []).find((r) => r.section_key === key);
  if (!row) { console.log(`\n### ${key} : introuvable`); continue; }
  const affs: Aff[] = Array.isArray(row.affirmations) ? row.affirmations : [];
  const srcIds = Array.from(new Set(affs.flatMap((a) => a.evidence_ids ?? [])));
  console.log(`\n========== ${key} : ${affs.length} affirmations / ${srcIds.length} source(s) distincte(s) ==========`);
  for (const a of affs) console.log(`  • (${a.type}) [${(a.evidence_ids ?? []).join(",")}] « ${a.text.slice(0, 110)}${a.text.length > 110 ? "…" : ""} »`);

  const { data: srcs } = await admin.from("knowledge_sources")
    .select("id, source_type, question_text, raw_text, answer_text").in("id", srcIds);
  const { data: evs } = await admin.from("knowledge_evidences")
    .select("source_id, target_family, target_construct, raw_information, entity_label, subject_label, preference_value, relation")
    .in("source_id", srcIds);
  console.log(`  — SOURCES (verbatim) :`);
  for (const s of srcs ?? []) {
    console.log(`    [${s.id.slice(0, 8)}] type=${s.source_type}`);
    if (s.question_text) console.log(`       Q: « ${s.question_text} »`);
    console.log(`       raw_text: « ${s.raw_text ?? s.answer_text ?? "—"} »`);
    const mine = (evs ?? []).filter((e) => e.source_id === s.id);
    console.log(`       → ${mine.length} evidence(s) produite(s) :`);
    for (const e of mine) console.log(`           ${e.target_family}:${e.target_construct} « ${e.entity_label ?? e.subject_label ?? e.preference_value ?? e.raw_information ?? "—"} »${e.relation ? ` rel=${e.relation}` : ""}`);
  }
}
