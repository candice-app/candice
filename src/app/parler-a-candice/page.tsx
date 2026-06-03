import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function ParlerACandice() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell>
      <div style={{ padding: "48px 24px 32px", maxWidth: 480, margin: "0 auto" }}>
        <p style={{
          fontSize: 10, fontWeight: 500, letterSpacing: ".4em",
          textTransform: "uppercase", color: "var(--pine)",
          marginBottom: 16,
        }}>
          Candice
        </p>
        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 300, fontSize: 35,
          color: "var(--ink)", letterSpacing: "-.022em",
          lineHeight: 1.1, marginBottom: 16,
        } as React.CSSProperties}>
          Que voulez-vous faire ?
        </h1>
        <p style={{
          fontSize: 14, fontWeight: 300, color: "var(--ink-3)",
          lineHeight: 1.7, marginBottom: 40,
        }}>
          Candice est disponible depuis chaque fiche contact et depuis votre profil.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link href="/contacts" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "18px 20px",
              border: "0.5px solid var(--line)",
              borderRadius: 12,
              background: "var(--white)",
              cursor: "pointer",
            }}>
              <p style={{ fontSize: 15, fontWeight: 400, color: "var(--ink)", marginBottom: 4 }}>
                Mes proches
              </p>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.5 }}>
                Accéder aux fiches et aux suggestions pour chacun.
              </p>
            </div>
          </Link>

          <Link href="/moi" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "18px 20px",
              border: "0.5px solid var(--line)",
              borderRadius: 12,
              background: "var(--white)",
              cursor: "pointer",
            }}>
              <p style={{ fontSize: 15, fontWeight: 400, color: "var(--ink)", marginBottom: 4 }}>
                Mon profil
              </p>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.5 }}>
                Compléter ou mettre à jour votre fiche personnelle.
              </p>
            </div>
          </Link>

          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "18px 20px",
              border: "0.5px solid var(--line)",
              borderRadius: 12,
              background: "var(--white)",
              cursor: "pointer",
            }}>
              <p style={{ fontSize: 15, fontWeight: 400, color: "var(--ink)", marginBottom: 4 }}>
                Accueil
              </p>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.5 }}>
                Retourner au tableau de bord.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
