"use client";
import { useState } from "react";

type State = "idle" | "sending" | "sent" | "complete";

export default function RelancerButton({
  contactId,
  procheName,
}: {
  contactId: string;
  procheName: string;
}) {
  const [state, setState] = useState<State>("idle");

  async function handleRelancer() {
    setState("sending");
    try {
      const res = await fetch("/api/invite/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const json = await res.json() as { method?: string; reason?: string };
      if (json.reason === "already_complete") {
        setState("complete");
      } else {
        setState("sent");
      }
    } catch {
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", fontStyle: "italic" }}>
        Relance envoyée à {procheName} ✓
      </p>
    );
  }

  if (state === "complete") {
    return (
      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", fontStyle: "italic" }}>
        {procheName} a déjà terminé son profil ✓
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleRelancer}
      disabled={state === "sending"}
      style={{
        fontSize: 13,
        fontWeight: 400,
        color: "var(--pine)",
        background: "none",
        border: "0.5px solid rgba(23,62,49,.25)",
        borderRadius: 8,
        padding: "8px 16px",
        cursor: state === "sending" ? "default" : "pointer",
        opacity: state === "sending" ? 0.5 : 1,
      }}
    >
      {state === "sending" ? "Envoi…" : `Relancer ${procheName}`}
    </button>
  );
}
