export type Relationship = "partner" | "friend" | "family" | "colleague" | "other";

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  relationship: Relationship;
  email: string | null;
  phone: string | null;
  created_at: string;
  archived_at: string | null;
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
  created_at: string;
  updated_at: string;
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
