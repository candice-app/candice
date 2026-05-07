import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import QuestionnaireForm from "@/components/questionnaire/QuestionnaireForm";

export default async function NewContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
