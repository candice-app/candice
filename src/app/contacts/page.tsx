import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import V4Shell from "@/components/layout/V4Shell";
import { Icon } from "@/components/ui/v4/IconSprite";
import type { Contact, QuestionnaireResponse } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function getStatusLabel(pct: number, hasProche: boolean): string {
  if (hasProche) return "Candice connaît bien";
  if (pct >= 65) return "Candice anticipe pour toi";
  if (pct >= 30) return "Candice a quelques repères";
  return "Candice commence à apprendre";
}

const RELATIONSHIP_FR: Record<string, string> = {
  partner:   "Conjoint·e",
  friend:    "Ami·e",
  family:    "Famille",
  colleague: "Collègue",
  other:     "Autre",
};

function relationLabel(raw: string | null | undefined): string {
  if (!raw) return "";
  return RELATIONSHIP_FR[raw] ?? raw;
}

// ── Inline styles ─────────────────────────────────────────────────────────────

const TAG_WARN: React.CSSProperties = {
  fontSize: 10.5, color: "#7a4b1e", background: "rgba(205,185,135,.22)",
  padding: "4px 9px", borderRadius: 8, display: "inline-block",
};

const TAG_SOFT: React.CSSProperties = {
  fontSize: 10.5, color: "#3d5a4b", background: "var(--sage-bg)",
  padding: "4px 9px", borderRadius: 8, display: "inline-block",
};

