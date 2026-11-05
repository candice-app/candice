// VÉRIFICATION LIGNE 4 sur SOPHIE — génère les sections self depuis le JOURNAL (regenerateSelfSections),
// les écrit dans profile_analysis_sections (scope='self'), puis DUMP avec la traçabilité à l'AFFIRMATION.
// Lit le journal résolu (préséance, supersédées exclues) → modèle réel (claude-sonnet-4-6) → sections.
// N'écrit QUE les sections de Sophie (compte synthétique). Aucune autre table touchée.
// Usage : npx tsx scripts/sophie-sections.mts
import { readFileSync } from "node:fs";

// --- charge .env.local AVANT tout import des modules (clé Anthropic lue à la construction du module) ---
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { createAdminClient } = await import("../src/utils/supabase/admin.ts");
const { regenerateSelfSections } = await import("../src/lib/profile/generate-sections-run.ts");
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
if (!userId) { console.error("Sophie introuvable — garnir d'abord (npx tsx scripts/sophie-garnish.mts)"); process.exit(1); }

// --- matière disponible (ce que la génération va lire) ---
const { tags } = await readSocleTags(admin as never, userId);
const facts = await readSocleFacts(admin as never, userId);
console.log(`# VÉRIFICATION LIGNE 4 — SOPHIE (userId ${userId})\n`);
console.log(`Matière lue du journal : ${tags.length} tag(s) résolu(s) · ${facts.length} FACT(s) restituable(s)\n`);

// --- génération réelle (modèle) + écriture des sections ---
const sections = await regenerateSelfSections({ readClient: admin as never, storeClient: admin as never, userId });

console.log(`## SECTIONS GÉNÉRÉES : ${sections.length}\n`);
let emptyCount = 0;
for (const s of sections) {
  const affs = s.affirmations ?? [];
  const empty = !s.text && affs.length === 0;
  if (empty) emptyCount++;
  console.log(`### ${s.key} [${s.tier}]${empty ? "  — VIDE" : ""}`);
  if (s.dependsOnSections?.length) console.log(`   dépend de : ${s.dependsOnSections.join(", ")}`);
  if (s.text) console.log(`   texte : ${s.text}`);
  for (const a of affs) {
    console.log(`   • (${a.type}) « ${a.text} »`);
    console.log(`       evidence_ids [${a.evidence_ids.length}] : ${a.evidence_ids.join(", ") || "∅"}`);
  }
  // TRAÇABILITÉ : l'union section DOIT être l'union exacte des evidence_ids d'affirmations (CHECK migration 97).
  const union = Array.from(new Set(affs.flatMap((a) => a.evidence_ids))).sort();
  const sectionUnion = [...(s.sourceEvidenceIds ?? [])].sort();
  const match = JSON.stringify(union) === JSON.stringify(sectionUnion);
  console.log(`   source_evidence_ids (section) [${sectionUnion.length}] union-exacte=${match ? "OUI" : "NON ⚠"}`);
  console.log("");
}

console.log(`## RÉCAPITULATIF`);
console.log(`- sections générées : ${sections.length}`);
console.log(`- sections VIDES (pas de texte, pas d'affirmation) : ${emptyCount}`);
console.log(`- toutes les unions section == union exacte des affirmations : ${sections.every((s) => {
  const u = Array.from(new Set((s.affirmations ?? []).flatMap((a) => a.evidence_ids))).sort();
  return JSON.stringify(u) === JSON.stringify([...(s.sourceEvidenceIds ?? [])].sort());
}) ? "OUI" : "NON ⚠"}`);
