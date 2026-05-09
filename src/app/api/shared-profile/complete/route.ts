import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Anti-fraud: award 500pts only if this account has never received the bonus
  const { data: existing } = await supabase
    .from("user_points")
    .select("id")
    .eq("user_id", user.id)
    .eq("action_type", "shared_profile_complete")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, points: 0, reason: "already_awarded" });
  }

  await supabase.from("user_points").insert({
    user_id: user.id,
    action_type: "shared_profile_complete",
    points: 500,
  });

  return NextResponse.json({ success: true, points: 500 });
}
