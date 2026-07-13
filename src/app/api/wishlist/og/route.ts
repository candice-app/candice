// Aperçu de lien : récupère l'image OpenGraph d'une page (Phase C) quand le
// pilote fournit un web_link sans photo. Best-effort, jamais bloquant.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json().catch(() => ({ url: null })) as { url?: string };
  if (!url || !/^https?:\/\//i.test(url)) return NextResponse.json({ image: null });

  try {
    const ctl = AbortSignal.timeout(5000);
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; CandiceBot/1.0)" }, signal: ctl });
    if (!res.ok) return NextResponse.json({ image: null });
    const html = (await res.text()).slice(0, 200_000);
    const pick = (re: RegExp) => html.match(re)?.[1] ?? null;
    let img =
      pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (img && img.startsWith("//")) img = "https:" + img;
    if (img && img.startsWith("/")) { try { img = new URL(img, url).href; } catch { img = null; } }
    return NextResponse.json({ image: img && /^https?:\/\//i.test(img) ? img : null });
  } catch {
    return NextResponse.json({ image: null });
  }
}
