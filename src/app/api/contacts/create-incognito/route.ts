import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const VALID_RELATIONSHIPS = ['partner', 'friend', 'family', 'colleague', 'other'];
const VALID_REGISTERS = ['très_proche_fluide', 'proche_quotidien', 'importante_distante', 'compliquée_fragile', 'formelle_occasionnelle', 'je_ne_sais_pas'];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, relationship, phone, postal_address, relationship_register } = body;

  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
  if (!VALID_RELATIONSHIPS.includes(relationship)) return NextResponse.json({ error: 'Relation invalide' }, { status: 400 });
  if (!phone?.trim()) return NextResponse.json({ error: 'Téléphone requis' }, { status: 400 });
  if (!postal_address?.trim()) return NextResponse.json({ error: 'Adresse requise' }, { status: 400 });

  const safeRegister = relationship_register && VALID_REGISTERS.includes(relationship_register)
    ? relationship_register : null;

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      user_id: user.id,
      name: name.trim(),
      relationship,
      phone: phone.trim(),
      email: null,
      ...(safeRegister ? { relationship_register: safeRegister } : {}),
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

  return NextResponse.json({ contactId: data.id });
}
