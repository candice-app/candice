"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { MyProfile } from "@/types";
import type { AttentionResult } from "@/lib/attention/scoring";
import { scoreTemperament } from "@/lib/temperament/scoring";
import { computeTemperamentBreathFacts, buildTemperamentFallbackText } from "@/lib/temperament/breathFacts";
import { STEP2_QUESTIONS, STEP3_QUESTIONS } from "@/lib/temperament/questions";
import { scoreLifestyle, mergeTemperamentSupplements } from "@/lib/lifestyle/scoring";
import { computeLifestyleBreathFacts, buildLifestyleFallbackText } from "@/lib/lifestyle/breathFacts";
import { STEP4_QUESTIONS, STEP5_CHOICE_QUESTIONS } from "@/lib/lifestyle/questions";
import GenderStep from "@/components/questionnaire/GenderStep";
import AttentionStep from "@/components/questionnaire/AttentionStep";
import AttentionBreath from "@/components/questionnaire/AttentionBreath";
import TemperamentStep from "@/components/questionnaire/TemperamentStep";
import TemperamentBreath from "@/components/questionnaire/TemperamentBreath";
import LifestyleStep from "@/components/questionnaire/LifestyleStep";
import AvoidStep from "@/components/questionnaire/AvoidStep";
import SingularityStep from "@/components/questionnaire/SingularityStep";
import PracticalStep from "@/components/questionnaire/PracticalStep";
import ClosingMoment from "@/components/questionnaire/ClosingMoment";
import EditMenu from "@/components/questionnaire/EditMenu";
import OnboardingPopup from "@/components/questionnaire/OnboardingPopup";
import type { SingularityAnswers } from "@/components/questionnaire/SingularityStep";
import type { PracticalInfo } from "@/components/questionnaire/PracticalStep";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
  | "editMenu"
  | "onboarding"
  | "gender"
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
  | "singularity6"
  | "singularity6Breath"
  | "practical7"
  | "practical7Closing";

// "single" = user jumped to one specific part; after saving it, go straight to closing
type EditMode = "full" | "single" | "resume" | null;

type ExtendedProfile = MyProfile & {
  attention_reception?:  { dominant: string[] } | null;
  temperament_answers?:  Record<string, string> | null;
  temperament_axes?:     Record<string, { score: number; intensity: number }> | null;
  temperament_modes?:    Record<string, { label: string; intensity: number } | null> | null;
  lifestyle_answers?:    Record<string, string> | null;
  relational_filters?:   Record<string, unknown> | null;
  singularity_answers?:  Record<string, string> | null;
  practical_info?:       (Partial<PracticalInfo> & { role_familial?: string | string[] }) | null;
};

