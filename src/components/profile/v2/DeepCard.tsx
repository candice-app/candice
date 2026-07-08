"use client";

// Refonte Profil V2 — card « profonde » partagée (modules 5 En profondeur
// et 6 Tes mondes) : phrase + tags 2 familles + « Lire plus » dépliant.

import { useState } from "react";
import { T2, Mod, Mh, Icon, Tags } from "./ui";
import type { SectionV2 } from "@/lib/profile/v2-data";

export default function DeepCard({
  title,
  section,
  warnChips,
  icon,
  iconChamp,
}: {
  title: string;
  section: SectionV2 | undefined;
  /** true = les chips de cette section sont de la famille « à éviter » */
  warnChips?: boolean;
  icon?: string;         // picto « Tes mondes » (thIc)
  iconChamp?: boolean;   // pastille champagne (goûts esthétiques)
}) {
  const [open, setOpen] = useState(false);
  const text = section?.text?.trim();
  const more = section?.more?.trim();
  const chips = section?.chips ?? [];
  if (!text && chips.length === 0) return null;

  return (
    <Mod>
      {icon ? (
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 6 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
            background: iconChamp ? "rgba(205,185,135,.22)" : T2.mist,
            color: iconChamp ? "#7a4b1e" : T2.pine,
          }}>
            <Icon name={icon} size={18} />
          </span>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 450 }}>{title}</div>
        </div>
      ) : (
        <Mh>{title}</Mh>
      )}
      {text && (
        <p style={{ fontSize: 13.5, color: T2.ink2, lineHeight: 1.52, marginTop: icon ? 0 : 8 }}>{text}</p>
      )}
      <Tags
        items={warnChips ? undefined : chips}
        warnItems={warnChips ? chips : undefined}
      />
      {more && (
        <>
          <div style={{
            maxHeight: open ? 300 : 0, overflow: "hidden",
            transition: "max-height .32s ease",
          }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.56, color: T2.ink2, paddingTop: 10, margin: 0 }}>{more}</p>
          </div>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600,
              color: T2.pine, minHeight: 44, marginTop: 2, background: "none", border: "none",
              cursor: "pointer", padding: 0, fontFamily: "var(--font-sans)",
            }}
          >
            {open ? "Réduire" : "Lire plus"}
            <Icon name="chevron" size={14} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .25s" }} />
          </button>
        </>
      )}
    </Mod>
  );
}
