import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import Thread, { ThreadItem } from "@/components/presence/Thread";
import PointDivider from "@/components/presence/PointDivider";
import { MyProfile, CadenceLevel } from "@/types";
import ShareButton from "./ShareButton";
import CadenceGlobal from "@/components/dashboard/CadenceGlobal";
import ResumePrompt from "@/components/questionnaire/ResumePrompt";
import LogoutButton from "./LogoutButton";

// ─── Extended type (new questionnaire fields) ─────────────────────────────────

interface FaceResult {
  dominant:   string[];
  secondaire: string[];
  tertiaire:  string[];
}

interface AxisScore {
  score:     number;
  intensity: number;
}

interface ModeResult {
  label:     string;
  intensity: number;
}

interface ImportantDate {
  type:  string;
  label: string;
  date:  string;
}

type ExtendedProfile = MyProfile & {
  attention_breath_text?: string | null;
  attention_reception?:   FaceResult | null;
  attention_expression?:  FaceResult | null;
  temperament_axes?:      Record<string, AxisScore> | null;
  temperament_modes?:     Record<string, ModeResult | null> | null;
  lifestyle_axes?:        Record<string, AxisScore> | null;
  relational_filters?:    Record<string, unknown> | null;
  singularity_answers?:   Record<string, string> | null;
  practical_info?: {
    prenom?:            string;
    sexe?:              string;
    age?:               string;
    profession?:        string;
    allergies?:         string[];
    regime?:            string;
    alcool?:            string;
    mobilite_sante?:    string;
    taille_vetements?:  string;
    taille_chaussures?: string;
    taille_pantalon?:   string;
    taille_bague?:      string;
    parfums?:           string[];
    odeurs_detestees?:  string;
    couleurs_matieres?: string;
    animaux?:           string;
    dates_importantes?: ImportantDate[];
    role_familial?:     string | string[]; // backwards compat
  } | null;
};

// ─── Label maps (old questionnaire — fallback) ────────────────────────────────

const OLD_LABEL: Record<string, Record<string, string>> = {
  love_language: {
    words: "Mots d'affirmation",
    acts:  "Actes de service",
    gifts: "Cadeaux",
    time:  "Temps de qualité",
    touch: "",
  },
  communication_style: {
    direct:     "Direct et concis",
    emotional:  "Émotionnel et expressif",
    analytical: "Analytique et détaillé",
    casual:     "Décontracté et humoristique",
  },
  social_energy: {
    very_introverted: "Très introverti(e)",
    introverted:      "Introverti(e)",
    ambivert:         "Ambiverti(e)",
    extroverted:      "Extraverti(e)",
    very_extroverted: "Très extraverti(e)",
  },
  appreciation_style: {
    verbal:   "Reconnaissance verbale",
    practical: "Aide pratique",
    gifts:    "Cadeaux réfléchis",
    time:     "Temps dédié",
    physical: "Gestes physiques",
  },
  core_values: {
    loyalty:   "Loyauté et confiance",
    growth:    "Croissance et apprentissage",
    fun:       "Fun et expériences",
    stability: "Stabilité",
  },
  gift_preference: {
    experiences: "Expériences",
    physical:    "Cadeaux matériels",
    both:        "Les deux",
  },
  gastronomy: {
    anywhere:   "Aime manger partout",
    gourmet:    "Gourmand(e)",
    fine_dining: "Belles tables",
    passion:    "Passionné(e) de gastronomie",
    functional: "Mange pour vivre",
  },
};

