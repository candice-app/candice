import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();
  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - 28 * 24 * 60 * 60 * 1000);
  const windowStartStr = windowStart.toISOString().split('T')[0];
  const windowEndStr = windowEnd.toISOString().split('T')[0];

  const { data: suggestions } = await supabaseAdmin
    .from('proactive_suggestions')
    .select('user_id, contact_id, status')
    .gte('created_at', windowStart.toISOString())
    .not('contact_id', 'is', null);

  if (!suggestions?.length) {
    await supabaseAdmin.from('cron_runs').insert({ job_name: 'cadence-feedback', result: { inserted: 0 } });
    return NextResponse.json({ inserted: 0 });
  }

  // Aggregate per (user_id, contact_id)
  const map = new Map<string, {
    user_id: string; contact_id: string;
    validated: number; refused: number; snoozed: number; ignored: number; total: number;
  }>();

  for (const s of suggestions) {
    const key = `${s.user_id}::${s.contact_id}`;
    if (!map.has(key)) {
      map.set(key, { user_id: s.user_id, contact_id: s.contact_id, validated: 0, refused: 0, snoozed: 0, ignored: 0, total: 0 });
    }
    const entry = map.get(key)!;
    entry.total++;
    if (s.status === 'validated') entry.validated++;
    else if (s.status === 'refused') entry.refused++;
    else if (s.status === 'snoozed') entry.snoozed++;
    else if (s.status === 'ignored') entry.ignored++;
  }

  const rows = Array.from(map.values()).map(e => {
    const validationRate = e.total > 0 ? parseFloat(((e.validated / e.total) * 100).toFixed(2)) : null;
    let recommendedAdjustment: string | null = null;
    if (validationRate !== null) {
      if (validationRate > 80) recommendedAdjustment = 'increase_cadence';
      else if (validationRate < 30) recommendedAdjustment = 'reduce_cadence';
    }
    return {
      user_id: e.user_id,
      contact_id: e.contact_id,
      window_start: windowStartStr,
      window_end: windowEndStr,
      suggestions_count: e.total,
      validated_count: e.validated,
      refused_count: e.refused,
      snoozed_count: e.snoozed,
      ignored_count: e.ignored,
      validation_rate: validationRate,
      recommended_adjustment: recommendedAdjustment,
    };
  });

  const { error } = await supabaseAdmin.from('cadence_feedback').insert(rows);
  if (error) {
    console.error('[cadence-feedback] Insert error:', error.message);
    await supabaseAdmin.from('cron_runs').insert({ job_name: 'cadence-feedback', result: { error: error.message } });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabaseAdmin.from('cron_runs').insert({ job_name: 'cadence-feedback', result: { inserted: rows.length } });
  return NextResponse.json({ inserted: rows.length });
}
