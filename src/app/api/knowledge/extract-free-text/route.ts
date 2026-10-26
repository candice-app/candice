// EXTRACTION §27 des réponses LIBRES — frontière SERVEUR (la clé Anthropic ne vit jamais au navigateur).
// Le parcours (QuestionnaireFlow, "use client") écrit déjà le FACT verbatim DÉCLARÉ via produceSocleFact ;
// cette route lance, EN PLUS, l'extraction (inférence niveau 5 : INTEREST/ENTITY + reliquat OpenKnowledge).
// Déclaré et inféré coexistent par design (sources séparées, append) — la préséance garantit que l'inféré
// ne masque jamais le déclaré au read (§48bis). L'owner et l'about sont dérivés de la SESSION, jamais du
// corps de requête (on ne fait pas confiance au client pour un user_id).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAuthClaims } from "@/utils/supabase/claims";
import { extractFreeText } from "@/lib/knowledge-write/extract-free-text";
import type { WriteClient } from "@/lib/knowledge-write/persist";
import { accountAbout, asUserId } from "@/lib/knowledge/identity";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const claims = await getAuthClaims(supabase);
  const sub = claims?.sub as string | undefined;
  if (!sub) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json()) as { entries?: { rawText?: string; fieldContext?: string }[]; timestamp?: string };
  const entries = (body.entries ?? []).filter(
    (e): e is { rawText: string; fieldContext: string } => !!e?.rawText?.trim() && !!e?.fieldContext,
  );
  if (!entries.length) return NextResponse.json({ extracted: 0, failed: 0 });

  const ownerId = asUserId(sub);
  const about = accountAbout(ownerId);
  const timestamp = typeof body.timestamp === "string" ? body.timestamp : new Date().toISOString();
  const client = supabase as unknown as WriteClient;

  // En parallèle : une réponse libre = une extraction indépendante. Best-effort — un échec unitaire
  // n'empêche pas les autres et ne casse jamais le parcours (le FACT déclaré est déjà écrit côté client).
  const results = await Promise.allSettled(
    entries.map((e) =>
      extractFreeText(client, { about, ownerId, rawText: e.rawText, fieldContext: e.fieldContext, timestamp }),
    ),
  );
  const extracted = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - extracted;
  if (failed) console.error(`[extract-free-text] ${failed}/${results.length} extraction(s) en échec`);
  return NextResponse.json({ extracted, failed });
}
