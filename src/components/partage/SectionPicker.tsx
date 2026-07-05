"use client";

// B.2 Phase 7 — panneau « sections choisies » partagé entre l'écran de
// réponse (Phase 6) et le lien sortant (Phase 7). Socle verrouillé en tête
// (lead + topchips + donut : toujours inclus, non décochable), puis les
// groupes de la matrice. Cibles ≥44px, aucun émoji.

import { SHARE_GROUPS } from "@/lib/profile/share-sections";
import type { SectionKey } from "@/lib/profile/visibility";

const T = {
  pine: "#173E31", ink: "#16150E", ink3: "#ABA699",
  line: "rgba(23,62,49,.11)", line2: "rgba(23,62,49,.06)",
  shadow: "0 10px 30px rgba(23,62,49,.07)",
} as const;

const LOCK = <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>;
const CHECK = <><path d="M5 12l5 5 9-10" /></>;

export default function SectionPicker({
  checked,
  onToggle,
}: {
  checked: Set<SectionKey>;
  onToggle: (keys: SectionKey[]) => void;
}) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, padding: "13px 16px", marginBottom: 10, boxShadow: T.shadow }}>
      {/* SOCLE verrouillé */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.line2}` }}>
        <span style={{ width: 24, height: 24, borderRadius: 6, background: "#EAF1EC", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 24px" }}>
          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "none", stroke: T.pine, strokeWidth: 1.7 }}>{LOCK}</svg>
        </span>
        <span style={{ flex: 1, fontSize: 13.5, color: T.ink }}>
          L&apos;essentiel <span style={{ color: T.ink3, fontSize: 12 }}>— résumé, traits, langage d&apos;attention</span>
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: T.ink3 }}>
          inclus
        </span>
      </div>

      {SHARE_GROUPS.map(group => (
        <div key={group.title}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: T.ink3, margin: "14px 0 2px" }}>
            {group.title}
          </p>
          {group.items.map(item => {
            const isOn = item.keys.every(k => checked.has(k));
            return (
              <label key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={() => onToggle(item.keys)}
                  style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
                />
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 6, flex: "0 0 22px",
                  border: isOn ? `1.5px solid ${T.pine}` : `1.5px solid rgba(23,62,49,.25)`,
                  background: isOn ? T.pine : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isOn && (
                    <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "none", stroke: "#fff", strokeWidth: 2.4 }}>{CHECK}</svg>
                  )}
                </span>
                <span style={{ fontSize: 13.5, color: T.ink }}>{item.label}</span>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}
