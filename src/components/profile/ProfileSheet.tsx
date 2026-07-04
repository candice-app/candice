// B.2.1 Phase 3 — Composant de rendu UNIQUE de la fiche profil.
// Reproduction fidèle de design/redisign/Candice_Maquette_Profil_REFERENCE_VALIDEE.html.
// Toute visibilité passe par resolveVisibility() (matrice = source unique de vérité).
// JAMAIS de réponse brute : uniquement profile_analysis + scores agrégés + FAITS pratiques.

import Link from "next/link";
import {
  resolveVisibility,
  type ProfileView,
  type SectionKey,
} from "@/lib/profile/visibility";
import type { StyleRadar } from "@/lib/profile/synthesis";

// ─── Data types ───────────────────────────────────────────────────────────────

export interface AnalysisSection { text?: string; chips?: string[] }

export interface ProfileSheetData {
  firstName: string;
  knowledgeLabel: string;          // « Candice te connaît vraiment bien »
  completionRatio: number;         // 0..1 — anneau header (jamais affiché en %)
  gender: string | null;

  // Analyse (profile_analysis)
  summary: string | null;
  summaryThirdPerson: string | null;
  summaryChips: string[];
  insights: string[];
  sections: Record<string, AnalysisSection>;
  modes: { conflit?: string; stress?: string; decision?: string; canal?: string } | null;
  styleRadar: StyleRadar | null;
  entities: { brands?: string[]; places?: string[] } | null;

  // Scores agrégés (my_profile — jamais du brut)
  donutData: Array<{ id: string; weight: number }>;
  donutCenterLabel: string;
  temperamentAxes: Record<string, { score: number; intensity: number }> | null;
  lifestyleAxes: Record<string, { score: number; intensity: number }> | null;

  // FAITS pratiques (faits ≠ brut)
  facts: {
    tailles?: string;              // « M · 39 »
    allergies?: string;            // « fruits à coque »
    regimeAlcool?: string;         // « omnivore · occasionnel »
    parfums?: string;              // « boisé / sucré »
    adresseRenseignee?: boolean;
    animaux?: string;
    datesCles?: string;            // « anniv. 14 mars · +2 »
  };
  art9Filled: boolean;

  // Rangée sécurité contact_consulte (allergies + régime uniquement)
  constraints?: { allergies?: string; regime?: string };

  // Discovery (pilote uniquement)
  discoveryAvailable: boolean;
}

interface Props {
  view: ProfileView;
  data: ProfileSheetData;
  sharedSections?: SectionKey[];
  editHref?: string;               // défaut /moi/questionnaire
}

// ─── 3e personne ──────────────────────────────────────────────────────────────

function to3rdPerson(text: string, gender?: string | null): string {
  const p = gender === "feminine" ? "elle" : "il";
  return text
    .replace(/\btu sembles?\b/gi, `${p} semble`)
    .replace(/\btu es\b/gi, `${p} est`)
    .replace(/\btu as\b/gi, `${p} a`)
    .replace(/\btu apprécies?\b/gi, `${p} apprécie`)
    .replace(/\btu aimes?\b/gi, `${p} aime`)
    .replace(/\btu préfères?\b/gi, `${p} préfère`)
    .replace(/\btu cherches?\b/gi, `${p} cherche`)
    .replace(/\btu exprimes?\b/gi, `${p} exprime`)
    .replace(/\btu te sens\b/gi, `${p} se sent`)
    .replace(/\btu te\b/gi, `${p} se`)
    .replace(/\btu\b/gi, p)
    .replace(/\bton\b/gi, "son").replace(/\bta\b/gi, "sa").replace(/\btes\b/gi, "ses")
    .replace(/\btoi\b/gi, p === "elle" ? "elle" : "lui");
}

// ─── Tokens maquette ──────────────────────────────────────────────────────────

const T = {
  pine: "#173E31", pine2: "#1B4D3E", glow: "#3E7361", sage: "#8DA697",
  champ: "#CDB987", gold: "#C7A85A",
  ink: "#16150E", ink2: "#5F5A51", ink3: "#ABA699",
  line: "rgba(23,62,49,.11)", line2: "rgba(23,62,49,.06)",
  shadow: "0 10px 30px rgba(23,62,49,.07)",
  aplat: "linear-gradient(157deg,#1B4D3E,#0D2A20)",
} as const;

const DONUT_COLORS: Record<string, string> = {
  MOT: "#173E31", CAD: "#3E7361", SER: "#8DA697",
  EXP: "#CDB987", GES: "#B9A77C", SUR: "#E0D3B0",
};
const DONUT_LABELS: Record<string, string> = {
  MOT: "Mots justes", CAD: "Cadeaux", SER: "Services",
  EXP: "Moments", GES: "Esthétique", SUR: "Surprises",
};

