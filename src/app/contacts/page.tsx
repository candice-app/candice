import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import Avatar from "@/components/presence/Avatar";
import Thread, { ThreadItem } from "@/components/presence/Thread";
import type { Contact, QuestionnaireResponse } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SCORED_FIELDS: (keyof QuestionnaireResponse)[] = [
  "love_language", "communication_style", "stress_response", "social_energy",
  "appreciation_style", "conflict_resolution", "decision_making", "emotional_expression",
  "core_values", "recognition_preference", "boundaries", "growth_mindset",
  "hobbies", "favorite_foods", "gift_preference", "conversation_topics", "important_dates",
];

function getCompletion(profile?: QuestionnaireResponse): number {
  if (!profile) return 0;
  const filled = SCORED_FIELDS.filter(f => !!profile[f]).length;
  return Math.round((filled / SCORED_FIELDS.length) * 100);
}

function contactState(pct: number): string {
  if (pct >= 65) return "Candice anticipe pour";
  if (pct >= 30) return "Candice connaît bien";
  return "Candice commence à connaître";
}

interface ImportantDate { label: string; date: string; }

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

type Signal = { pre: string; bold: string } | string | null;

function computeSignal(
  profile: QuestionnaireResponse | undefined,
  pct: number,
  hasPendingSuggestion: boolean,
): Signal {
  if (!profile) return "Complète son profil";

  const dates = parseImportantDates(profile.important_dates ?? null);
  const upcoming = dates
    .map(d => ({ ...d, days: daysUntil(d.date) }))
    .filter(d => d.days <= 30)
    .sort((a, b) => a.days - b.days)[0];

  if (upcoming) {
    const dayLabel = upcoming.days === 0 ? "aujourd'hui"
      : upcoming.days === 1 ? "demain"
      : `dans ${upcoming.days} jours`;
    return { pre: `${upcoming.label} `, bold: dayLabel };
  }

  if (hasPendingSuggestion) return "Une attention t'attend";
  if (pct < 30) return "Complète son profil";

  return null;
}

function avatarVariant(i: number): "g" | "c" {
  return i % 2 === 0 ? "g" : "c";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: contacts },
    { data: pendingSuggestions },
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select("*, questionnaire_responses(*)")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("proactive_suggestions")
      .select("contact_id")
      .eq("user_id", user.id)
      .eq("status", "pending"),
  ]);

  const pendingContactIds = new Set(
    (pendingSuggestions ?? []).map(s => s.contact_id).filter(Boolean) as string[]
  );
  const typedContacts = (contacts ?? []) as (Contact & { questionnaire_responses: QuestionnaireResponse[] })[];

  // Sort: most complete first
  const sorted = [...typedContacts].sort((a, b) => {
    const pA = getCompletion(a.questionnaire_responses?.[0]);
    const pB = getCompletion(b.questionnaire_responses?.[0]);
    return pB - pA;
  });

  return (
    <DashboardShell>
      <div className="content-col" style={{ paddingTop: "28px" }}>

        {/* ptitle */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 26,
          padding: "0 4px",
        }}>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontOpticalSizing: "auto" as React.CSSProperties["fontOpticalSizing"],
            fontWeight: 300,
            fontSize: 35,
            color: "var(--ink)",
            letterSpacing: "-.022em",
            lineHeight: 1,
          } as React.CSSProperties}>
            Mes proches
          </h1>
          <Link href="/contacts/new" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 13, color: "var(--pine)", fontWeight: 500 }}>+ Ajouter</span>
          </Link>
        </div>

        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", marginBottom: 24, lineHeight: 1.7 }}>
              Aucun proche encore — Candice attend de les connaître.
            </p>
            <Link href="/contacts/new">
              <button className="btn-primary">Ajouter un proche →</button>
            </Link>
          </div>
        ) : (
          <Thread>
            {sorted.map((contact, i) => {
              const profile = contact.questionnaire_responses?.[0];
              const pct = getCompletion(profile);
              const state = contactState(pct);
              const hasPending = pendingContactIds.has(contact.id);
              const isAnticipe = pct >= 65;
              const isDim = pct < 20;
              const signal = computeSignal(profile, pct, hasPending);
              const firstName = contact.name.split(" ")[0];

              return (
                <Link key={contact.id} href={`/contacts/${contact.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <ThreadItem nodeType={isAnticipe ? "anticipe" : "soft"} dim={isDim}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <Avatar initial={contact.name[0]} size={54} variant={avatarVariant(i)} />
                      <div>
                        <div style={{
                          fontFamily: "var(--font-serif)",
                          fontOpticalSizing: "auto" as React.CSSProperties["fontOpticalSizing"],
                          fontWeight: 400,
                          fontSize: 20,
                          color: "var(--ink)",
                          letterSpacing: "-.012em",
                        } as React.CSSProperties}>
                          {contact.name}
                        </div>
                        <div style={{
                          fontSize: 12.5,
                          color: isAnticipe ? "var(--pine)" : "var(--ink-3)",
                          fontWeight: 400,
                          marginTop: 4,
                        }}>
                          {state} {firstName}
                        </div>
                        {signal && (
                          <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300, marginTop: 4 }}>
                            {typeof signal === "string" ? signal : (
                              <>{signal.pre}<b style={{ color: "var(--champ)", fontWeight: 600 }}>{signal.bold}</b></>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </ThreadItem>
                </Link>
              );
            })}
          </Thread>
        )}
      </div>
    </DashboardShell>
  );
}
