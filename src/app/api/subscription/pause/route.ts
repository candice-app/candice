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
  await supabase
    .from('my_profile')
    .update({ subscription_status: 'paused', subscription_paused_at: now })
    .eq('user_id', user.id);

  const admin = createAdminClient();
  await admin.from('account_lifecycle_events').insert({
    user_id: user.id,
    event_type: 'subscription_paused',
    previous_status: status,
    new_status: 'paused',
    triggered_by: 'user',
  });

  return NextResponse.json({ success: true });
}