// Pastilles pictos (5 familles — jamais d'émoji)
const PASTILLE = {
  pine:  { bg: "#EAF1EC", stroke: "#173E31" },
  sage:  { bg: "#EDF0EB", stroke: "#5C7A66" },
  champ: { bg: "#F5EFE0", stroke: "#A8843A" },
  coral: { bg: "#F7ECEC", stroke: "#A8584A" },
} as const;

// SVG paths des pictos maquette (stroke line style)
const ICONS: Record<string, React.ReactNode> = {
  touch:   <><circle cx="11" cy="11" r="7" /><path d="M16 16l4 4" /><path d="M11 8.5l.9 1.8 1.9.3-1.4 1.3.3 1.9-1.7-.9-1.7.9.3-1.9-1.4-1.3 1.9-.3z" /></>,
  gift:    <><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M4 13h16M12 9v11" /><path d="M12 9s-1.5-4-4-4-2.5 4 0 4 4 0 4 0 1.5-4 4-4 2.5 4 0 4z" /></>,
  table:   <><path d="M3 11h18M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M7 11v8M17 11v8M5 19h14" /></>,
  globe:   <><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /><circle cx="12" cy="12" r="10" /></>,
  music:   <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  home:    <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
  fabric:  <><path d="M12 3v18M5 8l7-5 7 5M5 8v8l7 5 7-5V8" /></>,
  drop:    <><path d="M12 2c2 4 5 5 5 9a5 5 0 0 1-10 0c0-4 3-5 5-9z" /></>,
  person:  <><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0115 0" /></>,
  block:   <><circle cx="12" cy="12" r="8" /><path d="M6.5 6.5l11 11" /></>,
  check:   <><path d="M5 12l5 5 9-10" /></>,
  lock:    <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  eye:     <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  spark:   <><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" /></>,
  arrow:   <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  gear:    <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.5h-4l-.3 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.5h4l.3-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z" /></>,
  shield:  <><path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z" /></>,
};

// ─── Petits composants ────────────────────────────────────────────────────────

// Barème d'upscale validé (corrections Phase 4) : la maquette 392px était
// trop compacte sur device réel — hiérarchie et DA conservées, +13-18%.
function DivTxt({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  const color = gold ? T.gold : T.ink3;
  const lineStyle: React.CSSProperties = { content: '""', flex: 1, height: 1, background: T.line2 };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "24px 0 13px", fontSize: 11.5, letterSpacing: 1.8, textTransform: "uppercase", color, fontWeight: 700 }}>
      <span style={lineStyle} />
      {children}
      <span style={lineStyle} />
    </div>
  );
}

function IcB({ icon, family }: { icon: string; family: keyof typeof PASTILLE }) {
  const p = PASTILLE[family];
  return (
    <span style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 34px", background: p.bg }}>
      <svg viewBox="0 0 24 24" style={{ width: 19, height: 19, fill: "none", stroke: p.stroke, strokeWidth: 1.7 }}>{ICONS[icon]}</svg>
    </span>
  );
}

function Chip({ children, variant }: { children: React.ReactNode; variant?: "pine" | "warm" }) {
  const style: React.CSSProperties =
    variant === "warm"
      ? { background: "#FBF4E6", border: "1px solid #EAD9B0", color: "#8A6A1E" }
      : variant === "pine"
        ? { background: "#EAF1EC", border: `1px solid ${T.line2}`, color: T.pine }
        : { background: "#fff", border: `1px solid ${T.line}`, color: T.ink2 };
  return (
    <span style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12.5, ...style }}>{children}</span>
  );
}

