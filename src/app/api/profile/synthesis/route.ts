import { NextRequest, NextResponse } from 'next/server';
import { runSynthesisAI } from '@/lib/profile/synthesisAI';
import type { ProfileSynthesisFacts } from '@/lib/profile/synthesis';
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Session requise : cette route appelle le modèle. Ouverte, elle laissait n'importe qui
  // le faire travailler aux frais de Candice.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let facts: ProfileSynthesisFacts;
  try {
    const body = await req.json() as { facts: ProfileSynthesisFacts };
    facts = body.facts;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const narrative = await runSynthesisAI(facts);
  return NextResponse.json({ narrative });
}
