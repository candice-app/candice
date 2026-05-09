import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";

const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";
const BORDER = "rgba(30,18,8,0.08)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

const POINTS_TABLE = [
  { label: "Compléter ton profil", pts: "+500 pts" },
  { label: "Ajouter un proche", pts: "+200 pts" },
  { label: "Fiche d'un proche complétée", pts: "+500 pts" },
  { label: "Ajouter une date importante", pts: "+50 pts" },
  { label: "Laisser un feedback", pts: "+100 pts" },
  { label: "Marquer une attention réalisée", pts: "+100 pts" },
];

const STEPS_INFO = [
  { label: "Compléter ton profil", href: "/moi/questionnaire" },
  { label: "Inviter un premier proche", href: "/contacts/new" },
  { label: "Fiche d'un proche complétée", href: null },
  { label: "Première attention marquée", href: null },
];

export default async function AidePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell>
      <div style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 32 }}>
          <p className="section-label">Centre d&apos;aide</p>
          <h1 className="page-title">Aide</h1>
        </div>

        {/* Section 1 — Getting started steps */}
        <Section title="Les étapes pour bien démarrer">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {STEPS_INFO.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--br1)", border: "0.5px solid var(--brd)", borderRadius: 8 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--br3)", border: "1.5px solid var(--brd2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 500, color: "var(--terra)" }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 13, fontWeight: 300, color: "var(--con)", flex: 1 }}>{step.label}</span>
                {step.href && (
                  <a href={step.href} style={{ fontSize: 11, color: "var(--terra)", textDecoration: "none", fontWeight: 400 }}>
                    Faire →
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Section 2 — Voice command */}
        <Section title="La commande vocale 🎤">
          <p style={{ fontFamily: DM, fontSize: 14, fontWeight: 300, color: "var(--cond)", lineHeight: 1.8 }}>
            Sur chaque champ de texte, appuie sur le micro, parle en français — Candice retranscrit automatiquement.
          </p>
        </Section>

        {/* Section 3 — Candice input */}
        <Section title="Dis quelque chose à Candice">
          <p style={{ fontFamily: DM, fontSize: 14, fontWeight: 300, color: "var(--cond)", lineHeight: 1.8 }}>
            Depuis le tableau de bord, tape ou dicte une note sur un de tes proches. Candice met à jour son profil et te propose une action le lendemain.
          </p>
        </Section>

        {/* Section 4 — Points */}
        <Section title="Le programme de points">
          <div style={{ background: "var(--br1)", border: "0.5px solid var(--brd)", borderRadius: 10, overflow: "hidden" }}>
            {POINTS_TABLE.map((row, i) => (
              <div
                key={row.label}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", borderBottom: i < POINTS_TABLE.length - 1 ? "0.5px solid var(--brd)" : "none" }}
              >
                <span style={{ fontFamily: DM, fontSize: 13, fontWeight: 300, color: "var(--con)" }}>{row.label}</span>
                <span style={{ fontFamily: DM, fontSize: 13, fontWeight: 500, color: "var(--terra)" }}>{row.pts}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: DM, fontSize: 11, fontWeight: 300, color: "var(--cond)", marginTop: 10, fontStyle: "italic" }}>
            100 pts = 1€ de réduction sur Candice Premium
          </p>
        </Section>

        {/* Section 5 — Weekly check-in */}
        <Section title="Le check-in hebdomadaire">
          <p style={{ fontFamily: DM, fontSize: 14, fontWeight: 300, color: "var(--cond)", lineHeight: 1.8 }}>
            Chaque lundi, Candice te demande des nouvelles de tes proches pour maintenir leurs profils à jour.
          </p>
        </Section>
      </div>
    </DashboardShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: PLAYFAIR, fontSize: 18, fontWeight: 400, color: "var(--con)", marginBottom: 14, letterSpacing: -0.3 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
