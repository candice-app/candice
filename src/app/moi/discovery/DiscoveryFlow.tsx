"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextQuestionResult, DiscoveryQuestion, QuestionOption } from "@/lib/discovery/engine";

interface Props {
  initial: NextQuestionResult | null;
  mode: "quick" | "full";
}

// ── Chips question ────────────────────────────────────────────────────────────

function ChipsQuestion({
  question,
  onAnswer,
  onSkip,
  disabled,
}: {
  question: DiscoveryQuestion;
  onAnswer: (v: string[]) => void;
  onSkip: () => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const multi = question.question_type === "chips_multi";
  const options: QuestionOption[] = question.options ?? [];

  function toggle(val: string) {
    if (multi) {
      setSelected(prev =>
        prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
      );
    } else {
      setSelected([val]);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
        {options.map(opt => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              disabled={disabled}
              style={{
                padding: "12px 18px",
                borderRadius: 40,
                border: active
                  ? "1.5px solid var(--pine)"
                  : "0.5px solid var(--line)",
                background: active
                  ? "rgba(23,62,49,.08)"
                  : "var(--white)",
                fontSize: 14, fontWeight: active ? 400 : 300,
                color: active ? "var(--pine)" : "var(--ink-2)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <button
          onClick={onSkip}
          disabled={disabled}
          style={{
            padding: "12px 20px",
            borderRadius: 12,
            border: "0.5px solid var(--line)",
            background: "none",
            fontSize: 13, fontWeight: 300, color: "var(--ink-3)",
            cursor: "pointer",
          }}
        >
          Passer
        </button>
        <button
          onClick={() => { if (selected.length > 0) onAnswer(selected); }}
          disabled={disabled || selected.length === 0}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: 12,
            border: "none",
            background: selected.length > 0 ? "var(--pine)" : "var(--line)",
            fontSize: 14, fontWeight: 400,
            color: selected.length > 0 ? "var(--canvas)" : "var(--ink-3)",
            cursor: selected.length > 0 ? "pointer" : "not-allowed",
            transition: "background 0.15s",
          }}
        >
          Valider
        </button>
      </div>
    </div>
  );
}

// ── Text question ─────────────────────────────────────────────────────────────

function TextQuestion({
  question,
  onAnswer,
  onSkip,
  disabled,
}: {
  question: DiscoveryQuestion;
  onAnswer: (v: string) => void;
  onSkip: () => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  return (
    <div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Écris librement…"
        rows={4}
        disabled={disabled}
        style={{
          width: "100%", boxSizing: "border-box",
          marginTop: 20,
          padding: "14px 16px",
          border: "0.5px solid rgba(23,62,49,.2)",
          borderRadius: 14,
          background: "var(--white)",
          fontSize: 15, fontWeight: 300, color: "var(--ink)",
          lineHeight: 1.7, outline: "none", resize: "none",
          fontFamily: "var(--font-sans)",
        }}
        onKeyDown={e => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && value.trim()) {
            onAnswer(value.trim());
          }
        }}
      />
      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        <button
          onClick={onSkip}
          disabled={disabled}
          style={{
            padding: "12px 20px",
            borderRadius: 12,
            border: "0.5px solid var(--line)",
            background: "none",
            fontSize: 13, fontWeight: 300, color: "var(--ink-3)",
            cursor: "pointer",
          }}
        >
          Passer
        </button>
        <button
          onClick={() => { if (value.trim()) onAnswer(value.trim()); }}
          disabled={disabled || !value.trim()}
          className="btn-primary"
          style={{ flex: 1 }}
        >
          Valider
        </button>
      </div>
      <p style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 300, marginTop: 8, textAlign: "right" }}>
        ⌘↵ pour valider
      </p>
    </div>
  );
}

// ── Done state ────────────────────────────────────────────────────────────────

function DoneState({ mode }: { mode: "quick" | "full" }) {
  return (
    <div style={{ paddingTop: 60, paddingBottom: 40, textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "radial-gradient(130% 130% at 32% 24%, #1E4337 0%, #081710 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
      }}>
        <span style={{ fontSize: 22, color: "var(--canvas)" }}>✓</span>
      </div>
      <p style={{
        fontFamily: "var(--font-serif)",
        fontWeight: 300, fontSize: 24,
        color: "var(--ink)", letterSpacing: "-.016em",
        marginBottom: 12,
      } as React.CSSProperties}>
        {mode === "full" ? "C'est tout pour maintenant." : "Merci."}
      </p>
      <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.7, marginBottom: 32 }}>
        {mode === "full"
          ? "Candice met à jour ce qu'elle sait de toi."
          : "Candice a bien noté ça."}
      </p>
      <Link href="/moi" style={{ textDecoration: "none" }}>
        <button className="btn-primary">Voir mon profil →</button>
      </Link>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DiscoveryFlow({ initial, mode }: Props) {
  const [current, setCurrent] = useState<NextQuestionResult | null>(initial);
  const [done, setDone] = useState(initial === null);
  const [loading, setLoading] = useState(false);

  async function handleAnswer(answer: string | string[], skip = false) {
    if (!current || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/discovery/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: current.sessionId,
          questionKey: current.question.question_key,
          answer: skip ? null : answer,
          skip,
        }),
      });
      const data = await res.json() as { next: NextQuestionResult | null; done: boolean };
      if (data.done || !data.next) {
        setDone(true);
        setCurrent(null);
      } else {
        setCurrent(data.next);
      }
    } catch {
      // fallback: go to done state
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done || !current) return <DoneState mode={mode} />;

  const { question, sectionLabel, progress } = current;

  return (
    <div style={{ paddingTop: 40, paddingBottom: 40 }}>
      {/* Back */}
      <Link href="/moi" style={{ textDecoration: "none" }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300 }}>← Mon profil</span>
      </Link>

      {/* Progress (full mode only) */}
      {progress && (
        <div style={{ marginTop: 20, marginBottom: 4 }}>
          <p style={{
            fontSize: 10, fontWeight: 500,
            letterSpacing: ".22em", textTransform: "uppercase",
            color: "var(--pine)", marginBottom: 8,
          }}>
            {sectionLabel}
          </p>
          {/* Section indicator — no % */}
          <div style={{
            height: 2, borderRadius: 1,
            background: "var(--line)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${(progress.current / progress.total) * 100}%`,
              background: "var(--pine)",
              transition: "width 0.4s ease",
              borderRadius: 1,
            }} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-3)", marginTop: 5 }}>
            {progress.current} sur {progress.total}
          </p>
        </div>
      )}

      {/* Quick mode: section label */}
      {!progress && (
        <p style={{
          fontSize: 10, fontWeight: 500,
          letterSpacing: ".22em", textTransform: "uppercase",
          color: "var(--pine)", marginTop: 20,
        }}>
          {sectionLabel}
        </p>
      )}

      {/* Question */}
      <h2 style={{
        fontFamily: "var(--font-serif)",
        fontWeight: 300, fontSize: 26,
        color: "var(--ink)", letterSpacing: "-.018em",
        lineHeight: 1.25, marginTop: 14,
      } as React.CSSProperties}>
        {question.question_text}
      </h2>

      {/* Input */}
      {question.question_type === "text" ? (
        <TextQuestion
          question={question}
          onAnswer={v => handleAnswer(v)}
          onSkip={() => handleAnswer("", true)}
          disabled={loading}
        />
      ) : (
        <ChipsQuestion
          question={question}
          onAnswer={v => handleAnswer(v)}
          onSkip={() => handleAnswer([], true)}
          disabled={loading}
        />
      )}
    </div>
  );
}
