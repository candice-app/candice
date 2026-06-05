import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getNextDripQuestion, createOrResumeSession } from "@/lib/discovery/engine";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "quick";

  const result = mode === "full"
    ? await createOrResumeSession(user.id, supabase)
    : await getNextDripQuestion(user.id, supabase);

  if (!result) return NextResponse.json({ done: true });
  return NextResponse.json(result);
}
