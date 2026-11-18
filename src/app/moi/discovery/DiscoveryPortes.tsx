"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// LES DEUX PORTES QUE LA PERSONNE OUVRE ELLE-MÊME.
//
//  · « Explorer un sujet » : elle choisit un sujet, ses questions deviennent possibles. C'est
//    révocable, et rien n'est supposé d'elle parce qu'elle a choisi : choisir d'en parler
//    n'est pas dire qu'on aime.
//  · « Un achat ou un séjour en préparation » : les questions très concrètes (« pour cet
//    achat, tu préfères… ») n'ont de sens que si l'achat existe. Aimer le voyage ne crée pas
//    un séjour ; c'est elle qui le dit, et elle dit quand c'est fini.
//
// Tout passe par POST, avec sa session. Une erreur est affichée telle quelle : on ne laisse
// pas croire qu'un choix a été enregistré quand il ne l'a pas été.

export interface Sujet { branche: string; libelle: string; choisi: boolean }
export interface ProjetEnCours { id: string; type: "achat" | "sejour"; branche: string; objet: string; fin?: string }

const carte: React.CSSProperties = {
  marginTop: 28, padding: "20px 20px 18px", borderRadius: 14,
  border: "0.5px solid rgba(23,62,49,.16)", background: "var(--white)",
};
const titre: React.CSSProperties = { fontSize: 16, fontWeight: 400, color: "var(--ink)", marginBottom: 6 };
const texte: React.CSSProperties = { fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 14 };
const champ: React.CSSProperties = {
  width: "100%", padding: "11px 12px", borderRadius: 10, border: "0.5px solid rgba(23,62,49,.25)",
  background: "var(--canvas)", fontSize: 14, color: "var(--ink)", marginBottom: 10,
};

