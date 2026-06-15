import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import V4Shell from "@/components/layout/V4Shell";
import { Icon } from "@/components/ui/v4/IconSprite";
import { MyProfile, CadenceLevel } from "@/types";
import ShareButton from "./ShareButton";
import ResumePrompt from "@/components/questionnaire/ResumePrompt";
import LogoutButton from "./LogoutButton";
import ProfileSection from "@/components/profile/ProfileSection";
import AffinerCard, { type CompletionLevel } from "@/components/profile/AffinerCard";
import GenderModal from "@/components/profile/GenderModal";
import { getAvailableDiscoverySections, type ProfileAnalysisSnapshot } from "@/lib/discovery/engine";

// ─── Extended profile type ────────────────────────────────────────────────────

interface FaceResult { dominant: string[]; secondaire: string[]; tertiaire: string[]; }
interface AxisScore   { score: number; intensity: number; }
interface ModeResult  { label: string; intensity: number; }
interface ImportantDate { type: string; label: string; date: string; recurrence?: string; importance?: string; rappel?: string; }

type ExtendedProfile = MyProfile & {
  grammatical_gender?:     string | null;
  style_gender_orientation?: string[] | null;
  attention_breath_text?:  string | null;
  attention_reception?:    FaceResult | null;
  attention_expression?:   FaceResult | null;
  temperament_axes?:       Record<string, AxisScore> | null;
  temperament_modes?:      Record<string, ModeResult | null> | null;
  lifestyle_axes?:         Record<string, AxisScore> | null;
  relational_filters?:     Record<string, unknown> | null;
  singularity_answers?:    Record<string, string> | null;
  discovery_answers?:      Record<string, string | string[]> | null;
  practical_info?: {
    prenom?: string; sexe?: string; age?: string; profession?: string;
    allergies?: string[]; regime?: string; alcool?: string; mobilite_sante?: string;
    taille_vetements?: string; taille_chaussures?: string;
    taille_pantalon?: string; taille_bague?: string;
    parfums?: string[]; odeurs_detestees?: string; couleurs_matieres?: string;
    animaux?: string; dates_importantes?: ImportantDate[];
    role_familial?: string | string[];
  } | null;
};

// ─── Label maps ───────────────────────────────────────────────────────────────

const DIM_FR: Record<string, string> = {
  MOT: "Mots d'affirmation", SER: "Actes de service",
  CAD_C: "Cadeaux personnalisés", CAD_S: "Cadeaux symboliques",
  EXP: "Expériences partagées", GES: "Petites attentions", SUR: "Surprises",
};

const AXIS_POLES: Record<string, [string, string]> = {
  energieSociale:      ["Extraverti(e) et sociable",         "Introverti(e) et sélectif(-ve)"],
  espaceProsimite:     ["À l'aise avec la proximité physique","Besoin d'espace et de distance"],
  spontaneiteControle: ["Spontané(e) et flexible",           "Aime planifier et anticiper"],
  communicationStyle:  ["Communication directe et franche",  "Communication nuancée et indirecte"],
  expressiviteReserve: ["Expressif(-ve) en émotions",        "Plutôt réservé(e) et pudique"],
  stabiliteNouveaute:  ["Ouvert(e) aux nouveautés",          "Préfère ses repères habituels"],
  sensibiliteDetails:  ["Attentif(-ve) aux petits détails",  "Vision d'ensemble plutôt que détails"],
  exigenceStanding:    ["Sens de la qualité et du raffinement","Simple et accessible avant tout"],
  rapportTemps:        ["La ponctualité est importante",     "Rapport flexible au temps"],
};
const LIFESTYLE_POLES: Record<string, [string, string]> = {
  foodie:                ["Curieux(-se) gastronomiquement",         "Pragmatique avec la nourriture"],
  premiumSimplicite:     ["Sensible à la qualité et au raffinement","Préfère la simplicité au luxe"],
  experienceObjet:       ["Préfère les expériences aux objets",     "Apprécie les beaux objets"],
  esthetiqueFonctionnel: ["Porté(e) par l'esthétique",              "Fonctionnel avant tout"],
  aventureConfort:       ["Attiré(e) par l'aventure et l'inédit",   "Préfère le confort et le familier"],
  authenticiteLuxe:      ["Authenticité et sincérité avant tout",   "Sensible au luxe et au prestige"],
};

