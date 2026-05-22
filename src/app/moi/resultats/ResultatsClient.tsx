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
import { computeProfileSynthesis } from "@/lib/profile/synthesis";
import type { FaceResult, AttentionDim } from "@/lib/attention/scoring";
import type { RelationalFilters } from "@/lib/lifestyle/scoring";
import type { ProfileSynthesisFacts, SynthesisNarrative } from "@/lib/profile/synthesis";

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
  const parts = text.split(/\s{2,}|—/g).map(s => s.trim()).filter(s => s.length > 20);
  return parts.length >= 2 ? parts.slice(0, 3) : [text];
}

function getReceptionDisplay(reception: FaceResult): { dims: AttentionDim[]; isMulti: boolean } {
  const combined = [...reception.dominant, ...reception.secondaire];
  const unique = [...new Set(combined)];
  const isMulti = reception.dominant.length === 0 && reception.secondaire.length >= 3;
  return { dims: unique.slice(0, isMulti ? 3 : 2), isMulti };
}

function getExpressionDims(expression: FaceResult): AttentionDim[] {
  const combined = [...expression.dominant, ...expression.secondaire];
  return [...new Set(combined)].slice(0, 2);
}

// ─── Modular section wrapper ───────────────────────────────────────────────────

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

// ─── Synthesis sections ───────────────────────────────────────────────────────

function SynthesisSection({ narrative }: { narrative: SynthesisNarrative }) {
  return (
    <>
      {/* Block 1 — Synthèse */}
      <ResultSection label="En quelques mots">
        <ThreadItem nodeType="solid" voice>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 300,
            fontSize: "clamp(17px, 3.5vw, 20px)",
            color: "var(--ink)",
            lineHeight: 1.55,
            letterSpacing: "-.012em",
          } as React.CSSProperties}>
            {narrative.block1}
          </p>
        </ThreadItem>
      </ResultSection>

      {/* Block 2 — Langages (réception + expression + contraste) */}
      <ResultSection label="Tes langages d'attention">
        <ThreadItem nodeType="anticipe">
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7 }}>
            {narrative.block2_reception_text}
          </p>
        </ThreadItem>
        {narrative.block2_expression_text && (
          <ThreadItem nodeType="soft">
            <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7 }}>
              {narrative.block2_expression_text}
            </p>
          </ThreadItem>
        )}
        {narrative.block2_contrast_text && (
          <ThreadItem nodeType="soft">
            <p style={{
              fontSize: 13.5,
              fontWeight: 300,
              color: "var(--ink-3)",
              fontStyle: "italic",
              lineHeight: 1.65,
            }}>
              {narrative.block2_contrast_text}
            </p>
          </ThreadItem>
        )}
      </ResultSection>

      {/* Block 3 — Ce qui te touche */}
      {narrative.block3.length > 0 && (
        <ResultSection label="Ce qui te touche le plus">
          {narrative.block3.map((item, i) => (
            <ThreadItem key={i} nodeType={i === 0 ? "anticipe" : "soft"}>
              <p style={{ fontSize: 14.5, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65 }}>
                {item}
              </p>
            </ThreadItem>
          ))}
        </ResultSection>
      )}

      {/* Block 4 — Ce qu'il vaut mieux éviter */}
      {narrative.block4.length > 0 && (
        <ResultSection label="Ce qu'il vaut mieux éviter">
          {narrative.block4.map((item, i) => (
            <ThreadItem key={i} nodeType="soft">
              <p style={{ fontSize: 14.5, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65 }}>
                {item}
              </p>
            </ThreadItem>
          ))}
        </ResultSection>
      )}

      {/* Block 5 — Style relationnel */}
      {narrative.block5 && (
        <ResultSection label="Ton style relationnel">
          <ThreadItem nodeType="solid">
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.75 }}>
              {narrative.block5}
            </p>
          </ThreadItem>
        </ResultSection>
      )}

      {/* Block 6 — Style de communication */}
      {narrative.block6 && (
        <ResultSection label="Ton style de communication">
          <ThreadItem nodeType="solid">
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.75 }}>
              {narrative.block6}
            </p>
          </ThreadItem>
        </ResultSection>
      )}

      {/* Block 7 — Tes attentions idéales */}
      {narrative.block7.length > 0 && (
        <ResultSection label="Tes attentions idéales">
          {narrative.block7.map((item, i) => (
            <ThreadItem key={i} nodeType={i === 0 ? "anticipe" : "soft"}>
              <p style={{ fontSize: 14.5, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65 }}>
                {item}
              </p>
            </ThreadItem>
          ))}
        </ResultSection>
      )}

      {/* Block 8 — Les attentions à éviter */}
      {narrative.block8.length > 0 && (
        <ResultSection label="Les attentions à éviter">
          {narrative.block8.map((item, i) => (
            <ThreadItem key={i} nodeType="soft">
              <p style={{ fontSize: 14.5, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65 }}>
                {item}
              </p>
            </ThreadItem>
          ))}
        </ResultSection>
      )}

      {/* Blocks 9-12 — Nuances (level labels, never numbers) */}
      {(narrative.block9 || narrative.block10 || narrative.block11 || narrative.block12) && (
        <ResultSection label="Quelques nuances">
          <ThreadItem nodeType="soft">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
              {[
                { label: "Spontanéité", value: narrative.block9 },
                { label: "Besoin de contrôle", value: narrative.block10 },
                { label: "Sensibilité aux détails", value: narrative.block11 },
                { label: "Besoin d'espace", value: narrative.block12 },
              ].filter(item => item.value && item.value !== "équilibré" && item.value !== "équilibrée").map(item => (
                <div key={item.label}>
                  <p style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-3)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 4 }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink)" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </ThreadItem>
        </ResultSection>
      )}
    </>
  );
}

