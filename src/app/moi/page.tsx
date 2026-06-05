import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";
import { MyProfile, CadenceLevel } from "@/types";
import ShareButton from "./ShareButton";
import ResumePrompt from "@/components/questionnaire/ResumePrompt";
import LogoutButton from "./LogoutButton";
import ProfileSection from "@/components/profile/ProfileSection";
import AffinerCard, { type CompletionLevel } from "@/components/profile/AffinerCard";

// ─── Extended profile type ────────────────────────────────────────────────────

interface FaceResult { dominant: string[]; secondaire: string[]; tertiaire: string[]; }
interface AxisScore   { score: number; intensity: number; }
interface ModeResult  { label: string; intensity: number; }
interface ImportantDate { type: string; label: string; date: string; recurrence?: string; importance?: string; rappel?: string; }

type ExtendedProfile = MyProfile & {
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

function axisLabel(key: string, score: number): string | null {
  if (Math.abs(score) < 30) return null;
  const poles = AXIS_POLES[key];
  return poles ? (score > 0 ? poles[0] : poles[1]) : null;
}
function lifestyleLabel(key: string, score: number): string | null {
  if (Math.abs(score) < 30) return null;
  const poles = LIFESTYLE_POLES[key];
  return poles ? (score > 0 ? poles[0] : poles[1]) : null;
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
  ctaLabel: string; sectionKey: string;
}

function buildSections(profile: ExtendedProfile): SectionDef[] {
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
      .forEach(([key, v]) => { const l = v ? axisLabel(key, v.score) : null; if (l) temperamentTraits.push(l); });
  }
  const conflitMode = profile.temperament_modes?.conflit?.label ?? null;

  // Lifestyle
  const lifestyleTraits: string[] = [];
  if (profile.lifestyle_axes) {
    Object.entries(profile.lifestyle_axes)
      .filter(([,v]) => v && Math.abs(v.score) >= 30 && v.intensity > 0)
      .sort(([,a],[,b]) => Math.abs(b!.score) - Math.abs(a!.score))
      .slice(0, 3)
      .forEach(([key, v]) => { const l = v ? lifestyleLabel(key, v.score) : null; if (l) lifestyleTraits.push(l); });
  }

  // Surprise filters
  const surpriseChips: string[] = Object.entries(FILTER_SURPRISE_FR)
    .filter(([k]) => typeof filters[k] === "boolean" && filters[k])
    .map(([,v]) => v);

  // Constraints
  const allergiesChips = (pi?.allergies ?? []).filter(a => a !== "aucune").map(a => ALLERGIE_FR[a] ?? a);
  const regimeChip = pi?.regime ? (REGIME_FR[pi.regime] ?? null) : null;
  const alcoolChip = pi?.alcool ? (ALCOOL_FR[pi.alcool] ?? null) : null;

  // Discovery: surprises
  const daSurprise = resolveDiscovery('surprises.preference', da['surprises.preference']);
  // Discovery: conflicts
  const daConflicts = resolveDiscovery('conflicts.style', da['conflicts.style']);

  return [
    // 1 — Langage d'attention
    {
      icon: "❤️", title: "Langage d'attention",
      filled: hasAttentionData || !!profile.love_language,
      chips: receptionDims.length > 0 ? receptionDims.map(d => DIM_FR[d]) : (profile.love_language?.split(",").filter(Boolean) ?? []),
      summary: receptionDims.length > 0
        ? `Tu te sens aimé·e surtout par ${dimsToFr(receptionDims).toLowerCase()}.${profile.attention_breath_text ? " " + profile.attention_breath_text.slice(0, 100) + (profile.attention_breath_text.length > 100 ? "…" : "") : ""}`
        : profile.love_language ? `Tu apprécies les ${profile.love_language.split(",")[0]} avant tout.` : null,
      editHref: "/moi/questionnaire?part=attention",
      ctaLabel: "Affiner mes langages d'attention",
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
      icon: "🌟", title: "Ce qui me fait me sentir aimé·e",
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
      ctaLabel: "Affiner mes préférences cadeaux",
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
      ctaLabel: "Ajouter des adresses",
      sectionKey: "brands-favorites",
    },
    // 8 — Restaurants
    {
      icon: "🍽", title: "Restaurants",
      filled: !!profile.gastronomy || !!profile.favorite_foods || !!da['food.restaurants'],
      chips: da['food.restaurants']
        ? resolveDiscovery('food.restaurants', da['food.restaurants'])
        : profile.gastronomy ? [GASTRONOMY_FR[profile.gastronomy] ?? profile.gastronomy] : [],
      summary: profile.favorite_foods
        ? profile.favorite_foods.length > 100 ? profile.favorite_foods.slice(0, 100) + "…" : profile.favorite_foods
        : da['food.restaurants']
        ? `Tu préfères ${resolveDiscovery('food.restaurants', da['food.restaurants']).slice(0,2).join(", ").toLowerCase()}.`
        : profile.gastronomy ? GASTRONOMY_FR[profile.gastronomy] ?? null : null,
      editHref: "/moi/discovery?mode=full",
      ctaLabel: "Préciser mes goûts",
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
        ? "Attiré·e par l'inédit et les découvertes."
        : null,
      editHref: "/moi/discovery?mode=full",
      ctaLabel: "Affiner ma façon de voyager",
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
      ctaLabel: "Partager une envie",
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
        ...resolveDiscovery('practical.constraints', da['practical.constraints']),
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
      ctaLabel: "Partager un moment clé",
      sectionKey: "life-states",
    },
    // 20 — Ce qui a déjà marché
    {
      icon: "📜", title: "Ce qui a déjà marché",
      filled: false,
      chips: [],
      summary: null,
      editHref: "/moi/discovery?mode=full",
      ctaLabel: "Ajouter ce qui a marché",
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

  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "toi";
  const initial = firstName !== "toi" ? firstName[0].toUpperCase() : "M";

  const rawSections = profile ? buildSections(profile) : [];
  const sections = mergeWithAnalysis(rawSections, analysis?.sections ?? null);
  const level = profile ? computeCompletionLevel(rawSections) : 'empty';
  const levelLabels: Record<string, string> = {
    started: 'En cours', well_filled: 'Bien rempli', precise: 'Très précis',
  };
  const levelBadge = levelLabels[level] ?? null;

  return (
    <DashboardShell>

      {/* ── Header ── */}
      <div
        className="hero-mass"
        style={{
          padding: "0 0 28px",
          background: "radial-gradient(130% 100% at 26% 0%, #1E4337 0%, #0E2219 44%, #060E0A 100%)",
        }}
      >
        <div style={{ padding: "18px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 12, fontWeight: 300, color: "rgba(244,241,232,.5)", letterSpacing: ".08em" }}>
              ← Tableau de bord
            </span>
          </Link>
          <Link href="/parametres" style={{ textDecoration: "none" }}>
            <span style={{
              fontSize: 18, color: "rgba(244,241,232,.45)",
              display: "flex", alignItems: "center",
            }}>
              ⚙
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
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 300, color: "var(--pine)" } as React.CSSProperties}>
              {initial}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{
                fontFamily: "var(--font-serif)", fontWeight: 300,
                fontSize: "clamp(22px, 4.5vw, 28px)",
                color: "var(--canvas)", letterSpacing: "-.018em", lineHeight: 1.15,
              } as React.CSSProperties}>
                {firstName !== "toi" ? firstName : "Mon profil"}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 400, letterSpacing: ".18em",
                textTransform: "uppercase", color: "rgba(244,241,232,.4)",
                border: "0.5px solid rgba(244,241,232,.18)", borderRadius: 20,
                padding: "2px 8px", flexShrink: 0,
              }}>
                Profil personnel
              </span>
            </div>
            {levelBadge && (
              <span style={{
                fontSize: 10, fontWeight: 500, letterSpacing: ".18em",
                textTransform: "uppercase",
                color: level === 'precise' ? "var(--champ)" : "rgba(205,185,135,.7)",
              }}>
                {levelBadge}
              </span>
            )}
          </div>
          {profile && (
            <Link href="/moi/questionnaire" style={{ fontSize: 13, color: "var(--champ)", fontWeight: 400, textDecoration: "none", flexShrink: 0 }}>
              Modifier
            </Link>
          )}
        </div>

        <div style={{ padding: "14px 24px 0" }}>
          <div style={{ height: "0.5px", background: "linear-gradient(90deg, var(--champ-line), transparent)", marginBottom: 12 }} />
          {profile?.updated_at && (
            <p style={{ fontSize: 11, fontWeight: 300, color: "rgba(244,241,232,.35)", letterSpacing: ".04em" }}>
              {formatUpdatedAt(profile.updated_at)}
            </p>
          )}
        </div>
      </div>

      <div className="content-col" style={{ paddingTop: 24 }}>

        {!profile ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontSize: 15, fontWeight: 300, color: "var(--ink-2)", marginBottom: 24, lineHeight: 1.7 }}>
              Réponds à quelques questions — tes proches pourront consulter ta fiche pour mieux prendre soin de toi.
            </p>
            <ResumePrompt userId={user.id} />
          </div>
        ) : (
          <>
            {/* ── Résumé global (profile_analysis) ── */}
            {analysis?.summary && (
              <div style={{
                padding: "18px 20px 16px",
                borderRadius: 14,
                background: "rgba(23,62,49,.04)",
                border: "0.5px solid rgba(23,62,49,.1)",
                marginBottom: 12,
              }}>
                <p style={{
                  fontFamily: "var(--font-serif)", fontWeight: 300,
                  fontSize: 13, color: "var(--ink-3)",
                  letterSpacing: ".06em", textTransform: "uppercase",
                  marginBottom: 10,
                } as React.CSSProperties}>
                  Ce que Candice retient
                </p>
                <p style={{
                  fontSize: 14, fontWeight: 300, color: "var(--ink-2)",
                  lineHeight: 1.75, marginBottom: analysis.summary_chips?.length ? 12 : 0,
                }}>
                  {analysis.summary}
                </p>
                {analysis.summary_chips && analysis.summary_chips.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {analysis.summary_chips.map((chip, i) => (
                      <span key={i} style={{
                        fontSize: 11, fontWeight: 300,
                        padding: "3px 10px", borderRadius: 20,
                        background: "rgba(23,62,49,.07)",
                        border: "0.5px solid rgba(23,62,49,.13)",
                        color: "var(--pine)",
                      }}>
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Carte Affiner mon portrait ── */}
            <AffinerCard level={level} />

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

            {/* ── Liens secondaires ── */}
            <div style={{ borderTop: "0.5px solid var(--line)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 0 }}>
              <Link href="/parametres/notifications" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 300, color: "var(--ink-2)", textDecoration: "none", padding: "12px 0", borderBottom: "0.5px solid var(--line)" }}>
                <span>Préférences notifications</span>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>→</span>
              </Link>
              <Link href="/parametres/abonnement" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 300, color: "var(--ink-2)", textDecoration: "none", padding: "12px 0" }}>
                <span>Abonnement</span>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>→</span>
              </Link>
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
    </DashboardShell>
  );
}
