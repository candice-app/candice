"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConsentActions({ consentId }: { consentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState("");

  async function respond(action: "accept" | "reject") {
    setLoading(action);
    setError("");
    try {
      const res = await fetch(`/api/consent/${consentId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Une erreur s'est produite.");
        return;
      }
      router.refresh();
    } catch {
      setError("Problème de connexion. Réessaie dans un instant.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {error && (
        <p style={{ fontSize: 13, color: "#C44A4A", margin: 0 }}>{error}</p>
      )}
      <button
        onClick={() => respond("accept")}
        disabled={!!loading}
        style={{
          height: 50, borderRadius: 12, border: "none",
          background: loading === "accept" ? "rgba(23,62,49,.6)" : "var(--pine)",
          color: "#fff", fontWeight: 600, fontSize: 15,
          cursor: loading ? "default" : "pointer",
          fontFamily: "var(--font-sans)",
        }}
      >
        {loading === "accept" ? "En cours…" : "Oui, j'accepte de voir cette analyse"}
      </button>
      <button
        onClick={() => respond("reject")}
        disabled={!!loading}
        style={{
          height: 44, borderRadius: 12,
          border: "1px solid var(--line)",
          background: "transparent", color: "var(--ink2)",
          fontWeight: 400, fontSize: 14,
          cursor: loading ? "default" : "pointer",
          fontFamily: "var(--font-sans)",
        }}
      >
        {loading === "reject" ? "En cours…" : "Non, je préfère ne pas voir"}
      </button>
    </div>
  );
}
