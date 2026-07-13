"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextQuestionResult, DiscoveryQuestion, QuestionOption } from "@/lib/discovery/engine";

interface Props {
  initial: NextQuestionResult | null;
  mode: "quick" | "full";
  /** C4 STOP C : deep-link ciblé (nudge, CTA section) → question DIRECTE,
   *  jamais d'écran intercalaire. L'intro ne subsiste que pour l'entrée
   *  générique du header. */
  skipIntro?: boolean;
}

// ── Chips question ────────────────────────────────────────────────────────────

function ChipsQuestion({
  question,
  onAnswer,
  onSkip,
  disabled,
}: {
  question: DiscoveryQuestion;
  onAnswer: (v: string[]) => void;
  onSkip: () => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const multi = question.question_type === "chips_multi";
  const options: QuestionOption[] = question.options ?? [];

  function toggle(val: string) {
    if (multi) {
      setSelected(prev =>
        prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
      );
    } else {
      setSelected([val]);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
        {options.map(opt => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              disabled={disabled}
              style={{
                padding: "12px 18px",
                borderRadius: 40,
                border: active
                  ? "1.5px solid var(--pine)"
                  : "0.5px solid var(--line)",
                background: active
                  ? "rgba(23,62,49,.08)"
                  : "var(--white)",
                fontSize: 14, fontWeight: active ? 400 : 300,
                color: active ? "var(--pine)" : "var(--ink-2)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <button
          onClick={onSkip}
          disabled={disabled}
          style={{
            padding: "12px 20px",
            borderRadius: 12,
            border: "0.5px solid var(--line)",
            background: "none",
            fontSize: 13, fontWeight: 300, color: "var(--ink-3)",
            cursor: "pointer",
          }}
        >
          Passer
        </button>
        <button
          onClick={() => { if (selected.length > 0) onAnswer(selected); }}
          disabled={disabled || selected.length === 0}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: 12,
            border: "none",
            background: selected.length > 0 ? "var(--pine)" : "var(--line)",
            fontSize: 14, fontWeight: 400,
            color: selected.length > 0 ? "var(--canvas)" : "var(--ink-3)",
            cursor: selected.length > 0 ? "pointer" : "not-allowed",
            transition: "background 0.15s",
          }}
        >
          Valider
        </button>
      </div>
    </div>
  );
}

// ── Styles partagés follow-ups (chantier 3.2) ─────────────────────────────────

const chipBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({
  padding: "12px 18px",
  minHeight: 44,
  borderRadius: 40,
  border: active ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
  background: active ? "rgba(23,62,49,.08)" : "var(--white)",
  fontSize: 14, fontWeight: active ? 400 : 300,
  color: active ? "var(--pine)" : "var(--ink-2)",
  cursor: disabled ? "default" : "pointer",
  transition: "all 0.15s",
});

const followUpArea: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 12,
  border: "0.5px solid var(--line)", background: "var(--white)",
  fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 300,
  color: "var(--ink)", lineHeight: 1.6, resize: "none", outline: "none",
  boxSizing: "border-box", marginTop: 10,
};

function ValidateRow({ onSkip, onSubmit, canSubmit, disabled }: {
  onSkip: () => void; onSubmit: () => void; canSubmit: boolean; disabled: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
      <button onClick={onSkip} disabled={disabled} style={{
        padding: "12px 20px", minHeight: 44, borderRadius: 12,
        border: "0.5px solid var(--line)", background: "none",
        fontSize: 13, fontWeight: 300, color: "var(--ink-3)", cursor: "pointer",
      }}>
        Passer
      </button>
      <button onClick={() => { if (canSubmit) onSubmit(); }} disabled={disabled || !canSubmit} style={{
        flex: 1, padding: "12px 20px", minHeight: 44, borderRadius: 12, border: "none",
        background: canSubmit ? "var(--pine)" : "var(--line)",
        fontSize: 14, fontWeight: 400,
        color: canSubmit ? "var(--canvas)" : "var(--ink-3)",
        cursor: canSubmit ? "pointer" : "not-allowed",
        transition: "background 0.15s",
      }}>
        Valider
      </button>
    </div>
  );
}

// ── practical.dietary — contraintes alimentaires + précision allergie ────────

function DietaryQuestion({ question, onAnswer, onSkip, disabled }: {
  question: DiscoveryQuestion;
  onAnswer: (v: Record<string, unknown>) => void;
  onSkip: () => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [allergyDetail, setAllergyDetail] = useState("");
  const options: QuestionOption[] = question.options ?? [];

  function toggle(val: string) {
    setSelected(prev => {
      if (val === "none") return prev.includes("none") ? [] : ["none"];
      const next = prev.includes(val) ? prev.filter(v => v !== val) : [...prev.filter(v => v !== "none"), val];
      return next;
    });
  }

  const needsDetail = selected.includes("food_allergy");
  // Follow-up OBLIGATOIRE : pas de validation d'une allergie sans précision
  const canSubmit = selected.length > 0 && (!needsDetail || allergyDetail.trim().length > 1);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
        {options.map(opt => (
          <button key={opt.value} onClick={() => toggle(opt.value)} disabled={disabled}
            style={chipBtn(selected.includes(opt.value), disabled)}>
            {opt.label}
          </button>
        ))}
      </div>
      {needsDetail && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 400, color: "var(--pine)" }}>
            Précise l&apos;allergie — c&apos;est important pour ne jamais se tromper.
          </p>
          <textarea
            value={allergyDetail}
            onChange={e => setAllergyDetail(e.target.value)}
            placeholder="ex. arachide, kiwi, crustacés…"
            rows={2}
            autoFocus
            style={followUpArea}
          />
        </div>
      )}
      <ValidateRow
        onSkip={onSkip}
        onSubmit={() => onAnswer({
          choices: selected,
          ...(needsDetail ? { allergy_detail: allergyDetail.trim() } : {}),
        })}
        canSubmit={canSubmit}
        disabled={disabled}
      />
    </div>
  );
}

