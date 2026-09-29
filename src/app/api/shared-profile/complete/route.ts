import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Anti-fraud: award 500pts only if this account has never received the bonus
  const { data: existing } = await supabase
    .from("user_points")
    .select("id")
    .eq("user_id", user.id)
    .eq("action_type", "shared_profile_complete")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, points: 0, reason: "already_awarded" });
  }

  const { error: pointsError } = await supabase.from("user_points").insert({
    user_id: user.id,
    action_type: "shared_profile_complete",
    points: 500,
  });
  if (pointsError) console.error("[shared-profile/complete] user_points insert", pointsError.message);

  // Notify the sender that the profile is complete
  let token: string | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    token = body.token ?? null;
  } catch { /* body already consumed or empty */ }

  if (token) {
    try {
      const admin = createAdminClient();

      const { data: shareLink } = await admin
        .from("share_links")
        .select("sender_id, sender_name")
        .eq("token", token)
        .maybeSingle();

      if (shareLink) {
        const { data: { user: sender } } = await admin.auth.admin.getUserById(shareLink.sender_id);
        if (sender?.email) {
          const ownerFirstName = shareLink.sender_name?.split(" ")[0] ?? "";
          await resend.emails.send({
            from: FROM_EMAIL,
            to: sender.email,
            subject: "La fiche de ton proche est complète ✦",
            html: buildProfileCompleteHtml(ownerFirstName, null),
          });
        }
      }
    } catch (err) {
      console.error("[shared-profile/complete] email notification failed:", err);
      // Non-blocking — points already awarded, don't fail the response
    }
  }

  return NextResponse.json({ success: true, points: 500 });
}

function buildProfileCompleteHtml(ownerFirstName: string, contactFirstName: string | null): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fiche complète</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="padding-bottom:32px;">
            <span style="font-size:13px;font-weight:500;letter-spacing:5px;text-transform:uppercase;color:#2C1A0E;">CANDICE</span>
            <span style="display:inline-block;width:7px;height:7px;background:#C47A4A;border-radius:50%;vertical-align:top;margin-top:3px;margin-left:3px;"></span>
          </td>
        </tr>
        <tr>
          <td style="background:#FFFFFF;border:1px solid #E8C4A0;border-radius:12px;padding:40px 36px;">
            <p style="font-size:36px;margin:0 0 16px;">🎉</p>
            <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#2C1A0E;line-height:1.2;letter-spacing:-0.5px;margin:0 0 8px;">
              Bonne nouvelle${ownerFirstName ? `, ${ownerFirstName}` : ""}.
            </h1>
            <p style="font-size:14px;font-weight:300;color:#C47A4A;margin:0 0 28px;">La fiche de ${contactFirstName ?? "ton proche"} est complète.</p>
            <p style="font-size:15px;font-weight:300;color:#2C1A0E;line-height:1.75;margin:0 0 16px;">
              <strong style="font-weight:500;">${contactFirstName ?? "Ton proche"}</strong> a complété sa fiche.
              Candice a maintenant tout ce qu&rsquo;il faut pour vous aider.
            </p>
            <p style="font-size:15px;font-weight:300;color:#7A5E44;line-height:1.75;margin:0 0 32px;">
              Découvrez les premières suggestions personnalisées — des attentions pensées spécialement pour ${contactFirstName ?? "lui/elle"}.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C47A4A;border-radius:8px;">
                  <a href="${APP_URL}/dashboard" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;">
                    Voir les suggestions →
                  </a>
                </td>
              </tr>
            </table>
            <div style="height:1px;background:#E8C4A0;margin:32px 0;"></div>
            <p style="font-size:12px;font-weight:300;color:#9E7B5A;line-height:1.65;margin:0;">
              ✦&nbsp; Cette fiche complète te rapporte <strong style="color:#C47A4A;">500 points</strong> supplémentaires dans ta cagnotte Candice.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-top:24px;text-align:center;">
            <p style="font-size:11px;font-weight:300;color:#9E7B5A;margin:0;">
              <a href="${APP_URL}" style="color:#C47A4A;text-decoration:none;">candice.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
