"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function BetaForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/beta-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = from;
      } else {
        setError("Mot de passe incorrect.");
      }
    } catch {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF7F2",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "#C47A4A",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          candice
        </p>

        {/* Card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(196,122,74,0.2)",
            borderRadius: 14,
            padding: "36px 32px",
          }}
        >
          <h1
            style={{
              fontSize: 24,
              fontWeight: 400,
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#1E1208",
              textAlign: "center",
              marginBottom: 8,
              lineHeight: 1.3,
            }}
          >
            Accès bêta privé
          </h1>
          <p
            style={{
              fontSize: 13,
              fontWeight: 300,
              color: "#A08060",
              textAlign: "center",
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            Candice est en accès bêta fermé. Entre le mot de passe pour continuer.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoFocus
              required
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: "#FAF7F2",
                border: `1px solid ${error ? "rgba(224,82,82,0.5)" : "rgba(30,18,8,0.12)"}`,
                borderRadius: 6,
                color: "#1E1208",
                fontSize: 14,
                fontWeight: 300,
                padding: "12px 16px",
                width: "100%",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {error && (
              <p style={{ fontSize: 12, fontWeight: 300, color: "#E05252", textAlign: "center" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                background: "#C47A4A",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "13px 24px",
                fontSize: 14,
                fontWeight: 500,
                cursor: loading || !password ? "default" : "pointer",
                opacity: loading || !password ? 0.65 : 1,
                transition: "opacity 0.15s",
                letterSpacing: 0.2,
              }}
            >
              {loading ? "Vérification…" : "Accéder →"}
            </button>
          </form>
        </div>

        <p
          style={{
            fontSize: 11,
            fontWeight: 300,
            color: "#C4A882",
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Candice · Accès bêta privé
        </p>
      </div>
    </div>
  );
}

export default function BetaAccessPage() {
  return (
    <Suspense>
      <BetaForm />
    </Suspense>
  );
}
