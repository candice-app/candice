"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  contactId: string;
  hasAnalysis: boolean;
  existingConsent: { id: string; status: string } | null;
}

export default function ShareAnalysisButton({ contactId, hasAnalysis, existingConsent }: Props) {
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(existingConsent);
  const [error, setError] = useState("");

  // Active → show link + revoke
  if (consent?.status === "active") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(23,62,49,.06)", border: "0.5px solid rgba(23,62,49,.14)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--pine)", flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "var(--pine)", fontWeight: 500 }}>
            Analyse partagée — en attente de lecture
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href={`/contacts/partage/${consent.id}`}
            style={{
              flex: 1, display: "block", textAlign: "center",
              padding: "9px 14px", borderRadius: 10,
              background: "var(--pine)", color: "#fff",
              fontSize: 12.5, fontWeight: 500, textDecoration: "none",
            }}
          >
            Aperçu de la vue restreinte
          </Link>
          <RevokeButton consentId={consent.id} onRevoked={() => setConsent(null)} />
        </div>
      </div>
    );
  }

  // Pending → show waiting state + revoke
  if (consent?.status === "pending") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(205,185,135,.1)", border: "0.5px solid rgba(205,185,135,.3)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--champ)", flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "#7a6420", fontWeight: 500 }}>
            Demande envoyée — en attente de réponse
          </span>
        </div>
        <RevokeButton consentId={consent.id} onRevoked={() => setConsent(null)} label="Annuler la demande" />
      </div>
    );
  }

  // No consent or rejected/revoked → show share button
  async function handleShare() {
    if (!hasAnalysis || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/contacts/${contactId}/consent`, { method: "POST" });
      const d = await res.json() as { consentId?: string; error?: string };
      if (!res.ok) {
        setError(d.error ?? "Erreur lors du partage.");
        return;
      }
      setConsent({ id: d.consentId!, status: "pending" });
    } catch {
      setError("Problème de connexion. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p style={{ fontSize: 12, color: "#C44A4A", marginBottom: 8 }}>{error}</p>
      )}
      <button
        onClick={handleShare}
        disabled={!hasAnalysis || loading}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 10,
          background: hasAnalysis && !loading ? "var(--pine)" : "var(--line)",
          color: hasAnalysis && !loading ? "#fff" : "var(--ink3)",
          border: "none", fontWeight: 500, fontSize: 13,
          cursor: hasAnalysis && !loading ? "pointer" : "default",
          fontFamily: "var(--font-sans)",
        }}
      >
        {loading ? "Envoi…" : hasAnalysis ? "Partager mon analyse avec ce proche" : "Analyse pas encore disponible"}
      </button>
      {!hasAnalysis && (
        <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink3)", marginTop: 6, lineHeight: 1.5 }}>
          Candice génère l&apos;analyse après que le proche a rempli son profil.
        </p>
      )}
    </div>
  );
}

function RevokeButton({ consentId, onRevoked, label = "Révoquer le partage" }: { consentId: string; onRevoked: () => void; label?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    setLoading(true);
    try {
      await fetch(`/api/consent/${consentId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      onRevoked();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={loading}
      style={{
        padding: "9px 14px", borderRadius: 10,
        border: "0.5px solid var(--line)",
        background: "transparent", color: "var(--ink3)",
        fontSize: 12, fontWeight: 400,
        cursor: loading ? "default" : "pointer",
        fontFamily: "var(--font-sans)", whiteSpace: "nowrap",
      }}
    >
      {loading ? "…" : label}
    </button>
  );
}
