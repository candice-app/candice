import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/utils/supabase/admin";
import { MyProfile } from "@/types";

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
  gastronomy: { anywhere: "Aime manger partout", gourmet: "Gourmand(e)", fine_dining: "Apprécie les belles tables", passion: "Passionné(e) de gastronomie", functional: "Mange pour vivre" },
  accommodation: { destination_only: "La destination prime", comfortable: "3-4 étoiles confortable", charming: "Boutique hôtel / lieu unique", luxury: "5 étoiles / palace", together: "L'important c'est d'être ensemble" },
  best_contact_method: { text: "SMS", call: "Appel téléphonique", email: "E-mail", in_person: "En personne" },
};

function Field({ label, value, fieldKey }: { label: string; value: string | null; fieldKey: string }) {
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

export default async function PartagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("my_profile")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  if (!data) notFound();

  const profile = data as MyProfile;

  return (
    <div style={{ minHeight: "100vh", background: "var(--br)" }}>
      {/* Minimal header */}
      <header style={{ padding: "16px 24px", borderBottom: "0.5px solid var(--brd)" }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 400, color: "var(--iv)", textDecoration: "none", letterSpacing: -0.5 }}>
          candice
        </Link>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 3, textTransform: "uppercase", color: "var(--terra)", marginBottom: 10 }}>
            Fiche personnelle
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 400, color: "var(--con)", marginBottom: 8 }}>
            Ce qui me fait plaisir.
          </h1>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.6 }}>
            Cette personne partage sa fiche avec toi pour que tu puisses mieux prendre soin d&apos;elle.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 12 }}>Profil</p>
            <Field label="Se sent aimé(e) par" value={profile.love_language} fieldKey="love_language" />
            <Field label="Communication" value={profile.communication_style} fieldKey="communication_style" />
            <Field label="Sous stress" value={profile.stress_response} fieldKey="stress_response" />
            <Field label="Énergie sociale" value={profile.social_energy} fieldKey="social_energy" />
            <Field label="Se sent apprécié(e) par" value={profile.appreciation_style} fieldKey="appreciation_style" />
            <Field label="Gestion des conflits" value={profile.conflict_resolution} fieldKey="conflict_resolution" />
            <Field label="Prise de décision" value={profile.decision_making} fieldKey="decision_making" />
            <Field label="Expression émotionnelle" value={profile.emotional_expression} fieldKey="emotional_expression" />
            <Field label="Valeurs fondamentales" value={profile.core_values} fieldKey="core_values" />
            <Field label="Reconnaissance" value={profile.recognition_preference} fieldKey="recognition_preference" />
            <Field label="Limites importantes" value={profile.boundaries} fieldKey="boundaries" />
            <Field label="Développement personnel" value={profile.growth_mindset} fieldKey="growth_mindset" />
          </div>

          <div className="card">
            <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 12 }}>Préférences</p>
            <Field label="Loisirs et passions" value={profile.hobbies} fieldKey="hobbies" />
            <Field label="Plats préférés" value={profile.favorite_foods} fieldKey="favorite_foods" />
            <Field label="Cadeaux" value={profile.gift_preference} fieldKey="gift_preference" />
            <Field label="Gastronomie" value={profile.gastronomy} fieldKey="gastronomy" />
            <Field label="Hébergement" value={profile.accommodation} fieldKey="accommodation" />
            <Field label="Adore parler de" value={profile.conversation_topics} fieldKey="conversation_topics" />
            <Field label="À éviter" value={profile.things_to_avoid} fieldKey="things_to_avoid" />
            <Field label="Meilleur contact via" value={profile.best_contact_method} fieldKey="best_contact_method" />
            <Field label="Dates importantes" value={profile.important_dates} fieldKey="important_dates" />
            <Field label="Notes" value={profile.additional_notes} fieldKey="additional_notes" />
          </div>

          {/* Viral CTA */}
          <div style={{ background: "var(--br2)", border: "0.5px solid var(--brd2)", borderRadius: "var(--r-md)", padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 400, color: "var(--iv)", marginBottom: 8 }}>
              Toi aussi, partage ta fiche.
            </p>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--conf)", lineHeight: 1.6, marginBottom: 20 }}>
              Crée ton compte Candice et permets à tes proches de mieux prendre soin de toi.
            </p>
            <Link href="/register">
              <button className="btn-primary">Créer mon compte gratuit →</button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
