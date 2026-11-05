// LIGNE 5 — premier éclat du câblage affichage (décision Estelle 5 nov).
// Lecteur OWNER-ONLY des sections issues du JOURNAL (profile_analysis_sections, scope='self').
// Ce n'est PAS un outil de debug jetable : c'est le plus petit morceau utile du rendu de la ligne 5.
//
// CONTRAINTES DURES (Estelle) :
//   • Owner-only : lit SA PROPRE ligne via le client RLS de l'appelant. RLS inchangé (pas_owner,
//     migration 92 : FOR ALL USING auth.uid() = user_id). ZÉRO client admin, AUCUNE route à droits élargis.
//   • Aucun travail de design : rendu brut, texte lisible. La maquette gelée viendra plus tard dans la ligne 5.
//
// TROIS CHOSES VISIBLES, sinon l'écran ne sert à rien :
//   1. Le texte de chaque section, tel qu'il sera lu.
//   2. Pour chaque affirmation : ses evidence ids ET le verbatim derrière (le « pourquoi ? » de §30.1).
//   3. Le niveau d'interprétation de chaque affirmation (déclaration / tendance / hypothèse / implication).

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAuthClaims } from "@/utils/supabase/claims";

// ── §30.1 — libellés des quatre niveaux de lecture ──────────────────────────────
const LEVEL_LABELS: Record<string, string> = {
  declaration: "déclaration · connaissance exprimée",
  tendance: "tendance · tendance consolidée",
  hypothese: "hypothèse · hypothèse interprétative",
  implication: "implication · lecture relationnelle actionnable",
};

type Affirmation = { id: string; type: string; text: string; evidence_ids: string[] };
type SectionRow = {
  section_key: string;
  tier: string | null;
  text: string | null;
  affirmations: Affirmation[] | null;
  source_evidence_ids: string[] | null;
  depends_on_sections: string[] | null;
  generated_at: string | null;
};
type SourceRow = {
  id: string;
  question_code: string | null;
  question_text: string | null;
  answer_text: string | null;
  raw_text: string | null;
};

