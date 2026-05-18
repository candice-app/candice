import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { resend, FROM_EMAIL, APP_URL } from '@/lib/resend';
import { hardDeleteUser } from '@/lib/lifecycle/hard-delete';

const JOB_NAME = 'lifecycle-check';

async function getUserEmail(userId: string, admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch { return null; }
}

async function sendSimpleEmail(to: string, subject: string, body: string): Promise<void> {
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8" /></head>
<body style="background:#FAF7F2;font-family:'DM Sans',Helvetica,Arial,sans-serif;padding:48px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#FFFCF8;border-radius:12px;border:1px solid #E8DFD4;padding:40px;">
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#2C1A0E;margin:0 0 24px;">Candice</p>
    <p style="font-size:14px;font-weight:300;color:#3D2A1E;line-height:1.7;margin:0 0 24px;">${body}</p>
    <a href="${APP_URL}/dashboard" style="display:inline-block;background:#C47A4A;color:#fff;font-size:13px;padding:12px 24px;border-radius:8px;text-decoration:none;">Ouvrir Candice →</a>
    <p style="font-size:10px;color:#B5A090;margin-top:32px;">
      <a href="${APP_URL}/parametres/notifications" style="color:#B5A090;">Se désabonner</a>
    </p>
  </div>
</body></html>`;
  await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: cronRun } = await admin
    .from('cron_runs')
    .insert({ job_name: JOB_NAME, status: 'running' })
    .select('id').single();
  const cronRunId = cronRun?.id ?? null;

  const transitions: string[] = [];

  try {
    const { data: profiles } = await admin
      .from('my_profile')
      .select('user_id, subscription_status, trial_started_at, subscription_paused_at, last_active_at, deletion_scheduled_at');

    for (const p of profiles ?? []) {
      const userId = p.user_id as string;
      const status = p.subscription_status as string;
      const email = await getUserEmail(userId, admin);

      // ── Trial end (30 days) ───────────────────────────────────────────────
      if (status === 'trial' && p.trial_started_at) {
        const trialAge = now.getTime() - new Date(p.trial_started_at).getTime();
        const days = trialAge / (1000 * 60 * 60 * 24);

        // Trial reminders: J-7 (day 23), J-3 (day 27), J-1 (day 29)
        const reminderDays: { day: number; left: number }[] = [
          { day: 23, left: 7 }, { day: 27, left: 3 }, { day: 29, left: 1 },
        ];
        for (const { day, left } of reminderDays) {
          if (days >= day && days < day + 1 && email) {
            // Check not already sent today
            const sentToday = await admin
              .from('notification_log')
              .select('id')
              .eq('user_id', userId)
              .eq('notification_type', `trial_reminder_${left}`)
              .limit(1);
            if (!sentToday.data?.length) {
              await fetch(`${APP_URL}/api/emails/trial-reminder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
                body: JSON.stringify({ userId, email, daysLeft: left }),
              });
              transitions.push(`trial_reminder_${left}:${userId}`);
            }
          }
        }

        // Trial expired → paused (Stripe Phase 7: check for payment method)
        if (days >= 30) {
          await admin
            .from('my_profile')
            .update({ subscription_status: 'paused', subscription_paused_at: now.toISOString() })
            .eq('user_id', userId);
          await admin.from('account_lifecycle_events').insert({
            user_id: userId, event_type: 'trial_expired',
            previous_status: 'trial', new_status: 'paused', triggered_by: 'system',
          });
          if (email) {
            await sendSimpleEmail(email,
              'Candice est en pause',
              'Ton essai de 30 jours est terminé. Candice est en pause — reprends quand tu veux depuis tes paramètres.',
            ).catch(() => {});
          }
          transitions.push(`trial_expired:${userId}`);
        }
      }

      // ── Active → silent (90 days inactivity) ─────────────────────────────
      if (status === 'active' && p.last_active_at) {
        const inactiveDays = (now.getTime() - new Date(p.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
        if (inactiveDays >= 90) {
          await admin
            .from('my_profile')
            .update({ subscription_status: 'silent', silent_since: now.toISOString() })
            .eq('user_id', userId);
          await admin.from('account_lifecycle_events').insert({
            user_id: userId, event_type: 'went_silent',
            previous_status: 'active', new_status: 'silent', triggered_by: 'system',
          });
          if (email) {
            await sendSimpleEmail(email,
              'On t\'attend — Candice',
              'Ça fait un moment qu\'on ne t\'a pas vu. Tes proches sont toujours là, et Candice aussi. Reviens quand tu veux.',
            ).catch(() => {});
          }
          transitions.push(`went_silent:${userId}`);
        }
      }

      // ── Paused relance (60 days) ──────────────────────────────────────────
      if (status === 'paused' && p.subscription_paused_at && email) {
        const pausedDays = (now.getTime() - new Date(p.subscription_paused_at).getTime()) / (1000 * 60 * 60 * 24);
        if (pausedDays >= 60 && pausedDays < 61) {
          await sendSimpleEmail(email,
            'Reprendre Candice ?',
            'Ça fait 2 mois que Candice est en pause. Tes proches ont peut-être un anniversaire qui approche, une attention qui serait parfaite. Reprends en un clic.',
          ).catch(() => {});
          transitions.push(`paused_relance:${userId}`);
        }
      }

      // ── Deletion scheduled ────────────────────────────────────────────────
      if (status === 'cancelled' && p.deletion_scheduled_at) {
        if (new Date(p.deletion_scheduled_at) <= now) {
          await hardDeleteUser(userId, admin);
          transitions.push(`hard_deleted:${userId}`);
        }
      }
    }

    if (cronRunId) {
      await admin.from('cron_runs').update({
        status: 'success', finished_at: now.toISOString(),
        metadata: { transitions },
      }).eq('id', cronRunId);
    }

    return NextResponse.json({ transitions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (cronRunId) {
      await admin.from('cron_runs').update({
        status: 'error', finished_at: now.toISOString(), error_message: msg,
      }).eq('id', cronRunId);
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
