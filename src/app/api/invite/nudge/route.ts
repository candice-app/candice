import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendPushToUser } from "@/lib/notifications/push-sender";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId } = await req.json() as { contactId: string };
  if (!contactId) return NextResponse.json({ error: "Missing contactId" }, { status: 400 });

  const admin = createAdminClient();

  const { data: contact } = await admin
    .from("contacts")
    .select("id, name, email, proche_user_id")
    .eq("id", contactId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  const piloteFirstName = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? null;

  // Case: proche hasn't registered yet — resend invite link by email
  if (!contact.proche_user_id) {
    if (!contact.email) {
      return NextResponse.json({ method: "none", reason: "no_email" });
    }
    const { data: newLink } = await admin
      .from("invite_links")
      .insert({
        pilote_id: user.id,
        contact_id: contactId,
        pilote_name: piloteFirstName ?? null,
      })
      .select("token")
      .single();
    if (!newLink) return NextResponse.json({ method: "none" });
    const inviteUrl = `${APP_URL}/invite/${newLink.token}`;
    const procheFirstName = contact.name.split(" ")[0];
    await resend.emails.send({
      from: FROM_EMAIL,
      to: contact.email,
      subject: piloteFirstName
        ? `${piloteFirstName} t'a renvoyé un lien Candice ✦`
        : "Ton lien Candice t'attend ✦",
      html: buildReinviteHtml(piloteFirstName, procheFirstName, inviteUrl),
    });
    return NextResponse.json({ method: "email", reason: "reinvite" });
  }

  const procheUserId = contact.proche_user_id as string;

  const { data: procheProfile } = await admin
    .from("my_profile")
    .select("attention_reception, temperament_axes, lifestyle_axes, practical_info")
    .eq("user_id", procheUserId)
    .maybeSingle();

  const procheComplete = !!(
    procheProfile?.attention_reception &&
    procheProfile?.temperament_axes &&
    procheProfile?.lifestyle_axes &&
    procheProfile?.practical_info
  );

  if (procheComplete) {
    return NextResponse.json({ method: "none", reason: "already_complete" });
  }

  const { sent } = await sendPushToUser(
    procheUserId,
    {
      title: "Ton profil Candice t'attend ✦",
      body: piloteFirstName
        ? `${piloteFirstName} veut prendre encore mieux soin de toi — quelques minutes suffisent.`
        : "Quelques minutes de plus, et Candice pourra vraiment personnaliser chaque attention pour toi.",
      url: `${APP_URL}/moi/questionnaire`,
      tag: "nudge-profile",
    },
    admin
  );

  if (sent > 0) return NextResponse.json({ method: "push" });

  // Email fallback
  const { data: { user: procheUser } } = await admin.auth.admin.getUserById(procheUserId);
  if (!procheUser?.email) return NextResponse.json({ method: "none" });

  const procheFirstName = (procheUser.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? null;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: procheUser.email,
    subject: piloteFirstName
      ? `${piloteFirstName} voudrait mieux prendre soin de toi ✦`
      : "Ton profil Candice t'attend ✦",
    html: buildNudgeEmailHtml(piloteFirstName, procheFirstName),
  });

  return NextResponse.json({ method: "email" });
}

function buildNudgeEmailHtml(piloteFirstName: string | null, procheFirstName: string | null): string {
  const greeting = procheFirstName ? `Bonjour ${procheFirstName}.` : "Bonjour.";
  const senderLine = piloteFirstName
    ? `${piloteFirstName} veut prendre encore mieux soin de toi — et Candice est là pour l'aider.`
    : "Quelques minutes pour que Candice te connaisse vraiment.";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>Ton profil Candice</title></head>
<body style="margin:0;padding:0;background:#FDFDFB;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFDFB;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:28px;">
          <span style="font-size:13px;font-weight:500;letter-spacing:5px;text-transform:uppercase;color:#1A1A1A;">CANDICE</span><span style="display:inline-block;width:6px;height:6px;background:#173E31;border-radius:50%;vertical-align:top;margin-top:4px;margin-left:3px;"></span>
        </td></tr>
        <tr><td style="background:#FFFFFF;border:0.5px solid rgba(23,62,49,0.1);border-radius:16px;padding:40px 36px;">
          <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1A1A1A;line-height:1.15;letter-spacing:-0.5px;margin:0 0 8px;">
            ${greeting}
          </h1>
          <p style="font-size:14px;font-weight:300;color:rgba(26,26,26,0.55);margin:0 0 28px;">
            ${senderLine}
          </p>
          <p style="font-size:15px;font-weight:300;color:#1A1A1A;line-height:1.75;margin:0 0 28px;">
            Ton profil n&rsquo;est pas encore terminé. En quelques minutes de plus, Candice pourra vraiment personnaliser chaque attention pour toi &mdash; au bon moment, de la bonne façon, sans que personne n&rsquo;ait à y penser.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#173E31;border-radius:8px;">
            <a href="${APP_URL}/moi/questionnaire" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:500;color:#FDFDFB;text-decoration:none;font-family:Helvetica,Arial,sans-serif;">
              Reprendre mon profil →
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

function buildReinviteHtml(piloteFirstName: string | null, procheFirstName: string, inviteUrl: string): string {
  const greeting = procheFirstName ? `Bonjour ${procheFirstName}.` : "Bonjour.";
  const senderLine = piloteFirstName
    ? `${piloteFirstName} aimerait mieux prendre soin de toi — ton invitation Candice t'attend.`
    : "Ton invitation Candice t'attend.";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>Ton invitation Candice</title></head>
<body style="margin:0;padding:0;background:#FDFDFB;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFDFB;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:28px;">
          <span style="font-size:13px;font-weight:500;letter-spacing:5px;text-transform:uppercase;color:#1A1A1A;">CANDICE</span><span style="display:inline-block;width:6px;height:6px;background:#173E31;border-radius:50%;vertical-align:top;margin-top:4px;margin-left:3px;"></span>
        </td></tr>
        <tr><td style="background:#FFFFFF;border:0.5px solid rgba(23,62,49,0.1);border-radius:16px;padding:40px 36px;">
          <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1A1A1A;line-height:1.15;letter-spacing:-0.5px;margin:0 0 8px;">
            ${greeting}
          </h1>
          <p style="font-size:14px;font-weight:300;color:rgba(26,26,26,0.55);margin:0 0 28px;">
            ${senderLine}
          </p>
          <p style="font-size:15px;font-weight:300;color:#1A1A1A;line-height:1.75;margin:0 0 28px;">
            Quelques questions sur ce qui te fait plaisir, ce qui te touche, ce qu&rsquo;il vaut mieux éviter. Ça prend une vingtaine de minutes &mdash; une seule fois.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#173E31;border-radius:8px;">
            <a href="${inviteUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:500;color:#FDFDFB;text-decoration:none;font-family:Helvetica,Arial,sans-serif;">
              Voir l&rsquo;invitation →
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
