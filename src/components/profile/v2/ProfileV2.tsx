"use client";

// Refonte Profil V2 — assemblage de la fiche pilote, ORDRE DE LA MAQUETTE
// GELÉE : header aplat → résumé → podium → carrousel compris → en
// profondeur (4) → Tes mondes (4) → Ce qui marche → Territoire → Univers →
// Infos pratiques → Pour mieux viser → « Voir ma fiche partagée ».

import { T2, DivTxt2 } from "./ui";
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
import type { ProfileV2Data } from "@/lib/profile/v2-data";

export default function ProfileV2({ data }: { data: ProfileV2Data }) {
  const sec = data.sections;
  const hasDeep = ["what_touches", "feels_loved", "gifts", "avoid"].some(k => sec[k]?.text?.trim());
  const hasMondes = ["restaurants", "travel", "hobbies", "style"].some(k => sec[k]?.text?.trim());

  return (
    <div style={{ background: T2.canvas, minHeight: "100svh", paddingBottom: "calc(92px + env(safe-area-inset-bottom))" }}>
      <HeaderV2
        firstName={data.firstName}
        avatarUrl={data.avatarUrl}
        knowState={data.knowState}
        knowRatio={data.knowRatio}
      />

      <ResumeV2 summary={data.summary} chips={data.summaryChips} summaryLong={data.summaryLong} />

      {data.podium.length > 0 && (
        <>
          <DivTxt2>Ton langage d&apos;attention</DivTxt2>
          <PodiumV2 intro={data.podiumIntro} rows={data.podium} insights={data.insights} />
        </>
      )}

      {data.understoodCards.length > 0 && (
        <>
          <DivTxt2>Ce que Candice a compris</DivTxt2>
          <UnderstoodV2 cards={data.understoodCards} />
        </>
      )}

      {hasDeep && (
        <>
          <DivTxt2>En profondeur</DivTxt2>
          <DeepCard title="Ce qui te touche" section={sec.what_touches} />
          <DeepCard title="Ce qui te fait te sentir aimée" section={sec.feels_loved} />
          <DeepCard title="Ce qui pourrait te faire plaisir" section={sec.gifts} />
          <DeepCard title="Ce qui tombe à côté" section={sec.avoid} warnChips />
        </>
      )}

      {hasMondes && (
        <>
          <DivTxt2>Tes mondes</DivTxt2>
          <DeepCard title="Tes tables" section={sec.restaurants} icon="table" />
          <DeepCard title="Tes voyages" section={sec.travel} icon="globe" />
          <DeepCard title="Tes passions" section={sec.hobbies} icon="music" />
          <DeepCard title="Tes goûts esthétiques" section={sec.style} icon="star" iconChamp />
        </>
      )}

      {data.worksLevels && (
        <>
          <DivTxt2>Ce qui marche avec toi</DivTxt2>
          <WorksV2 levels={data.worksLevels} phrases={data.worksPhrases} />
        </>
      )}

      <TerritoryV2Block territory={data.territory} />

      {(data.brandsCategorized.length > 0 || data.universe || (sec.points_fixes?.chips?.length ?? 0) > 0) && (
        <>
          <DivTxt2>Ton univers</DivTxt2>
          <UniverseV2Block
            universe={data.universe}
            brands={data.brandsCategorized}
            pointsFixes={sec.points_fixes}
          />
        </>
      )}

      <DivTxt2>Infos pratiques</DivTxt2>
      <FactsV2 data={data} />

      {data.nudges.length > 0 && (
        <>
          <DivTxt2>Pour mieux viser</DivTxt2>
          <ViserV2 nudges={data.nudges} />
        </>
      )}

      {/* C7 STOP C : « Voir ma fiche partagée » MASQUÉE jusqu'à la livraison
          de /moi/partage/apercu (Phase D) — aucun CTA mort en prod. */}

      <div style={{ height: 22 }} />
    </div>
  );
}
