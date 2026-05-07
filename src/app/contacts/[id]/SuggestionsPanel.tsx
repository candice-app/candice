"use client";

import { useState } from "react";
import { Suggestion } from "@/types";

const CATEGORY_LABEL: Record<string, string> = {
  quality_time: "Temps partagé",
  gift: "Cadeau",
  message: "Message",
  gesture: "Geste",
  activity: "Activité",
};

const CATEGORY_COLOR: Record<string, string> = {
  quality_time: "var(--terra)",
  gift: "#9A3556",
  message: "var(--terra)",
  gesture: "#4A7C59",
  activity: "#BA7517",
};

interface Props {
  contactId: string;
  contactName: string;
  initialSuggestions: Suggestion[] | null;
  generatedAt: string | null;
}

export default function SuggestionsPanel({ contactId, contactName, initialSuggestions, generatedAt }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(initialSuggestions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastGenerated, setLastGenerated] = useState<string | null>(generatedAt);

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible de générer les suggestions");
      setSuggestions(data.suggestions);
      setLastGenerated(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 400, color: "var(--con)" }}>Suggestions IA</h2>
        <button onClick={generate} disabled={loading} className="btn-primary" style={{ fontSize: 11, padding: "5px 12px" }}>
          {loading ? "Génération…" : suggestions ? "Actualiser" : `Générer pour ${contactName}`}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 11, color: "#E05252", marginBottom: 12 }}>{error}</p>
      )}

      {!suggestions && !loading && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>
            Cliquez sur « Générer » pour obtenir des idées d&apos;attention personnalisées pour {contactName}.
          </p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>
            Création d&apos;idées sur mesure pour {contactName}…
          </p>
        </div>
      )}

      {suggestions && !loading && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {suggestions.map((s, i) => {
              const color = CATEGORY_COLOR[s.category] ?? "var(--terra)";
              return (
                <div
                  key={i}
                  style={{
                    border: "0.5px solid var(--brd)",
                    borderLeft: `2px solid ${color}`,
                    borderRadius: "var(--r-sm)",
                    padding: "12px 14px",
                    background: "var(--br2)",
                  }}
                >
                  <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase", color, marginBottom: 4 }}>
                    {CATEGORY_LABEL[s.category] ?? s.category}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 4 }}>{s.title}</p>
                  <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5 }}>{s.description}</p>
                  {s.timing && (
                    <p style={{ fontSize: 10, fontWeight: 300, color: "var(--conf)", marginTop: 6 }}>{s.timing}</p>
                  )}
                </div>
              );
            })}
          </div>
          {lastGenerated && (
            <p style={{ fontSize: 10, fontWeight: 300, color: "var(--conf)", marginTop: 12, textAlign: "right" }}>
              Généré le {new Date(lastGenerated).toLocaleDateString("fr-FR")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
