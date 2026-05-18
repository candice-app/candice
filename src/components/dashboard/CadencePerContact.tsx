"use client";

import { useState } from "react";
import type { CadenceLevel } from "@/types";
import { CADENCE_LABELS, CADENCE_STEPS } from "@/lib/cadence/resolver";
import type { CadenceResolution } from "@/lib/cadence/resolver";

interface Props {
  contactId: string;
  resolution: CadenceResolution;
  initialOverride: CadenceLevel | null;
}

export default function CadencePerContact({ contactId, resolution, initialOverride }: Props) {
  const [override, setOverride] = useState<CadenceLevel | null>(initialOverride);
  const [showWhy, setShowWhy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const displayedCadence = override ?? resolution.cadence;

  async function patch(value: CadenceLevel | null) {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/contacts/${contactId}/cadence`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cadence_override: value }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleFollowGlobal() {
    setOverride(null);
    await patch(null);
  }

  async function handleSelect(level: CadenceLevel) {
    setOverride(level);
    await patch(level);
  }

  const reasonMap: Record<string, string> = {
    base: "Proximité relationnelle",
    global_pref: "Préférence globale",
    contact_override: "Override manuel",
    pilote_difficult_period: "Période difficile du pilote",
    active_high_signal: "Signal prioritaire actif",
  };

  return (
    <div style={{ paddingTop: 14, marginTop: 14, borderTop: "0.5px solid var(--brd)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color: "var(--cond)" }}>
          Cadence d&apos;attention
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {(saving || saved) && (
            <span style={{ fontSize: 10, fontWeight: 300, color: "var(--terra)" }}>
              {saving ? "Enregistrement…" : "Enregistré"}
            </span>
          )}
          <button
            onClick={() => setShowWhy(v => !v)}
            style={{ fontSize: 10, fontWeight: 300, color: "var(--cond)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            Pourquoi ?
          </button>
        </div>
      </div>

      {showWhy && (
        <div style={{ marginBottom: 12, padding: "10px 12px", background: "var(--br3)", borderRadius: "var(--r-md)", border: "0.5px solid var(--brd)" }}>
          <p style={{ fontSize: 11, fontWeight: 400, color: "var(--con)", marginBottom: 6 }}>
            Cadence calculée : <strong>{CADENCE_LABELS[resolution.cadence].label}</strong>
            {" "}({CADENCE_LABELS[resolution.cadence].description})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {resolution.reason.split(", ").map((r, i) => {
              const [key] = r.split(":");
              return (
                <p key={i} style={{ fontSize: 10, fontWeight: 300, color: "var(--cond)" }}>
                  · {reasonMap[key] ?? r}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {override !== null && (
        <button
          onClick={handleFollowGlobal}
          style={{
            fontSize: 10, fontWeight: 300, color: "var(--terra)", background: "none",
            border: "none", cursor: "pointer", marginBottom: 8, display: "block",
          }}
        >
          ↩ Suivre la cadence générale
        </button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {CADENCE_STEPS.map(level => {
          const { label, description } = CADENCE_LABELS[level];
          const active = displayedCadence === level;
          const isOverridden = override === level;
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
                opacity: !isOverridden && override !== null && active ? 0.6 : 1,
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
    </div>
  );
}
