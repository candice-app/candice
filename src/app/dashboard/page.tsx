import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import DashboardShell from "@/components/layout/DashboardShell";
import { trackActivity } from "@/lib/lifecycle/track-activity";
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay";
import TourReplay from "@/components/onboarding/TourReplay";
import PauseBanner from "@/components/dashboard/PauseBanner";
import PushPrompt from "@/components/dashboard/PushPrompt";
import ProactiveDashboardCard, { type SuggestionWithContact } from "@/components/dashboard/ProactiveDashboardCard";
import Thread, { ThreadItem } from "@/components/presence/Thread";
import Avatar from "@/components/presence/Avatar";
import PointDivider from "@/components/presence/PointDivider";
import LivePoint from "@/components/presence/LivePoint";
import PresenceInput from "@/components/presence/PresenceInput";
import { Contact, QuestionnaireResponse, ProfileNote } from "@/types";

const SCORED_FIELDS = [
  "love_language", "communication_style", "stress_response", "social_energy",
  "appreciation_style", "conflict_resolution", "decision_making", "emotional_expression",
  "core_values", "recognition_preference", "boundaries", "growth_mindset",
  "hobbies", "favorite_foods", "gift_preference", "conversation_topics", "important_dates",
] as const;

function getCompletion(profile: QuestionnaireResponse | undefined): number {
  if (!profile) return 0;
  const filled = SCORED_FIELDS.filter(f => !!profile[f as keyof QuestionnaireResponse]).length;
  return Math.round((filled / SCORED_FIELDS.length) * 100);
}

function contactState(pct: number): string {
  if (pct >= 65) return "Candice anticipe pour";
  if (pct >= 30) return "Candice connaît bien";
  return "Candice commence à connaître";
}

