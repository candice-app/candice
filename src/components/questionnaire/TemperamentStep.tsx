"use client";

import { useState } from "react";
import type { TemperamentQuestion, TemperamentOption } from "@/lib/temperament/questions";

interface Props {
  questions: TemperamentQuestion[];
  stepNumber: 2 | 3;
  totalSteps: 7;
  onDone: (answers: Record<string, string>) => void;
}

function QHeader({ stepNumber, answeredCount, totalQuestions }: {
  stepNumber: number;
  answeredCount: number;
  totalQuestions: number;
}) {
  const progress = Math.round((answeredCount / totalQuestions) * 100);
  const stepLabel = stepNumber === 2 ? "Mon énergie relationnelle" : "Communication & décision";
  const stepIndex = stepNumber === 2 ? "02" : "03";

  return (
    <div className="q-header">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="q-logo">Candice<span className="q-logo-dot" /></span>
        <span className="q-idx">{stepIndex} — 07</span>
      </div>
      <div className="q-bar-track">
        <div className="q-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 10 }}>
        {stepLabel}
      </p>
    </div>
  );
}

function QuestionSection({
  question, selectedId, onSelect, active,
}: {
  question: TemperamentQuestion;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  active: boolean;
}) {
  const touched = !!selectedId;
  const stepLabel = question.step === 2 ? "Mon énergie relationnelle" : "Communication & décision";

  return (
    <div className={`q-section ${active ? "active" : "rest"}`}>
      <div className="q-eyebrow">{stepLabel}</div>
      <div className="q-prompt">{question.title}</div>
      <div className="q-helper">{question.micro}</div>
      <div className={`q-opts${touched ? " touched" : ""}`}>
        {question.options.map((opt: TemperamentOption) => {
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

export default function TemperamentStep({ questions, stepNumber, onDone }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQId, setActiveQId] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  function select(questionId: string, optionId: string) {
    setActiveQId(questionId);
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <QHeader stepNumber={stepNumber} answeredCount={answeredCount} totalQuestions={questions.length} />

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
