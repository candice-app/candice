"use client";

// Refonte Profil V2 — bottom sheet maquette (backdrop + panneau coulissant).

import { T2 } from "./ui";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(13,42,32,.4)",
          opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
          transition: "opacity .25s", zIndex: 60,
        }}
      />
      <div style={{
        position: "fixed", left: "50%", bottom: 0, width: "100%", maxWidth: 480,
        background: T2.canvas, borderRadius: "24px 24px 0 0", zIndex: 70,
        transform: open ? "translate(-50%, 0)" : "translate(-50%, 102%)",
        transition: "transform .32s cubic-bezier(.32,.72,.28,1)",
        maxHeight: "86vh", display: "flex", flexDirection: "column",
        boxShadow: "0 -12px 40px rgba(13,42,32,.2)",
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 3, background: "rgba(23,62,49,.18)", margin: "10px auto 4px", flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px", flexShrink: 0 }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 440, margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ fontSize: 13.5, fontWeight: 600, color: T2.ink3, minHeight: 44, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            Fermer
          </button>
        </div>
        <div style={{ overflowY: "auto", padding: "0 20px calc(28px + env(safe-area-inset-bottom))" }}>
          {children}
        </div>
      </div>
    </>
  );
}
