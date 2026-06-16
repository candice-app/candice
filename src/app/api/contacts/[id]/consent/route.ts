// POST /api/contacts/[id]/consent
// Pilote A crée une demande de partage d'analyse avec le proche B.
// Pré-conditions : contact.proche_user_id != null (B a un compte) et
// une analyse profile_analysis existe pour ce contact.
// Aucune auto-activation : A appuie volontairement sur "Partager".

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contactId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Vérifier que le contact appartient au Pilote A et que B a un compte
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, name, proche_user_id")
    .eq("id", contactId)
    .eq("user_id", user.id)
    .single();

  if (!contact) return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });
  if (!contact.proche_user_id) {
    return NextResponse.json({ error: "Ce proche n'a pas encore créé son compte" }, { status: 422 });
  }

  // Vérifier qu'une analyse existe pour ce contact
  const { data: analysis } = await supabase
    .from("profile_analysis")
    .select("id")
    .eq("user_id", user.id)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (!analysis) {
    return NextResponse.json({ error: "Aucune analyse disponible pour ce proche" }, { status: 422 });
  }

  // Vérifier qu'aucun consent ACTIF n'existe déjà pour cette paire
  const { data: existing } = await supabase
    .from("contact_consents")
    .select("id, status")
    .eq("pilote_id", user.id)
    .eq("contact_id", contactId)
    .in("status", ["active", "pending"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Un partage est déjà en cours", consentId: existing.id },
      { status: 409 }
    );
  }

  // Créer la demande de consentement
  const { data: consent, error: insertErr } = await supabase
    .from("contact_consents")
    .insert({
      pilote_id:      user.id,
      contact_id:     contactId,
      proche_user_id: contact.proche_user_id,
      status:         "pending",
      scope:          ["analysis"],
    })
    .select("id")
    .single();

  if (insertErr || !consent) {
    return NextResponse.json({ error: insertErr?.message ?? "Erreur création" }, { status: 500 });
  }

  // Envoyer un email à B — non bloquant
  notifyProche(
    contact.proche_user_id,
    user.user_metadata?.full_name as string | undefined,
    contact.name.split(" ")[0],
    consent.id
  ).catch(console.error);

  return NextResponse.json({ consentId: consent.id });
}

async function notifyProche(
  procheUserId: string,
  piloteFullName: string | undefined,
  contactFirstName: string,
  consentId: string
): Promise<void> {
  const admin = createAdminClient();
  const { data: { user: proche } } = await admin.auth.admin.getUserById(procheUserId);
  if (!proche?.email) return;

  const piloteFirstName = piloteFullName?.split(" ")[0] ?? "Quelqu'un";
  const procheFirstName = (proche.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "";

  await resend.emails.send({
    from: FROM_EMAIL,
    to: proche.email,
    subject: `${piloteFirstName} veut partager une analyse avec toi ✦`,
    html: buildEmail(piloteFirstName, procheFirstName, contactFirstName, consentId),
  });
}

function buildEmail(
  piloteFirstName: string,
  procheFirstName: string,
  contactFirstName: string,
  consentId: string
): string {
  const url = `${APP_URL}/contacts/partage/${consentId}`;
  const greeting = procheFirstName ? `Bonjour ${procheFirstName}.` : "Bonjour.";
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Partage d'analyse</title></head>
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
            ${piloteFirstName} souhaite partager avec toi l'analyse que Candice a faite de ${contactFirstName}.
          </p>
          <p style="font-size:15px;font-weight:300;color:#1A1A1A;line-height:1.75;margin:0 0 28px;">
            Tu peux voir ce que Candice retient de toi — ou refuser. Aucune obligation.
            Les données brutes saisies par ${piloteFirstName} ne sont <strong>jamais</strong> partagées.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#173E31;border-radius:8px;">
            <a href="${url}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:500;color:#FDFDFB;text-decoration:none;">
              Voir et accepter (ou refuser) →
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
