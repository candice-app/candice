import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import Thread, { ThreadItem } from "@/components/presence/Thread";
import PointDivider from "@/components/presence/PointDivider";
import { MyProfile, CadenceLevel } from "@/types";
import ShareButton from "./ShareButton";
import CadenceGlobal from "@/components/dashboard/CadenceGlobal";
import ResumePrompt from "@/components/questionnaire/ResumePrompt";

// ─── Label maps ───────────────────────────────────────────────────────────────

const LABEL: Record<string, Record<string, string>> = {
  love_language: {
    words: "Mots d'affirmation",
    acts: "Actes de service",
    gifts: "Cadeaux",
    time: "Temps de qualité",
  },
  communication_style: {
    direct: "Direct et concis",
    emotional: "Émotionnel et expressif",
    analytical: "Analytique et détaillé",
    casual: "Décontracté et humoristique",
  },
  social_energy: {
    very_introverted: "Très introverti(e)",
    introverted: "Introverti(e)",
    ambivert: "Ambiverti(e)",
    extroverted: "Extraverti(e)",
    very_extroverted: "Très extraverti(e)",
  },
  appreciation_style: {
    verbal: "Reconnaissance verbale",
    practical: "Aide pratique",
    gifts: "Cadeaux réfléchis",
    time: "Temps dédié",
    physical: "Gestes physiques",
  },
  core_values: {
    loyalty: "Loyauté et confiance",
    growth: "Croissance et apprentissage",
    fun: "Fun et expériences",
    stability: "Stabilité",
  },
  gift_preference: {
    experiences: "Expériences",
    physical: "Cadeaux matériels",
    both: "Les deux",
  },
  gastronomy: {
    anywhere: "Aime manger partout",
    gourmet: "Gourmand(e)",
    fine_dining: "Belles tables",
    passion: "Passionné(e) de gastronomie",
    functional: "Mange pour vivre",
  },
  stress_response: {
    alone: "Besoin de solitude",
    talk: "Aime en parler",
    active: "Se dépense physiquement",
    distract: "Se distrait",
  },
  conflict_resolution: {
    direct: "Frontalement et directement",
    time: "Après réflexion",
    mediator: "Avec un médiateur",
    avoid: "Évite les conflits",
  },
  decision_making: {
    intuition: "À l'intuition",
    data: "Sur données et analyse",
    consensus: "En cherchant le consensus",
    spontaneous: "De façon spontanée",
  },
  growth_mindset: {
    challenges: "Cherche les défis",
    learning: "Apprend continuellement",
    comfort: "Préfère la stabilité",
    balanced: "Équilibré(e)",
  },
  recognition_preference: {
    public: "Reconnaissance publique",
    private: "Discret(e)",
    achievements: "Par les résultats",
    none: "Sans besoin de reconnaissance",
  },
};

function resolve(field: string, value: string | null): string | null {
  if (!value) return null;
  const parts = value.split(",").filter(Boolean).map(v => LABEL[field]?.[v.trim()] ?? v.trim());
  return parts.length > 0 ? parts.join(", ") : null;
}

