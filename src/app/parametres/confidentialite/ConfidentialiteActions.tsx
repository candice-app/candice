"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type DeleteStep = "idle" | "confirm1" | "confirm2";
type ConsentValue = "accepted" | "refused" | null;

const COOKIE_KEY = "cookie_consent";

export default function ConfidentialiteActions() {
  const router = useRouter();

  // ── Export téléchargement direct ─────────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/account/export-download");
      if (!res.ok) throw new Error("Erreur serveur");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `candice-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — not worth crashing the page
    }
    setExportLoading(false);
  };

  // ── Consentements cookies ────────────────────────────────────────────────────
  const [consent, setConsent] = useState<ConsentValue>(null);

  useEffect(() => {
    setConsent(localStorage.getItem(COOKIE_KEY) as ConsentValue ?? null);
  }, []);

  const handleReopenCookies = () => {
    localStorage.removeItem(COOKIE_KEY);
    // Reload pour que CookieBanner (dans layout.tsx) réapparaisse
    window.location.reload();
  };

  // ── Visibilité dans la recherche (is_findable) ──────────────────────────────
  const [isFindable, setIsFindable] = useState<boolean | null>(null);
  const [findableLoading, setFindableLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("my_profile")
        .select("is_findable")
        .eq("user_id", data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          setIsFindable(profile?.is_findable ?? true);
        });
    });
  }, []);

  const handleToggleFindable = async () => {
    if (isFindable === null || findableLoading) return;
    setFindableLoading(true);
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setFindableLoading(false); return; }
    const newVal = !isFindable;
    await supabase.from("my_profile").update({ is_findable: newVal }).eq("user_id", data.user.id);
    setIsFindable(newVal);
    setFindableLoading(false);
  };

  // ── Suppression de compte ────────────────────────────────────────────────────
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

  // ── Styles ──────────────────────────────────────────────────────────────────
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
    padding: "10px 14px", fontSize: 14, fontWeight: 300,
    border: "0.5px solid rgba(23,62,49,.2)", borderRadius: 10,
    background: "var(--white)", color: "var(--ink)", outline: "none",
    fontFamily: "var(--font-sans)", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* ── Télécharger mes données ── */}
      <div style={rowStyle}>
        <p style={titleStyle}>Télécharger mes données</p>
        <p style={descStyle}>
          Génère un fichier JSON contenant toutes tes données (profil, proches, confidences, historique).
        </p>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          style={{
            fontSize: 13, fontWeight: 400, color: "var(--pine)",
            background: "none",
            border: "0.5px solid rgba(23,62,49,.2)",
            borderRadius: 20, padding: "8px 18px",
            cursor: exportLoading ? "not-allowed" : "pointer",
            opacity: exportLoading ? 0.6 : 1,
            fontFamily: "var(--font-sans)",
          }}
        >
          {exportLoading ? "Préparation…" : "Télécharger mes données"}
        </button>
      </div>

      {/* ── Gérer mes consentements ── */}
      <div style={rowStyle}>
        <p style={titleStyle}>Gérer mes consentements</p>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px", borderRadius: 10, border: "0.5px solid var(--line)",
          background: "rgba(253,253,251,.5)", marginBottom: 12,
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink)", margin: 0 }}>
              Cookies analytiques
            </p>
            <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-3)", margin: "2px 0 0" }}>
              {consent === "accepted" ? "Acceptés" : consent === "refused" ? "Refusés" : "Non défini"}
            </p>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase",
            color: consent === "accepted" ? "#4A7C59" : "var(--ink-3)",
            background: consent === "accepted" ? "rgba(74,124,89,.08)" : "var(--line)",
            padding: "3px 10px", borderRadius: 20,
          }}>
            {consent === "accepted" ? "Actif" : "Inactif"}
          </span>
        </div>
        <button
          onClick={handleReopenCookies}
          style={{
            fontSize: 13, fontWeight: 300, color: "var(--ink-2)",
            background: "none", border: "0.5px solid var(--line)",
            borderRadius: 20, padding: "8px 16px",
            cursor: "pointer", fontFamily: "var(--font-sans)",
          }}
        >
          Modifier mes préférences cookies
        </button>
      </div>

      {/* ── Visibilité dans la recherche ── */}
      <div style={rowStyle}>
        <p style={titleStyle}>Visibilité dans la recherche</p>
        <p style={descStyle}>
          Quand quelqu&rsquo;un saisit ton email ou ton numéro en ajoutant un proche, Candice peut indiquer que tu as déjà un compte — sans révéler d&rsquo;autre information. Tu peux désactiver cette option à tout moment.
        </p>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px", borderRadius: 10, border: "0.5px solid var(--line)",
          background: "rgba(253,253,251,.5)", marginBottom: 12,
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink)", margin: 0 }}>
              Trouvable par mes proches
            </p>
            <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-3)", margin: "2px 0 0" }}>
              {isFindable === null ? "Chargement…" : isFindable ? "Activé" : "Désactivé"}
            </p>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase",
            color: isFindable ? "#4A7C59" : "var(--ink-3)",
            background: isFindable ? "rgba(74,124,89,.08)" : "var(--line)",
            padding: "3px 10px", borderRadius: 20,
          }}>
            {isFindable ? "Actif" : "Inactif"}
          </span>
        </div>
        <button
          onClick={handleToggleFindable}
          disabled={isFindable === null || findableLoading}
          style={{
            fontSize: 13, fontWeight: 300, color: "var(--ink-2)",
            background: "none", border: "0.5px solid var(--line)",
            borderRadius: 20, padding: "8px 16px",
            cursor: (isFindable === null || findableLoading) ? "not-allowed" : "pointer",
            opacity: (isFindable === null || findableLoading) ? 0.5 : 1,
            fontFamily: "var(--font-sans)",
          }}
        >
          {findableLoading ? "Mise à jour…" : isFindable ? "Désactiver" : "Activer"}
        </button>
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
            {deleteError && <p style={{ fontSize: 12, color: "#E05252", marginBottom: 10 }}>{deleteError}</p>}
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