const CHIP: React.CSSProperties = {
  display: "inline-block", padding: "5px 11px",
  border: "1px solid var(--line)", borderRadius: 999,
  fontSize: 11, color: "var(--ink2)", background: "var(--surface)",
  textDecoration: "none",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: contacts },
    { data: pendingSuggestions },
    { data: inviteLinks },
    { data: recoData },
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
    supabase
      .from("invite_links")
      .select("contact_id")
      .eq("pilote_id", user.id),
    supabase
      .from("contact_recommendations")
      .select("contact_id, ideas")
      .eq("user_id", user.id),
  ]);

  const pendingContactIds = new Set(
    (pendingSuggestions ?? []).map(s => s.contact_id).filter(Boolean) as string[]
  );
  const invitedContactIds = new Set(
    (inviteLinks ?? []).map(l => l.contact_id).filter(Boolean) as string[]
  );

  type RecoRow = { contact_id: string; ideas: { title: string }[] };
  const recoMap: Record<string, string> = {};
  for (const row of ((recoData ?? []) as RecoRow[])) {
    const firstTitle = row.ideas?.[0]?.title;
    if (firstTitle) recoMap[row.contact_id] = firstTitle;
  }

  const typedContacts = (contacts ?? []) as (Contact & { questionnaire_responses: QuestionnaireResponse[] })[];
  const sorted = [...typedContacts].sort((a, b) =>
    getCompletion(b.questionnaire_responses?.[0]) - getCompletion(a.questionnaire_responses?.[0])
  );

  return (
    <V4Shell active="people">
      <div data-page-ready="contacts" style={{ padding: "12px 20px 120px", fontFamily: "var(--font-sans)" }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          margin: "6px 0 12px",
        }}>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: 26, margin: 0,
            color: "var(--ink)", letterSpacing: "-.012em",
          }}>
            Mes proches
          </h2>
          <Link href="/contacts/new" style={{
            ...CHIP, borderColor: "var(--pine)", color: "var(--pine)", fontWeight: 600,
          }}>
            + Ajouter
          </Link>
        </div>

        {/* Filter chips — decorative */}
        <div style={{ display: "flex", gap: 7, overflow: "hidden", marginBottom: 14 }}>
          {[
            { label: "Tous", active: true },
            { label: "Famille" },
            { label: "Amis" },
            { label: "À affiner" },
          ].map(({ label, active }) => (
            <span key={label} style={{
              ...CHIP,
              ...(active ? { background: "var(--pine)", color: "#fff", borderColor: "var(--pine)" } : {}),
            }}>
              {label}
            </span>
          ))}
        </div>

        {/* Empty state */}
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <p style={{ fontSize: 15, color: "var(--ink2)", marginBottom: 24, lineHeight: 1.7 }}>
              Aucun proche encore — Candice attend de les connaître.
            </p>
            <Link href="/contacts/new" style={{
              display: "inline-block", padding: "13px 24px",
              background: "var(--pine)", color: "#fff", borderRadius: 15,
              fontWeight: 600, fontSize: 14.5, textDecoration: "none",
            }}>
              Ajouter un proche →
            </Link>
          </div>
        ) : (
          sorted.map((contact) => {
            const profile = contact.questionnaire_responses?.[0];
            const pct = getCompletion(profile);
            const circumference = 125.6;
            const dashoffset = Math.round(circumference * (1 - pct / 100));
            const hasProche = !!contact.proche_user_id;
            const hasPending = pendingContactIds.has(contact.id);
            const hasInvite = invitedContactIds.has(contact.id);
            const recoTitle = recoMap[contact.id];
            const firstName = contact.name.split(" ")[0];
            const pronoun = contact.gender === "femme" ? "elle" : "lui";

            // Nearest upcoming date (≤30 days)
            const dates = parseImportantDates(profile?.important_dates ?? null);
            const nearestDate = dates
              .map(d => ({ ...d, days: daysUntil(d.date) }))
              .filter(d => d.days >= 0 && d.days <= 30)
              .sort((a, b) => a.days - b.days)[0];

            return (
              <div key={contact.id} style={{
                background: "var(--surface)", border: "1px solid var(--line)",
                borderRadius: 18, boxShadow: "var(--shadow)",
                padding: 14, marginBottom: 12,
              }}>
                {/* Ring + info row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* ProgressRing (no % shown) */}
                  <div style={{ position: "relative", width: 46, height: 46, flexShrink: 0 }}>
                    <svg width="46" height="46">
                      <circle cx="23" cy="23" r="20" fill="none" stroke="#E7E3D8" strokeWidth="3" />
                      <circle
                        cx="23" cy="23" r="20" fill="none"
                        stroke="var(--pine)" strokeWidth="3" strokeLinecap="round"
                        strokeDasharray="125.6" strokeDashoffset={dashoffset}
                        transform="rotate(-90 23 23)"
                      />
                    </svg>
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: "50%", display: "block",
                        background: "var(--pine)", boxShadow: "0 0 8px rgba(62,115,97,.55)",
                      }} />
                    </div>
                  </div>

                  {/* Name / relationship / status */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "var(--font-serif)", fontSize: 18,
                      color: "var(--ink)", letterSpacing: "-.012em",
                    }}>
                      {contact.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 1 }}>
                      {relationLabel(contact.relationship)}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink2)", marginTop: 1 }}>
                      {getStatusLabel(pct, hasProche)}
                    </div>
                    {hasInvite && !hasProche && (
                      <div style={{ fontSize: 11, color: "rgba(205,185,135,.75)", fontWeight: 400, marginTop: 2 }}>
                        Invitation envoyée · en attente
                      </div>
                    )}
                  </div>

                  {/* Top-row: point proactif + flèche */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {hasPending && (
                      <span style={{
                        display: "inline-block", width: 7, height: 7, borderRadius: "50%",
                        background: "var(--pine)", boxShadow: "0 0 8px rgba(62,115,97,.55)",
                      }} />
                    )}
                    <Link href={`/contacts/${contact.id}`} style={{
                      fontSize: 13, color: "var(--ink3)", textDecoration: "none",
                    }}>
                      →
                    </Link>
                  </div>
                </div>

                {/* Tags */}
                {(nearestDate || recoTitle) && (
                  <div style={{ display: "flex", gap: 7, margin: "11px 0 9px", flexWrap: "wrap" }}>
                    {nearestDate && (
                      <span style={TAG_WARN}>
                        {nearestDate.label} dans {nearestDate.days === 0 ? "aujourd'hui" : `${nearestDate.days} j`}
                      </span>
                    )}
                    {recoTitle && (
                      <span style={TAG_SOFT}>Envie : {recoTitle}</span>
                    )}
                  </div>
                )}

                {/* Proactive signal */}
                {hasPending && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 11 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "var(--pine)", boxShadow: "0 0 8px rgba(62,115,97,.55)",
                      display: "inline-block", flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 11.5, color: "var(--pine)", fontWeight: 600 }}>
                      Une attention prête pour {firstName}
                    </span>
                  </div>
                )}

                {/* CTA buttons — only if contact_recommendations exists */}
                {recoTitle && hasPending && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/contacts/${contact.id}`} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      height: 42, padding: "0 14px", borderRadius: 15,
                      background: "var(--pine)", color: "#fff",
                      fontSize: 13, fontWeight: 600, textDecoration: "none",
                      fontFamily: "var(--font-sans)",
                    }}>
                      <Icon name="i-spark" size={16} />
                      Voir mon idée pour {pronoun}
                    </Link>
                    <Link href={`/contacts/${contact.id}`} style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      height: 42, padding: "0 13px", borderRadius: 15,
                      background: "transparent", color: "var(--pine)",
                      border: "1px solid var(--line)", boxShadow: "none",
                      fontSize: 12.5, fontWeight: 600, textDecoration: "none",
                      fontFamily: "var(--font-sans)",
                    }}>
                      Ouvrir
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </V4Shell>
  );
}
