import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('my_profile')
    .select('subscription_status')
    .eq('user_id', user.id)
    .maybeSingle();

  const status = profile?.subscription_status as string | null;
  if (!status || !['trial', 'active'].includes(status)) {
    return NextResponse.json({ error: 'Compte non éligible à la pause' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: pauseError } = await supabase
    .from('my_profile')
    .update({ subscription_status: 'paused', subscription_paused_at: now })
    .eq('user_id', user.id);
  if (pauseError) {
    console.error('[subscription/pause] my_profile update', pauseError.message);
    return NextResponse.json({ error: 'La mise en pause a échoué.' }, { status: 500 });
  }

  const admin = createAdminClient();
  const { error: eventError } = await admin.from('account_lifecycle_events').insert({
    user_id: user.id,
    event_type: 'subscription_paused',
    previous_status: status,
    new_status: 'paused',
    triggered_by: 'user',
  });
  if (eventError) console.error('[subscription/pause] account_lifecycle_events insert', eventError.message);

  return NextResponse.json({ success: true });
}
