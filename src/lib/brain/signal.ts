// Signal Engine — section 6
// Extrait 1-4 signaux exploitables depuis une mémoire structurée.
// Utilise sanitized_summary (jamais raw_input).

import Anthropic from '@anthropic-ai/sdk';
import {
  SIGNAL_VALUES, SIGNAL_POLARITIES,
  type SignalValue, type SignalPolarity, type StructuredSignal, type StructuredMemoryAnalysis,
} from './types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM = `Tu es le Signal Engine de Candice. À partir d'une mémoire structurée, extrais 1 à 4 signaux exploitables.
Réponds UNIQUEMENT avec un tableau JSON valide.

Exemples de signal_type (liste indicative, non exhaustive) :
surprise_tolerance, luxury_preference, experience_vs_gift_preference,
emotional_support_needed, celebration_appropriate, professional_fragility,
health_sensitivity, family_centrality, social_energy_level,
gift_precision_needed, spontaneity_appreciation, regular_contact_needed,
humor_appreciation, nature_affinity, gastronomy_interest, art_culture_affinity,
fashion_affinity, reading_affinity, sport_interest, travel_desire,
wellness_importance, tech_interest, music_affinity, film_interest,
direct_communication_preference, practical_support_preference,
verbal_recognition_preference, quality_time_preference,
handmade_gift_preference, premium_gift_preference,
sensitivity_to_being_remembered, resilience_level,
grief_active, burnout_risk, relationship_fragility, public_recognition_avoidance

FORMAT :
[
  {
    "signal_type": "snake_case_anglais",
    "signal_value": "very_low|low|medium|high|very_high",
    "polarity": "positive|negative|neutral",
    "confidence": <int 0-100>
  }
]

RÈGLES :
- 1 signal minimum, 4 maximum
- signal_type en anglais snake_case, précis et exploitable
- Pour mémoire sensible (sensitivity_level >= 2) : toujours inclure un signal émotionnel (ex: emotional_support_needed high)
- Pour deuil/maladie grave : ajouter grief_active high ou health_sensitivity high`;

// ── Validation ────────────────────────────────────────────────────────────────

function isSignalValue(v: unknown): v is SignalValue {
  return SIGNAL_VALUES.includes(v as SignalValue);
}
function isPolarity(v: unknown): v is SignalPolarity {
  return SIGNAL_POLARITIES.includes(v as SignalPolarity);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSignals(raw: string): StructuredSignal[] | null {
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr = JSON.parse(m[0]) as Record<string, any>[];
    const signals: StructuredSignal[] = [];
    for (const s of arr) {
      if (typeof s.signal_type !== 'string' || !s.signal_type.trim()) continue;
      const signal_value = isSignalValue(s.signal_value) ? s.signal_value : 'medium';
      const polarity = isPolarity(s.polarity) ? s.polarity : 'neutral';
      const confidence = typeof s.confidence === 'number'
        ? Math.max(0, Math.min(100, Math.round(s.confidence)))
        : 60;
      signals.push({ signal_type: s.signal_type.trim(), signal_value, polarity, confidence });
    }
    return signals.length > 0 ? signals.slice(0, 4) : null;
  } catch { return null; }
}

// ── Fallback déterministe ────────────────────────────────────────────────────

function deterministicSignals(memory: StructuredMemoryAnalysis): StructuredSignal[] {
  const signals: StructuredSignal[] = [];

  // Signal émotionnel si sensible
  if (memory.sensitivity_level >= 3) {
    const type = memory.memory_type === 'deuil' ? 'grief_active'
      : memory.memory_type === 'fragilité' ? 'burnout_risk'
      : 'emotional_support_needed';
    signals.push({ signal_type: type, signal_value: 'high', polarity: 'negative', confidence: 80 });
  } else if (memory.sensitivity_level === 2) {
    signals.push({ signal_type: 'emotional_support_needed', signal_value: 'medium', polarity: 'negative', confidence: 65 });
  }

  // Signal positif pour réussite/bonne nouvelle
  if (memory.memory_type === 'réussite' || memory.sentiment === 'positif' || memory.sentiment === 'très_positif') {
    signals.push({ signal_type: 'celebration_appropriate', signal_value: 'high', polarity: 'positive', confidence: 70 });
  }

  // Signal préférence selon category
  if (memory.category === 'travail' && memory.sentiment !== 'positif') {
    signals.push({ signal_type: 'professional_fragility', signal_value: 'medium', polarity: 'negative', confidence: 55 });
  }

  return signals.length > 0 ? signals : [
    { signal_type: 'life_context_updated', signal_value: 'medium', polarity: 'neutral', confidence: 50 },
  ];
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function extractSignals(
  memory: StructuredMemoryAnalysis,
): Promise<{ signals: StructuredSignal[]; fallbackUsed: boolean }> {
  const context = [
    `Type: ${memory.memory_type}`,
    `Catégorie: ${memory.category}`,
    `Sentiment: ${memory.sentiment}`,
    `Intensité: ${memory.emotional_intensity}`,
    `Niveau sensibilité: ${memory.sensitivity_level}`,
    `Résumé: ${memory.sanitized_summary}`,
  ].join('\n');

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: 'user', content: context }],
    });
    const text = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
    const signals = parseSignals(text);
    if (signals) return { signals, fallbackUsed: false };
  } catch { /* fall through */ }

  return { signals: deterministicSignals(memory), fallbackUsed: true };
}
