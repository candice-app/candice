// Moteur d'analyse global — Lot 2 Phase 2
// Source unique : lit TOUTES les réponses, produit une synthèse multi-dimensions
// via Claude Sonnet. Jamais dimension par dimension.
// Sauvegarde dans profile_analysis (source de vérité).

import Anthropic from "@anthropic-ai/sdk";
import { computeProfileSynthesis } from "./synthesis";
import type { FaceResult } from "@/lib/attention/scoring";
import type { RelationalFilters } from "@/lib/lifestyle/scoring";
import type { SupabaseClient } from "@supabase/supabase-js";

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

// ── Entity extraction via Haiku ───────────────────────────────────────────────

async function extractEntities(
  textFields: string[],
): Promise<{ brands: string[]; places: string[]; hobbies: string[]; events: string[] }> {
  const combined = textFields.filter(Boolean).join("\n");
  if (combined.trim().length < 10) {
    return { brands: [], places: [], hobbies: [], events: [] };
  }

  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: `Extrais les entités nommées du texte. Retourne uniquement du JSON valide :
{"brands":["..."],"places":["..."],"hobbies":["..."],"events":["..."]}
- brands : marques, enseignes, créateurs
- places : restaurants, villes, lieux nommés
- hobbies : activités, passions nommées
- events : occasions, fêtes, événements nommés
Ne génère que le JSON, sans explication.`,
      messages: [{ role: "user", content: combined.slice(0, 800) }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { brands: [], places: [], hobbies: [], events: [] };
  }
}

// ── Build user message for Sonnet ─────────────────────────────────────────────