// Applique le genre grammatical sur les labels avec accord parenthésé ou ·
function applyGender(text: string, gender: string | null | undefined): string {
  const isFem = gender === "feminine";
  return text
    .replace(/\(-ve\)/g, isFem ? "ve" : "")
    .replace(/\(-se\)/g, isFem ? "se" : "")
    .replace(/\(e\)/g,   isFem ? "e"  : "")
    .replace(/·ne\b/g,   isFem ? "ne" : "")
    .replace(/·e\b/g,    isFem ? "e"  : "");
}
const CONFLIT_FR:  Record<string, string> = {
  direct: "Confronte directement", temporisateur: "Prend du recul avant d'agir",
  évitant: "Préfère éviter la confrontation", humour: "Désamorce avec l'humour",
};
const PARFUM_FR:   Record<string, string> = {
  frais: "Frais", poudre: "Poudré", boise: "Boisé", floral: "Floral",
  gourmand: "Gourmand", ambre: "Ambré", discret: "Discret", sans_parfum: "Sans parfum",
};
const ALLERGIE_FR: Record<string, string> = {
  gluten: "Gluten", lactose: "Lactose",
  fruits_a_coque: "Fruits à coque", fruits_de_mer: "Fruits de mer", autre: "Autres allergies",
};
const REGIME_FR: Record<string, string> = {
  vegetarien: "Végétarien", vegan: "Vegan", halal: "Halal", casher: "Casher", autre: "Régime particulier",
};
const ALCOOL_FR:  Record<string, string> = {
  ne_bois_pas: "Ne boit pas d'alcool", eviter_lieux: "Évite les lieux centrés alcool",
};
const FILTER_SURPRISE_FR: Record<string, string> = {
  ouvertSurprise: "Ouvert(e) aux belles surprises bien pensées",
  antiSurprisePublique: "Préfère éviter les surprises publiques",
  antiSurprisePlanning: "Aime être prévenu(e) pour les grandes occasions",
  antiSurpriseIntime: "Peu à l'aise avec les surprises intimes",
};
const GIFT_PREF_FR: Record<string, string> = {
  experiences: "Expériences", physical: "Cadeaux matériels", both: "Les deux",
};
const GASTRONOMY_FR: Record<string, string> = {
  anywhere: "Mange partout avec plaisir", gourmet: "Gourmand(e)",
  fine_dining: "Apprécie les belles tables", passion: "Passionné(e) de gastronomie",
  functional: "Mange pour vivre",
};

// Discovery answer label maps
const DISCOVERY_OPTS: Record<string, Record<string, string>> = {
  'attention.reception': { MOT: "Mots d'affirmation", SER: "Actes de service", CAD_C: "Cadeaux", EXP: "Temps partagé", GES: "Petites attentions", SUR: "Surprises" },
  'gifts.what_works':    { experiences: "Expériences", personalized: "Personnalisé", practical: "Utile et beau", beauty: "Beauté / bien-être", culture: "Livres / culture", handmade: "Fait main", surprise: "Surprise totale" },
  'style.clothing':      { classic: "Classique", boho: "Bohème", minimal: "Minimaliste", chic: "Chic parisien", casual: "Décontracté", sport: "Sportswear", trendy: "Mode / tendance" },
  'food.restaurants':    { bistro: "Bistrot convivial", gastronomic: "Gastronomique", casual_good: "Bonne adresse décontractée", world: "Cuisine du monde", veggie: "Végétarien / healthy", anything_good: "Tout si c'est bon" },
  'fragrance.family':    { floral: "Fleuri", fresh: "Frais / citrus", woody: "Boisé", oriental: "Oriental / Ambré", powder: "Poudré", gourmand: "Gourmand", light: "Discret", none: "Sans parfum" },
  'travel.style':        { adventure: "L'aventure", culture: "La culture", relax: "Le repos total", nature: "La nature", city: "Les villes animées", gastro: "La gastronomie locale", luxury: "Le luxe discret" },
  'surprises.preference':{ loves: "Adore les surprises", depends: "Selon le contexte", notice: "Préfère être prévenu·e", dislikes: "Les surprises créent du stress" },
  'conflicts.style':     { direct: "Communication directe", space: "Besoin de recul d'abord", avoids: "Préfère éviter", humor: "Désamorce avec l'humour" },
  'practical.constraints': { vegetarian: "Végétarien·ne", vegan: "Vegan", halal: "Halal", casher: "Casher", food_allergy: "Allergie alimentaire", no_alcohol: "Sans alcool", mobility: "Contrainte de mobilité" },
};

function resolveDiscovery(key: string, val: unknown): string[] {
  if (!val) return [];
  const map = DISCOVERY_OPTS[key] ?? {};
  const arr = Array.isArray(val) ? val as string[] : [val as string];
  return arr.map(v => map[v] ?? v).filter(v => v && v !== 'none');
}

// ─── Computation helpers ──────────────────────────────────────────────────────

function pickDims(face: FaceResult): string[] {
  if (face.dominant.length > 0) return face.dominant;
  if (face.secondaire.length > 0) return face.secondaire;
  return face.tertiaire.slice(0, 2);
}
function dimsToFr(dims: string[]): string {
  return dims.map(d => DIM_FR[d] ?? d).join(", ");
}

