/* .chip — verbatim from Candice_Redesign_Mockups_v4.html
   display:inline-block;padding:5px 11px;border:1px solid var(--line);
   border-radius:999px;font-size:11px;color:var(--ink2);background:var(--surface) */

import React from "react";

export type ChipVariant =
  | "default"
  | "pine"       /* background:var(--pine);color:#fff;border-color:var(--pine) */
  | "pine-border"/* border-color:var(--pine);color:var(--pine) */
  | "sage"       /* color:#3d5a4b;background:var(--sage-bg) */
  | "terra"      /* color:var(--terra);background:rgba(197,123,78,.12) */
  | "blue"       /* color:var(--blue);background:rgba(95,129,144,.12) */
  | "red"        /* color:var(--red);background:rgba(194,74,60,.10) */
  | "champ";     /* color:#9a7d2e;background:rgba(199,168,90,.2) */

const VARIANT_STYLES: Record<ChipVariant, React.CSSProperties> = {
  default: { color: "var(--ink2)", background: "var(--surface)", border: "1px solid var(--line)" },
  pine: { color: "#fff", background: "var(--pine)", border: "1px solid var(--pine)" },
  "pine-border": { color: "var(--pine)", background: "var(--surface)", border: "1px solid var(--pine)" },
  sage: { color: "#3d5a4b", background: "var(--sage-bg)", border: "1px solid transparent" },
  terra: { color: "var(--terra)", background: "rgba(197,123,78,.12)", border: "1px solid transparent" },
  blue: { color: "var(--blue)", background: "rgba(95,129,144,.12)", border: "1px solid transparent" },
  red: { color: "var(--red)", background: "rgba(194,74,60,.10)", border: "1px solid transparent" },
  champ: { color: "#9a7d2e", background: "rgba(199,168,90,.2)", border: "1px solid transparent" },
};

export interface ChipProps {
  children: React.ReactNode;
  variant?: ChipVariant;
  style?: React.CSSProperties;
}

export default function Chip({ children, variant = "default", style }: ChipProps) {
  return (
    <span style={{
      display: "inline-block",
      padding: "5px 11px",
      borderRadius: 999,
      fontSize: 11,
      fontFamily: "var(--font-sans)",
      ...VARIANT_STYLES[variant],
      ...style,
    }}>
      {children}
    </span>
  );
}
