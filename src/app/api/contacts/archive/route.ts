import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const VALID_REASONS = ['deceased', 'lost_contact', 'end_of_relationship', 'other'];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { contactId, reason, is_memory, memory_anniversary_opt_out } = body;
  if (!contactId) return NextResponse.json({ error: "Missing contactId" }, { status: 400 });
  if (reason && !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { archived_at: new Date().toISOString() };
  if (reason) updates.archive_reason = reason;
  if (typeof is_memory === 'boolean') updates.is_memory_mode = is_memory;
  if (typeof memory_anniversary_opt_out === 'boolean') updates.memory_anniversary_opt_out = memory_anniversary_opt_out;

  const { error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