function avatarVariant(i: number): 'g' | 'c' {
  return i % 2 === 0 ? 'g' : 'c';
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: contacts },
    { data: myProfile },
    { count: archivedCount },
    { data: recentNoteData },
    { data: suggestionsData },
    { data: proactiveData },
    { data: recoData },
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select("*, questionnaire_responses(*)")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("my_profile")
      .select("id, onboarding_completed, notif_push_enabled, subscription_status, trial_started_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("archived_at", "is", null),
    supabase
      .from("profile_notes")
      .select("id, contact_id, user_id, note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("suggestions")
      .select("contact_id, generated_at")
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(5),
    supabase
      .from("proactive_suggestions")
      .select("*, contacts(name, relationship), contextual_signals!signal_id(signal_type, signal_data)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("generated_at", { ascending: false })
      .limit(10),
    supabase
      .from("contact_recommendations")
      .select("contact_id, ideas")
      .eq("user_id", user.id),
  ]);

  const adminClient = createAdminClient();
  trackActivity(user.id, adminClient).catch(() => {});

  const typedContacts = (contacts ?? []) as (Contact & { questionnaire_responses: QuestionnaireResponse[] })[];
  const recentNotes = (recentNoteData ?? []) as ProfileNote[];

  // Map contact_id → first recommendation title for dashboard hints
  type RecoRow = { contact_id: string; ideas: { title: string }[] };
  const recoMap: Record<string, string> = {};
  for (const row of ((recoData ?? []) as RecoRow[])) {
    const firstTitle = row.ideas?.[0]?.title;
    if (firstTitle) recoMap[row.contact_id] = firstTitle;
  }
  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "";
  const initial = (firstName || user.email || "C")[0].toUpperCase();
  const onboardingDone = !!(myProfile as { onboarding_completed?: boolean } | null)?.onboarding_completed;
  const pushPrefEnabled = (myProfile as { notif_push_enabled?: boolean | null } | null)?.notif_push_enabled !== false;
  const isPaused = (myProfile as { subscription_status?: string } | null)?.subscription_status === 'paused';
  const isDevMode = user.email === "papillon.estelle@gmail.com" || process.env.NODE_ENV !== "production";

  let hasPushSub = false;
  try {
    const { count } = await supabase
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    hasPushSub = (count ?? 0) > 0;
  } catch { /* migration not yet applied */ }

  const showPushPrompt = pushPrefEnabled && !hasPushSub;

  const PRIORITY_RANK: Record<string, number> = { urgent: 3, high: 2, normal: 1, low: 0 };
  const proactivePending = ((proactiveData ?? []) as SuggestionWithContact[]).sort(
    (a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0)
  );
  const topProactiveSuggestion = proactivePending.find(s => ["urgent", "high"].includes(s.priority)) ?? null;

  // Hero focus — use top proactive suggestion or a contextual message
  let heroTitle = typedContacts.length === 0
    ? "Ajoutez un proche pour commencer."
    : "Candice garde le lien vivant.";
  let heroSubtitle = typedContacts.length === 0
    ? "Dites-lui de qui vous souhaitez prendre soin — elle s'occupe du reste."
    : undefined;

  if (topProactiveSuggestion) {
    const contactName = (topProactiveSuggestion.contacts as { name: string } | null)?.name ?? "";
    heroTitle = topProactiveSuggestion.title ?? `Une attention pour ${contactName}.`;
    heroSubtitle = topProactiveSuggestion.description ?? undefined;
  }

  return (
    <DashboardShell>
      {!onboardingDone && <OnboardingOverlay userId={user.id} userName={firstName} />}
      <TourReplay />
      {isPaused && <PauseBanner />}
      {showPushPrompt && <PushPrompt />}

      {/* ── Hero mass ── */}
      <div
        className="hero-mass hero-bg"
        style={{ padding: '0 0 48px' }}
      >
        {/* Top bar — hidden on desktop (Wordmark is in the rail) */}
        <div className="hero-top-bar" style={{ alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 0' }}>
          <span style={{
            fontFamily: 'var(--font-sans)', fontWeight: 300, fontSize: 20,
            letterSpacing: '.34em', textTransform: 'uppercase', color: '#F6F3EA',
            paddingLeft: '.34em', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            CANDICE
            <LivePoint size={6} tone="champ" />
          </span>
          {/* Avatar utilisateur */}
          <div style={{
            width: 33, height: 33, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--pine)',
            background: 'radial-gradient(120% 120% at 30% 22%, #FFFFFF, #F1E8D2 60%, #E0CFA6)',
            boxShadow: '0 0 0 1px var(--champ-line)',
          }}>
            {initial}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '48px 26px 0' }}>
          <div style={{
            fontSize: 10.5, letterSpacing: '.4em', textTransform: 'uppercase',
            color: 'var(--champ)', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
          }}>
            <LivePoint size={5} tone="champ" />
            Maintenant
          </div>

          <p style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 300,
            fontSize: 'clamp(36px,9.5vw,44px)',
            lineHeight: 1.2,
            color: '#FAF8F1',
            letterSpacing: '-.022em',
            marginBottom: heroSubtitle ? 18 : 28,
          } as React.CSSProperties}>
            {heroTitle}
          </p>

          {heroSubtitle && (
            <p style={{
              fontSize: 14, fontWeight: 300,
              color: 'rgba(244,241,232,.64)',
              lineHeight: 1.7, maxWidth: 300, marginBottom: 28,
            }}>
              {heroSubtitle}
            </p>
          )}

          <div style={{ height: 1, background: 'linear-gradient(90deg, var(--champ-line), transparent)', marginBottom: 22 }} />

          {topProactiveSuggestion ? (
            <Link href={`/contacts/${(topProactiveSuggestion.contacts as { name?: string; id?: string } | null)?.id ?? ""}`} style={{ textDecoration: 'none' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                fontSize: 15, fontWeight: 400, color: '#F6F3EA',
              }}>
                Voir l&apos;idée <span>→</span>
              </span>
            </Link>
          ) : typedContacts.length === 0 ? (
            <Link href="/contacts/new" style={{ textDecoration: 'none' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                fontSize: 15, fontWeight: 400, color: '#F6F3EA',
              }}>
                Ajouter un proche <span>→</span>
              </span>
            </Link>
          ) : null}
        </div>
      </div>

      {/* ── Corps blanc ── */}
      <div className="body-pad">

        {/* Proactive card when urgent/high */}
        {topProactiveSuggestion && (
          <div style={{ marginTop: 24 }}>
            <ProactiveDashboardCard
              topSuggestion={topProactiveSuggestion}
              allPending={proactivePending}
              pendingCount={proactivePending.length}
              isDevMode={isDevMode}
            />
          </div>
        )}

        {/* Notes Candice */}
        {recentNotes.length > 0 && (
          <>
            <PointDivider label="Candice a gardé en tête" />
            <Thread>
              {recentNotes.map((note, i) => (
                <ThreadItem key={note.id} nodeType={i === 0 ? 'solid' : 'soft'} voice={i === 0}>
                  <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--ink-2)', lineHeight: 1.7 }}>
                    {note.note}
                  </p>
                </ThreadItem>
              ))}
            </Thread>
          </>
        )}

        {/* Tes proches */}
        {typedContacts.length > 0 && (
          <>
            <PointDivider label="Tes proches" />
            <Thread>
              {typedContacts.slice(0, 4).map((contact, i) => {
                const pct = getCompletion(contact.questionnaire_responses?.[0]);
                const state = contactState(pct);
                const isAnticipe = pct >= 65;
                return (
                  <Link key={contact.id} href={`/contacts/${contact.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <ThreadItem nodeType={isAnticipe ? 'anticipe' : 'soft'} dim={pct < 20}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Avatar initial={contact.name[0]} size={46} variant={avatarVariant(i)} />
                        <div>
                          <div style={{
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 400, fontSize: 19,
                            color: 'var(--ink)', letterSpacing: '-.012em',
                          }}>
                            {contact.name}
                          </div>
                          <div style={{ fontSize: 12.5, color: isAnticipe ? 'var(--pine)' : 'var(--ink-3)', fontWeight: 400, marginTop: 3 }}>
                            {state} {contact.name.split(' ')[0]}
                          </div>
                          {recoMap[contact.id] && (
                            <div style={{ fontSize: 11.5, fontWeight: 300, color: 'var(--ink-3)', marginTop: 4, fontStyle: 'italic' }}>
                              ✦ {recoMap[contact.id]}
                            </div>
                          )}
                        </div>
                      </div>
                    </ThreadItem>
                  </Link>
                );
              })}
            </Thread>

            {typedContacts.length > 4 && (
              <Link href="/contacts" style={{ display: 'block', marginTop: 12, fontSize: 13, color: 'var(--ink-3)', fontWeight: 300 }}>
                + {typedContacts.length - 4} autres proches →
              </Link>
            )}
          </>
        )}

        {/* Empty state */}
        {typedContacts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0 24px' }}>
            <Link href="/contacts/new">
              <button className="btn-primary">Ajouter un proche →</button>
            </Link>
          </div>
        )}

        {/* Archived link */}
        {(archivedCount ?? 0) > 0 && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '.5px solid var(--line)' }}>
            <Link href="/dashboard/archives" style={{ fontSize: 12, fontWeight: 300, color: 'var(--ink-3)' }}>
              {archivedCount} {archivedCount === 1 ? 'contact archivé' : 'contacts archivés'} →
            </Link>
          </div>
        )}

      </div>

      <PresenceInput />
    </DashboardShell>
  );
}
