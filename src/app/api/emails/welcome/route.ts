import { NextRequest, NextResponse } from "next/server";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";

export async function POST(request: NextRequest) {
  const { firstName, email } = await request.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Candice est prête.",
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue sur Candice</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding-bottom:32px;">
            <span style="font-size:13px;font-weight:500;letter-spacing:5px;text-transform:uppercase;color:#2C1A0E;">CANDICE</span>
            <span style="display:inline-block;width:7px;height:7px;background:#C47A4A;border-radius:50%;vertical-align:top;margin-top:3px;margin-left:3px;"></span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#FFFFFF;border:1px solid #E8C4A0;border-radius:12px;padding:40px 36px;">

            <!-- Title -->
            <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#2C1A0E;line-height:1.2;letter-spacing:-0.5px;margin:0 0 8px;">
              Bonjour${firstName ? `, ${firstName}` : ""}.
            </h1>
            <p style="font-size:14px;font-weight:300;color:#C47A4A;margin:0 0 28px;">Candice est prête.</p>

            <!-- Body -->
            <p style="font-size:15px;font-weight:300;color:#2C1A0E;line-height:1.75;margin:0 0 16px;">
              Candice est prête à t&rsquo;aider à prendre soin de ceux que tu aimes.
            </p>
            <p style="font-size:15px;font-weight:300;color:#7A5E44;line-height:1.75;margin:0 0 32px;">
              Commence par compléter ta fiche — c&rsquo;est la base de tout. Plus ton profil est précis, plus les attentions que Candice suggère seront justes.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C47A4A;border-radius:8px;">
                  <a href="${APP_URL}/moi/questionnaire" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;">
                    Compléter ma fiche →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="height:1px;background:#E8C4A0;margin:32px 0;"></div>

            <p style="font-size:12px;font-weight:300;color:#9E7B5A;line-height:1.65;margin:0;">
              ✦&nbsp; Plus ta fiche est complète, plus les suggestions seront justes.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:24px;text-align:center;">
            <p style="font-size:11px;font-weight:300;color:#9E7B5A;margin:0;">
              Tu reçois cet e-mail car tu viens de créer un compte Candice.<br />
              <a href="${APP_URL}" style="color:#C47A4A;text-decoration:none;">candice.app</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    console.error("[email/welcome]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
