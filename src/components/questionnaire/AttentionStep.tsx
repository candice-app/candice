"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { scoreAttention } from "@/lib/attention/scoring";
import type { AttentionResult, AttentionAnswers, Question } from "@/lib/attention/scoring";
import { computeBreathFacts, buildFallbackText } from "@/lib/attention/breathFacts";
import type { BreathFacts } from "@/lib/attention/breathFacts";
import { RECEPTION_QUESTIONS, EXPRESSION_QUESTION } from "@/lib/attention/questions";
import type { AttentionQuestion } from "@/lib/attention/questions";
import IconSprite, { Icon } from "@/components/ui/v4/IconSprite";
import Brand from "@/components/ui/v4/Brand";
import ProgressBar from "@/components/ui/v4/ProgressBar";

interface Props {
  userId: string;
  onDone: (result: AttentionResult, breathText: string) => void;
  onBack?: () => void;
  onExit?: () => void;
}

type Selections = Record<string, string[]>;

// ── Rank colors (s1/s2/s3) ──────────────────────────────────────────────────

const RANK_BORDER = ["var(--pine)", "var(--glow)", "var(--sage)"];
const RANK_BG = [
  "linear-gradient(90deg,rgba(23,62,49,.11),#fff 76%)",
  "linear-gradient(90deg,rgba(62,115,97,.11),#fff 76%)",
  "linear-gradient(90deg,rgba(141,166,151,.13),#fff 76%)",
];
const RANK_BADGE_BG = ["var(--pine)", "var(--glow)", "var(--sage)"];

// ── Card component ──────────────────────────────────────────────────────────

function QCard({
  option,
  rank,
  disabled,
  onClick,
}: {
  option: AttentionQuestion["options"][0];
  rank: number;
  disabled: boolean;
  onClick: () => void;
}) {
  const isSelected = rank > 0;
  const rankIdx = rank - 1;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onClick()}
      onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !disabled) { e.preventDefault(); onClick(); } }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: 14,
        border: isSelected ? `1.5px solid ${RANK_BORDER[rankIdx]}` : "1.5px solid var(--line)",
        borderRadius: 17,
        background: isSelected ? RANK_BG[rankIdx] : "var(--surface)",
        marginBottom: 10,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.38 : 1,
        boxShadow: "var(--shadow)",
        transition: "border-color .18s, background .18s",
      }}
    >
      {/* Picto */}
      <div style={{
        width: 42, height: 42, borderRadius: 13, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isSelected ? "var(--pine)" : "var(--mist)",
        color: isSelected ? "#fff" : "var(--pine)",
      }}>
        {option.icon ? <Icon name={option.icon} size={19} /> : null}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3, color: "var(--ink)", fontFamily: "var(--font-sans)" }}>
          {option.label}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 3, fontWeight: 400, lineHeight: 1.3, fontFamily: "var(--font-sans)" }}>
          {option.subtext}
        </div>
      </div>

      {/* Rank badge or empty radio */}
      {isSelected ? (
        <div style={{
          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 12, color: "#fff",
          background: RANK_BADGE_BG[rankIdx],
        }}>
          {rank}
        </div>
      ) : (
        <div style={{
          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
          border: "2px solid var(--line)",
        }} />
      )}
    </div>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

function QuestionSection({
  question,
  selectedIds,
  onToggle,
}: {
  question: AttentionQuestion;
  selectedIds: string[];
  onToggle: (optId: string) => void;
}) {
  const maxReached = selectedIds.length >= 3;

  return (
    <div style={{ paddingBottom: 22 }}>
      <div style={{
        fontSize: 10, letterSpacing: "1.8px", textTransform: "uppercase",
        color: "var(--ink3)", fontWeight: 700, marginBottom: 8,
        fontFamily: "var(--font-sans)",
      }}>
        Candice t&apos;écoute
      </div>
      <div style={{
        fontFamily: "var(--font-serif)",
        fontSize: 19,
        lineHeight: 1.22,
        color: "var(--ink)",
        marginBottom: 4,
        letterSpacing: "-.01em",
      }}>
        {question.title}
      </div>
      <p style={{
        fontSize: 11.5, color: "var(--ink3)", marginBottom: 14,
        fontFamily: "var(--font-sans)",
      }}>
        {question.micro}
      </p>
      {question.options.map((opt) => {
        const rank = selectedIds.indexOf(opt.id) + 1;
        const isSelected = rank > 0;
        const disabled = maxReached && !isSelected;
        return (
          <QCard
            key={opt.id}
            option={opt}
            rank={rank}
            disabled={disabled}
            onClick={() => onToggle(opt.id)}
          />
        );
      })}
    </div>
  );
}

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

