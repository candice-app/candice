/* .intens — verbatim from Candice_Redesign_Mockups_v4.html
   display:flex;align-items:center;gap:8px;margin:8px 0
   .nm: font-size:13px;font-weight:500;flex:1
   .seg: display:flex;gap:3px
   .seg i: width:15px;height:6px;border-radius:3px;background:var(--line)
   .seg i.f: background:var(--pine)
   .lab: font-size:11.5px;color:var(--ink2);flex:0 0 80px;text-align:right
   JAMAIS de % — intensité exprimée en mots + segments visuels */

export interface IntensityRowProps {
  /** Label à gauche */
  label: string;
  /** Nombre de segments remplis */
  filled: number;
  /** Total de segments (défaut 5) */
  total?: number;
  /** Mot affiché à droite (ex : "Intense", "Modéré") */
  word: string;
}

export default function IntensityRow({ label, filled, total = 5, word }: IntensityRowProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
      <span style={{ fontSize: 13, fontWeight: 500, flex: 1, fontFamily: "var(--font-sans)" }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: total }).map((_, i) => (
          <i key={i} style={{
            display: "block",
            width: 15,
            height: 6,
            borderRadius: 3,
            background: i < filled ? "var(--pine)" : "var(--line)",
          }} />
        ))}
      </div>
      <span style={{
        fontSize: 11.5,
        color: "var(--ink2)",
        flex: "0 0 80px",
        textAlign: "right",
        fontFamily: "var(--font-sans)",
      }}>
        {word}
      </span>
    </div>
  );
}
