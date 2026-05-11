import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const contactId = formData.get("contactId") as string | null;

  if (!file || !contactId) {
    return NextResponse.json({ error: "Missing file or contactId" }, { status: 400 });
  }

  // Verify ownership
  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("user_id", user.id)
    .single();

  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${contactId}/avatar.${ext}`;
  const bytes = await file.arrayBuffer();

  const admin = createAdminClient();

  const { error: uploadError } = await admin.storage
    .from("contact-photos")
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Store the path (not a URL) so we can generate fresh signed URLs later
  await supabase
    .from("contacts")
    .update({ photo_url: path })
    .eq("id", contactId);

  const { data: signed, error: signError } = await admin.storage
    .from("contact-photos")
    .createSignedUrl(path, 3600);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Upload succeeded but could not generate signed URL" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: signed.signedUrl, path });
}
