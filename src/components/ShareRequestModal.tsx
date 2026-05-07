"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Props {
  requestId: string;
  requesterName: string;
  requesterEmail: string;
  onAccepted: () => void;
  onDeclined: () => void;
  onClose: () => void;
}

export default function ShareRequestModal({
  requestId,
  requesterName,
  requesterEmail,
  onAccepted,
  onDeclined,
  onClose,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleReauth = async () => {
    setLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setError("Impossible de récupérer ton compte."); setLoading(false); return; }
    const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password });
    setLoading(false);
    if (authError) { setError("Mot de passe incorrect."); return; }
    setStep(3);
  };

  const handleAccept = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/sharing/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action: "accept" }),
    });
    setLoading(false);
    if (!res.ok) { setError("Une erreur est survenue."); return; }
    onAccepted();
  };

  const handleDecline = async () => {
    setLoading(true);
    await fetch("/api/sharing/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action: "decline" }),
    });
    setLoading(false);
    onDeclined();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {/* Step indicator */}
        <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 3, textTransform: "uppercase", color: "var(--cond)", marginBottom: 20 }}>
          Étape {step} / 3
        </p>

        {/* Step 1 — Confirmation visuelle */}
        {step === 1 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#C47A4A,#8A4020)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 500, color: "#fff", flexShrink: 0 }}>
                {requesterName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 400, color: "var(--con)" }}>{requesterName}</p>
                <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)" }}>{requesterEmail}</p>
              </div>
            </div>
            <h2 className="modal-title">Demande d&apos;accès à ta fiche</h2>
            <p className="modal-body">
              Cette personne souhaite consulter ton profil psychologique et tes préférences. Tu peux accepter ou refuser.
            </p>
            <div className="modal-actions">
              <button onClick={handleDecline} disabled={loading} className="btn-danger">
                Refuser
              </button>
              <button onClick={() => setStep(2)} className="btn-primary">
                Continuer →
              </button>
            </div>
          </>
        )}

        {/* Step 2 — Mot de passe */}
        {step === 2 && (
          <>
            <h2 className="modal-title">Confirme ton identité</h2>
            <p className="modal-body">
              Saisis ton mot de passe pour protéger cette action.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && password && !loading && handleReauth()}
              placeholder="••••••••"
              autoFocus
              style={{ marginBottom: 12 }}
            />
            {error && (
              <p style={{ fontSize: 11, color: "#E05252", marginBottom: 12 }}>{error}</p>
            )}
            <div className="modal-actions">
              <button onClick={() => { setStep(1); setPassword(""); setError(""); }} className="btn-ghost">
                Retour
              </button>
              <button onClick={handleReauth} disabled={!password || loading} className="btn-primary">
                {loading ? "Vérification…" : "Vérifier →"}
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Confirmation finale */}
        {step === 3 && (
          <>
            <h2 className="modal-title">Identité confirmée</h2>
            <p className="modal-body">
              Confirmes-tu l&apos;accès à ta fiche pour{" "}
              <span style={{ color: "var(--con)", fontWeight: 400 }}>{requesterName}</span> ?
            </p>
            {error && (
              <p style={{ fontSize: 11, color: "#E05252", marginBottom: 12 }}>{error}</p>
            )}
            <div className="modal-actions">
              <button onClick={() => setStep(1)} className="btn-ghost">Annuler</button>
              <button onClick={handleAccept} disabled={loading} className="btn-primary">
                {loading ? "Enregistrement…" : "Accorder l'accès"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
