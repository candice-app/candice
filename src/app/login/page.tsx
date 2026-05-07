"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const SHORT_LABEL: React.CSSProperties = {
  fontSize: 10, fontWeight: 400, letterSpacing: 2,
  textTransform: "uppercase", color: "var(--cond)",
  marginBottom: 6, display: "block",
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--br)" }}>
      <header style={{ padding: "16px 24px", borderBottom: "0.5px solid var(--brd)" }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 400, color: "var(--iv)", textDecoration: "none", letterSpacing: -0.5 }}>
          candice
        </Link>
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 400, color: "var(--con)", marginBottom: 6 }}>Bon retour.</h1>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && <p style={{ fontSize: 12, color: "#E05252" }}>{error}</p>}

            <div>
              <label htmlFor="email" style={SHORT_LABEL}>E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="password" style={SHORT_LABEL}>Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: 4 }}>
              {loading ? "Connexion en cours…" : "Se connecter"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 300, color: "var(--cond)", marginTop: 20 }}>
            Pas encore de compte ?{" "}
            <Link href="/register" style={{ color: "var(--terra)", fontWeight: 400, textDecoration: "none" }}>
              En créer un
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
