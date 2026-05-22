import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/utils/supabase/admin";
import { MyProfile } from "@/types";

// ─── Label maps ───────────────────────────────────────────────────────────────

const LABEL: Record<string, Record<string, string>> = {
  love_language: { words: "Mots d'affirmation", acts: "Actes de service", gifts: "Cadeaux", time: "Temps de qualité" },
  communication_style: { direct: "Direct et concis", emotional: "Émotionnel et expressif", analytical: "Analytique et détaillé", casual: "Décontracté et humoristique" },
  stress_response: { withdraws: "Besoin de solitude", seeks_support: "Cherche du soutien", action_oriented: "Passe à l'action", internalizes: "Intériorise ses émotions" },
  social_energy: { very_introverted: "Très introverti(e)", introverted: "Introverti(e)", ambivert: "Ambiverti(e)", extroverted: "Extraverti(e)", very_extroverted: "Très extraverti(e)" },
  appreciation_style: { verbal: "Reconnaissance verbale", practical: "Aide pratique", gifts: "Cadeaux réfléchis", time: "Temps dédié", physical: "Gestes physiques" },
  conflict_resolution: { direct: "Affronte directement", processes_first: "A besoin de temps", avoids: "Évite les conflits", humor: "Par l'humour" },
  decision_making: { logic: "Logique et données", intuition: "Instinct", consensus: "Cherche le consensus", research: "Recherche approfondie" },
  emotional_expression: { openly: "Très ouvertement", selectively: "Sélectivement", through_actions: "Par les actes", rarely: "Rarement / en privé" },
  core_values: { loyalty: "Loyauté et confiance", growth: "Croissance et apprentissage", fun: "Fun et expériences", stability: "Stabilité" },
  recognition_preference: { public: "Reconnaissance publique", private: "Reconnaissance discrète", personal: "Satisfaction personnelle", celebrate: "Célébrer ensemble" },
  boundaries: { space: "Espace personnel", emotional: "Limites émotionnelles", time: "Temps et planning", privacy: "Vie privée" },
  growth_mindset: { experiences: "Nouvelles expériences", structured: "Apprentissage structuré", reflective: "Réflexion intérieure", community: "Apprendre des autres" },
  gift_preference: { experiences: "Expériences", physical: "Cadeaux matériels", both: "Les deux" },
  gastronomy: { anywhere: "Aime manger partout", gourmet: "Gourmand(e)", fine_dining: "Belles tables", passion: "Passionné(e) de gastronomie", functional: "Mange pour vivre" },
  accommodation: { destination_only: "La destination prime", comfortable: "3-4 étoiles", charming: "Boutique hôtel / lieu unique", luxury: "5 étoiles / palace", together: "L'important c'est d'être ensemble" },
  best_contact_method: { text: "SMS", call: "Appel téléphonique", email: "E-mail", in_person: "En personne" },
};

function resolve(field: string, value: string | null): string | null {
  if (!value) return null;
  const parts = value.split(",").filter(Boolean).map(v => LABEL[field]?.[v.trim()] ?? v.trim());
  return parts.length > 0 ? parts.join(", ") : null;
}

