// Refonte Profil V2 — TON TERRITOIRE IDÉAL (module 8).
// Aplat vert immersif + 3 cartes ivoire statuées (Très désirable / À éviter).

import { T2 } from "./ui";
import type { TerritoryV2 } from "@/lib/profile/v2-data";

export default function TerritoryV2Block({ territory, eyebrow = "Ton territoire idéal" }: { territory: TerritoryV2 | null; eyebrow?: string }) {
  if (!territory || territory.cartes.length === 0) return null;
  return (
    <div style={{
      margin: "0 14px 12px", borderRadius: 22, background: T2.aplat, color: "#fff",
      position: "relative", overflow: "hidden",
      boxShadow: "0 14px 34px rgba(23,62,49,.22)", padding: "22px 18px 18px",
    }}>
      <span style={{ position: "absolute", right: -30, top: -50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(205,185,135,.32),transparent 70%)", pointerEvents: "none" }} />
      <span style={{ color: T2.champ, fontSize: 11.5, letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 700, position: "relative" }}>
        {eyebrow}
      </span>
      <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 21, fontWeight: 420, margin: "7px 0 8px", position: "relative" }}>
        {territory.titre}
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.52, color: "rgba(255,255,255,.87)", position: "relative", margin: 0 }}>
        {territory.phrase}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 15, position: "relative" }}>
        {territory.cartes.slice(0, 3).map((c, i) => (
          <div key={i} style={{
            background: "rgba(254,254,251,.97)", borderRadius: 15, padding: "13px 14px",
            color: T2.ink, display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", gap: 12,
          }}>
            <div>
              <b style={{ fontSize: 14.5, fontWeight: 600, display: "block" }}>{c.nom}</b>
              <p style={{ fontSize: 12.5, color: T2.ink2, lineHeight: 1.4, marginTop: 3 }}>{c.description}</p>
            </div>
            <span style={{
              fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: 700,
              padding: "5px 9px", borderRadius: 8, whiteSpace: "nowrap", flexShrink: 0, marginTop: 2,
              ...(c.statut === "eviter"
                ? { background: T2.coralBg, color: T2.coral }
                : { background: "rgba(23,62,49,.09)", color: T2.pine }),
            }}>
              {c.statut === "eviter" ? "À éviter" : "Très désirable"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
