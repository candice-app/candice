"use client";

import { useState, useRef, useEffect } from "react";
import ContactActionModal from "@/components/ContactActionModal";
import { createClient } from "@/utils/supabase/client";

interface Props {
  contactId: string;
  contactName: string;
  contactEmail: string | null;
  contactFirstName: string;
  completionPct: number;
  lastReminderSentAt: string | null;
  senderFirstName: string;
}

function isWithin24h(sentAt: string | null): boolean {
  if (!sentAt) return false;
  return Date.now() - new Date(sentAt).getTime() < 24 * 60 * 60 * 1000;
}

export default function ContactActions({
  contactId,
  contactName,
  contactEmail,
  contactFirstName,
  completionPct,
  lastReminderSentAt,
  senderFirstName,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [action, setAction] = useState<"archive" | "delete" | null>(null);
  const [reminderSentAt, setReminderSentAt] = useState<string | null>(lastReminderSentAt ?? null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const showReminderButton = !!(contactEmail) && completionPct < 60;
  const reminderDisabled = isWithin24h(reminderSentAt) || reminderLoading;

  const handleReminder = async () => {
    if (!contactEmail || reminderDisabled) return;
    setReminderLoading(true);
    setMenuOpen(false);
    try {
      const res = await fetch("/api/emails/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactEmail,
          contactFirstName,
          senderFirstName,
          profileUrl: `${window.location.origin}/profil/${contactId}`,
        }),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        setReminderSentAt(now);
        setToast(`Relance envoyée à ${contactFirstName}`);
        setTimeout(() => setToast(null), 3500);
        const supabase = createClient();
        supabase
          .from("contacts")
          .update({ last_reminder_sent_at: now })
          .eq("id", contactId)
          .then(() => {});
      }
    } catch { /* ignore */ } finally {
      setReminderLoading(false);
    }
  };

  return (
    <>
      <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Actions"
          style={{
            width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "0.5px solid var(--brd)", borderRadius: "var(--r-sm)",
            background: "none", cursor: "pointer",
            fontSize: 16, color: "var(--cond)",
            letterSpacing: 1,
          }}
        >
          ···
        </button>

        {menuOpen && (
          <div style={{
            position: "absolute", right: 0, top: 42, zIndex: 20,
            background: "var(--br2)", border: "0.5px solid var(--brd)",
            borderRadius: "var(--r-sm)", overflow: "hidden", minWidth: 180,
          }}>
            {showReminderButton && (
              <>
                <button
                  onClick={handleReminder}
                  disabled={reminderDisabled}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px", fontSize: 13, fontWeight: 300,
                    color: reminderDisabled ? "var(--txts)" : "var(--con)",
                    background: "none", border: "none",
                    cursor: reminderDisabled ? "default" : "pointer", textAlign: "left",
                    opacity: reminderDisabled ? 0.5 : 1,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  {reminderLoading ? "Envoi…" : reminderDisabled ? "Relance envoyée" : "Relancer ce proche"}
                </button>
                <div style={{ borderTop: "0.5px solid var(--brd)" }} />
              </>
            )}
            <button
              onClick={() => { setAction("archive"); setMenuOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", fontSize: 13, fontWeight: 300,
                color: "var(--green)", background: "none", border: "none",
                cursor: "pointer", textAlign: "left",
              }}
            >
              Archiver
            </button>
            <div style={{ borderTop: "0.5px solid var(--brd)" }} />
            <button
              onClick={() => { setAction("delete"); setMenuOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", fontSize: 13, fontWeight: 300,
                color: "#E05252", background: "none", border: "none",
                cursor: "pointer", textAlign: "left",
              }}
            >
              Supprimer
            </button>
          </div>
        )}
      </div>

      {action && (
        <ContactActionModal
          type={action}
          contactId={contactId}
          contactName={contactName}
          onClose={() => setAction(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            zIndex: 200,
            background: "#2C1A0E", color: "#FAF7F2",
            fontSize: 13, fontWeight: 300,
            padding: "10px 20px", borderRadius: 8,
            boxShadow: "0 4px 16px rgba(30,18,8,0.18)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
