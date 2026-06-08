import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import CompteActions from "./CompteActions";

type PracticalInfo = {
  prenom?: string;
  sexe?: string;
  age?: string;
  profession?: string;
  role_familial?: string | string[];
};

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("my_profile")
    .select("phone, practical_info")
    .eq("user_id", user.id)
    .maybeSingle();

  const phone = (profile?.phone as string | null) ?? null;
  const pi = (profile?.practical_info as PracticalInfo | null) ?? null;
  const rawRF = pi?.role_familial;
  const initialRoleFamilial: string[] = Array.isArray(rawRF)
    ? rawRF
    : rawRF ? [rawRF] : [];

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

          {/* Prénom — lecture seule, si renseigné */}
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

          {/* Téléphone — lecture seule, si renseigné */}
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
            initialAge={pi?.age ?? ""}
            initialProfession={pi?.profession ?? ""}
            initialRoleFamilial={initialRoleFamilial}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
