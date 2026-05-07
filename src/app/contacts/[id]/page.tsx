import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import SuggestionsPanel from "./SuggestionsPanel";
import AnalysisPanel from "./AnalysisPanel";
import { Contact, QuestionnaireResponse } from "@/types";
import ContactActions from "./ContactActions";

const LABEL: Record<string, Record<string, string>> = {
  love_language: { words: "Mots d'affirmation", acts: "Actes de service", gifts: "Cadeaux", time: "Temps de qualité", touch: "Toucher physique" },
  communication_style: { direct: "Direct et concis", emotional: "Émotionnel et expressif", analytical: "Analytique et détaillé", casual: "Décontracté et humoristique" },
  stress_response: { withdraws: "Se retire et a besoin d'espace", seeks_support: "Cherche du soutien", action_oriented: "Devient dans l'action", internalizes: "Intériorise ses émotions" },
  social_energy: { very_introverted: "Très introverti(e)", introverted: "Introverti(e)", ambivert: "Ambiverti(e)", extroverted: "Extraverti(e)", very_extroverted: "Très extraverti(e)" },
  appreciation_style: { verbal: "Reconnaissance verbale", practical: "Aide pratique", gifts: "Cadeaux réfléchis", time: "Temps dédié", physical: "Gestes physiques" },
  conflict_resolution: { direct: "Affronte directement", processes_first: "A besoin de temps", avoids: "Évite les conflits", humor: "Utilise l'humour" },
  decision_making: { logic: "Logique et données", intuition: "Instinct", consensus: "Avis des autres", research: "Recherche approfondie" },
  emotional_expression: { openly: "Très ouvertement", selectively: "Sélectivement", through_actions: "Par les actes", rarely: "Rarement / en privé" },
  core_values: { loyalty: "Loyauté et confiance", growth: "Croissance et apprentissage", fun: "Fun et expériences", stability: "Stabilité" },
  recognition_preference: { public: "Reconnaissance publique", private: "Reconnaissance privée", personal: "Satisfaction personnelle", celebrate: "Célébrer ensemble" },
  boundaries: { space: "Espace personnel", emotional: "Limites émotionnelles", time: "Temps et planning", privacy: "Vie privée" },
  growth_mindset: { experiences: "Nouvelles expériences", structured: "Apprentissage structuré", reflective: "Réflexion intérieure", community: "Apprentissage par les autres" },
  gift_preference: { experiences: "Expériences", physical: "Cadeaux matériels", both: "Les deux également" },
  best_contact_method: { text: "SMS", call: "Appel téléphonique", email: "E-mail", in_person: "En personne" },
};

const PSYCH_FIELDS: { key: keyof QuestionnaireResponse; label: string }[] = [
  { key: "love_language", label: "Langage d'amour" },
  { key: "communication_style", label: "Communication" },
  { key: "stress_response", label: "Sous stress" },
  { key: "social_energy", label: "Énergie sociale" },
  { key: "appreciation_style", label: "Se sent apprécié(e) par" },
  { key: "conflict_resolution", label: "Gestion des conflits" },
  { key: "decision_making", label: "Prise de décision" },
  { key: "emotional_expression", label: "Expression émotionnelle" },
  { key: "core_values", label: "Valeurs fondamentales" },
  { key: "recognition_preference", label: "Reconnaissance" },
  { key: "boundaries", label: "Limites importantes" },
  { key: "growth_mindset", label: "Développement personnel" },
];

const PREF_FIELDS: { key: keyof QuestionnaireResponse; label: string }[] = [
  { key: "hobbies", label: "Loisirs et intérêts" },
  { key: "favorite_foods", label: "Plats préférés" },
  { key: "gift_preference", label: "Préférence cadeaux" },
  { key: "conversation_topics", label: "Adore parler de" },
  { key: "things_to_avoid", label: "À éviter" },
  { key: "best_contact_method", label: "Meilleur contact via" },
  { key: "important_dates", label: "Dates importantes" },
  { key: "additional_notes", label: "Notes" },
];

const RELATIONSHIP_LABEL: Record<string, string> = {
  partner: "partenaire", friend: "ami(e)", family: "famille", colleague: "collègue", other: "autre",
};

