"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { MyProfile } from "@/types";
import type { AttentionResult } from "@/lib/attention/scoring";
import { scoreTemperament } from "@/lib/temperament/scoring";
import { computeTemperamentBreathFacts } from "@/lib/temperament/breathFacts";
import { STEP2_QUESTIONS, STEP3_QUESTIONS } from "@/lib/temperament/questions";
import { socleCanonicalTemperament, socleCanonicalLifestyle, socleCanonicalSingularity, socleCanonicalConclusion } from "@/lib/questionnaire/flags";
import { buildCanonicalTemperamentQuestion, legacyIdToRef } from "@/lib/questionnaire/canonical-temperament";
import { buildCanonicalLifestyleQuestion, legacyIdToRef as lifestyleLegacyIdToRef } from "@/lib/questionnaire/canonical-lifestyle";
import { produceSocleAnswer, produceSocleFact } from "@/lib/questionnaire/produce-socle";
import { SINGULARITY_FACT_FIELDS, PRACTICAL_FACT_FIELDS, Q17_FACT_FIELD } from "@/lib/questionnaire/socle-facts-fields";
import { readSocleTags, readSocleFacts, type TagsReadClient } from "@/lib/questionnaire/breath-tags";
import type { WriteClient } from "@/lib/knowledge-write/persist";
import { scoreLifestyle, mergeTemperamentSupplements } from "@/lib/lifestyle/scoring";
import { computeLifestyleBreathFacts } from "@/lib/lifestyle/breathFacts";
import { STEP4_QUESTIONS_ACTIVE, STEP5_CHOICE_QUESTIONS } from "@/lib/lifestyle/questions";
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

// Lot B A1 : flag ON → tempérament rendu DEPUIS LE CANONIQUE (labels/subtexts canoniques, id d'option
// legacy conservé → scoring + temperament_answers inchangés). OFF → banque legacy inchangée.
const TEMP_STEP2_RENDERED = socleCanonicalTemperament ? STEP2_QUESTIONS.map((q) => buildCanonicalTemperamentQuestion(q.id)) : STEP2_QUESTIONS;
const TEMP_STEP3_RENDERED = socleCanonicalTemperament ? STEP3_QUESTIONS.map((q) => buildCanonicalTemperamentQuestion(q.id)) : STEP3_QUESTIONS;
const LIFE_STEP4_RENDERED = socleCanonicalLifestyle ? STEP4_QUESTIONS_ACTIVE.map((q) => buildCanonicalLifestyleQuestion(q.id)) : STEP4_QUESTIONS_ACTIVE;
const LIFE_STEP5_RENDERED = socleCanonicalLifestyle ? STEP5_CHOICE_QUESTIONS.map((q) => buildCanonicalLifestyleQuestion(q.id)) : STEP5_CHOICE_QUESTIONS;

// Journal (par réponse) + respiration CUMULATIVE (attention + tempérament) depuis le journal.
// Renvoie le texte de respiration (vide si échec — jamais de repli legacy, cf. §47bis).
async function temperamentJournalAndBreath(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  stepAnswers: Record<string, string>,
): Promise<string> {
  const ts = new Date().toISOString();
  const client = supabase as unknown as WriteClient;
  try {
    for (const legId of Object.values(stepAnswers)) {
      const ref = legacyIdToRef.get(legId); // id legacy → optionRef canonique
      if (ref) await produceSocleAnswer(client, { userId, selectedOptionRefs: [ref], timestamp: ts });
    }
  } catch (e) {
    console.error("[QuestionnaireFlow] produceSocleAnswer (tempérament) a échoué :", e);
  }
  try {
    const input = await readSocleTags(supabase as unknown as TagsReadClient, userId); // cumulatif
    const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const data = (await res.json()) as { text: string };
    return data.text ?? "";
  } catch {
    return "";
  }
}

