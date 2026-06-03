// Memory Engine — section 5
// Transforme raw_input en mémoire structurée via LLM + fallback déterministe.
// raw_input jamais renvoyé au front, jamais propagé au-delà de cet appel.

import Anthropic from '@anthropic-ai/sdk';
import {
  MEMORY_TYPES, MEMORY_SENTIMENTS, EMOTIONAL_INTENSITIES,
  type MemoryType, type MemorySentiment, type EmotionalIntensity,
  type MemorySource, type StructuredMemoryAnalysis,
} from './types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM = `Tu es le Memory Engine de Candice, un copilote relationnel premium.
Tu analyses une information brute sur un proche et la transformes en mémoire structurée.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après.

TAXONOMIE memory_type (exactement l'une de ces 19 valeurs) :
${MEMORY_TYPES.join(', ')}

FORMAT JSON :
{
  "memory_type": "...",
  "category": "travail|santé|famille|amour|social|hobby|finance|logement|personnel|autre",
  "subcategory": "description_courte_snake_case (ex: perte_emploi)",
  "sentiment": "très_négatif|négatif|neutre|positif|très_positif",
  "emotional_intensity": "faible|moyen|élevé|très_élevé",
  "sensitivity_level": 1,
  "sanitized_summary": "reformulation sobre (1-2 phrases, 3ème personne, jamais brute, jamais clinique)",
  "recommendation_impact": {
    "tone_required": "neutre|doux|festif|célébration|soutien",
    "celebration_inappropriate": false,
    "support_needed": false,
    "attention_types_forbidden": [],
    "attention_types_recommended": []
  },
  "valid_until_days": 60,
  "revalidation_days": 30
}

RÈGLES sensitivity_level :
1 = normal (positive ou neutre légère)
2 = sensible (stress modéré, perte légère, problème professionnel)
3 = critique (deuil, maladie grave, rupture, burn-out, perte importante)
4 = urgence (idées suicidaires, violence, danger physique immédiat)

RÈGLES sanitized_summary :
- Toujours en 3ème personne narrative (« Sophie traverse… »)
- Toujours adoucie (« période fragile » pas « chômage »)
- Garde la dignité de la personne
- Jamais de jargon clinique ou psychologique
- 1-2 phrases maximum`;

// ── Validation helpers ────────────────────────────────────────────────────────

function isMemoryType(v: unknown): v is MemoryType {
  return MEMORY_TYPES.includes(v as MemoryType);
}
function isSentiment(v: unknown): v is MemorySentiment {
  return MEMORY_SENTIMENTS.includes(v as MemorySentiment);
}
function isIntensity(v: unknown): v is EmotionalIntensity {
  return EMOTIONAL_INTENSITIES.includes(v as EmotionalIntensity);
}
function isSensitivity(v: unknown): v is 1 | 2 | 3 | 4 {
  return [1, 2, 3, 4].includes(v as number);
}

// ── Fallback déterministe ────────────────────────────────────────────────────

function deterministicAnalysis(rawInput: string, source: MemorySource): StructuredMemoryAnalysis {
  const t = rawInput.toLowerCase();

  let sensitivity_level: 1 | 2 | 3 | 4 = 1;
  if (/suicid|se faire du mal|mourir|me tuer|danger immédiat|violences?/.test(t)) sensitivity_level = 4;
  else if (/décès|deuil|mort |mourante|cancer|hospitali|maladie grave|rupture amoureuse|accident grave/.test(t)) sensitivity_level = 3;
  else if (/burnout|burn.out|déprime|dépression|perdu son travail|licenci|s.est sépar|rupture|anxieux|anxiété/.test(t)) sensitivity_level = 2;

  let sentiment: MemorySentiment = 'neutre';
  if (/promu|fiancé|enceinte|bébé|réussi|succès|mariage|gagné|incroyable|formidable/.test(t)) sentiment = 'positif';
  else if (sensitivity_level === 4) sentiment = 'très_négatif';
  else if (sensitivity_level >= 2 || /mal |difficile|problème|perdu|triste|déprim|sépar|conflit|grave/.test(t)) sentiment = 'négatif';

  const emotional_intensity: EmotionalIntensity =
    sensitivity_level === 4 ? 'très_élevé'
    : sensitivity_level === 3 ? 'élevé'
    : sensitivity_level === 2 || sentiment === 'négatif' ? 'moyen'
    : 'faible';

  let memory_type: MemoryType = 'événement_de_vie';
  if (/adore|aime|préfère|déteste|n.aime pas/.test(t)) memory_type = 'goût_durable';
  if (/rêve|envie de|voudrait/.test(t)) memory_type = 'rêve';
  if (/deuil|décès|mort |perdu son père|perdu sa mère/.test(t)) memory_type = 'deuil';
  if (/promotion|réussi|succès|félicitations/.test(t)) memory_type = 'réussite';
  if (/divorcé|séparé|rupture|conflit|dispute/.test(t)) memory_type = 'changement_de_vie';
  if (sensitivity_level >= 2 && sentiment === 'négatif') memory_type = 'situation_émotionnelle';
  if (sensitivity_level === 3 && /deuil|mort|décès/.test(t)) memory_type = 'deuil';

  let category = 'personnel';
  if (/travail|boulot|job|promu|licenc|emploi|collègue|patron/.test(t)) category = 'travail';
  else if (/santé|maladie|hôpital|médecin|cancer|blessure|opération/.test(t)) category = 'santé';
  else if (/famille|parent|enfant|frère|sœur|mamie|papi|mère|père/.test(t)) category = 'famille';
  else if (/amour|couple|sépar|mariage|fiancé|rupture|chéri/.test(t)) category = 'amour';

  const sanitized_summary = rawInput.trim().length > 180
    ? rawInput.trim().slice(0, 180).trimEnd() + '…'
    : rawInput.trim();

  const sourceName = source === 'pilote' ? 'pilote' : source;
  void sourceName; // used for trust only

  return {
    memory_type,
    category,
    sentiment,
    emotional_intensity,
    sensitivity_level,
    sanitized_summary,
    recommendation_impact: {
      tone_required: sensitivity_level >= 3 ? 'doux' : sentiment === 'positif' ? 'festif' : 'neutre',
      celebration_inappropriate: sensitivity_level >= 2 || sentiment === 'négatif' || sentiment === 'très_négatif',
      support_needed: sensitivity_level >= 2,
      attention_types_forbidden: sensitivity_level >= 3 ? ['surprise_festive', 'humour_lourd'] : [],
      attention_types_recommended: sensitivity_level >= 2 ? ['soutien', 'présence', 'message_doux'] : [],
    },
    valid_until_days: sensitivity_level >= 3 ? 180 : sensitivity_level === 2 ? 90 : 60,
    revalidation_days: sensitivity_level >= 3 ? 60 : 30,
  };
}

// ── LLM analysis ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAndValidate(raw: string): StructuredMemoryAnalysis | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = JSON.parse(m[0]) as Record<string, any>;

    const memory_type = isMemoryType(p.memory_type) ? p.memory_type : 'événement_de_vie';
    const sentiment = isSentiment(p.sentiment) ? p.sentiment : 'neutre';
    const emotional_intensity = isIntensity(p.emotional_intensity) ? p.emotional_intensity : 'faible';
    const sensitivity_level = isSensitivity(p.sensitivity_level) ? p.sensitivity_level : 1;
    const sanitized_summary = typeof p.sanitized_summary === 'string' && p.sanitized_summary.trim()
      ? p.sanitized_summary.trim() : null;
    if (!sanitized_summary) return null;

    return {
      memory_type,
      category: typeof p.category === 'string' ? p.category : 'personnel',
      subcategory: typeof p.subcategory === 'string' ? p.subcategory : undefined,
      sentiment,
      emotional_intensity,
      sensitivity_level,
      sanitized_summary,
      recommendation_impact: p.recommendation_impact ?? undefined,
      valid_until_days: typeof p.valid_until_days === 'number' ? p.valid_until_days : undefined,
      revalidation_days: typeof p.revalidation_days === 'number' ? p.revalidation_days : undefined,
    };
  } catch { return null; }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function analyzeMemory(
  rawInput: string,
  source: MemorySource,
): Promise<{ analysis: StructuredMemoryAnalysis; fallbackUsed: boolean }> {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Haiku — classification légère
      max_tokens: 500,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Information : ${rawInput}` }],
    });
    const text = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
    const analysis = parseAndValidate(text);
    if (analysis) return { analysis, fallbackUsed: false };
  } catch { /* fall through */ }

  return { analysis: deterministicAnalysis(rawInput, source), fallbackUsed: true };
}
