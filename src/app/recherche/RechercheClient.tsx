"use client";

// B.2 Phase 6 — moteur de recherche exact (Sens 1), côté client.
// Un seul champ : @identifiant OU email exact. Résultat anonyme (jamais de
// PII avant accord) → bouton « Demander à voir sa fiche ».

import { useState } from "react";
import { useRouter } from "next/navigation";

type Result =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "not_found" }
  | { state: "self" }
  | { state: "found"; userId: string }
  | { state: "already"; status: string; consentId: string }
  | { state: "sent" }
  | { state: "error"; message: string };

export default function RechercheClient() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result>({ state: "idle" });
  const [sending, setSending] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setResult({ state: "loading" });
    const res = await fetch("/api/profile-view/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.trim() }),
    }).catch(() => null);
    if (!res || !res.ok) {
      setResult({ state: "error", message: "Une erreur est survenue. Réessaie." });
      return;
    }
    const data = await res.json() as {
      found: boolean; self?: boolean; userId?: string;
      existing?: { consentId: string; status: string } | null;
    };
    if (data.self) { setResult({ state: "self" }); return; }
    if (!data.found || !data.userId) { setResult({ state: "not_found" }); return; }
    if (data.existing) {
      setResult({ state: "already", status: data.existing.status, consentId: data.existing.consentId });
      return;
    }
    setResult({ state: "found", userId: data.userId });
  };

  const sendRequest = async (userId: string) => {
    setSending(true);
    const res = await fetch("/api/profile-view/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId }),
    }).catch(() => null);
    setSending(false);
    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => ({})) as { error?: string } : {};
      setResult({ state: "error", message: data.error ?? "Une erreur est survenue." });
      return;
    }
    setResult({ state: "sent" });
    router.refresh();
  };

  const card: React.CSSProperties = {
    background: "#fff", border: "1px solid rgba(23,62,49,.11)", borderRadius: 16,
    padding: "15px 16px", marginTop: 12, boxShadow: "0 10px 30px rgba(23,62,49,.07)",
  };

  return (
    <div>
      <form onSubmit={search} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setResult({ state: "idle" }); }}
          placeholder="@identifiant ou email exact"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1, height: 48, padding: "0 16px", fontSize: 15, fontWeight: 300,
            background: "#fff", border: "1px solid rgba(23,62,49,.2)", borderRadius: 12,
            color: "var(--ink)", outline: "none", fontFamily: "var(--font-sans)",
            boxSizing: "border-box", minWidth: 0,
          }}
        />
        <button
          type="submit"
          disabled={result.state === "loading" || !query.trim()}
          style={{
            height: 48, padding: "0 18px", background: "var(--pine)", color: "#fff",
            border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600,
            cursor: result.state === "loading" ? "default" : "pointer",
            opacity: !query.trim() ? 0.5 : 1, fontFamily: "var(--font-sans)", flexShrink: 0,
          }}
        >
          {result.state === "loading" ? "…" : "Chercher"}
        </button>
      </form>

      {result.state === "not_found" && (
        <div style={card}>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
            Personne ne correspond à cette saisie exacte. Vérifie l&apos;identifiant ou
            l&apos;email — ou demande à la personne de te les redonner.
          </p>
        </div>
      )}

      {result.state === "self" && (
        <div style={card}>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
            C&apos;est toi. Ta fiche est dans l&apos;onglet « Ma fiche ».
          </p>
        </div>
      )}

      {result.state === "found" && (
        <div style={card}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>
            Cette personne est sur Candice.
          </p>
          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 14 }}>
            Elle recevra ta demande et choisira ce qu&apos;elle partage avec toi.
            Tu ne verras rien sans son accord.
          </p>
          <button
            onClick={() => sendRequest(result.userId)}
            disabled={sending}
            style={{
              display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 18px",
              background: "var(--pine)", color: "#fff", border: "none", borderRadius: 999,
              fontSize: 13.5, fontWeight: 600, cursor: sending ? "default" : "pointer",
              opacity: sending ? 0.7 : 1, fontFamily: "var(--font-sans)",
            }}
          >
            {sending ? "Envoi…" : "Demander à voir sa fiche →"}
          </button>
        </div>
      )}

      {result.state === "already" && (
        <div style={card}>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
            {result.status === "pending"
              ? "Ta demande est déjà envoyée — elle attend sa réponse."
              : "Cette fiche est déjà partagée avec toi."}
          </p>
        </div>
      )}

      {result.state === "sent" && (
        <div style={card}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--pine)", marginBottom: 4 }}>
            Demande envoyée.
          </p>
          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>
            La personne est prévenue. Dès qu&apos;elle répond, sa fiche apparaît ici.
          </p>
        </div>
      )}

      {result.state === "error" && (
        <div style={card}>
          <p style={{ fontSize: 13.5, color: "#C44A4A", lineHeight: 1.6 }}>{result.message}</p>
        </div>
      )}
    </div>
  );
}
