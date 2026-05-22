"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Moment from "@/components/presence/Moment";
import Thread, { ThreadItem } from "@/components/presence/Thread";
import PointDivider from "@/components/presence/PointDivider";
import DashboardShell from "@/components/layout/DashboardShell";
import LivePoint from "@/components/presence/LivePoint";
import { computeBreathFacts, buildFallbackText } from "@/lib/attention/breathFacts";
import type { FaceResult, AttentionDim } from "@/lib/attention/scoring";

// ─── Human-language phrase maps ───────────────────────────────────────────────

const RECEPTION_PHRASES: Record<AttentionDim, { lead: string; sub: string }> = {
  MOT: {
    lead: "Les mots sincères",
    sub: "Un compliment vrai, une reconnaissance dite à voix haute, quelque chose qu'on se répète encore longtemps après.",
  },
  SER: {
    lead: "Les gestes concrets",
    sub: "Quelqu'un qui allège ta charge avant même que tu l'exprimes — sans qu'on lui ait rien demandé.",
  },
  CAD_C: {
    lead: "Les cadeaux choisis avec précision",
    sub: "Un objet pensé spécialement pour toi, pas acheté au hasard — qui dit : j'ai fait attention.",
  },
  CAD_S: {
    lead: "Les cadeaux qui portent une histoire",
    sub: "Quelque chose chargé de sens, d'intention, de mémoire — pas juste un objet.",
  },
  EXP: {
    lead: "Les moments vraiment partagés",
    sub: "Du temps pleinement présent, sans distraction ni écran — une expérience vécue ensemble.",
  },
  GES: {
    lead: "Les petites attentions du quotidien",
    sub: "Des micro-gestes réguliers, glissés dans les jours ordinaires, sans attendre une grande occasion.",
  },
  SUR: {
    lead: "Les surprises bien pensées",
    sub: "L'inattendu, mais préparé avec justesse — ce petit choc heureux qui arrive sans bruit.",
  },
};

const EXPRESSION_PHRASES: Record<AttentionDim, string> = {
  MOT: "Tu mets des mots sur ce que tu ressens — compliments, reconnaissance, réassurance. C'est ta langue naturelle.",
  SER: "Tu aides concrètement, sans qu'on ait besoin de te le demander. Tu montres que tu tiens à quelqu'un en allégeant sa charge.",
  CAD_C: "Tu traduis ton affection par des cadeaux choisis avec soin — l'objet juste, pas le geste générique.",
  CAD_S: "Tu aimes les attentions qui portent une histoire, un symbole. Ce que tu offres a du sens.",
  EXP: "Ta façon d'aimer, c'est d'être pleinement présent(e). Le temps partagé, vraiment partagé.",
  GES: "Tu glisses mille petites attentions dans le quotidien. Un message, un détail, un geste — souvent, discrètement.",
  SUR: "Tu crées de l'inattendu. Tu exprimes ton affection en faisant quelque chose que l'autre n'attendait pas.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitBreathText(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(Boolean);
  if (sentences && sentences.length >= 2) return sentences.slice(0, 3);
  // Fallback: split on long pauses
  const parts = text.split(/\s{2,}|—/g).map(s => s.trim()).filter(s => s.length > 20);
  return parts.length >= 2 ? parts.slice(0, 3) : [text];
}

function getReceptionDisplay(reception: FaceResult): { dims: AttentionDim[]; isMulti: boolean } {
  const combined = [...reception.dominant, ...reception.secondaire];
  const unique = [...new Set(combined)];

  // "Multi" = no single dominant and 3+ secondary dims close together
  const isMulti = reception.dominant.length === 0 && reception.secondaire.length >= 3;

  return {
    dims: unique.slice(0, isMulti ? 3 : 2),
    isMulti,
  };
}

function getExpressionDims(expression: FaceResult): AttentionDim[] {
  const combined = [...expression.dominant, ...expression.secondaire];
  return [...new Set(combined)].slice(0, 2);
}

// ─── Modular section wrapper (Lot 5: empile d'autres sections ici) ─────────────

export function ResultSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <PointDivider label={label} />
      <Thread>
        {children}
      </Thread>
    </section>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  reception: FaceResult;
  expression: FaceResult;
  breathText: string | null;
}

