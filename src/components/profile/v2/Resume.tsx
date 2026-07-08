"use client";

// Refonte Profil V2 — RÉSUMÉ (module 2) : phrase Fraunces + tags +
// « Lire l'analyse complète » ouvrant la sheet (summary_long, 3 §).

import { useState } from "react";
import { T2, Icon, Tags } from "./ui";
import { Sheet } from "./Sheet";

export default function ResumeV2({
  summary,
  chips,
  summaryLong,
}: {
  summary: string | null;
  chips: string[];
  summaryLong: string | null;
}) {
  const [open, setOpen] = useState(false);
  if (!summary) return null;

  return (
    <div style={{ padding: "26px 22px 4px" }}>
      <p style={{ fontFamily: "var(--font-serif)", fontSize: 19, lineHeight: 1.5, fontWeight: 400, margin: 0 }}>
        {summary}
      </p>
      <Tags items={chips} />
      {summaryLong && (
        <>
          <button
            onClick={() => setOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
              fontSize: 14, fontWeight: 600, color: T2.pine, minHeight: 44,
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontFamily: "var(--font-sans)",
            }}
          >
            Lire l&apos;analyse complète <Icon name="chevron" size={14} />
          </button>
          <Sheet open={open} onClose={() => setOpen(false)} title="Ton analyse">
            {summaryLong.split(/\n\s*\n/).map((para, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: 1.6, color: T2.ink2, marginBottom: 13 }}>
                {para.trim()}
              </p>
            ))}
          </Sheet>
        </>
      )}
    </div>
  );
}
