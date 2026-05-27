"use client";

import { useState } from "react";

interface Props {
  contactId: string;
  contactFirstName: string;
}

export default function InviteButton({ contactId, contactFirstName }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleInvite = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/invite/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      if (!res.ok) throw new Error("Failed");
      const { token } = await res.json() as { token: string };
      const url = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleInvite}
        disabled={loading}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          fontSize: 13,
          fontWeight: 300,
          color: loading ? "var(--txts)" : "var(--pine)",
          background: "none",
          border: "none",
          cursor: loading ? "default" : "pointer",
          textAlign: "left",
          opacity: loading ? 0.5 : 1,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path d="M10 2h4v4M14 2L8.5 7.5M7 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {loading ? "Génération…" : copied ? `Lien copié !` : error ? "Erreur — réessaie" : `Inviter ${contactFirstName} sur Candice`}
      </button>
    </>
  );
}
