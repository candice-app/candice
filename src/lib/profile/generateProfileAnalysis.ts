// Moteur d'analyse global — Lot 2 Phase 2
// Source unique : lit TOUTES les réponses, produit une synthèse multi-dimensions
// via Claude Sonnet. Jamais dimension par dimension.
// Sauvegarde dans profile_analysis (source de vérité).

import Anthropic from "@anthropic-ai/sdk";
import { precomputeUpcomingPersonalizations } from "@/lib/discovery/engine";
import { computeProfileSynthesis } from "./synthesis";
import type { FaceResult } from "@/lib/attention/scoring";
import type { RelationalFilters } from "@/lib/lifestyle/scoring";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lirePortrait } from "@/lib/knowledge/portrait";
import { entitesDuJournal, nbEntites } from "@/lib/profile/entites-du-journal";
import { AFFECTION_MODALITIES } from "@/lib/knowledge/vocabulary";
import { radarDuPortrait, attentionDuPortrait, ceQuiMarcheDuPortrait,
         type RadarJournal, type AttentionJournal } from "@/lib/profile/portrait-vers-synthese";

const anthropic = new Anthropic();

// ── Types ────────────────────────────────────────────────────────────────────

type Gender = "feminine" | "masculine" | "neutral";

interface ProfileAnalysisResult {
  summary: string;
  summary_third_person: string;
  summary_chips: string[];
  insights: string[]; // "Ce que Candice a compris" — 3 phrases actionables
  sections: Record<string, { text: string; chips: string[] }>;
  modes: {
    conflit:  string;
    stress:   string;
    decision: string;
    canal:    string;
  };
  must_haves: string[];
  deal_breakers: string[];
  attention_dna: Array<{ dimension: string; intensity: number; note: string }>;
  constraints: string[];
  entities: { brands: string[]; places: string[]; hobbies: string[]; events: string[] };
  confidence: number;
  // ── Champs V2 (Refonte Profil, engine 2.2 — migration 54) ──
  summary_long: string;
  podium_intro: string;
  understood_cards: Array<{ eyebrow: string; text: string }>;
  works_phrases: Record<string, string>;
  territory: {
    titre: string;
    phrase: string;
    cartes: Array<{ nom: string; description: string; statut: "desirable" | "eviter" }>;
  } | null;
  universe: {
    lieux_ambiances: string[];
    matieres: string[];
    reves_envies: string[];
    phrase: string;
  } | null;
}

// ── Gender helpers ────────────────────────────────────────────────────────────

function resolveGender(
  grammaticalGender: string | null | undefined,
  sexe: string | null | undefined,
): Gender {
  if (grammaticalGender === "feminine") return "feminine";
  if (grammaticalGender === "masculine") return "masculine";
  if (grammaticalGender === "neutral" || grammaticalGender === "unspecified") return "neutral";
  // Legacy fallback
  if (sexe === "femme") return "feminine";
  if (sexe === "homme") return "masculine";
  return "neutral";
}

function genderInstruction(gender: Gender): string {
  if (gender === "feminine") {
    return "La personne est une femme : accords féminins systématiques (elle, sa, ses, contente, aimée, etc.). JAMAIS de point médian « · » ni de « (-ve) ».";
  }
  if (gender === "masculine") {
    return "La personne est un homme : accords masculins systématiques (il, son, ses, content, aimé, etc.). JAMAIS de point médian « · » ni de « (-ve) ».";
  }
  return "Le genre n'est pas déterminé : reformule SANS accord (ex: 'une personne qui', 'quelqu'un qui'). INTERDIT absolument : point médian « · », tiret-genre, parenthèses d'accord « (-ve) ». Utilise la 3e personne neutre ou des tournures impersonnelles.";
}

// L'EXTRACTION HAIKU A ÉTÉ SUPPRIMÉE. Elle relisait les champs de singularité que
// l'extraction du journal avait déjà lus — deux modèles, deux schémas, un seul écran. Elle
// tronquait à 800 caractères sans le dire, et nommait les entités sans leur relation : une
// chose refusée pouvait s'afficher parmi les goûts. Les entités viennent désormais du
// journal (src/lib/profile/entites-du-journal.ts), avec leur polarité.

// ── Build user message for Sonnet ─────────────────────────────────────────────

