import { NextRequest, NextResponse } from "next/server";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";

export async function POST(request: NextRequest) {
  const { contactEmail, contactFirstName, senderFirstName, profileUrl } = await request.json();
  if (!contactEmail) return NextResponse.json({ error: "contactEmail required" }, { status: 400 });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: contactEmail,
    subject: `${senderFirstName ?? "Quelqu'un"} veut mieux te connaître ✦`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ta fiche Candice</title>
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
              Bonjour${contactFirstName ? ` ${contactFirstName}` : ""}.
            </h1>
            <p style="font-size:14px;font-weight:300;color:#C47A4A;margin:0 0 28px;">Une invitation de ${senderFirstName ?? "quelqu'un qui tient à toi"}.</p>

            <!-- Body -->
            <p style="font-size:15px;font-weight:300;color:#2C1A0E;line-height:1.75;margin:0 0 16px;">
              <strong style="font-weight:500;">${senderFirstName ?? "Cette personne"}</strong> utilise Candice pour prendre soin des gens qu&rsquo;il/elle aime.
            </p>
            <p style="font-size:15px;font-weight:300;color:#7A5E44;line-height:1.75;margin:0 0 32px;">
              Il/elle t&rsquo;invite à remplir ta fiche en 5 minutes — tes réponses resteront privées et aideront Candice à suggérer des attentions qui te correspondent vraiment.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C47A4A;border-radius:8px;">
                  <a href="${profileUrl ?? APP_URL}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;">
                    Remplir ma fiche →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="height:1px;background:#E8C4A0;margin:32px 0;"></div>

            <!-- Privacy note -->
            <p style="font-size:12px;font-weight:300;color:#9E7B5A;line-height:1.65;margin:0;">
              🔒&nbsp; <strong style="color:#2C1A0E;font-weight:400;">${senderFirstName ?? "Cette personne"} ne lira jamais tes réponses.</strong>
              Candice les analyse en silence pour personnaliser les attentions — jamais tes mots exacts ne seront partagés.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:24px;text-align:center;">
            <p style="font-size:11px;font-weight:300;color:#9E7B5A;margin:0;">
              Tu reçois cet e-mail car quelqu&rsquo;un t&rsquo;a invité(e) via Candice.<br />
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
    console.error("[email/questionnaire-invite]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
