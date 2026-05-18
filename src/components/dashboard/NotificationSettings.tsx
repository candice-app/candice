"use client";

import { useState } from "react";
import { useWebPush } from "@/hooks/useWebPush";

interface Props {
  initialPushEnabled: boolean;
  initialEmailEnabled: boolean;
  initialQuietStart: number;
  initialQuietEnd: number;
  initialMaxPerDay: number;
}

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, paddingTop: 16, paddingBottom: 16, borderBottom: "0.5px solid var(--brd)" }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: sub ? 2 : 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)" }}>{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
          background: checked ? "var(--terra)" : "rgba(30,18,8,0.15)",
          position: "relative", flexShrink: 0, transition: "background 0.2s",
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: checked ? 22 : 3,
          width: 18, height: 18, borderRadius: 9, background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </button>
    </div>
  );
}

export default function NotificationSettings({
  initialPushEnabled,
  initialEmailEnabled,
  initialQuietStart,
  initialQuietEnd,
  initialMaxPerDay,
}: Props) {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = useWebPush();

  const [pushEnabled, setPushEnabled] = useState(initialPushEnabled);
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled);
  const [quietStart, setQuietStart] = useState(initialQuietStart);
  const [quietEnd, setQuietEnd] = useState(initialQuietEnd);
  const [maxPerDay, setMaxPerDay] = useState(initialMaxPerDay);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const save = async (patch: Record<string, boolean | number>) => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/parametres/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async (v: boolean) => {
    setPushEnabled(v);
    await save({ notif_push_enabled: v });
    if (v && isSupported && !isSubscribed) {
      setSubscribing(true);
      await subscribe();
      setSubscribing(false);
    } else if (!v && isSubscribed) {
      await unsubscribe();
    }
  };

  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Push */}
      <div className="card">
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--terra)", marginBottom: 12 }}>
          Push
        </p>

        {!isSupported && (
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", marginBottom: 12 }}>
            Les notifications push ne sont pas disponibles dans ce navigateur.
          </p>
        )}

        <Toggle
          checked={pushEnabled}
          onChange={handlePushToggle}
          label="Notifications push"
          sub={subscribing ? "Activation en cours…" : isSubscribed ? "Activées sur cet appareil" : "Non activées sur cet appareil"}
        />

        {pushEnabled && isSupported && !isSubscribed && (
          <button
            className="btn-primary"
            style={{ marginTop: 12, fontSize: 12 }}
            disabled={subscribing}
            onClick={async () => {
              setSubscribing(true);
              await subscribe();
              setSubscribing(false);
            }}
          >
            {subscribing ? "…" : "Activer sur cet appareil →"}
          </button>
        )}
      </div>

      {/* Email */}
      <div className="card">
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--terra)", marginBottom: 12 }}>
          Email
        </p>
        <Toggle
          checked={emailEnabled}
          onChange={v => { setEmailEnabled(v); save({ notif_email_enabled: v }); }}
          label="Rappels par email"
          sub="Si une attention reste en attente plus de 48h"
        />
      </div>

      {/* Horaires silencieux */}
      <div className="card">
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--terra)", marginBottom: 12 }}>
          Plage silencieuse
        </p>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", marginBottom: 16, lineHeight: 1.6 }}>
          Aucune notification push entre ces heures.
        </p>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 1, textTransform: "uppercase", color: "var(--cond)", marginBottom: 6 }}>De</p>
            <select
              value={quietStart}
              onChange={e => { const v = parseInt(e.target.value); setQuietStart(v); save({ notif_quiet_hours_start: v }); }}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 300, color: "var(--con)", background: "var(--bg)", border: "0.5px solid var(--brd)", borderRadius: 8, padding: "8px 12px" }}
            >
              {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 400, letterSpacing: 1, textTransform: "uppercase", color: "var(--cond)", marginBottom: 6 }}>À</p>
            <select
              value={quietEnd}
              onChange={e => { const v = parseInt(e.target.value); setQuietEnd(v); save({ notif_quiet_hours_end: v }); }}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 300, color: "var(--con)", background: "var(--bg)", border: "0.5px solid var(--brd)", borderRadius: 8, padding: "8px 12px" }}
            >
              {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Max par jour */}
      <div className="card">
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: "var(--terra)", marginBottom: 12 }}>
          Fréquence
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: 2 }}>Maximum par jour</p>
            <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)" }}>Notifications push uniquement</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => { const v = Math.max(0, maxPerDay - 1); setMaxPerDay(v); save({ notif_max_per_day: v }); }}
              style={{ width: 32, height: 32, borderRadius: "50%", border: "0.5px solid var(--brd)", background: "none", fontSize: 18, color: "var(--con)", cursor: "pointer" }}
            >
              −
            </button>
            <span style={{ fontSize: 16, fontWeight: 400, color: "var(--con)", minWidth: 20, textAlign: "center" }}>{maxPerDay}</span>
            <button
              type="button"
              onClick={() => { const v = Math.min(10, maxPerDay + 1); setMaxPerDay(v); save({ notif_max_per_day: v }); }}
              style={{ width: 32, height: 32, borderRadius: "50%", border: "0.5px solid var(--brd)", background: "none", fontSize: 18, color: "var(--con)", cursor: "pointer" }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {(saving || saved) && (
        <p style={{ fontSize: 11, fontWeight: 300, color: saving ? "var(--cond)" : "var(--terra)", textAlign: "center" }}>
          {saving ? "Enregistrement…" : "Enregistré."}
        </p>
      )}
    </div>
  );
}
