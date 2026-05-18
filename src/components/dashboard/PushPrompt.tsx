"use client";

import { useState, useEffect } from "react";
import { useWebPush } from "@/hooks/useWebPush";

const DISMISSED_KEY = "push_prompt_dismissed";

export default function PushPrompt() {
  const { isSupported, isSubscribed, subscribe } = useWebPush();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupported || isSubscribed) return;
    try {
      if (!localStorage.getItem(DISMISSED_KEY)) setVisible(true);
    } catch {}
  }, [isSupported, isSubscribed]);

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch {}
    setVisible(false);
  };

  const activate = async () => {
    setLoading(true);
    const ok = await subscribe();
    setLoading(false);
    if (ok) setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      background: "var(--br)", border: "0.5px solid var(--brd)", borderRadius: "var(--r-md)",
      padding: "16px 18px", marginBottom: 20,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
    }}>
      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--con)", lineHeight: 1.5 }}>
        Active les notifications pour ne rien manquer.
      </p>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button
          className="btn-primary"
          style={{ fontSize: 12, padding: "8px 16px" }}
          disabled={loading}
          onClick={activate}
        >
          {loading ? "…" : "Activer"}
        </button>
        <button
          onClick={dismiss}
          style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", background: "none", border: "none", cursor: "pointer" }}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
