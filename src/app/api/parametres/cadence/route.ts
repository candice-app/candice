import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { CadenceLevel } from '@/types';

const VALID: CadenceLevel[] = ['discreet', 'normal', 'sustained', 'intense'];

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const cadence = body.cadence_preference as CadenceLevel;
  if (!VALID.includes(cadence)) {
    return NextResponse.json({ error: 'Invalid cadence level' }, { status: 400 });
  }

  const { error } = await supabase
    .from('my_profile')
    .update({ cadence_preference: cadence })
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
