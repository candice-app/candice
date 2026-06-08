import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import CompteActions from "./CompteActions";

type PracticalInfo = {
  prenom?: string;
  sexe?: string;
  profession?: string;
};

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("my_profile")
    .select("phone, practical_info, date_de_naissance")
    .eq("user_id", user.id)
    .maybeSingle();

  const phone = (profile?.phone as string | null) ?? null;
  const pi = (profile?.practical_info as PracticalInfo | null) ?? null;
  const dateDeNaissance = (profile?.date_de_naissance as string | null) ?? null;

  return (
    <DashboardShell>
      <div className="content-col" style={{ paddingTop: 32, paddingBottom: 40 }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/parametres" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300 }}>← Paramètres</span>
          </Link>
          <h1 style={{
            fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 28,
            color: "var(--ink)", letterSpacing: "-.018em", lineHeight: 1.2,
            marginTop: 16, marginBottom: 4,
          } as React.CSSProperties}>
            Mon compte
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* Prénom — lecture seule */}
          {pi?.prenom && (
            <div style={{ borderBottom: "0.5px solid var(--line)", padding: "16px 0" }}>
              <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 4 }}>
                Prénom
              </p>
              <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)" }}>
                {pi.prenom}
              </p>
            </div>
          )}

          {/* Email — lecture seule */}
          <div style={{ borderBottom: "0.5px solid var(--line)", padding: "16px 0" }}>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 4 }}>
              Adresse e-mail
            </p>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)" }}>
              {user.email}
            </p>
          </div>

          {/* Téléphone — lecture seule */}
          {phone && (
            <div style={{ borderBottom: "0.5px solid var(--line)", padding: "16px 0" }}>
              <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 4 }}>
                Téléphone
              </p>
              <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)" }}>
                {phone}
              </p>
            </div>
          )}

          <CompteActions
            initialSexe={pi?.sexe ?? ""}
            initialProfession={pi?.profession ?? ""}
            initialDateDeNaissance={dateDeNaissance ?? ""}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
