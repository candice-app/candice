"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LivePoint from "@/components/presence/LivePoint";

// Bible-exact closing lines
const LINES = [
  "Ton profil est maintenant beaucoup plus précis.",
  "Candice peut désormais mieux comprendre ce qui te touche, ce qui te fatigue, ce qu'il faut éviter, et les attentions qui ont le plus de chances d'être justes.",
  "Tu pourras enrichir ton profil à tout moment.",
];

export default function ClosingMoment({ piloteFirstName }: { piloteFirstName?: string }) {
  const router = useRouter();
  const [revealedLines, setRevealedLines] = useState<number[]>([]);
  const [ctaVisible, setCtaVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    LINES.forEach((_, i) => {
      const t = setTimeout(() => {
        setRevealedLines(prev => [...prev, i]);
      }, 900 + i * 1000);
      timers.current.push(t);
    });

    const ctaTimer = setTimeout(() => {
      setCtaVisible(true);
    }, 900 + LINES.length * 1000 + 700);
    timers.current.push(ctaTimer);

    return () => timers.current.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "radial-gradient(135% 70% at 50% 40%, rgba(62,115,97,.20) 0%, rgba(62,115,97,0) 62%), #0E1A14",
      display: "flex",
      flexDirection: "column",
      padding: "0 30px",
      zIndex: 10,
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <LivePoint size={7} tone="glow" style={{ marginBottom: 26 }} />

        {LINES.map((line, i) => (
          <p
            key={i}
            style={{
              fontFamily: "var(--font-serif)",
              fontOpticalSizing: "auto",
              fontWeight: 300,
              fontSize: "clamp(20px, 3.5vw, 25px)",
              lineHeight: 1.45,
              color: i === 0 ? "rgba(252,251,247,.9)" : "#fff",
              letterSpacing: "-.01em",
              marginTop: i > 0 ? 18 : 0,
              opacity: revealedLines.includes(i) ? 1 : 0,
              transform: revealedLines.includes(i) ? "none" : "translateY(8px)",
              transition: "opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)",
            } as React.CSSProperties}
          >
            {line}
          </p>
        ))}
      </div>

      {piloteFirstName && ctaVisible && (
        <p style={{
          fontFamily: "var(--font-serif)", fontWeight: 300,
          fontSize: "clamp(15px, 2.8vw, 18px)", lineHeight: 1.55,
          color: "rgba(252,251,247,.5)", letterSpacing: "-.01em",
          paddingBottom: 20, paddingTop: 4,
          borderTop: "0.5px solid rgba(255,255,255,.08)",
          opacity: 1, transition: "opacity .6s ease",
        } as React.CSSProperties}>
          Ta dynamique avec {piloteFirstName} est maintenant disponible dans ton profil.
        </p>
      )}

      <div style={{
        paddingBottom: 52,
        opacity: ctaVisible ? 1 : 0,
        transition: "opacity .6s ease",
      }}>
        <button
          type="button"
          onClick={() => router.push("/moi/resultats")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            background: "none",
            border: "none",
            color: "rgba(252,251,247,.85)",
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Voir mon profil →
        </button>
      </div>
    </div>
  );
}
