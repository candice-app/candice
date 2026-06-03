// ── Memory ────────────────────────────────────────────────────────────────────

export const MEMORY_TYPES = [
  'goût_durable', 'envie_ponctuelle', 'événement_de_vie', 'situation_émotionnelle',
  'conflit', 'préférence_cadeau', 'préférence_expérience', 'préférence_relationnelle',
  'préférence_communication', 'contrainte_logistique', 'chose_à_éviter',
  'marque_aimée', 'lieu_aimé', 'projet', 'rêve', 'fragilité', 'deuil',
  'réussite', 'changement_de_vie',
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

export const MEMORY_SENTIMENTS = [
  'très_négatif', 'négatif', 'neutre', 'positif', 'très_positif',
] as const;
export type MemorySentiment = (typeof MEMORY_SENTIMENTS)[number];

export const EMOTIONAL_INTENSITIES = ['faible', 'moyen', 'élevé', 'très_élevé'] as const;
export type EmotionalIntensity = (typeof EMOTIONAL_INTENSITIES)[number];

export const MEMORY_SOURCES = [
  'pilote', 'proche_lui_même', 'observation', 'déduit_ia', 'questionnaire',
] as const;
export type MemorySource = (typeof MEMORY_SOURCES)[number];

export const MEMORY_STATUSES = [
  'actif', 'à_revalider', 'archivé', 'invalidé', 'sensible', 'masqué', 'confirmé', 'incertain',
] as const;
export type MemoryStatus = (typeof MEMORY_STATUSES)[number];

export interface RecommendationImpact {
  tone_required?: 'neutre' | 'doux' | 'festif' | 'célébration' | 'soutien';
  support_needed?: boolean;
  celebration_inappropriate?: boolean;
  attention_types_recommended?: string[];
  attention_types_forbidden?: string[];
}

export interface StructuredMemoryAnalysis {
  memory_type: MemoryType;
  category: string;
  subcategory?: string;
  sentiment: MemorySentiment;
  emotional_intensity: EmotionalIntensity;
  sanitized_summary: string;
  sensitivity_level: 1 | 2 | 3 | 4;
  recommendation_impact?: RecommendationImpact;
  valid_until_days?: number;
  revalidation_days?: number;
}

// ── Signal ────────────────────────────────────────────────────────────────────

export const SIGNAL_VALUES = ['very_low', 'low', 'medium', 'high', 'very_high'] as const;
export type SignalValue = (typeof SIGNAL_VALUES)[number];

export const SIGNAL_POLARITIES = ['positive', 'negative', 'neutral'] as const;
export type SignalPolarity = (typeof SIGNAL_POLARITIES)[number];

export interface StructuredSignal {
  signal_type: string;
  signal_value: SignalValue;
  polarity: SignalPolarity;
  confidence: number;
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupaDB = any;

export interface ProcessContext {
  contactId: string;
  userId: string;
  source: MemorySource;
  supabase: SupaDB;
}

export interface ProcessResult {
  memoryId: string;
  sanitized_summary: string;
  sentiment: MemorySentiment;
  category: string;
  emotional_intensity: EmotionalIntensity;
  sensitivity_level: 1 | 2 | 3 | 4;
  confidence_score: number;
  signal_count: number;
  correlation_id: string;
  fallback_used: boolean;
}
