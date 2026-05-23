"use client";

import { useState } from "react";
import type { LifestyleQuestion, LifestyleOption } from "@/lib/lifestyle/questions";

interface Props {
  questions: LifestyleQuestion[];
  onDone: (answers: Record<string, string>) => void;
  initialAnswers?: Record<string, string>;
  onBack?: () => void;
  onExit?: () => void;
}

const qNavBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", padding: 0,
  fontSize: 11, letterSpacing: ".22em", color: "var(--ink-3)", fontWeight: 300,
  fontFamily: "var(--font-sans)", WebkitTapHighlightColor: "transparent",
};

function QHeader({ answeredCount, totalQuestions, onBack, onExit }: {
  answeredCount: number;
  totalQuestions: number;
  onBack?: () => void;
  onExit?: () => void;
}) {
  const progress = Math.round((answeredCount / totalQuestions) * 100);
  return (
    <div className="q-header">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="q-logo">Candice<span className="q-logo-dot" /></span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {onBack && <button type="button" onClick={onBack} style={qNavBtn}>← Retour</button>}
          <span className="q-idx">04 — 07</span>
          {onExit && <button type="button" onClick={onExit} style={qNavBtn}>Quitter ×</button>}
        </div>
      </div>
      <div className="q-bar-track">
        <div className="q-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 10 }}>
        Ce que j&apos;aime vivre
      </p>
    </div>
  );
}

function QuestionSection({
  question, selectedId, onSelect, active,
}: {
  question: LifestyleQuestion;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  active: boolean;
}) {
  const touched = !!selectedId;
  return (
    <div className={`q-section ${active ? "active" : "rest"}`}>
      <div className="q-eyebrow">Ce que j'aime vivre</div>
      <div className="q-prompt">{question.title}</div>
      <div className="q-helper">{question.micro}</div>
      <div className={`q-opts${touched ? " touched" : ""}`}>
        {question.options.map((opt: LifestyleOption) => {
          const isSelected = selectedId === opt.id;
          return (
            <div
              key={opt.id}
              className={`q-opt${isSelected ? " sel first" : ""}`}
              onClick={() => onSelect(opt.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(opt.id); }
              }}
            >
              <span className="q-node" />
              <div className="q-opt-t">{opt.label}</div>
              <div className="q-opt-s">{opt.subtext}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LifestyleStep({ questions, onDone, initialAnswers, onBack, onExit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const [activeQId, setActiveQId] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  function select(questionId: string, optionId: string) {
    setActiveQId(questionId);
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <QHeader answeredCount={answeredCount} totalQuestions={questions.length} onBack={onBack} onExit={onExit} />

      <div style={{ padding: "26px 24px 140px" }}>
        {questions.map((q) => (
          <QuestionSection
            key={q.id}
            question={q}
            selectedId={answers[q.id] ?? null}
            onSelect={(optId) => select(q.id, optId)}
            active={activeQId === q.id}
          />
        ))}
      </div>

      <div className="q-footer">
        <button
          type="button"
          onClick={() => allAnswered && onDone(answers)}
          className={`q-continue${allAnswered ? " ready" : ""}`}
        >
          <span>Continuer</span>
          <span className="q-arr">→</span>
        </button>
      </div>
    </div>
  );
}
