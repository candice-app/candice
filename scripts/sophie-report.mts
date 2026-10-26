// Dump READ-ONLY du journal de Sophie → rapport (tags, provenance, confiance, extraction). Aucune écriture.
// Usage : npx tsx scripts/sophie-report.mts
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
if (!userId) { console.error("Sophie introuvable"); process.exit(1); }

const { data: ev, error: evErr } = await admin.from("knowledge_evidences")
  .select("target_family, target_construct, subject_id, entity_id, entity_label, subject_label, direction, modality, relation, strength, rank, assertion_basis, assertion_status, confidence, context, raw_information, parent_domain")
  .eq("user_id", userId);
if (evErr) console.log("EV ERR:", evErr.message);
const { data: facts } = await admin.from("knowledge_facts")
  .select("fact_type, value, visibility_derived, assertion_status").eq("user_id", userId);
const { data: open, error: okErr } = await admin.from("knowledge_open_knowledge")
  .select("*").eq("user_id", userId);
if (okErr) console.log("OPEN ERR:", okErr.message);

const byFam: Record<string, typeof ev> = {};
for (const e of ev ?? []) (byFam[e.target_family] ??= []).push(e);

console.log(`# Journal de SOPHIE — userId ${userId}\n`);
console.log(`Evidences: ${ev?.length} · FACTs: ${facts?.length} · OpenKnowledge: ${open?.length}\n`);

console.log(`## EVIDENCES par famille (construct · label/relation · force/rang · provenance · confiance)\n`);
for (const fam of Object.keys(byFam).sort()) {
  console.log(`### ${fam}`);
  for (const e of byFam[fam]!) {
    const label = e.entity_label ?? e.subject_label ?? e.raw_information ?? e.subject_id ?? e.entity_id ?? "";
    const dir = [e.direction, e.modality].filter(Boolean).join("/");
    const rel = e.relation ? ` rel=${e.relation}` : "";
    const pd = e.parent_domain ? ` dom=${e.parent_domain}` : "";
    console.log(`  - ${e.target_construct}${dir ? ` [${dir}]` : ""}${rel}${pd} | « ${label} » | force=${e.strength ?? "-"} rang=${e.rank ?? "-"} | ${e.assertion_status}/${e.assertion_basis} | conf=${e.confidence ?? "-"} | ctx=${e.context}`);
  }
  console.log("");
}

console.log(`## FACTs (verbatim)\n`);
for (const f of facts ?? []) console.log(`  - [${f.fact_type}] « ${f.value} » | vis=${f.visibility_derived} | ${f.assertion_status}`);

console.log(`\n## OPEN KNOWLEDGE (reliquat)\n`);
for (const k of open ?? []) console.log(`  - « ${k.subject_label ?? k.subject_id ?? k.raw_information ?? JSON.stringify(k).slice(0,120)} » rel=${k.relation ?? "-"} | conf=${k.confidence ?? "-"} | ${k.assertion_status ?? "-"} | ctx=${k.context ?? "-"}`);

console.log(`\n## TAGS vus par la RESPIRATION (readSocleTags)\n`);
const input = await readSocleTags(admin as never, userId);
console.log(`relation=${input.relation} receiveTop=${input.receiveTop ?? "-"} giveTop=${input.giveTop ?? "-"} tagCount=${input.tagCount}`);
for (const t of input.tags) {
  console.log(`  - ${t.family}:${t.construct}${t.direction ? ` [${t.direction}/${t.modality ?? ""}]` : ""} | force=${t.strength ?? "-"} rang=${t.rank ?? "-"} | prov=${t.basis} | conf=${t.confidence ?? "-"}`);
}
const sfacts = await readSocleFacts(admin as never, userId);
console.log(`\n## FACTs restituables à la respiration (filtre sensibilité) : ${sfacts.length}`);
for (const f of sfacts) console.log(`  - [${f.factType}] « ${f.value} » | ${f.assertionStatus}`);
