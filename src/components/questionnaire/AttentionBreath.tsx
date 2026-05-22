"use client";

import { useRouter } from "next/navigation";

interface Props {
  breathText: string;
  onContinue: () => void;
}

export default function AttentionBreath({ breathText, onContinue }: Props) {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex", flexDirection: "column",
      alignItems: "flex-start", justifyContent: "center",
      padding: "40px 4px 80px",
      maxWidth: 560,
    }}>
      <p className="section-label" style={{ marginBottom: 20 }}>Ton profil d'attention</p>

      <p style={{
        fontFamily: "var(--playfair)", fontStyle: "italic",
        fontSize: "clamp(18px, 3.2vw, 22px)", fontWeight: 400,
        color: "var(--con)", lineHeight: 1.6,
        marginBottom: 28, whiteSpace: "pre-line",
      }}>
        {breathText}
      </p>

      <div style={{ height: "0.5px", background: "var(--br3)", width: "100%", marginBottom: 24 }} />

      <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", marginBottom: 20 }}>
        Enregistré ✓
      </p>

      <button
        type="button"
        onClick={onContinue}
        className="btn-primary lg"
        style={{ width: "100%", minHeight: 52, marginBottom: 16 }}
      >
        Continuer mon profil →
      </button>

      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 300, color: "var(--cond)",
          padding: "8px 0", textDecoration: "underline", textDecorationColor: "var(--br3)",
        }}
      >
        Reprendre plus tard
      </button>
    </div>
  );
}
