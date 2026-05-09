"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const LS_KEY = "candice_onboarding_steps";

const STEPS = [
  { label: "Compléter ton profil", href: "/moi/questionnaire" },
  { label: "Inviter un premier proche", href: "/contacts/new" },
  { label: "Fiche d'un proche complétée", href: null },
  { label: "Première attention marquée", href: null },
];

export default function OnboardingProgressCard() {
  const supabase = createClient();
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState<boolean[]>([false, false, false, false]);

  useEffect(() => {
    if (localStorage.getItem(LS_KEY) === "completed") return;
    fetchSteps();
  }, []);

  const fetchSteps = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [
      { data: profile },
      { count: contactCount },
      { data: sharedPts },
      { data: attentionPts },
    ] = await Promise.all([
      supabase.from("my_profile")
        .select("diet, food_allergies, clothing_size, shoe_size")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("archived_at", null),
      supabase.from("user_points")
        .select("id")
        .eq("user_id", user.id)
        .eq("action_type", "shared_profile_complete")
        .maybeSingle(),
      supabase.from("user_points")
        .select("id")
        .eq("user_id", user.id)
        .eq("action_type", "attention_done")
        .maybeSingle(),
    ]);

    const steps = [
      !!(profile && (profile.diet || profile.food_allergies || profile.clothing_size || profile.shoe_size)),
      (contactCount ?? 0) > 0,
      !!sharedPts,
      !!attentionPts,
    ];

    setDone(steps);

    if (steps.every(Boolean)) {
      localStorage.setItem(LS_KEY, "completed");
    } else {
      setVisible(true);
    }
  };

  if (!visible) return null;

  const completedCount = done.filter(Boolean).length;
  const pct = (completedCount / 4) * 100;
  const nextStep = STEPS.find((s, i) => !done[i] && s.href);

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 400, color: "var(--con)", marginBottom: 2 }}>
            Tu débutes sur Candice ?
          </p>
          <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)" }}>
            {completedCount}/4 étapes complétées
          </p>
        </div>
        {nextStep && (
          <Link href={nextStep.href!}>
            <button className="btn-primary" style={{ fontSize: 11, padding: "6px 12px", whiteSpace: "nowrap" }}>
              Continuer →
            </button>
          </Link>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "var(--brd2)", borderRadius: 2, marginBottom: 14 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--terra)", borderRadius: 2, transition: "width 0.4s ease" }} />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {STEPS.map((step, i) => {
          const isDone = done[i];
          const row = (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                background: isDone ? "var(--terra)" : "transparent",
                border: `1.5px solid ${isDone ? "var(--terra)" : "var(--brd2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "#fff", lineHeight: 1,
              }}>
                {isDone ? "✓" : ""}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 300,
                color: isDone ? "var(--cond)" : "var(--con)",
                textDecoration: isDone ? "line-through" : "none",
              }}>
                {step.label}
              </span>
            </div>
          );
          return step.href && !isDone ? (
            <Link key={i} href={step.href} style={{ textDecoration: "none" }}>{row}</Link>
          ) : (
            <div key={i}>{row}</div>
          );
        })}
      </div>
    </div>
  );
}
