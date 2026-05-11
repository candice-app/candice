import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import DashboardShell from "@/components/layout/DashboardShell";
import SuggestionsPanel from "./SuggestionsPanel";
import { Contact, QuestionnaireResponse, ProfileNote, WishlistItem } from "@/types";
import ContactActions from "./ContactActions";
import ContactNotes from "@/components/dashboard/ContactNotes";
import ContactHeader from "./ContactHeader";
import WishlistSection from "./WishlistSection";
import MatchingCard from "./MatchingCard";

// ─── Label maps ──────────────────────────────────────────────────────────────

const LABEL: Record<string, Record<string, string>> = {
  love_language: { words: "Mots d'affirmation", acts: "Actes de service", gifts: "Cadeaux", time: "Temps de qualité", touch: "Toucher physique" },
  communication_style: { direct: "Direct et concis", emotional: "Émotionnel et expressif", analytical: "Analytique et détaillé", casual: "Décontracté et humoristique" },
  social_energy: { very_introverted: "Très introverti(e)", introverted: "Introverti(e)", ambivert: "Ambiverti(e)", extroverted: "Extraverti(e)", very_extroverted: "Très extraverti(e)" },
  core_values: { loyalty: "Loyauté et confiance", growth: "Croissance et apprentissage", fun: "Fun et expériences", stability: "Stabilité" },
  emotional_expression: { openly: "Très ouvertement", selectively: "Sélectivement", through_actions: "Par les actes", rarely: "Rarement / en privé" },
  appreciation_style: { verbal: "Reconnaissance verbale", practical: "Aide pratique", gifts: "Cadeaux réfléchis", time: "Temps dédié", physical: "Gestes physiques" },
  conflict_resolution: { direct: "Affronte directement", processes_first: "A besoin de temps", avoids: "Évite les conflits", humor: "Utilise l'humour" },
  decision_making: { logic: "Logique et données", intuition: "Instinct", consensus: "Avis des autres", research: "Recherche approfondie" },
  stress_response: { withdraws: "Se retire", seeks_support: "Cherche du soutien", action_oriented: "Dans l'action", internalizes: "Intériorise" },
  recognition_preference: { public: "Reconnaissance publique", private: "Reconnaissance privée", personal: "Satisfaction personnelle", celebrate: "Célébrer ensemble" },
  boundaries: { space: "Espace personnel", emotional: "Limites émotionnelles", time: "Temps et planning", privacy: "Vie privée" },
  growth_mindset: { experiences: "Nouvelles expériences", structured: "Apprentissage structuré", reflective: "Réflexion intérieure", community: "Apprentissage par les autres" },
  gift_preference: { experiences: "Expériences", physical: "Cadeaux matériels", both: "Les deux" },
  best_contact_method: { text: "SMS", call: "Appel", email: "E-mail", in_person: "En personne" },
};

function resolve(field: string, value: string | null): string {
  if (!value) return "";
  const parts = value.split(",").filter(Boolean);
  return parts.map(v => LABEL[field]?.[v] ?? v).join(", ");
}

// ─── Relational style derivation ─────────────────────────────────────────────

function deriveRelationalStyle(profile: QuestionnaireResponse): string {
  const expr = profile.emotional_expression;
  const comm = profile.communication_style;
  const vals = profile.core_values;

  if (expr?.includes("openly") && vals?.includes("loyalty")) return "Chaleureux(se) et engagé(e) — s'investit pleinement dans ses relations.";
  if (expr?.includes("rarely") && vals?.includes("stability")) return "Réservé(e) et fiable — montre son affection par les actes.";
  if (comm?.includes("direct") && vals?.includes("growth")) return "Direct(e) et orienté(e) évolution — apprécie la clarté et le progrès.";
  if (expr?.includes("through_actions")) return "Expressif(ve) par les gestes — préfère montrer que dire.";
  if (comm?.includes("emotional")) return "Émotionnel(le) et expressif(ve) — cherche la connexion profonde.";
  if (vals?.includes("fun")) return "Joueur(se) et spontané(e) — cultive la légèreté dans ses relations.";
  if (vals?.includes("loyalty")) return "Loyal(e) et constant(e) — présent(e) inconditionnellement.";
  return "Profil équilibré — s'adapte selon le contexte et les personnes.";
}