function axisLabel(key: string, score: number, gender?: string | null): string | null {
  if (Math.abs(score) < 30) return null;
  const poles = AXIS_POLES[key];
  if (!poles) return null;
  return applyGender(score > 0 ? poles[0] : poles[1], gender);
}
function lifestyleLabel(key: string, score: number, gender?: string | null): string | null {
  if (Math.abs(score) < 30) return null;
  const poles = LIFESTYLE_POLES[key];
  if (!poles) return null;
  return applyGender(score > 0 ? poles[0] : poles[1], gender);
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  const months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return `Mis à jour le ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Section builder ──────────────────────────────────────────────────────────

interface SectionDef {
  icon: string; title: string;
  summary: string | null; chips: string[];
  filled: boolean; editHref: string;
  ctaLabel: string; ctaHref?: string; sectionKey: string;
}

function buildSections(profile: ExtendedProfile, discoveryAvailable: Set<string>): SectionDef[] {
  const ag = (t: string) => applyGender(t, profile.grammatical_gender);
  const discoveryHref = (sk: string): string | undefined =>
    discoveryAvailable.has(sk) ? `/moi/discovery?mode=full&section=${sk}` : undefined;
  const da = profile.discovery_answers ?? {};
  const pi = profile.practical_info;
  const sing = profile.singularity_answers ?? {};
  const filters = profile.relational_filters ?? {};
  const q17Text = typeof filters.q17Text === "string" ? filters.q17Text : "";

  // Attention dims
  const receptionDims = profile.attention_reception ? pickDims(profile.attention_reception) : [];
  const expressionDims = profile.attention_expression ? pickDims(profile.attention_expression) : [];
  const hasAttentionData = receptionDims.length > 0 || expressionDims.length > 0;

  // Temperament
  const temperamentTraits: string[] = [];
  if (profile.temperament_axes) {
    Object.entries(profile.temperament_axes)
      .filter(([,v]) => v && Math.abs(v.score) >= 30 && v.intensity > 0)
      .sort(([,a],[,b]) => Math.abs(b!.score) - Math.abs(a!.score))
      .slice(0, 4)
      .forEach(([key, v]) => { const l = v ? axisLabel(key, v.score, profile.grammatical_gender) : null; if (l) temperamentTraits.push(l); });
  }
  const conflitMode = profile.temperament_modes?.conflit?.label ?? null;

  // Lifestyle
  const lifestyleTraits: string[] = [];
  if (profile.lifestyle_axes) {
    Object.entries(profile.lifestyle_axes)
      .filter(([,v]) => v && Math.abs(v.score) >= 30 && v.intensity > 0)
      .sort(([,a],[,b]) => Math.abs(b!.score) - Math.abs(a!.score))
      .slice(0, 3)
      .forEach(([key, v]) => { const l = v ? lifestyleLabel(key, v.score, profile.grammatical_gender) : null; if (l) lifestyleTraits.push(l); });
  }

  // Surprise filters
  const surpriseChips: string[] = Object.entries(FILTER_SURPRISE_FR)
    .filter(([k]) => typeof filters[k] === "boolean" && filters[k])
    .map(([,v]) => ag(v));

  // Constraints
  const allergiesChips = (pi?.allergies ?? []).filter(a => a !== "aucune").map(a => ALLERGIE_FR[a] ?? a);
  const regimeChip = pi?.regime ? (REGIME_FR[pi.regime] ?? null) : null;
  const alcoolChip = pi?.alcool ? (ALCOOL_FR[pi.alcool] ?? null) : null;

  // Discovery: surprises
  const daSurprise = resolveDiscovery('surprises.preference', da['surprises.preference']).map(ag);
  // Discovery: conflicts
  const daConflicts = resolveDiscovery('conflicts.style', da['conflicts.style']);

  return [
    // 1 — Langage d'attention
    {
      icon: "❤️", title: "Langage d'attention",
      filled: hasAttentionData || !!profile.love_language,
      chips: receptionDims.length > 0 ? receptionDims.map(d => DIM_FR[d]) : (profile.love_language?.split(",").filter(Boolean) ?? []),
      summary: receptionDims.length > 0
        ? `Tu te sens ${ag("aimé·e")} surtout par ${dimsToFr(receptionDims).toLowerCase()}.${profile.attention_breath_text ? " " + profile.attention_breath_text.slice(0, 100) + (profile.attention_breath_text.length > 100 ? "…" : "") : ""}`
        : profile.love_language ? `Tu apprécies les ${profile.love_language.split(",")[0]} avant tout.` : null,
      editHref: "/moi/questionnaire?part=attention",
      ctaLabel: "Approfondir mon langage d'attention",
      sectionKey: "attention-reception",
    },
    // 2 — Ce qui me touche
    {
      icon: "✨", title: "Ce qui me touche",
      filled: temperamentTraits.length > 0,
      chips: temperamentTraits.slice(0, 3),
      summary: temperamentTraits.length >= 2
        ? `Tu sembles ${temperamentTraits[0].toLowerCase()}, et ${temperamentTraits[1].toLowerCase()}.`
        : temperamentTraits.length === 1 ? `Tu sembles ${temperamentTraits[0].toLowerCase()}.` : null,
      editHref: "/moi/questionnaire?part=temperament2",
      ctaLabel: "Préciser mon énergie relationnelle",
      sectionKey: "temperament-energy",
    },
    // 3 — Ce qui me fait me sentir aimé·e
    {
      icon: "🌟", title: ag("Ce qui me fait me sentir aimé·e"),
      filled: hasAttentionData || !!profile.appreciation_style,
      chips: expressionDims.length > 0 ? expressionDims.map(d => DIM_FR[d]) : [],
      summary: expressionDims.length > 0
        ? `Tu exprimes l'attention à travers ${dimsToFr(expressionDims).toLowerCase()}.`
        : profile.appreciation_style ? `Les ${profile.appreciation_style.split(",")[0]} comptent particulièrement.` : null,
      editHref: "/moi/questionnaire?part=attention",
      ctaLabel: "Approfondir ce qui me touche",
      sectionKey: "attention-expression",
    },
    // 4 — Ce qui pourrait te faire plaisir
    {
      icon: "🎁", title: "Ce qui pourrait te faire plaisir",
      filled: !!profile.gift_preference || !!sing.plus_beau_cadeau || !!da['gifts.what_works'],
      chips: da['gifts.what_works']
        ? resolveDiscovery('gifts.what_works', da['gifts.what_works'])
        : profile.gift_preference ? (GIFT_PREF_FR[profile.gift_preference] ? [GIFT_PREF_FR[profile.gift_preference]] : []) : [],
      summary: sing.plus_beau_cadeau
        ? `« ${sing.plus_beau_cadeau.length > 80 ? sing.plus_beau_cadeau.slice(0, 80) + "…" : sing.plus_beau_cadeau} »`
        : da['gifts.what_works']
        ? `Tu apprécies surtout ${resolveDiscovery('gifts.what_works', da['gifts.what_works']).slice(0,2).join(", ").toLowerCase()}.`
        : profile.gift_preference === "experiences" ? "Tu préfères les expériences aux objets."
        : profile.gift_preference === "physical" ? "Tu apprécies les beaux objets bien choisis."
        : profile.gift_preference === "both" ? "Tu aimes autant les expériences que les cadeaux matériels." : null,
      editHref: "/moi/discovery?mode=full",
      ctaLabel: discoveryAvailable.has('gifts-what-works') ? "Affiner ce qui te fait plaisir" : "",
      ctaHref: discoveryHref('gifts-what-works'),
      sectionKey: "gifts-what-works",
    },
    // 5 — À éviter
    {
      icon: "🚫", title: "À éviter",
      filled: !!profile.things_to_avoid || !!sing.cadeaux_non || !!q17Text || !!da['gifts.to_avoid'],
      chips: [profile.things_to_avoid, sing.cadeaux_non, q17Text, da['gifts.to_avoid'] as string]
        .filter(Boolean).flatMap(s => (s as string).split(/[,;·]/).map(p => p.trim()).filter(p => p.length > 2 && p.length < 40))
        .slice(0, 5),
      summary: (da['gifts.to_avoid'] as string) || profile.things_to_avoid || sing.cadeaux_non || q17Text
        ? `À garder en tête pour ne pas manquer sa cible.`
        : null,
      editHref: "/moi/questionnaire?part=lifestyle5",
      ctaLabel: "Préciser ce qui ne marche pas",
      sectionKey: "gifts-to-avoid",
    },
    // 6 — Style vestimentaire
    {
      icon: "👗", title: "Style vestimentaire",
      filled: !!pi?.couleurs_matieres || !!pi?.taille_vetements || !!da['style.clothing'],
      chips: [
        ...resolveDiscovery('style.clothing', da['style.clothing']),
        pi?.taille_vetements ? `Vêtements ${pi.taille_vetements}` : null,
        pi?.taille_chaussures ? `Chaussures ${pi.taille_chaussures}` : null,
        pi?.taille_bague ? `Bague ${pi.taille_bague}` : null,
      ].filter(Boolean) as string[],
      summary: pi?.couleurs_matieres
        ? pi.couleurs_matieres.length > 100 ? pi.couleurs_matieres.slice(0, 100) + "…" : pi.couleurs_matieres
        : da['style.clothing']
        ? `Style ${resolveDiscovery('style.clothing', da['style.clothing']).slice(0,2).join(", ").toLowerCase()}.`
        : null,
      editHref: "/moi/questionnaire?part=practical7",
      ctaLabel: "Affiner mon style",
      sectionKey: "style-clothing",
    },
    // 7 — Marques aimées
    {
      icon: "🛍", title: "Marques aimées",
      filled: !!sing.marques_lieux || !!da['brands.favorites'],
      chips: ((sing.marques_lieux || da['brands.favorites'] as string) ?? "")
        .split(/[,;·\n]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 30).slice(0, 6),
      summary: sing.marques_lieux || da['brands.favorites']
        ? `Quelques adresses et marques de référence.`
        : null,
      editHref: "/moi/discovery?mode=full",
      ctaLabel: discoveryAvailable.has('brands-favorites') ? "Ajouter des adresses" : "",
      ctaHref: discoveryHref('brands-favorites'),
      sectionKey: "brands-favorites",
    },
    // 8 — Restaurants
    {
      icon: "🍽", title: "Restaurants",
      filled: !!profile.gastronomy || !!profile.favorite_foods || !!da['food.restaurants'],
      chips: da['food.restaurants']
        ? resolveDiscovery('food.restaurants', da['food.restaurants'])
        : profile.gastronomy ? [ag(GASTRONOMY_FR[profile.gastronomy] ?? profile.gastronomy)] : [],
      summary: profile.favorite_foods
        ? profile.favorite_foods.length > 100 ? profile.favorite_foods.slice(0, 100) + "…" : profile.favorite_foods
        : da['food.restaurants']
        ? `Tu préfères ${resolveDiscovery('food.restaurants', da['food.restaurants']).slice(0,2).join(", ").toLowerCase()}.`
        : profile.gastronomy ? ag(GASTRONOMY_FR[profile.gastronomy] ?? profile.gastronomy) : null,
      editHref: "/moi/discovery?mode=full",
      ctaLabel: discoveryAvailable.has('food-restaurants') ? "Aller plus loin sur tes tables" : "",
      ctaHref: discoveryHref('food-restaurants'),
      sectionKey: "food-restaurants",
    },
    // 9 — Hôtels
    {
      icon: "🏨", title: "Hôtels",
      filled: lifestyleTraits.some(t => t.toLowerCase().includes("luxe") || t.toLowerCase().includes("qualité") || t.toLowerCase().includes("confort")),
      chips: lifestyleTraits.filter(t =>
        t.toLowerCase().includes("luxe") || t.toLowerCase().includes("qualité") ||
        t.toLowerCase().includes("confort") || t.toLowerCase().includes("authenticit")
      ).slice(0, 3),
      summary: lifestyleTraits.length > 0
        ? lifestyleTraits.find(t => t.toLowerCase().includes("luxe") || t.toLowerCase().includes("qualité"))
          ? "Apprécie les lieux premium, chaleureux et vivants."
          : "Préfère les adresses authentiques et sans prétention."
        : null,
      editHref: "/moi/questionnaire?part=lifestyle4",
      ctaLabel: "Affiner mon rapport au confort",
      sectionKey: "hotels-comfort",
    },
    // 10 — Parfums
    {
      icon: "🌸", title: "Parfums",
      filled: (pi?.parfums?.length ?? 0) > 0 || !!da['fragrance.family'],
      chips: da['fragrance.family']
        ? resolveDiscovery('fragrance.family', da['fragrance.family'])
        : (pi?.parfums ?? []).map(p => PARFUM_FR[p] ?? p),
      summary: pi?.odeurs_detestees
        ? `À éviter : ${pi.odeurs_detestees}.`
        : (pi?.parfums?.length ?? 0) > 0
        ? `Tend vers les notes ${(pi!.parfums!.map(p => PARFUM_FR[p] ?? p)).join(", ").toLowerCase()}.`
        : da['fragrance.family']
        ? `Notes préférées : ${resolveDiscovery('fragrance.family', da['fragrance.family']).join(", ").toLowerCase()}.`
        : null,
      editHref: "/moi/questionnaire?part=practical7",
      ctaLabel: "Préciser mes préférences olfactives",
      sectionKey: "fragrance-family",
    },
    // 11 — Voyages
    {
      icon: "✈️", title: "Voyages",
      filled: !!da['travel.style'] || lifestyleTraits.some(t => t.toLowerCase().includes("aventure") || t.toLowerCase().includes("nouveau")),
      chips: da['travel.style']
        ? resolveDiscovery('travel.style', da['travel.style'])
        : lifestyleTraits.filter(t => t.toLowerCase().includes("aventure") || t.toLowerCase().includes("nouveau")).slice(0, 2),
      summary: da['travel.style']
        ? `En voyage, tu cherches ${resolveDiscovery('travel.style', da['travel.style']).slice(0,2).join(", ").toLowerCase()}.`
        : lifestyleTraits.find(t => t.includes("aventure"))
        ? ag("Attiré·e par l'inédit et les découvertes.")
        : null,
      editHref: "/moi/discovery?mode=full",
      ctaLabel: discoveryAvailable.has('travel-style') ? "Aide Candice à mieux comprendre comment te faire voyager" : "",
      ctaHref: discoveryHref('travel-style'),
      sectionKey: "travel-style",
    },
    // 12 — Loisirs & centres d'intérêt
    {
      icon: "🎭", title: "Loisirs & centres d'intérêt",
      filled: !!profile.hobbies || !!sing.adore_faire || !!da['hobbies.main'],
      chips: (profile.hobbies || sing.adore_faire || da['hobbies.main'] as string || "")
        .split(/[,;·\n]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 35).slice(0, 5),
      summary: profile.hobbies
        ? profile.hobbies.length > 100 ? profile.hobbies.slice(0, 100) + "…" : profile.hobbies
        : sing.adore_faire ? sing.adore_faire.slice(0, 100) + (sing.adore_faire.length > 100 ? "…" : "")
        : da['hobbies.main'] ? (da['hobbies.main'] as string).slice(0, 100) : null,
      editHref: "/moi/questionnaire?part=singularity6",
      ctaLabel: "Ajouter à mes loisirs",
      sectionKey: "hobbies-main",
    },
    // 13 — Rêves
    {
      icon: "💭", title: "Rêves",
      filled: !!sing.envies_reves || !!da['dreams.current'],
      chips: [],
      summary: sing.envies_reves
        ? `« ${sing.envies_reves.length > 120 ? sing.envies_reves.slice(0, 120) + "…" : sing.envies_reves} »`
        : da['dreams.current']
        ? `« ${(da['dreams.current'] as string).length > 120 ? (da['dreams.current'] as string).slice(0, 120) + "…" : da['dreams.current']} »`
        : null,
      editHref: "/moi/discovery?mode=full",
      ctaLabel: discoveryAvailable.has('dreams-current') ? "Partager une envie" : "",
      ctaHref: discoveryHref('dreams-current'),
      sectionKey: "dreams-current",
    },
    // 14 — Événements importants
    {
      icon: "📅", title: "Événements importants",
      filled: (pi?.dates_importantes?.length ?? 0) > 0,
      chips: (pi?.dates_importantes ?? []).map(d => d.label || d.type).slice(0, 5),
      summary: (pi?.dates_importantes?.length ?? 0) > 0
        ? `${pi!.dates_importantes!.length} date${pi!.dates_importantes!.length > 1 ? "s" : ""} à ne pas manquer.`
        : null,
      editHref: "/moi/questionnaire?part=practical7",
      ctaLabel: "Ajouter une date",
      sectionKey: "important-dates",
    },
    // 15 — Gestion des conflits
    {
      icon: "💬", title: "Gestion des conflits",
      filled: !!conflitMode || daConflicts.length > 0,
      chips: conflitMode ? [CONFLIT_FR[conflitMode] ?? conflitMode] : daConflicts,
      summary: conflitMode
        ? (CONFLIT_FR[conflitMode] ?? conflitMode)
        : daConflicts.length > 0 ? daConflicts[0] : null,
      editHref: "/moi/questionnaire?part=temperament3",
      ctaLabel: "Préciser mon rapport aux conflits",
      sectionKey: "conflicts-style",
    },
    // 16 — Préférences de surprise
    {
      icon: "🎉", title: "Préférences de surprise",
      filled: surpriseChips.length > 0 || daSurprise.length > 0,
      chips: surpriseChips.length > 0 ? surpriseChips : daSurprise,
      summary: surpriseChips.length > 0
        ? surpriseChips[0]
        : daSurprise.length > 0 ? daSurprise[0] : null,
      editHref: "/moi/questionnaire?part=lifestyle5",
      ctaLabel: "Affiner mes préférences",
      sectionKey: "surprises-preference",
    },
    // 17 — À prendre en compte
    {
      icon: "🧭", title: "À prendre en compte",
      filled: allergiesChips.length > 0 || !!regimeChip || !!alcoolChip || !!pi?.mobilite_sante || resolveDiscovery('practical.constraints', da['practical.constraints']).length > 0,
      chips: [
        ...allergiesChips,
        regimeChip,
        alcoolChip,
        pi?.mobilite_sante ? "Mobilité" : null,
        ...resolveDiscovery('practical.constraints', da['practical.constraints']).map(ag),
      ].filter(Boolean) as string[],
      summary: (allergiesChips.length > 0 || regimeChip || alcoolChip)
        ? [regimeChip, alcoolChip, allergiesChips.length > 0 ? `Allergies : ${allergiesChips.join(", ")}` : null].filter(Boolean).join(". ") + "."
        : null,
      editHref: "/moi/questionnaire?part=practical7",
      ctaLabel: "Ajouter une contrainte",
      sectionKey: "practical-constraints",
    },
    // 18 — Ce qui rend une attention réussie
    {
      icon: "🧬", title: "Ce qui rend une attention réussie",
      filled: hasAttentionData,
      chips: [
        ...receptionDims.map(d => DIM_FR[d]),
        ...expressionDims.slice(0, 2).map(d => `↗ ${DIM_FR[d] ?? d}`),
      ],
      summary: profile.attention_breath_text ?? (hasAttentionData
        ? `Reçoit : ${dimsToFr(receptionDims).toLowerCase()}. Donne : ${dimsToFr(expressionDims).toLowerCase()}.`
        : null),
      editHref: "/moi/questionnaire?part=attention",
      ctaLabel: "Approfondir mon profil d'attention",
      sectionKey: "attention-dna",
    },
    // 19 — Moments de vie importants
    {
      icon: "🌱", title: "Moments de vie importants",
      filled: false,
      chips: [],
      summary: null,
      editHref: "/moi/discovery?mode=full",
      ctaLabel: "",
      sectionKey: "life-states",
    },
    // 20 — Ce qui a déjà marché
    {
      icon: "📜", title: "Ce qui a déjà marché",
      filled: false,
      chips: [],
      summary: null,
      editHref: "/moi/discovery?mode=full",
      ctaLabel: "",
      sectionKey: "attention-history",
    },
  ];
}

