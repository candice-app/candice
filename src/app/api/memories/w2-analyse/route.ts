import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type SupportedMime = (typeof SUPPORTED_MIME_TYPES)[number];

function isSupportedMime(m: string): m is SupportedMime {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(m);
}

function domainHint(url: string): string {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    const BRANDS: Record<string, string> = {
      "sezane.com": "Sézane",
      "ba-sh.com": "Ba&sh",
      "rouje.com": "Rouje",
      "apc.fr": "A.P.C.",
      "apc.com": "A.P.C.",
      "zara.com": "Zara",
      "hm.com": "H&M",
      "maje.com": "Maje",
      "claudiepicot.com": "Claudie Pierlot",
      "& other stories": "& Other Stories",
      "arket.com": "Arket",
      "cos.com": "COS",
      "amiacalva.com": "Ami Paris",
    };
    const brand = Object.entries(BRANDS).find(([d]) => host.includes(d));
    return brand ? `Un article ${brand[1]}` : `Un article depuis ${host}`;
  } catch {
    return "Un article partagé via lien";
  }
}

async function describeFromPhoto(photoBase64: string, mimeType: SupportedMime): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 80,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mimeType, data: photoBase64 },
        },
        {
          type: "text",
          text: "Décris en 10-20 mots l'article principal visible : type d'objet, couleur principale, style si perceptible (ex: \"robe longue blanche, style fluide\" ou \"sac structuré noir, allure chic\"). Si rien n'est identifiable, réponds : \"Je ne distingue pas clairement l'article.\" Ne commence pas par je/il y a.",
        },
      ],
    }],
  });
  const text = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "";
  return text || "Je ne distingue pas clairement l'article.";
}

async function reformatDescription(description: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 80,
    messages: [{
      role: "user",
      content: `Reformule en 10-20 mots cette description d'article de manière sobre et précise : "${description}". Commence directement par la description.`,
    }],
  });
  const text = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "";
  return text || description;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { photoBase64, mimeType, sourceLink, description } = await req.json() as {
    photoBase64?: string;
    mimeType?: string;
    sourceLink?: string;
    description?: string;
  };

  if (!photoBase64 && !sourceLink && !description?.trim())
    return NextResponse.json({ error: "Aucune entrée fournie" }, { status: 400 });

  let itemDescription = "";

  try {
    if (photoBase64 && mimeType && isSupportedMime(mimeType)) {
      itemDescription = await describeFromPhoto(photoBase64, mimeType);
    } else if (sourceLink) {
      itemDescription = domainHint(sourceLink);
      if (description?.trim()) {
        itemDescription = await reformatDescription(description.trim());
      }
    } else if (description?.trim()) {
      itemDescription = await reformatDescription(description.trim());
    }
  } catch {
    // deterministic fallback
    if (description?.trim()) {
      itemDescription = description.trim().slice(0, 120);
    } else if (sourceLink) {
      itemDescription = domainHint(sourceLink);
    } else {
      itemDescription = "Article repéré";
    }
  }

  return NextResponse.json({ itemDescription });
}
