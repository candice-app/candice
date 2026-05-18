import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { resend, FROM_EMAIL } from '@/lib/resend';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = user.id;
  const admin = createAdminClient();

  const [
    { data: profile },
    { data: contacts },
    { data: suggestions },
    { data: proactiveSuggestions },
    { data: confidences },
    { data: profileNotes },
    { data: notificationLog },
    { data: lifecycleEvents },
  ] = await Promise.all([
    admin.from('my_profile').select('*').eq('user_id', uid).maybeSingle(),
    admin.from('contacts').select('*, questionnaire_responses(*)').eq('user_id', uid),
    admin.from('suggestions').select('*').eq('user_id', uid),
    admin.from('proactive_suggestions').select('*').eq('user_id', uid),
    admin.from('confidences').select('*').eq('user_id', uid),
    admin.from('profile_notes').select('*').eq('user_id', uid),
    admin.from('notification_log').select('*').eq('user_id', uid),
    admin.from('account_lifecycle_events').select('*').eq('user_id', uid),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: { id: uid, email: user.email, created_at: user.created_at },
    my_profile: profile,
    contacts: contacts ?? [],
    suggestions: suggestions ?? [],
    proactive_suggestions: proactiveSuggestions ?? [],
    confidences: confidences ?? [],
    profile_notes: profileNotes ?? [],
    notification_log: notificationLog ?? [],
    account_lifecycle_events: lifecycleEvents ?? [],
  };

  const json = JSON.stringify(exportData, null, 2);
  const encodedData = Buffer.from(json).toString('base64');

  if (!user.email) return NextResponse.json({ error: 'Email non disponible' }, { status: 400 });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: 'Ton export de données Candice (RGPD)',
    html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8" /></head>
<body style="background:#FAF7F2;font-family:'DM Sans',Helvetica,Arial,sans-serif;padding:48px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#FFFCF8;border-radius:12px;border:1px solid #E8DFD4;padding:40px;">
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#2C1A0E;margin:0 0 24px;">Candice</p>
    <p style="font-size:14px;font-weight:300;color:#3D2A1E;line-height:1.7;margin:0 0 16px;">
      Conformément au RGPD, voici l'ensemble des données que Candice détient sur toi. L'export est joint à cet email au format JSON.
    </p>
    <p style="font-size:12px;font-weight:300;color:#9E7B5A;margin:0;">
      Cet export inclut : ton profil, tes proches et leurs questionnaires, tes confidences, tes notes, les suggestions générées et l'historique de notifications.
    </p>
  </div>
</body></html>`,
    attachments: [{
      filename: `candice-export-${new Date().toISOString().slice(0, 10)}.json`,
      content: encodedData,
    }],
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, message: 'Export envoyé par email.' });
}
