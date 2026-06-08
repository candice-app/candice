"use client";
import { useState } from "react";

type State = "idle" | "sending" | "sent" | "complete" | "no_email";

export default function RelancerButton({
  contactId,
  procheName,
  inviteStatus = "confirmed",
  contactEmail,
}: {
  contactId: string;
  procheName: string;
  inviteStatus?: "pending" | "confirmed";
  contactEmail?: string | null;
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
      } else if (json.reason === "no_email") {
        setState("no_email");
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
        {inviteStatus === "pending"
          ? `Invitation renvoyée à ${procheName} ✓`
          : `Relance envoyée à ${procheName} ✓`}
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

  if (state === "no_email") {
    return (
      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", fontStyle: "italic" }}>
        Aucun email enregistré pour {procheName} — envoie le lien manuellement depuis la fiche.
      </p>
    );
  }

  // Don't show a relance button for "pending" when no email is available
  if (inviteStatus === "pending" && !contactEmail) return null;

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
      {state === "sending"
        ? "Envoi…"
        : inviteStatus === "pending"
          ? `Renvoyer l'invitation à ${procheName}`
          : `Relancer ${procheName}`}
    </button>
  );
}
