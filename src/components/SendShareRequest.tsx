"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Props {
  profileOwnerId: string;
}

export default function SendShareRequest({ profileOwnerId }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "already" | "error">("idle");

  const send = async () => {
    setStatus("loading");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus("error"); return; }
    if (user.id === profileOwnerId) { setStatus("error"); return; }

    const { error } = await supabase
      .from("profile_share_requests")
      .insert({ requester_id: user.id, profile_owner_id: profileOwnerId });

    if (error) {
      setStatus(error.code === "23505" ? "already" : "error");
      return;
    }
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--green)" }}>
        ✓ Demande envoyée. Tu seras notifié(e) quand elle sera acceptée.
      </p>
    );
  }

  if (status === "already") {
    return (
      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)" }}>
        Une demande est déjà en attente.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
      <button onClick={send} disabled={status === "loading"} className="btn-primary">
        {status === "loading" ? "Envoi…" : "Demander l'accès à ce profil"}
      </button>
      {status === "error" && (
        <p style={{ fontSize: 11, color: "#E05252" }}>Une erreur est survenue.</p>
      )}
    </div>
  );
}
