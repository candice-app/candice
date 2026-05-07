"use client";

import { useState } from "react";
import ShareRequestModal from "@/components/ShareRequestModal";

interface ShareRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  created_at: string;
}

interface ActiveShare {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  reauth_at: string | null;
}

interface Props {
  pendingRequests: ShareRequest[];
  activeShares: ActiveShare[];
}

const AVATAR_COLORS = [
  "linear-gradient(135deg,#C47A4A,#8A4020)",
  "linear-gradient(135deg,#4A7C59,#2A5C39)",
  "linear-gradient(135deg,#534AB7,#3C3489)",
  "linear-gradient(135deg,#9A3556,#72243E)",
  "linear-gradient(135deg,#BA7517,#854F0B)",
];

function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: "28px 20px", border: "0.5px dashed var(--br3)", borderRadius: "var(--r-md)", textAlign: "center" }}>
      <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>{label}</p>
    </div>
  );
}

export default function SharingClient({ pendingRequests, activeShares }: Props) {
  const [pending, setPending] = useState(pendingRequests);
  const [active, setActive] = useState(activeShares);
  const [modalRequest, setModalRequest] = useState<ShareRequest | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleAccepted = (req: ShareRequest) => {
    setPending((p) => p.filter((r) => r.id !== req.id));
    setActive((a) => [...a, { ...req, reauth_at: new Date().toISOString() }]);
    setModalRequest(null);
  };

  const handleDeclined = (id: string) => {
    setPending((p) => p.filter((r) => r.id !== id));
    setModalRequest(null);
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    const res = await fetch("/api/sharing/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
    setRevoking(null);
    if (res.ok) setActive((a) => a.filter((s) => s.id !== id));
  };

  return (
    <>
      {modalRequest && (
        <ShareRequestModal
          requestId={modalRequest.id}
          requesterName={modalRequest.requester_name}
          requesterEmail={modalRequest.requester_email}
          onAccepted={() => handleAccepted(modalRequest)}
          onDeclined={() => handleDeclined(modalRequest.id)}
          onClose={() => setModalRequest(null)}
        />
      )}

      {/* Demandes reçues */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: 3, textTransform: "uppercase", color: "var(--cond)" }}>
            Demandes reçues
          </p>
          {pending.length > 0 && (
            <span className="badge badge-urgent">{pending.length}</span>
          )}
        </div>

        {pending.length === 0 ? (
          <EmptyState label="Aucune demande en attente." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pending.map((req) => (
              <div key={req.id} className="contact-row">
                <div className="contact-avatar" style={{ background: getColor(req.requester_name) }}>
                  {req.requester_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="contact-name">{req.requester_name}</p>
                  <p className="contact-meta">{req.requester_email}</p>
                </div>
                <button
                  onClick={() => setModalRequest(req)}
                  className="btn-primary"
                  style={{ fontSize: 11, padding: "6px 14px" }}
                >
                  Répondre
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accès accordés */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: 3, textTransform: "uppercase", color: "var(--cond)", marginBottom: 14 }}>
          Accès accordés
        </p>

        {active.length === 0 ? (
          <EmptyState label="Tu n'as accordé l'accès à personne pour l'instant." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {active.map((share) => (
              <div key={share.id} className="contact-row">
                <div className="contact-avatar" style={{ background: getColor(share.requester_name) }}>
                  {share.requester_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="contact-name">{share.requester_name}</p>
                  <p className="contact-meta">{share.requester_email}</p>
                </div>
                <button
                  onClick={() => handleRevoke(share.id)}
                  disabled={revoking === share.id}
                  className="btn-danger"
                  style={{ fontSize: 11, padding: "6px 12px" }}
                >
                  {revoking === share.id ? "…" : "Révoquer"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
