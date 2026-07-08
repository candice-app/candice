"use client";

// Point 13 — wishlist V1 : ajout rapide en haut, modification, suppression.
// CRUD direct client (RLS users_own_wishlist). DA Candice, jamais d'émoji.

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export interface WishlistItemV1 {
  id: string;
  title: string;
  url: string | null;
  note: string | null;
  created_at: string;
}

const T = {
  pine: "#173E31", ink: "#16150E", ink2: "#5F5A51", ink3: "#ABA699",
  line: "rgba(23,62,49,.11)", shadow: "0 10px 30px rgba(23,62,49,.07)",
} as const;

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", minHeight: 48, padding: "0 14px",
  fontSize: 15, fontWeight: 300, background: "#fff",
  border: "1px solid rgba(23,62,49,.2)", borderRadius: 12, color: T.ink,
  outline: "none", fontFamily: "var(--font-sans)",
};

export default function WishlistClient({
  userId,
  initialItems,
}: {
  userId: string;
  initialItems: WishlistItemV1[];
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ title: string; url: string; note: string }>({ title: "", url: "", note: "" });

  const add = async () => {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("my_wishlist_items")
      .insert({ user_id: userId, title: t })
      .select("id, title, url, note, created_at")
      .single();
    setBusy(false);
    if (!error && data) {
      setItems(prev => [data as WishlistItemV1, ...prev]);
      setTitle("");
    }
  };

  const startEdit = (it: WishlistItemV1) => {
    setEditing(it.id);
    setDraft({ title: it.title, url: it.url ?? "", note: it.note ?? "" });
  };

  const saveEdit = async (id: string) => {
    const t = draft.title.trim();
    if (!t || busy) return;
    setBusy(true);
    const patch = { title: t, url: draft.url.trim() || null, note: draft.note.trim() || null };
    const { error } = await supabase.from("my_wishlist_items").update(patch).eq("id", id);
    setBusy(false);
    if (!error) {
      setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
      setEditing(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    const { error } = await supabase.from("my_wishlist_items").delete().eq("id", id);
    setBusy(false);
    if (!error) setItems(prev => prev.filter(it => it.id !== id));
  };

  return (
    <div>
      {/* Ajout rapide */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") add(); }}
          placeholder="Une envie (ex. un plaid en lin lavé)"
          style={{ ...inputStyle, flex: 1, minWidth: 0 }}
        />
        <button
          onClick={add}
          disabled={!title.trim() || busy}
          style={{
            minHeight: 48, padding: "0 18px", borderRadius: 12,
            background: T.pine, color: "#fff", border: "none",
            fontSize: 14, fontWeight: 600, fontFamily: "var(--font-sans)",
            cursor: title.trim() && !busy ? "pointer" : "default",
            opacity: title.trim() ? 1 : 0.5, flexShrink: 0,
          }}
        >
          Ajouter
        </button>
      </div>

      {/* État vide */}
      {items.length === 0 && (
        <p style={{
          fontSize: 13.5, fontWeight: 300, color: T.ink3, lineHeight: 1.65,
          textAlign: "center", padding: "40px 20px", maxWidth: 300, margin: "0 auto",
        }}>
          Dépose ici tes envies — tes proches pourront viser juste, sans jamais
          te demander.
        </p>
      )}

      {/* Liste */}
      {items.map(it => (
        <div key={it.id} style={{
          background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16,
          boxShadow: T.shadow, padding: "14px 16px", marginBottom: 10,
        }}>
          {editing === it.id ? (
            <>
              <input
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                placeholder="Intitulé"
                style={{ ...inputStyle, marginBottom: 8 }}
              />
              <input
                value={draft.url}
                onChange={e => setDraft(d => ({ ...d, url: e.target.value }))}
                placeholder="Lien (optionnel)"
                inputMode="url"
                style={{ ...inputStyle, marginBottom: 8 }}
              />
              <input
                value={draft.note}
                onChange={e => setDraft(d => ({ ...d, note: e.target.value }))}
                placeholder="Note (taille, couleur, contexte…)"
                style={{ ...inputStyle, marginBottom: 10 }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => saveEdit(it.id)}
                  disabled={busy || !draft.title.trim()}
                  style={{
                    minHeight: 44, padding: "0 16px", borderRadius: 999,
                    background: T.pine, color: "#fff", border: "none",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditing(null)}
                  style={{
                    minHeight: 44, padding: "0 10px", background: "none", border: "none",
                    fontSize: 13, color: T.ink3, cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => remove(it.id)}
                  disabled={busy}
                  style={{
                    minHeight: 44, padding: "0 10px", background: "none", border: "none",
                    fontSize: 12.5, color: "#E05252", cursor: "pointer",
                    fontFamily: "var(--font-sans)", marginLeft: "auto",
                  }}
                >
                  Supprimer
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => startEdit(it)}
              style={{
                display: "block", width: "100%", textAlign: "left", background: "none",
                border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-sans)",
              }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 550, color: T.ink }}>{it.title}</span>
              {it.note && (
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 300, color: T.ink2, marginTop: 3, lineHeight: 1.5 }}>
                  {it.note}
                </span>
              )}
              {it.url && (
                <span style={{ display: "block", fontSize: 11.5, color: T.ink3, marginTop: 3, wordBreak: "break-all" }}>
                  {it.url}
                </span>
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
