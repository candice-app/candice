import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json() as { token: string; response_data: Record<string, unknown> };
  const { token, response_data } = body;

  if (!token || !response_data) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: shareLink } = await admin
    .from("share_links")
    .select("id, sender_user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!shareLink) return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }

  const { error } = await admin
    .from("shared_profile_responses")
    .upsert(
      {
        token,
        user_id: null,
        response_data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
