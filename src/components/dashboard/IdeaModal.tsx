"use client";

import { useState } from "react";
import { Contact, QuestionnaireResponse } from "@/types";

interface Suggestion {
  title: string;
  description: string;
  category: string;
  estimated_price: string;
  why: string;
}

interface Props {
  contacts: (Contact & { questionnaire_responses: QuestionnaireResponse[] })[];
  onClose: () => void;
  initialContactId?: string;
}

const OCCASIONS = [
  { value: "birthday", label: "🎂 Anniversaire" },
  { value: "no_reason", label: "💛 Sans raison" },
  { value: "reconciliation", label: "🤝 Réconciliation" },
  { value: "congratulations", label: "🎉 Félicitations" },
  { value: "return_trip", label: "✈️ Retour de voyage" },
  { value: "illness", label: "🤒 Maladie" },
  { value: "other", label: "✨ Autre" },
];

const BUDGETS = [
  { value: "free", label: "Gratuit" },
  { value: "under_30", label: "Moins de 30€" },
  { value: "under_80", label: "Moins de 80€" },
  { value: "over_80", label: "Plus de 80€" },
];

const CATEGORY_ICON: Record<string, string> = {
  quality_time: "⏱",
  gift: "🎁",
  message: "💌",
  gesture: "🤍",
  activity: "🎯",
};

const PILL: React.CSSProperties = {
  border: "1px solid rgba(196,122,74,0.3)",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: 14,
  fontWeight: 300,
  cursor: "pointer",
  background: "transparent",
  color: "#1E1208",
  transition: "all 0.15s",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const PILL_SELECTED: React.CSSProperties = {
  ...PILL,
  background: "#C47A4A",
  borderColor: "#C47A4A",
  color: "#fff",
  fontWeight: 500,
};

const PLAYFAIR: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontWeight: 400,
};

