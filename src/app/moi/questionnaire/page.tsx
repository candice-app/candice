import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import SelfProfileForm from "@/components/questionnaire/SelfProfileForm";
import { MyProfile } from "@/types";

export default async function MoiQuestionnairePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("my_profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = existing as MyProfile | null;

  return (
    <DashboardShell>
      <div style={{ marginBottom: 28 }}>
        <p className="section-label">Mon profil</p>
        <h1 className="page-title" style={{ marginBottom: 4 }}>
          {profile ? "Modifier ma fiche." : "Remplir ma fiche."}
        </h1>
        <p style={{ fontSize: 20, fontWeight: 400, fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", color: "var(--con)", lineHeight: 1.3 }}>
          {profile
            ? "Tes réponses actuelles sont pré-remplies."
            : "Dis-nous qui tu es."}
        </p>
      </div>
      <SelfProfileForm userId={user.id} initial={profile} />
    </DashboardShell>
  );
}
