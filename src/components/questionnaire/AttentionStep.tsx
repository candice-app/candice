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

// questionId → ordered selected optionIds (index 0 = rank 1)
type Selections = Record<string, string[]>;

// ─── Sticky attention bar ─────────────────────────────────────────────────────

function AttentionBar() {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "var(--pine-h2)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        height: 52, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 22px",
      }}>
        {/* Wordmark on-dark inline */}
        <span style={{
          fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: 18,
          letterSpacing: ".34em", textTransform: "uppercase",
          color: "#F6F3EA", paddingLeft: ".34em",
          display: "inline-flex", alignItems: "center", gap: 7,
        }}>
          CANDICE
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "var(--champ)",
            boxShadow: "0 0 7px 1px rgba(205,185,135,.5)",
            animation: "life 3.6s ease-in-out infinite",
            display: "inline-block",
          }} />
        </span>
        <span style={{ fontSize: 11, fontWeight: 300, color: "rgba(205,185,135,.7)", letterSpacing: ".22em" }}>
          01 — 07
        </span>
      </div>
      {/* Barre de progression — sans chiffre */}
      <div style={{ height: 1.5, background: "rgba(22,21,14,.25)", margin: "0 22px" }}>
        <div style={{ height: "100%", width: "14%", background: "var(--pine-glow)", borderRadius: "0 2px 2px 0", transition: "width .55s cubic-bezier(.2,.7,.2,1)" }} />
      </div>
    </div>
  );
}

// ─── Option card (fil + nœud numéroté) ───────────────────────────────────────

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
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "14px 0",
        background: "none",
        border: "none",
        cursor: disabled && !selected ? "not-allowed" : "pointer",
        opacity: disabled && !selected ? .35 : 1,
        textAlign: "left",
        width: "100%",
        transition: "opacity .2s",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Nœud sur le fil */}
      <span style={{
        flexShrink: 0,
        width: 20, height: 20,
        borderRadius: "50%",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginTop: 1,
        ...(selected
          ? isFirst
            ? { background: "var(--pine)", boxShadow: "0 0 0 3px var(--champ-soft)", color: "var(--canvas)" }
            : { background: "var(--white)", boxShadow: "0 0 0 1.4px var(--pine)", color: "var(--pine)" }
          : { background: "var(--white)", boxShadow: "0 0 0 1px var(--line)", color: "transparent" }
        ),
        fontFamily: "var(--font-serif)",
        fontSize: 10,
        fontWeight: selected ? 600 : 300,
        transition: "all .25s cubic-bezier(.2,.8,.3,1.2)",
        transform: selected ? "scale(1)" : "scale(.85)",
      }}>
        {selected ? rank : ""}
      </span>

      <div>
        <span style={{
          display: "block",
          fontSize: 15,
          fontWeight: selected ? 500 : 300,
          color: selected ? "var(--ink)" : "var(--ink-2)",
          lineHeight: 1.3,
          transition: "color .25s, font-weight .25s",
        }}>
          {option.label}
        </span>
        <span style={{
          display: "block",
          fontSize: 12,
          fontWeight: 300,
          color: "var(--ink-3)",
          lineHeight: 1.4,
          marginTop: 2,
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
    <div style={{ marginBottom: 32, padding: "0 4px" }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{
          fontSize: "clamp(20px, 3.5vw, 24px)", fontWeight: 300,
          fontFamily: "var(--font-serif)",
          fontOpticalSizing: "auto",
          color: "var(--ink)", display: "block",
          letterSpacing: "-.014em", lineHeight: 1.2,
          marginBottom: 8,
        }}>
          {question.title}
        </label>
        <p style={{ fontSize: 11.5, fontWeight: 300, color: "var(--ink-3)", fontStyle: "italic" }}>
          {question.micro}
        </p>
      </div>

      {/* Options sur le fil */}
      <div style={{ position: "relative", paddingLeft: 32 }}>
        {/* Fil */}
        <div style={{
          position: "absolute", left: 9, top: 8, bottom: 8,
          width: 1, background: selectedIds.length > 0
            ? "linear-gradient(var(--pine), rgba(23,62,49,.12))"
            : "var(--line)",
          transition: "background .35s",
        }} />
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
      <AttentionBar />

      <div style={{ padding: "28px 22px 100px" }}>

        {/* Intro */}
        <div style={{ marginBottom: 36 }}>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 300,
            fontSize: "clamp(22px, 4vw, 28px)",
            color: "var(--ink)",
            marginBottom: 10,
            lineHeight: 1.2,
            letterSpacing: "-.018em",
          }}>
            Comment tu reçois et donnes l&apos;attention.
          </p>
          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65 }}>
            Il n&apos;y a pas de bonne réponse — seulement ta vérité. Choisis jusqu&apos;à 3 réponses par question.
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
          margin: "8px 4px 32px",
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