export default function IdeaModal({ contacts, onClose, initialContactId }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | "results">(initialContactId ? 2 : 1);
  const [selectedContact, setSelectedContact] = useState<string>(initialContactId ?? "");
  const [selectedOccasion, setSelectedOccasion] = useState<string>("");
  const [occasionOther, setOccasionOther] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());

  const pct = step === 1 ? 33 : step === 2 ? 66 : step === "results" ? 100 : 100;

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/idea-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContact,
          occasion: selectedOccasion === "other" ? occasionOther : selectedOccasion,
          budget: selectedBudget,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSuggestions(data.suggestions);
      setStep("results");
    } catch {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  const contact = contacts.find((c) => c.id === selectedContact);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(30,18,8,0.75)" }} />

      {/* Modal */}
      <div style={{ position: "relative", background: "#FAF7F2", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 0", borderBottom: "0.5px solid rgba(196,122,74,0.15)", paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ ...PLAYFAIR, fontSize: 20, color: "#1E1208", margin: 0 }}>
              {step === 1 && "Pour qui ?"}
              {step === 2 && "À quelle occasion ?"}
              {step === 3 && "Quel budget ?"}
              {step === "results" && `Des idées pour ${contact?.name}`}
            </h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#A08060", lineHeight: 1, padding: "0 4px" }}>×</button>
          </div>
          {/* Progress bar */}
          {step !== "results" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                {[1, 2, 3].map((s) => (
                  <span key={s} style={{ fontSize: 11, fontWeight: 300, color: (step as number) >= s ? "#C47A4A" : "#A08060" }}>
                    {s === 1 ? "Proche" : s === 2 ? "Occasion" : "Budget"}
                  </span>
                ))}
              </div>
              <div style={{ height: 3, background: "rgba(196,122,74,0.15)", borderRadius: 2 }}>
                <div style={{ height: "100%", background: "#C47A4A", borderRadius: 2, width: `${pct}%`, transition: "width 0.3s" }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "20px 24px 24px" }}>

          {/* STEP 1 — Contact picker */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {contacts.length === 0 ? (
                <p style={{ fontSize: 14, fontWeight: 300, color: "#7A5E44", textAlign: "center", padding: "20px 0" }}>
                  Aucun proche ajouté pour l&apos;instant.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {contacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContact(c.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                        background: selectedContact === c.id ? "rgba(196,122,74,0.1)" : "#fff",
                        border: `1.5px solid ${selectedContact === c.id ? "#C47A4A" : "rgba(30,18,8,0.1)"}`,
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#2C1A0E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 500, color: "#FAF7F2", flexShrink: 0 }}>
                        {c.name[0].toUpperCase()}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 400, color: "#1E1208" }}>{c.name}</span>
                      {selectedContact === c.id && <span style={{ marginLeft: "auto", color: "#C47A4A", fontSize: 16 }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
              <button
                disabled={!selectedContact}
                onClick={() => setStep(2)}
                style={{ background: selectedContact ? "#C47A4A" : "rgba(196,122,74,0.3)", color: "#fff", border: "none", borderRadius: 6, padding: "13px", fontSize: 14, fontWeight: 500, cursor: selectedContact ? "pointer" : "default", marginTop: 4 }}
              >
                Continuer →
              </button>
            </div>
          )}

          {/* STEP 2 — Occasion */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {OCCASIONS.map((o) => (
                  <button key={o.value} onClick={() => setSelectedOccasion(o.value)}
                    style={selectedOccasion === o.value ? PILL_SELECTED : PILL}>
                    {o.label}
                  </button>
                ))}
              </div>
              {selectedOccasion === "other" && (
                <input
                  type="text"
                  value={occasionOther}
                  onChange={(e) => setOccasionOther(e.target.value)}
                  placeholder="Décris l'occasion…"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fff", border: "1px solid rgba(30,18,8,0.12)", borderRadius: 6, color: "#1E1208", fontSize: 14, padding: "10px 14px", width: "100%", outline: "none", boxSizing: "border-box" }}
                />
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(30,18,8,0.15)", color: "#7A5E44", borderRadius: 6, padding: "11px", fontSize: 13, cursor: "pointer" }}>
                  ← Retour
                </button>
                <button
                  disabled={!selectedOccasion || (selectedOccasion === "other" && !occasionOther.trim())}
                  onClick={() => setStep(3)}
                  style={{ flex: 2, background: selectedOccasion ? "#C47A4A" : "rgba(196,122,74,0.3)", color: "#fff", border: "none", borderRadius: 6, padding: "11px", fontSize: 14, fontWeight: 500, cursor: selectedOccasion ? "pointer" : "default" }}
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Budget */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {BUDGETS.map((b) => (
                  <button key={b.value} onClick={() => setSelectedBudget(b.value)}
                    style={selectedBudget === b.value ? { ...PILL_SELECTED, padding: "14px" } : { ...PILL, padding: "14px" }}>
                    {b.label}
                  </button>
                ))}
              </div>
              {error && <p style={{ fontSize: 12, color: "#E05252", textAlign: "center" }}>{error}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(30,18,8,0.15)", color: "#7A5E44", borderRadius: 6, padding: "11px", fontSize: 13, cursor: "pointer" }}>
                  ← Retour
                </button>
                <button
                  disabled={!selectedBudget || loading}
                  onClick={handleGenerate}
                  style={{ flex: 2, background: selectedBudget ? "#C47A4A" : "rgba(196,122,74,0.3)", color: "#fff", border: "none", borderRadius: 6, padding: "11px", fontSize: 14, fontWeight: 500, cursor: selectedBudget && !loading ? "pointer" : "default" }}
                >
                  {loading ? "Génération…" : "Trouver des idées ✦"}
                </button>
              </div>
            </div>
          )}

          {/* RESULTS */}
          {step === "results" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{ background: doneIds.has(i) ? "rgba(34,84,61,0.06)" : "#fff", border: `1px solid ${doneIds.has(i) ? "rgba(34,84,61,0.3)" : "rgba(196,122,74,0.2)"}`, borderRadius: 10, padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{CATEGORY_ICON[s.category] ?? "✨"}</span>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#1E1208", margin: 0 }}>{s.title}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#C47A4A", flexShrink: 0, background: "rgba(196,122,74,0.1)", padding: "2px 8px", borderRadius: 10 }}>
                      {s.estimated_price}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 300, color: "#4A3828", lineHeight: 1.6, margin: "0 0 8px" }}>{s.description}</p>
                  {s.why && (
                    <p style={{ fontSize: 12, fontWeight: 300, fontStyle: "italic", color: "#A08060", margin: "0 0 12px" }}>✦ {s.why}</p>
                  )}
                  <button
                    onClick={() => setDoneIds((prev) => new Set([...prev, i]))}
                    style={{ background: doneIds.has(i) ? "rgba(34,84,61,0.12)" : "#C47A4A", color: doneIds.has(i) ? "#22543D" : "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 500, cursor: doneIds.has(i) ? "default" : "pointer", width: "100%", transition: "all 0.2s" }}
                  >
                    {doneIds.has(i) ? "✓ Noté !" : "Je le fais ✓"}
                  </button>
                </div>
              ))}
              <button
                onClick={() => { setStep(1); setSelectedContact(""); setSelectedOccasion(""); setSelectedBudget(""); setSuggestions([]); setDoneIds(new Set()); }}
                style={{ background: "transparent", border: "1px solid rgba(196,122,74,0.3)", color: "#C47A4A", borderRadius: 6, padding: "10px", fontSize: 13, cursor: "pointer", marginTop: 4 }}
              >
                Nouvelle recherche
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
