import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import ContactCard from "@/components/dashboard/ContactCard";
import CagnotteWidget from "@/components/dashboard/CagnotteWidget";
import DashboardActions from "@/components/dashboard/DashboardActions";
import CandiceInput from "@/components/dashboard/CandiceInput";
import WeeklyCheckin from "@/components/dashboard/WeeklyCheckin";
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay";
import OnboardingProgressCard from "@/components/dashboard/OnboardingProgressCard";
import { Contact, QuestionnaireResponse, UserPoint, ProfileNote } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: contacts }, { data: myProfile }, { count: archivedCount }, { data: pointRows }, { data: recentNoteData }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*, questionnaire_responses(*)")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("my_profile")
      .select("id, onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("archived_at", "is", null),
    supabase
      .from("user_points")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profile_notes")
      .select("id, contact_id, user_id, note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const typedContacts = (contacts ?? []) as (Contact & { questionnaire_responses: QuestionnaireResponse[] })[];
  const userPoints = (pointRows ?? []) as UserPoint[];
  const recentNote = recentNoteData as ProfileNote | null;
  const hasMyProfile = !!myProfile;
  const onboardingDone = !!(myProfile as { onboarding_completed?: boolean } | null)?.onboarding_completed;
  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "";
  const isFirstVisit = typedContacts.length === 0;

  return (
    <DashboardShell>
      {!onboardingDone && (
        <OnboardingOverlay userId={user.id} userName={firstName} />
      )}
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <p className="section-label">Tableau de bord</p>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            {firstName ? `Bonjour, ${firstName}.` : "Bonjour."}
          </h1>
        </div>
        {typedContacts.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", paddingBottom: 2 }}>
            {typedContacts.length} {typedContacts.length === 1 ? "proche" : "proches"}
          </span>
        )}
      </div>

      {/* Progress card */}
      <OnboardingProgressCard />

      {/* Candice input */}
      {typedContacts.length > 0 && (
        <CandiceInput contacts={typedContacts} recentNote={recentNote} />
      )}

      {/* Weekly check-in */}
      <WeeklyCheckin contacts={typedContacts} />

      {/* Cagnotte widget */}
      <CagnotteWidget points={userPoints} />

      {/* First-visit self-profile prompt */}
      {isFirstVisit && !hasMyProfile && (
        <div
          className="card"
          style={{ marginBottom: 20, borderColor: "var(--t3)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 6 }}>
              Commence par ta propre fiche.
            </p>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.65 }}>
              Avant d&apos;ajouter tes proches, remplis d&apos;abord ta fiche — comme ça, ceux qui veulent te faire plaisir pourront la consulter.
            </p>
          </div>
          <Link href="/moi/questionnaire">
            <button className="btn-primary">Remplir ma fiche →</button>
          </Link>
        </div>
      )}

      {/* Idea button */}
      <DashboardActions contacts={typedContacts} />

      {/* Contact list or empty state */}
      {typedContacts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", border: "0.5px dashed var(--br3)", borderRadius: "var(--r-lg)" }}>
          <p style={{ fontSize: 28, marginBottom: 14 }}>💌</p>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--con)", marginBottom: 6 }}>
            Aucun proche pour l&apos;instant
          </p>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.65, marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
            Ajoutez quelqu&apos;un qui vous est cher et construisez son profil en quelques minutes.
          </p>
          <Link href="/contacts/new">
            <button className="btn-primary">Ajouter votre première personne</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {typedContacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}

      {/* Archived link */}
      {(archivedCount ?? 0) > 0 && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "0.5px solid var(--brd)" }}>
          <Link
            href="/dashboard/archives"
            style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <span>📦</span>
            {archivedCount} {archivedCount === 1 ? "contact archivé" : "contacts archivés"} →
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
