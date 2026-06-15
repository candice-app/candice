/* .prog + .prog>i — verbatim from Candice_Redesign_Mockups_v4.html
   .prog: height:4px;background:var(--line2);border-radius:3px;overflow:hidden
   .prog>i: display:block;height:100%;
     background:linear-gradient(90deg,var(--pine),var(--glow));border-radius:3px */

export interface ProgressBarProps {
  /** 0-100 */
  pct: number;
  /** Override track background — used on dark panels with rgba(255,255,255,.18) */
  trackColor?: string;
  /** Override fill — used on dark panels with var(--champ) */
  fillColor?: string;
  style?: React.CSSProperties;
}

export default function ProgressBar({ pct, trackColor, fillColor, style }: ProgressBarProps) {
  return (
    <div style={{
      height: 4,
      background: trackColor ?? "var(--line2)",
      borderRadius: 3,
      overflow: "hidden",
      ...style,
    }}>
      <i style={{
        display: "block",
        height: "100%",
        width: `${Math.min(100, Math.max(0, pct))}%`,
        background: fillColor ?? "linear-gradient(90deg,var(--pine),var(--glow))",
        borderRadius: 3,
      }} />
    </div>
  );
}
