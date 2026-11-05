// VÉRIFICATION du lecteur owner-only /moi/sections — rejoue les DEUX requêtes exactes de la page sous la
// RLS owner (authentifié COMME Sophie, jamais le client admin), pour prouver que la page rend bien les 17
// sections avec le verbatim résolu. Lecture seule. Mot de passe lu depuis l'ENV, jamais affiché.
// Usage : npx tsx scripts/sophie-sections-reader-check.mts
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const EMAIL = "sophie.test.journal@candice.app";
const PASSWORD = process.env.SOPHIE_TEST_PASSWORD;
if (!PASSWORD) { console.error("SOPHIE_TEST_PASSWORD absent de .env.local"); process.exit(1); }

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
const { data: auth, error: authErr } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (authErr || !auth.user) { console.error("auth Sophie échouée:", authErr?.message); process.exit(1); }
const userId = auth.user.id;

// ── Requête 1 de la page ────────────────────────────────────────────────────────
const { data: rawSections, error: secErr } = await sb
  .from("profile_analysis_sections")
  .select("section_key, tier, text, affirmations, source_evidence_ids, depends_on_sections, generated_at")
  .eq("user_id", userId).is("contact_id", null).order("tier").order("section_key");
if (secErr) { console.error("Requête 1 (sections) rejetée par la RLS owner:", secErr.message); process.exit(1); }

type Aff = { id: string; type: string; text: string; evidence_ids: string[] };
type Sec = { section_key: string; tier: string | null; text: string | null; affirmations: Aff[] | null; source_evidence_ids: string[] | null };
const sections = (rawSections ?? []) as unknown as Sec[];

// ── Requête 2 de la page ────────────────────────────────────────────────────────
const allIds = Array.from(new Set(sections.flatMap((s) => (s.affirmations ?? []).flatMap((a) => a.evidence_ids ?? []))));
const byId = new Map<string, { question_code: string | null; question_text: string | null; answer_text: string | null; raw_text: string | null }>();
if (allIds.length > 0) {
  const { data: srcRows, error: srcErr } = await sb
    .from("knowledge_sources").select("id, question_code, question_text, answer_text, raw_text").in("id", allIds);
  if (srcErr) { console.error("Requête 2 (sources) rejetée par la RLS owner:", srcErr.message); process.exit(1); }
  for (const r of (srcRows ?? []) as Array<{ id: string } & Record<string, string | null>>) byId.set(r.id, r as never);
}

// ── Ce que la page rendra ─────────────────────────────────────────────────────────
const totalAff = sections.reduce((n, s) => n + (s.affirmations?.length ?? 0), 0);
const empty = sections.filter((s) => !s.text && (s.affirmations?.length ?? 0) === 0).length;
const unresolved = allIds.filter((id) => !byId.has(id));
const withText = allIds.filter((id) => { const r = byId.get(id); return r && (r.question_text || r.answer_text || r.raw_text); });
const affNoEvidence = sections.flatMap((s) => (s.affirmations ?? [])).filter((a) => (a.evidence_ids ?? []).length === 0);
const levels = new Map<string, number>();
for (const s of sections) for (const a of s.affirmations ?? []) levels.set(a.type, (levels.get(a.type) ?? 0) + 1);

console.log(`Chemin owner-only OK (authentifié comme Sophie, RLS appliquée).`);
console.log(`  sections lues              : ${sections.length}`);
console.log(`  dont vides                 : ${empty}`);
console.log(`  affirmations               : ${totalAff}`);
console.log(`  evidences distinctes       : ${allIds.length}`);
console.log(`  résolues en source         : ${allIds.length - unresolved.length}${unresolved.length ? ` (⚠ ${unresolved.length} irrésolubles)` : ""}`);
console.log(`  dont avec verbatim texte   : ${withText.length}`);
console.log(`  affirmations sans evidence : ${affNoEvidence.length}`);
console.log(`  niveaux d'interprétation   : ${[...levels.entries()].map(([k, v]) => `${k}=${v}`).join(" · ") || "—"}`);
console.log(`\n  → la page rendra ces ${sections.length} sections avec, sous chaque affirmation, son niveau et son/ses verbatim.`);
