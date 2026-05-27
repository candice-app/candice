"use client";
import { useState } from "react";

interface Props {
  questionId: string;
  question: string;
}

export default function ProactiveQuestion({ questionId, question }: Props) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (submitted) {
    return (
      <div style={{
        padding: "12px 16px",
        background: "rgba(23,62,49,.04)",
        borderRadius: 10,
        border: "0.5px solid rgba(23,62,49,.08)",
        marginBottom: 8,
      }}>
        <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", fontStyle: "italic" }}>
          Noté — Candice garde ça en tête.
        </p>
      </div>
    );
  }

  async function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitted(true);
    fetch("/api/recommendations/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, answer: answer.trim() }),
    }).catch(() => {});
  }

  return (
    <div style={{
      padding: "14px 16px",
      background: "rgba(23,62,49,.04)",
      borderRadius: 10,
      border: "0.5px solid rgba(23,62,49,.08)",
      marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
        <p style={{ flex: 1, fontSize: 14, fontWeight: 300, color: "var(--ink)", lineHeight: 1.55 }}>
          {question}
        </p>
        <button
          type="button"
          aria-label="Ignorer"
          onClick={() => setDismissed(true)}
          style={{ fontSize: 18, color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, lineHeight: 1, marginTop: -1 }}
        >
          ×
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Quelques mots suffisent…"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 300,
            color: "var(--ink)",
            background: "transparent",
            border: "none",
            borderBottom: "0.5px solid rgba(23,62,49,.2)",
            outline: "none",
            padding: "4px 0",
          }}
        />
        {answer.trim() && (
          <button
            type="button"
            onClick={handleSubmit}
            style={{ fontSize: 13, fontWeight: 400, color: "var(--pine)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}