// ─── Completion score ─────────────────────────────────────────────────────────

const SCORED_FIELDS: (keyof QuestionnaireResponse)[] = [
  "love_language", "communication_style", "stress_response", "social_energy",
  "appreciation_style", "conflict_resolution", "decision_making", "emotional_expression",
  "core_values", "recognition_preference", "boundaries", "growth_mindset",
  "hobbies", "favorite_foods", "gift_preference", "conversation_topics", "important_dates",
];

function getCompletion(profile: QuestionnaireResponse | undefined): number {
  if (!profile) return 0;
  const filled = SCORED_FIELDS.filter(f => !!profile[f]).length;
  return Math.round((filled / SCORED_FIELDS.length) * 100);
}

// ─── Important dates parsing ──────────────────────────────────────────────────

interface ImportantDate { label: string; date: string; }

function parseImportantDates(raw: string | null): ImportantDate[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return (parsed as ImportantDate[]).filter(d => d.date);
  } catch { /* legacy text */ }
  return [];
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const year = now.getFullYear();
  const [month, day] = dateStr.includes("-") ? dateStr.split("-").slice(-2).map(Number) : [0, 0];
  if (!month || !day) return Infinity;
  let next = new Date(year, month - 1, day);
  if (next < now) next = new Date(year + 1, month - 1, day);
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: contact },
    { data: cachedSuggestions },
    { data: myProfile },
    { data: notesData },
  ] = await Promise.all([
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
    supabase
      .from("profile_notes")
      .select("id, contact_id, user_id, note, created_at")
      .eq("contact_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (!contact) notFound();

  const typedContact = contact as Contact & { questionnaire_responses: QuestionnaireResponse[] };
  const profile = typedContact.questionnaire_responses?.[0];
  const userHasProfile = !!myProfile;
  const contactNotes = (notesData ?? []) as ProfileNote[];
  const completionPct = getCompletion(profile);
  const importantDates = parseImportantDates(profile?.important_dates ?? null).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const wishlist = (typedContact.gift_wishlist ?? []) as WishlistItem[];

  // Generate a signed URL from the stored path (private bucket)
  let photoSignedUrl: string | null = null;
  if (typedContact.photo_url) {
    const admin = createAdminClient();
    const { data } = await admin.storage
      .from("contact-photos")
      .createSignedUrl(typedContact.photo_url, 3600);
    photoSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <DashboardShell>
      {/* Quick-add notes */}
      <ContactNotes
        contactId={id}
        contactName={typedContact.name}
        initialNotes={contactNotes}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 28 }}>
        <ContactHeader
          contactId={id}
          name={typedContact.name}
          relationship={typedContact.relationship}
          phone={typedContact.phone}
          email={typedContact.email}
          signedUrl={photoSignedUrl}
          completionPct={completionPct}
        />
        <div style={{ flexShrink: 0, marginTop: 4 }}>
          <ContactActions contactId={id} contactName={typedContact.name} />
        </div>
      </div>

      {profile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Row 1: Analyse Candice + Matching */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Analyse Candice */}
            <div className="card">
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--terra)", marginBottom: 10 }}>
                Analyse Candice
              </p>

              {profile.love_language && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cond)", marginBottom: 4 }}>
                    Langage d&apos;amour
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 400, color: "var(--con)" }}>
                    {resolve("love_language", profile.love_language)}
                  </p>
                </div>
              )}

              <div>
                <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cond)", marginBottom: 4 }}>
                  Style relationnel
                </p>
                <p style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)", lineHeight: 1.6 }}>
                  {deriveRelationalStyle(profile)}
                </p>
              </div>
            </div>

            {/* Matching */}
            <MatchingCard contactId={id} userHasProfile={userHasProfile} />
          </div>

          {/* Dates importantes */}
          {importantDates.length > 0 && (
            <div className="card">
              <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 14 }}>Dates importantes</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {importantDates.map((d, i) => {
                  const days = daysUntil(d.date);
                  const urgent = days <= 14;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)" }}>{d.label}</p>
                        <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)" }}>{d.date}</p>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 500,
                        color: urgent ? "#fff" : "var(--terra)",
                        background: urgent ? "var(--terra)" : "var(--t2)",
                        border: "0.5px solid var(--t3)",
                        padding: "3px 10px", borderRadius: 20,
                      }}>
                        {days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : days === Infinity ? "—" : `J−${days}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggestions actives */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--cond)", marginBottom: 10 }}>
              Suggestions actives
            </p>
            <SuggestionsPanel
              contactId={id}
              contactName={typedContact.name}
              initialSuggestions={cachedSuggestions?.content ?? null}
              generatedAt={cachedSuggestions?.generated_at ?? null}
            />
          </div>

          {/* Profil détaillé (collapsible summary) */}
          <details style={{ marginTop: 4 }}>
            <summary style={{
              fontSize: 12, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase",
              color: "var(--cond)", cursor: "pointer", marginBottom: 12, listStyle: "none",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>Profil psychologique complet</span>
              <span style={{ fontSize: 10 }}>▼</span>
            </summary>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["love_language", "Langage d'amour"],
                ["communication_style", "Communication"],
                ["stress_response", "Sous stress"],
                ["social_energy", "Énergie sociale"],
                ["appreciation_style", "Se sent apprécié(e) par"],
                ["conflict_resolution", "Gestion des conflits"],
                ["decision_making", "Prise de décision"],
                ["emotional_expression", "Expression émotionnelle"],
                ["core_values", "Valeurs fondamentales"],
                ["recognition_preference", "Reconnaissance"],
                ["boundaries", "Limites importantes"],
                ["growth_mindset", "Développement personnel"],
              ].map(([key, label]) => {
                const val = resolve(key, profile[key as keyof QuestionnaireResponse] as string | null);
                if (!val) return null;
                return (
                  <div key={key} style={{ padding: "8px 0", borderBottom: "0.5px solid var(--brd)" }}>
                    <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)", marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 12, fontWeight: 300, color: "var(--con)" }}>{val}</p>
                  </div>
                );
              })}
            </div>
            {profile.hobbies && (
              <div style={{ marginTop: 12, padding: "8px 0", borderBottom: "0.5px solid var(--brd)" }}>
                <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)", marginBottom: 2 }}>Loisirs</p>
                <p style={{ fontSize: 12, fontWeight: 300, color: "var(--con)" }}>{profile.hobbies}</p>
              </div>
            )}
            {profile.things_to_avoid && (
              <div style={{ marginTop: 12, padding: "8px 0" }}>
                <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)", marginBottom: 2 }}>À éviter</p>
                <p style={{ fontSize: 12, fontWeight: 300, color: "var(--con)" }}>{profile.things_to_avoid}</p>
              </div>
            )}
          </details>

          {/* Attentions passées */}
          <div className="card" style={{ opacity: 0.6 }}>
            <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 8 }}>Attentions passées</p>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", fontStyle: "italic" }}>
              Bientôt disponible — l&apos;historique de vos gestes apparaîtra ici.
            </p>
          </div>

          {/* Liste de souhaits */}
          <WishlistSection contactId={id} initialWishlist={wishlist} />

        </div>
      ) : (
        /* No profile state */
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

          {/* Wishlist even without profile */}
          <div style={{ marginTop: 32, textAlign: "left" }}>
            <WishlistSection contactId={id} initialWishlist={wishlist} />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
