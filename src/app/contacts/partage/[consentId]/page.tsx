// Vue restreinte — ce que B voit après avoir consenti (ou la demande si pending).
// Accessible UNIQUEMENT à B authentifié.
// Ne montre que profile_analysis (analyse) — jamais questionnaire_responses (données brutes d'A).
// Tout filtrage est côté serveur via RLS : si le consent n'est pas 'active',
// la policy "proche_read_consented_analysis" bloque la lecture.

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import ConsentActions from "./ConsentActions";

type AnalysisSection = { text?: string; chips?: string[] };

const SECTION_LABELS: Record<string, string> = {
  attention:    "Ce qui lui fait plaisir",
  what_touches: "Ce qui le·la touche",
  gifts:        "Cadeaux",
  avoid:        "À éviter",
  style:        "Style",
  restaurants:  "Restaurants",
  travel:       "Voyages",
  hobbies:      "Loisirs & passions",
};

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
    .replace(/\bton\b/gi, "son").replace(/\bta\b/gi, "sa").replace(/\btes\b/gi, "ses");
}

export default async function VueRestreintePage({
  params,
}: {
  params: Promise<{ consentId: string }>;
}) {
  const { consentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/contacts/partage/${consentId}`);

  // Charger le consent — la RLS garantit que seul B (proche_user_id) peut le lire
  const { data: consent } = await supabase
    .from("contact_consents")
    .select("id, pilote_id, contact_id, proche_user_id, status, scope, consented_at")
    .eq("id", consentId)
    .maybeSingle();

  // Si le consent n'existe pas ou n'est pas adressé à ce user → 404 sans fuite
  if (!consent || consent.proche_user_id !== user.id) notFound();

  // Consent révoqué ou refusé → message clair, pas notFound (B sait que ça existait)
  if (consent.status === "revoked" || consent.status === "rejected") {
    return (
      <div style={{ minHeight: "100svh", background: "var(--canvas)", fontFamily: "var(--font-sans)" }}>
        <Header />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--ink)", marginBottom: 12 }}>
            Ce partage n&apos;est plus actif.
          </p>
          <p style={{ fontSize: 15, fontWeight: 300, color: "rgba(26,26,26,.6)", lineHeight: 1.7 }}>
            {consent.status === "revoked"
              ? "La personne qui avait partagé cette analyse a révoqué son partage."
              : "Tu avais refusé de voir cette analyse."}
          </p>
          <Link href="/dashboard" style={{ display: "inline-block", marginTop: 32, fontSize: 14, color: "var(--pine)", textDecoration: "underline" }}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  // Consent en attente → prompt de consentement explicite
  if (consent.status === "pending") {
    return (
      <div style={{ minHeight: "100svh", background: "var(--canvas)", fontFamily: "var(--font-sans)" }}>
        <Header />
        <main style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px 80px" }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--pine)", marginBottom: 12 }}>
              Demande de partage
            </p>
            <h1 style={{
              fontFamily: "var(--font-serif)", fontWeight: 300,
              fontSize: "clamp(24px,5vw,30px)", color: "var(--ink)",
              letterSpacing: "-.018em", lineHeight: 1.2, marginBottom: 16,
            } as React.CSSProperties}>
              Quelqu&apos;un veut partager une analyse avec toi.
            </h1>
            <div style={{
              background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: 14, padding: "18px 20px", marginBottom: 24,
            }}>
              <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink)", lineHeight: 1.7, margin: 0 }}>
                Candice a généré une analyse de toi à partir des informations partagées.
                Tu peux choisir de la voir — ou de ne pas la voir.
              </p>
            </div>
            <div style={{
              background: "rgba(23,62,49,.04)", border: "1px solid rgba(23,62,49,.1)",
              borderRadius: 12, padding: "14px 16px", marginBottom: 28,
            }}>
              <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink2)", lineHeight: 1.6, margin: 0 }}>
                <strong style={{ fontWeight: 500, color: "var(--pine)" }}>Ce que tu verras :</strong>{" "}
                uniquement l&apos;analyse relationnelle (ce que Candice retient de toi).
                <br />
                <strong style={{ fontWeight: 500, color: "var(--pine)" }}>Ce que tu ne verras jamais :</strong>{" "}
                les données brutes que l&apos;autre personne a saisies.
              </p>
            </div>
            <ConsentActions consentId={consentId} />
          </div>
        </main>
      </div>
    );
  }

  // Consent actif → afficher l'analyse (la RLS "proche_read_consented_analysis" la déverrouille)
  const { data: analysis } = await supabase
    .from("profile_analysis")
    .select("summary, summary_third_person, summary_chips, sections, must_haves, gender")
    .eq("user_id", consent.pilote_id)
    .eq("contact_id", consent.contact_id)
    .maybeSingle();

  // Si l'analyse n'est pas lisible (RLS bloque) ou inexistante
  if (!analysis) {
    return (
      <div style={{ minHeight: "100svh", background: "var(--canvas)", fontFamily: "var(--font-sans)" }}>
        <Header />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--ink)", marginBottom: 12 }}>
            L&apos;analyse n&apos;est pas encore disponible.
          </p>
          <p style={{ fontSize: 15, fontWeight: 300, color: "rgba(26,26,26,.6)", lineHeight: 1.7 }}>
            Candice n&apos;a pas encore généré d&apos;analyse pour ce profil.
            Reviens dans quelques instants.
          </p>
        </div>
      </div>
    );
  }

  const typedAnalysis = analysis as {
    summary: string | null;
    summary_third_person: string | null;
    summary_chips: string[] | null;
    sections: Record<string, AnalysisSection> | null;
    must_haves: string[] | null;
    gender: string | null;
  };
  const gender = typedAnalysis.gender;

  const summaryText =
    typedAnalysis.summary_third_person ??
    (typedAnalysis.summary ? to3rdPerson(typedAnalysis.summary, gender) : null);

  const filledSections = Object.entries(SECTION_LABELS)
    .map(([key, label]) => ({ key, label, sec: typedAnalysis.sections?.[key] }))
    .filter(({ sec }) => sec?.text && sec.text.trim().length > 3);

  return (
    <div style={{ minHeight: "100svh", background: "var(--canvas)", fontFamily: "var(--font-sans)" }}>
      <Header />
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Intro */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--pine)", marginBottom: 12 }}>
            Analyse relationnelle
          </p>
          <h1 style={{
            fontFamily: "var(--font-serif)", fontWeight: 300,
            fontSize: "clamp(26px,5vw,32px)", color: "var(--ink)",
            letterSpacing: "-.018em", lineHeight: 1.15, marginBottom: 12,
          } as React.CSSProperties}>
            Ce que Candice retient de toi.
          </h1>
          <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(26,26,26,.55)", lineHeight: 1.65, margin: 0 }}>
            Cette analyse est basée sur des informations partagées. Elle peut évoluer.
          </p>
        </div>

        {/* Résumé */}
        {summaryText && (
          <div style={{
            padding: "20px 22px", borderRadius: 16,
            background: "radial-gradient(130% 100% at 26% 0%, #1E4337 0%, #0E2219 44%, #060E0A 100%)",
            marginBottom: typedAnalysis.summary_chips?.length ? 16 : 32,
          }}>
            <p style={{
              fontFamily: "var(--font-serif)", fontWeight: 300,
              fontSize: 17, color: "#FAF8F1", lineHeight: 1.65, margin: 0,
            }}>
              {summaryText}
            </p>
          </div>
        )}

        {/* Chips résumé */}
        {(typedAnalysis.summary_chips?.length ?? 0) > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 32 }}>
            {typedAnalysis.summary_chips!.map((chip, i) => (
              <span key={i} style={{
                fontSize: 12, fontWeight: 300,
                padding: "5px 12px", borderRadius: 20,
                background: "rgba(23,62,49,.06)",
                border: "0.5px solid rgba(23,62,49,.12)", color: "var(--pine)",
              }}>
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Sections */}
        {filledSections.length > 0 && (
          <div style={{ borderTop: "0.5px solid var(--line)", paddingTop: 28 }}>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: ".28em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 20 }}>
              Ce que Candice retient
            </p>
            {filledSections.map(({ key, label, sec }) => (
              <div key={key} style={{ paddingBottom: 20, marginBottom: 20, borderBottom: "0.5px solid var(--line)" }}>
                <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 6 }}>
                  {label}
                </p>
                <p style={{ fontSize: 14, fontWeight: 300, color: "var(--ink2)", lineHeight: 1.6, marginBottom: (sec!.chips?.length ?? 0) > 0 ? 8 : 0 }}>
                  {sec!.text ? to3rdPerson(sec!.text, gender) : null}
                </p>
                {(sec!.chips?.length ?? 0) > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {sec!.chips!.map((chip, i) => (
                      <span key={i} style={{
                        fontSize: 11, fontWeight: 300, padding: "3px 9px", borderRadius: 20,
                        background: "rgba(23,62,49,.06)", border: "0.5px solid rgba(23,62,49,.12)", color: "var(--pine)",
                      }}>
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Must-haves */}
            {(typedAnalysis.must_haves?.length ?? 0) > 0 && (
              <div style={{ paddingBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 6 }}>
                  Indispensables
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {typedAnalysis.must_haves!.map((item, i) => (
                    <span key={i} style={{
                      fontSize: 11, fontWeight: 300, padding: "3px 9px", borderRadius: 20,
                      background: "rgba(23,62,49,.06)", border: "0.5px solid rgba(23,62,49,.12)", color: "var(--pine)",
                    }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Note de bas de page */}
        <div style={{
          marginTop: 40, padding: "16px 18px",
          background: "rgba(23,62,49,.03)", borderRadius: 12,
          border: "0.5px solid rgba(23,62,49,.08)",
        }}>
          <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink3)", lineHeight: 1.6, margin: 0 }}>
            Cette analyse ne contient que ce que Candice a déduit — jamais les informations brutes saisies par l&apos;autre personne.
            Tu peux à tout moment demander la révocation de ce partage.
          </p>
        </div>

      </main>
    </div>
  );
}

function Header() {
  return (
    <header style={{
      padding: "18px 24px",
      borderBottom: "0.5px solid var(--line)",
      display: "flex", alignItems: "center",
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
  );
}
