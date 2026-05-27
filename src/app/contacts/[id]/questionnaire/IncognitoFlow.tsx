"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { QuestionnaireResponse } from "@/types";
import LivePoint from "@/components/presence/LivePoint";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowStep =
  | "intro" | "q1" | "breath1"
  | "q2" | "q3" | "q4" | "q5" | "breath2"
  | "q6" | "q7" | "q8" | "breath3"
  | "open" | "practical" | "closing";

type Gender = "femme" | "homme" | "non_binaire" | "non_precise" | null;
type AttentionDim = "MOT" | "SER" | "CAD_C" | "CAD_S" | "EXP" | "GES" | "SUR";

interface FaceResult {
  raw: Record<AttentionDim, number>;
  normalized: Record<AttentionDim, number>;
  dominant: AttentionDim[];
  secondaire: AttentionDim[];
  tertiaire: AttentionDim[];
}

interface Props {
  contactId: string;
  contactName: string;
  contactGender: Gender;
  existingResponse: QuestionnaireResponse | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_PROGRESS: Record<FlowStep, number> = {
  intro: 0, q1: 10, breath1: 20,
  q2: 28, q3: 36, q4: 46, q5: 54, breath2: 56,
  q6: 64, q7: 74, q8: 82, breath3: 84,
  open: 90, practical: 96, closing: 100,
};

const Q1_DIM_WEIGHTS: Record<string, Partial<Record<AttentionDim, number>>> = {
  mots:          { MOT: 1.0 },
  presence:      { SER: 0.7, GES: 0.3 },
  petits_gestes: { GES: 1.0 },
  cadeau_precis: { CAD_C: 1.0 },
  experience:    { EXP: 1.0 },
  symbole:       { CAD_S: 1.0 },
  surprise:      { SUR: 1.0 },
};

const RANK_WEIGHTS = [5, 3, 1];
const DIMS: AttentionDim[] = ["MOT", "SER", "CAD_C", "CAD_S", "EXP", "GES", "SUR"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function zeroVector(): Record<AttentionDim, number> {
  return { MOT: 0, SER: 0, CAD_C: 0, CAD_S: 0, EXP: 0, GES: 0, SUR: 0 };
}

function computeReceptionFromQ1(ranked: string[]): FaceResult {
  const raw = zeroVector();
  ranked.forEach((val, idx) => {
    const dw = Q1_DIM_WEIGHTS[val] ?? {};
    const rw = RANK_WEIGHTS[idx] ?? 0;
    for (const [d, w] of Object.entries(dw)) {
      raw[d as AttentionDim] += rw * (w as number);
    }
  });
  const max = Math.max(...DIMS.map(d => raw[d]));
  const normalized = zeroVector();
  if (max > 0) {
    for (const d of DIMS) normalized[d] = Math.round((raw[d] / max) * 100);
  }
  const dominant: AttentionDim[] = [];
  const secondaire: AttentionDim[] = [];
  const tertiaire: AttentionDim[] = [];
  for (const d of DIMS) {
    const n = normalized[d];
    if (n === 100) dominant.push(d);
    else if (n > 45) secondaire.push(d);
    else if (n > 30) tertiaire.push(d);
  }
  return { raw, normalized, dominant, secondaire, tertiaire };
}

function interp(tpl: string, name: string, gender: Gender): string {
  const f = gender === "femme";
  const m = gender === "homme";
  return tpl
    .replace(/\{\{prenom\}\}/g, name)
    .replace(/\{\{il\/elle\}\}/g, f ? "elle" : m ? "il" : "il/elle")
    .replace(/\{\{Il\/Elle\}\}/g, f ? "Elle" : m ? "Il" : "Il/elle")
    .replace(/\{\{lui\/elle\}\}/g, f ? "elle" : m ? "lui" : "lui/elle")
    .replace(/\{\{le\/la\}\}/g, f ? "la" : m ? "le" : "le/la")
    .replace(/\{\{son\/sa\}\}/g, (_, ctx) => {
      void ctx;
      return f ? "sa" : m ? "son" : "son/sa";
    })
    .replace(/\(e\)/g, f ? "e" : "")
    .replace(/\(es\)/g, f ? "es" : "s")
    .replace(/\(ère\)/g, f ? "ère" : "er")
    .replace(/\(ée\)/g, f ? "ée" : "é");
}

function join(arr: string[]) { return arr.length ? arr.join(",") : null; }

// ─── Sub-components ───────────────────────────────────────────────────────────

const qNavBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", padding: 0,
  fontSize: 11, letterSpacing: ".22em", color: "var(--ink-3)", fontWeight: 300,
  fontFamily: "var(--font-sans)", WebkitTapHighlightColor: "transparent",
};

function IQHeader({
  sectionLabel, stepIdx, totalSteps, progress, onBack, onExit,
}: {
  sectionLabel: string;
  stepIdx: string;
  totalSteps: string;
  progress: number;
  onBack?: () => void;
  onExit?: () => void;
}) {
  return (
    <div className="q-header">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="q-logo">Candice<span className="q-logo-dot" /></span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {onBack && <button type="button" onClick={onBack} style={qNavBtn}>← Retour</button>}
          <span className="q-idx">{stepIdx} — {totalSteps}</span>
          {onExit && <button type="button" onClick={onExit} style={qNavBtn}>Quitter ×</button>}
        </div>
      </div>
      <div className="q-bar-track">
        <div className="q-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 10 }}>
        {sectionLabel}
      </p>
    </div>
  );
}

function BreathScreen({
  lines, ctaLabel, onContinue, onExit,
}: {
  lines: string[];
  ctaLabel: string;
  onContinue: () => void;
  onExit: () => void;
}) {
  const [revealedLines, setRevealedLines] = useState<number[]>([]);
  const [ctaVisible, setCtaVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    lines.forEach((_, i) => {
      const t = setTimeout(() => setRevealedLines(prev => [...prev, i]), 900 + i * 800);
      timers.current.push(t);
    });
    const ct = setTimeout(() => setCtaVisible(true), 900 + lines.length * 800 + 600);
    timers.current.push(ct);
    return () => timers.current.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(135% 70% at 50% 40%, rgba(62,115,97,.20) 0%, rgba(62,115,97,0) 62%), #0E1A14",
      display: "flex", flexDirection: "column", padding: "0 30px", zIndex: 10,
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <LivePoint size={7} tone="glow" style={{ marginBottom: 26 }} />
        {lines.map((line, i) => (
          <p key={i} style={{
            fontFamily: "var(--font-serif)", fontWeight: 300,
            fontSize: "clamp(20px, 3.5vw, 25px)", lineHeight: 1.45,
            color: i === 0 ? "rgba(252,251,247,.9)" : "#fff",
            letterSpacing: "-.01em", marginTop: i > 0 ? 16 : 0,
            opacity: revealedLines.includes(i) ? 1 : 0,
            transform: revealedLines.includes(i) ? "none" : "translateY(8px)",
            transition: "opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)",
          } as React.CSSProperties}>
            {line}
          </p>
        ))}
      </div>
      <div style={{
        paddingBottom: 52, opacity: ctaVisible ? 1 : 0, transition: "opacity .6s ease",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <button type="button" onClick={onContinue} style={{
          display: "inline-flex", alignItems: "center", gap: 9,
          background: "none", border: "none", color: "rgba(252,251,247,.85)",
          fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, cursor: "pointer", padding: 0,
        }}>
          {ctaLabel} <span>→</span>
        </button>
        <button type="button" onClick={onExit} style={{
          background: "none", border: "none", color: "rgba(252,251,247,.36)",
          fontFamily: "var(--font-sans)", fontSize: 12, cursor: "pointer", padding: 0, textAlign: "left",
        }}>
          Reprendre plus tard
        </button>
      </div>
    </div>
  );
}

function RankedOptions({
  options, maxRank, values, onChange,
}: {
  options: { value: string; label: string; sub?: string }[];
  maxRank: number;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter(x => x !== v));
    else if (values.length < maxRank) onChange([...values, v]);
  };
  const touched = values.length > 0;

  return (
    <div className={`q-opts${touched ? " touched" : ""}`}>
      {options.map(opt => {
        const rank = values.indexOf(opt.value);
        const sel = rank !== -1;
        const disabled = !sel && values.length >= maxRank;
        return (
          <div
            key={opt.value}
            className={`q-opt${sel ? " sel first" : ""}`}
            onClick={() => !disabled && toggle(opt.value)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); !disabled && toggle(opt.value); } }}
            style={{ opacity: disabled ? 0.38 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
          >
            <div className="q-node">
              {sel ? (
                <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "var(--pine)", color: "#fff",
                  fontSize: 9, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  {rank + 1}
                </span>
              ) : null}
            </div>
            <div>
              <div className="q-opt-t">{opt.label}</div>
              {opt.sub && <div className="q-opt-s">{opt.sub}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SingleOption({
  options, value, onChange,
}: {
  options: { value: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const touched = !!value;
  return (
    <div className={`q-opts${touched ? " touched" : ""}`}>
      {options.map(opt => {
        const sel = value === opt.value;
        return (
          <div
            key={opt.value}
            className={`q-opt${sel ? " sel first" : ""}`}
            onClick={() => onChange(opt.value)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(opt.value); } }}
          >
            <div className="q-node" />
            <div>
              <div className="q-opt-t">{opt.label}</div>
              {opt.sub && <div className="q-opt-s">{opt.sub}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function IncognitoFlow({ contactId, contactName, contactGender, existingResponse }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const g = contactGender;

  const t = (tpl: string) => interp(tpl, contactName, g);

  const [step, setStep] = useState<FlowStep>("intro");
  const [saving, setSaving] = useState(false);

  // Q1 — Ce qui touche {{prenom}} (ranked ≤3, maps to 7D attention)
  const [q1, setQ1] = useState<string[]>(() => {
    if (!existingResponse?.love_language) return [];
    return existingResponse.love_language.split(",").filter(Boolean);
  });

  // Q2 — Comment {{prenom}} exprime ses émotions (ranked ≤3)
  const [q2, setQ2] = useState<string[]>(() => {
    if (!existingResponse?.emotional_expression) return [];
    return existingResponse.emotional_expression.split(",").filter(Boolean);
  });

  // Q3 — Loisirs (open text)
  const [q3, setQ3] = useState(existingResponse?.hobbies ?? "");

  // Q4 — Préférence cadeaux (ranked ≤3)
  const [q4, setQ4] = useState<string[]>(() => {
    if (!existingResponse?.gift_preference) return [];
    return existingResponse.gift_preference.split(",").filter(Boolean);
  });

  // Q5 — Standing (single)
  const [q5, setQ5] = useState(existingResponse?.standing ?? "");

  // Q6 — Réaction au stress (single)
  const [q6, setQ6] = useState(existingResponse?.stress_response ?? "");

  // Q7 — Prise de décision (≤2)
  const [q7, setQ7] = useState<string[]>(() => {
    if (!existingResponse?.decision_making) return [];
    return existingResponse.decision_making.split(",").filter(Boolean);
  });

  // Q8 — Ce qu'il faut éviter (open text)
  const [q8, setQ8] = useState(existingResponse?.things_to_avoid ?? "");

  // Open
  const [openNotes, setOpenNotes] = useState(existingResponse?.additional_notes ?? "");
  const [openTopics, setOpenTopics] = useState(existingResponse?.conversation_topics ?? "");

  // Practical
  const [practicalDates, setPracticalDates] = useState(existingResponse?.important_dates ?? "");

  const navigate = (next: FlowStep) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = (prev: FlowStep) => navigate(prev);

  // ─── Save 1: after breath1 (Q1 + Q2) ─────────────────────────────────────

  const saveStage1 = async () => {
    setSaving(true);
    const reception = computeReceptionFromQ1(q1);
    await supabase.from("questionnaire_responses").upsert({
      contact_id: contactId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      love_language: join(q1),
      appreciation_style: join(q1),
      emotional_expression: join(q2),
      attention_reception: reception,
    }, { onConflict: "contact_id,user_id" });
    setSaving(false);
  };

  // ─── Save 2: after breath2 (Q3 + Q4 + Q5) ────────────────────────────────

  const saveStage2 = async () => {
    setSaving(true);
    await supabase.from("questionnaire_responses").upsert({
      contact_id: contactId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      hobbies: q3 || null,
      gift_preference: join(q4),
      standing: q5 || null,
    }, { onConflict: "contact_id,user_id" });
    setSaving(false);
  };

  // ─── Save 3: final (Q6 + Q7 + Q8 + open + practical + all raw) ───────────

  const saveStage3 = async () => {
    setSaving(true);
    const incognito_signals = {
      q1, q2, q3, q4, q5, q6, q7, q8,
      open_notes: openNotes,
      open_topics: openTopics,
      practical_dates: practicalDates,
    };
    await supabase.from("questionnaire_responses").upsert({
      contact_id: contactId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      stress_response: q6 || null,
      decision_making: join(q7),
      things_to_avoid: q8 || null,
      additional_notes: openNotes || null,
      conversation_topics: openTopics || null,
      important_dates: practicalDates || null,
      incognito_signals,
    }, { onConflict: "contact_id,user_id" });
    setSaving(false);
  };

  // ─── Breath texts ─────────────────────────────────────────────────────────

  const breath1Lines = (() => {
    const topQ1 = q1[0];
    const topLabels: Record<string, string> = {
      mots: "les mots sincères",
      presence: "se sentir vraiment compris(e)",
      petits_gestes: "les petites attentions",
      cadeau_precis: "un cadeau bien choisi",
      experience: "les expériences partagées",
      symbole: "les gestes symboliques",
      surprise: "les surprises inattendues",
    };
    const what = topLabels[topQ1] ?? "l'attention";
    return [
      `${contactName} est sensible avant tout à ${what}.`,
      "Candice s'en souviendra pour chaque suggestion.",
    ];
  })();

  const breath2Lines = (() => {
    const has = q3.trim().length > 0;
    return [
      has
        ? `L'univers de ${contactName} prend forme.`
        : `Candice commence à connaître ${contactName}.`,
      "La suite va affiner comment l'atteindre vraiment.",
    ];
  })();

  const breath3Lines = (() => {
    const stressMap: Record<string, string> = {
      withdraws: "a besoin de silence et d'espace",
      seeks_support: "cherche à en parler",
      action: "se met dans l'action",
      internalizes: "intériorise et gère seul(e)",
      humor: "relativise avec légèreté",
    };
    const how = stressMap[q6] ?? "gère les choses à sa façon";
    return [
      `En période difficile, ${contactName} ${how}.`,
      "Ces nuances guident les moments où Candice intervient — et ceux où elle s'abstient.",
    ];
  })();

  // ─── Render ───────────────────────────────────────────────────────────────

  const progress = STEP_PROGRESS[step];

  // Breath screens — full-screen overlay
  if (step === "breath1") {
    return (
      <BreathScreen
        lines={breath1Lines}
        ctaLabel="Continuer"
        onContinue={() => { saveStage1(); navigate("q2"); }}
        onExit={() => { saveStage1(); router.push(`/contacts/${contactId}`); }}
      />
    );
  }

  if (step === "breath2") {
    return (
      <BreathScreen
        lines={breath2Lines}
        ctaLabel="Continuer"
        onContinue={() => { saveStage2(); navigate("q6"); }}
        onExit={() => { saveStage2(); router.push(`/contacts/${contactId}`); }}
      />
    );
  }

  if (step === "breath3") {
    return (
      <BreathScreen
        lines={breath3Lines}
        ctaLabel="Presque fini"
        onContinue={() => navigate("open")}
        onExit={() => router.push(`/contacts/${contactId}`)}
      />
    );
  }

  if (step === "closing") {
    return <ClosingScreen name={contactName} contactId={contactId} />;
  }

  // ─── Intro ────────────────────────────────────────────────────────────────

  if (step === "intro") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px 24px 0" }}>
          <span className="q-logo">Candice<span className="q-logo-dot" /></span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 24px 60px" }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 20 }}>
            Profil de {contactName}
          </p>
          <h1 style={{
            fontFamily: "var(--font-serif)", fontWeight: 300,
            fontSize: "clamp(24px, 5vw, 32px)", lineHeight: 1.3,
            color: "var(--ink)", marginBottom: 16, letterSpacing: "-.02em",
          }}>
            Vous connaissez {contactName} mieux que personne.
          </h1>
          <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 40 }}>
            Répondez à {t("{{son/sa}}")} place selon ce que vous savez. L&apos;approximation est normale — Candice complètera avec le temps.
          </p>
          <button
            type="button"
            onClick={() => navigate("q1")}
            className="q-continue ready"
          >
            Commencer <span className="q-arr">→</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Q1 — Ce qui touche {{prenom}} ───────────────────────────────────────

  if (step === "q1") {
    const canContinue = q1.length > 0;
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <IQHeader
          sectionLabel={t("Ce qui touche {{prenom}}")}
          stepIdx="01"
          totalSteps="05"
          progress={progress}
          onBack={() => navigate("intro")}
          onExit={() => router.push(`/contacts/${contactId}`)}
        />
        <div style={{ flex: 1, padding: "32px 24px 0" }}>
          <div className="q-section active">
            <div className="q-eyebrow">{t("Ce qui touche {{prenom}}")}</div>
            <div className="q-prompt">{t("Qu'est-ce qui fait vraiment plaisir à {{prenom}} ?")}</div>
            <div className="q-helper">Classez jusqu&apos;à 3 réponses, de la plus importante à la moins importante.</div>
            <RankedOptions
              maxRank={3}
              values={q1}
              onChange={setQ1}
              options={[
                { value: "mots",          label: "Un message sincère, des mots qui viennent du cœur",   sub: "Compliments, belles lettres, messages touchants" },
                { value: "presence",      label: t("Qu'on soit vraiment là pour {{lui/elle}}"),           sub: "Présence, écoute, se sentir compris(e)" },
                { value: "petits_gestes", label: "Les petites attentions du quotidien",                   sub: "Penser à quelque chose qu'il/elle a mentionné, agir sans qu'on lui demande" },
                { value: "cadeau_precis", label: "Un cadeau bien choisi, précis, réfléchi",              sub: "Un objet ou une idée qui montre qu'on le/la connaît" },
                { value: "experience",    label: "Vivre quelque chose d'inoubliable ensemble",            sub: "Sorties, voyages, dîners, activités partagées" },
                { value: "symbole",       label: "Un geste symbolique ou significatif",                  sub: "Quelque chose de porteur de sens, plus que de valeur" },
                { value: "surprise",      label: "Une surprise qu'il/elle n'avait pas vue venir",        sub: "L'effet de l'imprévu, la preuve qu'on y pensait" },
              ]}
            />
          </div>
        </div>
        <div className="q-footer">
          <button
            type="button"
            onClick={() => navigate("breath1")}
            disabled={!canContinue}
            className={`q-continue${canContinue ? " ready" : ""}`}
          >
            Continuer <span className="q-arr">→</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Q2 — Comment {{prenom}} exprime ses émotions ────────────────────────

  if (step === "q2") {
    const canContinue = q2.length > 0;
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <IQHeader
          sectionLabel={t("Ce qui touche {{prenom}}")}
          stepIdx="01"
          totalSteps="05"
          progress={progress}
          onBack={() => navigate("breath1")}
          onExit={() => router.push(`/contacts/${contactId}`)}
        />
        <div style={{ flex: 1, padding: "32px 24px 0" }}>
          <div className="q-section active">
            <div className="q-eyebrow">{t("Ce qui touche {{prenom}}")}</div>
            <div className="q-prompt">{t("Comment {{prenom}} exprime ce qu'{{il/elle}} ressent ?")}</div>
            <div className="q-helper">Sélectionnez jusqu&apos;à 3 réponses.</div>
            <RankedOptions
              maxRank={3}
              values={q2}
              onChange={setQ2}
              options={[
                { value: "openly",          label: "Très ouvertement",                  sub: "Partage facilement ses émotions, ne se cache pas" },
                { value: "selectively",     label: "Sélectivement",                     sub: "S'ouvre uniquement aux personnes de confiance" },
                { value: "through_actions", label: "Par les actes plutôt que les mots", sub: t("Montre ce qu'{{il/elle}} ressent, sans forcément le dire") },
                { value: "humor",           label: "Avec humour ou légèreté",           sub: "Dédramatise, passe par le second degré" },
                { value: "rarely",          label: "Rarement",                          sub: "Intériorise beaucoup, gère ses émotions seul(e)" },
              ]}
            />
          </div>
        </div>
        <div className="q-footer">
          <button
            type="button"
            onClick={() => navigate("q3")}
            disabled={!canContinue}
            className={`q-continue${canContinue ? " ready" : ""}`}
          >
            Continuer <span className="q-arr">→</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Q3 — Loisirs ─────────────────────────────────────────────────────────

  if (step === "q3") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <IQHeader
          sectionLabel={t("L'univers de {{prenom}}")}
          stepIdx="02"
          totalSteps="05"
          progress={progress}
          onBack={() => navigate("q2")}
          onExit={() => router.push(`/contacts/${contactId}`)}
        />
        <div style={{ flex: 1, padding: "32px 24px 0" }}>
          <div className="q-section active">
            <div className="q-eyebrow">{t("L'univers de {{prenom}}")}</div>
            <div className="q-prompt">{t("Qu'est-ce que {{prenom}} aime faire quand {{il/elle}} a du temps libre ?")}</div>
            <div className="q-helper">Loisirs, passions, activités — ce qui rend sa vie plus riche.</div>
            <textarea
              value={q3}
              onChange={e => setQ3(e.target.value)}
              placeholder={t("Ex : randonnée, cuisine, séries coréennes, jardinage…")}
              rows={4}
              style={{
                width: "100%", marginTop: 16, padding: "14px 16px",
                fontSize: 14, fontWeight: 300, lineHeight: 1.6,
                border: "0.5px solid var(--line)", borderRadius: 8,
                background: "transparent", color: "var(--ink)",
                resize: "vertical", outline: "none", boxSizing: "border-box",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>
        </div>
        <div className="q-footer">
          <button
            type="button"
            onClick={() => navigate("q4")}
            className="q-continue ready"
          >
            Continuer <span className="q-arr">→</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Q4 — Préférence cadeaux ──────────────────────────────────────────────

  if (step === "q4") {
    const canContinue = q4.length > 0;
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <IQHeader
          sectionLabel={t("L'univers de {{prenom}}")}
          stepIdx="02"
          totalSteps="05"
          progress={progress}
          onBack={() => navigate("q3")}
          onExit={() => router.push(`/contacts/${contactId}`)}
        />
        <div style={{ flex: 1, padding: "32px 24px 0" }}>
          <div className="q-section active">
            <div className="q-eyebrow">{t("L'univers de {{prenom}}")}</div>
            <div className="q-prompt">{t("Si vous deviez offrir quelque chose à {{prenom}}…")}</div>
            <div className="q-helper">Ce qui lui ferait le plus plaisir. Jusqu&apos;à 3 réponses.</div>
            <RankedOptions
              maxRank={3}
              values={q4}
              onChange={setQ4}
              options={[
                { value: "experiences",  label: "Une expérience",               sub: "Concert, voyage, atelier, dîner…" },
                { value: "useful",       label: "Un objet utile et bien pensé", sub: "Quelque chose qu'il/elle utilise vraiment" },
                { value: "beauty",       label: "Un bel objet de qualité",      sub: "Esthétique, bien fait, dans de belles matières" },
                { value: "symbolic",     label: "Quelque chose de symbolique",  sub: "Un cadeau porteur de sens, personnel" },
                { value: "consumable",   label: "Un plaisir consommable",       sub: "Bouteille, épicerie fine, fleurs, chocolats…" },
                { value: "surprise",     label: "Faites confiance à Candice",   sub: "Je ne sais pas — laissez-la suggérer" },
              ]}
            />
          </div>
        </div>
        <div className="q-footer">
          <button
            type="button"
            onClick={() => navigate("q5")}
            disabled={!canContinue}
            className={`q-continue${canContinue ? " ready" : ""}`}
          >
            Continuer <span className="q-arr">→</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Q5 — Standing ────────────────────────────────────────────────────────

  if (step === "q5") {
    const canContinue = !!q5;
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <IQHeader
          sectionLabel={t("L'univers de {{prenom}}")}
          stepIdx="02"
          totalSteps="05"
          progress={progress}
          onBack={() => navigate("q4")}
          onExit={() => router.push(`/contacts/${contactId}`)}
        />
        <div style={{ flex: 1, padding: "32px 24px 0" }}>
          <div className="q-section active">
            <div className="q-eyebrow">{t("L'univers de {{prenom}}")}</div>
            <div className="q-prompt">{t("Quand on fait attention à {{prenom}}, comment {{il/elle}} le reçoit ?")}</div>
            <div className="q-helper">Son rapport général aux attentions.</div>
            <SingleOption
              value={q5}
              onChange={setQ5}
              options={[
                { value: "any_sincere",    label: t("Touché(e) par n'importe quelle attention sincère"), sub: "Le geste compte plus que la valeur ou le standing" },
                { value: "well_chosen",    label: "Sensible à ce qui est bien choisi, même simple",      sub: "Un cadeau réfléchi vaut plus qu'un cadeau cher sans effort" },
                { value: "quality",        label: "Apprécie un certain niveau de qualité",               sub: "Le cadre, le service ou la qualité font partie du plaisir" },
                { value: "high_standards", label: t("A des goûts précis, remarque quand c'est raté"),   sub: "Exigeant(e) — mieux vaut bien viser" },
                { value: "dont_know",      label: "Je ne sais pas vraiment",                             sub: "Candice s'adaptera avec le temps" },
              ]}
            />
          </div>
        </div>
        <div className="q-footer">
          <button
            type="button"
            onClick={() => navigate("breath2")}
            disabled={!canContinue}
            className={`q-continue${canContinue ? " ready" : ""}`}
          >
            Continuer <span className="q-arr">→</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Q6 — Stress response ─────────────────────────────────────────────────

  if (step === "q6") {
    const canContinue = !!q6;
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <IQHeader
          sectionLabel={t("Comment {{prenom}} fonctionne")}
          stepIdx="03"
          totalSteps="05"
          progress={progress}
          onBack={() => navigate("breath2")}
          onExit={() => router.push(`/contacts/${contactId}`)}
        />
        <div style={{ flex: 1, padding: "32px 24px 0" }}>
          <div className="q-section active">
            <div className="q-eyebrow">{t("Comment {{prenom}} fonctionne")}</div>
            <div className="q-prompt">{t("En période de stress ou de difficulté, {{prenom}}…")}</div>
            <div className="q-helper">Une seule réponse.</div>
            <SingleOption
              value={q6}
              onChange={setQ6}
              options={[
                { value: "withdraws",     label: "Se retire et a besoin de silence",             sub: "Plus discret(e), recharge loin des autres" },
                { value: "seeks_support", label: "Cherche à en parler et à être écouté(e)",      sub: "A besoin de dire ce qu'il/elle ressent" },
                { value: "action",        label: "Se met dans l'action",                          sub: "Canalise le stress en faisant des choses" },
                { value: "internalizes",  label: t("Intériorise et gère seul(e)"),               sub: "Garde ses émotions pour lui/elle, n'en parle pas" },
                { value: "humor",         label: "Relativise avec humour",                        sub: "Désamorce avec légèreté, dédramatise" },
              ]}
            />
          </div>
        </div>
        <div className="q-footer">
          <button
            type="button"
            onClick={() => navigate("q7")}
            disabled={!canContinue}
            className={`q-continue${canContinue ? " ready" : ""}`}
          >
            Continuer <span className="q-arr">→</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Q7 — Prise de décision ───────────────────────────────────────────────

  if (step === "q7") {
    const canContinue = q7.length > 0;
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <IQHeader
          sectionLabel={t("Comment {{prenom}} fonctionne")}
          stepIdx="03"
          totalSteps="05"
          progress={progress}
          onBack={() => navigate("q6")}
          onExit={() => router.push(`/contacts/${contactId}`)}
        />
        <div style={{ flex: 1, padding: "32px 24px 0" }}>
          <div className="q-section active">
            <div className="q-eyebrow">{t("Comment {{prenom}} fonctionne")}</div>
            <div className="q-prompt">{t("Ce qui guide les décisions de {{prenom}}")}</div>
            <div className="q-helper">Jusqu&apos;à 2 réponses.</div>
            <RankedOptions
              maxRank={2}
              values={q7}
              onChange={setQ7}
              options={[
                { value: "logic",     label: "La logique et les faits",              sub: "Pèse les avantages, les risques, les données" },
                { value: "intuition", label: "L'instinct et le ressenti",            sub: "Son sixième sens guide plus que la raison" },
                { value: "others",    label: "L'avis des proches",                   sub: "Les retours de confiance l'aident à se positionner" },
                { value: "research",  label: "Une recherche approfondie",            sub: "A besoin d'informations complètes avant de décider" },
                { value: "values",    label: "Ses valeurs personnelles",             sub: "Ce qui est juste compte plus que ce qui est optimal" },
              ]}
            />
          </div>
        </div>
        <div className="q-footer">
          <button
            type="button"
            onClick={() => navigate("q8")}
            disabled={!canContinue}
            className={`q-continue${canContinue ? " ready" : ""}`}
          >
            Continuer <span className="q-arr">→</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Q8 — Ce qu'il faut éviter ────────────────────────────────────────────

  if (step === "q8") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <IQHeader
          sectionLabel={t("Comment {{prenom}} fonctionne")}
          stepIdx="03"
          totalSteps="05"
          progress={progress}
          onBack={() => navigate("q7")}
          onExit={() => router.push(`/contacts/${contactId}`)}
        />
        <div style={{ flex: 1, padding: "32px 24px 0" }}>
          <div className="q-section active">
            <div className="q-eyebrow">{t("Comment {{prenom}} fonctionne")}</div>
            <div className="q-prompt">{t("Ce qu'il faut absolument éviter avec {{prenom}}")}</div>
            <div className="q-helper">Fêtes surprises, contacts imprévus, sujets sensibles, plans de dernière minute…</div>
            <textarea
              value={q8}
              onChange={e => setQ8(e.target.value)}
              placeholder={t("Ex : déteste les surprises, allergique au gluten, ne pas aborder le travail…")}
              rows={4}
              style={{
                width: "100%", marginTop: 16, padding: "14px 16px",
                fontSize: 14, fontWeight: 300, lineHeight: 1.6,
                border: "0.5px solid var(--line)", borderRadius: 8,
                background: "transparent", color: "var(--ink)",
                resize: "vertical", outline: "none", boxSizing: "border-box",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>
        </div>
        <div className="q-footer">
          <button
            type="button"
            onClick={() => navigate("breath3")}
            className="q-continue ready"
          >
            Continuer <span className="q-arr">→</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Open questions ───────────────────────────────────────────────────────

  if (step === "open") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <IQHeader
          sectionLabel="Questions ouvertes"
          stepIdx="04"
          totalSteps="05"
          progress={progress}
          onBack={() => navigate("breath3")}
          onExit={() => router.push(`/contacts/${contactId}`)}
        />
        <div style={{ flex: 1, padding: "32px 24px 0", display: "flex", flexDirection: "column", gap: 36 }}>
          <div className="q-section active">
            <div className="q-eyebrow">Questions ouvertes</div>
            <div className="q-prompt">{t("Ce que vous voudriez que Candice sache sur {{prenom}}")}</div>
            <div className="q-helper">Situation actuelle, contexte de vie, ce qui le/la préoccupe en ce moment.</div>
            <textarea
              value={openNotes}
              onChange={e => setOpenNotes(e.target.value)}
              placeholder={t("Ex : vient de changer de poste, traverse une période difficile, adore son chat…")}
              rows={4}
              style={{
                width: "100%", marginTop: 16, padding: "14px 16px",
                fontSize: 14, fontWeight: 300, lineHeight: 1.6,
                border: "0.5px solid var(--line)", borderRadius: 8,
                background: "transparent", color: "var(--ink)",
                resize: "vertical", outline: "none", boxSizing: "border-box",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>
          <div className="q-section active">
            <div className="q-eyebrow">Questions ouvertes</div>
            <div className="q-prompt">{t("Les sujets dont {{prenom}} pourrait parler pendant des heures")}</div>
            <div className="q-helper">Ce qui l&apos;anime, ses passions, ses convictions.</div>
            <textarea
              value={openTopics}
              onChange={e => setOpenTopics(e.target.value)}
              placeholder="Ex : philosophie, ses enfants, le cinéma japonais, l'entrepreneuriat…"
              rows={3}
              style={{
                width: "100%", marginTop: 16, padding: "14px 16px",
                fontSize: 14, fontWeight: 300, lineHeight: 1.6,
                border: "0.5px solid var(--line)", borderRadius: 8,
                background: "transparent", color: "var(--ink)",
                resize: "vertical", outline: "none", boxSizing: "border-box",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>
        </div>
        <div className="q-footer">
          <button
            type="button"
            onClick={() => navigate("practical")}
            className="q-continue ready"
          >
            Continuer <span className="q-arr">→</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Practical ────────────────────────────────────────────────────────────

  if (step === "practical") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <IQHeader
          sectionLabel="Infos pratiques"
          stepIdx="05"
          totalSteps="05"
          progress={progress}
          onBack={() => navigate("open")}
          onExit={() => router.push(`/contacts/${contactId}`)}
        />
        <div style={{ flex: 1, padding: "32px 24px 0" }}>
          <div className="q-section active">
            <div className="q-eyebrow">Infos pratiques</div>
            <div className="q-prompt">{t("Les dates importantes pour {{prenom}}")}</div>
            <div className="q-helper">Anniversaire, dates à ne pas manquer, événements récurrents.</div>
            <textarea
              value={practicalDates}
              onChange={e => setPracticalDates(e.target.value)}
              placeholder="Ex : Anniversaire : 12 mars — Fête des mères : toujours un dimanche de mai…"
              rows={4}
              style={{
                width: "100%", marginTop: 16, padding: "14px 16px",
                fontSize: 14, fontWeight: 300, lineHeight: 1.6,
                border: "0.5px solid var(--line)", borderRadius: 8,
                background: "transparent", color: "var(--ink)",
                resize: "vertical", outline: "none", boxSizing: "border-box",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>
        </div>
        <div className="q-footer">
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              await saveStage3();
              navigate("closing");
            }}
            className="q-continue ready"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Enregistrement…" : "Terminer"} <span className="q-arr">→</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Closing screen ───────────────────────────────────────────────────────────

function ClosingScreen({ name, contactId }: { name: string; contactId: string }) {
  const router = useRouter();
  const [revealedLines, setRevealedLines] = useState<number[]>([]);
  const [ctaVisible, setCtaVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const lines = [
    `Le profil de ${name} est prêt.`,
    "Candice va s'en souvenir pour chaque suggestion.",
    "Vous pouvez compléter ou ajuster à tout moment.",
  ];

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    lines.forEach((_, i) => {
      const t = setTimeout(() => setRevealedLines(prev => [...prev, i]), 900 + i * 800);
      timers.current.push(t);
    });
    const ct = setTimeout(() => setCtaVisible(true), 900 + lines.length * 800 + 600);
    timers.current.push(ct);
    return () => timers.current.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(135% 70% at 50% 40%, rgba(62,115,97,.20) 0%, rgba(62,115,97,0) 62%), #0E1A14",
      display: "flex", flexDirection: "column", padding: "0 30px", zIndex: 10,
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <LivePoint size={7} tone="glow" style={{ marginBottom: 26 }} />
        {lines.map((line, i) => (
          <p key={i} style={{
            fontFamily: "var(--font-serif)", fontWeight: 300,
            fontSize: "clamp(20px, 3.5vw, 25px)", lineHeight: 1.45,
            color: i === 0 ? "rgba(252,251,247,.9)" : "#fff",
            letterSpacing: "-.01em", marginTop: i > 0 ? 16 : 0,
            opacity: revealedLines.includes(i) ? 1 : 0,
            transform: revealedLines.includes(i) ? "none" : "translateY(8px)",
            transition: "opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)",
          } as React.CSSProperties}>
            {line}
          </p>
        ))}
      </div>
      <div style={{
        paddingBottom: 52, opacity: ctaVisible ? 1 : 0, transition: "opacity .6s ease",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <button type="button" onClick={() => router.push(`/contacts/${contactId}`)} style={{
          display: "inline-flex", alignItems: "center", gap: 9,
          background: "none", border: "none", color: "rgba(252,251,247,.85)",
          fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, cursor: "pointer", padding: 0,
        }}>
          Voir la fiche de {name} <span>→</span>
        </button>
      </div>
    </div>
  );
}
