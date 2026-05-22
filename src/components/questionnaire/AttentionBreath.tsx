"use client";

import type { AttentionResult, AttentionDim } from "@/lib/attention/scoring";
import { useRouter } from "next/navigation";

// ─── Labels and phrases ───────────────────────────────────────────────────────

const DIM_LABEL: Record<AttentionDim, string> = {
  MOT:   "les mots",
  SER:   "les services rendus",
  CAD_C: "les cadeaux choisis avec soin",
  CAD_S: "les cadeaux chargés de sens",
  EXP:   "le temps de qualité",
  GES:   "les petites attentions du quotidien",
  SUR:   "les surprises",
};

const RECEPTION_PHRASE: Record<AttentionDim, string> = {
  MOT:   "Tu es particulièrement sensible aux mots — pas aux grandes déclarations, mais aux phrases sincères dites au bon moment.",
  SER:   "Tu es touché(e) avant tout par ce qu'on fait concrètement pour toi — une aide discrète, sans qu'on te le demande, vaut mille discours.",
  CAD_C: "Ce qui te touche, c'est sentir qu'on te connaît vraiment — un cadeau bien choisi, dans les détails, en dit long.",
  CAD_S: "Pour toi, c'est l'intention qui compte : une attention doit porter une histoire, un sens, quelque chose au-delà de sa valeur.",
  EXP:   "Rien ne remplace, pour toi, le temps vraiment partagé — un moment de qualité, pleinement présent, sans distraction.",
  GES:   "Ce sont les petits gestes du quotidien qui te touchent le plus — la régularité et la constance valent mieux que le grand geste isolé.",
  SUR:   "L'inattendu te touche profondément — une surprise bien pensée crée une émotion que rien d'autre ne peut égaler.",
};

const GENERIC_RECEPTION = "Tu es sensible à différentes formes d'attention — l'intention derrière le geste compte autant que le geste lui-même.";

// ─── Text builders ────────────────────────────────────────────────────────────

function buildReceptionText(result: AttentionResult["reception"]): string {
  const { dominant, secondaire } = result;
  if (dominant.length === 0) return GENERIC_RECEPTION;

  const main = RECEPTION_PHRASE[dominant[0]];
  if (secondaire.length === 0) return main;

  const secLabel = DIM_LABEL[secondaire[0]];
  return `${main} ${secLabel.charAt(0).toUpperCase() + secLabel.slice(1)} comptent aussi beaucoup pour toi.`;
}

function buildGapText(reception: AttentionResult["reception"], expression: AttentionResult["expression"]): string | null {
  const recDom = reception.dominant[0];
  const expDom = expression.dominant[0];
  if (!recDom || !expDom || recDom === expDom) return null;

  return `Tu reçois l'attention surtout par ${DIM_LABEL[recDom]}, mais tu l'exprimes surtout par ${DIM_LABEL[expDom]}. Ce décalage est courant — et c'est exactement ce que Candice peut utiliser pour t'aider à mieux te faire comprendre.`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  result: AttentionResult;
  onContinue: () => void;
}

export default function AttentionBreath({ result, onContinue }: Props) {
  const router = useRouter();
  const receptionText = buildReceptionText(result.reception);
  const gapText = buildGapText(result.reception, result.expression);

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex", flexDirection: "column",
      alignItems: "flex-start", justifyContent: "center",
      padding: "40px 4px 80px",
      maxWidth: 560,
    }}>
      {/* Label */}
      <p className="section-label" style={{ marginBottom: 20 }}>Ton profil d'attention</p>

      {/* Reception phrase */}
      <p style={{
        fontFamily: "var(--playfair)", fontStyle: "italic",
        fontSize: "clamp(18px, 3.2vw, 22px)", fontWeight: 400,
        color: "var(--con)", lineHeight: 1.5, marginBottom: gapText ? 24 : 32,
      }}>
        {receptionText}
      </p>

      {/* Gap phrase */}
      {gapText && (
        <p style={{
          fontSize: 14, fontWeight: 300, color: "var(--cond)",
          lineHeight: 1.7, marginBottom: 32,
          padding: "16px 18px",
          background: "var(--t1)",
          border: "0.5px solid var(--t3)",
          borderRadius: 8,
        }}>
          {gapText}
        </p>
      )}

      {/* Divider */}
      <div style={{ height: "0.5px", background: "var(--br3)", width: "100%", marginBottom: 28 }} />

      {/* Saved status */}
      <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", marginBottom: 20 }}>
        Enregistré ✓
      </p>

      {/* CTA */}
      <button
        type="button"
        onClick={onContinue}
        className="btn-primary lg"
        style={{ width: "100%", minHeight: 52, marginBottom: 16 }}
      >
        Continuer mon profil →
      </button>

      {/* Save and leave */}
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 300, color: "var(--cond)",
          padding: "8px 0", textDecoration: "underline", textDecorationColor: "var(--br3)",
        }}
      >
        Reprendre plus tard
      </button>
    </div>
  );
}
