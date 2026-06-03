import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const VALID_CONFIDENCE = ["haute", "moyenne_haute", "moyenne", "moyenne_basse"] as const;
type ConfidenceLevel = (typeof VALID_CONFIDENCE)[number];

function isValidConfidence(v: string): v is ConfidenceLevel {
  return (VALID_CONFIDENCE as readonly string[]).includes(v);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    contactId,
    description,
    sourceLink,
    brandOption,
    brandName,
    locationHint,
    confidenceLevel,
  } = await req.json() as {
    contactId: string;
    description: string;
    sourceLink?: string;
    brandOption?: string;
    brandName?: string;
    locationHint?: string;
    confidenceLevel: string;
  };

  if (!contactId || !description?.trim())
    return NextResponse.json({ error: "contactId et description requis" }, { status: 400 });

  if (!confidenceLevel || !isValidConfidence(confidenceLevel))
    return NextResponse.json({ error: "confidenceLevel invalide" }, { status: 400 });

  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!contact)
    return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });

  const { data: item, error: itemErr } = await supabase
    .from("wishlist_items")
    .insert({
      contact_id: contactId,
      pilot_id: user.id,
      description: description.trim(),
      source_link: sourceLink?.trim() || null,
      brand_option: brandOption || null,
      brand_name: brandName?.trim() || null,
      location_hint: locationHint?.trim() || null,
      confidence_level: confidenceLevel,
    })
    .select("id")
    .single();

  if (itemErr || !item)
    return NextResponse.json({ error: itemErr?.message ?? "Insert failed" }, { status: 500 });

  return NextResponse.json({ itemId: item.id });
}
