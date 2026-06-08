"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  status: string;
  deletionScheduledAt: string | null;
}

export default function AbonnementActions({ status, deletionScheduledAt }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const call = async (url: string, body?: object) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res;
  };

  const handlePause = async () => {
    setLoading("pause");
    await call("/api/subscription/pause");
    setLoading(null);
    router.refresh();
  };

  const handleResume = async () => {
    setLoading("resume");
    await call("/api/subscription/resume");
    setLoading(null);
    router.refresh();
  };

  const handleCancelDeletion = async () => {
    setLoading("cancel-deletion");
    await call("/api/account/cancel-deletion");
    setLoading(null);
    router.refresh();
  };

  const handleDeleteSubmit = async () => {
    if (!password) return;
    setLoading("delete");
    setError(null);
    const res = await call("/api/account/delete", { password });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Une erreur est survenue.");
      setLoading(null);
      return;
    }
    setLoading(null);
    setShowDeleteConfirm(false);
    router.refresh();
  };

  void handlePause; // scaffolding — Phase 7 (Stripe)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Reprendre Candice */}
      {status === "paused" && (
        <button
          onClick={handleResume}
          disabled={loading === "resume"}
          className="btn-primary"
          style={{ width: "100%", fontSize: 13, opacity: loading === "resume" ? 0.6 : 1 }}
        >
          {loading === "resume" ? "Reprise…" : "Reprendre Candice"}
        </button>
      )}

      {/* Annuler la suppression */}
      {deletionScheduledAt && (
        <button
          onClick={handleCancelDeletion}
          disabled={loading === "cancel-deletion"}
          className="btn-ghost"
          style={{ width: "100%", textAlign: "left", fontSize: 13, color: "#4A7C59", opacity: loading === "cancel-deletion" ? 0.6 : 1 }}
        >
          {loading === "cancel-deletion" ? "Annulation…" : "Annuler la suppression"}
        </button>
      )}

      {/* Supprimer mon compte */}
      {!deletionScheduledAt && status !== "cancelled" && (
        <div style={{ paddingTop: 16, borderTop: "0.5px solid var(--brd)", marginTop: 8 }}>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ fontSize: 12, fontWeight: 300, color: "#E05252", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Supprimer mon compte
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px", background: "rgba(224,82,82,0.05)", border: "0.5px solid rgba(224,82,82,0.2)", borderRadius: "var(--r-sm)" }}>
              <p style={{ fontSize: 12, fontWeight: 400, color: "#E05252", margin: 0 }}>Confirmer la suppression</p>
              <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", lineHeight: 1.6, margin: 0 }}>
                Ton compte sera supprimé définitivement dans 30 jours. Entre ton mot de passe pour confirmer.
              </p>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe"
                style={{
                  padding: "10px 14px", fontSize: 13, fontWeight: 300,
                  border: "0.5px solid var(--brd)", borderRadius: "var(--r-sm)",
                  background: "var(--bg)", color: "var(--con)", outline: "none",
                }}
              />
              {error && <p style={{ fontSize: 11, color: "#E05252", margin: 0 }}>{error}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowDeleteConfirm(false); setPassword(""); setError(null); }} className="btn-ghost" style={{ fontSize: 12 }}>
                  Annuler
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  disabled={!password || loading === "delete"}
                  style={{
                    padding: "10px 18px", fontSize: 12, fontWeight: 400,
                    background: "#E05252", color: "#fff", border: "none",
                    borderRadius: "var(--r-sm)", cursor: "pointer",
                    opacity: (!password || loading === "delete") ? 0.5 : 1,
                  }}
                >
                  {loading === "delete" ? "Confirmation…" : "Confirmer la suppression"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
