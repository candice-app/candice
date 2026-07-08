// Refonte Profil V2 — POUR MIEUX VISER (module 11).
// Nudges bénéfice + durée (garde du moteur : une répondue ne réapparaît
// jamais — elle devient « Répondu — Modifier ma réponse »).

import Link from "next/link";
import { T2 } from "./ui";
import type { ViserNudge } from "@/lib/profile/v2-data";

export default function ViserV2({ nudges }: { nudges: ViserNudge[] }) {
  if (nudges.length === 0) return null;
  return (
    <>
      <p style={{ margin: "0 22px 12px", fontSize: 13.5, color: T2.ink2, lineHeight: 1.45 }}>
        Quelques précisions suffisent pour que Candice évite les attentions à côté.
      </p>
      {nudges.map(n => {
        const href = n.sectionKey
          ? `/moi/discovery?mode=full&section=${n.sectionKey}`
          : "/moi/discovery?mode=full";
        return (
          <Link key={n.key} href={href} style={{
            border: `1px solid ${T2.line}`,
            borderLeft: `3px solid ${n.done ? T2.sage : T2.champ}`,
            borderRadius: 13, background: "#fff", padding: "13px 14px", margin: "0 14px 9px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            boxShadow: T2.shadow, textDecoration: "none", color: "inherit",
          }}>
            <span style={{ fontSize: 14.5, fontWeight: 500 }}>
              {n.title}
              <small style={{ display: "block", fontSize: 12.5, color: T2.ink3, fontWeight: 400, marginTop: 3 }}>
                {n.subtitle}
              </small>
            </span>
            <span style={{
              fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap",
              color: n.done ? T2.ink2 : T2.pine,
              border: `1px solid ${T2.line}`, padding: "9px 12px", borderRadius: 5,
              background: "#fff", minHeight: 38, display: "inline-flex", alignItems: "center",
            }}>
              {n.done ? "Modifier ma réponse" : "Affiner →"}
            </span>
          </Link>
        );
      })}
    </>
  );
}
