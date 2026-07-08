// Refonte Profil V2 — CE QUI MARCHE AVEC TOI (module 7).
// 6 intensités : niveaux DÉTERMINISTES (badges + segments), phrases LLM.

import { T2, Mod } from "./ui";
import {
  WORKS_LABELS,
  WORKS_LEVEL_LABELS,
  type WorksKey,
  type WorksLevel,
} from "@/lib/profile/v2-metrics";

const ORDER: WorksKey[] = ["beau", "personnel", "experientiel", "utile", "premium", "surprise"];

const BADGE: Record<WorksLevel, React.CSSProperties> = {
  tres_fort: { background: "rgba(23,62,49,.08)", color: T2.pine },
  fort:      { background: T2.sageBg, color: "#3d5a4b" },
  a_doser:   { background: "rgba(205,185,135,.22)", color: "#7a4b1e" },
};

const SEGMENTS: Record<WorksLevel, number> = { tres_fort: 3, fort: 2, a_doser: 1 };

export default function WorksV2({
  levels,
  phrases,
}: {
  levels: Record<WorksKey, WorksLevel> | null;
  phrases: Record<string, string>;
}) {
  if (!levels) return null;
  return (
    <Mod>
      {ORDER.map((key, idx) => {
        const level = levels[key];
        const filled = SEGMENTS[level];
        const gold = level === "a_doser";
        return (
          <div key={key} style={{
            padding: idx === 0 ? "0 0 12px" : "12px 0",
            paddingBottom: idx === ORDER.length - 1 ? 2 : 12,
            borderBottom: idx === ORDER.length - 1 ? "none" : `1px solid ${T2.line2}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <b style={{ fontSize: 14.5, fontWeight: 600 }}>{WORKS_LABELS[key]}</b>
              <span style={{
                fontSize: 10, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700,
                padding: "4px 9px", borderRadius: 8, ...BADGE[level],
              }}>
                {WORKS_LEVEL_LABELS[level]}
              </span>
            </div>
            {phrases[key] && (
              <p style={{ fontSize: 12.5, color: T2.ink2, lineHeight: 1.45, marginTop: 4 }}>{phrases[key]}</p>
            )}
            <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
              {[0, 1, 2].map(i => (
                <i key={i} style={{
                  flex: 1, height: 5, borderRadius: 3,
                  background: i < filled
                    ? (gold ? "linear-gradient(90deg,#e0cf9d,#C7A85A)" : "linear-gradient(90deg,#173E31,#3E7361)")
                    : T2.line,
                }} />
              ))}
            </div>
          </div>
        );
      })}
    </Mod>
  );
}
