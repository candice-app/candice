"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

const GRAMMATICAL_OPTIONS = [
  { label: "Au féminin",             value: "feminine" },
  { label: "Au masculin",            value: "masculine" },
  { label: "En neutre",              value: "neutral" },
  { label: "Je préfère ne pas préciser", value: "unspecified" },
];

const STYLE_OPTIONS = [
  { label: "Les rayons femme",                      value: "femme" },
  { label: "Les rayons homme",                      value: "homme" },
  { label: "Les deux, selon les pièces",            value: "mixte" },
  { label: "Plutôt unisexe ou non genré",           value: "unisexe" },
  { label: "Ça dépend, mieux vaut me demander",     value: "depends" },
];

interface Props {
  userId: string;
  supabase: SupabaseClient;
  onDone: () => void;
}

export default function GenderStep({ userId, supabase, onDone }: Props) {
  const [grammatical, setGrammatical] = useState<string | null>(null);
  const [style, setStyle] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleStyle(val: string) {
    setStyle(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  }

  async function handleSave() {
    if (!grammatical || saving) return;
    setSaving(true);
    await supabase.from("my_profile").upsert(
      {
        user_id: userId,
        grammatical_gender: grammatical,
        style_gender_orientation: style.length > 0 ? style : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    onDone();
  }

  return (
    <div style={{ paddingTop: 40 }}>
      {/* Question 1 */}
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--pine)", marginBottom: 18 }}>
        Avant de commencer
      </p>
      <h2 style={{
        fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 24,
        color: "var(--ink)", letterSpacing: "-.016em", lineHeight: 1.25, marginBottom: 20,
      } as React.CSSProperties}>
        Comment veux-tu que Candice s'adresse à toi&nbsp;?
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 36 }}>
        {GRAMMATICAL_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setGrammatical(opt.value)}
            style={{
              padding: "13px 16px",
              borderRadius: 12,
              border: grammatical === opt.value
                ? "1.5px solid var(--pine)"
                : "0.5px solid var(--line)",
              background: grammatical === opt.value
                ? "rgba(23,62,49,.07)"
                : "var(--white)",
              fontSize: 14, fontWeight: grammatical === opt.value ? 400 : 300,
              color: grammatical === opt.value ? "var(--pine)" : "var(--ink-2)",
              cursor: "pointer", textAlign: "left",
              transition: "all 0.15s",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Question 2 */}
      <h2 style={{
        fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 22,
        color: "var(--ink)", letterSpacing: "-.016em", lineHeight: 1.3, marginBottom: 16,
      } as React.CSSProperties}>
        Pour les vêtements, accessoires et parfums, tu te retrouves le plus dans…
      </h2>
      <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 14 }}>
        Plusieurs réponses possibles
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
        {STYLE_OPTIONS.map(opt => {
          const active = style.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleStyle(opt.value)}
              style={{
                padding: "10px 16px",
                borderRadius: 40,
                border: active
                  ? "1.5px solid var(--pine)"
                  : "0.5px solid var(--line)",
                background: active
                  ? "rgba(23,62,49,.07)"
                  : "var(--white)",
                fontSize: 13, fontWeight: active ? 400 : 300,
                color: active ? "var(--pine)" : "var(--ink-2)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={!grammatical || saving}
        style={{
          width: "100%", padding: "14px 20px",
          borderRadius: 12, border: "none",
          background: grammatical ? "var(--pine)" : "var(--line)",
          fontSize: 14, fontWeight: 400,
          color: grammatical ? "var(--canvas)" : "var(--ink-3)",
          cursor: grammatical ? "pointer" : "not-allowed",
          transition: "background 0.15s",
        }}
      >
        {saving ? "Enregistrement…" : "Continuer"}
      </button>
    </div>
  );
}
