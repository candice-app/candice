// ONBOARDING INCOGNITO V1 — les 118 options, TRANSCRITES depuis
// docs/ontologie/onboarding-incognito-v1.md §4 (source de données, verbatim).
//
// RÈGLE : transcription, pas re-déduction. Espace de noms `I*.*` STRICTEMENT SÉPARÉ du self
// (numérique) ; chiffres de contrôle séparés (jamais agrégés au 19/106). Les libellés portent
// les jetons {Prénom}/{Pronom}/{pronom} résolus à la production (src/lib/knowledge-write/pronoun.ts),
// jamais ici. Le prénom est le jeton {Prénom} (§6), résolu au même endroit que {Pronom}/{pronom}.
//
// Invariants du jeu (§4 conventions) : toute evidence porte sourceType='reported_by_relative'
// et assertionStatus='explicit' ; seule assertionBasis varie — déclarée PAR QUESTION, surchargée
// PAR OPTION quand le libellé l'impose (I12.1/I12.2). evidence_role='primary' sauf mention.

import type { AssertionBasis } from './sources';
import type {
  AffectionDirection,
  AffectionModality,
  BehaviorContext,
  BehaviorPattern,
  ContinuumValue,
  DriverCode,
  EvidenceStrength,
  EvidenceValue,
  GuardrailCode,
  GuardrailScope,
  GuardrailSeverity,
  PreferencePath,
  ProfileConstructCode,
  SensitivityFacet,
} from './vocabulary';
import type { EvidenceContext, EvidenceRole } from './evidence';

/** Production PROFILE (directionnel ou continuum) : porte une `value`, jamais de strength. */
export interface IncognitoProfile {
  readonly construct: ProfileConstructCode;
  readonly facet?: SensitivityFacet;
  readonly value: EvidenceValue | ContinuumValue;
  readonly evidence_role: EvidenceRole;
}
export interface IncognitoAffection {
  readonly direction: AffectionDirection;
  readonly modality: AffectionModality;
  readonly strength: EvidenceStrength;
}
export interface IncognitoBehavior {
  readonly pattern: BehaviorPattern;
  readonly context: EvidenceContext; // evidence.context (domaine local)
  readonly behaviorContext: BehaviorContext; // registre BEHAVIOR séparé
  readonly strength: EvidenceStrength;
}
export interface IncognitoPreference {
  readonly path: PreferencePath;
  readonly value: string;
  readonly strength: EvidenceStrength;
}
export interface IncognitoGuardrail {
  readonly code: GuardrailCode;
  readonly severity: GuardrailSeverity; // force de la CONTRAINTE (ce que Candice s'interdit)
  readonly strength: EvidenceStrength; // force du SIGNAL ; indépendant de severity, lu au §4 (jamais dérivé)
  readonly guardrailScope: GuardrailScope;
}
/** I7 uniquement : chaque option produit un OpenKnowledge support_modality (aucun canonique). */
export interface IncognitoOpenKnowledge {
  readonly type: 'support_modality';
  readonly subject: string;
  readonly relation: 'appears_to_help';
  readonly context: EvidenceContext;
}
/** I11b uniquement : FACT habit, user_confirmed=false (R-I6). */
export interface IncognitoFact {
  readonly fact_type: 'habit';
  readonly value: string;
  readonly user_confirmed: false;
}

/** Statut fonctionnel d'une option (R-I2 / R-I3). Absent = option productrice. */
export type IncognitoOptionStatus = 'UNKNOWN_BY_REPORTER' | 'CONTEXT_DEPENDENT';

export interface IncognitoOption {
  readonly code: string; // I1.1, I11b.2, I1.U…
  readonly text: string; // verbatim (jetons {Pronom}/{pronom} inclus)
  readonly status?: IncognitoOptionStatus; // UNKNOWN / CONTEXT_DEPENDENT → zéro production
  /** Surcharge la base de la question (I12.1/I12.2 : reporter_interpretation). */
  readonly assertionBasisOverride?: AssertionBasis;
  /** evidence.context par défaut de l'option (sauf productions qui portent le leur). */
  readonly context?: EvidenceContext;
  readonly profile?: readonly IncognitoProfile[];
  readonly drivers?: readonly DriverCode[];
  readonly driversStrength?: EvidenceStrength;
  readonly affection?: IncognitoAffection;
  readonly behavior?: IncognitoBehavior;
  readonly preferences?: readonly IncognitoPreference[];
  readonly guardrails?: readonly IncognitoGuardrail[];
  readonly openKnowledge?: IncognitoOpenKnowledge;
  readonly facts?: readonly IncognitoFact[];
}