// ── Main component ───────────────────────────────────────────────────────────

export default function AttentionStep({ userId, onDone, onBack, onExit }: Props) {
  const supabase = createClient();
  const [selections, setSelections] = useState<Selections>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allQIds = [...RECEPTION_QUESTIONS.map(q => q.id), EXPRESSION_QUESTION.id];
  const answeredCount = allQIds.filter(id => (selections[id] ?? []).length > 0).length;
  const totalQuestions = allQIds.length;
  const allAnswered = answeredCount === totalQuestions;
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
    if (!allAnswered || loading) return;
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
    <div className="v4" style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <IconSprite />

      {/* Brand + barre de progression */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--canvas)",
        padding: "10px 20px 12px",
        borderBottom: "1px solid var(--line2)",
      }}>
        <Brand />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 14, color: "var(--ink2)", fontFamily: "var(--font-sans)" }}
            >
              ←
            </button>
          )}
          <div style={{ flex: 1 }}>
            <ProgressBar pct={progress} />
          </div>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--pine)", boxShadow: "0 0 8px rgba(62,115,97,.55)",
          }} />
        </div>
      </div>

      {/* Questions */}
      <div style={{ padding: "20px 20px 140px" }}>
        <div style={{
          fontSize: 10, letterSpacing: "1.8px", textTransform: "uppercase",
          color: "var(--ink3)", fontWeight: 700, marginBottom: 14,
          fontFamily: "var(--font-sans)",
        }}>
          Candice apprend ton langage d&apos;attention
        </div>

        {RECEPTION_QUESTIONS.map((q) => (
          <QuestionSection
            key={q.id}
            question={q}
            selectedIds={selections[q.id] ?? []}
            onToggle={(optId) => toggle(q.id, optId)}
          />
        ))}

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          margin: "18px 0 14px",
          fontSize: 10, letterSpacing: "1.6px", textTransform: "uppercase",
          color: "var(--ink3)", fontWeight: 700, fontFamily: "var(--font-sans)",
        }}>
          <div style={{ flex: 1, height: 1, background: "var(--line2)" }} />
          Comment tu donnes
          <div style={{ flex: 1, height: 1, background: "var(--line2)" }} />
        </div>

        <QuestionSection
          question={EXPRESSION_QUESTION}
          selectedIds={selections[EXPRESSION_QUESTION.id] ?? []}
          onToggle={(optId) => toggle(EXPRESSION_QUESTION.id, optId)}
        />

        {error && (
          <p style={{
            fontSize: 13, color: "#E05252",
            background: "rgba(224,82,82,0.08)",
            border: "0.5px solid rgba(224,82,82,0.25)",
            borderRadius: 6, padding: "10px 14px", marginTop: 16,
            fontFamily: "var(--font-sans)",
          }}>
            {error}
          </p>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{
        position: "fixed", inset: "auto 0 0",
        padding: "10px 20px 20px",
        background: "var(--canvas)",
        borderTop: "1px solid var(--line2)",
        zIndex: 10,
      }}>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!allAnswered || loading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            height: 50, borderRadius: 15, width: "100%",
            background: allAnswered && !loading ? "var(--pine)" : "var(--line)",
            color: allAnswered && !loading ? "#fff" : "var(--ink3)",
            fontWeight: 600, fontSize: 14.5,
            border: "none", cursor: allAnswered && !loading ? "pointer" : "default",
            boxShadow: allAnswered && !loading ? "0 6px 16px rgba(23,62,49,.18)" : "none",
            transition: "background .2s, color .2s",
            fontFamily: "var(--font-sans)",
          }}
        >
          {loading ? "Enregistrement…" : "Continuer"}
        </button>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            style={{
              display: "block", margin: "10px auto 0", background: "none", border: "none",
              cursor: "pointer", fontSize: 12, color: "var(--ink3)", fontFamily: "var(--font-sans)",
            }}
          >
            Reprendre plus tard
          </button>
        )}
      </div>
    </div>
  );
}
