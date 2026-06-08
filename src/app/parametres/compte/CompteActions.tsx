"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function CompteActions() {
  const router = useRouter();
  const supabase = createClient();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChange = async () => {
    setError(null);
    setMessage(null);
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setMessage("Mot de passe mis à jour.");
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: 14, fontWeight: 300,
    border: "0.5px solid rgba(23,62,49,.2)",
    borderRadius: 10,
    background: "var(--white)",
    color: "var(--ink)",
    outline: "none",
    fontFamily: "var(--font-sans)",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Change password */}
      <div style={{ borderBottom: "0.5px solid var(--line)", padding: "16px 0" }}>
        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            style={{
              fontSize: 14, fontWeight: 300, color: "var(--ink-2)",
              background: "none", border: "none", cursor: "pointer",
              padding: 0, fontFamily: "var(--font-sans)", textAlign: "left",
            }}
          >
            Changer le mot de passe
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 400, color: "var(--ink)", marginBottom: 2 }}>
              Nouveau mot de passe
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="8 caractères minimum"
              style={inputStyle}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              style={inputStyle}
            />
            {error && <p style={{ fontSize: 12, color: "#E05252", margin: 0 }}>{error}</p>}
            {message && <p style={{ fontSize: 12, color: "#4A7C59", margin: 0 }}>{message}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowPasswordForm(false); setError(null); setNewPassword(""); setConfirmPassword(""); }}
                style={{
                  fontSize: 13, fontWeight: 300, color: "var(--ink-3)",
                  background: "none", border: "0.5px solid var(--line)",
                  borderRadius: 8, padding: "8px 16px", cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Annuler
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={loading || !newPassword || !confirmPassword}
                style={{
                  flex: 1, fontSize: 13, fontWeight: 400,
                  color: "var(--canvas)", background: "var(--pine)",
                  border: "none", borderRadius: 8, padding: "8px 16px",
                  cursor: (loading || !newPassword || !confirmPassword) ? "not-allowed" : "pointer",
                  opacity: (loading || !newPassword || !confirmPassword) ? 0.5 : 1,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {loading ? "Mise à jour…" : "Mettre à jour"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          fontSize: 14, fontWeight: 300, color: "var(--ink-2)",
          background: "none", border: "none", cursor: "pointer",
          padding: "16px 0", textAlign: "left",
          fontFamily: "var(--font-sans)",
          borderBottom: "0.5px solid var(--line)",
        }}
      >
        Se déconnecter
      </button>
    </div>
  );
}