// ─── Incomplete profile invite ─────────────────────────────────────────────────

function IncompleteInvite({ hasTemperament, hasLifestyle }: { hasTemperament: boolean; hasLifestyle: boolean }) {
  if (hasTemperament && hasLifestyle) return null;

  let msg = "Complète ton profil pour découvrir ";
  if (!hasTemperament) msg += "ton style relationnel, ton style de communication et tes nuances";
  else if (!hasLifestyle) msg += "tes attentions idéales et ce qu'il vaut mieux éviter";

  return (
    <div style={{
      margin: "32px 0",
      padding: "20px 20px",
      background: "rgba(23,62,49,.04)",
      borderRadius: 14,
      border: "0.5px solid var(--line)",
    }}>
      <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 14 }}>
        {msg}.
      </p>
      <Link href="/moi/questionnaire" style={{ textDecoration: "none" }}>
        <button className="btn-primary" style={{ fontSize: 14 }}>
          Continuer mon profil →
        </button>
      </Link>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  reception: FaceResult;
  expression: FaceResult;
  breathText: string | null;
  temperamentAxes: Record<string, { score: number; intensity: number }> | null;
  temperamentModes: Record<string, { label: string; intensity: number } | null> | null;
  lifestyleAxes: Record<string, { score: number; intensity: number }> | null;
  relationalFilters: RelationalFilters | null;
  practicalInfo: { vetos?: { no_alcohol?: boolean; halal?: boolean; casher?: boolean; mobility_constraints?: boolean; allergies?: string[] } } | null;
  singularity: Record<string, string> | null;
  synthesis: SynthesisNarrative | null;
  needsSynthesis: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResultatsClient({
  userId,
  reception,
  expression,
  breathText: initialBreathText,
  temperamentAxes,
  temperamentModes,
  lifestyleAxes,
  relationalFilters,
  practicalInfo,
  singularity,
  synthesis: initialSynthesis,
  needsSynthesis,
}: Props) {
  const router = useRouter();
  const [breathText, setBreathText] = useState<string | null>(initialBreathText);
  const [generating, setGenerating] = useState(false);
  const [generatingSynthesis, setGeneratingSynthesis] = useState(false);
  const [momentVisible, setMomentVisible] = useState(false);
  const [synthesis, setSynthesis] = useState<SynthesisNarrative | null>(initialSynthesis);

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

  const generateSynthesis = useCallback(async () => {
    setGeneratingSynthesis(true);
    try {
      const facts: ProfileSynthesisFacts = computeProfileSynthesis({
        reception,
        expression,
        temperamentAxes,
        temperamentModes,
        lifestyleAxes,
        relationalFilters,
        practicalInfo,
        singularity,
      });

      let narrative: SynthesisNarrative;
      try {
        const res = await fetch("/api/profile/synthesis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facts }),
        });
        const data = await res.json() as { narrative: SynthesisNarrative };
        narrative = data.narrative;
      } catch {
        const { buildFallbackNarrative } = await import("@/lib/profile/synthesis");
        narrative = buildFallbackNarrative(facts);
      }

      // Persist
      const supabase = createClient();
      await supabase
        .from("my_profile")
        .update({
          profile_synthesis: narrative,
          synthesis_computed_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      setSynthesis(narrative);
    } finally {
      setGeneratingSynthesis(false);
    }
  }, [userId, reception, expression, temperamentAxes, temperamentModes, lifestyleAxes, relationalFilters, practicalInfo, singularity]);

  useEffect(() => {
    if (!initialBreathText) generateBreath();
  }, []);

  useEffect(() => {
    if (needsSynthesis) generateSynthesis();
  }, []);

  useEffect(() => {
    if (breathText) setMomentVisible(true);
  }, [breathText]);

  const { dims: receptionDims, isMulti } = getReceptionDisplay(reception);
  const expressionDims = getExpressionDims(expression);
  const momentLines = breathText ? splitBreathText(breathText) : [];

  const isLoading = generating || (generatingSynthesis && !synthesis);

  return (
    <DashboardShell>
      {/* ── Moment overlay ── */}
      <Moment
        show={momentVisible}
        lines={momentLines}
        cta={{ label: "Voir ma lecture", onClick: () => setMomentVisible(false) }}
      />

      {/* ── Loading state ── */}
      {isLoading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 490,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
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

      {/* ── Body ── */}
      <div
        className="content-col"
        style={{
          paddingTop: 28,
          opacity: momentVisible || isLoading ? 0 : 1,
          transition: "opacity .5s ease .2s",
          pointerEvents: momentVisible || isLoading ? "none" : "auto",
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
            Mon profil
          </h1>
        </div>

        {/* ── Synthesis sections (when available) ── */}
        {synthesis ? (
          <SynthesisSection narrative={synthesis} />
        ) : (
          <>
            {/* Fallback: existing attention sections while synthesis loads */}
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
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 5, letterSpacing: "-.008em" }}>
                      {RECEPTION_PHRASES[dim].lead}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65 }}>
                      {RECEPTION_PHRASES[dim].sub}
                    </p>
                  </ThreadItem>
                ))
              )}
            </ResultSection>

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
          </>
        )}

        {/* ── Incomplete profile invite ── */}
        <IncompleteInvite
          hasTemperament={!!temperamentAxes}
          hasLifestyle={!!lifestyleAxes}
        />

        {/* ── Clôture ── */}
        <div style={{ margin: "48px 0 12px", padding: "0 4px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(!temperamentAxes || !lifestyleAxes) && (
              <Link href="/moi/questionnaire" style={{ textDecoration: "none" }}>
                <button className="btn-primary">
                  Continuer mon profil →
                </button>
              </Link>
            )}
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

        <div style={{ height: 40 }} />
      </div>
    </DashboardShell>
  );
}
