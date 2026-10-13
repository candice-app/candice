"use client";

// Écran de choix des trois modes de remplissage (sous-bloc 2). Présentation PURE : il reçoit le
// prénom + le genre du proche et un callback de sélection, il ne route rien lui-même.
//
// Copy ARBITRÉE lue depuis src/content/invite.ts, {Prénom} résolu au rendu (resolveLines). Aucun
// jeton ne survit. Hiérarchie (Estelle) : carte 1 (direct) LARGE et mise en avant ; cartes 2
// (côte à côte) et 3 (incognito) au second plan, à égalité entre elles ; la ligne de VERDICT en
// italique est l'élément qui porte la hiérarchie. Ligne de footer une seule fois sous les trois.

import type { ContactGender } from "@/lib/knowledge-write/pronoun";
import { resolveContent, resolveLines } from "@/content/resolve";

export type FillMode = "direct" | "cotecote" | "incognito";

function Body({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 300, color: "var(--cond)", lineHeight: 1.65, marginTop: i === 0 ? 0 : 10 }}>
          {p}
        </p>
      ))}
    </>
  );
}

function Verdict({ text }: { text: string }) {
  // élément à part entière : il PORTE la hiérarchie (Estelle).
  return (
    <p style={{ fontSize: 12, fontWeight: 300, fontStyle: "italic", color: "var(--con)", marginTop: 12 }}>
      {text}
    </p>
  );
}

export default function ModeChoice({
  firstName,
  gender,
  onSelect,
}: {
  firstName: string;
  gender: ContactGender;
  onSelect: (mode: FillMode) => void;
}) {
  const r = (key: Parameters<typeof resolveContent>[0]) => resolveContent(key, firstName, gender) as string;
  const lines = (key: Parameters<typeof resolveLines>[0]) => resolveLines(key, firstName, gender);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ── Carte 1 · direct — large, mise en avant ── */}
      <button
        onClick={() => onSelect("direct")}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "24px",
          borderRadius: "var(--r-md)",
          border: "1.5px solid var(--terra)",
          background: "var(--t2)",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: "var(--terra)" }}>{r("mode.direct.label")}</span>
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--terra)", background: "var(--bg)", border: "0.5px solid var(--terra)", borderRadius: 20, padding: "2px 8px" }}>
            {r("mode.direct.badge")}
          </span>
        </div>
        <Body lines={lines("mode.direct.body")} />
        <Verdict text={r("mode.direct.verdict")} />
      </button>

      {/* ── Cartes 2 & 3 · second plan, à égalité ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        {([
          { mode: "cotecote" as const, label: "mode.cotecote.label", body: "mode.cotecote.body", verdict: "mode.cotecote.verdict" },
          { mode: "incognito" as const, label: "mode.incognito.label", body: "mode.incognito.body", verdict: "mode.incognito.verdict" },
        ]).map((c) => (
          <button
            key={c.mode}
            onClick={() => onSelect(c.mode)}
            style={{
              flex: "1 1 240px",
              minWidth: 240,
              textAlign: "left",
              padding: "18px",
              borderRadius: "var(--r-md)",
              border: "0.5px solid var(--brd)",
              background: "var(--bg)",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--con)", marginBottom: 8 }}>{r(c.label as Parameters<typeof resolveContent>[0])}</p>
            <Body lines={lines(c.body as Parameters<typeof resolveLines>[0])} />
            <Verdict text={r(c.verdict as Parameters<typeof resolveContent>[0])} />
          </button>
        ))}
      </div>

      {/* ── Ligne unique sous les trois cartes ── */}
      <p style={{ fontSize: 12, fontWeight: 300, color: "var(--cond)", textAlign: "center", marginTop: 4 }}>
        {r("mode.footer")}
      </p>
    </div>
  );
}
