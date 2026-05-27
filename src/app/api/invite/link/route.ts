import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json() as { token: string };
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invite_links")
    .select("id, pilote_id, contact_id, pilote_name, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }

  // Idempotent: mark used only if not already set
  await admin
    .from("invite_links")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id)
    .is("used_at", null);

  // Link proche_user_id to contact
  if (invite.contact_id) {
    await admin
      .from("contacts")
      .update({ proche_user_id: user.id })
      .eq("id", invite.contact_id);
  }

  // Non-blocking: notify Pilote
  notifyPilote(
    invite.pilote_id,
    invite.pilote_name,
    (user.user_metadata?.full_name as string | undefined) ?? null
  ).catch(console.error);

  return NextResponse.json({ success: true });
}

async function notifyPilote(
  piloteId: string,
  piloteName: string | null,
  procheFullName: string | null
): Promise<void> {
  const admin = createAdminClient();
  const { data: { user: pilote } } = await admin.auth.admin.getUserById(piloteId);
  if (!pilote?.email) return;

  const piloteFirstName = piloteName?.split(" ")[0] ?? "";
  const procheFirstName = procheFullName?.split(" ")[0] ?? null;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: pilote.email,
    subject: `${procheFirstName ? `${procheFirstName} a` : "Ton proche a"} complété sa fiche ✦`,
    html: buildNotifHtml(piloteFirstName, procheFirstName),
  });
}

function buildNotifHtml(piloteFirstName: string, procheFirstName: string | null): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>Fiche complète</title></head>
<body style="margin:0;padding:0;background:#FDFDFB;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFDFB;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:28px;">
          <span style="font-size:13px;font-weight:500;letter-spacing:5px;text-transform:uppercase;color:#1A1A1A;">CANDICE</span><span style="display:inline-block;width:6px;height:6px;background:#173E31;border-radius:50%;vertical-align:top;margin-top:4px;margin-left:3px;"></span>
        </td></tr>
        <tr><td style="background:#FFFFFF;border:0.5px solid rgba(23,62,49,0.1);border-radius:16px;padding:40px 36px;">
          <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1A1A1A;line-height:1.15;letter-spacing:-0.5px;margin:0 0 8px;">
            ${piloteFirstName ? `Bonne nouvelle, ${piloteFirstName}.` : "Bonne nouvelle."}
          </h1>
          <p style="font-size:14px;font-weight:300;color:rgba(26,26,26,0.55);margin:0 0 28px;">
            ${procheFirstName ?? "Ton proche"} a complété son profil sur Candice.
          </p>
          <p style="font-size:15px;font-weight:300;color:#1A1A1A;line-height:1.75;margin:0 0 28px;">
            Candice a maintenant tout ce qu&rsquo;il faut pour t&rsquo;aider à prendre soin de ${procheFirstName ?? "cette personne"}. Découvre les premières attentions personnalisées.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#173E31;border-radius:8px;">
            <a href="${APP_URL}/contacts" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:500;color:#FDFDFB;text-decoration:none;font-family:Helvetica,Arial,sans-serif;">
              Voir ses attentions →
            </a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="font-size:11px;font-weight:300;color:rgba(26,26,26,0.4);margin:0;">
            <a href="${APP_URL}" style="color:rgba(26,26,26,0.4);text-decoration:none;">candice.app</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
