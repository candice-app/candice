import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import Thread, { ThreadItem } from "@/components/presence/Thread";
import PointDivider from "@/components/presence/PointDivider";
import Link from "next/link";

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
      <div className="content-col" style={{ paddingTop: 28 }}>

        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 28,
          padding: "0 4px",
        }}>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 300,
            fontSize: 35,
            color: "var(--ink)",
            letterSpacing: "-.022em",
            lineHeight: 1,
          } as React.CSSProperties}>
            Parler à Candice
          </h1>
        </div>

        {confidences.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", marginBottom: 8, lineHeight: 1.7 }}>
              Aucun échange pour l&apos;instant.
            </p>
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65, maxWidth: 280, margin: "0 auto" }}>
              Parlez à Candice depuis l&apos;accueil — tout ce que vous lui confiez apparaîtra ici.
            </p>
          </div>
        ) : (
          <div>
            {Object.entries(groups).map(([dateKey, items]) => (
              <div key={dateKey}>
                <PointDivider label={dateKey} />
                <Thread>
                  {items.map((conf, i) => (
                    <ThreadItem key={conf.id} nodeType={i === 0 ? "solid" : "soft"} voice={!!conf.candice_response}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          {conf.contacts && (
                            <Link
                              href={`/contacts/${conf.contact_id}`}
                              style={{ fontSize: 12, fontWeight: 500, color: "var(--pine)", textDecoration: "none" }}
                            >
                              {conf.contacts.name}
                            </Link>
                          )}
                          <span style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-3)", marginLeft: "auto" }}>
                            {new Date(conf.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", fontStyle: "italic", lineHeight: 1.65, marginBottom: conf.candice_response ? 12 : 0 }}>
                          &ldquo;{conf.raw_text}&rdquo;
                        </p>
                        {conf.candice_response && (
                          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.6, borderTop: "0.5px solid var(--line)", paddingTop: 10 }}>
                            ✦ {conf.candice_response}
                          </p>
                        )}
                      </div>
                    </ThreadItem>
                  ))}
                </Thread>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
