"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// L'ENTRÉE LARGE (décision D13) — quand aucune question n'attend la personne.
//
// Trois gestes, tous facultatifs : choisir un sujet (la porte « Explorer un sujet », plus bas),
// raconter quelque chose avec ses mots, ou passer. L'écran ne dit jamais qu'elle n'a pas
// d'intérêts, et ne la laisse pas devant un parcours vide. Choisir n'écrit aucune préférence ;
// passer n'écrit rien ; raconter garde son texte, puis le fait lire — et dit si la lecture a échoué.

export interface TextesEntree { titre: string; texte: string; choisir: string; raconter: string; invite: string; passer: string }

export default function DiscoveryEntree({ textes, sujetsDisponibles = true }: { textes: TextesEntree; sujetsDisponibles?: boolean }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [recit, setRecit] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [aRelire, setARelire] = useState<string | null>(null);

  async function envoyer(corps: { texte: string } | { recitId: string }) {
    if (occupe) return;
    setOccupe(true); setMessage(null);
    try {
      const r = await fetch("/api/discovery/recit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
      const j = (await r.json().catch(() => null)) as { recitId?: string; lecture?: string; error?: string } | null;
      if (!r.ok || !j) { setMessage(j?.error ?? "Ton texte n’a pas pu être enregistré. Rien n’a été modifié."); return; }
      if (j.lecture === "echec") {
        setARelire(j.recitId ?? null);
        setMessage("Ton texte est enregistré, mais sa lecture n’a pas abouti. Tu peux la relancer.");
        return;
      }
      setARelire(null); setRecit(""); setOuvert(false);
      setMessage("Merci. Ton texte est enregistré et lu.");
      router.refresh();
    } catch {
      setMessage("Connexion interrompue. Rien n’a été modifié.");
    } finally { setOccupe(false); }
  }

  const bouton: React.CSSProperties = { padding: "13px 18px", borderRadius: 12, fontSize: 14, fontWeight: 400, cursor: "pointer", minHeight: 44 };
  return (
    <section aria-labelledby="entree-large" style={{ paddingTop: 48, paddingBottom: 8 }}>
      <h1 id="entree-large" style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 26, color: "var(--ink)", letterSpacing: "-.016em", marginBottom: 12 }}>
        {textes.titre}
      </h1>
      <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.7, marginBottom: 20 }}>{textes.texte}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {sujetsDisponibles && <a href="#portes-sujets" style={{ ...bouton, textDecoration: "none", border: "none", background: "var(--pine)", color: "var(--canvas)", display: "inline-flex", alignItems: "center" }}>{textes.choisir}</a>}
        <button type="button" aria-expanded={ouvert} onClick={() => setOuvert((o) => !o)} style={{ ...bouton, border: "0.5px solid rgba(23,62,49,.25)", background: "var(--white)", color: "var(--pine)" }}>{textes.raconter}</button>
        <Link href="/moi" style={{ ...bouton, textDecoration: "underline", color: "var(--ink-2)", display: "inline-flex", alignItems: "center", fontWeight: 300 }}>{textes.passer}</Link>
      </div>
      {ouvert && (
        <form onSubmit={(e) => { e.preventDefault(); if (recit.trim()) void envoyer({ texte: recit }); }}>
          <label htmlFor="entree-recit" style={{ display: "block", fontSize: 13, color: "var(--ink-2)", marginBottom: 6 }}>{textes.invite}</label>
          <textarea id="entree-recit" value={recit} onChange={(e) => setRecit(e.target.value)} maxLength={2000} rows={5}
            style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "0.5px solid rgba(23,62,49,.25)", background: "var(--canvas)", fontSize: 14, color: "var(--ink)", marginBottom: 10 }} />
          <button type="submit" disabled={occupe || !recit.trim()} style={{ ...bouton, border: "none", background: "var(--pine)", color: "var(--canvas)" }}>
            {occupe ? "Enregistrement…" : "Envoyer"}
          </button>
        </form>
      )}
      {message && (
        <p role="status" style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", marginTop: 14 }}>
          {message}{" "}
          {aRelire && (
            <button type="button" disabled={occupe} onClick={() => void envoyer({ recitId: aRelire })}
              style={{ background: "none", border: "none", padding: 0, fontSize: 14, color: "var(--pine)", textDecoration: "underline", cursor: "pointer" }}>
              Relancer la lecture
            </button>
          )}
        </p>
      )}
    </section>
  );
}
