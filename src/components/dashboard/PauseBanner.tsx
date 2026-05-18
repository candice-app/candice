"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PauseBanner() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleResume = async () => {
    setLoading(true);
    await fetch("/api/subscription/resume", { method: "POST" });
    router.refresh();
  };

  return (
    <div style={{
      marginBottom: 20, padding: "14px 18px",
      background: "var(--br3)", border: "0.5px solid var(--brd)",
      borderRadius: "var(--r-md)",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>
        Candice est en pause. Reprends quand tu veux.
      </p>
      <button
        onClick={handleResume}
        disabled={loading}
        className="btn-ghost"
        style={{ fontSize: 11, flexShrink: 0 }}
      >
        {loading ? "…" : "Reprendre"}
      </button>
    </div>
  );
}
