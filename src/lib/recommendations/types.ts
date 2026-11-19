import type { JournalRejection } from './rejection-match';
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
  /** Domaine que l'idée DÉCLARE (liste fermée, garde-fous-discovery.ts). Sert au périmètre des garde-fous. */
  categorie?: string | null;
  /** Vrai si l'idée s'appuie sur ce que le proche a déclaré en privé (le modèle le dit ; le code le vérifie aussi). */
  appuiPrive?: boolean;
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

  /** Rejets que le PROCHE a déclarés lui-même, lus côté serveur par un chemin autorisé
   *  (declarations-proche.ts). N'entrent dans AUCUN prompt : ils servent uniquement à
   *  retirer des idées APRÈS leur génération. Absent ou vide = aucun usage de ses
   *  données ; la distinction entre « pas autorisé » et « rien déclaré » vit dans
   *  LectureDeclarations.motif, pas ici — le moteur n'a pas à la connaître. */
  rejetsDuProche?: readonly JournalRejection[];
  /** Goûts et souhaits que le PROCHE a déclarés lui-même et autorisés pour cet usage (`reco:gouts`).
   *  Ils entrent dans le prompt ; la justification des idées qu'ils inspirent est neutralisée. */
  goutsDuProche?: readonly import('./gouts-proche').GoutDeclare[];
  /** Garde-fous du Discovery, structurés. N'entrent dans AUCUN prompt de génération. */
  gardeFousDuProche?: readonly import('./garde-fous-discovery').GardeFouStructure[];
  /** Le juge du critère. Absent : aucun garde-fou du Discovery n'écarte d'idée (voir garde-fous-discovery.ts). */
  /** Qualifie les idées sur la taxonomie publique (D1). Par défaut, le modèle ; les essais en injectent un. */
  qualifierIdees?: import('./garde-fous-discovery').QualificateurIdees;

  // Context
  importantDates: { label: string; date: string }[];
  recentContext: string | null;
  recentlyProposed: string[];
  /**
   * Les situations ACTUELLES du proche, déjà réduites au minimum nécessaire par le serveur
   * (`situationsPourReco`). Pour une situation sensible, la consigne est générale : le détail
   * n'entre jamais dans le prompt, et ne peut donc pas en ressortir.
   */
  situations?: readonly import('@/lib/memories/situations').SituationPourReco[];

  // Complicated-register pilot context (Part 1)
  complicatedContext: string | null;

  // Attention feedback history for this contact (Part 2)
  feedbackHistory: FeedbackEntry[];
}

export interface FeedbackEntry {
  dim: AttentionDim;
  canal: string;
  feedback: 'juste' | 'a_cote' | 'pas_le_moment';
  note: string | null;
}
