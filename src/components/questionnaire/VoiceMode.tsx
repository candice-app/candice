"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { speak } from "@/lib/questionnaire/candice-speak";
import { listenOnce } from "@/lib/questionnaire/listen";

export interface VoiceQuestion {
  id: string;
  spoken: string;
  options: { value: string; label: string }[];
  max: number;
}

interface Props {
  questions: VoiceQuestion[];
  values: Record<string, string[]>;
  onUpdate: (field: string, values: string[]) => void;
  onClose: () => void;
}

type Phase = "speaking" | "listening" | "processing" | "confirmed" | "done";

export default function VoiceMode({ questions, values, onUpdate, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("speaking");
  const [transcript, setTranscript] = useState("");
  const [matched, setMatched] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const current = questions[index];

  const advance = useCallback(() => {
    if (index + 1 >= questions.length) {
      setPhase("done");
    } else {
      setIndex((i) => i + 1);
      setPhase("speaking");
      setTranscript("");
      setMatched([]);
      setError(null);
    }
  }, [index, questions.length]);

  useEffect(() => {
    if (phase !== "speaking" || !current || abortRef.current) return;
    speak(current.spoken).then(() => {
      if (!abortRef.current) setPhase("listening");
    });
  }, [phase, current]);

  useEffect(() => {
    if (phase !== "listening" || abortRef.current) return;
    listenOnce("fr-FR")
      .then(async (text) => {
        if (abortRef.current) return;
        setTranscript(text);
        setPhase("processing");

        const res = await fetch("/api/questionnaire/voice-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: current.spoken,
            spoken_text: text,
            options: current.options,
            max: current.max,
          }),
        });
        if (abortRef.current) return;
        const data = await res.json() as { matched: string[] };
        const next = Array.from(new Set([...values[current.id], ...(data.matched ?? [])])).slice(0, current.max);
        onUpdate(current.id, next);
        setMatched(data.matched ?? []);
        setPhase("confirmed");
        setTimeout(() => { if (!abortRef.current) advance(); }, 1800);
      })
      .catch(() => {
        if (!abortRef.current) {
          setError("Je n'ai pas bien entendu. Tape ou réessaie.");
          setPhase("listening");
        }
      });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    abortRef.current = false;
    return () => { abortRef.current = true; window.speechSynthesis?.cancel(); };
  }, []);

  if (phase === "done") {
    return (
      <div style={overlay}>
        <div style={card}>
          <p style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", fontWeight: 400, color: "var(--terra)", marginBottom: 12 }}>
            C&apos;est tout !
          </p>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--cond)", marginBottom: 28 }}>
            Tes réponses ont été enregistrées.
          </p>
          <button className="btn-primary" onClick={onClose} style={{ width: "100%", minHeight: 52 }}>
            Voir le formulaire
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay}>
      <div style={card}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>
            {index + 1} / {questions.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--cond)", padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Question */}
        <p style={{
          fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 400,
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: "italic", color: "var(--terra)",
          textAlign: "center", lineHeight: 1.4, marginBottom: 40,
        }}>
          {current?.spoken}
        </p>

        {/* Orb */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <div style={{
            width: 160, height: 160, borderRadius: "50%",
            background: phase === "listening"
              ? "radial-gradient(circle at 40% 35%, #E8A070, #C47A4A)"
              : phase === "processing"
              ? "radial-gradient(circle at 40% 35%, #d4956a, #a85f30)"
              : "radial-gradient(circle at 40% 35%, #f0c49a, #C47A4A)",
            boxShadow: phase === "listening"
              ? "0 0 0 16px rgba(196,122,74,0.15), 0 0 0 32px rgba(196,122,74,0.07)"
              : "0 8px 32px rgba(196,122,74,0.3)",
            animation: phase === "listening" ? "orbPulse 1.4s ease-in-out infinite" : "none",
            transition: "background 0.4s ease, box-shadow 0.4s ease",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 40 }}>
              {phase === "speaking" ? "💬" : phase === "listening" ? "🎙" : phase === "processing" ? "⏳" : "✓"}
            </span>
          </div>
        </div>

        {/* Status / transcript */}
        <div style={{ textAlign: "center", minHeight: 48 }}>
          {phase === "speaking" && (
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)" }}>Candice parle…</p>
          )}
          {phase === "listening" && (
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--terra)" }}>Je t&apos;écoute…</p>
          )}
          {phase === "processing" && transcript && (
            <p style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)", fontStyle: "italic" }}>&ldquo;{transcript}&rdquo;</p>
          )}
          {phase === "confirmed" && matched.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 300, color: "#4A7C59", marginBottom: 6 }}>Compris ✓</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {matched.map((v) => {
                  const opt = current?.options.find((o) => o.value === v);
                  return opt ? (
                    <span key={v} style={{ fontSize: 11, fontWeight: 400, color: "var(--terra)", background: "var(--t2)", border: "0.5px solid var(--t3)", padding: "3px 10px", borderRadius: 12 }}>
                      {opt.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
          {error && <p style={{ fontSize: 12, color: "#E05252" }}>{error}</p>}
        </div>

        {/* Skip */}
        {(phase === "listening" || phase === "confirmed") && (
          <button
            type="button"
            onClick={advance}
            style={{ marginTop: 24, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 300, color: "var(--cond)", display: "block", margin: "24px auto 0" }}
          >
            Passer →
          </button>
        )}
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 300,
  background: "rgba(250,247,242,0.97)",
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "20px",
};

const card: React.CSSProperties = {
  width: "100%", maxWidth: 480,
  background: "#FFFFFF", border: "1px solid #E8C4A0",
  borderRadius: 20, padding: "32px 28px",
  boxShadow: "0 16px 48px rgba(44,26,14,0.1)",
};
