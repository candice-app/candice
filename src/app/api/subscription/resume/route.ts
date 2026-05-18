import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('my_profile')
    .select('subscription_status, trial_started_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profile?.subscription_status !== 'paused') {
    return NextResponse.json({ error: 'Compte non en pause' }, { status: 400 });
  }

  const trialStarted = profile.trial_started_at ? new Date(profile.trial_started_at) : null;
  const trialStillValid = trialStarted
    ? Date.now() - trialStarted.getTime() < 30 * 24 * 60 * 60 * 1000
    : false;
  const newStatus = trialStillValid ? 'trial' : 'active';

  await supabase
    .from('my_profile')
    .update({ subscription_status: newStatus, subscription_paused_at: null })
    .eq('user_id', user.id);

  const admin = createAdminClient();
  await admin.from('account_lifecycle_events').insert({
    user_id: user.id,
    event_type: 'subscription_resumed',
    previous_status: 'paused',
    new_status: newStatus,
    triggered_by: 'user',
  });

  return NextResponse.json({ success: true });
}