export type IncognitoSelection = 'single' | 'multi' | { readonly multi: number };

export interface IncognitoQuestion {
  readonly code: string; // I1 … I16, I11b
  readonly questionConcept: string;
  readonly adapts: string; // « remplace Q1 », « adapte soutien »…
  readonly baseAssertionBasis: AssertionBasis;
  readonly selection: IncognitoSelection;
  readonly stem: string; // verbatim (jetons {Prénom}/{Pronom}/{pronom} inclus)
  readonly options: readonly IncognitoOption[];
}

const UNKNOWN = (code: string, text: string): IncognitoOption => ({ code, text, status: 'UNKNOWN_BY_REPORTER' });

export const INCOGNITO_QUESTIONS: readonly IncognitoQuestion[] = [
  // ── I1 ───────────────────────────────────────────────────────────────────
  {
    code: 'I1', questionConcept: 'affection_received', adapts: 'remplace Q1',
    baseAssertionBasis: 'reporter_interpretation', selection: { multi: 3 },
    stem: 'D’après ce que tu connais de {Prénom}, quelles attentions lui font vraiment plaisir ?',
    options: [
      { code: 'I1.1', text: 'Lui dire des mots sincères', context: 'attention_received', affection: { direction: 'receive', modality: 'WORDS', strength: 'moderate' } },
      { code: 'I1.2', text: 'L’aider concrètement sans qu’{pronom} ait besoin de demander', context: 'attention_received', affection: { direction: 'receive', modality: 'SERVICES', strength: 'moderate' }, drivers: ['DRV_ANTICIPATION'], driversStrength: 'moderate' },
      { code: 'I1.3', text: 'Lui offrir quelque chose choisi sur mesure', context: 'attention_received', affection: { direction: 'receive', modality: 'PERSONALIZED_GIFT', strength: 'moderate' }, drivers: ['DRV_PERSONALIZATION'], driversStrength: 'moderate' },
      { code: 'I1.4', text: 'Lui offrir quelque chose qui a du sens ou une histoire', context: 'attention_received', affection: { direction: 'receive', modality: 'SYMBOLIC_GIFT', strength: 'moderate' }, drivers: ['DRV_SYMBOLISM'], driversStrength: 'moderate' },
      { code: 'I1.5', text: 'Lui consacrer un vrai moment de qualité', context: 'attention_received', affection: { direction: 'receive', modality: 'QUALITY_TIME', strength: 'moderate' }, drivers: ['DRV_SHARED_EXPERIENCE'], driversStrength: 'moderate' },
      { code: 'I1.6', text: 'Y penser dans les petits détails du quotidien', context: 'attention_received', affection: { direction: 'receive', modality: 'MICRO_ATTENTIONS', strength: 'moderate' }, drivers: ['DRV_ATTENTIVENESS'], driversStrength: 'moderate' },
      { code: 'I1.7', text: 'Lui réserver quelque chose d’inattendu', context: 'attention_received', affection: { direction: 'receive', modality: 'SURPRISE', strength: 'moderate' }, drivers: ['DRV_SURPRISE'], driversStrength: 'moderate' },
      UNKNOWN('I1.U', 'Je préfère ne pas deviner'),
    ],
  },
  // ── I2 ───────────────────────────────────────────────────────────────────
  {
    code: 'I2', questionConcept: 'attention_effectiveness', adapts: 'adapte Q2',
    baseAssertionBasis: 'reporter_interpretation', selection: 'multi',
    stem: 'Quand une attention fait vraiment plaisir à {Prénom}, qu’est-ce qui semble faire la différence ?',
    options: [
      { code: 'I2.1', text: 'Elle montre qu’on a vraiment écouté', context: 'attention_received', drivers: ['DRV_ATTENTIVENESS'], driversStrength: 'moderate' },
      { code: 'I2.2', text: 'Elle arrive au bon moment', context: 'attention_received', drivers: ['DRV_TIMING'], driversStrength: 'moderate' },
      { code: 'I2.3', text: 'Elle crée un souvenir', context: 'attention_received', drivers: ['DRV_MEMORY'], driversStrength: 'moderate' },
      { code: 'I2.4', text: 'Elle lui facilite vraiment la vie', context: 'attention_received', drivers: ['DRV_RELIEF', 'DRV_UTILITY'], driversStrength: 'moderate' },
      { code: 'I2.5', text: 'Elle est simple mais sincère', context: 'attention_received', drivers: ['DRV_SIMPLICITY', 'DRV_AUTHENTICITY'], driversStrength: 'moderate' },
      { code: 'I2.6', text: 'Elle crée la surprise', context: 'attention_received', drivers: ['DRV_SURPRISE'], driversStrength: 'moderate' },
      { code: 'I2.7', text: 'Elle est belle et choisie avec goût', context: 'attention_received', drivers: ['DRV_AESTHETIC'], driversStrength: 'moderate' },
      UNKNOWN('I2.U', 'Je préfère ne pas deviner'),
    ],
  },
  // ── I3 ───────────────────────────────────────────────────────────────────
  {
    code: 'I3', questionConcept: 'affection_given', adapts: 'adapte QE',
    baseAssertionBasis: 'observed', selection: 'multi',
    stem: 'Et dans l’autre sens : comment {Prénom} montre son attention aux autres ?',
    options: [
      { code: 'I3.1', text: '{Pronom} dit ce qu’{pronom} ressent, complimente ou rassure', context: 'affection_given', affection: { direction: 'give', modality: 'WORDS', strength: 'strong' } },
      { code: 'I3.2', text: '{Pronom} aide et rend service sans qu’on ait besoin de lui demander', context: 'affection_given', affection: { direction: 'give', modality: 'SERVICES', strength: 'strong' } },
      { code: 'I3.3', text: '{Pronom} offre des cadeaux choisis avec soin', context: 'affection_given', affection: { direction: 'give', modality: 'PERSONALIZED_GIFT', strength: 'strong' } },
      { code: 'I3.4', text: '{Pronom} offre des choses qui ont du sens ou une histoire', context: 'affection_given', affection: { direction: 'give', modality: 'SYMBOLIC_GIFT', strength: 'strong' } },
      { code: 'I3.5', text: '{Pronom} passe du vrai temps de qualité avec les gens', context: 'affection_given', affection: { direction: 'give', modality: 'QUALITY_TIME', strength: 'strong' } },
      { code: 'I3.6', text: '{Pronom} a plein de petites attentions au quotidien', context: 'affection_given', affection: { direction: 'give', modality: 'MICRO_ATTENTIONS', strength: 'strong' } },
      { code: 'I3.7', text: '{Pronom} aime faire des surprises', context: 'affection_given', affection: { direction: 'give', modality: 'SURPRISE', strength: 'strong' } },
      UNKNOWN('I3.U', 'Je ne l’ai pas assez vue dans ces situations'),
    ],
  },
  // ── I4 ───────────────────────────────────────────────────────────────────
  {
    code: 'I4', questionConcept: 'social_energy', adapts: 'comportementalise Q5',
    baseAssertionBasis: 'observed', selection: 'single',
    stem: 'Après une période chargée ou beaucoup de monde, qu’est-ce que {Prénom} semble généralement rechercher ?',
    options: [
      { code: 'I4.1', text: 'Un peu de solitude et de calme', context: 'GLOBAL', profile: [{ construct: 'SOCIAL_ENERGY', value: 0, evidence_role: 'primary' }] },
      { code: 'I4.2', text: 'Voir quelques personnes proches', context: 'GLOBAL', profile: [{ construct: 'SOCIAL_ENERGY', value: 1, evidence_role: 'primary' }] },
      { code: 'I4.3', text: 'Ça dépend vraiment des moments', status: 'CONTEXT_DEPENDENT' },
      { code: 'I4.4', text: 'Retrouver du monde', context: 'GLOBAL', profile: [{ construct: 'SOCIAL_ENERGY', value: 3, evidence_role: 'primary' }] },
      { code: 'I4.5', text: 'De l’animation et de l’énergie autour', context: 'GLOBAL', profile: [{ construct: 'SOCIAL_ENERGY', value: 4, evidence_role: 'primary' }] },
      UNKNOWN('I4.U', 'Je préfère ne pas deviner'),
    ],
  },
  // ── I5 ── (BEHAVIOR : deux champs) ─────────────────────────────────────────
  {
    code: 'I5', questionConcept: 'stress_response', adapts: 'adapte Q6',
    baseAssertionBasis: 'observed', selection: 'single',
    stem: 'Quand {Prénom} traverse une période de stress, qu’est-ce que tu observes le plus souvent ?',
    options: [
      { code: 'I5.1', text: '{Pronom} garde beaucoup pour soi et fait bonne figure', behavior: { pattern: 'internalize', context: 'stress', behaviorContext: 'stress_response', strength: 'strong' } },
      { code: 'I5.2', text: '{Pronom} se retire et cherche du calme', behavior: { pattern: 'withdraw_seek_calm', context: 'stress', behaviorContext: 'stress_response', strength: 'strong' } },
      { code: 'I5.3', text: '{Pronom} en parle et se confie', behavior: { pattern: 'confide', context: 'stress', behaviorContext: 'stress_response', strength: 'strong' } },
      { code: 'I5.4', text: '{Pronom} agit, se met en mouvement', behavior: { pattern: 'take_action', context: 'stress', behaviorContext: 'stress_response', strength: 'strong' } },
      { code: 'I5.5', text: '{Pronom} essaie de reprendre la main sur ce qu’{pronom} peut contrôler', behavior: { pattern: 'regain_control', context: 'stress', behaviorContext: 'stress_response', strength: 'strong' } },
      UNKNOWN('I5.U', 'Je ne l’ai pas assez vue dans cette situation'),
    ],
  },
  // ── I6 ──
  {
    code: 'I6', questionConcept: 'conflict_response', adapts: 'adapte Q7',
    baseAssertionBasis: 'observed', selection: 'single',
    stem: 'Quand {Prénom} est en désaccord avec quelqu’un, {pronom} a plutôt tendance à…',
    options: [
      { code: 'I6.1', text: 'En parler directement', behavior: { pattern: 'address_directly', context: 'conflict', behaviorContext: 'conflict_response', strength: 'strong' } },
      { code: 'I6.2', text: 'Prendre du temps avant d’en parler', behavior: { pattern: 'pause_before_responding', context: 'conflict', behaviorContext: 'conflict_response', strength: 'strong' } },
      { code: 'I6.3', text: 'Éviter le conflit autant que possible', behavior: { pattern: 'avoid_conflict', context: 'conflict', behaviorContext: 'conflict_response', strength: 'strong' } },
      { code: 'I6.4', text: 'Dédramatiser avec l’humour', behavior: { pattern: 'use_humor_to_defuse', context: 'conflict', behaviorContext: 'conflict_response', strength: 'strong' } },
      { code: 'I6.5', text: 'Écrire plus facilement qu’en parler', behavior: { pattern: 'prefers_writing', context: 'conflict', behaviorContext: 'conflict_response', strength: 'strong' } },
      { code: 'I6.6', text: 'Ça dépend beaucoup de la personne ou de la situation', status: 'CONTEXT_DEPENDENT' },
      UNKNOWN('I6.U', 'Je ne l’ai pas assez vue dans cette situation'),
    ],
  },
  // ── I7 ── (OpenKnowledge support_modality) ─────────────────────────────────
  {
    code: 'I7', questionConcept: 'support_in_distress', adapts: 'adapte soutien',
    baseAssertionBasis: 'observed', selection: { multi: 2 },
    stem: 'Quand ça ne va pas pour {Prénom}, qu’est-ce qui semble généralement lui faire du bien ?',
    options: [
      { code: 'I7.1', text: 'Qu’on prenne le temps de l’écouter', openKnowledge: { type: 'support_modality', subject: 'being_listened_to', relation: 'appears_to_help', context: 'distress' } },
      { code: 'I7.2', text: 'Recevoir des mots qui rassurent', openKnowledge: { type: 'support_modality', subject: 'reassurance', relation: 'appears_to_help', context: 'distress' } },
      { code: 'I7.3', text: 'Recevoir une aide concrète', openKnowledge: { type: 'support_modality', subject: 'practical_help', relation: 'appears_to_help', context: 'distress' } },
      { code: 'I7.4', text: 'Avoir quelqu’un simplement là, à côté', openKnowledge: { type: 'support_modality', subject: 'quiet_presence', relation: 'appears_to_help', context: 'distress' } },
      { code: 'I7.5', text: 'Avoir un peu d’espace et être tranquille', openKnowledge: { type: 'support_modality', subject: 'space_and_quiet', relation: 'appears_to_help', context: 'distress' } },
      { code: 'I7.6', text: 'Ça dépend vraiment des moments', status: 'CONTEXT_DEPENDENT' },
      UNKNOWN('I7.U', 'Je préfère ne pas deviner'),
    ],
  },
  // ── I8 ── (PREFERENCE.communication ; seul PROFILE secondaire du jeu : I8.3) ─
  {
    code: 'I8', questionConcept: 'communication_style', adapts: 'comportementalise Q9',
    baseAssertionBasis: 'observed', selection: 'single',
    stem: 'Quand {Prénom} veut vraiment faire passer quelque chose d’important, comment {pronom} s’exprime le plus naturellement ?',
    options: [
      { code: 'I8.1', text: '{Pronom} va droit au but', context: 'communication', preferences: [{ path: 'PREFERENCE.communication.style', value: 'direct', strength: 'strong' }] },
      { code: 'I8.2', text: '{Pronom} parle facilement de ce qu’{pronom} ressent', context: 'communication', preferences: [{ path: 'PREFERENCE.communication.style', value: 'expressive', strength: 'strong' }] },
      { code: 'I8.3', text: '{Pronom} analyse et explique beaucoup', context: 'communication', preferences: [{ path: 'PREFERENCE.communication.style', value: 'analytical', strength: 'strong' }], profile: [{ construct: 'PROFILE_REFLECTIVENESS', value: 1, evidence_role: 'secondary' }] },
      { code: 'I8.4', text: '{Pronom} garde volontiers de la légèreté ou de l’humour', context: 'communication', preferences: [{ path: 'PREFERENCE.communication.style', value: 'light_humorous', strength: 'strong' }] },
      { code: 'I8.5', text: '{Pronom} écrit plus facilement qu’{pronom} ne parle', context: 'communication', preferences: [{ path: 'PREFERENCE.communication.channel', value: 'written', strength: 'strong' }] },
      { code: 'I8.6', text: 'Ça dépend beaucoup du sujet', status: 'CONTEXT_DEPENDENT' },
      UNKNOWN('I8.U', 'Je préfère ne pas deviner'),
    ],
  },
  // ── I9 ── (BEHAVIOR : deux champs) ─────────────────────────────────────────
  {
    code: 'I9', questionConcept: 'decision_process', adapts: 'adapte Q10',
    baseAssertionBasis: 'observed', selection: 'single',
    stem: 'Quand {Prénom} doit prendre une décision importante, qu’est-ce que tu observes le plus souvent ?',
    options: [
      { code: 'I9.1', text: '{Pronom} pèse les pour et les contre', behavior: { pattern: 'weigh_pros_and_cons', context: 'decision', behaviorContext: 'decision_process', strength: 'strong' } },
      { code: 'I9.2', text: '{Pronom} fait beaucoup confiance à son instinct', behavior: { pattern: 'trust_instinct', context: 'decision', behaviorContext: 'decision_process', strength: 'strong' } },
      { code: 'I9.3', text: '{Pronom} demande l’avis de ses proches', behavior: { pattern: 'consult_close_ones', context: 'decision', behaviorContext: 'decision_process', strength: 'strong' } },
      { code: 'I9.4', text: '{Pronom} fait beaucoup de recherches', behavior: { pattern: 'research_thoroughly', context: 'decision', behaviorContext: 'decision_process', strength: 'strong' } },
      { code: 'I9.5', text: '{Pronom} attend d’avoir les idées plus claires avant de trancher', behavior: { pattern: 'wait_for_inner_clarity', context: 'decision', behaviorContext: 'decision_process', strength: 'strong' } },
      { code: 'I9.6', text: 'Ça dépend vraiment de la décision', status: 'CONTEXT_DEPENDENT' },
      UNKNOWN('I9.U', 'Je ne l’ai pas assez vue dans cette situation'),
    ],
  },
  // ── I10 ── (BEHAVIOR : deux champs ; collision légitime emotional_expression) ─
  {
    code: 'I10', questionConcept: 'emotional_expression', adapts: 'adapte Q11',
    baseAssertionBasis: 'observed', selection: 'single',
    stem: 'Quand quelque chose touche vraiment {Prénom}, comment est-ce que ça s’exprime ?',
    options: [
      { code: 'I10.1', text: '{Pronom} le dit assez librement', behavior: { pattern: 'openly', context: 'emotional_expression', behaviorContext: 'emotional_expression', strength: 'strong' } },
      { code: 'I10.2', text: '{Pronom} en parle surtout à quelques personnes de confiance', behavior: { pattern: 'with_trusted_few', context: 'emotional_expression', behaviorContext: 'emotional_expression', strength: 'strong' } },
      { code: 'I10.3', text: '{Pronom} le montre davantage par ses actes que par ses mots', behavior: { pattern: 'through_actions', context: 'emotional_expression', behaviorContext: 'emotional_expression', strength: 'strong' } },
      { code: 'I10.4', text: '{Pronom} garde souvent ça pour soi', behavior: { pattern: 'keeps_to_self', context: 'emotional_expression', behaviorContext: 'emotional_expression', strength: 'strong' } },
      { code: 'I10.5', text: '{Pronom} en parle plutôt après coup', behavior: { pattern: 'delayed', context: 'emotional_expression', behaviorContext: 'emotional_expression', strength: 'strong' } },
      { code: 'I10.6', text: 'Ça dépend beaucoup de ce qu’{pronom} vit', status: 'CONTEXT_DEPENDENT' },
      UNKNOWN('I10.U', 'Je préfère ne pas deviner'),
    ],
  },
  // ── I11 ── (PROFILE_STRUCTURE, value, GLOBAL) ──────────────────────────────
  {
    code: 'I11', questionConcept: 'time_and_organisation', adapts: 'adapte Q4a',
    baseAssertionBasis: 'observed', selection: 'single',
    stem: 'Dans son quotidien, {Prénom} est plutôt du genre à…',
    options: [
      { code: 'I11.1', text: 'Anticiper et planifier volontiers', context: 'GLOBAL', profile: [{ construct: 'PROFILE_STRUCTURE', value: 2, evidence_role: 'primary' }] },
      { code: 'I11.2', text: 'Prévoir les grandes lignes puis s’adapter', context: 'GLOBAL', profile: [{ construct: 'PROFILE_STRUCTURE', value: 1, evidence_role: 'primary' }] },
      { code: 'I11.3', text: 'Gérer plutôt au fil de l’eau', context: 'GLOBAL', profile: [{ construct: 'PROFILE_STRUCTURE', value: -1, evidence_role: 'primary' }] },
      { code: 'I11.4', text: 'Ça dépend vraiment de ce qu’{pronom} organise', status: 'CONTEXT_DEPENDENT' },
      UNKNOWN('I11.U', 'Je préfère ne pas deviner'),
    ],
  },
  // ── I11b ── (PREFERENCE high ; FACT habit user_confirmed=false) ────────────
  {
    code: 'I11b', questionConcept: 'punctuality', adapts: 'issue de Q4a',
    baseAssertionBasis: 'observed', selection: 'single',
    stem: 'Sur les horaires, {Prénom} est plutôt…',
    options: [
      { code: 'I11b.1', text: 'Très à cheval sur la ponctualité', context: 'relationship', preferences: [{ path: 'PREFERENCE.relational.punctuality', value: 'high', strength: 'strong' }] },
      { code: 'I11b.2', text: 'Plutôt à l’heure, sans en faire une règle', facts: [{ fact_type: 'habit', value: 'plutôt à l’heure, sans en faire une règle', user_confirmed: false }] },
      { code: 'I11b.3', text: 'Souvent un peu en retard', facts: [{ fact_type: 'habit', value: 'souvent un peu en retard', user_confirmed: false }] },
      { code: 'I11b.4', text: 'Ça dépend vraiment du contexte', status: 'CONTEXT_DEPENDENT' },
      UNKNOWN('I11b.U', 'Je préfère ne pas deviner'),
    ],
  },
  // ── I12 ── (base par option : I12.1/I12.2 = interpretation) ────────────────
  {
    code: 'I12', questionConcept: 'choice_criteria', adapts: 'adapte Q4b',
    baseAssertionBasis: 'observed', selection: 'multi',
    stem: 'Dans ce que {Prénom} choisit, achète ou apprécie, qu’est-ce que tu remarques ?',
    options: [
      { code: 'I12.1', text: 'La qualité compte, même si {pronom} n’en parle pas beaucoup', context: 'GLOBAL', assertionBasisOverride: 'reporter_interpretation', profile: [{ construct: 'PROFILE_EXACTINGNESS', value: 1, evidence_role: 'primary' }] },
      { code: 'I12.2', text: '{Pronom} semble préférer la simplicité authentique au luxe', context: 'GLOBAL', assertionBasisOverride: 'reporter_interpretation', profile: [{ construct: 'IMPORTANCE_AUTHENTICITY', value: 2, evidence_role: 'primary' }] },
      { code: 'I12.3', text: '{Pronom} aime le beau et le raffinement', context: 'GLOBAL', profile: [{ construct: 'IMPORTANCE_AESTHETIC', value: 2, evidence_role: 'primary' }, { construct: 'PROFILE_SENSITIVITY', facet: 'aesthetic', value: 1, evidence_role: 'primary' }] },
      { code: 'I12.4', text: 'Le prix semble moins compter que l’intention, surtout pour un cadeau', context: 'gift', preferences: [{ path: 'PREFERENCE.gift.value_basis', value: 'intention_over_price', strength: 'strong' }] },
      { code: 'I12.5', text: '{Pronom} est sensible à certaines marques ou maisons', context: 'GLOBAL', preferences: [{ path: 'PREFERENCE.brands.sensitivity', value: 'positive', strength: 'strong' }] },
      { code: 'I12.6', text: 'Les lieux et les expériences d’exception l’attirent', context: 'GLOBAL', preferences: [{ path: 'PREFERENCE.experience.tier', value: 'exceptional', strength: 'strong' }] },
      UNKNOWN('I12.U', 'Je préfère ne pas deviner'),
    ],
  },
  // ── I13 ── (PREFERENCE.surprise_level ; secondaire PROFILE_STRUCTURE sur I13.1) ─
  {
    code: 'I13', questionConcept: 'organised_for_her', adapts: 'adapte Q4c',
    baseAssertionBasis: 'observed', selection: 'single',
    stem: 'Quand quelqu’un organise quelque chose pour {Prénom}, quelle est la réaction habituelle ?',
    options: [
      { code: 'I13.1', text: '{Pronom} aime savoir à l’avance ce qui est prévu', context: 'organised_for_me', preferences: [{ path: 'PREFERENCE.organised_for_me.surprise_level', value: 'none', strength: 'strong' }], profile: [{ construct: 'PROFILE_STRUCTURE', value: 1, evidence_role: 'secondary' }] },
      { code: 'I13.2', text: '{Pronom} aime connaître l’essentiel mais garder une part de surprise', context: 'organised_for_me', preferences: [{ path: 'PREFERENCE.organised_for_me.surprise_level', value: 'partial', strength: 'strong' }] },
      { code: 'I13.3', text: '{Pronom} adore pouvoir se laisser totalement surprendre', context: 'organised_for_me', preferences: [{ path: 'PREFERENCE.organised_for_me.surprise_level', value: 'full', strength: 'strong' }] },
      { code: 'I13.4', text: '{Pronom} préfère valider certains détails en personne', context: 'organised_for_me', profile: [{ construct: 'IMPORTANCE_MASTERY', value: 1, evidence_role: 'primary' }] },
      { code: 'I13.5', text: '{Pronom} s’adapte facilement à ce qui a été prévu', context: 'organised_for_me', profile: [{ construct: 'PROFILE_ADAPTABILITY', value: 1, evidence_role: 'primary' }] },
      { code: 'I13.6', text: 'Ça dépend vraiment de l’occasion', status: 'CONTEXT_DEPENDENT' },
      UNKNOWN('I13.U', 'Je préfère ne pas deviner'),
    ],
  },
  // ── I14 ── (PREFERENCE.communication.channel ; relationship_with_reporter) ──
  {
    code: 'I14', questionConcept: 'contact_preference', adapts: 'adapte Q4d',
    baseAssertionBasis: 'observed', selection: 'single',
    stem: 'Pour rester en contact avec toi, {Prénom} utilise ou apprécie plutôt…',
    options: [
      { code: 'I14.1', text: 'Les appels', context: 'relationship_with_reporter', preferences: [{ path: 'PREFERENCE.communication.channel', value: 'call', strength: 'strong' }] },
      { code: 'I14.2', text: 'Les messages écrits', context: 'relationship_with_reporter', preferences: [{ path: 'PREFERENCE.communication.channel', value: 'written', strength: 'strong' }] },
      { code: 'I14.3', text: 'Les vocaux', context: 'relationship_with_reporter', preferences: [{ path: 'PREFERENCE.communication.channel', value: 'voice', strength: 'strong' }] },
      { code: 'I14.4', text: 'Se voir en personne', context: 'relationship_with_reporter', preferences: [{ path: 'PREFERENCE.communication.channel', value: 'in_person', strength: 'strong' }] },
      { code: 'I14.5', text: 'Un peu de tout selon le moment', context: 'relationship_with_reporter', preferences: [{ path: 'PREFERENCE.communication.channel', value: 'flexible', strength: 'strong' }] },
      UNKNOWN('I14.U', 'Je ne sais pas vraiment'),
    ],
  },
  // ── I15 ── (GUARDRAIL SOFT, scope execution, surprise ; aucun HARD auto) ────
  {
    code: 'I15', questionConcept: 'surprise_guardrails', adapts: 'adapte Q18',
    baseAssertionBasis: 'reporter_interpretation', selection: 'multi',
    stem: 'Parmi ces surprises, lesquelles risqueraient vraiment de mettre {Prénom} mal à l’aise ou de lui déplaire ?',
    options: [
      { code: 'I15.1', text: 'Une surprise devant beaucoup de monde', context: 'surprise', guardrails: [{ code: 'GRD_PUBLIC_EXPOSURE', severity: 'SOFT', strength: 'moderate', guardrailScope: 'execution' }] },
      { code: 'I15.2', text: 'Une surprise qui bouleverse son planning', context: 'surprise', guardrails: [{ code: 'GRD_SCHEDULE_DISRUPTION', severity: 'SOFT', strength: 'moderate', guardrailScope: 'execution' }] },
      { code: 'I15.3', text: 'Une surprise très intime ou émotionnellement intense', context: 'surprise', guardrails: [{ code: 'GRD_SENTIMENTAL_OVERLOAD', severity: 'SOFT', strength: 'moderate', guardrailScope: 'execution' }] },
      { code: 'I15.4', text: 'Une surprise mal organisée', context: 'surprise', guardrails: [{ code: 'GRD_POOR_EXECUTION', severity: 'SOFT', strength: 'moderate', guardrailScope: 'execution' }] },
      { code: 'I15.5', text: 'À ma connaissance, rien de tout ça ne poserait vraiment problème', status: 'CONTEXT_DEPENDENT' },
      UNKNOWN('I15.U', 'Je préfère ne pas deviner'),
    ],
  },
  // ── I16 ── (APPETENCE/IMPORTANCE value + DRIVER strength moderate ; gift) ───
  {
    code: 'I16', questionConcept: 'gift_appetence', adapts: 'fusionne Q13 et Q14',
    baseAssertionBasis: 'reporter_interpretation', selection: 'multi',
    stem: 'D’après ce que tu connais de {Prénom}, qu’est-ce qui a le plus de chances de lui faire plaisir comme cadeau ?',
    options: [
      { code: 'I16.1', text: 'Une expérience à vivre', context: 'gift', profile: [{ construct: 'APPETENCE_EXPERIENCE', value: 1, evidence_role: 'primary' }] },
      { code: 'I16.2', text: 'Un objet qu’{pronom} pourra garder', context: 'gift', profile: [{ construct: 'APPETENCE_OBJECT', value: 1, evidence_role: 'primary' }] },
      { code: 'I16.3', text: 'Quelque chose d’utile et bien pensé', context: 'gift.material', profile: [{ construct: 'IMPORTANCE_FUNCTIONAL', value: 1, evidence_role: 'primary' }], drivers: ['DRV_UTILITY'], driversStrength: 'moderate' },
      { code: 'I16.4', text: 'Quelque chose de beau et de qualité', context: 'gift.material', profile: [{ construct: 'IMPORTANCE_AESTHETIC', value: 1, evidence_role: 'primary' }], drivers: ['DRV_AESTHETIC', 'DRV_QUALITY'], driversStrength: 'moderate' },
      { code: 'I16.5', text: 'Quelque chose de très personnel, qui montre qu’on a vraiment écouté', context: 'gift', drivers: ['DRV_PERSONALIZATION', 'DRV_ATTENTIVENESS'], driversStrength: 'moderate' },
      { code: 'I16.6', text: 'Quelque chose de symbolique ou chargé de sens', context: 'gift', drivers: ['DRV_SYMBOLISM'], driversStrength: 'moderate' },
      { code: 'I16.7', text: 'Les objets comme les expériences peuvent très bien marcher', status: 'CONTEXT_DEPENDENT' },
      UNKNOWN('I16.U', 'Je préfère ne pas deviner'),
    ],
  },
] as const;

/** Toutes les options à plat (118), espace de noms I*.* — jamais agrégé au self. */
export const INCOGNITO_OPTIONS: readonly IncognitoOption[] = INCOGNITO_QUESTIONS.flatMap((q) => q.options);
