"use client";

import { useState, useRef } from "react";

export default function HeroInput() {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [response, setResponse] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!note.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/confidences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: note, input_mode: "text" }),
      });
      const data = await res.json() as { candice_response?: string };
      setResponse(data.candice_response ?? "Noté.");
      setNote("");
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
      const transcript = event.results[0][0].transcript as string;
      setNote(prev => prev ? prev + " " + transcript : transcript);
      setRecording(false);
      inputRef.current?.focus();
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);
  };

  if (response) {
    return (
      <div style={{
        marginTop: 24,
        padding: "14px 18px",
        borderRadius: 14,
        background: "rgba(255,255,255,.09)",
        border: "0.5px solid rgba(244,241,232,.18)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <p style={{ fontSize: 13.5, fontWeight: 300, color: "rgba(244,241,232,.88)", lineHeight: 1.6 }}>
          ✦ {response}
        </p>
        <button
          onClick={() => setResponse("")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(244,241,232,.5)", fontSize: 16, flexShrink: 0,
            padding: "0 4px",
          }}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24, display: "flex", gap: 8, alignItems: "center" }}>
      <input
        ref={inputRef}
        value={note}
        onChange={e => setNote(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
        placeholder="Dis quelque chose à Candice…"
        style={{
          flex: 1,
          background: "rgba(255,255,255,.07)",
          border: "0.5px solid rgba(244,241,232,.18)",
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 14, fontWeight: 300,
          color: "#FAF8F1",
          outline: "none",
          fontFamily: "var(--font-sans)",
        }}
      />

      {/* Vocal */}
      <button
        type="button"
        onClick={startVoice}
        disabled={recording || loading}
        aria-label="Dicter à Candice"
        style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: recording ? "rgba(205,185,135,.18)" : "rgba(255,255,255,.07)",
          border: recording ? "0.5px solid rgba(205,185,135,.4)" : "0.5px solid rgba(244,241,232,.18)",
          cursor: recording || loading ? "default" : "pointer",
          transition: "all 0.25s",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke={recording ? "var(--champ)" : "rgba(244,241,232,.6)"}
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </button>

      {/* Send */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!note.trim() || loading}
        style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: note.trim() && !loading ? "rgba(205,185,135,.28)" : "rgba(255,255,255,.06)",
          border: "0.5px solid rgba(244,241,232,.18)",
          cursor: note.trim() && !loading ? "pointer" : "default",
          color: note.trim() ? "#FAF8F1" : "rgba(244,241,232,.35)",
          fontSize: 17, transition: "all 0.2s",
        }}
      >
        {loading ? "…" : "→"}
      </button>
    </div>
  );
}
