"use client";

import { useState } from "react";
import type { MyProfile } from "@/types";
import type { AttentionResult } from "@/lib/attention/scoring";
import AttentionStep from "@/components/questionnaire/AttentionStep";
import AttentionBreath from "@/components/questionnaire/AttentionBreath";
import SelfProfileForm from "@/components/questionnaire/SelfProfileForm";

type Step = "attention" | "breath" | "profile";

interface Props {
  userId: string;
  initial: MyProfile | null;
}

export default function QuestionnaireFlow({ userId, initial }: Props) {
  const [step, setStep] = useState<Step>("attention");
  const [attentionResult, setAttentionResult] = useState<AttentionResult | null>(null);
  const [breathText, setBreathText] = useState<string>("");

  if (step === "attention") {
    return (
      <AttentionStep
        userId={userId}
        onDone={(result, text) => {
          setAttentionResult(result);
          setBreathText(text);
          setStep("breath");
        }}
      />
    );
  }

  if (step === "breath" && attentionResult) {
    return (
      <AttentionBreath
        breathText={breathText}
        onContinue={() => setStep("profile")}
      />
    );
  }

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
