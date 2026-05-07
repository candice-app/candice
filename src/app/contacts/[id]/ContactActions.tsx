"use client";

import { useState, useRef, useEffect } from "react";
import ContactActionModal from "@/components/ContactActionModal";

interface Props {
  contactId: string;
  contactName: string;
}

export default function ContactActions({ contactId, contactName }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [action, setAction] = useState<"archive" | "delete" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

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
            borderRadius: "var(--r-sm)", overflow: "hidden", minWidth: 160,
          }}>
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
    </>
  );
}
