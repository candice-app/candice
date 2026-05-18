"use client";

import { useState } from "react";
import Link from "next/link";
import { AnalysisResult } from "@/types";

interface Props {
  contactId: string;
  userHasProfile: boolean;
}

export default function MatchingCard({ contactId, userHasProfile }: Props) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur de génération");
        return;
      }
      setResult(data.analysis);
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (!userHasProfile) {
    return (
      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 8 }}>Matching avec toi</p>
        <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", marginBottom: 12 }}>
          Remplis ta propre fiche pour débloquer le score de compatibilité.
        </p>
        <Link href="/moi/questionnaire">
          <button className="btn-primary" style={{ fontSize: 11, padding: "6px 14px" }}>Remplir ma fiche →</button>
        </Link>
      </div>
    );
  }

  if (error === "user_profile_missing") {
    return (
      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 8 }}>Matching avec toi</p>
        <Link href="/moi/questionnaire">
          <button className="btn-primary" style={{ fontSize: 11, padding: "6px 14px" }}>Remplir ma fiche →</button>
        </Link>
      </div>
    );
  }

  if (!result && !loading) {
    return (
      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 8 }}>Matching avec toi</p>
        <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", marginBottom: 12, lineHeight: 1.5 }}>
          Découvre ta compatibilité et 1 force + 1 friction dans cette relation.
        </p>
        {error && <p style={{ fontSize: 11, color: "#E05252", marginBottom: 8 }}>{error}</p>}
        <button onClick={generate} className="btn-primary" style={{ fontSize: 11, padding: "6px 14px" }}>
          Analyser →
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 8 }}>Matching avec toi</p>
        <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", fontStyle: "italic" }}>Analyse en cours…</p>
      </div>
    );
  }

  const score = result!.compatibility_score;

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)" }}>Matching avec toi</p>
        <button onClick={generate} style={{ fontSize: 10, color: "var(--terra)", background: "none", border: "none", cursor: "pointer" }}>
          Actualiser
        </button>
      </div>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <span style={{ fontSize: 40, fontWeight: 500, color: "var(--terra)", lineHeight: 1 }}>{score}</span>
        <div>
          <div style={{ width: 100, height: 4, background: "var(--brd)", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
            <div style={{ height: "100%", width: `${score}%`, background: "var(--terra)", borderRadius: 2 }} />
          </div>
          <p style={{ fontSize: 10, fontWeight: 300, color: "var(--cond)" }}>
            {score >= 80 ? "Excellente affinité" : score >= 60 ? "Bonne compatibilité" : score >= 40 ? "Profils complémentaires" : "Profils contrastés"}
          </p>
        </div>
      </div>

      {/* Shared points */}
      {result!.shared_points.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 16, color: "var(--terra)", margin: "0 0 10px" }}>Vos points communs</p>
          {result!.shared_points.map((point, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 10, color: "var(--terra)", flexShrink: 0, marginTop: 3 }}>✦</span>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5, margin: 0 }}>{point}</p>
            </div>
          ))}
        </div>
      )}

      {/* Difference zones */}
      {result!.difference_zones.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 16, color: "var(--terra)", margin: "0 0 10px" }}>Vos différences à connaître</p>
          {result!.difference_zones.map((zone, i) => (
            <div key={i} style={{ background: "var(--br)", boxShadow: "0 1px 4px rgba(44,26,14,0.07)", borderRadius: 8, padding: "12px 14px", marginBottom: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{zone.emoji}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--con)", margin: "0 0 4px" }}>{zone.title}</p>
                <p style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5, margin: 0 }}>{zone.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Communication tips */}
      {result!.communication_tips.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 16, color: "var(--terra)", margin: "0 0 10px" }}>Pour bien communiquer</p>
          {result!.communication_tips.map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--terra)", flexShrink: 0, minWidth: 16 }}>{i + 1}.</span>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5, margin: 0 }}>{tip}</p>
            </div>
          ))}
        </div>
      )}

      {/* Top things to do */}
      {result!.top_things_to_do.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 16, color: "var(--terra)", margin: "0 0 10px" }}>Pour faire plaisir</p>
          {result!.top_things_to_do.map((thing, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 11, color: "var(--green)", flexShrink: 0, marginTop: 2 }}>✓</span>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5, margin: 0 }}>{thing}</p>
            </div>
          ))}
        </div>
      )}

      {/* Things to avoid */}
      {result!.things_to_avoid.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: 16, color: "var(--terra)", margin: "0 0 10px" }}>À éviter</p>
          {result!.things_to_avoid.map((thing, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 12, color: "#9A3556", flexShrink: 0, marginTop: 1, opacity: 0.7 }}>⨯</span>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5, margin: 0 }}>{thing}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
