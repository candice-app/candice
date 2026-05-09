import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import { MyProfile } from "@/types";
import ShareButton from "./ShareButton";

const LABEL: Record<string, Record<string, string>> = {
  love_language: { words: "Mots d'affirmation", acts: "Actes de service", gifts: "Cadeaux", time: "Temps de qualité", touch: "Toucher physique" },
  communication_style: { direct: "Direct et concis", emotional: "Émotionnel et expressif", analytical: "Analytique et détaillé", casual: "Décontracté et humoristique" },
  social_energy: { very_introverted: "Très introverti(e)", introverted: "Introverti(e)", ambivert: "Ambiverti(e)", extroverted: "Extraverti(e)", very_extroverted: "Très extraverti(e)" },
  appreciation_style: { verbal: "Reconnaissance verbale", practical: "Aide pratique", gifts: "Cadeaux réfléchis", time: "Temps dédié", physical: "Gestes physiques" },
  core_values: { loyalty: "Loyauté et confiance", growth: "Croissance et apprentissage", fun: "Fun et expériences", stability: "Stabilité" },
  gift_preference: { experiences: "Expériences", physical: "Cadeaux matériels", both: "Les deux" },
  gastronomy: { anywhere: "Aime manger partout", gourmet: "Gourmand(e)", fine_dining: "Belles tables", passion: "Passionné(e) de gastronomie", functional: "Mange pour vivre" },
};

function chip(key: string, value: string | null) {
  if (!value) return null;
  return LABEL[key]?.[value] ?? value;
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ paddingTop: 14, marginTop: 14, borderTop: "0.5px solid var(--brd)" }}>
      <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)", marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--con)" }}>{value}</p>
    </div>
  );
}

export default async function MoiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("my_profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = existing as MyProfile | null;
  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "toi";

  return (
    <DashboardShell>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        <div>
          <p className="section-label">Mon profil</p>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Ma fiche.</h1>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>
            {profile
              ? "Ta fiche que tes proches peuvent consulter pour mieux te faire plaisir."
              : "Crée ta fiche pour que tes proches sachent comment te faire plaisir."}
          </p>
        </div>
        {profile && <ShareButton userId={user.id} />}
      </div>

      {!profile ? (
        <div style={{ textAlign: "center", padding: "56px 24px", border: "0.5px dashed var(--br3)", borderRadius: "var(--r-lg)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 400, color: "var(--con)", marginBottom: 8 }}>
            Tu n&apos;as pas encore de fiche.
          </h2>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", marginBottom: 24, maxWidth: 280, margin: "0 auto 24px" }}>
            Réponds à quelques questions sur toi — tes proches pourront la consulter pour mieux prendre soin de toi.
          </p>
          <Link href="/moi/questionnaire">
            <button className="btn-primary">Remplir ma fiche →</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Profil */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)" }}>Profil de {firstName}</p>
              <Link href="/moi/questionnaire" style={{ fontSize: 11, fontWeight: 400, color: "var(--terra)", textDecoration: "none" }}>
                Modifier
              </Link>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {[
                chip("love_language", profile.love_language),
                chip("social_energy", profile.social_energy),
                chip("communication_style", profile.communication_style),
                chip("appreciation_style", profile.appreciation_style),
                chip("core_values", profile.core_values),
                chip("gastronomy", profile.gastronomy),
                chip("gift_preference", profile.gift_preference),
              ].filter(Boolean).map((label) => (
                <span
                  key={label}
                  style={{
                    fontSize: 11, fontWeight: 300, color: "var(--cond)",
                    background: "var(--br3)", border: "0.5px solid var(--brd)",
                    padding: "4px 10px", borderRadius: 20,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>

            {profile.hobbies && <ProfileRow label="Loisirs" value={profile.hobbies} />}
            {profile.things_to_avoid && <ProfileRow label="À éviter" value={profile.things_to_avoid} />}
            {profile.important_dates && <ProfileRow label="Dates importantes" value={profile.important_dates} />}
          </div>

          {/* Share CTA */}
          <div style={{ background: "#F2EBE0", border: "1px solid #E8C4A0", borderRadius: "var(--r-md)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 4 }}>Partage ta fiche.</p>
              <p style={{ fontSize: 12, fontWeight: 300, color: "var(--conf)", lineHeight: 1.5 }}>
                Envoie le lien à tes proches pour qu&apos;ils sachent exactement comment te faire plaisir.
              </p>
            </div>
            <ShareButton userId={user.id} variant="full" />
            <Link href="/dashboard/sharing" style={{ fontSize: 11, fontWeight: 300, color: "var(--conb)", textDecoration: "none" }}>
              Gérer les accès →
            </Link>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
