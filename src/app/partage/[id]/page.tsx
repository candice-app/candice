import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/utils/supabase/admin";

type AnalysisSection = { text?: string; chips?: string[] };

// ─── 3rd-person transform ─────────────────────────────────────────────────────

function to3rdPerson(text: string, gender?: string | null): string {
  const p = gender === "feminine" ? "elle" : "il";
  return text
    .replace(/\btu sembles?\b/gi, `${p} semble`)
    .replace(/\btu es\b/gi,       `${p} est`)
    .replace(/\btu as\b/gi,       `${p} a`)
    .replace(/\btu apprécies?\b/gi, `${p} apprécie`)
    .replace(/\btu aimes?\b/gi,   `${p} aime`)
    .replace(/\btu préfères?\b/gi,`${p} préfère`)
    .replace(/\btu cherches?\b/gi,`${p} cherche`)
    .replace(/\btu exprimes?\b/gi,`${p} exprime`)
    .replace(/\btu te sens\b/gi,  `${p} se sent`)
    .replace(/\btu te\b/gi,       `${p} se`)
    .replace(/\btu\b/gi,          p)
    .replace(/\bton\b/gi,  "son")
    .replace(/\bta\b/gi,   "sa")
    .replace(/\btes\b/gi,  "ses");
}

// ─── Components ───────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--ink-3)" }}>
          {label}
        </span>
        <div style={{ flex: 1, height: ".5px", background: "var(--line)" }} />
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PartagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data }, { data: analysisRow }] = await Promise.all([
    supabase.from("my_profile").select("grammatical_gender").eq("user_id", id).maybeSingle(),
    supabase.from("profile_analysis")
      .select("summary, summary_third_person, summary_chips, sections, must_haves")
      .eq("user_id", id).is("contact_id", null).maybeSingle(),
  ]);

  if (!data) notFound();

  const analysis = analysisRow as {
    summary: string | null;
    summary_third_person: string | null;
    summary_chips: string[] | null;
    sections: Record<string, AnalysisSection> | null;
    must_haves: string[] | null;
  } | null;

  const gender = (data as { grammatical_gender: string | null }).grammatical_gender;

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>

      {/* Header */}
      <header style={{
        padding: "18px 24px",
        borderBottom: "0.5px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{
            fontFamily: "var(--font-sans)", fontWeight: 300, fontSize: 18,
            letterSpacing: ".34em", textTransform: "uppercase", color: "var(--ink)",
            paddingLeft: ".34em",
          }}>
            CANDICE
          </span>
        </Link>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Intro */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--pine)", marginBottom: 12 }}>
            Fiche personnelle
          </p>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 300,
            fontSize: "clamp(26px, 5vw, 34px)",
            color: "var(--ink)",
            letterSpacing: "-.022em",
            lineHeight: 1.15,
            marginBottom: 12,
          } as React.CSSProperties}>
            Ce qui lui fait plaisir.
          </h1>
          <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65 }}>
            Cette personne partage sa fiche avec toi pour que tu puisses mieux prendre soin d&apos;elle.
          </p>
        </div>

        {/* Résumé Candice en 3e personne */}
        {(analysis?.summary_third_person || analysis?.summary) && (
          <div style={{
            padding: "20px 22px",
            borderRadius: 16,
            background: "radial-gradient(130% 100% at 26% 0%, #1E4337 0%, #0E2219 44%, #060E0A 100%)",
            marginBottom: analysis?.summary_chips?.length ? 16 : 40,
          }}>
            <p style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 300, fontSize: 17,
              color: "#FAF8F1", lineHeight: 1.65, letterSpacing: "-.012em",
            } as React.CSSProperties}>
              {analysis?.summary_third_person
                ?? (analysis?.summary ? to3rdPerson(analysis.summary, gender) : null)}
            </p>
          </div>
        )}

        {/* Chips résumé */}
        {analysis?.summary_chips && analysis.summary_chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 40 }}>
            {analysis.summary_chips.map((chip, i) => (
              <span key={i} style={{
                fontSize: 12, fontWeight: 300,
                padding: "5px 12px", borderRadius: 20,
                background: "rgba(23,62,49,.06)",
                border: "0.5px solid rgba(23,62,49,.12)",
                color: "var(--pine)",
              }}>
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Sections enrichies profile_analysis */}
        {analysis?.sections && (() => {
          const SECTION_DISPLAY: Array<{ key: string; label: string }> = [
            { key: "attention",    label: "Ce qui lui fait plaisir" },
            { key: "what_touches", label: "Ce qui le/la touche" },
            { key: "gifts",        label: "Cadeaux" },
            { key: "avoid",        label: "À éviter" },
            { key: "style",        label: "Style" },
            { key: "restaurants",  label: "Restaurants" },
            { key: "travel",       label: "Voyages" },
            { key: "hobbies",      label: "Loisirs & passions" },
          ];
          const filled = SECTION_DISPLAY.filter(s => {
            const sec = analysis.sections![s.key];
            return sec?.text && sec.text.trim().length > 3;
          });
          if (filled.length === 0) return null;
          return (
            <Section label="Ce que Candice retient">
              {filled.map(({ key, label }) => {
                const sec = analysis.sections![key]!;
                const text3p = sec.text ? to3rdPerson(sec.text, gender) : undefined;
                return (
                  <div key={key} style={{ padding: "14px 0", borderBottom: "0.5px solid var(--line)" }}>
                    <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: sec.chips?.length ? 8 : 0 }}>
                      {text3p}
                    </p>
                    {sec.chips && sec.chips.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {sec.chips.map((chip, i) => (
                          <span key={i} style={{ fontSize: 11, fontWeight: 300, padding: "3px 9px", borderRadius: 20, background: "rgba(23,62,49,.06)", border: "0.5px solid rgba(23,62,49,.12)", color: "var(--pine)" }}>
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Must-haves */}
              {analysis.must_haves && analysis.must_haves.length > 0 && (
                <div style={{ padding: "14px 0" }}>
                  <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>
                    Indispensables
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {analysis.must_haves.map((item, i) => (
                      <span key={i} style={{ fontSize: 11, fontWeight: 300, padding: "3px 9px", borderRadius: 20, background: "rgba(23,62,49,.06)", border: "0.5px solid rgba(23,62,49,.12)", color: "var(--pine)" }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          );
        })()}

        {/* Viral CTA */}
        <div style={{
          padding: "28px 24px",
          borderRadius: 16,
          border: "0.5px solid var(--champ-line)",
          background: "var(--champ-soft)",
          textAlign: "center",
          marginTop: 48,
        }}>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 300,
            fontSize: 20,
            color: "var(--ink)",
            letterSpacing: "-.012em",
            marginBottom: 8,
          } as React.CSSProperties}>
            Toi aussi, partage ta fiche.
          </p>
          <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.65, marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
            Crée ton compte Candice — tes proches sauront exactement comment prendre soin de toi.
          </p>
          <Link href="/register">
            <button className="btn-primary">Créer mon compte gratuit →</button>
          </Link>
        </div>

      </main>
    </div>
  );
}
