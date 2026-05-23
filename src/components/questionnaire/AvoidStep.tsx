"use client";

import { useState } from "react";
import type { LifestyleQuestion, LifestyleOption } from "@/lib/lifestyle/questions";
import VoiceButton from "./VoiceButton";

interface Props {
  q18Question: LifestyleQuestion;
  q19Question: LifestyleQuestion;
  onDone: (answers: Record<string, string>, q17Text: string) => void;
  initialAnswers?: Record<string, string>;
  initialQ17Text?: string;
}

function QHeader({ answeredCount, totalRequired }: { answeredCount: number; totalRequired: number }) {
  const progress = Math.round((answeredCount / totalRequired) * 100);
  return (
    <div className="q-header">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="q-logo">Candice<span className="q-logo-dot" /></span>
        <span className="q-idx">05 — 07</span>
      </div>
      <div className="q-bar-track">
        <div className="q-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 10 }}>
        Ce qu'il vaut mieux éviter
      </p>
    </div>
  );
}

function ChoiceSection({
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
      <div className="q-eyebrow">Ce qu'il vaut mieux éviter</div>
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

export default function AvoidStep({ q18Question, q19Question, onDone, initialAnswers, initialQ17Text }: Props) {
  const [q17Text, setQ17Text] = useState(initialQ17Text ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const [q17Focused, setQ17Focused] = useState(false);
  const [activeQId, setActiveQId] = useState<string | null>(null);

  const q18Selected = !!answers[q18Question.id];
  const q19Selected = !!answers[q19Question.id];
  const allAnswered = q18Selected && q19Selected;
  const answeredCount = (q18Selected ? 1 : 0) + (q19Selected ? 1 : 0);

  function select(questionId: string, optionId: string) {
    setActiveQId(questionId);
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <QHeader answeredCount={answeredCount} totalRequired={2} />

      <div style={{ padding: "26px 24px 140px" }}>

        {/* Q17 — texte libre optionnel */}
        <div className="q-section rest" style={{ opacity: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div className="q-eyebrow">En toutes lettres</div>
              <div className="q-prompt">Ce qu'il vaut mieux éviter avec moi…</div>
            </div>
            <VoiceButton onResult={v => setQ17Text(q17Text ? q17Text + " " + v : v)} currentValue={q17Text} />
          </div>
          <div className="q-helper">Aucune obligation — réponds instinctivement, ou laisse vide.</div>
          <textarea
            id="q17"
            value={q17Text}
            onChange={e => setQ17Text(e.target.value)}
            placeholder="ex. les surprises, les annulations de dernière minute, certaines blagues, le bruit, les espaces bondés…"
            rows={4}
            onFocus={() => setQ17Focused(true)}
            onBlur={() => setQ17Focused(false)}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: q17Focused ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
              background: "var(--white)",
              fontFamily: "var(--font-sans)",
              fontSize: 15, fontWeight: 300,
              color: "var(--ink)", lineHeight: 1.6,
              resize: "none", outline: "none",
              boxShadow: "0 2px 8px -3px rgba(23,62,49,.05)",
              transition: "border-color .22s",
              boxSizing: "border-box",
            } as React.CSSProperties}
          />
        </div>

        <ChoiceSection
          question={q18Question}
          selectedId={answers[q18Question.id] ?? null}
          onSelect={(optId) => select(q18Question.id, optId)}
          active={activeQId === q18Question.id}
        />

        <ChoiceSection
          question={q19Question}
          selectedId={answers[q19Question.id] ?? null}
          onSelect={(optId) => select(q19Question.id, optId)}
          active={activeQId === q19Question.id}
        />

      </div>

      <div className="q-footer">
        <button
          type="button"
          onClick={() => allAnswered && onDone(answers, q17Text)}
          className={`q-continue${allAnswered ? " ready" : ""}`}
        >
          <span>Continuer</span>
          <span className="q-arr">→</span>
        </button>
      </div>
    </div>
  );
}
