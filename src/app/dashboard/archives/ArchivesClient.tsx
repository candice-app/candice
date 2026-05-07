"use client";

import { useState } from "react";
import Link from "next/link";
import { Contact } from "@/types";

const RELATIONSHIP_LABEL: Record<string, string> = {
  partner: "Partenaire",
  friend: "Ami(e)",
  family: "Famille",
  colleague: "Collègue",
  other: "Autre",
};

const AVATAR_COLORS = [
  "linear-gradient(135deg,#C47A4A,#8A4020)",
  "linear-gradient(135deg,#4A7C59,#2A5C39)",
  "linear-gradient(135deg,#534AB7,#3C3489)",
  "linear-gradient(135deg,#9A3556,#72243E)",
  "linear-gradient(135deg,#BA7517,#854F0B)",
];

function getColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

interface Props {
  initialContacts: Contact[];
}

export default function ArchivesClient({ initialContacts }: Props) {
  const [contacts, setContacts] = useState(initialContacts);
  const [unarchiving, setUnarchiving] = useState<string | null>(null);

  const handleUnarchive = async (contactId: string) => {
    setUnarchiving(contactId);
    const res = await fetch("/api/contacts/unarchive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId }),
    });
    setUnarchiving(null);
    if (res.ok) setContacts((c) => c.filter((x) => x.id !== contactId));
  };

  if (contacts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "64px 24px", border: "0.5px dashed var(--br3)", borderRadius: "var(--r-lg)" }}>
        <p style={{ fontSize: 28, marginBottom: 14 }}>📦</p>
        <p style={{ fontSize: 14, fontWeight: 300, color: "var(--con)", marginBottom: 6 }}>
          Aucun contact archivé
        </p>
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)" }}>
          Les contacts archivés apparaissent ici.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {contacts.map((contact) => (
        <div key={contact.id} className="contact-row" style={{ opacity: 0.75 }}>
          <Link
            href={`/contacts/${contact.id}`}
            style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}
          >
            <div
              className="contact-avatar"
              style={{ background: getColor(contact.name) }}
            >
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="contact-name">{contact.name}</p>
              <p className="contact-meta">
                {RELATIONSHIP_LABEL[contact.relationship] ?? contact.relationship}
                {contact.archived_at && (
                  <span style={{ marginLeft: 8 }}>
                    · archivé le{" "}
                    {new Date(contact.archived_at).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                )}
              </p>
            </div>
          </Link>

          <button
            onClick={() => handleUnarchive(contact.id)}
            disabled={unarchiving === contact.id}
            className="btn-ghost"
            style={{ fontSize: 11, padding: "6px 12px", color: "var(--green)", borderColor: "var(--green3)" }}
          >
            {unarchiving === contact.id ? "…" : "Désarchiver"}
          </button>
        </div>
      ))}
    </div>
  );
}
