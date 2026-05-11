"use client";

import { useEffect, useState } from "react";

interface Props {
  insight: string;
  loading?: boolean;
  index: number;
}

export default function InsightCard({ insight, loading, index }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (!loading && !insight) return null;

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        borderLeft: "3px solid #C47A4A",
        background: "#FAF7F2",
        borderRadius: "0 8px 8px 0",
        padding: "14px 18px",
        marginTop: 8,
        marginBottom: 4,
      }}
    >
      <p style={{
        fontSize: 10, fontWeight: 500, letterSpacing: 3,
        textTransform: "uppercase", color: "#C47A4A", marginBottom: 6,
      }}>
        Candice · Insight {index + 1}
      </p>
      {loading ? (
        <p style={{ fontSize: 13, fontWeight: 300, color: "#7A5E44", fontStyle: "italic" }}>
          Candice analyse tes réponses…
        </p>
      ) : (
        <>
          <p style={{ fontSize: 13, fontWeight: 300, color: "#2C1A0E", lineHeight: 1.65 }}>
            {insight}
          </p>
          <p style={{ fontSize: 10, fontWeight: 300, color: "#C47A4A", marginTop: 8, textAlign: "right" }}>
            — Candice
          </p>
        </>
      )}
    </div>
  );
}

export function InsightsPanel({ insights, loadingInsight }: { insights: string[]; loadingInsight: boolean }) {
  if (insights.length === 0 && !loadingInsight) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "24px 0" }}>
      {insights.map((ins, i) => (
        <InsightCard key={i} insight={ins} index={i} />
      ))}
      {loadingInsight && <InsightCard insight="" loading index={insights.length} />}
    </div>
  );
}
