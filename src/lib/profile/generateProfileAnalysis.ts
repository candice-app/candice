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
  summary_chips: string[];
  sections: Record<string, { text: string; chips: string[] }>;
  must_haves: string[];
  deal_breakers: string[];
  attention_dna: Array<{ dimension: string; intensity: number; note: string }>;
  constraints: string[];
  entities: { brands: string[]; places: string[]; hobbies: string[]; events: string[] };
  confidence: number;
}

// ── Gender helpers ────────────────────────────────────────────────────────────

function resolveGender(sexe: string | null | undefined): Gender {
  if (sexe === "femme") return "feminine";
  if (sexe === "homme") return "masculine";
  return "neutral";
}

function genderInstruction(gender: Gender): string {
  if (gender === "feminine") {
    return "La personne décrite est une femme : accords féminins systématiques (elle, sa, ses, contente, aimée, etc.).";
  }
  if (gender === "masculine") {
    return "La personne décrite est un homme : accords masculins systématiques (il, son, ses, content, aimé, etc.).";
  }
  return "Le genre n'est pas précisé : utilise des formulations inclusives avec le point médian (content·e, aimé·e, etc.) ou reformule pour éviter l'accord.";
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
    const parts: string[] = [];
    if (pi.age) parts.push(`âge : ${pi.age}`);
    if (pi.profession) parts.push(`profession : ${pi.profession}`);
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
  }

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
  return `Tu es Candice. Tu rédiges la fiche profil intime d'une personne à partir de toutes ses réponses.

${genderInstruction(gender)}

Règles absolues :
- Ton : « tu sembles », « on devine », « il est possible que », « quelque chose revient souvent », « chez toi »
- Jamais clinique, jamais coach, jamais MBTI/psy, jamais "profil", jamais "analyse", jamais "score"
- Court, humain, fin, légèrement émotionnel, nuancé
- Tous les blocs doivent être renseignés — analyse globale et transversale, jamais dimension par dimension
- Pas de redondance entre les sections
- Français, tutoiement (tu)
- Candice ne juge jamais. Candice traduit.

Retourne UNIQUEMENT ce JSON valide (aucun markdown, aucune explication) :
{
  "summary": "string — 2-3 phrases de synthèse (ton 'tu sembles'), résumé global",
  "summary_chips": ["string", "string", "string", "string"],
  "sections": {
    "attention": { "text": "string — comment la personne aime vraiment recevoir l'attention (2-3 phrases)", "chips": ["string", "string", "string"] },
    "what_touches": { "text": "string — ce qui la touche vraiment (2-3 phrases)", "chips": ["string", "string", "string"] },
    "feels_loved": { "text": "string — comment elle se sent aimée concrètement (2-3 phrases)", "chips": ["string", "string"] },
    "gifts": { "text": "string — quel type de cadeau lui parle vraiment (2-3 phrases)", "chips": ["string", "string", "string"] },
    "avoid": { "text": "string — ce qu'il vaut mieux éviter absolument (2-3 phrases)", "chips": ["string", "string", "string"] },
    "style": { "text": "string — son univers esthétique et ses goûts (2-3 phrases, ou chaîne vide si aucune donnée)", "chips": [] },
    "brands": { "text": "string — marques / univers qui lui correspondent (1-2 phrases, ou chaîne vide si aucune donnée)", "chips": [] },
    "restaurants": { "text": "string — ses tables et cuisines préférées (1-2 phrases, ou chaîne vide si aucune donnée)", "chips": [] },
    "travel": { "text": "string — comment elle voyage (1-2 phrases, ou chaîne vide si aucune donnée)", "chips": [] },
    "hobbies": { "text": "string — ce qui la ressource et ses passions (1-2 phrases, ou chaîne vide si aucune donnée)", "chips": [] },
    "attention_dna": { "text": "string — synthèse de son ADN attentions (2-3 phrases)", "chips": ["string", "string"] }
  },
  "must_haves": ["string", "string", "string"],
  "deal_breakers": ["string", "string", "string"],
  "attention_dna": [
    { "dimension": "string", "intensity": 0, "note": "string" }
  ],
  "constraints": ["string"],
  "confidence": 0.0
}

Règles sur confidence : 0.3 = peu de données, 0.6 = données questionnaire de base, 0.85 = questionnaire complet + singularité, 1.0 = tout rempli + mémoires.`;
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
  const gender = resolveGender(pi?.sexe);

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
    // Deterministic fallback — build from facts
    result = {
      summary: facts.touchInsights.length > 0
        ? `Tu sembles particulièrement sensible à ${facts.touchInsights[0]}.`
        : "Candice apprend à te connaître.",
      summary_chips: facts.topReceptionDims.slice(0, 4),
      sections: {
        attention:    { text: facts.idealAttentions[0] ?? "", chips: facts.topReceptionDims.slice(0, 3) },
        what_touches: { text: facts.touchInsights[0] ?? "", chips: [] },
        feels_loved:  { text: facts.topReceptionDims[0] ?? "", chips: [] },
        gifts:        { text: "", chips: [] },
        avoid:        { text: facts.avoidAlerts[0] ?? "", chips: facts.avoidAlerts.slice(0, 3) },
        style:        { text: "", chips: [] },
        brands:       { text: singularity?.marques_lieux?.slice(0, 80) ?? "", chips: [] },
        restaurants:  { text: "", chips: [] },
        travel:       { text: "", chips: [] },
        hobbies:      { text: singularity?.adore_faire?.slice(0, 80) ?? "", chips: [] },
        attention_dna:{ text: facts.idealAttentions.join(". "), chips: [] },
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
    user_id:          userId,
    contact_id:       contactId,
    summary:          result.summary ?? null,
    summary_chips:    result.summary_chips ?? null,
    sections:         result.sections ?? null,
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
    engine_version:   "2.0",
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