// .card maquette : pas de padding ni margin par défaut ; .mod ajoute padding + mb
function Card({ children, mod = true, style }: { children: React.ReactNode; mod?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${T.line}`, borderRadius: 16, boxShadow: T.shadow,
      ...(mod ? { padding: "15px 16px", marginBottom: 12 } : {}),
      ...style,
    }}>
      {children}
    </div>
  );
}

function ModCard({
  icon, family, title, text, chips, warmChips, italic, firstChipPine,
}: {
  icon: string; family: keyof typeof PASTILLE; title: string;
  text?: string; chips?: string[]; warmChips?: string[]; italic?: boolean;
  firstChipPine?: boolean; // maquette : seul « Cadeaux qui visent juste » a son 1er chip en pine
}) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 15, color: T.ink }}>
        <IcB icon={icon} family={family} /> {title}
      </div>
      {text && (
        <div style={{ fontSize: 13.5, color: T.ink2, margin: "6px 0 0", lineHeight: 1.5, fontStyle: italic ? "italic" : undefined }}>
          {text}
        </div>
      )}
      {((chips?.length ?? 0) > 0 || (warmChips?.length ?? 0) > 0) && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
          {(chips ?? []).map((c, i) => {
            const isWarm = /^(éviter|déteste|peur)/i.test(c);
            return <Chip key={i} variant={isWarm ? "warm" : firstChipPine && i === 0 ? "pine" : undefined}>{c}</Chip>;
          })}
          {(warmChips ?? []).map((c, i) => <Chip key={`w${i}`} variant="warm">{c}</Chip>)}
        </div>
      )}
    </Card>
  );
}

function AxisBar({
  left, right, score,
}: { left: string; right: string; score: number }) {
  // score -100..+100 : négatif = pôle gauche, positif = pôle droit
  const pos = Math.max(4, Math.min(96, 50 + score / 2));
  const leansRight = score > 10;
  const leansLeft = score < -10;
  return (
    <div style={{ margin: "12px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: T.ink2, marginBottom: 4 }}>
        <span style={leansLeft ? { color: T.pine, fontWeight: 600 } : undefined}>{left}</span>
        <span style={leansRight ? { color: T.pine, fontWeight: 600 } : undefined}>{right}</span>
      </div>
      <div style={{ height: 7, borderRadius: 7, background: "#EDF0EB", position: "relative" }}>
        <i style={{ position: "absolute", height: 7, borderRadius: 7, background: "linear-gradient(90deg,#3E7361,#8DA697)", width: `${pos}%` }} />
        <span style={{ position: "absolute", top: -3.5, width: 14, height: 14, borderRadius: "50%", background: "#fff", border: `2px solid ${T.pine}`, boxShadow: "0 1px 3px rgba(0,0,0,.15)", left: `calc(${pos}% - 7px)` }} />
      </div>
    </div>
  );
}

// ─── Visualisations SVG ───────────────────────────────────────────────────────

function Donut({ data, centerLabel }: { data: Array<{ id: string; weight: number }>; centerLabel: string }) {
  const C = 2 * Math.PI * 52; // ≈ 326.7
  let offset = 0;
  const segs = data.map(d => {
    const len = d.weight * C;
    const seg = { id: d.id, len, offset };
    offset += len;
    return seg;
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 15 }}>
      <svg width="124" height="124" viewBox="0 0 140 140" style={{ flex: "0 0 124px" }}>
        {segs.map(s => (
          <circle key={s.id} cx="70" cy="70" r="52" fill="none"
            stroke={DONUT_COLORS[s.id] ?? T.sage} strokeWidth="26"
            strokeDasharray={`${s.len} ${C - s.len}`} strokeDashoffset={-s.offset}
            transform="rotate(-90 70 70)" />
        ))}
        <circle cx="70" cy="70" r="34" fill="#fff" />
        <text x="70" y="66" textAnchor="middle" fontFamily="var(--font-serif)" fontSize="12" fill={T.pine}>{centerLabel}</text>
        <text x="70" y="81" textAnchor="middle" fontSize="8.5" fill="#6F6A61">en tête</text>
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 11px", flex: 1 }}>
        {data.map(d => (
          <span key={d.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: T.ink2 }}>
            <i style={{ width: 8, height: 8, borderRadius: 3, background: DONUT_COLORS[d.id] ?? T.sage }} />
            {DONUT_LABELS[d.id] ?? d.id}
          </span>
        ))}
      </div>
    </div>
  );
}

const RADAR_AXES: Array<{ key: keyof StyleRadar; label: string }> = [
  { key: "precision",  label: "Précision" },
  { key: "emotion",    label: "Émotion" },
  { key: "surprise",   label: "Surprise" },
  { key: "esthetique", label: "Esthétique" },
  { key: "utilite",    label: "Utilité" },
  { key: "temps",      label: "Temps" },
  { key: "discretion", label: "Discrétion" },
];

function radarPoint(i: number, value: number): [number, number] {
  const angle = (Math.PI * 2 * i) / 7 - Math.PI / 2;
  const r = 12 + (value / 100) * 66; // 0 → 12, 100 → 78
  return [100 + r * Math.cos(angle), 100 + r * Math.sin(angle)];
}

function heptagon(radius: number): string {
  return Array.from({ length: 7 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 7 - Math.PI / 2;
    return `${(100 + radius * Math.cos(angle)).toFixed(1)},${(100 + radius * Math.sin(angle)).toFixed(1)}`;
  }).join(" ");
}

const RADAR_LABEL_POS: Array<{ x: number; y: number; anchor: string }> = [
  { x: 100, y: 14,  anchor: "middle" },
  { x: 178, y: 48,  anchor: "start" },
  { x: 186, y: 120, anchor: "start" },
  { x: 150, y: 184, anchor: "start" },
  { x: 38,  y: 184, anchor: "end" },
  { x: 14,  y: 120, anchor: "end" },
  { x: 22,  y: 48,  anchor: "end" },
];

function Radar({ radar }: { radar: StyleRadar }) {
  const pts = RADAR_AXES.map((a, i) => radarPoint(i, radar[a.key])).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <Card mod={false} style={{ padding: 10, display: "flex", justifyContent: "center" }}>
      <svg width="232" height="210" viewBox="0 0 200 200">
        <polygon points={heptagon(78)} fill="none" stroke="rgba(23,62,49,.1)" />
        <polygon points={heptagon(48)} fill="none" stroke="rgba(23,62,49,.08)" />
        <polygon points={pts} fill="rgba(23,62,49,.14)" stroke={T.pine} strokeWidth="1.6" />
        {RADAR_AXES.map((a, i) => (
          <text key={a.key} x={RADAR_LABEL_POS[i].x} y={RADAR_LABEL_POS[i].y}
            textAnchor={RADAR_LABEL_POS[i].anchor as "middle" | "start" | "end"} fontSize="8" fill="#6F6A61">
            {a.label}
          </text>
        ))}
      </svg>
    </Card>
  );
}

// ─── Sections d'affichage nommées ────────────────────────────────────────────

const TEMPERAMENT_AXES_DISPLAY: Array<{ key: string; left: string; right: string }> = [
  { key: "energieSociale",      left: "Introvertie",             right: "Sociable" },
  { key: "espaceProsimite",     left: "Besoin d'espace",         right: "À l'aise en proximité" },
  { key: "spontaneiteControle", left: "Spontanée",               right: "Planifie" },
  { key: "communicationStyle",  left: "Directe",                 right: "Nuancée" },
  { key: "expressiviteReserve", left: "Expressive",              right: "Réservée" },
  { key: "stabiliteNouveaute",  left: "Attachée aux habitudes",  right: "Ouverte au nouveau" },
  { key: "sensibiliteDetails",  left: "Vision d'ensemble",       right: "Attentive aux détails" },
  { key: "exigenceStanding",    left: "Simplicité",              right: "Raffinement" },
  { key: "rapportTemps",        left: "Flexible",                right: "Ponctuelle" },
];

const LIFESTYLE_AXES_DISPLAY: Array<{ key: string; left: string; right: string }> = [
  { key: "foodie",                left: "Pragmatique",  right: "Curieuse en gastronomie" },
  { key: "premiumSimplicite",     left: "Simplicité",   right: "Raffinement" },
  { key: "experienceObjet",       left: "Objets",       right: "Expériences" },
  { key: "esthetiqueFonctionnel", left: "Fonctionnel",  right: "Esthétique" },
  { key: "aventureConfort",       left: "Confort",      right: "Aventure" },
  { key: "authenticiteLuxe",      left: "Luxe",         right: "Authenticité" },
];

const THEME_CARDS: Array<{ section: SectionKey; icon: string; family: keyof typeof PASTILLE; title: string }> = [
  { section: "gifts",       icon: "gift",  family: "pine", title: "Cadeaux qui visent juste" },
  { section: "restaurants", icon: "table", family: "sage", title: "Tes tables" },
  { section: "travel",      icon: "globe", family: "sage", title: "Tes voyages" },
  { section: "hobbies",     icon: "music", family: "sage", title: "Tes passions" },
];

const UNIVERS_CARDS: Array<{ section: SectionKey; icon: string; family: keyof typeof PASTILLE; title: string; italic?: boolean }> = [
  { section: "style",        icon: "fabric", family: "champ", title: "Tes goûts esthétiques" },
  { section: "parfums",      icon: "drop",   family: "champ", title: "Tes parfums" },
  { section: "points_fixes", icon: "person", family: "pine",  title: "Tes points fixes", italic: true },
  { section: "avoid",        icon: "block",  family: "coral", title: "À éviter avec toi" },
];

// Chantier 2.1 — deep-links : chaque CTA ouvre DIRECTEMENT la question
// concernée (l'écran « Comment veux-tu procéder ? » n'apparaît que via
// « Modifier » global). Sections analyse → Discovery ciblé par section.
const SECTION_TO_DISCOVERY: Partial<Record<SectionKey, string>> = {
  what_touches: "attention-dna",
  gifts:        "gifts-what-works",
  restaurants:  "food-restaurants",
  travel:       "travel-style",
  hobbies:      "hobbies-main",
  brands:       "brands-favorites",
  style:        "style-clothing",
  parfums:      "fragrance-family",
  points_fixes: "dreams-current",
  avoid:        "gifts-to-avoid",
};

function sectionCtaHref(section: SectionKey, fallback: string): string {
  const disc = SECTION_TO_DISCOVERY[section];
  return disc ? `/moi/discovery?mode=full&section=${disc}` : fallback;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ProfileSheet({ view, data, sharedSections, editHref = "/moi/questionnaire" }: Props) {
  const show = (s: SectionKey) => resolveVisibility(view, s, sharedSections);

  // Adaptation 2e/3e personne d'un texte de section
  const t = (s: SectionKey, text: string | null | undefined): string | null => {
    if (!text || text.trim().length < 4) return null;
    return show(s).thirdPerson ? to3rdPerson(text, data.gender) : text;
  };

  // Titre de card adapté à la personne (ex. « Tes tables » → « Ses tables »)
  const tt = (s: SectionKey, title: string): string =>
    show(s).thirdPerson
      ? title.replace(/\bTes\b/g, "Ses").replace(/\bTon\b/g, "Son").replace(/\bTa\b/g, "Sa")
          .replace(/\btoi\b/g, data.gender === "feminine" ? "elle" : "lui")
      : title;

  // ── Mode aveugle : un seul écran, aucun contenu ──────────────────────────
  if (view === "aveugle") {
    return (
      <div style={{ minHeight: "100svh", background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
        <div style={{ background: T.aplat, padding: "16px 20px 18px", color: "#fff" }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 21 }}>Fiche protégée</div>
        </div>
        {show("blind_message").shown && (
          <div style={{ maxWidth: 400, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
            <span style={{ width: 52, height: 52, borderRadius: 16, background: "#EAF1EC", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, fill: "none", stroke: T.pine, strokeWidth: 1.7 }}>{ICONS.shield}</svg>
            </span>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: T.ink, lineHeight: 1.4, marginBottom: 12 }}>
              {data.firstName} a choisi de partager sa fiche avec toi sans la rendre visible.
            </p>
            <p style={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.65 }}>
              Mais Candice s&apos;appuie sur tout ce qu&apos;{data.gender === "feminine" ? "elle" : "il"} a confié pour te faire des recommandations très précises pour lui faire plaisir.
              Et de ton côté, n&apos;hésite pas à me donner ce que tu sais déjà sur {data.firstName} : je l&apos;ajoute pour affiner encore.
            </p>
          </div>
        )}
      </div>
    );
  }

  const sec = (key: string): AnalysisSection | undefined => data.sections?.[key];
  const hasSec = (key: string): boolean => {
    const s = sec(key);
    return !!(s?.text && s.text.trim().length > 3) || (s?.chips?.length ?? 0) > 0;
  };

  // CTA « Affiner avec Candice » : pilote seulement — chez un tiers la section est omise
  const emptyCta = (label: string, href?: string) =>
    view === "pilote" ? (
      <Card style={{ borderStyle: "dashed", boxShadow: "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 13.5, color: T.ink2 }}>{label}</span>
          <Link href={href ?? editHref} style={{ padding: "13px 4px", margin: "-13px -4px", textDecoration: "none", display: "inline-flex", flexShrink: 0 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: T.pine, whiteSpace: "nowrap" }}>
              Affiner avec Candice →
            </span>
          </Link>
        </div>
      </Card>
    ) : null;

  const lead = show("lead").thirdPerson
    ? (data.summaryThirdPerson ?? (data.summary ? to3rdPerson(data.summary, data.gender) : null))
    : data.summary;

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100svh" }}>

      {/* ── Header gh ── */}
      <div style={{ background: T.aplat, color: "#fff", position: "relative", overflow: "hidden", padding: "16px 20px 18px" }}>
        <div style={{ position: "absolute", right: -22, top: -44, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle,rgba(205,185,135,.30),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {show("header_ring").shown && (
              <div style={{ position: "relative", width: 54, height: 54, flex: "0 0 54px" }}>
                <svg width="54" height="54">
                  <circle cx="27" cy="27" r="23" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="3.5" />
                  <circle cx="27" cy="27" r="23" fill="none" stroke={T.champ} strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray="144.5" strokeDashoffset={144.5 * (1 - Math.max(0.04, Math.min(1, data.completionRatio)))}
                    transform="rotate(-90 27 27)" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", boxShadow: `0 0 10px ${T.champ}` }} />
                </div>
              </div>
            )}
            {show("header_identity").shown && (
              <div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 23 }}>{data.firstName}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.82)" }}>{data.knowledgeLabel}</div>
              </div>
            )}
          </div>
          {show("header_actions").shown && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* zone de tap ≥44px (padding transparent + marge négative) — visuel maquette inchangé */}
              <Link href={editHref} style={{ padding: "9px 4px", margin: "-9px -4px", textDecoration: "none", display: "inline-flex" }}>
                <span style={{ fontSize: 12.5, border: "1px solid rgba(255,255,255,.4)", color: "#fff", padding: "7px 12px", borderRadius: 999 }}>
                  Modifier
                </span>
              </Link>
              <Link href="/parametres" aria-label="Réglages" style={{ padding: 6, margin: -6, display: "inline-flex" }}>
                <span style={{ width: 32, height: 32, borderRadius: 999, border: "1px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: "#fff", fill: "none", strokeWidth: 1.6 }}>{ICONS.gear}</svg>
                </span>
              </Link>
            </div>
          )}
        </div>
        {show("header_share_chips").shown && (
          <div style={{ display: "flex", gap: 7, marginTop: 12, position: "relative", flexWrap: "wrap" }}>
            <Link href="/moi/partage/apercu" style={{ padding: "10px 3px", margin: "-10px -3px", textDecoration: "none", display: "inline-flex" }}>
              <span style={{ fontSize: 12, color: "#fff", background: "rgba(255,255,255,.14)", padding: "6px 12px", borderRadius: 999 }}>
                Voir ma fiche partagée
              </span>
            </Link>
            <Link href="/moi/partage" style={{ padding: "10px 3px", margin: "-10px -3px", textDecoration: "none", display: "inline-flex" }}>
              <span style={{ fontSize: 12, color: T.champ, background: "rgba(255,255,255,.12)", padding: "6px 12px", borderRadius: 999 }}>
                Partager →
              </span>
            </Link>
          </div>
        )}
      </div>

      <div style={{ padding: "16px 20px 24px" }}>

        {/* ── Lead + topchips (SOCLE) ── */}
        {show("lead").shown && (lead
          ? <p style={{ fontFamily: "var(--font-serif)", fontSize: 17, lineHeight: 1.55, color: T.ink }}>{lead}</p>
          : emptyCta("Candice n'a pas encore assez d'éléments pour te résumer."))}
        {show("topchips").shown && data.summaryChips.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 11 }}>
            {data.summaryChips.map((c, i) => (
              <span key={i} style={{ fontSize: 12.5, padding: "6px 12px", borderRadius: 999, background: "#EAF1EC", color: T.pine, border: `1px solid ${T.line2}` }}>{c}</span>
            ))}
          </div>
        )}

        {/* ── Donut (SOCLE) ── */}
        {show("donut").shown && (data.donutData.length > 0 ? (
          <>
            <DivTxt>{show("donut").thirdPerson ? "Son langage d'attention" : "Ton langage d'attention"}</DivTxt>
            <Card mod={false}>
              <Donut data={data.donutData} centerLabel={data.donutCenterLabel} />
            </Card>
          </>
        ) : (view === "pilote" && (
          <>
            <DivTxt>Ton langage d&apos;attention</DivTxt>
            {emptyCta("Réponds au questionnaire attention pour révéler ton langage.", "/moi/questionnaire?part=attention")}
          </>
        )))}

        {/* ── Radar + Ce qui te touche ── */}
        {show("radar").shown && data.styleRadar && (
          <>
            <DivTxt>{show("radar").thirdPerson ? "Son style attentionnel" : "Ton style attentionnel"}</DivTxt>
            <Radar radar={data.styleRadar} />
          </>
        )}
        {show("what_touches").shown && (hasSec("what_touches") ? (
          <ModCard icon="touch" family="pine" title={tt("what_touches", "Ce qui te touche")}
            text={t("what_touches", sec("what_touches")?.text) ?? undefined}
            chips={sec("what_touches")?.chips} />
        ) : emptyCta("Précise ce qui te touche vraiment.", sectionCtaHref("what_touches", editHref)))}

        {/* ── Ce que Candice a compris ── */}
        {show("insights").shown && data.insights.length > 0 && (
          <>
            <DivTxt gold>Ce que Candice a compris</DivTxt>
            {data.insights.map((ins, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "13px 15px", background: "#fff", border: `1px solid ${T.line}`, borderRadius: 14, marginBottom: 9, boxShadow: T.shadow }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: "#E7F0EB", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 26px" }}>
                  <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: T.pine, fill: "none", strokeWidth: 2 }}>{ICONS.check}</svg>
                </span>
                <p style={{ fontSize: 14, lineHeight: 1.45, color: T.ink }}>
                  {show("insights").thirdPerson ? to3rdPerson(ins, data.gender) : ins}
                </p>
              </div>
            ))}
          </>
        )}

        {/* ── Tempérament : 9 axes + modes ── */}
        {show("temperament_axes").shown && data.temperamentAxes && (
          <>
            <DivTxt>{show("temperament_axes").thirdPerson ? "Son tempérament" : "Ton tempérament"}</DivTxt>
            <Card>
              {TEMPERAMENT_AXES_DISPLAY.map(a => {
                const v = data.temperamentAxes![a.key];
                if (!v) return null;
                return <AxisBar key={a.key} left={a.left} right={a.right} score={v.score} />;
              })}
              {show("temperament_modes").shown && data.modes && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, paddingTop: 11, borderTop: `1px solid ${T.line2}` }}>
                  {([["Conflit", data.modes.conflit], ["Stress", data.modes.stress], ["Décision", data.modes.decision], ["Canal", data.modes.canal]] as const)
                    .filter(([, val]) => val && val.trim().length > 0)
                    .map(([label, val]) => (
                      <span key={label} style={{ fontSize: 12.5, padding: "7px 12px", borderRadius: 10, background: "#EDF0EB", color: T.pine2, display: "flex", alignItems: "center", gap: 6 }}>
                        <b style={{ fontWeight: 600 }}>{label} :</b> {val}
                      </span>
                    ))}
                </div>
              )}
            </Card>
          </>
        )}

        {/* ── Art de vivre : 6 axes ── */}
        {show("lifestyle_axes").shown && data.lifestyleAxes && (
          <>
            <DivTxt>{show("lifestyle_axes").thirdPerson ? "Son art de vivre" : "Ton art de vivre"}</DivTxt>
            <Card>
              {LIFESTYLE_AXES_DISPLAY.map(a => {
                const v = data.lifestyleAxes![a.key];
                if (!v) return null;
                return <AxisBar key={a.key} left={a.left} right={a.right} score={v.score} />;
              })}
            </Card>
          </>
        )}

        {/* ── Ce qui te fait vibrer ── */}
        {THEME_CARDS.some(c => show(c.section).shown) && (
          <>
            <DivTxt>{show("gifts").thirdPerson ? "Ce qui lui fait vibrer" : "Ce qui te fait vibrer"}</DivTxt>
            {THEME_CARDS.map(c => {
              if (!show(c.section).shown) return null;
              if (!hasSec(c.section)) return <span key={c.section}>{emptyCta(`Complète « ${c.title} » avec Candice.`, sectionCtaHref(c.section, editHref))}</span>;
              return (
                <ModCard key={c.section} icon={c.icon} family={c.family} title={tt(c.section, c.title)}
                  text={t(c.section, sec(c.section)?.text) ?? undefined}
                  chips={sec(c.section)?.chips}
                  firstChipPine={c.section === "gifts"} />
              );
            })}
          </>
        )}

        {/* ── Ton univers ── */}
        {(show("brands").shown || UNIVERS_CARDS.some(c => show(c.section).shown)) && (
          <>
            <DivTxt>{show("brands").thirdPerson ? "Son univers" : "Ton univers"}</DivTxt>
            {show("brands").shown && (((data.entities?.brands?.length ?? 0) > 0 || hasSec("brands")) ? (
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 15, color: T.ink }}>
                  <IcB icon="home" family="champ" /> {show("brands").thirdPerson ? "Marques & lieux où il/elle se sent bien" : "Marques & lieux où tu te sens toi"}
                </div>
                {t("brands", sec("brands")?.text) && (
                  <div style={{ fontSize: 13.5, color: T.ink2, margin: "6px 0 0", lineHeight: 1.5 }}>{t("brands", sec("brands")?.text)}</div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 9, alignItems: "center" }}>
                  {[...(data.entities?.brands ?? []), ...(data.entities?.places ?? [])].slice(0, 6).map((b, i) => (
                    <span key={i} style={{ height: 32, padding: "0 12px", borderRadius: 7, background: "#fff", border: `1px solid ${T.line}`, display: "flex", alignItems: "center", fontFamily: "var(--font-serif)", fontSize: 13, color: T.ink2 }}>
                      {b}
                    </span>
                  ))}
                </div>
              </Card>
            ) : emptyCta("Ajoute les marques et lieux où tu te sens bien.", sectionCtaHref("brands", editHref)))}
            {UNIVERS_CARDS.map(c => {
              if (!show(c.section).shown) return null;
              if (!hasSec(c.section)) return <span key={c.section}>{emptyCta(`Complète « ${c.title} » avec Candice.`, sectionCtaHref(c.section, editHref))}</span>;
              return (
                <ModCard key={c.section} icon={c.icon} family={c.family} title={tt(c.section, c.title)}
                  text={t(c.section, sec(c.section)?.text) ?? undefined}
                  chips={sec(c.section)?.chips} italic={c.italic} />
              );
            })}
          </>
        )}

        {/* ── Contraintes à respecter (contact_consulte seulement) ── */}
        {show("constraints_row").shown && (data.constraints?.allergies || data.constraints?.regime) && (
          <>
            <DivTxt>Contraintes à respecter</DivTxt>
            <Card>
              {data.constraints?.allergies && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${T.line2}`, fontSize: 14 }}>
                  <span style={{ color: T.ink2 }}>Allergies</span>
                  <span style={{ color: T.ink, fontWeight: 500 }}>{data.constraints.allergies}</span>
                </div>
              )}
              {data.constraints?.regime && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", fontSize: 14 }}>
                  <span style={{ color: T.ink2 }}>Régime</span>
                  <span style={{ color: T.ink, fontWeight: 500 }}>{data.constraints.regime}</span>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ── Infos pratiques (faits) ── */}
        {(show("facts_tailles").shown || show("facts_alimentaire").shown || show("facts_parfums").shown
          || show("facts_adresse").shown || show("facts_animaux").shown || show("facts_dates").shown || show("art9").shown) && (
          <>
            <DivTxt>Infos pratiques</DivTxt>
            <Card>
              {view === "pilote" && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: T.gold, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 9 }}>
                  <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, stroke: T.gold, fill: "none", strokeWidth: 1.8 }}>{ICONS.lock}</svg>
                  visible par toi seul · réglable au partage
                </div>
              )}
              {(() => {
                const rows = ([
                  ["facts_tailles",     "Vêtements / chaussures",       data.facts.tailles],
                  ["facts_alimentaire", "Allergies",                    data.facts.allergies],
                  ["facts_alimentaire", "Régime · alcool",              data.facts.regimeAlcool],
                  ["facts_parfums",     "Parfums aimés / détestés",     data.facts.parfums],
                  ["facts_adresse",     "Adresse de livraison",         data.facts.adresseRenseignee ? "renseignée ✓" : undefined],
                  ["facts_animaux",     "Animaux",                      data.facts.animaux],
                  ["facts_dates",       "Dates clés",                   data.facts.datesCles],
                ] as Array<[SectionKey, string, string | undefined]>)
                  .filter(([s, , v]) => show(s).shown && v);
                return rows.map(([key, label, value], i) => {
                  const rowStyle: React.CSSProperties = {
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "11px 0", fontSize: 14,
                    borderBottom: i === rows.length - 1 ? "none" : `1px solid ${T.line2}`, // .fact:last-child
                  };
                  // Chantier 2.3(c) : tap sur « Dates clés » → édition directe (bloc Agenda)
                  if (key === "facts_dates" && view === "pilote") {
                    return (
                      <Link key={i} href="/moi/questionnaire?part=practical7#agenda"
                        style={{ ...rowStyle, textDecoration: "none" }}>
                        <span style={{ color: T.ink2 }}>{label}</span>
                        <span style={{ color: T.ink, fontWeight: 500, textAlign: "right" }}>{value} <span style={{ color: T.ink3 }}>›</span></span>
                      </Link>
                    );
                  }
                  return (
                    <div key={i} style={rowStyle}>
                      <span style={{ color: T.ink2 }}>{label}</span>
                      <span style={{ color: T.ink, fontWeight: 500, textAlign: "right" }}>{value}</span>
                    </div>
                  );
                });
              })()}
              {show("art9").shown && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 9, paddingTop: 10, borderTop: `1px dashed ${T.line}` }}>
                  <div style={{ fontSize: 13, color: T.ink2 }}>
                    <b style={{ color: T.pine }}>Religion · handicap · santé</b><br />
                    <span style={{ fontSize: 11.5 }}>Sensible — tu choisis de renseigner ou non</span>
                  </div>
                  {/* Décision Estelle (iii) : pas de CTA « Compléter » tant que le lot
                      Art.9/RGPD n'a pas livré sa vraie question cible — un CTA qui
                      n'atterrit pas sur sa question exacte est interdit (règle 2.1). */}
                  {data.art9Filled && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: T.pine, border: `1px solid ${T.line}`, borderRadius: 999, padding: "4px 10px" }}>
                      <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: T.pine, fill: "none", strokeWidth: 1.6 }}>{ICONS.eye}</svg> Masquer
                    </span>
                  )}
                </div>
              )}
            </Card>
          </>
        )}

        {/* ── Ligne "non partagé" discrète (invite_filtre) ── */}
        {show("not_shared_notice").shown && (
          <p style={{ fontSize: 11.5, color: T.ink3, fontStyle: "italic", textAlign: "center", margin: "18px 0 4px", lineHeight: 1.5 }}>
            {data.firstName} a choisi de ne pas tout partager avec toi. Candice connaît le reste
            et s&apos;en sert pour te faire les recommandations les plus justes.
          </p>
        )}

        {/* ── Discovery ── */}
        {show("discovery").shown && data.discoveryAvailable && (
          <div style={{ background: "linear-gradient(135deg,#F6F1E4,#fff)", border: "1px solid #EAD9B0", borderRadius: 16, padding: 14, margin: "6px 0 10px" }}>
            <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: T.gold, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, stroke: T.gold, fill: "none", strokeWidth: 1.8 }}>{ICONS.spark}</svg>
              Pour affiner
            </div>
            <h4 style={{ fontFamily: "var(--font-serif)", fontSize: 16, color: T.pine, margin: "6px 0 3px" }}>Une petite question ?</h4>
            <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.5 }}>
              Plus ton profil est complet, plus Candice vise juste pour toi et tes proches.
            </p>
            <Link href="/moi/discovery?mode=full" style={{ marginTop: 10, padding: "8px 3px", margin: "10px -3px -8px", textDecoration: "none", display: "inline-flex" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.pine, color: "#fff", fontSize: 11.5, fontWeight: 600, padding: "7px 13px", borderRadius: 999 }}>
                Répondre <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, stroke: T.champ, fill: "none", strokeWidth: 1.8 }}>{ICONS.arrow}</svg>
              </span>
            </Link>
          </div>
        )}

        {/* ── Bouton Affiner ── */}
        {show("edit_button").shown && (
          <Link href={editHref} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 15, background: T.pine, color: "#fff", fontWeight: 600, fontSize: 15, width: "100%", boxShadow: "0 6px 16px rgba(23,62,49,.18)", marginTop: 8, textDecoration: "none" }}>
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: T.champ, fill: "none", strokeWidth: 1.8 }}>{ICONS.spark}</svg>
            Affiner mon profil
          </Link>
        )}
      </div>
    </div>
  );
}
