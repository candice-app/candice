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
    <>
      <div style={{ marginBottom: 28 }}>
        <p className="section-label">Mon profil</p>
        <h1 className="page-title" style={{ marginBottom: 4 }}>
          {initial ? "Modifier ma fiche." : "Remplir ma fiche."}
        </h1>
        <p style={{
          fontSize: 20, fontWeight: 400,
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: "italic", color: "var(--con)", lineHeight: 1.3,
        }}>
          {initial
            ? "Tes réponses actuelles sont pré-remplies."
            : "Réponds instinctivement — plus c'est honnête, mieux c'est."}
        </p>
      </div>
      <SelfProfileForm userId={userId} initial={initial} />
    </>
  );
}
