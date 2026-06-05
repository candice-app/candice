import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { id: string; action: "revalidate" | "resolve" };
  const { id, action } = body;

  if (!id || !["revalidate", "resolve"].includes(action)) {
    return NextResponse.json({ error: "id et action requis" }, { status: 400 });
  }

  const { data: mem } = await supabase
    .from("memories")
    .select("id")
    .eq("id", id)
    .eq("pilot_id", user.id)
    .maybeSingle();

  if (!mem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "revalidate") {
    const newRevalidate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("memories").update({
      revalidate_at: newRevalidate,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
  } else {
    await supabase.from("memories").update({
      status: "resolved",
      updated_at: new Date().toISOString(),
    }).eq("id", id);
  }

  return NextResponse.json({ success: true });
}
