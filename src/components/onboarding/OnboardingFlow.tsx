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

const LS_KEY = "candice_onboarding_complete";

const SLIDES: { tag: string; icon: string; title: string; subtitle?: string; body: string; pill?: string; isLast?: true }[] = [
  {
    tag: "Bienvenue",
    icon: "✦",
    title: "Les personnes qui comptent méritent votre meilleur.",
    body: "Candice apprend à connaître vos proches pour anticiper les bons gestes — au bon moment, sans effort.",
  },
  {
    tag: "Votre profil",
    icon: "👤",
    title: "Commencez par vous.",
    body: "Complétez votre fiche — vos goûts, vos dates importantes, ce qui vous touche vraiment. Vos proches pourront enfin faire les bons gestes pour vous.",
    pill: "5 minutes. Confidentiel.",
  },
  {
    tag: "Vos proches",
    icon: "💌",
    title: "Parlez-lui d'eux.",
    body: "Envoyez un lien à chaque proche — ils remplissent leur fiche en quelques minutes depuis leur téléphone.",
    pill: "Un lien WhatsApp suffit.",
  },
  {
    tag: "Candice agit",
    icon: "🔍",
    title: "Candice s'occupe du reste.",
    body: "Elle croise les profils, anticipe les moments clés et propose les attentions les plus justes. Vous approuvez. Elle exécute.",
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
    try { localStorage.setItem(LS_KEY, "true"); } catch { /* storage unavailable */ }
  };

  const handleFinish = async () => {
    setLoading(true);
    await markComplete();
    router.push("/moi/questionnaire");
  };

  const handleDashboard = async () => {
    setLoading(true);
    await markComplete();
    setLoading(false);
    onComplete();
  };

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];

  return (
    <div className="onboarding-modal-wrap">
      <div className="onboarding-modal-inner">

        {/* Content */}
        <div style={{ padding: "44px 36px 28px", flex: 1 }}>

          {/* Icon */}
          <div style={{ fontSize: 80, textAlign: "center", marginBottom: 20, lineHeight: 1 }}>
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
          <p style={{ fontFamily: DM, fontSize: 14, fontWeight: 300, color: COND, lineHeight: 1.75, textAlign: "center", marginBottom: current.pill ? 16 : (isLast ? 24 : 0) }}>
            {current.body}
          </p>

          {/* Pill highlight */}
          {current.pill && !isLast && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 0 }}>
              <span style={{
                display: "inline-block",
                background: TERRA,
                color: WHITE,
                fontFamily: DM,
                fontSize: 12,
                fontWeight: 500,
                padding: "7px 16px",
                borderRadius: 100,
                textAlign: "center",
              }}>
                {current.pill}
              </span>
            </div>
          )}

        </div>

        {/* Bottom nav */}
        <div style={{ padding: "0 36px 36px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>

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

          {/* CTAs */}
          {isLast ? (
            <>
              <button
                onClick={handleFinish}
                disabled={loading}
                style={{ width: "100%", background: TERRA, color: "#fff", border: "none", borderRadius: 10, padding: "15px", fontSize: 15, fontWeight: 500, cursor: loading ? "default" : "pointer", fontFamily: DM, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Chargement…" : "Compléter mon profil →"}
              </button>
              <button
                onClick={handleDashboard}
                disabled={loading}
                style={{ width: "100%", background: "transparent", color: TERRA, border: `1.5px solid ${TERRA}`, borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 400, cursor: loading ? "default" : "pointer", fontFamily: DM, opacity: loading ? 0.7 : 1 }}
              >
                Accéder à mon dashboard
              </button>
            </>
          ) : (
            <button
              onClick={() => setSlide(slide + 1)}
              style={{ width: "100%", background: TERRA, color: "#fff", border: "none", borderRadius: 10, padding: "15px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: DM }}
            >
              Suivant
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
