export type Relationship = "partner" | "friend" | "family" | "colleague" | "other";

export type RelationshipRegister =
  | 'très_proche_fluide'
  | 'proche_quotidien'
  | 'importante_distante'
  | 'compliquée_fragile'
  | 'formelle_occasionnelle'
  | 'je_ne_sais_pas';

export interface WishlistItem {
  id: string;
  title: string;
  note?: string;
  url?: string;
  addedAt: string;
}

export type ProximityLevel = 'inner_circle' | 'close' | 'extended' | 'distant';
export type CadenceLevel = 'discreet' | 'normal' | 'sustained' | 'intense';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  relationship: Relationship;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  gift_wishlist: WishlistItem[] | null;
  created_at: string;
  archived_at: string | null;
  last_reminder_sent_at?: string | null;
  proximity_level?: ProximityLevel;
  cadence_override?: CadenceLevel;
  last_suggestion_at?: string | null;
  archive_reason?: 'deceased' | 'lost_contact' | 'end_of_relationship' | 'other' | null;
  is_memory_mode?: boolean;
  memory_anniversary_opt_out?: boolean;
  proche_user_id?: string | null;
  relationship_register?: RelationshipRegister | null;
  gender?: 'femme' | 'homme' | 'non_binaire' | 'non_precise' | null;
  date_de_naissance?: string | null;
}

export interface QuestionnaireResponse {
  id: string;
  contact_id: string;
  user_id: string;
  // 12 psychological questions
  love_language: string | null;
  communication_style: string | null;
  stress_response: string | null;
  social_energy: string | null;
  appreciation_style: string | null;
  conflict_resolution: string | null;
  decision_making: string | null;
  emotional_expression: string | null;
  core_values: string | null;
  recognition_preference: string | null;
  boundaries: string | null;
  growth_mindset: string | null;
  // Preferences
  hobbies: string | null;
  favorite_foods: string | null;
  gift_preference: string | null;
  standing: string | null;
  gastronomy: string | null;
  accommodation: string | null;
  gift_style: string | null;
  conversation_topics: string | null;
  things_to_avoid: string | null;
  best_contact_method: string | null;
  important_dates: string | null;
  additional_notes: string | null;
  physical_contact_with?: string[] | null;
  input_mode?: 'text' | 'voice' | null;
  attention_reception?: Record<string, unknown> | null;
  incognito_signals?: Record<string, unknown> | null;
  interests?: Record<string, unknown> | null;
  clothing_size: string | null;
  shoe_size: string | null;
  ring_size: string | null;
  pants_size: string | null;
  pets: string | null;
  created_at: string;
  updated_at: string;
}

export interface Suggestion {
  title: string;
  description: string;
  category: "quality_time" | "gift" | "message" | "gesture" | "activity";
  timing: string;
}

export interface ContactWithProfile extends Contact {
  questionnaire_responses: QuestionnaireResponse[];
}

export interface MyProfile {
  id: string;
  user_id: string;
  phone: string | null;
  love_language: string | null;
  communication_style: string | null;
  stress_response: string | null;
  social_energy: string | null;
  appreciation_style: string | null;
  conflict_resolution: string | null;
  decision_making: string | null;
  emotional_expression: string | null;
  core_values: string | null;
  recognition_preference: string | null;
  boundaries: string | null;
  growth_mindset: string | null;
  hobbies: string | null;
  disliked_activities: string | null;
  favorite_foods: string | null;
  disliked_foods: string | null;
  gift_preference: string | null;
  standing: string | null;
  gastronomy: string | null;
  accommodation: string | null;
  gift_style: string | null;
  tactility: string | null;
  conversation_topics: string | null;
  things_to_avoid: string | null;
  best_contact_method: string | null;
  important_dates: string | null;
  health_comfort: string | null;
  family_life: string | null;
  character_emotions: string | null;
  cannot_stand: string | null;
  few_know: string | null;
  food_allergies: string | null;
  diet: string | null;
  religion: string | null;
  disability: string | null;
  postal_address: string | null;
  additional_notes: string | null;
  clothing_size: string | null;
  shoe_size: string | null;
  ring_size: string | null;
  pants_size: string | null;
  pets: string | null;
  created_at: string;
  updated_at: string;
  cadence_preference?: CadenceLevel;
  has_children?: boolean;
  pilote_difficult_period_until?: string | null;
  pilote_last_achievement_at?: string | null;
  notif_push_enabled?: boolean | null;
  notif_email_enabled?: boolean | null;
  notif_quiet_hours_start?: number | null;
  notif_quiet_hours_end?: number | null;
  notif_max_per_day?: number | null;
  trial_started_at?: string | null;
  subscription_status?: 'trial' | 'active' | 'paused' | 'silent' | 'cancelled';
  subscription_paused_at?: string | null;
  silent_since?: string | null;
  last_active_at?: string | null;
  cancelled_at?: string | null;
  deletion_scheduled_at?: string | null;
  physical_contact_with?: string[] | null;
  questionnaire_input_mode?: 'text' | 'voice' | null;
}

