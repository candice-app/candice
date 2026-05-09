"use client";

import { useState } from "react";
import { Contact, QuestionnaireResponse, ProfileNote } from "@/types";
import IdeaModal from "./IdeaModal";

interface Props {
  contacts: (Contact & { questionnaire_responses: QuestionnaireResponse[] })[];
  recentNote?: ProfileNote | null;
}

export default function CandiceInput({ contacts, recentNote }: Props) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [responseContactId, setResponseContactId] = useState<string | null>(null);
  const [showIdea, setShowIdea] = useState(false);
  const [ideaContactId, setIdeaContactId] = useState<string | null>(null);

  const recentContact = recentNote?.contact_id
    ? contacts.find(c => c.id === recentNote.contact_id)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || loading) return;
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/candice-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      setResponse(data.response ?? "Noté.");
      setResponseContactId(data.contact_id ?? null);
      setNote("");
    } catch {
      setResponse("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const openIdea = (cId: string) => {
    setIdeaContactId(cId);
    setShowIdea(true);
  };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        {/* Recent note card */}
        {recentNote && recentContact && !response && (
          <div style={{ background: "#F0E8DC", border: "0.5px solid rgba(196,122,74,0.25)", borderRadius: 10, padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 400, color: "#C47A4A", marginBottom: 4 }}>
                ✦ Tu m&apos;as parlé de {recentContact.name} récemment
              </p>
              <p style={{ fontSize: 13, fontWeight: 300, color: "#4A3828", fontStyle: "italic" }}>
                &ldquo;{recentNote.note.length > 80 ? recentNote.note.slice(0, 80) + "…" : recentNote.note}&rdquo;
              </p>
            </div>
            <button
              onClick={() => openIdea(recentContact.id)}
              style={{ background: "#C47A4A", color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", flexShrink: 0 }}
            >
              Voir des idées →
            </button>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Dis quelque chose à Candice…"
            style={{
              flex: 1,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: "#fff",
              border: "0.5px solid rgba(30,18,8,0.12)",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 300,
              color: "#1E1208",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!note.trim() || loading}
            style={{
              background: note.trim() && !loading ? "#C47A4A" : "rgba(196,122,74,0.3)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 18px",
              fontSize: 14,
              fontWeight: 500,
              cursor: note.trim() && !loading ? "pointer" : "default",
              flexShrink: 0,
            }}
          >
            {loading ? "…" : "→"}
          </button>
        </form>

        {/* Response */}
        {response && (
          <div style={{ marginTop: 8, background: "#F0E8DC", border: "0.5px solid rgba(196,122,74,0.25)", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 400, color: "#4A3828" }}>✦ {response}</p>
            {responseContactId && (
              <button
                onClick={() => openIdea(responseContactId)}
                style={{ background: "transparent", border: "1px solid rgba(196,122,74,0.4)", color: "#C47A4A", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer", flexShrink: 0 }}
              >
                Voir des idées →
              </button>
            )}
          </div>
        )}
      </div>

      {showIdea && (
        <IdeaModal
          contacts={contacts}
          initialContactId={ideaContactId ?? undefined}
          onClose={() => { setShowIdea(false); setIdeaContactId(null); }}
        />
      )}
    </>
  );
}
