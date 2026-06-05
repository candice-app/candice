import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import Link from "next/link";
import LogoutButton from "@/app/moi/LogoutButton";

const MENU_ITEMS = [
  {
    href: "/parametres/compte",
    icon: "👤",
    label: "Mon compte",
    description: "Adresse e-mail, mot de passe",
  },
  {
    href: "/parametres/notifications",
    icon: "🔔",
    label: "Notifications",
    description: "Fréquence et canal de contact",
  },
  {
    href: "/parametres/confidentialite",
    icon: "🔒",
    label: "Confidentialité",
    description: "Données, suppression, export",
  },
  {
    href: "/parametres/profils-partages",
    icon: "🔗",
    label: "Profils partagés",
    description: "Liens envoyés et réponses reçues",
  },
  {
    href: "/parametres/abonnement",
    icon: "💳",
    label: "Abonnement",
    description: "Plan, facturation, résiliation",
  },
];

export default async function ParametresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell>
      <div className="content-col" style={{ paddingTop: 32, paddingBottom: 40 }}>
        <div style={{ marginBottom: 32 }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300 }}>← Accueil</span>
          </Link>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 300, fontSize: 28,
            color: "var(--ink)", letterSpacing: "-.018em",
            marginTop: 16, marginBottom: 4,
          }}>
            Paramètres
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {MENU_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "16px 0",
                borderBottom: "0.5px solid var(--line)",
                cursor: "pointer",
              }}>
                <span style={{ fontSize: 20, width: 28, textAlign: "center", flexShrink: 0 }}>
                  {item.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 400, color: "var(--ink)", marginBottom: 2 }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)" }}>
                    {item.description}
                  </p>
                </div>
                <span style={{ fontSize: 16, color: "var(--ink-3)" }}>›</span>
              </div>
            </Link>
          ))}

          <div style={{ paddingTop: 4 }}>
            <LogoutButton />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
