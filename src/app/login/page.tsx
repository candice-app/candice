"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const BG = "#FAF7F2";
const WHITE = "#FFFFFF";
const TERRA = "#C47A4A";
const CON = "#2C1A0E";
const ERR = "#C44A4A";
const BORDER_INPUT = "#E8DFD6";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

const LABEL_STYLE: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 4,
  fontSize: 12, fontWeight: 500, letterSpacing: 1,
  textTransform: "uppercase",
  color: "rgba(44,26,14,0.65)",
  marginBottom: 8,
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("E-mail ou mot de passe incorrect.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: BG, fontFamily: DM }}>
      <style>{`
        .login-input {
          width: 100%; box-sizing: border-box;
          height: 52px; padding: 0 16px;
          font-size: 14px; font-weight: 300;
          background: ${WHITE}; border: 1px solid ${BORDER_INPUT};
          border-radius: 8px; color: ${CON};
          font-family: ${DM}; outline: none;
          transition: border-color 0.15s;
        }
        .login-input:focus { border-color: ${TERRA}; }
        .login-input::placeholder { color: rgba(44,26,14,0.3); }
        .login-btn:hover:not(:disabled) { opacity: 0.9; }
      `}</style>

      <header style={{ padding: "20px 24px", borderBottom: `0.5px solid rgba(44,26,14,0.08)` }}>
        <Link href="/" style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: 19, fontWeight: 400, color: CON, textDecoration: "none" }}>
          Candice
        </Link>
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          {/* Title */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: PLAYFAIR, fontStyle: "italic", fontSize: "clamp(28px, 5vw, 36px)", fontWeight: 400, color: CON, marginBottom: 8, lineHeight: 1.1 }}>
              Bon retour.
            </h1>
            <p style={{ fontSize: 16, fontWeight: 300, color: "#6B5F58", margin: 0 }}>
              Connectez-vous à votre compte
            </p>
          </div>

          {/* Card */}
          <form
            onSubmit={handleSubmit}
            style={{
              background: WHITE, borderRadius: 12,
              boxShadow: "0 4px 24px rgba(196,122,74,0.08)",
              padding: "clamp(24px, 5vw, 40px)",
              display: "flex", flexDirection: "column",
            }}
          >
            {error && (
              <div style={{ marginBottom: 24, padding: "12px 16px", background: "rgba(196,74,74,0.06)", borderRadius: 8, border: "1px solid rgba(196,74,74,0.18)" }}>
                <p style={{ fontSize: 13, color: ERR, margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <div style={LABEL_STYLE}><span>E-mail</span></div>
              <input
                id="email"
                className="login-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                autoComplete="email"
              />
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: 32 }}>
              <div style={LABEL_STYLE}><span>Mot de passe</span></div>
              <input
                id="password"
                className="login-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-btn"
              style={{
                width: "100%", height: 52,
                background: loading ? "rgba(196,122,74,0.7)" : TERRA,
                color: BG, border: "none", borderRadius: 8,
                fontSize: 16, fontWeight: 500,
                cursor: loading ? "default" : "pointer",
                fontFamily: DM, transition: "opacity 0.15s",
              }}
            >
              {loading ? "Connexion en cours…" : "Se connecter"}
            </button>
          </form>

          {/* Lien inscription */}
          <p style={{ textAlign: "center", fontSize: 15, fontWeight: 300, color: "rgba(44,26,14,0.75)", marginTop: 24 }}>
            Pas encore de compte ?{" "}
            <Link href="/register" style={{ color: TERRA, fontWeight: 500, textDecoration: "underline" }}>
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
