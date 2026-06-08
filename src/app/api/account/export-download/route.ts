import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
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

  const filename = `candice-export-${new Date().toISOString().slice(0, 10)}.json`;
  const json = JSON.stringify(exportData, null, 2);

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
