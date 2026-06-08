"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DeleteStep = "idle" | "confirm1" | "confirm2";
type ConsentValue = "accepted" | "refused" | null;

const COOKIE_KEY = "cookie_consent";

export default function ConfidentialiteActions() {
  const router = useRouter();

  // ── Export ──────────────────────────────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSent, setExportSent] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    await fetch("/api/account/export", { method: "POST" }).catch(() => {});
    setExportLoading(false);
    setExportSent(true);
  };

  // ── Consentements ────────────────────────────────────────────────────────────
  const [consent, setConsent] = useState<ConsentValue>(null);

  useEffect(() => {
    setConsent(localStorage.getItem(COOKIE_KEY) as ConsentValue ?? null);
  }, []);

  const toggleConsent = () => {
    const next: ConsentValue = consent === "accepted" ? "refused" : "accepted";
    localStorage.setItem(COOKIE_KEY, next);
    setConsent(next);
  };

  // ── Suppression ──────────────────────────────────────────────────────────────
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("idle");
  const [password, setPassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!password) return;
    setDeleteLoading(true);
    setDeleteError(null);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setDeleteLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setDeleteError(data.error ?? "Une erreur est survenue.");
      return;
    }
    setDeleteStep("idle");
    router.refresh();
  };

  const resetDelete = () => {
    setDeleteStep("idle");
    setPassword("");
    setDeleteError(null);
  };

  // ── Styles partagés ──────────────────────────────────────────────────────────
  const rowStyle: React.CSSProperties = {
    padding: "20px 0",
    borderBottom: "0.5px solid var(--line)",
  };
  const titleStyle: React.CSSProperties = {
    fontSize: 15, fontWeight: 400, color: "var(--ink)", marginBottom: 4,
  };
  const descStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.6, marginBottom: 12,
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

      {/* ── Exporter mes données ── */}
      <div style={rowStyle}>
        <p style={titleStyle}>Exporter mes données</p>
        <p style={descStyle}>
          Reçois par email un fichier JSON contenant toutes tes données (profil, proches, confidences, historique).
        </p>
        <button
          onClick={handleExport}
          disabled={exportLoading || exportSent}
          style={{
            fontSize: 13, fontWeight: 400,
            color: exportSent ? "var(--ink-3)" : "var(--pine)",
            background: "none",
            border: `0.5px solid ${exportSent ? "var(--line)" : "rgba(23,62,49,.2)"}`,
            borderRadius: 20, padding: "8px 18px",
            cursor: (exportLoading || exportSent) ? "default" : "pointer",
            opacity: exportLoading ? 0.6 : 1,
          }}
        >
          {exportLoading ? "Préparation…" : exportSent ? "Export envoyé par email ✓" : "Recevoir mon export (RGPD)"}
        </button>
      </div>

      {/* ── Gérer mes consentements ── */}
      <div style={rowStyle}>
        <p style={titleStyle}>Gérer mes consentements</p>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px",
          borderRadius: 10, border: "0.5px solid var(--line)",
          background: "rgba(253,253,251,.5)",
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink)", margin: 0 }}>
              Cookies analytiques
            </p>
            <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-3)", margin: "2px 0 0" }}>
              {consent === "accepted" ? "Acceptés" : consent === "refused" ? "Refusés" : "Non défini"}
            </p>
          </div>
          <button
            onClick={toggleConsent}
            style={{
              width: 44, height: 24, borderRadius: 12,
              background: consent === "accepted" ? "var(--pine)" : "var(--line)",
              border: "none", cursor: "pointer",
              position: "relative", flexShrink: 0,
              transition: "background 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: 3,
              left: consent === "accepted" ? 23 : 3,
              width: 18, height: 18, borderRadius: "50%",
              background: "var(--white)",
              transition: "left 0.2s",
            }} />
          </button>
        </div>
      </div>

      {/* ── Supprimer mon compte ── */}
      <div style={{ padding: "20px 0" }}>
        {deleteStep === "idle" && (
          <button
            onClick={() => setDeleteStep("confirm1")}
            style={{
              fontSize: 13, fontWeight: 300, color: "#E05252",
              background: "none", border: "none", cursor: "pointer",
              padding: 0, fontFamily: "var(--font-sans)",
            }}
          >
            Supprimer mon compte
          </button>
        )}

        {deleteStep === "confirm1" && (
          <div style={{
            padding: "16px", borderRadius: 10,
            background: "rgba(224,82,82,0.04)",
            border: "0.5px solid rgba(224,82,82,0.18)",
          }}>
            <p style={{ fontSize: 14, fontWeight: 400, color: "#E05252", marginBottom: 6 }}>
              Confirmer la suppression ?
            </p>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.6, marginBottom: 14 }}>
              Ton compte sera marqué pour suppression. Tu disposeras de 30 jours pour annuler.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={resetDelete} style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", background: "none", border: "0.5px solid var(--line)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                Annuler
              </button>
              <button
                onClick={() => setDeleteStep("confirm2")}
                style={{ fontSize: 13, fontWeight: 400, color: "#fff", background: "#E05252", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
              >
                Oui, continuer
              </button>
            </div>
          </div>
        )}

        {deleteStep === "confirm2" && (
          <div style={{
            padding: "16px", borderRadius: 10,
            background: "rgba(224,82,82,0.04)",
            border: "0.5px solid rgba(224,82,82,0.18)",
          }}>
            <p style={{ fontSize: 14, fontWeight: 400, color: "#E05252", marginBottom: 6 }}>
              Confirme avec ton mot de passe
            </p>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.6, marginBottom: 12 }}>
              Cette action programme la suppression définitive dans 30 jours.
            </p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe"
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            {deleteError && (
              <p style={{ fontSize: 12, color: "#E05252", marginBottom: 10 }}>{deleteError}</p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={resetDelete} style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", background: "none", border: "0.5px solid var(--line)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={!password || deleteLoading}
                style={{
                  flex: 1, fontSize: 13, fontWeight: 400, color: "#fff",
                  background: "#E05252", border: "none", borderRadius: 8,
                  padding: "8px 16px",
                  cursor: (!password || deleteLoading) ? "not-allowed" : "pointer",
                  opacity: (!password || deleteLoading) ? 0.5 : 1,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {deleteLoading ? "Confirmation…" : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