const CADENCE_LABELS_FR: Record<string, { label: string; detail: string }> = {
  discreet: { label: "Discret", detail: "1 attention par mois" },
  normal: { label: "Normal", detail: "1 attention toutes les 2 semaines" },
  sustained: { label: "Soutenu", detail: "1 attention par semaine" },
  intense: { label: "Intense", detail: "1 attention tous les 3 jours" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MoiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("my_profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = existing as (MyProfile & { attention_breath_text?: string | null }) | null;
  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "toi";

  const cadence = profile?.cadence_preference ?? "normal";
  const cadenceInfo = CADENCE_LABELS_FR[cadence] ?? CADENCE_LABELS_FR.normal;

  // Traits in human language
  const traits = [
    resolve("love_language", profile?.love_language ?? null),
    resolve("social_energy", profile?.social_energy ?? null),
    resolve("communication_style", profile?.communication_style ?? null),
    resolve("appreciation_style", profile?.appreciation_style ?? null),
    resolve("core_values", profile?.core_values ?? null),
    resolve("gastronomy", profile?.gastronomy ?? null),
    resolve("gift_preference", profile?.gift_preference ?? null),
  ].filter(Boolean) as string[];

  return (
    <DashboardShell>
      <div className="content-col" style={{ paddingTop: 28 }}>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 28,
          padding: "0 4px",
        }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 300,
              fontSize: 35,
              color: "var(--ink)",
              letterSpacing: "-.022em",
              lineHeight: 1,
            } as React.CSSProperties}>
              Ton profil
            </h1>
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.5 }}>
              {profile
                ? "Ce que tes proches peuvent consulter pour mieux prendre soin de toi."
                : "Crée ta fiche pour que tes proches sachent comment te faire plaisir."}
            </p>
          </div>
          {profile && (
            <Link href="/moi/questionnaire" style={{ fontSize: 13, color: "var(--pine)", fontWeight: 500, textDecoration: "none", flexShrink: 0 }}>
              Modifier
            </Link>
          )}
        </div>

        {!profile ? (

          /* ── Empty state ─────────────────────────────────────────────────── */
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", marginBottom: 24, lineHeight: 1.7 }}>
              Réponds à quelques questions — tes proches pourront consulter ta fiche pour mieux prendre soin de toi.
            </p>
            <ResumePrompt userId={user.id} />
          </div>

        ) : (

          /* ── Profile content ─────────────────────────────────────────────── */
          <>

            {/* Breath text (AI-generated narrative) */}
            {profile.attention_breath_text && (
              <div style={{
                padding: "20px 22px",
                borderRadius: 16,
                background: "radial-gradient(130% 100% at 26% 0%, #1E4337 0%, #0E2219 44%, #060E0A 100%)",
                marginBottom: 24,
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

            {/* Traits */}
            {traits.length > 0 && (
              <>
                <PointDivider label="Ce qui te définit" />
                <Thread>
                  {traits.map((trait, i) => (
                    <ThreadItem key={i} nodeType={i === 0 ? "anticipe" : "soft"}>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>
                        {trait}
                      </p>
                    </ThreadItem>
                  ))}
                </Thread>
              </>
            )}

            {/* Loisirs & goûts */}
            {(profile.hobbies || profile.favorite_foods || profile.conversation_topics) && (
              <>
                <PointDivider label="Tes goûts" />
                <Thread>
                  {profile.hobbies && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>Loisirs</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{profile.hobbies}</p>
                    </ThreadItem>
                  )}
                  {profile.favorite_foods && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>Cuisine</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{profile.favorite_foods}</p>
                    </ThreadItem>
                  )}
                  {profile.conversation_topics && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>Sujets de conversation</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{profile.conversation_topics}</p>
                    </ThreadItem>
                  )}
                </Thread>
              </>
            )}

            {/* À éviter */}
            {(profile.things_to_avoid || profile.disliked_activities || profile.disliked_foods) && (
              <>
                <PointDivider label="À savoir" />
                <Thread>
                  {profile.things_to_avoid && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>À éviter</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{profile.things_to_avoid}</p>
                    </ThreadItem>
                  )}
                  {profile.disliked_foods && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>Régime / allergies</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{profile.disliked_foods}</p>
                    </ThreadItem>
                  )}
                  {profile.few_know && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>Peu de gens savent que…</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{profile.few_know}</p>
                    </ThreadItem>
                  )}
                </Thread>
              </>
            )}

            {/* Partage */}
            <div style={{
              margin: "32px 0",
              padding: "22px 22px",
              borderRadius: 16,
              border: "1px solid var(--pine)",
              background: "var(--white)",
            }}>
              <p style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 300,
                fontSize: 19,
                color: "var(--ink)",
                letterSpacing: "-.012em",
                marginBottom: 8,
              } as React.CSSProperties}>
                Partage ta fiche.
              </p>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.6, marginBottom: 18 }}>
                Envoie le lien à tes proches — ils sauront exactement comment te faire plaisir.
              </p>
              <ShareButton userId={user.id} variant="full" />
            </div>

            {/* Cadence */}
            <PointDivider label="Rythme des attentions" />
            <div style={{ marginBottom: 8 }}>
              <CadenceGlobal initialCadence={cadence as CadenceLevel} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 32, lineHeight: 1.5 }}>
              Actuellement : <span style={{ color: "var(--pine)", fontWeight: 500 }}>{cadenceInfo.label}</span> — {cadenceInfo.detail}
            </p>

            {/* Liens secondaires */}
            <div style={{ borderTop: "0.5px solid var(--line)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 0 }}>
              <Link
                href="/parametres/notifications"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 300, color: "var(--ink-2)", textDecoration: "none", padding: "12px 0", borderBottom: "0.5px solid var(--line)" }}
              >
                <span>Préférences notifications</span>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>→</span>
              </Link>
              <Link
                href="/parametres/abonnement"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 300, color: "var(--ink-2)", textDecoration: "none", padding: "12px 0" }}
              >
                <span>Abonnement</span>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>→</span>
              </Link>
            </div>

          </>
        )}
      </div>
    </DashboardShell>
  );
}
