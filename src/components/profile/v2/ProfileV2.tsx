// Refonte Profil V2 — assemblage de la fiche, ORDRE DE LA MAQUETTE GELÉE.
// Phase D : le MÊME composant sert le pilote ET les vues tierces
// (invite_filtre / contact_consulte / aveugle) via la matrice V2.
// SERVEUR : seules les feuilles interactives sont hydratées.
// Placeholders « non partagé » conservés (option A : microcopy complet sur
// le premier, version courte ensuite).

import { T2, DivTxt2, Mod, Icon, Tags } from "./ui";
import HeaderV2 from "./Header";
import ResumeV2 from "./Resume";
import PodiumV2 from "./Podium";
import UnderstoodV2 from "./Understood";
import DeepCard from "./DeepCard";
import WorksV2 from "./Works";
import TerritoryV2Block from "./Territory";
import UniverseV2Block from "./Universe";
import FactsV2 from "./Facts";
import ViserV2 from "./Viser";
import BottomCtas from "./BottomCtas";
import Link from "next/link";
import { resolveVisibility, type ProfileView, type SectionKey } from "@/lib/profile/visibility";
import type { ProfileV2Data } from "@/lib/profile/v2-data";
import type { WishlistItemV1 } from "@/app/moi/wishlist/WishlistClient";

