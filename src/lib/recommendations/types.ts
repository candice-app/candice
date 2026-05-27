import type { AttentionDim, FaceResult } from '@/lib/attention/scoring';
import type { RelationalFilters } from '@/lib/lifestyle/scoring';
import type { SingularityInput, VetosInput } from '@/lib/profile/synthesis';
import type { QuestionnaireResponse, RelationshipRegister } from '@/types';

export type KadenceProfile = 'haute' | 'moyenne' | 'basse';

export type RecoCanal = 'message' | 'appel' | 'en_personne' | 'cadeau' | 'service' | 'experience';

export type RecoIntensity = 'légère' | 'modérée' | 'forte';

export interface RecoIdea {
  title: string;
  justification: string;
  dim: AttentionDim;
  canal: RecoCanal;
  intensite: RecoIntensity;
  declencheur: string;
  isBlindSpot?: boolean;
}

export interface BlindSpotInsight {
  dims: AttentionDim[];
  note: string;
}

export interface ContactRecommendations {
  ideas: RecoIdea[];
  blindSpot: BlindSpotInsight | null;
  kadence: KadenceProfile;
  generatedAt: string;
}

export interface RecoInput {
  contactId: string;
  contactName: string;
  contactFirstName: string;
  relationship: string;
  proximityLevel: string;

  // Proche profile vectors (from my_profile)
  reception: FaceResult | null;
  expression: FaceResult | null;
  temperamentAxes: Record<string, { score: number; intensity: number }> | null;
  relationalFilters: RelationalFilters | null;
  vetos: VetosInput | null;
  singularity: SingularityInput | null;

  // Classic questionnaire fallback (from questionnaire_responses)
  classicProfile: QuestionnaireResponse | null;

  // Pilote profile (for blind spot detection)
  piloteExpression: FaceResult | null;

  // Relationship register (pilote-only proximity signal)
  register: RelationshipRegister | null;

  // Context
  importantDates: { label: string; date: string }[];
  recentContext: string | null;
  recentlyProposed: string[];
}
