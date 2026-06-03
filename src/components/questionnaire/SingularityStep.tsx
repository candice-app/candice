"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VoiceButton from "./VoiceButton";
import InterestsQuestion, { type InterestsValue, EMPTY_INTERESTS } from "./InterestsQuestion";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SingularityAnswers {
  adore_faire:       string;
  evite_deteste:     string;
  sujets_stimulants: string;
  peu_savent:        string;
  plus_beau_cadeau:  string;
  detail_compris:    string;
  marques_lieux:     string;
  cadeaux_non:       string;
  envies_reves:      string;
  remarquer:         string;
  sentir_special:    string;
  interests?:        InterestsValue;
}

interface Props {
  onDone: (answers: SingularityAnswers) => void;
  initialAnswers?: SingularityAnswers;
  onBack?: () => void;
  onExit?: (currentAnswers: SingularityAnswers) => void;
}

const qNavBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", padding: 0,
  fontSize: 11, letterSpacing: ".22em", color: "var(--ink-3)", fontWeight: 300,
  fontFamily: "var(--font-sans)", WebkitTapHighlightColor: "transparent",
};

function SingularityHero({ onBack, onExit }: { onBack?: () => void; onExit?: () => void }) {
  return (
    <div className="q-header">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="q-logo">Candice<span className="q-logo-dot" /></span>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {onBack && <button type="button" onClick={onBack} style={qNavBtn}>← Retour</button>}
          <span className="q-idx">06 — 07</span>
          {onExit && <button type="button" onClick={onExit} style={qNavBtn}>Quitter ×</button>}
        </div>
      </div>
      <div className="q-bar-track">
        <div className="q-bar-fill" style={{ width: "72%" }} />
      </div>
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".32em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 10 }}>
        Ce qui me rend unique
      </p>
    </div>
  );
}

// ─── Single textarea field ────────────────────────────────────────────────────

function TextareaField({
  label, subtext, placeholder, value, onChange,
}: {
  label: string;
  subtext?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: subtext ? 6 : 10 }}>
        <label style={{
          fontFamily: "var(--font-serif)",
          fontOpticalSizing: "auto",
          fontSize: "clamp(20px, 4.5vw, 24px)",
          fontWeight: 300,
          color: "var(--ink)",
          letterSpacing: "-.015em",
          lineHeight: 1.2,
          flex: 1,
        } as React.CSSProperties}>
          {label}
        </label>
        <VoiceButton onResult={onChange} currentValue={value} />
      </div>
      {subtext && (
        <p style={{
          fontSize: 12,
          fontWeight: 300,
          color: "var(--ink-3)",
          fontStyle: "italic",
          lineHeight: 1.5,
          marginBottom: 10,
        }}>
          {subtext}
        </p>
      )}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          border: focused ? "1.5px solid var(--pine)" : "0.5px solid var(--line)",
          background: "var(--white)",
          fontFamily: "var(--font-sans)",
          fontSize: 15,
          fontWeight: 300,
          color: "var(--ink)",
          lineHeight: 1.6,
          resize: "none",
          outline: "none",
          boxShadow: "0 2px 8px -3px rgba(23,62,49,.05)",
          transition: "border-color .18s, border-width .18s",
          boxSizing: "border-box",
        } as React.CSSProperties}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const EMPTY: SingularityAnswers = {
  adore_faire: "",
  evite_deteste: "",
  sujets_stimulants: "",
  peu_savent: "",
  plus_beau_cadeau: "",
  detail_compris: "",
  marques_lieux: "",
  cadeaux_non: "",
  envies_reves: "",
  remarquer: "",
  sentir_special: "",
  interests: undefined,
};