const AVATAR_COLORS = [
  "linear-gradient(135deg,#C47A4A,#8A4020)",
  "linear-gradient(135deg,#4A7C59,#2A5C39)",
  "linear-gradient(135deg,#534AB7,#3C3489)",
  "linear-gradient(135deg,#9A3556,#72243E)",
  "linear-gradient(135deg,#BA7517,#854F0B)",
];

function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function ProfileField({ label, value, fieldKey }: { label: string; value: string | null; fieldKey: string }) {
  if (!value) return null;
  return (
    <div style={{ padding: "10px 0", borderBottom: "0.5px solid var(--brd)" }}>
      <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)", marginBottom: 3 }}>
        {label}
      </p>
      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--con)" }}>
        {LABEL[fieldKey]?.[value] ?? value}
      </p>
    </div>
  );
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "suggestions" } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: contact }, { data: cachedSuggestions }, { data: myProfile }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*, questionnaire_responses(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("suggestions")
      .select("content, generated_at")
      .eq("contact_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("my_profile")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!contact) notFound();

  const typedContact = contact as Contact & { questionnaire_responses: QuestionnaireResponse[] };
  const profile = typedContact.questionnaire_responses?.[0];
  const userHasProfile = !!myProfile;

  const tabBase = `/contacts/${id}`;

  return (
    <DashboardShell>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div
          style={{
            width: 52, height: 52, borderRadius: "var(--r-sm)",
            background: getColor(typedContact.name),
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 500, color: "#fff", flexShrink: 0,
          }}
        >
          {typedContact.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title" style={{ marginBottom: 2 }}>{typedContact.name}</h1>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>
            {RELATIONSHIP_LABEL[typedContact.relationship] ?? typedContact.relationship}
            {typedContact.email && <span style={{ marginLeft: 10 }}>· {typedContact.email}</span>}
          </p>
        </div>
        <ContactActions contactId={id} contactName={typedContact.name} />
      </div>

      {profile ? (
        <>
          {/* Tab nav */}
          <div style={{ display: "flex", borderBottom: "0.5px solid var(--brd)", marginBottom: 24 }}>
            {[
              { key: "suggestions", label: "Suggestions" },
              { key: "analyse", label: "Analyse" },
            ].map(({ key, label }) => {
              const active = tab === key;
              return (
                <Link
                  key={key}
                  href={key === "suggestions" ? tabBase : `${tabBase}?tab=${key}`}
                  style={{
                    padding: "8px 20px",
                    fontSize: 12,
                    fontWeight: 400,
                    color: active ? "var(--terra)" : "var(--cond)",
                    borderBottom: active ? "1.5px solid var(--terra)" : "1.5px solid transparent",
                    marginBottom: -1,
                    textDecoration: "none",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Tab content */}
          {tab === "suggestions" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card">
                <h2 style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 12 }}>
                  Profil psychologique
                </h2>
                {PSYCH_FIELDS.map(({ key, label }) => (
                  <ProfileField key={key} label={label} value={profile[key] as string | null} fieldKey={key} />
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="card">
                  <h2 style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 12 }}>
                    Préférences
                  </h2>
                  {PREF_FIELDS.map(({ key, label }) => (
                    <ProfileField key={key} label={label} value={profile[key] as string | null} fieldKey={key} />
                  ))}
                </div>

                <SuggestionsPanel
                  contactId={id}
                  contactName={typedContact.name}
                  initialSuggestions={cachedSuggestions?.content ?? null}
                  generatedAt={cachedSuggestions?.generated_at ?? null}
                />
              </div>
            </div>
          )}

          {tab === "analyse" && (
            <AnalysisPanel contactId={id} userHasProfile={userHasProfile} />
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "64px 24px", border: "0.5px dashed var(--br3)", borderRadius: "var(--r-lg)" }}>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--con)", marginBottom: 6 }}>
            Aucun profil pour l&apos;instant
          </p>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
            Complétez le questionnaire pour débloquer les insights et les suggestions IA.
          </p>
          <Link href="/contacts/new">
            <button className="btn-primary">Compléter le profil</button>
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