export default async function SectionsReaderPage() {
  const supabase = await createClient();
  const claims = await getAuthClaims(supabase);
  if (!claims) redirect("/login");
  const userId = claims.sub as string;

  // 1. Sections du périmètre self, lues sous le RLS de l'appelant (owner-only).
  const { data: rawSections, error: secErr } = await supabase
    .from("profile_analysis_sections")
    .select("section_key, tier, text, affirmations, source_evidence_ids, depends_on_sections, generated_at")
    .eq("user_id", userId)
    .is("contact_id", null)
    .order("tier")
    .order("section_key");

  const sections = (rawSections ?? []) as unknown as SectionRow[];

  // 2. Résolution des evidence ids → verbatim. evidence_ids SONT des knowledge_sources.id.
  //    Lecture sous le même RLS owner-only (seules les sources de l'appelant se résolvent).
  const allIds = Array.from(
    new Set(sections.flatMap((s) => (s.affirmations ?? []).flatMap((a) => a.evidence_ids ?? []))),
  );
  const byId = new Map<string, SourceRow>();
  if (allIds.length > 0) {
    const { data: srcRows } = await supabase
      .from("knowledge_sources")
      .select("id, question_code, question_text, answer_text, raw_text")
      .in("id", allIds);
    for (const r of (srcRows ?? []) as unknown as SourceRow[]) byId.set(r.id, r);
  }

  const totalAff = sections.reduce((n, s) => n + (s.affirmations?.length ?? 0), 0);
  const emptyCount = sections.filter((s) => !s.text && (s.affirmations?.length ?? 0) === 0).length;

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "32px 20px 120px", fontFamily: "var(--font-sans, system-ui, sans-serif)", color: "var(--ink, #1a1a1a)", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Sections issues du journal — lecteur owner-only</h1>
      <p style={{ fontSize: 13, color: "var(--ink-3, #777)", margin: "0 0 4px" }}>
        Ta propre fiche telle que la ligne 4 l&apos;a générée depuis le journal (table <code>profile_analysis_sections</code>, périmètre self).
        Rendu brut, sans design — la maquette gelée viendra plus tard.
      </p>
      <p style={{ fontSize: 13, color: "var(--ink-3, #777)", margin: "0 0 24px" }}>
        {sections.length} section(s) · {totalAff} affirmation(s) · {emptyCount} vide(s) · {allIds.length} evidence(s) distincte(s) résolue(s)
      </p>

      {secErr && (
        <p style={{ color: "#C44A4A", fontSize: 13 }}>Erreur de lecture : {secErr.message}</p>
      )}
      {sections.length === 0 && !secErr && (
        <p style={{ fontSize: 14, color: "var(--ink-2, #555)" }}>
          Aucune section générée depuis le journal pour ce compte. (Le journal peut être rempli sans que la ligne 4 ait encore tourné.)
        </p>
      )}

      {sections.map((s) => {
        const affs = s.affirmations ?? [];
        const isEmpty = !s.text && affs.length === 0;
        return (
          <section key={s.section_key} style={{ borderTop: "2px solid var(--line, #e3e3e3)", paddingTop: 20, marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{s.section_key}</h2>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--ink-3, #999)" }}>
                {s.tier ?? "—"}{isEmpty ? " · VIDE" : ""}
              </span>
              {s.depends_on_sections?.length ? (
                <span style={{ fontSize: 11, color: "var(--ink-3, #999)" }}>← dépend de : {s.depends_on_sections.join(", ")}</span>
              ) : null}
            </div>

            {/* 1. Le texte de la section, tel qu'il sera lu. */}
            {s.text ? (
              <p style={{ fontSize: 15, margin: "0 0 16px", whiteSpace: "pre-wrap" }}>{s.text}</p>
            ) : (
              <p style={{ fontSize: 13, color: "var(--ink-3, #999)", fontStyle: "italic", margin: "0 0 16px" }}>— pas de texte —</p>
            )}

            {/* 2 + 3. Chaque affirmation : niveau d'interprétation, puis evidence ids + verbatim. */}
            {affs.map((a, i) => {
              const levelLabel = LEVEL_LABELS[a.type] ?? `??? (${a.type})`;
              const ids = a.evidence_ids ?? [];
              return (
                <div key={a.id ?? i} style={{ borderLeft: "3px solid var(--line, #d8d8d8)", paddingLeft: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--pine, #1e4331)", marginBottom: 3 }}>
                    {levelLabel}
                  </div>
                  <p style={{ fontSize: 14, margin: "0 0 8px" }}>{a.text}</p>
                  {ids.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#C44A4A", margin: 0 }}>⚠ aucune evidence — affirmation sans adossement</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {ids.map((eid) => {
                        const src = byId.get(eid);
                        return (
                          <div key={eid} style={{ background: "var(--surface, #f6f5f2)", borderRadius: 6, padding: "8px 10px", fontSize: 12.5 }}>
                            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, color: "var(--ink-3, #999)", marginBottom: 3 }}>
                              {eid}{src?.question_code ? ` · ${src.question_code}` : ""}
                            </div>
                            {!src ? (
                              <div style={{ color: "#C44A4A" }}>⚠ source irrésoluble (hors de ta ligne, ou absente)</div>
                            ) : (
                              <div style={{ color: "var(--ink-2, #444)" }}>
                                {src.question_text ? <div><b>Q :</b> {src.question_text}</div> : null}
                                {src.answer_text ? <div><b>R :</b> {src.answer_text}</div> : null}
                                {src.raw_text && src.raw_text !== src.answer_text ? <div><b>Brut :</b> {src.raw_text}</div> : null}
                                {!src.question_text && !src.answer_text && !src.raw_text ? <div style={{ fontStyle: "italic", color: "var(--ink-3, #999)" }}>— source sans verbatim textuel —</div> : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}
    </main>
  );
}