export default function SingularityStep({ onDone, initialAnswers, onBack, onExit }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<SingularityAnswers>(initialAnswers ?? EMPTY);

  function set(key: keyof SingularityAnswers) {
    return (v: string) => setAnswers(prev => ({ ...prev, [key]: v }));
  }

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      <SingularityHero onBack={onBack} onExit={onExit ? () => onExit(answers) : undefined} />

      <div style={{ padding: "32px 20px 40px" }}>
        <p style={{
          fontFamily: "var(--font-serif)",
          fontOpticalSizing: "auto",
          fontWeight: 300,
          fontStyle: "italic",
          fontSize: 15,
          color: "var(--ink-2)",
          lineHeight: 1.55,
          marginBottom: 36,
        } as React.CSSProperties}>
          Aucune obligation — réponds à ce qui t'inspire, laisse le reste vide.
          Ces détails donnent à Candice la matière la plus personnelle.
        </p>

        <InterestsQuestion
          label="Mes centres d'intérêt"
          value={answers.interests ?? EMPTY_INTERESTS}
          onChange={v => setAnswers(prev => ({ ...prev, interests: v }))}
        />

        <TextareaField
          label="Ce que j'adore faire"
          placeholder="ex. escalade, séries coréennes, cuisiner pour les autres, randonnée, brocantes, musées…"
          value={answers.adore_faire}
          onChange={set("adore_faire")}
        />
        <TextareaField
          label="Ce que j'évite ou déteste"
          placeholder="ex. sports collectifs, jeux de société, soirées bruyantes, surprises…"
          value={answers.evite_deteste}
          onChange={set("evite_deteste")}
        />
        <TextareaField
          label="Les sujets qui me stimulent vraiment"
          placeholder="ex. startups, psychologie, voyages, football, mode, musique 90s…"
          value={answers.sujets_stimulants}
          onChange={set("sujets_stimulants")}
        />
        <TextareaField
          label="Ce que peu de gens savent sur moi"
          placeholder="ex. j'adore les mangas, j'ai peur de l'avion, je fais de la poterie…"
          value={answers.peu_savent}
          onChange={set("peu_savent")}
        />
        <TextareaField
          label="Le plus beau cadeau ou moment qu'on m'ait offert"
          placeholder="ex. un week-end surprise bien pensé, une lettre manuscrite, un concert inoubliable…"
          value={answers.plus_beau_cadeau}
          onChange={set("plus_beau_cadeau")}
        />
        <TextareaField
          label="Le genre de détail qui me fait me sentir compris(e)"
          placeholder="ex. qu'on se souvienne de ce que j'ai dit il y a trois mois, qu'on adapte sans que je demande…"
          value={answers.detail_compris}
          onChange={set("detail_compris")}
        />
        <TextareaField
          label="Les marques, objets ou lieux que j'aime"
          subtext="Les enseignes et endroits où tu te sens à ta place."
          placeholder="ex. Aesop, les librairies indépendantes, Le Bon Marché, la papeterie japonaise, un bar à vin précis…"
          value={answers.marques_lieux}
          onChange={set("marques_lieux")}
        />
        <TextareaField
          label="Les cadeaux que je n'aimerais pas recevoir"
          subtext="Ce qui, même offert avec gentillesse, tombe à plat pour toi."
          placeholder="ex. bougies, fleurs coupées, gadgets, objets « déco » impersonnels, bons d'achat…"
          value={answers.cadeaux_non}
          onChange={set("cadeaux_non")}
        />
        <TextareaField
          label="Mes envies ou rêves du moment"
          subtext="Ce dont tu as envie en ce moment, petit ou grand."
          placeholder="ex. apprendre la céramique, partir au Japon, un certain sac, me remettre au piano…"
          value={answers.envies_reves}
          onChange={set("envies_reves")}
        />
        <TextareaField
          label="Ce que j'aimerais qu'on remarque davantage chez moi"
          subtext="Ce que tu donnes et qui passe parfois inaperçu."
          placeholder="ex. mes efforts, mon humour, mon écoute, mon travail, ma cuisine…"
          value={answers.remarquer}
          onChange={set("remarquer")}
        />
        <TextareaField
          label="Ce qui me fait me sentir spécial(e)"
          subtext="Le sentiment d'être unique aux yeux de quelqu'un."
          placeholder="ex. qu'on se souvienne d'un détail, qu'on prépare quelque chose rien que pour moi, qu'on prenne du temps…"
          value={answers.sentir_special}
          onChange={set("sentir_special")}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            onClick={() => onDone(answers)}
            className="btn-primary"
            style={{ width: "100%", minHeight: 52 }}
          >
            Continuer →
          </button>
          <button
            type="button"
            onClick={() => onExit ? onExit(answers) : router.push("/moi")}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-3)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              cursor: "pointer",
              padding: "8px 0",
              textAlign: "left",
            }}
          >
            Reprendre plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
