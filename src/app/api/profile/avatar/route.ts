// POST /api/profile/avatar — photo de profil du pilote (Phase C, arbitrage 8).
// Pattern contact-photos : bucket PRIVÉ « avatars », chemin stocké (jamais
// d'URL), URL signée 1 h retournée. Le recadrage carré se fait côté client
// avant l'envoi — pas de sur-ingénierie serveur.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { invalidateAvatarUrl } from "@/lib/profile/avatar-url";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Format non pris en charge (JPEG, PNG ou WebP)" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image trop lourde (5 Mo max)" }, { status: 413 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/avatar.${ext}`;
  const bytes = await file.arrayBuffer();

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  await supabase
    .from("my_profile")
    .upsert(
      { user_id: user.id, avatar_path: path, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  invalidateAvatarUrl(path); // nouvelle photo → nouvelle URL signée au prochain rendu

  const { data: signed, error: signError } = await admin.storage
    .from("avatars")
    .createSignedUrl(path, 3600);
  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Photo enregistrée mais URL indisponible" }, { status: 500 });
  }
  return NextResponse.json({ signedUrl: signed.signedUrl, path });
}