// ─── Components ───────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
      }}>
        <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          {label}
        </span>
        <div style={{ flex: 1, height: ".5px", background: "var(--line)" }} />
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div style={{ padding: "10px 0", borderBottom: "0.5px solid var(--line)" }}>
      <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.55 }}>
        {value}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PartagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("my_profile")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  if (!data) notFound();

  const profile = data as MyProfile & { attention_breath_text?: string | null };

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>

      {/* Header */}
      <header style={{
        padding: "18px 24px",
        borderBottom: "0.5px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{
            fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: 18,
            letterSpacing: ".34em", textTransform: "uppercase", color: "var(--ink)",
            paddingLeft: ".34em",
          }}>
            CANDICE
          </span>
        </Link>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Intro */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--pine)", marginBottom: 12 }}>
            Fiche personnelle
          </p>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 300,
            fontSize: "clamp(26px, 5vw, 34px)",
            color: "var(--ink)",
            letterSpacing: "-.022em",
            lineHeight: 1.15,
            marginBottom: 12,
          } as React.CSSProperties}>
            Ce qui me fait plaisir.
          </h1>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65 }}>
            Cette personne partage sa fiche avec toi pour que tu puisses mieux prendre soin d&apos;elle.
          </p>
        </div>

        {/* Breath text */}
        {profile.attention_breath_text && (
          <div style={{
            padding: "20px 22px",
            borderRadius: 16,
            background: "radial-gradient(130% 100% at 26% 0%, #1E4337 0%, #0E2219 44%, #060E0A 100%)",
            marginBottom: 40,
          }}>
            <p style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 300,
              fontSize: 17,
              color: "#FAF8F1",
              lineHeight: 1.65,
              letterSpacing: "-.012em",
            } as React.CSSProperties}>
              {profile.attention_breath_text}
            </p>
          </div>
        )}

        {/* Profil relationnel */}
        <Section label="Profil">
          <Row label="Se sent aimé(e) par" value={resolve("love_language", profile.love_language)} />
          <Row label="Énergie sociale" value={resolve("social_energy", profile.social_energy)} />
          <Row label="Style de communication" value={resolve("communication_style", profile.communication_style)} />
          <Row label="Se sent apprécié(e) par" value={resolve("appreciation_style", profile.appreciation_style)} />
          <Row label="Valeurs essentielles" value={resolve("core_values", profile.core_values)} />
          <Row label="Expression émotionnelle" value={resolve("emotional_expression", profile.emotional_expression)} />
          <Row label="En cas de stress" value={resolve("stress_response", profile.stress_response)} />
          <Row label="Face aux conflits" value={resolve("conflict_resolution", profile.conflict_resolution)} />
          <Row label="Prises de décision" value={resolve("decision_making", profile.decision_making)} />
          <Row label="Reconnaissance" value={resolve("recognition_preference", profile.recognition_preference)} />
          <Row label="Limites importantes" value={resolve("boundaries", profile.boundaries)} />
          <Row label="Croissance personnelle" value={resolve("growth_mindset", profile.growth_mindset)} />
        </Section>

        {/* Goûts & préférences */}
        <Section label="Goûts &amp; préférences">
          <Row label="Loisirs et passions" value={profile.hobbies} />
          <Row label="Plats préférés" value={profile.favorite_foods} />
          <Row label="Cadeaux" value={resolve("gift_preference", profile.gift_preference)} />
          <Row label="Gastronomie" value={resolve("gastronomy", profile.gastronomy)} />
          <Row label="Hébergement" value={resolve("accommodation", profile.accommodation)} />
          <Row label="Adore parler de" value={profile.conversation_topics} />
        </Section>

        {/* À savoir */}
        {(profile.things_to_avoid || profile.important_dates || profile.few_know || profile.additional_notes) && (
          <Section label="À savoir">
            <Row label="À éviter" value={profile.things_to_avoid} />
            <Row label="Dates importantes" value={profile.important_dates} />
            <Row label="Peu de gens savent que…" value={profile.few_know} />
            <Row label="Notes" value={profile.additional_notes} />
          </Section>
        )}

        {/* Contact */}
        {profile.best_contact_method && (
          <Section label="Contact">
            <Row label="Meilleur moyen de contact" value={resolve("best_contact_method", profile.best_contact_method)} />
          </Section>
        )}

        {/* Viral CTA */}
        <div style={{
          padding: "28px 24px",
          borderRadius: 16,
          border: "0.5px solid var(--champ-line)",
          background: "var(--champ-soft)",
          textAlign: "center",
          marginTop: 48,
        }}>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 300,
            fontSize: 20,
            color: "var(--ink)",
            letterSpacing: "-.012em",
            marginBottom: 8,
          } as React.CSSProperties}>
            Toi aussi, partage ta fiche.
          </p>
          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65, marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
            Crée ton compte Candice — tes proches sauront exactement comment prendre soin de toi.
          </p>
          <Link href="/register">
            <button className="btn-primary">Créer mon compte gratuit →</button>
          </Link>
        </div>

      </main>
    </div>
  );
}
