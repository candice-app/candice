"use client";

import { useState } from "react";
import Link from "next/link";

export interface SituationRow {
  id: string;
  reformulated_text: string | null;
  category: string | null;
  tonality: string | null;
  emotional_intensity: string | null;
  probable_needs: string[] | null;
  created_at: string;
}

const TONALITY_CHIP: Record<string, string> = {
  fragile: "Période fragile",
  tendue:  "Période tendue",
  positive:"Moment positif",
  neutre:  "Situation neutre",
};

const CATEGORY_FR: Record<string, string> = {
  travail:  "Travail",
  santé:    "Santé",
  famille:  "Famille",
  couple:   "Couple",
  humeur:   "Humeur",
  finances: "Finances",
  deuil:    "Deuil",
  autre:    "Contexte",
};

const INTENSITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

interface Props {
  situations: SituationRow[];
  contactId: string;
  contactFirstName: string;
}

export default function SituationCard({ situations, contactId, contactFirstName }: Props) {
  const sorted = [...situations].sort((a, b) =>
    (INTENSITY_ORDER[b.emotional_intensity ?? "low"] ?? 1) -
    (INTENSITY_ORDER[a.emotional_intensity ?? "low"] ?? 1)
  );

  const visible = sorted.slice(0, 2);
  const rest = sorted.slice(2);
  const [showRest, setShowRest] = useState(false);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  async function doAction(id: string, action: "revalidate" | "resolve") {
    setLoading(prev => ({ ...prev, [id]: true }));
    await fetch("/api/memories/situation/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (action === "resolve") {
      setResolved(prev => new Set([...prev, id]));
    }
    setLoading(prev => ({ ...prev, [id]: false }));
  }

  const displayItems = showRest ? [...visible, ...rest] : visible;
  const activeItems = displayItems.filter(s => !resolved.has(s.id));

  if (activeItems.length === 0) return null;

  return (
    <div style={{ marginTop: 20, marginBottom: 4 }}>
      <p style={{
        fontSize: 10, fontWeight: 500,
        letterSpacing: ".22em", textTransform: "uppercase",
        color: "var(--ink-3)", marginBottom: 12,
      }}>
        Situation actuelle
      </p>

      {activeItems.map(sit => {
        const chips: string[] = [
          TONALITY_CHIP[sit.tonality ?? ""] ?? null,
          CATEGORY_FR[sit.category ?? ""] ?? null,
          ...(sit.probable_needs ?? []).slice(0, 1).map(n => n.charAt(0).toUpperCase() + n.slice(1)),
        ].filter(Boolean) as string[];

        return (
          <div key={sit.id} style={{
            padding: "16px 18px",
            borderRadius: 14,
            border: sit.tonality === "fragile" || sit.tonality === "tendue"
              ? "0.5px solid rgba(205,185,135,.35)"
              : "0.5px solid rgba(23,62,49,.12)",
            background: sit.tonality === "fragile" || sit.tonality === "tendue"
              ? "rgba(205,185,135,.06)"
              : "rgba(23,62,49,.03)",
            marginBottom: 10,
          }}>
            <p style={{
              fontSize: 14, fontWeight: 300, color: "var(--ink-2)",
              lineHeight: 1.65, marginBottom: chips.length ? 10 : 14,
            }}>
              {sit.reformulated_text}
            </p>

            {chips.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                {chips.map((chip, i) => (
                  <span key={i} style={{
                    fontSize: 11, fontWeight: 300,
                    padding: "3px 9px", borderRadius: 20,
                    background: "rgba(205,185,135,.1)",
                    border: "0.5px solid rgba(205,185,135,.28)",
                    color: "var(--ink-2)",
                  }}>
                    {chip}
                  </span>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                onClick={() => doAction(sit.id, "revalidate")}
                disabled={loading[sit.id]}
                style={{
                  padding: "7px 12px", borderRadius: 8,
                  border: "0.5px solid rgba(23,62,49,.18)",
                  background: "none",
                  fontSize: 11, fontWeight: 300, color: "var(--pine)",
                  cursor: "pointer",
                }}
              >
                Toujours d'actualité
              </button>
              <button
                onClick={() => doAction(sit.id, "resolve")}
                disabled={loading[sit.id]}
                style={{
                  padding: "7px 12px", borderRadius: 8,
                  border: "0.5px solid var(--line)",
                  background: "none",
                  fontSize: 11, fontWeight: 300, color: "var(--ink-3)",
                  cursor: "pointer",
                }}
              >
                Ce n'est plus valable
              </button>
              <Link
                href={`/parler-a-candice?contact=${contactId}&intention=attention`}
                style={{ textDecoration: "none" }}
              >
                <button style={{
                  padding: "7px 12px", borderRadius: 8,
                  border: "none",
                  background: "var(--pine)",
                  fontSize: 11, fontWeight: 400, color: "var(--canvas)",
                  cursor: "pointer",
                }}>
                  Trouver une attention
                </button>
              </Link>
            </div>
          </div>
        );
      })}

      {rest.length > 0 && !showRest && (
        <button
          onClick={() => setShowRest(true)}
          style={{
            fontSize: 12, fontWeight: 300, color: "var(--ink-3)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          Voir {rest.length} autre{rest.length > 1 ? "s" : ""} →
        </button>
      )}

      {/* spacer */}
      <div style={{ height: 4 }} />
    </div>
  );
}
