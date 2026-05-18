import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import Link from "next/link";

const TONE_ICON: Record<string, string> = {
  positive: "✦",
  negative: "·",
  urgent: "!",
  mixed: "◎",
  neutral: "○",
};

interface Confidence {
  id: string;
  contact_id: string | null;
  raw_text: string;
  emotional_tone: string;
  candice_response: string | null;
  created_at: string;
  contacts: { name: string; relationship: string } | null;
}

export default async function HistoriquePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("confidences")
    .select("id, contact_id, raw_text, emotional_tone, candice_response, created_at, contacts(name, relationship)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const confidences = ((data ?? []) as unknown) as Confidence[];

  // Group by date
  const groups: Record<string, Confidence[]> = {};
  for (const conf of confidences) {
    const dateKey = new Date(conf.created_at).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long",
    });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(conf);
  }

  return (
    <DashboardShell>
      <div style={{ marginBottom: 28 }}>
        <p className="section-label">Vos échanges</p>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Mes échanges</h1>
      </div>

      {confidences.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", border: "0.5px dashed var(--br3)", borderRadius: "var(--r-lg)" }}>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--con)", marginBottom: 6 }}>
            Aucun échange pour l&apos;instant.
          </p>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.65, maxWidth: 280, margin: "0 auto" }}>
            Parlez à Candice depuis le tableau de bord. Tout ce que vous lui confiez apparaîtra ici.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {Object.entries(groups).map(([dateKey, items]) => (
            <div key={dateKey}>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cond)", marginBottom: 12 }}>
                {dateKey}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {items.map(conf => (
                  <div key={conf.id} className="card" style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--terra)" }}>
                        {TONE_ICON[conf.emotional_tone] ?? "○"}
                      </span>
                      {conf.contacts && (
                        <Link
                          href={`/contacts/${conf.contact_id}`}
                          style={{ fontSize: 11, fontWeight: 400, color: "var(--terra)", textDecoration: "none" }}
                        >
                          {conf.contacts.name}
                        </Link>
                      )}
                      <span style={{ fontSize: 10, fontWeight: 300, color: "var(--cond)", marginLeft: "auto" }}>
                        {new Date(conf.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 300, color: "var(--con)", fontStyle: "italic", lineHeight: 1.6, marginBottom: conf.candice_response ? 10 : 0 }}>
                      &ldquo;{conf.raw_text}&rdquo;
                    </p>
                    {conf.candice_response && (
                      <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.55, borderTop: "0.5px solid var(--brd)", paddingTop: 8 }}>
                        ✦ {conf.candice_response}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