export default function ProfileV2({
  data,
  view = "pilote",
  sharedSections,
  wishlistItems = [],
}: {
  data: ProfileV2Data;
  view?: ProfileView;
  sharedSections?: SectionKey[];
  wishlistItems?: WishlistItemV1[];
}) {
  const show = (s: SectionKey) => resolveVisibility(view, s, sharedSections);
  const tiers = view !== "pilote";
  const fem = data.gender === "feminine";
  const pr = fem ? "elle" : "il";

  // ── Mode aveugle : un seul écran, aucun contenu (message verrouillé) ─────
  if (view === "aveugle") {
    return (
      <div style={{ minHeight: "100svh", background: T2.canvas }}>
        <div style={{ background: T2.aplat, padding: "16px 20px 18px", color: "#fff" }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 21 }}>Fiche protégée</div>
        </div>
        {show("blind_message").shown && (
          <div style={{ maxWidth: 400, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: T2.ink, lineHeight: 1.4, marginBottom: 12 }}>
              {data.firstName} a choisi de partager sa fiche avec toi sans la rendre visible.
            </p>
            <p style={{ fontSize: 14, color: T2.ink2, lineHeight: 1.65 }}>
              Mais Candice s&apos;appuie sur tout ce qu&apos;{pr} a confié pour te faire des
              recommandations très précises pour lui faire plaisir. Et de ton côté,
              n&apos;hésite pas à me donner ce que tu sais déjà sur {data.firstName} :
              je l&apos;ajoute pour affiner encore.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Placeholders « non partagé » (option A conservée) ─────────────────────
  let notSharedSeq = 0;
  const notSharedBody = () => {
    const full = notSharedSeq === 0;
    notSharedSeq += 1;
    return (
      <p style={{ fontSize: 13.5, color: T2.ink3, fontStyle: "italic", lineHeight: 1.55 }}>
        {data.firstName} a choisi de ne pas partager cette section avec toi.
        {full && <>{" "}Candice la connaît et s&apos;en sert pour te faire les recommandations les plus justes.</>}
      </p>
    );
  };
  const notSharedCard = (s: SectionKey, title?: string, label?: string) =>
    show(s).notShared ? (
      <>
        {label && <DivTxt2>{label}</DivTxt2>}
        <Mod style={{ background: "#FBFBF7", boxShadow: "none" }}>
          {title && <div style={{ fontWeight: 600, fontSize: 15, color: T2.ink2, marginBottom: 5 }}>{title}</div>}
          {notSharedBody()}
        </Mod>
      </>
    ) : null;

  const sec = data.sections;
  const deepDefs: Array<{ key: SectionKey; a: string; title: string; warn?: boolean }> = [
    { key: "deep_touch", a: "what_touches", title: tiers ? `Ce qui ${fem ? "la" : "le"} touche` : "Ce qui te touche" },
    { key: "deep_loved", a: "feels_loved", title: tiers ? `Ce qui ${fem ? "la" : "le"} fait se sentir ${fem ? "aimée" : "aimé"}` : "Ce qui te fait te sentir aimée" },
    { key: "deep_pleasure", a: "gifts", title: tiers ? "Ce qui pourrait lui faire plaisir" : "Ce qui pourrait te faire plaisir" },
    { key: "deep_miss", a: "avoid", title: "Ce qui tombe à côté", warn: true },
  ];
  const mondeDefs: Array<{ key: SectionKey; a: string; title: string; icon: string; champ?: boolean }> = [
    { key: "monde_tables", a: "restaurants", title: tiers ? "Ses tables" : "Tes tables", icon: "table" },
    { key: "monde_voyages", a: "travel", title: tiers ? "Ses voyages" : "Tes voyages", icon: "globe" },
    { key: "monde_passions", a: "hobbies", title: tiers ? "Ses passions" : "Tes passions", icon: "music" },
    { key: "monde_gouts", a: "style", title: tiers ? "Ses goûts esthétiques" : "Tes goûts esthétiques", icon: "star", champ: true },
  ];

  const hasDeep = deepDefs.some(d => (show(d.key).shown && sec[d.a]?.text?.trim()) || show(d.key).notShared);
  const hasMondes = mondeDefs.some(d => (show(d.key).shown && sec[d.a]?.text?.trim()) || show(d.key).notShared);
  const universShown = show("univers").shown
    && (data.brandsCategorized.length > 0 || data.universe || (sec.points_fixes?.chips?.length ?? 0) > 0);
  const factsAny = ["facts_tailles", "facts_alimentaire", "facts_parfums", "facts_adresse", "facts_animaux", "facts_dates", "facts_mobilite", "art9"]
    .some(k => show(k as SectionKey).shown);
  const factsNotShared = ["facts_tailles", "facts_alimentaire", "facts_parfums", "facts_animaux", "facts_dates", "facts_mobilite"]
    .some(k => show(k as SectionKey).notShared);

  return (
    <div style={{ background: T2.canvas, minHeight: "100svh", paddingBottom: "calc(92px + env(safe-area-inset-bottom))" }}>
      {view === "pilote" ? (
        <HeaderV2
          firstName={data.firstName}
          avatarUrl={data.avatarUrl}
          knowState={data.knowState}
          knowRatio={data.knowRatio}
        />
      ) : (
        <HeaderTiers firstName={data.firstName} avatarUrl={data.avatarUrl} view={view} />
      )}

      {show("summary").shown && (
        <ResumeV2
          summary={data.summary}
          chips={data.summaryChips}
          summaryLong={data.summaryLong}
          sheetTitle={tiers ? "Son analyse" : "Ton analyse"}
        />
      )}

      {show("podium").shown && data.podium.length > 0 && (
        <>
          <DivTxt2>{tiers ? "Son langage d'attention" : "Ton langage d'attention"}</DivTxt2>
          <PodiumV2
            intro={data.podiumIntro}
            rows={data.podium}
            insights={data.insights}
            title={tiers ? `Ce qui ${fem ? "la" : "le"} fait se sentir ${fem ? "aimée" : "aimé"}` : undefined}
          />
        </>
      )}

      {show("understood").shown && data.understoodCards.length > 0 && (
        <>
          <DivTxt2>Ce que Candice a compris</DivTxt2>
          <UnderstoodV2 cards={data.understoodCards} />
        </>
      )}
      {notSharedCard("understood", undefined, "Ce que Candice a compris")}

      {hasDeep && (
        <>
          <DivTxt2>En profondeur</DivTxt2>
          {deepDefs.map(d => {
            if (show(d.key).notShared) return <span key={d.key}>{notSharedCard(d.key, d.title)}</span>;
            if (!show(d.key).shown) return null;
            return <DeepCard key={d.key} title={d.title} section={sec[d.a]} warnChips={d.warn} />;
          })}
        </>
      )}

      {hasMondes && (
        <>
          <DivTxt2>{tiers ? "Ses mondes" : "Tes mondes"}</DivTxt2>
          {mondeDefs.map(d => {
            if (show(d.key).notShared) return <span key={d.key}>{notSharedCard(d.key, d.title)}</span>;
            if (!show(d.key).shown) return null;
            return <DeepCard key={d.key} title={d.title} section={sec[d.a]} icon={d.icon} iconChamp={d.champ} />;
          })}
        </>
      )}

      {show("works").shown && data.worksLevels && (
        <>
          <DivTxt2>{tiers ? `Ce qui marche avec ${fem ? "elle" : "lui"}` : "Ce qui marche avec toi"}</DivTxt2>
          <WorksV2 levels={data.worksLevels} phrases={data.worksPhrases} />
        </>
      )}
      {notSharedCard("works", undefined, tiers ? `Ce qui marche avec ${fem ? "elle" : "lui"}` : "Ce qui marche avec toi")}

      {show("territoire").shown && (
        <TerritoryV2Block territory={data.territory} eyebrow={tiers ? "Son territoire idéal" : "Ton territoire idéal"} />
      )}
      {notSharedCard("territoire", undefined, tiers ? "Son territoire idéal" : "Ton territoire idéal")}

      {universShown && (
        <>
          <DivTxt2>{tiers ? "Son univers" : "Ton univers"}</DivTxt2>
          <UniverseV2Block universe={data.universe} brands={data.brandsCategorized} pointsFixes={sec.points_fixes} />
        </>
      )}
      {notSharedCard("univers", undefined, tiers ? "Son univers" : "Ton univers")}

      {/* Wishlist partagée (revirement validé) — liste simple lisible */}
      {show("wishlist").shown && wishlistItems.length > 0 && (
        <>
          <DivTxt2>Sa wishlist</DivTxt2>
          <Mod>
            {wishlistItems.map((it, i) => (
              <div key={it.id} style={{
                padding: "11px 0", borderBottom: i === wishlistItems.length - 1 ? "none" : `1px solid ${T2.line2}`,
              }}>
                <span style={{ fontSize: 14.5, fontWeight: 550, color: T2.ink }}>{it.title}</span>
                {it.note && <span style={{ display: "block", fontSize: 13, fontWeight: 300, color: T2.ink2, marginTop: 2, lineHeight: 1.5 }}>{it.note}</span>}
                {it.url && (
                  <a href={it.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: T2.pine, fontWeight: 600, marginTop: 3, textDecoration: "none", minHeight: 32 }}>
                    Voir le lien <Icon name="chevron" size={12} />
                  </a>
                )}
              </div>
            ))}
          </Mod>
        </>
      )}
      {notSharedCard("wishlist", undefined, "Sa wishlist")}

      {factsAny && (
        <>
          <DivTxt2>Infos pratiques</DivTxt2>
          {view === "pilote"
            ? <FactsV2 data={data} />
            : <FactsTiers data={data} notShared={factsNotShared} notSharedBody={notSharedBody} />}
        </>
      )}
      {!factsAny && factsNotShared && (
        <>
          <DivTxt2>Infos pratiques</DivTxt2>
          <Mod style={{ background: "#FBFBF7", boxShadow: "none" }}>{notSharedBody()}</Mod>
        </>
      )}

      {show("viser").shown && data.nudges.length > 0 && (
        <>
          <DivTxt2>Pour mieux viser</DivTxt2>
          <ViserV2 nudges={data.nudges} />
        </>
      )}

      {/* « Voir ma fiche partagée » — réactivée (C7) : /moi/partage/apercu livré */}
      {view === "pilote" && (
        <Link href="/moi/partage/apercu" style={{
          margin: "18px 14px 0", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12, border: `1px solid ${T2.line}`,
          borderRadius: 7, background: "#fff", padding: "14px 16px",
          boxShadow: T2.shadow, minHeight: 54, textDecoration: "none", color: "inherit",
        }}>
          <span style={{ fontSize: 14, fontWeight: 550 }}>
            Voir ma fiche partagée
            <small style={{ display: "block", fontSize: 12.5, color: T2.ink3, fontWeight: 400, marginTop: 2 }}>
              Ce que voient tes proches — jamais l&apos;intime
            </small>
          </span>
          <Icon name="chevron" size={15} style={{ color: T2.pine }} />
        </Link>
      )}

      {show("bottom_ctas").shown && <BottomCtas />}

      <div style={{ height: 22 }} />
    </div>
  );
}

// ── Header tiers : aplat, prénom du partageur, sous-titre adapté ─────────────
function HeaderTiers({ firstName, avatarUrl, view }: { firstName: string; avatarUrl: string | null; view: ProfileView }) {
  return (
    <div style={{
      background: T2.aplat, color: "#fff", position: "relative", overflow: "hidden",
      borderRadius: "0 0 30px 30px", boxShadow: "0 18px 40px rgba(23,62,49,.24)",
      padding: "calc(22px + env(safe-area-inset-top)) 22px 26px",
    }}>
      <div style={{ position: "absolute", right: -30, top: -56, width: 230, height: 230, borderRadius: "50%", background: "radial-gradient(circle,rgba(205,185,135,.38),transparent 70%)", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 19, marginBottom: 20, position: "relative" }}>
        <span style={{ width: 17, height: 17, borderRadius: "50%", background: "radial-gradient(circle at 42% 34%,#F4E7C4,#CDB987 58%,#9A7D2E)", boxShadow: "0 0 12px rgba(205,185,135,.75)" }} />
        Candice
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 17, position: "relative" }}>
        <div style={{
          width: 76, height: 76, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-serif)", fontSize: 32, color: T2.pine,
          background: avatarUrl ? "#fff" : "radial-gradient(circle at 35% 30%,#fff,#FBF8F0)",
          border: "1px solid rgba(205,185,135,.55)", boxShadow: "0 8px 22px rgba(0,0,0,.18)",
        }}>
          {avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (firstName[0]?.toUpperCase() ?? "")}
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 34, letterSpacing: 0.2, margin: 0 }}>{firstName}</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.84)", marginTop: 7 }}>
            {view === "contact_consulte" ? "Ce que Candice retient" : "Fiche partagée avec toi"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Facts tiers : lignes statiques, uniquement le partagé ────────────────────
function FactsTiers({
  data, notShared, notSharedBody,
}: { data: ProfileV2Data; notShared: boolean; notSharedBody: () => React.ReactNode }) {
  const f = data.facts;
  const alimentation = [f.regimeAlcool, f.allergies ? `allergies : ${f.allergies}` : null].filter(Boolean).join(" · ");
  const rows: Array<[string, string, string?]> = [];
  if (f.tailles) rows.push(["Tailles", f.tailles]);
  if (alimentation) rows.push(["Alimentation", alimentation]);
  if (f.animaux) rows.push(["Animaux", f.animaux]);
  if (f.parfums) rows.push(["Parfums", f.parfums.split(" / ")[0] ?? f.parfums,
    f.parfums.includes(" / ") ? `éviter : ${f.parfums.split(" / ")[1]}` : undefined]);
  if (f.mobilite) rows.push(["Mobilité & confort", f.mobilite.split(" · ")[0] ?? f.mobilite, data.mobiliteDetail?.intensite ?? undefined]);
  if (f.datesCles) rows.push(["Dates clés", f.datesCles]);

  return (
    <Mod>
      {rows.map(([k, v, sub], i) => (
        <div key={k} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          padding: "12px 0", minHeight: 50,
          borderBottom: i === rows.length - 1 && !notShared ? "none" : `1px solid ${T2.line2}`,
        }}>
          <span style={{ fontSize: 13.5, color: T2.ink2 }}>{k}</span>
          <span style={{ fontSize: 14, fontWeight: 550, textAlign: "right", color: T2.ink }}>
            {v}
            {sub && <small style={{ display: "block", fontSize: 12.5, color: T2.ink3, fontWeight: 400 }}>{sub}</small>}
          </span>
        </div>
      ))}
      {notShared && (
        <div style={rows.length > 0 ? { marginTop: 9, paddingTop: 10, borderTop: `1px dashed ${T2.line}` } : undefined}>
          {notSharedBody()}
        </div>
      )}
    </Mod>
  );
}
