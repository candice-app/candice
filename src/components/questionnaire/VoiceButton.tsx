"use client";

import { useState, useRef } from "react";

interface Props {
  onResult: (text: string) => void;
  currentValue?: string;
}

export default function VoiceButton({ onResult, currentValue = "" }: Props) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(false);
  const recRef = useRef<unknown>(null);

  function toggle() {
    if (recording) {
      (recRef.current as { stop: () => void } | null)?.stop();
      setRecording(false);
      return;
    }

    setError(false);
    const w = window as unknown as Record<string, unknown>;
    const SR = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    }) | undefined;

    if (!SR) { setError(true); return; }

    const rec = new SR();
    rec.lang = "fr-FR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = (e.results[0] as ArrayLike<{ transcript: string }>)[0].transcript;
      onResult(currentValue ? currentValue + " " + transcript : transcript);
    };
    rec.onerror = () => { setError(true); setRecording(false); };
    rec.onend = () => setRecording(false);

    recRef.current = rec;
    rec.start();
    setRecording(true);
  }

  const color = error ? "#B85C38" : "var(--pine)";

  return (
    <button
      type="button"
      onClick={toggle}
      title={recording ? "Arrêter" : "Dicter ta réponse"}
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        border: `1.5px solid ${color}`,
        background: recording ? "var(--pine)" : "transparent",
        color: recording ? "var(--canvas)" : color,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all .2s",
        animation: recording ? "life 1.8s ease-in-out infinite" : "none",
        WebkitTapHighlightColor: "transparent",
        outline: "none",
      } as React.CSSProperties}
    >
      {/* Mic SVG */}
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}
