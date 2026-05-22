"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LivePoint from "@/components/presence/LivePoint";

interface Props {
  breathText: string;
  onContinue: () => void;
  ctaLabel?: string;
}

function splitBreathText(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(Boolean);
  if (sentences && sentences.length >= 2) return sentences.slice(0, 3);
  const parts = text.split(/\s{2,}|—/g).map(s => s.trim()).filter(s => s.length > 20);
  return parts.length >= 2 ? parts.slice(0, 3) : [text];
}

export default function TemperamentBreath({ breathText, onContinue, ctaLabel = "Continuer →" }: Props) {
  const router = useRouter();
  const [revealedLines, setRevealedLines] = useState<number[]>([]);
  const [ctaVisible, setCtaVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const lines = splitBreathText(breathText);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    lines.forEach((_, i) => {
      const t = setTimeout(() => {
        setRevealedLines(prev => [...prev, i]);
      }, 900 + i * 800);
      timers.current.push(t);
    });

    const ctaTimer = setTimeout(() => {
      setCtaVisible(true);
    }, 900 + lines.length * 800 + 600);
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

        {lines.map((line, i) => (
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
              marginTop: i > 0 ? 16 : 0,
              opacity: revealedLines.includes(i) ? 1 : 0,
              transform: revealedLines.includes(i) ? "none" : "translateY(8px)",
              transition: "opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)",
            } as React.CSSProperties}
          >
            {line}
          </p>
        ))}
      </div>

      <div style={{
        paddingBottom: 52,
        opacity: ctaVisible ? 1 : 0,
        transition: "opacity .6s ease",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        <button
          type="button"
          onClick={onContinue}
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
          {ctaLabel}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          style={{
            background: "none",
            border: "none",
            color: "rgba(252,251,247,.36)",
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
            textAlign: "left",
          }}
        >
          Reprendre plus tard
        </button>
      </div>
    </div>
  );
}
