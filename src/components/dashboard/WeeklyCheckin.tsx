"use client";

import { useState, useEffect } from "react";
import { Contact, QuestionnaireResponse } from "@/types";

interface Props {
  contacts: (Contact & { questionnaire_responses: QuestionnaireResponse[] })[];
}

function getISOWeekKey() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((now.getTime() - start.getTime()) / 86400000) + start.getUTCDay() + 1) / 7);
  return `${now.getUTCFullYear()}-W${week}`;
}

const STORAGE_KEY = "candice_checkin_week";

export default function WeeklyCheckin({ contacts }: Props) {
  const [visible, setVisible] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isMonday = new Date().getDay() === 1;
    const lastKey = localStorage.getItem(STORAGE_KEY);
    const thisWeek = getISOWeekKey();
    if (isMonday && lastKey !== thisWeek && contacts.length > 0) {
      setVisible(true);
    }
  }, [contacts.length]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, getISOWeekKey());
    setVisible(false);
  };

  const handleSubmit = async () => {
    const entries = Object.entries(notes).filter(([, v]) => v.trim());
    if (entries.length === 0) { dismiss(); return; }
    setLoading(true);
    try {
      await Promise.all(entries.map(([contactId, note]) =>
        fetch("/api/profile-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact_id: contactId, note }),
        })
      ));
      setSubmitted(true);
      setTimeout(dismiss, 1800);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div style={{ background: "#fff", border: "0.5px solid rgba(196,122,74,0.25)", borderRadius: 12, padding: "20px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, color: "#C47A4A", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            ✦ Check-in hebdomadaire
          </p>
          <p style={{ fontSize: 14, fontWeight: 300, color: "#4A3828" }}>Des nouvelles de tes proches ?</p>
        </div>
        <button onClick={dismiss} style={{ background: "none", border: "none", color: "#A08060", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
      </div>

      {submitted ? (
        <p style={{ fontSize: 13, fontWeight: 400, color: "#22543D", background: "rgba(34,84,61,0.08)", borderRadius: 6, padding: "10px 14px" }}>
          ✓ Noté ! Candice se souvient de tout.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {contacts.slice(0, 5).map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#2C1A0E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "#FAF7F2", flexShrink: 0 }}>
                {c.name[0].toUpperCase()}
              </span>
              <input
                type="text"
                value={notes[c.id] ?? ""}
                onChange={e => setNotes(n => ({ ...n, [c.id]: e.target.value }))}
                placeholder={`Quoi de neuf avec ${c.name} ?`}
                style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#FAF7F2", border: "0.5px solid rgba(30,18,8,0.12)", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#1E1208", outline: "none" }}
              />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={dismiss} style={{ flex: 1, background: "transparent", border: "0.5px solid rgba(30,18,8,0.15)", color: "#7A5E44", borderRadius: 6, padding: "9px", fontSize: 12, cursor: "pointer" }}>
              Passer
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ flex: 2, background: "#C47A4A", color: "#fff", border: "none", borderRadius: 6, padding: "9px", fontSize: 13, fontWeight: 500, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Enregistrement…" : "Partager avec Candice →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
