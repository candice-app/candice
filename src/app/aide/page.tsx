import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";

const TERRA = "#C47A4A";
const CON = "#1E1208";
const COND = "#7A5E44";
const BORDER = "rgba(30,18,8,0.08)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

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

        {/* Section 4 — How Candice learns */}
        <Section title="Comment Candice apprend vos proches">
          <p style={{ fontFamily: DM, fontSize: 14, fontWeight: 300, color: "var(--cond)", lineHeight: 1.8, marginBottom: 12 }}>
            Chaque réponse au questionnaire affine la compréhension de Candice. Elle ne stocke pas des données — elle construit une lecture de la personne&nbsp;: ses langages d&apos;amour, ses frontières, ses goûts profonds.
          </p>
          <p style={{ fontFamily: DM, fontSize: 14, fontWeight: 300, color: "var(--cond)", lineHeight: 1.8 }}>
            Plus la fiche est honnête, plus les attentions proposées sont justes. Candice ne devine pas — elle écoute.
          </p>
        </Section>

        {/* Section 5 — Privacy */}
        <Section title="Vos données restent privées">
          <p style={{ fontFamily: DM, fontSize: 14, fontWeight: 300, color: "var(--cond)", lineHeight: 1.8, marginBottom: 12 }}>
            Les réponses de vos proches ne vous sont jamais transmises mot pour mot. Candice les analyse en silence et ne partage que des suggestions d&apos;intention — jamais le texte brut.
          </p>
          <p style={{ fontFamily: DM, fontSize: 14, fontWeight: 300, color: "var(--cond)", lineHeight: 1.8 }}>
            Vos proches peuvent remplir leur fiche en toute confiance&nbsp;: ce qu&apos;ils partagent ne circule pas.
          </p>
        </Section>

        {/* Section 6 — Weekly check-in */}
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
