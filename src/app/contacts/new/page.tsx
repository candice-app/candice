import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import QuestionnaireForm from "@/components/questionnaire/QuestionnaireForm";

const FREE_PLAN_LIMIT = 2;

export default async function NewContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("archived_at", null);

  if ((count ?? 0) >= FREE_PLAN_LIMIT) {
    return (
      <DashboardShell>
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <p style={{ fontSize: 32, marginBottom: 20 }}>🔒</p>
          <h1 className="page-title" style={{ marginBottom: 12 }}>Limite du plan gratuit atteinte</h1>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--cond)", lineHeight: 1.7, maxWidth: 360, margin: "0 auto 32px" }}>
            Le plan gratuit est limité à {FREE_PLAN_LIMIT} proches. Passe en Premium pour ajouter des proches illimités.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/offre">
              <button className="btn-primary">Passer en Premium →</button>
            </Link>
            <Link href="/dashboard">
              <button className="btn-ghost">Retour au tableau de bord</button>
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div style={{ marginBottom: 28 }}>
        <p className="section-label">Nouveau contact</p>
        <h1 className="page-title">Ajouter quelqu&apos;un.</h1>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", marginTop: 4 }}>
          Répondez à quelques questions pour construire son profil — environ 3 minutes.
        </p>
      </div>
      <QuestionnaireForm />
    </DashboardShell>
  );
}