// A3 — produit les FACTs verbatim (singularité + q17 + pratique) puis renvoie la respiration CUMULATIVE
// depuis le journal. Les FACTs ne produisent AUCUN signal : ils n'ajoutent pas de tag à la respiration
// (qui lit les constructs). Vide si échec — jamais de repli legacy (§47bis).
async function singularityFactsAndBreath(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  entries: ReadonlyArray<{ spec: (typeof SINGULARITY_FACT_FIELDS)[string]; value: string }>,
): Promise<string> {
  const ts = new Date().toISOString();
  try {
    await produceSocleFact(supabase as unknown as WriteClient, { userId, entries, timestamp: ts });
  } catch (e) {
    console.error("[QuestionnaireFlow] produceSocleFact (singularité) a échoué :", e);
  }
  // Extraction §27 (inférence niveau 5) sur les réponses LIBRES rédactionnelles (singularité + q17) — côté
  // SERVEUR (clé Anthropic). Fire-and-forget : n'ajoute aucune attente au parcours ; le FACT verbatim déclaré
  // est déjà écrit, l'extraction enrichit. Les champs PRATIQUES plats (prénom, taille, adresse…) ne passent
  // JAMAIS par là. La préséance garantit que l'inféré ne masque pas le déclaré au read (§48bis).
  try {
    const toExtract = entries
      .filter((e) => e.value?.trim())
      .map((e) => ({ rawText: e.value, fieldContext: e.spec.questionText }));
    if (toExtract.length) {
      void fetch("/api/knowledge/extract-free-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: toExtract, timestamp: ts }),
      }).catch((e) => console.error("[QuestionnaireFlow] extraction A3 (fire-and-forget) a échoué :", e));
    }
  } catch (e) {
    console.error("[QuestionnaireFlow] extraction A3 (préparation) a échoué :", e);
  }
  try {
    const input = await readSocleTags(supabase as unknown as TagsReadClient, userId);
    // FACTs restituables (filtre de visibilité mécanique dans readSocleFacts) → nommés, jamais interprétés.
    const facts = await readSocleFacts(supabase as unknown as TagsReadClient, userId);
    const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, facts }) });
    const data = (await res.json()) as { text: string };
    return data.text ?? "";
  } catch {
    return "";
  }
}

// Idem pour le lifestyle : journal (par réponse, via le mapping canonique) + respiration CUMULATIVE
// (attention + tempérament + lifestyle) depuis le journal. Vide si échec — jamais de repli legacy (§47bis).
async function lifestyleJournalAndBreath(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  stepAnswers: Record<string, string>,
): Promise<string> {
  const ts = new Date().toISOString();
  const client = supabase as unknown as WriteClient;
  try {
    for (const legId of Object.values(stepAnswers)) {
      const ref = lifestyleLegacyIdToRef.get(legId); // id legacy → optionRef canonique
      if (ref) await produceSocleAnswer(client, { userId, selectedOptionRefs: [ref], timestamp: ts });
    }
  } catch (e) {
    console.error("[QuestionnaireFlow] produceSocleAnswer (lifestyle) a échoué :", e);
  }
  try {
    const input = await readSocleTags(supabase as unknown as TagsReadClient, userId); // cumulatif
    const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const data = (await res.json()) as { text: string };
    return data.text ?? "";
  } catch {
    return "";
  }
}

