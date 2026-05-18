"use client";

import { useState, useEffect } from "react";

interface ProfileUpdate {
  id: string;
  contact_id: string | null;
  field_name: string;
  old_value: string | null;
  new_value: string;
  contacts?: { name: string; relationship: string } | null;
}

const FIELD_LABELS: Record<string, string> = {
  hobbies: "Loisirs",
  favorite_foods: "Plats préférés",
  conversation_topics: "Sujets de conversation",
  things_to_avoid: "À éviter",
  additional_notes: "Notes",
  gift_preference: "Préférence cadeaux",
};

export default function PendingProfileUpdates() {
  const [updates, setUpdates] = useState<ProfileUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile-updates/pending")
      .then(r => r.json())
      .then(d => setUpdates(d.updates ?? []))
      .finally(() => setLoading(false));
  }, []);

  const act = async (id: string, action: "apply" | "reject") => {
    setActing(id);
    try {
      await fetch(`/api/profile-updates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setUpdates(prev => prev.filter(u => u.id !== id));
    } finally {
      setActing(null);
    }
  };

  if (loading || updates.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--terra)", marginBottom: 12 }}>
        À confirmer
      </p>
      <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", marginBottom: 16, lineHeight: 1.6 }}>
        Candice a noté des informations lors de vos échanges. Souhaitez-vous les ajouter aux profils ?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {updates.map(u => (
          <div key={u.id} style={{ borderBottom: "0.5px solid var(--brd)", paddingBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 400, color: "var(--cond)", marginBottom: 2 }}>
              {u.contacts?.name ?? "Inconnu"} — {FIELD_LABELS[u.field_name] ?? u.field_name}
            </p>
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--con)", lineHeight: 1.5, marginBottom: 10 }}>
              {u.new_value}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => act(u.id, "apply")}
                disabled={acting === u.id}
                className="btn-primary"
                style={{ fontSize: 12, padding: "6px 14px" }}
              >
                {acting === u.id ? "…" : "Ajouter"}
              </button>
              <button
                onClick={() => act(u.id, "reject")}
                disabled={acting === u.id}
                className="btn-ghost"
                style={{ fontSize: 12, padding: "6px 14px" }}
              >
                Ignorer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
