import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { situationsPourReco } from '@/lib/memories/situations';
import { chargerProfilAutorise } from '@/lib/consent/usage-profil';
import { createAdminClient } from '@/utils/supabase/admin';
import { generateRecommendations } from '@/lib/recommendations/engine';
import { lireRejetsDuProche } from '@/lib/recommendations/declarations-proche';
import { generateProactiveQuestion } from '@/lib/recommendations/questions';
import type { RecoInput, FeedbackEntry } from '@/lib/recommendations/types';
import type { FaceResult } from '@/lib/attention/scoring';
import type { RelationalFilters } from '@/lib/lifestyle/scoring';
import type { SingularityInput, VetosInput } from '@/lib/profile/synthesis';
import type { QuestionnaireResponse, RelationshipRegister } from '@/types';

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
    { data: complicatedContextRow },
    { data: feedbackLog },
  ] = await Promise.all([
    admin
      .from('contacts')
      .select('id, name, relationship, proximity_level, proche_user_id, relationship_register, questionnaire_responses(*)')
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
    admin
      .from('context_journal')
      .select('answer')
      .eq('user_id', user.id)
      .eq('contact_id', contactId)
      .eq('type', 'register_complicated_context')
      .maybeSingle(),
    admin
      .from('attention_log')
      .select('attention_type, attention_title, feedback, feedback_note, feedback_at')
      .eq('user_id', user.id)
      .eq('contact_id', contactId)
      .not('feedback', 'is', null)
      .order('feedback_at', { ascending: false })
      .limit(10),
  ]);

  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  type ContactRow = {
    id: string; name: string; relationship: string;
    proximity_level: string | null; proche_user_id: string | null;
    relationship_register: RelationshipRegister | null;
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

  // ── LE PROFIL DU PROCHE : seulement ce qu'il a autorisé, DONNÉE PAR DONNÉE.
  //    `contacts.proche_user_id` est écrit par le PILOTE : il dit qui le pilote désigne, pas
  //    que cette personne a accepté quoi que ce soit. La route lisait pourtant, sur ce seul
  //    identifiant, les allergies, le régime et les réponses libres du compte désigné, et les
  //    envoyait au modèle (constaté le 18 nov., scripts/local/17).
  //    Tout le contrôle est dans `chargerProfilAutorise` : consentement actif pour ce pilote,
  //    ce contact et ce compte ; accordé par le proche lui-même (preuve écrite par la base) ;
  //    portée nommant chaque usage. Toute incertitude rend un profil vide.
  const autorise = await chargerProfilAutorise(admin, { piloteId: user.id, contactId, procheUserId: c.proche_user_id });
  procheReception    = (autorise.attention_reception as FaceResult | null) ?? null;
  procheExpression   = (autorise.attention_expression as FaceResult | null) ?? null;
  procheTemperamentAxes = (autorise.temperament_axes as Record<string, { score: number; intensity: number }> | null) ?? null;
  procheRelFilters   = (autorise.relational_filters as RelationalFilters | null) ?? null;
  procheVetos        = (autorise.vetos as VetosInput | null) ?? null;
  procheSingularity  = (autorise.singularity_answers as SingularityInput | null) ?? null;

  // Fallback: use incognito-filled attention_reception when proche has no account
  if (!procheReception && classicProfile?.attention_reception) {
    procheReception = classicProfile.attention_reception as unknown as FaceResult;
  }

  const complicatedContext = (complicatedContextRow?.answer as string | null) ?? null;

  const feedbackHistory: FeedbackEntry[] = (feedbackLog ?? [])
    .filter(f => f.feedback && f.attention_type)
    .map(f => ({
      dim: f.attention_type as FeedbackEntry['dim'],
      canal: '',
      feedback: f.feedback as FeedbackEntry['feedback'],
      note: (f.feedback_note as string | null) ?? null,
    }));

  const importantDates = parseImportantDates(classicProfile?.important_dates ?? null);
  const recentlyProposed = (recentLog ?? []).map((l) => l.attention_title);
  const recentContext = (recentAnswers ?? [])
    .filter((a) => a.answer)
    .map((a) => `${a.question} → ${a.answer}`)
    .join('; ') || null;

  // Ce que le PROCHE a déclaré lui-même, s'il a un compte relié ET consenti à cet usage.
  // Lecture sous service_role — la RLS du proche interdit au pilote de lire ses lignes,
  // ce qui est exactement voulu : le franchissement est concentré dans ce seul appel,
  // et son résultat ne quitte jamais le serveur. Échoue FERMÉ : toute incertitude rend
  // zéro rejet, et aucune donnée du proche n'est employée.
  const declarations = await lireRejetsDuProche(admin as never, { piloteId: user.id, contactId });

  // La situation actuelle du proche, réduite au minimum nécessaire. Lue avec le client de
  // l'UTILISATEUR (ses propres notes, sous la RLS) — pas avec le client privilégié.
  const situations = await situationsPourReco(supabase, { userId: user.id, contactId });

  const input: RecoInput = {
    contactId,
    situations,
    rejetsDuProche: declarations.rejets,
    contactName: c.name,
    contactFirstName,
    relationship: c.relationship,
    proximityLevel: c.proximity_level ?? 'close',
    register: c.relationship_register ?? null,

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
    complicatedContext,
    feedbackHistory,
  };

  const recommendations = await generateRecommendations(input);

  // Persist recommendations
  const { error: recoUpsertError } = await admin.from('contact_recommendations').upsert(
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
  if (recoUpsertError) console.error('[recommendations/generate] contact_recommendations upsert', recoUpsertError.message);

  // Log proposed attentions (for future deduplication)
  if (recommendations.ideas.length > 0) {
    const { error: logInsertError } = await admin.from('attention_log').insert(
      recommendations.ideas.map((idea) => ({
        user_id: user.id,
        contact_id: contactId,
        attention_title: idea.title,
        attention_type: idea.dim,
        status: 'proposed',
      }))
    );
    if (logInsertError) console.error('[recommendations/generate] attention_log insert', logInsertError.message);
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
    const { error: cjInsertError } = await admin
      .from('context_journal')
      .insert({ user_id: user.id, contact_id: contactId, question });
    if (cjInsertError) console.error('[recommendations/generate] context_journal insert', cjInsertError.message);
  }

  return NextResponse.json({ recommendations });
}
