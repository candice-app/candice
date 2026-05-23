"use client";

import { useState } from "react";

// ─── Part list ────────────────────────────────────────────────────────────────

const PARTS: { id: string; index: string; label: string }[] = [
  { id: "attention",    index: "01", label: "Langages d'attention" },
  { id: "temperament2", index: "02", label: "Énergie relationnelle" },
  { id: "temperament3", index: "03", label: "Communication & décision" },
  { id: "lifestyle4",   index: "04", label: "Ce que j'aime vivre" },
  { id: "lifestyle5",   index: "05", label: "Ce qu'il vaut mieux éviter" },
  { id: "singularity6", index: "06", label: "Ce qui me rend unique" },
  { id: "practical7",   index: "07", label: "Informations pratiques" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isComplete:    boolean;
  firstStepId:   string | null; // null if complete
  onResume:      () => void;
  onJumpTo:      (partId: string) => void;
  onFull:        () => void;
  onExit:        () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditMenu({ isComplete, firstStepId, onResume, onJumpTo, onFull, onExit }: Props) {
  const [showParts, setShowParts] = useState(false);

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh" }}>

      {/* Header */}
      <div className="q-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="q-logo">Candice<span className="q-logo-dot" /></span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="q-idx">Modifier</span>
            <button
              type="button"
              onClick={onExit}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 11, letterSpacing: ".22em", color: "var(--ink-3)", fontWeight: 300, fontFamily: "var(--font-sans)", WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
            >
              Fermer ×
            </button>
          </div>
        </div>
        <div className="q-bar-track">
          <div className="q-bar-fill" style={{ width: "100%" }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "36px 24px 80px" }}>

        <p style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 300,
          fontSize: "clamp(22px, 5vw, 28px)",
          color: "var(--ink)",
          letterSpacing: "-.018em",
          lineHeight: 1.25,
          marginBottom: 8,
        } as React.CSSProperties}>
          Comment veux-tu procéder ?
        </p>
        <p style={{
          fontSize: 14,
          fontWeight: 300,
          color: "var(--ink-3)",
          lineHeight: 1.6,
          marginBottom: 36,
        }}>
          Tes réponses existantes restent intactes.
        </p>

        {/* Option A : Reprendre (only if incomplete) */}
        {!isComplete && firstStepId && (
          <button
            type="button"
            onClick={onResume}
            style={optStyle(true)}
          >
            <div>
              <p style={optTitle}>Reprendre là où je m'étais arrêté·e</p>
              <p style={optSub}>Continuer depuis la première partie non remplie</p>
            </div>
            <span style={arr}>→</span>
          </button>
        )}

        {/* Option B : Modifier une partie */}
        <button
          type="button"
          onClick={() => setShowParts(v => !v)}
          style={optStyle(false)}
        >
          <div>
            <p style={optTitle}>Modifier une partie</p>
            <p style={optSub}>Aller directement à la section voulue</p>
          </div>
          <span style={arr}>{showParts ? "↑" : "↓"}</span>
        </button>

        {showParts && (
          <div style={{ marginTop: 2, marginBottom: 4 }}>
            {PARTS.map(part => (
              <button
                key={part.id}
                type="button"
                onClick={() => onJumpTo(part.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "13px 18px",
                  marginBottom: 2,
                  background: "var(--white)",
                  border: "0.5px solid var(--line)",
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: ".24em",
                  color: "var(--ink-3)",
                  flexShrink: 0,
                  minWidth: 28,
                }}>
                  {part.index}
                </span>
                <span style={{
                  fontSize: 15,
                  fontWeight: 300,
                  color: "var(--ink)",
                }}>
                  {part.label}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-3)" }}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* Option C : Refaire entièrement */}
        <button
          type="button"
          onClick={onFull}
          style={{ ...optStyle(false), marginTop: 4 }}
        >
          <div>
            <p style={optTitle}>Refaire entièrement</p>
            <p style={optSub}>Reparcourir les 7 parties dans l'ordre</p>
          </div>
          <span style={arr}>→</span>
        </button>

      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

function optStyle(primary: boolean): React.CSSProperties {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "18px 20px",
    marginBottom: 10,
    background: primary ? "rgba(23,62,49,.06)" : "var(--white)",
    border: primary ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
    borderRadius: 16,
    cursor: "pointer",
    textAlign: "left",
    WebkitTapHighlightColor: "transparent",
  };
}

const optTitle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  fontWeight: 400,
  color: "var(--ink)",
  lineHeight: 1.3,
  marginBottom: 3,
};

const optSub: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 300,
  color: "var(--ink-3)",
  lineHeight: 1.5,
};

const arr: React.CSSProperties = {
  fontSize: 16,
  color: "var(--pine)",
  flexShrink: 0,
};
