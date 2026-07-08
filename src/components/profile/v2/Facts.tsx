"use client";

// Refonte Profil V2 — INFOS PRATIQUES (module 10).
// Lignes cliquables, JAMAIS de brut. Mobilité jamais tronquée sans détail
// (tap → sheet). Dates « N à compléter » → écran dédié. Art.9 badge Privé +
// Gérer. Animaux conservé (arbitrage 4, après Alimentation).

import { useState } from "react";
import Link from "next/link";
import { T2, Mod, Icon } from "./ui";
import { Sheet } from "./Sheet";
import FactEditor, { type FactEditorKind } from "./FactEditor";
import type { ProfileV2Data } from "@/lib/profile/v2-data";

function FactRow({
  k, v, sub, hl, onClick, href,
}: {
  k: string; v: string; sub?: string; hl?: boolean;
  onClick?: () => void; href?: string;
}) {
  const inner = (
    <>
      <span style={{ fontSize: 13, color: T2.ink2 }}>{k}</span>
      <span style={{
        display: "flex", alignItems: "center", gap: 7, fontSize: 13.5,
        fontWeight: 550, textAlign: "right", color: hl ? T2.pine : T2.ink,
      }}>
        <span>
          {v}
          {sub && <small style={{ display: "block", fontSize: 11, color: T2.ink3, fontWeight: 400 }}>{sub}</small>}
        </span>
        {(onClick || href) && <Icon name="chevron" size={13} style={{ color: T2.ink3 }} />}
      </span>
    </>
  );
  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    padding: "12px 0", minHeight: 50, borderBottom: `1px solid ${T2.line2}`,
    width: "100%", background: "none", border: "none", borderBottomStyle: "solid",
    borderBottomWidth: 1, borderBottomColor: T2.line2,
    cursor: onClick || href ? "pointer" : "default",
    fontFamily: "var(--font-sans)", textAlign: "left", textDecoration: "none",
  };
  if (href) return <Link href={href} style={rowStyle}>{inner}</Link>;
  if (onClick) return <button onClick={onClick} style={rowStyle}>{inner}</button>;
  return <div style={rowStyle}>{inner}</div>;
}

export default function FactsV2({ data }: { data: ProfileV2Data }) {
  const [mobOpen, setMobOpen] = useState(false);
  // C3 STOP C : édition DIRECTE en sheet — plus aucun renvoi vers la page
  // questionnaire legacy depuis la fiche.
  const [editor, setEditor] = useState<FactEditorKind | null>(null);
  const f = data.facts;

  const alimentation = [f.regimeAlcool, f.allergies ? `allergies : ${f.allergies}` : null]
    .filter(Boolean).join(" · ");

  const rows: React.ReactNode[] = [];
  if (f.tailles) rows.push(
    <FactRow key="tailles" k="Tailles" v={f.tailles} onClick={() => setEditor("tailles")} />);
  if (alimentation) rows.push(
    <FactRow key="alim" k="Alimentation" v={alimentation} onClick={() => setEditor("alimentation")} />);
  if (f.animaux) rows.push(
    <FactRow key="animaux" k="Animaux" v={f.animaux} />);
  if (f.parfums) rows.push(
    <FactRow key="parfums" k="Parfums" v={f.parfums.split(" / ")[0] ?? f.parfums}
      sub={f.parfums.includes(" / ") ? `éviter : ${f.parfums.split(" / ")[1]}` : undefined}
      href="/moi/discovery?mode=full&section=fragrance-family" />);
  if (f.adresseRenseignee !== undefined) rows.push(
    <FactRow key="livraison" k="Livraison"
      v={f.adresseRenseignee ? "Adresse renseignée" : "À renseigner"}
      hl={!f.adresseRenseignee}
      onClick={() => setEditor("adresse")} />);
  if (data.mobiliteDetail) rows.push(
    <FactRow key="mobilite" k="Mobilité & confort"
      v={f.mobilite?.split(" · ")[0] ?? "Renseignée"}
      sub={data.mobiliteDetail.intensite ?? undefined}
      onClick={() => setMobOpen(true)} />);
  // Dates clés — 3 états (arbitrage A.2) : aucune entrée → CTA ajouter ;
  // entrées sans date exploitable → « N à compléter » ; toutes datées → résumé.
  rows.push(
    <FactRow key="dates" k="Dates clés"
      v={data.datesTotal === 0
        ? "Ajouter tes dates clés"
        : data.datesACompleter > 0
          ? `${data.datesACompleter} date${data.datesACompleter > 1 ? "s" : ""} à compléter`
          : (f.datesCles ?? "")}
      hl={data.datesTotal === 0 || data.datesACompleter > 0}
      onClick={() => setEditor("dates")} />);

  return (
    <Mod>
      <div style={{
        display: "flex", alignItems: "center", gap: 7, fontSize: 10,
        letterSpacing: 1.4, textTransform: "uppercase", color: "#9a7d2e",
        fontWeight: 700, marginBottom: 4,
      }}>
        <Icon name="lock" size={12} />
        {data.gender === "feminine" ? "Visible par toi seule" : "Visible par toi seul"} · réglable au partage
      </div>

      {rows}

      {/* Art.9 — badge Privé, « Gérer » MASQUÉ (arbitrage A.1 STOP C) :
          aucune cible exacte n'existe avant le lot A3/RGPD — un CTA qui
          n'atterrit pas sur sa question exacte est interdit. */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        padding: "12px 0", minHeight: 50,
      }}>
        <span style={{ fontSize: 13, color: T2.ink2 }}>
          Santé · handicap · religion
          <small style={{ display: "block", fontSize: 11, color: T2.ink3, marginTop: 2 }}>
            Sensible — tu choisis de renseigner ou non
          </small>
        </span>
        <span style={{
          fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase",
          background: "rgba(205,185,135,.22)", color: "#7a4b1e", padding: "3px 8px", borderRadius: 8,
          flexShrink: 0,
        }}>
          Privé
        </span>
      </div>

      {/* Sheets d'édition dédiées (C3) — recréées à l'ouverture (key) pour
          repartir des valeurs fraîches après router.refresh() */}
      {editor && <FactEditor key={editor} kind={editor} data={data} onClose={() => setEditor(null)} />}

      {/* Sheet mobilité — détail COMPLET, jamais tronqué */}
      {data.mobiliteDetail && (
        <Sheet open={mobOpen} onClose={() => setMobOpen(false)} title="Mobilité & confort">
          {data.mobiliteDetail.intensite && (
            <p style={{ fontSize: 14, lineHeight: 1.6, color: T2.ink2, marginBottom: 13 }}>
              <b style={{ color: T2.ink, fontWeight: 600 }}>À prendre en compte :</b> {data.mobiliteDetail.intensite}.
            </p>
          )}
          <p style={{ fontSize: 14, lineHeight: 1.6, color: T2.ink2, marginBottom: 13 }}>
            Détail confié : {data.mobiliteDetail.texte}. Candice s&apos;en sert pour écarter
            les expériences mal adaptées — jamais pour l&apos;afficher.
          </p>
          <p style={{ color: T2.ink3, fontSize: 12.5 }}>
            {data.gender === "feminine" ? "Visible par toi seule" : "Visible par toi seul"} · réglable au partage
          </p>
        </Sheet>
      )}
    </Mod>
  );
}
