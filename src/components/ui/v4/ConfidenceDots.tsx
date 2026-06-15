/* .conf — verbatim from Candice_Redesign_Mockups_v4.html
   display:flex;gap:3px;flex:0 0 auto
   .conf i: width:8px;height:8px;border-radius:50%;background:var(--line)
   .conf i.f: background:var(--pine)
   Used for idea confidence gauge (4 dots max in the HTML). */

export interface ConfidenceDotsProps {
  /** Number of filled dots */
  filled: number;
  /** Total dots (default 4) */
  total?: number;
  style?: React.CSSProperties;
}

export default function ConfidenceDots({ filled, total = 4, style }: ConfidenceDotsProps) {
  return (
    <div style={{ display: "flex", gap: 3, flex: "0 0 auto", ...style }}>
      {Array.from({ length: total }).map((_, i) => (
        <i key={i} style={{
          display: "block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: i < filled ? "var(--pine)" : "var(--line)",
        }} />
      ))}
    </div>
  );
}
