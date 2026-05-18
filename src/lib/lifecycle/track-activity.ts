import type { SupabaseClient } from '@supabase/supabase-js';

export async function trackActivity(userId: string, supabaseAdmin: SupabaseClient): Promise<void> {
  const { data: profile } = await supabaseAdmin
    .from('my_profile')
    .select('subscription_status, trial_started_at')
    .eq('user_id', userId)
    .maybeSingle();

  const now = new Date().toISOString();
  const status = (profile?.subscription_status as string | null) ?? 'trial';

  if (status === 'silent') {
    const trialStarted = profile?.trial_started_at ? new Date(profile.trial_started_at) : null;
    const trialStillValid = trialStarted
      ? Date.now() - trialStarted.getTime() < 30 * 24 * 60 * 60 * 1000
      : false;
    const newStatus = trialStillValid ? 'trial' : 'active';

    await supabaseAdmin
      .from('my_profile')
      .update({ subscription_status: newStatus, last_active_at: now, silent_since: null })
      .eq('user_id', userId);

    await supabaseAdmin.from('account_lifecycle_events').insert({
      user_id: userId,
      event_type: 'reactivated_from_silent',
      previous_status: 'silent',
      new_status: newStatus,
      triggered_by: 'user',
    });
  } else {
    await supabaseAdmin
      .from('my_profile')
      .update({ last_active_at: now })
      .eq('user_id', userId);
  }
}
