"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// « DE QUOI PARLES-TU EXACTEMENT ? »
//
// Une réponse libre a nommé une œuvre, un épisode, un lieu ou un animal sans l'identifier.
// Candice n'a rien retenu : elle demande. La personne choisit parmi ce que le serveur propose,
// précise elle-même, ou laisse tomber — et dans ce dernier cas rien n'est écrit.
export interface ClarificationAffichee {
  id: string; enonce: string; nature: "oeuvre" | "episode" | "lieu" | "animal";
  passage: string; raison: string; choix: { id: string; libelle: string }[]; saisieLibre: boolean;
}
const CHAMPS: Record<ClarificationAffichee["nature"], { nom: string; rattachement: string; requis: boolean }> = {
  oeuvre: { nom: "Titre", rattachement: "Auteur (facultatif)", requis: false },
  episode: { nom: "Titre ou numéro de l’épisode", rattachement: "Nom du podcast", requis: true },
  lieu: { nom: "Nom du lieu", rattachement: "Ville ou région (facultatif)", requis: false },
  animal: { nom: "Son nom", rattachement: "Son espèce (chien, chat…)", requis: true },
};
const champ = { width: "100%", minHeight: 44, padding: "0 12px", border: "1px solid var(--line, #ddd)", borderRadius: 10, fontSize: 15, fontWeight: 300, background: "transparent", color: "var(--ink)" } as const;
const bouton = { minHeight: 44, padding: "0 16px", borderRadius: 999, border: "1px solid var(--pine)", background: "none", color: "var(--pine)", fontSize: 14, fontWeight: 300, cursor: "pointer" } as const;

function Une({ c }: { c: ClarificationAffichee }) {
  const router = useRouter();
  const [nom, setNom] = useState(""); const [rattachement, setRattachement] = useState("");
  const [occupe, setOccupe] = useState(false); const [erreur, setErreur] = useState<string | null>(null);
  const poster = async (url: string, corps: unknown) => {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Cela n’a pas pu être enregistré.");
    return j as { etat?: string; petId?: string };
  };
  const agir = async (f: () => Promise<{ etat?: string }>) => {
    setOccupe(true); setErreur(null);
    try {
      const r = await f();
      if (r.etat === "encore_ambigue") setErreur("Il me manque encore de quoi savoir exactement de quoi tu parles.");
      else router.refresh();
    } catch (e) { setErreur(e instanceof Error ? e.message : "Cela n’a pas pu être enregistré."); }
    finally { setOccupe(false); }
  };
  const preciser = () => agir(async () => {
    if (c.nature === "animal") {
      const a = await poster("/api/discovery/animal", { nom, espece: rattachement });
      return poster("/api/discovery/clarification", { id: c.id, choix: a.petId });
    }
    return poster("/api/discovery/clarification", { id: c.id, nom, ...(rattachement.trim() ? { rattachement } : {}) });
  });
  const l = CHAMPS[c.nature];
  const pret = nom.trim().length > 0 && (!l.requis || rattachement.trim().length > 0);
  return (
    <li style={{ padding: "16px 0", borderTop: "1px solid var(--line, #eee)" }}>
      <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-soft, #666)", margin: "0 0 4px" }}>{c.enonce}</p>
      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink)", margin: "0 0 4px" }}>Tu as écrit « {c.passage} ».</p>
      <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink)", margin: "0 0 12px" }}>{c.raison}</p>
      {c.choix.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {c.choix.map((x) => (
            <button key={x.id} type="button" disabled={occupe} style={bouton} onClick={() => agir(() => poster("/api/discovery/clarification", { id: c.id, choix: x.id }))}>{x.libelle}</button>
          ))}
        </div>
      )}
      {(c.saisieLibre || c.nature === "animal") && (
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          <input aria-label={l.nom} placeholder={l.nom} value={nom} onChange={(e) => setNom(e.target.value)} style={champ} maxLength={200} />
          <input aria-label={l.rattachement} placeholder={l.rattachement} value={rattachement} onChange={(e) => setRattachement(e.target.value)} style={champ} maxLength={200} />
          <button type="button" disabled={occupe || !pret} style={{ ...bouton, opacity: pret ? 1 : 0.5, justifySelf: "start" }} onClick={preciser}>Préciser</button>
        </div>
      )}
      <button type="button" disabled={occupe} onClick={() => agir(() => poster("/api/discovery/clarification", { id: c.id, aucun: true }))}
        style={{ minHeight: 44, padding: 0, background: "none", border: "none", fontSize: 13, fontWeight: 300, color: "var(--ink-soft, #666)", textDecoration: "underline", cursor: "pointer" }}>
        Laisser tomber
      </button>
      {erreur && <p role="alert" style={{ fontSize: 13, fontWeight: 300, color: "var(--ink)", marginTop: 8 }}>{erreur}</p>}
    </li>
  );
}

export default function DiscoveryClarifications({ clarifications }: { clarifications: ClarificationAffichee[] }) {
  if (clarifications.length === 0) return null;
  return (
    <section aria-label="Précisions demandées" style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 17, fontWeight: 400, color: "var(--ink)", margin: "0 0 4px" }}>Une précision</h2>
      <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-soft, #666)", margin: "0 0 8px" }}>Je préfère te demander que deviner.</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>{clarifications.map((c) => <Une key={c.id} c={c} />)}</ul>
    </section>
  );
}
