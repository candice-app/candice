"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { MyProfile } from "@/types";
import type { AttentionResult } from "@/lib/attention/scoring";
import { scoreTemperament } from "@/lib/temperament/scoring";
import { computeTemperamentBreathFacts, buildTemperamentFallbackText } from "@/lib/temperament/breathFacts";
import { STEP2_QUESTIONS, STEP3_QUESTIONS } from "@/lib/temperament/questions";
import AttentionStep from "@/components/questionnaire/AttentionStep";
import AttentionBreath from "@/components/questionnaire/AttentionBreath";
import TemperamentStep from "@/components/questionnaire/TemperamentStep";
import TemperamentBreath from "@/components/questionnaire/TemperamentBreath";
import SelfProfileForm from "@/components/questionnaire/SelfProfileForm";

type Step =
  | "attention"
  | "attentionBreath"
  | "temperament2"
  | "temperament2Breath"
  | "temperament3"
  | "temperament3Breath"
  | "profile";

interface Props {
  userId: string;
  initial: MyProfile | null;
}

export default function QuestionnaireFlow({ userId, initial }: Props) {
  const supabase = createClient();
  const [step, setStep] = useState<Step>("attention");
  const [attentionResult, setAttentionResult] = useState<AttentionResult | null>(null);
  const [attentionBreathText, setAttentionBreathText] = useState<string>("");
  const [step2BreathText, setStep2BreathText] = useState<string>("");
  const [step3BreathText, setStep3BreathText] = useState<string>("");
  const [temperamentAnswers, setTemperamentAnswers] = useState<Record<string, string>>({});

  // ─── Step 1: Attention ────────────────────────────────────────────────────

  if (step === "attention") {
    return (
      <AttentionStep
        userId={userId}
        onDone={(result, text) => {
          setAttentionResult(result);
          setAttentionBreathText(text);
          setStep("attentionBreath");
        }}
      />
    );
  }

  if (step === "attentionBreath") {
    return (
      <AttentionBreath
        breathText={attentionBreathText}
        onContinue={() => setStep("temperament2")}
      />
    );
  }

  // ─── Step 2: Énergie relationnelle ───────────────────────────────────────

  if (step === "temperament2") {
    return (
      <TemperamentStep
        questions={STEP2_QUESTIONS}
        stepNumber={2}
        totalSteps={7}
        onDone={async (step2Answers) => {
          const merged = { ...temperamentAnswers, ...step2Answers };
          setTemperamentAnswers(merged);

          const result = scoreTemperament(merged);
          const facts = computeTemperamentBreathFacts(result.axes, result.modes, 2);

          // Persist partial results (non-blocking)
          supabase.from("my_profile").upsert(
            {
              user_id: userId,
              temperament_answers: merged,
              temperament_axes: result.axes,
              temperament_modes: result.modes,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          ).then(() => {});

          // Generate Step 2 breath text
          let text: string;
          try {
            const res = await fetch("/api/temperament/breath", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ facts }),
            });
            const data = await res.json() as { text: string };
            text = data.text || buildTemperamentFallbackText(facts);
          } catch {
            text = buildTemperamentFallbackText(facts);
          }

          setStep2BreathText(text);
          setStep("temperament2Breath");
        }}
      />
    );
  }

  if (step === "temperament2Breath") {
    return (
      <TemperamentBreath
        breathText={step2BreathText}
        onContinue={() => setStep("temperament3")}
        ctaLabel="Continuer →"
      />
    );
  }

  // ─── Step 3: Communication & décision ────────────────────────────────────

  if (step === "temperament3") {
    return (
      <TemperamentStep
        questions={STEP3_QUESTIONS}
        stepNumber={3}
        totalSteps={7}
        onDone={async (step3Answers) => {
          const merged = { ...temperamentAnswers, ...step3Answers };
          setTemperamentAnswers(merged);

          const result = scoreTemperament(merged);
          const facts = computeTemperamentBreathFacts(result.axes, result.modes, 3);

          // Persist final temperament
          await supabase.from("my_profile").upsert(
            {
              user_id: userId,
              temperament_answers: merged,
              temperament_axes: result.axes,
              temperament_modes: result.modes,
              temperament_computed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

          // Generate Step 3 breath text
          let text: string;
          try {
            const res = await fetch("/api/temperament/breath", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ facts }),
            });
            const data = await res.json() as { text: string };
            text = data.text || buildTemperamentFallbackText(facts);
          } catch {
            text = buildTemperamentFallbackText(facts);
          }

          setStep3BreathText(text);
          setStep("temperament3Breath");
        }}
      />
    );
  }

  if (step === "temperament3Breath") {
    return (
      <TemperamentBreath
        breathText={step3BreathText}
        onContinue={() => setStep("profile")}
        ctaLabel="Continuer mon profil →"
      />
    );
  }

  // ─── Step "profile": informations pratiques ───────────────────────────────

  return (
    <div style={{ padding: "28px 20px 100px" }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{
          fontSize: 10, fontWeight: 500, letterSpacing: ".28em",
          textTransform: "uppercase", color: "var(--pine)", marginBottom: 12,
        }}>
          Ton profil
        </p>
        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontOpticalSizing: "auto",
          fontWeight: 300,
          fontSize: "clamp(28px, 6vw, 35px)",
          color: "var(--ink)",
          letterSpacing: "-.022em",
          lineHeight: 1.1,
          marginBottom: 10,
        } as React.CSSProperties}>
          {initial ? "Modifier ta fiche." : "Remplir ta fiche."}
        </h1>
        <p style={{
          fontFamily: "var(--font-serif)",
          fontOpticalSizing: "auto",
          fontWeight: 300,
          fontStyle: "italic",
          fontSize: 17,
          color: "var(--ink-2)",
          lineHeight: 1.4,
        } as React.CSSProperties}>
          {initial
            ? "Tes réponses actuelles sont pré-remplies."
            : "Réponds instinctivement — plus c'est honnête, mieux c'est."}
        </p>
      </div>
      <SelfProfileForm userId={userId} initial={initial} />
    </div>
  );
}