interface Props {
  userId: string;
  initial: MyProfile | null;
  piloteFirstName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isQuestionnaireComplete(p: ExtendedProfile): boolean {
  if (!p.attention_reception) return false;
  const ta = p.temperament_answers ?? {};
  if (!STEP2_QUESTIONS.every(q => ta[q.id])) return false;
  if (!STEP3_QUESTIONS.every(q => ta[q.id])) return false;
  const la = p.lifestyle_answers ?? {};
  if (!STEP4_QUESTIONS.every(q => la[q.id])) return false;
  if (!STEP5_CHOICE_QUESTIONS.every(q => la[q.id])) return false;
  if (!p.practical_info) return false;
  return true;
}

function firstIncompleteStep(p: ExtendedProfile): Step {
  if (!p.attention_reception) return "attention";
  const ta = p.temperament_answers ?? {};
  if (!STEP2_QUESTIONS.every(q => ta[q.id])) return "temperament2";
  if (!STEP3_QUESTIONS.every(q => ta[q.id])) return "temperament3";
  const la = p.lifestyle_answers ?? {};
  if (!STEP4_QUESTIONS.every(q => la[q.id])) return "lifestyle4";
  if (!STEP5_CHOICE_QUESTIONS.every(q => la[q.id])) return "lifestyle5";
  if (!p.practical_info) return "practical7";
  return "practical7Closing";
}

function partIdToStep(partId: string): Step {
  const map: Record<string, Step> = {
    attention:    "attention",
    temperament2: "temperament2",
    temperament3: "temperament3",
    lifestyle4:   "lifestyle4",
    lifestyle5:   "lifestyle5",
    singularity6: "singularity6",
    practical7:   "practical7",
  };
  return map[partId] ?? "practical7";
}

const SINGULARITY_BREATH =
  "C'est souvent dans ces détails que Candice devient vraiment précise. " +
  "Ces réponses donnent à Candice la matière la plus personnelle : ce qui ne rentre dans aucune case. " +
  "Ton profil relationnel prend maintenant toute sa profondeur.";

const STEP_ORDER: Step[] = [
  "gender", "attention", "attentionBreath",
  "temperament2", "temperament2Breath",
  "temperament3", "temperament3Breath",
  "lifestyle4", "lifestyle4Breath",
  "lifestyle5", "lifestyle5Breath",
  "singularity6", "singularity6Breath",
  "practical7",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuestionnaireFlow({ userId, initial, piloteFirstName }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite_token");
  const inviteLinkCalled = useRef(false);
  const ext = initial as ExtendedProfile | null;

  // ?part=X → jump directly to that section (bypasses editMenu)
  const partParam = searchParams.get("part");
  const initialStep: Step = partParam
    ? partIdToStep(partParam)
    : ext ? "editMenu" : "onboarding";

  // ── Edit mode state ──────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState<EditMode>(partParam ? "single" : null);

  const [step, setStep] = useState<Step>(initialStep);
  const [stepHistory, setStepHistory] = useState<Step[]>([]);

  // ── Navigation helpers ───────────────────────────────────────────────────
  function navigate(next: Step) {
    setStepHistory(prev => [...prev, step]);
    setStep(next);
  }

  function goBack() {
    setStepHistory(prev => {
      const history = [...prev];
      const prevStep = history.pop();
      if (prevStep !== undefined) setStep(prevStep);
      return history;
    });
  }

  function exitQuestionnaire() {
    router.push("/moi");
  }

  // Fire-and-forget: called after each part saves so analysis stays current
  function triggerSynthesis() {
    fetch("/api/profile/generate", { method: "POST" }).catch(() => {});
  }

  const canGoBack = stepHistory.length > 0;

  function withProgress(content: React.ReactNode) {
    const idx = STEP_ORDER.indexOf(step);
    const progress = idx === -1 ? 0 : (idx + 1) / STEP_ORDER.length;
    return (
      <>
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          height: 3, zIndex: 20, background: "rgba(23,62,49,.10)",
        }}>
          <div style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: "var(--pine)",
            transition: "width .5s ease",
          }} />
        </div>
        {content}
      </>
    );
  }

  // ── Invite-link: fire once when questionnaire closes ─────────────────────
  useEffect(() => {
    if (step !== "practical7Closing" || !inviteToken || inviteLinkCalled.current) return;
    inviteLinkCalled.current = true;
    fetch("/api/invite/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: inviteToken }),
    }).catch(console.error);
  }, [step, inviteToken]);

  // ── Pre-filled states from existing profile ───────────────────────────────
  const [attentionResult, setAttentionResult]       = useState<AttentionResult | null>(null);
  const [attentionBreathText, setAttentionBreathText] = useState<string>("");
  const [step2BreathText, setStep2BreathText]       = useState<string>("");
  const [step3BreathText, setStep3BreathText]       = useState<string>("");
  const [lifestyle4BreathText, setLifestyle4BreathText] = useState<string>("");
  const [lifestyle5BreathText, setLifestyle5BreathText] = useState<string>("");

  const [temperamentAnswers, setTemperamentAnswers] = useState<Record<string, string>>(
    ext?.temperament_answers ?? {}
  );
  const [lifestyleAnswers, setLifestyleAnswers] = useState<Record<string, string>>(
    ext?.lifestyle_answers ?? {}
  );
  const [latestTemperamentAxes, setLatestTemperamentAxes] = useState<
    Record<string, { score: number; intensity: number }> | null
  >(ext?.temperament_axes ?? null);
  const [latestTemperamentModes, setLatestTemperamentModes] = useState<
    Record<string, { label: string; intensity: number } | null> | null
  >(ext?.temperament_modes ?? null);

  // ── After single-part save: skip to closing ───────────────────────────────
  function afterSave() {
    if (editMode === "single") {
      navigate("practical7Closing");
    }
  }

  // ── Edit menu ─────────────────────────────────────────────────────────────

  if (step === "editMenu" && ext) {
    const complete = isQuestionnaireComplete(ext);
    const firstStep = complete ? null : firstIncompleteStep(ext);

    return (
      <EditMenu
        isComplete={complete}
        firstStepId={firstStep}
        onExit={exitQuestionnaire}
        onResume={() => {
          setEditMode("resume");
          navigate(firstStep ?? "practical7Closing");
        }}
        onJumpTo={(partId) => {
          setEditMode("single");
          navigate(partIdToStep(partId));
        }}
        onFull={() => {
          setEditMode("full");
          navigate("attention");
        }}
      />
    );
  }

  // ─── Onboarding (shown once, new users only) ─────────────────────────────

  if (step === "onboarding") {
    return <OnboardingPopup onStart={() => navigate("gender")} />;
  }

  // ─── Step 0: Genre ───────────────────────────────────────────────────────

  if (step === "gender") {
    return withProgress(
      <GenderStep
        userId={userId}
        supabase={supabase}
        onDone={() => navigate("attention")}
      />
    );
  }

  // ─── Step 1: Attention ────────────────────────────────────────────────────

  if (step === "attention") {
    return withProgress(
      <AttentionStep
        userId={userId}
        onBack={canGoBack ? goBack : undefined}
        onExit={exitQuestionnaire}
        onDone={(result, text) => {
          setAttentionResult(result);
          setAttentionBreathText(text);
          triggerSynthesis();
          if (editMode === "single") { navigate("practical7Closing"); return; }
          navigate("attentionBreath");
        }}
      />
    );
  }

  if (step === "attentionBreath") {
    return withProgress(
      <AttentionBreath
        breathText={attentionBreathText}
        onContinue={() => navigate("temperament2")}
        progressLabel="Candice commence à te connaître."
      />
    );
  }

  // ─── Step 2: Énergie relationnelle ───────────────────────────────────────

  if (step === "temperament2") {
    return withProgress(
      <TemperamentStep
        questions={STEP2_QUESTIONS}
        stepNumber={2}
        totalSteps={7}
        initialAnswers={temperamentAnswers}
        onBack={canGoBack ? goBack : undefined}
        onExit={exitQuestionnaire}
        onDone={async (step2Answers) => {
          const merged = { ...temperamentAnswers, ...step2Answers };
          setTemperamentAnswers(merged);

          const result = scoreTemperament(merged);
          const facts = computeTemperamentBreathFacts(result.axes, result.modes, 2);
          setLatestTemperamentAxes(result.axes as unknown as Record<string, { score: number; intensity: number }>);
          setLatestTemperamentModes(result.modes as unknown as Record<string, { label: string; intensity: number } | null>);

          supabase.from("my_profile").upsert(
            { user_id: userId, temperament_answers: merged, temperament_axes: result.axes, temperament_modes: result.modes, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          ).then(() => { triggerSynthesis(); });

          if (editMode === "single") { navigate("practical7Closing"); return; }

          let text: string;
          try {
            const res = await fetch("/api/temperament/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts }) });
            const data = await res.json() as { text: string };
            text = data.text || buildTemperamentFallbackText(facts);
          } catch { text = buildTemperamentFallbackText(facts); }

          setStep2BreathText(text);
          navigate("temperament2Breath");
        }}
      />
    );
  }

  if (step === "temperament2Breath") {
    return withProgress(
      <TemperamentBreath
        breathText={step2BreathText}
        onContinue={() => navigate("temperament3")}
        ctaLabel="Continuer →"
        progressLabel="Candice te connaît un peu mieux."
      />
    );
  }

  // ─── Step 3: Communication & décision ────────────────────────────────────

  if (step === "temperament3") {
    return withProgress(
      <TemperamentStep
        questions={STEP3_QUESTIONS}
        stepNumber={3}
        totalSteps={7}
        initialAnswers={temperamentAnswers}
        onBack={canGoBack ? goBack : undefined}
        onExit={exitQuestionnaire}
        onDone={async (step3Answers) => {
          const merged = { ...temperamentAnswers, ...step3Answers };
          setTemperamentAnswers(merged);

          const result = scoreTemperament(merged);
          const facts = computeTemperamentBreathFacts(result.axes, result.modes, 3);
          setLatestTemperamentAxes(result.axes as unknown as Record<string, { score: number; intensity: number }>);
          setLatestTemperamentModes(result.modes as unknown as Record<string, { label: string; intensity: number } | null>);

          await supabase.from("my_profile").upsert(
            { user_id: userId, temperament_answers: merged, temperament_axes: result.axes, temperament_modes: result.modes, temperament_computed_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
          triggerSynthesis();

          if (editMode === "single") { navigate("practical7Closing"); return; }

          let text: string;
          try {
            const res = await fetch("/api/temperament/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts }) });
            const data = await res.json() as { text: string };
            text = data.text || buildTemperamentFallbackText(facts);
          } catch { text = buildTemperamentFallbackText(facts); }

          setStep3BreathText(text);
          navigate("temperament3Breath");
        }}
      />
    );
  }

  if (step === "temperament3Breath") {
    return withProgress(
      <TemperamentBreath
        breathText={step3BreathText}
        onContinue={() => navigate("lifestyle4")}
        ctaLabel="Continuer →"
        progressLabel="Candice saisit ce qui compte pour toi."
      />
    );
  }

  // ─── Step 4: Ce que j'aime vivre ─────────────────────────────────────────

  if (step === "lifestyle4") {
    return withProgress(
      <LifestyleStep
        questions={STEP4_QUESTIONS}
        initialAnswers={lifestyleAnswers}
        onBack={canGoBack ? goBack : undefined}
        onExit={exitQuestionnaire}
        onDone={async (step4Answers) => {
          const merged = { ...lifestyleAnswers, ...step4Answers };
          setLifestyleAnswers(merged);

          const result = scoreLifestyle(merged);
          const facts = computeLifestyleBreathFacts(result.axes, result.relationalFilters, 4);

          const mergedAxes = latestTemperamentAxes
            ? mergeTemperamentSupplements(latestTemperamentAxes, result.temperamentSupplements)
            : null;
          if (mergedAxes) setLatestTemperamentAxes(mergedAxes);

          let updatedModes = latestTemperamentModes;
          if (result.canalSupplements.length > 0 && latestTemperamentModes) {
            const existingCanal = latestTemperamentModes.canal;
            const newIntensity = (existingCanal?.intensity ?? 0) + 1;
            updatedModes = { ...latestTemperamentModes, canal: { label: result.canalSupplements[0], intensity: newIntensity } };
            setLatestTemperamentModes(updatedModes);
          }

          supabase.from("my_profile").upsert(
            { user_id: userId, lifestyle_answers: merged, lifestyle_axes: result.axes, ...(mergedAxes ? { temperament_axes: mergedAxes } : {}), ...(updatedModes ? { temperament_modes: updatedModes } : {}), updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          ).then(() => { triggerSynthesis(); });

          if (editMode === "single") { navigate("practical7Closing"); return; }

          let text: string;
          try {
            const res = await fetch("/api/lifestyle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts }) });
            const data = await res.json() as { text: string };
            text = data.text || buildLifestyleFallbackText(facts);
          } catch { text = buildLifestyleFallbackText(facts); }

          setLifestyle4BreathText(text);
          navigate("lifestyle4Breath");
        }}
      />
    );
  }

  if (step === "lifestyle4Breath") {
    return withProgress(
      <TemperamentBreath
        breathText={lifestyle4BreathText}
        onContinue={() => navigate("lifestyle5")}
        ctaLabel="Continuer →"
        progressLabel="Encore quelques questions, et Candice te connaîtra vraiment."
      />
    );
  }

  // ─── Step 5: Ce qu'il vaut mieux éviter ──────────────────────────────────

  if (step === "lifestyle5") {
    const q18 = STEP5_CHOICE_QUESTIONS[0];
    const q19 = STEP5_CHOICE_QUESTIONS[1];
    const q17TextInit = typeof ext?.relational_filters?.q17Text === "string"
      ? ext.relational_filters.q17Text as string : "";

    return withProgress(
      <AvoidStep
        q18Question={q18}
        q19Question={q19}
        initialAnswers={lifestyleAnswers}
        initialQ17Text={q17TextInit}
        onBack={canGoBack ? goBack : undefined}
        onExit={exitQuestionnaire}
        onDone={async (step5Answers, q17Text) => {
          const merged = { ...lifestyleAnswers, ...step5Answers };
          setLifestyleAnswers(merged);

          let q17Interdits: string[] = [];
          if (q17Text.trim().length > 4) {
            try {
              const res = await fetch("/api/lifestyle/extract-filters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: q17Text }) });
              const data = await res.json() as { interdits: string[] };
              q17Interdits = data.interdits ?? [];
            } catch { q17Interdits = []; }
          }

          const result = scoreLifestyle(merged);
          result.relationalFilters.q17Text = q17Text;
          result.relationalFilters.q17Interdits = q17Interdits;
          const facts = computeLifestyleBreathFacts(result.axes, result.relationalFilters, 5);

          const mergedAxes = latestTemperamentAxes
            ? mergeTemperamentSupplements(latestTemperamentAxes, result.temperamentSupplements)
            : null;
          if (mergedAxes) setLatestTemperamentAxes(mergedAxes);

          await supabase.from("my_profile").upsert(
            { user_id: userId, lifestyle_answers: merged, lifestyle_axes: result.axes, relational_filters: result.relationalFilters, lifestyle_computed_at: new Date().toISOString(), ...(mergedAxes ? { temperament_axes: mergedAxes } : {}), updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
          triggerSynthesis();

          if (editMode === "single") { navigate("practical7Closing"); return; }

          let text: string;
          try {
            const res = await fetch("/api/lifestyle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts }) });
            const data = await res.json() as { text: string };
            text = data.text || buildLifestyleFallbackText(facts);
          } catch { text = buildLifestyleFallbackText(facts); }

          setLifestyle5BreathText(text);
          navigate("lifestyle5Breath");
        }}
      />
    );
  }

  if (step === "lifestyle5Breath") {
    return withProgress(
      <TemperamentBreath
        breathText={lifestyle5BreathText}
        onContinue={() => navigate("singularity6")}
        ctaLabel="Continuer →"
        progressLabel="Encore quelques questions, et Candice te connaîtra vraiment."
      />
    );
  }

  // ─── Step 6: Ce qui me rend unique ───────────────────────────────────────

  if (step === "singularity6") {
    const singInit = ext?.singularity_answers
      ? (ext.singularity_answers as unknown as SingularityAnswers)
      : undefined;

    return withProgress(
      <SingularityStep
        initialAnswers={singInit}
        onBack={canGoBack ? goBack : undefined}
        onExit={(answers) => {
          supabase.from("my_profile").upsert(
            { user_id: userId, singularity_answers: answers, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          ).then(() => {});
          exitQuestionnaire();
        }}
        onDone={async (answers: SingularityAnswers) => {
          supabase.from("my_profile").upsert(
            { user_id: userId, singularity_answers: answers, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          ).then(() => { triggerSynthesis(); });

          if (editMode === "single") { navigate("practical7Closing"); return; }

          const hasContent = Object.values(answers).some(v => v.trim().length > 0);
          navigate(hasContent ? "singularity6Breath" : "practical7");
        }}
      />
    );
  }

  if (step === "singularity6Breath") {
    return withProgress(
      <TemperamentBreath
        breathText={SINGULARITY_BREATH}
        onContinue={() => navigate("practical7")}
        ctaLabel="Continuer →"
        progressLabel="Encore quelques questions, et Candice te connaîtra vraiment."
      />
    );
  }

  // ─── Step 7: Informations pratiques ──────────────────────────────────────

  if (step === "practical7") {
    return withProgress(
      <PracticalStep
        initialInfo={ext?.practical_info ?? undefined}
        onBack={canGoBack ? goBack : undefined}
        onExit={(info) => {
          supabase.from("my_profile").upsert(
            { user_id: userId, practical_info: info, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          ).then(() => {});
          exitQuestionnaire();
        }}
        onDone={async (info: PracticalInfo) => {
          await supabase.from("my_profile").upsert(
            { user_id: userId, practical_info: info, practical_computed_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
          triggerSynthesis();
          afterSave();
          if (editMode !== "single") navigate("practical7Closing");
        }}
      />
    );
  }

  // ─── Closing moment ───────────────────────────────────────────────────────

  return <ClosingMoment piloteFirstName={piloteFirstName} />;
}
