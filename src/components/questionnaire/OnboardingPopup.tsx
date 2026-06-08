"use client";

import LivePoint from "@/components/presence/LivePoint";

interface Props {
  onStart: () => void;
}

export default function OnboardingPopup({ onStart }: Props) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "var(--canvas)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "0 30px",
      zIndex: 30,
    }}>
      <LivePoint size={7} tone="pine" style={{ marginBottom: 28 }} />

      <h1 style={{
        fontFamily: "var(--font-serif)",
        fontWeight: 300,
        fontSize: "clamp(22px, 4vw, 28px)",
        letterSpacing: "-.018em",
        lineHeight: 1.25,
        color: "var(--pine)",
        margin: "0 0 20px",
      } as React.CSSProperties}>
        Avant de commencer
      </h1>

      <p style={{
        fontFamily: "var(--font-sans)",
        fontWeight: 300,
        fontSize: "clamp(15px, 2.5vw, 17px)",
        lineHeight: 1.65,
        color: "rgba(23,62,49,.72)",
        margin: "0 0 48px",
      }}>
        Ce questionnaire, tu ne le rempliras qu&apos;une fois. Prends une vingtaine de minutes,
        au calme — c&apos;est ce qui fera la différence. Au fil des questions, Candice te livrera
        déjà quelques aperçus de toi, jusqu&apos;à la dernière étape.
      </p>

      <button
        type="button"
        onClick={onStart}
        style={{
          alignSelf: "flex-start",
          background: "var(--pine)",
          color: "var(--canvas)",
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
          fontSize: 15,
          letterSpacing: ".01em",
          border: "none",
          borderRadius: 8,
          padding: "14px 28px",
          cursor: "pointer",
          minHeight: 48,
        }}
      >
        C&apos;est parti
      </button>
    </div>
  );
}
