import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST — mark an attention as done or skipped
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId, attentionTitle, status } = await req.json() as {
    contactId: string;
    attentionTitle: string;
    status: 'done' | 'skipped';
  };

  if (!contactId || !attentionTitle || !status) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await supabase
    .from('attention_log')
    .update({ status, actioned_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('contact_id', contactId)
    .eq('attention_title', attentionTitle)
    .eq('status', 'proposed');

  return NextResponse.json({ success: true });
}