// B — CONCLUSION ANALYTIQUE FINALE. Lit TOUT le journal self (5 domaines) + les FACTs restituables,
// applique 7a/7b/7c/7d via /api/socle/breath (self). JAMAIS my_profile, JAMAIS de repli : vide si échec.
async function finalConclusionFromJournal(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string> {
  try {
    const input = await readSocleTags(supabase as unknown as TagsReadClient, userId); // tout le journal, cumulatif
    const facts = await readSocleFacts(supabase as unknown as TagsReadClient, userId); // FACTs restituables (filtre visibilité)
    const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, facts, subject: "self" }) });
    const data = (await res.json()) as { text: string };
    return data.text ?? "";
  } catch {
    return ""; // panne → rien, jamais de repli
  }
}

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
  | "conclusion8"
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
  if (!STEP4_QUESTIONS_ACTIVE.every(q => la[q.id])) return false;
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
  if (!STEP4_QUESTIONS_ACTIVE.every(q => la[q.id])) return "lifestyle4";
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
  const [singularity6BreathText, setSingularity6BreathText] = useState<string>("");
  const [conclusionText, setConclusionText] = useState<string>("");

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
          // Point 3 : texte vide → étape SAUTÉE, jamais un cadre de respiration sans prose.
          if (!text) { navigate("temperament2"); return; }
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
        questions={TEMP_STEP2_RENDERED}
        stepNumber={2}
        totalSteps={7}
        initialAnswers={temperamentAnswers}
        onBack={canGoBack ? goBack : undefined}
        onExit={exitQuestionnaire}
        onDone={async (step2Answers) => {
          const merged = { ...temperamentAnswers, ...step2Answers };
          setTemperamentAnswers(merged);

          // Projection INCHANGÉE : scoreTemperament sur les ids legacy (conservés), my_profile identique.
          const result = scoreTemperament(merged);
          const facts = computeTemperamentBreathFacts(result.axes, result.modes, 2);
          setLatestTemperamentAxes(result.axes as unknown as Record<string, { score: number; intensity: number }>);
          setLatestTemperamentModes(result.modes as unknown as Record<string, { label: string; intensity: number } | null>);

          supabase.from("my_profile").upsert(
            { user_id: userId, temperament_answers: merged, temperament_axes: result.axes, temperament_modes: result.modes, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          ).then(({ error }) => { if (error) console.error("[QuestionnaireFlow] my_profile upsert (temperament step2)", error.message); triggerSynthesis(); });

          if (editMode === "single") { navigate("practical7Closing"); return; }

          let text: string;
          if (socleCanonicalTemperament) {
            // A1 : journal (par réponse) + respiration CUMULATIVE (attention + tempérament).
            text = await temperamentJournalAndBreath(supabase, userId, step2Answers);
          } else {
            try {
              const res = await fetch("/api/temperament/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts }) });
              const data = await res.json() as { text: string };
              text = data.text || "";
            } catch { text = ""; }
          }

          setStep2BreathText(text);
          if (!text) { navigate("temperament3"); return; } // point 3 : saut si vide
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
        questions={TEMP_STEP3_RENDERED}
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

          {
            const { error } = await supabase.from("my_profile").upsert(
              { user_id: userId, temperament_answers: merged, temperament_axes: result.axes, temperament_modes: result.modes, temperament_computed_at: new Date().toISOString(), updated_at: new Date().toISOString() },
              { onConflict: "user_id" }
            );
            if (error) console.error("[QuestionnaireFlow] my_profile upsert (temperament step3)", error.message);
          }
          triggerSynthesis();

          if (editMode === "single") { navigate("practical7Closing"); return; }

          let text: string;
          if (socleCanonicalTemperament) {
            text = await temperamentJournalAndBreath(supabase, userId, step3Answers);
          } else {
            try {
              const res = await fetch("/api/temperament/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts }) });
              const data = await res.json() as { text: string };
              text = data.text || "";
            } catch { text = ""; }
          }

          setStep3BreathText(text);
          if (!text) { navigate("lifestyle4"); return; } // point 3 : saut si vide
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
        questions={LIFE_STEP4_RENDERED}
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
          ).then(({ error }) => { if (error) console.error("[QuestionnaireFlow] my_profile upsert (lifestyle step4)", error.message); triggerSynthesis(); });

          if (editMode === "single") { navigate("practical7Closing"); return; }

          let text: string;
          if (socleCanonicalLifestyle) {
            // Journal (par réponse) + respiration CUMULATIVE depuis le journal. Jamais de repli legacy (§47bis).
            text = await lifestyleJournalAndBreath(supabase, userId, step4Answers);
          } else {
            try {
              const res = await fetch("/api/lifestyle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts }) });
              const data = await res.json() as { text: string };
              text = data.text || "";
            } catch { text = ""; }
          }

          setLifestyle4BreathText(text);
          if (!text) { navigate("lifestyle5"); return; } // point 3 : saut si vide
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
    const q18 = LIFE_STEP5_RENDERED[0];
    const q19 = LIFE_STEP5_RENDERED[1];
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

          {
            const { error } = await supabase.from("my_profile").upsert(
              { user_id: userId, lifestyle_answers: merged, lifestyle_axes: result.axes, relational_filters: result.relationalFilters, lifestyle_computed_at: new Date().toISOString(), ...(mergedAxes ? { temperament_axes: mergedAxes } : {}), updated_at: new Date().toISOString() },
              { onConflict: "user_id" }
            );
            if (error) console.error("[QuestionnaireFlow] my_profile upsert (lifestyle step5)", error.message);
          }
          triggerSynthesis();

          if (editMode === "single") { navigate("practical7Closing"); return; }

          let text: string;
          if (socleCanonicalLifestyle) {
            text = await lifestyleJournalAndBreath(supabase, userId, step5Answers);
          } else {
            try {
              const res = await fetch("/api/lifestyle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facts }) });
              const data = await res.json() as { text: string };
              text = data.text || "";
            } catch { text = ""; }
          }

          setLifestyle5BreathText(text);
          if (!text) { navigate("singularity6"); return; } // point 3 : saut si vide
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
          ).then(({ error }) => { if (error) console.error("[QuestionnaireFlow] my_profile upsert (singularity onExit)", error.message); });
          exitQuestionnaire();
        }}
        onDone={async (answers: SingularityAnswers) => {
          supabase.from("my_profile").upsert(
            { user_id: userId, singularity_answers: answers, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          ).then(({ error }) => { if (error) console.error("[QuestionnaireFlow] my_profile upsert (singularity onDone)", error.message); triggerSynthesis(); });

          if (editMode === "single") { navigate("practical7Closing"); return; }

          const hasContent = Object.keys(SINGULARITY_FACT_FIELDS).some((k) => (answers[k as keyof SingularityAnswers] as string | undefined)?.trim());
          if (socleCanonicalSingularity) {
            // FACTs verbatim : les 11 champs singularité + q17 (texte libre déjà saisi au step avoid).
            const entries = Object.entries(SINGULARITY_FACT_FIELDS).map(([k, spec]) => ({ spec, value: (answers[k as keyof SingularityAnswers] as string) ?? "" }));
            const q17Text = typeof ext?.relational_filters?.q17Text === "string" ? (ext.relational_filters.q17Text as string) : "";
            if (q17Text) entries.push({ spec: Q17_FACT_FIELD, value: q17Text });
            const text = await singularityFactsAndBreath(supabase, userId, entries);
            setSingularity6BreathText(text);
            // point 3 : pas de contenu OU texte vide → saut (jamais un cadre sans prose).
            navigate(text ? "singularity6Breath" : "practical7");
            return;
          }
          navigate(hasContent ? "singularity6Breath" : "practical7");
        }}
      />
    );
  }

  if (step === "singularity6Breath") {
    return withProgress(
      <TemperamentBreath
        breathText={socleCanonicalSingularity ? singularity6BreathText : SINGULARITY_BREATH}
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
          ).then(({ error }) => { if (error) console.error("[QuestionnaireFlow] my_profile upsert (practical onExit)", error.message); });
          exitQuestionnaire();
        }}
        onDone={async (info: PracticalInfo) => {
          const { error } = await supabase.from("my_profile").upsert(
            { user_id: userId, practical_info: info, practical_computed_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
          if (error) console.error("[QuestionnaireFlow] my_profile upsert (practical onDone)", error.message);

          if (socleCanonicalSingularity) {
            // FACTs verbatim des champs pratiques (tableaux joints tels quels). Projection inchangée.
            const entries = Object.entries(PRACTICAL_FACT_FIELDS).map(([k, spec]) => {
              const raw = (info as unknown as Record<string, unknown>)[k];
              const value = Array.isArray(raw) ? raw.join(", ") : typeof raw === "string" ? raw : "";
              return { spec, value };
            });
            try { await produceSocleFact(supabase as unknown as WriteClient, { userId, entries, timestamp: new Date().toISOString() }); }
            catch (e) { console.error("[QuestionnaireFlow] produceSocleFact (pratique) a échoué :", e); }
          }

          triggerSynthesis();
          afterSave();
          if (editMode !== "single") {
            if (socleCanonicalConclusion) {
              // B — conclusion analytique finale : lit TOUT le journal self (5 domaines), jamais my_profile.
              const text = await finalConclusionFromJournal(supabase, userId);
              setConclusionText(text);
              // point 3 : conclusion vide → on saute vers la clôture, jamais un cadre sans prose.
              navigate(text ? "conclusion8" : "practical7Closing");
            } else {
              navigate("practical7Closing");
            }
          }
        }}
      />
    );
  }

  // ─── Conclusion analytique finale (B) — flag-gated ─────────────────────────

  if (step === "conclusion8") {
    return withProgress(
      <TemperamentBreath
        breathText={conclusionText}
        onContinue={() => navigate("practical7Closing")}
        ctaLabel="Découvrir mon profil →"
        progressLabel="Candice a fait le tour de ce que tu lui as confié."
      />
    );
  }

  // ─── Closing moment ───────────────────────────────────────────────────────

  return <ClosingMoment piloteFirstName={piloteFirstName} />;
}
