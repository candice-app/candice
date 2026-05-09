"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const BG = "#FAF7F2";
const WHITE = "#FFFFFF";
const TERRA = "#C47A4A";
const CON = "#2C1A0E";
const COND = "#7A5E44";
const BORDER_INPUT = "#E8C4A0";
const BORDER_CARD = "rgba(44,26,14,0.1)";
const DM = "'DM Sans', 'Plus Jakarta Sans', sans-serif";

const LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 500, letterSpacing: 2,
  textTransform: "uppercase", color: COND,
  marginBottom: 6, display: "block",
};

const INPUT: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 12px", fontSize: 14, fontWeight: 300,
  background: BG, border: `1px solid ${BORDER_INPUT}`,
  borderRadius: 6, color: CON, fontFamily: DM,
  outline: "none",
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
      <header style={{ padding: "16px 24px", borderBottom: `0.5px solid ${BORDER_CARD}` }}>
        <Link href="/" style={{ fontSize: 15, fontWeight: 500, letterSpacing: 5, textTransform: "uppercase", color: CON, textDecoration: "none" }}>
          Candice
        </Link>
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 400, color: CON, marginBottom: 6 }}>Bon retour.</h1>
            <p style={{ fontSize: 12, fontWeight: 300, color: COND }}>Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={handleSubmit} style={{ background: WHITE, border: `0.5px solid ${BORDER_CARD}`, borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {error && <p style={{ fontSize: 12, color: "#D04040", margin: 0 }}>{error}</p>}

            <div>
              <label htmlFor="email" style={LABEL}>E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                style={INPUT}
              />
            </div>

            <div>
              <label htmlFor="password" style={LABEL}>Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={INPUT}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", marginTop: 4, background: loading ? "#D4956A" : TERRA, color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 500, cursor: loading ? "default" : "pointer", fontFamily: DM }}
            >
              {loading ? "Connexion en cours…" : "Se connecter"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 300, color: COND, marginTop: 20 }}>
            Pas encore de compte ?{" "}
            <Link href="/register" style={{ color: TERRA, fontWeight: 400, textDecoration: "none" }}>
              En créer un
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
