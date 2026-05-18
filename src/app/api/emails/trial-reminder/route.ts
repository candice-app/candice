import { NextResponse } from 'next/server';
import { resend, FROM_EMAIL, APP_URL } from '@/lib/resend';
import { createAdminClient } from '@/utils/supabase/admin';

// Internal service route — called by lifecycle-check cron only
export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { userId, email, daysLeft } = body as { userId: string; email: string; daysLeft: number };
  if (!userId || !email || !daysLeft) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const subjects: Record<number, string> = {
    7: `Plus que 7 jours d'essai — souhaites-tu poursuivre avec Candice ?`,
    3: `Candice tient à toi — encore 3 jours pour décider`,
    1: `Dernier jour de ton essai Candice`,
  };

  const intros: Record<number, string> = {
    7: `Ton essai gratuit se termine dans 7 jours. Candice a déjà appris à connaître tes proches — ne laisse pas ces attentions s'arrêter.`,
    3: `Il te reste 3 jours. Candice a préparé des idées pour chacun de tes proches, et continue d'en découvrir chaque jour.`,
    1: `C'est le dernier jour de ton essai. Dans 24h, Candice se mettra en pause — mais elle sera toujours là quand tu voudras reprendre.`,
  };

  const subject = subjects[daysLeft] ?? `Ton essai Candice arrive bientôt à terme`;
  const intro = intros[daysLeft] ?? `Ton essai gratuit se termine bientôt.`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFCF8;border-radius:12px;border:1px solid #E8DFD4;overflow:hidden;">
        <tr><td style="padding:40px 40px 0;text-align:center;">
          <p style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:400;color:#2C1A0E;margin:0 0 8px;">Candice</p>
          <p style="font-size:12px;font-weight:300;color:#9E7B5A;margin:0;letter-spacing:2px;text-transform:uppercase;">Conciergerie relationnelle</p>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="font-size:15px;font-weight:300;color:#3D2A1E;line-height:1.7;margin:0 0 20px;">${intro}</p>
          <table width="100%"><tr><td align="center" style="padding:8px 0;">
            <a href="${APP_URL}/parametres/abonnement" style="display:inline-block;background:#C47A4A;color:#fff;font-size:13px;font-weight:400;padding:14px 28px;border-radius:8px;text-decoration:none;">
              Continuer avec Candice →
            </a>
          </td></tr></table>
          <p style="font-size:11px;font-weight:300;color:#9E7B5A;text-align:center;margin:24px 0 0;line-height:1.6;">
            Ton compte reste accessible. Tu peux reprendre à tout moment depuis tes paramètres.
          </p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #E8DFD4;text-align:center;">
          <p style="font-size:10px;font-weight:300;color:#B5A090;margin:0;line-height:1.6;">
            Candice · <a href="${APP_URL}/parametres/notifications" style="color:#B5A090;">Se désabonner</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const admin = createAdminClient();
  await admin.from('notification_log').insert({
    user_id: userId,
    channel: 'email',
    notification_type: `trial_reminder_${daysLeft}`,
    status: 'sent',
  });

  return NextResponse.json({ ok: true });
}
