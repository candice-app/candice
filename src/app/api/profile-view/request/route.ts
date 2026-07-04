// POST /api/profile-view/request — Sens 1 : X demande à voir la fiche de Y.
//
// - Session + questionnaire rempli (5/5) obligatoires (participation)
// - L'insert passe par le client UTILISATEUR : la policy RLS
//   viewer_create_profile_view_request (migration 49) est la garde réelle
//   (pending seul, jamais pour soi, requested_by = appelant)
// - Notification : email Resend à Y — « X veut voir ton profil »

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";
import { isQuestionnaireComplete, PROFILE_ROW_SELECT, type ProfileRow } from "@/lib/profile/sheet-data";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: myProfile } = await supabase
    .from("my_profile")
    .select(PROFILE_ROW_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!isQuestionnaireComplete(myProfile as unknown as ProfileRow | null)) {
    return NextResponse.json({ error: "questionnaire_incomplete" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { targetUserId?: string };
  const targetUserId = body.targetUserId?.trim();
  if (!targetUserId) return NextResponse.json({ error: "targetUserId requis" }, { status: 400 });
  if (targetUserId === user.id) return NextResponse.json({ error: "Impossible pour soi-même" }, { status: 400 });

  // La cible doit exister et être trouvable (l'UUID vient du lookup, on revérifie)
  const admin = createAdminClient();
  const { data: target } = await admin
    .from("my_profile")
    .select("user_id, is_findable")
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (!target || target.is_findable === false) {
    return NextResponse.json({ error: "Personne introuvable" }, { status: 404 });
  }

  // Doublon amical (les index uniques partiels restent la garde dure)
  const { data: existing } = await supabase
    .from("contact_consents")
    .select("id, status")
    .eq("kind", "profile_view")
    .eq("pilote_id", targetUserId)
    .eq("proche_user_id", user.id)
    .in("status", ["pending", "active"])
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: existing.status === "pending" ? "Demande déjà envoyée" : "Fiche déjà partagée avec toi", consentId: existing.id },
      { status: 409 },
    );
  }

  // Insert via client utilisateur → policy viewer_create_profile_view_request
  const { data: consent, error: insertErr } = await supabase
    .from("contact_consents")
    .insert({
      pilote_id:      targetUserId,
      proche_user_id: user.id,
      requested_by:   user.id,
      contact_id:     null,
      kind:           "profile_view",
      status:         "pending",
      scope:          [],
    })
    .select("id")
    .single();

  if (insertErr || !consent) {
    return NextResponse.json({ error: insertErr?.message ?? "Erreur création" }, { status: 500 });
  }

  // Email à Y — non bloquant
  notifyTarget(
    targetUserId,
    user.user_metadata?.full_name as string | undefined,
    consent.id,
  ).catch(console.error);

  return NextResponse.json({ consentId: consent.id });
}

async function notifyTarget(
  targetUserId: string,
  requesterFullName: string | undefined,
  consentId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data: { user: target } } = await admin.auth.admin.getUserById(targetUserId);
  if (!target?.email) return;

  const requesterFirstName = requesterFullName?.split(" ")[0] ?? "Quelqu'un";
  const targetFirstName = (target.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: target.email,
    subject: `${requesterFirstName} veut voir ton profil`,
    html: buildEmail(requesterFirstName, targetFirstName, consentId),
  });
}

function buildEmail(requesterFirstName: string, targetFirstName: string, consentId: string): string {
  const url = `${APP_URL}/moi/partage/demandes/${consentId}`;
  const greeting = targetFirstName ? `Bonjour ${targetFirstName}.` : "Bonjour.";
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Demande de partage</title></head>
<body style="margin:0;padding:0;background:#FDFDFB;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFDFB;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:28px;">
          <span style="font-size:13px;font-weight:500;letter-spacing:5px;text-transform:uppercase;color:#1A1A1A;">CANDICE</span>
          <span style="display:inline-block;width:6px;height:6px;background:#173E31;border-radius:50%;vertical-align:top;margin-top:4px;margin-left:3px;"></span>
        </td></tr>
        <tr><td style="background:#FFFFFF;border:0.5px solid rgba(23,62,49,0.1);border-radius:16px;padding:40px 36px;">
          <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1A1A1A;line-height:1.15;letter-spacing:-0.5px;margin:0 0 8px;">
            ${greeting}
          </h1>
          <p style="font-size:14px;font-weight:300;color:rgba(26,26,26,0.55);margin:0 0 28px;">
            ${requesterFirstName} veut voir ton profil.
          </p>
          <p style="font-size:15px;font-weight:300;color:#1A1A1A;line-height:1.75;margin:0 0 28px;">
            C'est toi qui décides ce que tu partages : tout, seulement certaines sections,
            ou rien de visible — Candice pourra quand même l'aider à te faire plaisir.
            Tu peux aussi refuser. Rien n'est partagé sans ton accord.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#173E31;border-radius:8px;">
            <a href="${url}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:500;color:#FDFDFB;text-decoration:none;">
              Choisir ce que je partage →
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
