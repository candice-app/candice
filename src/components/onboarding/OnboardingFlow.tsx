"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface Props {
  userId: string;
  userName: string;
  onComplete: () => void;
}

const BG = "#FAF7F2";
const WHITE = "#FFFFFF";
const TERRA = "#C47A4A";
const CON = "#2C1A0E";
const COND = "#7A5E44";
const BORDER = "rgba(44,26,14,0.1)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

const POINTS = [
  { label: "Compléter ton profil", pts: "+500 pts" },
  { label: "Ajouter un proche", pts: "+200 pts" },
  { label: "Fiche proche complétée", pts: "+500 pts" },
  { label: "Ajouter une date importante", pts: "+50 pts" },
  { label: "Laisser un feedback", pts: "+100 pts" },
  { label: "Marquer une attention réalisée", pts: "+100 pts" },
];

const SLIDES: { tag: string; icon: string; title: string; subtitle?: string; body: string; isLast?: true }[] = [
  {
    tag: "Bienvenue",
    icon: "🤝",
    title: "Bienvenue sur Candice.",
    subtitle: "Ton copilote relationnel.",
    body: "La vie va vite. Candice s'assure que tu n'oublies plus jamais ce qui compte pour les gens que tu aimes — leurs goûts, leurs moments importants, ce qui les fait vraiment sourire. Tu lui parles de tes proches. Elle apprend. Elle anticipe. Et quand le moment arrive, elle te dit quoi faire — ou le fait pour toi.",
  },
  {
    tag: "Ton profil d'abord",
    icon: "👤",
    title: "Commence par toi.",
    body: "Dis à Candice qui tu es — tes goûts, tes envies, ce qui te touche vraiment. C'est la base de tout. Et plus tard, tu pourras partager ton profil à tes proches — pour qu'eux aussi puissent te faire plaisir comme tu le mérites. Bonus : plus ta fiche est complète, plus Candice peut t'offrir une analyse de ton propre profil — tes langages de l'amour, ce qui te motive, ce dont tu as besoin.",
  },
  {
    tag: "Tes proches",
    icon: "💌",
    title: "Maintenant, parle-lui d'eux.",
    body: "Envoie un lien à chaque proche — ils remplissent leur fiche en quelques minutes. Plus leur fiche est complète, plus Candice est précise dans ses suggestions. Un simple lien WhatsApp suffit.",
  },
  {
    tag: "Le matching",
    icon: "🔍",
    title: "Candice analyse tout.",
    body: "Elle croise ton profil et celui de tes proches — langages de l'amour, préférences, frictions. Elle sait exactement comment tu peux leur faire plaisir. Et elle t'en dit plus dans l'analyse de chaque profil.",
  },
  {
    tag: "Reste connecté",
    icon: "🎤",
    title: "Parle-lui au quotidien.",
    body: "Tu sors d'un dîner et tu as appris quelque chose sur Julie ? Dis-le à Candice avec ta voix 🎤 ou en quelques mots. Elle retient, elle met à jour, elle agit. Plus tu lui confies, plus elle est juste.",
  },
  {
    tag: "Les points",
    icon: "✦",
    title: "Chaque geste compte.",
    body: "Gagne des points à chaque action — et échange-les contre des réductions sur Candice Premium.",
    isLast: true,
  },
];

export default function OnboardingFlow({ userId, onComplete }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(false);

  const markComplete = async () => {
    await supabase
      .from("my_profile")
      .upsert({ user_id: userId, onboarding_completed: true }, { onConflict: "user_id" });
  };

  const handleSkip = async () => {
    await markComplete();
    onComplete();
  };

  const handleFinish = async () => {
    setLoading(true);
    const { data: existing } = await supabase
      .from("user_points")
      .select("id")
      .eq("user_id", userId)
      .eq("action_type", "registration")
      .maybeSingle();
    if (!existing) {
      await supabase.from("user_points").insert({ user_id: userId, action_type: "registration", points: 500 });
    }
    await markComplete();
    router.push("/moi/questionnaire");
  };

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(30,18,8,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: BG, borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>

        {/* Content */}
        <div style={{ padding: "44px 36px 28px", flex: 1 }}>

          {/* Icon */}
          <div style={{ fontSize: 52, textAlign: "center", marginBottom: 20, lineHeight: 1 }}>
            {current.icon}
          </div>

          {/* Tag */}
          <p style={{ fontFamily: DM, fontSize: 10, fontWeight: 500, letterSpacing: 3, textTransform: "uppercase", color: TERRA, textAlign: "center", marginBottom: 14 }}>
            {current.tag}
          </p>

          {/* Title */}
          <h2 style={{ fontFamily: PLAYFAIR, fontSize: 28, fontWeight: 400, color: CON, lineHeight: 1.2, letterSpacing: -0.5, textAlign: "center", marginBottom: current.subtitle ? 10 : 18 }}>
            {current.title}
          </h2>

          {/* Subtitle */}
          {current.subtitle && (
            <p style={{ fontFamily: DM, fontSize: 16, fontWeight: 300, color: TERRA, textAlign: "center", marginBottom: 18 }}>
              {current.subtitle}
            </p>
          )}

          {/* Body */}
          <p style={{ fontFamily: DM, fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.85, textAlign: "center", marginBottom: isLast ? 24 : 0 }}>
            {current.body}
          </p>

          {/* Points table — last slide only */}
          {isLast && (
            <div style={{ background: WHITE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px" }}>
              {POINTS.map((row, i) => (
                <div
                  key={row.label}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < POINTS.length - 1 ? `0.5px solid ${BORDER}` : "none" }}
                >
                  <span style={{ fontFamily: DM, fontSize: 13, fontWeight: 300, color: CON }}>{row.label}</span>
                  <span style={{ fontFamily: DM, fontSize: 13, fontWeight: 500, color: TERRA }}>{row.pts}</span>
                </div>
              ))}
              <p style={{ fontFamily: DM, fontSize: 11, fontWeight: 300, color: COND, marginTop: 12, fontStyle: "italic" }}>
                100 pts = 1€ de réduction sur Candice Premium
              </p>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div style={{ padding: "0 36px 36px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>

          {/* Dots */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  width: i === slide ? 22 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === slide ? TERRA : "rgba(196,122,74,0.22)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.25s ease",
                }}
              />
            ))}
          </div>

          {/* Primary button */}
          {isLast ? (
            <button
              onClick={handleFinish}
              disabled={loading}
              style={{ width: "100%", background: TERRA, color: "#fff", border: "none", borderRadius: 10, padding: "15px", fontSize: 15, fontWeight: 500, cursor: loading ? "default" : "pointer", fontFamily: DM, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Chargement…" : "Je complète mon profil →"}
            </button>
          ) : (
            <button
              onClick={() => setSlide(slide + 1)}
              style={{ width: "100%", background: TERRA, color: "#fff", border: "none", borderRadius: 10, padding: "15px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: DM }}
            >
              Suivant
            </button>
          )}

          {/* Skip link */}
          {!isLast && (
            <button
              onClick={handleSkip}
              style={{ background: "none", border: "none", fontFamily: DM, fontSize: 12, fontWeight: 300, color: COND, cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              Passer l&apos;introduction
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