export interface ProfileNote {
  id: string;
  contact_id: string | null;
  user_id: string;
  note: string;
  created_at: string;
}

export interface ProfileShareRequest {
  id: string;
  requester_id: string;
  profile_owner_id: string;
  status: "pending" | "accepted" | "declined";
  confirmed_with_reauth: boolean;
  reauth_at: string | null;
  created_at: string;
  responded_at: string | null;
}

export interface ShareLink {
  id: string;
  token: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  expires_at: string | null;
}

export interface UserPoint {
  id: string;
  user_id: string;
  action_type: string;
  points: number;
  created_at: string;
}

export interface AnalysisResult {
  compatibility_score: number;
  shared_points: string[];
  difference_zones: { emoji: string; title: string; description: string }[];
  communication_tips: string[];
  top_things_to_do: string[];
  things_to_avoid: string[];
}

// ─── Moteur proactif ─────────────────────────────────────────────────────────

export type SignalType =
  | 'birthday_d7' | 'birthday_d3' | 'birthday_d1' | 'birthday_today'
  | 'couple_anniversary' | 'wedding_anniversary'
  | 'mothers_day' | 'fathers_day' | 'valentines_day' | 'christmas'
  | 'custom_date' | 'silence' | 'note_mention'
  | 'pilote_birthday' | 'pilote_mothers_day' | 'pilote_fathers_day' | 'pilote_difficult_period';

export type SignalPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SignalStatus = 'active' | 'consumed' | 'expired' | 'dismissed';

export interface ContextualSignal {
  id: string;
  user_id: string;
  contact_id: string | null;
  signal_type: SignalType;
  signal_data: Record<string, unknown>;
  trigger_date: string;
  priority: SignalPriority;
  status: SignalStatus;
  created_at: string;
  consumed_at: string | null;
  expires_at: string | null;
}

export type ProactiveSuggestionCategory = 'quality_time' | 'gift' | 'message' | 'gesture' | 'activity';
export type ProactiveSuggestionStatus = 'pending' | 'validated' | 'refused' | 'snoozed' | 'expired';
export type RefusalReason = 'not_now' | 'already_done' | 'not_fitting' | 'too_generic' | 'too_expensive' | 'other';

// ─── Mode conversationnel ────────────────────────────────────────────────────

export type ConfidenceInputMode = 'text' | 'voice';
export type ConfidenceSubject = 'contact' | 'pilote' | 'general';
export type EmotionalTone = 'positive' | 'negative' | 'neutral' | 'mixed' | 'urgent';

export interface Confidence {
  id: string;
  user_id: string;
  contact_id: string | null;
  raw_text: string;
  input_mode: ConfidenceInputMode;
  detected_subject: ConfidenceSubject;
  emotional_tone: EmotionalTone;
  candice_response: string | null;
  created_at: string;
}

export interface ProfileUpdateFromConfidence {
  id: string;
  user_id: string;
  confidence_id: string;
  contact_id: string | null;
  field_name: string;
  old_value: string | null;
  new_value: string;
  status: 'pending' | 'applied' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
}

export interface ProactiveSuggestion {
  id: string;
  user_id: string;
  contact_id: string | null;
  signal_id: string | null;
  title: string;
  description: string;
  category: ProactiveSuggestionCategory;
  reasoning: string | null;
  estimated_price: string | null;
  partner_hint: string | null;
  status: ProactiveSuggestionStatus;
  refusal_reason: RefusalReason | null;
  priority: SignalPriority;
  generated_at: string;
  responded_at: string | null;
  expires_at: string | null;
}
