"use client";

// B.2 Phase 7 — X annule sa demande en attente (DELETE via policy
// viewer_cancel_own_pending_request, migration 50). Confirmation en 2 taps.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelRequestButton({ consentId }: { consentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const cancel = async () => {
    setLoading(true);
    await fetch(`/api/profile-view/${consentId}/cancel`, { method: "POST" }).catch(() => {});
    router.refresh();
  };

  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 12px",
    background: "none", border: "none", fontSize: 12.5, fontWeight: 400,
    cursor: "pointer", fontFamily: "var(--font-sans)", flexShrink: 0,
  };

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} style={{ ...base, color: "var(--ink-3)" }}>
        Annuler
      </button>
    );
  }
  return (
    <button onClick={cancel} disabled={loading} style={{ ...base, color: "#E05252", opacity: loading ? 0.6 : 1 }}>
      {loading ? "Annulation…" : "Confirmer l'annulation"}
    </button>
  );
}
