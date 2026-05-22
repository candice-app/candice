"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { MyProfile } from "@/types";
import type { AttentionResult } from "@/lib/attention/scoring";
import { scoreTemperament } from "@/lib/temperament/scoring";
import { computeTemperamentBreathFacts, buildTemperamentFallbackText } from "@/lib/temperament/breathFacts";
import { STEP2_QUESTIONS, STEP3_QUESTIONS } from "@/lib/temperament/questions";
import { scoreLifestyle, mergeTemperamentSupplements } from "@/lib/lifestyle/scoring";
import { computeLifestyleBreathFacts, buildLifestyleFallbackText } from "@/lib/lifestyle/breathFacts";
import { STEP4_QUESTIONS, STEP5_CHOICE_QUESTIONS } from "@/lib/lifestyle/questions";
import AttentionStep from "@/components/questionnaire/AttentionStep";
import AttentionBreath from "@/components/questionnaire/AttentionBreath";
import TemperamentStep from "@/components/questionnaire/TemperamentStep";
import TemperamentBreath from "@/components/questionnaire/TemperamentBreath";
import LifestyleStep from "@/components/questionnaire/LifestyleStep";
import AvoidStep from "@/components/questionnaire/AvoidStep";
import SelfProfileForm from "@/components/questionnaire/SelfProfileForm";

type Step =
  | "attention"
  | "attentionBreath"
  | "temperament2"
  | "temperament2Breath"
  | "temperament3"
  | "temperament3Breath"
  | "lifestyle4"
  | "lifestyle4Breath"
  | "lifestyle5"
  | "lifestyle5Breath"
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
  const [lifestyle4BreathText, setLifestyle4BreathText] = useState<string>("");
  const [lifestyle5BreathText, setLifestyle5BreathText] = useState<string>("");
  const [temperamentAnswers, setTemperamentAnswers] = useState<Record<string, string>>({});
  const [lifestyleAnswers, setLifestyleAnswers] = useState<Record<string, string>>({});
  // Keep latest temperament axes in memory so lifestyle can supplement them
  const [latestTemperamentAxes, setLatestTemperamentAxes] = useState<Record<string, { score: number; intensity: number }> | null>(null);
  const [latestTemperamentModes, setLatestTemperamentModes] = useState<Record<string, { label: string; intensity: number } | null> | null>(null);

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
          setLatestTemperamentAxes(result.axes as unknown as Record<string, { score: number; intensity: number }>);
          setLatestTemperamentModes(result.modes as unknown as Record<string, { label: string; intensity: number } | null>);

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
          setLatestTemperamentAxes(result.axes as unknown as Record<string, { score: number; intensity: number }>);
          setLatestTemperamentModes(result.modes as unknown as Record<string, { label: string; intensity: number } | null>);

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
        onContinue={() => setStep("lifestyle4")}
        ctaLabel="Continuer mon profil →"
      />
    );
  }

  // ─── Step 4: Ce que j'aime vivre ─────────────────────────────────────────

  if (step === "lifestyle4") {
    return (
      <LifestyleStep
        questions={STEP4_QUESTIONS}
        onDone={async (step4Answers) => {
          const merged = { ...lifestyleAnswers, ...step4Answers };
          setLifestyleAnswers(merged);

          const result = scoreLifestyle(merged);
          const facts = computeLifestyleBreathFacts(result.axes, result.relationalFilters, 4);

          // Merge temperament supplements into latest axes
          const mergedAxes = latestTemperamentAxes
            ? mergeTemperamentSupplements(latestTemperamentAxes, result.temperamentSupplements)
            : null;
          if (mergedAxes) setLatestTemperamentAxes(mergedAxes);

          // Update canal mode if Q4d answered
          let updatedModes = latestTemperamentModes;
          if (result.canalSupplements.length > 0 && latestTemperamentModes) {
            const existingCanal = latestTemperamentModes.canal;
            const newCanalLabel = result.canalSupplements[0];
            const newIntensity = (existingCanal?.intensity ?? 0) + 1;
            updatedModes = {
              ...latestTemperamentModes,
              canal: { label: newCanalLabel, intensity: newIntensity },
            };
            setLatestTemperamentModes(updatedModes);
          }

          supabase.from("my_profile").upsert(
            {
              user_id: userId,
              lifestyle_answers: merged,
              lifestyle_axes: result.axes,
              ...(mergedAxes ? { temperament_axes: mergedAxes } : {}),
              ...(updatedModes ? { temperament_modes: updatedModes } : {}),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          ).then(() => {});

          let text: string;
          try {
            const res = await fetch("/api/lifestyle/breath", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ facts }),
            });
            const data = await res.json() as { text: string };
            text = data.text || buildLifestyleFallbackText(facts);
          } catch {
            text = buildLifestyleFallbackText(facts);
          }

          setLifestyle4BreathText(text);
          setStep("lifestyle4Breath");
        }}
      />
    );
  }

  if (step === "lifestyle4Breath") {
    return (
      <TemperamentBreath
        breathText={lifestyle4BreathText}
        onContinue={() => setStep("lifestyle5")}
        ctaLabel="Continuer →"
      />
    );
  }

  // ─── Step 5: Ce qu'il vaut mieux éviter ──────────────────────────────────

  if (step === "lifestyle5") {
    const q18 = STEP5_CHOICE_QUESTIONS[0];
    const q19 = STEP5_CHOICE_QUESTIONS[1];
    return (
      <AvoidStep
        q18Question={q18}
        q19Question={q19}
        onDone={async (step5Answers, q17Text) => {
          const merged = { ...lifestyleAnswers, ...step5Answers };
          setLifestyleAnswers(merged);

          // Extract Q17 interdits via AI (non-blocking best-effort)
          let q17Interdits: string[] = [];
          if (q17Text.trim().length > 4) {
            try {
              const res = await fetch("/api/lifestyle/extract-filters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: q17Text }),
              });
              const data = await res.json() as { interdits: string[] };
              q17Interdits = data.interdits ?? [];
            } catch {
              q17Interdits = [];
            }
          }

          const result = scoreLifestyle(merged);
          result.relationalFilters.q17Text = q17Text;
          result.relationalFilters.q17Interdits = q17Interdits;

          const facts = computeLifestyleBreathFacts(result.axes, result.relationalFilters, 5);

          // Merge temperament supplements from Q18/Q19
          const mergedAxes = latestTemperamentAxes
            ? mergeTemperamentSupplements(latestTemperamentAxes, result.temperamentSupplements)
            : null;
          if (mergedAxes) setLatestTemperamentAxes(mergedAxes);

          await supabase.from("my_profile").upsert(
            {
              user_id: userId,
              lifestyle_answers: merged,
              lifestyle_axes: result.axes,
              relational_filters: result.relationalFilters,
              lifestyle_computed_at: new Date().toISOString(),
              ...(mergedAxes ? { temperament_axes: mergedAxes } : {}),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

          let text: string;
          try {
            const res = await fetch("/api/lifestyle/breath", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ facts }),
            });
            const data = await res.json() as { text: string };
            text = data.text || buildLifestyleFallbackText(facts);
          } catch {
            text = buildLifestyleFallbackText(facts);
          }

          setLifestyle5BreathText(text);
          setStep("lifestyle5Breath");
        }}
      />
    );
  }

  if (step === "lifestyle5Breath") {
    return (
      <TemperamentBreath
        breathText={lifestyle5BreathText}
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
