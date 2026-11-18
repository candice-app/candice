// Upload photo wishlist/carnet → bucket privé contact-photos (réutilisé, flou 1
// validé). Retourne le PATH (stocké en base) + une URL signée 1h pour l'aperçu.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { estIdentifiant, extensionImage, TAILLE_MAX_IMAGE } from "@/lib/storage/chemins";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const scope = (formData.get("scope") as string | null) ?? "wishlist"; // wishlist | carnet
  const contactId = formData.get("contactId") as string | null;
  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  // L'extension vient du type du fichier, jamais de son nom ; l'identifiant de fiche entre dans
  // le chemin, il doit donc en avoir la forme et désigner une fiche de cette personne.
  const ext = extensionImage(file.type);
  if (!ext) return NextResponse.json({ error: "Format non pris en charge (JPEG, PNG ou WebP)" }, { status: 415 });
  if (file.size > TAILLE_MAX_IMAGE) return NextResponse.json({ error: "Image trop lourde (5 Mo max)" }, { status: 413 });
  if (scope === "carnet" && contactId) {
    if (!estIdentifiant(contactId)) return NextResponse.json({ error: "contactId invalide" }, { status: 400 });
    const { data: fiche } = await supabase.from("contacts").select("id").eq("id", contactId).eq("user_id", user.id).maybeSingle();
    if (!fiche) return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 });
  }

  const rid = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const path = scope === "carnet" && contactId
    ? `${user.id}/carnet/${contactId}/${rid}.${ext}`
    : `${user.id}/wishlist/${rid}.${ext}`;
  const bytes = await file.arrayBuffer();

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from("contact-photos")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: signed } = await admin.storage
    .from("contact-photos")
    .createSignedUrl(path, 3600);
  return NextResponse.json({ path, signedUrl: signed?.signedUrl ?? null });
}
