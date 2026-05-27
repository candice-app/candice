"use client";
import { useState } from "react";
import Thread, { ThreadItem } from "@/components/presence/Thread";
import type { ContactRecommendations, RecoIdea } from "@/lib/recommendations/types";

const CANAL_LABEL: Record<string, string> = {
  message:    "Message",
  appel:      "Appel",
  en_personne:"En personne",
  cadeau:     "Cadeau",
  service:    "Service",
  experience: "Expérience",
};

interface Props {
  contactId: string;
  contactFirstName: string;
  initialRecommendations: ContactRecommendations | null;
}

export default function AttentionContextuelle({ contactId, contactFirstName, initialRecommendations }: Props) {
  const [reco, setReco] = useState<ContactRecommendations | null>(initialRecommendations);
  const [loading, setLoading] = useState(false);
  const [doneSet, setDoneSet] = useState<Set<string>>(new Set());

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/recommendations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const data = await res.json() as { recommendations?: ContactRecommendations };
      if (data.recommendations) {
        setReco(data.recommendations);
        setDoneSet(new Set());
      }
    } finally {
      setLoading(false);
    }
  }

  async function markDone(idea: RecoIdea) {
    setDoneSet((prev) => new Set([...prev, idea.title]));
    fetch("/api/recommendations/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, attentionTitle: idea.title, status: "done" }),
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div style={{ padding: "20px 4px" }}>
        <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-3)", fontStyle: "italic" }}>
          Candice réfléchit à {contactFirstName}…
        </p>
      </div>
    );
  }

  if (!reco || reco.ideas.length === 0) {
    return (
      <div style={{ padding: "16px 4px" }}>
        <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 16 }}>
          Candice peut te suggérer des attentions adaptées à {contactFirstName}.
        </p>
        <button
          type="button"
          onClick={generate}
          style={{ fontSize: 13, fontWeight: 400, color: "var(--pine)", background: "none", border: "0.5px solid rgba(23,62,49,.25)", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}
        >
          Découvrir les idées →
        </button>
      </div>
    );
  }

  const visible = reco.ideas.filter((idea) => !doneSet.has(idea.title));

  return (
    <>
      {visible.length > 0 ? (
        <Thread>
          {visible.map((idea, i) => (
            <ThreadItem key={idea.title} nodeType={i === 0 ? "anticipe" : "soft"}>
              <div>
                <p style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 300,
                  fontSize: i === 0 ? 16 : 14,
                  color: "var(--ink)",
                  lineHeight: 1.4,
                  marginBottom: 6,
                }}>
                  {idea.title}
                </p>
                <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 10 }}>
                  {idea.justification}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 10, fontWeight: 500,
                    letterSpacing: ".1em", textTransform: "uppercase",
                    color: "var(--ink-3)",
                    background: "var(--champ-soft)",
                    border: "0.5px solid var(--champ-line)",
                    borderRadius: 20,
                    padding: "2px 9px",
                  }}>
                    {idea.declencheur}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 300, color: "var(--ink-3)" }}>
                    {CANAL_LABEL[idea.canal] ?? idea.canal}
                  </span>
                  {idea.isBlindSpot && (
                    <span style={{ fontSize: 10, fontWeight: 300, color: "rgba(23,62,49,.55)", fontStyle: "italic" }}>
                      ✦ angle mort
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => markDone(idea)}
                    style={{
                      marginLeft: "auto", fontSize: 11, fontWeight: 400,
                      color: "var(--pine)", background: "none", border: "none",
                      cursor: "pointer", padding: 0, letterSpacing: ".04em",
                    }}
                  >
                    Fait ✓
                  </button>
                </div>
              </div>
            </ThreadItem>
          ))}
        </Thread>
      ) : (
        <div style={{ padding: "16px 4px 8px" }}>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-3)", fontStyle: "italic", marginBottom: 14 }}>
            Bravo — toutes les attentions ont été faites pour {contactFirstName}.
          </p>
        </div>
      )}

      {/* Blind spot note — shown only when not already surfaced inline */}
      {reco.blindSpot && !visible.some((i) => i.isBlindSpot) && (
        <div style={{
          margin: "14px 0 4px",
          padding: "14px 16px",
          background: "rgba(23,62,49,.04)",
          borderRadius: 10,
          border: "0.5px solid rgba(23,62,49,.1)",
        }}>
          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65 }}>
            {reco.blindSpot.note}
          </p>
        </div>
      )}

      <div style={{ marginTop: 16, padding: "0 4px" }}>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          style={{
            fontSize: 12, fontWeight: 300, color: "var(--ink-3)",
            background: "none", border: "none", cursor: "pointer",
            padding: 0, textDecoration: "underline", textUnderlineOffset: 3,
          }}
        >
          Rafraîchir les idées
        </button>
      </div>
    </>
  );
}