export default function ResultatsClient({ userId, reception, expression, breathText: initialBreathText }: Props) {
  const router = useRouter();
  const [breathText, setBreathText] = useState<string | null>(initialBreathText);
  const [generating, setGenerating] = useState(false);
  const [momentVisible, setMomentVisible] = useState(false);

  const generateBreath = useCallback(async () => {
    setGenerating(true);
    try {
      const facts = computeBreathFacts(reception, expression);
      let text: string;

      try {
        const res = await fetch("/api/attention/breath", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facts }),
        });
        const data = await res.json() as { text: string };
        text = data.text || buildFallbackText(facts);
      } catch {
        text = buildFallbackText(facts);
      }

      // Persist
      const supabase = createClient();
      await supabase
        .from("my_profile")
        .update({ attention_breath_text: text, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      setBreathText(text);
    } finally {
      setGenerating(false);
    }
  }, [userId, reception, expression]);

  useEffect(() => {
    if (!initialBreathText) {
      generateBreath();
    }
  }, []);

  // Show Moment once breathText is ready
  useEffect(() => {
    if (breathText) {
      setMomentVisible(true);
    }
  }, [breathText]);

  const { dims: receptionDims, isMulti } = getReceptionDisplay(reception);
  const expressionDims = getExpressionDims(expression);

  const momentLines = breathText ? splitBreathText(breathText) : [];

  return (
    <DashboardShell>
      {/* ── Moment overlay (breath text reveal) ── */}
      <Moment
        show={momentVisible}
        lines={momentLines}
        cta={{
          label: "Voir ta lecture",
          onClick: () => setMomentVisible(false),
        }}
      />

      {/* ── Loading state (generating breath text for old profiles) ── */}
      {generating && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 490,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(135% 70% at 50% 40%, rgba(62,115,97,.20) 0%, rgba(62,115,97,0) 62%), #0E1A14",
        }}>
          <LivePoint size={9} tone="glow" />
          <p style={{
            marginTop: 24,
            fontFamily: "var(--font-serif)",
            fontWeight: 300,
            fontSize: 16,
            color: "rgba(252,251,247,.6)",
            letterSpacing: "-.01em",
          } as React.CSSProperties}>
            Candice prépare ta lecture…
          </p>
        </div>
      )}

      {/* ── Body (always rendered, fades in after Moment dismisses) ── */}
      <div
        className="content-col"
        style={{
          paddingTop: 28,
          opacity: momentVisible || generating ? 0 : 1,
          transition: "opacity .5s ease .2s",
          pointerEvents: momentVisible || generating ? "none" : "auto",
        }}
      >

        {/* Header */}
        <div style={{ padding: "0 4px", marginBottom: 8 }}>
          <Link href="/moi" style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", textDecoration: "none" }}>
            ← Ma fiche
          </Link>
        </div>

        <div style={{ padding: "0 4px", marginBottom: 4 }}>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 300,
            fontSize: 35,
            color: "var(--ink)",
            letterSpacing: "-.022em",
            lineHeight: 1,
          } as React.CSSProperties}>
            Tes langages d'attention
          </h1>
        </div>

        {/* ── Réception ── */}
        <ResultSection label="Ce qui semble compter pour toi">
          {isMulti ? (
            <ThreadItem nodeType="soft">
              <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7 }}>
                Plusieurs choses comptent presque autant pour toi —{" "}
                {receptionDims.map((d, i) => (
                  <span key={d}>
                    <span style={{ fontWeight: 400, color: "var(--ink)" }}>
                      {RECEPTION_PHRASES[d].lead.toLowerCase()}
                    </span>
                    {i < receptionDims.length - 1 ? ", " : ""}
                  </span>
                ))}
                . C&apos;est rarement un seul langage qui domine chez toi.
              </p>
            </ThreadItem>
          ) : (
            receptionDims.map((dim, i) => (
              <ThreadItem key={dim} nodeType={i === 0 ? "anticipe" : "soft"}>
                <p style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 5,
                  letterSpacing: "-.008em",
                }}>
                  {RECEPTION_PHRASES[dim].lead}
                </p>
                <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65 }}>
                  {RECEPTION_PHRASES[dim].sub}
                </p>
              </ThreadItem>
            ))
          )}
        </ResultSection>

        {/* ── Expression ── */}
        {expressionDims.length > 0 && (
          <ResultSection label="Ce que tu offres naturellement">
            {expressionDims.map((dim, i) => (
              <ThreadItem key={dim} nodeType={i === 0 ? "solid" : "soft"} voice={i === 0}>
                <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7 }}>
                  {EXPRESSION_PHRASES[dim]}
                </p>
              </ThreadItem>
            ))}
          </ResultSection>
        )}

        {/* ── Clôture ── */}
        <div style={{
          margin: "48px 0 12px",
          padding: "0 4px",
        }}>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 300,
            fontSize: 18,
            color: "var(--ink-2)",
            letterSpacing: "-.012em",
            lineHeight: 1.5,
            marginBottom: 24,
          } as React.CSSProperties}>
            Ton profil se précise — d&apos;autres facettes viendront.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link href="/moi/questionnaire" style={{ textDecoration: "none" }}>
              <button className="btn-primary">
                Continuer mon profil →
              </button>
            </Link>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 300, color: "var(--ink-3)",
                textAlign: "left", padding: "4px 0",
              }}
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </div>

        {/* Bottom padding for nav */}
        <div style={{ height: 40 }} />

      </div>
    </DashboardShell>
  );
}
