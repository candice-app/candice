"use client";

import { useState } from "react";
import type { LifestyleQuestion, LifestyleOption } from "@/lib/lifestyle/questions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  q18Question: LifestyleQuestion;
  q19Question: LifestyleQuestion;
  onDone: (answers: Record<string, string>, q17Text: string) => void;
}

// Screens: q17 textarea → q18 choice → q19 choice
type Screen = "q17" | "q18" | "q19";

// ─── Hero header ──────────────────────────────────────────────────────────────

function AvoidHero({ screenIndex }: { screenIndex: number }) {
  const progress = Math.round((screenIndex / 3) * 100);

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
          Étape 5/7
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

// ─── Option card (reused pattern) ────────────────────────────────────────────

function OptionCard({
  option, selected, onSelect,
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function AvoidStep({ q18Question, q19Question, onDone }: Props) {
  const [screen, setScreen] = useState<Screen>("q17");
  const [q17Text, setQ17Text] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const screenIndex = screen === "q17" ? 0 : screen === "q18" ? 1 : 2;

  function handleQ17Continue() {
    setScreen("q18");
  }

  function selectOption(questionId: string, optionId: string) {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }

  function handleQ18Next() {
    if (!answers[q18Question.id]) return;
    setScreen("q19");
  }

  function handleQ19Done() {
    if (!answers[q19Question.id]) return;
    onDone(answers, q17Text);
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <AvoidHero screenIndex={screenIndex} />

      <div style={{ padding: "28px 20px 100px" }}>

        {/* ── Q17 : champ texte libre ── */}
        {screen === "q17" && (
          <>
            <div style={{ marginBottom: 24 }}>
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
                  marginBottom: 10,
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
              }}>
                Aucune obligation — réponds instinctivement, ou laisse vide.
              </p>
            </div>

            <textarea
              id="q17"
              value={q17Text}
              onChange={e => setQ17Text(e.target.value)}
              placeholder="ex. les surprises, les annulations de dernière minute, certaines blagues, le bruit, les espaces bondés…"
              rows={5}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "0.5px solid var(--line)",
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
                marginBottom: 24,
                boxSizing: "border-box",
              } as React.CSSProperties}
              onFocus={e => {
                e.target.style.borderColor = "var(--pine)";
                e.target.style.borderWidth = "1.5px";
              }}
              onBlur={e => {
                e.target.style.borderColor = "var(--line)";
                e.target.style.borderWidth = "0.5px";
              }}
            />

            <button
              type="button"
              onClick={handleQ17Continue}
              className="btn-primary"
              style={{ width: "100%", minHeight: 52 }}
            >
              Continuer →
            </button>
          </>
        )}

        {/* ── Q18 ── */}
        {screen === "q18" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <label style={{
                fontFamily: "var(--font-serif)",
                fontOpticalSizing: "auto",
                fontSize: "clamp(26px, 6vw, 34px)",
                fontWeight: 300,
                color: "var(--ink)",
                display: "block",
                letterSpacing: "-.018em",
                lineHeight: 1.15,
                marginBottom: 10,
              } as React.CSSProperties}>
                {q18Question.title}
              </label>
              <p style={{
                fontSize: 12,
                fontWeight: 300,
                color: "var(--ink-3)",
                fontStyle: "italic",
                lineHeight: 1.5,
              }}>
                {q18Question.micro}
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              {q18Question.options.map(opt => (
                <OptionCard
                  key={opt.id}
                  option={opt}
                  selected={answers[q18Question.id] === opt.id}
                  onSelect={() => selectOption(q18Question.id, opt.id)}
                />
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setScreen("q17")}
                style={{
                  height: 52,
                  padding: "0 20px",
                  background: "none",
                  border: "0.5px solid var(--line)",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 300,
                  color: "var(--ink-3)",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  flexShrink: 0,
                }}
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleQ18Next}
                disabled={!answers[q18Question.id]}
                className="btn-primary"
                style={{
                  flex: 1,
                  minHeight: 52,
                  opacity: answers[q18Question.id] ? 1 : 0.4,
                  transition: "opacity .2s",
                }}
              >
                Suivant →
              </button>
            </div>
          </>
        )}

        {/* ── Q19 ── */}
        {screen === "q19" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <label style={{
                fontFamily: "var(--font-serif)",
                fontOpticalSizing: "auto",
                fontSize: "clamp(26px, 6vw, 34px)",
                fontWeight: 300,
                color: "var(--ink)",
                display: "block",
                letterSpacing: "-.018em",
                lineHeight: 1.15,
                marginBottom: 10,
              } as React.CSSProperties}>
                {q19Question.title}
              </label>
              <p style={{
                fontSize: 12,
                fontWeight: 300,
                color: "var(--ink-3)",
                fontStyle: "italic",
                lineHeight: 1.5,
              }}>
                {q19Question.micro}
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              {q19Question.options.map(opt => (
                <OptionCard
                  key={opt.id}
                  option={opt}
                  selected={answers[q19Question.id] === opt.id}
                  onSelect={() => selectOption(q19Question.id, opt.id)}
                />
              ))}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setScreen("q18")}
                style={{
                  height: 52,
                  padding: "0 20px",
                  background: "none",
                  border: "0.5px solid var(--line)",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 300,
                  color: "var(--ink-3)",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  flexShrink: 0,
                }}
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleQ19Done}
                disabled={!answers[q19Question.id]}
                className="btn-primary"
                style={{
                  flex: 1,
                  minHeight: 52,
                  opacity: answers[q19Question.id] ? 1 : 0.4,
                  transition: "opacity .2s",
                }}
              >
                Continuer →
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
