import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId, attentionTitle, feedback, note } = await req.json() as {
    contactId: string;
    attentionTitle: string;
    feedback: 'juste' | 'a_cote' | 'pas_le_moment';
    note?: string;
  };

  if (!contactId || !attentionTitle || !feedback) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const VALID_FEEDBACKS = ['juste', 'a_cote', 'pas_le_moment'];
  if (!VALID_FEEDBACKS.includes(feedback)) {
    return NextResponse.json({ error: 'Invalid feedback value' }, { status: 400 });
  }

  await supabase
    .from('attention_log')
    .update({
      feedback,
      feedback_note: note?.trim() || null,
      feedback_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('contact_id', contactId)
    .eq('attention_title', attentionTitle);

  return NextResponse.json({ success: true });
}
