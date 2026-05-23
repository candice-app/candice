"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { scoreAttention } from "@/lib/attention/scoring";
import type { AttentionResult, AttentionAnswers, Question } from "@/lib/attention/scoring";
import { computeBreathFacts, buildFallbackText } from "@/lib/attention/breathFacts";
import type { BreathFacts } from "@/lib/attention/breathFacts";
import { RECEPTION_QUESTIONS, EXPRESSION_QUESTION } from "@/lib/attention/questions";
import type { AttentionQuestion } from "@/lib/attention/questions";

interface Props {
  userId: string;
  onDone: (result: AttentionResult, breathText: string) => void;
  onBack?: () => void;
  onExit?: () => void;
}

type Selections = Record<string, string[]>;

const EYEBROWS: Record<string, string> = {
  q1: "Candice t'écoute",
  q2: "Encore",
  q3: "Plus profond",
  q4: "Une préférence",
  qe: "Et toi",
};

function QHeader({ progress, onBack, onExit }: { progress: number; onBack?: () => void; onExit?: () => void }) {
  return (
    <div className="q-header">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="q-logo">Candice<span className="q-logo-dot" /></span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {onBack && (
            <button type="button" onClick={onBack} style={qNavBtn}>← Retour</button>
          )}
          <span className="q-idx">01 — 07</span>
          {onExit && (
            <button type="button" onClick={onExit} style={qNavBtn}>Quitter ×</button>
          )}
        </div>
      </div>
      <div className="q-bar-track">
        <div className="q-bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

const qNavBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", padding: 0,
  fontSize: 11, letterSpacing: ".22em", color: "var(--ink-3)", fontWeight: 300,
  fontFamily: "var(--font-sans)", WebkitTapHighlightColor: "transparent",
};

function QuestionSection({
  question, selectedIds, onToggle, active,
}: {
  question: AttentionQuestion;
  selectedIds: string[];
  onToggle: (optId: string) => void;
  active: boolean;
}) {
  const maxReached = selectedIds.length >= 3;
  const touched = selectedIds.length > 0;
  const eyebrow = EYEBROWS[question.id] ?? "";

  return (
    <div className={`q-section ${active ? "active" : "rest"}`}>
      {eyebrow && <div className="q-eyebrow">{eyebrow}</div>}
      <div className="q-prompt">{question.title}</div>
      <div className="q-helper">{question.micro}</div>
      <div className={`q-opts${touched ? " touched" : ""}`}>
        {question.options.map((opt) => {
          const rank = selectedIds.indexOf(opt.id) + 1;
          const isSelected = rank > 0;
          const isFirst = rank === 1;
          const disabled = maxReached && !isSelected;
          return (
            <div
              key={opt.id}
              className={`q-opt${isSelected ? " sel" : ""}${isFirst ? " first" : ""}`}
              style={{ opacity: disabled ? .35 : 1 }}
              onClick={() => { if (!disabled) onToggle(opt.id); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !disabled) {
                  e.preventDefault();
                  onToggle(opt.id);
                }
              }}
            >
              <span className="q-node">{isSelected ? rank : ""}</span>
              <div className="q-opt-t">{opt.label}</div>
              <div className="q-opt-s">{opt.subtext}</div>
            </div>
          );
        })}
      </div>
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

export default function AttentionStep({ userId, onDone, onBack, onExit }: Props) {
  const supabase = createClient();
  const [selections, setSelections] = useState<Selections>({});
  const [activeQId, setActiveQId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allQIds = [...RECEPTION_QUESTIONS.map(q => q.id), EXPRESSION_QUESTION.id];
  const answeredCount = allQIds.filter(id => (selections[id] ?? []).length > 0).length;
  const totalQuestions = allQIds.length;
  const allAnswered = answeredCount === totalQuestions;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  function toggle(qId: string, optId: string) {
    setActiveQId(qId);
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
    <div style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <QHeader progress={progress} onBack={onBack} onExit={onExit} />

      <div style={{ padding: "26px 24px 140px" }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontOpticalSizing: "auto",
            fontWeight: 300,
            fontSize: "clamp(20px, 4vw, 24px)",
            color: "var(--ink)", lineHeight: 1.3,
            letterSpacing: "-.014em", marginBottom: 8,
          } as React.CSSProperties}>
            Comment tu reçois et donnes l&apos;attention.
          </p>
          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.55 }}>
            Il n&apos;y a pas de bonne réponse — seulement ta vérité.
          </p>
        </div>

        {RECEPTION_QUESTIONS.map((q) => (
          <QuestionSection
            key={q.id}
            question={q}
            selectedIds={selections[q.id] ?? []}
            onToggle={(optId) => toggle(q.id, optId)}
            active={activeQId === q.id}
          />
        ))}

        <div className="q-section-divider">Comment tu donnes</div>

        <QuestionSection
          question={EXPRESSION_QUESTION}
          selectedIds={selections[EXPRESSION_QUESTION.id] ?? []}
          onToggle={(optId) => toggle(EXPRESSION_QUESTION.id, optId)}
          active={activeQId === EXPRESSION_QUESTION.id}
        />

        {error && (
          <p style={{
            fontSize: 13, color: "#E05252",
            background: "rgba(224,82,82,0.08)",
            border: "0.5px solid rgba(224,82,82,0.25)",
            borderRadius: 6, padding: "10px 14px", marginTop: 16,
          }}>
            {error}
          </p>
        )}
      </div>

      <div className="q-footer">
        <button
          type="button"
          onClick={handleContinue}
          className={`q-continue${allAnswered && !loading ? " ready" : ""}`}
        >
          <span>{loading ? "Enregistrement…" : "Continuer"}</span>
          <span className="q-arr">→</span>
        </button>
      </div>
    </div>
  );
}
