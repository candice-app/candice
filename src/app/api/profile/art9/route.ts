// POST /api/profile/art9 — espace sensible (point 12 STOP C).
// Colonnes dédiées my_profile (religion, disability, health_comfort) —
// JAMAIS dans practical_info, JAMAIS dans un scope de partage (never).
// La saisie volontaire vaut consentement par l'acte ; null = effacement
// immédiat et total en base.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const FIELDS = ["religion", "disability", "health_comfort"] as const;
type Art9Field = typeof FIELDS[number];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as Partial<Record<Art9Field, string | null>>;
  const patch: Record<string, string | null> = {};
  for (const f of FIELDS) {
    if (!(f in body)) continue;
    const v = body[f];
    patch[f] = v === null || (typeof v === "string" && v.trim() === "")
      ? null
      : String(v).trim().slice(0, 600);
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Aucun champ" }, { status: 400 });
  }

  const { error } = await supabase
    .from("my_profile")
    .upsert(
      { user_id: user.id, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
