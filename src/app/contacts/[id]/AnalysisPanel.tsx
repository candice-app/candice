"use client";

import { useState } from "react";
import Link from "next/link";
import { AnalysisResult } from "@/types";

interface Props {
  contactId: string;
  userHasProfile: boolean;
}

function ScoreBar({ score }: { score: number }) {
  const label =
    score >= 80 ? "Excellente affinité"
    : score >= 60 ? "Bonne compatibilité"
    : score >= 40 ? "Profils complémentaires"
    : "Profils contrastés";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <span style={{ fontSize: 48, fontWeight: 500, color: "var(--terra)", lineHeight: 1 }}>
        {score}
      </span>
      <div>
        <div style={{ width: 140, height: 4, background: "var(--brd)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ height: "100%", width: `${score}%`, background: "var(--terra)", borderRadius: 2 }} />
        </div>
        <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)" }}>{label}</p>
      </div>
    </div>
  );
}

export default function AnalysisPanel({ contactId, userHasProfile }: Props) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [contactName, setContactName] = useState("");
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
        if (data.error === "user_profile_missing") {
          setError("user_profile_missing");
        } else if (data.error === "contact_profile_missing") {
          setError("contact_profile_missing");
        } else {
          setError(data.error ?? "Une erreur est survenue.");
        }
        return;
      }
      setAnalysis(data.analysis);
      setContactName(data.contactName);
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (!userHasProfile || error === "user_profile_missing") {
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 400, color: "var(--con)", marginBottom: 8 }}>
          Commence par ta propre fiche.
        </h3>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
          Pour générer une analyse relationnelle, Candice a besoin de connaître ton profil psychologique.
        </p>
        <Link href="/moi/questionnaire">
          <button className="btn-primary">Remplir ma fiche →</button>
        </Link>
      </div>
    );
  }

  if (error === "contact_profile_missing") {
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 400, color: "var(--con)", marginBottom: 8 }}>
          Profil incomplet.
        </h3>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", maxWidth: 280, margin: "0 auto" }}>
          Cette personne n&apos;a pas encore de profil psychologique. Complète le questionnaire d&apos;abord.
        </p>
      </div>
    );
  }

  if (!analysis && !loading) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 400, color: "var(--con)", marginBottom: 8 }}>
          Analyse relationnelle
        </h3>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
          Découvre ta compatibilité, vos points communs, et comment communiquer avec cette personne.
        </p>
        {error && <p style={{ fontSize: 11, color: "#E05252", marginBottom: 12 }}>{error}</p>}
        <button onClick={generate} className="btn-primary">
          Générer l&apos;analyse →
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>Analyse en cours…</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Score */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)" }}>Compatibilité</p>
          <button onClick={generate} style={{ fontSize: 11, fontWeight: 300, color: "var(--terra)", background: "none", border: "none", cursor: "pointer" }}>
            Actualiser
          </button>
        </div>
        <ScoreBar score={analysis!.compatibility_score} />
      </div>

      {/* Points communs */}
      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 12 }}>Points communs</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {analysis!.shared_points.map((point, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 11, color: "var(--green)", flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5 }}>{point}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zones de différence */}
      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 12 }}>Zones de différence</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {analysis!.difference_zones.map((zone, i) => (
            <div key={i} style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{zone.emoji}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 400, color: "var(--con)", marginBottom: 2 }}>{zone.title}</p>
                <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5 }}>{zone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conseils de communication */}
      <div className="card" style={{ background: "var(--br3)" }}>
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 12 }}>Conseils de communication</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {analysis!.communication_tips.map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: "var(--terra)", flexShrink: 0, marginTop: 2 }}>0{i + 1}</span>
              <span style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ce qui touche le plus */}
      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 12 }}>
          Ce qui touche le plus {contactName}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {analysis!.top_things_to_do.map((action, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: "var(--terra)", flexShrink: 0, marginTop: 2 }}>#{i + 1}</span>
              <span style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5 }}>{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* À éviter */}
      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 12 }}>À éviter</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {analysis!.things_to_avoid.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 11, color: "#E05252", flexShrink: 0, marginTop: 1 }}>✕</span>
              <span style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
