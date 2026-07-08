// Phase D — « Voir ma fiche partagée » : préview CONDENSÉE du pilote
// (overlay de la maquette gelée). Ce que voient tes proches — jamais
// l'intime. Construite sur les DÉFAUTS de la matrice (sections cochées
// par défaut) ; la vraie vue tierce reste la fiche complète filtrée.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import V4Shell from "@/components/layout/V4Shell";
import { PROFILE_ROW_SELECT, type ProfileRow } from "@/lib/profile/sheet-data";
import { buildProfileV2Data, ANALYSIS_ROW_V2_SELECT, type AnalysisRowV2 } from "@/lib/profile/v2-data";
import { thirdPersonV2 } from "@/lib/profile/v2-tiers";
import { WORKS_LABELS, WORKS_LEVEL_LABELS, type WorksKey } from "@/lib/profile/v2-metrics";

const T = {
  ink: "#16150E", ink2: "#5F5A51", ink3: "#ABA699", pine: "#173E31", pine2: "#1B4D3E",
  line: "rgba(23,62,49,.11)", shadow: "0 10px 30px rgba(23,62,49,.07)",
  aplat: "linear-gradient(157deg,#1D5040,#0C2A20)",
} as const;

function Tag({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <span style={{
      fontSize: 12.5, fontWeight: 500, padding: "6px 11px", borderRadius: 9,
      color: warn ? "#7a4b1e" : T.pine2,
      background: warn ? "rgba(205,185,135,.22)" : "rgba(23,62,49,.06)",
    }}>
      {children}
    </span>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      margin: "12px 16px 0", background: "#fff", border: `1px solid ${T.line}`,
      borderRadius: 16, padding: 15, boxShadow: T.shadow,
    }}>
      <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 15.5, fontWeight: 500, marginBottom: 7 }}>{title}</h4>
      {children}
    </div>
  );
}

export default async function ApercuPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/moi/partage/apercu");

  const [{ data: profileRaw }, { data: analysisRaw }] = await Promise.all([
    supabase.from("my_profile").select(PROFILE_ROW_SELECT).eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_analysis").select(ANALYSIS_ROW_V2_SELECT)
      .eq("user_id", user.id).is("contact_id", null).maybeSingle(),
  ]);
  const profile = profileRaw as unknown as ProfileRow | null;
  if (!profile) redirect("/moi");

  const firstName = profile.practical_info?.prenom?.trim()
    || (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] || "Toi";

  const data = thirdPersonV2(buildProfileV2Data({
    profile,
    analysis: analysisRaw as unknown as AnalysisRowV2 | null,
    firstName,
    nudges: [],
    hasAvailableQuestions: false,
    avatarUrl: null,
  }));

  const dominants = data.podium.filter(r => r.intensity === "dominant" || r.intensity === "tres_present").slice(0, 3);
  const prefs = data.worksLevels
    ? (Object.entries(data.worksLevels) as Array<[WorksKey, string]>)
        .filter(([, lvl]) => lvl === "tres_fort" || lvl === "fort")
        .slice(0, 4)
    : [];
  const avoidChips = (data.sections.avoid?.chips ?? []).slice(0, 4);

  return (
    <V4Shell active="profile" noBrandBar>
      <div style={{ paddingBottom: 40 }}>
        {/* ovTop maquette */}
        <div style={{
          position: "sticky", top: 0, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "calc(14px + env(safe-area-inset-top)) 18px 12px",
          background: "rgba(254,254,251,.94)", backdropFilter: "blur(12px)", zIndex: 5,
        }}>
          <b style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 500 }}>Ta fiche, vue par un proche</b>
          <Link href="/moi" style={{ fontSize: 13.5, fontWeight: 600, color: T.pine, minHeight: 44, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            Fermer
          </Link>
        </div>

        {/* Bannière aplat */}
        <div style={{
          margin: "8px 16px 0", background: T.aplat, color: "#fff", borderRadius: 16,
          padding: "14px 15px", fontSize: 13, lineHeight: 1.5, position: "relative", overflow: "hidden",
        }}>
          <span style={{ position: "absolute", right: -20, top: -40, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle,rgba(205,185,135,.35),transparent 70%)" }} />
          Tes proches voient une <b style={{ color: "#EBDDB6" }}>version utile, jamais intime</b>.
          Candice garde les détails et les utilise pour les aider à viser juste.
        </div>

        <Sec title="Résumé">
          {data.summary
            ? <p style={{ fontFamily: "var(--font-serif)", fontSize: 15, lineHeight: 1.5, color: T.ink, margin: 0 }}>{data.summary}</p>
            : <p style={{ fontSize: 13, fontStyle: "italic", color: T.ink3, margin: 0 }}>Ton résumé apparaîtra ici dès que ta fiche sera analysée.</p>}
        </Sec>

        {dominants.length > 0 && (
          <Sec title="Son langage d'attention">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
              {dominants.map(d => <Tag key={d.dim}>{d.label}</Tag>)}
            </div>
          </Sec>
        )}

        {prefs.length > 0 && (
          <Sec title="Préférences clés">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
              {prefs.map(([k, lvl]) => (
                <Tag key={k}>{WORKS_LABELS[k]}{lvl === "tres_fort" ? ` — ${WORKS_LEVEL_LABELS.tres_fort.toLowerCase()}` : ""}</Tag>
              ))}
            </div>
          </Sec>
        )}

        {avoidChips.length > 0 && (
          <Sec title="À éviter">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
              {avoidChips.map((c, i) => <Tag key={i} warn>{c}</Tag>)}
            </div>
          </Sec>
        )}

        {/* Placeholder « non partagé » de la maquette — microcopy verrouillé */}
        <Sec title="Ses envies">
          <p style={{ fontSize: 12.5, fontStyle: "italic", color: T.ink3, lineHeight: 1.5, margin: 0 }}>
            {firstName} a choisi de ne pas partager cette section avec toi.
            Candice la connaît et s&apos;en sert pour te faire les recommandations les plus justes.
          </p>
        </Sec>
      </div>
    </V4Shell>
  );
}
