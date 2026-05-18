import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { resend, FROM_EMAIL, APP_URL } from '@/lib/resend';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { password } = body;
  if (!password) return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 });

  // Verify password by attempting sign-in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });
  if (signInError) return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 403 });

  const now = new Date();
  const deletionScheduledAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from('my_profile').update({
    subscription_status: 'cancelled',
    cancelled_at: now.toISOString(),
    deletion_scheduled_at: deletionScheduledAt,
  }).eq('user_id', user.id);

  const admin = createAdminClient();
  await admin.from('account_lifecycle_events').insert({
    user_id: user.id,
    event_type: 'deletion_requested',
    previous_status: null,
    new_status: 'cancelled',
    triggered_by: 'user',
    metadata: { deletion_scheduled_at: deletionScheduledAt },
  });

  // Confirmation email
  if (user.email) {
    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8" /></head>
<body style="background:#FAF7F2;font-family:'DM Sans',Helvetica,Arial,sans-serif;padding:48px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#FFFCF8;border-radius:12px;border:1px solid #E8DFD4;padding:40px;">
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#2C1A0E;margin:0 0 24px;">Candice</p>
    <p style="font-size:14px;font-weight:300;color:#3D2A1E;line-height:1.7;margin:0 0 16px;">
      Ta demande de suppression a été enregistrée. Ton compte et toutes tes données seront supprimés le <strong>${new Date(deletionScheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
    </p>
    <p style="font-size:14px;font-weight:300;color:#3D2A1E;line-height:1.7;margin:0 0 24px;">
      Tu peux annuler cette demande jusqu'à cette date depuis tes paramètres.
    </p>
    <a href="${APP_URL}/parametres/abonnement" style="display:inline-block;background:#C47A4A;color:#fff;font-size:13px;padding:12px 24px;border-radius:8px;text-decoration:none;">Annuler la suppression →</a>
  </div>
</body></html>`;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Suppression de compte programmée — Candice',
      html,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, deletion_scheduled_at: deletionScheduledAt });
}
