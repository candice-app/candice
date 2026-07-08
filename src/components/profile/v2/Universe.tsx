// Refonte Profil V2 — TON UNIVERS (module 9).
// Marques repères en WORDMARKS TYPOGRAPHIÉS PROVISOIRES (vrais logos au lot
// Brand Knowledge) · phrase « Ce que ça dit de ton univers » (carte champagne) ·
// Lieux & ambiances · Matières & esthétique · Rêves & envies ·
// « À savoir pour viser juste » (arbitrage 5 : subhead + tags, dans ce module).

import { T2, Mod, Tags } from "./ui";
import type { UniverseV2, SectionV2 } from "@/lib/profile/v2-data";

// Alternance typographique provisoire, stable par position
const WORDMARK_STYLES: Array<{ span: 2 | 3; dark?: boolean; champ?: boolean; text: React.CSSProperties }> = [
  { span: 3, text: { fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 19, color: T2.pine } },
  { span: 3, champ: true, text: { fontSize: 13.5, letterSpacing: ".22em", fontWeight: 600, color: "#9a7d2e", textTransform: "uppercase" } },
  { span: 2, dark: true, text: { fontSize: 14, letterSpacing: ".3em", fontWeight: 700, color: "#fff", textTransform: "uppercase" } },
  { span: 2, text: { fontFamily: "var(--font-serif)", fontSize: 16, letterSpacing: ".05em", color: T2.ink } },
  { span: 2, text: { fontSize: 12.5, letterSpacing: ".2em", fontWeight: 600, color: T2.pine2, textTransform: "uppercase" } },
  { span: 3, text: { fontFamily: "var(--font-serif)", fontSize: 13.5, color: T2.ink } },
  { span: 3, text: { fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: T2.pine2 } },
  { span: 2, text: { fontSize: 13, fontWeight: 700, letterSpacing: ".06em", color: T2.ink2 } },
  { span: 2, text: { fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 16, color: T2.pine } },
  { span: 2, text: { fontFamily: "var(--font-serif)", fontSize: 14.5, color: T2.pine } },
  { span: 3, text: { fontSize: 12, letterSpacing: ".18em", fontWeight: 700, color: T2.ink2, textTransform: "uppercase" } },
  { span: 3, text: { fontSize: 13.5, fontWeight: 600, color: T2.ink } },
];

function Subhead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: 1.6, textTransform: "uppercase", color: T2.ink3, fontWeight: 700, margin: "16px 0 8px" }}>
      {children}
    </div>
  );
}

export default function UniverseV2Block({
  universe,
  brands,
  pointsFixes,
}: {
  universe: UniverseV2 | null;
  brands: Array<{ name: string; category: string }>;
  pointsFixes: SectionV2 | undefined;
}) {
  const hasContent = brands.length > 0 || universe
    || (pointsFixes?.chips?.length ?? 0) > 0;
  if (!hasContent) return null;

  return (
    <Mod>
      {brands.length > 0 && (
        <>
          <Subhead>
            <span style={{ marginTop: 0 }}>Marques repères</span>
          </Subhead>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 12 }}>
            {brands.map((b, i) => {
              const s = WORDMARK_STYLES[i % WORDMARK_STYLES.length];
              return (
                <div key={`${b.name}-${i}`} style={{
                  gridColumn: `span ${s.span}`,
                  borderRadius: 15, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 3, padding: "15px 8px",
                  background: s.dark ? T2.aplat
                    : s.champ ? "linear-gradient(160deg,#FBF8F0,#F3EAD3)"
                    : "#fff",
                  border: s.dark ? "none"
                    : s.champ ? "1px solid rgba(199,168,90,.3)"
                    : `1px solid ${T2.line}`,
                  boxShadow: T2.shadow,
                }}>
                  <span style={{ textAlign: "center", ...s.text }}>{b.name}</span>
                  <span style={{
                    fontSize: 9, letterSpacing: 1.1, textTransform: "uppercase", fontWeight: 700,
                    color: s.dark ? "rgba(255,255,255,.55)" : T2.ink3,
                  }}>
                    {b.category}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {universe?.phrase && (
        <div style={{
          marginTop: 15, background: "linear-gradient(160deg,#FBF8F0,#F3EAD3)",
          border: "1px solid rgba(199,168,90,.28)", borderRadius: 15, padding: "14px 15px",
        }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, lineHeight: 1.5, color: "#6b551f", margin: 0 }}>
            {universe.phrase}
          </p>
        </div>
      )}

      {(universe?.lieux_ambiances?.length ?? 0) > 0 && (
        <>
          <Subhead>Lieux &amp; ambiances</Subhead>
          <Tags items={universe!.lieux_ambiances} style={{ marginTop: 0 }} />
        </>
      )}
      {(universe?.matieres?.length ?? 0) > 0 && (
        <>
          <Subhead>Matières &amp; esthétique</Subhead>
          <Tags items={universe!.matieres} style={{ marginTop: 0 }} />
        </>
      )}
      {(universe?.reves_envies?.length ?? 0) > 0 && (
        <>
          <Subhead>Rêves &amp; envies</Subhead>
          <Tags items={universe!.reves_envies} style={{ marginTop: 0 }} />
        </>
      )}
      {(pointsFixes?.chips?.length ?? 0) > 0 && (
        <>
          <Subhead>À savoir pour viser juste</Subhead>
          <Tags items={pointsFixes!.chips} style={{ marginTop: 0 }} />
        </>
      )}
    </Mod>
  );
}
