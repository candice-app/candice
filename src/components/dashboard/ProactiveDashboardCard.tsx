"use client";

import { useState } from "react";
import type { ProactiveSuggestion, RefusalReason } from "@/types";
import ProactiveSuggestionDetail from "./ProactiveSuggestionDetail";

export type SuggestionWithContact = ProactiveSuggestion & {
  contacts: { name: string; relationship: string };
  contextual_signals: { signal_type: string; signal_data: Record<string, unknown> } | null;
};

interface Props {
  topSuggestion: SuggestionWithContact;
  allPending: SuggestionWithContact[];
  pendingCount: number;
  isDevMode: boolean;
}

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Aujourd'hui",
  high: "Cette semaine",
  normal: "À venir",
  low: "Quand tu peux",
};

export function getSignalBadge(signalType: string, signalData: Record<string, unknown>): string {
  const daysSince = signalData.days_since as number | null | undefined;
  const dateLabel = signalData.date_label as string | undefined;

  const map: Record<string, string> = {
    birthday_d7:        "Anniversaire dans 7 jours",
    birthday_d3:        "Anniversaire dans 3 jours",
    birthday_d1:        "Anniversaire demain",
    birthday_today:     "Anniversaire aujourd'hui",
    couple_anniversary: "Anniversaire de relation",
    wedding_anniversary:"Anniversaire de mariage",
    mothers_day:        "Fête des mères",
    fathers_day:        "Fête des pères",
    valentines_day:     "Saint-Valentin",
    christmas:          "Noël",
    custom_date:        dateLabel ? `Date importante : ${dateLabel}` : "Date importante",
    silence:            daysSince && daysSince !== Infinity
      ? `${Math.round(daysSince / 30)} mois sans connexion`
      : "Silence relationnel",
  };

  return map[signalType] ?? "Attention recommandée";
}

export default function ProactiveDashboardCard({ topSuggestion, allPending, pendingCount, isDevMode }: Props) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionWithContact | null>(null);
  const [showList, setShowList] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  const activeSuggestion = !dismissed.has(topSuggestion.id) ? topSuggestion : null;
  const visibleOthers = allPending.filter(s => s.id !== topSuggestion.id && !dismissed.has(s.id));
  const otherCount = visibleOthers.length;

  const handleValidate = async (id: string) => {
    await fetch(`/api/proactive-suggestions/${id}/validate`, { method: "POST" });
    setDismissed(prev => new Set(prev).add(id));
    setSelectedSuggestion(null);
  };

  const handleRefuse = async (id: string, reason: RefusalReason) => {
    await fetch(`/api/proactive-suggestions/${id}/refuse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refusal_reason: reason }),
    });
    setDismissed(prev => new Set(prev).add(id));
    setSelectedSuggestion(null);
  };

  const handleManualTrigger = async () => {
    setTriggerLoading(true);
    setTriggerResult(null);
    try {
      const res = await fetch("/api/cron/detect-and-generate/manual", { method: "POST" });
      const data = await res.json();
      setTriggerResult(`signals: ${data.signals_created ?? 0}, suggestions: ${data.suggestions_generated ?? 0}`);
    } catch {
      setTriggerResult("Erreur");
    } finally {
      setTriggerLoading(false);
    }
  };

  if (!activeSuggestion) return null;

  const signal = activeSuggestion.contextual_signals;
  const badge = signal ? getSignalBadge(signal.signal_type, signal.signal_data) : null;
  const priorityLabel = PRIORITY_LABEL[activeSuggestion.priority] ?? "À venir";
  const contactName = activeSuggestion.contacts.name;

  return (
    <>
      {/* Featured proactive card */}
      <div className="card" style={{ marginBottom: 20, borderLeft: "3px solid var(--terra)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--terra)" }}>
            {priorityLabel}
          </p>
          <p style={{ fontSize: 10, fontWeight: 300, color: "var(--cond)" }}>{contactName}</p>
        </div>
        {badge && (
          <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)", marginBottom: 6, fontStyle: "italic" }}>{badge}</p>
        )}
        <p style={{ fontSize: 14, fontWeight: 400, color: "var(--con)", marginBottom: 14, lineHeight: 1.4 }}>
          {activeSuggestion.title}
        </p>
        <button
          className="btn-primary"
          style={{ fontSize: 12 }}
          onClick={() => setSelectedSuggestion(activeSuggestion)}
        >
          Voir →
        </button>
      </div>

      {/* Others link */}
      {otherCount > 0 && (
        <div style={{ marginBottom: 16, textAlign: "center" }}>
          <button
            onClick={() => setShowList(true)}
            style={{ fontSize: 11, color: "var(--cond)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            Tu as {otherCount} autre{otherCount > 1 ? "s" : ""} attention{otherCount > 1 ? "s" : ""} préparée{otherCount > 1 ? "s" : ""} · Voir le détail
          </button>
        </div>
      )}

      {/* Dev-only manual trigger */}
      {isDevMode && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={handleManualTrigger}
            disabled={triggerLoading}
            style={{
              fontSize: 11, color: "var(--cond)", background: "rgba(0,0,0,0.04)",
              border: "0.5px solid var(--brd)", borderRadius: 6, padding: "4px 10px", cursor: "pointer",
            }}
          >
            {triggerLoading ? "…" : "🔧 Déclencher la détection manuellement"}
          </button>
          {triggerResult && (
            <p style={{ fontSize: 10, color: "var(--cond)", marginTop: 4, fontFamily: "monospace" }}>
              {triggerResult}
            </p>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selectedSuggestion && (
        <ProactiveSuggestionDetail
          suggestion={selectedSuggestion}
          contactName={selectedSuggestion.contacts.name}
          contactRelationship={selectedSuggestion.contacts.relationship}
          badge={selectedSuggestion.contextual_signals ? getSignalBadge(selectedSuggestion.contextual_signals.signal_type, selectedSuggestion.contextual_signals.signal_data) : null}
          onClose={() => setSelectedSuggestion(null)}
          onValidate={handleValidate}
          onRefuse={handleRefuse}
        />
      )}

      {/* List modal */}
      {showList && (
        <div className="modal" style={{ display: "flex" }} onClick={() => setShowList(false)}>
          <div className="modal-box" style={{ maxWidth: 440, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 400, color: "var(--con)" }}>
                Attentions en attente
              </p>
              <button
                onClick={() => setShowList(false)}
                style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: "var(--cond)", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[activeSuggestion, ...visibleOthers].map(s => (
                <div key={s.id} className="card" style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <p style={{ fontSize: 11, color: "var(--terra)", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>
                      {s.contacts.name}
                    </p>
                    <span style={{ fontSize: 10, color: "var(--cond)" }}>
                      {PRIORITY_LABEL[s.priority] ?? s.priority}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 10 }}>{s.title}</p>
                  <button
                    className="btn-primary"
                    style={{ fontSize: 11, padding: "4px 12px" }}
                    onClick={() => { setShowList(false); setSelectedSuggestion(s); }}
                  >
                    Voir →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
