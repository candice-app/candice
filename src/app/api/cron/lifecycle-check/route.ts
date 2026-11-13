import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { APP_URL } from '@/lib/resend';
import { envoyerCourriel } from '@/lib/mail/transport';
import { effacerCompte } from '@/lib/lifecycle/erasure/engine';

const JOB_NAME = 'lifecycle-check';

// Phase de test — réactiver quand Stripe est branché (Phase 7)
const ENABLE_TRIAL_LOCKOUT = false;

// Un refus structuré, pas une chaîne dans un message : le test compare le CHAMP, pas le texte sérialisé.
// La forme fait partie de la spec (scripts/local/TRANSPORT-ET-INJECTION.md §3b) ; ne pas en inventer une autre.
interface Refus {
  subject_user_id: string;
  reason: 'ORPHANED_DELETION_DEADLINE';
}

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
  await envoyerCourriel({ to, subject, html });
}

async function handler(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: cronRun, error: cronRunError } = await admin
    .from('cron_runs')
    .insert({ job_name: JOB_NAME, status: 'running' })
    .select('id').single();
  if (cronRunError) console.error(`[CRON ${JOB_NAME}] cron_runs insert`, cronRunError.message);
  const cronRunId = cronRun?.id ?? null;

  const transitions: string[] = [];
  const refusals: Refus[] = [];

  try {
    const { data: profiles } = await admin
      .from('my_profile')
      .select('user_id, subscription_status, trial_started_at, lifetime_trial, subscription_paused_at, last_active_at, cancelled_at, deletion_scheduled_at');

    for (const p of profiles ?? []) {
      const userId = p.user_id as string;
      const status = p.subscription_status as string;
      const email = await getUserEmail(userId, admin);

      // ── Trial end (30 days) ───────────────────────────────────────────────
      if (status === 'trial' && p.trial_started_at && !p.lifetime_trial) {
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
        if (ENABLE_TRIAL_LOCKOUT && days >= 30) {
          const { error: pausedUpdateError } = await admin
            .from('my_profile')
            .update({ subscription_status: 'paused', subscription_paused_at: now.toISOString() })
            .eq('user_id', userId);
          if (pausedUpdateError) console.error(`[CRON ${JOB_NAME}] my_profile update (trial_expired)`, pausedUpdateError.message);
          const { error: pausedEventError } = await admin.from('account_lifecycle_events').insert({
            user_id: userId, event_type: 'trial_expired',
            previous_status: 'trial', new_status: 'paused', triggered_by: 'system',
          });
          if (pausedEventError) console.error(`[CRON ${JOB_NAME}] account_lifecycle_events insert (trial_expired)`, pausedEventError.message);
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
          const { error: silentUpdateError } = await admin
            .from('my_profile')
            .update({ subscription_status: 'silent', silent_since: now.toISOString() })
            .eq('user_id', userId);
          if (silentUpdateError) console.error(`[CRON ${JOB_NAME}] my_profile update (went_silent)`, silentUpdateError.message);
          const { error: silentEventError } = await admin.from('account_lifecycle_events').insert({
            user_id: userId, event_type: 'went_silent',
            previous_status: 'active', new_status: 'silent', triggered_by: 'system',
          });
          if (silentEventError) console.error(`[CRON ${JOB_NAME}] account_lifecycle_events insert (went_silent)`, silentEventError.message);
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

      // ── Suppression échue ─────────────────────────────────────────────────
      // GARDE DE VALIDITÉ (parade « échéance orpheline »), AVANT toute tentative. Une échéance échue ne vaut ordre
      // de suppression QUE si elle est portée par une demande réelle : cancelled_at présent ET échéance >= cancelled_at
      // (l'échéance est posée AU MOMENT de la demande puis dans le futur ; une échéance antérieure à la demande, ou
      // une échéance sans demande, est un état qu'un chemin futur — Stripe, un outil d'admin — aurait laissé en
      // oubliant de nettoyer). Sinon : REFUS structuré dans cron_runs, AUCUNE tentative, AUCUNE ligne de manifeste.
      // La garde échoue FERMÉ : dans le doute, elle refuse. Comparaison >= (et non >) : le harnais pose demande et
      // échéance au même instant pour un compte dûment échu ; une égalité stricte le refuserait à tort.
      if (status === 'cancelled' && p.deletion_scheduled_at && new Date(p.deletion_scheduled_at as string) <= now) {
        const cancelledAt = p.cancelled_at ? new Date(p.cancelled_at as string) : null;
        const echeance = new Date(p.deletion_scheduled_at as string);
        const valide = cancelledAt !== null && echeance >= cancelledAt;
        if (!valide) {
          refusals.push({ subject_user_id: userId, reason: 'ORPHANED_DELETION_DEADLINE' });
        } else {
          const res = await effacerCompte(admin, userId, {
            runId: cronRunId,
            requestedAt: p.cancelled_at as string,
            scheduledFor: p.deletion_scheduled_at as string,
          });
          transitions.push(`${res.status === 'ACHEVEMENT_VERIFIE' ? 'hard_deleted' : 'erasure_partielle'}:${userId}`);
        }
      }
    }

    if (cronRunId) {
      const { error: runUpdateError } = await admin.from('cron_runs').update({
        status: 'success', finished_at: now.toISOString(),
        metadata: { transitions, refusals },
      }).eq('id', cronRunId);
      if (runUpdateError) console.error(`[CRON ${JOB_NAME}] cron_runs update`, runUpdateError.message);
    }

    return NextResponse.json({ transitions, refusals });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (cronRunId) {
      const { error: runUpdateError } = await admin.from('cron_runs').update({
        status: 'error', finished_at: now.toISOString(), error_message: msg,
        metadata: { transitions, refusals },
      }).eq('id', cronRunId);
      if (runUpdateError) console.error(`[CRON ${JOB_NAME}] cron_runs update`, runUpdateError.message);
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Vercel Cron appelle en GET ; le harnais d'essai local appelle en POST. Même traitement.
export const GET = handler;
export const POST = handler;
