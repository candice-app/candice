"use client";

import { useState } from "react";

export default function ManualTriggerButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const trigger = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cron/detect-and-generate/manual", { method: "POST" });
      const data = await res.json();
      setResult(`signals: ${data.signals_created ?? 0}, suggestions: ${data.suggestions_generated ?? 0}`);
    } catch {
      setResult("Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={trigger}
        disabled={loading}
        style={{
          fontSize: 11, color: "var(--cond)", background: "rgba(0,0,0,0.04)",
          border: "0.5px solid var(--brd)", borderRadius: 6, padding: "4px 10px", cursor: "pointer",
        }}
      >
        {loading ? "…" : "🔧 Déclencher la détection manuellement"}
      </button>
      {result && (
        <p style={{ fontSize: 10, color: "var(--cond)", marginTop: 4, fontFamily: "monospace" }}>{result}</p>
      )}
    </div>
  );
}
