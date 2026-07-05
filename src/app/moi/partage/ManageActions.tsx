"use client";

// B.2 Phase 7 — actions de gestion : Y révoque un partage accordé,
// Y annule un lien pas encore utilisé. Confirmation en deux taps.

import { useState } from "react";
import { useRouter } from "next/navigation";

const btnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 12px",
  background: "none", border: "0.5px solid rgba(23,62,49,.2)", borderRadius: 20,
  fontSize: 12.5, fontWeight: 400, color: "var(--ink-2)", cursor: "pointer",
  fontFamily: "var(--font-sans)", flexShrink: 0,
};

const confirmStyle: React.CSSProperties = {
  ...btnStyle,
  border: "0.5px solid rgba(224,82,82,0.4)", color: "#E05252",
};

export function RevokeShareButton({ consentId, firstName }: { consentId: string; firstName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const revoke = async () => {
    setLoading(true);
    await fetch(`/api/profile-view/${consentId}/revoke`, { method: "POST" }).catch(() => {});
    router.refresh();
  };

  if (!confirming) {
    return <button onClick={() => setConfirming(true)} style={btnStyle}>Retirer</button>;
  }
  return (
    <button onClick={revoke} disabled={loading} style={{ ...confirmStyle, opacity: loading ? 0.6 : 1 }}>
      {loading ? "Retrait…" : `Confirmer — ${firstName} ne verra plus rien`}
    </button>
  );
}

export function RevokeLinkButton({ linkId }: { linkId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const revoke = async () => {
    setLoading(true);
    await fetch(`/api/share-link/${linkId}/revoke`, { method: "POST" }).catch(() => {});
    router.refresh();
  };

  if (!confirming) {
    return <button onClick={() => setConfirming(true)} style={btnStyle}>Annuler le lien</button>;
  }
  return (
    <button onClick={revoke} disabled={loading} style={{ ...confirmStyle, opacity: loading ? 0.6 : 1 }}>
      {loading ? "Annulation…" : "Confirmer l'annulation"}
    </button>
  );
}
