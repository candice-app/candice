import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CADENCE_STEPS, CADENCE_LABELS } from '@/lib/cadence/resolver';
import type { CadenceLevel } from '@/types';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Read the 4 most recent cadence_feedback rows (one per weekly run)
  const { data: feedbacks } = await supabase
    .from('cadence_feedback')
    .select('validation_rate, recommended_adjustment')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(4);

  if (!feedbacks?.length) {
    return NextResponse.json({ message: 'Pas encore assez de données pour ajuster la cadence.' });
  }

  // Count recommendations
  const recs = feedbacks.map(f => f.recommended_adjustment).filter(Boolean);
  const increaseCount = recs.filter(r => r === 'increase_cadence').length;
  const reduceCount = recs.filter(r => r === 'reduce_cadence').length;

  const { data: profile } = await supabase
    .from('my_profile')
    .select('cadence_preference')
    .eq('user_id', user.id)
    .maybeSingle();

  const current = (profile?.cadence_preference as CadenceLevel) ?? 'normal';
  const currentIdx = CADENCE_STEPS.indexOf(current);

  let newIdx = currentIdx;
  let message = 'Votre cadence est bien calibrée.';

  if (increaseCount >= 3) {
    newIdx = Math.min(3, currentIdx + 1);
    if (newIdx !== currentIdx) {
      message = `Cadence augmentée → ${CADENCE_LABELS[CADENCE_STEPS[newIdx]].label}`;
    }
  } else if (reduceCount >= 3) {
    newIdx = Math.max(0, currentIdx - 1);
    if (newIdx !== currentIdx) {
      message = `Cadence réduite → ${CADENCE_LABELS[CADENCE_STEPS[newIdx]].label}`;
    }
  }

  if (newIdx !== currentIdx) {
    await supabase
      .from('my_profile')
      .update({ cadence_preference: CADENCE_STEPS[newIdx] })
      .eq('user_id', user.id);
  }

  return NextResponse.json({ cadence: CADENCE_STEPS[newIdx], message });
}
