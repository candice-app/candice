import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requestId } = await request.json();
  if (!requestId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { data: req } = await supabase
    .from("profile_share_requests")
    .select("profile_owner_id")
    .eq("id", requestId)
    .single();

  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (req.profile_owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await supabase
    .from("profile_share_requests")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", requestId);

  return NextResponse.json({ ok: true });
}
