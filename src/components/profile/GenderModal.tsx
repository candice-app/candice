"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

const GRAMMATICAL_OPTIONS = [
  { label: "Au féminin",                 value: "feminine" },
  { label: "Au masculin",                value: "masculine" },
  { label: "En neutre",                  value: "neutral" },
  { label: "Je préfère ne pas préciser", value: "unspecified" },
];

const STYLE_OPTIONS = [
  { label: "Les rayons femme",                  value: "femme" },
  { label: "Les rayons homme",                  value: "homme" },
  { label: "Les deux, selon les pièces",        value: "mixte" },
  { label: "Plutôt unisexe ou non genré",       value: "unisexe" },
  { label: "Ça dépend, mieux vaut me demander", value: "depends" },
];

interface Props {
  userId: string;
}

export default function GenderModal({ userId }: Props) {
  const [visible, setVisible] = useState(true);
  const [grammatical, setGrammatical] = useState<string | null>(null);
  const [style, setStyle] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  function toggleStyle(val: string) {
    setStyle(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  }

  async function handleSave() {
    if (!grammatical || saving) return;
    setSaving(true);
    await supabase.from("my_profile").update({
      grammatical_gender: grammatical,
      style_gender_orientation: style.length > 0 ? style : null,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
    fetch("/api/profile/generate", { method: "POST" }).catch(() => {});
    setSaving(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(6,14,10,.55)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0 0 env(safe-area-inset-bottom)",
    }}>
      <div style={{
        width: "100%", maxWidth: 540,
        background: "var(--canvas)",
        borderRadius: "20px 20px 0 0",
        padding: "28px 24px 36px",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <p style={{
            fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 20,
            color: "var(--ink)", letterSpacing: "-.014em", lineHeight: 1.3, maxWidth: "80%",
          } as React.CSSProperties}>
            Une dernière chose pour personnaliser ton expérience.
          </p>
          <button
            onClick={() => setVisible(false)}
            style={{ background: "none", border: "none", fontSize: 18, color: "var(--ink-3)", cursor: "pointer", padding: 4, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Q1 */}
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--ink)", marginBottom: 12 }}>
          Comment veux-tu que Candice s'adresse à toi&nbsp;?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 28 }}>
          {GRAMMATICAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setGrammatical(opt.value)}
              style={{
                padding: "11px 14px",
                borderRadius: 10,
                border: grammatical === opt.value
                  ? "1.5px solid var(--pine)"
                  : "0.5px solid var(--line)",
                background: grammatical === opt.value
                  ? "rgba(23,62,49,.07)"
                  : "var(--white)",
                fontSize: 13, fontWeight: grammatical === opt.value ? 400 : 300,
                color: grammatical === opt.value ? "var(--pine)" : "var(--ink-2)",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Q2 */}
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--ink)", marginBottom: 8 }}>
          Pour les vêtements, accessoires et parfums, tu te retrouves le plus dans…
        </p>
        <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-3)", marginBottom: 12 }}>Plusieurs réponses possibles</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 28 }}>
          {STYLE_OPTIONS.map(opt => {
            const active = style.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleStyle(opt.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 40,
                  border: active ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
                  background: active ? "rgba(23,62,49,.07)" : "var(--white)",
                  fontSize: 12, fontWeight: active ? 400 : 300,
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
            width: "100%", padding: "13px 20px",
            borderRadius: 12, border: "none",
            background: grammatical ? "var(--pine)" : "var(--line)",
            fontSize: 14, fontWeight: 400,
            color: grammatical ? "var(--canvas)" : "var(--ink-3)",
            cursor: grammatical ? "pointer" : "not-allowed",
            transition: "background 0.15s",
          }}
        >
          {saving ? "Enregistrement…" : "Enregistrer mes préférences"}
        </button>
      </div>
    </div>
  );
}
