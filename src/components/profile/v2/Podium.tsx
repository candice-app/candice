// Refonte Profil V2 — PODIUM (module 3) : 7 barres h26, dégradé vert
// profond → champagne pâle très doux (JAMAIS terracotta ni bleu), point
// champagne lumineux au bout de la barre dominante, labels d'intensité,
// phrase avant + 3 insights après. Largeurs = barème validé (jamais de chiffre).

import { T2, Mod, Mh, Pt } from "./ui";
import type { PodiumRow } from "@/lib/profile/v2-metrics";

// Dégradés maquette par POSITION (vert profond → champagne pâle)
const ROW_GRADIENTS = [
  "linear-gradient(90deg,#173E31,#2A7B5C)",
  "linear-gradient(90deg,#20573F,#457D66)",
  "linear-gradient(90deg,#457D66,#79A08B)",
  "linear-gradient(90deg,#8AAC97,#B3C3AC)",
  "linear-gradient(90deg,#BCC8AF,#D3D5B8)",
  "linear-gradient(90deg,#D8D2B0,#E4DCBE)",
  "linear-gradient(90deg,#EAE1C6,#F1EAD5)",
];

export default function PodiumV2({
  intro,
  rows,
  insights,
  title = "Ce qui te fait te sentir aimée",
}: {
  intro: string | null;
  rows: PodiumRow[];
  insights: string[];
  title?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <Mod>
      <Mh>{title}</Mh>
      {intro && (
        <p style={{ fontSize: 14, color: T2.ink2, lineHeight: 1.52, marginTop: 8 }}>{intro}</p>
      )}
      <div style={{ marginTop: 15 }}>
        {rows.map((r, i) => (
          <div key={r.dim} style={{ marginBottom: i === rows.length - 1 ? 2 : 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
              <b style={{ fontSize: 15, fontWeight: 560 }}>{r.label}</b>
              <span style={{ fontSize: 12, letterSpacing: 0.9, textTransform: "uppercase", fontWeight: 700, color: T2.ink3 }}>
                {r.intensityLabel}
              </span>
            </div>
            <div style={{ height: 26, borderRadius: 9, background: T2.line2, overflow: "hidden", position: "relative" }}>
              <i style={{
                display: "block", height: "100%", borderRadius: 9,
                width: `${r.width}%`,
                background: ROW_GRADIENTS[Math.min(i, ROW_GRADIENTS.length - 1)],
              }} />
              {/* Point champagne lumineux — barre DOMINANTE uniquement */}
              {r.intensity === "dominant" && (
                <span style={{
                  position: "absolute", top: "50%", left: `${r.width}%`,
                  transform: "translate(-50%,-50%)", width: 9, height: 9, borderRadius: "50%",
                  background: "radial-gradient(circle at 40% 34%,#F4E7C4,#CDB987)",
                  boxShadow: "0 0 8px rgba(205,185,135,.9)",
                }} />
              )}
            </div>
          </div>
        ))}
      </div>
      {insights.length > 0 && (
        <div style={{ marginTop: 16, borderTop: `1px solid ${T2.line2}`, paddingTop: 13 }}>
          {insights.slice(0, 3).map((ins, i) => (
            <div key={i} style={{ display: "flex", gap: 9, fontSize: 13.5, lineHeight: 1.45, color: T2.ink2, marginBottom: 7 }}>
              <Pt style={{ marginTop: 6 }} />
              {ins}
            </div>
          ))}
        </div>
      )}
    </Mod>
  );
}
