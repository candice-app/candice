"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { WishlistItem } from "@/types";

interface Props {
  contactId: string;
  initialWishlist: WishlistItem[];
}

export default function WishlistSection({ contactId, initialWishlist }: Props) {
  const supabase = createClient();
  const [items, setItems] = useState<WishlistItem[]>(initialWishlist);
  const [newTitle, setNewTitle] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (updated: WishlistItem[]) => {
    setSaving(true);
    await supabase.from("contacts").update({ gift_wishlist: updated }).eq("id", contactId);
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    const item: WishlistItem = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      note: newNote.trim() || undefined,
      url: newUrl.trim() || undefined,
      addedAt: new Date().toISOString(),
    };
    const updated = [...items, item];
    setItems(updated);
    await save(updated);
    setNewTitle("");
    setNewNote("");
    setNewUrl("");
    setShowForm(false);
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    await save(updated);
  };

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 400, color: "var(--con)" }}>Liste de souhaits</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ fontSize: 11, fontWeight: 400, color: "var(--terra)", background: "none", border: "none", cursor: "pointer" }}
        >
          {showForm ? "Annuler" : "+ Ajouter"}
        </button>
      </div>

      {showForm && (
        <div style={{
          border: "0.5px solid var(--brd)", borderRadius: "var(--r-sm)",
          padding: "14px 16px", marginBottom: 16,
          display: "flex", flexDirection: "column", gap: 10,
          background: "var(--br2)",
        }}>
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Idée de cadeau…"
            style={{ fontSize: 13, padding: "8px 10px", border: "0.5px solid var(--brd)", borderRadius: 6, background: "#fff", color: "var(--con)", outline: "none", fontFamily: "inherit" }}
          />
          <input
            type="text"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Note (taille, couleur, marque…)"
            style={{ fontSize: 12, padding: "8px 10px", border: "0.5px solid var(--brd)", borderRadius: 6, background: "#fff", color: "var(--con)", outline: "none", fontFamily: "inherit" }}
          />
          <input
            type="url"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="Lien (facultatif)"
            style={{ fontSize: 12, padding: "8px 10px", border: "0.5px solid var(--brd)", borderRadius: 6, background: "#fff", color: "var(--con)", outline: "none", fontFamily: "inherit" }}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newTitle.trim()}
            className="btn-primary"
            style={{ fontSize: 12, padding: "8px 14px", alignSelf: "flex-end" }}
          >
            {adding ? "Ajout…" : "Ajouter →"}
          </button>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", textAlign: "center", padding: "20px 0" }}>
          Aucune idée pour l&apos;instant. Ajoutez vos premières idées cadeaux.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(item => (
          <div key={item.id} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "10px 12px", border: "0.5px solid var(--brd)",
            borderRadius: "var(--r-sm)", background: "var(--br2)",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 400, color: "var(--con)", marginBottom: item.note || item.url ? 4 : 0 }}>
                {item.title}
              </p>
              {item.note && (
                <p style={{ fontSize: 11, fontWeight: 300, color: "var(--cond)" }}>{item.note}</p>
              )}
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "var(--terra)", textDecoration: "underline" }}>
                  Voir le lien →
                </a>
              )}
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              disabled={saving}
              style={{ fontSize: 14, color: "var(--conf)", background: "none", border: "none", cursor: "pointer", flexShrink: 0, lineHeight: 1, padding: 4 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
