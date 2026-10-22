"use client";

// A4 — RENDU INCOGNITO DEPUIS LA BANQUE CANONIQUE UNIQUE (17 questions). Swap flag-gated : ce composant
// REMPLACE IncognitoFlow quand NEXT_PUBLIC_SOCLE_CANONICAL_INCOGNITO=1 ; le chemin OFF (legacy) est intact.
// Journal about=contact (autorité) via persistIncognitoAnswer. Projection questionnaire_responses peuplée
// du SOUS-ENSEMBLE qui mappe (via adapts) ; les autres questions ne vont QU'AU journal. Respiration mode 3.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  resolveIncognitoQuestions, persistIncognitoAnswer, compute7DFromI1, I1_MODALITY_BY_CODE,
  type ResolvedIncognitoQuestion,
} from "@/lib/questionnaire/canonical-incognito";
import type { ContactGender } from "@/lib/knowledge-write/pronoun";

interface Props { contactId: string; contactName: string; contactGender: ContactGender; }

// adapts (confirmation 2) : questionCode → colonne questionnaire_responses. Les questions ABSENTES de ce
// map ne vont QU'AU journal (I3, I4, I6, I7, I11, I11b, I13, I14 — lues par RIEN aujourd'hui, jusqu'à la reco).
const COLUMN_BY_QUESTION: Record<string, string> = {
  I2: "appreciation_style", I5: "stress_response", I8: "communication_style",
  I9: "decision_making", I10: "emotional_expression", I12: "standing",
  I15: "things_to_avoid", I16: "gift_preference",
};

export default function IncognitoFlowCanonical({ contactId, contactName, contactGender }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const questions = useMemo(() => resolveIncognitoQuestions(contactName, contactGender), [contactName, contactGender]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({}); // questionCode → codes ordonnés
  const [saving, setSaving] = useState(false);
  const [breath, setBreath] = useState<string | null>(null);

  const q: ResolvedIncognitoQuestion | undefined = questions[idx];
  const maxPick = q ? (q.selection === "single" ? 1 : typeof q.selection === "object" ? q.selection.multi : Infinity) : 0;

  function toggle(code: string) {
    if (!q) return;
    setAnswers((prev) => {
      const cur = prev[q.code] ?? [];
      if (cur.includes(code)) return { ...prev, [q.code]: cur.filter((c) => c !== code) };
      if (maxPick === 1) return { ...prev, [q.code]: [code] };
      if (cur.length >= maxPick) return prev; // plafond multi:N atteint
      return { ...prev, [q.code]: [...cur, code] }; // ordre = rang
    });
  }

  async function finish(allAnswers: Record<string, string[]>) {
    setSaving(true);
    const ownerId = (await supabase.auth.getUser()).data.user?.id ?? "";
    const ts = new Date().toISOString();
    const ctx = { contactId, ownerId, firstName: contactName, gender: contactGender, timestamp: ts };

    // 1) JOURNAL (autorité) — une acquisition par question répondue
    for (const [code, picks] of Object.entries(allAnswers)) {
      if (picks.length === 0) continue;
      try { await persistIncognitoAnswer(supabase as never, ctx, code, picks); }
      catch (e) { console.error("[IncognitoFlowCanonical] persistIncognitoAnswer", code, (e as Error).message); }
    }

    // 2) PROJECTION questionnaire_responses — sous-ensemble qui mappe (via adapts) + 7D depuis I1
    const textOf = (code: string) => questions.flatMap((qq) => qq.options).find((o) => o.code === code)?.text ?? code;
    const row: Record<string, unknown> = { contact_id: contactId, user_id: ownerId };
    const i1 = allAnswers.I1 ?? [];
    if (i1.length > 0) {
      const modalities = i1.map((c) => I1_MODALITY_BY_CODE[c]).filter(Boolean);
      row.attention_reception = compute7DFromI1(modalities); // vecteur 7D (reconstructible du journal)
      row.love_language = i1.join(",");
    }
    for (const [code, col] of Object.entries(COLUMN_BY_QUESTION)) {
      const picks = allAnswers[code];
      if (picks && picks.length > 0) row[col] = picks.map(textOf).join(", ");
    }
    row.incognito_signals = allAnswers; // trace brute (toutes les réponses canoniques)
    const { error } = await supabase.from("questionnaire_responses").upsert(row, { onConflict: "contact_id,user_id" });
    if (error) console.error("[IncognitoFlowCanonical] questionnaire_responses upsert", error.message);

    // 3) RESPIRATION MODE 3 (journal about=contact, 7a/7b/7c + 7d corrigé) — vide si échec, jamais de repli
    try {
      const { readContactTags, readContactFacts } = await import("@/lib/questionnaire/breath-tags");
      const input = await readContactTags(supabase as never, ownerId, contactId);
      const facts = await readContactFacts(supabase as never, ownerId, contactId);
      const res = await fetch("/api/socle/breath", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, facts, subject: "other" }) });
      const data = (await res.json()) as { text: string };
      setBreath(data.text ?? "");
    } catch { setBreath(""); }
    setSaving(false);
  }

  function next() {
    if (!q) return;
    if (idx < questions.length - 1) setIdx(idx + 1);
    else finish(answers);
  }

  if (breath !== null) {
    return (
      <main style={{ maxWidth: 620, margin: "0 auto", padding: "2rem 1.25rem" }}>
        <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{breath || "Tu ne sais pas encore grand-chose d'elle — ça viendra."}</p>
        <button type="button" onClick={() => router.push(`/contacts/${contactId}`)} style={{ marginTop: 24 }}>Terminer →</button>
      </main>
    );
  }

  if (!q) return null;
  const picked = answers[q.code] ?? [];
  return (
    <main style={{ maxWidth: 620, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <div style={{ fontSize: 13, opacity: 0.6 }}>Question {idx + 1} / {questions.length}</div>
      <h2 style={{ fontSize: 20, margin: "0.5rem 0 1rem" }}>{q.stem}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {q.options.map((o) => {
          const sel = picked.includes(o.code);
          const rank = sel && maxPick > 1 && maxPick !== Infinity ? picked.indexOf(o.code) + 1 : null;
          return (
            <button key={o.code} type="button" onClick={() => toggle(o.code)}
              style={{ textAlign: "left", padding: "10px 14px", border: sel ? "1.5px solid var(--pine, #2f5d50)" : "0.5px solid var(--line, #ccc)", borderRadius: 10, background: sel ? "var(--pine-wash, #eef4f1)" : "transparent" }}>
              {rank ? `${rank}. ` : ""}{o.text}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        {idx > 0 && <button type="button" onClick={() => setIdx(idx - 1)}>← Retour</button>}
        <button type="button" onClick={next} disabled={saving}>
          {idx < questions.length - 1 ? "Continuer →" : saving ? "…" : "Terminer →"}
        </button>
      </div>
    </main>
  );
}
