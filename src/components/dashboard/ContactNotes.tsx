"use client";

import { useState } from "react";
import { ProfileNote } from "@/types";

interface Props {
  contactId: string;
  contactName: string;
  initialNotes: ProfileNote[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function ContactNotes({ contactId, contactName, initialNotes }: Props) {
  const [notes, setNotes] = useState<ProfileNote[]>(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/profile-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: contactId, note: newNote.trim() }),
      });
      if (res.ok) {
        const optimistic: ProfileNote = {
          id: Date.now().toString(),
          contact_id: contactId,
          user_id: "",
          note: newNote.trim(),
          created_at: new Date().toISOString(),
        };
        setNotes(prev => [optimistic, ...prev].slice(0, 5));
        setNewNote("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder={`Tu as appris quelque chose sur ${contactName} ?`}
          style={{
            flex: 1,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            background: "var(--br)",
            border: "0.5px solid var(--brd)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: "var(--con)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={!newNote.trim() || loading}
          style={{
            background: newNote.trim() && !loading ? "var(--terra)" : "rgba(196,122,74,0.3)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 500,
            cursor: newNote.trim() && !loading ? "pointer" : "default",
            flexShrink: 0,
          }}
        >
          {loading ? "…" : "Noter"}
        </button>
      </form>

      {notes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {notes.map((n, i) => (
            <div
              key={n.id}
              style={{
                display: "flex",
                gap: 12,
                padding: "10px 0",
                borderBottom: i < notes.length - 1 ? "0.5px solid var(--brd)" : "none",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--terra)", flexShrink: 0, marginTop: 4 }} />
                {i < notes.length - 1 && <div style={{ width: 1, flex: 1, background: "var(--brd)" }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: i < notes.length - 1 ? 8 : 0 }}>
                <p style={{ fontSize: 13, fontWeight: 300, color: "var(--con)", lineHeight: 1.6, marginBottom: 4 }}>{n.note}</p>
                <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)" }}>{timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
