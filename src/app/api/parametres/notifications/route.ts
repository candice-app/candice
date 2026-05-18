import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const ALLOWED = ["notif_push_enabled", "notif_email_enabled", "notif_quiet_hours_start", "notif_quiet_hours_end", "notif_max_per_day"] as const;
type AllowedKey = typeof ALLOWED[number];

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates: Partial<Record<AllowedKey, boolean | number>> = {};
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key];
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("my_profile")
    .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
