"use client";

import { useState } from "react";
import type { LifestyleQuestion, LifestyleOption } from "@/lib/lifestyle/questions";

interface Props {
  q18Question: LifestyleQuestion;
  q19Question: LifestyleQuestion;
  onDone: (answers: Record<string, string>, q17Text: string) => void;
}

function AvoidHero({
  answeredCount,
  totalRequired,
}: {
  answeredCount: number;
  totalRequired: number;
}) {
  const progress = Math.round((answeredCount / totalRequired) * 100);

  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "var(--pine-h2)",
      padding: "14px 22px 12px",
    }}>
      <p style={{
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: ".32em",
        textTransform: "uppercase",
        color: "rgba(205,185,135,.65)",
        marginBottom: 10,
      }}>
        Ce qu'il vaut mieux éviter
      </p>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
      }}>
        <span style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 300,
          fontSize: 17,
          letterSpacing: ".34em",
          textTransform: "uppercase",
          color: "#F6F3EA",
          paddingLeft: ".34em",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
        }}>
          CANDICE
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "var(--champ)",
            boxShadow: "0 0 7px 1px rgba(205,185,135,.5)",
            display: "inline-block",
            animation: "life 3.6s ease-in-out infinite",
          }} />
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 300,
          color: "rgba(205,185,135,.65)",
          letterSpacing: ".22em",
        }}>
          05 — 07
        </span>
      </div>

      <div style={{
        height: 1.5,
        background: "rgba(252,251,247,.12)",
        borderRadius: 2,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: "rgba(62,115,97,.9)",
          borderRadius: "0 2px 2px 0",
          transition: "width .55s cubic-bezier(.2,.7,.2,1)",
        }} />
      </div>
    </div>
  );
}

function OptionCard({
  option,
  selected,
  onSelect,
}: {
  option: LifestyleOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 13,
        padding: "15px 16px",
        background: "var(--white)",
        border: selected ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
        borderRadius: 14,
        boxShadow: selected
          ? "0 4px 20px -6px rgba(23,62,49,.22), 0 0 0 3px rgba(23,62,49,.05)"
          : "0 2px 10px -3px rgba(23,62,49,.05)",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "border-color .22s, box-shadow .22s",
        WebkitTapHighlightColor: "transparent",
        marginBottom: 10,
      }}
    >
      <span style={{
        flexShrink: 0,
        width: 20,
        height: 20,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 3,
        background: selected ? "var(--pine)" : "rgba(22,21,14,.04)",
        border: selected ? "none" : "0.5px solid var(--line)",
        transition: "all .22s cubic-bezier(.2,.8,.3,1.2)",
        transform: selected ? "scale(1)" : "scale(.85)",
      }}>
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1.5 4L3.8 6.5L8.5 1.5" stroke="#FDFDFB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>

      <div style={{ flex: 1 }}>
        <span style={{
          display: "block",
          fontSize: 16,
          fontWeight: selected ? 500 : 400,
          color: selected ? "var(--ink)" : "var(--ink-2)",
          lineHeight: 1.3,
          marginBottom: 5,
          transition: "color .22s, font-weight .22s",
        }}>
          {option.label}
        </span>
        <span style={{
          display: "block",
          fontSize: 13,
          fontWeight: 300,
          color: "var(--ink-3)",
          lineHeight: 1.45,
        }}>
          {option.subtext}
        </span>
      </div>
    </button>
  );
}

function ChoiceBlock({
  question,
  selectedId,
  onSelect,
}: {
  question: LifestyleQuestion;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
}) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ marginBottom: 18 }}>
        <label style={{
          fontFamily: "var(--font-serif)",
          fontOpticalSizing: "auto",
          fontSize: "clamp(26px, 6vw, 34px)",
          fontWeight: 300,
          color: "var(--ink)",
          display: "block",
          letterSpacing: "-.018em",
          lineHeight: 1.15,
          marginBottom: 8,
        } as React.CSSProperties}>
          {question.title}
        </label>
        <p style={{
          fontSize: 12,
          fontWeight: 300,
          color: "var(--ink-3)",
          fontStyle: "italic",
          lineHeight: 1.5,
        }}>
          {question.micro}
        </p>
      </div>
      <div>
        {question.options.map(opt => (
          <OptionCard
            key={opt.id}
            option={opt}
            selected={selectedId === opt.id}
            onSelect={() => onSelect(opt.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function AvoidStep({ q18Question, q19Question, onDone }: Props) {
  const [q17Text, setQ17Text] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [q17Focused, setQ17Focused] = useState(false);

  const q18Selected = !!answers[q18Question.id];
  const q19Selected = !!answers[q19Question.id];
  const allAnswered = q18Selected && q19Selected;
  const answeredCount = (q18Selected ? 1 : 0) + (q19Selected ? 1 : 0);

  function select(questionId: string, optionId: string) {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <AvoidHero answeredCount={answeredCount} totalRequired={2} />

      <div style={{ padding: "28px 20px 100px" }}>

        {/* Q17 — champ texte libre (optionnel) */}
        <div style={{ marginBottom: 40 }}>
          <label
            htmlFor="q17"
            style={{
              fontFamily: "var(--font-serif)",
              fontOpticalSizing: "auto",
              fontSize: "clamp(26px, 6vw, 34px)",
              fontWeight: 300,
              color: "var(--ink)",
              display: "block",
              letterSpacing: "-.018em",
              lineHeight: 1.15,
              marginBottom: 8,
            } as React.CSSProperties}
          >
            Ce qu'il vaut mieux éviter avec moi…
          </label>
          <p style={{
            fontSize: 12,
            fontWeight: 300,
            color: "var(--ink-3)",
            fontStyle: "italic",
            lineHeight: 1.5,
            marginBottom: 14,
          }}>
            Aucune obligation — réponds instinctivement, ou laisse vide.
          </p>
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
              borderRadius: 14,
              border: q17Focused ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
              background: "var(--white)",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              fontWeight: 300,
              color: "var(--ink)",
              lineHeight: 1.6,
              resize: "none",
              outline: "none",
              boxShadow: "0 2px 10px -3px rgba(23,62,49,.05)",
              transition: "border-color .22s",
              boxSizing: "border-box",
            } as React.CSSProperties}
          />
        </div>

        {/* Q18 */}
        <ChoiceBlock
          question={q18Question}
          selectedId={answers[q18Question.id] ?? null}
          onSelect={(optId) => select(q18Question.id, optId)}
        />

        {/* Q19 */}
        <ChoiceBlock
          question={q19Question}
          selectedId={answers[q19Question.id] ?? null}
          onSelect={(optId) => select(q19Question.id, optId)}
        />

        <button
          type="button"
          onClick={() => allAnswered && onDone(answers, q17Text)}
          disabled={!allAnswered}
          className="btn-primary"
          style={{
            width: "100%",
            minHeight: 52,
            opacity: allAnswered ? 1 : 0.4,
            transition: "opacity .2s",
          }}
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}
