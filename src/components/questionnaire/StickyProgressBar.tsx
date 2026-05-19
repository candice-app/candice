"use client";

import { useEffect, useState } from "react";

interface Props {
  answeredCount: number;
  total: number;
  showToast?: boolean;
  onToastDone?: () => void;
  onSaveLater?: () => void;
  onVoiceMode?: () => void;
}

function getLabel(pct: number, remaining: number): string {
  if (pct === 0) return "On commence";
  if (pct < 40) return `Reste ${remaining}`;
  if (pct < 55) return "À mi-parcours";
  if (pct < 80) return "Bientôt fini";
  return "Presque fini";
}

export default function StickyProgressBar({
  answeredCount, total, showToast, onToastDone, onSaveLater, onVoiceMode,
}: Props) {
  const pct = Math.min(100, Math.round((answeredCount / total) * 100));
  const remaining = total - answeredCount;
  const [toastVisible, setToastVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    setToastVisible(true);
    const t = setTimeout(() => {
      setToastVisible(false);
      onToastDone?.();
    }, 1500);
    return () => clearTimeout(t);
  }, [showToast, onToastDone]);

  return (
    <>
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--bg)", borderBottom: "0.5px solid var(--brd)",
        height: 56, display: "flex", alignItems: "center",
        padding: "0 20px", gap: 14,
      }}>
        {/* Logo */}
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 20, fontWeight: 400, color: "var(--con)", flexShrink: 0,
        }}>
          Candice
        </span>

        {/* Progress bar */}
        <div style={{ flex: 1, height: 4, background: "var(--br3)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "var(--terra)", borderRadius: 2,
            width: `${pct}%`, transition: "width 300ms ease",
          }} />
        </div>

        {/* Label — hidden on very small screens via inline minWidth trick */}
        <span style={{
          fontSize: 11, fontWeight: 300, color: "var(--cond)",
          flexShrink: 0, minWidth: 72, textAlign: "right",
        }}>
          {getLabel(pct, remaining)}
        </span>

        {/* Burger */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "8px 4px", flexShrink: 0, display: "flex",
            flexDirection: "column", gap: 4, alignItems: "center",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ display: "block", width: 18, height: 1.5, background: "var(--con)", borderRadius: 1 }} />
          ))}
        </button>
      </div>

      {/* Full-screen overlay menu */}
      {menuOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 400,
          background: "#FAF7F2",
          display: "flex", flexDirection: "column",
        }}>
          {/* Overlay header */}
          <div style={{
            height: 56, display: "flex", alignItems: "center",
            justifyContent: "space-between", padding: "0 20px",
            borderBottom: "0.5px solid var(--brd)",
          }}>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 400, color: "var(--con)" }}>
              Candice
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "var(--cond)", padding: 4 }}
            >
              ✕
            </button>
          </div>

          {/* Menu items */}
          <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", gap: 0 }}>
            {onVoiceMode && (
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onVoiceMode(); }}
                style={menuItem}
              >
                <span style={{ fontSize: 20 }}>🎙</span>
                <span>Remplir en mode vocal</span>
              </button>
            )}
            {onSaveLater && (
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onSaveLater(); }}
                style={menuItem}
              >
                <span style={{ fontSize: 20 }}>💾</span>
                <span>Sauvegarder et revenir plus tard</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => { setMenuOpen(false); window.history.back(); }}
              style={{ ...menuItem, color: "var(--cond)", borderTop: "0.5px solid var(--brd)", marginTop: 16, paddingTop: 24 }}
            >
              <span style={{ fontSize: 20 }}>←</span>
              <span>Quitter le questionnaire</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom toast */}
      {toastVisible && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: "#2C1A0E", color: "#FAF7F2", fontSize: 12, fontWeight: 300,
          padding: "10px 20px", borderRadius: 20, zIndex: 200,
          animation: "fadeInOut 1.5s ease forwards",
          whiteSpace: "nowrap", pointerEvents: "none",
        }}>
          Réponse enregistrée
        </div>
      )}
    </>
  );
}

const menuItem: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 16,
  background: "none", border: "none", cursor: "pointer",
  padding: "18px 0", width: "100%", textAlign: "left",
  fontSize: 16, fontWeight: 300, color: "var(--con)",
  borderBottom: "0.5px solid var(--brd)",
};
