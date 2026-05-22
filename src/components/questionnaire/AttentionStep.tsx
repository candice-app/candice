"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { scoreAttention } from "@/lib/attention/scoring";
import type { AttentionResult, AttentionAnswers, Question } from "@/lib/attention/scoring";
import { RECEPTION_QUESTIONS, EXPRESSION_QUESTION } from "@/lib/attention/questions";
import type { AttentionQuestion } from "@/lib/attention/questions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  onDone: (result: AttentionResult) => void;
}

// questionId → ordered selected optionIds (index 0 = rank 1)
type Selections = Record<string, string[]>;

// ─── Sticky attention bar ─────────────────────────────────────────────────────

function AttentionBar() {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "var(--br)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        height: 52, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 20px",
      }}>
        <span style={{ fontFamily: "var(--playfair)", fontSize: 20, fontWeight: 400, color: "var(--con)" }}>
          Candice
        </span>
        <span style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", letterSpacing: "0.3px" }}>
          Étape 1 / 7
        </span>
      </div>
      <div style={{ height: 3, background: "var(--br3)" }}>
        <div style={{ height: "100%", width: "14%", background: "var(--terra)", borderRadius: "0 2px 2px 0" }} />
      </div>
    </div>
  );
}

// ─── Option card ──────────────────────────────────────────────────────────────

function OptionCard({
  option, rank, disabled, onToggle,
}: {
  option: AttentionQuestion["options"][0];
  rank: number; // 0 = not selected, 1/2/3 = rank
  disabled: boolean;
  onToggle: () => void;
}) {
  const selected = rank > 0;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      className={`pill-card${selected ? " pill-card-selected" : ""}${disabled && !selected ? " pill-card-disabled" : ""}`}
    >
      {selected && (
        <span style={{
          position: "absolute", top: 8, left: 10,
          width: 22, height: 22, borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          color: "#fff", fontSize: 11, fontWeight: 700,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {rank}
        </span>
      )}
      <span style={{
        fontSize: 14, fontWeight: selected ? 500 : 400,
        color: selected ? "#fff" : "var(--con)",
        paddingLeft: selected ? 30 : 0,
        lineHeight: 1.3,
      }}>
        {option.label}
      </span>
      <span style={{
        fontSize: 12, fontWeight: 300, lineHeight: 1.4,
        color: selected ? "rgba(255,255,255,0.75)" : "var(--txts)",
        paddingLeft: selected ? 30 : 0,
        overflowWrap: "break-word", wordBreak: "break-word",
      }}>
        {option.subtext}
      </span>
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
    <div className="card-light" style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
      <div>
        <label style={{
          fontSize: "clamp(18px, 3vw, 20px)", fontWeight: 400,
          fontFamily: "var(--playfair)", fontStyle: "italic",
          color: "var(--terra)", display: "block",
          paddingBottom: 8, borderBottom: "1.5px solid var(--terra)", marginBottom: 8,
        }}>
          {question.title}
        </label>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", fontStyle: "italic" }}>
          {question.micro}
        </p>
      </div>
      <div className="pill-grid">
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

      onDone(result);
    } catch {
      setError("Une erreur inattendue s'est produite. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <AttentionBar />

      <div style={{ padding: "0 0 80px" }}>

        {/* Privacy bar */}
        <div className="privacy-bar">
          <span>🔒</span>
          Tes réponses ne seront jamais partagées mot pour mot.
        </div>

        {/* Intro */}
        <div style={{ marginBottom: 28, padding: "0 4px" }}>
          <p className="section-label">Attention</p>
          <h1 style={{
            fontFamily: "var(--playfair)", fontSize: "clamp(22px, 4vw, 28px)",
            fontWeight: 400, color: "var(--con)", marginBottom: 8, lineHeight: 1.2,
          }}>
            Comment tu reçois et donnes l'attention.
          </h1>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--cond)", lineHeight: 1.6 }}>
            Il n'y a pas de bonne réponse — seulement ta vérité.
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
          margin: "8px 0 24px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ flex: 1, height: "0.5px", background: "var(--br3)" }} />
          <span style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
            Comment tu donnes
          </span>
          <div style={{ flex: 1, height: "0.5px", background: "var(--br3)" }} />
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
