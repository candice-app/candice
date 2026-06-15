/* .ring + .ring .pt — verbatim from Candice_Redesign_Mockups_v4.html
   .ring: position:relative
   .ring .pt: position:absolute;inset:0;display:flex;align-items:center;justify-content:center
   No % shown — completion expressed visually only (brand rule). */

import React from "react";

export interface ProgressRingProps {
  /** Total SVG width/height in px */
  size: number;
  /** Ring radius */
  r: number;
  strokeWidth: number;
  /** 0-100 */
  pct: number;
  trackColor?: string;
  fillColor?: string;
  /** Content rendered at the center (e.g. a Point dot) */
  center?: React.ReactNode;
  style?: React.CSSProperties;
}

export default function ProgressRing({ size, r, strokeWidth, pct, trackColor, fillColor, center, style }: ProgressRingProps) {
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - Math.min(100, Math.max(0, pct)) / 100);

  return (
    <div style={{ position: "relative", width: size, height: size, flex: `0 0 ${size}px`, ...style }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor ?? "#E7E3D8"} strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={fillColor ?? "var(--pine)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      {center && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {center}
        </div>
      )}
    </div>
  );
}

/** .point — display:inline-block;width:7px;height:7px;border-radius:50%;
    background:var(--pine);box-shadow:0 0 8px rgba(62,115,97,.55) */
export function Point({ color, size = 7, glow }: { color?: string; size?: number; glow?: string }) {
  return (
    <span style={{
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: "50%",
      background: color ?? "var(--pine)",
      boxShadow: glow ?? "0 0 8px rgba(62,115,97,.55)",
      verticalAlign: "middle",
    }} />
  );
}
