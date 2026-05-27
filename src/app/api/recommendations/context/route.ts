import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST — save an answer to a context question
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { questionId, answer } = await req.json() as { questionId: string; answer: string };
  if (!questionId || !answer?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  await supabase
    .from('context_journal')
    .update({ answer: answer.trim(), answered_at: new Date().toISOString() })
    .eq('id', questionId)
    .eq('user_id', user.id);

  return NextResponse.json({ success: true });
}