function computeCompletionLevel(sections: SectionDef[]): CompletionLevel {
  const filled = sections.filter(s => s.filled).length;
  const total = sections.length;
  if (filled === 0) return 'empty';
  if (filled / total < 0.35) return 'started';
  if (filled / total < 0.70) return 'well_filled';
  return 'precise';
}

// ─── Analysis overlay ─────────────────────────────────────────────────────────

// Maps sectionKey (used in buildSections) → profile_analysis.sections key
const SECTION_KEY_TO_ANALYSIS: Record<string, string> = {
  "attention-reception": "attention",
  "attention-expression": "feels_loved",
  "attention-dna":        "attention_dna",
  "temperament-energy":   "what_touches",
  "gifts-what-works":     "gifts",
  "gifts-to-avoid":       "avoid",
  "style-clothing":       "style",
  "brands-favorites":     "brands",
  "food-restaurants":     "restaurants",
  "travel-style":         "travel",
  "hobbies-main":         "hobbies",
};

type AnalysisSection = { text?: string; chips?: string[] };

function mergeWithAnalysis(
  sections: SectionDef[],
  analysisSections: Record<string, AnalysisSection> | null,
): SectionDef[] {
  if (!analysisSections) return sections;
  return sections.map(sec => {
    const key = SECTION_KEY_TO_ANALYSIS[sec.sectionKey];
    if (!key) return sec;
    const ai = analysisSections[key];
    if (!ai) return sec;
    return {
      ...sec,
      summary: ai.text && ai.text.trim().length > 3 ? ai.text : sec.summary,
      chips: ai.chips && ai.chips.length > 0 ? ai.chips : sec.chips,
      filled: sec.filled || !!(ai.text && ai.text.trim().length > 3),
    };
  });
}

