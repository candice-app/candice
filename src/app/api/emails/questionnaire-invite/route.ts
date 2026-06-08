import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactEmail, contactFirstName, profileUrl } = await request.json();
  if (!contactEmail) return NextResponse.json({ error: "contactEmail required" }, { status: 400 });

  // Authoritative pilote name from auth metadata
  const piloteFirstName = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? null;

  // Pilote gender from my_profile.practical_info.sexe
  const { data: piloteProfile } = await supabase
    .from("my_profile")
    .select("practical_info")
    .eq("user_id", user.id)
    .maybeSingle();
  const piloteSexe = ((piloteProfile?.practical_info as Record<string, unknown> | null)?.sexe as string | null) ?? null;

  const subject = piloteFirstName
    ? `Une invitation Candice de la part de ${piloteFirstName} ✦`
    : "Une invitation Candice ✦";

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: contactEmail,
    subject,
    html: buildInviteHtml(piloteFirstName, contactFirstName ?? null, profileUrl ?? APP_URL, piloteSexe),
  });

  if (error) {
    console.error("[email/questionnaire-invite]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

function pilotePronom(sexe: string | null): string {
  if (sexe === "femme") return "elle";
  if (sexe === "homme") return "il";
  return "il ou elle";
}

function buildInviteHtml(
  piloteFirstName: string | null,
  procheFirstName: string | null,
  inviteUrl: string,
  piloteSexe: string | null,
): string {
  const greeting = procheFirstName ? `Bonjour ${procheFirstName}.` : "Bonjour.";
  const senderLine = piloteFirstName
    ? `${piloteFirstName} t&rsquo;a invité(e) à créer ta fiche Candice.`
    : "Tu as été invité(e) à créer ta fiche Candice.";
  const pronom = pilotePronom(piloteSexe);
  const helpLine = piloteFirstName
    ? `Candice garde les informations fines et aide simplement ${piloteFirstName} à mieux choisir quand ${pronom} veut te faire plaisir.`
    : "Candice garde les informations fines et aide tes proches à mieux choisir quand ils veulent te faire plaisir.";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /><title>Ton invitation Candice</title></head>
<body style="margin:0;padding:0;background:#FDFDFB;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <span style="display:none;font-size:1px;max-height:0;overflow:hidden;opacity:0;">Pour aider tes proches à mieux penser à toi, sans avoir à tout expliquer.</span>
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
          <p style="font-size:15px;font-weight:300;color:#1A1A1A;line-height:1.75;margin:0 0 20px;">
            Candice apprend ce qui te ressemble&nbsp;: les attentions qui te touchent, les détails qui comptent, les choses à éviter, les petits gestes qui font vraiment la différence.
          </p>
          <p style="font-size:15px;font-weight:300;color:#1A1A1A;line-height:1.75;margin:0 0 32px;">
            L&rsquo;objectif n&rsquo;est pas de tout partager. Au contraire&nbsp;: ta fiche reste à toi. ${helpLine}
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#173E31;border-radius:8px;">
            <a href="${inviteUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:500;color:#FDFDFB;text-decoration:none;font-family:Helvetica,Arial,sans-serif;">
              Découvrir mon invitation →
            </a>
          </td></tr></table>
          <p style="font-size:12px;font-weight:300;color:rgba(26,26,26,0.45);line-height:1.65;margin:24px 0 0;">
            Tu peux répondre à ton rythme et garder la main sur ce qui est visible.
          </p>
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
