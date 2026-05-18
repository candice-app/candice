"use client";

import { useState } from "react";
import type { CadenceLevel } from "@/types";
import { CADENCE_LABELS, CADENCE_STEPS } from "@/lib/cadence/resolver";

interface Props {
  initialCadence: CadenceLevel;
}

export default function CadenceGlobal({ initialCadence }: Props) {
  const [selected, setSelected] = useState<CadenceLevel>(initialCadence);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSelect(level: CadenceLevel) {
    setSelected(level);
    setSaving(true);
    setSaved(false);
    await fetch("/api/parametres/cadence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cadence_preference: level }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ paddingTop: 14, marginTop: 14, borderTop: "0.5px solid var(--brd)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)" }}>
          Cadence globale
        </p>
        {(saving || saved) && (
          <span style={{ fontSize: 10, fontWeight: 300, color: "var(--terra)" }}>
            {saving ? "Enregistrement…" : "Enregistré"}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {CADENCE_STEPS.map(level => {
          const { label, description } = CADENCE_LABELS[level];
          const active = selected === level;
          return (
            <button
              key={level}
              onClick={() => handleSelect(level)}
              style={{
                padding: "10px 8px",
                borderRadius: "var(--r-md)",
                border: active ? "1.5px solid var(--terra)" : "0.5px solid var(--brd)",
                background: active ? "var(--t2)" : "var(--bg)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <p style={{ fontSize: 11, fontWeight: active ? 500 : 300, color: active ? "var(--terra)" : "var(--con)", marginBottom: 2 }}>
                {label}
              </p>
              <p style={{ fontSize: 10, fontWeight: 300, color: "var(--cond)", lineHeight: 1.4 }}>
                {description}
              </p>
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 10, fontWeight: 300, color: "var(--cond)", marginTop: 8, lineHeight: 1.5 }}>
        Candice adapte ce rythme selon chaque proche et le contexte.
      </p>
    </div>
  );
}
