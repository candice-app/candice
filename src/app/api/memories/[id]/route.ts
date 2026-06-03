import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { MEMORY_STATUSES, type MemoryStatus } from "@/lib/brain/types";

function isValidStatus(v: string): v is MemoryStatus {
  return (MEMORY_STATUSES as readonly string[]).includes(v);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json() as { status: string };

  if (!status || !isValidStatus(status))
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

  // Vérifie que la mémoire appartient au pilote
  const { data: mem } = await supabase
    .from("memories")
    .select("id")
    .eq("id", id)
    .eq("pilot_id", user.id)
    .maybeSingle();

  if (!mem)
    return NextResponse.json({ error: "Mémoire introuvable" }, { status: 404 });

  const { error } = await supabase
    .from("memories")
    .update({ status })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