// ─── Donut helpers ────────────────────────────────────────────────────────────

const DONUT_COLORS: Record<string, string> = {
  MOT: "#173E31", CAD: "#3E7361", SER: "#8DA697",
  EXP: "#CDB987", GES: "#B9A77C", SUR: "#E0D3B0",
};
const DONUT_LABELS: Record<string, string> = {
  MOT: "Mots justes", CAD: "Cadeaux", SER: "Services",
  EXP: "Moments", GES: "Esthétique", SUR: "Surprises",
};
const CENTER_LABELS: Record<string, string> = {
  MOT: "Mots", CAD: "Cadeaux", SER: "Service",
  EXP: "Moments", GES: "Détails", SUR: "Surprises",
};

function computeDonutData(reception: FaceResult | null): { id: string; weight: number }[] {
  if (!reception) return [];
  const weights: Record<string, number> = {};
  const mergeId = (id: string) => (id === "CAD_C" || id === "CAD_S") ? "CAD" : id;
  for (const id of reception.dominant ?? []) { const m = mergeId(id); weights[m] = (weights[m] ?? 0) + 3; }
  for (const id of reception.secondaire ?? []) { const m = mergeId(id); weights[m] = (weights[m] ?? 0) + 2; }
  for (const id of reception.tertiaire ?? []) { const m = mergeId(id); weights[m] = (weights[m] ?? 0) + 1; }
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(weights)
    .map(([id, w]) => ({ id, weight: w / total }))
    .sort((a, b) => b.weight - a.weight);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MoiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: existing }, { data: analysisRow }] = await Promise.all([
    supabase.from("my_profile").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_analysis").select("summary, summary_chips, sections, gender")
      .eq("user_id", user.id).is("contact_id", null).maybeSingle(),
  ]);

  const profile = existing as ExtendedProfile | null;
  const analysis = analysisRow as {
    summary: string | null;
    summary_chips: string[] | null;
    sections: Record<string, AnalysisSection> | null;
    gender: string | null;
  } | null;

  const analysisSnapshot: ProfileAnalysisSnapshot | null = analysis?.sections
    ? { sections: analysis.sections as Record<string, { text?: string; chips?: string[] }> }
    : null;
  const discoveryAvailable = profile
    ? await getAvailableDiscoverySections(user.id, supabase, analysisSnapshot)
    : new Set<string>();

  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "toi";
  const initial = firstName !== "toi" ? firstName[0].toUpperCase() : "M";

  const rawSections = profile ? buildSections(profile, discoveryAvailable) : [];
  const sections = mergeWithAnalysis(rawSections, analysis?.sections ?? null);
  const level = profile ? computeCompletionLevel(rawSections) : 'empty';
  const levelLabels: Record<string, string> = {
    started: 'En cours', well_filled: 'Bien rempli', precise: 'Très précis',
  };
  const levelBadge = levelLabels[level] ?? null;

  const showGenderModal = !!profile && !profile.grammatical_gender;

  const profilePct = rawSections.length > 0
    ? Math.round((rawSections.filter(s => s.filled).length / rawSections.length) * 100)
    : 0;

  const ghStatusLabels: Record<string, string> = {
    empty: "Candice ne te connaît pas encore",
    started: "Candice commence à te connaître",
    well_filled: "Candice te connaît bien",
    precise: "Candice te connaît vraiment bien",
  };
  const ghStatusLabel = ghStatusLabels[level] ?? "Candice apprend à te connaître";

  const donutData = computeDonutData(profile?.attention_reception ?? null);

  return (
    <V4Shell active="profile">

      {showGenderModal && <GenderModal userId={user.id} />}

      {/* GH Panel */}
      <div style={{
        background: "linear-gradient(157deg,#1D5040,#0C2A20)",
        color: "#fff", position: "relative", overflow: "hidden",
        padding: "16px 20px 19px",
      }}>
        <div style={{
          position: "absolute", right: -22, top: -44,
          width: 160, height: 160, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(205,185,135,.34),transparent 70%)",
          pointerEvents: "none",
        }} />
        {/* Ring + name */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative", width: 54, height: 54, flexShrink: 0 }}>
              <svg width="54" height="54">
                <circle cx="27" cy="27" r="23" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="3.5" />
                <circle cx="27" cy="27" r="23" fill="none" stroke="var(--champ)" strokeWidth="3.5"
                  strokeLinecap="round" strokeDasharray="144.5"
                  strokeDashoffset={Math.round(144.5 * (1 - profilePct / 100))}
                  transform="rotate(-90 27 27)"
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ display: "block", width: 5, height: 5, borderRadius: "50%", background: "#fff", boxShadow: "0 0 10px var(--champ)" }} />
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 21, color: "#fff" }}>
                {firstName !== "toi" ? firstName : "Mon profil"}
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.82)", marginTop: 2 }}>
                {ghStatusLabel}
              </div>
            </div>
          </div>
          <Link href="/moi/questionnaire" style={{
            fontSize: 11.5, border: "1px solid rgba(255,255,255,.4)", color: "#fff",
            padding: "6px 11px", borderRadius: 999, textDecoration: "none",
          }}>
            Modifier
          </Link>
        </div>
        {/* Chips row */}
        <div style={{ display: "flex", gap: 7, marginTop: 12, position: "relative" }}>
          <Link href="/parametres/profils-partages" style={{
            fontSize: 11, color: "#fff", background: "rgba(255,255,255,.14)",
            padding: "5px 11px", borderRadius: 999, textDecoration: "none",
          }}>
            Voir ma fiche partagée
          </Link>
          <Link href="/moi/resultats" style={{
            fontSize: 11, color: "var(--champ)", background: "rgba(255,255,255,.12)",
            padding: "5px 11px", borderRadius: 999, textDecoration: "none",
          }}>
            Lire l&apos;analyse →
          </Link>
        </div>
      </div>

      {/* V4 body — summary + donut + modules */}
      <div style={{ padding: "14px 20px 0" }}>
        {analysis?.summary && (
          <p style={{
            fontFamily: "var(--font-serif)", fontSize: 15.5, lineHeight: 1.5,
            color: "var(--ink)", marginBottom: 14,
          }}>
            {analysis.summary}
          </p>
        )}

        {donutData.length > 0 && (
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, margin: "4px 0 11px",
              fontSize: 10, letterSpacing: "1.6px", textTransform: "uppercase",
              color: "var(--ink3)", fontWeight: 700, fontFamily: "var(--font-sans)",
            }}>
              <div style={{ flex: 1, height: 1, background: "var(--line2)" }} />
              Ton langage d&apos;attention
              <div style={{ flex: 1, height: 1, background: "var(--line2)" }} />
            </div>
            <div style={{
              background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: 18, boxShadow: "var(--shadow)", padding: 16,
              display: "flex", alignItems: "center", gap: 14, marginBottom: 11,
            }}>
              <svg width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
                {(() => {
                  let cum = 0;
                  return donutData.map(({ id, weight }) => {
                    const arc = weight * 326.73;
                    const el = (
                      <circle key={id} cx="70" cy="70" r="52" fill="none"
                        stroke={DONUT_COLORS[id] ?? "#ccc"} strokeWidth="26"
                        strokeDasharray={`${arc.toFixed(2)} ${(326.73 - arc).toFixed(2)}`}
                        strokeDashoffset={cum === 0 ? 0 : -cum}
                        transform="rotate(-90 70 70)"
                      />
                    );
                    cum += arc;
                    return el;
                  });
                })()}
                <circle cx="70" cy="70" r="34" fill="#fff" />
                <text x="70" y="67" textAnchor="middle" fontFamily="Fraunces" fontSize="12" fill="#173E31">
                  {CENTER_LABELS[donutData[0]?.id ?? ""] ?? ""}
                </text>
                <text x="70" y="82" textAnchor="middle" fontSize="9" fill="#6F6A61">
                  en tête
                </text>
              </svg>
              <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "5px 12px" }}>
                {donutData.map(({ id }) => (
                  <span key={id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink2)" }}>
                    <i style={{ width: 9, height: 9, borderRadius: 3, background: DONUT_COLORS[id], display: "inline-block", flexShrink: 0 }} />
                    {DONUT_LABELS[id]}
                  </span>
                ))}
              </div>
            </div>

            {profile?.attention_breath_text && (
              <div style={{
                background: "var(--surface)", border: "1px solid var(--line)",
                borderRadius: 18, boxShadow: "var(--shadow)", padding: "13px 14px", marginBottom: 10,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 9,
                  fontWeight: 600, fontSize: 13.5, color: "var(--ink)",
                }}>
                  <Icon name="i-detail" size={18} style={{ color: "var(--pine)" }} />
                  Ce qui te touche
                </div>
                <div style={{ fontSize: 12, color: "var(--ink2)", margin: "5px 0 4px", lineHeight: 1.45 }}>
                  {profile.attention_breath_text}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Existing profile content */}
      <div style={{ padding: "0 20px 120px" }}>

        {!profile ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", marginBottom: 24, lineHeight: 1.7 }}>
              Réponds à quelques questions — tes proches pourront consulter ta fiche pour mieux prendre soin de toi.
            </p>
            <ResumePrompt userId={user.id} />
          </div>
        ) : (
          <>
            {/* ── Carte Affiner mon portrait ── */}
            <AffinerCard level={level} showBadge={false} />

            {/* ── 20 sections accordéon ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sections.map((sec, i) => (
                <ProfileSection
                  key={i}
                  icon={sec.icon}
                  title={sec.title}
                  summary={sec.summary}
                  chips={sec.chips}
                  filled={sec.filled}
                  editHref={sec.editHref}
                  ctaLabel={sec.ctaLabel}
                  ctaHref={sec.ctaHref}
                  sectionKey={sec.sectionKey}
                />
              ))}
            </div>

            {/* ── Partage ── */}
            <div style={{
              margin: "28px 0",
              padding: "20px 22px",
              borderRadius: 16,
              border: "1px solid var(--pine)",
              background: "var(--white)",
            }}>
              <p style={{
                fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 19,
                color: "var(--ink)", letterSpacing: "-.012em", marginBottom: 8,
              } as React.CSSProperties}>
                Partage ta fiche.
              </p>
              <p style={{ fontSize: 13, fontWeight: 300, color: "var(--ink-3)", lineHeight: 1.6, marginBottom: 18 }}>
                Envoie le lien à tes proches — ils sauront exactement comment te faire plaisir.
              </p>
              <ShareButton userId={user.id} variant="full" />
            </div>

          </>
        )}

        {/* Always visible */}
        <div style={{ borderTop: "0.5px solid var(--line)", marginTop: 8, paddingTop: 4, paddingBottom: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 300, color: "var(--ink-2)", textDecoration: "none", padding: "12px 0", borderBottom: "0.5px solid var(--line)" }}>
            <span>Retour au site</span>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>→</span>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </V4Shell>
  );
}
