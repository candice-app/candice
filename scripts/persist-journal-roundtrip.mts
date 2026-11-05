// ALLER-RETOUR persist_journal (POST-APPLY de la migration 99) — garde-fou contre une dérive TS→SQL.
// jsonb_populate_record ignore SILENCIEUSEMENT les clés en trop : si rows.ts renomme un champ, la colonne
// correspondante reçoit NULL sans que rien ne crie (sauf NOT NULL). Ce test l'attrape : il CLONE de vrais jeux
// (source + enfants) de Sophie — donc des valeurs forcément valides (CHECK/FK) —, les repousse par la fonction
// sous des ids FRAIS, les relit, et compare CHAQUE colonne. Puis supprime (cascade). Couvre les 4 tables en
// choisissant une source porteuse d'evidences, une de facts, une d'open_knowledge.
// S'authentifie COMME Sophie (rôle authenticated : la fonction exige auth.uid(), pas de service_role).
// Usage (après application de la 99) : npx tsx scripts/persist-journal-roundtrip.mts
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { createAdminClient } = await import("../src/utils/supabase/admin.ts");

const EMAIL = "sophie.test.journal@candice.app";
// Mot de passe du compte de test lu depuis l'ENV (jamais en dur dans le dépôt). Le mettre dans .env.local :
//   SOPHIE_TEST_PASSWORD=...   (même valeur que sophie-garnish.mts utilise pour créer le compte)
const PASSWORD = process.env.SOPHIE_TEST_PASSWORD;
if (!PASSWORD) { console.error("SOPHIE_TEST_PASSWORD absent de .env.local — requis pour s'authentifier comme Sophie"); process.exit(1); }

const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
const { data: auth, error: authErr } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (authErr || !auth.user) { console.error("auth Sophie échouée:", authErr?.message); process.exit(1); }
const uid = auth.user.id;
const admin = createAdminClient(); // lecture seule ici (relecture + cleanup), jamais pour l'écriture testée

const uuid = () => globalThis.crypto.randomUUID();
const CHILD = { knowledge_evidences: "source_id", knowledge_facts: "source", knowledge_open_knowledge: "source" } as const;
const strip = (r: Record<string, unknown>) => { const { created_at, ...rest } = r; return rest; };

// Ensemble couvrant : une source par table enfant (pour exercer toutes les colonnes des 4 tables).
const covering = new Set<string>();
for (const [t, col] of Object.entries(CHILD)) {
  const { data } = await admin.from(t).select(col).eq("user_id", uid).limit(1);
  const id = (data?.[0] as Record<string, string> | undefined)?.[col];
  if (id) covering.add(id);
}
if (covering.size === 0) { console.error("aucun enfant chez Sophie — garnir d'abord"); process.exit(1); }

let mismatches = 0;
function compare(label: string, sent: Record<string, unknown>, got: Record<string, unknown> | undefined) {
  if (!got) { console.error(`  ✗ ${label} : non relu`); mismatches++; return; }
  for (const k of Object.keys(sent)) {
    const expect = k === "user_id" ? uid : sent[k];
    const a = JSON.stringify(expect), b = JSON.stringify(got[k]);
    if (a !== b) { console.error(`  ✗ ${label}.${k} : envoyé ${a} ≠ relu ${b}`); mismatches++; }
  }
}

for (const srcId of covering) {
  const { data: srcRows } = await admin.from("knowledge_sources").select("*").eq("id", srcId);
  const src = srcRows?.[0] as Record<string, unknown>;
  const newSrcId = uuid();
  const reSrc = { ...strip(src), id: newSrcId };
  const reKids: Record<string, Record<string, unknown>[]> = {};
  for (const [t, col] of Object.entries(CHILD)) {
    const { data } = await admin.from(t).select("*").eq(col, srcId);
    reKids[t] = ((data ?? []) as Record<string, unknown>[]).map((r) => ({ ...strip(r), id: uuid(), [col]: newSrcId }));
  }
  const { error: rpcErr } = await anon.rpc("persist_journal", {
    p_source: reSrc, p_evidences: reKids.knowledge_evidences, p_facts: reKids.knowledge_facts, p_open: reKids.knowledge_open_knowledge,
  });
  if (rpcErr) { console.error(`persist_journal a échoué (src ${srcId.slice(0, 8)}):`, rpcErr.message); mismatches++; await admin.from("knowledge_sources").delete().eq("id", newSrcId); continue; }

  const { data: gotSrc } = await admin.from("knowledge_sources").select("*").eq("id", newSrcId);
  compare(`source[${newSrcId.slice(0, 8)}]`, reSrc, gotSrc?.[0] ? strip(gotSrc[0] as Record<string, unknown>) : undefined);
  for (const [t] of Object.entries(CHILD)) {
    for (const sent of reKids[t]) {
      const { data } = await admin.from(t).select("*").eq("id", sent.id as string);
      compare(`${t}[${(sent.id as string).slice(0, 8)}]`, sent, data?.[0] ? strip(data[0] as Record<string, unknown>) : undefined);
    }
  }
  await admin.from("knowledge_sources").delete().eq("id", newSrcId); // cascade ON DELETE
}

console.log(`\nALLER-RETOUR (${covering.size} source(s) clonée(s)) : ${mismatches === 0 ? "✓ OK — chaque colonne relue == envoyée (aucune dérive TS→SQL)" : `✗ ${mismatches} écart(s) — voir ci-dessus`}`);
process.exit(mismatches === 0 ? 0 : 1);
