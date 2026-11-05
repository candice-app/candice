// Dump READ-ONLY des sections de Sophie DÉJÀ stockées (profile_analysis_sections, scope='self'). Aucune
// génération, aucun appel modèle, aucune écriture. Vérifie la traçabilité à l'affirmation (union exacte).
// Usage : npx tsx scripts/sophie-sections-dump.mts
import { readFileSync } from "node:fs";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { createAdminClient } = await import("../src/utils/supabase/admin.ts");
const { readSocleTags, readSocleFacts } = await import("../src/lib/questionnaire/breath-tags.ts");
const { selectSectionInputs } = await import("../src/lib/profile/profile-sections.ts");
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

// DÉNOMINATEUR RE-BASÉ (évidences distinctes de la matière, pas sources) — DÉTERMINISTE : recalcule la matière
// de chaque section depuis le journal de Sophie (indépendant du modèle). evidenceBacked = items non-fact.
const { tags } = await readSocleTags(admin as never, userId);
const facts = await readSocleFacts(admin as never, userId);
const inputs = selectSectionInputs(tags, facts);
const evBackedByKey = new Map(inputs.map((i) => [i.key, i.items.filter((m: { fromFact?: boolean }) => !m.fromFact).length]));

const { data: rows, error } = await admin.from("profile_analysis_sections")
  .select("section_key, tier, scope, text, affirmations, source_evidence_ids, depends_on_sections, generated_at")
  .eq("user_id", userId).is("contact_id", null).order("tier").order("section_key");
if (error) { console.error("ERR:", error.message); process.exit(1); }

type Aff = { id: string; type: string; text: string; evidence_ids: string[] };
let empty = 0, unionOk = 0, propViol = 0, zeroEv = 0;
const violators: string[] = [], zeroEvList: string[] = [];
console.log(`# SECTIONS STOCKÉES — SOPHIE (${rows?.length} lignes, scope=self)\n`);
for (const r of rows ?? []) {
  const affs: Aff[] = Array.isArray(r.affirmations) ? r.affirmations : [];
  const isEmpty = !r.text && affs.length === 0;
  if (isEmpty) empty++;
  const union = Array.from(new Set(affs.flatMap((a) => a.evidence_ids ?? []))).sort();
  const secUnion = [...(r.source_evidence_ids ?? [])].sort();
  const match = JSON.stringify(union) === JSON.stringify(secUnion);
  if (match) unionOk++;
  // DÉNOMINATEUR RE-BASÉ : evidences distinctes de la matière (synthèses : union des détails → on retombe sur secUnion).
  // Synthèses : évidences héritées des détails (union) → on prend secUnion ; détails : évidences de la matière.
  const distinctEv = r.tier === "synthesis" ? secUnion.length : (evBackedByKey.get(r.section_key) ?? secUnion.length);
  const zero = affs.length > 0 && distinctEv === 0;
  // Exemption convergence bornée (≥2 ev, tendance|implication, au plus 1) — miroir du détecteur.
  const convergences = affs.filter((a) => (a.evidence_ids?.length ?? 0) >= 2 && (a.type === "tendance" || a.type === "implication")).length;
  const chargeable = affs.length - Math.min(1, convergences); // au plus 1 convergence exemptée
  const prop = !zero && chargeable > distinctEv;
  if (zero) { zeroEv++; zeroEvList.push(`${r.section_key} (${affs.length} aff / 0 ev)`); }
  if (prop) { propViol++; violators.push(`${r.section_key} (${affs.length}>${distinctEv})`); }
  const flag = zero ? " — ZÉRO EVIDENCE ⚠" : prop ? " — PROPORTIONNALITÉ ⚠" : "";
  console.log(`### ${r.section_key} [${r.tier}]${isEmpty ? " — VIDE" : ""}${flag}${r.depends_on_sections?.length ? ` ← ${r.depends_on_sections.join(",")}` : ""}`);
  console.log(`   affirmations=${affs.length} · sources=${secUnion.length} · evidences(matière)=${distinctEv} · union-exacte=${match ? "OUI" : "NON ⚠"}`);
  console.log("");
}
console.log(`## RÉCAP : ${rows?.length} sections · vides=${empty} · union-exacte OK=${unionOk}/${rows?.length}`);
console.log(`## PROPORTIONNALITÉ re-basée (affirmations > evidences distinctes) : ${propViol}${propViol ? " → " + violators.join(", ") : ""}`);
console.log(`## ZÉRO EVIDENCE (affirmations sur du verbatim non extrait) : ${zeroEv}${zeroEv ? " → " + zeroEvList.join(", ") : ""}`);
