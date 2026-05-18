import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabase
    .from("profile_updates_from_confidences")
    .select("*, contacts(name, relationship)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Internal error" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ update: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const action = body.action as "apply" | "reject" | undefined;

  if (action !== "apply" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'apply' or 'reject'" }, { status: 400 });
  }

  const { data: update } = await supabase
    .from("profile_updates_from_confidences")
    .select("id, user_id, contact_id, field_name, new_value, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!update) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (update.status !== "pending") return NextResponse.json({ error: "Already reviewed" }, { status: 409 });

  const now = new Date().toISOString();

  if (action === "apply" && update.contact_id) {
    const ALLOWED_FIELDS = ["hobbies", "favorite_foods", "conversation_topics", "things_to_avoid", "additional_notes", "gift_preference"];
    if (ALLOWED_FIELDS.includes(update.field_name)) {
      await supabase
        .from("questionnaire_responses")
        .update({ [update.field_name]: update.new_value })
        .eq("contact_id", update.contact_id)
        .eq("user_id", user.id);
    }
  }

  await supabase
    .from("profile_updates_from_confidences")
    .update({ status: action === "apply" ? "applied" : "rejected", reviewed_at: now })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