function buildAnalysisPrompt(data: {
  facts: ReturnType<typeof computeProfileSynthesis>;
  practicalInfo: Record<string, unknown> | null;
  singularity: Record<string, string> | null;
  discoveryAnswers: Record<string, unknown> | null;
  recentMemories: string[];
  /** Entités LUES DANS LE JOURNAL (avec leur polarité). */
  entities: { brands: string[]; places: string[]; hobbies: string[]; events: string[]; autres: string[]; evites: string[] };
  /** Ossature dérivée du JOURNAL — jamais des axes de my_profile. */
  radar: RadarJournal;
  attention: AttentionJournal;
  gender: Gender;
}): string {
  const { facts, practicalInfo, singularity, discoveryAnswers, recentMemories, entities, radar, attention, gender } = data;
  const lines: string[] = ["=== DONNÉES PROFIL COMPLÈTES ===", ""];

  // Attention
  lines.push("── ATTENTION (journal) ──");
  lines.push(`Réception dominante : ${attention.recues.join(", ") || "non déterminée"}`);
  lines.push(`Expression naturelle : ${attention.donnees.join(", ") || "non déterminée"}`);
  // `null` = un des deux côtés manque. Répondre « non » affirmerait une congruence qu'on
  // n'a PAS constatée : l'absence de contraste et le contraste absent ne sont pas la même chose.
  lines.push(`Contraste réception/expression : ${attention.contraste === null ? "indéterminable (un côté manque)" : attention.contraste ? "oui" : "non"}`);
  lines.push("");

  // Touch + avoid
  if (facts.touchInsights.length > 0) {
    lines.push("── CE QUI TOUCHE ──");
    facts.touchInsights.forEach(t => lines.push(`• ${t}`));
    lines.push("");
  }
  if (facts.avoidAlerts.length > 0) {
    lines.push("── À ÉVITER ──");
    facts.avoidAlerts.forEach(a => lines.push(`• ${a}`));
    lines.push("");
  }

  // Relational + communication
  if (facts.relationalFacts.length > 0) {
    lines.push("── STYLE RELATIONNEL ──");
    facts.relationalFacts.forEach(r => lines.push(`• ${r}`));
    lines.push("");
  }
  if (facts.communicationFacts.length > 0) {
    lines.push("── COMMUNICATION ──");
    facts.communicationFacts.forEach(c => lines.push(`• ${c}`));
    lines.push("");
  }

  // Ideal + avoid attentions
  if (facts.idealAttentions.length > 0) {
    lines.push("── ATTENTIONS IDÉALES ──");
    facts.idealAttentions.forEach(a => lines.push(`• ${a}`));
    lines.push("");
  }
  if (facts.avoidAttentions.length > 0) {
    lines.push("── ATTENTIONS À ÉVITER ──");
    facts.avoidAttentions.forEach(a => lines.push(`• ${a}`));
    lines.push("");
  }

  // Lifestyle
  if (facts.lifestyleHighlights.length > 0) {
    lines.push("── LIFESTYLE ──");
    lines.push(facts.lifestyleHighlights.join(", "));
    lines.push("");
  }

  // Level labels
  lines.push("── NIVEAUX (usage interne) ──");
  lines.push(`Spontanéité : ${facts.spontaneiteLabel}`);
  lines.push(`Contrôle : ${facts.controleLabel}`);
  lines.push(`Sensibilité aux détails : ${facts.sensibiliteDetailsLabel}`);
  lines.push(`Besoin d'espace : ${facts.besoinEspaceLabel}`);
  lines.push("");

  // Singularity
  if (singularity && Object.keys(singularity).length > 0) {
    lines.push("── SINGULARITÉ (réponses libres) ──");
    const SING_LABELS: Record<string, string> = {
      adore_faire: "Adore faire",
      evite_deteste: "Évite / déteste",
      sujets_stimulants: "Sujets qui stimulent",
      peu_savent: "Peu de gens savent que",
      plus_beau_cadeau: "Plus beau cadeau reçu",
      detail_compris: "Détail qui dit 'tu m'as compris·e'",
      marques_lieux: "Marques / lieux préférés",
      cadeaux_non: "Cadeaux à éviter",
      envies_reves: "Envies et rêves",
      remarquer: "Ce qui lui plairait qu'on remarque",
      sentir_special: "Ce qui le/la fait se sentir spécial·e",
    };
    for (const [k, label] of Object.entries(SING_LABELS)) {
      const v = singularity[k];
      if (v && String(v).trim().length > 2) {
        lines.push(`${label} : ${String(v).trim().slice(0, 100)}`);
      }
    }
    lines.push("");
  }

  // Discovery answers
  if (discoveryAnswers && Object.keys(discoveryAnswers).length > 0) {
    lines.push("── DISCOVERY ANSWERS ──");
    for (const [k, v] of Object.entries(discoveryAnswers)) {
      lines.push(`${k} : ${JSON.stringify(v)}`);
    }
    lines.push("");
  }

  // Practical
  if (practicalInfo && Object.keys(practicalInfo).length > 0) {
    const pi = practicalInfo as Record<string, unknown>;

    // Contexte de calibrage — âge, profession, rôle familial.
    // Nourrit le ton, l'univers et les occasions pertinentes de l'analyse
    // (jamais cité tel quel dans les textes produits — voir system prompt).
    const ctx: string[] = [];
    if (pi.age) ctx.push(`âge : ${pi.age}`);
    if (pi.profession) ctx.push(`profession : ${pi.profession}`);
    const roles = Array.isArray(pi.role_familial)
      ? (pi.role_familial as string[]).filter(Boolean)
      : (typeof pi.role_familial === "string" && pi.role_familial ? [pi.role_familial] : []);
    if (roles.length > 0) ctx.push(`rôle familial : ${roles.join(", ")}`);
    if (ctx.length > 0) {
      lines.push("── CONTEXTE (calibrage — ne jamais citer tel quel) ──");
      lines.push(ctx.join(" | "));
      lines.push("");
    }

    const parts: string[] = [];
    if (pi.ville) parts.push(`ville : ${pi.ville}`);
    if (pi.vetos) {
      const v = pi.vetos as Record<string, unknown>;
      if (v.halal) parts.push("halal");
      if (v.casher) parts.push("casher");
      if (v.no_alcohol) parts.push("sans alcool");
      if (v.vegetarian) parts.push("végétarien·ne");
      if (v.vegan) parts.push("vegan");
      // NI ALLERGIES NI MOBILITÉ ICI. La fiche est PARTAGEABLE, et ce bloc nourrit le
      // texte. Ces contraintes vivent dans `constraints`, qui n'est pas dans le select
      // partagé : Candice les connaît pour agir, jamais pour les raconter.
    }
    if (parts.length > 0) {
      lines.push("── INFO PRATIQUE ──");
      lines.push(parts.join(" | "));
      lines.push("");
    }

    // LE TEXTE LIBRE MOBILITÉ / SANTÉ N'ENTRE PAS DANS LE PROMPT. Il était transmis avec
    // la consigne de le « fondre dans les sections pertinentes » — donc dans `summary`,
    // qui part avec la fiche dès qu'elle est partagée.

    // Parfums (préférences olfactives)
    const parfumsList = Array.isArray(pi.parfums) ? (pi.parfums as string[]) : [];
    const odeursDetestees = typeof pi.odeurs_detestees === "string"
      ? pi.odeurs_detestees.trim().slice(0, 200) : "";
    if (parfumsList.length > 0 || odeursDetestees) {
      lines.push("── PARFUMS & ODEURS ──");
      if (parfumsList.length > 0) lines.push(`Aime : ${parfumsList.join(", ")}`);
      if (odeursDetestees) lines.push(`Déteste : ${odeursDetestees}`);
      lines.push("");
    }

    // Esthétique — couleurs, matières, style (texte libre)
    if (typeof pi.couleurs_matieres === "string" && pi.couleurs_matieres.trim().length > 3) {
      lines.push("── ESTHÉTIQUE — couleurs, matières, style ──");
      lines.push(pi.couleurs_matieres.trim().slice(0, 300));
      lines.push("");
    }
  }

  // Q17 — texte libre "ce qu'il vaut mieux éviter avec moi"
  // (les interdits extraits arrivent déjà via facts.avoidAlerts, mais le texte brut
  //  préserve la nuance et le ton — indispensable pour la section "avoid" et "points_fixes")
  if (facts.rawTexts.q17.length > 3) {
    lines.push("── À ÉVITER (texte libre) ──");
    lines.push(facts.rawTexts.q17);
    lines.push("");
  }

  // Centres d'intérêt structurés (13 catégories × ranks × détails)
  if (facts.interestsSummary.length > 0 || facts.rawTexts.interestsFreeText.length > 3) {
    lines.push("── CENTRES D'INTÉRÊT ──");
    facts.interestsSummary.forEach(s => lines.push(`• ${s}`));
    if (facts.rawTexts.interestsFreeText) {
      lines.push(`Autres (texte libre) : ${facts.rawTexts.interestsFreeText}`);
    }
    lines.push("");
  }

  // STYLE ATTENTIONNEL — dérivé du JOURNAL (usage interne, jamais affiché tel quel).
  // Une dimension ABSENTE n'est PAS un zéro : elle n'est pas déterminée, et le modèle n'a
  // pas le droit d'en parler. C'est la règle 7a appliquée à un nombre plutôt qu'à un mot.
  const etiquettes: Array<[keyof RadarJournal, string]> = [
    ["precision", "Précision"], ["emotion", "Émotion"], ["surprise", "Surprise"],
    ["esthetique", "Esthétique"], ["utilite", "Utilité"], ["temps", "Temps"],
    ["discretion", "Discrétion"],
  ];
  const connues = etiquettes
    .filter(([k]) => radar[k] !== null)
    .map(([k, nom]) => `${nom} ${radar[k]} (${radar.fondeSur[k as keyof typeof radar.fondeSur]} preuve(s))`);
  const inconnues = etiquettes.filter(([k]) => radar[k] === null).map(([, nom]) => nom);
  lines.push("── STYLE ATTENTIONNEL (dérivé du journal, usage interne) ──");
  lines.push(connues.length > 0 ? connues.join(" · ") : "Aucune dimension déterminée.");
  if (inconnues.length > 0) {
    lines.push(`NON DÉTERMINÉES, donc INTERDITES de commentaire (ne rien en dire, ni en bien ni en mal) : ${inconnues.join(", ")}`);
  }
  lines.push("");

  // Recent memories (signal enrichment)
  if (recentMemories.length > 0) {
    lines.push("── MÉMOIRES RÉCENTES (contexte vivant) ──");
    recentMemories.slice(0, 5).forEach(m => lines.push(`• ${m}`));
    lines.push("");
  }

  // ENTITÉS DU JOURNAL — nommées telles quelles, jamais interprétées (règle 7a), et les
  // REFUS en premier : une fiche qui oublie un refus fait recommander ce que la personne fuit.
  if (entities.evites.length > 0) {
    lines.push("── CE QU'ELLE REFUSE (déclaré, à ne JAMAIS proposer ni présenter comme un goût) ──");
    entities.evites.forEach((e) => lines.push(`• ${e}`));
    lines.push("");
  }
  const aimees: Array<[string, string[]]> = [
    ["Marques / maisons", entities.brands],
    ["Lieux", entities.places],
    ["Centres d'intérêt", entities.hobbies],
    ["Occasions", entities.events],
    ["Autres (livres, films, musiques, produits…)", entities.autres],
  ].filter(([, v]) => (v as string[]).length > 0) as Array<[string, string[]]>;
  if (aimees.length > 0) {
    lines.push("── CE QU'ELLE AIME (journal — NOMMER tel quel, ne RIEN en déduire) ──");
    aimees.forEach(([titre, vals]) => lines.push(`${titre} : ${vals.join(", ")}`));
    lines.push("");
  }

  lines.push("=== FIN DES DONNÉES ===");
  lines.push("");
  lines.push(`Genre grammatical à appliquer : ${gender}`);
  lines.push("Génère maintenant le JSON d'analyse. Tous les blocs doivent être remplis.");

  return lines.join("\n");
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(gender: Gender): string {
  return `Tu es Candice. Tu rédiges la fiche profil intime d'une personne à partir de l'ensemble de ses réponses.

${genderInstruction(gender)}

RÈGLES D'ÉCRITURE ABSOLUES :
- Ton : « tu sembles », « on devine », « quelque chose revient souvent », « chez toi »
- JAMAIS clinique, coach, MBTI/psy, "profil", "analyse", "score", "compatibilité"
- Humain, fin, légèrement émotionnel, nuancé, toujours positif dans la formulation
- Français, tutoiement (tu) pour summary / sections ; 3e personne pour summary_third_person
- JAMAIS de troncature « … » : chaque phrase est complète
- Candice ne juge jamais. Candice traduit.

INFORMATION SENSIBLE — INTERDICTION ABSOLUE DE LA NOMMER : santé, maladie, allergie,
intolérance, régime imposé, situation ou traitement médical, grossesse, contrainte de
mobilité, adresse. Même si une telle information t'était fournie, tu ne l'écris JAMAIS, ni
en clair, ni paraphrasée, ni par allusion. Cette fiche peut être PARTAGÉE avec un proche.
Candice connaît ces informations pour AGIR — écarter un restaurant, choisir un lieu
accessible — et ne les DIT jamais dans un texte : elles ne vivent que dans le bloc d'infos
pratiques, sous cadenas. (Elles sont normalement déjà filtrées en amont ; cette règle est
une sécurité de plus, parce qu'une seule couche ne suffit jamais.)

RÈGLES SUR LES SECTIONS :
- Analyse GLOBALE et transversale — JAMAIS dimension par dimension
- Si deux sections proches disent la même chose (ex: attention ≈ feels_loved), FUSIONNE-les en une lecture commune plus forte, et laisse l'autre vide ("text": "", "chips": [])
- "attention" = comment la personne REÇOIT l'attention des autres (les langages dans lesquels ELLE SE SENT aimée)
- "feels_loved" = les situations concrètes qui lui font vivre cela — PAS ce qu'elle donne, PAS comment elle exprime
- "what_touches" = ce qui la touche profondément (émotions, gestes, moments)
- Zéro redondance entre sections : un chip ou une idée n'apparaît que dans UNE seule section

RÈGLES SUR LES CHIPS :
- Courts (2-5 mots max), nets, non-redondants
- INTERDIT : fragments bruts ("Aime planifier et anticiper"), mots répétés dans 3+ sections
- Chips informatifs et actionables pour un proche (ex: "Cadeaux expérience", "Hôtel boutique", "Pas de surprises")
- Chips TOUJOURS compréhensibles hors contexte, du point de vue de la personne.
  INTERDIT : formulations ambiguës dont on ne sait pas qui est « toi »
  (ex. INTERDIT : "Marque connue de toi" → écrire "Une de tes marques fétiches")
- Si une sensibilité au luxe ou au premium ressort des réponses, traduis-la en
  un chip dans "gifts" (ex: "sensible au luxe", "belles maisons") — ce n'est
  plus un axe affiché, c'est un tag d'analyse

RÈGLES SPÉCIFIQUES POUR L'ENRICHISSEMENT :
- ANALYSER = ENRICHIR, jamais résumer. Rends la fiche la plus riche et la plus vivante possible sans jamais citer verbatim les réponses ouvertes.
- CONTEXTE DE CALIBRAGE : le bloc CONTEXTE (âge, profession, rôle familial) sert à CALIBRER le ton, l'univers, les occasions pertinentes et le niveau des suggestions — on ne contente pas un dirigeant comme un artisan, être père ou beau-père change quelles fêtes comptent, l'âge calibre tout. INTERDIT de le citer maladroitement dans les textes ("en tant que CEO de 45 ans tu…") : il informe l'analyse sans jamais y apparaître tel quel.
- Les réponses libres (adore_faire, evite_deteste, peu_savent, detail_compris, plus_beau_cadeau, cadeaux_non, envies_reves, remarquer, sentir_special, sujets_stimulants, marques_lieux, q17, couleurs_matieres, odeurs_detestees) doivent être PARAPHRASÉES et FONDUES dans les sections pertinentes — jamais copiées. Une seule citation italique paraphrasée courte est tolérée dans "points_fixes".
- Chaque chip est court (2-5 mots max), informatif, distinct. Pas de fragment de phrase brut, pas de mot répété entre sections.
- "insights" (3 phrases) = "Ce que Candice a compris" — 3 phrases courtes, actionables, qui donnent un angle non-évident. Format : "Tu es touchée par…", "Tu n'aimes pas…", "Tu préfères…".
- "modes" : 4 modes de tempérament, chacun 1-3 mots doux. Si "conflit" est déjà donné dans le prompt (via 'facts'), reprends-le en le reformulant en 1-3 mots. Pour stress/décision/canal : DÉDUIS-les qualitativement des axes tempérament + facts. Ne laisse JAMAIS un mode vide — propose la nuance la plus probable.
- "points_fixes" : les constantes irréductibles de la personne (ce qu'elle est, ce qu'elle déteste, ses rêves, ses fiertés). Fonds y peu_savent + sentir_special + sujets_stimulants + envies_reves + remarquer + evite_deteste. 5-6 chips courts + éventuellement une seule phrase italique paraphrasée (jamais copiée).
- "parfums" : synthèse olfactive (types aimés + ce qui répulse). 1 phrase + 2-3 chips (dont au maximum un chip "warm" type "déteste : X").
- Si une donnée manque totalement pour une section, laisser text: "" et chips: [] — sera géré côté UI avec un CTA.

RÈGLES V2 (nouvelle fiche) :
- Chaque section de "sections" (sauf attention_dna) porte AUSSI un champ "more" : un paragraphe long (3-4 phrases complètes) qui approfondit le "text" sans le répéter — c'est le contenu du « Lire plus ». Si la section est vide, "more" est "".
- "summary_long" : l'analyse complète, 3 paragraphes séparés par une ligne vide, chacun 2-3 phrases. Même ton que summary, plus profond. C'est ce que la personne lit en ouvrant « Lire l'analyse complète ».
- "podium_intro" : 1 phrase qui introduit le classement des langages d'attention (ex: « Chez toi, tous les langages comptent, mais ils ne se valent pas. ») en s'appuyant sur la dimension dominante. La 7e dimension GES se nomme TOUJOURS « Esthétique · qualité ».
- "understood_cards" : EXACTEMENT 4 cartes { "eyebrow": 1 mot-thème (ex: Écoute, Exécution, Lieux, Surprise), "text": 1-2 phrases }. Angles NON-évidents, distincts des insights.
- "works_phrases" : pour CHACUNE des 6 clés (beau, personnel, experientiel, utile, premium, surprise), 1 phrase courte qui illustre comment cette famille d'attention fonctionne chez la personne. Les NIVEAUX (Très fort / Fort / À doser) te sont fournis dans les données — ta phrase doit être cohérente avec le niveau indiqué, tu ne décides JAMAIS du niveau.
- "territory" : le territoire idéal de sortie/évasion. { "titre": accroche courte (ex: « Sortir du quotidien, sans l'inconfort subi »), "phrase": 1-2 phrases, "cartes": EXACTEMENT 3 cartes { "nom": 2-3 mots, "description": 1 ligne concrète, "statut": "desirable" ou "eviter" } — 2 désirables + 1 à éviter, déduites du profil (confort, aventure, lieux). }
- "universe" : { "lieux_ambiances": 4-6 tags de types de lieux où la personne se sent bien (ex: « Hôtels de caractère »), "matieres": 3-6 tags de matières/esthétique (depuis couleurs_matieres paraphrasé), "reves_envies": 4-7 tags courts (depuis envies_reves + rêves détectés), "phrase": 1 phrase élégante « ce que ça dit de ton univers » (sans commencer par « Ton univers raconte » à chaque fois — varie). }
- Si les données manquent pour territory ou universe, mettre null.

Retourne UNIQUEMENT ce JSON valide (aucun markdown, aucune explication) :
{
  "summary": "string — 2-3 phrases, résumé global en 2e personne (ton 'tu sembles')",
  "summary_third_person": "string — même synthèse mais en 3e personne neutre pour un proche (ex: 'Elle semble...', 'Il est touché par...', 'Pour lui faire plaisir...'). Accords selon le genre indiqué.",
  "summary_chips": ["string", "string", "string", "string"],
  "insights": [
    "string — phrase courte 'Tu es touchée par…' ou équivalent",
    "string — phrase courte 'Tu n'aimes pas…' ou équivalent",
    "string — phrase courte 'Tu préfères…' ou équivalent"
  ],
  "sections": {
    "attention":    { "text": "string — comment reçoit l'attention (2-3 phrases complètes)", "chips": ["string", "string", "string"], "more": "string — paragraphe long Lire plus" },
    "what_touches": { "text": "string — ce qui la/le touche vraiment (2-3 phrases)", "chips": ["string", "string", "string"], "more": "string" },
    "feels_loved":  { "text": "string — situations concrètes de réception (2-3 phrases) — si trop similaire à 'attention', laisser vide", "chips": ["string", "string"], "more": "string" },
    "gifts":        { "text": "string — quel type de cadeau lui parle (2-3 phrases)", "chips": ["string", "string", "string"], "more": "string" },
    "avoid":        { "text": "string — ce qu'il vaut mieux éviter, en intégrant le texte libre q17 et cadeaux_non paraphrasés", "chips": ["string", "string", "string"], "more": "string" },
    "style":        { "text": "string — univers esthétique, en intégrant couleurs_matieres paraphrasé", "chips": ["string", "string"], "more": "string" },
    "brands":       { "text": "string — marques / univers (1-2 phrases, ou vide si aucune donnée)", "chips": [], "more": "string" },
    "restaurants":  { "text": "string — tables et cuisines (1-2 phrases, ou vide si aucune donnée)", "chips": ["string", "string"], "more": "string" },
    "travel":       { "text": "string — comment voyage (1-2 phrases, ou vide si aucune donnée)", "chips": ["string", "string"], "more": "string" },
    "hobbies":      { "text": "string — passions et loisirs (1-2 phrases, ou vide si aucune donnée)", "chips": ["string", "string", "string"], "more": "string" },
    "parfums":      { "text": "string — synthèse olfactive (1 phrase, ou vide si aucune donnée)", "chips": ["string", "string"], "more": "string" },
    "points_fixes": { "text": "string — « À savoir pour viser juste » : 1 phrase de synthèse OU une paraphrase italique courte (jamais citation brute)", "chips": ["string", "string", "string", "string", "string"], "more": "string" },
    "attention_dna":{ "text": "string — synthèse ADN attentions (2-3 phrases)", "chips": ["string", "string"] }
  },
  "summary_long": "string — 3 paragraphes séparés par une ligne vide",
  "podium_intro": "string — 1 phrase d'introduction du podium",
  "understood_cards": [{ "eyebrow": "string — 1 mot", "text": "string — 1-2 phrases" }],
  "works_phrases": { "beau": "string", "personnel": "string", "experientiel": "string", "utile": "string", "premium": "string", "surprise": "string" },
  "territory": { "titre": "string", "phrase": "string", "cartes": [{ "nom": "string", "description": "string", "statut": "desirable" }] },
  "universe": { "lieux_ambiances": ["string"], "matieres": ["string"], "reves_envies": ["string"], "phrase": "string" },
  "modes": {
    "conflit":  "string — 1-3 mots doux (ex: 'temporise', 'confronte', 'humour')",
    "stress":   "string — 1-3 mots doux (ex: 'se replie', 'agit', 'partage')",
    "decision": "string — 1-3 mots doux (ex: 'réfléchie', 'intuitive', 'consultative')",
    "canal":    "string — 1-3 mots doux (ex: 'message écrit', 'voix', 'en face à face')"
  },
  "must_haves": ["string", "string", "string"],
  "deal_breakers": ["string", "string", "string"],
  "attention_dna": [{ "dimension": "string", "intensity": 0, "note": "string" }],
  "constraints": ["string"],
  "confidence": 0.0
}

Règles confidence : 0.3 = peu de données, 0.6 = questionnaire de base, 0.85 = questionnaire + singularité, 1.0 = tout + mémoires.`;
}

// Portrait VIDE nommé : l'état d'un journal qu'on n'a pas pu lire. Il rend un radar dont
// toutes les dimensions valent `null` — donc un écran qui se tait, pas un écran qui affirme
// que tout est à zéro. Il n'est JAMAIS un repli sur autre chose que le journal.
const PORTRAIT_VIDE = {
  scope: { about: { kind: "account", id: "" }, ownerId: "" },
  nbPreuves: 0,
  profile: [], interests: [], entities: [], preferences: [], behaviors: [],
  guardrails: [], needs: [], drivers: [], contexts: [],
  affection: {
    receive: Object.fromEntries(AFFECTION_MODALITIES.map((m) => [m, { score: "unknown", evidenceCount: 0, confidence: "none" }])),
    give:    Object.fromEntries(AFFECTION_MODALITIES.map((m) => [m, { score: "unknown", evidenceCount: 0, confidence: "none" }])),
  },
} as never;

// ── Main export ────────────────────────────────────────────────────────────────

export async function generateProfileAnalysis(
  userId: string,
  contactId: string | null,
  supabase: SupabaseClient,
): Promise<{ success: boolean; analysisId?: string; reason?: string }> {
  const correlationId = crypto.randomUUID();
  const tStart = Date.now();

  async function logStep(
    step: string,
    status: string,
    durationMs: number,
    errorMessage?: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      const { error } = await supabase.from("processing_log").insert({
        correlation_id: correlationId,
        pilot_id: userId,
        memory_id: null,
        step,
        status,
        duration_ms: durationMs,
        error_message: errorMessage ?? null,
        metadata: metadata ?? null,
      });
      // supabase-js ne lève pas d'exception sur erreur DB : elle est dans .error.
      if (error) console.error("[processing_log] insert rejeté", correlationId, step, error.message);
    } catch (e) {
      console.error("[processing_log] exception", correlationId, step, e instanceof Error ? e.message : String(e));
    }
  }

  // ── 1. Read profile data ──────────────────────────────────────────────────

  const t1 = Date.now();

  type ProfileRow = {
    attention_reception: unknown;
    attention_expression: unknown;
    temperament_axes: unknown;
    temperament_modes: unknown;
    lifestyle_axes: unknown;
    relational_filters: unknown;
    practical_info: unknown;
    singularity_answers: unknown;
    discovery_answers: unknown;
    grammatical_gender: string | null;
  };

  const { data: rawProfile } = await supabase
    .from("my_profile")
    .select([
      "attention_reception",
      "attention_expression",
      "temperament_axes",
      "temperament_modes",
      "lifestyle_axes",
      "relational_filters",
      "practical_info",
      "singularity_answers",
      "discovery_answers",
      "grammatical_gender",
    ].join(", "))
    .eq("user_id", userId)
    .maybeSingle();

  const profile = rawProfile as ProfileRow | null;

  if (!profile?.attention_reception || !profile?.attention_expression) {
    await logStep("generate_analysis", "skipped", Date.now() - t1, undefined, { reason: "insufficient_data" });
    return { success: false, reason: "insufficient_data" };
  }

  // ── 2. Compute structured facts (dimension scoring) ───────────────────────

  const facts = computeProfileSynthesis({
    reception:         profile.attention_reception as FaceResult,
    expression:        profile.attention_expression as FaceResult,
    temperamentAxes:   (profile.temperament_axes as Record<string, { score: number; intensity: number }> | null) ?? null,
    temperamentModes:  (profile.temperament_modes as Record<string, { label: string; intensity: number } | null> | null) ?? null,
    lifestyleAxes:     (profile.lifestyle_axes as Record<string, { score: number; intensity: number }> | null) ?? null,
    relationalFilters: (profile.relational_filters as RelationalFilters | null) ?? null,
    practicalInfo:     (profile.practical_info as { vetos?: Record<string, unknown> } | null) ?? null,
    singularity:       (profile.singularity_answers as Record<string, string> | null) ?? null,
  });

  // ── 3. Determine gender ───────────────────────────────────────────────────

  const pi = profile.practical_info as Record<string, string> | null;
  const gender = resolveGender(profile.grammatical_gender, pi?.sexe);

  // ── 4. Entités : LUES DANS LE JOURNAL, jamais ré-extraites ────────────────

  const t4 = Date.now();
  const singularity = (profile.singularity_answers as Record<string, string> | null) ?? null;

  let entities = { brands: [] as string[], places: [] as string[], hobbies: [] as string[],
                   events: [] as string[], autres: [] as string[], evites: [] as string[] };
  let entitiesStatus: "success" | "fallback" = "fallback";
  // Une SEULE lecture du portrait pour toute la page : entités, radar, attention, « ce qui
  // marche ». Deux lectures pourraient diverger, et la divergence se verrait à l'écran.
  let radar = radarDuPortrait(PORTRAIT_VIDE);
  let attention = attentionDuPortrait(PORTRAIT_VIDE);
  let ceQuiMarche: ReturnType<typeof ceQuiMarcheDuPortrait> | null = null;
  try {
    const portrait = await lirePortrait(supabase as never, { userId });
    entities = entitesDuJournal(portrait);
    radar = radarDuPortrait(portrait);
    attention = attentionDuPortrait(portrait);
    ceQuiMarche = ceQuiMarcheDuPortrait(portrait);
    entitiesStatus = "success";
    await logStep("entity_extraction", "success", Date.now() - t4, undefined,
      { count: nbEntites(entities), evites: entities.evites.length, preuves: portrait.nbPreuves });
  } catch (e) {
    // Journal illisible → aucune entité, et on le DIT. Jamais de repli sur une seconde
    // extraction : une fiche sans puces est honnête, une fiche nourrie d'ailleurs ne l'est pas.
    console.error("[analyse] lecture du journal impossible", correlationId, e);
    await logStep("entity_extraction", "error", Date.now() - t4,
      e instanceof Error ? e.message : String(e));
  }

  // ── 5. Fetch recent memories (signal context) ─────────────────────────────

  const { data: memoriesRows } = await supabase
    .from("memories")
    .select("sanitized_summary")
    .eq("pilot_id", userId)
    .eq("status", "actif")
    .order("created_at", { ascending: false })
    .limit(8);

  const recentMemories = (memoriesRows ?? [])
    .map((r: { sanitized_summary: string }) => r.sanitized_summary)
    .filter(Boolean);

  // ── 6. Generate narrative via Sonnet ──────────────────────────────────────

  const t6 = Date.now();
  const systemPrompt = buildSystemPrompt(gender);
  // V2 : niveaux « Ce qui marche » calculés DÉTERMINISTES (arbitrage 9) —
  // injectés au prompt pour que les phrases collent aux niveaux, jamais l'inverse.
  // NIVEAUX « CE QUI MARCHE » — dérivés du journal. Une clé que rien ne fonde est ABSENTE
  // de la ligne : écrire « faible » pour « on ne sait pas » est précisément la confusion que
  // tout ce lot corrige.
  const etablis = ceQuiMarche
    ? Object.entries(ceQuiMarche).filter(([, v]) => v !== null)
    : [];
  const muettes = ceQuiMarche
    ? Object.entries(ceQuiMarche).filter(([, v]) => v === null).map(([k]) => k)
    : [];
  const worksLevelsLine = etablis.length > 0
    ? `\nNIVEAUX « CE QUI MARCHE » (dérivés du journal, à respecter tels quels) : ${
        etablis.map(([k, v]) => `${k}=${v}`).join(" · ")}` +
      (muettes.length > 0 ? `\nNON DÉTERMINÉS, à NE PAS mentionner : ${muettes.join(", ")}` : "")
    : "";
  const userMessage = buildAnalysisPrompt({
    facts,
    practicalInfo:     (profile.practical_info as Record<string, unknown> | null) ?? null,
    singularity,
    discoveryAnswers:  (profile.discovery_answers as Record<string, unknown> | null) ?? null,
    recentMemories,
    entities,
    radar,
    attention,
    gender,
  }) + worksLevelsLine;

  let result: ProfileAnalysisResult;
  let aiStatus = "success";
  let sonnetCleaned = "";

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    sonnetCleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    result = JSON.parse(sonnetCleaned) as ProfileAnalysisResult;
  } catch (err) {
    console.error("[analyse][generate_narrative] échec parsing/appel Sonnet", {
      correlationId,
      model: "claude-sonnet-4-6",
      message: err instanceof Error ? err.message : String(err),
      snippet: sonnetCleaned.slice(0, 300),
    });
    aiStatus = "fallback";
    // Deterministic fallback — build from facts only.
    // Aucune fuite brute : les champs sans analyse restent vides (l'UI gère via CTA).
    const conflitFromModes = ((profile.temperament_modes as Record<string, { label?: string } | null> | null)?.conflit)?.label ?? "";
    result = {
      summary: facts.touchInsights.length > 0
        ? `Tu sembles particulièrement sensible à ${facts.touchInsights[0]}.`
        : "Candice apprend à te connaître.",
      summary_third_person: facts.touchInsights.length > 0
        ? `Cette personne semble particulièrement sensible à ${facts.touchInsights[0]}.`
        : "Candice apprend à la connaître.",
      summary_chips: attention.recues.slice(0, 4),
      insights: [
        facts.touchInsights[0] ? `Tu es sensible à ${facts.touchInsights[0]}.` : "",
        facts.avoidAlerts[0] ? `Tu préfères éviter ${facts.avoidAlerts[0]}.` : "",
        facts.idealAttentions[0] ? `Tu apprécies ${facts.idealAttentions[0]}.` : "",
      ].filter(Boolean),
      sections: {
        attention:    { text: facts.idealAttentions[0] ?? "", chips: attention.recues.slice(0, 3) },
        what_touches: { text: facts.touchInsights[0] ?? "", chips: [] },
        feels_loved:  { text: "", chips: [] },
        gifts:        { text: "", chips: [] },
        avoid:        { text: facts.avoidAlerts[0] ?? "", chips: facts.avoidAlerts.slice(0, 3) },
        style:        { text: "", chips: [] },
        brands:       { text: "", chips: [] },
        restaurants:  { text: "", chips: [] },
        travel:       { text: "", chips: [] },
        hobbies:      { text: "", chips: [] },
        parfums:      { text: "", chips: [] },
        points_fixes: { text: "", chips: [] },
        attention_dna:{ text: facts.idealAttentions.join(". "), chips: [] },
      },
      modes: {
        conflit:  conflitFromModes || "",
        stress:   "",
        decision: "",
        canal:    "",
      },
      must_haves: facts.touchInsights.slice(0, 3),
      deal_breakers: [...new Set([...entities.evites, ...facts.avoidAlerts])].slice(0, 3),
      attention_dna: attention.recues.slice(0, 3).map((dim, i) => ({
        dimension: dim,
        intensity: i === 0 ? 80 : 50,
        note: "",
      })),
      // STRUCTUREL, plus lexical : le filtre par mot-clé ratait « arachide », « lactose »,
      // « sans gluten » — tout ce qui ne contient pas littéralement « allergie ».
      constraints: facts.contraintesPratiques,
      entities,
      confidence: facts.hasTemperamentData && facts.hasSingularityData ? 0.6 : 0.3,
      // V2 : le fallback ne fabrique jamais de narratif — champs vides, l'UI gère
      summary_long: "",
      podium_intro: "",
      understood_cards: [],
      works_phrases: {},
      territory: null,
      universe: null,
    };
    await logStep("generate_narrative", aiStatus, Date.now() - t6, String(err));
  }

  if (aiStatus === "success") {
    await logStep("generate_narrative", "success", Date.now() - t6, undefined, {
      confidence: result.confidence,
      sections_count: Object.keys(result.sections ?? {}).length,
    });
  }

  // ── 7. Build source label ─────────────────────────────────────────────────

  const sourceComponents: string[] = ["questionnaire"];
  if (recentMemories.length > 0) sourceComponents.push("memories");
  const discoveryAnswersObj = profile.discovery_answers as Record<string, unknown> | null;
  if (discoveryAnswersObj && Object.keys(discoveryAnswersObj).length > 0) {
    sourceComponents.push("discovery");
  }
  const source = sourceComponents.join("+");

  // ── 8. Dimension scores (internal, never displayed) ───────────────────────

  // Jauges de la page « Nous » : le classement vient du JOURNAL. Une modalité absente n'y
  // figure pas du tout — elle n'y figure pas à 0, qui se lirait « ça ne lui parle pas ».
  const dimensionScores: Record<string, number> = {};
  [...attention.recues, ...attention.donnees].forEach((dim, i) => {
    dimensionScores[dim] = Math.max(0, 80 - i * 15);
  });

  // ── 9. Upsert to profile_analysis ─────────────────────────────────────────

  const payload = {
    user_id:               userId,
    contact_id:            contactId,
    summary:               result.summary ?? null,
    summary_third_person:  result.summary_third_person ?? null,
    summary_chips:         result.summary_chips ?? null,
    insights:         (result.insights ?? []).filter(s => s && s.trim().length > 0),
    sections:         result.sections ?? null,
    modes:            result.modes ?? null,
    style_radar:      radar,
    dimension_scores: dimensionScores,
    must_haves:       result.must_haves ?? null,
    deal_breakers:    result.deal_breakers ?? null,
    attention_dna:    result.attention_dna ?? null,
    constraints:      result.constraints ?? null,
    entities,
    gender,
    confidence:       Math.min(1, Math.max(0, result.confidence ?? 0.5)),
    source,
    generated_at:     new Date().toISOString(),
    engine_version:   "2.2",
    generation_meta: {
      entity_extraction: { status: entitiesStatus, source: "journal", model: null },
      narrative:         { status: aiStatus, model: "claude-sonnet-4-6" },
      generated_at:      new Date().toISOString(),
    },
    // ── Champs V2 (migration 54) — statuts territory assainis côté code ──
    summary_long:     result.summary_long?.trim() || null,
    podium_intro:     result.podium_intro?.trim() || null,
    understood_cards: (result.understood_cards ?? [])
      .filter(c => c?.eyebrow && c?.text).slice(0, 4),
    works_phrases:    result.works_phrases ?? null,
    territory: result.territory?.cartes?.length
      ? {
          titre: result.territory.titre ?? "",
          phrase: result.territory.phrase ?? "",
          cartes: result.territory.cartes.slice(0, 3).map(c => ({
            nom: c.nom ?? "",
            description: c.description ?? "",
            statut: c.statut === "eviter" ? "eviter" : "desirable",
          })),
        }
      : null,
    universe: result.universe
      ? {
          lieux_ambiances: result.universe.lieux_ambiances ?? [],
          matieres: result.universe.matieres ?? [],
          reves_envies: result.universe.reves_envies ?? [],
          phrase: result.universe.phrase ?? "",
        }
      : null,
  };

  let analysisId: string | undefined;

  const { data: existing } = await supabase
    .from("profile_analysis")
    .select("id")
    .eq("user_id", userId)
    .is("contact_id", null)
    .maybeSingle();

  if (existing?.id) {
    const { error: updErr } = await supabase
      .from("profile_analysis")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (updErr) console.error("[generateProfileAnalysis] profile_analysis update", updErr.message);
    analysisId = existing.id;
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from("profile_analysis")
      .insert(payload)
      .select("id")
      .single();
    if (insErr) console.error("[generateProfileAnalysis] profile_analysis insert", insErr.message);
    analysisId = inserted?.id;
  }

  await logStep("generate_analysis", "success", Date.now() - tStart, undefined, {
    analysis_id: analysisId,
    gender,
    source,
    confidence: payload.confidence,
  });

  // D1 : recalcul d'analyse → pré-calcul des reformulations des prochaines
  // questions (le rendu Discovery ne fait plus JAMAIS d'appel LLM).
  // Jamais bloquant pour l'analyse elle-même (erreurs avalées en interne).
  await precomputeUpcomingPersonalizations(
    userId,
    supabase,
    { sections: (payload.sections as Record<string, { text?: string; chips?: string[] }> | null) ?? null },
  );

  return { success: true, analysisId };
}
