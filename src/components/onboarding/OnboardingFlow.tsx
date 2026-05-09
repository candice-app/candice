"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

const RELATIONSHIP_OPTIONS = [
  { value: "partner", label: "Conjoint·e" },
  { value: "friend", label: "Ami·e" },
  { value: "family", label: "Famille" },
  { value: "colleague", label: "Collègue" },
  { value: "other", label: "Autre" },
];

interface ContactEntry {
  name: string;
  relationship: string;
}

interface Props {
  userId: string;
  userName: string;
  onComplete: () => void;
}

const PLAYFAIR: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontWeight: 400,
};

export default function OnboardingFlow({ userId, userName, onComplete }: Props) {
  const supabase = createClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contacts, setContacts] = useState<ContactEntry[]>([{ name: "", relationship: "friend" }]);
  const [createdContacts, setCreatedContacts] = useState<{ id: string; name: string }[]>([]);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const pct = step === 1 ? 33 : step === 2 ? 66 : 100;

  const awardPts = async (actionType: string, points: number) => {
    await supabase.from("user_points").insert({ user_id: userId, action_type: actionType, points });
  };

  const markComplete = async () => {
    await supabase
      .from("my_profile")
      .upsert({ user_id: userId, onboarding_completed: true }, { onConflict: "user_id" });
  };

  const handleStart = async () => {
    const { data: existing } = await supabase
      .from("user_points")
      .select("id")
      .eq("user_id", userId)
      .eq("action_type", "registration")
      .maybeSingle();
    if (!existing) {
      await awardPts("registration", 500);
    }
    setStep(2);
  };

  const addContact = () => {
    if (contacts.length < 3) setContacts([...contacts, { name: "", relationship: "friend" }]);
  };

  const handleContactsSubmit = async () => {
    const valid = contacts.filter((c) => c.name.trim());
    if (valid.length === 0) { setStep(3); return; }

    setLoading(true);
    const created: { id: string; name: string }[] = [];
    for (const c of valid) {
      const { data: contact } = await supabase
        .from("contacts")
        .insert({ user_id: userId, name: c.name.trim(), relationship: c.relationship })
        .select("id, name")
        .single();
      if (contact) {
        created.push({ id: contact.id, name: contact.name });
        await supabase.from("share_links").insert({
          sender_id: userId,
          sender_name: userName || "Un(e) ami(e)",
        });
        await awardPts("contact_created", 200);
      }
    }
    setCreatedContacts(created);
    setLoading(false);
    setStep(3);
  };

  const handleFinish = async () => {
    setLoading(true);
    for (const contact of createdContacts) {
      const date = dates[contact.id];
      if (date) {
        await supabase.from("questionnaire_responses").insert({
          contact_id: contact.id,
          user_id: userId,
          important_dates: JSON.stringify([{ label: "Anniversaire", date }]),
        });
        await awardPts("date_added", 50);
      }
    }
    await markComplete();
    setLoading(false);
    onComplete();
  };

  const handleSkipToFinish = async () => {
    await markComplete();
    onComplete();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(30,18,8,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#FAF7F2", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(196,122,74,0.15)" }}>
          <div style={{ height: "100%", background: "#C47A4A", width: `${pct}%`, transition: "width 0.3s ease", borderRadius: "0 2px 2px 0" }} />
        </div>

        <div style={{ padding: "32px 28px" }}>

          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 300, color: "#A08060", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Bienvenue sur</p>
              <h1 style={{ ...PLAYFAIR, fontSize: 34, color: "#2C1A0E", marginBottom: 10, letterSpacing: 2 }}>candice</h1>
              <p style={{ fontSize: 15, fontWeight: 300, color: "#4A3828", lineHeight: 1.75, marginBottom: 28 }}>
                Ton assistant pour être un(e) proche attentionné(e). Candice mémorise ce qui compte vraiment pour tes proches — pour que chaque attention soit parfaitement juste.
              </p>

              <div style={{ background: "#fff", border: "0.5px solid rgba(196,122,74,0.2)", borderRadius: 12, padding: "18px 20px", marginBottom: 28 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: "#C47A4A", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>✦ Ton programme de points</p>
                {[
                  { label: "Créer ton compte", pts: "+500 pts" },
                  { label: "Ajouter un proche", pts: "+200 pts" },
                  { label: "Compléter une fiche partagée", pts: "+500 pts" },
                  { label: "Ajouter une date importante", pts: "+50 pts" },
                  { label: "Laisser un feedback", pts: "+100 pts" },
                  { label: "Marquer une attention réalisée", pts: "+100 pts" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "0.5px solid rgba(30,18,8,0.06)" }}>
                    <span style={{ fontSize: 13, fontWeight: 300, color: "#4A3828" }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#C47A4A" }}>{row.pts}</span>
                  </div>
                ))}
                <p style={{ fontSize: 11, fontWeight: 300, color: "#A08060", marginTop: 12, fontStyle: "italic" }}>
                  100 pts = 1€ de réduction sur nos offres premium
                </p>
              </div>

              <button
                onClick={handleStart}
                style={{ width: "100%", background: "#C47A4A", color: "#fff", border: "none", borderRadius: 8, padding: "15px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Commencer →
              </button>
            </div>
          )}

          {/* ── Step 2: Contacts ── */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 300, color: "#A08060", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Étape 2 / 3</p>
              <h2 style={{ ...PLAYFAIR, fontSize: 26, color: "#2C1A0E", marginBottom: 8 }}>Mes proches prioritaires</h2>
              <p style={{ fontSize: 14, fontWeight: 300, color: "#7A5E44", lineHeight: 1.65, marginBottom: 24 }}>
                Ajoute 1 à 3 personnes pour commencer. Chaque proche ajouté te rapporte{" "}
                <strong style={{ color: "#C47A4A", fontWeight: 500 }}>200 points</strong>.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                {contacts.map((c, i) => (
                  <div key={i} style={{ background: "#fff", border: "0.5px solid rgba(196,122,74,0.2)", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                      <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#2C1A0E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "#FAF7F2", flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const next = [...contacts];
                          next[i] = { ...c, name: e.target.value };
                          setContacts(next);
                        }}
                        placeholder="Prénom…"
                        style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#FAF7F2", border: "1px solid rgba(30,18,8,0.12)", borderRadius: 6, padding: "8px 12px", fontSize: 14, color: "#1E1208", outline: "none" }}
                      />
                      {contacts.length > 1 && (
                        <button type="button" onClick={() => setContacts(contacts.filter((_, j) => j !== i))}
                          style={{ background: "none", border: "none", color: "#A08060", fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
                      )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {RELATIONSHIP_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const next = [...contacts];
                            next[i] = { ...c, relationship: opt.value };
                            setContacts(next);
                          }}
                          style={{
                            fontSize: 12, fontWeight: c.relationship === opt.value ? 500 : 300,
                            color: c.relationship === opt.value ? "#fff" : "#4A3828",
                            background: c.relationship === opt.value ? "#C47A4A" : "transparent",
                            border: `1px solid ${c.relationship === opt.value ? "#C47A4A" : "rgba(30,18,8,0.15)"}`,
                            borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {contacts.length < 3 && (
                <button type="button" onClick={addContact}
                  style={{ background: "transparent", border: "1px dashed rgba(196,122,74,0.4)", color: "#C47A4A", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer", width: "100%", marginBottom: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  + Ajouter un proche
                </button>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: contacts.length >= 3 ? 16 : 0 }}>
                <button type="button" onClick={() => setStep(3)}
                  style={{ flex: 1, background: "transparent", border: "1px solid rgba(30,18,8,0.15)", color: "#7A5E44", borderRadius: 8, padding: "12px", fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Passer →
                </button>
                <button type="button" disabled={loading || contacts.every((c) => !c.name.trim())} onClick={handleContactsSubmit}
                  style={{ flex: 2, background: contacts.some((c) => c.name.trim()) ? "#C47A4A" : "rgba(196,122,74,0.3)", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 500, cursor: loading || contacts.every((c) => !c.name.trim()) ? "default" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {loading ? "Enregistrement…" : "Continuer →"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Dates ── */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 300, color: "#A08060", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Étape 3 / 3</p>
              <h2 style={{ ...PLAYFAIR, fontSize: 26, color: "#2C1A0E", marginBottom: 8 }}>Dates importantes</h2>
              <p style={{ fontSize: 14, fontWeight: 300, color: "#7A5E44", lineHeight: 1.65, marginBottom: 24 }}>
                {createdContacts.length > 0
                  ? <>Ajoute les anniversaires pour ne jamais les oublier. Chaque date rapporte <strong style={{ color: "#C47A4A", fontWeight: 500 }}>50 points</strong>.</>
                  : "Tu pourras ajouter des dates importantes depuis chaque fiche de contact."}
              </p>

              {createdContacts.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {createdContacts.map((contact) => (
                    <div key={contact.id} style={{ background: "#fff", border: "0.5px solid rgba(196,122,74,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#2C1A0E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, color: "#FAF7F2", flexShrink: 0 }}>
                        {contact.name[0].toUpperCase()}
                      </span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 400, color: "#1E1208" }}>{contact.name}</span>
                      <input
                        type="date"
                        value={dates[contact.id] ?? ""}
                        onChange={(e) => setDates({ ...dates, [contact.id]: e.target.value })}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#FAF7F2", border: "1px solid rgba(30,18,8,0.12)", borderRadius: 6, padding: "7px 10px", fontSize: 13, color: "#1E1208", outline: "none" }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                {createdContacts.length > 0 && Object.values(dates).some(Boolean) ? (
                  <>
                    <button type="button" onClick={handleSkipToFinish}
                      style={{ flex: 1, background: "transparent", border: "1px solid rgba(30,18,8,0.15)", color: "#7A5E44", borderRadius: 8, padding: "12px", fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Passer →
                    </button>
                    <button type="button" disabled={loading} onClick={handleFinish}
                      style={{ flex: 2, background: "#C47A4A", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 500, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {loading ? "Enregistrement…" : "Terminer →"}
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={handleSkipToFinish}
                    style={{ width: "100%", background: "#C47A4A", color: "#fff", border: "none", borderRadius: 8, padding: "14px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Accéder à Candice →
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
