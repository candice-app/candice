// Refonte Profil V2 — CARROUSEL « Ce que Candice a compris » (module 4).
// 4 cards : verte aplat / champagne / ivoire / sauge (ordre maquette).

import { T2 } from "./ui";

const STYLES: Array<{ card: React.CSSProperties; eyebrow: React.CSSProperties; text: React.CSSProperties }> = [
  { // verte aplat (halo champagne)
    card: { background: T2.aplat, color: "#fff", position: "relative", overflow: "hidden" },
    eyebrow: { color: T2.champ },
    text: { position: "relative", color: "rgba(255,255,255,.94)" },
  },
  { // champagne
    card: { background: "linear-gradient(160deg,#FBF8F0,#F3EAD3)", border: "1px solid rgba(199,168,90,.25)" },
    eyebrow: { color: "#9a7d2e" },
    text: {},
  },
  { // ivoire
    card: { background: "#fff", border: `1px solid ${T2.line}` },
    eyebrow: { color: T2.pineLite },
    text: {},
  },
  { // sauge
    card: { background: T2.sageBg, border: "1px solid rgba(141,166,151,.3)" },
    eyebrow: { color: "#3d5a4b" },
    text: {},
  },
];

export default function UnderstoodV2({ cards }: { cards: Array<{ eyebrow: string; text: string }> }) {
  if (cards.length === 0) return null;
  return (
    <div style={{
      display: "flex", gap: 11, overflowX: "auto", scrollSnapType: "x mandatory",
      padding: "2px 18px 10px", scrollbarWidth: "none",
    }}>
      {cards.slice(0, 4).map((c, i) => {
        const s = STYLES[i % STYLES.length];
        return (
          <div key={i} style={{
            flex: "0 0 232px", scrollSnapAlign: "start", borderRadius: 18, padding: 16,
            minHeight: 132, display: "flex", flexDirection: "column", boxShadow: T2.shadow,
            ...s.card,
          }}>
            {i === 0 && (
              <span style={{ position: "absolute", right: -22, top: -40, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle,rgba(205,185,135,.34),transparent 70%)" }} />
            )}
            <span style={{ fontSize: 9.5, letterSpacing: 1.6, textTransform: "uppercase", fontWeight: 700, marginBottom: 8, ...s.eyebrow }}>
              {c.eyebrow}
            </span>
            <p style={{ fontSize: 13.5, lineHeight: 1.48, fontWeight: 450, margin: 0, ...s.text }}>{c.text}</p>
          </div>
        );
      })}
    </div>
  );
}
