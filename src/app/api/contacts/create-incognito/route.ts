import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const VALID_RELATIONSHIPS = ['partner', 'friend', 'family', 'colleague', 'other'];
const VALID_REGISTERS = ['très_proche_fluide', 'proche_quotidien', 'importante_distante', 'compliquée_fragile', 'formelle_occasionnelle', 'je_ne_sais_pas'];
const VALID_GENDERS = ['femme', 'homme', 'non_binaire', 'non_precise'];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, relationship, phone, postal_address, relationship_register, gender, complicated_context, idempotency_key } = body;

  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
  if (!VALID_RELATIONSHIPS.includes(relationship)) return NextResponse.json({ error: 'Relation invalide' }, { status: 400 });
  if (!phone?.trim()) return NextResponse.json({ error: 'Téléphone requis' }, { status: 400 });
  if (!postal_address?.trim()) return NextResponse.json({ error: 'Adresse requise' }, { status: 400 });

  // ── Idempotency check: return existing row if same key already processed ──
  if (idempotency_key && typeof idempotency_key === 'string') {
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user.id)
      .eq('idempotency_key', idempotency_key)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ contactId: existing.id });
    }
  }

  // ── Business guard: same name created within the last 30 s ───────────────
  const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();
  const { data: recentDup } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', name.trim())
    .gte('created_at', thirtySecondsAgo)
    .maybeSingle();

  if (recentDup) {
    return NextResponse.json({ contactId: recentDup.id });
  }

  const safeRegister = relationship_register && VALID_REGISTERS.includes(relationship_register)
    ? relationship_register : null;
  const safeGender = gender && VALID_GENDERS.includes(gender) ? gender : null;
  const safeKey = idempotency_key && typeof idempotency_key === 'string' ? idempotency_key : null;

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      user_id: user.id,
      name: name.trim(),
      relationship,
      phone: phone.trim(),
      email: null,
      ...(safeRegister ? { relationship_register: safeRegister } : {}),
      ...(safeGender ? { gender: safeGender } : {}),
      ...(safeKey ? { idempotency_key: safeKey } : {}),
    })
    .select('id')
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 });

  // Store address in questionnaire_responses
  await supabase.from('questionnaire_responses').insert({
    contact_id: data.id,
    user_id: user.id,
    postal_address: postal_address.trim(),
  });

  // Store complicated register context if provided
  const safeContext = typeof complicated_context === 'string' ? complicated_context.trim() : '';
  if (safeRegister === 'compliquée_fragile' && safeContext) {
    await supabase.from('context_journal').insert({
      user_id: user.id,
      contact_id: data.id,
      type: 'register_complicated_context',
      question: 'Comment tu aimes entretenir le lien, malgré ce qui est compliqué',
      answer: safeContext,
    });
  }

  return NextResponse.json({ contactId: data.id });
}
