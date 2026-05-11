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
  const strength = result!.shared_points[0];
  const friction = result!.difference_zones[0];

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)" }}>Matching avec toi</p>
        <button onClick={generate} style={{ fontSize: 10, color: "var(--terra)", background: "none", border: "none", cursor: "pointer" }}>
          Actualiser
        </button>
      </div>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
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

      {/* Strength */}
      {strength && (
        <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: 11, color: "#4A7C59", flexShrink: 0, marginTop: 1 }}>✓</span>
          <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5 }}>{strength}</p>
        </div>
      )}

      {/* Friction */}
      {friction && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>{friction.emoji}</span>
          <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5 }}>{friction.description}</p>
        </div>
      )}
    </div>
  );
}
