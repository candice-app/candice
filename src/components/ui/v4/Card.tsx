/* .card + .gh (GreenPanel) — verbatim from Candice_Redesign_Mockups_v4.html
   .card: background:var(--surface);border:1px solid var(--line);
     border-radius:18px;box-shadow:var(--shadow)
   .gh: background:var(--aplat);color:#fff;position:relative;overflow:hidden
   .gh:after glow: right:-22px;top:-44px;width:160px;height:160px;border-radius:50%;
     background:radial-gradient(circle,rgba(205,185,135,.34),transparent 70%) */

import React from "react";

export interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--line)",
      borderRadius: 18,
      boxShadow: "var(--shadow)",
      ...style,
    }}>
      {children}
    </div>
  );
}

export interface GreenPanelProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function GreenPanel({ children, style }: GreenPanelProps) {
  return (
    <div style={{
      background: "var(--aplat)",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      {/* glow ::after orb — champagne radial */}
      <div style={{
        position: "absolute",
        right: -22,
        top: -44,
        width: 160,
        height: 160,
        borderRadius: "50%",
        background: "radial-gradient(circle,rgba(205,185,135,.34),transparent 70%)",
        pointerEvents: "none",
      }} />
      {children}
    </div>
  );
}
