import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";
import { createAdminClient } from "@/utils/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SuggestionForReminder {
  id: string;
  title: string;
  description: string;
  priority: string;
}

const SUBJECT: Record<string, string> = {
  urgent: "Une attention urgente vous attend — Candice",
  high:   "Une attention importante vous attend — Candice",
  normal: "Une idée de Candice vous attend",
  low:    "Quand vous aurez un moment — Candice",
};

function buildHtml(suggestion: SuggestionForReminder): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
            <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:#2C1A0E;line-height:1.25;letter-spacing:-0.3px;margin:0 0 20px;">
              ${suggestion.title}
            </h1>
            <p style="font-size:15px;font-weight:300;color:#2C1A0E;line-height:1.75;margin:0 0 32px;">
              ${suggestion.description}
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#C47A4A;border-radius:8px;">
                  <a href="${APP_URL}/dashboard" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;">
                    Voir dans Candice →
                  </a>
                </td>
              </tr>
            </table>
            <div style="height:1px;background:#E8C4A0;margin:32px 0;"></div>
            <p style="font-size:12px;font-weight:300;color:#9E7B5A;margin:0;line-height:1.65;">
              Candice garde cette attention en attente jusqu&rsquo;à votre décision.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding-top:24px;text-align:center;">
            <p style="font-size:11px;font-weight:300;color:#9E7B5A;margin:0;">
              <a href="${APP_URL}/parametres/notifications" style="color:#C47A4A;text-decoration:none;">Gérer mes notifications</a>
              &nbsp;·&nbsp;
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

export async function sendReminderEmail(
  userId: string,
  suggestion: SuggestionForReminder,
  supabaseAdmin: SupabaseClient
): Promise<boolean> {
  // Check preference
  const { data: prefs } = await supabaseAdmin
    .from("my_profile")
    .select("notif_email_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (prefs?.notif_email_enabled === false) return false;

  // Get user email via admin auth
  const authAdmin = createAdminClient();
  const { data: authData } = await authAdmin.auth.admin.getUserById(userId);
  const email = authData?.user?.email;
  if (!email) return false;

  const subject = SUBJECT[suggestion.priority] ?? SUBJECT.normal;
  const html = buildHtml(suggestion);

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    html,
  });

  await supabaseAdmin.from("notification_log").insert({
    user_id: userId,
    channel: "email",
    notification_type: "proactive_reminder",
    related_suggestion_id: suggestion.id,
    title: suggestion.title,
    status: error ? "failed" : "sent",
    error_message: error ? error.message : null,
  });

  if (error) console.error("[email-reminder]", error.message);
  return !error;
}
