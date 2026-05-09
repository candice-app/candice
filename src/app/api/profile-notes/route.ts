import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contact_id, note } = await request.json();
  if (!note?.trim()) return NextResponse.json({ error: "Note vide" }, { status: 400 });

  const { error } = await supabase.from("profile_notes").insert({
    user_id: user.id,
    contact_id: contact_id ?? null,
    note: note.trim(),
  });

  if (error) return NextResponse.json({ error: "Erreur" }, { status: 500 });
  return NextResponse.json({ success: true });
}
