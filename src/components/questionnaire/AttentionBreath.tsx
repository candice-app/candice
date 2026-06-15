"use client";

import { useState, useEffect, useRef } from "react";
import ThinkingOrb from "@/components/ui/v4/ThinkingOrb";
import ProgressBar from "@/components/ui/v4/ProgressBar";

interface Props {
  breathText: string;
  onContinue: () => void;
  progressLabel?: string;
}

function splitBreathText(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(Boolean);
  if (sentences && sentences.length >= 2) return sentences.slice(0, 3);
  const parts = text.split(/\s{2,}|—/g).map(s => s.trim()).filter(s => s.length > 20);
  return parts.length >= 2 ? parts.slice(0, 3) : [text];
}

const FIXED_TEXT =
  "Je ne sais pas encore tout de toi. La suite affinera — et tu pourras toujours me reprendre.";

export default function AttentionBreath({ breathText, onContinue }: Props) {
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
    <div className="v4" style={{
      position: "fixed",
      inset: 0,
      background: "linear-gradient(157deg,#1D5040,#0C2A20)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      zIndex: 10,
    }}>
      {/* Champagne glow ball */}
      <div style={{
        position: "absolute",
        right: -30,
        top: 30,
        width: 170,
        height: 170,
        borderRadius: "50%",
        background: "radial-gradient(circle,rgba(205,185,135,.28),transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Centered content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        textAlign: "center",
        padding: "6px 30px",
        position: "relative",
      }}>
        <ProgressBar
          pct={42}
          trackColor="rgba(255,255,255,.18)"
          fillColor="var(--champ)"
          style={{ marginBottom: 34 }}
        />

        <ThinkingOrb />

        <div style={{
          color: "var(--champ)",
          fontFamily: "var(--font-sans)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "1.8px",
          textTransform: "uppercase",
          margin: "24px 0 12px",
          position: "relative",
        }}>
          Candice réfléchit…
        </div>

        {lines.map((line, i) => (
          <p
            key={i}
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 21,
              lineHeight: 1.4,
              color: "#fff",
              marginTop: i > 0 ? 14 : 0,
              opacity: revealedLines.includes(i) ? 1 : 0,
              transform: revealedLines.includes(i) ? "none" : "translateY(8px)",
              transition: "opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)",
              position: "relative",
            }}
          >
            {line}
          </p>
        ))}

        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,.78)",
          marginTop: 18,
          lineHeight: 1.5,
          position: "relative",
          opacity: ctaVisible ? 1 : 0,
          transition: "opacity .6s ease",
        }}>
          {FIXED_TEXT}
        </p>
      </div>

      {/* Footer — ghost button on canvas */}
      <div style={{
        padding: "10px 20px 16px",
        background: "var(--canvas)",
        opacity: ctaVisible ? 1 : 0,
        transition: "opacity .6s ease",
      }}>
        <button
          type="button"
          onClick={onContinue}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 50,
            width: "100%",
            borderRadius: 15,
            background: "transparent",
            color: "var(--pine)",
            border: "1px solid var(--line)",
            boxShadow: "none",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: 14.5,
            cursor: "pointer",
          }}
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
