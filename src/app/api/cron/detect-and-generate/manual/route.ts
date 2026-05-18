import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { detectSignalsForUser } from "@/lib/signals/detector";
import { generateSuggestionForSignal } from "@/lib/signals/generator";
import type { ContextualSignal } from "@/types";

export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = createAdminClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

  const { signals_created } = await detectSignalsForUser(user.id, supabaseAdmin);

  const { data: readySignals } = await supabaseAdmin
    .from("contextual_signals")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .lte("trigger_date", today)
    .limit(10);

  let suggestions_generated = 0;
  for (const signal of readySignals ?? []) {
    const ok = await generateSuggestionForSignal(signal as ContextualSignal, supabaseAdmin);
    if (ok) suggestions_generated++;
  }

  return NextResponse.json({ signals_created, suggestions_generated });
}