function resolveOld(field: string, value: string | null): string | null {
  if (!value) return null;
  const parts = value.split(",").filter(Boolean)
    .map(v => OLD_LABEL[field]?.[v.trim()] ?? v.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

// ─── Attention dims → French ──────────────────────────────────────────────────

const DIM_FR: Record<string, string> = {
  MOT:   "Mots d'affirmation",
  SER:   "Actes de service",
  CAD_C: "Cadeaux personnalisés",
  CAD_S: "Cadeaux symboliques",
  EXP:   "Expériences partagées",
  GES:   "Petites attentions du quotidien",
  SUR:   "Surprises",
};

function pickDims(face: FaceResult): string[] {
  if (face.dominant.length > 0)   return face.dominant;
  if (face.secondaire.length > 0) return face.secondaire;
  return face.tertiaire.slice(0, 2);
}

function dimsToFr(dims: string[]): string {
  return dims.map(d => DIM_FR[d] ?? d).join(", ");
}

// ─── Temperament axes → readable ─────────────────────────────────────────────

const AXIS_POLES: Record<string, [string, string]> = {
  energieSociale:      ["Extraverti(e) et sociable",        "Introverti(e) et sélectif(-ve)"],
  espaceProsimite:     ["À l'aise avec la proximité physique", "Besoin d'espace et de distance"],
  spontaneiteControle: ["Spontané(e) et flexible",          "Aime planifier et anticiper"],
  communicationStyle:  ["Communication directe et franche", "Communication nuancée et indirecte"],
  expressiviteReserve: ["Expressif(-ve) en émotions",       "Plutôt réservé(e) et pudique"],
  stabiliteNouveaute:  ["Ouvert(e) aux nouveautés",         "Préfère ses repères habituels"],
  sensibiliteDetails:  ["Attentif(-ve) aux petits détails", "Vision d'ensemble plutôt que détails"],
  exigenceStanding:    ["Sens de la qualité et du raffinement", "Simple et accessible avant tout"],
  rapportTemps:        ["La ponctualité est importante",    "Rapport flexible au temps"],
};

function axisLabel(key: string, score: number): string | null {
  if (Math.abs(score) < 30) return null;
  const poles = AXIS_POLES[key];
  if (!poles) return null;
  return score > 0 ? poles[0] : poles[1];
}

// ─── Temperament modes → readable ─────────────────────────────────────────────

const STRESS_FR: Record<string, string> = {
  silence:  "Silence et recul intérieur",
  retrait:  "Besoin de s'isoler un moment",
  parole:   "A besoin d'en parler",
  action:   "Se dépense pour évacuer",
  contrôle: "Cherche à maîtriser son environnement",
};
const CONFLIT_FR: Record<string, string> = {
  direct:        "Confronte directement et clairement",
  temporisateur: "Prend du recul avant d'agir",
  évitant:       "Préfère éviter la confrontation",
  humour:        "Désamorce avec l'humour",
};
const DECISION_FR: Record<string, string> = {
  analytique: "Décide après analyse approfondie",
  rationnel:  "Décide de façon rationnelle",
  intuitif:   "Fait confiance à son intuition",
  social:     "Cherche le consensus autour de soi",
  maturation: "Laisse mûrir avant de décider",
};
const CANAL_FR: Record<string, string> = {
  écrit:      "Canal préféré : l'écrit (SMS, messages)",
  oral:       "Canal préféré : l'échange verbal",
  hybride:    "À l'aise à l'écrit comme à l'oral",
  présentiel: "Préfère le face-à-face",
  flexible:   "Flexible selon le contexte",
};

// ─── Lifestyle axes → readable ────────────────────────────────────────────────

const LIFESTYLE_POLES: Record<string, [string, string]> = {
  foodie:                ["Curieux(-se) gastronomiquement",         "Pragmatique avec la nourriture"],
  premiumSimplicite:     ["Sensible à la qualité et au raffinement","Préfère la simplicité au luxe"],
  experienceObjet:       ["Préfère les expériences aux objets",     "Apprécie les beaux objets"],
  esthetiqueFonctionnel: ["Porté(e) par l'esthétique",              "Fonctionnel avant tout"],
  aventureConfort:       ["Attiré(e) par l'aventure et l'inédit",   "Préfère le confort et le familier"],
  authenticiteLuxe:      ["Authenticité et sincérité avant tout",   "Sensible au luxe et au prestige"],
};

function lifestyleLabel(key: string, score: number): string | null {
  if (Math.abs(score) < 30) return null;
  const poles = LIFESTYLE_POLES[key];
  if (!poles) return null;
  return score > 0 ? poles[0] : poles[1];
}

// ─── Relational filters → readable ───────────────────────────────────────────

const FILTER_FR: Record<string, string> = {
  antiSurprisePublique:    "Préfère éviter les surprises publiques",
  antiSurprisePlanning:    "Aime être prévenu(e) pour les grandes occasions",
  antiSurpriseIntime:      "Peu à l'aise avec les surprises intimes",
  exigenceExecution:       "Attentif(-ve) à la qualité d'exécution",
  ouvertSurprise:          "Ouvert(e) aux belles surprises bien pensées",
  besoinEcoute:            "Se sentir vraiment écouté(e) est essentiel",
  peurOubli:               "Sensible à l'idée d'être oublié(e)",
  besoinAir:               "Besoin d'espace et d'indépendance",
  sensibiliteCritique:     "Sensible aux critiques, même bienveillantes",
  besoinFiabilite:         "La fiabilité et la constance comptent beaucoup",
  besoinProfondeur:        "Les échanges profonds nourrissent vraiment",
  sensibiliteChargeMetale: "Attentif(-ve) à la charge mentale",
};

// ─── Singularity field labels ─────────────────────────────────────────────────

const SINGULARITY_LABELS: Record<string, string> = {
  adore_faire:      "Ce que j'adore faire",
  evite_deteste:    "Ce que j'évite",
  sujets_stimulants:"Sujets qui me stimulent",
  peu_savent:       "Peu de gens savent que…",
  plus_beau_cadeau: "Plus beau cadeau ou moment reçu",
  detail_compris:   "Ce qui me fait me sentir compris(e)",
  marques_lieux:    "Marques et lieux favoris",
  cadeaux_non:      "Cadeaux à éviter",
  envies_reves:     "Envies et rêves du moment",
  remarquer:        "Ce que j'aimerais qu'on remarque",
  sentir_special:   "Ce qui me fait me sentir spécial(e)",
};

// ─── Practical helpers ────────────────────────────────────────────────────────

const REGIME_FR: Record<string, string> = {
  vegetarien: "Végétarien",
  vegan:      "Vegan",
  halal:      "Halal",
  casher:     "Casher",
  autre:      "Régime particulier",
};
const ALCOOL_FR: Record<string, string> = {
  ne_bois_pas:  "Ne boit pas d'alcool",
  eviter_lieux: "Préfère éviter les lieux centrés sur l'alcool",
};
const PARFUM_FR: Record<string, string> = {
  frais:      "Frais", poudre:    "Poudré", boise:    "Boisé",
  floral:     "Floral", gourmand: "Gourmand", ambre:  "Ambré",
  discret:    "Discret", sans_parfum: "Sans parfum",
};
const ALLERGIE_FR: Record<string, string> = {
  gluten:         "Gluten",
  lactose:        "Lactose",
  fruits_a_coque: "Fruits à coque",
  fruits_de_mer:  "Fruits de mer",
  autre:          "Autres allergies",
};
const ROLE_FR: Record<string, string> = {
  conjoint:    "Conjoint·e", ami:         "Ami·e",
  pere:        "Père",       mere:        "Mère",
  enfant:      "Enfant",     frere_soeur: "Frère / Sœur",
  beaux_parents:"Beaux-parents", collegue: "Collègue",
};
const SEXE_FR: Record<string, string> = {
  femme:              "Femme",
  homme:              "Homme",
  non_binaire:        "Non-binaire",
  ne_se_prononce_pas: "",
};

function formatDate(s: string): string {
  if (!s) return "";
  const parts = s.split("-");
  if (parts.length !== 3) return s;
  const months = ["jan.","fév.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
  const m = parseInt(parts[1]) - 1;
  return `${parseInt(parts[2])} ${months[m] ?? ""} ${parts[0]}`;
}

// ─── Portrait helpers ─────────────────────────────────────────────────────────

function K({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: "var(--pine)", fontWeight: 500 }}>
      {children}
    </span>
  );
}

// ─── Cadence ──────────────────────────────────────────────────────────────────

const CADENCE_LABELS_FR: Record<string, { label: string; detail: string }> = {
  discreet:  { label: "Discret",  detail: "1 attention par mois" },
  normal:    { label: "Normal",   detail: "1 attention toutes les 2 semaines" },
  sustained: { label: "Soutenu",  detail: "1 attention par semaine" },
  intense:   { label: "Intense",  detail: "1 attention tous les 3 jours" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MoiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("my_profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = existing as ExtendedProfile | null;
  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "toi";
  const initial = firstName !== "toi" ? firstName[0].toUpperCase() : "M";

  const cadence = profile?.cadence_preference ?? "normal";
  const cadenceInfo = CADENCE_LABELS_FR[cadence] ?? CADENCE_LABELS_FR.normal;

  // ── Attention ──────────────────────────────────────────────────────────────
  const receptionDims = profile?.attention_reception ? pickDims(profile.attention_reception) : [];
  const expressionDims = profile?.attention_expression ? pickDims(profile.attention_expression) : [];
  const hasAttentionData = receptionDims.length > 0 || expressionDims.length > 0;

  // ── Temperament ────────────────────────────────────────────────────────────
  const temperamentTraits: string[] = [];
  if (profile?.temperament_axes) {
    const sorted = Object.entries(profile.temperament_axes)
      .filter(([, v]) => v && Math.abs(v.score) >= 30 && v.intensity > 0)
      .sort(([, a], [, b]) => Math.abs(b!.score) - Math.abs(a!.score))
      .slice(0, 4);
    for (const [key, v] of sorted) {
      const label = v ? axisLabel(key, v.score) : null;
      if (label) temperamentTraits.push(label);
    }
  }

  const modes: { label: string; value: string }[] = [];
  if (profile?.temperament_modes) {
    const m = profile.temperament_modes;
    if (m.stress?.label)   { const v = STRESS_FR[m.stress.label];   if (v) modes.push({ label: "Face au stress",           value: v }); }
    if (m.conflit?.label)  { const v = CONFLIT_FR[m.conflit.label];  if (v) modes.push({ label: "Face au conflit",          value: v }); }
    if (m.decision?.label) { const v = DECISION_FR[m.decision.label];if (v) modes.push({ label: "Prise de décision",        value: v }); }
    if (m.canal?.label)    { const v = CANAL_FR[m.canal.label];      if (v) modes.push({ label: "Canal de communication",   value: v }); }
  }
  const hasTemperamentData = temperamentTraits.length > 0 || modes.length > 0;

  // ── Lifestyle ──────────────────────────────────────────────────────────────
  const lifestyleTraits: string[] = [];
  if (profile?.lifestyle_axes) {
    const sorted = Object.entries(profile.lifestyle_axes)
      .filter(([, v]) => v && Math.abs(v.score) >= 30 && v.intensity > 0)
      .sort(([, a], [, b]) => Math.abs(b!.score) - Math.abs(a!.score))
      .slice(0, 3);
    for (const [key, v] of sorted) {
      const label = v ? lifestyleLabel(key, v.score) : null;
      if (label) lifestyleTraits.push(label);
    }
  }

  const activeFilters: string[] = [];
  const q17Text = typeof profile?.relational_filters?.q17Text === "string"
    ? profile.relational_filters.q17Text as string : "";
  if (profile?.relational_filters) {
    for (const [key, val] of Object.entries(profile.relational_filters)) {
      if (typeof val === "boolean" && val && FILTER_FR[key]) {
        activeFilters.push(FILTER_FR[key]);
      }
    }
  }
  const hasLifestyleData = lifestyleTraits.length > 0 || activeFilters.length > 0 || q17Text.length > 0;

  // ── Singularity ────────────────────────────────────────────────────────────
  const singularityEntries: { label: string; value: string }[] = [];
  if (profile?.singularity_answers) {
    for (const [key, value] of Object.entries(profile.singularity_answers)) {
      if (value?.trim() && SINGULARITY_LABELS[key]) {
        singularityEntries.push({ label: SINGULARITY_LABELS[key], value: value.trim() });
      }
    }
  }

  // ── Practical ──────────────────────────────────────────────────────────────
  const pi = profile?.practical_info;
  const allergiesDisplay = (pi?.allergies ?? []).filter(a => a !== "aucune").map(a => ALLERGIE_FR[a] ?? a).join(", ");
  const regimeDisplay    = pi?.regime ? (REGIME_FR[pi.regime] ?? null) : null;
  const alcoolDisplay    = pi?.alcool ? (ALCOOL_FR[pi.alcool] ?? null) : null;
  const parfumsDisplay   = (pi?.parfums ?? []).map(p => PARFUM_FR[p] ?? p).join(", ");
  const roleArr = Array.isArray(pi?.role_familial)
    ? pi.role_familial as string[]
    : (pi?.role_familial ? [pi.role_familial as string] : []);
  const roleDisplay = roleArr.map(r => ROLE_FR[r] ?? r).filter(Boolean).join(", ") || null;
  const sexeDisplay  = pi?.sexe ? (SEXE_FR[pi.sexe] ?? null) : null;
  const hasPractical = !!pi && (
    !!pi.prenom || !!sexeDisplay || !!pi.age || !!pi.profession ||
    allergiesDisplay.length > 0 || !!regimeDisplay || !!alcoolDisplay ||
    !!pi.taille_vetements || !!pi.taille_chaussures || !!pi.taille_pantalon || !!pi.taille_bague ||
    parfumsDisplay.length > 0 || !!pi.odeurs_detestees || !!pi.couleurs_matieres ||
    !!pi.animaux || (pi.dates_importantes?.length ?? 0) > 0 || !!roleDisplay || !!pi.mobilite_sante
  );

  // ── Portrait-résumé (Mission 3) ────────────────────────────────────────────
  const portraitParts: React.ReactNode[] = [];
  if (temperamentTraits.length > 0) {
    const t0 = temperamentTraits[0];
    const t1 = temperamentTraits[1];
    portraitParts.push(
      <span key="t">
        Tu sembles <K>{t0.toLowerCase()}</K>{t1 ? <>, et <K>{t1.toLowerCase()}</K></> : null}.{" "}
      </span>
    );
  }
  if (receptionDims.length > 0) {
    const dims = dimsToFr(receptionDims);
    portraitParts.push(
      <span key="r">
        Tu te sens aimé·e à travers <K>{dims.toLowerCase()}</K>.{" "}
      </span>
    );
  }
  const singHighlight = singularityEntries.find(e =>
    e.label === SINGULARITY_LABELS.adore_faire || e.label === SINGULARITY_LABELS.envies_reves
  );
  if (singHighlight) {
    const txt = singHighlight.value.length > 60 ? singHighlight.value.slice(0, 57) + "…" : singHighlight.value;
    portraitParts.push(<span key="s">On devine <K>{txt}</K>.</span>);
  } else if (lifestyleTraits.length > 0) {
    portraitParts.push(<span key="l"><K>{lifestyleTraits[0]}</K>.</span>);
  }

  // Dynamic section subtitles
  const temperamentSubtitle = temperamentTraits.slice(0, 2).join(" · ") || null;
  const lifestyleSubtitle   = lifestyleTraits.slice(0, 2).join(" · ") || null;

  // ── Old traits (fallback for pre-V11 profiles) ─────────────────────────────
  const oldTraits = [
    resolveOld("love_language",    profile?.love_language    ?? null),
    resolveOld("social_energy",    profile?.social_energy    ?? null),
    resolveOld("communication_style", profile?.communication_style ?? null),
    resolveOld("appreciation_style",  profile?.appreciation_style  ?? null),
    resolveOld("core_values",      profile?.core_values      ?? null),
    resolveOld("gastronomy",       profile?.gastronomy       ?? null),
    resolveOld("gift_preference",  profile?.gift_preference  ?? null),
  ].filter(Boolean) as string[];

  return (
    <DashboardShell>

      {/* ── Green hero header ── */}
      <div
        className="hero-mass"
        style={{
          padding: "0 0 28px",
          background: "radial-gradient(130% 100% at 26% 0%, #1E4337 0%, #0E2219 44%, #060E0A 100%)",
        }}
      >
        <div style={{ padding: "18px 24px 0" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <span style={{
              fontSize: 12, fontWeight: 300,
              color: "rgba(244,241,232,.5)",
              letterSpacing: ".08em",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              ← Tableau de bord
            </span>
          </Link>
        </div>

        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "radial-gradient(120% 120% at 30% 22%, #FFFFFF, #F1E8D2 60%, #E0CFA6)",
            boxShadow: "0 0 0 1px var(--champ-line)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: 28, fontWeight: 300,
              color: "var(--pine)",
              letterSpacing: "-.01em",
            }}>
              {initial}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 300,
              fontSize: "clamp(22px, 4.5vw, 28px)",
              color: "var(--canvas)",
              letterSpacing: "-.018em",
              lineHeight: 1.15,
            }}>
              {firstName !== "toi" ? firstName : "Mon profil"}
            </div>
            <div style={{
              fontSize: 12, color: "var(--champ-line)",
              fontWeight: 300, marginTop: 5,
              letterSpacing: ".08em", textTransform: "uppercase",
            }}>
              Ton profil
            </div>
          </div>
          {profile && (
            <Link href="/moi/questionnaire" style={{ fontSize: 13, color: "var(--champ)", fontWeight: 400, textDecoration: "none", flexShrink: 0 }}>
              Modifier
            </Link>
          )}
        </div>

        <div style={{ padding: "16px 24px 0" }}>
          <div style={{ height: "0.5px", background: "linear-gradient(90deg, var(--champ-line), transparent)", marginBottom: 14 }} />
          <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(244,241,232,.5)", letterSpacing: ".04em" }}>
            {profile
              ? "Ce que tes proches peuvent consulter pour mieux prendre soin de toi."
              : "Crée ta fiche pour que tes proches sachent comment te faire plaisir."}
          </p>
        </div>
      </div>

      <div className="content-col" style={{ paddingTop: 28 }}>

        {!profile ? (

          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", marginBottom: 24, lineHeight: 1.7 }}>
              Réponds à quelques questions — tes proches pourront consulter ta fiche pour mieux prendre soin de toi.
            </p>
            <ResumePrompt userId={user.id} />
          </div>

        ) : (

          <>

            {/* Narrative breath text */}
            {profile.attention_breath_text && (
              <div style={{
                padding: "20px 22px",
                borderRadius: 16,
                background: "radial-gradient(130% 100% at 26% 0%, #1E4337 0%, #0E2219 44%, #060E0A 100%)",
                marginBottom: 24,
              }}>
                <p style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 300,
                  fontSize: 17,
                  color: "#FAF8F1",
                  lineHeight: 1.65,
                  letterSpacing: "-.012em",
                } as React.CSSProperties}>
                  {profile.attention_breath_text}
                </p>
              </div>
            )}

            {/* ── Portrait-résumé ── */}
            {portraitParts.length > 0 && (
              <div style={{
                padding: "18px 20px",
                borderRadius: 14,
                background: "rgba(23,62,49,.04)",
                border: "0.5px solid rgba(23,62,49,.12)",
                marginBottom: 24,
              }}>
                <p style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: 16,
                  color: "var(--ink-2)",
                  lineHeight: 1.75,
                  letterSpacing: "-.01em",
                } as React.CSSProperties}>
                  {portraitParts}
                </p>
              </div>
            )}

            {/* ── Langages d'attention (nouveau questionnaire) ── */}
            {hasAttentionData && (
              <>
                <PointDivider label="Tes langages d'attention" />
                <Thread>
                  {receptionDims.length > 0 && (
                    <ThreadItem nodeType="anticipe">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
                        Comment tu reçois l'attention
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>
                        {dimsToFr(receptionDims)}
                      </p>
                    </ThreadItem>
                  )}
                  {expressionDims.length > 0 && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
                        Comment tu exprimes l'attention
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>
                        {dimsToFr(expressionDims)}
                      </p>
                    </ThreadItem>
                  )}
                </Thread>
              </>
            )}

            {/* ── Tempérament (nouveau questionnaire) ── */}
            {hasTemperamentData && (
              <>
                <PointDivider label="Ton tempérament" />
                {temperamentSubtitle && (
                  <p style={{ fontSize: 12, fontWeight: 400, color: "var(--ink-3)", marginTop: -10, marginBottom: 14, fontStyle: "italic" }}>
                    {temperamentSubtitle}
                  </p>
                )}
                <Thread>
                  {temperamentTraits.map((trait, i) => (
                    <ThreadItem key={i} nodeType={i === 0 ? "anticipe" : "soft"}>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>
                        {trait}
                      </p>
                    </ThreadItem>
                  ))}
                  {modes.map((mode, i) => (
                    <ThreadItem key={`m${i}`} nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
                        {mode.label}
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>
                        {mode.value}
                      </p>
                    </ThreadItem>
                  ))}
                </Thread>
              </>
            )}

            {/* ── Ce que tu aimes vivre (nouveau questionnaire) ── */}
            {hasLifestyleData && (
              <>
                <PointDivider label="Ce que tu aimes vivre" />
                {lifestyleSubtitle && (
                  <p style={{ fontSize: 12, fontWeight: 400, color: "var(--ink-3)", marginTop: -10, marginBottom: 14, fontStyle: "italic" }}>
                    {lifestyleSubtitle}
                  </p>
                )}
                <Thread>
                  {lifestyleTraits.map((trait, i) => (
                    <ThreadItem key={i} nodeType={i === 0 ? "anticipe" : "soft"}>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>
                        {trait}
                      </p>
                    </ThreadItem>
                  ))}
                  {q17Text.length > 0 && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
                        Ce qu'il vaut mieux éviter
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>
                        {q17Text}
                      </p>
                    </ThreadItem>
                  )}
                  {activeFilters.map((filter, i) => (
                    <ThreadItem key={`f${i}`} nodeType="soft">
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>
                        {filter}
                      </p>
                    </ThreadItem>
                  ))}
                </Thread>
              </>
            )}

            {/* ── Fallback : anciens traits (profils pré-V11) ── */}
            {!hasAttentionData && oldTraits.length > 0 && (
              <>
                <PointDivider label="Ce qui te définit" />
                <Thread>
                  {oldTraits.map((trait, i) => (
                    <ThreadItem key={i} nodeType={i === 0 ? "anticipe" : "soft"}>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>
                        {trait}
                      </p>
                    </ThreadItem>
                  ))}
                </Thread>
              </>
            )}

            {/* ── Tes goûts (champs texte libres — anciens et nouveaux) ── */}
            {(profile.hobbies || profile.favorite_foods || profile.conversation_topics) && (
              <>
                <PointDivider label="Tes goûts" />
                <Thread>
                  {profile.hobbies && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>Loisirs</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{profile.hobbies}</p>
                    </ThreadItem>
                  )}
                  {profile.favorite_foods && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>Cuisine</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{profile.favorite_foods}</p>
                    </ThreadItem>
                  )}
                  {profile.conversation_topics && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>Sujets de conversation</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{profile.conversation_topics}</p>
                    </ThreadItem>
                  )}
                </Thread>
              </>
            )}

            {/* ── Ce qui te rend unique (singularity) ── */}
            {singularityEntries.length > 0 && (
              <>
                <PointDivider label="Ce qui te rend unique" />
                <Thread>
                  {singularityEntries.map((entry, i) => (
                    <ThreadItem key={i} nodeType={i === 0 ? "anticipe" : "soft"}>
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
                        {entry.label}
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>
                        {entry.value}
                      </p>
                    </ThreadItem>
                  ))}
                </Thread>
              </>
            )}

            {/* ── À savoir (ancien questionnaire — fallback) ── */}
            {(profile.things_to_avoid || profile.disliked_activities || profile.disliked_foods || profile.few_know) && (
              <>
                <PointDivider label="À savoir" />
                <Thread>
                  {profile.things_to_avoid && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>À éviter</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{profile.things_to_avoid}</p>
                    </ThreadItem>
                  )}
                  {profile.disliked_foods && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>Régime / allergies</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{profile.disliked_foods}</p>
                    </ThreadItem>
                  )}
                  {profile.few_know && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>Peu de gens savent que…</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{profile.few_know}</p>
                    </ThreadItem>
                  )}
                </Thread>
              </>
            )}

            {/* ── Pratique (nouveau questionnaire) ── */}
            {hasPractical && (
              <>
                <PointDivider label="Pratique" />
                <Thread>
                  {/* Identité */}
                  {(pi?.prenom || sexeDisplay || pi?.age || pi?.profession) && (
                    <ThreadItem nodeType="anticipe">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Identité</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {pi?.prenom     && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{pi.prenom}</p>}
                        {sexeDisplay    && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{sexeDisplay}</p>}
                        {pi?.age        && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{pi.age} ans</p>}
                        {pi?.profession && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{pi.profession}</p>}
                      </div>
                    </ThreadItem>
                  )}
                  {/* Alimentation */}
                  {(allergiesDisplay || regimeDisplay || alcoolDisplay || pi?.mobilite_sante) && (
                    <ThreadItem nodeType="anticipe">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Alimentation & santé</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {allergiesDisplay && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>Allergies : {allergiesDisplay}</p>}
                        {regimeDisplay    && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{regimeDisplay}</p>}
                        {alcoolDisplay    && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{alcoolDisplay}</p>}
                        {pi?.mobilite_sante && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{pi.mobilite_sante}</p>}
                      </div>
                    </ThreadItem>
                  )}
                  {/* Tailles */}
                  {(pi?.taille_vetements || pi?.taille_chaussures || pi?.taille_pantalon || pi?.taille_bague) && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Tailles</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
                        {pi.taille_vetements  && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)" }}>Vêtements : {pi.taille_vetements}</p>}
                        {pi.taille_chaussures && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)" }}>Chaussures : {pi.taille_chaussures}</p>}
                        {pi.taille_pantalon   && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)" }}>Pantalon : {pi.taille_pantalon}</p>}
                        {pi.taille_bague      && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)" }}>Bague : {pi.taille_bague}</p>}
                      </div>
                    </ThreadItem>
                  )}
                  {/* Goûts esthétiques */}
                  {(parfumsDisplay || pi?.odeurs_detestees || pi?.couleurs_matieres) && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Goûts & esthétique</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {parfumsDisplay       && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>Parfums : {parfumsDisplay}</p>}
                        {pi?.odeurs_detestees && <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>Odeurs à éviter : {pi.odeurs_detestees}</p>}
                        {pi?.couleurs_matieres&& <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>Style : {pi.couleurs_matieres}</p>}
                      </div>
                    </ThreadItem>
                  )}
                  {/* Animaux */}
                  {pi?.animaux && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>Animaux</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{pi.animaux}</p>
                    </ThreadItem>
                  )}
                  {/* Rôle familial */}
                  {roleDisplay && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>Situation</p>
                      <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>{roleDisplay}</p>
                    </ThreadItem>
                  )}
                  {/* Dates importantes */}
                  {(pi?.dates_importantes?.length ?? 0) > 0 && (
                    <ThreadItem nodeType="soft">
                      <p style={{ fontSize: 12, fontWeight: 400, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 6 }}>Dates importantes</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {pi!.dates_importantes!.map((d, i) => (
                          <p key={i} style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", lineHeight: 1.6 }}>
                            {d.label}{d.date ? ` — ${formatDate(d.date)}` : ""}
                          </p>
                        ))}
                      </div>
                    </ThreadItem>
                  )}
                </Thread>
              </>
            )}

            {/* ── Partage ── */}
            <div style={{
              margin: "32px 0",
              padding: "22px 22px",
              borderRadius: 16,
              border: "1px solid var(--pine)",
              background: "var(--white)",
            }}>
              <p style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 300,
                fontSize: 19,
                color: "var(--ink)",
                letterSpacing: "-.012em",
                marginBottom: 8,
              } as React.CSSProperties}>
                Partage ta fiche.
              </p>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.6, marginBottom: 18 }}>
                Envoie le lien à tes proches — ils sauront exactement comment te faire plaisir.
              </p>
              <ShareButton userId={user.id} variant="full" />
            </div>

            {/* ── Cadence ── */}
            <PointDivider label="Rythme des attentions" />
            <div style={{ marginBottom: 8 }}>
              <CadenceGlobal initialCadence={cadence as CadenceLevel} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 300, color: "var(--ink-3)", marginBottom: 32, lineHeight: 1.5 }}>
              Actuellement : <span style={{ color: "var(--pine)", fontWeight: 500 }}>{cadenceInfo.label}</span> — {cadenceInfo.detail}
            </p>

            {/* ── Liens secondaires ── */}
            <div style={{ borderTop: "0.5px solid var(--line)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 0 }}>
              <Link
                href="/parametres/notifications"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 300, color: "var(--ink-2)", textDecoration: "none", padding: "12px 0", borderBottom: "0.5px solid var(--line)" }}
              >
                <span>Préférences notifications</span>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>→</span>
              </Link>
              <Link
                href="/parametres/abonnement"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 300, color: "var(--ink-2)", textDecoration: "none", padding: "12px 0" }}
              >
                <span>Abonnement</span>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>→</span>
              </Link>
            </div>

          </>
        )}

        {/* Always-visible: site link + logout */}
        <div style={{ borderTop: "0.5px solid var(--line)", marginTop: 8, paddingTop: 4, paddingBottom: 16 }}>
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 300, color: "var(--ink-2)", textDecoration: "none", padding: "12px 0", borderBottom: "0.5px solid var(--line)" }}
          >
            <span>Retour au site</span>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>→</span>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </DashboardShell>
  );
}