function buildAnalysisPrompt(data: {
  facts: ReturnType<typeof computeProfileSynthesis>;
  practicalInfo: Record<string, unknown> | null;
  singularity: Record<string, string> | null;
  discoveryAnswers: Record<string, unknown> | null;
  recentMemories: string[];
  gender: Gender;
}): string {
  const { facts, practicalInfo, singularity, discoveryAnswers, recentMemories, gender } = data;
  const lines: string[] = ["=== DONNÉES PROFIL COMPLÈTES ===", ""];

  // Attention
  lines.push("── ATTENTION ──");
  lines.push(`Réception dominante : ${facts.topReceptionDims.join(", ") || "non déterminée"}`);
  lines.push(`Expression naturelle : ${facts.topExpressionDims.join(", ") || "non déterminée"}`);
  lines.push(`Contraste réception/expression : ${facts.hasReceptionExpressionContrast ? "oui" : "non"}`);
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
      if (v.mobility_constraints) parts.push("contrainte mobilité");
      if (Array.isArray(v.allergies) && v.allergies.length > 0) {
        parts.push(`allergies : ${(v.allergies as string[]).join(", ")}`);
      }
    }
    if (parts.length > 0) {
      lines.push("── INFO PRATIQUE ──");
      lines.push(parts.join(" | "));
      lines.push("");
    }

    // Mobilité / santé — texte libre (nuance émotionnelle)
    if (typeof pi.mobilite_sante === "string" && pi.mobilite_sante.trim().length > 3) {
      lines.push("── MOBILITÉ / SANTÉ (texte libre) ──");
      lines.push(pi.mobilite_sante.trim().slice(0, 200));
      lines.push("");
    }

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

  // Style radar (usage interne — informe Claude de la forme du profil sans qu'il l'affiche)
  const r = facts.styleRadar;
  lines.push("── STYLE ATTENTIONNEL (radar 7 axes, usage interne) ──");
  lines.push(`Précision ${r.precision} · Émotion ${r.emotion} · Surprise ${r.surprise} · Esthétique ${r.esthetique} · Utilité ${r.utilite} · Temps ${r.temps} · Discrétion ${r.discretion}`);
  lines.push("");

  // Recent memories (signal enrichment)
  if (recentMemories.length > 0) {
    lines.push("── MÉMOIRES RÉCENTES (contexte vivant) ──");
    recentMemories.slice(0, 5).forEach(m => lines.push(`• ${m}`));
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
- Les réponses libres (adore_faire, evite_deteste, peu_savent, detail_compris, plus_beau_cadeau, cadeaux_non, envies_reves, remarquer, sentir_special, sujets_stimulants, marques_lieux, q17, couleurs_matieres, odeurs_detestees, mobilité/santé) doivent être PARAPHRASÉES et FONDUES dans les sections pertinentes — jamais copiées. Une seule citation italique paraphrasée courte est tolérée dans "points_fixes".
- Chaque chip est court (2-5 mots max), informatif, distinct. Pas de fragment de phrase brut, pas de mot répété entre sections.
- "insights" (3 phrases) = "Ce que Candice a compris" — 3 phrases courtes, actionables, qui donnent un angle non-évident. Format : "Tu es touchée par…", "Tu n'aimes pas…", "Tu préfères…".
- "modes" : 4 modes de tempérament, chacun 1-3 mots doux. Si "conflit" est déjà donné dans le prompt (via 'facts'), reprends-le en le reformulant en 1-3 mots. Pour stress/décision/canal : DÉDUIS-les qualitativement des axes tempérament + facts. Ne laisse JAMAIS un mode vide — propose la nuance la plus probable.
- "points_fixes" : les constantes irréductibles de la personne (ce qu'elle est, ce qu'elle déteste, ses rêves, ses fiertés). Fonds y peu_savent + sentir_special + sujets_stimulants + envies_reves + remarquer + evite_deteste. 5-6 chips courts + éventuellement une seule phrase italique paraphrasée (jamais copiée).
- "parfums" : synthèse olfactive (types aimés + ce qui répulse). 1 phrase + 2-3 chips (dont au maximum un chip "warm" type "déteste : X").
- Si une donnée manque totalement pour une section, laisser text: "" et chips: [] — sera géré côté UI avec un CTA.

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
    "attention":    { "text": "string — comment reçoit l'attention (2-3 phrases complètes)", "chips": ["string", "string", "string"] },
    "what_touches": { "text": "string — ce qui la/le touche vraiment (2-3 phrases)", "chips": ["string", "string", "string"] },
    "feels_loved":  { "text": "string — situations concrètes de réception (2-3 phrases) — si trop similaire à 'attention', laisser vide", "chips": ["string", "string"] },
    "gifts":        { "text": "string — quel type de cadeau lui parle (2-3 phrases)", "chips": ["string", "string", "string"] },
    "avoid":        { "text": "string — ce qu'il vaut mieux éviter, en intégrant le texte libre q17 et cadeaux_non paraphrasés", "chips": ["string", "string", "string"] },
    "style":        { "text": "string — univers esthétique, en intégrant couleurs_matieres paraphrasé", "chips": ["string", "string"] },
    "brands":       { "text": "string — marques / univers (1-2 phrases, ou vide si aucune donnée)", "chips": [] },
    "restaurants":  { "text": "string — tables et cuisines (1-2 phrases, ou vide si aucune donnée)", "chips": ["string", "string"] },
    "travel":       { "text": "string — comment voyage (1-2 phrases, ou vide si aucune donnée)", "chips": ["string", "string"] },
    "hobbies":      { "text": "string — passions et loisirs (1-2 phrases, ou vide si aucune donnée)", "chips": ["string", "string", "string"] },
    "parfums":      { "text": "string — synthèse olfactive (1 phrase, ou vide si aucune donnée)", "chips": ["string", "string"] },
    "points_fixes": { "text": "string — 1 phrase de synthèse OU une paraphrase italique courte (jamais citation brute)", "chips": ["string", "string", "string", "string", "string"] },
    "attention_dna":{ "text": "string — synthèse ADN attentions (2-3 phrases)", "chips": ["string", "string"] }
  },
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
      await supabase.from("processing_log").insert({
        correlation_id: correlationId,
        pilot_id: userId,
        memory_id: null,
        step,
        status,
        duration_ms: durationMs,
        error_message: errorMessage ?? null,
        metadata: metadata ?? null,
      });
    } catch { /* log failure must never break the engine */ }
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

  // ── 4. Extract entities (Haiku, non-blocking) ─────────────────────────────

  const t4 = Date.now();
  const singularity = (profile.singularity_answers as Record<string, string> | null) ?? null;
  const textFields = singularity
    ? [
        singularity.marques_lieux ?? "",
        singularity.adore_faire ?? "",
        singularity.sujets_stimulants ?? "",
        singularity.envies_reves ?? "",
      ]
    : [];

  const entities = await extractEntities(textFields);
  await logStep("entity_extraction", "success", Date.now() - t4, undefined, { count: Object.values(entities).flat().length });

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
  const userMessage = buildAnalysisPrompt({
    facts,
    practicalInfo:     (profile.practical_info as Record<string, unknown> | null) ?? null,
    singularity,
    discoveryAnswers:  (profile.discovery_answers as Record<string, unknown> | null) ?? null,
    recentMemories,
    gender,
  });

  let result: ProfileAnalysisResult;
  let aiStatus = "success";

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    result = JSON.parse(cleaned) as ProfileAnalysisResult;
  } catch (err) {
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
      summary_chips: facts.topReceptionDims.slice(0, 4),
      insights: [
        facts.touchInsights[0] ? `Tu es sensible à ${facts.touchInsights[0]}.` : "",
        facts.avoidAlerts[0] ? `Tu préfères éviter ${facts.avoidAlerts[0]}.` : "",
        facts.idealAttentions[0] ? `Tu apprécies ${facts.idealAttentions[0]}.` : "",
      ].filter(Boolean),
      sections: {
        attention:    { text: facts.idealAttentions[0] ?? "", chips: facts.topReceptionDims.slice(0, 3) },
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
      deal_breakers: facts.avoidAlerts.slice(0, 3),
      attention_dna: facts.topReceptionDims.slice(0, 3).map((dim, i) => ({
        dimension: dim,
        intensity: i === 0 ? 80 : 50,
        note: "",
      })),
      constraints: facts.avoidAlerts.filter(a =>
        a.includes("alcool") || a.includes("halal") || a.includes("allergie") || a.includes("mobilité")
      ),
      entities,
      confidence: facts.hasTemperamentData && facts.hasSingularityData ? 0.6 : 0.3,
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

  const dimensionScores: Record<string, number> = {};
  const topDims = [...facts.topReceptionDims, ...facts.topExpressionDims];
  topDims.forEach((dim, i) => {
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
    style_radar:      facts.styleRadar,
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
    engine_version:   "2.1",
  };

  let analysisId: string | undefined;

  const { data: existing } = await supabase
    .from("profile_analysis")
    .select("id")
    .eq("user_id", userId)
    .is("contact_id", null)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("profile_analysis")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    analysisId = existing.id;
  } else {
    const { data: inserted } = await supabase
      .from("profile_analysis")
      .insert(payload)
      .select("id")
      .single();
    analysisId = inserted?.id;
  }

  await logStep("generate_analysis", "success", Date.now() - tStart, undefined, {
    analysis_id: analysisId,
    gender,
    source,
    confidence: payload.confidence,
  });

  return { success: true, analysisId };
}
