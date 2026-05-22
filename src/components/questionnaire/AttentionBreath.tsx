"use client";

import type { AttentionResult, FaceResult, AttentionDim } from "@/lib/attention/scoring";
import { useRouter } from "next/navigation";

// ─── Labels ───────────────────────────────────────────────────────────────────

const DIMS: AttentionDim[] = ['MOT', 'SER', 'CAD_C', 'CAD_S', 'EXP', 'GES', 'SUR'];

// Full labels — used standalone ("ce qui te touche, c'est les mots")
const DIM_LABEL: Record<AttentionDim, string> = {
  MOT:   'les mots',
  SER:   'les services rendus',
  CAD_C: 'les cadeaux choisis',
  CAD_S: 'les cadeaux qui ont du sens',
  EXP:   'le temps partagé et les expériences',
  GES:   'les petites attentions du quotidien',
  SUR:   'les surprises',
};

// Short labels — used when listing multiple dims in a sentence (avoids double "et")
const DIM_SHORT: Record<AttentionDim, string> = {
  MOT:   'les mots',
  SER:   'les services rendus',
  CAD_C: 'les cadeaux choisis',
  CAD_S: 'les cadeaux qui ont du sens',
  EXP:   'le temps partagé',
  GES:   'les petites attentions',
  SUR:   'les surprises',
};

// Agreement helper: "les X suivent" vs "le X suit"
function followVerb(dim: AttentionDim): string {
  return DIM_SHORT[dim].startsWith('les ') ? 'suivent' : 'suit';
}

// ─── Étape 1 — ensembles forts ────────────────────────────────────────────────

function sortedByNorm(normalized: Record<AttentionDim, number>): AttentionDim[] {
  return [...DIMS].sort((a, b) => normalized[b] - normalized[a]);
}

function computeFortR(reception: FaceResult): AttentionDim[] {
  const sorted = sortedByNorm(reception.normalized);
  const strong = sorted.filter(d => reception.normalized[d] >= 50).slice(0, 4);
  return strong.length >= 2 ? strong : sorted.slice(0, 2);
}

function computeFortE(expression: FaceResult): AttentionDim[] {
  const sorted = sortedByNorm(expression.normalized);
  const strong = sorted.filter(d => expression.normalized[d] >= 50).slice(0, 3);
  return strong.length >= 1 ? strong : sorted.slice(0, 1);
}

// ─── Étape 2 — phrase de réception ───────────────────────────────────────────

function buildReceptionPhrase(reception: FaceResult, topR: AttentionDim[]): string {
  const norm = reception.normalized;
  const strongCount = DIMS.filter(d => norm[d] >= 50).length;

  // Sommet serré (3+ dims, gap top1–top3 ≤ 30) → multi-langages
  if (topR.length >= 3 && norm[topR[0]] - norm[topR[2]] <= 30) {
    const list = `${DIM_SHORT[topR[0]]}, ${DIM_SHORT[topR[1]]} et ${DIM_SHORT[topR[2]]}`;
    const hasTop4 = topR.length >= 4 && norm[topR[3]] >= 50;
    if (hasTop4) {
      const verb = followVerb(topR[3]);
      return `Plusieurs langages comptent presque autant pour toi : ${list} — ${DIM_SHORT[topR[3]]} ${verb} juste derrière.`;
    }
    return `Plusieurs langages comptent presque autant pour toi : ${list}.`;
  }

  // Exactement 2 dims fortes
  if (strongCount === 2) {
    return `Ce qui te touche le plus, c'est ${DIM_LABEL[topR[0]]} — et tout autant ${DIM_LABEL[topR[1]]}.`;
  }

  // Dominant net
  const primary = `Ce qui te touche avant tout, c'est ${DIM_LABEL[topR[0]]}.`;
  if (topR.length >= 2 && norm[topR[1]] >= 50) {
    return `${primary} Viennent ensuite ${DIM_LABEL[topR[1]]}.`;
  }
  return primary;
}

// ─── Étape 3 — congruence vs décalage ────────────────────────────────────────

interface SecondPhrase {
  text: string;
  isGap: boolean;
}

function buildSecondPhrase(
  reception: FaceResult,
  topR: AttentionDim[],
  topE: AttentionDim[],
): SecondPhrase {
  const shared = topE.filter(d => topR.includes(d));
  const congruenceRatio = shared.length / Math.max(1, topE.length);

  if (congruenceRatio >= 0.6) {
    return {
      text: "Et tu sembles offrir aux autres ce que tu aimes toi-même recevoir.",
      isGap: false,
    };
  }

  // Vrai écart — nommé précisément, sans dramatiser
  const giveOnly = topE.filter(d => !topR.includes(d));
  const giveDim = giveOnly.length > 0 ? giveOnly[0] : topE[0];
  const recDom = reception.dominant.length > 0 ? reception.dominant[0] : topR[0];

  return {
    text: `Tu donnes surtout par ${DIM_LABEL[giveDim]}, alors que ce qui te touche le plus, c'est plutôt ${DIM_LABEL[recDom]}. Un écart utile à connaître.`,
    isGap: true,
  };
}

// ─── Assemblage ───────────────────────────────────────────────────────────────

interface Analysis {
  mainPhrase: string;
  second: SecondPhrase;
}

function buildAnalysis(result: AttentionResult): Analysis {
  const topR = computeFortR(result.reception);
  const topE = computeFortE(result.expression);
  return {
    mainPhrase: buildReceptionPhrase(result.reception, topR),
    second: buildSecondPhrase(result.reception, topR, topE),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  result: AttentionResult;
  onContinue: () => void;
}

export default function AttentionBreath({ result, onContinue }: Props) {
  const router = useRouter();
  const { mainPhrase, second } = buildAnalysis(result);

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

      {/* Main reception phrase */}
      <p style={{
        fontFamily: "var(--playfair)", fontStyle: "italic",
        fontSize: "clamp(18px, 3.2vw, 22px)", fontWeight: 400,
        color: "var(--con)", lineHeight: 1.55, marginBottom: 16,
      }}>
        {mainPhrase}
      </p>

      {/* Congruence or gap phrase */}
      <p style={{
        fontSize: 14, fontWeight: 300, color: "var(--cond)",
        lineHeight: 1.7,
        marginBottom: 28,
        ...(second.isGap ? {
          padding: "14px 16px",
          background: "var(--t1)",
          border: "0.5px solid var(--t3)",
          borderRadius: 8,
        } : {}),
      }}>
        {second.text}
      </p>

      {/* Progression note — never a number */}
      <p style={{
        fontSize: 11, fontWeight: 300, color: "var(--conb)",
        letterSpacing: "0.3px", marginBottom: 24, fontStyle: "italic",
      }}>
        Ton profil se précise.
      </p>

      {/* Divider */}
      <div style={{ height: "0.5px", background: "var(--br3)", width: "100%", marginBottom: 24 }} />

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
