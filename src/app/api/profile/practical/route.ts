// POST /api/profile/practical — édition directe des faits pratiques depuis
// la fiche (C3 STOP C : sheets dédiées, plus aucun renvoi vers la page
// questionnaire legacy). Merge partiel dans practical_info, clés VERROUILLÉES.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const REGIMES = ["", "omnivore", "vegetarien", "vegan", "halal", "casher", "sans_preference", "autre"];
const ALCOOLS = ["", "je_bois", "ne_bois_pas", "occasionnel", "eviter_lieux"];
const ALLERGIES = ["aucune", "gluten", "lactose", "fruits_a_coque", "fruits_de_mer", "autre"];
const DATE_TYPES = ["anniversaire", "fete", "mariage", "perso", "symbolique"];

interface PatchBody {
  adresse_livraison?: string;
  taille_vetements?: string;
  taille_chaussures?: string;
  regime?: string;
  alcool?: string;
  allergies?: string[];
  allergies_detail?: string;
  dates_importantes?: Array<{ type: string; label: string; date: string }>;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as PatchBody;
  const patch: Record<string, unknown> = {};

  if (typeof body.adresse_livraison === "string") patch.adresse_livraison = body.adresse_livraison.trim().slice(0, 400);
  if (typeof body.taille_vetements === "string") patch.taille_vetements = body.taille_vetements.trim().slice(0, 40);
  if (typeof body.taille_chaussures === "string") patch.taille_chaussures = body.taille_chaussures.trim().slice(0, 40);
  if (typeof body.regime === "string" && REGIMES.includes(body.regime)) patch.regime = body.regime;
  if (typeof body.alcool === "string" && ALCOOLS.includes(body.alcool)) patch.alcool = body.alcool;
  // Allergies (A.1) : donnée de sécurité — enum structuré (moteur de vetos)
  // + précision libre
  if (Array.isArray(body.allergies)) {
    patch.allergies = body.allergies.filter(a => ALLERGIES.includes(a)).slice(0, 6);
  }
  if (typeof body.allergies_detail === "string") {
    patch.allergies_detail = body.allergies_detail.trim().slice(0, 300);
  }
  if (Array.isArray(body.dates_importantes)) {
    patch.dates_importantes = body.dates_importantes
      .filter(d => d && DATE_TYPES.includes(d.type))
      .slice(0, 30)
      .map(d => ({
        type: d.type,
        label: (d.label ?? "").toString().trim().slice(0, 80),
        date: /^\d{4}-\d{2}-\d{2}$/.test(d.date ?? "") ? d.date : "",
      }));
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Aucun champ éditable" }, { status: 400 });
  }

  const { data: row } = await supabase
    .from("my_profile")
    .select("practical_info")
    .eq("user_id", user.id)
    .maybeSingle();

  const merged = { ...((row?.practical_info as Record<string, unknown>) ?? {}), ...patch };
  const { error } = await supabase
    .from("my_profile")
    .upsert(
      { user_id: user.id, practical_info: merged, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
