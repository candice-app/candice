import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('my_profile')
    .select('subscription_status, deletion_scheduled_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profile?.subscription_status !== 'cancelled' || !profile?.deletion_scheduled_at) {
    return NextResponse.json({ error: 'Aucune suppression programmée' }, { status: 400 });
  }

  await supabase.from('my_profile').update({
    subscription_status: 'active',
    cancelled_at: null,
    deletion_scheduled_at: null,
  }).eq('user_id', user.id);

  const admin = createAdminClient();
  await admin.from('account_lifecycle_events').insert({
    user_id: user.id,
    event_type: 'deletion_cancelled',
    previous_status: 'cancelled',
    new_status: 'active',
    triggered_by: 'user',
  });

  return NextResponse.json({ success: true });
}
