import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { endpoint, p256dh_key, auth_key, user_agent } = body;

  if (!endpoint || !p256dh_key || !auth_key) {
    return NextResponse.json({ error: "endpoint, p256dh_key, auth_key required" }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint, p256dh_key, auth_key, user_agent: user_agent ?? null, last_used_at: new Date().toISOString() },
      { onConflict: "user_id,endpoint" }
    );

  if (error) {
    console.error("[push/subscribe]", error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
