"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { scoreAttention } from "@/lib/attention/scoring";
import type { AttentionResult, AttentionAnswers, Question } from "@/lib/attention/scoring";
import { computeBreathFacts, buildFallbackText } from "@/lib/attention/breathFacts";
import type { BreathFacts } from "@/lib/attention/breathFacts";
import { RECEPTION_QUESTIONS, EXPRESSION_QUESTION } from "@/lib/attention/questions";
import type { AttentionQuestion } from "@/lib/attention/questions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  onDone: (result: AttentionResult, breathText: string) => void;
}

type Selections = Record<string, string[]>;

// ─── Immersive hero header ────────────────────────────────────────────────────

function AttentionHero({ progress }: { progress: number }) {
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
        Langages d&apos;attention
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
            width: 5,
            height: 5,
            borderRadius: "50%",
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
          01 — 07
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

// ─── Floating option card ─────────────────────────────────────────────────────

function OptionCard({
  option, rank, disabled, onToggle,
}: {
  option: AttentionQuestion["options"][0];
  rank: number;
  disabled: boolean;
  onToggle: () => void;
}) {
  const selected = rank > 0;
  const isFirst = rank === 1;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
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
        cursor: disabled && !selected ? "not-allowed" : "pointer",
        opacity: disabled && !selected ? .38 : 1,
        textAlign: "left",
        width: "100%",
        transition: "border-color .22s, box-shadow .22s, opacity .2s",
        WebkitTapHighlightColor: "transparent",
        marginBottom: 10,
      }}
    >
      {/* Rank badge */}
      <span style={{
        flexShrink: 0,
        width: 22,
        height: 22,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
        background: selected
          ? isFirst ? "var(--pine)" : "transparent"
          : "rgba(22,21,14,.04)",
        border: selected
          ? isFirst ? "none" : "1.5px solid var(--pine)"
          : "0.5px solid var(--line)",
        color: selected
          ? isFirst ? "var(--canvas)" : "var(--pine)"
          : "transparent",
        fontFamily: "var(--font-sans)",
        fontSize: 11,
        fontWeight: 600,
        transition: "all .25s cubic-bezier(.2,.8,.3,1.2)",
        transform: selected ? "scale(1)" : "scale(.85)",
      }}>
        {selected ? rank : ""}
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

// ─── Question block ───────────────────────────────────────────────────────────

function QuestionBlock({
  question, selectedIds, onToggle,
}: {
  question: AttentionQuestion;
  selectedIds: string[];
  onToggle: (optId: string) => void;
}) {
  const maxReached = selectedIds.length >= 3;

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
        {question.options.map((opt) => {
          const rank = selectedIds.indexOf(opt.id) + 1;
          return (
            <OptionCard
              key={opt.id}
              option={opt}
              rank={rank > 0 ? rank : 0}
              disabled={maxReached && rank === 0}
              onToggle={() => onToggle(opt.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Build helpers ────────────────────────────────────────────────────────────

function buildAnswers(selections: Selections): AttentionAnswers {
  const buildQuestion = (q: AttentionQuestion): Question =>
    (selections[q.id] ?? []).map((optId) => {
      const opt = q.options.find((o) => o.id === optId)!;
      return opt.dims;
    });

  return {
    reception: RECEPTION_QUESTIONS.map(buildQuestion),
    expression: [EXPRESSION_QUESTION].map(buildQuestion),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttentionStep({ userId, onDone }: Props) {
  const supabase = createClient();
  const [selections, setSelections] = useState<Selections>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalQuestions = RECEPTION_QUESTIONS.length + 1;
  const answeredCount = Object.values(selections).filter(v => v.length > 0).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  function toggle(qId: string, optId: string) {
    setSelections((prev) => {
      const cur = prev[qId] ?? [];
      if (cur.includes(optId)) return { ...prev, [qId]: cur.filter((id) => id !== optId) };
      if (cur.length >= 3) return prev;
      return { ...prev, [qId]: [...cur, optId] };
    });
  }

  async function handleContinue() {
    setLoading(true);
    setError("");
    try {
      const answers = buildAnswers(selections);
      const result = scoreAttention(answers);

      const { error: dbErr } = await supabase.from("my_profile").upsert(
        {
          user_id: userId,
          attention_answers: answers,
          attention_reception: result.reception,
          attention_expression: result.expression,
          attention_computed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (dbErr) {
        setError("Impossible d'enregistrer — vérifie ta connexion et réessaie.");
        return;
      }

      const facts: BreathFacts = computeBreathFacts(result.reception, result.expression);

      let breathText: string;
      try {
        const res = await fetch("/api/attention/breath", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facts }),
        });
        if (!res.ok) throw new Error("api_error");
        const data = await res.json() as { text: string };
        breathText = data.text || buildFallbackText(facts);
      } catch {
        breathText = buildFallbackText(facts);
      }

      await supabase.from("my_profile")
        .update({ attention_breath_text: breathText, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      onDone(result, breathText);
    } catch {
      setError("Une erreur inattendue s'est produite. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <AttentionHero progress={progress} />

      <div style={{ padding: "28px 20px 100px" }}>

        {/* Intro */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontOpticalSizing: "auto",
            fontWeight: 300,
            fontSize: "clamp(22px, 4.5vw, 28px)",
            color: "var(--ink)",
            marginBottom: 10,
            lineHeight: 1.2,
            letterSpacing: "-.018em",
          } as React.CSSProperties}>
            Comment tu reçois et donnes l&apos;attention.
          </p>
          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65 }}>
            Il n&apos;y a pas de bonne réponse — seulement ta vérité.
          </p>
        </div>

        {/* Q1 – Q4 */}
        {RECEPTION_QUESTIONS.map((q) => (
          <QuestionBlock
            key={q.id}
            question={q}
            selectedIds={selections[q.id] ?? []}
            onToggle={(optId) => toggle(q.id, optId)}
          />
        ))}

        {/* Expression separator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          margin: "4px 0 32px",
        }}>
          <div style={{ flex: 1, height: ".5px", background: "var(--line)" }} />
          <span style={{
            fontSize: 10, fontWeight: 500, color: "var(--ink-3)",
            letterSpacing: ".28em", textTransform: "uppercase", whiteSpace: "nowrap",
          }}>
            Comment tu donnes
          </span>
          <div style={{ flex: 1, height: ".5px", background: "var(--line)" }} />
        </div>

        {/* Question E */}
        <QuestionBlock
          question={EXPRESSION_QUESTION}
          selectedIds={selections[EXPRESSION_QUESTION.id] ?? []}
          onToggle={(optId) => toggle(EXPRESSION_QUESTION.id, optId)}
        />

        {/* Error */}
        {error && (
          <p style={{
            fontSize: 13, color: "#E05252",
            background: "rgba(224,82,82,0.08)",
            border: "0.5px solid rgba(224,82,82,0.25)",
            borderRadius: 6, padding: "10px 14px", marginBottom: 16,
          }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="btn-primary lg"
          style={{ width: "100%", minHeight: 52 }}
        >
          {loading ? "Enregistrement…" : "Continuer →"}
        </button>
      </div>
    </div>
  );
}
