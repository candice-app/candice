/* Route /design-preview — dev only.
   Compare visuellement avec design/redisign/Candice_Redesign_Mockups_v4.html. */

import { notFound } from "next/navigation";
import "@/styles/tokens.css";
import IconSprite, { Icon } from "@/components/ui/v4/IconSprite";
import Brand from "@/components/ui/v4/Brand";
import Orb from "@/components/ui/v4/Orb";
import BottomNav from "@/components/ui/v4/BottomNav";
import Button from "@/components/ui/v4/Button";
import { Card, GreenPanel } from "@/components/ui/v4/Card";
import Chip from "@/components/ui/v4/Chip";
import ProgressBar from "@/components/ui/v4/ProgressBar";
import ProgressRing, { Point } from "@/components/ui/v4/ProgressRing";
import IntensityRow from "@/components/ui/v4/IntensityRow";
import ConfidenceDots from "@/components/ui/v4/ConfidenceDots";
import Donut, { DonutLegend } from "@/components/ui/v4/Donut";
import Radar, { RadarLegend, RADAR_MATCHING_POLYGONS } from "@/components/ui/v4/Radar";
import ModuleCard from "@/components/ui/v4/ModuleCard";
import IntentCard from "@/components/ui/v4/IntentCard";
import OptionCard from "@/components/ui/v4/OptionCard";
import ThinkingOrb from "@/components/ui/v4/ThinkingOrb";

