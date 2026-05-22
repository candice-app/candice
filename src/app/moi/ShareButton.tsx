"use client";

import { useState, useEffect } from "react";

interface Props {
  userId: string;
  variant?: "icon" | "full";
}

export default function ShareButton({ userId, variant = "icon" }: Props) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/partage/${userId}`);
  }, [userId]);

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "full") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ border: "0.5px solid var(--champ-line)", borderRadius: 10, padding: "10px 14px", background: "var(--champ-soft)" }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
            Ton lien
          </p>
          <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-2)", fontFamily: "monospace", wordBreak: "break-all" }}>
            {url || "…"}
          </p>
        </div>
        <button onClick={copy} className="btn-primary" style={{ width: "100%" }}>
          {copied ? "Lien copié ✓" : "Copier le lien de partage"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={copy}
      className="btn-ghost"
      style={{ fontSize: 11, padding: "5px 12px", color: "var(--pine)", borderColor: "var(--champ-line)", flexShrink: 0 }}
    >
      {copied ? "Copié ✓" : "Partager ma fiche"}
    </button>
  );
}
