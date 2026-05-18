import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { RefusalReason } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const refusal_reason = body.refusal_reason as RefusalReason | undefined;

  if (!refusal_reason) {
    return NextResponse.json({ error: "refusal_reason required" }, { status: 400 });
  }

  const { data: suggestion } = await supabase
    .from("proactive_suggestions")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!suggestion) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (suggestion.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (suggestion.status !== "pending" && suggestion.status !== "snoozed") {
    return NextResponse.json({ error: "Already responded" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const isSnoozed = refusal_reason === "not_now";

  const update: Record<string, string> = {
    status: isSnoozed ? "snoozed" : "refused",
    refusal_reason,
    responded_at: now,
  };

  if (isSnoozed) {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 21);
    update.expires_at = snoozeUntil.toISOString();
  }

  await supabase
    .from("proactive_suggestions")
    .update(update)
    .eq("id", id);

  return NextResponse.json({ success: true });
}
