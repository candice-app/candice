"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Le parcours PROPOSE d'ajouter une envie au Carnet ; il ne l'y met jamais de lui-même.
export default function DiscoveryEnvie({ envie }: { envie: { id: string; titre: string } | null }) {
  const router = useRouter();
  const [occupe, setOccupe] = useState(false); const [erreur, setErreur] = useState<string | null>(null);
  if (!envie) return null;
  const repondre = async (ajouter: boolean) => {
    setOccupe(true); setErreur(null);
    try {
      const r = await fetch("/api/discovery/envie", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ envie: envie.id, ajouter }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(typeof j.error === "string" ? j.error : "Cela n’a pas pu être enregistré."); }
      router.refresh();
    } catch (e) { setErreur(e instanceof Error ? e.message : "Cela n’a pas pu être enregistré."); }
    finally { setOccupe(false); }
  };
  const bouton = { minHeight: 44, padding: "0 16px", borderRadius: 999, border: "1px solid var(--pine)", background: "none", color: "var(--pine)", fontSize: 14, fontWeight: 300, cursor: "pointer" } as const;
  return (
    <section aria-label="Ajouter au Carnet d’envies" style={{ marginTop: 32 }}>
      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)", margin: "0 0 4px" }}>Tu as dit avoir envie de « {envie.titre} ».</p>
      <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-soft, #666)", margin: "0 0 12px" }}>Veux-tu l’ajouter à ton Carnet d’envies ? Tes proches pourront alors la voir.</p>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" disabled={occupe} style={bouton} onClick={() => repondre(true)}>Ajouter au Carnet</button>
        <button type="button" disabled={occupe} onClick={() => repondre(false)} style={{ minHeight: 44, padding: "0 8px", background: "none", border: "none", fontSize: 13, fontWeight: 300, color: "var(--ink-soft, #666)", textDecoration: "underline", cursor: "pointer" }}>Non merci</button>
      </div>
      {erreur && <p role="alert" style={{ fontSize: 13, fontWeight: 300, color: "var(--ink)", marginTop: 8 }}>{erreur}</p>}
    </section>
  );
}
