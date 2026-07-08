"use client";

// Point 12 STOP C — espace sensible Art.9 : sheet d'édition RÉELLE, ton
// léger. 3 blocs optionnels (« Rien à signaler » par défaut), Effacer par
// bloc = effacement IMMÉDIAT et total en base. La saisie volontaire vaut
// consentement par l'acte. Ces données restent hors de tout partage.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { T2 } from "./ui";
import { Sheet } from "./Sheet";

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", minHeight: 76, padding: "12px 14px",
  fontSize: 15, fontWeight: 300, background: "#fff",
  border: "1px solid rgba(23,62,49,.2)", borderRadius: 12, color: T2.ink,
  outline: "none", fontFamily: "var(--font-sans)", resize: "vertical", lineHeight: 1.5,
};

const BLOCKS = [
  { field: "health_comfort" as const, title: "Santé", question: "Quelque chose que Candice devrait savoir ?" },
  { field: "disability" as const, title: "Handicap / accessibilité", question: "Une contrainte à prendre en compte ?" },
  { field: "religion" as const, title: "Religion / convictions", question: "Utile pour les fêtes, les repas, les cadeaux." },
];

export default function Art9Editor({
  open,
  onClose,
  initial,
  mobiliteRenseignee,
}: {
  open: boolean;
  onClose: () => void;
  initial: { religion: string; disability: string; health_comfort: string };
  mobiliteRenseignee: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const post = async (patch: Record<string, string | null>) => {
    const res = await fetch("/api/profile/art9", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    return !!res?.ok;
  };

  const save = async () => {
    setSaving(true);
    setError("");
    const ok = await post({
      religion: values.religion || null,
      disability: values.disability || null,
      health_comfort: values.health_comfort || null,
    });
    setSaving(false);
    if (!ok) { setError("Une erreur est survenue. Réessaie."); return; }
    onClose();
    router.refresh();
  };

  // Effacement IMMÉDIAT et total du bloc en base
  const clear = async (field: keyof typeof values) => {
    setValues(v => ({ ...v, [field]: "" }));
    const ok = await post({ [field]: null });
    if (ok) router.refresh();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Santé · handicap · religion">
      <p style={{ fontSize: 13.5, color: T2.ink2, lineHeight: 1.55, marginBottom: 16 }}>
        À toi de voir ce que tu renseignes — ça reste entre Candice et toi.
      </p>

      {BLOCKS.map(b => (
        <div key={b.field} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: T2.ink }}>
              {b.title}
              <span style={{ fontWeight: 300, color: T2.ink3, fontSize: 12.5 }}> — {b.question}</span>
            </p>
            {values[b.field] && (
              <button
                onClick={() => clear(b.field)}
                style={{
                  fontSize: 12, color: "#E05252", background: "none", border: "none",
                  cursor: "pointer", fontFamily: "var(--font-sans)", minHeight: 32, flexShrink: 0,
                }}
              >
                Effacer
              </button>
            )}
          </div>
          <textarea
            value={values[b.field]}
            onChange={e => setValues(v => ({ ...v, [b.field]: e.target.value }))}
            placeholder="Rien à signaler"
            rows={2}
            style={inputStyle}
          />
          {b.field === "disability" && mobiliteRenseignee && (
            <p style={{ fontSize: 11.5, color: T2.ink3, lineHeight: 1.5, marginTop: 5 }}>
              Ta mobilité et ton confort sont déjà notés dans Infos pratiques —
              ici, uniquement ce qui va au-delà.
            </p>
          )}
        </div>
      ))}

      {error && <p style={{ fontSize: 13, color: "#C44A4A", marginBottom: 10 }}>{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        style={{
          width: "100%", minHeight: 50, borderRadius: 6,
          background: T2.pine, color: "#fff", border: "none",
          fontSize: 14.5, fontWeight: 600, cursor: saving ? "default" : "pointer",
          opacity: saving ? 0.6 : 1, fontFamily: "var(--font-sans)",
          boxShadow: "0 6px 16px rgba(23,62,49,.18)",
        }}
      >
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
      <p style={{ fontSize: 11.5, color: T2.ink3, lineHeight: 1.5, marginTop: 10, textAlign: "center" }}>
        Toujours privé — jamais partagé, jamais visible par tes proches.
      </p>
    </Sheet>
  );
}
