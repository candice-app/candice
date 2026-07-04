import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import V4Shell from "@/components/layout/V4Shell";
import { Icon } from "@/components/ui/v4/IconSprite";
import { trackActivity } from "@/lib/lifecycle/track-activity";
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay";
import TourReplay from "@/components/onboarding/TourReplay";
import PauseBanner from "@/components/dashboard/PauseBanner";
import PushPrompt from "@/components/dashboard/PushPrompt";
import type { SuggestionWithContact } from "@/components/dashboard/ProactiveDashboardCard";
import { Contact, QuestionnaireResponse, ProfileNote } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

interface ImportantDate { label: string; date: string }

function parseImportantDates(raw: string | null): ImportantDate[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return (parsed as ImportantDate[]).filter(d => d.date);
  } catch { /* legacy text */ }
  return [];
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const year = now.getFullYear();
  const parts = dateStr.includes("-") ? dateStr.split("-").slice(-2).map(Number) : [0, 0];
  const [month, day] = parts;
  if (!month || !day) return Infinity;
  let next = new Date(year, month - 1, day);
  if (next < now) next = new Date(year + 1, month - 1, day);
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function Divtxt({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      margin: "18px 0 11px",
      fontSize: 10, letterSpacing: "1.6px", textTransform: "uppercase",
      color: "var(--ink3)", fontWeight: 700, fontFamily: "var(--font-sans)",
    }}>
      <div style={{ flex: 1, height: 1, background: "var(--line2)" }} />
      {children}
      <div style={{ flex: 1, height: 1, background: "var(--line2)" }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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

  void suggestionsData;

  const adminClient = createAdminClient();
  trackActivity(user.id, adminClient).catch(() => {});

  const typedContacts = (contacts ?? []) as (Contact & { questionnaire_responses: QuestionnaireResponse[] })[];
  const recentNotes = (recentNoteData ?? []) as ProfileNote[];

  type RecoRow = { contact_id: string; ideas: { title: string }[] };
  const recoMap: Record<string, string> = {};
  for (const row of ((recoData ?? []) as RecoRow[])) {
    const firstTitle = row.ideas?.[0]?.title;
    if (firstTitle) recoMap[row.contact_id] = firstTitle;
  }

  const contactMap: Record<string, string> = Object.fromEntries(
    typedContacts.map(c => [c.id, c.name])
  );

  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "";
  const onboardingDone = !!(myProfile as { onboarding_completed?: boolean } | null)?.onboarding_completed;
  const pushPrefEnabled = (myProfile as { notif_push_enabled?: boolean | null } | null)?.notif_push_enabled !== false;
  const isPaused = (myProfile as { subscription_status?: string } | null)?.subscription_status === "paused";

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

  // Upcoming important dates across all contacts (next 90 days)
  const allUpcoming: { contactId: string; contactName: string; label: string; days: number }[] = [];
  for (const c of typedContacts) {
    const profile = c.questionnaire_responses?.[0];
    for (const d of parseImportantDates(profile?.important_dates ?? null)) {
      const days = daysUntil(d.date);
      if (days >= 0 && days <= 90) allUpcoming.push({ contactId: c.id, contactName: c.name, label: d.label, days });
    }
  }
  allUpcoming.sort((a, b) => a.days - b.days);

  const toAffinCount = typedContacts.filter(c => getCompletion(c.questionnaire_responses?.[0]) < 30).length;

  // Locale date label (e.g. "Lundi 15 juin")
  const today = new Date();
  const dateLabel = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const dateLabelCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  // Ask card: pick contact with lowest completion
  const askContact = typedContacts.length > 0
    ? [...typedContacts].sort((a, b) => getCompletion(a.questionnaire_responses?.[0]) - getCompletion(b.questionnaire_responses?.[0]))[0]
    : null;

  return (
    <V4Shell active="home">
      {!onboardingDone && <OnboardingOverlay userId={user.id} userName={firstName} />}
      <TourReplay />
      {isPaused && <PauseBanner />}
      {showPushPrompt && <PushPrompt />}

      <div style={{ padding: "12px 20px 120px", fontFamily: "var(--font-sans)" }}>

        {/* Date + greeting */}
        <div style={{ margin: "6px 0 2px" }}>
          <div style={{
            fontSize: 10, letterSpacing: "1.8px", textTransform: "uppercase",
            color: "var(--ink3)", fontWeight: 700,
          }}>
            {dateLabelCap}
          </div>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: 26, margin: "3px 0 0",
            color: "var(--ink)", letterSpacing: "-.012em", lineHeight: 1.2,
          }}>
            Bonjour{firstName ? `, ${firstName}` : ""}
          </h2>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink2)", margin: "4px 0 0", lineHeight: 1.4 }}>
          Ce qu&apos;il ne faut pas laisser passer.
        </p>

        {/* Statline */}
        <div style={{ display: "flex", gap: 7, margin: "12px 0 16px" }}>
          {[
            { n: proactivePending.length, label: proactivePending.length === 1 ? "proche à soutenir" : "proches à soutenir" },
            { n: allUpcoming.length, label: allUpcoming.length === 1 ? "date à venir" : "dates à venir" },
            { n: toAffinCount, label: toAffinCount === 1 ? "profil à affiner" : "profils à affiner" },
          ].map(({ n, label }) => (
            <div key={label} style={{
              flex: 1, background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: 13, padding: "9px 8px", textAlign: "center",
              boxShadow: "var(--shadow)",
            }}>
              <b style={{ fontFamily: "var(--font-serif)", fontSize: 21, color: "var(--pine)", display: "block" }}>
                {n}
              </b>
              <span style={{ fontSize: 9.5, color: "var(--ink2)", lineHeight: 1.2, display: "block", marginTop: 1 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Proactive card */}
        {topProactiveSuggestion && (
          <div style={{
            borderRadius: 20, padding: 16, position: "relative", overflow: "hidden",
            marginBottom: 14, background: "linear-gradient(157deg,#1D5040,#0C2A20)",
            color: "#fff", boxShadow: "0 14px 34px rgba(23,62,49,.22)",
          }}>
            <div style={{
              position: "absolute", right: -26, top: -46,
              width: 160, height: 160, borderRadius: "50%",
              background: "radial-gradient(circle,rgba(205,185,135,.4),transparent 70%)",
              pointerEvents: "none",
            }} />
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 10, letterSpacing: "1px", textTransform: "uppercase",
              color: "var(--champ)", fontWeight: 700,
              background: "rgba(255,255,255,.14)", padding: "4px 9px", borderRadius: 8,
            }}>
              <Icon name="i-heart" size={13} /> À soutenir
            </span>
            <div style={{
              fontFamily: "var(--font-serif)", fontSize: 19, margin: "9px 0 4px",
              lineHeight: 1.2, color: "#fff",
            }}>
              {topProactiveSuggestion.title}
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.86)", lineHeight: 1.45 }}>
              {topProactiveSuggestion.description}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
              <Link href={`/contacts/${topProactiveSuggestion.contact_id ?? ""}`} style={{
                background: "#fff", color: "var(--pine)", fontWeight: 600, fontSize: 12.5,
                padding: "10px 14px", borderRadius: 12, textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}>
                Voir l&apos;attention
              </Link>
              <div style={{
                border: "1px solid rgba(255,255,255,.4)", color: "#fff", fontWeight: 600,
                fontSize: 12.5, padding: "10px 14px", borderRadius: 12,
                fontFamily: "var(--font-sans)",
              }}>
                Déjà fait
              </div>
            </div>
          </div>
        )}

        {/* À faire aujourd'hui */}
        {allUpcoming.length > 0 && (
          <>
            <Divtxt>À faire aujourd&apos;hui</Divtxt>
            {allUpcoming.slice(0, 3).map((d, i) => (
              <Link key={i} href={`/contacts/${d.contactId}`} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: 12, border: "1px solid var(--line)", borderRadius: 14,
                  background: "#fff", marginBottom: 9, boxShadow: "var(--shadow)",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "var(--gtint)", color: "var(--pine)",
                  }}>
                    <Icon name="i-gift" size={18} />
                  </div>
                  <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>
                    {d.label} de {d.contactName}
                    <small style={{ display: "block", fontSize: 11, color: "var(--ink3)", fontWeight: 400 }}>
                      {d.days === 0 ? "Aujourd'hui" : d.days === 1 ? "Demain" : `Dans ${d.days} jours`}
                    </small>
                  </div>
                  <span style={{ color: "var(--ink3)" }}>→</span>
                </div>
              </Link>
            ))}
          </>
        )}

        {/* On prend des nouvelles ? */}
        <Divtxt>On prend des nouvelles&nbsp;?</Divtxt>
        <div style={{
          border: "1px solid var(--line)", borderLeft: "3px solid var(--champ)",
          borderRadius: 13, background: "#fff", padding: "13px 14px",
          marginBottom: 9, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 10, boxShadow: "var(--shadow)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
            Comment vas-tu{firstName ? `, ${firstName}` : ""}&nbsp;?
            <small style={{ display: "block", fontSize: 11, color: "var(--ink3)", fontWeight: 400, marginTop: 2 }}>
              Quelques mots, et j&apos;ajuste.
            </small>
          </div>
          <Link href="/parler-a-candice" style={{
            fontSize: 11.5, fontWeight: 600, color: "var(--pine)", whiteSpace: "nowrap",
            border: "1px solid var(--line)", padding: "7px 11px", borderRadius: 10,
            background: "#fff", textDecoration: "none",
          }}>
            Me raconter
          </Link>
        </div>
        {askContact && (
          <div style={{
            border: "1px solid var(--line)", borderLeft: "3px solid var(--champ)",
            borderRadius: 13, background: "#fff", padding: "13px 14px",
            marginBottom: 9, display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 10, boxShadow: "var(--shadow)",
          }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
              Des nouvelles de {askContact.name.split(" ")[0]}&nbsp;?
            </div>
            <Link href={`/contacts/${askContact.id}`} style={{
              fontSize: 11.5, fontWeight: 600, color: "var(--pine)", whiteSpace: "nowrap",
              border: "1px solid var(--line)", padding: "7px 11px", borderRadius: 10,
              background: "#fff", textDecoration: "none",
            }}>
              Mettre à jour
            </Link>
          </div>
        )}

        {/* Tu m'as dit */}
        {recentNotes.length > 0 && (
          <>
            <Divtxt>Tu m&apos;as dit</Divtxt>
            <div style={{ position: "relative", paddingLeft: 17 }}>
              <div style={{
                position: "absolute", left: 3, top: 5, bottom: 6,
                width: 1.5, background: "var(--line)",
              }} />
              {recentNotes.map((note) => (
                <div key={note.id} style={{ position: "relative", marginBottom: 13 }}>
                  <div style={{
                    position: "absolute", left: -17, top: 4,
                    width: 7, height: 7, borderRadius: "50%",
                    background: "var(--glow)",
                  }} />
                  <div style={{
                    fontSize: 10, letterSpacing: ".5px", textTransform: "uppercase",
                    color: "var(--champ)", fontWeight: 700,
                    filter: "saturate(.8) brightness(.85)",
                  }}>
                    {note.contact_id ? (contactMap[note.contact_id] ?? "—") : "—"}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.4, margin: "2px 0 4px", color: "var(--ink)" }}>
                    {note.note}
                  </div>
                  {note.contact_id && recoMap[note.contact_id] && (
                    <Link href={`/contacts/${note.contact_id}`} style={{
                      fontSize: 11.5, color: "var(--pine)", fontWeight: 600, textDecoration: "none",
                    }}>
                      Transformer en attention →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {typedContacts.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0 24px" }}>
            <Link href="/contacts/new" style={{
              display: "inline-block", padding: "13px 24px",
              background: "var(--pine)", color: "#fff", borderRadius: 15,
              fontWeight: 600, fontSize: 14.5, textDecoration: "none",
            }}>
              Ajouter un proche →
            </Link>
          </div>
        )}

        {/* B.2 Phase 6 — entrée du moteur de recherche (Sens 1) */}
        <div style={{ marginTop: 22, textAlign: "center" }}>
          <Link href="/recherche" style={{
            display: "inline-flex", alignItems: "center", minHeight: 44,
            padding: "0 12px", fontSize: 12.5, fontWeight: 600,
            color: "var(--pine)", textDecoration: "none",
          }}>
            Quelqu&apos;un est déjà sur Candice ? Demande à voir sa fiche →
          </Link>
        </div>

        {(archivedCount ?? 0) > 0 && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: ".5px solid var(--line)" }}>
            <Link href="/dashboard/archives" style={{ fontSize: 12, fontWeight: 300, color: "var(--ink3)" }}>
              {archivedCount} {archivedCount === 1 ? "contact archivé" : "contacts archivés"} →
            </Link>
          </div>
        )}

      </div>
    </V4Shell>
  );
}
