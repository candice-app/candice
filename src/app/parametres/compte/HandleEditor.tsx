"use client";

// B.2 Phase 6 — rattrapage @identifiant pour les comptes créés avant la
// migration 49 (et modification pour les autres). L'écriture passe par
// POST /api/handle (validation + unicité serveur).

import { useState } from "react";
import { normalizeHandle, handleFormatError } from "@/lib/handle";

export default function HandleEditor({ initialHandle }: { initialHandle: string | null }) {
  const [saved, setSaved] = useState(initialHandle);
  const [value, setValue] = useState(initialHandle ?? "");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    const normalized = normalizeHandle(value);
    const formatMsg = handleFormatError(normalized);
    if (formatMsg) { setError(formatMsg); return; }
    if (normalized === saved) { setEditing(false); setError(""); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/handle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: normalized }),
    }).catch(() => null);
    setLoading(false);
    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => ({})) as { error?: string } : {};
      setError(data.error ?? "Une erreur est survenue.");
      return;
    }
    setSaved(normalized);
    setValue(normalized);
    setEditing(false);
  };

  return (
    <div style={{ borderBottom: "0.5px solid var(--line)", padding: "16px 0" }}>
      <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 4 }}>
        Identifiant
      </p>

      {!editing ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {saved ? (
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)" }}>@{saved}</p>
          ) : (
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.5 }}>
              Pas encore d&apos;identifiant — il permet à tes proches de te trouver.
            </p>
          )}
          <button
            onClick={() => setEditing(true)}
            style={{
              fontSize: 13, fontWeight: 400, color: "var(--pine)",
              background: "none", border: "0.5px solid rgba(23,62,49,.2)",
              borderRadius: 20, padding: "8px 18px", cursor: "pointer",
              fontFamily: "var(--font-sans)", flexShrink: 0,
            }}
          >
            {saved ? "Modifier" : "Choisir"}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 14, fontWeight: 300, color: "var(--ink-3)", pointerEvents: "none",
            }}>@</span>
            <input
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value.toLowerCase()); if (error) setError(""); }}
              placeholder="alex.dupont"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              style={{
                padding: "10px 14px 10px 30px", fontSize: 14, fontWeight: 300,
                border: "0.5px solid rgba(23,62,49,.2)", borderRadius: 10,
                background: "var(--white)", color: "var(--ink)", outline: "none",
                fontFamily: "var(--font-sans)", width: "100%", boxSizing: "border-box",
              }}
            />
          </div>
          {error && <p style={{ fontSize: 12, color: "#C44A4A", marginBottom: 8 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setEditing(false); setValue(saved ?? ""); setError(""); }}
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
              onClick={save}
              disabled={loading}
              style={{
                fontSize: 13, fontWeight: 400, color: "#fff",
                background: "var(--pine)", border: "none", borderRadius: 8,
                padding: "8px 16px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                fontFamily: "var(--font-sans)",
              }}
            >
              {loading ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
