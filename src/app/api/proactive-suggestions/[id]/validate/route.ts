import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { trackActivity } from "@/lib/lifecycle/track-activity";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: suggestion } = await supabase
    .from("proactive_suggestions")
    .select("id, contact_id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!suggestion) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (suggestion.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (suggestion.status !== "pending" && suggestion.status !== "snoozed") {
    return NextResponse.json({ error: "Already responded" }, { status: 409 });
  }

  const now = new Date().toISOString();

  await Promise.all([
    supabase
      .from("proactive_suggestions")
      .update({ status: "validated", responded_at: now })
      .eq("id", id),
    supabase
      .from("contacts")
      .update({ last_suggestion_at: now })
      .eq("id", suggestion.contact_id)
      .eq("user_id", user.id),
  ]);

  // Track activity
  const adminClient = createAdminClient();
  trackActivity(user.id, adminClient).catch(() => {});

  // TODO Phase 7: trigger facilitation flow (booking, purchase, etc.)

  return NextResponse.json({
    success: true,
    message: "OK je m'en occupe. Je te confirme dès que c'est fait.",
  });
}
