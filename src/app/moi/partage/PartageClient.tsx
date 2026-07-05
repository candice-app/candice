"use client";

// B.2 Phase 7 — génération du lien sortant : choix AVANT envoi
// (toute ma fiche · sections choisies · aveugle), puis lien copiable.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { defaultCheckedKeys } from "@/lib/profile/share-sections";
import SectionPicker from "@/components/partage/SectionPicker";
import type { SectionKey } from "@/lib/profile/visibility";

type Mode = "all" | "sections" | "blind" | null;

const T = {
  pine: "#173E31", ink: "#16150E", ink2: "#5F5A51", ink3: "#ABA699",
  line: "rgba(23,62,49,.11)",
  shadow: "0 10px 30px rgba(23,62,49,.07)",
} as const;

const ICONS: Record<string, React.ReactNode> = {
  eye:    <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  list:   <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1.2" /><circle cx="4" cy="12" r="1.2" /><circle cx="4" cy="18" r="1.2" /></>,
  shield: <><path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z" /></>,
  link:   <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>,
};

function Ic({ name }: { name: string }) {
  return (
    <span style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 34px", background: "#EAF1EC" }}>
      <svg viewBox="0 0 24 24" style={{ width: 19, height: 19, fill: "none", stroke: T.pine, strokeWidth: 1.7 }}>{ICONS[name]}</svg>
    </span>
  );
}

export default function PartageClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [checked, setChecked] = useState<Set<SectionKey>>(new Set(defaultCheckedKeys()));
  const [creating, setCreating] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const toggle = (keys: SectionKey[]) => {
    setChecked(prev => {
      const next = new Set(prev);
      const isOn = keys.every(k => next.has(k));
      for (const k of keys) { if (isOn) next.delete(k); else next.add(k); }
      return next;
    });
  };

  const create = async () => {
    if (!mode) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/share-link/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "sections" ? { mode, sections: Array.from(checked) } : { mode },
      ),
    }).catch(() => null);
    setCreating(false);
    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => ({})) as { error?: string } : {};
      setError(data.error ?? "Une erreur est survenue. Réessaie.");
      return;
    }
    const data = await res.json() as { url: string };
    setUrl(data.url);
    router.refresh();
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sélection manuelle possible : le lien est affiché en clair
    }
  };

  const optionCard = (selected: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "flex-start", gap: 12, width: "100%",
    background: "#fff", border: selected ? `1.5px solid ${T.pine}` : `1px solid ${T.line}`,
    borderRadius: 16, padding: "15px 16px", marginBottom: 10, boxShadow: T.shadow,
    cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)",
  });

  if (url) {
    return (
      <div style={{
        background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16,
        padding: "18px 16px", boxShadow: T.shadow,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Ic name="link" />
          <p style={{ fontSize: 14.5, fontWeight: 600, color: T.ink }}>Ton lien est prêt.</p>
        </div>
        <p style={{ fontSize: 13, fontWeight: 300, color: T.ink2, lineHeight: 1.6, marginBottom: 12 }}>
          Envoie-le à la personne de ton choix. Il ne fonctionne qu&apos;une fois —
          la première personne connectée qui l&apos;ouvre y accède — et expire dans 30 jours.
        </p>
        <p style={{
          fontSize: 12.5, fontWeight: 300, color: T.ink2, lineHeight: 1.5,
          background: "#FBFBF7", border: `1px solid ${T.line}`, borderRadius: 10,
          padding: "10px 12px", marginBottom: 12, wordBreak: "break-all",
        }}>
          {url}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={copy}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minHeight: 44, padding: "0 18px", background: T.pine, color: "#fff",
              border: "none", borderRadius: 999, fontSize: 13.5, fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--font-sans)",
            }}
          >
            {copied ? "Copié" : "Copier le lien"}
          </button>
          <button
            onClick={() => { setUrl(null); setMode(null); }}
            style={{
              display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 12px",
              background: "none", border: "none", fontSize: 13, fontWeight: 400,
              color: T.ink3, cursor: "pointer", fontFamily: "var(--font-sans)",
            }}
          >
            Créer un autre lien
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Option 1 — tout */}
      <button onClick={() => setMode("all")} style={optionCard(mode === "all")}>
        <Ic name="eye" />
        <span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 3 }}>
            Toute ma fiche
          </span>
          <span style={{ display: "block", fontSize: 13, fontWeight: 300, color: T.ink2, lineHeight: 1.5 }}>
            La personne voit tout ce que ta fiche montre à un proche.
          </span>
        </span>
      </button>

      {/* Option 2 — sections choisies */}
      <button onClick={() => setMode("sections")} style={optionCard(mode === "sections")}>
        <Ic name="list" />
        <span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 3 }}>
            Seulement certaines sections
          </span>
          <span style={{ display: "block", fontSize: 13, fontWeight: 300, color: T.ink2, lineHeight: 1.5 }}>
            Tu choisis section par section. L&apos;essentiel reste toujours inclus.
          </span>
        </span>
      </button>

      {mode === "sections" && <SectionPicker checked={checked} onToggle={toggle} />}

      {/* Option 3 — aveugle */}
      <button onClick={() => setMode("blind")} style={optionCard(mode === "blind")}>
        <Ic name="shield" />
        <span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 3 }}>
            Rien de visible, mais Candice peut aider
          </span>
          <span style={{ display: "block", fontSize: 13, fontWeight: 300, color: T.ink2, lineHeight: 1.5 }}>
            La personne ne voit rien de ta fiche — Candice s&apos;en sert seulement
            pour l&apos;aider à te faire plaisir.
          </span>
        </span>
      </button>

      {error && (
        <p style={{ fontSize: 13, color: "#C44A4A", margin: "8px 0", lineHeight: 1.5 }}>{error}</p>
      )}

      <button
        onClick={create}
        disabled={!mode || creating}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", height: 52, borderRadius: 15, marginTop: 14,
          background: mode ? T.pine : "rgba(23,62,49,.25)", color: "#fff",
          border: "none", fontWeight: 600, fontSize: 15,
          cursor: mode && !creating ? "pointer" : "default",
          boxShadow: mode ? "0 6px 16px rgba(23,62,49,.18)" : "none",
          fontFamily: "var(--font-sans)",
        }}
      >
        {creating ? "Création…" : "Générer mon lien"}
      </button>
    </div>
  );
}
