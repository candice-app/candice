"use client";

// B.2 Phase 6 — écran de choix du partage (côté Y, partageur).
// 3 options : tout · sections choisies (socle verrouillé, cases ≥44px) ·
// aveugle. + refuser. Aucun émoji, pastilles stroke SVG, DA V11.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { defaultCheckedKeys } from "@/lib/profile/share-sections";
import SectionPicker from "@/components/partage/SectionPicker";
import type { SectionKey } from "@/lib/profile/visibility";

type Mode = "all" | "sections" | "blind" | null;

const T = {
  pine: "#173E31", ink: "#16150E", ink2: "#5F5A51", ink3: "#ABA699",
  line: "rgba(23,62,49,.11)", line2: "rgba(23,62,49,.06)",
  shadow: "0 10px 30px rgba(23,62,49,.07)",
} as const;

const ICONS: Record<string, React.ReactNode> = {
  eye:    <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  list:   <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1.2" /><circle cx="4" cy="12" r="1.2" /><circle cx="4" cy="18" r="1.2" /></>,
  shield: <><path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z" /></>,
};

function Ic({ name, color }: { name: string; color: string }) {
  return (
    <span style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 34px", background: "#EAF1EC" }}>
      <svg viewBox="0 0 24 24" style={{ width: 19, height: 19, fill: "none", stroke: color, strokeWidth: 1.7 }}>{ICONS[name]}</svg>
    </span>
  );
}

export default function DemandeClient({
  consentId,
  requesterFirstName,
}: {
  consentId: string;
  requesterFirstName: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [checked, setChecked] = useState<Set<SectionKey>>(new Set(defaultCheckedKeys()));
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"shared" | "blind" | "rejected" | null>(null);
  const [error, setError] = useState("");

  const toggle = (keys: SectionKey[]) => {
    setChecked(prev => {
      const next = new Set(prev);
      const isOn = keys.every(k => next.has(k));
      for (const k of keys) { if (isOn) next.delete(k); else next.add(k); }
      return next;
    });
  };

  const respond = async (action: "all" | "sections" | "blind" | "reject") => {
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/profile-view/${consentId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        action === "sections" ? { action, sections: Array.from(checked) } : { action },
      ),
    }).catch(() => null);
    setSubmitting(false);
    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => ({})) as { error?: string } : {};
      setError(data.error ?? "Une erreur est survenue. Réessaie.");
      return;
    }
    setDone(action === "reject" ? "rejected" : action === "blind" ? "blind" : "shared");
    router.refresh();
  };

  if (done) {
    return (
      <div style={{ maxWidth: 400, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: T.ink, lineHeight: 1.4, marginBottom: 10 }}>
          {done === "rejected" ? "Demande refusée." : "C'est enregistré."}
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 300, color: T.ink2, lineHeight: 1.65 }}>
          {done === "rejected"
            ? `${requesterFirstName} ne verra rien de ta fiche.`
            : done === "blind"
              ? `${requesterFirstName} ne verra rien de ta fiche, mais Candice s'appuiera sur elle pour l'aider à te faire plaisir.`
              : `${requesterFirstName} voit maintenant ce que tu as choisi de partager — tu peux changer d'avis à tout moment.`}
        </p>
      </div>
    );
  }

  const optionCard = (selected: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "flex-start", gap: 12, width: "100%",
    background: "#fff", border: selected ? `1.5px solid ${T.pine}` : `1px solid ${T.line}`,
    borderRadius: 16, padding: "15px 16px", marginBottom: 10, boxShadow: T.shadow,
    cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)",
  });

  return (
    <div style={{ padding: "16px 20px 120px" }}>
      <h1 style={{
        fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 26,
        color: T.ink, letterSpacing: "-.018em", lineHeight: 1.25, margin: "12px 0 6px",
      } as React.CSSProperties}>
        {requesterFirstName} veut voir ton profil.
      </h1>
      <p style={{ fontSize: 14, fontWeight: 300, color: T.ink2, lineHeight: 1.6, marginBottom: 20 }}>
        Que partages-tu ?
      </p>

      {/* Option 1 — tout */}
      <button onClick={() => setMode("all")} style={optionCard(mode === "all")}>
        <Ic name="eye" color={T.pine} />
        <span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 3 }}>
            Toute ma fiche
          </span>
          <span style={{ display: "block", fontSize: 13, fontWeight: 300, color: T.ink2, lineHeight: 1.5 }}>
            {requesterFirstName} voit tout ce que ta fiche montre à un proche.
          </span>
        </span>
      </button>

      {/* Option 2 — sections choisies */}
      <button onClick={() => setMode("sections")} style={optionCard(mode === "sections")}>
        <Ic name="list" color={T.pine} />
        <span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 3 }}>
            Seulement certaines sections
          </span>
          <span style={{ display: "block", fontSize: 13, fontWeight: 300, color: T.ink2, lineHeight: 1.5 }}>
            Tu choisis section par section. L&apos;essentiel reste toujours inclus.
          </span>
        </span>
      </button>

      {/* Cases à cocher (mode sections) */}
      {mode === "sections" && (
        <>
          <SectionPicker checked={checked} onToggle={toggle} />
          {/* Zéro case cochée : état explicite, identique au lien sortant */}
          {checked.size === 0 && (
            <p style={{
              fontSize: 13, fontWeight: 500, color: T.pine, lineHeight: 1.5,
              background: "#EAF1EC", border: `1px solid ${T.line}`, borderRadius: 12,
              padding: "10px 14px", margin: "0 0 10px",
            }}>
              Partager l&apos;essentiel seulement
              <span style={{ fontWeight: 300, color: T.ink2 }}> — résumé, traits, langage d&apos;attention.</span>
            </p>
          )}
        </>
      )}

      {/* Option 3 — aveugle */}
      <button onClick={() => setMode("blind")} style={optionCard(mode === "blind")}>
        <Ic name="shield" color={T.pine} />
        <span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 3 }}>
            Rien de visible, mais Candice peut aider
          </span>
          <span style={{ display: "block", fontSize: 13, fontWeight: 300, color: T.ink2, lineHeight: 1.5 }}>
            {requesterFirstName} ne voit rien de ta fiche — Candice s&apos;en sert
            seulement pour l&apos;aider à te faire plaisir.
          </span>
        </span>
      </button>

      {error && (
        <p style={{ fontSize: 13, color: "#C44A4A", margin: "8px 0", lineHeight: 1.5 }}>{error}</p>
      )}

      {/* Valider */}
      <button
        onClick={() => mode && respond(mode)}
        disabled={!mode || submitting}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", height: 52, borderRadius: 15, marginTop: 14,
          background: mode ? T.pine : "rgba(23,62,49,.25)", color: "#fff",
          border: "none", fontWeight: 600, fontSize: 15,
          cursor: mode && !submitting ? "pointer" : "default",
          boxShadow: mode ? "0 6px 16px rgba(23,62,49,.18)" : "none",
          fontFamily: "var(--font-sans)",
        }}
      >
        {submitting ? "Enregistrement…" : "Partager comme ça"}
      </button>

      {/* Refuser */}
      <button
        onClick={() => respond("reject")}
        disabled={submitting}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", minHeight: 44, marginTop: 6, background: "none",
          border: "none", fontSize: 13, fontWeight: 400, color: T.ink3,
          cursor: "pointer", fontFamily: "var(--font-sans)",
        }}
      >
        Refuser la demande
      </button>
    </div>
  );
}