// ── practical.mobility — accessibilité avec type + intensité obligatoires ────

const MOBILITY_TYPES = [
  { value: "marche_longue",  label: "Marche longue" },
  { value: "escaliers",      label: "Escaliers" },
  { value: "station_debout", label: "Station debout prolongée" },
  { value: "autre",          label: "Autre" },
];

const MOBILITY_INTENSITIES = [
  { value: "legere",        label: "Une gêne légère, bon à savoir" },
  { value: "systematique",  label: "À prendre en compte systématiquement" },
];

function MobilityQuestion({ onAnswer, onSkip, disabled }: {
  onAnswer: (v: Record<string, unknown>) => void;
  onSkip: () => void;
  disabled: boolean;
}) {
  const [has, setHas] = useState<boolean | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [detail, setDetail] = useState("");
  const [intensity, setIntensity] = useState<string>("");

  const needsAutre = types.includes("autre");
  // Follow-up OBLIGATOIRE : type (option ou champ libre) + intensité —
  // jamais de binaire « contrainte de mobilité » sans nuance.
  const canSubmit =
    has === false
    || (has === true
        && (types.filter(t => t !== "autre").length > 0 || detail.trim().length > 2)
        && (!needsAutre || detail.trim().length > 2)
        && intensity !== "");

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        {[{ v: true, l: "Oui" }, { v: false, l: "Non" }].map(o => (
          <button key={o.l} onClick={() => setHas(o.v)} disabled={disabled}
            style={{ ...chipBtn(has === o.v, disabled), flex: 1 }}>
            {o.l}
          </button>
        ))}
      </div>

      {has === true && (
        <>
          <p style={{ fontSize: 13, fontWeight: 400, color: "var(--pine)", marginTop: 18 }}>
            Qu&apos;est-ce qui est concerné ?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            {MOBILITY_TYPES.map(t => (
              <button key={t.value} disabled={disabled}
                onClick={() => setTypes(prev => prev.includes(t.value) ? prev.filter(x => x !== t.value) : [...prev, t.value])}
                style={chipBtn(types.includes(t.value), disabled)}>
                {t.label}
              </button>
            ))}
          </div>
          {(needsAutre || types.length === 0) && (
            <textarea
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder="Dis-le avec tes mots — ex. genou fragile, fatigue rapide…"
              rows={2}
              style={followUpArea}
            />
          )}
          <p style={{ fontSize: 13, fontWeight: 400, color: "var(--pine)", marginTop: 18 }}>
            À quel point ?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {MOBILITY_INTENSITIES.map(o => (
              <button key={o.value} onClick={() => setIntensity(o.value)} disabled={disabled}
                style={{ ...chipBtn(intensity === o.value, disabled), borderRadius: 14, textAlign: "left" }}>
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}

      <ValidateRow
        onSkip={onSkip}
        onSubmit={() => onAnswer(
          has
            ? { has_constraint: true, types: types.filter(t => t !== "autre"), detail: detail.trim(), intensity }
            : { has_constraint: false },
        )}
        canSubmit={canSubmit && has !== null}
        disabled={disabled}
      />
    </div>
  );
}

// ── Text question ─────────────────────────────────────────────────────────────

function TextQuestion({
  question,
  onAnswer,
  onSkip,
  disabled,
}: {
  question: DiscoveryQuestion;
  onAnswer: (v: string) => void;
  onSkip: () => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  return (
    <div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Écris librement…"
        rows={4}
        disabled={disabled}
        style={{
          width: "100%", boxSizing: "border-box",
          marginTop: 20,
          padding: "14px 16px",
          border: "0.5px solid rgba(23,62,49,.2)",
          borderRadius: 14,
          background: "var(--white)",
          fontSize: 15, fontWeight: 300, color: "var(--ink)",
          lineHeight: 1.7, outline: "none", resize: "none",
          fontFamily: "var(--font-sans)",
        }}
        onKeyDown={e => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && value.trim()) {
            onAnswer(value.trim());
          }
        }}
      />
      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        <button
          onClick={onSkip}
          disabled={disabled}
          style={{
            padding: "12px 20px",
            borderRadius: 12,
            border: "0.5px solid var(--line)",
            background: "none",
            fontSize: 13, fontWeight: 300, color: "var(--ink-3)",
            cursor: "pointer",
          }}
        >
          Passer
        </button>
        <button
          onClick={() => { if (value.trim()) onAnswer(value.trim()); }}
          disabled={disabled || !value.trim()}
          className="btn-primary"
          style={{ flex: 1 }}
        >
          Valider
        </button>
      </div>
      <p style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 300, marginTop: 8, textAlign: "right" }}>
        ⌘↵ pour valider
      </p>
    </div>
  );
}

