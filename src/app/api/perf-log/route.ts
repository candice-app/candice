// F2 STOP final — collecte TEMPORAIRE des mesures perf (à supprimer après
// diagnostic). Écrit via service role dans perf_beacons (aucune policy
// publique). Aucune donnée personnelle : chemins + durées + user-agent.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.kind !== "string") return NextResponse.json({ ok: false }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("perf_beacons").insert({
    kind: String(body.kind).slice(0, 10),
    path: String(body.path ?? "").slice(0, 120),
    from_path: body.from_path ? String(body.from_path).slice(0, 120) : null,
    nav_type: body.nav_type ? String(body.nav_type).slice(0, 20) : null,
    ttfb_ms: numOrNull(body.ttfb_ms),
    dom_ms: numOrNull(body.dom_ms),
    load_ms: numOrNull(body.load_ms),
    click_to_route_ms: numOrNull(body.click_to_route_ms),
    route_to_paint_ms: numOrNull(body.route_to_paint_ms),
    total_ms: numOrNull(body.total_ms),
    to_content_ms: numOrNull(body.to_content_ms),
    skeleton_shown: typeof body.skeleton_shown === "boolean" ? body.skeleton_shown : null,
    ua: body.ua ? String(body.ua).slice(0, 160) : null,
  });
  return NextResponse.json({ ok: true });
}

function numOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}
