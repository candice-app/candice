import { NextRequest, NextResponse } from 'next/server';
import { runSynthesisAI } from '@/lib/profile/synthesisAI';
import type { ProfileSynthesisFacts } from '@/lib/profile/synthesis';

export async function POST(req: NextRequest): Promise<NextResponse> {
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