async function poster(chemin: string, corps: unknown): Promise<string | null> {
  try {
    const r = await fetch(chemin, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    if (r.ok) return null;
    const j = (await r.json().catch(() => null)) as { error?: string } | null;
    return j?.error ?? "L’enregistrement n’a pas abouti. Rien n’a été modifié.";
  } catch {
    return "Connexion interrompue. Rien n’a été modifié.";
  }
}

export default function DiscoveryPortes({ sujets, projets }: { sujets: Sujet[]; projets: ProjetEnCours[] }) {
  const router = useRouter();
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [type, setType] = useState<"achat" | "sejour">("achat");
  const [branche, setBranche] = useState(sujets[0]?.branche ?? "");
  const [objet, setObjet] = useState("");
  const [fin, setFin] = useState("");
  const libelle = (b: string) => sujets.find((s) => s.branche === b)?.libelle ?? "";

  async function agir(chemin: string, corps: unknown, apres?: () => void) {
    if (occupe) return;
    setOccupe(true); setErreur(null);
    const e = await poster(chemin, corps);
    setOccupe(false);
    if (e) { setErreur(e); return; }
    apres?.();
    router.refresh();
  }

  return (
    <div style={{ marginTop: 12, marginBottom: 48 }}>
      {erreur && (
        <p role="alert" style={{ ...texte, color: "#8a2c1d", marginTop: 20, marginBottom: 0 }}>{erreur}</p>
      )}

      <section style={carte} aria-labelledby="portes-sujets">
        <h2 id="portes-sujets" style={titre}>Explorer un sujet</h2>
        <p style={texte}>
          Choisis ce dont tu as envie de parler. Tu peux revenir sur ton choix à tout moment&nbsp;: les questions de ce sujet s’arrêtent, et ce que tu as déjà répondu reste.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {sujets.map((s) => (
            <button
              key={s.branche}
              type="button"
              disabled={occupe}
              aria-pressed={s.choisi}
              onClick={() => agir("/api/discovery/sujet", { branche: s.branche, choisi: !s.choisi })}
              style={{
                padding: "9px 14px", borderRadius: 999, fontSize: 14, fontWeight: 300, cursor: occupe ? "default" : "pointer",
                border: s.choisi ? "0.5px solid var(--pine)" : "0.5px solid rgba(23,62,49,.2)",
                background: s.choisi ? "var(--pine)" : "var(--white)", color: s.choisi ? "var(--canvas)" : "var(--pine)",
              }}
            >
              {s.libelle}
            </button>
          ))}
        </div>
      </section>

      <section style={carte} aria-labelledby="portes-projets">
        <h2 id="portes-projets" style={titre}>Un achat ou un séjour en préparation</h2>
        <p style={texte}>
          Si tu prépares quelque chose de précis, dis-le ici&nbsp;: Candice pourra te poser les questions qui ne valent que pour ce projet. Quand il est terminé ou abandonné, ces questions s’arrêtent.
        </p>

        {projets.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>
            {projets.map((p) => (
              <li key={p.id} style={{ padding: "12px 0", borderTop: "0.5px solid rgba(23,62,49,.12)" }}>
                <div style={{ fontSize: 14, color: "var(--ink)" }}>
                  {p.type === "achat" ? "Achat" : "Séjour"} · {p.objet}
                </div>
                <div style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-2)", marginTop: 2 }}>
                  {libelle(p.branche)}{p.fin ? ` · jusqu’au ${new Date(p.fin).toLocaleDateString("fr-FR")}` : ""}
                </div>
                <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                  <button type="button" disabled={occupe} onClick={() => agir("/api/discovery/projet", { action: "clore", projetId: p.id, motif: "termine" })}
                    style={{ background: "none", border: "none", padding: 0, fontSize: 13, color: "var(--pine)", cursor: "pointer", textDecoration: "underline" }}>
                    C’est fait
                  </button>
                  <button type="button" disabled={occupe} onClick={() => agir("/api/discovery/projet", { action: "clore", projetId: p.id, motif: "annule" })}
                    style={{ background: "none", border: "none", padding: 0, fontSize: 13, color: "var(--ink-2)", cursor: "pointer", textDecoration: "underline" }}>
                    J’y renonce
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!objet.trim() || !branche) { setErreur("Dis de quel achat ou de quel séjour il s’agit."); return; }
            agir("/api/discovery/projet", { action: "ouvrir", type, branche, objet: objet.trim(), ...(fin ? { fin: new Date(`${fin}T23:59:59`).toISOString() } : {}) }, () => { setObjet(""); setFin(""); });
          }}
        >
          <label style={{ display: "block", fontSize: 13, color: "var(--ink-2)", marginBottom: 4 }} htmlFor="projet-type">Ce que tu prépares</label>
          <select id="projet-type" value={type} onChange={(e) => setType(e.target.value === "sejour" ? "sejour" : "achat")} style={champ}>
            <option value="achat">Un achat</option>
            <option value="sejour">Un séjour</option>
          </select>
          <label style={{ display: "block", fontSize: 13, color: "var(--ink-2)", marginBottom: 4 }} htmlFor="projet-branche">Le sujet</label>
          <select id="projet-branche" value={branche} onChange={(e) => setBranche(e.target.value)} style={champ}>
            {sujets.map((s) => <option key={s.branche} value={s.branche}>{s.libelle}</option>)}
          </select>
          <label style={{ display: "block", fontSize: 13, color: "var(--ink-2)", marginBottom: 4 }} htmlFor="projet-objet">De quoi s’agit-il&nbsp;?</label>
          <input id="projet-objet" value={objet} onChange={(e) => setObjet(e.target.value)} maxLength={200} placeholder="Un sac pour le quotidien, cinq jours à Lisbonne…" style={champ} />
          <label style={{ display: "block", fontSize: 13, color: "var(--ink-2)", marginBottom: 4 }} htmlFor="projet-fin">Jusqu’à quand (facultatif)</label>
          <input id="projet-fin" type="date" value={fin} onChange={(e) => setFin(e.target.value)} style={champ} />
          <button type="submit" disabled={occupe} style={{
            marginTop: 4, padding: "13px 20px", borderRadius: 12, border: "none", background: "var(--pine)",
            fontSize: 14, fontWeight: 400, color: "var(--canvas)", cursor: occupe ? "default" : "pointer",
          }}>
            {occupe ? "Enregistrement…" : "Ajouter ce projet"}
          </button>
        </form>
      </section>
    </div>
  );
}
