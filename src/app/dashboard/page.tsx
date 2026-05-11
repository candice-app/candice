import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import ContactCard from "@/components/dashboard/ContactCard";
import DashboardActions from "@/components/dashboard/DashboardActions";
import CandiceInput from "@/components/dashboard/CandiceInput";
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay";
import TourReplay from "@/components/onboarding/TourReplay";
import { Contact, QuestionnaireResponse, ProfileNote } from "@/types";

const SCORED_FIELDS = [
  "love_language", "communication_style", "stress_response", "social_energy",
  "appreciation_style", "conflict_resolution", "decision_making", "emotional_expression",
  "core_values", "recognition_preference", "boundaries", "growth_mindset",
  "hobbies", "favorite_foods", "gift_preference", "conversation_topics", "important_dates",
] as const;

function getCompletion(profile: QuestionnaireResponse | undefined): number {
  if (!profile) return 0;
  const filled = SCORED_FIELDS.filter(f => !!profile[f as keyof QuestionnaireResponse]).length;
  return Math.round((filled / SCORED_FIELDS.length) * 100);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: contacts }, { data: myProfile }, { count: archivedCount }, { data: recentNoteData }, { data: suggestionsData }] = await Promise.all([
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
      .from("profile_notes")
      .select("id, contact_id, user_id, note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("suggestions")
      .select("contact_id, generated_at")
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(5),
  ]);

  const typedContacts = (contacts ?? []) as (Contact & { questionnaire_responses: QuestionnaireResponse[] })[];
  const recentNote = recentNoteData as ProfileNote | null;
  const hasMyProfile = !!myProfile;
  const onboardingDone = !!(myProfile as { onboarding_completed?: boolean } | null)?.onboarding_completed;
  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "";

  // Contextual card logic
  const suggestionContactIds = new Set((suggestionsData ?? []).map(s => s.contact_id));
  const contactsWithSuggestions = typedContacts.filter(c => suggestionContactIds.has(c.id));
  const contactsSortedByCompletion = [...typedContacts].sort((a, b) => {
    return getCompletion(a.questionnaire_responses?.[0]) - getCompletion(b.questionnaire_responses?.[0]);
  });
  const mostIncomplete = contactsSortedByCompletion[0];

  type ContextualCardType = "no_contacts" | "suggestions_ready" | "incomplete_contact" | "watching";
  let contextualCardType: ContextualCardType = "watching";
  if (typedContacts.length === 0) {
    contextualCardType = "no_contacts";
  } else if (contactsWithSuggestions.length > 0) {
    contextualCardType = "suggestions_ready";
  } else if (mostIncomplete && getCompletion(mostIncomplete.questionnaire_responses?.[0]) < 60) {
    contextualCardType = "incomplete_contact";
  }

  return (
    <DashboardShell>
      {!onboardingDone && (
        <OnboardingOverlay userId={user.id} userName={firstName} />
      )}
      <TourReplay />

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

      {/* Contextual card */}
      {contextualCardType === "no_contacts" && (
        <div className="card" style={{ marginBottom: 20, borderColor: "var(--t3)" }}>
          <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 6 }}>
            Commencez par ajouter un proche.
          </p>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.65, marginBottom: 16 }}>
            Candice apprend à les connaître pour anticiper les bons gestes, au bon moment.
          </p>
          {!hasMyProfile && (
            <Link href="/moi/questionnaire" style={{ display: "inline-block", marginBottom: 10 }}>
              <button className="btn-ghost" style={{ fontSize: 12 }}>Remplir ma fiche d&apos;abord →</button>
            </Link>
          )}
          <Link href="/contacts/new">
            <button className="btn-primary">+ Ajouter un proche →</button>
          </Link>
        </div>
      )}

      {contextualCardType === "suggestions_ready" && (
        <div className="card" style={{ marginBottom: 20, borderColor: "var(--t3)" }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--terra)", marginBottom: 8 }}>
            Prêt
          </p>
          <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 6 }}>
            {contactsWithSuggestions.length === 1
              ? `Candice a des idées pour ${contactsWithSuggestions[0].name}.`
              : `Candice a des idées pour ${contactsWithSuggestions.length} de vos proches.`}
          </p>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.65, marginBottom: 16 }}>
            Des suggestions personnalisées vous attendent.
          </p>
          <Link href={`/contacts/${contactsWithSuggestions[0].id}`}>
            <button className="btn-primary">Voir les suggestions →</button>
          </Link>
        </div>
      )}

      {contextualCardType === "incomplete_contact" && mostIncomplete && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 6 }}>
            Complétez la fiche de {mostIncomplete.name}.
          </p>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.65, marginBottom: 16 }}>
            Plus Candice en sait, plus ses suggestions seront précises.
          </p>
          <Link href={`/contacts/${mostIncomplete.id}`}>
            <button className="btn-primary">Compléter la fiche →</button>
          </Link>
        </div>
      )}

      {contextualCardType === "watching" && (
        <div className="card" style={{ marginBottom: 20, opacity: 0.7 }}>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", fontStyle: "italic" }}>
            Candice surveille. Dès qu&apos;une attention s&apos;impose, elle vous le dit.
          </p>
        </div>
      )}

      {/* Candice input */}
      {typedContacts.length > 0 && (
        <CandiceInput contacts={typedContacts} recentNote={recentNote} />
      )}

      {/* Idea button */}
      <DashboardActions contacts={typedContacts} />

      {/* Contact list or empty state */}
      {typedContacts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", border: "0.5px dashed var(--br3)", borderRadius: "var(--r-lg)" }}>
          <p style={{ fontSize: 28, marginBottom: 14 }}>💌</p>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--con)", marginBottom: 6 }}>
            Personne pour l&apos;instant.
          </p>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.65, marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
            Ajoutez quelqu&apos;un qui vous est cher. Candice s&apos;occupe du reste.
          </p>
          <Link href="/contacts/new">
            <button className="btn-primary">Ajouter un proche →</button>
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
