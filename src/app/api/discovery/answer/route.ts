import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { recordAnswer } from "@/lib/discovery/engine";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    sessionId: string;
    questionKey: string;
    answer?: string | string[] | null;
    skip?: boolean;
  };

  const { sessionId, questionKey, answer = null, skip = false } = body;

  if (!sessionId || !questionKey) {
    return NextResponse.json({ error: "sessionId et questionKey requis" }, { status: 400 });
  }

  const result = await recordAnswer(
    user.id, sessionId, questionKey, answer, skip, supabase,
  );

  return NextResponse.json(result);
}
