"use client";

// Refonte Profil V2 — C3 STOP C : sheets d'ÉDITION DIRECTE des faits
// pratiques (pattern de la sheet mobilité). Plus aucun renvoi vers la page
// questionnaire legacy. Brut affiché UNIQUEMENT ici (mode modification).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { T2 } from "./ui";
import { Sheet } from "./Sheet";
import type { ProfileV2Data } from "@/lib/profile/v2-data";

export type FactEditorKind = "adresse" | "tailles" | "alimentation" | "dates";

const REGIMES = [
  { id: "omnivore", label: "Omnivore" }, { id: "vegetarien", label: "Végétarien" },
  { id: "vegan", label: "Vegan" }, { id: "halal", label: "Halal" },
  { id: "casher", label: "Casher" }, { id: "sans_preference", label: "Sans préférence" },
  { id: "autre", label: "Autre" },
];
const ALCOOLS = [
  { id: "je_bois", label: "Je bois" }, { id: "ne_bois_pas", label: "Je n'en bois pas" },
  { id: "occasionnel", label: "Occasionnel" }, { id: "eviter_lieux", label: "Éviter les lieux centrés alcool" },
];
const DATE_TYPES = [
  { id: "anniversaire", label: "Anniversaire" }, { id: "fete", label: "Fête" },
  { id: "mariage", label: "Mariage" }, { id: "perso", label: "Date perso" },
  { id: "symbolique", label: "Date symbolique" },
];

const TITLES: Record<FactEditorKind, string> = {
  adresse: "Adresse de livraison",
  tailles: "Tailles",
  alimentation: "Alimentation",
  dates: "Dates clés",
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", minHeight: 48, padding: "0 14px",
  fontSize: 15, fontWeight: 300, background: "#fff",
  border: "1px solid rgba(23,62,49,.2)", borderRadius: 12, color: T2.ink,
  outline: "none", fontFamily: "var(--font-sans)",
};

function Pill({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      minHeight: 44, padding: "0 14px", borderRadius: 999, fontSize: 13.5,
      border: on ? `1.5px solid ${T2.pine}` : "1.5px solid rgba(23,62,49,.2)",
      background: on ? "rgba(23,62,49,.08)" : "#fff",
      color: on ? T2.pine : T2.ink2, fontWeight: on ? 600 : 400,
      cursor: "pointer", fontFamily: "var(--font-sans)",
    }}>
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: T2.ink3, margin: "16px 0 8px" }}>
      {children}
    </p>
  );
}

export default function FactEditor({
  kind,
  data,
  onClose,
}: {
  kind: FactEditorKind | null;
  data: ProfileV2Data;
  onClose: () => void;
}) {
  const router = useRouter();
  const pe = data.practicalEdit;
  const [adresse, setAdresse] = useState(pe.adresse_livraison);
  const [tv, setTv] = useState(pe.taille_vetements);
  const [tc, setTc] = useState(pe.taille_chaussures);
  const [regime, setRegime] = useState(pe.regime);
  const [alcool, setAlcool] = useState(pe.alcool);
  const [dates, setDates] = useState(pe.dates_importantes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    const body =
      kind === "adresse" ? { adresse_livraison: adresse }
      : kind === "tailles" ? { taille_vetements: tv, taille_chaussures: tc }
      : kind === "alimentation" ? { regime, alcool }
      : { dates_importantes: dates };
    const res = await fetch("/api/profile/practical", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    setSaving(false);
    if (!res || !res.ok) { setError("Une erreur est survenue. Réessaie."); return; }
    onClose();
    router.refresh();
  };

  const setDate = (i: number, patch: Partial<{ type: string; label: string; date: string }>) =>
    setDates(ds => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  return (
    <Sheet open={kind !== null} onClose={onClose} title={kind ? TITLES[kind] : ""}>
      {kind === "adresse" && (
        <>
          <Label>Adresse (visible par toi et Candice uniquement)</Label>
          <textarea
            value={adresse}
            onChange={e => setAdresse(e.target.value)}
            rows={3}
            placeholder="Numéro, rue, code postal, ville"
            style={{ ...inputStyle, padding: "12px 14px", resize: "vertical", lineHeight: 1.5 }}
          />
        </>
      )}

      {kind === "tailles" && (
        <>
          <Label>Vêtements</Label>
          <input value={tv} onChange={e => setTv(e.target.value)} placeholder="ex. 34 / XS-S" style={inputStyle} />
          <Label>Chaussures</Label>
          <input value={tc} onChange={e => setTc(e.target.value)} placeholder="ex. 37" style={inputStyle} />
        </>
      )}

      {kind === "alimentation" && (
        <>
          <Label>Régime alimentaire</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {REGIMES.map(r => (
              <Pill key={r.id} on={regime === r.id} onClick={() => setRegime(regime === r.id ? "" : r.id)}>{r.label}</Pill>
            ))}
          </div>
          <Label>Rapport à l&apos;alcool</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALCOOLS.map(a => (
              <Pill key={a.id} on={alcool === a.id} onClick={() => setAlcool(alcool === a.id ? "" : a.id)}>{a.label}</Pill>
            ))}
          </div>
        </>
      )}

      {kind === "dates" && (
        <>
          {dates.map((d, i) => (
            <div key={i} style={{
              border: `1px solid ${T2.line}`, borderRadius: 14, padding: "12px 12px 4px",
              marginBottom: 10, background: "#fff",
            }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {DATE_TYPES.map(t => (
                  <Pill key={t.id} on={d.type === t.id} onClick={() => setDate(i, { type: t.id })}>{t.label}</Pill>
                ))}
              </div>
              <input
                value={d.label}
                onChange={e => setDate(i, { label: e.target.value })}
                placeholder="Intitulé (ex. Anniversaire de Maman)"
                style={{ ...inputStyle, marginBottom: 10 }}
              />
              <input
                type="date"
                value={d.date ?? ""}
                onChange={e => setDate(i, { date: e.target.value })}
                style={{ ...inputStyle, marginBottom: 10 }}
              />
              <button
                onClick={() => setDates(ds => ds.filter((_, j) => j !== i))}
                style={{
                  minHeight: 44, background: "none", border: "none", cursor: "pointer",
                  fontSize: 12.5, color: "#E05252", padding: "0 2px", fontFamily: "var(--font-sans)",
                }}
              >
                Supprimer cette date
              </button>
            </div>
          ))}
          <button
            onClick={() => setDates(ds => [...ds, { type: "anniversaire", label: "", date: "" }])}
            style={{
              width: "100%", minHeight: 48, borderRadius: 12, border: `1.5px dashed rgba(23,62,49,.3)`,
              background: "none", color: T2.pine, fontSize: 13.5, fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--font-sans)", marginBottom: 4,
            }}
          >
            Ajouter une date
          </button>
        </>
      )}

      {error && <p style={{ fontSize: 13, color: "#C44A4A", margin: "10px 0 0" }}>{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        style={{
          width: "100%", minHeight: 50, borderRadius: 6, marginTop: 16,
          background: T2.pine, color: "#fff", border: "none",
          fontSize: 14.5, fontWeight: 600, cursor: saving ? "default" : "pointer",
          opacity: saving ? 0.6 : 1, fontFamily: "var(--font-sans)",
          boxShadow: "0 6px 16px rgba(23,62,49,.18)",
        }}
      >
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </Sheet>
  );
}
