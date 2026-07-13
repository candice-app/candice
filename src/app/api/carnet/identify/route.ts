// Identification IA d'un produit à partir d'une photo (Carnet, mode « Prendre
// en photo »). TOUJOURS faillible → l'UI affiche « vérifie avant d'enregistrer ».
// Réutilise la photo déjà stockée (contact-photos) via son path.
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

const anthropic = new Anthropic();

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path } = await req.json() as { path?: string };
  if (!path || !path.startsWith(`${user.id}/`))
    return NextResponse.json({ error: "path invalide" }, { status: 400 });

  try {
    const admin = createAdminClient();
    const dl = await admin.storage.from("contact-photos").download(path);
    if (dl.error || !dl.data) return NextResponse.json({ brand: null, product: null });
    const buf = Buffer.from(await dl.data.arrayBuffer());
    const media = (dl.data.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      system: "Tu identifies un produit sur une photo pour aider à repérer une idée cadeau. Réponds UNIQUEMENT en JSON: {\"brand\": string|null, \"product\": string court|null}. Si tu n'es pas sûr, mets null. Jamais de phrase, juste le JSON.",
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: media, data: buf.toString("base64") } },
          { type: "text", text: "Quel est ce produit ? Marque et modèle si reconnaissables." },
        ],
      }],
    });
    const text = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "";
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    const parsed = json ? JSON.parse(json) as { brand?: string | null; product?: string | null } : {};
    return NextResponse.json({
      brand: parsed.brand?.trim() || null,
      product: parsed.product?.trim() || null,
    });
  } catch {
    return NextResponse.json({ brand: null, product: null });
  }
}