export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="v4" style={{ background: "#E4E7E1", minHeight: "100vh", padding: "38px 18px 80px", fontFamily: "var(--font-sans)" }}>
      <IconSprite />

      <div style={{ maxWidth: 780, margin: "0 auto 40px" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 36, color: "var(--ink)", letterSpacing: "-.5px" }}>
          Candice — <em style={{ color: "var(--pine)", fontStyle: "italic" }}>design preview V4.</em>
        </h1>
        <p style={{ color: "var(--ink2)", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
          Comparer avec <code>design/redisign/Candice_Redesign_Mockups_v4.html</code>. Dev only.
        </p>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 48 }}>

        {/* ── Brand ── */}
        <Section label="Brand · .brand">
          <div style={{ background: "var(--canvas)", padding: 16, borderRadius: 12 }}>
            <Brand />
          </div>
        </Section>

        {/* ── Orb ── */}
        <Section label="Orb · .orb">
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <Orb size={54} dotSize={13} />
            <Orb size={36} dotSize={10} />
            <Orb size={34} dotSize={9} />
          </div>
        </Section>

        {/* ── ThinkingOrb ── */}
        <Section label="ThinkingOrb · .think-orb">
          <div style={{ background: "var(--aplat)", padding: 48, borderRadius: 16, textAlign: "center" }}>
            <ThinkingOrb />
            <p style={{ fontSize: 10, letterSpacing: "1.8px", textTransform: "uppercase", color: "var(--champ)", fontWeight: 700, marginTop: 24 }}>
              Candice réfléchit…
            </p>
          </div>
        </Section>

        {/* ── BottomNav ── */}
        <Section label="BottomNav · .nav">
          <div style={{ background: "var(--canvas)", borderRadius: 12, overflow: "hidden" }}>
            <BottomNav active="home" />
          </div>
          <div style={{ background: "var(--canvas)", borderRadius: 12, overflow: "hidden", marginTop: 8 }}>
            <BottomNav active="people" />
          </div>
        </Section>

        {/* ── Buttons ── */}
        <Section label="Button · .btn, .btn.ghost, .btn.champ">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}>
            <Button variant="primary"><Icon name="i-spark" size={16} />Voir mon idée pour lui</Button>
            <Button variant="ghost">← Retour</Button>
            <Button variant="champ">Continuer ma fiche</Button>
          </div>
        </Section>

        {/* ── Card ── */}
        <Section label="Card · .card">
          <Card style={{ padding: 16 }}>
            <p style={{ fontSize: 14, color: "var(--ink)", fontFamily: "var(--font-sans)" }}>
              Contenu d'une card standard.
            </p>
          </Card>
        </Section>

        {/* ── GreenPanel ── */}
        <Section label="GreenPanel · .gh">
          <GreenPanel style={{ padding: "16px 20px 19px", borderRadius: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: "1.8px", textTransform: "uppercase", color: "var(--champ)", fontWeight: 700, position: "relative" }}>
              À soutenir
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 19, margin: "9px 0 4px", color: "#fff", position: "relative" }}>
              Sophie traverse une période compliquée
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.86)", lineHeight: 1.45, position: "relative" }}>
              Aplat sapin profond — signature Candice V4.
            </div>
          </GreenPanel>
        </Section>

        {/* ── Chip ── */}
        <Section label="Chip · .chip (variantes)">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip>Défaut</Chip>
            <Chip variant="pine">Actif</Chip>
            <Chip variant="pine-border">+ Ajouter</Chip>
            <Chip variant="sage">Aime la nature</Chip>
            <Chip variant="terra">Café de spécialité</Chip>
            <Chip variant="blue">Cuisine japonaise</Chip>
            <Chip variant="red">N&apos;aime pas le démonstratif</Chip>
            <Chip variant="champ">Envie repérée</Chip>
          </div>
        </Section>

        {/* ── ProgressBar ── */}
        <Section label="ProgressBar · .prog">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <ProgressBar pct={42} />
            <ProgressBar pct={72} />
            <div style={{ background: "var(--aplat)", padding: 16, borderRadius: 10 }}>
              <ProgressBar pct={42} trackColor="rgba(255,255,255,.18)" fillColor="var(--champ)" />
            </div>
          </div>
        </Section>

        {/* ── ProgressRing ── */}
        <Section label="ProgressRing · .ring (sans % affiché)">
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            {/* size 46, r=20, écran 6 — contacts list */}
            <ProgressRing size={46} r={20} strokeWidth={3} pct={56}
              center={<Point />} />
            {/* size 54, r=23, écran 9 — profile header */}
            <ProgressRing size={54} r={23} strokeWidth={3.5} pct={72}
              trackColor="rgba(255,255,255,.25)" fillColor="var(--champ)"
              center={<Point color="#fff" glow="0 0 10px var(--champ)" size={7} />} />
            {/* size 70, r=29, écran 10 — analyse */}
            <ProgressRing size={70} r={29} strokeWidth={4} pct={73}
              center={<Point size={10} />} />
          </div>
        </Section>

        {/* ── IntensityRow ── */}
        <Section label="IntensityRow · .intens (JAMAIS de %)">
          <Card style={{ padding: 16 }}>
            <IntensityRow label="Précision" filled={4} total={5} word="Très présent" />
            <IntensityRow label="Émotion"   filled={2} total={5} word="Modéré"       />
            <IntensityRow label="Surprise"  filled={1} total={5} word="Discret"      />
          </Card>
        </Section>

        {/* ── ConfidenceDots ── */}
        <Section label="ConfidenceDots · .conf">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "var(--ink)", fontFamily: "var(--font-sans)", flex: 1 }}>Connaissant Thibaud, j&apos;en suis sûre</span>
              <ConfidenceDots filled={4} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "var(--ink)", fontFamily: "var(--font-sans)", flex: 1 }}>Je le verrais bien tenté</span>
              <ConfidenceDots filled={3} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "var(--ink)", fontFamily: "var(--font-sans)", flex: 1 }}>Une piste à explorer</span>
              <ConfidenceDots filled={2} />
            </div>
          </div>
        </Section>

        {/* ── Donut ── */}
        <Section label="Donut · langage d'attention (sans chiffre)">
          <Card style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
            <Donut size={140} />
            <DonutLegend />
          </Card>
        </Section>

        {/* ── Radar — single ── */}
        <Section label="Radar · style attentionnel (1 profil)">
          <Card style={{ padding: 14, display: "flex", justifyContent: "center" }}>
            <Radar width={220} height={200} />
          </Card>
        </Section>

        {/* ── Radar — matching (2 profils) ── */}
        <Section label="Radar · matching (2 profils superposés)">
          <Card style={{ padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Radar width={230} height={205} polygons={RADAR_MATCHING_POLYGONS} />
            <RadarLegend items={[{ color: "var(--pine)", label: "Estelle" }, { color: "var(--champ)", label: "Thibaud" }]} />
          </Card>
        </Section>

        {/* ── ModuleCard ── */}
        <Section label="ModuleCard · .mod (dans .card)">
          <Card>
            <ModuleCard iconName="i-spark" title="Ce qui lui fait plaisir" description="On devine qu'il est touché par le temps qu'on lui donne, sans charge mentale." chips={["Nature confortable", "Reconnaissance"]} />
            <ModuleCard iconName="i-block" title="À éviter" description="Le démonstratif, les grandes déclarations, l'inconfort." />
          </Card>
        </Section>

        {/* ── IntentCard ── */}
        <Section label="IntentCard · .intent">
          <IntentCard iconName="i-spark" iconBg="rgba(199,168,90,.2)" iconColor="#9a7d2e" title="J'ai besoin d'une attention" sub="Cadeau, message, geste, expérience — je te propose." />
          <IntentCard iconName="i-news" iconBg="rgba(95,129,144,.14)" iconColor="var(--blue)" title="J'ai une nouvelle sur un proche" sub="Quelque chose a changé, je le garde en tête." />
          <IntentCard iconName="i-chat" iconBg="var(--sage-bg)" iconColor="var(--pine)" title="Je veux parler à Candice" sub="Discussion libre." />
        </Section>

        {/* ── OptionCard ── */}
        <Section label="OptionCard · .opt (sage / default / champ)">
          <OptionCard variant="sage" rank="La plus juste" title="Week-end nature confortable près d'un lac" why="Parce qu'il a parlé de montagne/nature, mais sans inconfort." meta={["~250 €", "2-3 sem."]} actions={[{ label: "Choisir", primary: true }, { label: "Réserver" }, { label: "Remplacer" }]} />
          <OptionCard rank="La plus simple" title="Soirée brasero + panier terroir à la maison" why="Le retour aux sources, sans logistique lourde." meta={["~80 €", "Cette semaine"]} actions={[{ label: "Choisir", primary: true }, { label: "Commander" }, { label: "Remplacer" }]} />
          <OptionCard variant="champ" rank="La plus marquante" title="Lettre courte + journée sans charge mentale" why="Reconnaissance concrète, pas de grand discours." meta={["Gratuit"]} actions={[{ label: "Choisir", primary: true }, { label: "Écrire le message" }]} />
        </Section>

        {/* ── Icons ── */}
        <Section label="Icons · <Icon name=…> (22 symboles)">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, color: "var(--pine)" }}>
            {[
              "i-detail","i-hand","i-gift","i-moment","i-words","i-home","i-people","i-cal",
              "i-profile","i-mic","i-send","i-news","i-bookmark","i-heart","i-mend","i-add",
              "i-chat","i-plus","i-spark","i-check","i-block",
            ].map((n) => (
              <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <Icon name={n} size={22} />
                <span style={{ fontSize: 9, color: "var(--ink3)", fontFamily: "var(--font-sans)" }}>{n}</span>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{
        fontFamily: "var(--font-serif)",
        fontSize: 15,
        color: "var(--pine)",
        marginBottom: 3,
        fontWeight: 500,
      }}>
        {label}
      </div>
      {children}
    </section>
  );
}
