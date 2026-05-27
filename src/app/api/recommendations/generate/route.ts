import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { generateRecommendations } from '@/lib/recommendations/engine';
import { generateProactiveQuestion } from '@/lib/recommendations/questions';
import type { RecoInput } from '@/lib/recommendations/types';
import type { FaceResult } from '@/lib/attention/scoring';
import type { RelationalFilters } from '@/lib/lifestyle/scoring';
import type { SingularityInput, VetosInput } from '@/lib/profile/synthesis';
import type { QuestionnaireResponse } from '@/types';

function parseImportantDates(raw: string | null): { label: string; date: string }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return (parsed as { label?: string; date?: string }[]).filter((d) => d.date) as { label: string; date: string }[];
  } catch { /* ignore */ }
  return [];
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { contactId } = await req.json() as { contactId: string };
  if (!contactId) return NextResponse.json({ error: 'Missing contactId' }, { status: 400 });

  const admin = createAdminClient();

  const [
    { data: contact },
    { data: piloteProfile },
    { data: recentLog },
    { data: recentAnswers },
  ] = await Promise.all([
    admin
      .from('contacts')
      .select('id, name, relationship, proximity_level, proche_user_id, questionnaire_responses(*)')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single(),
    admin
      .from('my_profile')
      .select('attention_expression')
      .eq('user_id', user.id)
      .maybeSingle(),
    admin
      .from('attention_log')
      .select('attention_title')
      .eq('user_id', user.id)
      .eq('contact_id', contactId)
      .order('proposed_at', { ascending: false })
      .limit(5),
    admin
      .from('context_journal')
      .select('question, answer')
      .eq('user_id', user.id)
      .eq('contact_id', contactId)
      .not('answer', 'is', null)
      .order('answered_at', { ascending: false })
      .limit(3),
  ]);

  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  type ContactRow = {
    id: string; name: string; relationship: string;
    proximity_level: string | null; proche_user_id: string | null;
    questionnaire_responses: QuestionnaireResponse[];
  };
  const c = contact as ContactRow;
  const classicProfile = c.questionnaire_responses?.[0] ?? null;
  const contactFirstName = c.name.split(' ')[0];

  // Fetch Proche's my_profile vectors when linked
  let procheReception: FaceResult | null = null;
  let procheExpression: FaceResult | null = null;
  let procheTemperamentAxes: Record<string, { score: number; intensity: number }> | null = null;
  let procheRelFilters: RelationalFilters | null = null;
  let procheVetos: VetosInput | null = null;
  let procheSingularity: SingularityInput | null = null;

  if (c.proche_user_id) {
    const { data: pp } = await admin
      .from('my_profile')
      .select('attention_reception, attention_expression, temperament_axes, relational_filters, practical_info, singularity_answers')
      .eq('user_id', c.proche_user_id)
      .maybeSingle();

    if (pp) {
      procheReception    = (pp.attention_reception as FaceResult | null) ?? null;
      procheExpression   = (pp.attention_expression as FaceResult | null) ?? null;
      procheTemperamentAxes = (pp.temperament_axes as Record<string, { score: number; intensity: number }> | null) ?? null;
      procheRelFilters   = (pp.relational_filters as RelationalFilters | null) ?? null;
      procheVetos        = (pp.practical_info as { vetos?: VetosInput } | null)?.vetos ?? null;
      procheSingularity  = (pp.singularity_answers as SingularityInput | null) ?? null;
    }
  }

  const importantDates = parseImportantDates(classicProfile?.important_dates ?? null);
  const recentlyProposed = (recentLog ?? []).map((l) => l.attention_title);
  const recentContext = (recentAnswers ?? [])
    .filter((a) => a.answer)
    .map((a) => `${a.question} → ${a.answer}`)
    .join('; ') || null;

  const input: RecoInput = {
    contactId,
    contactName: c.name,
    contactFirstName,
    relationship: c.relationship,
    proximityLevel: c.proximity_level ?? 'close',

    reception: procheReception,
    expression: procheExpression,
    temperamentAxes: procheTemperamentAxes,
    relationalFilters: procheRelFilters,
    vetos: procheVetos,
    singularity: procheSingularity,

    classicProfile,

    piloteExpression: (piloteProfile?.attention_expression as FaceResult | null) ?? null,

    importantDates,
    recentContext,
    recentlyProposed,
  };

  const recommendations = await generateRecommendations(input);

  // Persist recommendations
  await admin.from('contact_recommendations').upsert(
    {
      user_id: user.id,
      contact_id: contactId,
      ideas: recommendations.ideas,
      blind_spot: recommendations.blindSpot,
      kadence: recommendations.kadence,
      generated_at: recommendations.generatedAt,
    },
    { onConflict: 'user_id,contact_id' }
  );

  // Log proposed attentions (for future deduplication)
  if (recommendations.ideas.length > 0) {
    await admin.from('attention_log').insert(
      recommendations.ideas.map((idea) => ({
        user_id: user.id,
        contact_id: contactId,
        attention_title: idea.title,
        attention_type: idea.dim,
        status: 'proposed',
      }))
    );
  }

  // Seed a proactive question if none pending in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: existingQ } = await admin
    .from('context_journal')
    .select('id')
    .eq('user_id', user.id)
    .eq('contact_id', contactId)
    .gte('created_at', sevenDaysAgo)
    .limit(1)
    .maybeSingle();

  if (!existingQ) {
    const { data: recentQs } = await admin
      .from('context_journal')
      .select('question')
      .eq('user_id', user.id)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentlyAsked = (recentQs ?? []).map((r) => r.question);
    const question = generateProactiveQuestion(contactFirstName, recentlyAsked);
    await admin
      .from('context_journal')
      .insert({ user_id: user.id, contact_id: contactId, question });
  }

  return NextResponse.json({ recommendations });
}
