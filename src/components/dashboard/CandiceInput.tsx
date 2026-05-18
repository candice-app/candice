"use client";

import { useState, useRef } from "react";
import { Contact, QuestionnaireResponse, ProfileNote } from "@/types";
import IdeaModal from "./IdeaModal";

interface Props {
  contacts: (Contact & { questionnaire_responses: QuestionnaireResponse[] })[];
  recentNote?: ProfileNote | null;
}

export default function CandiceInput({ contacts, recentNote }: Props) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [response, setResponse] = useState("");
  const [responseContactId, setResponseContactId] = useState<string | null>(null);
  const [showIdea, setShowIdea] = useState(false);
  const [ideaContactId, setIdeaContactId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const recentContact = recentNote?.contact_id
    ? contacts.find(c => c.id === recentNote.contact_id)
    : null;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || loading) return;
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/confidences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: note, input_mode: "text" }),
      });
      const data = await res.json();
      setResponse(data.candice_response ?? "Noté.");
      setResponseContactId(data.contact_id ?? null);
      setNote("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch {
      setResponse("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any;
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    setRecording(true);
    recognition.start();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNote(prev => prev + (prev ? " " : "") + transcript);
      setRecording(false);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
        }
      }, 0);
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);
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
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <textarea
              ref={textareaRef}
              value={note}
              onChange={handleTextChange}
              rows={1}
              placeholder="Dis quelque chose à Candice…"
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: "#fff",
                border: "0.5px solid rgba(30,18,8,0.12)",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 300,
                color: "#1E1208",
                outline: "none",
                resize: "none",
                overflow: "hidden",
                minHeight: 48,
                maxHeight: 200,
                lineHeight: 1.5,
                display: "block",
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
            />
          </div>

          {/* Voice button */}
          <button
            type="button"
            onClick={startVoice}
            disabled={recording || loading}
            title="Dicter à Candice"
            style={{
              background: recording ? "rgba(196,122,74,0.15)" : "rgba(30,18,8,0.04)",
              border: recording ? "0.5px solid rgba(196,122,74,0.4)" : "0.5px solid rgba(30,18,8,0.1)",
              borderRadius: 8,
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: recording || loading ? "default" : "pointer",
              flexShrink: 0,
              transition: "all 0.2s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={recording ? "#C47A4A" : "rgba(30,18,8,0.35)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          {/* Send button */}
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
              height: 48,
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