// ── Done state ────────────────────────────────────────────────────────────────

function DoneState({ mode }: { mode: "quick" | "full" }) {
  return (
    <div style={{ paddingTop: 60, paddingBottom: 40, textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "radial-gradient(130% 130% at 32% 24%, #1E4337 0%, #081710 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
      }}>
        <span style={{ fontSize: 22, color: "var(--canvas)" }}>✓</span>
      </div>
      <p style={{
        fontFamily: "var(--font-serif)",
        fontWeight: 300, fontSize: 24,
        color: "var(--ink)", letterSpacing: "-.016em",
        marginBottom: 12,
      } as React.CSSProperties}>
        {mode === "full" ? "C'est tout pour maintenant." : "Merci."}
      </p>
      <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.7, marginBottom: 32 }}>
        {mode === "full"
          ? "Candice met à jour ce qu'elle sait de toi."
          : "Candice a bien noté ça."}
      </p>
      <Link href="/moi" style={{ textDecoration: "none" }}>
        <button className="btn-primary">Voir mon profil →</button>
      </Link>
    </div>
  );
}

// ── Intro screen (full mode) ─────────────────────────────────────────────────

function IntroScreen({ onStart, onQuick }: { onStart: () => void; onQuick: () => void }) {
  return (
    <div style={{ paddingTop: 48, paddingBottom: 40 }}>
      <Link href="/moi" style={{ textDecoration: "none" }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300 }}>← Mon profil</span>
      </Link>
      <h1 style={{
        fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 28,
        color: "var(--ink)", letterSpacing: "-.018em", lineHeight: 1.2,
        marginTop: 28, marginBottom: 18,
      } as React.CSSProperties}>
        Tu veux que Candice vise encore plus juste&nbsp;?
      </h1>
      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.75, marginBottom: 32 }}>
        Réponds à quelques questions très courtes pour que tes proches comprennent mieux ce qui te touche vraiment : le bon cadeau, le bon restaurant, le bon week-end, le bon mot, le bon geste — sans avoir à deviner.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={onStart}
          style={{
            padding: "15px 20px", borderRadius: 12, border: "none",
            background: "var(--pine)", fontSize: 15, fontWeight: 400,
            color: "var(--canvas)", cursor: "pointer", textAlign: "center" as const,
          }}
        >
          Affiner mon profil
        </button>
        <button
          onClick={onQuick}
          style={{
            padding: "13px 20px", borderRadius: 12,
            border: "0.5px solid rgba(23,62,49,.2)",
            background: "var(--white)", fontSize: 14, fontWeight: 300,
            color: "var(--pine)", cursor: "pointer", textAlign: "center" as const,
          }}
        >
          Une seule question rapide
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DiscoveryFlow({ initial, mode, skipIntro = false }: Props) {
  const [current, setCurrent] = useState<NextQuestionResult | null>(initial);
  const [done, setDone] = useState(initial === null);
  const [loading, setLoading] = useState(false);
  const [intro, setIntro] = useState(mode === "full" && !skipIntro);

  async function handleAnswer(answer: string | string[] | Record<string, unknown>, skip = false) {
    if (!current || loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/discovery/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Levier 1 : à la 1re réponse sessionId est null → on envoie le
          // contexte (lot déterministe + position + mode) pour que la session
          // naisse côté serveur maintenant, pas au rendu du GET.
          sessionId: current.sessionId,
          pendingKeys: current.pendingKeys,
          currentIndex: current.currentIndex,
          mode: current.mode ?? mode,
          questionKey: current.question.question_key,
          answer: skip ? null : answer,
          skip,
        }),
      });
      const data = await res.json() as { next: NextQuestionResult | null; done: boolean };
      if (data.done || !data.next) {
        setDone(true);
        setCurrent(null);
      } else {
        setCurrent(data.next);
      }
    } catch {
      // fallback: go to done state
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFromIntro() {
    setIntro(false);
    // In full mode started from intro, switch to quick: show only first question
    // session is already loaded as a full session; just show first question
  }

  if (intro && mode === "full") {
    return <IntroScreen onStart={() => setIntro(false)} onQuick={handleQuickFromIntro} />;
  }

  if (done || !current) return <DoneState mode={mode} />;

  const { question, sectionLabel, progress } = current;

  return (
    <div style={{ paddingTop: 40, paddingBottom: 40, maxWidth: "100%", overflowX: "hidden" }}>
      {/* Back */}
      <Link href="/moi" style={{ textDecoration: "none" }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 300 }}>← Mon profil</span>
      </Link>

      {/* P1.7 : zone d'en-tête à hauteur RÉSERVÉE (identique avec ou sans
          barre de progression) — aucun saut entre deux questions */}
      {progress && (
        <div style={{ marginTop: 20, marginBottom: 4, minHeight: 56 }}>
          <p style={{
            fontSize: 10, fontWeight: 500,
            letterSpacing: ".22em", textTransform: "uppercase",
            color: "var(--pine)", marginBottom: 8,
          }}>
            {sectionLabel}
          </p>
          {/* Section indicator — no % */}
          <div style={{
            height: 2, borderRadius: 1,
            background: "var(--line)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${(progress.current / progress.total) * 100}%`,
              background: "var(--pine)",
              transition: "width 0.4s ease",
              borderRadius: 1,
            }} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 300, color: "var(--ink-3)", marginTop: 5 }}>
            {progress.current} sur {progress.total}
          </p>
        </div>
      )}

      {/* Quick mode: section label — même hauteur réservée que la barre */}
      {!progress && (
        <div style={{ marginTop: 20, marginBottom: 4, minHeight: 56 }}>
          <p style={{
            fontSize: 10, fontWeight: 500,
            letterSpacing: ".22em", textTransform: "uppercase",
            color: "var(--pine)",
          }}>
            {sectionLabel}
          </p>
        </div>
      )}

      {/* Question — hauteur minimale 2 lignes : le titre court d'une question
          suivante ne fait pas remonter les options (P1.7) */}
      <h2 style={{
        fontFamily: "var(--font-serif)",
        fontWeight: 300, fontSize: 26,
        color: "var(--ink)", letterSpacing: "-.018em",
        lineHeight: 1.25, marginTop: 14, minHeight: 66,
        overflowWrap: "break-word",
      } as React.CSSProperties}>
        {question.question_text}
      </h2>

      {/* Zone de réponse à hauteur réservée (P1.7) */}
      <div style={{ minHeight: 280 }}>
      {question.question_key === "practical.dietary" ? (
        <DietaryQuestion
          question={question}
          onAnswer={v => handleAnswer(v)}
          onSkip={() => handleAnswer([], true)}
          disabled={loading}
        />
      ) : question.question_key === "practical.mobility" ? (
        <MobilityQuestion
          onAnswer={v => handleAnswer(v)}
          onSkip={() => handleAnswer([], true)}
          disabled={loading}
        />
      ) : question.question_type === "text" ? (
        <TextQuestion
          question={question}
          onAnswer={v => handleAnswer(v)}
          onSkip={() => handleAnswer("", true)}
          disabled={loading}
        />
      ) : (
        <ChipsQuestion
          question={question}
          onAnswer={v => handleAnswer(v)}
          onSkip={() => handleAnswer([], true)}
          disabled={loading}
        />
      )}
      </div>
    </div>
  );
}
