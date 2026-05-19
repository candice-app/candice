"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  userId: string;
}

export default function ResumePrompt({ userId }: Props) {
  const [hasDraft, setHasDraft] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`candice_my_profile_draft_${userId}`);
      if (raw) {
        const d = JSON.parse(raw);
        const hasContent = Object.entries(d).some(
          ([k, v]) => k !== "savedAt" && (Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim().length > 0)
        );
        setHasDraft(hasContent);
      }
    } catch { /* ignore */ }
    setReady(true);
  }, [userId]);

  if (!ready) return null;

  if (!hasDraft) {
    return (
      <Link href="/moi/questionnaire">
        <button className="btn-primary">Remplir ma fiche →</button>
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
      <Link href="/moi/questionnaire" style={{ width: "100%", maxWidth: 280 }}>
        <button className="btn-primary" style={{ width: "100%" }}>
          Reprendre ma fiche →
        </button>
      </Link>
      <button
        onClick={() => {
          try { localStorage.removeItem(`candice_my_profile_draft_${userId}`); } catch { /* ignore */ }
          setHasDraft(false);
        }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 11, fontWeight: 300, color: "var(--cond)",
        }}
      >
        Recommencer à zéro
      </button>
    </div>
  );
}
