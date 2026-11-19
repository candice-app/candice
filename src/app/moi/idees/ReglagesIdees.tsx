"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Un interrupteur par personne. L'état affiché est celui que la BASE a rendu : après un clic, on
// attend la réponse du serveur (pas d'affichage optimiste) — on ne laisse jamais croire qu'un
// accord est donné, ou retiré, quand il ne l'est pas.
export interface Pilote { contactId: string; prenom: string; gouts: boolean }

export default function ReglagesIdees({ pilotes }: { pilotes: Pilote[] }) {
  const router = useRouter();
  const [etat, setEtat] = useState(pilotes);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function basculer(p: Pilote) {
    if (occupe) return;
    setOccupe(p.contactId); setErreur(null);
    try {
      const r = await fetch("/api/consent/exclusions", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ contactId: p.contactId, action: p.gouts ? "retirer" : "autoriser", portee: "reco:gouts" }),
      });
      const j = (await r.json().catch(() => null)) as { actif?: boolean; error?: string } | null;
      if (!r.ok || typeof j?.actif !== "boolean") { setErreur(j?.error ? `Réglage non enregistré : ${j.error}.` : "Réglage non enregistré. Rien n’a changé."); return; }
      setEtat((xs) => xs.map((x) => (x.contactId === p.contactId ? { ...x, gouts: j.actif as boolean } : x)));
      router.refresh();
    } catch {
      setErreur("Connexion interrompue. Rien n’a changé.");
    } finally { setOccupe(null); }
  }

  if (etat.length === 0) {
    return <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)" }}>Personne ne t’a encore relié(e) à sa fiche. Quand ce sera le cas, tu pourras régler ici ce qui peut inspirer ses idées.</p>;
  }
  return (
    <div>
      {erreur && <p role="alert" style={{ fontSize: 14, color: "#8a2c1d", marginBottom: 12 }}>{erreur}</p>}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {etat.map((p) => (
          <li key={p.contactId} style={{ padding: "16px 0", borderTop: "0.5px solid rgba(23,62,49,.12)" }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 44, cursor: occupe ? "default" : "pointer" }}>
              <span style={{ fontSize: 14, fontWeight: 300, color: "var(--ink)", lineHeight: 1.6 }}>
                Mes goûts et mes envies peuvent inspirer les idées de <strong style={{ fontWeight: 400 }}>{p.prenom || "cette personne"}</strong>
              </span>
              <input type="checkbox" role="switch" aria-checked={p.gouts} checked={p.gouts} disabled={occupe !== null} onChange={() => void basculer(p)}
                style={{ width: 22, height: 22, flexShrink: 0 }} />
            </label>
            {occupe === p.contactId && <p role="status" style={{ fontSize: 13, color: "var(--ink-3)", margin: "4px 0 0" }}>Enregistrement…</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
